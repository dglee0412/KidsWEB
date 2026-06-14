import { describe, it, expect } from 'vitest'
import { resolveMove, isSolvable, CODING_LEVELS, CODING_GRID } from '../activities.jsx'
import { nextFollowState } from '../activities.jsx'
import { memoryLevelConfig } from '../activities.jsx'
import { shadowLevelConfig } from '../activities.jsx'
import { mathOptions } from '../activities.jsx'

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

describe('memoryLevelConfig(5레벨)', () => {
  it('레벨별 group/count/cols', () => {
    expect(memoryLevelConfig(0)).toEqual({ group: 2, count: 6,  cols: 4 })
    expect(memoryLevelConfig(3)).toEqual({ group: 3, count: 4,  cols: 4 })
    expect(memoryLevelConfig(4)).toEqual({ group: 3, count: 6,  cols: 6 })
    expect(memoryLevelConfig(9)).toEqual({ group: 3, count: 6,  cols: 6 })
  })
})

describe('shadowLevelConfig', () => {
  it('레벨별 보기수/문제수', () => {
    expect(shadowLevelConfig(0)).toEqual({ targets: 1, options: 4, questions: 6 })
    expect(shadowLevelConfig(1)).toEqual({ targets: 1, options: 4, questions: 8 })
    expect(shadowLevelConfig(2)).toEqual({ targets: 1, options: 6, questions: 10 })
  })
  it('범위를 벗어나면 마지막 레벨로 클램프', () => {
    expect(shadowLevelConfig(9)).toEqual({ targets: 3, options: 8, questions: 10 })
  })
})

describe('mathOptions', () => {
  const allDistinct = (a) => new Set(a).size === a.length
  it('경계 타깃 포함 모든 값에서 정답 포함 고유 보기 4개를 만든다(무한루프 방지)', () => {
    for (const maxN of [5, 10, 20]) {
      for (let target = 1; target <= maxN; target++) {
        const opts = mathOptions(target, maxN)
        expect(opts).toHaveLength(4)
        expect(allDistinct(opts)).toBe(true)
        expect(opts).toContain(target)
        for (const o of opts) {
          expect(o).toBeGreaterThanOrEqual(1)
          expect(o).toBeLessThanOrEqual(maxN)
        }
      }
    }
  })
})

import { multiPickNext, multiTargetOptions } from '../activities.jsx'

describe('multiPickNext', () => {
  it('맞는 키 첫 선택 → correct', () => {
    expect(multiPickNext([], 'a', ['a','b'])).toEqual({ found: ['a'], result: 'correct' })
  })
  it('마지막 타깃 선택 → complete', () => {
    expect(multiPickNext(['a'], 'b', ['a','b'])).toEqual({ found: ['a','b'], result: 'complete' })
  })
  it('이미 고른 키 → already(변화 없음)', () => {
    expect(multiPickNext(['a'], 'a', ['a','b'])).toEqual({ found: ['a'], result: 'already' })
  })
  it('틀린 키 → wrong(변화 없음)', () => {
    expect(multiPickNext(['a'], 'z', ['a','b'])).toEqual({ found: ['a'], result: 'wrong' })
  })
})

describe('multiTargetOptions', () => {
  const distinct = (a) => new Set(a).size === a.length
  const pool = ['a','b','c','d','e','f','g','h']
  it('정답 전부 포함 + 고유 + 길이=min(optionCount,pool)', () => {
    for (const targets of [['a'], ['a','b'], ['a','b','c']]) {
      for (const oc of [4, 6, 8]) {
        const r = multiTargetOptions(targets, oc, pool)
        expect(r).toHaveLength(Math.min(oc, pool.length))
        expect(distinct(r)).toBe(true)
        for (const tk of targets) expect(r).toContain(tk)
      }
    }
  })
})

import { hangulWordLevelConfig } from '../activities.jsx'

describe('shadowLevelConfig(5레벨)', () => {
  it('상위 레벨 멀티타깃', () => {
    expect(shadowLevelConfig(0)).toEqual({ targets: 1, options: 4, questions: 6 })
    expect(shadowLevelConfig(3)).toEqual({ targets: 2, options: 6, questions: 8 })
    expect(shadowLevelConfig(4)).toEqual({ targets: 3, options: 8, questions: 10 })
  })
})
describe('hangulWordLevelConfig(5레벨, 풀 클램프)', () => {
  it('targets/options/questions, options는 풀 크기 이하', () => {
    const c0 = hangulWordLevelConfig(0)
    expect(c0.targets).toBe(1)
    expect(c0.questions).toBe(8)
    for (let lv = 0; lv < 5; lv++) {
      const c = hangulWordLevelConfig(lv)
      expect(c.options).toBeGreaterThanOrEqual(c.targets + 1)
    }
  })
})
