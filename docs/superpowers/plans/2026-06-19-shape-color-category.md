# 도형/색깔 카테고리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 통째 미구현 카테고리 `shape`(도형/색깔)를 6개 서브활동으로 구현하고, 도형 윤곽선 도안을 색칠놀이와 공유한다.

**Architecture:** `english` 카테고리가 `src/english.jsx`로 분리된 선례를 따라 신규 `src/shape.jsx`에 데이터·순수함수·활동·라우터를 담는다. 찾기/맞추기/분류는 공용 `PickActivity` 하나로, 배우기 2개는 공용 `BrowseActivity` 하나로 구현(DRY). 도형 그리기는 기존 `FreeColoringActivity`에 도형 윤곽선 도안을 추가해 재사용한다.

**Tech Stack:** React 18(`React.useState` 등 alias), Vite 5, SVG path(도형), Web Speech(`speakKo`), vitest.

설계: `docs/superpowers/specs/2026-06-19-shape-color-category-design.md`

## Global Constraints

- 신규 활동 파일은 `src/shape.jsx` 단일 파일. `activities.jsx`(5000줄+)는 디스패처 분기·도안만 추가.
- 공용 부품은 `activities.jsx`에서 import: `LevelStepper`, `useMultiPick`, `multiTargetOptions`, `PickMark`. 음성/효과음은 `./lib/audio.js`의 `speakKo`/`playSfx`. `VoiceGuide`는 `./shell.jsx`.
- 레벨 활동은 3레벨 + `LevelStepper`(◀▶, 항상 1레벨부터), 라운드 `questions`문제, 정답 `playSfx('correct')`·오답 `playSfx('wrong')`, 정답 시 `onComplete(1)`·완주 `onComplete(3)`.
- 도형 9: circle/triangle/square/star/heart(basic) · diamond/oval/trapezoid/pentagon(ext). 색 10: red/orange/yellow/green/blue/purple/pink/brown/black/white.
- `npm test` 전체 PASS, `npm run build` 무경고가 모든 커밋의 통과 조건.

---

## 브랜치 준비 (구현 시작 전 1회)

- [ ] 현재 작업 트리의 미커밋분(예: `vite.config.js`)을 임시 보관하고 `main`에서 새 브랜치를 만든다.

```bash
git stash push -u -m "wip-before-shape"   # 미커밋분 임시 보관(있으면)
git checkout main
git checkout -b feature/shape-color
git stash pop                              # vite.config 변경 등 되살리기(없으면 생략)
```
(주의: `git stash pop` 후 `vite.config.js`가 다시 보이면 그대로 두고 도형 작업과 무관하게 둔다. 충돌 없음.)

---

## Task 1: 색칠 도형 도안 9종 (색칠 연동)

도형 그리기와 색칠놀이가 공유할 도형 윤곽선 도안을 `COLORING_TEMPLATES`에 추가한다. 추가만으로 자유/영역 색칠에 "도형" 탭이 생기고, 도형 그리기는 이 도안을 쓴다.

**Files:**
- Modify: `src/activities.jsx` (`COLORING_CATEGORIES` line 22~28, `COLORING_TEMPLATES` line 31~, `COLORING_ORDER` line 383~389)

**Interfaces:**
- Produces: `COLORING_TEMPLATES`에 키 `circle/triangle/square/star/heart/diamond/oval/trapezoid/pentagon`(각 `{ name, emoji, viewBox:'0 0 400 400', category:'shape', parts:[{id:'shape', d}] }`). `COLORING_ORDER`에 동일 9키 append. `COLORING_CATEGORIES`에 `{ id:'shape', name:'도형', emoji:'▲' }`.

- [ ] **Step 1: 카테고리 탭에 '도형' 추가**

`src/activities.jsx`의 `COLORING_CATEGORIES`(line 22) 배열 끝에 추가:
```js
  { id: 'shape',     name: '도형',    emoji: '▲' },
```

- [ ] **Step 2: 도형 도안 9종 추가**

