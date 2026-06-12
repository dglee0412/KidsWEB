# 영어놀이 카테고리 + 레벨 정책 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 레벨형 활동에 수기 ◀▶ 이동 + "항상 1레벨부터" 정책을 적용하고, 영어놀이(english) 카테고리 6활동(대/소문자·따라쓰기·파닉스·단어·ABC노래)을 en-US 음성과 함께 새 파일 `src/english.jsx`로 추가한다.

**Architecture:** 공용 `LevelStepper`를 `activities.jsx`에 추가·export 하여 코딩/메모리/그림자/영어가 공유한다. 레벨 진행 localStorage 저장을 제거(항상 0레벨 시작). 영어 활동은 한글 플래시카드/낱말 패턴을 미러링하고, 보기 생성기는 순수 함수로 분리해 vitest로 검증(숫자세기 무한루프 교훈). 음성은 `audio.js`의 신규 `speakEn`(speechSynthesis en-US).

**Tech Stack:** React 18(전역 alias), Vite 5, Web Speech API(speechSynthesis), vitest.

설계: `docs/superpowers/specs/2026-06-11-english-category-design.md`

---

## File Structure

- `src/activities.jsx` — 신규 `LevelStepper`(export) + 코딩/메모리/그림자 retrofit + 디스패처에 english 위임 1줄.
- `src/english.jsx` — **신규**. 영어 데이터(`ALPHABET`, `WORD_SET`), 순수 함수(`englishLevelConfig`/`phonicsOptions`/`wordOptions`), 공용 스타일 헬퍼, 6활동, 라우터 `EnglishActivity`.
- `src/lib/audio.js` — 신규 `speakEn`.
- `src/shell.jsx` — `SUBMENUS.english` 추가.
- `src/themes.jsx` — english `done:true, hasSub:true`.
- `src/__tests__/english-logic.test.js` — **신규**. 순수 함수 테스트.

순환 import(english.jsx → shell.jsx[VoiceGuide] → activities.jsx[COLORING_TEMPLATES, LevelStepper] → english.jsx)는 모두 렌더/호출 시점 사용이라 ES 모듈에서 안전(기존 activities↔shell 순환과 동일).

---

# Phase A — 레벨 활동 공통 정책

## Task A1: LevelStepper 컴포넌트 + 코딩 retrofit

**Files:**
- Modify: `src/activities.jsx` (`LevelStepper` 추가/export, `CodingActivity` 수정)

- [ ] **Step 1: LevelStepper 추가**

`src/activities.jsx`에서 `function CodingActivity` 정의 **바로 앞**에 추가:
```jsx
// 공용 레벨/스테이지 스테퍼 — 제목줄 우측 ◀ N/total ▶ (양방향 수기 이동)
export function LevelStepper({ tone, cur, total, onPrev, onNext, top = 18, right = 130 }) {
  const t = tone;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const btn = (enabled) => ({
    width: 52, height: 52, borderRadius: 26,
    background: '#fff', border: accentBorder,
    cursor: enabled ? 'pointer' : 'default',
    fontSize: 22, fontFamily: 'inherit', color: t.text,
    opacity: enabled ? 1 : 0.4, boxShadow: t.shadowSm,
  });
  return (
    <div style={{ position: 'absolute', top, right, display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onPrev} disabled={cur === 0} style={btn(cur > 0)}>◀</button>
      <div style={{ fontSize: 18, fontWeight: 900, color: t.text, minWidth: 44, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
        {cur + 1}/{total}
      </div>
      <button onClick={onNext} disabled={cur >= total - 1} style={btn(cur < total - 1)}>▶</button>
    </div>
  );
}
```

- [ ] **Step 2: CodingActivity — 저장 제거 + LevelStepper 사용**

`CodingActivity` 내부를 다음과 같이 수정한다:

(a) `loadStage`를 항상 0으로 — 다음 블록을:
```jsx
  const loadStage = () => {
    try { return Math.max(0, Math.min(CODING_LEVELS.length - 1, parseInt(localStorage.getItem('kw-coding-stage') || '0'))); }
    catch { return 0; }
  };
  const [stageIdx, setStageIdx] = useStateA(loadStage);
```
→ 로 교체:
```jsx
  const [stageIdx, setStageIdx] = useStateA(0); // 항상 1스테이지부터(진행 비저장)
```

(b) `nextStage`/`prevStage`의 localStorage 쓰기 제거. 기존:
```jsx
  const nextStage = () => {
    if (stageIdx < CODING_LEVELS.length - 1) {
      const next = stageIdx + 1;
      setStageIdx(next);
      try { localStorage.setItem('kw-coding-stage', String(next)); } catch {}
    } else {
      onFinish && onFinish();
    }
  };
  const prevStage = () => {
    if (stageIdx > 0) {
      const next = stageIdx - 1;
      setStageIdx(next);
      try { localStorage.setItem('kw-coding-stage', String(next)); } catch {}
    }
  };
```
→ 교체:
```jsx
  const nextStage = () => {
    if (stageIdx < CODING_LEVELS.length - 1) setStageIdx(stageIdx + 1);
    else onFinish && onFinish();
  };
  const prevStage = () => { if (stageIdx > 0) setStageIdx(stageIdx - 1); };
```

(c) `stageWin`의 cleared 저장 제거. 기존 `stageWin` 안의:
```jsx
      try {
        const cleared = parseInt(localStorage.getItem('kw-coding-cleared') || '0');
        if (stageIdx + 1 > cleared) localStorage.setItem('kw-coding-cleared', String(stageIdx + 1));
      } catch {}
```
→ 이 try/catch 블록 전체를 **삭제**한다. (`onComplete && onComplete(3)`는 유지.)

