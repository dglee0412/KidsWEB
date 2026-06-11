# 1단계 기존 활동 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 음악을 끊김 없이 연속 연주하게 하고, 북·실로폰에 따라치기를 추가하며, 코딩을 '직접 조종'으로 단순화(곰곰이 🐻)하고, 카드뒤집기·그림자에 3레벨 진행을 도입한다.

**Architecture:** 모든 변경은 `src/activities.jsx` 안에서 수행한다. 위험도가 높은 순수 로직(코딩 이동 판정·스테이지 도달성, 따라치기 상태머신, 레벨 설정)은 순수 함수로 추출하고 vitest 단위 테스트로 검증한다. UI 배선은 `npm run dev`로 수동 확인한다.

**Tech Stack:** React 18(전역 `React.useState` 등), Vite 5, Web Audio(`src/lib/audio.js`), 신규 dev 도구 vitest.

설계 문서: `docs/superpowers/specs/2026-06-10-phase1-activity-improvements-design.md`

---

## File Structure

- `src/activities.jsx` — 모든 활동 컴포넌트 + 신규 순수 함수/훅(파일 상단 헬퍼 구역에 추가). 파일 분할은 범위 외.
- `vitest.config.js` — 신규. node 환경 단위 테스트 설정.
- `package.json` — `test` 스크립트 + vitest devDependency.
- `src/__tests__/activity-logic.test.js` — 신규. 순수 함수 단위 테스트.

순수 함수(테스트 대상)는 `activities.jsx`에서 **named export**로 노출한다(컴포넌트는 export 안 함, 기존과 동일하게 `app.jsx`가 쓰는 것만 export). 테스트 파일이 import한다.

---

## Task 1: vitest 테스트 인프라

**Files:**
- Create: `vitest.config.js`
- Modify: `package.json`
- Create: `src/__tests__/smoke.test.js`

- [ ] **Step 1: vitest 설치**

Run:
```bash
npm install -D vitest@^2
```
Expected: `package.json` devDependencies에 `vitest` 추가, 설치 성공.

- [ ] **Step 2: vitest 설정 파일 작성**

Create `vitest.config.js`:
```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
```

- [ ] **Step 3: package.json에 test 스크립트 추가**

`package.json`의 `scripts`에 추가(기존 키 유지):
```json
    "preview": "vite preview",
    "test": "vitest run"
```

- [ ] **Step 4: 스모크 테스트 작성**

Create `src/__tests__/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: 테스트 실행 확인**

Run: `npm test`
Expected: PASS (1 passed).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.js package.json package-lock.json src/__tests__/smoke.test.js
git commit -m "test: vitest 테스트 인프라 추가"
```

---

## Task 2: 코딩 순수 로직 — 이동 판정 + 5스테이지 + 도달성

`activities.jsx`의 코딩 데이터/로직을 직접조종에 맞게 재정의하고 순수 함수로 추출한다.

**Files:**
- Modify: `src/activities.jsx:4163-4182` (`CODING_GRID`, `CODING_LEVELS`, `CODING_DIRS`, `CODING_REPEATS`)
- Test: `src/__tests__/activity-logic.test.js` (Create)

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/__tests__/activity-logic.test.js`:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `resolveMove`/`isSolvable`/`CODING_LEVELS` export가 없어 import 에러.

- [ ] **Step 3: 코딩 데이터/순수함수 구현**

`src/activities.jsx`에서 기존 블록(라인 4163~4182의 `CODING_GRID`/`CODING_LEVELS`/`CODING_DIRS`/`CODING_REPEATS`)을 아래로 **교체**한다:
```js
export const CODING_GRID = 5;
// 직접조종(한 칸 즉시 이동) 5스테이지 — 장애물 점증
export const CODING_LEVELS = [
  { id: 1, name: '똑바로 걷기', start: { x: 0, y: 2 }, goal: { x: 4, y: 2 }, obstacles: [] },
  { id: 2, name: '한 번 꺾기', start: { x: 0, y: 0 }, goal: { x: 3, y: 3 }, obstacles: [{ x: 2, y: 0 }] },
  { id: 3, name: 'ㄹ자 길',   start: { x: 0, y: 0 }, goal: { x: 4, y: 4 }, obstacles: [{ x: 2, y: 1 }, { x: 1, y: 3 }] },
  { id: 4, name: '장애물 피하기', start: { x: 0, y: 2 }, goal: { x: 4, y: 2 }, obstacles: [{ x: 2, y: 1 }, { x: 2, y: 2 }] },
  { id: 5, name: '미로',       start: { x: 0, y: 4 }, goal: { x: 4, y: 0 }, obstacles: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 1, y: 3 }] },
];
const CODING_DIRS = [
  { id: 'up',    label: '⬆', dx: 0,  dy: -1, name: '위' },
  { id: 'down',  label: '⬇', dx: 0,  dy: 1,  name: '아래' },
  { id: 'left',  label: '⬅', dx: -1, dy: 0,  name: '왼쪽' },
  { id: 'right', label: '➡', dx: 1,  dy: 0,  name: '오른쪽' },
];

// 한 칸 이동 판정(순수). 격자 밖/장애물이면 제자리 + blocked=true.
export function resolveMove(pos, dirId, gridSize, obstacles) {
  const dir = CODING_DIRS.find((d) => d.id === dirId);
  if (!dir) return { x: pos.x, y: pos.y, blocked: true };
  const nx = pos.x + dir.dx, ny = pos.y + dir.dy;
  const oob = nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize;
  const hit = obstacles.some((o) => o.x === nx && o.y === ny);
  if (oob || hit) return { x: pos.x, y: pos.y, blocked: true };
  return { x: nx, y: ny, blocked: false };
}

