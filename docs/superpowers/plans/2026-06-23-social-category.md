# 놀이마을(소셜) 카테고리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 통째 미구현 카테고리 `social`(놀이마을)을 3개 서브활동(메신저 놀이·역할놀이·꾸미기)으로 구현한다.

**Architecture:** `english`/`shape` 선례대로 신규 `src/social.jsx`에 데이터·순수함수·3개 활동·라우터를 담는다. 메신저/역할놀이는 보기-선택(`useMultiPick` 단일타깃) 패턴, 꾸미기는 스티커 드래그 + 캔버스 PNG 합성 저장(기존 갤러리 'free' 형식 재사용, shell.jsx 무수정)으로 자족 구현한다.

**Tech Stack:** React 18(`React.useState` 등 alias), Vite 5, Pointer Events + Canvas 2D(꾸미기 저장), Web Speech(`speakKo`), vitest.

설계: `docs/superpowers/specs/2026-06-23-social-category-design.md`

## Global Constraints

- 신규 활동은 `src/social.jsx` 단일 파일. `activities.jsx`는 디스패처 분기 + import만 추가, 그 외 무수정.
- 공용 부품 import: `activities.jsx`에서 `LevelStepper`, `useMultiPick`, `multiTargetOptions`, `PickMark`; `shell.jsx`에서 `VoiceGuide`; `lib/audio.js`에서 `playSfx`, `speakKo`.
- 음성 `speakKo`, 정답 `playSfx('correct')`·오답 `playSfx('wrong')`, ⭐ 적립 `onComplete(1)`(라운드/스텝)·`onComplete(3)`(완주).
- 메신저: 3레벨 `LevelStepper`(◀▶, 항상 1레벨부터), 라운드 5문항. 역할놀이: 직업 6개를 ◀▶로 순회(진행 비저장). 꾸미기: 자유(레벨/정답 없음), 저장은 `kw-gallery`에 `{type:'free', png, savedAt}`.
- 직업 6: 의사·요리사·소방관·경찰·수의사·화가. 각 3~4 step.
- `npm test` 전체 PASS, `npm run build` 무경고가 모든 커밋의 통과 조건.
- 브랜치는 이미 `feature/social-category`(main에서 분기, 설계 커밋 `4d9e96f` 포함). 추가 브랜치 생성 불필요.

---

## Task 1: 데이터 + 순수함수 + 테스트

`src/social.jsx`를 신규 생성하고 데이터·순수 라운드 빌더를 TDD로 작성한다.

**Files:**
- Create: `src/social.jsx`
- Create: `src/__tests__/social-logic.test.js`

**Interfaces:**
- Produces (export): `MESSENGER_LEVELS`, `ROLES`, `SCENES`, `DECORATE_STICKERS`, `FRAMES`, `MESSENGER_QUESTIONS`(=5), `shuffle`, `buildMessengerRound(level, levels)→{ask,options,answer}`, `buildRoleStepOptions(step)→{tool,options}`.
- Imports (file top): `React`, `VoiceGuide`(shell), `LevelStepper`/`useMultiPick`/`PickMark`(activities), `playSfx`/`speakKo`(audio). 전부 Task 2~4가 소비(Task 4 종료 시 미사용 0). `multiTargetOptions`는 불필요(메신저/역할이 자체 빌더 사용) — import하지 않는다.

- [ ] **Step 1: 실패 테스트 작성**

Create `src/__tests__/social-logic.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test` → FAIL (`src/social.jsx` 없음).

- [ ] **Step 3: social.jsx 데이터 + 순수함수 작성**