(d) 제목줄의 기존 ◀▶ 스테이지 이동 `<div style={{ position: 'absolute', top: 18, right: 130, ... }}> ... </div>` 블록(두 button 포함)을 아래로 교체:
```jsx
        <LevelStepper tone={t} cur={stageIdx} total={CODING_LEVELS.length} onPrev={prevStage} onNext={nextStage} />
```
주의: 성공 시 ▶ 펄스 강조는 LevelStepper에 없다(허용). 성공 안내는 기존 오버레이가 담당.

- [ ] **Step 3: 회귀 + 빌드**

Run: `npm test` → 17 pass. `npm run build` → SUCCESS, 무경고.

- [ ] **Step 4: 수동 확인**

`npm run dev` → 로봇공장: 재진입 시 항상 스테이지 1, ◀로 하향 가능, ▶/오버레이로 다음 진행.

- [ ] **Step 5: Commit**
```bash
git add src/activities.jsx
git commit -m "feat(levels): 공용 LevelStepper + 코딩 진행 비저장(항상 1스테이지)"
```

---

## Task A2: 카드뒤집기 retrofit (◀▶ 추가 + 저장 제거)

**Files:** Modify `src/activities.jsx` (`MemoryActivity`)

- [ ] **Step 1: loadLevel → 항상 0**

`MemoryActivity` 내부의:
```jsx
  const loadLevel = () => {
    try { return Math.max(0, Math.min(MEMORY_LEVELS.length - 1, parseInt(localStorage.getItem('kw-memory-level') || '0'))); }
    catch { return 0; }
  };
  const [levelIdx, setLevelIdx] = useStateA(loadLevel);
```
→ 교체:
```jsx
  const [levelIdx, setLevelIdx] = useStateA(0); // 항상 1레벨부터(진행 비저장)
```

- [ ] **Step 2: 저장 쓰기 제거**

(a) 승리 useEffect 내부의 cleared 저장 try/catch:
```jsx
      try {
        const c = parseInt(localStorage.getItem('kw-memory-cleared') || '0');
        if (levelIdx + 1 > c) localStorage.setItem('kw-memory-cleared', String(levelIdx + 1));
      } catch {}
```
→ **삭제**. (`onComplete(3)` 및 `setTimeout(()=>setCleared(true),700)` 유지.)

(b) `nextLevel`의 level 저장:
```jsx
  const nextLevel = () => {
    if (levelIdx < MEMORY_LEVELS.length - 1) {
      const next = levelIdx + 1;
      setLevelIdx(next);
      try { localStorage.setItem('kw-memory-level', String(next)); } catch {}
    } else {
      onFinish && onFinish();
    }
  };
```
→ 교체 + `prevLevel` 추가:
```jsx
  const nextLevel = () => {
    if (levelIdx < MEMORY_LEVELS.length - 1) setLevelIdx(levelIdx + 1);
    else onFinish && onFinish();
  };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };
```

- [ ] **Step 3: 제목줄에 LevelStepper 추가**

MemoryActivity 제목 블록(🃏 카드 뒤집기 + `Lv.{levelIdx + 1}` 배지가 들어있는 `<div style={{ height: 88, ...}}>` )의 **닫는 `</div>` 직전**에 LevelStepper를 추가한다. 즉 제목 컨테이너 안, 배지 span 뒤에:
```jsx
        <LevelStepper tone={t} cur={levelIdx} total={MEMORY_LEVELS.length} onPrev={prevLevel} onNext={nextLevel} top={18} right={130} />
```
(MemoryActivity 루트는 이미 `position:relative`이므로 absolute 배치가 컨테인된다.)

- [ ] **Step 4: 회귀/빌드/수동확인**

`npm test` → 17 pass. `npm run build` → SUCCESS. `npm run dev` → 카드뒤집기: 재진입 시 항상 6쌍(Lv1), ◀▶로 6/8/10쌍 이동, 완료 오버레이 "다음 레벨" 정상.

- [ ] **Step 5: Commit**
```bash
git add src/activities.jsx
git commit -m "feat(levels): 카드뒤집기 ◀▶ 수기 이동 + 진행 비저장"
```

---

## Task A3: 그림자 retrofit (◀▶ 추가 + 저장 제거)

**Files:** Modify `src/activities.jsx` (`ShadowActivity`)

- [ ] **Step 1: loadLevel → 항상 0**

`ShadowActivity` 내부의:
```jsx
  const loadLevel = () => {
    try { return Math.max(0, Math.min(SHADOW_LEVELS.length - 1, parseInt(localStorage.getItem('kw-shadow-level') || '0'))); }
    catch { return 0; }
  };
  const [levelIdx, setLevelIdx] = useStateA(loadLevel);
```
→ 교체:
```jsx
  const [levelIdx, setLevelIdx] = useStateA(0); // 항상 1레벨부터(진행 비저장)
```

- [ ] **Step 2: 저장 쓰기 제거 + prevLevel 추가**

(a) 승리 setTimeout 내부의 cleared 저장:
```jsx
          try {
            const c = parseInt(localStorage.getItem('kw-shadow-cleared') || '0');
            if (levelIdx + 1 > c) localStorage.setItem('kw-shadow-cleared', String(levelIdx + 1));
          } catch {}
```
→ **삭제**. (`setDone(true)`, `onComplete(3)` 유지.)