`COLORING_TEMPLATES` 객체(line 31 `const COLORING_TEMPLATES = {`) 안, 첫 항목 `cat:` **앞**에 추가:
```js
  circle:    { name: '동그라미', emoji: '●', viewBox: '0 0 400 400', category: 'shape',
    parts: [{ id: 'shape', d: 'M 200 200 m -150 0 a 150 150 0 1 0 300 0 a 150 150 0 1 0 -300 0' }] },
  triangle:  { name: '세모', emoji: '▲', viewBox: '0 0 400 400', category: 'shape',
    parts: [{ id: 'shape', d: 'M 200 60 L 350 330 L 50 330 Z' }] },
  square:    { name: '네모', emoji: '■', viewBox: '0 0 400 400', category: 'shape',
    parts: [{ id: 'shape', d: 'M 70 70 L 330 70 L 330 330 L 70 330 Z' }] },
  star:      { name: '별', emoji: '★', viewBox: '0 0 400 400', category: 'shape',
    parts: [{ id: 'shape', d: 'M 200 50 L 238 160 L 354 160 L 260 228 L 296 338 L 200 270 L 104 338 L 140 228 L 46 160 L 162 160 Z' }] },
  heart:     { name: '하트', emoji: '♥', viewBox: '0 0 400 400', category: 'shape',
    parts: [{ id: 'shape', d: 'M 200 340 C 120 270 50 210 50 140 C 50 95 90 70 130 70 C 165 70 190 95 200 120 C 210 95 235 70 270 70 C 310 70 350 95 350 140 C 350 210 280 270 200 340 Z' }] },
  diamond:   { name: '마름모', emoji: '◆', viewBox: '0 0 400 400', category: 'shape',
    parts: [{ id: 'shape', d: 'M 200 50 L 340 200 L 200 350 L 60 200 Z' }] },
  oval:      { name: '타원', emoji: '⬭', viewBox: '0 0 400 400', category: 'shape',
    parts: [{ id: 'shape', d: 'M 200 200 m -160 0 a 160 110 0 1 0 320 0 a 160 110 0 1 0 -320 0' }] },
  trapezoid: { name: '사다리꼴', emoji: '⏢', viewBox: '0 0 400 400', category: 'shape',
    parts: [{ id: 'shape', d: 'M 110 110 L 290 110 L 350 310 L 50 310 Z' }] },
  pentagon:  { name: '오각형', emoji: '⬠', viewBox: '0 0 400 400', category: 'shape',
    parts: [{ id: 'shape', d: 'M 200 60 L 343 164 L 288 332 L 112 332 L 57 164 Z' }] },
```

- [ ] **Step 3: 도안 순서에 9키 추가**

`COLORING_ORDER`(line 383) 배열의 첫 줄 `'cat', 'dog', ...` **앞**에 추가:
```js
  'circle', 'triangle', 'square', 'star', 'heart', 'diamond', 'oval', 'trapezoid', 'pentagon',
```

- [ ] **Step 4: 빌드 + 수동 검증**

Run: `npm run build` → SUCCESS, 무경고.
Run: `npm run dev` → 색칠놀이 > 자유 색칠 진입 → 카테고리 탭에 "▲ 도형"이 보이고, 누르면 동그라미~오각형 도안 9개가 윤곽선으로 뜬다. 윤곽선 안/밖 모두 자유롭게 그려진다.

- [ ] **Step 5: Commit**
```bash
git add src/activities.jsx
git commit -m "feat(shape): 색칠 도형 윤곽선 도안 9종 추가(자유/영역 색칠 공유)"
```

## Context
`FreeColoringActivity`/`ColoringActivity`는 `COLORING_ORDER`를 `category`로 필터해 탭을 구성하므로(`visibleIds`), 도안 추가만으로 자동 노출된다. `parts`가 1개면 영역 색칠은 도형 전체를 한 번에 채우고, 자유 색칠은 윤곽선 가이드로 쓴다.

---

## Task 2: 도형/색깔 데이터 + 순수함수 + 테스트

`src/shape.jsx`를 신규 생성하고 데이터·순수 라운드 빌더를 TDD로 작성한다.

**Files:**
- Create: `src/shape.jsx`
- Create: `src/__tests__/shape-logic.test.js`

**Interfaces:**
- Produces (export): `SHAPES`(9), `COLORS`(10), `SHAPE_OBJECTS`, `COLOR_OBJECTS`, `shapeFindLevelConfig(level)`, `colorSortLevelConfig(level)`, `buildShapeFindRound(cfg, shapes)→{answerId, options}`, `buildShapeMatchRound(cfg, shapeObjects, shapes)→{emoji, answerId, options}`, `buildColorSortRound(cfg, colorObjects, colors)→{targetColorId, items, targetKeys}`.

- [ ] **Step 1: 실패 테스트 작성**

Create `src/__tests__/shape-logic.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test` → FAIL (`src/shape.jsx` 없음).

- [ ] **Step 3: shape.jsx 데이터 + 순수함수 작성**