// BFS로 start→goal 도달 가능 여부(순수) — 스테이지 설계 검증용.
export function isSolvable(level, gridSize) {
  const key = (x, y) => `${x},${y}`;
  const blocked = new Set(level.obstacles.map((o) => key(o.x, o.y)));
  const seen = new Set([key(level.start.x, level.start.y)]);
  const queue = [level.start];
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  while (queue.length) {
    const p = queue.shift();
    if (p.x === level.goal.x && p.y === level.goal.y) return true;
    for (const [dx, dy] of dirs) {
      const nx = p.x + dx, ny = p.y + dy;
      if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;
      const k = key(nx, ny);
      if (blocked.has(k) || seen.has(k)) continue;
      seen.add(k);
      queue.push({ x: nx, y: ny });
    }
  }
  return false;
}
```
참고: 이 태스크에서는 `CODING_REPEATS`를 **삭제하지 않는다**. 기존 `CodingActivity`(Task 3에서 교체 예정)가 아직 `CODING_REPEATS`를 참조하므로, 지금 지우면 중간 상태에서 빌드가 깨진다. `CODING_REPEATS`/`CODING_DIRS`는 그대로 두고, 위 블록 중 `CODING_GRID`·`CODING_LEVELS`만 교체 + `resolveMove`/`isSolvable` 추가한다. `CODING_LEVELS`에서 `allowRepeat` 필드가 사라져도 기존 `CodingActivity`는 `level.allowRepeat`가 `undefined`(falsy)가 되어 반복 버튼만 숨겨질 뿐 정상 동작한다. (`CODING_REPEATS`는 Task 3에서 제거.)

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (resolveMove/CODING_LEVELS 테스트 모두 통과).

- [ ] **Step 5: Commit**

```bash
git add src/activities.jsx src/__tests__/activity-logic.test.js
git commit -m "feat(coding): 직접조종 이동 판정 + 5스테이지 데이터 + 도달성 테스트"
```

---

## Task 3: 코딩 UI — 직접 조종 + 곰곰이

`CodingActivity`를 큐/실행 모델에서 직접조종으로 재배선한다.

**Files:**
- Modify: `src/activities.jsx` (`function CodingActivity` 전체, 현재 4184~4565)

- [ ] **Step 1: CodingActivity 본문 교체**

먼저 Task 2에서 남겨둔 `CODING_REPEATS` 상수(`const CODING_REPEATS = [ ... ];`, 주석 `// 반복 블록: ...` 포함)를 **삭제**한다(아래 새 `CodingActivity`는 반복블록을 쓰지 않으므로 미사용 상수가 됨).