(b) `[levelIdx]` 효과의 level 저장 한 줄 제거. 기존:
```jsx
  useEffectA(() => {
    try { localStorage.setItem('kw-shadow-level', String(levelIdx)); } catch {}
    setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound());
  }, [levelIdx]);
```
→ 교체:
```jsx
  useEffectA(() => {
    setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound());
  }, [levelIdx]);
```

(c) `nextLevel` 옆에 `prevLevel` 추가. 기존 `nextLevel` 정의 바로 다음에:
```jsx
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };
```

- [ ] **Step 3: 제목줄에 LevelStepper 추가**

ShadowActivity 제목 블록(👤 그림자 맞추기 + `Lv.{levelIdx + 1}` 배지가 든 `<div style={{ height: 88, ... }}>`)의 닫는 `</div>` 직전에 추가:
```jsx
        <LevelStepper tone={t} cur={levelIdx} total={SHADOW_LEVELS.length} onPrev={prevLevel} onNext={nextLevel} top={18} right={130} />
```
ShadowActivity 루트 `<div>`가 `position:relative`가 아니면(현재 아님) 루트에 `position:'relative'`를 추가한다. ShadowActivity의 최상위 return div:
```jsx
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
```
→
```jsx
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
```

- [ ] **Step 4: 회귀/빌드/수동확인**

`npm test` → 17 pass. `npm run build` → SUCCESS. `npm run dev` → 그림자: 재진입 시 항상 Lv1, ◀▶ 동작.

- [ ] **Step 5: Commit**
```bash
git add src/activities.jsx
git commit -m "feat(levels): 그림자 ◀▶ 수기 이동 + 진행 비저장"
```

---

# Phase B — 영어놀이 카테고리

## Task B1: en-US 음성 `speakEn`

**Files:** Modify `src/lib/audio.js`

- [ ] **Step 1: speakEn 추가**

`src/lib/audio.js`의 `fallbackSpeak` 함수 정의 **바로 다음**(또는 파일 하단 export 구역)에 추가:
```js
// 영어 음성 — speechSynthesis en-US. 음량은 voice 슬라이더(vols.voice)와 연동.
export function speakEn(text, { rate = 0.85, pitch = 1.15 } = {}) {
  try {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'en-US';
    u.rate = rate; u.pitch = pitch; u.volume = vols.voice;
    const en = (window.speechSynthesis.getVoices() || []).find((v) => /^en/i.test(v.lang));
    if (en) u.voice = en;
    window.speechSynthesis.speak(u);
  } catch {}
}
```
(`vols`는 파일 상단에 이미 선언돼 있다.)

- [ ] **Step 2: 빌드 확인 + Commit**

Run: `npm run build` → SUCCESS.
```bash
git add src/lib/audio.js
git commit -m "feat(audio): 영어 음성 speakEn(en-US) 추가"
```

---

## Task B2: english.jsx 데이터 + 순수 함수 + 테스트

**Files:**
- Create: `src/english.jsx`
- Create: `src/__tests__/english-logic.test.js`

- [ ] **Step 1: 실패 테스트 작성**

Create `src/__tests__/english-logic.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { englishLevelConfig, phonicsOptions, wordOptions, ALPHABET, WORD_SET } from '../english.jsx'

describe('englishLevelConfig', () => {
  it('레벨별 보기수/문제수', () => {
    expect(englishLevelConfig(0)).toEqual({ options: 4, questions: 6 })
    expect(englishLevelConfig(1)).toEqual({ options: 4, questions: 8 })
    expect(englishLevelConfig(2)).toEqual({ options: 6, questions: 10 })
  })
  it('범위 밖 클램프', () => {
    expect(englishLevelConfig(9)).toEqual({ options: 6, questions: 10 })
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test` → FAIL (english.jsx 없음).

- [ ] **Step 3: english.jsx 생성(데이터 + 순수 함수 + 공용 헬퍼)**

