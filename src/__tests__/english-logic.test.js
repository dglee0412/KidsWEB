import { describe, it, expect } from 'vitest'
import { englishLevelConfig, phonicsOptions, wordOptions, ALPHABET, WORD_SET } from '../english.jsx'

describe('englishLevelConfig(5레벨)', () => {
  it('상위 레벨 멀티타깃', () => {
    expect(englishLevelConfig(0)).toEqual({ targets: 1, options: 4, questions: 6 })
    expect(englishLevelConfig(2)).toEqual({ targets: 1, options: 6, questions: 10 })
    expect(englishLevelConfig(3)).toEqual({ targets: 2, options: 6, questions: 8 })
    expect(englishLevelConfig(4)).toEqual({ targets: 3, options: 8, questions: 10 })
    expect(englishLevelConfig(9)).toEqual({ targets: 3, options: 8, questions: 10 })
  })
})

describe('데이터', () => {
  it('ALPHABET은 26자, 각 항목에 u/l/word/emoji', () => {
    expect(ALPHABET).toHaveLength(26)
    for (const a of ALPHABET) {
      expect(a.u).toMatch(/^[A-Z]$/)
      expect(a.l).toBe(a.u.toLowerCase())
      expect(typeof a.word).toBe('string')
      expect(a.emoji.length).toBeGreaterThan(0)
    }
  })
  it('WORD_SET은 6개 이상, word/emoji', () => {
    expect(WORD_SET.length).toBeGreaterThanOrEqual(6)
    for (const w of WORD_SET) { expect(typeof w.word).toBe('string'); expect(w.emoji.length).toBeGreaterThan(0) }
  })
})

describe('phonicsOptions(정답 인덱스 포함 고유 N개, 경계 무한루프 없음)', () => {
  const distinct = (a) => new Set(a).size === a.length
  it('모든 타깃/옵션수에서 고유 N개 + 정답 포함 + 범위 내', () => {
    for (const opts of [4, 6]) {
      for (let target = 0; target < ALPHABET.length; target++) {
        const r = phonicsOptions(target, opts, ALPHABET.length)
        expect(r).toHaveLength(opts)
        expect(distinct(r)).toBe(true)
        expect(r).toContain(target)
        for (const x of r) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(ALPHABET.length) }
      }
    }
  })
})

describe('wordOptions(정답 단어 포함 고유 N개)', () => {
  const distinct = (a) => new Set(a).size === a.length
  it('모든 단어/옵션수에서 고유 N개 + 정답 포함', () => {
    for (const opts of [4, 6]) {
      for (const w of WORD_SET) {
        const r = wordOptions(w.word, opts, WORD_SET)
        expect(r).toHaveLength(Math.min(opts, WORD_SET.length))
        expect(distinct(r)).toBe(true)
        expect(r).toContain(w.word)
      }
    }
  })
})