Create `src/social.jsx`:
```jsx
// 놀이마을(소셜) 카테고리 — 데이터 + 순수함수 + 활동 + 라우터.
import React from 'react'
import { VoiceGuide } from './shell.jsx'
import { LevelStepper, useMultiPick, PickMark } from './activities.jsx'
import { playSfx, speakKo } from './lib/audio.js'

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

export const MESSENGER_QUESTIONS = 5;

// 피셔-예이츠 셔플(순수 출력)
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 메신저 — 상황 질문 + 보기 이모티콘 + 정답. 레벨별 풀.
export const MESSENGER_LEVELS = [
  [
    { ask: '안녕! 만나서 반가워', options: ['👋', '😴', '🍎'], answer: '👋' },
    { ask: '나는 기분이 좋아. 너는?', options: ['😄', '😢', '😡'], answer: '😄' },
    { ask: '고마워!', options: ['😊', '😠', '😱'], answer: '😊' },
    { ask: '잘 가, 또 만나!', options: ['👋', '🍌', '⚽'], answer: '👋' },
  ],
  [
    { ask: '배고프지 않아? 뭐 먹을까?', options: ['🍎', '😴', '👟', '🎵'], answer: '🍎' },
    { ask: '나 오늘 슬퍼…', options: ['🤗', '😡', '🎉', '🍕'], answer: '🤗' },
    { ask: '우리 같이 놀자!', options: ['⚽', '😴', '🚽', '📕'], answer: '⚽' },
    { ask: '생일 축하해!', options: ['🎂', '🧦', '🔧', '🥦'], answer: '🎂' },
  ],
  [
    { ask: '비가 와! 뭘 가져갈까?', options: ['☂️', '🕶️', '🍦', '🪀'], answer: '☂️' },
    { ask: '졸려… 이제 뭐 할까?', options: ['😴', '🏃', '🎺', '🍭'], answer: '😴' },
    { ask: '손이 더러워. 어떻게 하지?', options: ['🧼', '🍫', '📺', '🎈'], answer: '🧼' },
    { ask: '추워! 뭘 입을까?', options: ['🧥', '🩳', '🕶️', '🩴'], answer: '🧥' },
  ],
];

// 역할놀이 — 6직업, 각 3~4 step(정답 도구 + 방해 도구).
export const ROLES = [
  { id: 'doctor', name: '의사', emoji: '👩‍⚕️', steps: [
    { prompt: '열을 재요', tool: '🌡️', distractors: ['🍴', '🎨'] },
    { prompt: '약을 줘요', tool: '💊', distractors: ['🧯', '🚓'] },
    { prompt: '밴드를 붙여요', tool: '🩹', distractors: ['🖌️', '🐶'] },
  ] },
  { id: 'cook', name: '요리사', emoji: '👨‍🍳', steps: [
    { prompt: '재료를 잘라요', tool: '🔪', distractors: ['💊', '🚒'] },
    { prompt: '냄비에 끓여요', tool: '🍲', distractors: ['🎨', '🩹'] },
    { prompt: '접시에 담아요', tool: '🍽️', distractors: ['🌡️', '🚓'] },
  ] },
  { id: 'firefighter', name: '소방관', emoji: '👨‍🚒', steps: [
    { prompt: '소방차를 타요', tool: '🚒', distractors: ['🍽️', '🎨'] },
    { prompt: '물을 뿌려요', tool: '💧', distractors: ['💊', '🔪'] },
    { prompt: '불을 꺼요', tool: '🧯', distractors: ['🩹', '🐶'] },
  ] },
  { id: 'police', name: '경찰', emoji: '👮', steps: [
    { prompt: '호루라기를 불어요', tool: '🪈', distractors: ['🍲', '🌡️'] },
    { prompt: '경찰차를 타요', tool: '🚓', distractors: ['🧯', '🎨'] },
    { prompt: '길을 안내해요', tool: '🚦', distractors: ['💊', '🍽️'] },
  ] },
  { id: 'vet', name: '수의사', emoji: '🧑‍⚕️', steps: [
    { prompt: '강아지를 살펴봐요', tool: '🐶', distractors: ['🚒', '🔪'] },
    { prompt: '청진기로 들어요', tool: '🩺', distractors: ['🎨', '🚦'] },
    { prompt: '주사를 놔요', tool: '💉', distractors: ['🍲', '🪈'] },
  ] },
  { id: 'painter', name: '화가', emoji: '🧑‍🎨', steps: [
    { prompt: '도화지를 펴요', tool: '📄', distractors: ['🚒', '🩺'] },
    { prompt: '붓을 들어요', tool: '🖌️', distractors: ['💉', '🚓'] },
    { prompt: '색을 칠해요', tool: '🎨', distractors: ['🧯', '🌡️'] },
  ] },
];

// 꾸미기 — 장면 배경(2색 그라데이션), 스티커, 프레임.
export const SCENES = [
  { id: 'birthday', name: '생일파티', c1: '#FFE3F1', c2: '#FFC2DE' },
  { id: 'sea',      name: '바다',     c1: '#BFEAFF', c2: '#5EC8F0' },
  { id: 'space',    name: '우주',     c1: '#3A2E6E', c2: '#1A1340' },
  { id: 'park',     name: '공원',     c1: '#DDF6C8', c2: '#A7E08A' },
];
export const DECORATE_STICKERS = ['⭐', '❤️', '🌈', '🌸', '🦋', '🎈', '🎀', '🐶', '🐱', '🍰', '🚀', '🌙'];
export const FRAMES = [
  { id: 'none',  name: '없음',   color: '#00000000', width: 0 },
  { id: 'pink',  name: '분홍',   color: '#EC407A', width: 16 },
  { id: 'gold',  name: '금색',   color: '#F0B429', width: 16 },
  { id: 'blue',  name: '파랑',   color: '#1E88E5', width: 16 },
];

// 메신저 라운드: 레벨 풀에서 랜덤 질문 → 보기 셔플(정답 포함).
export function buildMessengerRound(level, levels) {
  const i = Math.max(0, Math.min(levels.length - 1, level));
  const pool = levels[i];
  const q = pool[Math.floor(Math.random() * pool.length)];
  return { ask: q.ask, options: shuffle(q.options), answer: q.answer };
}

// 역할 스텝 보기: 정답 도구 + 방해 도구 셔플(고유).
export function buildRoleStepOptions(step) {
  return { tool: step.tool, options: shuffle([step.tool, ...step.distractors]) };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test` → PASS(신규 + 기존). 

