import { describe, it, expect } from 'vitest'
import { KEYBOARD_EN, KEYBOARD_KO, TOUCH_GESTURES, MOUSE_TASKS, pickTypingTarget } from '../computer.jsx'

describe('키보드 레이아웃', () => {
  it('영어 26키 고유 + A~Z 전부', () => {
    const flat = KEYBOARD_EN.flat()
    expect(flat).toHaveLength(26)
    expect(new Set(flat).size).toBe(26)
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c) => expect(flat).toContain(c))
  })
  it('한글 두벌식 26키 고유 + 모두 한글 자모', () => {
    const flat = KEYBOARD_KO.flat()
    expect(flat).toHaveLength(26)
    expect(new Set(flat).size).toBe(26)
    flat.forEach((k) => expect(/^[ㄱ-ㅎㅏ-ㅣ]$/.test(k)).toBe(true))
  })
})

describe('pickTypingTarget', () => {
  const keys = KEYBOARD_EN.flat()
  it('결과는 keys 중 하나', () => {
    for (let i = 0; i < 20; i++) expect(keys).toContain(pickTypingTarget(keys, null))
  })
  it('prev와 다르게 뽑음(길이>1)', () => {
    for (let i = 0; i < 20; i++) { const k = pickTypingTarget(keys, 'A'); expect(k).not.toBe('A') }
  })
  it('키 1개면 그 키 반환', () => {
    expect(pickTypingTarget(['Z'], 'Z')).toBe('Z')
  })
})

describe('과제 데이터', () => {
  it('터치 제스처 3종(tap/drag/swipe) + 필드', () => {
    expect(TOUCH_GESTURES.map((x) => x.id)).toEqual(['tap', 'drag', 'swipe'])
    TOUCH_GESTURES.forEach((g) => {
      expect(typeof g.prompt).toBe('string')
      expect(g.emoji.length).toBeGreaterThan(0)
      expect(g.count).toBeGreaterThanOrEqual(1)
    })
  })
  it('마우스 과제 3종(click/double/drag) + 필드', () => {
    expect(MOUSE_TASKS.map((x) => x.id)).toEqual(['click', 'double', 'drag'])
    MOUSE_TASKS.forEach((m) => {
      expect(typeof m.prompt).toBe('string')
      expect(m.emoji.length).toBeGreaterThan(0)
      expect(m.count).toBeGreaterThanOrEqual(1)
    })
  })
})