Create `src/english.jsx`:
```jsx
// 영어놀이 카테고리 — 데이터 + 순수 함수 + 6활동 + 라우터.
import React from 'react'
import { VoiceGuide } from './shell.jsx'
import { LevelStepper } from './activities.jsx'
import { playSfx, speakEn } from './lib/audio.js'

const { useState: useS, useEffect: useE, useRef: useR } = React;

// 알파벳 26 — 대/소문자 + 예시단어 + 이모지
export const ALPHABET = [
  { u: 'A', l: 'a', word: 'Apple',     emoji: '🍎' },
  { u: 'B', l: 'b', word: 'Ball',      emoji: '⚽' },
  { u: 'C', l: 'c', word: 'Cat',       emoji: '🐱' },
  { u: 'D', l: 'd', word: 'Dog',       emoji: '🐶' },
  { u: 'E', l: 'e', word: 'Egg',       emoji: '🥚' },
  { u: 'F', l: 'f', word: 'Fish',      emoji: '🐟' },
  { u: 'G', l: 'g', word: 'Grape',     emoji: '🍇' },
  { u: 'H', l: 'h', word: 'Hat',       emoji: '🎩' },
  { u: 'I', l: 'i', word: 'Ice',       emoji: '🧊' },
  { u: 'J', l: 'j', word: 'Juice',     emoji: '🧃' },
  { u: 'K', l: 'k', word: 'Kite',      emoji: '🪁' },
  { u: 'L', l: 'l', word: 'Lion',      emoji: '🦁' },
  { u: 'M', l: 'm', word: 'Moon',      emoji: '🌙' },
  { u: 'N', l: 'n', word: 'Nest',      emoji: '🪺' },
  { u: 'O', l: 'o', word: 'Orange',    emoji: '🍊' },
  { u: 'P', l: 'p', word: 'Pig',       emoji: '🐷' },
  { u: 'Q', l: 'q', word: 'Queen',     emoji: '👑' },
  { u: 'R', l: 'r', word: 'Rain',      emoji: '🌧️' },
  { u: 'S', l: 's', word: 'Sun',       emoji: '☀️' },
  { u: 'T', l: 't', word: 'Tree',      emoji: '🌳' },
  { u: 'U', l: 'u', word: 'Umbrella',  emoji: '☂️' },
  { u: 'V', l: 'v', word: 'Van',       emoji: '🚐' },
  { u: 'W', l: 'w', word: 'Watch',     emoji: '⌚' },
  { u: 'X', l: 'x', word: 'Xylophone', emoji: '🎼' },
  { u: 'Y', l: 'y', word: 'Yoyo',      emoji: '🪀' },
  { u: 'Z', l: 'z', word: 'Zebra',     emoji: '🦓' },
];

// 단어 맞추기(일상 혼합)
export const WORD_SET = [
  { word: 'cat',   emoji: '🐱' }, { word: 'dog',  emoji: '🐶' }, { word: 'sun',   emoji: '☀️' },
  { word: 'bus',   emoji: '🚌' }, { word: 'cup',  emoji: '🥤' }, { word: 'hat',   emoji: '🎩' },
  { word: 'egg',   emoji: '🥚' }, { word: 'fish', emoji: '🐟' }, { word: 'star',  emoji: '⭐' },
  { word: 'moon',  emoji: '🌙' }, { word: 'tree', emoji: '🌳' }, { word: 'car',   emoji: '🚗' },
  { word: 'apple', emoji: '🍎' }, { word: 'ball', emoji: '⚽' },
];

const ENGLISH_LEVELS = [
  { options: 4, questions: 6 },
  { options: 4, questions: 8 },
  { options: 6, questions: 10 },
];
export function englishLevelConfig(level) {
  const i = Math.max(0, Math.min(ENGLISH_LEVELS.length - 1, level));
  return ENGLISH_LEVELS[i];
}

function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// 파닉스 보기 — 정답 인덱스 + 고유 distractor, 항상 count개(poolSize>=count 가정).
export function phonicsOptions(target, count, poolSize) {
  const pool = [];
  for (let i = 0; i < poolSize; i++) if (i !== target) pool.push(i);
  const picked = shuffleArr(pool).slice(0, Math.max(0, count - 1));
  return shuffleArr([target, ...picked]);
}

// 단어 보기 — 정답 단어 + 고유 distractor 단어, 최대 count개.
export function wordOptions(targetWord, count, pool) {
  const others = pool.map((w) => w.word).filter((w) => w !== targetWord);
  const picked = shuffleArr(others).slice(0, Math.max(0, Math.min(count, pool.length) - 1));
  return shuffleArr([targetWord, ...picked]);
}

// ── 공용 스타일 헬퍼 ───────────────────────────────────────────
function TitleBar({ t, fontSize, icon, title, levelStepper }) {
  return (
    <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
      <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 36 }}>{icon}</span>{title}
      </div>
      {levelStepper}
    </div>
  );
}
const accent = (t) => (t.outline === 'none' ? `3px solid ${t.text}` : t.outline);
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test` → PASS (english-logic 테스트 추가, 합계 증가). `npm run build` → SUCCESS.

- [ ] **Step 5: Commit**
```bash
git add src/english.jsx src/__tests__/english-logic.test.js
git commit -m "feat(english): 데이터/순수함수(보기생성·레벨) + 공용 헬퍼 + 테스트"
```

---

## Task B3: 대문자/소문자 플래시카드 `AlphabetActivity`

**Files:** Modify `src/english.jsx`

- [ ] **Step 1: AlphabetActivity 추가**

