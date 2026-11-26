import * as THREE from 'three'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import type { Physics } from '../engine/physics'
import type { ModelKey } from './assetTable'
import { CONFIG, LIVE } from './config'
import { LANDMARKS, PROFILE, landmark, type LandmarkId } from './portfolio'
import type { Circle } from './props'
import { terrainHeight } from './terrain'

/**
 * The career chapters standing on the hill: six generated models, the crashed biplane (built by
 * props.ts and reused for the engineering roots) and a carved welcome stone near the spawn.
 * Each gets a small signpost, a collider and a focus point for the "E" prompt.
 */

type Placement = {
  id: LandmarkId
  model?: ModelKey
  x: number
  z: number
  /** Desired size of the model's largest dimension (metres). */
  size: number
  /** Height of the model's base above the ground (floating ones hover). */
  lift: number
  /** Extra yaw on top of facing the meadow (corrects each model's authored front). */
  yawOffset: number
  float?: boolean
  reach: number
}

/** Where the chapters stand: a loose ring around the guardian, read clockwise from the spawn. */
export const PLACEMENTS: readonly Placement[] = [
  { id: 'welcome', x: 2.6, z: 26.5, size: 0, lift: 0, yawOffset: 0, reach: 5.5 },
  { id: 'motive', model: 'retro', x: -7.8, z: 22.5, size: 2.5, lift: 0, yawOffset: -Math.PI / 2, reach: 5.5 },
  { id: 'musictribe', model: 'terminal', x: -15.5, z: 9.5, size: 2.7, lift: 0, yawOffset: -Math.PI / 2, reach: 5.5 },
  { id: 'projects', model: 'laptop', x: -12.5, z: -6.5, size: 2.4, lift: 1.1, yawOffset: -Math.PI / 2, float: true, reach: 5.5 },
  { id: 'play', model: 'gamepad', x: -1.5, z: -16.5, size: 1.7, lift: 1.3, yawOffset: 0, float: true, reach: 5.2 },
  { id: 'learning', model: 'bookshelf', x: 12.5, z: -9.5, size: 2.9, lift: 0, yawOffset: -Math.PI / 2, reach: 5.5 },
  { id: 'wastelab', model: 'truck', x: 18.5, z: 11.5, size: 5.4, lift: 0, yawOffset: 0, reach: 7 },
  { id: 'ai', x: 18.7, z: -1, size: 1.6, lift: 1.5, yawOffset: 0, float: true, reach: 5.2 },
]

/** The meadow point each landmark turns toward (between the spawn and the guardian). */
const FACE = new THREE.Vector2(2, 16)

export type LandmarkFocus = { id: LandmarkId; at: THREE.Vector3 }
export type CompassMark = { id: LandmarkId; x: number; z: number }

export class Landmarks {
  readonly group = new THREE.Group()
  readonly grassMask: Circle[] = []
  readonly reserved: Circle[] = []
  focus: LandmarkFocus | null = null
  readonly marks: CompassMark[] = []
  private readonly spots: { id: LandmarkId; at: THREE.Vector3; reach: number }[] = []
  private readonly floaters: { obj: THREE.Object3D; baseY: number; phase: number }[] = []
  private readonly disposables: { dispose(): void }[] = []
  private readonly camPos = new THREE.Vector3()
  private readonly fwd = new THREE.Vector3()
  private readonly d = new THREE.Vector3()

