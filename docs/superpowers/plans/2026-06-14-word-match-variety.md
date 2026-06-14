# 단어 맞추기 다양화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 영어·한글 단어 맞추기에 출제 방식 다양화(그림→단어/단어→그림/🔊듣고→그림), 주제(theme) 선택, 세트 확장을 적용하고, 두 활동을 공용 `WordMatchActivity`로 통합한다.

**Architecture:** 출제 모드는 정답 키(`word`)는 그대로 두고 프롬프트/보기 렌더만 바꾼다 → 기존 `useMultiPick`/`multiTargetOptions` 로직 재사용. 데이터에 `theme` 추가·확장(주제별 8단어). 공용 컴포넌트 `WordMatchActivity`를 `activities.jsx`에 두고 영어/한글이 데이터·speak·config를 주입하는 래퍼가 된다. 한국어 단어 음성 `speakKo` 신규.

**Tech Stack:** React 18(전역 alias), Vite 5, Web Speech API, vitest.

설계: `docs/superpowers/specs/2026-06-14-word-match-variety-design.md`

---

## File Structure
- `src/lib/audio.js` — `speakKo` 신규.
- `src/activities.jsx` — `WORD_THEMES`/`wordsByTheme`(export), `HANGUL_WORDS`(theme·확장, export), `WordMatchActivity`(export), `HangulWordsActivity` 래퍼화.
- `src/english.jsx` — `WORD_SET`(theme·확장), `EnglishWordsActivity` 래퍼화.
- `src/__tests__/activity-logic.test.js` — `wordsByTheme` + 데이터 적합성 테스트.

---

## Task 1: 음성 + 데이터(theme·확장) + 순수함수 + 테스트

**Files:** Modify `src/lib/audio.js`, `src/activities.jsx`, `src/english.jsx`, `src/__tests__/activity-logic.test.js`

- [ ] **Step 1: 실패 테스트 추가**

`src/__tests__/activity-logic.test.js` 끝에 추가:
```js
import { wordsByTheme, HANGUL_WORDS, WORD_THEMES } from '../activities.jsx'
import { WORD_SET } from '../english.jsx'

describe('wordsByTheme', () => {
  const ws = [{ word: 'a', emoji: 'x', theme: 'animal' }, { word: 'b', emoji: 'y', theme: 'food' }]
  it('all이면 전체, 특정 theme이면 필터, 없으면 빈 배열', () => {
    expect(wordsByTheme(ws, 'all')).toHaveLength(2)
    expect(wordsByTheme(ws, 'animal')).toEqual([{ word: 'a', emoji: 'x', theme: 'animal' }])
    expect(wordsByTheme(ws, 'nope')).toEqual([])
  })
})

describe('단어 데이터 주제 적합성', () => {
  const themeIds = WORD_THEMES.map((t) => t.id)
  for (const [name, set] of [['english', WORD_SET], ['hangul', HANGUL_WORDS]]) {
    it(`${name}: 각 단어 theme 유효 + 각 주제 ≥6단어`, () => {
      for (const w of set) {
        expect(typeof w.word).toBe('string')
        expect(w.emoji.length).toBeGreaterThan(0)
        expect(themeIds).toContain(w.theme)
      }
      for (const id of themeIds) {
        expect(set.filter((w) => w.theme === id).length).toBeGreaterThanOrEqual(6)
      }
    })
  }
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test` → FAIL (wordsByTheme/WORD_THEMES/HANGUL_WORDS export 없음, 데이터에 theme 없음).

- [ ] **Step 3: speakKo 추가 (audio.js)**

`src/lib/audio.js`의 `speakEn` 함수 다음에 추가:
```js
// 한국어 단어 음성 — speechSynthesis ko-KR. 음량은 voice 슬라이더 연동.
export function speakKo(text, { rate = 0.95, pitch = 1.3 } = {}) {
  try {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'ko-KR';
    u.rate = rate; u.pitch = pitch; u.volume = vols.voice;
    const ko = (window.speechSynthesis.getVoices() || []).find((v) => /^ko/i.test(v.lang));
    if (ko) u.voice = ko;
    window.speechSynthesis.speak(u);
  } catch {}
}
```

- [ ] **Step 4: WORD_THEMES + wordsByTheme + HANGUL_WORDS 교체 (activities.jsx)**

