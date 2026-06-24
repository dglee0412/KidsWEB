# 컴퓨터 익히기 카테고리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마지막 통째-미구현 카테고리 `computer`(컴퓨터 익히기)를 4개 서브활동(터치 튜토리얼·마우스 놀이·가상 키보드·타자 연습)으로 구현한다.

**Architecture:** `english`/`shape`/`social` 선례대로 신규 `src/computer.jsx`에 데이터·순수함수·활동·라우터를 담는다. 가상 키보드와 타자 연습은 한 컴포넌트(`KeyboardActivity` mode='explore'|'type')를 공유한다. 터치/마우스는 포인터 이벤트 기반 자족 컴포넌트.

**Tech Stack:** React 18(`React.useState` 등 alias), Vite 5, Pointer Events, Web Speech(`speakKo`), vitest.

설계: `docs/superpowers/specs/2026-06-24-computer-category-design.md`

## Global Constraints

- 신규 활동은 `src/computer.jsx` 단일 파일. `activities.jsx`는 디스패처 분기 + import만 추가, 그 외 무수정.
- 공용 부품 import: `activities.jsx`에서 `LevelStepper`, `PickMark`; `shell.jsx`에서 `VoiceGuide`; `lib/audio.js`에서 `playSfx`, `speakKo`. 미사용 import 두지 않는다(필요한 것만).
- 음성 `speakKo`, 정답 `playSfx('correct')`·오답 `playSfx('wrong')`, ⭐ 적립 `onComplete(1)`(라운드/스텝)·`onComplete(3)`(완주).
- 키보드 레이아웃은 실제 배열(영어 QWERTY 26 / 한글 두벌식 26), 시프트·특수문자·한글 조합 제외(낱자만).
- 타자 연습: 3레벨 `LevelStepper`(◀▶, 항상 1레벨부터), 라운드 5문항, Lv1만 타겟 키 힌트(하이라이트). 터치/마우스: 자유·순차(레벨 없음).
- `npm test` 전체 PASS, `npm run build` 무경고가 모든 커밋의 통과 조건.
- 브랜치는 이미 `feature/computer-category`(main에서 분기, 설계 커밋 `f6886d2` 포함). 추가 브랜치 생성 불필요.

---

## Task 1: 데이터 + 순수함수 + 테스트

`src/computer.jsx`를 신규 생성하고 키보드 레이아웃·과제 데이터·타자 출제 순수함수를 TDD로 작성한다.

**Files:**
- Create: `src/computer.jsx`
- Create: `src/__tests__/computer-logic.test.js`

**Interfaces:**
- Produces (export): `KEYBOARD_EN`, `KEYBOARD_KO`(각 3행 배열), `TOUCH_GESTURES`, `MOUSE_TASKS`, `pickTypingTarget(keys, prev)→key`.

- [ ] **Step 1: 실패 테스트 작성**

Create `src/__tests__/computer-logic.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test` → FAIL (`src/computer.jsx` 없음).

- [ ] **Step 3: computer.jsx 데이터 + 순수함수 작성**

