import { describe, it, expect } from 'vitest'
import { PIANO_SONGS, DRUM_SONGS, XYLO_SONGS } from '../activities.jsx'
import { ABC_SONG } from '../english.jsx'

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

const DRUM = new Set(['kick','snare','tom','hihat','cymbal'])
describe('DRUM_SONGS', () => {
  it('3곡+, 각 step은 드럼 패드 id, 길이 ≥8', () => {
    expect(DRUM_SONGS.length).toBeGreaterThanOrEqual(3)
    DRUM_SONGS.forEach((s) => {
      expect(s.notes.length).toBeGreaterThanOrEqual(8)
      s.notes.forEach((n) => expect(DRUM.has(n)).toBe(true))
    })
  })
})

describe('XYLO_SONGS', () => {
  it('3곡+, 각 note는 막대 id, 길이 ≥8', () => {
    expect(XYLO_SONGS.length).toBeGreaterThanOrEqual(3)
    XYLO_SONGS.forEach((s) => {
      expect(s.notes.length).toBeGreaterThanOrEqual(8)
      s.notes.forEach((n) => expect(WHITE.has(n)).toBe(true))
    })
  })
})

describe('ABC_SONG', () => {
  it('26글자 A~Z 순서 + 유효 음/길이', () => {
    expect(ABC_SONG).toHaveLength(26)
    const NOTE = new Set(['C','D','E','F','G','A'])
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((ch, i) => {
      expect(ABC_SONG[i].letter).toBe(ch)
      expect(NOTE.has(ABC_SONG[i].note)).toBe(true)
      expect(ABC_SONG[i].dur).toBeGreaterThan(0)
    })
  })
})