  constructor(physics: Physics, models: Partial<Record<ModelKey, THREE.Object3D>>, planeFocus: THREE.Vector3, planeSpot: { x: number; z: number }) {
    this.group.name = 'landmarks'
    for (const p of PLACEMENTS) {
      const ground = terrainHeight(p.x, p.z)
      const yaw = Math.atan2(FACE.x - p.x, FACE.y - p.z) + p.yawOffset
      if (p.id === 'welcome') {
        // Square to the player's own spawn orientation, not the meadow-facing convention every
        // other landmark uses: it is a few steps away, not a monument to walk around.
        this.buildWelcome(physics, p.x, p.z, ground, CONFIG.player.spawnYaw)
      } else {
        const src = p.model ? models[p.model] : undefined
        const holder = new THREE.Group()
        holder.position.set(p.x, ground + p.lift, p.z)
        holder.rotation.y = yaw
        this.group.add(holder)
        const obj = src ? this.fit(src.clone(true), p.size) : p.id === 'ai' ? this.beacon(p.size, landmark(p.id).color) : this.placeholder(p.size, landmark(p.id).color)
        holder.add(obj)
        const box = new THREE.Box3().setFromObject(obj)
        const size = box.getSize(new THREE.Vector3())
        if (p.float) {
          this.floaters.push({ obj: holder, baseY: holder.position.y, phase: p.x * 0.7 })
          // A low stone plinth under the floating ones, so they read as monuments.
          this.plinth(physics, p.x, p.z, ground, Math.max(size.x, size.z) * 0.42, landmark(p.id).color)
        } else {
          holder.updateMatrixWorld(true)
          const c = new THREE.Vector3(0, size.y / 2, 0).applyMatrix4(holder.matrixWorld)
          physics.addStaticBox(c, new THREE.Vector3(size.x * 0.9, size.y, size.z * 0.9), holder.quaternion)
        }
        const focusY = ground + p.lift + Math.min(size.y * 0.55, 1.5)
        this.spots.push({ id: p.id, at: new THREE.Vector3(p.x, focusY, p.z), reach: p.reach })
        const r = Math.max(size.x, size.z) * 0.6 + 0.3
        this.grassMask.push({ x: p.x, z: p.z, r: p.float ? 0.9 : r })
        this.reserved.push({ x: p.x, z: p.z, r: r + 2.2 })
        // Signpost a step toward the meadow and to the right of the model.
        const right = new THREE.Vector2(Math.cos(yaw), -Math.sin(yaw))
        const fwd = new THREE.Vector2(Math.sin(yaw), Math.cos(yaw))
        const off = Math.max(size.x, size.z) * 0.5 + 1.1
        this.signpost(p.id, p.x + fwd.x * 1.4 + right.x * off, p.z + fwd.y * 1.4 + right.y * off, yaw)
        if (p.id === 'motive') this.eldCluster(physics, p.x - right.x * (off + 0.4) + fwd.x * 0.6, p.z - right.y * (off + 0.4) + fwd.y * 0.6, yaw)
        if (p.id === 'wastelab') this.truckLogo(holder)
      }
      this.marks.push({ id: p.id, x: p.x, z: p.z })
    }
    // The crashed biplane already stands on the hill: it tells where it all took off.
    this.spots.push({ id: 'roots', at: planeFocus, reach: 5.6 })
    this.marks.push({ id: 'roots', x: planeSpot.x, z: planeSpot.z })
    this.signpost('roots', planeSpot.x - 3.2, planeSpot.z + 1.8, Math.atan2(FACE.x - planeSpot.x, FACE.y - planeSpot.z))
  }