Create `src/shape.jsx`:
```jsx
// 도형/색깔 카테고리 — 데이터 + 순수함수 + 활동 + 라우터.
import React from 'react'
import { VoiceGuide } from './shell.jsx'
import { LevelStepper, useMultiPick, multiTargetOptions, PickMark } from './activities.jsx'
import { playSfx, speakKo } from './lib/audio.js'

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

// 피셔-예이츠 셔플(순수 출력)
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 도형 9종 — d(SVG path, viewBox 0 0 400 400)를 배우기 표시 + 색칠 윤곽선과 공유
export const SHAPES = [
  { id: 'circle',    name: '동그라미', tier: 'basic', d: 'M 200 200 m -150 0 a 150 150 0 1 0 300 0 a 150 150 0 1 0 -300 0', examples: ['🕐', '⚽', '🍩'] },
  { id: 'triangle',  name: '세모',     tier: 'basic', d: 'M 200 60 L 350 330 L 50 330 Z', examples: ['🍕', '⛰️'] },
  { id: 'square',    name: '네모',     tier: 'basic', d: 'M 70 70 L 330 70 L 330 330 L 70 330 Z', examples: ['📺', '🎁', '🪟'] },
  { id: 'star',      name: '별',       tier: 'basic', d: 'M 200 50 L 238 160 L 354 160 L 260 228 L 296 338 L 200 270 L 104 338 L 140 228 L 46 160 L 162 160 Z', examples: ['⭐'] },
  { id: 'heart',     name: '하트',     tier: 'basic', d: 'M 200 340 C 120 270 50 210 50 140 C 50 95 90 70 130 70 C 165 70 190 95 200 120 C 210 95 235 70 270 70 C 310 70 350 95 350 140 C 350 210 280 270 200 340 Z', examples: ['❤️'] },
  { id: 'diamond',   name: '마름모',   tier: 'ext',   d: 'M 200 50 L 340 200 L 200 350 L 60 200 Z', examples: ['💎', '🪁'] },
  { id: 'oval',      name: '타원',     tier: 'ext',   d: 'M 200 200 m -160 0 a 160 110 0 1 0 320 0 a 160 110 0 1 0 -320 0', examples: ['🥚', '🏉'] },
  { id: 'trapezoid', name: '사다리꼴', tier: 'ext',   d: 'M 110 110 L 290 110 L 350 310 L 50 310 Z', examples: ['👜'] },
  { id: 'pentagon',  name: '오각형',   tier: 'ext',   d: 'M 200 60 L 343 164 L 288 332 L 112 332 L 57 164 Z', examples: ['🏠'] },
];

// 색깔 10종(흰색은 칩 테두리로 구분)
export const COLORS = [
  { id: 'red',    name: '빨강', hex: '#E53935', examples: ['🍎', '🍓', '🌹'] },
  { id: 'orange', name: '주황', hex: '#FB8C00', examples: ['🍊', '🥕', '🦊'] },
  { id: 'yellow', name: '노랑', hex: '#FDD835', examples: ['🍌', '🌟', '🐤'] },
  { id: 'green',  name: '초록', hex: '#43A047', examples: ['🥦', '🌳', '🐸'] },
  { id: 'blue',   name: '파랑', hex: '#1E88E5', examples: ['🌊', '💧', '🐳'] },
  { id: 'purple', name: '보라', hex: '#8E24AA', examples: ['🍇', '🟣', '🔮'] },
  { id: 'pink',   name: '분홍', hex: '#EC407A', examples: ['🌸', '🎀', '🐷'] },
  { id: 'brown',  name: '갈색', hex: '#6D4C41', examples: ['🐻', '🍫', '🪵'] },
  { id: 'black',  name: '검정', hex: '#212121', examples: ['🐜', '🎩', '🌑'] },
  { id: 'white',  name: '흰색', hex: '#FFFFFF', examples: ['☁️', '🥛', '🦢'] },
];

// 사물→도형 / 사물→색 풀(맞추기·분류용). examples를 평탄화.
export const SHAPE_OBJECTS = SHAPES.flatMap((s) => s.examples.map((emoji) => ({ emoji, shapeId: s.id })));
export const COLOR_OBJECTS = COLORS.flatMap((c) => c.examples.map((emoji) => ({ emoji, colorId: c.id })));

// 레벨 설정
const SHAPE_LEVELS = [
  { options: 3, questions: 5, tiers: ['basic'] },
  { options: 4, questions: 5, tiers: ['basic'] },
  { options: 6, questions: 5, tiers: ['basic', 'ext'] },
];
export function shapeFindLevelConfig(level) {
  const i = Math.max(0, Math.min(SHAPE_LEVELS.length - 1, level));
  return SHAPE_LEVELS[i];
}
const COLOR_SORT_LEVELS = [
  { grid: 6, colors: 3, questions: 5 },
  { grid: 9, colors: 4, questions: 5 },
  { grid: 12, colors: 5, questions: 5 },
];
export function colorSortLevelConfig(level) {
  const i = Math.max(0, Math.min(COLOR_SORT_LEVELS.length - 1, level));
  return COLOR_SORT_LEVELS[i];
}

// 도형 찾기 라운드: 정답 1개 + 보기(정답 포함, 고유)
export function buildShapeFindRound(cfg, shapes) {
  const pool = shapes.filter((s) => cfg.tiers.includes(s.tier));
  const ids = pool.map((s) => s.id);
  const answer = pool[Math.floor(Math.random() * pool.length)];
  const options = multiTargetOptions([answer.id], cfg.options, ids);
  return { answerId: answer.id, options };
}

// 도형 맞추기 라운드: 사물 제시 → 그 사물의 도형이 정답
export function buildShapeMatchRound(cfg, shapeObjects, shapes) {
  const pool = shapes.filter((s) => cfg.tiers.includes(s.tier));
  const ids = pool.map((s) => s.id);
  const objs = shapeObjects.filter((o) => ids.includes(o.shapeId));
  const q = objs[Math.floor(Math.random() * objs.length)];
  const options = multiTargetOptions([q.shapeId], cfg.options, ids);
  return { emoji: q.emoji, answerId: q.shapeId, options };
}

// 색깔 분류 라운드: 타깃색 + 그리드. 그리드 내 타깃색 사물 전체가 정답셋(멀티선택).
export function buildColorSortRound(cfg, colorObjects, colors) {
  const colorIds = shuffle(colors.map((c) => c.id)).slice(0, cfg.colors);
  const targetColorId = colorIds[Math.floor(Math.random() * colorIds.length)];
  const inColors = colorObjects.filter((o) => colorIds.includes(o.colorId));
  const targetObjs = shuffle(inColors.filter((o) => o.colorId === targetColorId));
  const otherObjs = shuffle(inColors.filter((o) => o.colorId !== targetColorId));
  const chosenTargets = targetObjs.slice(0, Math.max(1, Math.min(targetObjs.length, cfg.grid - 1)));
  const need = cfg.grid - chosenTargets.length;
  const items = shuffle([...chosenTargets, ...otherObjs.slice(0, Math.max(0, need))]);
  const targetKeys = items.filter((o) => o.colorId === targetColorId).map((o) => o.emoji);
  return { targetColorId, items, targetKeys };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test` → PASS (신규 + 기존 모두).

