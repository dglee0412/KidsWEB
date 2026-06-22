import { describe, it, expect } from 'vitest'
import {
  SHAPES, COLORS, SHAPE_OBJECTS, COLOR_OBJECTS,
  shapeFindLevelConfig, colorSortLevelConfig,
  buildShapeFindRound, buildShapeMatchRound, buildColorSortRound,
} from '../shape.jsx'

describe('데이터 적합성', () => {
  it('도형 9종 — id/name/d/tier/examples', () => {
    expect(SHAPES).toHaveLength(9)
    SHAPES.forEach((s) => {
      expect(typeof s.id).toBe('string')
      expect(typeof s.name).toBe('string')
      expect(typeof s.d).toBe('string')
      expect(['basic', 'ext']).toContain(s.tier)
      expect(s.examples.length).toBeGreaterThan(0)
    })
  })
  it('색 10종 — id/name/hex/examples', () => {
    expect(COLORS).toHaveLength(10)
    COLORS.forEach((c) => {
      expect(c.hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(c.examples.length).toBeGreaterThan(0)
    })
  })
  it('사물→도형/색 매핑 id가 정의에 존재', () => {
    const shapeIds = new Set(SHAPES.map((s) => s.id))
    const colorIds = new Set(COLORS.map((c) => c.id))
    SHAPE_OBJECTS.forEach((o) => { expect(shapeIds.has(o.shapeId)).toBe(true); expect(o.emoji.length).toBeGreaterThan(0) })
    COLOR_OBJECTS.forEach((o) => { expect(colorIds.has(o.colorId)).toBe(true); expect(o.emoji.length).toBeGreaterThan(0) })
  })
})

describe('buildShapeFindRound', () => {
  it('정답 포함 + 고유 + 보기수=min(options,풀)', () => {
    const cfg = shapeFindLevelConfig(0) // {options:3, tiers:['basic']}
    const r = buildShapeFindRound(cfg, SHAPES)
    expect(r.options).toContain(r.answerId)
    expect(new Set(r.options).size).toBe(r.options.length)
    expect(r.options).toHaveLength(3)
  })
  it('Lv3은 확장도형 포함 풀에서 최대 6보기', () => {
    const r = buildShapeFindRound(shapeFindLevelConfig(2), SHAPES)
    expect(r.options.length).toBe(6)
  })
})

describe('buildShapeMatchRound', () => {
  it('제시 사물의 도형이 정답 + 보기에 포함', () => {
    const cfg = shapeFindLevelConfig(0)
    const r = buildShapeMatchRound(cfg, SHAPE_OBJECTS, SHAPES)
    const obj = SHAPE_OBJECTS.find((o) => o.emoji === r.emoji)
    expect(obj.shapeId).toBe(r.answerId)
    expect(r.options).toContain(r.answerId)
  })
})

describe('buildColorSortRound', () => {
  it('정답셋은 그리드 내 타깃색 전체 + 1개 이상 + 그리드 ⊇ 정답', () => {
    const cfg = colorSortLevelConfig(1) // {grid:9, colors:4}
    const r = buildColorSortRound(cfg, COLOR_OBJECTS, COLORS)
    const emojis = r.items.map((o) => o.emoji)
    expect(r.targetKeys.length).toBeGreaterThan(0)
    r.targetKeys.forEach((k) => expect(emojis).toContain(k))
    // 그리드 안 타깃색 사물은 모두 정답
    const inGridTargets = r.items.filter((o) => o.colorId === r.targetColorId).map((o) => o.emoji)
    expect(new Set(r.targetKeys)).toEqual(new Set(inGridTargets))
    expect(r.items.length).toBeLessThanOrEqual(cfg.grid)
  })
})