  /** Scale a model so its largest dimension is `size`, centred on x/z with its base at y = 0. */
  private fit(obj: THREE.Object3D, size: number): THREE.Object3D {
    const box = new THREE.Box3().setFromObject(obj)
    const dims = box.getSize(new THREE.Vector3())
    const s = size / Math.max(dims.x, dims.y, dims.z, 1e-3)
    obj.scale.setScalar(s)
    const center = box.getCenter(new THREE.Vector3())
    obj.position.set(-center.x * s, -box.min.y * s, -center.z * s)
    obj.traverse(o => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
      const mats = Array.isArray(m.material) ? m.material : [m.material]
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial
        // Keep generated props matte so they sit with the painted meadow (no glare).
        if (std.isMeshStandardMaterial) {
          std.roughness = Math.max(std.roughness ?? 1, 0.72)
          std.metalness = Math.min(std.metalness ?? 0, 0.15)
          std.emissiveIntensity = Math.min(std.emissiveIntensity ?? 0, 0.3)
        }
      }
    })
    return obj
  }

  private placeholder(size: number, color: string): THREE.Object3D {
    const geo = new THREE.BoxGeometry(size * 0.6, size * 0.6, size * 0.6)
    const mat = new THREE.MeshLambertMaterial({ color })
    this.disposables.push(geo, mat)
    const m = new THREE.Mesh(geo, mat)
    m.position.y = size * 0.3
    return m
  }

  /** The one landmark with no model: a faceted glass crystal haloed by two crossed rings, for
   *  the AI chapter. Glassy and lit from within on purpose, so it reads as "not from this hill"
   *  against the matte painted models everywhere else. */
  private beacon(size: number, colorHex: string): THREE.Object3D {
    const group = new THREE.Group()
    const color = new THREE.Color(colorHex)
    const coreGeo = new THREE.IcosahedronGeometry(size * 0.42, 0)
    const coreMat = new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.55),
      emissive: color,
      emissiveIntensity: 1.1,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
    })
    const crystal = new THREE.Mesh(coreGeo, coreMat)
    crystal.position.y = size * 0.55
    crystal.castShadow = true
    group.add(crystal)
    const haloMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, roughness: 0.4, metalness: 0.2 })
    const haloGeo = new THREE.TorusGeometry(size * 0.62, size * 0.03, 8, 40)
    const haloA = new THREE.Mesh(haloGeo, haloMat)
    haloA.position.y = crystal.position.y
    haloA.rotation.x = Math.PI / 2.4
    const haloB = new THREE.Mesh(haloGeo, haloMat)
    haloB.position.y = crystal.position.y
    haloB.rotation.x = -Math.PI / 2.4
    haloB.rotation.z = Math.PI / 2
    group.add(haloA, haloB)
    this.disposables.push(coreGeo, coreMat, haloGeo, haloMat)
    return group
  }

  private plinth(physics: Physics, x: number, z: number, ground: number, radius: number, color: string): void {
    const geo = new THREE.CylinderGeometry(radius, radius * 1.12, 0.36, 18)
    const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.72, 0.7, 0.64) })
    const ringGeo = new THREE.TorusGeometry(radius * 1.02, 0.035, 6, 36)
    const ringMat = new THREE.MeshLambertMaterial({ color })
    this.disposables.push(geo, mat, ringGeo, ringMat)
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, ground + 0.12, z)
    m.receiveShadow = true
    m.castShadow = true
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    ring.position.set(x, ground + 0.31, z)
    this.group.add(m, ring)
    physics.addStaticCylinder(new THREE.Vector3(x, ground + 0.2, z), radius, 0.5)
  }

  /** A painted board on two posts: chapter number, chapter title and an "E" hint. */
  private signpost(id: LandmarkId, x: number, z: number, yaw: number): void {
    const l = landmark(id)
    const ground = terrainHeight(x, z)
    const W = 2.0
    const H = 1.07
    const boardY = ground + 1.05 + H / 2
    const wood = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.42, 0.31, 0.22) })
    const tex = boardTexture(l.kicker, l.heading, l.color)
    // Slight self-light keeps the lettering readable in shade and against a bright sky.
    const face = new THREE.MeshLambertMaterial({ map: tex, emissive: new THREE.Color(1, 1, 1), emissiveMap: tex, emissiveIntensity: 0.28 })
    const boardGeo = new THREE.BoxGeometry(W, H, 0.06)
    const board = new THREE.Mesh(boardGeo, [wood, wood, wood, wood, face, face])
    board.position.set(x, boardY, z)
    board.rotation.y = yaw
    board.castShadow = true
    // Posts stand at the board's edges and stop under it, so nothing covers the text.
    const postGeo = new THREE.CylinderGeometry(0.045, 0.055, 1.05 + 0.05, 8)
    const right = new THREE.Vector2(Math.cos(yaw), -Math.sin(yaw))
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(postGeo, wood)
      const px = x + right.x * side * (W / 2 - 0.12)
      const pz = z + right.y * side * (W / 2 - 0.12)
      post.position.set(px, terrainHeight(px, pz) + 0.55, pz)
      post.castShadow = true
      this.group.add(post)
      this.grassMask.push({ x: px, z: pz, r: 0.15 })
    }
    this.disposables.push(wood, postGeo, tex, boardGeo, face)
    this.group.add(board)
  }

  /**
   * Electronic logging devices beside the Motive computers: a crate with a vehicle gateway
   * (status lights, plugged-in cable) and a driver tablet showing an hours-of-service screen,
   * plus a spare gateway resting in the grass.
   */
  private eldCluster(physics: Physics, x: number, z: number, yaw: number): void {
    const ground = terrainHeight(x, z)
    const root = new THREE.Group()
    root.position.set(x, ground, z)
    root.rotation.y = yaw
    this.group.add(root)
    const crateMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.55, 0.4, 0.26) })
    const plankMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.42, 0.3, 0.2) })
    const shell = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.13, 0.14, 0.17) })
    const trim = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.32, 0.34, 0.38) })
    const cable = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.08, 0.08, 0.09) })
    const screenTex = hosTexture()
    const screen = new THREE.MeshBasicMaterial({ map: screenTex })
    const labelTex = gatewayTexture()
    const label = new THREE.MeshLambertMaterial({ map: labelTex, emissive: new THREE.Color(1, 1, 1), emissiveMap: labelTex, emissiveIntensity: 0.55 })
    const mats = [crateMat, plankMat, shell, trim, cable, screenTex, screen, labelTex, label]
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], px: number, py: number, pz: number, parent: THREE.Object3D = root) => {
      const m = new THREE.Mesh(geo, mat)
      m.position.set(px, py, pz)
      m.castShadow = true
      m.receiveShadow = true
      parent.add(m)
      this.disposables.push(geo)
      return m
    }
    // Crate
    const CW = 1.3
    const CH = 0.8
    const CD = 0.9
    add(new THREE.BoxGeometry(CW, CH, CD), crateMat, 0, CH / 2, 0)
    for (const y of [0.12, CH - 0.12]) add(new THREE.BoxGeometry(CW + 0.04, 0.1, CD + 0.04), plankMat, 0, y, 0)
    // Vehicle gateway on the crate: dark box, lit label face, cable coiling off the side.
    const gw = new THREE.Group()
    gw.position.set(-0.3, CH, 0.05)
    gw.rotation.y = 0.25
    root.add(gw)
    add(new THREE.BoxGeometry(0.62, 0.16, 0.4), [shell, shell, shell, shell, label, shell], 0, 0.08, 0, gw)
    add(new THREE.BoxGeometry(0.66, 0.03, 0.44), trim, 0, 0.015, 0, gw)
    const plug = add(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 10), trim, 0.38, 0.08, 0, gw)
    plug.rotation.z = Math.PI / 2
    const lead = add(new THREE.TorusGeometry(0.16, 0.022, 6, 20, Math.PI * 1.4), cable, 0.55, -0.06, 0, gw)
    lead.rotation.y = Math.PI / 2
    // Driver tablet on a little stand, tilted toward the meadow.
    const tab = new THREE.Group()
    tab.position.set(0.32, CH, -0.08)
    tab.rotation.y = -0.2
    root.add(tab)
    add(new THREE.BoxGeometry(0.34, 0.04, 0.24), trim, 0, 0.02, 0, tab)
    add(new THREE.BoxGeometry(0.05, 0.32, 0.05), trim, 0, 0.18, -0.02, tab)
    const face = new THREE.Group()
    face.position.set(0, 0.52, 0.02)
    face.rotation.x = -0.22
    tab.add(face)
    add(new THREE.BoxGeometry(0.78, 0.52, 0.05), [shell, shell, shell, shell, screen, shell], 0, 0, 0, face)
    // A spare gateway leaning against the crate, still blinking.
    const spare = new THREE.Group()
    spare.position.set(-0.9, 0, 0.45)
    spare.rotation.set(0, 0.7, 0)
    root.add(spare)
    const sp = add(new THREE.BoxGeometry(0.62, 0.16, 0.4), [shell, shell, shell, shell, label, shell], 0, 0.2, 0, spare)
    sp.rotation.x = -1.1
    this.disposables.push(...mats)
    root.updateMatrixWorld(true)
    physics.addStaticBox(new THREE.Vector3(0, CH / 2 + 0.3, 0).applyMatrix4(root.matrixWorld), new THREE.Vector3(CW, CH + 0.6, CD), root.quaternion)
    this.grassMask.push({ x, z, r: 0.95 })
    this.reserved.push({ x, z, r: 1.8 })
  }

  /** The Waste Lab's own logo, projected as a true decal onto the curved cargo-box side facing
   *  the meadow. A flat floating plane clipped into the bulging toy surface up close; the decal
   *  projection hugs the surface instead, so it reads like a painted-on sticker from any angle. */
  private truckLogo(holder: THREE.Group): void {
    let surface: THREE.Mesh | null = null
    holder.traverse(o => {
      const m = o as THREE.Mesh
      if (m.isMesh && !surface) surface = m
    })
    if (!surface) return
    holder.updateMatrixWorld(true)
    const at = holder.localToWorld(new THREE.Vector3(-0.1, 1.76, 0.91))
    const orient = new THREE.Euler(0, holder.rotation.y, 0)
    const geo = new DecalGeometry(surface, at, orient, new THREE.Vector3(1.6, 1.6, 1.6))
    const tex = new THREE.TextureLoader().load('./brand/the-waste-lab-logo.png')
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -4 })
    const decal = new THREE.Mesh(geo, mat)
    decal.castShadow = false
    // DecalGeometry bakes world coordinates, so it joins the identity-transform landmarks group.
    this.group.add(decal)
    this.disposables.push(geo, mat, tex)
  }

  /** The welcome stone: a carved slab with the headline, squared to the player's own spawn
   *  orientation (not the meadow-facing convention every other landmark uses), so it reads
   *  flat and undistorted right where the visitor lands, facing them and not the guardian. */
  private buildWelcome(physics: Physics, x: number, z: number, ground: number, yaw: number): void {
    const w = 3.1
    const h = 1.85
    const stone = new THREE.MeshLambertMaterial({ color: new THREE.Color(0.66, 0.64, 0.6) })
    const tex = welcomeTexture()
    const face = new THREE.MeshLambertMaterial({ map: tex })
    const slabGeo = new THREE.BoxGeometry(w, h, 0.32)
    const slab = new THREE.Mesh(slabGeo, [stone, stone, stone, stone, face, stone])
    const baseGeo = new THREE.BoxGeometry(w + 0.5, 0.34, 0.8)
    const base = new THREE.Mesh(baseGeo, stone)
    const root = new THREE.Group()
    root.position.set(x, ground, z)
    root.rotation.y = yaw
    slab.position.y = 0.3 + h / 2
    base.position.y = 0.1
    for (const m of [slab, base]) {
      m.castShadow = true
      m.receiveShadow = true
    }
    root.add(slab, base)
    this.group.add(root)
    this.disposables.push(stone, tex, face, slabGeo, baseGeo)
    root.updateMatrixWorld(true)
    physics.addStaticBox(new THREE.Vector3(0, 1.1, 0).applyMatrix4(root.matrixWorld), new THREE.Vector3(w + 0.5, 2.2, 0.8), root.quaternion)
    this.spots.push({ id: 'welcome', at: new THREE.Vector3(x, ground + 1.3, z), reach: 5.5 })
    this.grassMask.push({ x, z, r: 1.6 })
    this.reserved.push({ x, z, r: 3.2 })
  }

  update(dt: number, time: number, camera: THREE.Camera, active: boolean): void {
    for (const f of this.floaters) {
      f.obj.position.y = f.baseY + Math.sin(time * 1.3 + f.phase) * 0.12
      f.obj.rotation.y += dt * LIVE.spin
    }
    this.focus = null
    if (!active) return
    camera.getWorldPosition(this.camPos)
    camera.getWorldDirection(this.fwd)
    let best = Infinity
    for (const s of this.spots) {
      this.d.subVectors(s.at, this.camPos)
      const dist = this.d.length()
      if (dist > s.reach || dist < 1e-3) continue
      const cos = this.d.dot(this.fwd) / dist
      if (cos < (dist < 2.2 ? 0.45 : 0.8)) continue
      const score = (1 - cos) * 6 + dist * 0.08
      if (score < best) {
        best = score
        this.focus = s
      }
    }
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose()
  }
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function boardTexture(kicker: string, heading: string, color: string): THREE.CanvasTexture {
  return canvasTexture(1024, 550, g => {
    g.fillStyle = '#fbf6ea'
    g.fillRect(0, 0, 1024, 550)
    g.fillStyle = color
    g.fillRect(0, 0, 1024, 44)
    g.strokeStyle = 'rgba(60,45,30,0.25)'
    g.lineWidth = 6
    g.strokeRect(3, 3, 1018, 544)
    g.textAlign = 'center'
    g.textBaseline = 'alphabetic'
    g.fillStyle = '#6b5a48'
    g.font = '700 40px Figtree, sans-serif'
    g.fillText(kicker.split(' · ')[0].toUpperCase(), 512, 128)
    g.fillStyle = '#1f1a16'
    g.font = '800 82px Sora, sans-serif'
    const lines = lines2(g, heading, 930)
    const top = lines.length > 1 ? 250 : 300
    lines.forEach((t, i) => g.fillText(t, 512, top + i * 94))
    g.fillStyle = color
    g.font = '700 38px Figtree, sans-serif'
    g.fillText('Press E to open', 512, 500)
  })
}

