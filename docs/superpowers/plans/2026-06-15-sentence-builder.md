# 글짓기 놀이 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한글·영어 글짓기 놀이를 추가한다 — 빈칸 문장에 그림 카드를 드래그/탭으로 채우고, 🔊 읽기로 현재 상태를 음성+글자로 보여주며, 다 맞추면 칭찬 후 다음 문장으로 넘어간다.

**Architecture:** 공용 `SentenceBuilderActivity`(activities.jsx)를 두고 한글/영어가 문장 데이터·speak·색·제목을 주입하는 래퍼가 된다. 문장 조립/정답/트레이 생성은 순수 함수로 분리해 vitest로 검증. 드래그는 스티커 드래그와 같은 포인터 패턴(임시 상태 + 놓을 때 slot rect 히트테스트), 탭은 카드 무장→빈칸 탭.

**Tech Stack:** React 18(전역 alias 포함 useMemoA), Vite 5, Pointer Events, Web Speech(speakEn/speakKo), vitest.

설계: `docs/superpowers/specs/2026-06-15-sentence-builder-design.md`

---

## File Structure
- `src/activities.jsx` — 순수함수(`sentenceText`/`isSentenceComplete`/`buildTray`, export) + `HANGUL_SENTENCES`(export) + `SentenceBuilderActivity`(export) + `HangulSentenceActivity` 래퍼 + 디스패처 분기.
- `src/english.jsx` — `ENGLISH_SENTENCES` + `EnglishSentenceActivity` 래퍼 + 라우터 분기 + import.
- `src/shell.jsx` — `SUBMENUS.hangul`/`SUBMENUS.english`에 `sentence` 항목.
- `src/__tests__/activity-logic.test.js` — 순수함수 + 데이터 적합성 테스트.

---

## Task 1: 순수 함수 + 문장 데이터 + 테스트

**Files:** Modify `src/activities.jsx`, `src/english.jsx`, `src/__tests__/activity-logic.test.js`

- [ ] **Step 1: 실패 테스트 추가**

`src/__tests__/activity-logic.test.js` 끝에 추가:
```js
import { sentenceText, isSentenceComplete, buildTray, HANGUL_SENTENCES } from '../activities.jsx'
import { ENGLISH_SENTENCES } from '../english.jsx'

describe('sentenceText', () => {
  const parts = [{ type: 'slot', answer: '포도', emoji: '🍇' }, { type: 'fixed', text: '를 ' }, { type: 'slot', answer: '먹어요', emoji: '😋' }]
  it('채운 슬롯은 단어, 빈칸은 기본 ⬜', () => {
    expect(sentenceText(parts, [{ word: '포도', emoji: '🍇' }, null])).toBe('포도를 ⬜')
  })
  it('blank 인자로 음성용 빈 문자', () => {
    expect(sentenceText(parts, [{ word: '포도', emoji: '🍇' }, null], '')).toBe('포도를 ')
    expect(sentenceText(parts, [{ word: '포도', emoji: '🍇' }, { word: '먹어요', emoji: '😋' }], '')).toBe('포도를 먹어요')
  })
})

describe('isSentenceComplete', () => {
  const parts = [{ type: 'slot', answer: '포도', emoji: '🍇' }, { type: 'fixed', text: '를 ' }, { type: 'slot', answer: '먹어요', emoji: '😋' }]
  it('모든 슬롯 정답이면 true', () => {
    expect(isSentenceComplete(parts, [{ word: '포도' }, { word: '먹어요' }])).toBe(true)
  })
  it('빈칸/오답 있으면 false', () => {
    expect(isSentenceComplete(parts, [{ word: '포도' }, null])).toBe(false)
    expect(isSentenceComplete(parts, [{ word: '사과' }, { word: '먹어요' }])).toBe(false)
  })
})

describe('buildTray', () => {
  const distinct = (a) => new Set(a.map((c) => c.word)).size === a.length
  const tpl = { parts: [{ type: 'slot', answer: '포도', emoji: '🍇' }, { type: 'fixed', text: '를 ' }, { type: 'slot', answer: '먹어요', emoji: '😋' }] }
  const pool = [{ word: '포도', emoji: '🍇' }, { word: '먹어요', emoji: '😋' }, { word: '사과', emoji: '🍎' }, { word: '자요', emoji: '😴' }, { word: '우유', emoji: '🥛' }]
  it('정답 전부 포함 + 고유 + 길이=정답수+min(distN,남은풀)', () => {
    const tray = buildTray(tpl, pool, 2)
    expect(tray).toHaveLength(2 + 2)
    expect(distinct(tray)).toBe(true)
    expect(tray.map((c) => c.word)).toContain('포도')
    expect(tray.map((c) => c.word)).toContain('먹어요')
  })
})

describe('문장 데이터 적합성', () => {
  const slotCount = (tpl) => tpl.parts.filter((p) => p.type === 'slot').length
  for (const [name, levels] of [['hangul', HANGUL_SENTENCES], ['english', ENGLISH_SENTENCES]]) {
    it(`${name}: 3레벨, 각 ≥4문장, 슬롯수 L1=1·L2=2·L3∈{2,3}, 모든 슬롯 answer+emoji`, () => {
      expect(levels).toHaveLength(3)
      levels.forEach((lvl) => expect(lvl.length).toBeGreaterThanOrEqual(4))
      levels[0].forEach((tpl) => expect(slotCount(tpl)).toBe(1))
      levels[1].forEach((tpl) => expect(slotCount(tpl)).toBe(2))
      levels[2].forEach((tpl) => expect([2, 3]).toContain(slotCount(tpl)))
      levels.flat().forEach((tpl) => tpl.parts.forEach((p) => {
        if (p.type === 'slot') { expect(typeof p.answer).toBe('string'); expect(p.emoji.length).toBeGreaterThan(0) }
        else { expect(typeof p.text).toBe('string') }
      }))
    })
  }
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test` → FAIL (함수/데이터 미정의).

