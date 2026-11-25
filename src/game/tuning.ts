import { LIVE } from './config'

/**
 * Tweak-panel parameter manager. Every control writes straight into `LIVE`, which the player,
 * camera and landmarks read each frame, so changes show in the running preview immediately.
 */
type Control = {
  id: string
  type: 'number'
  category: string
  label: string
  description: string
  unit: string
  default: number
  min: number
  max: number
  step: number
  applyMode: 'LIVE'
  integrity: 'COSMETIC' | 'GAMEPLAY'
}
type Key = keyof typeof LIVE
type Binding = { control: Control; key: Key }

const DEFAULTS: Readonly<typeof LIVE> = Object.freeze({ ...LIVE })
const bindings: Binding[] = []

function number(key: Key, category: string, label: string, min: number, max: number, step: number, unit: string, integrity: Control['integrity']): void {
  bindings.push({
    key,
    control: Object.freeze({
      id: `live.${key}`,
      type: 'number',
      category,
      label,
      description: 'Updates this preview immediately.',
      unit,
      default: DEFAULTS[key],
      min,
      max,
      step,
      applyMode: 'LIVE',
      integrity,
    }),
  })
}

number('walkSpeed', 'Movement', 'Walking speed', 1, 10, 0.1, 'm/s', 'GAMEPLAY')
number('sprintSpeed', 'Movement', 'Sprint speed', 1, 16, 0.1, 'm/s', 'GAMEPLAY')
number('fov', 'Camera', 'Field of view', 45, 100, 1, '°', 'COSMETIC')
number('spin', 'Landmarks', 'Floating landmark spin', 0, 2, 0.05, 'rad/s', 'COSMETIC')

const byId = new Map(bindings.map(b => [b.control.id, b]))
let requested: Record<string, number> = Object.fromEntries(bindings.map(b => [b.control.id, b.control.default]))
const valid = (v: Record<string, number>) => v['live.walkSpeed'] <= v['live.sprintSpeed']

export const tuning = {
  controls: Object.freeze(bindings.map(b => b.control)),
  read() {
    return { requested: { ...requested }, active: Object.fromEntries(bindings.map(b => [b.control.id, LIVE[b.key]])) }
  },
  apply(patch: unknown): void {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Invalid patch')
    const entries = Object.entries(patch)
    if (entries.length > bindings.length) throw new Error('Invalid patch')
    for (const [id, value] of entries) {
      const control = byId.get(id)?.control
      if (!control || typeof value !== 'number' || !Number.isFinite(value) || value < control.min || value > control.max) throw new Error('Invalid value')
      const steps = (value - control.min) / control.step
      if (value !== control.default && Math.abs(steps - Math.round(steps)) > 1e-6) throw new Error('Invalid increment')
    }
    const candidate = { ...requested, ...(patch as Record<string, number>) }
    if (!valid(candidate)) throw new Error('Walking speed must not exceed sprint speed')
    requested = candidate
    for (const [id, value] of entries) LIVE[byId.get(id)!.key] = value as number
  },
}