Create `src/computer.jsx`:
```jsx
// 컴퓨터 익히기 카테고리 — 데이터 + 순수함수 + 활동 + 라우터.
import React from 'react'
import { VoiceGuide } from './shell.jsx'
import { LevelStepper, PickMark } from './activities.jsx'
import { playSfx, speakKo } from './lib/audio.js'

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

// 실제 키보드 배열(낱자, 시프트 제외)
export const KEYBOARD_EN = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];
export const KEYBOARD_KO = [
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
];

// 터치 제스처 3종(순차 진행)
export const TOUCH_GESTURES = [
  { id: 'tap',   name: '탭',      prompt: '풍선을 콕 눌러 터뜨려봐',     emoji: '🎈', count: 4 },
  { id: 'drag',  name: '드래그',  prompt: '사과를 바구니에 끌어다 넣어봐', emoji: '🍎', target: '🧺', count: 3 },
  { id: 'swipe', name: '스와이프', prompt: '카드를 옆으로 쓱 밀어봐',      emoji: '🃏', count: 3 },
];

// 마우스 과제 3종(커서로 클릭/더블클릭/드래그)
export const MOUSE_TASKS = [
  { id: 'click',  name: '클릭',     prompt: '별을 클릭해봐',              emoji: '⭐', count: 4 },
  { id: 'double', name: '더블클릭', prompt: '상자를 빠르게 두 번 눌러 열어봐', emoji: '📦', open: '🎁', count: 3 },
  { id: 'drag',   name: '드래그',   prompt: '선물을 상자에 넣어봐',        emoji: '🎁', target: '📦', count: 3 },
];

// 타자 출제: keys 중 prev와 다른 랜덤 키(키 1개면 그 키)
export function pickTypingTarget(keys, prev) {
  if (!keys.length) return null;
  if (keys.length === 1) return keys[0];
  let k = keys[Math.floor(Math.random() * keys.length)];
  let guard = 0;
  while (k === prev && guard < 20) { k = keys[Math.floor(Math.random() * keys.length)]; guard += 1; }
  return k;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test` → PASS(신규 + 기존).

- [ ] **Step 5: Commit**
```bash
git add src/computer.jsx src/__tests__/computer-logic.test.js
git commit -m "feat(computer): 키보드 레이아웃 + 터치/마우스 과제 데이터 + 타자 출제 + 테스트"
```

## Context
파일 상단 import(`VoiceGuide/LevelStepper/PickMark/playSfx/speakKo/React`)는 Task 2~4가 같은 파일에 append하며 전부 소비한다(Task 4 종료 시 미사용 0). `useMultiPick`은 쓰지 않는다(키 누름은 보기-멀티선택이 아니라 단일 키 매칭).

---

## Task 2: KeyboardActivity (가상 키보드 + 타자 연습 공유)

**Files:** Modify `src/computer.jsx` (Task 1 정의 **다음**에 append)

**Interfaces:**
- Consumes: `KEYBOARD_EN`, `KEYBOARD_KO`, `pickTypingTarget`, `LevelStepper`, `PickMark`, `VoiceGuide`, `playSfx`, `speakKo`.
- Produces: `KeyboardActivity({ tone, fontSize, onComplete, onFinish, voiceShow, mode })` — mode `'explore'`(가상 키보드) | `'type'`(타자 연습).

- [ ] **Step 1: 컴포넌트 append**