`src/english.jsx`의 `const accent = ...` 다음에 추가:
```jsx
// 대문자/소문자 플래시카드 — HangulActivity 미러. subId: 'upper' | 'lower'
function AlphabetActivity({ tone, subId, fontSize, onComplete, voiceShow }) {
  const t = tone;
  const isLower = subId === 'lower';
  const color = t.cat.english;
  const [idx, setIdx] = useS(0);
  const [collected, setCollected] = useS(() => new Set());
  const cur = ALPHABET[idx];
  const glyph = isLower ? cur.l : cur.u;

  const learn = () => {
    speakEn(`${cur.u}. ${cur.word}`);
    if (!collected.has(idx)) {
      const ns = new Set(collected); ns.add(idx); setCollected(ns);
      onComplete && onComplete(1);
    }
  };
  const next = () => setIdx((i) => (i + 1) % ALPHABET.length);
  const prev = () => setIdx((i) => (i - 1 + ALPHABET.length) % ALPHABET.length);
  const navBtn = (onClick, label) => (
    <button onClick={onClick}
      onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }], { duration: 120 })}
      style={{ width: 72, height: 72, borderRadius: 36, background: '#fff', border: accent(t), color: t.text,
        fontSize: 32, fontFamily: 'inherit', cursor: 'pointer', boxShadow: t.shadow, flex: '0 0 auto' }}>{label}</button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <TitleBar t={t} fontSize={fontSize} icon={isLower ? 'a' : 'A'} title={isLower ? '소문자 abc' : '대문자 ABC'} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', minHeight: 0 }}>
        {navBtn(prev, '◀')}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, minWidth: 0 }}>
          <button onClick={learn}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }], { duration: 150 })}
            style={{ position: 'relative', width: 300, height: 300, background: color,
              border: t.outline === 'none' ? 'none' : t.outline, borderRadius: t.cardRadius + 12,
              fontSize: 200, fontWeight: 900, lineHeight: 1, color: t.textOnColor, cursor: 'pointer',
              fontFamily: 'inherit', boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            {glyph}
            {collected.has(idx) && <span style={{ position: 'absolute', top: 14, right: 18, fontSize: 44 }}>⭐</span>}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: '#fff', border: accent(t),
            borderRadius: t.cardRadius + 8, padding: '12px 26px', boxShadow: t.shadowSm }}>
            <span style={{ fontSize: 72, lineHeight: 1 }}>{cur.emoji}</span>
            <div style={{ fontSize: 48, fontWeight: 900, color: t.text }}>
              <span style={{ color }}>{isLower ? cur.l : cur.u}</span>{cur.word.slice(1)}
            </div>
            <button onClick={learn}
              style={{ background: t.accent, color: t.text, border: t.outline === 'none' ? 'none' : t.outline,
                borderRadius: 36, padding: '12px 18px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 26 }}>🔊</span>듣기
            </button>
          </div>
        </div>
        {navBtn(next, '▶')}
      </div>
      {/* 하단 A~Z 점프 */}
      <div style={{ flex: '0 0 auto', padding: '6px 16px 14px', display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
        {ALPHABET.map((a, i) => {
          const active = i === idx; const learned = collected.has(i);
          return (
            <button key={i} onClick={() => setIdx(i)}
              style={{ width: 38, height: 38, borderRadius: 10, fontSize: 18, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                background: active ? color : '#fff', color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : `2px solid rgba(0,0,0,0.12)`,
                boxShadow: learned ? `0 0 0 2px ${t.accent}` : 'none' }}>{isLower ? a.l : a.u}</button>
          );
        })}
      </div>
      <VoiceGuide tone={t} show={voiceShow} text={`${cur.u} is for ${cur.word}!`} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인 + Commit**

Run: `npm run build` → SUCCESS (AlphabetActivity는 아직 라우팅 전이라 미사용 경고 없음 — 모듈 내부 함수). `npm test` → 그대로 PASS.
```bash
git add src/english.jsx
git commit -m "feat(english): 대문자/소문자 플래시카드 AlphabetActivity"
```

---

## Task B4: 파닉스 `PhonicsActivity` (레벨)

**Files:** Modify `src/english.jsx`

- [ ] **Step 1: PhonicsActivity 추가**

`src/english.jsx`의 `AlphabetActivity` 다음에 추가:
```jsx
// 파닉스 — 🔊 글자 소리 듣고 보기에서 고르기. 레벨(LevelStepper, 항상 1부터).
function PhonicsActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.english;
  const [levelIdx, setLevelIdx] = useS(0);
  const cfg = englishLevelConfig(levelIdx);
  const newRound = () => {
    const target = Math.floor(Math.random() * ALPHABET.length);
    return { target, opts: phonicsOptions(target, cfg.options, ALPHABET.length) };
  };
  const [round, setRound] = useS(newRound);
  const [status, setStatus] = useS('q'); // q|right|wrong
  const [picked, setPicked] = useS(null);
  const [progress, setProgress] = useS(0);
  const [done, setDone] = useS(false);

  useE(() => { setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound()); }, [levelIdx]);

  const say = () => speakEn(ALPHABET[round.target].u);
  useE(() => { const id = setTimeout(say, 350); return () => clearTimeout(id); }, [round]);

  const pick = (i) => {
    if (status !== 'q' || done) return;
    if (i === round.target) {
      playSfx('correct'); setStatus('right'); setPicked(i);
      speakEn(`${ALPHABET[i].u}. ${ALPHABET[i].word}`);
      onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      setTimeout(() => {
        if (n >= cfg.questions) { setDone(true); onComplete && onComplete(3); }
        else { setRound(newRound()); setStatus('q'); setPicked(null); }
      }, 950);
    } else { playSfx('wrong'); setStatus('wrong'); setPicked(i); setTimeout(() => { setStatus('q'); setPicked(null); }, 650); }
  };
  const nextLevel = () => { if (levelIdx < ENGLISH_LEVELS.length - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };
  const restart = () => { setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound()); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <TitleBar t={t} fontSize={fontSize} icon="🔊" title="파닉스"
        levelStepper={<LevelStepper tone={t} cur={levelIdx} total={ENGLISH_LEVELS.length} onPrev={prevLevel} onNext={nextLevel} />} />
      {!done ? (
        <React.Fragment>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, minHeight: 0, padding: '0 32px' }}>
            <div style={{ fontSize: fontSize, fontWeight: 800, color: t.textMuted }}>소리를 듣고 맞는 글자를 골라봐</div>
            <button onClick={say}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ width: 200, height: 200, borderRadius: 100, background: color, color: t.textOnColor,
                border: t.outline === 'none' ? 'none' : t.outline, fontSize: 96, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: t.shadow, animation: status === 'wrong' ? 'kw-shake 0.4s ease' : 'none' }}>🔊</button>
          </div>
          <div style={{ flex: '0 0 auto', padding: '14px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${cfg.options}, 1fr)`, gap: 14 }}>
            {round.opts.map((i) => {
              const isRight = status === 'right' && i === round.target;
              const isWrong = status === 'wrong' && picked === i;
              return (
                <button key={i} onClick={() => pick(i)}
                  onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ height: 96, fontSize: 56, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                    background: isRight ? t.cat.code : isWrong ? t.cat.shape : '#fff',
                    border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline, borderRadius: t.cardRadius, boxShadow: t.shadow }}>
                  {ALPHABET[i].u}
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
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>
            {levelIdx < ENGLISH_LEVELS.length - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accent(t), borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < ENGLISH_LEVELS.length - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}
      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : '소리를 듣고 골라봐'} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 빌드 + Commit**

Run: `npm run build` → SUCCESS. `npm test` → PASS.
```bash
git add src/english.jsx
git commit -m "feat(english): 파닉스 PhonicsActivity(레벨)"
```

---

## Task B5: 단어 맞추기 `EnglishWordsActivity` (레벨)

**Files:** Modify `src/english.jsx`

- [ ] **Step 1: EnglishWordsActivity 추가**

`PhonicsActivity` 다음에 추가:
```jsx
// 단어 맞추기 — 그림(이모지) 보고 영어 단어 고르기. 레벨.
function EnglishWordsActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.english;
  const [levelIdx, setLevelIdx] = useS(0);
  const cfg = englishLevelConfig(levelIdx);
  const newRound = () => {
    const target = WORD_SET[Math.floor(Math.random() * WORD_SET.length)];
    return { target, opts: wordOptions(target.word, cfg.options, WORD_SET) };
  };
  const [round, setRound] = useS(newRound);
  const [status, setStatus] = useS('q');
  const [picked, setPicked] = useS(null);
  const [progress, setProgress] = useS(0);
  const [done, setDone] = useS(false);

  useE(() => { setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound()); }, [levelIdx]);

  const pick = (w) => {
    if (status !== 'q' || done) return;
    if (w === round.target.word) {
      playSfx('correct'); setStatus('right'); setPicked(w); speakEn(round.target.word);
      onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      setTimeout(() => {
        if (n >= cfg.questions) { setDone(true); onComplete && onComplete(3); }
        else { setRound(newRound()); setStatus('q'); setPicked(null); }
      }, 950);
    } else { playSfx('wrong'); setStatus('wrong'); setPicked(w); setTimeout(() => { setStatus('q'); setPicked(null); }, 650); }
  };
  const nextLevel = () => { if (levelIdx < ENGLISH_LEVELS.length - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };
  const restart = () => { setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound()); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <TitleBar t={t} fontSize={fontSize} icon="🧩" title="단어 맞추기"
        levelStepper={<LevelStepper tone={t} cur={levelIdx} total={ENGLISH_LEVELS.length} onPrev={prevLevel} onNext={nextLevel} />} />
      {!done ? (
        <React.Fragment>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '0 32px' }}>
            <div style={{ background: color, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: t.cardRadius + 8,
              padding: '24px 48px', boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: status === 'wrong' ? 'kw-shake 0.4s ease' : 'none' }}>
              <span style={{ fontSize: 180, lineHeight: 1 }}>{round.target.emoji}</span>
            </div>
          </div>
          <div style={{ flex: '0 0 auto', padding: '14px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(cfg.options, WORD_SET.length)}, 1fr)`, gap: 14 }}>
            {round.opts.map((w) => {
              const isRight = status === 'right' && w === round.target.word;
              const isWrong = status === 'wrong' && picked === w;
              return (
                <button key={w} onClick={() => pick(w)}
                  onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ height: 88, fontSize: 34, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                    background: isRight ? t.cat.code : isWrong ? t.cat.shape : '#fff',
                    border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline, borderRadius: t.cardRadius, boxShadow: t.shadow }}>
                  {w}
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
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>
            {levelIdx < ENGLISH_LEVELS.length - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accent(t), borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < ENGLISH_LEVELS.length - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}
      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : '그림에 맞는 단어를 골라봐'} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 빌드 + Commit**

Run: `npm run build` → SUCCESS. `npm test` → PASS.
```bash
git add src/english.jsx
git commit -m "feat(english): 단어 맞추기 EnglishWordsActivity(레벨)"
```

---

## Task B6: 따라쓰기 `EnglishTraceActivity`

캔버스에 큰 글자 가이드를 깔고 그 위에 그리며, 그린 획의 총 길이가 임계치를 넘으면 완료로 간주(유아용 단순 트레이싱).

**Files:** Modify `src/english.jsx`

- [ ] **Step 1: EnglishTraceActivity 추가**

`EnglishWordsActivity` 다음에 추가:
```jsx
// 따라쓰기 — 큰 대문자 가이드 위에 그리기. 획 누적 길이가 임계치 넘으면 완료→다음 글자.
function EnglishTraceActivity({ tone, fontSize, onComplete, voiceShow }) {
  const t = tone;
  const color = t.cat.english;
  const [idx, setIdx] = useS(0);
  const [doneSet, setDoneSet] = useS(() => new Set());
  const [drawn, setDrawn] = useS(0);   // 누적 길이(px)
  const cur = ALPHABET[idx];
  const canvasRef = useR(null);
  const drawing = useR(false);
  const last = useR(null);
  const wonRef = useR(false);
  const THRESH = 1400; // 완료 임계 길이(px)

  const reset = (keepLetter) => {
    setDrawn(0); wonRef.current = false;
    const c = canvasRef.current; if (c) { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); }
  };
  useE(() => { reset(); }, [idx]);

  const pos = (e) => {
    const c = canvasRef.current; const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const down = (e) => { drawing.current = true; last.current = pos(e); speakEn(cur.u); };
  const move = (e) => {
    if (!drawing.current) return;
    const p = pos(e); const l = last.current;
    const c = canvasRef.current; const ctx = c.getContext('2d');
    ctx.strokeStyle = color; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    const d = Math.hypot(p.x - l.x, p.y - l.y); last.current = p;
    setDrawn((v) => {
      const nv = v + d;
      if (nv >= THRESH && !wonRef.current) {
        wonRef.current = true;
        if (!doneSet.has(idx)) { const ns = new Set(doneSet); ns.add(idx); setDoneSet(ns); onComplete && onComplete(2); }
      }
      return nv;
    });
  };
  const up = () => { drawing.current = false; last.current = null; };
  const next = () => setIdx((i) => (i + 1) % ALPHABET.length);
  const prev = () => setIdx((i) => (i - 1 + ALPHABET.length) % ALPHABET.length);
  const navBtn = (onClick, label) => (
    <button onClick={onClick} style={{ width: 72, height: 72, borderRadius: 36, background: '#fff', border: accent(t),
      color: t.text, fontSize: 32, fontFamily: 'inherit', cursor: 'pointer', boxShadow: t.shadow, flex: '0 0 auto' }}>{label}</button>
  );
  const pct = Math.min(100, Math.round((drawn / THRESH) * 100));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <TitleBar t={t} fontSize={fontSize} icon="✏️" title={`따라쓰기 — ${cur.u}`} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', minHeight: 0 }}>
        {navBtn(prev, '◀')}
        <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          <div style={{ position: 'relative', width: 460, height: 460, maxWidth: '100%', maxHeight: '100%',
            background: '#fff', border: accent(t), borderRadius: t.cardRadius + 8, boxShadow: t.shadow, overflow: 'hidden' }}>
            {/* 가이드 글자 */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 360, fontWeight: 900, color: 'rgba(0,0,0,0.10)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>{cur.u}</div>
            <canvas ref={canvasRef} width={460} height={460}
              onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }} />
            {doneSet.has(idx) && <span style={{ position: 'absolute', top: 12, right: 16, fontSize: 48 }}>⭐</span>}
          </div>
        </div>
        {navBtn(next, '▶')}
      </div>
      <div style={{ flex: '0 0 auto', padding: '8px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1, height: 16, borderRadius: 8, background: '#eee', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.1s' }} />
        </div>
        <button onClick={() => reset()} style={{ height: 48, padding: '0 18px', borderRadius: 24, background: t.accent, color: t.text,
          border: t.outline === 'none' ? 'none' : t.outline, fontSize: fontSize, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>↺ 지우기</button>
      </div>
      <VoiceGuide tone={t} show={voiceShow} text={doneSet.has(idx) ? '잘했어!' : `${cur.u}를 따라 써봐`} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 빌드 + Commit**

Run: `npm run build` → SUCCESS. `npm test` → PASS.
```bash
git add src/english.jsx
git commit -m "feat(english): 따라쓰기 EnglishTraceActivity(캔버스)"
```

---

## Task B7: ABC 노래 `AbcSongActivity`

**Files:** Modify `src/english.jsx`

- [ ] **Step 1: AbcSongActivity 추가**

`EnglishTraceActivity` 다음에 추가:
```jsx
// ABC 노래 — A~Z 격자. ▶ 누르면 순서대로 하이라이트하며 speakEn. 탭하면 그 글자 발음.
function AbcSongActivity({ tone, fontSize, onComplete, voiceShow }) {
  const t = tone;
  const color = t.cat.english;
  const [playIdx, setPlayIdx] = useS(-1); // 재생 중 하이라이트 인덱스
  const playing = useR(false);
  const wonRef = useR(false);
  const timersRef = useR([]);
  const addT = (id) => timersRef.current.push(id);
  useE(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  const stop = () => { playing.current = false; setPlayIdx(-1); timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = []; };
  const play = () => {
    if (playing.current) { stop(); return; }
    playing.current = true;
    ALPHABET.forEach((a, i) => {
      addT(setTimeout(() => {
        if (!playing.current) return;
        setPlayIdx(i); speakEn(a.u, { rate: 0.9 });
        if (i === ALPHABET.length - 1) {
          addT(setTimeout(() => {
            playing.current = false; setPlayIdx(-1);
            if (!wonRef.current) { wonRef.current = true; onComplete && onComplete(3); }
          }, 700));
        }
      }, i * 700));
    });
  };
  const tapLetter = (a) => { if (!playing.current) speakEn(a.u); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <TitleBar t={t} fontSize={fontSize} icon="🎵" title="ABC 노래" />
      <div style={{ flex: '0 0 auto', padding: '0 32px 10px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={play}
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }], { duration: 140 })}
          style={{ height: 60, padding: '0 28px', borderRadius: 30, background: color, color: t.textOnColor,
            border: t.outline === 'none' ? 'none' : t.outline, fontSize: fontSize + 4, fontWeight: 900, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{playing.current ? '⏸' : '▶'}</span>{playing.current ? '멈추기' : '노래 부르기'}
        </button>
      </div>
      <div style={{ flex: 1, padding: '0 28px 18px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gridAutoRows: '1fr', gap: 12, minHeight: 0, alignContent: 'center' }}>
        {ALPHABET.map((a, i) => {
          const active = playIdx === i;
          return (
            <button key={a.u} onClick={() => tapLetter(a)}
              style={{ borderRadius: 16, fontSize: 44, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                background: active ? color : '#fff', color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : `3px solid rgba(0,0,0,0.10)`,
                boxShadow: active ? `0 0 0 4px ${t.accent}, ${t.shadow}` : t.shadowSm,
                transform: active ? 'translateY(-3px)' : 'none', transition: 'all 0.12s', minHeight: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span>{a.u}</span><span style={{ fontSize: 22, opacity: 0.6 }}>{a.l}</span>
            </button>
          );
        })}
      </div>
      <VoiceGuide tone={t} show={voiceShow} text="▶를 눌러 노래하거나 글자를 눌러봐" fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 빌드 + Commit**

Run: `npm run build` → SUCCESS. `npm test` → PASS.
```bash
git add src/english.jsx
git commit -m "feat(english): ABC 노래 AbcSongActivity(TTS 퍼레이드)"
```

---

## Task B8: 라우터 + 디스패처/메뉴/테마 배선

**Files:**
- Modify: `src/english.jsx` (router export)
- Modify: `src/activities.jsx` (dispatcher)
- Modify: `src/shell.jsx` (`SUBMENUS.english`)
- Modify: `src/themes.jsx` (done:true)

- [ ] **Step 1: EnglishActivity 라우터 export (english.jsx)**

`src/english.jsx` 맨 끝에 추가:
```jsx
// 라우터 — subId로 분기. activities.jsx 디스패처가 이걸 호출.
export function EnglishActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const p = { tone, fontSize, onComplete, onFinish, voiceShow };
  if (subId === 'lower' || subId === 'upper') return <AlphabetActivity {...p} subId={subId} />;
  if (subId === 'trace')   return <EnglishTraceActivity {...p} />;
  if (subId === 'phonics') return <PhonicsActivity {...p} />;
  if (subId === 'words')   return <EnglishWordsActivity {...p} />;
  if (subId === 'song')    return <AbcSongActivity {...p} />;
  return <AlphabetActivity {...p} subId="upper" />;
}
```

- [ ] **Step 2: 디스패처 위임 (activities.jsx)**

`src/activities.jsx` 상단 import 구역에 추가(파일 맨 위 import들 사이):
```jsx
import { EnglishActivity } from './english.jsx'
```
그리고 `function Activity(...)` 디스패처에서 `if (cat.id === 'code') ...` 분기 **앞**(또는 적절한 위치)에 추가:
```jsx
  if (cat.id === 'english') return <EnglishActivity tone={tone} subId={sub?.id || 'upper'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
```
(순환 import: activities.jsx ↔ english.jsx. english.jsx는 activities.jsx의 `LevelStepper`만 쓰고, 둘 다 렌더 시점 사용이라 안전. `LevelStepper`가 `EnglishActivity` import 줄보다 먼저 정의돼 있어야 하지만, ESM 함수 선언 호이스팅 + 런타임 참조라 위치 무관.)

- [ ] **Step 3: SUBMENUS.english 추가 (shell.jsx)**

`src/shell.jsx`의 `const SUBMENUS = { ... }` 안, `brain:` 항목 다음(또는 적절한 위치)에 추가:
```jsx
  english: {
    title: '무슨 영어 놀이?',
    items: [
      { id: 'upper',   name: '대문자 ABC', emoji: 'A',  sub: 'A~Z' },
      { id: 'lower',   name: '소문자 abc', emoji: 'a',  sub: 'a~z' },
      { id: 'trace',   name: '따라쓰기',   emoji: '✏️', sub: 'Lv.1' },
      { id: 'phonics', name: '파닉스',     emoji: '🔊', sub: 'Lv.2' },
      { id: 'words',   name: '단어 맞추기', emoji: '🧩', sub: 'Lv.2' },
      { id: 'song',    name: 'ABC 노래',   emoji: '🎵', sub: '🎶' },
    ],
  },
```

- [ ] **Step 4: themes.jsx — english 활성화**

`src/themes.jsx`의 `KIDS_CATEGORIES`에서:
```js
  { id: 'english', name: '영어',     emoji: 'ABC', iconKind: 'text', hasSub: false, done: false },
```
→
```js
  { id: 'english', name: '영어',     emoji: 'ABC', iconKind: 'text', hasSub: true,  done: true },
```

- [ ] **Step 5: 검증**

Run: `npm test` → PASS. `npm run build` → SUCCESS, 무경고.
`npm run dev` → 홈에서 **에이비씨 모래사장(영어)** 진입 → 서브메뉴 6개 → 각 활동:
- 대문자/소문자: 카드 탭 시 en-US 음성, A~Z 점프, 별.
- 따라쓰기: 글자 위 그리기 → 진행바 채워지면 ⭐, ◀▶.
- 파닉스: 🔊 듣고 글자 선택, 레벨 ◀▶ + 항상 1부터.
- 단어: 이모지 보고 단어 선택, 레벨.
- ABC 노래: ▶ 퍼레이드 + 글자 탭 발음.

- [ ] **Step 6: Commit**
```bash
git add src/english.jsx src/activities.jsx src/shell.jsx src/themes.jsx
git commit -m "feat(english): 라우터 + 디스패처/메뉴/테마 배선(영어 카테고리 활성화)"
```

---

## 마무리 검증

- [ ] `npm test` 전체 PASS, `npm run build` 무경고.
- [ ] 레벨 정책: 코딩/메모리/그림자/영어(파닉스·단어) 모두 재진입 시 1레벨, ◀▶ 양방향 이동.
- [ ] 영어 6활동 동작 + en-US 음성(기기에 영어 음성 없으면 무음일 수 있음 — 정상, mp3는 후속).
- [ ] 설계 대조: 스펙 A(정책)·B(6활동)·C(테스트) 항목 모두 구현.

후속(별도): 모양 꽃밭, 컴퓨터/반짝등대, 영어 mp3 보이스.
