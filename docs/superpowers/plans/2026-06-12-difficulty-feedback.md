# 오답 피드백 + 레벨 난이도 확장 (G1+G2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 선택형 활동에 오답 ✗/정답 ✓ 피드백을 통일하고, 카드뒤집기(5레벨·3매칭·전레벨 미리보기)·그림자(멀티타깃)·단어 맞추기(영어 5레벨, 한글 레벨 신설, 상위 멀티선택)의 난이도를 확장한다.

**Architecture:** 공용 컴포넌트 `PickMark`와 멀티선택 훅 `useMultiPick`(+순수함수 `multiPickNext`/`multiTargetOptions`)을 `activities.jsx`에 추가·export 하여 그림자·단어가 공유한다. 레벨 설정/보기 생성은 순수 함수로 분리해 vitest로 검증.

**Tech Stack:** React 18(전역 alias), Vite 5, vitest.

설계: `docs/superpowers/specs/2026-06-12-difficulty-feedback-design.md`

---

## File Structure
- `src/activities.jsx` — `PickMark`/`useMultiPick`/`multiPickNext`/`multiTargetOptions`(export), 레벨설정 확장, Memory/Shadow/HangulWords 재작성, 단순 picker들에 PickMark 적용.
- `src/english.jsx` — EnglishWordsActivity 멀티 확장, ENGLISH_LEVELS 5레벨, PhonicsActivity에 PickMark.
- `src/__tests__/activity-logic.test.js` — 레벨설정/멀티 순수함수 테스트 추가.
- `src/__tests__/english-logic.test.js` — englishLevelConfig 5레벨 테스트 갱신.

---

# Phase 0 — 공용 헬퍼 + 순수 함수 + 테스트

## Task 0: PickMark + 멀티선택 순수함수/훅 + 멀티보기 생성기

**Files:** Modify `src/activities.jsx`, `src/__tests__/activity-logic.test.js`

- [ ] **Step 1: 실패 테스트 추가**

`src/__tests__/activity-logic.test.js` 끝에 추가:
```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test` → FAIL (multiPickNext/multiTargetOptions 미정의).

- [ ] **Step 3: 구현 (activities.jsx 상단 헬퍼 구역, `function shuffle` 정의 다음에 추가)**