`src/computer.jsx` 끝에 추가:
```jsx
const TYPING_QUESTIONS = 5;
const TYPING_LEVELS = 3;

// 공용 키보드 — explore(자유 탐색) | type(타자 연습)
function KeyboardActivity({ tone, fontSize, onComplete, onFinish, voiceShow, mode }) {
  const t = tone;
  const color = t.cat.computer;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const isType = mode === 'type';
  const [lang, setLang] = useStateA('ko');
  const layout = lang === 'ko' ? KEYBOARD_KO : KEYBOARD_EN;
  const flatKeys = layout.flat();
  const [pressed, setPressed] = useStateA(null);   // explore: 마지막 누른 키
  const [levelIdx, setLevelIdx] = useStateA(0);
  const [target, setTarget] = useStateA(() => (mode === 'type' ? pickTypingTarget(KEYBOARD_KO.flat(), null) : null));
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const [wrongKey, setWrongKey] = useStateA(null);
  const wrongTimer = useRefA(null);
  const showHint = isType && levelIdx === 0;

  useEffectA(() => () => { if (wrongTimer.current) clearTimeout(wrongTimer.current); }, []);
  // 레벨/언어 변경 → 타자 라운드 리셋
  useEffectA(() => {
    if (!isType) return;
    setProgress(0); setDone(false); setTarget(pickTypingTarget((lang === 'ko' ? KEYBOARD_KO : KEYBOARD_EN).flat(), null));
  }, [levelIdx, lang]);

  const onKey = (key) => {
    if (!isType) { setPressed(key); speakKo(key); playSfx('select'); return; }
    if (done) return;
    if (key === target) {
      playSfx('correct'); speakKo(key); onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      if (n >= TYPING_QUESTIONS) { setDone(true); onComplete && onComplete(3); }
      else setTarget(pickTypingTarget(flatKeys, target));
    } else {
      playSfx('wrong'); setWrongKey(key);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongKey(null), 500);
    }
  };
  const restart = () => { setProgress(0); setDone(false); setTarget(pickTypingTarget(flatKeys, target)); };
  const nextLevel = () => { if (levelIdx < TYPING_LEVELS - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };

  const keyBtn = (key) => {
    const isTarget = isType && key === target;
    const isWrong = wrongKey === key;
    return (
      <button key={key} onClick={() => onKey(key)}
        onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }], { duration: 110 })}
        style={{ position: 'relative', width: 78, height: 72, borderRadius: t.cardRadius - 4, fontFamily: 'inherit',
          fontSize: 34, fontWeight: 900, cursor: 'pointer', color: t.text,
          background: showHint && isTarget ? t.accent : '#fff',
          border: showHint && isTarget ? `4px solid ${color}` : accentBorder,
          boxShadow: t.shadowSm, animation: isWrong ? 'kw-shake 0.4s ease' : 'none' }}>
        {key}
        {isWrong && <PickMark kind="wrong" />}
      </button>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>{isType ? '🔤' : '⌨️'}</span>{isType ? '타자 연습' : '가상 키보드'}
          {isType && <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>Lv.{levelIdx + 1}</span>}
        </div>
        {isType && <LevelStepper tone={t} cur={levelIdx} total={TYPING_LEVELS} onPrev={prevLevel} onNext={nextLevel} />}
      </div>

      {/* 한/영 토글 */}
      <div style={{ flex: '0 0 auto', padding: '0 28px 8px', display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[['ko', '한글'], ['en', '영어']].map(([id, name]) => (
          <button key={id} onClick={() => { setLang(id); setPressed(null); }}
            style={{ height: 40, padding: '0 20px', borderRadius: 20, background: lang === id ? color : '#fff', color: lang === id ? t.textOnColor : t.text,
              border: lang === id ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder, fontSize: fontSize - 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{name}</button>
        ))}
      </div>

      {!done ? (
        <React.Fragment>
          {/* 표시 영역 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '0 28px' }}>
            {isType ? (
              <button onClick={() => target && speakKo(target)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: accentBorder, borderRadius: 28,
                  padding: '14px 30px', boxShadow: t.shadow, cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 28 }}>🔊</span>
                <span style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text }}>찾아봐:</span>
                <span style={{ fontSize: 72, fontWeight: 900, color: color, lineHeight: 1 }}>{target}</span>
              </button>
            ) : (
              <div style={{ width: 220, height: 220, borderRadius: 32, background: '#fff', border: accentBorder, boxShadow: t.shadow,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 130, fontWeight: 900, color: t.text }}>
                {pressed || '⌨️'}
              </div>
            )}
          </div>

          {/* 키보드 */}
          <div style={{ flex: '0 0 auto', padding: '8px 20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {layout.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 8 }}>{row.map(keyBtn)}</div>
            ))}
          </div>

          {isType && (
            <div style={{ flex: '0 0 auto', padding: '0 32px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, display: 'flex', gap: 10 }}>
                {Array.from({ length: TYPING_QUESTIONS }).map((_, i) => (
                  <span key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i < progress ? color : '#fff',
                    border: i < progress ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
                ))}
              </div>
              <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{TYPING_QUESTIONS}</div>
            </div>
          )}
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>{levelIdx < TYPING_LEVELS - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accentBorder, borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < TYPING_LEVELS - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow}
        text={isType ? (done ? '잘했어!' : '글자를 키보드에서 찾아 눌러봐') : '키를 눌러서 글자 소리를 들어봐'} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 검증**

Run: `npm test` → PASS(기존 유지). `npm run build` → SUCCESS, 무경고.

- [ ] **Step 3: Commit**
```bash
git add src/computer.jsx
git commit -m "feat(computer): KeyboardActivity(가상 키보드 explore + 타자 연습 type)"
```

## Context
한 컴포넌트가 `mode`로 두 메뉴를 담당. explore는 키 누름→큰 글자+음성, type는 타겟 찾아 누르기(✓진행/✗ 흔들림+PickMark). Lv1만 타겟 키 하이라이트(showHint). 언어/레벨 변경 시 effect가 라운드 리셋. `flatKeys`는 렌더마다 재계산(가벼움).

---

## Task 3: TouchTutorialActivity (터치 튜토리얼)

**Files:** Modify `src/computer.jsx` (Task 2 **다음**에 append)

**Interfaces:**
- Consumes: `TOUCH_GESTURES`, `VoiceGuide`, `playSfx`, `speakKo`.
- Produces: `TouchTutorialActivity({ tone, fontSize, onComplete, onFinish, voiceShow })`.

- [ ] **Step 1: 컴포넌트 append**

`src/computer.jsx` 끝에 추가:
```jsx
function rand(min, max) { return min + Math.random() * (max - min); }