- [ ] **Step 5: Commit**
```bash
git add src/social.jsx src/__tests__/social-logic.test.js
git commit -m "feat(social): 메신저/역할/꾸미기 데이터 + 순수함수 + 테스트"
```

## Context
메신저 질문이 이미 options를 가지므로 `buildMessengerRound`는 정답 포함 셔플만 한다(별도 distractor 생성 불필요). 파일 상단 import(`VoiceGuide/LevelStepper/useMultiPick/PickMark/playSfx/speakKo/React`)는 Task 2~4가 같은 파일에 append하며 전부 소비한다(Task 4 종료 시 미사용 0).

---

## Task 2: MessengerActivity (메신저 놀이)

**Files:** Modify `src/social.jsx` (Task 1 정의 **다음**에 append)

**Interfaces:**
- Consumes: `MESSENGER_LEVELS`, `MESSENGER_QUESTIONS`, `buildMessengerRound`, `useMultiPick`, `PickMark`, `LevelStepper`, `VoiceGuide`, `playSfx`, `speakKo`.
- Produces: `MessengerActivity({ tone, fontSize, onComplete, onFinish, voiceShow })`.

- [ ] **Step 1: 컴포넌트 append**

`src/social.jsx` 끝에 추가:
```jsx
function MessengerActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.social;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [levelIdx, setLevelIdx] = useStateA(0);
  const [round, setRound] = useStateA(() => buildMessengerRound(0, MESSENGER_LEVELS));
  const [chat, setChat] = useStateA([]);            // [{ who:'them'|'me', text?, emoji? }]
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const mp = useMultiPick();
  const timersRef = useRefA([]);
  const addTimer = (id) => timersRef.current.push(id);
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  const startRound = (lvl) => {
    const r = buildMessengerRound(lvl, MESSENGER_LEVELS);
    setRound(r); setChat([{ who: 'them', text: r.ask }]);
    addTimer(setTimeout(() => speakKo(r.ask), 300));
  };
  useEffectA(() => {
    timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = [];
    setProgress(0); setDone(false); mp.reset(); startRound(levelIdx);
  }, [levelIdx]);

  const onPick = (emoji) => {
    if (done) return;
    const res = mp.pick(emoji, [round.answer]);
    if (res === 'wrong') playSfx('wrong');
    else if (res === 'complete') {
      playSfx('correct');
      setChat((c) => [...c, { who: 'me', emoji }, { who: 'them', emoji: '😊' }]);
      addTimer(setTimeout(() => speakKo('좋아!'), 250));
      onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      addTimer(setTimeout(() => {
        if (n >= MESSENGER_QUESTIONS) { setDone(true); onComplete && onComplete(3); }
        else { timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = []; mp.reset(); startRound(levelIdx); }
      }, 1200));
    }
  };
  const restart = () => { setProgress(0); setDone(false); mp.reset(); startRound(levelIdx); };
  const nextLevel = () => { if (levelIdx < MESSENGER_LEVELS.length - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>💬</span>메신저 놀이
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>Lv.{levelIdx + 1}</span>
        </div>
        <LevelStepper tone={t} cur={levelIdx} total={MESSENGER_LEVELS.length} onPrev={prevLevel} onNext={nextLevel} />
      </div>

      {!done ? (
        <React.Fragment>
          {/* 채팅 말풍선 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 36px', overflow: 'auto', minHeight: 0 }}>
            {chat.map((m, i) => {
              const me = m.who === 'me';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '70%', background: me ? color : '#fff', color: me ? t.textOnColor : t.text,
                    border: me ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder, borderRadius: 24,
                    padding: m.emoji ? '10px 16px' : '14px 20px', fontSize: m.emoji ? 48 : fontSize + 4, fontWeight: 900, boxShadow: t.shadowSm }}>
                    {m.emoji || m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 보기 이모티콘 */}
          <div style={{ flex: '0 0 auto', padding: '10px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${round.options.length}, 1fr)`, gap: 14 }}>
            {round.options.map((emoji) => {
              const isRight = mp.found.includes(emoji);
              const isWrong = mp.wrongKey === emoji;
              return (
                <button key={emoji} onClick={() => onPick(emoji)} disabled={isRight}
                  onPointerDown={(e) => !isRight && e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ position: 'relative', height: 96, fontSize: 52, fontFamily: 'inherit', cursor: isRight ? 'default' : 'pointer',
                    background: isRight ? t.cat.code : '#fff', border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline,
                    borderRadius: t.cardRadius, boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: isWrong ? 'kw-shake 0.4s ease' : 'none' }}>
                  {emoji}
                  {isRight && <PickMark kind="right" />}
                  {isWrong && <PickMark kind="wrong" />}
                </button>
              );
            })}
          </div>

          <div style={{ flex: '0 0 auto', padding: '12px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {Array.from({ length: MESSENGER_QUESTIONS }).map((_, i) => (
                <span key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i < progress ? color : '#fff',
                  border: i < progress ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{MESSENGER_QUESTIONS}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>{levelIdx < MESSENGER_LEVELS.length - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accentBorder, borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < MESSENGER_LEVELS.length - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : '알맞은 답을 골라봐'} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 검증**

Run: `npm test` → PASS(기존 유지). `npm run build` → SUCCESS, 무경고.

- [ ] **Step 3: Commit**
```bash
git add src/social.jsx
git commit -m "feat(social): MessengerActivity(상황 대화·보기선택)"
```

## Context
메신저는 `WordMatchActivity`/shape `PickActivity`와 동형(단일타깃 `useMultiPick`). 차이는 보기가 데이터의 고정 options(셔플)이고, 정답 시 말풍선 누적 + 캐릭터 리액션. `round.options.length`로 그리드 열 수 결정(2~4).

---

## Task 3: RoleplayActivity (역할놀이)

**Files:** Modify `src/social.jsx` (Task 2 **다음**에 append)

**Interfaces:**
- Consumes: `ROLES`, `buildRoleStepOptions`, `useMultiPick`, `PickMark`, `LevelStepper`, `VoiceGuide`, `playSfx`, `speakKo`.
- Produces: `RoleplayActivity({ tone, fontSize, onComplete, onFinish, voiceShow })`.

- [ ] **Step 1: 컴포넌트 append**

`src/social.jsx` 끝에 추가:
```jsx
function RoleplayActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.social;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [jobIdx, setJobIdx] = useStateA(0);
  const [stepIdx, setStepIdx] = useStateA(0);
  const job = ROLES[jobIdx];
  const step = job.steps[stepIdx];
  const [round, setRound] = useStateA(() => buildRoleStepOptions(ROLES[0].steps[0]));
  const [done, setDone] = useStateA(false);
  const mp = useMultiPick();
  const timersRef = useRefA([]);
  const addTimer = (id) => timersRef.current.push(id);
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  const startStep = (ji, si) => {
    const s = ROLES[ji].steps[si];
    setRound(buildRoleStepOptions(s)); mp.reset();
    addTimer(setTimeout(() => speakKo(s.prompt), 300));
  };
  useEffectA(() => {
    timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = [];
    setStepIdx(0); setDone(false); startStep(jobIdx, 0);
  }, [jobIdx]);

  const onPick = (emoji) => {
    if (done) return;
    const res = mp.pick(emoji, [round.tool]);
    if (res === 'wrong') playSfx('wrong');
    else if (res === 'complete') {
      playSfx('correct'); onComplete && onComplete(1);
      const last = stepIdx >= job.steps.length - 1;
      addTimer(setTimeout(() => {
        if (last) { setDone(true); onComplete && onComplete(3); }
        else { const ns = stepIdx + 1; setStepIdx(ns); startStep(jobIdx, ns); }
      }, 700));
    }
  };
  const restart = () => { setStepIdx(0); setDone(false); startStep(jobIdx, 0); };
  const nextJob = () => { if (jobIdx < ROLES.length - 1) setJobIdx(jobIdx + 1); else onFinish && onFinish(); };
  const prevJob = () => { if (jobIdx > 0) setJobIdx(jobIdx - 1); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>{job.emoji}</span>{job.name} 놀이
        </div>
        <LevelStepper tone={t} cur={jobIdx} total={ROLES.length} onPrev={prevJob} onNext={nextJob} />
      </div>

      {!done ? (
        <React.Fragment>
          {/* 안내 — 직업 + 현재 할 일 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, minHeight: 0, padding: '0 32px' }}>
            <div style={{ fontSize: 130, lineHeight: 1 }}>{job.emoji}</div>
            <button onClick={() => speakKo(step.prompt)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: accentBorder,
                borderRadius: 28, padding: '16px 30px', boxShadow: t.shadow, cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 28 }}>🔊</span>
              <span style={{ fontSize: fontSize + 20, fontWeight: 900, color: t.text }}>{step.prompt}</span>
            </button>
          </div>

          {/* 도구 보기 */}
          <div style={{ flex: '0 0 auto', padding: '10px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${round.options.length}, 1fr)`, gap: 14 }}>
            {round.options.map((emoji) => {
              const isRight = mp.found.includes(emoji);
              const isWrong = mp.wrongKey === emoji;
              return (
                <button key={emoji} onClick={() => onPick(emoji)} disabled={isRight}
                  onPointerDown={(e) => !isRight && e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ position: 'relative', height: 104, fontSize: 56, fontFamily: 'inherit', cursor: isRight ? 'default' : 'pointer',
                    background: isRight ? t.cat.code : '#fff', border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline,
                    borderRadius: t.cardRadius, boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: isWrong ? 'kw-shake 0.4s ease' : 'none' }}>
                  {emoji}
                  {isRight && <PickMark kind="right" />}
                  {isWrong && <PickMark kind="wrong" />}
                </button>
              );
            })}
          </div>

          {/* 스텝 진행 */}
          <div style={{ flex: '0 0 auto', padding: '12px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {job.steps.map((_, i) => (
                <span key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i < stepIdx ? color : i === stepIdx ? t.accent : '#fff',
                  border: i <= stepIdx ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{stepIdx + 1}/{job.steps.length}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>{job.name} 완수!</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accentBorder, borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextJob}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {jobIdx < ROLES.length - 1 ? '다음 직업 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : '알맞은 도구를 골라봐'} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 검증**

Run: `npm test` → PASS(기존 유지). `npm run build` → SUCCESS, 무경고.

- [ ] **Step 3: Commit**
```bash
git add src/social.jsx
git commit -m "feat(social): RoleplayActivity(6직업 순서 미션)"
```

## Context
역할놀이는 직업=`LevelStepper`(◀▶), step을 순서대로 진행. 정답 도구 탭 시 다음 step, 마지막 step 완료 시 직업 완수 칭찬. 진행 비저장(직업 전환 시 step 0부터). 스텝 진행 표시는 완료=color/현재=accent/예정=빈칸.

---

## Task 4: DecorateActivity (꾸미기 — 스티커 드래그 + PNG 저장)

**Files:** Modify `src/social.jsx` (Task 3 **다음**에 append)

**Interfaces:**
- Consumes: `SCENES`, `DECORATE_STICKERS`, `FRAMES`, `playSfx`, `VoiceGuide`.
- Produces: `DecorateActivity({ tone, fontSize, onComplete, onFinish, voiceShow })`.

- [ ] **Step 1: 컴포넌트 append**

`src/social.jsx` 끝에 추가:
```jsx
function DecorateActivity({ tone, fontSize, onComplete, voiceShow }) {
  const t = tone;
  const color = t.cat.social;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const stageRef = useRefA(null);
  const [sceneIdx, setSceneIdx] = useStateA(0);
  const [frameIdx, setFrameIdx] = useStateA(0);
  const [placed, setPlaced] = useStateA([]);     // [{ id, emoji, x, y }] x,y = % (0~100)
  const [drag, setDrag] = useStateA(null);        // { id }
  const [saved, setSaved] = useStateA(false);
  const idRef = useRefA(1);
  const scene = SCENES[sceneIdx];
  const frame = FRAMES[frameIdx];

  const addSticker = (emoji) => {
    const id = idRef.current++;
    setPlaced((p) => [...p, { id, emoji, x: 50, y: 48 }]);
    playSfx('select');
  };
  const pctFromEvent = (e) => {
    const el = stageRef.current; if (!el) return { x: 50, y: 50 };
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    return { x, y };
  };
  const onStickerDown = (e, id) => {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setDrag({ id });
  };
  const onStickerMove = (e, id) => {
    if (!drag || drag.id !== id) return;
    e.stopPropagation();
    const p = pctFromEvent(e);
    setPlaced((arr) => arr.map((s) => (s.id === id ? { ...s, x: p.x, y: p.y } : s)));
  };
  const onStickerUp = (e, id) => {
    if (!drag || drag.id !== id) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    setDrag(null);
  };
  const clearAll = () => setPlaced([]);

  const onSave = () => {
    const W = 800, H = 600;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, scene.c1); grad.addColorStop(1, scene.c2);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    placed.forEach((s) => {
      ctx.font = '72px serif';
      ctx.fillText(s.emoji, (s.x / 100) * W, (s.y / 100) * H);
    });
    if (frame.width > 0) {
      ctx.strokeStyle = frame.color; ctx.lineWidth = frame.width * 2;
      ctx.strokeRect(frame.width, frame.width, W - frame.width * 2, H - frame.width * 2);
    }
    try {
      const png = canvas.toDataURL('image/png');
      const list = JSON.parse(localStorage.getItem('kw-gallery') || '[]');
      list.unshift({ id: Date.now(), type: 'free', png, savedAt: new Date().toISOString() });
      if (list.length > 24) list.length = 24;
      localStorage.setItem('kw-gallery', JSON.stringify(list));
    } catch {}
    playSfx('star'); onComplete && onComplete(3);
    setSaved(true); setTimeout(() => setSaved(false), 1400);
  };

  const frameBorder = frame.width > 0 ? `${frame.width}px solid ${frame.color}` : 'none';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🎀</span>꾸미기
        </div>
        <button onClick={onSave} aria-label="저장"
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
          style={{ position: 'absolute', top: 16, right: 130, width: 64, height: 64, borderRadius: 32,
            background: '#fff', border: accentBorder, cursor: 'pointer', fontSize: 30, fontFamily: 'inherit', boxShadow: t.shadowSm, color: t.text }}>💾</button>
      </div>

      {/* 장면 + 프레임 선택 */}
      <div style={{ flex: '0 0 auto', padding: '0 28px 8px', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {SCENES.map((s, i) => (
          <button key={s.id} onClick={() => setSceneIdx(i)}
            style={{ height: 38, padding: '0 14px', borderRadius: 19, background: i === sceneIdx ? color : '#fff', color: i === sceneIdx ? t.textOnColor : t.text,
              border: i === sceneIdx ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder, fontSize: fontSize - 4, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{s.name}</button>
        ))}
        {FRAMES.map((f, i) => (
          <button key={f.id} onClick={() => setFrameIdx(i)} aria-label={`프레임 ${f.name}`}
            style={{ width: 38, height: 38, borderRadius: 19, background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              border: i === frameIdx ? `4px solid ${t.text}` : accentBorder, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 20, height: 20, borderRadius: 6, border: f.width > 0 ? `4px solid ${f.color}` : `2px dashed ${t.textMuted}` }} />
          </button>
        ))}
      </div>

      {/* 꾸미기 무대 */}
      <div style={{ flex: 1, padding: '0 28px', minHeight: 0, display: 'flex', justifyContent: 'center' }}>
        <div ref={stageRef} style={{ position: 'relative', width: '100%', maxWidth: 720, aspectRatio: '4 / 3',
          background: `linear-gradient(180deg, ${scene.c1}, ${scene.c2})`, borderRadius: 18, overflow: 'hidden',
          border: frameBorder, boxShadow: t.shadow, touchAction: 'none' }}>
          {placed.map((s) => (
            <div key={s.id}
              onPointerDown={(e) => onStickerDown(e, s.id)} onPointerMove={(e) => onStickerMove(e, s.id)}
              onPointerUp={(e) => onStickerUp(e, s.id)} onPointerCancel={(e) => onStickerUp(e, s.id)}
              style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)',
                fontSize: 56, lineHeight: 1, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>{s.emoji}</div>
          ))}
          {saved && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.6)', fontSize: fontSize + 12, fontWeight: 900, color: t.text }}>저장했어요! 🖼️</div>
          )}
        </div>
      </div>

      {/* 스티커 팔레트 + 지우기 */}
      <div style={{ flex: '0 0 auto', padding: '10px 24px 16px', display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
        {DECORATE_STICKERS.map((emoji) => (
          <button key={emoji} onClick={() => addSticker(emoji)}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }], { duration: 120 })}
            style={{ width: 60, height: 60, borderRadius: t.cardRadius, background: '#fff', border: accentBorder,
              fontSize: 34, lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emoji}</button>
        ))}
        <button onClick={clearAll}
          style={{ height: 60, padding: '0 18px', borderRadius: t.cardRadius, background: '#fff', border: accentBorder,
            fontSize: fontSize - 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', color: t.text, boxShadow: t.shadowSm }}>🧽 지우기</button>
      </div>

      <VoiceGuide tone={t} show={voiceShow} text="스티커를 콕 누르고 끌어서 꾸며봐" fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 검증**

Run: `npm test` → PASS(기존 유지). `npm run build` → SUCCESS, 무경고.

- [ ] **Step 3: Commit**
```bash
git add src/social.jsx
git commit -m "feat(social): DecorateActivity(장면·스티커 드래그·프레임·PNG 저장)"
```

## Context
스티커 팔레트 탭 → 무대 중앙(50%,48%)에 추가 후 드래그 이동(좌표는 %). 저장은 오프스크린 캔버스에 배경 그라데이션 + 이모지(`fillText`) + 프레임 선을 그려 `toDataURL` → `kw-gallery`에 `{type:'free', png}`로 저장(기존 자유색칠과 동일 형식, 갤러리가 `<img>`로 렌더 → shell.jsx 무수정). 이모지 캔버스 렌더는 브라우저 컬러 이모지 폰트에 의존(유아 앱 허용 범위).

---

## Task 5: 라우터 + 배선 (디스패처·테마·서브메뉴)

**Files:**
- Modify: `src/social.jsx` (라우터 `SocialActivity` export append)
- Modify: `src/activities.jsx` (import + 디스패처 분기)
- Modify: `src/themes.jsx` (social 플래그)
- Modify: `src/shell.jsx` (`SUBMENUS.social`)

**Interfaces:**
- Consumes: Task 2~4 컴포넌트.
- Produces: `export function SocialActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow })`.

- [ ] **Step 1: SocialActivity 라우터 (social.jsx)**

`src/social.jsx` 끝에 추가:
```jsx
export function SocialActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const p = { tone, fontSize, onComplete, onFinish, voiceShow };
  if (subId === 'roleplay') return <RoleplayActivity {...p} />;
  if (subId === 'decorate') return <DecorateActivity {...p} />;
  return <MessengerActivity {...p} />; // 'messenger' 기본
}
```

- [ ] **Step 2: 디스패처 분기 (activities.jsx)**

`src/activities.jsx` 상단에서 기존 `import { ShapeActivity } from './shape.jsx'` 아래에 추가:
```jsx
import { SocialActivity } from './social.jsx'
```
`function Activity`의 `if (cat.id === 'shape') {...}` 블록 **다음**(그리고 `if (cat.id === 'english')` 앞)에 추가:
```jsx
  if (cat.id === 'social') return <SocialActivity tone={tone} subId={sub?.id || 'messenger'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
```

- [ ] **Step 3: 테마 플래그 (themes.jsx)**

`src/themes.jsx`에서 `social` 항목 줄을 교체:
```jsx
  { id: 'social',  name: '놀이마을',  emoji: '💬',  hasSub: true,  done: true },
```

- [ ] **Step 4: 서브메뉴 (shell.jsx)**

`src/shell.jsx`의 `SUBMENUS` 객체에서 `shape: { ... }` 블록 **다음**(닫는 `};` 앞)에 추가:
```jsx
  social: {
    title: '놀이마을',
    items: [
      { id: 'messenger', name: '메신저 놀이', emoji: '💬',   sub: 'Lv.3' },
      { id: 'roleplay',  name: '역할놀이',   emoji: '👩‍⚕️', sub: '6직업' },
      { id: 'decorate',  name: '꾸미기',     emoji: '🎀',   sub: '🎨' },
    ],
  },
