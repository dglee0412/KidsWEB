import { describe, it, expect } from 'vitest'
import { resolveMove, isSolvable, CODING_LEVELS, CODING_GRID } from '../activities.jsx'
import { nextFollowState } from '../activities.jsx'
import { memoryLevelConfig } from '../activities.jsx'
import { shadowLevelConfig } from '../activities.jsx'

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
  it('위/아래 격자 밖이면 제자리 + blocked=true', () => {
    expect(resolveMove({ x: 0, y: 0 }, 'up', 5, [])).toEqual({ x: 0, y: 0, blocked: true })
    expect(resolveMove({ x: 4, y: 4 }, 'down', 5, [])).toEqual({ x: 4, y: 4, blocked: true })
  })
  it('알 수 없는 방향이면 제자리 + blocked=true', () => {
    expect(resolveMove({ x: 2, y: 2 }, 'diagonal', 5, [])).toEqual({ x: 2, y: 2, blocked: true })
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

describe('nextFollowState', () => {
  const pat = ['C', 'D', 'E']
  it('맞는 입력이면 step 증가 + ok', () => {
    expect(nextFollowState(pat, 0, 'C')).toEqual({ step: 1, result: 'ok' })
  })
  it('마지막 입력이 맞으면 done', () => {
    expect(nextFollowState(pat, 2, 'E')).toEqual({ step: 3, result: 'done' })
  })
  it('틀리면 step 유지 + wrong', () => {
    expect(nextFollowState(pat, 1, 'C')).toEqual({ step: 1, result: 'wrong' })
  })
})

describe('memoryLevelConfig', () => {
  it('Lv1=6쌍 4열, Lv2=8쌍 4열, Lv3=10쌍 5열', () => {
    expect(memoryLevelConfig(0)).toEqual({ pairs: 6, cols: 4 })
    expect(memoryLevelConfig(1)).toEqual({ pairs: 8, cols: 4 })
    expect(memoryLevelConfig(2)).toEqual({ pairs: 10, cols: 5 })
  })
  it('범위를 벗어나면 마지막 레벨로 클램프', () => {
    expect(memoryLevelConfig(9)).toEqual({ pairs: 10, cols: 5 })
  })
})

describe('shadowLevelConfig', () => {
  it('레벨별 보기수/문제수', () => {
    expect(shadowLevelConfig(0)).toEqual({ options: 4, questions: 6 })
    expect(shadowLevelConfig(1)).toEqual({ options: 4, questions: 8 })
    expect(shadowLevelConfig(2)).toEqual({ options: 6, questions: 10 })
  })
  it('범위를 벗어나면 마지막 레벨로 클램프', () => {
    expect(shadowLevelConfig(5)).toEqual({ options: 6, questions: 10 })
  })
})