- [ ] **Step 3: 순수 함수 + HANGUL_SENTENCES (activities.jsx)**

`src/activities.jsx`에서 `WordMatchActivity` 정의 **바로 앞**에 추가:
```jsx
// ── 글짓기 공용 ───────────────────────────────────────────────
// 문장 조립(순수): slot=놓인 카드 단어(없으면 blank), fixed=텍스트. join('').
export function sentenceText(parts, placed, blank = '⬜') {
  let si = -1;
  return parts.map((p) => {
    if (p.type === 'fixed') return p.text;
    si += 1; const card = placed[si];
    return card ? card.word : blank;
  }).join('');
}
// 모든 slot의 놓인 카드 단어가 정답이면 true(순수).
export function isSentenceComplete(parts, placed) {
  let si = -1;
  for (const p of parts) {
    if (p.type !== 'slot') continue;
    si += 1; const card = placed[si];
    if (!card || card.word !== p.answer) return false;
  }
  return true;
}
// 트레이 카드: 정답 카드 전부 + 방해 카드(풀에서, 정답 제외) min(distN,남은). 셔플(순수 출력).
export function buildTray(template, poolCards, distractorN) {
  const correct = template.parts.filter((p) => p.type === 'slot').map((p) => ({ word: p.answer, emoji: p.emoji }));
  const correctWords = correct.map((c) => c.word);
  const distractors = shuffle(poolCards.filter((c) => !correctWords.includes(c.word))).slice(0, Math.max(0, distractorN));
  return shuffle([...correct, ...distractors]);
}

// 한글 문장 (Lv1 빈칸1 / Lv2 빈칸2 / Lv3 빈칸3). 동사는 그림 카드.
export const HANGUL_SENTENCES = [
  [
    { parts: [{ type: 'slot', answer: '사과', emoji: '🍎' }, { type: 'fixed', text: '를 먹어요' }] },
    { parts: [{ type: 'slot', answer: '강아지', emoji: '🐶' }, { type: 'fixed', text: '가 뛰어요' }] },
    { parts: [{ type: 'slot', answer: '아기', emoji: '👶' }, { type: 'fixed', text: '가 자요' }] },
    { parts: [{ type: 'slot', answer: '우유', emoji: '🥛' }, { type: 'fixed', text: '를 마셔요' }] },
    { parts: [{ type: 'slot', answer: '책', emoji: '📖' }, { type: 'fixed', text: '을 읽어요' }] },
  ],
  [
    { parts: [{ type: 'slot', answer: '포도', emoji: '🍇' }, { type: 'fixed', text: '를 ' }, { type: 'slot', answer: '먹어요', emoji: '😋' }] },
    { parts: [{ type: 'slot', answer: '고양이', emoji: '🐱' }, { type: 'fixed', text: '가 ' }, { type: 'slot', answer: '자요', emoji: '😴' }] },
    { parts: [{ type: 'slot', answer: '아이', emoji: '🧒' }, { type: 'fixed', text: '가 ' }, { type: 'slot', answer: '웃어요', emoji: '😄' }] },
    { parts: [{ type: 'slot', answer: '주스', emoji: '🧃' }, { type: 'fixed', text: '를 ' }, { type: 'slot', answer: '마셔요', emoji: '🥤' }] },
  ],
  [
    { parts: [{ type: 'slot', answer: '토끼', emoji: '🐰' }, { type: 'fixed', text: '가 ' }, { type: 'slot', answer: '당근', emoji: '🥕' }, { type: 'fixed', text: '을 ' }, { type: 'slot', answer: '먹어요', emoji: '😋' }] },
    { parts: [{ type: 'slot', answer: '아기', emoji: '👶' }, { type: 'fixed', text: '가 ' }, { type: 'slot', answer: '우유', emoji: '🥛' }, { type: 'fixed', text: '를 ' }, { type: 'slot', answer: '마셔요', emoji: '🥤' }] },
    { parts: [{ type: 'slot', answer: '고양이', emoji: '🐱' }, { type: 'fixed', text: '가 ' }, { type: 'slot', answer: '생선', emoji: '🐟' }, { type: 'fixed', text: '을 ' }, { type: 'slot', answer: '먹어요', emoji: '😋' }] },
    { parts: [{ type: 'slot', answer: '아이', emoji: '🧒' }, { type: 'fixed', text: '가 ' }, { type: 'slot', answer: '책', emoji: '📖' }, { type: 'fixed', text: '을 ' }, { type: 'slot', answer: '읽어요', emoji: '📖' }] },
  ],
];
```
(`shuffle`는 activities.jsx에 이미 존재.)