- [ ] **Step 5: Commit**
```bash
git add src/shape.jsx src/__tests__/shape-logic.test.js
git commit -m "feat(shape): 도형/색깔 데이터 + 라운드 순수함수 + 테스트"
```

## Context
`multiTargetOptions(targetKeys, optionCount, poolKeys)`는 정답 포함·고유·`min(optionCount,pool)`개 셔플 보기를 반환(activities.jsx 기존 export). 색깔 분류는 보기 자체가 정답+방해 혼합 그리드라 `buildColorSortRound`가 `items`/`targetKeys`를 직접 만든다. 각 색은 examples≥1이라 `targetKeys`는 항상 1개 이상.

---

## Task 3: 배우기 — ShapeGlyph + BrowseActivity + 래퍼 2개

도형 배우기/색깔 배우기를 공용 `BrowseActivity`로 구현한다.

**Files:**
- Modify: `src/shape.jsx` (위 데이터 정의 **다음**에 추가)

**Interfaces:**
- Consumes: `SHAPES`, `COLORS`, `speakKo`, `playSfx`.
- Produces: `ShapeGlyph`(컴포넌트), `ShapeLearnActivity`, `ColorLearnActivity`(둘 다 `{tone, fontSize, onComplete, ...}` 받음).

- [ ] **Step 1: ShapeGlyph + NavBtn + BrowseActivity 추가**