```jsx
// ── 멀티선택 공용(그림자·단어) ───────────────────────────────
// 순수: 현재 found에 key 선택을 반영. result: already|correct|wrong|complete
export function multiPickNext(foundArr, key, targetKeys) {
  if (foundArr.includes(key)) return { found: foundArr, result: 'already' };
  if (targetKeys.includes(key)) {
    const found = [...foundArr, key];
    return { found, result: found.length === targetKeys.length ? 'complete' : 'correct' };
  }
  return { found: foundArr, result: 'wrong' };
}

// 순수: 정답 키 전부 + distractor → 고유 보기 min(optionCount, pool)개(무한루프 없음).
export function multiTargetOptions(targetKeys, optionCount, poolKeys) {
  const need = Math.min(optionCount, poolKeys.length);
  const distractors = shuffle(poolKeys.filter((k) => !targetKeys.includes(k)));
  const picked = distractors.slice(0, Math.max(0, need - targetKeys.length));
  return shuffle([...targetKeys, ...picked]);
}

// 멀티선택 훅 — found/wrongKey 상태 + ref 미러(빠른 연속 선택 stale 방지).
export function useMultiPick() {
  const [found, setFound] = useStateA([]);
  const [wrongKey, setWrongKey] = useStateA(null);
  const foundRef = useRefA([]);
  const setF = (arr) => { foundRef.current = arr; setFound(arr); };
  const reset = () => { setF([]); setWrongKey(null); };
  const pick = (key, targetKeys) => {
    const r = multiPickNext(foundRef.current, key, targetKeys);
    if (r.result === 'wrong') {
      setWrongKey(key);
      setTimeout(() => setWrongKey((k) => (k === key ? null : k)), 650);
    } else if (r.result !== 'already') {
      setF(r.found);
    }
    return r.result;
  };
  return { found, wrongKey, pick, reset };
}

// 오답 ✗ / 정답 ✓ 배지 — 보기 버튼(position:relative) 우상단에 절대배치.
export function PickMark({ kind }) {
  const wrong = kind === 'wrong';
  return (
    <span aria-hidden style={{
      position: 'absolute', top: 6, right: 8, width: 40, height: 40, borderRadius: 20,
      background: wrong ? '#E5484D' : '#3BA55D', color: '#fff',
      fontSize: 26, fontWeight: 900, lineHeight: '40px', textAlign: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)', animation: 'kw-pop 0.3s ease both', pointerEvents: 'none',
    }}>{wrong ? '✗' : '✓'}</span>
  );
}
```
(`shuffle`, `useStateA`, `useRefA`는 파일에 이미 존재.)

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test` → PASS. `npm run build` → SUCCESS, 무경고.

- [ ] **Step 5: Commit**
```bash
git add src/activities.jsx src/__tests__/activity-logic.test.js
git commit -m "feat(shared): PickMark + useMultiPick/multiPickNext/multiTargetOptions + 테스트"
```

---

## Task 1: 레벨 설정 확장(memory/shadow/english/hangul) + 테스트

**Files:** Modify `src/activities.jsx`, `src/english.jsx`, both test files.

- [ ] **Step 1: 실패 테스트 추가**

`src/__tests__/activity-logic.test.js` 끝에 추가(메모리 설정은 Task 2에서 — 여기서 바꾸면 기존 MemoryActivity가 런타임에서 깨지므로 분리):
```js
import { shadowLevelConfig, hangulWordLevelConfig } from '../activities.jsx'

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
```
`src/__tests__/english-logic.test.js`의 기존 `englishLevelConfig` describe를 아래로 교체:
```js
describe('englishLevelConfig(5레벨)', () => {
  it('상위 레벨 멀티타깃', () => {
    expect(englishLevelConfig(0)).toEqual({ targets: 1, options: 4, questions: 6 })
    expect(englishLevelConfig(2)).toEqual({ targets: 1, options: 6, questions: 10 })
    expect(englishLevelConfig(3)).toEqual({ targets: 2, options: 6, questions: 8 })
    expect(englishLevelConfig(4)).toEqual({ targets: 3, options: 8, questions: 10 })
    expect(englishLevelConfig(9)).toEqual({ targets: 3, options: 8, questions: 10 })
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test` → FAIL (새 형태/함수 불일치).

- [ ] **Step 3: 구현** (메모리 설정은 Task 2에서 함께 변경)

(a) `src/activities.jsx` — 기존 `SHADOW_LEVELS`/`shadowLevelConfig` 정의를 교체:
```js
const SHADOW_LEVELS = [
  { targets: 1, options: 4, questions: 6 },
  { targets: 1, options: 4, questions: 8 },
  { targets: 1, options: 6, questions: 10 },
  { targets: 2, options: 6, questions: 8 },
  { targets: 3, options: 8, questions: 10 },
];
export function shadowLevelConfig(level) {
  const i = Math.max(0, Math.min(SHADOW_LEVELS.length - 1, level));
  return SHADOW_LEVELS[i];
}
```

(b) `src/activities.jsx` — `HANGUL_WORDS` 배열 정의 **다음**에 추가(한글 낱말 레벨):
```js
const HANGUL_WORD_LEVELS = [
  { targets: 1, options: 3, questions: 8 },
  { targets: 1, options: 4, questions: 10 },
  { targets: 1, options: 5, questions: 10 },
  { targets: 2, options: 5, questions: 8 },
  { targets: 3, options: 6, questions: 10 },
];
export function hangulWordLevelConfig(level) {
  const i = Math.max(0, Math.min(HANGUL_WORD_LEVELS.length - 1, level));
  const c = HANGUL_WORD_LEVELS[i];
  // 보기 수는 풀 크기를 넘지 않게 클램프(타깃+1 이상 보장)
  const options = Math.max(c.targets + 1, Math.min(c.options, HANGUL_WORDS.length));
  return { targets: c.targets, options, questions: c.questions };
}
```

(c) `src/english.jsx` — 기존 `ENGLISH_LEVELS`/`englishLevelConfig`를 교체:
```js
const ENGLISH_LEVELS = [
  { targets: 1, options: 4, questions: 6 },
  { targets: 1, options: 4, questions: 8 },
  { targets: 1, options: 6, questions: 10 },
  { targets: 2, options: 6, questions: 8 },
  { targets: 3, options: 8, questions: 10 },
];
export function englishLevelConfig(level) {
  const i = Math.max(0, Math.min(ENGLISH_LEVELS.length - 1, level));
  return ENGLISH_LEVELS[i];
}
```
주의: `englishLevelConfig`의 반환 형태가 `{options,questions}`→`{targets,options,questions}`로 바뀐다. PhonicsActivity는 `cfg.options`/`cfg.questions`만 쓰므로 영향 없음(파닉스는 단일타깃 유지). EnglishWordsActivity는 Task 5에서 멀티 대응으로 교체.

- [ ] **Step 4: 통과 확인**

Run: `npm test` → PASS. `npm run build` → SUCCESS.

- [ ] **Step 5: Commit**
```bash
git add src/activities.jsx src/english.jsx src/__tests__/activity-logic.test.js src/__tests__/english-logic.test.js
git commit -m "feat(levels): memory/shadow/english/hangul 레벨설정 5단계+멀티타깃 + 테스트"
```

---

# Phase 1 — 카드뒤집기 (3매칭 + 전레벨 미리보기 + 5레벨)

## Task 2: MemoryActivity 재작성

**Files:** Modify `src/activities.jsx` (`MEMORY_LEVELS`/`memoryLevelConfig` + `MemoryActivity`), `src/__tests__/activity-logic.test.js`

- [ ] **Step 1: 메모리 레벨설정 교체 + 테스트**

`src/__tests__/activity-logic.test.js` 끝에 추가:
```js
import { memoryLevelConfig } from '../activities.jsx'

describe('memoryLevelConfig(5레벨)', () => {
  it('레벨별 group/count/cols', () => {
    expect(memoryLevelConfig(0)).toEqual({ group: 2, count: 6,  cols: 4 })
    expect(memoryLevelConfig(3)).toEqual({ group: 3, count: 4,  cols: 4 })
    expect(memoryLevelConfig(4)).toEqual({ group: 3, count: 6,  cols: 6 })
    expect(memoryLevelConfig(9)).toEqual({ group: 3, count: 6,  cols: 6 })
  })
})
```
`src/activities.jsx` — 기존 `MEMORY_LEVELS`/`memoryLevelConfig` 정의를 교체:
```js
const MEMORY_LEVELS = [
  { group: 2, count: 6,  cols: 4 },
  { group: 2, count: 8,  cols: 4 },
  { group: 2, count: 10, cols: 5 },
  { group: 3, count: 4,  cols: 4 },
  { group: 3, count: 6,  cols: 6 },
];
export function memoryLevelConfig(level) {
  const i = Math.max(0, Math.min(MEMORY_LEVELS.length - 1, level));
  return MEMORY_LEVELS[i];
}
```
(이 단계 직후 기존 MemoryActivity는 `cfg.pairs` 참조로 깨지므로, 반드시 이어서 Step 2에서 컴포넌트를 교체한다.)

- [ ] **Step 2: MemoryActivity 본문 교체**

`function MemoryActivity(...) { ... }` 전체를 아래로 교체:
```jsx
function MemoryActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.brain;
  const [levelIdx, setLevelIdx] = useStateA(0);
  const cfg = memoryLevelConfig(levelIdx);
  const GROUP = cfg.group;   // 2매칭 | 3매칭
  const COUNT = cfg.count;   // 그룹 수
  const COLS = cfg.cols;

  const buildDeck = () => {
    const picked = shuffle(MEMORY_EMOJI).slice(0, COUNT);
    const all = [];
    picked.forEach((e) => { for (let g = 0; g < GROUP; g++) all.push(e); });
    return shuffle(all).map((e, i) => ({ id: i, e, matched: false }));
  };
  const [cards, setCards] = useStateA(buildDeck);
  const [flipped, setFlipped] = useStateA([]);
  const [locked, setLocked] = useStateA(false);
  const [attempts, setAttempts] = useStateA(0);
  const [missFlash, setMissFlash] = useStateA(null);
  const [cleared, setCleared] = useStateA(false);
  const [previewing, setPreviewing] = useStateA(true);
  const groupsFound = cards.filter((c) => c.matched).length / GROUP;
  const allMatched = COUNT > 0 && groupsFound === COUNT;
  const wonRef = useRefA(false);
  const timersRef = useRefA([]);
  const addTimer = (id) => timersRef.current.push(id);
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  // 라운드 시작: 전체 공개(미리보기) → 1.5초 후 가림
  const startPreview = () => {
    setPreviewing(true); setLocked(true);
    addTimer(setTimeout(() => { setPreviewing(false); setLocked(false); }, 1500));
  };

  useEffectA(() => {
    if (allMatched && !wonRef.current) {
      wonRef.current = true;
      onComplete && onComplete(3);
      addTimer(setTimeout(() => setCleared(true), 700));
    }
  }, [allMatched]);

  useEffectA(() => {
    wonRef.current = false;
    setCards(buildDeck());
    setFlipped([]); setAttempts(0); setMissFlash(null); setCleared(false);
    startPreview();
  }, [levelIdx]);

  const onFlip = (i) => {
    if (locked || previewing) return;
    if (cards[i].matched) return;
    if (flipped.includes(i)) return;
    const nf = [...flipped, i];
    setFlipped(nf);
    if (nf.length === GROUP) {
      setLocked(true);
      setAttempts((a) => a + 1);
      const allSame = nf.every((idx) => cards[idx].e === cards[nf[0]].e);
      if (allSame) {
        playSfx('correct');
        addTimer(setTimeout(() => {
          setCards((cs) => cs.map((c, idx) => nf.includes(idx) ? { ...c, matched: true } : c));
          setFlipped([]); setLocked(false);
        }, 650));
      } else {
        playSfx('wrong');
        setMissFlash(nf);
        addTimer(setTimeout(() => { setFlipped([]); setLocked(false); setMissFlash(null); }, 1000));
      }
    }
  };

  const restart = () => {
    wonRef.current = false;
    setCards(buildDeck());
    setFlipped([]); setLocked(false); setAttempts(0); setMissFlash(null); setCleared(false);
    startPreview();
  };
  const nextLevel = () => { if (levelIdx < MEMORY_LEVELS.length - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };

  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🃏</span>
          카드 뒤집기
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>
            Lv.{levelIdx + 1}{GROUP === 3 ? ' · 3장' : ''}
          </span>
        </div>
        <LevelStepper tone={t} cur={levelIdx} total={MEMORY_LEVELS.length} onPrev={prevLevel} onNext={nextLevel} />
      </div>

      <div style={{ flex: '0 0 auto', padding: '0 28px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{ background: '#fff', borderRadius: 999, padding: '8px 20px', border: accentBorder,
          fontSize: fontSize, fontWeight: 900, color: t.text, boxShadow: t.shadowSm, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🎯</span> 시도 <span style={{ color }}>{attempts}</span>
        </div>
        <div style={{ background: '#fff', borderRadius: 999, padding: '8px 20px', border: accentBorder,
          fontSize: fontSize, fontWeight: 900, color: t.text, boxShadow: t.shadowSm, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>💑</span> 찾기 <span style={{ color }}>{groupsFound}/{COUNT}</span>
        </div>
        <button onClick={restart}
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 130 })}
          style={{ background: t.accent, color: t.text, border: t.outline === 'none' ? 'none' : t.outline,
            borderRadius: 999, padding: '8px 18px', fontSize: fontSize - 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 새 게임</button>
      </div>

      <div style={{ flex: 1, padding: '0 28px 8px', display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${Math.ceil(cards.length / COLS)}, 1fr)`, gap: 14, minHeight: 0 }}>
        {cards.map((c, i) => {
          const open = previewing || flipped.includes(i) || c.matched;
          const isMissing = missFlash && missFlash.includes(i);
          return (
            <div key={c.id} onClick={() => onFlip(i)}
              style={{ perspective: 1000, cursor: c.matched ? 'default' : 'pointer', animation: isMissing ? 'kw-shake 0.5s ease' : 'none' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d',
                transform: open ? 'rotateY(180deg)' : 'rotateY(0)', transition: 'transform 0.5s cubic-bezier(.34,1.2,.4,1)' }}>
                <div style={{ position: 'absolute', inset: 0, background: color, border: t.outline === 'none' ? 'none' : t.outline,
                  borderRadius: t.cardRadius, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textOnColor, boxShadow: t.shadow,
                  backgroundImage: t.id === 'C' ? 'none' : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.32), transparent 60%)` }}>
                  <span style={{ fontSize: 52, opacity: 0.9, textShadow: '0 3px 0 rgba(0,0,0,0.18)' }}>❓</span>
                </div>
                <div style={{ position: 'absolute', inset: 0, background: '#fff',
                  border: c.matched ? `4px solid ${t.cat.code}` : accentBorder, borderRadius: t.cardRadius,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, lineHeight: 1,
                  boxShadow: c.matched ? `0 0 0 4px ${t.cat.code}33, ${t.shadowSm}` : t.shadowSm, opacity: c.matched ? 0.92 : 1 }}>
                  <span>{c.e}</span>
                  {c.matched && <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 26, animation: 'kw-pop 0.4s ease both' }}>✅</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {previewing && (
        <div style={{ position: 'absolute', top: 92, left: '50%', transform: 'translateX(-50%)', zIndex: 40,
          background: t.accent, color: t.text, padding: '6px 18px', borderRadius: 999, fontSize: fontSize, fontWeight: 900,
          boxShadow: t.shadowSm, pointerEvents: 'none' }}>👀 잘 봐둬!</div>
      )}

      {cleared && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 18, zIndex: 60 }}>
          <div style={{ fontSize: 120, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 24, fontWeight: 900, color: '#fff' }}>
            {levelIdx < MEMORY_LEVELS.length - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: 'none', borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>🔄 다시</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < MEMORY_LEVELS.length - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow}
        text={previewing ? '카드를 잘 봐둬!' : allMatched ? '와! 다 맞췄어!' : GROUP === 3 ? '같은 그림 3장을 찾아봐' : '같은 짝을 찾아봐'}
        fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 3: 검증**

Run: `npm test` → 통과. `npm run build` → SUCCESS, 무경고.
Run: `npm run dev` → 두뇌 > 카드뒤집기: 진입 시 1.5초 전체 공개 후 가림. Lv1~3 2장 매칭, Lv4~5 **3장** 매칭, 5레벨 ◀▶, 재진입 1레벨.

- [ ] **Step 4: Commit**
```bash
git add src/activities.jsx src/__tests__/activity-logic.test.js
git commit -m "feat(brain): 카드뒤집기 5레벨 + 3장 매칭 + 전레벨 미리보기"
```

---

# Phase 2 — 그림자 멀티타깃

## Task 3: ShadowActivity 재작성(멀티타깃 + PickMark)

**Files:** Modify `src/activities.jsx` (`ShadowActivity` 전체)

- [ ] **Step 1: ShadowActivity 본문 교체**

`function ShadowActivity(...) { ... }` 전체를 아래로 교체:
```jsx
function ShadowActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.brain;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [levelIdx, setLevelIdx] = useStateA(0);
  const cfg = shadowLevelConfig(levelIdx);
  const TOTAL_Q = cfg.questions;

  const newRound = () => {
    const pool = shuffle(SHADOW_POOL);
    const targets = pool.slice(0, cfg.targets);
    const opts = multiTargetOptions(targets, cfg.options, SHADOW_POOL);
    return { targets, opts };
  };
  const [round, setRound] = useStateA(newRound);
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const mp = useMultiPick();
  const timersRef = useRefA([]);
  const addTimer = (id) => timersRef.current.push(id);
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  useEffectA(() => {
    setProgress(0); setDone(false); setRound(newRound()); mp.reset();
  }, [levelIdx]);

  const onPick = (s) => {
    if (done) return;
    const r = mp.pick(s, round.targets);
    if (r === 'wrong') playSfx('wrong');
    else if (r === 'correct') playSfx('correct');
    else if (r === 'complete') {
      playSfx('correct');
      onComplete && onComplete(1);
      const nextN = progress + 1; setProgress(nextN);
      addTimer(setTimeout(() => {
        if (nextN >= TOTAL_Q) { setDone(true); onComplete && onComplete(3); }
        else { setRound(newRound()); mp.reset(); }
      }, 850));
    }
  };

  const restart = () => { setProgress(0); setDone(false); setRound(newRound()); mp.reset(); };
  const nextLevel = () => { if (levelIdx < SHADOW_LEVELS.length - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };

  const multi = cfg.targets > 1;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>👤</span>
          그림자 맞추기
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>Lv.{levelIdx + 1}</span>
        </div>
        <LevelStepper tone={t} cur={levelIdx} total={SHADOW_LEVELS.length} onPrev={prevLevel} onNext={nextLevel} />
      </div>

      {!done ? (
        <React.Fragment>
          <div style={{ flex: 1, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            <div style={{ width: '100%', maxWidth: 720, height: '100%', background: color, border: t.outline === 'none' ? 'none' : t.outline,
              borderRadius: t.cardRadius + 8, padding: '20px 24px', boxShadow: t.shadow, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14, boxSizing: 'border-box' }}>
              <div style={{ fontSize: fontSize, fontWeight: 900, color: t.textOnColor, background: 'rgba(0,0,0,0.18)', padding: '6px 16px', borderRadius: 16 }}>
                {multi ? `이 그림자 ${cfg.targets}개를 모두 찾아봐` : '이 그림자는 누구일까?'}
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                {round.targets.map((tg) => {
                  const got = mp.found.includes(tg);
                  return (
                    <div key={tg} style={{ fontSize: multi ? 130 : 190, lineHeight: 1,
                      filter: got ? 'none' : 'brightness(0) drop-shadow(0 6px 0 rgba(0,0,0,0.18))', transition: 'filter 0.3s ease' }}>{tg}</div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ flex: '0 0 auto', padding: '14px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${cfg.options}, 1fr)`, gap: 14 }}>
            {round.opts.map((s, i) => {
              const isRight = mp.found.includes(s);
              const isWrong = mp.wrongKey === s;
              return (
                <button key={i} onClick={() => onPick(s)} disabled={isRight}
                  onPointerDown={(e) => !isRight && e.currentTarget.animate([{transform:'scale(1)'},{transform:'scale(0.92)'}],{duration:130})}
                  style={{ position: 'relative', height: 92, fontSize: 54,
                    background: isRight ? t.cat.code : isWrong ? t.cat.shape : '#fff',
                    border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline, borderRadius: t.cardRadius,
                    cursor: isRight ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: t.shadow,
                    animation: isWrong ? 'kw-shake 0.4s ease' : 'none', transition: 'background 0.2s' }}>
                  {s}
                  {isRight && <PickMark kind="right" />}
                  {isWrong && <PickMark kind="wrong" />}
                </button>
              );
            })}
          </div>

          <div style={{ flex: '0 0 auto', padding: '12px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {Array.from({ length: TOTAL_Q }).map((_, i) => (
                <span key={i} style={{ width: 22, height: 22, borderRadius: 11, background: i < progress ? color : '#fff',
                  border: i < progress ? (t.outline === 'none' ? 'none' : `2px solid ${t.text}`) : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text, minWidth: 70, textAlign: 'right' }}>{progress}/{TOTAL_Q}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 32px 24px' }}>
          <div style={{ fontSize: 160, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 28, fontWeight: 900, color: t.text }}>그림자 다 맞췄어!</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            <button onClick={restart}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: '#fff', color: t.text, border: accentBorder, borderRadius: 32, padding: '18px 30px',
                fontSize: fontSize + 4, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시 풀기</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 32,
                padding: '18px 36px', fontSize: fontSize + 6, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow,
                display: 'inline-flex', alignItems: 'center', gap: 10 }}>{levelIdx < SHADOW_LEVELS.length - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}</button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow}
        text={done ? '잘했어!' : multi ? `그림자 ${cfg.targets}개를 모두 찾아봐` : '이 그림자는 누구일까?'} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 검증**

Run: `npm test` → 통과. `npm run build` → SUCCESS.
Run: `npm run dev` → 두뇌 > 그림자: Lv1~3 단일, Lv4 실루엣 2개·Lv5 3개 모두 골라야 정답, 맞으면 ✓·잠금, 틀리면 ✗+효과음. 5레벨 ◀▶.

- [ ] **Step 3: Commit**
```bash
git add src/activities.jsx
git commit -m "feat(brain): 그림자 멀티타깃(Lv4·5) + ✓/✗ 피드백"
```

---

# Phase 3 — 영어 단어 멀티

## Task 4: EnglishWordsActivity 멀티 대응

**Files:** Modify `src/english.jsx`

- [ ] **Step 1: import에 멀티 헬퍼 추가**

`src/english.jsx` 상단 `import { LevelStepper } from './activities.jsx'` 줄을 교체:
```jsx
import { LevelStepper, useMultiPick, multiTargetOptions, PickMark } from './activities.jsx'
```

- [ ] **Step 2: EnglishWordsActivity 본문 교체**

`function EnglishWordsActivity(...) { ... }` 전체를 아래로 교체:
```jsx
function EnglishWordsActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.english;
  const [levelIdx, setLevelIdx] = useS(0);
  const cfg = englishLevelConfig(levelIdx);
  const POOL_WORDS = WORD_SET.map((w) => w.word);
  const byWord = (w) => WORD_SET.find((x) => x.word === w);
  const newRound = () => {
    const picked = [];
    const shuffled = [...WORD_SET].sort(() => Math.random() - 0.5);
    for (let i = 0; i < cfg.targets; i++) picked.push(shuffled[i].word);
    return { targets: picked, opts: multiTargetOptions(picked, cfg.options, POOL_WORDS) };
  };
  const [round, setRound] = useS(newRound);
  const [progress, setProgress] = useS(0);
  const [done, setDone] = useS(false);
  const mp = useMultiPick();
  const timersRef = useR([]);
  const addT = (id) => timersRef.current.push(id);
  useE(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);
  useE(() => { setProgress(0); setDone(false); setRound(newRound()); mp.reset(); }, [levelIdx]);

  const pick = (w) => {
    if (done) return;
    const r = mp.pick(w, round.targets);
    if (r === 'wrong') playSfx('wrong');
    else if (r === 'correct') { playSfx('correct'); speakEn(w); }
    else if (r === 'complete') {
      playSfx('correct'); speakEn(w);
      onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      addT(setTimeout(() => {
        if (n >= cfg.questions) { setDone(true); onComplete && onComplete(3); }
        else { setRound(newRound()); mp.reset(); }
      }, 850));
    }
  };
  const nextLevel = () => { if (levelIdx < 4) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };
  const restart = () => { setProgress(0); setDone(false); setRound(newRound()); mp.reset(); };

  const multi = cfg.targets > 1;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <TitleBar t={t} fontSize={fontSize} icon="🧩" title="단어 맞추기"
        levelStepper={<LevelStepper tone={t} cur={levelIdx} total={5} onPrev={prevLevel} onNext={nextLevel} />} />
      {!done ? (
        <React.Fragment>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, minHeight: 0, padding: '0 32px', flexWrap: 'wrap' }}>
            {round.targets.map((w) => {
              const got = mp.found.includes(w);
              return (
                <div key={w} style={{ background: color, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: t.cardRadius + 8,
                  padding: multi ? '18px 30px' : '24px 48px', boxShadow: t.shadow, opacity: got ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                  <span style={{ fontSize: multi ? 120 : 180, lineHeight: 1 }}>{byWord(w).emoji}</span>
                </div>
              );
            })}
          </div>
          <div style={{ flex: '0 0 auto', padding: '14px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${cfg.options}, 1fr)`, gap: 14 }}>
            {round.opts.map((w) => {
              const isRight = mp.found.includes(w);
              const isWrong = mp.wrongKey === w;
              return (
                <button key={w} onClick={() => pick(w)} disabled={isRight}
                  onPointerDown={(e) => !isRight && e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ position: 'relative', height: 84, fontSize: 30, fontWeight: 900, fontFamily: 'inherit',
                    cursor: isRight ? 'default' : 'pointer', background: isRight ? t.cat.code : isWrong ? t.cat.shape : '#fff',
                    border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline, borderRadius: t.cardRadius, boxShadow: t.shadow,
                    animation: isWrong ? 'kw-shake 0.4s ease' : 'none' }}>
                  {w}
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
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>{levelIdx < 4 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accent(t), borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < 4 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}
      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : multi ? '그림에 맞는 단어를 모두 골라봐' : '그림에 맞는 단어를 골라봐'} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 3: 검증**

Run: `npm test` → 통과. `npm run build` → SUCCESS.
Run: `npm run dev` → 영어 > 단어 맞추기: Lv1~3 단일, Lv4 그림 2개·Lv5 3개 모두 골라야 정답, ✓/✗ 표시, 5레벨 ◀▶.

- [ ] **Step 4: Commit**
```bash
git add src/english.jsx
git commit -m "feat(english): 단어 맞추기 멀티선택(Lv4·5) + ✓/✗"
```

---

# Phase 4 — 한글 낱말 레벨 신설 + 멀티

## Task 5: HangulWordsActivity 재작성(레벨 + 멀티 + PickMark)

**Files:** Modify `src/activities.jsx` (`HangulWordsActivity` 전체)

- [ ] **Step 1: HangulWordsActivity 본문 교체**

`function HangulWordsActivity(...) { ... }` 전체를 아래로 교체:
```jsx
function HangulWordsActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.hangul;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [levelIdx, setLevelIdx] = useStateA(0);
  const cfg = hangulWordLevelConfig(levelIdx);
  const POOL_WORDS = HANGUL_WORDS.map((w) => w.word);
  const byWord = (w) => HANGUL_WORDS.find((x) => x.word === w);

  const newRound = () => {
    const shuffled = shuffleA(HANGUL_WORDS);
    const targets = shuffled.slice(0, cfg.targets).map((x) => x.word);
    return { targets, opts: multiTargetOptions(targets, cfg.options, POOL_WORDS) };
  };
  const [round, setRound] = useStateA(newRound);
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const mp = useMultiPick();
  const timersRef = useRefA([]);
  const addTimer = (id) => timersRef.current.push(id);
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);
  useEffectA(() => { setProgress(0); setDone(false); setRound(newRound()); mp.reset(); }, [levelIdx]);

  const onPick = (w) => {
    if (done) return;
    const r = mp.pick(w, round.targets);
    if (r === 'wrong') playSfx('wrong');
    else if (r === 'correct') playSfx('correct');
    else if (r === 'complete') {
      playSfx('correct');
      onComplete && onComplete(1);
      const nextN = progress + 1; setProgress(nextN);
      addTimer(setTimeout(() => {
        if (nextN >= cfg.questions) { setDone(true); onComplete && onComplete(3); }
        else { setRound(newRound()); mp.reset(); }
      }, 850));
    }
  };
  const restart = () => { setProgress(0); setDone(false); setRound(newRound()); mp.reset(); };
  const nextLevel = () => { if (levelIdx < HANGUL_WORD_LEVELS.length - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };

  const multi = cfg.targets > 1;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🍓</span>
          낱말 맞추기
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>Lv.{levelIdx + 1}</span>
        </div>
        <LevelStepper tone={t} cur={levelIdx} total={HANGUL_WORD_LEVELS.length} onPrev={prevLevel} onNext={nextLevel} />
      </div>

      {!done ? (
        <React.Fragment>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, minHeight: 0, padding: '0 32px', flexWrap: 'wrap' }}>
            {round.targets.map((w) => {
              const got = mp.found.includes(w);
              return (
                <div key={w} style={{ background: color, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: t.cardRadius + 8,
                  padding: multi ? '18px 30px' : '24px 48px', boxShadow: t.shadow, opacity: got ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                  <span style={{ fontSize: multi ? 120 : 180, lineHeight: 1 }}>{byWord(w).emoji}</span>
                </div>
              );
            })}
          </div>
          <div style={{ flex: '0 0 auto', padding: '14px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${cfg.options}, 1fr)`, gap: 14 }}>
            {round.opts.map((w) => {
              const isRight = mp.found.includes(w);
              const isWrong = mp.wrongKey === w;
              return (
                <button key={w} onClick={() => onPick(w)} disabled={isRight}
                  onPointerDown={(e) => !isRight && e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ position: 'relative', height: 84, fontSize: 34, fontWeight: 900, fontFamily: 'inherit',
                    cursor: isRight ? 'default' : 'pointer', background: isRight ? t.cat.code : isWrong ? t.cat.shape : '#fff',
                    border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline, borderRadius: t.cardRadius, boxShadow: t.shadow,
                    animation: isWrong ? 'kw-shake 0.4s ease' : 'none' }}>
                  {w}
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
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>{levelIdx < HANGUL_WORD_LEVELS.length - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accentBorder, borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < HANGUL_WORD_LEVELS.length - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}
      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : multi ? '그림에 맞는 낱말을 모두 골라봐' : '무슨 낱말일까?'} fontSize={fontSize - 4} />
    </div>
  );
}
```
주의: 기존 HangulWordsActivity는 완료 시 즉시 `onFinish()`였으나, 이제 레벨 완료 패널 + 다음 레벨로 바뀐다(그림자·메모리와 동일). `restart`/그 외 미사용 함수가 남지 않도록 위 코드로 전체 교체.

- [ ] **Step 2: 검증**

Run: `npm test` → 통과. `npm run build` → SUCCESS.
Run: `npm run dev` → 한글 > 낱말: 5레벨 ◀▶, Lv1~3 단일, Lv4·5 멀티(그림 N개), ✓/✗, 재진입 1레벨.

- [ ] **Step 3: Commit**
```bash
git add src/activities.jsx
git commit -m "feat(hangul): 낱말 맞추기 5레벨 + 멀티선택 + ✓/✗"
```

---

# Phase 5 — 단순 picker들에 ✗/✓ 적용 (G1 나머지)

## Task 6: 수학·파닉스·패턴 보기에 PickMark

이미 멀티(그림자·단어)는 ✓/✗ 적용됨. 남은 단일선택 활동의 보기 버튼에 PickMark + 오답 효과음을 통일한다.

**Files:** Modify `src/activities.jsx`(MathActivity/AdditionActivity/SubtractionActivity/CompareActivity/OrderActivity/PatternActivity), `src/english.jsx`(PhonicsActivity)

각 활동의 보기 버튼은 이미 `isRight`/`isWrong`(또는 동등 변수)로 배경색을 바꾼다. 공통 편집:
1. 버튼 `style`에 `position: 'relative'`가 없으면 추가.
2. 버튼이 오답 시 `playSfx('wrong')`를 호출하지 않으면 onPick(또는 onClick 핸들러)의 오답 분기에 추가.
3. 버튼 children 끝에 `{isRight && <PickMark kind="right" />}{isWrong && <PickMark kind="wrong" />}` 추가(각 활동의 정답/오답 boolean 변수명을 사용).

- [ ] **Step 1: 활동별 적용**

각 활동 함수를 열어 보기 버튼(`round.opts.map(...)` 또는 동등)에서 다음을 적용한다. (변수명은 활동마다 다르니 해당 함수의 기존 `isRight`/`isWrong` 계산을 재사용; 없으면 `status==='right' && n===round.target` / `status==='wrong' && picked===n` 형태로 계산.)

**PhonicsActivity (english.jsx)** — 보기 버튼:
- 버튼 style에 `position: 'relative'` 추가.
- children: `{ALPHABET[i].u}` 다음에 `{isRight && <PickMark kind="right" />}{isWrong && <PickMark kind="wrong" />}` 추가.
- `import` 줄에 `PickMark`가 포함됐는지 확인(Task 4 Step 1에서 추가됨).
- 오답 효과음: 이미 `playSfx('wrong')` 있음(유지).

**MathActivity / AdditionActivity / SubtractionActivity / CompareActivity / OrderActivity / PatternActivity (activities.jsx)** — 각 보기/선택 버튼:
- 버튼 style에 `position: 'relative'` 추가.
- 정답/오답 boolean을 버튼 스코프에서 계산(대부분 이미 존재: `isRight`/`isWrong` 또는 `status`/`picked` 기반).
- children 끝에 `{isRight && <PickMark kind="right" />}{isWrong && <PickMark kind="wrong" />}` 추가.
- 오답 분기에 `playSfx('wrong')`가 없으면 추가(MathActivity 등 일부는 이미 있음 — 중복 추가 금지, 확인 후).

(엔지니어 노트: 각 활동에서 ✓/✗가 화면에 보이려면 버튼이 `position:relative`여야 한다. 버튼은 보통 fixed height라 absolute 배지가 우상단에 겹쳐 표시된다.)

- [ ] **Step 2: 검증**

Run: `npm test` → 통과. `npm run build` → SUCCESS, 무경고.
Run: `npm run dev` → 수학(세기·덧셈·뺄셈·비교·순서), 영어 파닉스, 패턴: 오답 선택 시 그 보기에 ✗ + 효과음, 정답 시 ✓.

- [ ] **Step 3: Commit**
```bash
git add src/activities.jsx src/english.jsx
git commit -m "feat(feedback): 수학·파닉스·패턴 보기에 ✓/✗ + 오답 효과음 통일"
```

---

## 마무리 검증
- [ ] `npm test` 전체 PASS, `npm run build` 무경고.
- [ ] 카드뒤집기: 전레벨 미리보기, 3매칭(Lv4·5), 5레벨.
- [ ] 그림자/단어(영어·한글): 상위 레벨 멀티선택(N개 모두), ✓/✗.
- [ ] 모든 선택형: 오답 ✗+효과음, 정답 ✓.
- [ ] 레벨 정책(◀▶·1레벨부터) 유지.
- [ ] 설계 대조: 스펙 G1/G2 항목 전부 구현.

후속(별도): #6 단어 다양화, #7 글짓기, #8 스티커 드래그, #9 빈 종이.