- [ ] **Step 4: ENGLISH_SENTENCES (english.jsx)**

`src/english.jsx`에서 `WORD_SET` 정의 **다음**에 추가:
```js
// 영어 문장 (Lv1 빈칸1 / Lv2 빈칸2 / Lv3 빈칸2).
export const ENGLISH_SENTENCES = [
  [
    { parts: [{ type: 'fixed', text: 'I see a ' }, { type: 'slot', answer: 'cat', emoji: '🐱' }] },
    { parts: [{ type: 'fixed', text: 'The ' }, { type: 'slot', answer: 'sun', emoji: '☀️' }, { type: 'fixed', text: ' is up' }] },
    { parts: [{ type: 'fixed', text: 'A ' }, { type: 'slot', answer: 'dog', emoji: '🐶' }, { type: 'fixed', text: ' runs' }] },
    { parts: [{ type: 'fixed', text: 'I like ' }, { type: 'slot', answer: 'milk', emoji: '🥛' }] },
  ],
  [
    { parts: [{ type: 'fixed', text: 'The ' }, { type: 'slot', answer: 'cat', emoji: '🐱' }, { type: 'fixed', text: ' is ' }, { type: 'slot', answer: 'sleeping', emoji: '😴' }] },
    { parts: [{ type: 'fixed', text: 'I ' }, { type: 'slot', answer: 'eat', emoji: '😋' }, { type: 'fixed', text: ' an ' }, { type: 'slot', answer: 'apple', emoji: '🍎' }] },
    { parts: [{ type: 'fixed', text: 'A ' }, { type: 'slot', answer: 'bird', emoji: '🐦' }, { type: 'fixed', text: ' can ' }, { type: 'slot', answer: 'sing', emoji: '🎤' }] },
    { parts: [{ type: 'fixed', text: 'The ' }, { type: 'slot', answer: 'boy', emoji: '🧒' }, { type: 'fixed', text: ' is ' }, { type: 'slot', answer: 'happy', emoji: '😄' }] },
  ],
  [
    { parts: [{ type: 'fixed', text: 'The ' }, { type: 'slot', answer: 'dog', emoji: '🐶' }, { type: 'fixed', text: ' runs to the ' }, { type: 'slot', answer: 'park', emoji: '🏞️' }] },
    { parts: [{ type: 'fixed', text: 'I ' }, { type: 'slot', answer: 'read', emoji: '📖' }, { type: 'fixed', text: ' a ' }, { type: 'slot', answer: 'book', emoji: '📚' }] },
    { parts: [{ type: 'fixed', text: 'The ' }, { type: 'slot', answer: 'bird', emoji: '🐦' }, { type: 'fixed', text: ' sings a ' }, { type: 'slot', answer: 'song', emoji: '🎵' }] },
    { parts: [{ type: 'fixed', text: 'We ' }, { type: 'slot', answer: 'eat', emoji: '😋' }, { type: 'fixed', text: ' some ' }, { type: 'slot', answer: 'cake', emoji: '🍰' }] },
  ],
];
```

