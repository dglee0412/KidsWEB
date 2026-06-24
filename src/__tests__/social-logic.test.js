import { describe, it, expect } from 'vitest'
import {
  MESSENGER_LEVELS, ROLES, SCENES, DECORATE_STICKERS, FRAMES,
  buildMessengerRound, buildRoleStepOptions,
} from '../social.jsx'

describe('데이터 적합성', () => {
  it('메신저 3레벨, 각 ≥4문항, answer∈options, options≥2', () => {
    expect(MESSENGER_LEVELS).toHaveLength(3)
    MESSENGER_LEVELS.forEach((lvl) => {
      expect(lvl.length).toBeGreaterThanOrEqual(4)
      lvl.forEach((q) => {
        expect(typeof q.ask).toBe('string')
        expect(q.options.length).toBeGreaterThanOrEqual(2)
        expect(q.options).toContain(q.answer)
      })
    })
  })
  it('역할 6직업, 각 step 3~4, tool+distractors 존재', () => {
    expect(ROLES).toHaveLength(6)
    ROLES.forEach((r) => {
      expect(typeof r.name).toBe('string')
      expect(r.emoji.length).toBeGreaterThan(0)
      expect(r.steps.length).toBeGreaterThanOrEqual(3)
      expect(r.steps.length).toBeLessThanOrEqual(4)
      r.steps.forEach((s) => {
        expect(typeof s.prompt).toBe('string')
        expect(s.tool.length).toBeGreaterThan(0)
        expect(s.distractors.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
  it('꾸미기 SCENES≥4, STICKERS≥6, FRAMES≥2', () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(4)
    expect(DECORATE_STICKERS.length).toBeGreaterThanOrEqual(6)
    expect(FRAMES.length).toBeGreaterThanOrEqual(2)
    SCENES.forEach((s) => { expect(s.c1).toMatch(/^#[0-9A-Fa-f]{6}$/); expect(s.c2).toMatch(/^#[0-9A-Fa-f]{6}$/) })
    FRAMES.forEach((f) => expect(f.color).toMatch(/^#[0-9A-Fa-f]{6}$/))
  })
})

describe('buildMessengerRound', () => {
  it('answer∈options + 고유 + ask 반환', () => {
    const r = buildMessengerRound(0, MESSENGER_LEVELS)
    expect(typeof r.ask).toBe('string')
    expect(r.options).toContain(r.answer)
    expect(new Set(r.options).size).toBe(r.options.length)
  })
  it('레벨 범위 밖이면 클램프', () => {
    expect(() => buildMessengerRound(99, MESSENGER_LEVELS)).not.toThrow()
    expect(() => buildMessengerRound(-5, MESSENGER_LEVELS)).not.toThrow()
  })
})

describe('buildRoleStepOptions', () => {
  it('정답 tool∈options + 고유 + 길이=1+distractors', () => {
    const step = { prompt: '열을 재요', tool: '🌡️', distractors: ['🍴', '🎨'] }
    const r = buildRoleStepOptions(step)
    expect(r.tool).toBe('🌡️')
    expect(r.options).toContain('🌡️')
    expect(new Set(r.options).size).toBe(r.options.length)
    expect(r.options).toHaveLength(3)
  })
})
