import { describe, it, expect } from 'vitest'
import { resolveMove, isSolvable, CODING_LEVELS, CODING_GRID } from '../activities.jsx'

describe('resolveMove', () => {
  const obstacles = [{ x: 2, y: 2 }]
  it('빈 칸으로 이동하면 좌표가 갱신되고 blocked=false', () => {
    expect(resolveMove({ x: 0, y: 0 }, 'right', 5, [])).toEqual({ x: 1, y: 0, blocked: false })
  })
  it('격자 밖이면 제자리 + blocked=true', () => {
    expect(resolveMove({ x: 0, y: 0 }, 'left', 5, [])).toEqual({ x: 0, y: 0, blocked: true })
    expect(resolveMove({ x: 4, y: 0 }, 'right', 5, [])).toEqual({ x: 4, y: 0, blocked: true })
  })
  it('장애물이면 제자리 + blocked=true', () => {
    expect(resolveMove({ x: 1, y: 2 }, 'right', 5, obstacles)).toEqual({ x: 1, y: 2, blocked: true })
  })
})

describe('CODING_LEVELS', () => {
  it('스테이지가 5개다', () => {
    expect(CODING_LEVELS).toHaveLength(5)
  })
  it('모든 스테이지가 직접조종으로 도달 가능하다', () => {
    for (const lv of CODING_LEVELS) {
      expect(isSolvable(lv, CODING_GRID)).toBe(true)
    }
  })
  it('시작칸과 목표칸은 장애물이 아니다', () => {
    for (const lv of CODING_LEVELS) {
      const onObs = (p) => lv.obstacles.some((o) => o.x === p.x && o.y === p.y)
      expect(onObs(lv.start)).toBe(false)
      expect(onObs(lv.goal)).toBe(false)
    }
  })
})