`src/shape.jsx` 끝에 추가:
```jsx
// 도형 SVG 렌더(배우기 대형 + 보기 공용)
export function ShapeGlyph({ shape, size = 200, fill = 'none', stroke = '#333', strokeWidth = 10 }) {
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} style={{ display: 'block' }}>
      <path d={shape.d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// 좌우 이동 버튼
function NavBtn({ dir, tone, onClick }) {
  const t = tone;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  return (
    <button onClick={onClick} aria-label={dir === 'left' ? '이전' : '다음'}
      style={{ flex: '0 0 auto', width: 72, height: 72, borderRadius: 36, background: '#fff',
        border: accentBorder, cursor: 'pointer', fontSize: 30, fontFamily: 'inherit', color: t.text, boxShadow: t.shadowSm }}>
      {dir === 'left' ? '◀' : '▶'}
    </button>
  );
}

// 공용 배우기 — 대형 시각 + 이름 말풍선 + 🔊 + ◀▶ + ⭐ + 예시
function BrowseActivity({ tone, fontSize, onComplete, color, icon, title, items, renderBig, speak }) {
  const t = tone;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [idx, setIdx] = useStateA(0);
  const [collected, setCollected] = useStateA(() => new Set());
  const cur = items[idx];

  const learn = () => {
    speak(cur.name);
    playSfx('select');
    if (!collected.has(idx)) {
      const ns = new Set(collected); ns.add(idx); setCollected(ns);
      onComplete && onComplete(1);
    }
  };
  const next = () => setIdx((i) => (i + 1) % items.length);
  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>{icon}</span>{title}
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>Lv.1</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', minHeight: 0 }}>
        <NavBtn dir="left" tone={t} onClick={prev} />
        <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, minWidth: 0 }}>
          <button onClick={learn}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }], { duration: 150 })}
            style={{ position: 'relative', width: 300, height: 300, background: '#fff', border: accentBorder,
              borderRadius: t.cardRadius + 12, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden' }}>
            {renderBig(cur, t, color)}
            {collected.has(idx) && <span style={{ position: 'absolute', top: 14, right: 18, fontSize: 44 }}>⭐</span>}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ background: '#fff', border: accentBorder, borderRadius: 28, padding: '20px 28px',
              fontSize: 56, fontWeight: 900, lineHeight: 1, color: t.text, boxShadow: t.shadow, whiteSpace: 'nowrap' }}>{cur.name}!</div>
            <button onClick={learn}
              style={{ background: t.accent, color: t.text, border: t.outline === 'none' ? 'none' : t.outline,
                borderRadius: 36, padding: '14px 24px', fontSize: fontSize + 4, fontWeight: 900, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: 10, height: 64 }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>🔊</span>들어보기
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              {cur.examples.map((e, i) => (<span key={i} style={{ fontSize: 48, lineHeight: 1 }}>{e}</span>))}
            </div>
          </div>
        </div>
        <NavBtn dir="right" tone={t} onClick={next} />
      </div>
    </div>
  );
}

function ShapeLearnActivity(p) {
  return (
    <BrowseActivity {...p} color={p.tone.cat.shape} icon="▲" title="도형 배우기" items={SHAPES} speak={speakKo}
      renderBig={(s, t, color) => <ShapeGlyph shape={s} size={240} fill={color} stroke={t.text} strokeWidth={8} />} />
  );
}
function ColorLearnActivity(p) {
  return (
    <BrowseActivity {...p} color={p.tone.cat.shape} icon="🌈" title="색깔 배우기" items={COLORS} speak={speakKo}
      renderBig={(c, t) => <div style={{ width: 240, height: 240, borderRadius: 32, background: c.hex, border: `4px solid ${t.text}` }} />} />
  );
}
```

- [ ] **Step 2: 빌드 + 테스트**

Run: `npm test` → PASS(기존 유지). `npm run build` → SUCCESS, 무경고.
(컴포넌트는 아직 라우터에 연결 전 — Task 5에서 진입 확인.)

- [ ] **Step 3: Commit**
```bash
git add src/shape.jsx
git commit -m "feat(shape): ShapeGlyph + 공용 BrowseActivity(도형/색깔 배우기)"
```

## Context
`BrowseActivity`는 `HangulActivity`(자음/모음 익히기) 패턴을 일반화 — 큰 카드 탭 시 `speak(name)`+⭐, ◀▶ 순회, 예시 사물. `renderBig`로 도형(SVG)/색(칩)을 주입. `p`에는 `onFinish`/`voiceShow`도 들어오지만 배우기는 무시.

---

## Task 4: 찾기/맞추기/분류 — 공용 PickActivity + 래퍼 3개

**Files:**
- Modify: `src/shape.jsx` (Task 3 코드 **다음**에 추가)

**Interfaces:**
- Consumes: `useMultiPick`, `multiTargetOptions`, `PickMark`, `LevelStepper`, `VoiceGuide`, 데이터·라운드 빌더(Task 2), `ShapeGlyph`(Task 3).
- Produces: `ShapeFindActivity`, `ShapeMatchActivity`, `ColorSortActivity`.