```

- [ ] **Step 5: 빌드 + 테스트 + 수동 검증**

Run: `npm test` → PASS. `npm run build` → SUCCESS, 무경고.
Run: `npm run dev`:
- 홈에서 **놀이마을** 카테고리 활성(준비중 아님). 진입 시 3개 서브메뉴.
- 메신저: 캐릭터 질문 음성+말풍선 → 보기 이모티콘 탭 → 정답 시 내 말풍선+😊 리액션, 5문항, ◀▶ 레벨 1→3.
- 역할놀이: 직업 emoji + "○○를 해요" 음성 → 알맞은 도구 탭 → 다음 step → 완수 칭찬, ◀▶ 직업 전환(재진입 첫 직업/step).
- 꾸미기: 장면 선택, 스티커 탭→무대에 추가→드래그 이동, 프레임 선택, 💾 저장 → "저장했어요" + 내 갤러리에 그림 추가.

- [ ] **Step 6: Commit**
```bash
git add src/social.jsx src/activities.jsx src/themes.jsx src/shell.jsx
git commit -m "feat(social): 라우터+디스패처+서브메뉴+테마 배선"
```

## Context
`english`/`shape`와 동일하게 activities.jsx↔social.jsx 순환 import이나 렌더 시점 사용이라 안전. `social` 분기를 `shape` 다음·`english` 앞에 둔다. 놀이마을 색은 `tone.cat.social`(세 톤 모두 정의됨). 꾸미기 저장 그림은 색칠 '내 갤러리'에서 함께 보인다.

---

## 마무리 검증
- [ ] `npm test` 전체 PASS, `npm run build` 무경고.
- [ ] 놀이마을 3개 서브활동 동작(메신저 대화·역할 6직업·꾸미기 저장), 메신저 레벨 1→3·항상 1레벨, 역할 직업 ◀▶.
- [ ] 꾸미기 저장 그림이 색칠 갤러리에 표시.
- [ ] 설계 대조: 데이터·3활동·음성/피드백·갤러리 저장 전부 구현.

후속: 컴퓨터 익히기 카테고리(마지막 통째-미구현, 뽀로로 컴교실 청사진) — 별도 설계.
