import { describe, expect, test } from 'vitest'
import en from '../src/i18n/en.json'
import { readFileSync } from 'node:fs'

describe('i18n', () => {
  test('every key used in the UI exists in the English dictionary', () => {
    const src = ['src/ui/ui.ts', 'src/main.ts'].map(f => readFileSync(f, 'utf8')).join('\n')
    const keys = new Set([...src.matchAll(/data-i18n(?:-label)?="([\w.]+)"/g), ...src.matchAll(/i18n\.t\('([\w.]+)'/g), ...src.matchAll(/this\.i18n\.t\('([\w.]+)'/g)].map(m => m[1]))
    for (const k of keys) expect(en, k).toHaveProperty([k])
    for (const t of ['hat', 'sprout', 'fox', 'rose', 'sheep', 'box', 'tapir', 'shoebill', 'guardian']) expect(en).toHaveProperty([`prompt.${t}`])
  })
  test("the title reads Ali's Verse", () => {
    expect(en['game.title']).toBe("Ali's Verse")
    expect(en['game.subtitle']).toBe("Explore Ali Dost's Career")
  })
})