// 터치 튜토리얼 — 탭/드래그/스와이프 순차
function TouchTutorialActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.computer;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const stageRef = useRefA(null);
  const idRef = useRefA(1);
  const [gi, setGi] = useStateA(0);
  const g = TOUCH_GESTURES[gi];
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const [balloons, setBalloons] = useStateA([]);
  const [itemPos, setItemPos] = useStateA({ x: 28, y: 45 });
  const [dragging, setDragging] = useStateA(false);
  const [swipeX, setSwipeX] = useStateA(0);
  const swipeStart = useRefA(null);

  const setupGesture = (idx) => {
    const gg = TOUCH_GESTURES[idx];
    setProgress(0); setSwipeX(0); setDragging(false);
    if (gg.id === 'tap') setBalloons(Array.from({ length: gg.count }, () => ({ id: idRef.current++, x: rand(14, 86), y: rand(18, 78) })));
    else setBalloons([]);
    if (gg.id === 'drag') setItemPos({ x: rand(14, 38), y: rand(28, 68) });
    speakKo(gg.prompt);
  };
  useEffectA(() => { setupGesture(gi); }, [gi]);

  const finishGesture = () => {
    if (gi >= TOUCH_GESTURES.length - 1) { setDone(true); onComplete && onComplete(3); }
    else setGi(gi + 1);
  };
  const repDone = () => {
    playSfx('correct'); onComplete && onComplete(1);
    const np = progress + 1;
    if (np >= g.count) finishGesture();
    else {
      setProgress(np);
      if (g.id === 'drag') setItemPos({ x: rand(14, 38), y: rand(28, 68) });
      if (g.id === 'swipe') setSwipeX(0);
    }
  };

  // 탭: 풍선 터뜨리기
  const popBalloon = (id) => {
    playSfx('select'); onComplete && onComplete(1);
    setBalloons((b) => {
      const rest = b.filter((x) => x.id !== id);
      if (rest.length === 0) finishGesture();
      return rest;
    });
  };

  // 드래그: 사과 → 바구니
  const pct = (e) => {
    const el = stageRef.current; if (!el) return { x: 50, y: 50 };
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
             y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)) };
  };
  const itemDown = (e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setDragging(true); };
  const itemMove = (e) => { if (!dragging) return; setItemPos(pct(e)); };
  const itemUp = (e) => {
    if (!dragging) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    setDragging(false);
    const p = pct(e);
    if (p.x > 68 && p.y > 58) repDone();
    else setItemPos({ x: rand(14, 38), y: rand(28, 68) });
  };

  // 스와이프: 카드 밀기
  const swDown = (e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} swipeStart.current = e.clientX; };
  const swMove = (e) => { if (swipeStart.current == null) return; setSwipeX(e.clientX - swipeStart.current); };
  const swUp = (e) => {
    if (swipeStart.current == null) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    const dx = e.clientX - swipeStart.current; swipeStart.current = null;
    if (Math.abs(dx) > 120) repDone();
    else setSwipeX(0);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>👆</span>터치 연습
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>{g.name}</span>
        </div>
      </div>

      {!done ? (
        <React.Fragment>
          <button onClick={() => speakKo(g.prompt)}
            style={{ flex: '0 0 auto', alignSelf: 'center', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', border: accentBorder, borderRadius: 24, padding: '10px 22px', boxShadow: t.shadowSm, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 24 }}>🔊</span><span style={{ fontSize: fontSize + 4, fontWeight: 900, color: t.text }}>{g.prompt}</span>
          </button>

          <div ref={stageRef} style={{ flex: 1, position: 'relative', margin: '0 28px 14px', borderRadius: 18,
            background: t.surfaceAlt || '#FAFAFA', border: accentBorder, overflow: 'hidden', touchAction: 'none', minHeight: 0 }}>
            {g.id === 'tap' && balloons.map((b) => (
              <button key={b.id} onClick={() => popBalloon(b.id)}
                style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%, -50%)',
                  fontSize: 72, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, touchAction: 'none' }}>{g.emoji}</button>
            ))}
            {g.id === 'drag' && (
              <React.Fragment>
                <div style={{ position: 'absolute', right: '6%', bottom: '6%', fontSize: 96, lineHeight: 1 }}>{g.target}</div>
                <div onPointerDown={itemDown} onPointerMove={itemMove} onPointerUp={itemUp} onPointerCancel={itemUp}
                  style={{ position: 'absolute', left: `${itemPos.x}%`, top: `${itemPos.y}%`, transform: 'translate(-50%, -50%)',
                    fontSize: 72, lineHeight: 1, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>{g.emoji}</div>
              </React.Fragment>
            )}
            {g.id === 'swipe' && (
              <div onPointerDown={swDown} onPointerMove={swMove} onPointerUp={swUp} onPointerCancel={swUp}
                style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${swipeX}px), -50%) rotate(${swipeX / 20}deg)`,
                  width: 150, height: 200, borderRadius: 18, background: '#fff', border: accentBorder, boxShadow: t.shadow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 90, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>{g.emoji}</div>
            )}
          </div>

          <div style={{ flex: '0 0 auto', padding: '0 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {TOUCH_GESTURES.map((_, i) => (
                <span key={i} style={{ flex: 1, height: 12, borderRadius: 6, background: i < gi ? color : i === gi ? t.accent : '#fff',
                  border: i <= gi ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{g.count}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>다 했어요!</div>
          <button onClick={() => { setGi(0); setDone(false); }}
            style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
              padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>🔄 다시</button>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : g.prompt} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 검증**

Run: `npm test` → PASS(기존 유지). `npm run build` → SUCCESS, 무경고.

- [ ] **Step 3: Commit**
```bash
git add src/computer.jsx
git commit -m "feat(computer): TouchTutorialActivity(탭·드래그·스와이프)"
```

## Context
3제스처 순차. 탭=풍선 count개 모두 터뜨리면 다음. 드래그=사과를 바구니(우하단 x>68%·y>58%) 영역에 놓으면 1회, count회 반복. 스와이프=카드 좌우 120px 이상 밀면 1회. `repDone`이 ⭐+다음 단계/반복 처리. 마지막 제스처 완료 시 done.

---

## Task 4: MousePlayActivity (마우스 놀이)

**Files:** Modify `src/computer.jsx` (Task 3 **다음**에 append)

**Interfaces:**
- Consumes: `MOUSE_TASKS`, `VoiceGuide`, `playSfx`, `speakKo`, `rand`(Task 3에서 정의됨).
- Produces: `MousePlayActivity({ tone, fontSize, onComplete, onFinish, voiceShow })`.

- [ ] **Step 1: 컴포넌트 append**

`src/computer.jsx` 끝에 추가:
```jsx
// 마우스 놀이 — 가상 커서 + 클릭/더블클릭/드래그
function MousePlayActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.computer;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const stageRef = useRefA(null);
  const [ti, setTi] = useStateA(0);
  const task = MOUSE_TASKS[ti];
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const [cursor, setCursor] = useStateA({ x: 50, y: 60 });
  const [targetPos, setTargetPos] = useStateA({ x: 50, y: 40 });
  const [opened, setOpened] = useStateA(false);   // double: 상자 열림
  const [dragging, setDragging] = useStateA(false);
  const lastTap = useRefA(0);

  const pct = (e) => {
    const el = stageRef.current; if (!el) return { x: 50, y: 50 };
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
             y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)) };
  };
  const setupTask = (idx) => {
    setProgress(0); setOpened(false); setDragging(false);
    setTargetPos({ x: rand(25, 75), y: rand(22, 55) });
    speakKo(MOUSE_TASKS[idx].prompt);
  };
  useEffectA(() => { setupTask(ti); }, [ti]);

  const onStageMove = (e) => { const p = pct(e); setCursor({ x: p.x, y: Math.max(0, p.y - 6) }); };

  const finishTask = () => {
    if (ti >= MOUSE_TASKS.length - 1) { setDone(true); onComplete && onComplete(3); }
    else setTi(ti + 1);
  };
  const repDone = () => {
    playSfx('correct'); onComplete && onComplete(1);
    const np = progress + 1;
    if (np >= task.count) finishTask();
    else { setProgress(np); setOpened(false); setTargetPos({ x: rand(25, 75), y: rand(22, 55) }); }
  };

  // 클릭: 별 탭
  const onClickTarget = () => { if (task.id === 'click') repDone(); };
  // 더블클릭: 빠른 두 번 탭
  const onBoxTap = () => {
    if (task.id !== 'double') return;
    const now = Date.now();
    if (now - lastTap.current < 450) { lastTap.current = 0; setOpened(true); playSfx('select'); setTimeout(repDone, 500); }
    else { lastTap.current = now; playSfx('select'); }
  };
  // 드래그: 선물을 상자로 (상자는 우하단 고정, 선물 targetPos 이동)
  const giftDown = (e) => { if (task.id !== 'drag') return; e.stopPropagation(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setDragging(true); };
  const giftMove = (e) => { if (task.id !== 'drag' || !dragging) return; setTargetPos(pct(e)); };
  const giftUp = (e) => {
    if (task.id !== 'drag' || !dragging) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    setDragging(false);
    const p = pct(e);
    if (p.x > 66 && p.y > 58) repDone();
    else setTargetPos({ x: rand(25, 60), y: rand(22, 50) });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🖱️</span>마우스 놀이
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>{task.name}</span>
        </div>
      </div>

      {!done ? (
        <React.Fragment>
          <button onClick={() => speakKo(task.prompt)}
            style={{ flex: '0 0 auto', alignSelf: 'center', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', border: accentBorder, borderRadius: 24, padding: '10px 22px', boxShadow: t.shadowSm, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 24 }}>🔊</span><span style={{ fontSize: fontSize + 4, fontWeight: 900, color: t.text }}>{task.prompt}</span>
          </button>

          <div ref={stageRef} onPointerMove={onStageMove}
            style={{ flex: 1, position: 'relative', margin: '0 28px 14px', borderRadius: 18,
              background: t.surfaceAlt || '#FAFAFA', border: accentBorder, overflow: 'hidden', touchAction: 'none', minHeight: 0, cursor: 'none' }}>
            {/* 클릭 타겟 */}
            {task.id === 'click' && (
              <button onClick={onClickTarget}
                style={{ position: 'absolute', left: `${targetPos.x}%`, top: `${targetPos.y}%`, transform: 'translate(-50%, -50%)',
                  fontSize: 80, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{task.emoji}</button>
            )}
            {/* 더블클릭 상자 */}
            {task.id === 'double' && (
              <button onClick={onBoxTap}
                style={{ position: 'absolute', left: `${targetPos.x}%`, top: `${targetPos.y}%`, transform: 'translate(-50%, -50%)',
                  fontSize: 88, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{opened ? task.open : task.emoji}</button>
            )}
            {/* 드래그: 선물 + 상자 */}
            {task.id === 'drag' && (
              <React.Fragment>
                <div style={{ position: 'absolute', right: '6%', bottom: '6%', fontSize: 96, lineHeight: 1 }}>{task.target}</div>
                <div onPointerDown={giftDown} onPointerMove={giftMove} onPointerUp={giftUp} onPointerCancel={giftUp}
                  style={{ position: 'absolute', left: `${targetPos.x}%`, top: `${targetPos.y}%`, transform: 'translate(-50%, -50%)',
                    fontSize: 72, lineHeight: 1, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>{task.emoji}</div>
              </React.Fragment>
            )}
            {/* 가상 커서 */}
            <div style={{ position: 'absolute', left: `${cursor.x}%`, top: `${cursor.y}%`, transform: 'translate(-30%, -20%)',
              fontSize: 44, lineHeight: 1, pointerEvents: 'none', zIndex: 50, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}>🖱️</div>
          </div>

          <div style={{ flex: '0 0 auto', padding: '0 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {MOUSE_TASKS.map((_, i) => (
                <span key={i} style={{ flex: 1, height: 12, borderRadius: 6, background: i < ti ? color : i === ti ? t.accent : '#fff',
                  border: i <= ti ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{task.count}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>다 했어요!</div>
          <button onClick={() => { setTi(0); setDone(false); }}
            style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
              padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>🔄 다시</button>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : task.prompt} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 검증**

Run: `npm test` → PASS(기존 유지). `npm run build` → SUCCESS, 무경고.

- [ ] **Step 3: Commit**
```bash
git add src/computer.jsx
git commit -m "feat(computer): MousePlayActivity(가상 커서 클릭·더블클릭·드래그)"
```

## Context
무대 onPointerMove로 가상 커서(🖱️, 손가락보다 살짝 위 오프셋, `cursor:none`으로 OS 커서 숨김)가 따라옴. 클릭=타겟 탭, 더블클릭=450ms 내 두 번 탭(열림 후 repDone), 드래그=선물을 상자(우하단 x>66%·y>58%)로. 과제 count회 반복 후 다음, 마지막 과제 완료 시 done. `rand`는 Task 3에서 파일에 정의됨.

---

## Task 5: 라우터 + 배선 (디스패처·테마·서브메뉴)

**Files:**
- Modify: `src/computer.jsx` (라우터 `ComputerActivity` export append)
- Modify: `src/activities.jsx` (import + 디스패처 분기)
- Modify: `src/themes.jsx` (computer 플래그)
- Modify: `src/shell.jsx` (`SUBMENUS.computer`)

**Interfaces:**
- Consumes: Task 2~4 컴포넌트.
- Produces: `export function ComputerActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow })`.

- [ ] **Step 1: ComputerActivity 라우터 (computer.jsx)**

`src/computer.jsx` 끝에 추가:
```jsx
export function ComputerActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const p = { tone, fontSize, onComplete, onFinish, voiceShow };
  if (subId === 'mouse') return <MousePlayActivity {...p} />;
  if (subId === 'keyboard') return <KeyboardActivity {...p} mode="explore" />;
  if (subId === 'typing') return <KeyboardActivity {...p} mode="type" />;
  return <TouchTutorialActivity {...p} />; // 'touch' 기본
}
```

- [ ] **Step 2: 디스패처 분기 (activities.jsx)**

`src/activities.jsx` 상단에서 기존 `import { SocialActivity } from './social.jsx'` 아래에 추가:
```jsx
import { ComputerActivity } from './computer.jsx'
```
`function Activity`의 `if (cat.id === 'social') ...` 줄(현재 line 5110) **다음**, `if (cat.id === 'english')` **앞**에 추가:
```jsx
  if (cat.id === 'computer') return <ComputerActivity tone={tone} subId={sub?.id || 'touch'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
```

- [ ] **Step 3: 테마 플래그 (themes.jsx)**

`src/themes.jsx`에서 `computer` 항목 줄(현재 line 14)을 교체:
```jsx
  { id: 'computer',name: '컴퓨터',   emoji: '💻',  hasSub: true,  done: true },
```

- [ ] **Step 4: 서브메뉴 (shell.jsx)**

`src/shell.jsx`의 `SUBMENUS` 객체에서 `social: { ... }` 블록 **다음**(닫는 `};` 앞)에 추가:
```jsx
  computer: {
    title: '컴퓨터랑 친해지기',
    items: [
      { id: 'touch',    name: '터치 연습',   emoji: '👆',  sub: '탭·드래그' },
      { id: 'mouse',    name: '마우스 놀이', emoji: '🖱️', sub: '커서' },
      { id: 'keyboard', name: '가상 키보드', emoji: '⌨️',  sub: '한/영' },
      { id: 'typing',   name: '타자 연습',   emoji: '🔤',  sub: 'Lv.3' },
    ],
  },
```

- [ ] **Step 5: 빌드 + 테스트 + 수동 검증**

Run: `npm test` → PASS. `npm run build` → SUCCESS, 무경고.
Run: `npm run dev`:
- 홈에서 **컴퓨터** 카테고리 활성(준비중 아님). 진입 시 4개 서브메뉴.
- 터치 연습: 풍선 탭 → 사과 드래그→바구니 → 카드 스와이프, 순차 진행 + 완료 칭찬.
- 마우스 놀이: 가상 커서가 손가락 따라옴, 별 클릭 / 상자 더블클릭 열기 / 선물 드래그→상자.
- 가상 키보드: 한/영 토글, 키 누르면 큰 글자+음성.
- 타자 연습: "찾아봐: ○" → 키보드에서 찾아 누르기, ✓/✗, Lv1 힌트 하이라이트, ◀▶ 레벨 1→3.

- [ ] **Step 6: Commit**
```bash
git add src/computer.jsx src/activities.jsx src/themes.jsx src/shell.jsx
git commit -m "feat(computer): 라우터+디스패처+서브메뉴+테마 배선"
```

## Context
`english`/`shape`/`social`과 동일 순환 import(렌더 시점 사용이라 안전). `computer` 분기를 `social` 다음·`english` 앞에 둔다. 키보드 두 메뉴(keyboard/typing)는 `KeyboardActivity`에 `mode` prop으로 분기. 컴퓨터 색은 `tone.cat.computer`(세 톤 모두 정의됨).

---

## 마무리 검증
- [ ] `npm test` 전체 PASS, `npm run build` 무경고.
- [ ] 컴퓨터 4개 서브활동 동작(터치 3제스처·마우스 3과제·가상 키보드 한영·타자 레벨 1→3).
- [ ] 설계 대조: 데이터·4활동·키보드 공유·음성/피드백 전부 구현.

후속: 없음 — 통째-미구현 4개 카테고리(영어·도형/색깔·놀이마을·컴퓨터) 전부 완료.
