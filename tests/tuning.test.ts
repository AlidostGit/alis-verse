import { describe, expect, test } from 'vitest'
import { LIVE } from '../src/game/config'
import { tuning } from '../src/game/tuning'

describe('tuning', () => {
  test('applies live values with validation', () => {
    tuning.apply({ 'live.walkSpeed': 4 })
    expect(LIVE.walkSpeed).toBe(4)
    expect(() => tuning.apply({ 'live.walkSpeed': 9, 'live.sprintSpeed': 5 })).toThrow()
    expect(() => tuning.apply({ 'live.fov': 500 })).toThrow()
    expect(() => tuning.apply({ nope: 1 })).toThrow()
    expect(tuning.read().active['live.walkSpeed']).toBe(4)
    tuning.apply({ 'live.walkSpeed': 3.2 })
  })
})