/** Break text into at most two lines that fit `max`, shrinking the font if still too wide. */
function lines2(g: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(' ')
  let lines = [text]
  if (g.measureText(text).width > max) {
    let best = 1
    let bestW = Infinity
    for (let i = 1; i < words.length; i += 1) {
      const w = Math.max(g.measureText(words.slice(0, i).join(' ')).width, g.measureText(words.slice(i).join(' ')).width)
      if (w < bestW) {
        bestW = w
        best = i
      }
    }
    lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]
  }
  const widest = Math.max(...lines.map(t => g.measureText(t).width))
  if (widest > max) {
    const size = Math.floor(82 * (max / widest))
    g.font = `800 ${size}px Sora, sans-serif`
  }
  return lines
}

function welcomeTexture(): THREE.CanvasTexture {
  return canvasTexture(1024, 612, g => {
    g.fillStyle = '#d9d2c4'
    g.fillRect(0, 0, 1024, 612)
    g.strokeStyle = 'rgba(70,60,50,0.35)'
    g.lineWidth = 6
    g.strokeRect(26, 26, 972, 560)
    g.textAlign = 'center'
    g.fillStyle = '#b8323c'
    g.font = '700 38px Figtree, sans-serif'
    g.fillText("WELCOME TO ALI'S VERSE", 512, 112)
    g.fillStyle = '#2b2420'
    g.font = '800 116px Sora, sans-serif'
    g.fillText(PROFILE.name, 512, 248)
    g.fillStyle = '#3d342d'
    g.font = '600 38px Figtree, sans-serif'
    wrap(g, 'Product-Minded Engineer and Tech Leader', 512, 330, 900, 46)
    g.font = '500 32px Figtree, sans-serif'
    g.fillStyle = '#54493f'
    wrap(g, 'AI-Native Building, Data and Customer Outcomes', 512, 384, 900, 40)
    g.fillStyle = '#6b5e52'
    g.font = 'italic 500 28px Figtree, sans-serif'
    g.fillText(`${LANDMARKS.length - 1} chapters wait on this hill. Walk up to one and press E.`, 512, 488)
  })
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number): void {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (g.measureText(t).width > max && line) {
      lines.push(line)
      line = w
    } else line = t
  }
  if (line) lines.push(line)
  const y0 = y - ((lines.length - 1) * lh) / 2
  lines.forEach((l, i) => g.fillText(l, x, y0 + i * lh))
}