`src/activities.jsx`의 기존 `const HANGUL_WORDS = [ ... ];` 정의를 찾아 아래로 **교체**(export + theme + 40단어):
```js
export const WORD_THEMES = [
  { id: 'animal',  name: '동물' },
  { id: 'food',    name: '음식' },
  { id: 'vehicle', name: '탈것' },
  { id: 'nature',  name: '자연' },
  { id: 'object',  name: '사물' },
];

// 주제별 단어 필터(순수). theme==='all'이면 전체.
export function wordsByTheme(words, theme) {
  return theme === 'all' ? words : words.filter((w) => w.theme === theme);
}

export const HANGUL_WORDS = [
  { word: '고양이', emoji: '🐱', theme: 'animal' }, { word: '강아지', emoji: '🐶', theme: 'animal' },
  { word: '여우',   emoji: '🦊', theme: 'animal' }, { word: '사자',   emoji: '🦁', theme: 'animal' },
  { word: '곰',     emoji: '🐻', theme: 'animal' }, { word: '토끼',   emoji: '🐰', theme: 'animal' },
  { word: '돼지',   emoji: '🐷', theme: 'animal' }, { word: '개구리', emoji: '🐸', theme: 'animal' },
  { word: '사과',   emoji: '🍎', theme: 'food' },   { word: '바나나', emoji: '🍌', theme: 'food' },
  { word: '포도',   emoji: '🍇', theme: 'food' },   { word: '달걀',   emoji: '🥚', theme: 'food' },
  { word: '빵',     emoji: '🍞', theme: 'food' },   { word: '케이크', emoji: '🍰', theme: 'food' },
  { word: '우유',   emoji: '🥛', theme: 'food' },   { word: '옥수수', emoji: '🌽', theme: 'food' },
  { word: '자동차', emoji: '🚗', theme: 'vehicle' },{ word: '버스',   emoji: '🚌', theme: 'vehicle' },
  { word: '기차',   emoji: '🚂', theme: 'vehicle' },{ word: '비행기', emoji: '✈️', theme: 'vehicle' },
  { word: '배',     emoji: '🚢', theme: 'vehicle' },{ word: '자전거', emoji: '🚲', theme: 'vehicle' },
  { word: '트럭',   emoji: '🚚', theme: 'vehicle' },{ word: '택시',   emoji: '🚕', theme: 'vehicle' },
  { word: '해',     emoji: '☀️', theme: 'nature' }, { word: '달',     emoji: '🌙', theme: 'nature' },
  { word: '별',     emoji: '⭐', theme: 'nature' }, { word: '나무',   emoji: '🌳', theme: 'nature' },
  { word: '꽃',     emoji: '🌸', theme: 'nature' }, { word: '비',     emoji: '🌧️', theme: 'nature' },
  { word: '구름',   emoji: '☁️', theme: 'nature' }, { word: '눈',     emoji: '❄️', theme: 'nature' },
  { word: '모자',   emoji: '🎩', theme: 'object' }, { word: '컵',     emoji: '🥤', theme: 'object' },
  { word: '공',     emoji: '⚽', theme: 'object' }, { word: '책',     emoji: '📖', theme: 'object' },
  { word: '시계',   emoji: '🕐', theme: 'object' }, { word: '열쇠',   emoji: '🔑', theme: 'object' },
  { word: '선물',   emoji: '🎁', theme: 'object' }, { word: '우산',   emoji: '☂️', theme: 'object' },
];
```
주의: 기존 `HANGUL_WORDS`가 `const`였다면 `export const`로 바뀐다. 같은 파일의 `HANGUL_WORD_LEVELS`/`hangulWordLevelConfig` 정의는 그대로 둔다(이 교체 블록 다음에 위치하면 순서 유지). `HANGUL_WORDS`를 참조하는 `hangulWordLevelConfig`의 `HANGUL_WORDS.length`(이제 40)도 자동 반영.

- [ ] **Step 5: WORD_SET 교체 (english.jsx, theme·40단어)**