그다음 `function CodingActivity(...) { ... }` 전체를 아래로 교체한다:
```jsx
function CodingActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.code;

  const loadStage = () => {
    try { return Math.max(0, Math.min(CODING_LEVELS.length - 1, parseInt(localStorage.getItem('kw-coding-stage') || '0'))); }
    catch { return 0; }
  };
  const [stageIdx, setStageIdx] = useStateA(loadStage);
  const level = CODING_LEVELS[stageIdx];

  const [charPos, setCharPos] = useStateA(level.start);
  const [status, setStatus] = useStateA('idle'); // 'idle' | 'success'
  const [bump, setBump] = useStateA(false);       // 충돌 흔들림
  const wonRef = useRefA(false);

  // 스테이지 변경 시 리셋
  useEffectA(() => {
    setCharPos(level.start);
    setStatus('idle');
    setBump(false);
    wonRef.current = false;
  }, [stageIdx]);

  const move = (dirId) => {
    if (status === 'success') return;
    const r = resolveMove(charPos, dirId, CODING_GRID, level.obstacles);
    if (r.blocked) {
      playSfx('wrong');
      setBump(true);
      setTimeout(() => setBump(false), 300);
      return;
    }
    setCharPos({ x: r.x, y: r.y });
    if (r.x === level.goal.x && r.y === level.goal.y) {
      setStatus('success');
      if (!wonRef.current) {
        wonRef.current = true;
        onComplete && onComplete(3);
        try {
          const cleared = parseInt(localStorage.getItem('kw-coding-cleared') || '0');
          if (stageIdx + 1 > cleared) localStorage.setItem('kw-coding-cleared', String(stageIdx + 1));
        } catch {}
      }
    }
  };

  const resetPos = () => { setCharPos(level.start); setStatus('idle'); };

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

  const CELL = 92, GAP = 10;
  const boardSize = CODING_GRID * CELL + (CODING_GRID - 1) * GAP;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* 타이틀 + 스테이지 이동 */}
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🐻</span>
          곰곰이 길찾기
          <span style={{
            fontSize: fontSize - 2, fontWeight: 900,
            background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16,
            border: t.outline === 'none' ? 'none' : t.outline,
            marginLeft: 6,
          }}>스테이지 {stageIdx + 1}/{CODING_LEVELS.length} · {level.name}</span>
        </div>
        <div style={{ position: 'absolute', top: 18, right: 130, display: 'flex', gap: 8 }}>
          <button onClick={prevStage} disabled={stageIdx === 0}
            style={{
              width: 52, height: 52, borderRadius: 26,
              background: '#fff', border: accentBorder,
              cursor: stageIdx === 0 ? 'default' : 'pointer',
              fontSize: 22, fontFamily: 'inherit', color: t.text,
              opacity: stageIdx === 0 ? 0.4 : 1, boxShadow: t.shadowSm,
            }}>◀</button>
          <button onClick={nextStage}
            style={{
              width: 52, height: 52, borderRadius: 26,
              background: status === 'success' ? t.cat.code : '#fff',
              color: status === 'success' ? t.textOnColor : t.text,
              border: accentBorder, cursor: 'pointer',
              fontSize: 22, fontFamily: 'inherit',
              boxShadow: status === 'success' ? t.shadow : t.shadowSm,
              animation: status === 'success' ? 'kw-pulse 0.9s ease-in-out infinite' : 'none',
            }}>▶</button>
        </div>
      </div>

      {/* 격자맵 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', minHeight: 0 }}>
        <div style={{
          flex: '0 0 auto', background: '#fff', borderRadius: t.cardRadius + 4, padding: 14,
          border: t.outline === 'none' ? 'none' : t.outline, boxShadow: t.shadow, position: 'relative',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${CODING_GRID}, ${CELL}px)`,
            gridAutoRows: `${CELL}px`, gap: GAP, width: boardSize, height: boardSize,
          }}>
            {Array.from({ length: CODING_GRID * CODING_GRID }).map((_, i) => {
              const x = i % CODING_GRID, y = Math.floor(i / CODING_GRID);
              const isObs = level.obstacles.some((o) => o.x === x && o.y === y);
              const isGoal = level.goal.x === x && level.goal.y === y;
              const isStart = level.start.x === x && level.start.y === y;
              return (
                <div key={i} style={{
                  background: isObs ? '#3a3a40' : '#F7F7F7',
                  border: isObs ? 'none' : `2px dashed rgba(0,0,0,0.10)`,
                  borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: CELL - 28, lineHeight: 1, position: 'relative',
                }}>
                  {isGoal && <span style={{ fontSize: CELL - 20, filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.15))', animation: 'kw-pop 0.6s ease both' }}>⭐</span>}
                  {isObs && <span style={{ fontSize: CELL - 36 }}>🧱</span>}
                  {isStart && !isGoal && (
                    <span style={{ position: 'absolute', inset: 6, borderRadius: 10, border: `3px dashed ${color}`, opacity: 0.55 }} />
                  )}
                </div>
              );
            })}
          </div>
          {/* 곰곰이 */}
          <div style={{
            position: 'absolute',
            left: 14 + charPos.x * (CELL + GAP),
            top:  14 + charPos.y * (CELL + GAP),
            width: CELL, height: CELL,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: CELL - 16, lineHeight: 1,
            transition: 'left 0.28s cubic-bezier(.34,1.4,.6,1), top 0.28s cubic-bezier(.34,1.4,.6,1)',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))',
            pointerEvents: 'none',
            animation: bump ? 'kw-shake 0.3s ease' : 'none',
          }}>🐻</div>
        </div>
      </div>

      {/* 하단 방향 패드(즉시 이동) + 처음으로 */}
      <div style={{ flex: '0 0 auto', padding: '14px 24px 18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
        {CODING_DIRS.map((d) => (
          <button key={d.id} onClick={() => move(d.id)} aria-label={d.name}
            onPointerDown={(e) => e.currentTarget.animate(
              [{ transform: 'scale(1) translateY(0)' }, { transform: 'scale(0.92) translateY(2px)' }], { duration: 130 })}
            style={{
              width: 88, height: 88, background: '#fff', color: t.text,
              border: accentBorder, borderRadius: 20, fontSize: 48, lineHeight: 1,
              cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}>{d.label}</button>
        ))}
        <button onClick={resetPos}
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
          style={{
            height: 88, padding: '0 22px', marginLeft: 8,
            background: t.accent, color: t.text,
            border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 20,
            fontSize: fontSize, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: t.shadowSm, display: 'flex', alignItems: 'center', gap: 8,
          }}>↺ 처음으로</button>
      </div>

      {/* 성공 토스트 */}
      {status === 'success' && (
        <div style={{
          position: 'absolute', top: '36%', left: '50%', transform: 'translate(-50%, -50%)',
          background: t.cat.code, color: t.textOnColor, padding: '22px 36px', borderRadius: 32,
          fontSize: fontSize + 10, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 14,
          animation: 'kw-toast 1.6s ease both', pointerEvents: 'none', zIndex: 50,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        }}>
          <span style={{ fontSize: 56 }}>🎉</span>도착했어!
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow}
        text={status === 'success' ? '성공! 다음 스테이지로 가볼까?' : '곰곰이를 ⭐까지 데려가 줘'}
        fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 회귀 테스트 실행**

Run: `npm test`
Expected: PASS (순수 로직 테스트 유지).

- [ ] **Step 3: 수동 확인 (dev 서버)**

Run: `npm run dev` → 홈에서 로봇공장(코딩) 진입.
관찰:
- 방향키 1탭 = 곰곰이 🐻가 1칸 즉시 이동.
- 벽/장애물/격자밖 방향이면 제자리 + 흔들림 + 효과음.
- ⭐ 도착 시 "도착했어!" + ▶ 버튼 강조 → ▶ 누르면 다음 스테이지.
- 5스테이지 모두 진입·클리어 가능, 마지막 ▶에서 칭찬화면.

- [ ] **Step 4: Commit**

```bash
git add src/activities.jsx
git commit -m "feat(coding): 직접조종 UI + 곰곰이 캐릭터, 명령큐 제거"
```

---

## Task 4: 따라치기 공용 로직 + 훅

피아노·북·실로폰이 공유할 따라치기 상태머신을 추가한다.

**Files:**
- Modify: `src/activities.jsx` (상단 헬퍼 구역, `shuffleA` 근처에 추가)
- Test: `src/__tests__/activity-logic.test.js`

- [ ] **Step 1: 실패하는 테스트 추가**

`src/__tests__/activity-logic.test.js` 끝에 추가:
```js
import { nextFollowState } from '../activities.jsx'

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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `nextFollowState` export 없음.

- [ ] **Step 3: 순수 함수 + 훅 구현**

`src/activities.jsx`의 `function shuffleA(arr) {` 정의 **바로 앞**에 추가:
```js
// 따라치기 상태머신(순수). 기대 id와 비교 → step/result 산출.
export function nextFollowState(pattern, step, id) {
  if (!pattern.length) return { step, result: 'idle' };
  if (id !== pattern[step]) return { step, result: 'wrong' };
  const next = step + 1;
  return { step: next, result: next >= pattern.length ? 'done' : 'ok' };
}

// 따라치기 공용 훅 — 피아노/북/실로폰 공유.
// 상태(pattern/step/feedback)만 소유, 사운드/별/연속은 호출측이 핸들러로 처리.
function useFollowPattern() {
  const [pattern, setPattern] = useStateA([]);
  const [step, setStep] = useStateA(0);
  const [feedback, setFeedback] = useStateA(null); // 'ok' | 'wrong' | 'done' | null
  const fbRef = useRefA(null);
  const setFb = (v) => { fbRef.current = v; setFeedback(v); };

  const startRandom = (ids, min = 4, max = 6) => {
    const len = min + Math.floor(Math.random() * (max - min + 1));
    const p = [];
    for (let i = 0; i < len; i++) p.push(ids[Math.floor(Math.random() * ids.length)]);
    setPattern(p); setStep(0); setFb(null);
  };
  const setFixed = (notes) => { setPattern(notes); setStep(0); setFb(null); };
  const replay = () => { setStep(0); setFb(null); };

  // 반환: 'ok'|'wrong'|'done'|'idle'. 호출측이 사운드/별/연속을 결정.
  const tap = (id) => {
    if (!pattern.length || fbRef.current === 'done') return 'idle';
    const { step: ns, result } = nextFollowState(pattern, step, id);
    if (result === 'wrong') {
      setFb('wrong');
      setTimeout(() => { if (fbRef.current === 'wrong') setFb(null); }, 420);
    } else if (result === 'done') {
      setStep(ns); setFb('done');
    } else {
      setStep(ns); setFb('ok');
      setTimeout(() => { if (fbRef.current === 'ok') setFb(null); }, 220);
    }
    return result;
  };

  return { pattern, step, feedback, startRandom, setFixed, replay, tap };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/activities.jsx src/__tests__/activity-logic.test.js
git commit -m "feat(music): 따라치기 공용 상태머신 nextFollowState + useFollowPattern 훅"
```

---

## Task 5: 피아노 연속 연주

`MusicActivity`(피아노)를 공용 훅 기반으로 바꾸고, 완성 후 칭찬화면으로 나가지 않고 다음 패턴/곡으로 이어지게 한다.

**Files:**
- Modify: `src/activities.jsx` (`function MusicActivity`, 현재 3215~3559)

- [ ] **Step 1: 상태/핸들러 교체**

`MusicActivity` 상단의 상태 선언부(현재 3218~3234: `mode`/`pressed`/`pattern`/`step`/`songId`/`feedback`/`playedCount`/`acRef`/`previewing`, 모드 `useEffect`, `playSound`까지 포함)를 아래로 교체한다:
```jsx
  const [mode, setMode] = useStateA('free');
  const [pressed, setPressed] = useStateA(null);
  const [songId, setSongId] = useStateA(null);
  const [playedCount, setPlayedCount] = useStateA(new Set()); // 자유연주 진행
  const follow = useFollowPattern();
  const previewing = useRefA(false);
  const timersRef = useRefA([]);
  const addTimer = (id) => { timersRef.current.push(id); };

  // 언마운트 시 예약 타이머 정리
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  // 모드 변경 시 초기화
  useEffectA(() => {
    follow.setFixed([]); setSongId(null);
  }, [mode]);

  // 건반음은 공유 오디오 모듈 경유 → 효과음 음량 슬라이더 적용 + 단일 AudioContext
  const playSound = (freq) => playTone(freq);
```
이후 본문에서 `pattern`/`step`/`feedback`는 각각 `follow.pattern`/`follow.step`/`follow.feedback`로 참조한다.
주의: `acRef`(원래 미사용)는 제거된다. 이 함수 어디에서도 `acRef`를 참조하지 않는지 확인할 것.

- [ ] **Step 2: tap/패턴 핸들러 교체**

기존 `tap`, `newFollow`, `selectSong`, `replayPattern`, `preview` 정의(현재 3236~3300)를 아래로 교체한다(`playSound`는 Step 1에서 이미 선언됨 — 여기서 다시 선언하지 않음):
```jsx
  const WHITE_IDS = PIANO_WHITE.slice(0, 7).map((n) => n.id);

  const startNewFollow = () => follow.startRandom(WHITE_IDS, 4, 6);

  const advanceSong = () => {
    const idx = PIANO_SONGS.findIndex((s) => s.id === songId);
    const nextSong = PIANO_SONGS[(idx + 1) % PIANO_SONGS.length];
    setSongId(nextSong.id); follow.setFixed(nextSong.notes);
  };

  const tap = (note) => {
    if (previewing.current) return;
    setPressed(note.id);
    playSound(note.freq);
    addTimer(setTimeout(() => setPressed((p) => (p === note.id ? null : p)), 180));

    if (mode === 'free') {
      const isWhite = PIANO_WHITE.some((w) => w.id === note.id);
      if (isWhite) {
        const next = new Set(playedCount);
        if (!next.has(note.id)) {
          next.add(note.id); setPlayedCount(next);
          if (next.size === PIANO_WHITE.length) onComplete && onComplete(3);
          else if (next.size === 4) onComplete && onComplete(1);
        }
      }
      return;
    }

    if ((mode === 'follow' || mode === 'song') && follow.pattern.length) {
      const result = follow.tap(note.id);
      if (result === 'wrong') {
        playSfx('wrong');
      } else if (result === 'done') {
        // 완성 → 별 적립 후 연속(칭찬화면으로 나가지 않음)
        onComplete && onComplete(mode === 'song' ? 3 : 2);
        addTimer(setTimeout(() => {
          if (mode === 'song') advanceSong();
          else startNewFollow();
        }, 900));
      }
    }
  };

  const newFollow = () => startNewFollow();
  const selectSong = (s) => { setSongId(s.id); follow.setFixed(s.notes); };
  const replayPattern = () => follow.replay();
  const preview = async () => {
    if (previewing.current || !follow.pattern.length) return;
    previewing.current = true; follow.replay();
    for (let i = 0; i < follow.pattern.length; i++) {
      const n = PIANO_WHITE.find((w) => w.id === follow.pattern[i]);
      if (n) {
        setPressed(n.id); playSound(n.freq);
        await new Promise((r) => setTimeout(r, 380));
        setPressed(null);
        await new Promise((r) => setTimeout(r, 70));
      }
    }
    previewing.current = false;
  };
```

- [ ] **Step 3: JSX의 pattern/step/feedback 참조 치환**

`MusicActivity`의 JSX(현재 3308~3556)에서 다음을 일괄 치환한다(해당 함수 본문 범위 내에서만):
- `expectedId` 계산식: `(mode === 'follow' || mode === 'song') && feedback !== 'done' ? pattern[step] : null`
  → `(mode === 'follow' || mode === 'song') && follow.feedback !== 'done' ? follow.pattern[follow.step] : null`
- `pattern.length` → `follow.pattern.length` (전부)
- `pattern.map((nid, i) =>` → `follow.pattern.map((nid, i) =>`
- 칩 렌더의 `i < step` → `i < follow.step`, `feedback === 'done'` → `follow.feedback === 'done'`, `i === step` → `i === follow.step`
- `animation: feedback === 'wrong'` → `animation: follow.feedback === 'wrong'`
- VoiceGuide의 `feedback === 'done'` / `feedback === 'wrong'` / `pattern.length` / `pattern[step]` →
  각각 `follow.feedback === 'done'` / `follow.feedback === 'wrong'` / `follow.pattern.length` / `follow.pattern[follow.step]`

`onFinish` 호출은 이 함수에 더 이상 없어야 한다(이미 Step 2에서 제거됨).

- [ ] **Step 4: 회귀 테스트 + 수동 확인**

Run: `npm test` → PASS.
Run: `npm run dev` → 음악 > 피아노:
- 따라치기: 패턴 완주 → "잘했어" 잠깐 → 새 패턴 자동 등장(칭찬화면 안 나감).
- 연습곡: 곡 완주 → 다음 곡 자동 등장, 계속 따라치기 가능.
- 자유연주: 기존대로 끝나지 않음.

- [ ] **Step 5: Commit**

```bash
git add src/activities.jsx
git commit -m "feat(music): 피아노 따라치기/연습곡 연속 연주(칭찬화면 이탈 제거)"
```

---

## Task 6: 북 따라치기

`DrumActivity`에 자유연주/따라치기 모드 탭을 추가한다.

**Files:**
- Modify: `src/activities.jsx` (`function DrumActivity`, 현재 3026~3105)

- [ ] **Step 1: DrumActivity 본문 교체**

`function DrumActivity(...) { ... }` 전체를 아래로 교체한다:
```jsx
function DrumActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.music;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [mode, setMode] = useStateA('free'); // 'free' | 'follow'
  const [pressed, setPressed] = useStateA(null);
  const [playedSet, setPlayedSet] = useStateA(() => new Set());
  const wonRef = useRefA(false);
  const follow = useFollowPattern();
  const previewing = useRefA(false);
  const timersRef = useRefA([]);
  const addTimer = (id) => { timersRef.current.push(id); };
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);
  useEffectA(() => { follow.setFixed([]); }, [mode]);

  const PAD_IDS = DRUM_PADS.map((p) => p.id);
  const startNewFollow = () => follow.startRandom(PAD_IDS, 4, 6);

  const tap = (pad) => {
    setPressed(pad.id);
    playDrum(pad.id);
    addTimer(setTimeout(() => setPressed((p) => (p === pad.id ? null : p)), 150));

    if (mode === 'free') {
      if (!playedSet.has(pad.id)) {
        const next = new Set(playedSet); next.add(pad.id);
        setPlayedSet(next);
        if (next.size === DRUM_PADS.length && !wonRef.current) { wonRef.current = true; onComplete && onComplete(3); }
        else if (next.size === 2) onComplete && onComplete(1);
      }
      return;
    }
    if (mode === 'follow' && follow.pattern.length) {
      const result = follow.tap(pad.id);
      if (result === 'wrong') playSfx('wrong');
      else if (result === 'done') {
        onComplete && onComplete(2);
        addTimer(setTimeout(() => startNewFollow(), 900));
      }
    }
  };

  const preview = async () => {
    if (previewing.current || !follow.pattern.length) return;
    previewing.current = true; follow.replay();
    for (let i = 0; i < follow.pattern.length; i++) {
      const pad = DRUM_PADS.find((p) => p.id === follow.pattern[i]);
      if (pad) {
        setPressed(pad.id); playDrum(pad.id);
        await new Promise((r) => setTimeout(r, 360));
        setPressed(null);
        await new Promise((r) => setTimeout(r, 80));
      }
    }
    previewing.current = false;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🥁</span>드럼
        </div>
      </div>

      {/* 모드 탭 */}
      <div style={{ flex: '0 0 auto', padding: '0 28px 8px', display: 'flex', gap: 10, justifyContent: 'center' }}>
        {[{ id: 'free', name: '자유연주', emoji: '🥁' }, { id: 'follow', name: '따라치기', emoji: '🎼' }].map((m) => {
          const active = mode === m.id;
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              style={{
                minWidth: 180, height: 54,
                background: active ? color : '#fff', color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                borderRadius: 27, fontSize: fontSize - 2, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit', boxShadow: active ? t.shadow : t.shadowSm,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 18px',
              }}>
              <span style={{ fontSize: 24 }}>{m.emoji}</span>{m.name}
            </button>
          );
        })}
      </div>

      {/* 가이드 패널 */}
      <div style={{ flex: '0 0 auto', padding: '0 28px 8px' }}>
        {mode === 'free' ? (
          <div style={{
            background: '#fff', border: accentBorder, borderRadius: t.cardRadius + 2, padding: '14px 22px', boxShadow: t.shadowSm,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ fontSize: fontSize, fontWeight: 800, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 30 }}>🥁</span>패드를 두드려봐!
            </div>
            <div style={{ fontSize: fontSize - 2, color: t.textMuted, fontWeight: 800 }}>소리 {playedSet.size}/{DRUM_PADS.length}</div>
          </div>
        ) : (
          <div style={{
            background: '#fff', border: accentBorder, borderRadius: t.cardRadius + 2, padding: '12px 16px', boxShadow: t.shadowSm,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <button onClick={startNewFollow}
                style={{
                  height: 42, padding: '0 18px', borderRadius: 21, background: t.accent, color: t.text,
                  border: t.outline === 'none' ? 'none' : t.outline, fontSize: fontSize - 2, fontWeight: 900,
                  cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm,
                }}>🎲 새 패턴</button>
              {follow.pattern.length > 0 && (
                <button onClick={preview}
                  style={{
                    height: 38, padding: '0 14px', borderRadius: 19, background: '#fff', color: t.text,
                    border: accentBorder, fontSize: fontSize - 4, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}>🔊 들어보기</button>
              )}
            </div>
            {follow.pattern.length > 0 ? (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', animation: follow.feedback === 'wrong' ? 'kw-shake 0.4s ease' : 'none' }}>
                {follow.pattern.map((pid, i) => {
                  const pad = DRUM_PADS.find((p) => p.id === pid);
                  const passed = i < follow.step || follow.feedback === 'done';
                  const isCurrent = i === follow.step && follow.feedback !== 'done';
                  return (
                    <div key={i} style={{
                      width: 46, height: 46, borderRadius: 12,
                      background: passed ? pad.color : '#fff',
                      border: isCurrent ? `3px solid ${t.text}` : `2px solid rgba(0,0,0,0.10)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                      boxShadow: isCurrent ? `0 0 0 3px ${t.accent}` : 'none',
                    }}>{pad ? pad.emoji : '?'}</div>
                  );
                })}
                {follow.feedback === 'done' && <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', fontSize: fontSize - 2, fontWeight: 900, color: t.cat.code }}>🎉 잘했어!</div>}
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontSize: fontSize - 4, color: t.textMuted, fontWeight: 700 }}>🎲 새 패턴을 눌러서 시작해봐</div>
            )}
          </div>
        )}
      </div>

      {/* 5패드 */}
      <div style={{ flex: 1, padding: '0 32px 16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, alignItems: 'stretch', minHeight: 0 }}>
        {DRUM_PADS.map((p) => {
          const active = pressed === p.id;
          const expected = mode === 'follow' && follow.feedback !== 'done' && follow.pattern[follow.step] === p.id;
          return (
            <button key={p.id}
              onPointerDown={(e) => { e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 120 }); tap(p); }}
              style={{
                background: p.color, color: t.textOnColor,
                border: expected ? `5px solid ${t.text}` : (t.outline === 'none' ? `4px solid ${t.text}` : t.outline),
                borderRadius: t.cardRadius + 4, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: active ? `inset 0 0 0 6px rgba(0,0,0,0.18), ${t.shadow}` : (expected ? `0 0 0 4px ${t.accent}, ${t.shadow}` : t.shadow),
                transform: active ? 'translateY(4px) scale(0.98)' : 'translateY(0) scale(1)',
                transition: 'transform 0.08s ease, box-shadow 0.12s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: 14, userSelect: 'none', touchAction: 'manipulation',
              }}>
              <span style={{ fontSize: 90, lineHeight: 1, filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.18))' }}>{p.emoji}</span>
              <span style={{ fontSize: fontSize + 4, fontWeight: 900 }}>{p.name}</span>
            </button>
          );
        })}
      </div>

      <VoiceGuide tone={t} show={voiceShow}
        text={mode === 'free' ? '둥둥! 두드려봐' : follow.feedback === 'done' ? '완벽해!' : follow.pattern.length ? '순서대로 두드려봐' : '새 패턴을 눌러봐'}
        fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 수동 확인**

Run: `npm run dev` → 음악 > 북: 따라치기 탭에서 새 패턴 → 들어보기 → 순서대로 두드리기 → 완성 시 새 패턴 자동 연속. 자유연주 탭 기존 동작 유지.

- [ ] **Step 3: Commit**

```bash
git add src/activities.jsx
git commit -m "feat(music): 북 따라치기 모드 추가"
```

---

## Task 7: 실로폰 따라치기

`XyloActivity`에 자유연주/따라치기 모드 탭을 추가한다.

**Files:**
- Modify: `src/activities.jsx` (`function XyloActivity`, 현재 3121~3213)

- [ ] **Step 1: XyloActivity 본문 교체**

`function XyloActivity(...) { ... }` 전체를 아래로 교체한다:
```jsx
function XyloActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.music;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [mode, setMode] = useStateA('free'); // 'free' | 'follow'
  const [pressed, setPressed] = useStateA(null);
  const [playedSet, setPlayedSet] = useStateA(() => new Set());
  const wonRef = useRefA(false);
  const follow = useFollowPattern();
  const previewing = useRefA(false);
  const timersRef = useRefA([]);
  const addTimer = (id) => { timersRef.current.push(id); };
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);
  useEffectA(() => { follow.setFixed([]); }, [mode]);

  const BAR_IDS = XYLO_BARS.map((b) => b.id);
  const startNewFollow = () => follow.startRandom(BAR_IDS, 4, 6);
  const playBar = (bar) => playTone(bar.freq, { dur: 0.9, peak: 0.42, type: 'sine' });

  const tap = (bar) => {
    setPressed(bar.id);
    playBar(bar);
    addTimer(setTimeout(() => setPressed((p) => (p === bar.id ? null : p)), 180));

    if (mode === 'free') {
      if (!playedSet.has(bar.id)) {
        const next = new Set(playedSet); next.add(bar.id);
        setPlayedSet(next);
        if (next.size === XYLO_BARS.length && !wonRef.current) { wonRef.current = true; onComplete && onComplete(3); }
        else if (next.size === 4) onComplete && onComplete(1);
      }
      return;
    }
    if (mode === 'follow' && follow.pattern.length) {
      const result = follow.tap(bar.id);
      if (result === 'wrong') playSfx('wrong');
      else if (result === 'done') {
        onComplete && onComplete(2);
        addTimer(setTimeout(() => startNewFollow(), 900));
      }
    }
  };

  const preview = async () => {
    if (previewing.current || !follow.pattern.length) return;
    previewing.current = true; follow.replay();
    for (let i = 0; i < follow.pattern.length; i++) {
      const bar = XYLO_BARS.find((b) => b.id === follow.pattern[i]);
      if (bar) {
        setPressed(bar.id); playBar(bar);
        await new Promise((r) => setTimeout(r, 360));
        setPressed(null);
        await new Promise((r) => setTimeout(r, 80));
      }
    }
    previewing.current = false;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🎼</span>실로폰
        </div>
      </div>

      {/* 모드 탭 */}
      <div style={{ flex: '0 0 auto', padding: '0 28px 8px', display: 'flex', gap: 10, justifyContent: 'center' }}>
        {[{ id: 'free', name: '자유연주', emoji: '🎼' }, { id: 'follow', name: '따라치기', emoji: '🎵' }].map((m) => {
          const active = mode === m.id;
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              style={{
                minWidth: 180, height: 54,
                background: active ? color : '#fff', color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                borderRadius: 27, fontSize: fontSize - 2, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit', boxShadow: active ? t.shadow : t.shadowSm,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 18px',
              }}>
              <span style={{ fontSize: 24 }}>{m.emoji}</span>{m.name}
            </button>
          );
        })}
      </div>

      {/* 가이드 패널 */}
      <div style={{ flex: '0 0 auto', padding: '0 28px 8px' }}>
        {mode === 'free' ? (
          <div style={{
            background: '#fff', border: accentBorder, borderRadius: t.cardRadius + 2, padding: '14px 22px', boxShadow: t.shadowSm,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ fontSize: fontSize, fontWeight: 800, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 30 }}>🎼</span>막대를 두드려 음을 내봐!
            </div>
            <div style={{ fontSize: fontSize - 2, color: t.textMuted, fontWeight: 800 }}>음 {playedSet.size}/{XYLO_BARS.length}</div>
          </div>
        ) : (
          <div style={{
            background: '#fff', border: accentBorder, borderRadius: t.cardRadius + 2, padding: '12px 16px', boxShadow: t.shadowSm,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <button onClick={startNewFollow}
                style={{
                  height: 42, padding: '0 18px', borderRadius: 21, background: t.accent, color: t.text,
                  border: t.outline === 'none' ? 'none' : t.outline, fontSize: fontSize - 2, fontWeight: 900,
                  cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm,
                }}>🎲 새 패턴</button>
              {follow.pattern.length > 0 && (
                <button onClick={preview}
                  style={{
                    height: 38, padding: '0 14px', borderRadius: 19, background: '#fff', color: t.text,
                    border: accentBorder, fontSize: fontSize - 4, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}>🔊 들어보기</button>
              )}
            </div>
            {follow.pattern.length > 0 ? (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', animation: follow.feedback === 'wrong' ? 'kw-shake 0.4s ease' : 'none' }}>
                {follow.pattern.map((bid, i) => {
                  const bar = XYLO_BARS.find((b) => b.id === bid);
                  const passed = i < follow.step || follow.feedback === 'done';
                  const isCurrent = i === follow.step && follow.feedback !== 'done';
                  return (
                    <div key={i} style={{
                      width: 46, height: 46, borderRadius: 12,
                      background: passed ? bar.color : '#fff', color: '#fff',
                      border: isCurrent ? `3px solid ${t.text}` : `2px solid rgba(0,0,0,0.10)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900,
                      textShadow: passed ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
                      boxShadow: isCurrent ? `0 0 0 3px ${t.accent}` : 'none',
                    }}>{bar ? bar.ko : '?'}</div>
                  );
                })}
                {follow.feedback === 'done' && <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', fontSize: fontSize - 2, fontWeight: 900, color: t.cat.code }}>🎉 잘했어!</div>}
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontSize: fontSize - 4, color: t.textMuted, fontWeight: 700 }}>🎲 새 패턴을 눌러서 시작해봐</div>
            )}
          </div>
        )}
      </div>

      {/* 실로폰 본체 */}
      <div style={{ flex: 1, padding: '0 32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{
          background: t.id === 'C' ? '#8B5A2B' : '#6B4423', borderRadius: 24, padding: '32px 28px', boxShadow: t.shadow,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, width: '100%', maxWidth: 920, height: '100%', boxSizing: 'border-box',
        }}>
          {XYLO_BARS.map((b) => {
            const active = pressed === b.id;
            const expected = mode === 'follow' && follow.feedback !== 'done' && follow.pattern[follow.step] === b.id;
            return (
              <button key={b.id}
                onPointerDown={(e) => { e.currentTarget.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(6px)' }], { duration: 110 }); tap(b); }}
                aria-label={b.ko}
                style={{
                  flex: 1, maxWidth: 90, height: `${b.len}px`, background: b.color,
                  border: expected ? `5px solid ${t.text}` : `4px solid rgba(0,0,0,0.25)`,
                  borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: active ? `inset 0 0 0 5px rgba(0,0,0,0.18), 0 3px 0 rgba(0,0,0,0.35)` : (expected ? `0 0 0 4px ${t.accent}, 0 6px 0 rgba(0,0,0,0.35)` : `0 6px 0 rgba(0,0,0,0.35), 0 12px 18px rgba(0,0,0,0.18)`),
                  transform: active ? 'translateY(6px)' : 'translateY(0)', transition: 'transform 0.08s ease, box-shadow 0.12s ease',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 0 16px',
                  color: '#fff', fontSize: fontSize + 4, fontWeight: 900, textShadow: '0 2px 2px rgba(0,0,0,0.45)',
                  userSelect: 'none', touchAction: 'manipulation',
                }}>{b.ko}</button>
            );
          })}
        </div>
      </div>

      <VoiceGuide tone={t} show={voiceShow}
        text={mode === 'free' ? '도레미파솔라시도' : follow.feedback === 'done' ? '완벽해!' : follow.pattern.length ? '순서대로 쳐봐' : '새 패턴을 눌러봐'}
        fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 수동 확인**

Run: `npm run dev` → 음악 > 실로폰: 따라치기 탭 정상 동작(새 패턴/들어보기/연속), 자유연주 유지.

- [ ] **Step 3: Commit**

```bash
git add src/activities.jsx
git commit -m "feat(music): 실로폰 따라치기 모드 추가"
```

---

## Task 8: 카드뒤집기 3레벨

`MemoryActivity`를 레벨 1/2/3(6/8/10쌍)로 확장한다.

**Files:**
- Modify: `src/activities.jsx` (`function MemoryActivity`, 현재 3940~4158)
- Test: `src/__tests__/activity-logic.test.js`

- [ ] **Step 1: 실패하는 테스트 추가**

`src/__tests__/activity-logic.test.js` 끝에 추가:
```js
import { memoryLevelConfig } from '../activities.jsx'

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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `memoryLevelConfig` export 없음.

- [ ] **Step 3: 설정 함수 추가**

`src/activities.jsx`의 `const MEMORY_EMOJI = ...`(현재 3564) **바로 다음 줄**에 추가:
```js
// 카드뒤집기 레벨 — 0:6쌍, 1:8쌍, 2:10쌍
const MEMORY_LEVELS = [
  { pairs: 6, cols: 4 },
  { pairs: 8, cols: 4 },
  { pairs: 10, cols: 5 },
];
export function memoryLevelConfig(level) {
  const i = Math.max(0, Math.min(MEMORY_LEVELS.length - 1, level));
  return MEMORY_LEVELS[i];
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: MemoryActivity 레벨화**

`MemoryActivity` 상단 상수/상태부(현재 3941~3957: `color`/`PAIRS`/`COLS`/`buildDeck`/상태들/`pairsFound`/`allMatched`/`wonRef`)를 아래로 교체한다:
```jsx
  const color = t.cat.brain;
  const loadLevel = () => {
    try { return Math.max(0, Math.min(MEMORY_LEVELS.length - 1, parseInt(localStorage.getItem('kw-memory-level') || '0'))); }
    catch { return 0; }
  };
  const [levelIdx, setLevelIdx] = useStateA(loadLevel);
  const cfg = memoryLevelConfig(levelIdx);
  const PAIRS = cfg.pairs;
  const COLS = cfg.cols;

  const buildDeck = () => {
    const picked = shuffle(MEMORY_EMOJI).slice(0, PAIRS);
    return shuffle([...picked, ...picked]).map((e, i) => ({ id: i, e, matched: false }));
  };
  const [cards, setCards] = useStateA(buildDeck);
  const [flipped, setFlipped] = useStateA([]);
  const [locked, setLocked] = useStateA(false);
  const [attempts, setAttempts] = useStateA(0);
  const [missFlash, setMissFlash] = useStateA(null);
  const [cleared, setCleared] = useStateA(false);
  const pairsFound = cards.filter((c) => c.matched).length / 2;
  const allMatched = pairsFound === PAIRS;
  const wonRef = useRefA(false);
```

- [ ] **Step 6a: 완료 useEffect 교체 + 레벨 변경 effect 추가**

기존 `useEffect`(allMatched 시 `onFinish`, 현재 3959~3965)를 아래로 교체한다(두 effect 모두 onFlip 정의 앞에 위치):
```jsx
  useEffectA(() => {
    if (allMatched && !wonRef.current) {
      wonRef.current = true;
      onComplete && onComplete(3);
      try {
        const c = parseInt(localStorage.getItem('kw-memory-cleared') || '0');
        if (levelIdx + 1 > c) localStorage.setItem('kw-memory-cleared', String(levelIdx + 1));
      } catch {}
      setTimeout(() => setCleared(true), 700);
    }
  }, [allMatched]);

  useEffectA(() => {
    wonRef.current = false;
    setCards(buildDeck());
    setFlipped([]); setLocked(false); setAttempts(0); setMissFlash(null); setCleared(false);
  }, [levelIdx]);
```

- [ ] **Step 6b: restart 교체 + nextLevel 추가**

기존 `restart`(현재 3995~3999) 정의를 아래로 교체한다:
```jsx
  const restart = () => {
    wonRef.current = false;
    setCards(buildDeck());
    setFlipped([]); setLocked(false); setAttempts(0); setMissFlash(null); setCleared(false);
  };

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

- [ ] **Step 7: 타이틀 레벨 라벨 + 클리어 패널 추가**

타이틀의 `Lv.1` 고정 배지(현재 4010~4016)의 텍스트를 `Lv.{levelIdx + 1}`로 바꾼다:
```jsx
          }}>Lv.{levelIdx + 1}</span>
```
그리고 완료 토스트 블록(현재 4136~4150 `{allMatched && (...)}`)을 아래로 교체한다:
```jsx
      {cleared && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, zIndex: 60,
        }}>
          <div style={{ fontSize: 120, lineHeight: 1, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 24, fontWeight: 900, color: '#fff' }}>
            {levelIdx < MEMORY_LEVELS.length - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart}
              style={{
                background: '#fff', color: t.text, border: 'none', borderRadius: 28, padding: '16px 28px',
                fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow,
              }}>🔄 다시</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{
                background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline,
                borderRadius: 28, padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow,
              }}>{levelIdx < MEMORY_LEVELS.length - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}</button>
          </div>
        </div>
      )}
```

- [ ] **Step 8: 회귀 테스트 + 수동 확인**

Run: `npm test` → PASS.
Run: `npm run dev` → 두뇌 > 카드뒤집기:
- Lv1(6쌍 4×3) 완료 → "Lv.1 성공! / 다음 레벨" → Lv2(8쌍 4×4) → Lv3(10쌍 5×4).
- 마지막 레벨 "끝내기" → 칭찬화면. 재진입 시 마지막 레벨 유지(localStorage).

- [ ] **Step 9: Commit**

```bash
git add src/activities.jsx src/__tests__/activity-logic.test.js
git commit -m "feat(brain): 카드뒤집기 3레벨(6/8/10쌍) + 레벨 전환"
```

---

## Task 9: 그림자 3레벨

`ShadowActivity`를 레벨 1/2/3(보기수·문제수 점증)으로 확장한다.

**Files:**
- Modify: `src/activities.jsx` (`function ShadowActivity`, 현재 3774~3938)
- Test: `src/__tests__/activity-logic.test.js`

- [ ] **Step 1: 실패하는 테스트 추가**

`src/__tests__/activity-logic.test.js` 끝에 추가:
```js
import { shadowLevelConfig } from '../activities.jsx'

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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `shadowLevelConfig` export 없음.

- [ ] **Step 3: 설정 함수 추가**

`src/activities.jsx`의 `const SHADOW_POOL = [...]`(현재 3769~3772) **바로 다음**에 추가:
```js
// 그림자 레벨 — 0:보기4·6문제, 1:보기4·8문제, 2:보기6·10문제
const SHADOW_LEVELS = [
  { options: 4, questions: 6 },
  { options: 4, questions: 8 },
  { options: 6, questions: 10 },
];
export function shadowLevelConfig(level) {
  const i = Math.max(0, Math.min(SHADOW_LEVELS.length - 1, level));
  return SHADOW_LEVELS[i];
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: ShadowActivity 레벨화**

`ShadowActivity` 상단부(현재 3775~3791: `color`/`accentBorder`/`TOTAL_Q`/`newRound`/상태들)를 아래로 교체한다:
```jsx
  const color = t.cat.brain;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const loadLevel = () => {
    try { return Math.max(0, Math.min(SHADOW_LEVELS.length - 1, parseInt(localStorage.getItem('kw-shadow-level') || '0'))); }
    catch { return 0; }
  };
  const [levelIdx, setLevelIdx] = useStateA(loadLevel);
  const cfg = shadowLevelConfig(levelIdx);
  const TOTAL_Q = cfg.questions;
  const OPTS = cfg.options;

  const newRound = () => {
    const pool = shuffle(SHADOW_POOL);
    const target = pool[0];
    const opts = shuffle([target, ...pool.slice(1, OPTS)]);
    return { target, opts };
  };

  const [round, setRound] = useStateA(newRound);
  const [status, setStatus] = useStateA('q');
  const [picked, setPicked] = useStateA(null);
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
```

- [ ] **Step 6: 정답/레벨 전환 핸들러 교체**

기존 `onPick`의 완료 분기와 `restart`(현재 3800~3815)를 아래로 교체한다:
```jsx
      setTimeout(() => {
        if (nextN >= TOTAL_Q) {
          setDone(true);
          onComplete && onComplete(3);
          try {
            const c = parseInt(localStorage.getItem('kw-shadow-cleared') || '0');
            if (levelIdx + 1 > c) localStorage.setItem('kw-shadow-cleared', String(levelIdx + 1));
          } catch {}
        } else {
          setRound(newRound()); setStatus('q'); setPicked(null);
        }
      }, 950);
    } else {
      setStatus('wrong'); setPicked(s);
      setTimeout(() => { setStatus('q'); setPicked(null); }, 650);
    }
  };

  const restart = () => { setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound()); };

  const nextLevel = () => {
    if (levelIdx < SHADOW_LEVELS.length - 1) {
      const next = levelIdx + 1;
      setLevelIdx(next);
    } else {
      onFinish && onFinish();
    }
  };

  useEffectA(() => {
    try { localStorage.setItem('kw-shadow-level', String(levelIdx)); } catch {}
    setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound());
  }, [levelIdx]);
```
참고: `onPick` 함수의 시작부(`if (status !== 'q' || done) return;` … `if (s === round.target) { setStatus('right'); ... setProgress(nextN);`)는 그대로 두고, 위 코드는 그 `setProgress(nextN);` 다음의 `setTimeout(...)`부터 함수 끝까지를 대체한다.

- [ ] **Step 7: 레벨 배지 + 보기 그리드 + 완료화면 버튼**

(a) 타이틀의 `Lv.2` 고정 배지(현재 3829)를 동적으로:
```jsx
          }}>Lv.{levelIdx + 1}</span>
```
(b) 4지선다 그리드를 보기 수에 맞게 — 보기 컨테이너 스타일(현재 3864의 `gridTemplateColumns: 'repeat(4, 1fr)'`)을 교체:
```jsx
          <div style={{ flex: '0 0 auto', padding: '14px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${OPTS}, 1fr)`, gap: 14 }}>
```
(c) 완료 화면의 "다시 풀기" 버튼(현재 3918~3928)을 다시/다음 두 버튼으로 교체:
```jsx
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            <button onClick={restart}
              style={{
                background: '#fff', color: t.text, border: accentBorder, borderRadius: 32, padding: '18px 30px',
                fontSize: fontSize + 4, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm,
              }}>🔄 다시 풀기</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{
                background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline,
                borderRadius: 32, padding: '18px 36px', fontSize: fontSize + 6, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow,
                display: 'inline-flex', alignItems: 'center', gap: 10,
              }}>{levelIdx < SHADOW_LEVELS.length - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}</button>
          </div>
```

- [ ] **Step 8: 회귀 테스트 + 수동 확인**

Run: `npm test` → PASS.
Run: `npm run dev` → 두뇌 > 그림자:
- Lv1(보기4·6문제) → 완료화면 "다음 레벨" → Lv2(보기4·8문제) → Lv3(보기6·10문제).
- 마지막 "끝내기" → 칭찬화면. 보기 그리드가 레벨별 개수에 맞게 렌더.

- [ ] **Step 9: Commit**

```bash
git add src/activities.jsx src/__tests__/activity-logic.test.js
git commit -m "feat(brain): 그림자 3레벨(보기/문제수 점증) + 레벨 전환"
```

---

## 마무리 검증

- [ ] **전체 테스트**: `npm test` → 모든 단위 테스트 PASS.
- [ ] **빌드 확인**: `npm run build` → 에러 없이 빌드 성공.
- [ ] **수동 회귀**: `npm run dev`로 음악(피아노/북/실로폰)·코딩·두뇌(카드뒤집기/그림자) 전 활동 진입 및 핵심 흐름 확인.
- [ ] **설계 대조**: 항목 #3,#4,#7,#8,#9,#10이 각각 동작하는지 설계 문서와 대조.

미반영 항목(별도 단계): #5,#6(한글 따라쓰기·예시 단어 듣기), #2(모양 꽃밭), #11(영어·컴퓨터) — 각각 별도 명세/계획에서 진행.