- [ ] **Step 1: PickActivity + 래퍼 3개 추가**

`src/shape.jsx` 끝에 추가:
```jsx
// 공용 보기-선택 게임(찾기/맞추기/분류). buildRound→{targetKeys, optionKeys, prompt}.
function PickActivity({ tone, fontSize, onComplete, onFinish, voiceShow,
  color, icon, title, levelsLength, levelConfig, buildRound, renderPrompt, renderOption, speakPrompt, guideText }) {
  const t = tone;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [levelIdx, setLevelIdx] = useStateA(0);
  const cfg = levelConfig(levelIdx);
  const newRound = () => buildRound(levelConfig(levelIdx));
  const [round, setRound] = useStateA(() => buildRound(levelConfig(0)));
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const mp = useMultiPick();
  const timersRef = useRefA([]);
  const addTimer = (id) => timersRef.current.push(id);
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  useEffectA(() => {
    timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = [];
    setProgress(0); setDone(false); setRound(newRound()); mp.reset();
  }, [levelIdx]);

  useEffectA(() => {
    addTimer(setTimeout(() => speakPrompt(round.prompt), 350));
  }, [round]);

  const multi = round.targetKeys.length > 1;

  const onPick = (key) => {
    if (done) return;
    const r = mp.pick(key, round.targetKeys);
    if (r === 'wrong') playSfx('wrong');
    else if (r === 'correct') playSfx('correct');
    else if (r === 'complete') {
      playSfx('correct');
      onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      addTimer(setTimeout(() => {
        if (n >= cfg.questions) { setDone(true); onComplete && onComplete(3); }
        else { timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = []; setRound(newRound()); mp.reset(); }
      }, 850));
    }
  };
  const restart = () => { setProgress(0); setDone(false); setRound(newRound()); mp.reset(); };
  const nextLevel = () => { if (levelIdx < levelsLength - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };
  const cols = Math.min(round.optionKeys.length, 6);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>{icon}</span>{title}
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>Lv.{levelIdx + 1}</span>
        </div>
        <LevelStepper tone={t} cur={levelIdx} total={levelsLength} onPrev={prevLevel} onNext={nextLevel} />
      </div>

      {!done ? (
        <React.Fragment>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '0 32px' }}>
            {renderPrompt(round.prompt, t, color, fontSize, () => speakPrompt(round.prompt))}
          </div>
          <div style={{ flex: '0 0 auto', padding: '14px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 14 }}>
            {round.optionKeys.map((key) => {
              const isRight = mp.found.includes(key);
              const isWrong = mp.wrongKey === key;
              return (
                <button key={key} onClick={() => onPick(key)} disabled={isRight}
                  onPointerDown={(e) => !isRight && e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ position: 'relative', height: 104, fontFamily: 'inherit', cursor: isRight ? 'default' : 'pointer',
                    background: isRight ? t.cat.code : '#fff', border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline,
                    borderRadius: t.cardRadius, boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: isWrong ? 'kw-shake 0.4s ease' : 'none' }}>
                  {renderOption(key, t, color)}
                  {isRight && <PickMark kind="right" />}
                  {isWrong && <PickMark kind="wrong" />}
                </button>
              );
            })}
          </div>
          <div style={{ flex: '0 0 auto', padding: '12px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {Array.from({ length: cfg.questions }).map((_, i) => (
                <span key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i < progress ? color : '#fff',
                  border: i < progress ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{cfg.questions}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>{levelIdx < levelsLength - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accentBorder, borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < levelsLength - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : guideText(round.prompt, multi)} fontSize={fontSize - 4} />
    </div>
  );
}

const shapeById = (id) => SHAPES.find((s) => s.id === id);
const colorById = (id) => COLORS.find((c) => c.id === id);

function ShapeFindActivity(p) {
  return (
    <PickActivity {...p} color={p.tone.cat.shape} icon="🔍" title="도형 찾기" levelsLength={3}
      levelConfig={shapeFindLevelConfig}
      buildRound={(cfg) => { const r = buildShapeFindRound(cfg, SHAPES); return { targetKeys: [r.answerId], optionKeys: r.options, prompt: { shapeId: r.answerId } }; }}
      speakPrompt={(pr) => speakKo(shapeById(pr.shapeId).name)}
      renderPrompt={(pr, t, color, fontSize, onSpeak) => (
        <button onClick={onSpeak}
          style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: t.outline === 'none' ? `3px solid ${t.text}` : t.outline,
            borderRadius: 28, padding: '18px 34px', boxShadow: t.shadow, cursor: 'pointer', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 30 }}>🔊</span>
          <span style={{ fontSize: fontSize + 24, fontWeight: 900, color: t.text }}>{shapeById(pr.shapeId).name} 찾기</span>
        </button>
      )}
      renderOption={(id, t, color) => <ShapeGlyph shape={shapeById(id)} size={80} fill={color} stroke={t.text} strokeWidth={10} />}
      guideText={() => '맞는 도형을 골라봐'} />
  );
}

function ShapeMatchActivity(p) {
  return (
    <PickActivity {...p} color={p.tone.cat.shape} icon="🧩" title="도형 맞추기" levelsLength={3}
      levelConfig={shapeFindLevelConfig}
      buildRound={(cfg) => { const r = buildShapeMatchRound(cfg, SHAPE_OBJECTS, SHAPES); return { targetKeys: [r.answerId], optionKeys: r.options, prompt: { emoji: r.emoji } }; }}
      speakPrompt={() => speakKo('무슨 도형일까요')}
      renderPrompt={(pr, t, color, fontSize) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 150, lineHeight: 1 }}>{pr.emoji}</div>
          <div style={{ fontSize: fontSize + 18, fontWeight: 900, color: t.text }}>무슨 도형일까?</div>
        </div>
      )}
      renderOption={(id, t, color) => <ShapeGlyph shape={shapeById(id)} size={80} fill={color} stroke={t.text} strokeWidth={10} />}
      guideText={() => '사물의 도형을 골라봐'} />
  );
}

function ColorSortActivity(p) {
  return (
    <PickActivity {...p} color={p.tone.cat.shape} icon="🗂️" title="색깔 분류" levelsLength={3}
      levelConfig={colorSortLevelConfig}
      buildRound={(cfg) => { const r = buildColorSortRound(cfg, COLOR_OBJECTS, COLORS); return { targetKeys: r.targetKeys, optionKeys: r.items.map((o) => o.emoji), prompt: { colorId: r.targetColorId } }; }}
      speakPrompt={(pr) => speakKo(colorById(pr.colorId).name + ' 모으기')}
      renderPrompt={(pr, t, color, fontSize) => { const c = colorById(pr.colorId); return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 110, height: 110, borderRadius: 24, background: c.hex, border: `4px solid ${t.text}` }} />
          <div style={{ fontSize: fontSize + 18, fontWeight: 900, color: t.text }}>{c.name} 모으기</div>
        </div>
      ); }}
      renderOption={(emoji) => <span style={{ fontSize: 52, lineHeight: 1 }}>{emoji}</span>}
      guideText={() => '같은 색 물건을 모두 골라봐'} />
  );
}
```