`src/english.jsx`의 기존 `export const WORD_SET = [ ... ];`를 아래로 교체:
```js
export const WORD_SET = [
  { word: 'cat', emoji: '🐱', theme: 'animal' }, { word: 'dog', emoji: '🐶', theme: 'animal' },
  { word: 'fox', emoji: '🦊', theme: 'animal' }, { word: 'lion', emoji: '🦁', theme: 'animal' },
  { word: 'bear', emoji: '🐻', theme: 'animal' }, { word: 'rabbit', emoji: '🐰', theme: 'animal' },
  { word: 'pig', emoji: '🐷', theme: 'animal' }, { word: 'frog', emoji: '🐸', theme: 'animal' },
  { word: 'apple', emoji: '🍎', theme: 'food' }, { word: 'banana', emoji: '🍌', theme: 'food' },
  { word: 'grape', emoji: '🍇', theme: 'food' }, { word: 'egg', emoji: '🥚', theme: 'food' },
  { word: 'bread', emoji: '🍞', theme: 'food' }, { word: 'cake', emoji: '🍰', theme: 'food' },
  { word: 'milk', emoji: '🥛', theme: 'food' }, { word: 'corn', emoji: '🌽', theme: 'food' },
  { word: 'car', emoji: '🚗', theme: 'vehicle' }, { word: 'bus', emoji: '🚌', theme: 'vehicle' },
  { word: 'train', emoji: '🚂', theme: 'vehicle' }, { word: 'plane', emoji: '✈️', theme: 'vehicle' },
  { word: 'ship', emoji: '🚢', theme: 'vehicle' }, { word: 'bike', emoji: '🚲', theme: 'vehicle' },
  { word: 'truck', emoji: '🚚', theme: 'vehicle' }, { word: 'taxi', emoji: '🚕', theme: 'vehicle' },
  { word: 'sun', emoji: '☀️', theme: 'nature' }, { word: 'moon', emoji: '🌙', theme: 'nature' },
  { word: 'star', emoji: '⭐', theme: 'nature' }, { word: 'tree', emoji: '🌳', theme: 'nature' },
  { word: 'flower', emoji: '🌸', theme: 'nature' }, { word: 'rain', emoji: '🌧️', theme: 'nature' },
  { word: 'cloud', emoji: '☁️', theme: 'nature' }, { word: 'snow', emoji: '❄️', theme: 'nature' },
  { word: 'hat', emoji: '🎩', theme: 'object' }, { word: 'cup', emoji: '🥤', theme: 'object' },
  { word: 'ball', emoji: '⚽', theme: 'object' }, { word: 'book', emoji: '📖', theme: 'object' },
  { word: 'clock', emoji: '🕐', theme: 'object' }, { word: 'key', emoji: '🔑', theme: 'object' },
  { word: 'gift', emoji: '🎁', theme: 'object' }, { word: 'umbrella', emoji: '☂️', theme: 'object' },
];
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test` → PASS (기존 + 신규). `npm run build` → SUCCESS, 무경고. (기존 `EnglishWordsActivity`/`HangulWordsActivity`는 새 40단어 풀로 그대로 동작 — theme 무시.)

- [ ] **Step 7: Commit**
```bash
git add src/lib/audio.js src/activities.jsx src/english.jsx src/__tests__/activity-logic.test.js
git commit -m "feat(words): speakKo + 주제 데이터 확장(40단어) + wordsByTheme + 테스트"
```

---

## Task 2: 공용 WordMatchActivity 컴포넌트

**Files:** Modify `src/activities.jsx` (신규 export 컴포넌트 추가)

- [ ] **Step 1: WordMatchActivity 추가**

