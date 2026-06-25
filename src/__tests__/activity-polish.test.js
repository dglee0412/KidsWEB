import { describe, it, expect } from 'vitest'
import { PIANO_SONGS } from '../activities.jsx'

const WHITE = new Set(['C','D','E','F','G','A','B','C5'])

describe('PIANO_SONGS', () => {
  it('각 곡 notes는 백건반 id, 동요 장곡(≥13) 포함', () => {
    PIANO_SONGS.forEach((s) => {
      expect(s.notes.length).toBeGreaterThanOrEqual(1)
      s.notes.forEach((n) => expect(WHITE.has(n)).toBe(true))
    })
    expect(PIANO_SONGS.some((s) => s.notes.length >= 13)).toBe(true)
  })
})