- [ ] **Step 2: 빌드 + 테스트**

Run: `npm test` → PASS(기존 유지). `npm run build` → SUCCESS, 무경고.

- [ ] **Step 3: Commit**
```bash
git add src/shape.jsx
git commit -m "feat(shape): 공용 PickActivity(도형 찾기/맞추기·색깔 분류)"
```

## Context
`PickActivity`는 `WordMatchActivity` 패턴(테마 picker 제거)을 일반화. 단일/멀티 정답은 `targetKeys.length`로 자동 결정(`useMultiPick`). 찾기/맞추기는 도형 SVG 보기, 분류는 이모지 그리드 멀티선택. 색깔 분류 Lv3은 보기 12개(2행×6열).

---

## Task 5: 라우터 + 배선 (디스패처·테마·서브메뉴·도형 그리기)

**Files:**
- Modify: `src/shape.jsx` (라우터 `ShapeActivity` export 추가)
- Modify: `src/activities.jsx` (import + 디스패처 분기)
- Modify: `src/themes.jsx` (line 10 플래그)
- Modify: `src/shell.jsx` (`SUBMENUS.shape` 추가)

**Interfaces:**
- Consumes: Task 3·4 컴포넌트, 디스패처에서 `FreeColoringActivity`(activities.jsx 내 정의).
- Produces: `export function ShapeActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow })`.

- [ ] **Step 1: ShapeActivity 라우터 (shape.jsx)**

`src/shape.jsx` 끝에 추가:
```jsx
// 서브활동 라우터(shape-draw는 activities.jsx 디스패처가 FreeColoringActivity로 처리).
export function ShapeActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const p = { tone, fontSize, onComplete, onFinish, voiceShow };
  if (subId === 'shape-find') return <ShapeFindActivity {...p} />;
  if (subId === 'shape-match') return <ShapeMatchActivity {...p} />;
  if (subId === 'color-learn') return <ColorLearnActivity {...p} />;
  if (subId === 'color-sort') return <ColorSortActivity {...p} />;
  return <ShapeLearnActivity {...p} />; // 'shape-learn' 기본
}
```