- [ ] **Step 5: 통과 확인 + Commit**

Run: `npm test` → PASS. `npm run build` → SUCCESS, 무경고.
```bash
git add src/activities.jsx src/english.jsx src/__tests__/activity-logic.test.js
git commit -m "feat(sentence): 문장 조립 순수함수 + 한글/영어 문장 데이터 + 테스트"
```

## Context
`placed`는 slot 순서 배열(카드|null). `sentenceText`는 화면용(빈칸 ⬜)·음성용(blank=''). 동사는 그림 카드(먹어요😋 등). 영어 Lv3는 슬롯 2개(영어 3슬롯 문장은 유아에 부자연 → L3∈{2,3} 규칙상 2개 허용).

---

## Task 2: SentenceBuilderActivity 컴포넌트

**Files:** Modify `src/activities.jsx`

- [ ] **Step 1: 컴포넌트 추가**

`src/activities.jsx`에서 위 순수함수/`HANGUL_SENTENCES` 정의 **다음**(그리고 `WordMatchActivity` 앞 또는 뒤 어디든 — `function HangulSentenceActivity` 앞)에 추가:
```jsx
const SENTENCE_QUESTIONS = 5;
const SENTENCE_DISTRACTORS = 3;

// 공용 글짓기 — 빈칸 문장에 카드 드래그/탭, 읽기(현재 상태 음성+글자), 정답 시 다음.
export function SentenceBuilderActivity({ tone, fontSize, onComplete, onFinish, voiceShow, levels, color, icon, title, speak }) {
  const t = tone;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const allCards = useMemoA(() => {
    const seen = new Set(); const out = [];
    levels.flat().forEach((tpl) => tpl.parts.forEach((p) => {
      if (p.type === 'slot' && !seen.has(p.answer)) { seen.add(p.answer); out.push({ word: p.answer, emoji: p.emoji }); }
    }));
    return out;
  }, [levels]);
  const pickRound = (lvl) => {
    const pool = levels[Math.max(0, Math.min(levels.length - 1, lvl))];
    const tpl = pool[Math.floor(Math.random() * pool.length)];
    const slotCount = tpl.parts.filter((p) => p.type === 'slot').length;
    return { tpl, placed: Array(slotCount).fill(null), tray: buildTray(tpl, allCards, SENTENCE_DISTRACTORS) };
  };

  const [levelIdx, setLevelIdx] = useStateA(0);
  const [round, setRound] = useStateA(() => pickRound(0));
  const [armed, setArmed] = useStateA(null);   // 탭 선택된 트레이 카드 인덱스
  const [drag, setDrag] = useStateA(null);      // { cardIdx, x, y } 드래그 렌더용
  const [reveal, setReveal] = useStateA(null);  // 읽기 글자 노출
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const wonRef = useRefA(false);
  const dragRef = useRefA(null);                // { cardIdx, sx, sy, moved }
  const slotRefs = useRefA({});                 // slotIdx → DOM
  const timersRef = useRefA([]);
  const addTimer = (id) => timersRef.current.push(id);
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  useEffectA(() => {
    timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = [];
    wonRef.current = false;
    setRound(pickRound(levelIdx)); setProgress(0); setDone(false); setReveal(null); setArmed(null); setDrag(null);
  }, [levelIdx]);

  const advanceIfComplete = (tpl, placed) => {
    if (!isSentenceComplete(tpl.parts, placed) || wonRef.current) return;
    wonRef.current = true;
    playSfx('correct');
    speak(sentenceText(tpl.parts, placed, ''));
    setReveal(sentenceText(tpl.parts, placed));
    onComplete && onComplete(1);
    const n = progress + 1; setProgress(n);
    addTimer(setTimeout(() => {
      if (n >= SENTENCE_QUESTIONS) { setDone(true); onComplete && onComplete(3); }
      else { wonRef.current = false; setRound(pickRound(levelIdx)); setReveal(null); setArmed(null); }
    }, 1400));
  };

  const placeCard = (slotIdx, cardIdx) => {
    const card = round.tray[cardIdx];
    const placed = round.placed.slice(); placed[slotIdx] = card;
    setRound({ ...round, placed }); setArmed(null); setReveal(null); playSfx('select');
    advanceIfComplete(round.tpl, placed);
  };
  const onSlotTap = (slotIdx) => {
    if (done) return;
    if (armed != null) placeCard(slotIdx, armed);
    else if (round.placed[slotIdx]) { const placed = round.placed.slice(); placed[slotIdx] = null; setRound({ ...round, placed }); setReveal(null); }
  };

  const cardDown = (e, cardIdx) => {
    if (done) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    dragRef.current = { cardIdx, sx: e.clientX, sy: e.clientY, moved: false };
    setDrag({ cardIdx, x: e.clientX, y: e.clientY });
  };
  const cardMove = (e) => {
    const d = dragRef.current; if (!d) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
    setDrag({ cardIdx: d.cardIdx, x: e.clientX, y: e.clientY });
  };
  const cardUp = (e) => {
    const d = dragRef.current; if (!d) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    dragRef.current = null; setDrag(null);
    if (d.moved) {
      let hit = -1;
      for (const k in slotRefs.current) {
        const el = slotRefs.current[k]; if (!el) continue;
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { hit = Number(k); break; }
      }
      if (hit >= 0) placeCard(hit, d.cardIdx);
    } else {
      setArmed((a) => (a === d.cardIdx ? null : d.cardIdx));
    }
  };

  const onRead = () => {
    speak(sentenceText(round.tpl.parts, round.placed, ''));
    setReveal(sentenceText(round.tpl.parts, round.placed));
  };
  const restart = () => { wonRef.current = false; setRound(pickRound(levelIdx)); setProgress(0); setDone(false); setReveal(null); setArmed(null); };
  const nextLevel = () => { if (levelIdx < levels.length - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>{icon}</span>{title}
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>Lv.{levelIdx + 1}</span>
        </div>
        <LevelStepper tone={t} cur={levelIdx} total={levels.length} onPrev={prevLevel} onNext={nextLevel} />
      </div>

      {!done ? (
        <React.Fragment>
          {/* 문장 줄 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 0, padding: '0 28px', flexWrap: 'wrap' }}>
            {(() => { let si = -1; return round.tpl.parts.map((p, pi) => {
              if (p.type === 'fixed') {
                return <span key={pi} style={{ fontSize: fontSize + 16, fontWeight: 900, color: t.text, whiteSpace: 'pre' }}>{p.text}</span>;
              }
              si += 1; const slotIdx = si; const card = round.placed[slotIdx];
              const correct = card && card.word === p.answer;
              return (
                <div key={pi} ref={(el) => { slotRefs.current[slotIdx] = el; }} onClick={() => onSlotTap(slotIdx)}
                  style={{ width: 100, height: 100, borderRadius: t.cardRadius, cursor: 'pointer',
                    background: card ? '#fff' : 'rgba(0,0,0,0.04)',
                    border: correct ? `4px solid ${t.cat.code}` : card ? accentBorder : `4px dashed ${color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, lineHeight: 1, boxShadow: card ? t.shadowSm : 'none' }}>
                  {card ? card.emoji : '⬜'}
                </div>
              );
            }); })()}
          </div>

          {/* 읽기 + 노출 */}
          <div style={{ flex: '0 0 auto', padding: '4px 28px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button onClick={onRead}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }], { duration: 140 })}
              style={{ height: 52, padding: '0 26px', borderRadius: 26, background: color, color: t.textOnColor,
                border: t.outline === 'none' ? 'none' : t.outline, fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 26 }}>🔊</span>읽기
            </button>
            <div style={{ minHeight: 36, fontSize: fontSize + 6, fontWeight: 900, color: t.text }}>{reveal || ''}</div>
          </div>

          {/* 카드 트레이 */}
          <div style={{ flex: '0 0 auto', padding: '8px 24px 16px', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {round.tray.map((c, i) => {
              const isArmed = armed === i; const isDragging = drag && drag.cardIdx === i;
              return (
                <button key={i}
                  onPointerDown={(e) => cardDown(e, i)} onPointerMove={cardMove} onPointerUp={cardUp} onPointerCancel={() => { dragRef.current = null; setDrag(null); }}
                  style={{ position: 'relative', width: 88, height: 88, borderRadius: t.cardRadius,
                    background: isArmed ? t.accent : '#fff', border: isArmed ? (t.outline === 'none' ? `4px solid ${t.text}` : t.outline) : accentBorder,
                    fontSize: 52, lineHeight: 1, cursor: 'grab', fontFamily: 'inherit', boxShadow: t.shadow,
                    touchAction: 'none', opacity: isDragging ? 0.35 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c.emoji}
                </button>
              );
            })}
          </div>

          {/* 드래그 중 떠다니는 카드 */}
          {drag && (
            <div style={{ position: 'fixed', left: drag.x, top: drag.y, transform: 'translate(-50%, -50%)',
              fontSize: 56, lineHeight: 1, pointerEvents: 'none', zIndex: 80, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}>
              {round.tray[drag.cardIdx]?.emoji}
            </div>
          )}

          <div style={{ flex: '0 0 auto', padding: '0 32px 10px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {Array.from({ length: SENTENCE_QUESTIONS }).map((_, i) => (
                <span key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i < progress ? color : '#fff',
                  border: i < progress ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{SENTENCE_QUESTIONS}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>{levelIdx < levels.length - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accentBorder, borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < levels.length - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow}
        text={done ? '잘했어!' : armed != null ? '빈칸을 눌러 넣어봐' : '카드를 끌어다 빈칸에 넣어봐'} fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 검증**

Run: `npm test` → 통과(컴포넌트 미연결, 기존 유지). `npm run build` → SUCCESS, 무경고. (`useMemoA`는 파일 상단 alias에 존재.)

- [ ] **Step 3: Commit**
```bash
git add src/activities.jsx
git commit -m "feat(sentence): SentenceBuilderActivity(드래그/탭·읽기·레벨)"
```

## Context
`useMemoA`/`useStateA`/`useEffectA`/`useRefA`는 파일 상단 alias. `shuffle`/`playSfx`/`LevelStepper`/`VoiceGuide`/`buildTray`/`sentenceText`/`isSentenceComplete` 모두 activities.jsx. 드래그: pointerdown→ref에 시작점, move로 6px 넘으면 moved, up에서 moved면 slot rect 히트테스트 후 배치, 아니면 탭(카드 무장). 탭 배치: armed 카드 있으면 빈칸 탭 시 배치; 없으면 채운 빈칸 탭 시 비움. 정답 완성 시 자동 읽기+별+1.4초 후 다음(wonRef 중복 방지). 레벨 변경 시 타이머 정리+리셋.

---

## Task 3: 래퍼 + 디스패처 + 서브메뉴

**Files:** Modify `src/activities.jsx`, `src/english.jsx`, `src/shell.jsx`

- [ ] **Step 1: HangulSentenceActivity 래퍼 + 디스패처 (activities.jsx)**

`src/activities.jsx`에 `speakKo`가 audio import에 있는지 확인(없으면 추가 — 이전 작업에서 추가됨). `SentenceBuilderActivity` 정의 다음에 래퍼 추가:
```jsx
function HangulSentenceActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  return (
    <SentenceBuilderActivity
      tone={tone} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow}
      levels={HANGUL_SENTENCES} color={tone.cat.hangul} icon="✍️" title="글짓기" speak={speakKo}
    />
  );
}
```
그리고 `Activity` 디스패처의 hangul 분기에서 `if (sub?.id === 'words') ...` 줄들 사이(또는 그 앞)에 추가:
```jsx
    if (sub?.id === 'sentence') return <HangulSentenceActivity tone={tone} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
```

- [ ] **Step 2: EnglishSentenceActivity 래퍼 + 라우터 (english.jsx)**

`src/english.jsx` 상단 activities.jsx import에 `SentenceBuilderActivity`를 추가:
```jsx
import { LevelStepper, useMultiPick, multiTargetOptions, PickMark, WordMatchActivity, WORD_THEMES, SentenceBuilderActivity } from './activities.jsx'
```
`EnglishWordsActivity` 근처(또는 EnglishActivity 라우터 앞)에 래퍼 추가:
```jsx
function EnglishSentenceActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  return (
    <SentenceBuilderActivity
      tone={tone} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow}
      levels={ENGLISH_SENTENCES} color={tone.cat.english} icon="✍️" title="문장 만들기" speak={speakEn}
    />
  );
}
```
`EnglishActivity` 라우터에 분기 추가(예: `if (subId === 'song') ...` 앞 또는 뒤):
```jsx
  if (subId === 'sentence') return <EnglishSentenceActivity {...p} />;
```
(라우터가 `const p = { tone, fontSize, onComplete, onFinish, voiceShow }`를 쓰면 `{...p}`; 아니면 명시 전달. 현재 EnglishActivity 라우터의 패턴을 따른다.)

- [ ] **Step 3: SUBMENUS에 글짓기 추가 (shell.jsx)**

`src/shell.jsx`의 `SUBMENUS.hangul.items`에 추가(끝에):
```jsx
      { id: 'sentence', name: '글짓기', emoji: '✍️', sub: 'Lv.3' },
```
`SUBMENUS.english.items`에도 추가(끝에):
```jsx
      { id: 'sentence', name: '글짓기', emoji: '✍️', sub: 'Lv.3' },
```

- [ ] **Step 4: 검증**

Run: `npm test` → 통과. `npm run build` → SUCCESS, 무경고.
Run: `npm run dev`:
- 한글 > 글짓기 / 영어 > 글짓기(문장 만들기) 진입 → 빈칸 문장 + 카드 트레이.
- 카드를 **끌어** 빈칸에 넣기 / 카드 **탭 후 빈칸 탭**으로 넣기 모두 동작.
- 🔊 읽기 → 현재 문장 음성(한글 ko / 영어 en) + 글자 노출. 다 맞추면 자동 읽기 + 칭찬 + 다음.
- 채운 빈칸 탭 → 비움. ◀▶ 레벨(1→2→3), 재진입 1레벨.

- [ ] **Step 5: Commit**
```bash
git add src/activities.jsx src/english.jsx src/shell.jsx
git commit -m "feat(sentence): 한글·영어 글짓기 래퍼 + 디스패처/서브메뉴 배선"
```

## Context
디스패처는 hangul `sub.id`/english `subId`로 분기한다(기존 패턴). 서브메뉴 'sentence'를 양쪽에 추가하면 홈→카테고리→서브메뉴에서 글짓기 진입. 한글/영어 카테고리는 이미 `done:true, hasSub:true`. 영어 서브메뉴가 7개가 되지만 서브메뉴 스크롤은 이미 지원(이전 수정).

---

## 마무리 검증
- [ ] `npm test` 전체 PASS, `npm run build` 무경고.
- [ ] 한글·영어 글짓기: 드래그+탭 배치, 읽기 음성+글자, 정답 자동 다음, 레벨 1→3, 재진입 1레벨.
- [ ] 설계 대조: 데이터·상호작용·읽기/정답·레벨·공용화 전부 구현.

후속: 없음(요청 9개 완료). 추후 — mp3 보이스, 문장 확장.
