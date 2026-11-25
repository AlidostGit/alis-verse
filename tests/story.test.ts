import { describe, expect, test } from 'vitest'
import { BOOK, FOX_TAMED, chooseScript, type StoryState, type Target } from '../src/game/story'

const fresh = (): StoryState => ({ stars: [], fox: 0, awake: false, chaptersDone: false, visits: {}, sproutsLeft: 4, roseSmeltFox: false })
function talk(s: StoryState, target: Target) {
  const c = chooseScript(BOOK, target, s)
  if (c.repeat) s.visits[target] = (s.visits[target] ?? 0) + 1
  const e = c.effects
  if (e.star && !s.stars.includes(e.star)) s.stars.push(e.star)
  if (e.fox !== undefined) s.fox = e.fox
  if (e.awaken) s.awake = true
  if (e.roseSmeltFox) s.roseSmeltFox = true
  if (e.pullSprout) s.sproutsLeft = Math.max(0, s.sproutsLeft - 1)
  return c
}

describe('story', () => {
  test('every script is English and non-empty', () => {
    const walk = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) || (v && typeof v === 'object') ? Object.values(v as object).flatMap(walk) : [])
    const texts = walk(BOOK)
    expect(texts.length).toBeGreaterThan(60)
    for (const t of texts) expect(t).not.toMatch(/[\u4e00-\u9fff]/)
  })
  test('the fox is won over in three visits', () => {
    const s = fresh()
    for (let i = 0; i < FOX_TAMED; i += 1) talk(s, 'fox')
    expect(s.fox).toBe(FOX_TAMED)
    expect(s.stars).toContain('fox')
    expect(talk(s, 'fox').repeat).toBe(true)
  })
  test('the guardian wakes only after every career chapter is opened', () => {
    const s = fresh()
    talk(s, 'guardian')
    expect(s.awake).toBe(false)
    talk(s, 'guardian')
    expect(s.awake).toBe(false)
    s.chaptersDone = true
    const c = talk(s, 'guardian')
    expect(c.effects.awaken).toBe(true)
    expect(s.awake).toBe(true)
    expect(c.lines.some(([, t]) => t.includes('LinkedIn'))).toBe(true)
  })
  test('the rose lifts its dome every time and notices the fox once', () => {
    const s = fresh()
    expect(talk(s, 'rose').effects.liftDome).toBe(true)
    s.fox = FOX_TAMED
    expect(talk(s, 'rose').effects.roseSmeltFox).toBe(true)
    expect(talk(s, 'rose').effects.roseSmeltFox).toBeUndefined()
  })
})
