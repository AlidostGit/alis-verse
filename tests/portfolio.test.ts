import { describe, expect, test } from 'vitest'
import { CHAPTERS, LANDMARKS, PROFILE, landmark } from '../src/game/portfolio'
import { PLACEMENTS } from '../src/game/landmarks'

describe('portfolio content', () => {
  test('nine chapters with unique ids, colours and complete roles', () => {
    expect(CHAPTERS).toEqual(['welcome', 'roots', 'motive', 'musictribe', 'wastelab', 'projects', 'learning', 'play', 'ai'])
    expect(new Set(LANDMARKS.map(l => l.color)).size).toBe(LANDMARKS.length)
    for (const l of LANDMARKS) {
      expect(l.heading.length).toBeGreaterThan(3)
      expect(l.roles.length).toBeGreaterThan(0)
      for (const r of l.roles) expect(r.points.length).toBeGreaterThan(0)
      expect(l.skills.length).toBeGreaterThan(0)
    }
  })
  test('covers every role from the resume and LinkedIn', () => {
    const text = JSON.stringify(LANDMARKS)
    for (const s of ['The Waste Lab', 'Music Tribe', 'House and Hedges', 'Motive', 'KeepTruckin', 'MEPCO', 'AIESEC', 'NFC Institute', 'Civil Services Preparatory School', 'Project Argo', 'Sydney Alvarez', 'Marcus Aurelius', 'Anthropic'])
      expect(text).toContain(s)
  })
  test('gaming and game development are presented as hobbies, not professional skills', () => {
    const play = landmark('play')
    expect(play.intro).toMatch(/hobby/i)
    for (const l of LANDMARKS.filter(x => x.id !== 'play')) expect(l.skills.join(' ')).not.toMatch(/game/i)
  })
  test('headline and LinkedIn URL match the profile', () => {
    expect(PROFILE.headline).toBe('Product-Minded Engineer and Tech Leader | AI-Native Building, Data and Customer Outcomes')
    expect(PROFILE.linkedin).toBe('https://www.linkedin.com/in/ali-dost-0a24a4113/')
  })
  test('every chapter except the biplane has a placement inside the walkable hill', () => {
    const placed = PLACEMENTS.map(p => p.id).sort()
    expect(placed).toEqual(CHAPTERS.filter(id => id !== 'roots').sort())
    for (const p of PLACEMENTS) expect(Math.hypot(p.x, p.z)).toBeLessThan(50)
    for (let i = 0; i < PLACEMENTS.length; i += 1)
      for (let j = i + 1; j < PLACEMENTS.length; j += 1)
        expect(Math.hypot(PLACEMENTS[i].x - PLACEMENTS[j].x, PLACEMENTS[i].z - PLACEMENTS[j].z)).toBeGreaterThan(8)
  })
})