/** The driver tablet: an hours-of-service screen with duty status, clocks and a log graph. */
function hosTexture(): THREE.CanvasTexture {
  return canvasTexture(768, 512, g => {
    g.fillStyle = '#0f1724'
    g.fillRect(0, 0, 768, 512)
    g.fillStyle = '#1b2638'
    g.fillRect(0, 0, 768, 70)
    g.fillStyle = '#e8eef8'
    g.font = '700 32px Figtree, sans-serif'
    g.textAlign = 'left'
    g.fillText('ELD  ·  Hours of Service', 28, 47)
    g.fillStyle = '#2fbf71'
    g.beginPath()
    g.roundRect(28, 96, 250, 74, 16)
    g.fill()
    g.fillStyle = '#04150c'
    g.font = '800 38px Sora, sans-serif'
    g.fillText('DRIVING', 56, 147)
    const clocks: [string, string][] = [['Drive', '08:42'], ['Shift', '11:15'], ['Cycle', '52:30']]
    clocks.forEach(([k, v], i) => {
      const cx = 310 + i * 150
      g.fillStyle = '#8fa3bf'
      g.font = '600 22px Figtree, sans-serif'
      g.fillText(k, cx, 118)
      g.fillStyle = '#ffffff'
      g.font = '700 38px Sora, sans-serif'
      g.fillText(v, cx, 162)
    })
    const gx = 28
    const gy = 210
    const gw = 712
    const gh = 220
    g.strokeStyle = '#33425a'
    g.lineWidth = 2
    for (let r = 0; r <= 4; r += 1) {
      g.beginPath()
      g.moveTo(gx, gy + (r * gh) / 4)
      g.lineTo(gx + gw, gy + (r * gh) / 4)
      g.stroke()
    }
    for (let c = 0; c <= 12; c += 1) {
      g.beginPath()
      g.moveTo(gx + (c * gw) / 12, gy)
      g.lineTo(gx + (c * gw) / 12, gy + gh)
      g.stroke()
    }
    const rows = ['OFF', 'SB', 'D', 'ON']
    g.fillStyle = '#8fa3bf'
    g.font = '600 18px Figtree, sans-serif'
    rows.forEach((t, i) => g.fillText(t, gx + 6, gy + (i + 0.62) * (gh / 4)))
    const steps: [number, number][] = [[0, 0], [2.5, 3], [3, 2], [6.5, 3], [7, 2], [10.5, 0], [12, 0]]
    g.strokeStyle = '#4fc3ff'
    g.lineWidth = 6
    g.beginPath()
    steps.forEach(([t, row], i) => {
      const px = gx + 50 + (t / 12) * (gw - 60)
      const py = gy + (row + 0.5) * (gh / 4)
      if (i === 0) g.moveTo(px, py)
      else {
        const prev = steps[i - 1]
        g.lineTo(px, gy + (prev[1] + 0.5) * (gh / 4))
        g.lineTo(px, py)
      }
    })
    g.stroke()
    g.fillStyle = '#8fa3bf'
    g.font = '600 22px Figtree, sans-serif'
    g.fillText('No violations  ·  Synced 2 min ago', 28, 476)
  })
}
/** The vehicle gateway front: device name and a row of status lights. */
function gatewayTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 132, g => {
    g.fillStyle = '#1a1c22'
    g.fillRect(0, 0, 512, 132)
    g.fillStyle = '#e8eef8'
    g.font = '800 46px Sora, sans-serif'
    g.textAlign = 'left'
    g.fillText('ELD', 30, 82)
    g.fillStyle = '#8fa3bf'
    g.font = '600 22px Figtree, sans-serif'
    g.fillText('VEHICLE GATEWAY', 140, 78)
    const leds = ['#2fbf71', '#2fbf71', '#4fc3ff', '#f0b429']
    leds.forEach((c, i) => {
      g.fillStyle = c
      g.beginPath()
      g.arc(372 + i * 34, 66, 10, 0, Math.PI * 2)
      g.fill()
    })
  })
}