- [ ] **Step 2: 디스패처 분기 (activities.jsx)**

`src/activities.jsx` 상단에서 기존 `import { EnglishActivity } from './english.jsx'` 옆에 추가:
```jsx
import { ShapeActivity } from './shape.jsx'
```
`function Activity`(line 5055~)의 `if (cat.id === 'english') ...` **앞**에 추가:
```jsx
  if (cat.id === 'shape') {
    if (sub?.id === 'shape-draw') return <FreeColoringActivity tone={tone} subId="circle" fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
    return <ShapeActivity tone={tone} subId={sub?.id || 'shape-learn'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
  }
```

- [ ] **Step 3: 테마 플래그 (themes.jsx)**

`src/themes.jsx` line 10을 교체:
```jsx
  { id: 'shape',   name: '도형',     emoji: '◆●▲', iconKind: 'text', hasSub: true,  done: true },
```

- [ ] **Step 4: 서브메뉴 (shell.jsx)**

`src/shell.jsx`의 `SUBMENUS` 객체에서 `english: { ... }` 블록 **다음**(닫는 `};` 앞)에 추가:
```jsx
  shape: {
    title: '도형이랑 색깔 놀이',
    items: [
      { id: 'shape-learn', name: '도형 배우기', emoji: '▲',  sub: '9종' },
      { id: 'shape-find',  name: '도형 찾기',   emoji: '🔍', sub: 'Lv.3' },
      { id: 'shape-match', name: '도형 맞추기', emoji: '🧩', sub: 'Lv.3' },
      { id: 'color-learn', name: '색깔 배우기', emoji: '🌈', sub: '10색' },
      { id: 'color-sort',  name: '색깔 분류',   emoji: '🗂️', sub: 'Lv.3' },
      { id: 'shape-draw',  name: '도형 그리기', emoji: '🖍️', sub: '🎨' },
    ],
  },
```

- [ ] **Step 5: 빌드 + 테스트 + 수동 검증**

Run: `npm test` → PASS. `npm run build` → SUCCESS, 무경고.
Run: `npm run dev` → 홈에서 **도형** 카테고리가 활성(준비중 아님). 진입 시 6개 서브메뉴.
- 도형 배우기: 9종 ◀▶ 순회, 탭 시 이름 음성+⭐, 예시 사물.
- 도형 찾기: "○○ 찾기" 음성+글자 → 도형 보기 선택, ✓/✗, 5문제, ◀▶ 레벨 1→3.
- 도형 맞추기: 사물 이모지 → 도형 보기 선택.
- 색깔 배우기: 10색 ◀▶, 색칩+이름+음성.
- 색깔 분류: "○○ 모으기" → 같은 색 사물 멀티선택(✓ 누적), 완성 시 다음.
- 도형 그리기: 자유 캔버스에 동그라미 윤곽선, 도형 탭으로 9종 전환, 안팎 자유 그리기.

- [ ] **Step 6: Commit**
```bash
git add src/shape.jsx src/activities.jsx src/themes.jsx src/shell.jsx
git commit -m "feat(shape): 라우터+디스패처+서브메뉴+테마 배선(도형 그리기 색칠 연동)"
```

## Context
`english`와 동일하게 activities.jsx↔shape.jsx 순환 import이나, 사용이 렌더 시점(함수 호출)이라 ES 모듈에서 안전. `shape-draw`는 라우터가 아닌 디스패처에서 `FreeColoringActivity`(activities.jsx 스코프)로 처리. 도형 카테고리 색은 `tone.cat.shape`(세 톤 모두 정의됨).

---

## 마무리 검증
- [ ] `npm test` 전체 PASS, `npm run build` 무경고.
- [ ] 도형 6개 서브활동 전부 동작(배우기·찾기·맞추기·분류·그리기), 레벨 1→3·항상 1레벨 시작.
- [ ] 색칠놀이(자유/영역)에 도형 탭 9종 노출, 도형 그리기와 동일 도안 공유.
- [ ] 설계 대조: 데이터(도형9·색10)·6활동·색칠 연동·음성/피드백 전부 구현.

후속: 컴퓨터 익히기 카테고리(다음 순서) → 놀이마을(소셜). 각각 별도 설계.
