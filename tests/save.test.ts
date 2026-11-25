import { describe, expect, it } from 'vitest'
import { cleanName, defaultSave, parseSave, SAVE_KEY, SaveStore } from '../src/engine/save'

describe('save', () => {
  it('falls back to defaults for missing, corrupt or foreign data', () => {
    expect(parseSave(null)).toEqual(defaultSave())
    expect(parseSave('{nope')).toEqual(defaultSave())
    expect(parseSave('[]')).toEqual(defaultSave())
    expect(parseSave(JSON.stringify({ version: 99, musicVolume: 0.1 }))).toEqual(defaultSave())
  })
  it('clamps and validates fields, including opened chapters', () => {
    const s = parseSave(JSON.stringify({ version: 1, musicVolume: 5, sfxVolume: -1, quality: 'ultra', sensitivity: 9, chapters: ['motive', 'motive', 7, 'x'.repeat(40), 'play'], fox: 9 }))
    expect(s.musicVolume).toBe(1)
    expect(s.sfxVolume).toBe(0)
    expect(s.quality).toBe('high')
    expect(s.sensitivity).toBe(1)
    expect(s.chapters).toEqual(['motive', 'play'])
    expect(s.fox).toBe(3)
  })
  it('persists through storage under the Alidverse key and survives storage errors', () => {
    const mem = new Map<string, string>()
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) }
    new SaveStore(storage).update({ musicVolume: 0.3, chapters: ['welcome'] })
    expect(SAVE_KEY).toBe('alidverse.save')
    expect(new SaveStore(storage).data.chapters).toEqual(['welcome'])
    const broken = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('quota') } }
    const store = new SaveStore(broken)
    expect(() => store.update({ muted: true })).not.toThrow()
    expect(store.data.muted).toBe(true)
  })
  it('cleans typed names', () => {
    expect(cleanName('  Ali\u200b   {Dost}  ')).toBe('Ali Dost')
    expect(cleanName('abcdefghijklmnopqrstuvwxyz')).toHaveLength(12)
  })
})