`src/activities.jsx`에서 `function HangulWordsActivity` 정의 **바로 앞**에 추가:
```jsx
const WORD_MODES = ['pic2word', 'word2pic', 'listen2pic'];

// 공용 단어 맞추기 — 모드(그림→단어/단어→그림/듣고→그림) + 주제 + 멀티타깃.
// 정답 키는 항상 word, 모드는 프롬프트/보기 렌더만 바꾼다.
export function WordMatchActivity({ tone, fontSize, onComplete, onFinish, voiceShow, words, themes, levelConfig, levelsLength, color, icon, title, speak }) {
  const t = tone;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const allThemes = [{ id: 'all', name: '전체' }, ...themes];
  const [levelIdx, setLevelIdx] = useStateA(0);
  const [theme, setTheme] = useStateA('all');
  const cfg = levelConfig(levelIdx);
  const byWord = (w) => words.find((x) => x.word === w);

  const newRound = () => {
    const poolWords = wordsByTheme(words, theme).map((w) => w.word);
    const tCount = Math.min(cfg.targets, poolWords.length);
    const oCount = Math.min(cfg.options, poolWords.length);
    const targets = shuffle(poolWords).slice(0, tCount);
    const opts = multiTargetOptions(targets, oCount, poolWords);
    const mode = WORD_MODES[Math.floor(Math.random() * WORD_MODES.length)];
    return { targets, opts, mode };
  };
  const [round, setRound] = useStateA(newRound);
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const mp = useMultiPick();
  const timersRef = useRefA([]);
  const addTimer = (id) => timersRef.current.push(id);
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  // 레벨/주제 변경 시 라운드 리셋(+타이머 정리)
  useEffectA(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    setProgress(0); setDone(false); setRound(newRound()); mp.reset();
  }, [levelIdx, theme]);

  // 듣기 모드: 라운드 시작 시 타깃 자동 발음
  useEffectA(() => {
    if (round.mode !== 'listen2pic') return;
    round.targets.forEach((w, i) => { addTimer(setTimeout(() => speak(w), 350 + i * 700)); });
  }, [round]);

  const onPick = (w) => {
    if (done) return;
    const r = mp.pick(w, round.targets);
    if (r === 'wrong') playSfx('wrong');
    else if (r === 'correct') { playSfx('correct'); speak(w); }
    else if (r === 'complete') {
      playSfx('correct'); speak(w);
      onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      addTimer(setTimeout(() => {
        if (n >= cfg.questions) { setDone(true); onComplete && onComplete(3); }
        else { setRound(newRound()); mp.reset(); }
      }, 850));
    }
  };
  const restart = () => { setProgress(0); setDone(false); setRound(newRound()); mp.reset(); };
  const nextLevel = () => { if (levelIdx < levelsLength - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };

  const multi = round.targets.length > 1;
  const showWordOptions = round.mode === 'pic2word';
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

      <div style={{ flex: '0 0 auto', padding: '0 24px 6px', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {allThemes.map((th) => {
          const active = theme === th.id;
          return (
            <button key={th.id} onClick={() => setTheme(th.id)}
              style={{ height: 38, padding: '0 16px', borderRadius: 19,
                background: active ? color : '#fff', color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                fontSize: fontSize - 4, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: active ? t.shadowSm : 'none' }}>{th.name}</button>
          );
        })}
      </div>

      {!done ? (
        <React.Fragment>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, minHeight: 0, padding: '0 32px', flexWrap: 'wrap' }}>
            {round.targets.map((w) => {
              const got = mp.found.includes(w);
              const cardStyle = {
                background: color, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: t.cardRadius + 8,
                padding: multi ? '16px 24px' : '22px 40px', boxShadow: t.shadow, opacity: got ? 0.5 : 1, transition: 'opacity 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              };
              if (round.mode === 'pic2word') {
                return <div key={w} style={cardStyle}><span style={{ fontSize: multi ? 110 : 170, lineHeight: 1 }}>{byWord(w)?.emoji || '❓'}</span></div>;
              }
              if (round.mode === 'word2pic') {
                return <div key={w} style={cardStyle}><span style={{ fontSize: multi ? 56 : 92, fontWeight: 900, color: t.textOnColor, lineHeight: 1 }}>{w}</span></div>;
              }
              return (
                <button key={w} onClick={() => speak(w)}
                  style={{ ...cardStyle, cursor: 'pointer', fontFamily: 'inherit', color: t.textOnColor, fontSize: multi ? 80 : 120 }}>🔊</button>
              );
            })}
          </div>

          <div style={{ flex: '0 0 auto', padding: '14px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${round.opts.length}, 1fr)`, gap: 14 }}>
            {round.opts.map((w) => {
              const isRight = mp.found.includes(w);
              const isWrong = mp.wrongKey === w;
              return (
                <button key={w} onClick={() => onPick(w)} disabled={isRight}
                  onPointerDown={(e) => !isRight && e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ position: 'relative', height: 84, fontSize: showWordOptions ? 30 : 52, fontWeight: 900, fontFamily: 'inherit',
                    cursor: isRight ? 'default' : 'pointer', background: isRight ? t.cat.code : isWrong ? t.cat.shape : '#fff',
                    border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline, borderRadius: t.cardRadius, boxShadow: t.shadow,
                    animation: isWrong ? 'kw-shake 0.4s ease' : 'none' }}>
                  {showWordOptions ? w : (byWord(w)?.emoji || '❓')}
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
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < levelsLength - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow}
        text={done ? '잘했어!'
          : round.mode === 'word2pic' ? '글자에 맞는 그림을 골라봐'
          : round.mode === 'listen2pic' ? '듣고 맞는 그림을 골라봐'
          : (multi ? '그림에 맞는 단어를 모두 골라봐' : '그림에 맞는 단어를 골라봐')}
        fontSize={fontSize - 4} />
    </div>
  );
}
```

- [ ] **Step 2: 검증**

Run: `npm test` → 통과(컴포넌트는 아직 미연결, 기존 테스트 유지). `npm run build` → SUCCESS, 무경고.
(`WordMatchActivity`가 아직 라우팅 안 됨 — 모듈 내부 export 함수라 미사용 경고/에러 없음.)

- [ ] **Step 3: Commit**
```bash
git add src/activities.jsx
git commit -m "feat(words): 공용 WordMatchActivity(모드·주제·멀티) 추가"
```

## Context
`shuffle`, `multiTargetOptions`, `useMultiPick`, `wordsByTheme`, `useStateA/useEffectA/useRefA`, `playSfx`, `LevelStepper`, `PickMark`, `VoiceGuide`는 모두 `activities.jsx`에 존재. 모드는 라운드 생성 시 무작위. 정답 키는 word, `showWordOptions`(pic2word)면 보기에 단어 글자, 아니면 이모지. listen2pic는 프롬프트가 🔊 버튼이고 라운드 시작 시 자동 발음. 주제 변경/레벨 변경 시 라운드 리셋. 멀티타깃(Lv4·5)은 `round.targets.length>1`.

---

## Task 3: 영어/한글 단어 활동을 래퍼로 전환

**Files:** Modify `src/activities.jsx` (`HangulWordsActivity`), `src/english.jsx` (`EnglishWordsActivity` + import)

- [ ] **Step 1: HangulWordsActivity를 래퍼로 교체 (activities.jsx)**

`src/activities.jsx`에서 `speakKo`를 audio import에 추가한다. 기존 audio import 줄(예: `import { playSfx, playTone, ... } from './lib/audio.js'`)에 `speakKo`를 추가:
```jsx
// 예: import { playSfx, ..., speakKo } from './lib/audio.js'
```
(현재 import에 무엇이 있는지 확인 후 `speakKo`만 추가.)

그리고 `function HangulWordsActivity(...) { ... }` 전체를 아래로 교체:
```jsx
function HangulWordsActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  return (
    <WordMatchActivity
      tone={tone} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow}
      words={HANGUL_WORDS} themes={WORD_THEMES}
      levelConfig={hangulWordLevelConfig} levelsLength={HANGUL_WORD_LEVELS.length}
      color={tone.cat.hangul} icon="🍓" title="낱말 맞추기" speak={speakKo}
    />
  );
}
```

- [ ] **Step 2: EnglishWordsActivity를 래퍼로 교체 (english.jsx)**

`src/english.jsx` 상단 import의 activities.jsx 줄에 `WordMatchActivity, WORD_THEMES`를 추가:
```jsx
import { LevelStepper, useMultiPick, multiTargetOptions, PickMark, WordMatchActivity, WORD_THEMES } from './activities.jsx'
```
그리고 `function EnglishWordsActivity(...) { ... }` 전체를 아래로 교체:
```jsx
function EnglishWordsActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  return (
    <WordMatchActivity
      tone={tone} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow}
      words={WORD_SET} themes={WORD_THEMES}
      levelConfig={englishLevelConfig} levelsLength={5}
      color={tone.cat.english} icon="🧩" title="단어 맞추기" speak={speakEn}
    />
  );
}
```
(`speakEn`은 english.jsx에 이미 import됨. `englishLevelConfig`/`WORD_SET`도 이미 있음. 교체로 더 이상 안 쓰이는 import가 생겨도 esbuild는 경고/에러 없음 — 그대로 둔다.)

- [ ] **Step 3: 검증**

Run: `npm test` → 통과. `npm run build` → SUCCESS, 무경고.
Run: `npm run dev`:
- 영어 > 단어 맞추기 / 한글 > 낱말: 라운드마다 그림→단어 / 단어→그림 / 🔊듣고가 섞여 출제. 듣기 모드에서 🔊 누르면 발음(영어 en-US / 한글 ko-KR).
- 상단 주제 탭(전체/동물/음식/탈것/자연/사물) 전환 → 그 주제만 출제.
- Lv4·5 멀티에서도 모드/주제·✓/✗·다음 레벨 정상. 재진입 시 1레벨·전체.

- [ ] **Step 4: Commit**
```bash
git add src/activities.jsx src/english.jsx
git commit -m "feat(words): 영어·한글 단어 맞추기를 WordMatchActivity 래퍼로 전환"
```

## Context
디스패처는 이미 hangul 'words'→`HangulWordsActivity`, english 'words'→`EnglishWordsActivity`로 라우팅한다(변경 불필요). 두 함수는 데이터·config·색·제목·speak만 주입하는 얇은 래퍼가 되어 공용 로직을 공유한다. `HANGUL_WORD_LEVELS`/`hangulWordLevelConfig`는 Task 1 이전부터 존재(이 작업에서 유지).

---

## 마무리 검증
- [ ] `npm test` 전체 PASS, `npm run build` 무경고.
- [ ] 영어/한글 단어: 3개 출제 모드 혼합, 주제 탭, 멀티 레벨, ✓/✗, 음성(en/ko) 동작.
- [ ] 설계 대조: ①출제방식 ②주제·확장 ③공용화 모두 구현.

후속(별도): #7 글짓기 놀이.
