import './styles/main.css'
import type * as THREE from 'three'
import { Audio } from './engine/audio'
import { I18n } from './engine/i18n'
import { Input } from './engine/input'
import { GameLoop } from './engine/loop'
import { SAVE_KEY, SaveStore, type Quality, type SaveData } from './engine/save'
import { MODEL_URLS, type ModelKey } from './game/assetTable'
import type { Game } from './game/game'
import { CHAPTERS, LANDMARKS, type LandmarkId } from './game/portfolio'
import { TouchControls } from './ui/touch'
import { Ui, type CompassPip } from './ui/ui'

async function boot(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#game')!
  const params = new URLSearchParams(location.search)
  const firstRun = safeGet(SAVE_KEY) === null
  const save = new SaveStore()
  const i18n = new I18n()
  const input = new Input(canvas)
  const audio = new Audio()
  let game: Game | undefined
  let lockLostAt = 0
  const applySettings = (d: SaveData) => {
    input.sensitivity = d.sensitivity
    input.invertY = d.invertY
    audio.setVolumes(d.musicVolume, d.sfxVolume, d.muted)
    if (game) game.reducedMotion = d.reducedMotion
  }
  // Audio may only start after a user gesture; the first click/key anywhere starts the soundscape.
  const wake = () => {
    audio.unlock()
    audio.startMusic()
  }
  window.addEventListener('pointerdown', wake, { once: true, capture: true })
  window.addEventListener('keydown', wake, { once: true, capture: true })
  const play = () => {
    if (!game) return
    wake()
    game.start()
    ui.show('hud')
    loop.resetAccumulator()
    input.lockPointer()
  }
  const pause = () => {
    if (game?.mode !== 'playing' || ui.panelOpen) return
    game.pause()
    ui.show('pause')
    input.unlockPointer()
  }
  const resume = () => {
    if (game?.mode !== 'paused') return
    game.resume()
    ui.show('hud')
    loop.resetAccumulator()
    input.lockPointer()
  }
  const ui = new Ui(i18n, save, audio, input, {
    play,
    resume,
    quit: () => {
      ui.closeTalk()
      ui.closePanel(false)
      game?.toTitle()
      ui.show('title')
      input.unlockPointer()
    },
    settings: patch => {
      const qualityChanged = patch.quality !== undefined && patch.quality !== save.data.quality
      save.update(patch)
      applySettings(save.data)
      if (qualityChanged) game?.setQuality(save.data.quality)
    },
    panelClosed: gesture => {
      if (!game) return
      game.frozen = false
      loop.resetAccumulator()
      if (gesture && game.mode === 'playing') input.lockPointer()
      announceChapter()
    },
    retry: () => location.reload(),
  })
  ui.show('boot')
  applySettings(save.data)

  // Boot: code chunks, Rapier (WASM), fonts and the six landmark models, behind one honest bar.
  const modelKeys = Object.keys(MODEL_URLS) as ModelKey[]
  const total = 4 + modelKeys.length
  let loaded = 0
  const bump = () => ui.setBootProgress(0.05 + (++loaded / total) * 0.8)
  const track = <T>(p: Promise<T>): Promise<T> => p.then(v => (bump(), v))
  ui.setBootProgress(0.05)
  const [{ Game }, { Renderer, suggestQuality }, physics, , { GLTFLoader }] = await Promise.all([
    track(import('./game/game')),
    track(import('./engine/renderer')),
    track(import('./engine/physics')),
    track(document.fonts.ready),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
  ])
  const loader = new GLTFLoader()
  const models: Partial<Record<ModelKey, THREE.Object3D>> = {}
  await Promise.all(
    modelKeys.map(key =>
      track(loader.loadAsync(MODEL_URLS[key])).then(gltf => {
        models[key] = gltf.scene
      }),
    ),
  )
  await physics.initPhysics()
  if (firstRun) {
    save.update({ quality: suggestQuality() })
    ui.refreshSettings()
  }
  const forced = params.get('q')
  const quality: Quality = forced === 'low' || forced === 'medium' || forced === 'high' ? forced : save.data.quality
  ui.setBootProgress(0.9)
  await nextFrame()
  const renderer = new Renderer(canvas, quality)
  game = new Game(renderer, input, audio, quality, models)
  game.reducedMotion = save.data.reducedMotion
  game.onCaption = caption => ui.caption(caption)
  const enc = game.encounters
  const lm = game.landmarks
  enc.restore({ stars: save.data.stars, fox: save.data.fox, awake: save.data.awake })
  enc.onPersist = p => save.update(p)
  enc.onSound = name => audio.play(name)
  enc.onStar = () => audio.play('pickup')

  // Career chapters opened so far (saved), the HUD tracker and the guardian's condition.
  const opened = new Set<string>(save.data.chapters.filter(id => (CHAPTERS as readonly string[]).includes(id)))
  let pendingAnnounce = false
  const syncChapters = () => {
    ui.setChapters([...opened])
    enc.chaptersDone = opened.size >= CHAPTERS.length
  }
  syncChapters()
  const announceChapter = () => {
    if (!pendingAnnounce) return
    pendingAnnounce = false
    audio.play('star')
    ui.note(opened.size >= CHAPTERS.length ? i18n.t('chapters.all') : i18n.t('chapters.found', { n: opened.size, total: CHAPTERS.length }))
  }
  const g = game
  const openChapter = (id: LandmarkId) => {
    g.frozen = true
    ui.closeTalk()
    audio.play('talk')
    if (!opened.has(id)) {
      opened.add(id)
      pendingAnnounce = true
      save.update({ chapters: [...opened] })
      syncChapters()
    }
    ui.openPanel(id)
    input.unlockPointer()
  }
  game.ambience.start()
  ui.setBootProgress(1)

  // Test/debug views: ?cam=x,y,z,yawDeg,pitchDeg,fov[,g]  (g = y is height above ground), ?play.
  const cam = params.get('cam')
  if (cam) {
    const [x, y, z, yaw, pitch, fov, ground] = cam.split(',')
    const n = (s: string | undefined, d: number) => (s === undefined || s === '' || !Number.isFinite(Number(s)) ? d : Number(s))
    g.debugCamera = { x: n(x, 0), y: n(y, 2), z: n(z, 0), yaw: (n(yaw, 0) * Math.PI) / 180, pitch: (n(pitch, 0) * Math.PI) / 180, fov: n(fov, 60), ground: ground === 'g' }
  }
  const compass = (): CompassPip[] => {
    const e = g.camera.matrixWorld.elements
    const fx = -e[8]
    const fz = -e[10]
    const rx = e[0]
    const rz = e[2]
    const f = g.player.feet
    return lm.marks.map(m => {
      const dx = m.x - f.x
      const dz = m.z - f.z
      return { id: m.id, angle: Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz), dist: Math.hypot(dx, dz), done: opened.has(m.id) }
    })
  }
  let frames = 0
  const loop = new GameLoop({
    step: dt => g.step(dt),
    render: (alpha, frameSeconds) => {
      input.update()
      if (ui.panelOpen) {
        // E, Esc, Space or pad B/Y closes the chapter; the mouse wheel and stick scroll it.
        if (input.consume('pause') || input.consume('interact') || input.consume('back') || input.consume('jump')) ui.closePanel(true)
      } else if (input.consume('pause') && performance.now() - lockLostAt > 300) {
        if (g.mode === 'playing') pause()
        else if (g.mode === 'paused' && ui.screen === 'pause') resume()
      }
      if (g.mode === 'playing' && !g.debugCamera && !ui.panelOpen) {
        if (ui.talking) {
          if (input.consume('interact') || input.consume('jump') || input.consume('confirm')) ui.advanceTalk()
        } else if (input.consume('interact')) {
          if (lm.focus) openChapter(lm.focus.id)
          else {
            const lines = enc.interact()
            if (lines) {
              audio.play('talk')
              ui.openTalk(lines, () => enc.endDialogue())
            }
          }
        }
      } else if (!ui.panelOpen) {
        input.consume('interact')
      }
      input.consume('note')
      const free = g.mode === 'playing' && !ui.talking && !ui.panelOpen
      ui.setFocus(free ? (lm.focus?.id ?? enc.focus?.target ?? null) : null)
      ui.setCompass(g.mode === 'playing' && !g.debugCamera ? compass() : null)
      ui.frame(frameSeconds)
      g.render(alpha, frameSeconds)
      input.endFrame()
      frames += 1
    },
  })
  loop.start()
  document.addEventListener('pointerlockchange', () => {
    // Browsers release pointer lock on Escape without delivering the key: treat that as pause.
    if (!document.pointerLockElement && g.mode === 'playing' && input.method === 'keyboard' && !ui.panelOpen) {
      lockLostAt = performance.now()
      pause()
    }
  })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause()
  })
  window.addEventListener('game:pause', pause)
  canvas.addEventListener('click', () => {
    if (g.mode === 'playing' && !ui.panelOpen) input.lockPointer()
  })
  new TouchControls(document.getElementById('ui')!, input, () => g.mode === 'playing' && !ui.panelOpen)
  if (params.has('play')) play()
  else window.setTimeout(() => ui.show('title'), 300)
  const chapter = params.get('chapter')
  if (chapter && LANDMARKS.some(l => l.id === chapter)) {
    if (!params.has('play')) play()
    openChapter(chapter as LandmarkId)
  }
  // Debug/test hook (read-only use): screenshot and smoke tools inspect the scene through it.
  Object.assign(window, { __game: { game: g, ui, input, save, renderer, loop } })
  Object.defineProperty(window, '__frames', { get: () => frames })
}

function nextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
boot().catch(err => {
  console.error(err)
  const message = String((err as Error)?.message ?? err)
  const failed = document.querySelector('.screen-boot')
  if (failed) {
    failed.classList.add('is-failed')
    const label = failed.querySelector('.boot-label')
    const detail = failed.querySelector('.boot-error')
    if (label) label.textContent = "Ali's Verse could not load. Check your connection, or try a browser with WebGL2 support."
    if (detail) detail.textContent = message
  } else {
    const el = document.getElementById('ui')
    if (el) el.innerHTML = `<div class="fatal"><p>Ali's Verse could not start. Please try a recent Chrome, Edge, Safari or Firefox.<br><small>${message.replace(/[<>&]/g, '')}</small></p></div>`
  }
})
