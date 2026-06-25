# 활동 다듬기 배치 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자 피드백 8건(음악 연습곡·자연스러움 튜닝·한글 음성 누락·글짓기 드래그·선택차단·ABC 노래)을 전부 코드로 고친다.

**Architecture:** 기존 컴포넌트에 대한 국소 수정 중심. 음악 'song' 모드는 피아노의 기존 패턴(`follow.setFixed` + advanceSong)을 드럼/실로폰에 이식. 글짓기 드래그는 스티커/꾸미기와 동일한 컨테이너-상대 % 좌표로 전환.

**Tech Stack:** React 18(alias `useStateA` 등), Vite 5, Web Audio(`playTone`/`playDrum`), Web Speech(`speakKo`/`speakEn`), vitest.

설계: `docs/superpowers/specs/2026-06-25-activity-polish-design.md`

## Global Constraints

- 전부 순수 코드. 자연스러운 사람 목소리(neural TTS mp3)·실제 ABC 보컬 녹음은 **비목표**(후속).
- 피아노 백건반 id 집합: `C,D,E,F,G,A,B,C5`. 드럼 패드 id: `kick,snare,tom,hihat,cymbal`. 실로폰 막대 id: `C,D,E,F,G,A,B,C5`.
- `npm test` 전체 PASS, `npm run build` 무경고가 모든 커밋의 통과 조건.
- 브랜치는 이미 `feature/activity-polish`(main에서 분기, 설계 커밋 `0c45204` 포함).

---

## Task 1: 화면 영역선택(롱프레스) 차단 (#5)

**Files:** Modify `src/styles.css`

- [ ] **Step 1: 전역 규칙 추가**

`src/styles.css` **맨 위**(또는 기존 `:root`/`body` 규칙 근처)에 추가:
```css
/* 유아 터치: 롱프레스 텍스트/영역 선택·콜아웃·탭 하이라이트 차단 */
html, body, #root {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
```

- [ ] **Step 2: 검증 + Commit**

Run: `npm run build` → SUCCESS, 무경고. Run: `npm test` → 통과(기존 유지).
```bash
git add src/styles.css
git commit -m "fix(ux): 롱프레스 영역선택/콜아웃/탭하이라이트 전역 차단"
```

## Context
앱에 텍스트 입력 요소가 없어(부모설정은 토글/슬라이더) 전역 차단이 안전하다.

---

## Task 2: 글짓기 드래그 좌표 수정 (#8)

**Files:** Modify `src/activities.jsx` (`SentenceBuilderActivity`, line 1625~)

**Interfaces:**
- Produces: `drag` 상태가 `{ cardIdx, xPct, yPct }`(% 0~100). 떠다니는 카드는 루트 컨테이너 내 `position:absolute`.

- [ ] **Step 1: 루트 ref 추가**

`SentenceBuilderActivity` 상단 상태 선언부(line 1649~1651 근처, `dragRef`/`slotRefs` 옆)에 추가:
```jsx
  const stageRef = useRefA(null);
```

- [ ] **Step 2: cardDown/cardMove를 % 좌표로**

`cardDown`(line 1688)·`cardMove`(line 1694)를 교체:
```jsx
  const cardDown = (e, cardIdx) => {
    if (done) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    dragRef.current = { cardIdx, sx: e.clientX, sy: e.clientY, moved: false };
    setDrag({ cardIdx, ...pctFromEvent(e) });
  };
  const cardMove = (e) => {
    const d = dragRef.current; if (!d) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
    setDrag({ cardIdx: d.cardIdx, ...pctFromEvent(e) });
  };
```
그리고 `cardDown` **바로 앞**에 헬퍼 추가:
```jsx
  const pctFromEvent = (e) => {
    const el = stageRef.current;
    if (!el) return { xPct: 50, yPct: 50 };
    const r = el.getBoundingClientRect();
    return {
      xPct: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      yPct: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };
```
(`cardUp`의 슬롯 히트테스트는 `getBoundingClientRect` vs `clientX/Y`라 **그대로 둔다** — 정상 동작.)

- [ ] **Step 3: 루트 div에 ref + 떠다니는 카드 %로**

루트 return div(line 1725)에 `ref={stageRef}` 추가:
```jsx
    <div ref={stageRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
```
떠다니는 카드 JSX(line 1784~1789)를 교체:
```jsx
          {drag && (
            <div style={{ position: 'absolute', left: `${drag.xPct}%`, top: `${drag.yPct}%`, transform: 'translate(-50%, -50%)',
              fontSize: 56, lineHeight: 1, pointerEvents: 'none', zIndex: 80, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}>
              {round.tray[drag.cardIdx]?.emoji}
            </div>
          )}
```

- [ ] **Step 4: 검증 + Commit**

Run: `npm test` → 통과. `npm run build` → SUCCESS, 무경고.
Run: `npm run dev` → 한글/영어 글짓기에서 하단 카드를 끌면 **손가락 바로 위에 카드가 따라옴**(엉뚱한 곳 아님), 빈칸에 놓으면 들어감.
```bash
git add src/activities.jsx
git commit -m "fix(sentence): 드래그 카드 좌표를 컨테이너 % 기준으로(scale 컨테이너 정렬)"
```

## Context
앱은 `main.jsx`의 `transform: scale(s)` 안에서 렌더된다. `position:fixed`+생 clientX/Y는 스케일/오프셋만큼 어긋난다. 컨테이너 rect 기준 %는 스케일과 무관하게 시각 정렬되며, 이는 스티커/꾸미기(DecorateActivity)가 이미 쓰는 패턴이다. 한글·영어 글짓기는 같은 `SentenceBuilderActivity`라 한 번에 해결된다.

---

## Task 3: 자음/모음 들어보기 음성 (#3·#4)

**Files:** Modify `src/activities.jsx` (`HangulActivity`, line 2388~)

- [ ] **Step 1: 음성 시퀀스 + 타이머 정리**

`HangulActivity` 상태부(line 2394 `pingKey` 옆)에 타이머 ref 추가:
```jsx
  const wordTimerRef = useRefA(null);
  useEffectA(() => () => { if (wordTimerRef.current) clearTimeout(wordTimerRef.current); }, []);
```
`learn`(line 2400)을 교체 — 이름 말하고 약 1.3초 뒤 예시 단어:
```jsx
  const learn = () => {
    setPingKey((k) => k + 1);
    if (wordTimerRef.current) clearTimeout(wordTimerRef.current);
    speakKo(cur.name);                         // 예: "기역" / "아"
    wordTimerRef.current = setTimeout(() => { speakKo(cur.word); }, 1300); // 예: "기린" / "아기"
    if (!collected.has(idx)) {
      const ns = new Set(collected); ns.add(idx); setCollected(ns);
      onComplete && onComplete(1);
    }
  };
```
`next`/`prev`(line 2407~2408)를 교체 — 화면 이동 시 보류된 단어 음성 취소:
```jsx
  const next = () => { if (wordTimerRef.current) clearTimeout(wordTimerRef.current); setIdx((i) => (i + 1) % data.length); };
  const prev = () => { if (wordTimerRef.current) clearTimeout(wordTimerRef.current); setIdx((i) => (i - 1 + data.length) % data.length); };
```

- [ ] **Step 2: 검증 + Commit**

Run: `npm test` → 통과. `npm run build` → SUCCESS, 무경고.
Run: `npm run dev` → 한글 > 자음/모음 익히기에서 큰 글자/🔊 들어보기 누르면 **이름 발음 → 잠깐 뒤 예시 단어**가 들린다. 다음 글자로 넘기면 이전 단어 음성이 끼어들지 않는다.
```bash
git add src/activities.jsx
git commit -m "fix(hangul): 자음/모음 들어보기 음성 추가(이름→텀→예시단어)"
```

## Context
`learn()`이 원래 `speakKo`를 전혀 호출하지 않아 무음이었다(버그). `speakKo`는 파일 상단에 이미 import됨. `cur`은 `{ ch, name, word, emoji }`. 음성 자연스러움은 Task 4의 audio.js 튜닝으로 함께 개선된다(진짜 자연 음성은 후속 mp3).

---

## Task 4: 음성 파라미터 튜닝 (#6 + 전반)

**Files:** Modify `src/lib/audio.js` (`speakKo` line 313, `speakEn` line 299)

- [ ] **Step 1: 기본 파라미터 + 보이스 우선순위**

`speakEn`(line 299)을 교체:
```jsx
export function speakEn(text, { rate = 0.9, pitch = 1.0 } = {}) {
  try {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'en-US';
    u.rate = rate; u.pitch = pitch; u.volume = vols.voice;
    u.voice = pickVoice('en');
    window.speechSynthesis.speak(u);
  } catch {}
}
```
`speakKo`(line 313)를 교체:
```jsx
export function speakKo(text, { rate = 0.9, pitch = 1.05 } = {}) {
  try {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'ko-KR';
    u.rate = rate; u.pitch = pitch; u.volume = vols.voice;
    u.voice = pickVoice('ko');
    window.speechSynthesis.speak(u);
  } catch {}
}
```
그리고 `speakEn` **바로 앞**에 보이스 선택 헬퍼 추가:
```jsx
// 같은 언어의 보이스 중 품질 좋은 것 우선(없으면 첫 매칭, 그것도 없으면 기본).
const VOICE_PREFER = /google|neural|natural|yuna|유나|premium|enhanced/i;
function pickVoice(langPrefix) {
  try {
    const all = window.speechSynthesis.getVoices() || [];
    const same = all.filter((v) => new RegExp('^' + langPrefix, 'i').test(v.lang));
    return same.find((v) => VOICE_PREFER.test(v.name)) || same[0] || null;
  } catch { return null; }
}
```

- [ ] **Step 2: 검증 + Commit**

Run: `npm test` → 통과(기존 유지). `npm run build` → SUCCESS, 무경고.
```bash
git add src/lib/audio.js
git commit -m "fix(audio): speakKo/speakEn 자연스러움 튜닝(피치 완화 + 보이스 우선선택)"
```

## Context
브라우저 `speechSynthesis` 한계 내 개선이다(피치 1.3→1.05로 덜 기계적, 품질 좋은 보이스 우선). 모든 `speakKo`/`speakEn` 호출처(자음/모음·낱말·글짓기·도형·소셜 등)에 공통 적용. 진짜 자연 음성은 후속 mp3.

---

## Task 5: 피아노 연습곡 추가 + 장곡 (#2)

**Files:** Modify `src/activities.jsx` (`PIANO_SONGS` line 3463); Test `src/__tests__/activity-polish.test.js`

**Interfaces:**
- Produces: `export const PIANO_SONGS`(기존 4 + 동요 3곡, 각 `notes`는 백건반 id).

- [ ] **Step 1: 실패 테스트 작성(피아노만)**

Create `src/__tests__/activity-polish.test.js` (Task 6·7·8이 같은 파일에 describe를 append):
```js
import { describe, it, expect } from 'vitest'
import { PIANO_SONGS } from '../activities.jsx'

const WHITE = new Set(['C','D','E','F','G','A','B','C5'])

describe('PIANO_SONGS', () => {
  it('각 곡 notes는 백건반 id, 동요 장곡(≥13) 포함', () => {
    PIANO_SONGS.forEach((s) => {
      expect(s.notes.length).toBeGreaterThanOrEqual(1)
      s.notes.forEach((n) => expect(WHITE.has(n)).toBe(true))
    })
    expect(PIANO_SONGS.some((s) => s.notes.length >= 13)).toBe(true)
  })
})
```
(주의: 이번 단계는 `PIANO_SONGS`만 import — 아직 없는 export를 import하면 ESM 모듈 로드 자체가 실패한다. 드럼/실로폰/ABC 테스트는 해당 Task에서 import와 describe를 함께 추가한다.)

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test` → FAIL (`PIANO_SONGS` export 없음 — 곧 Step 3에서 추가).

- [ ] **Step 3: PIANO_SONGS export + 동요 추가**

`src/activities.jsx`의 `const PIANO_SONGS = [`(line 3463)를 `export const PIANO_SONGS = [`로 바꾸고, 기존 4곡 **다음**에 추가:
```jsx
  { id: 's5', name: '작은별',   emoji: '⭐', notes: ['C','C','G','G','A','A','G','F','F','E','E','D','D','C'] },
  { id: 's6', name: '비행기',   emoji: '✈️', notes: ['G','E','E','F','D','D','C','D','E','F','G','G','G'] },
  { id: 's7', name: '나비야',   emoji: '🦋', notes: ['G','E','E','F','D','D','C','D','E','F','G','G','E'] },
```
(이 Task는 PIANO만 export/추가. DRUM_SONGS/XYLO_SONGS/ABC_SONG export는 Task 6/7/8에서 추가.)

- [ ] **Step 4: 전체 테스트 통과 확인**

Run: `npm test` → **전체 PASS**(테스트 파일이 PIANO_SONGS만 import하므로 이 시점에 완전 통과).

- [ ] **Step 5: Commit**
```bash
git add src/activities.jsx src/__tests__/activity-polish.test.js
git commit -m "feat(piano): 연습곡에 동요 장곡 추가(작은별·비행기·나비야) + 곡 데이터 테스트"
```

## Context
동요는 백건반(C~B)만 사용해 기존 따라치기/연습곡 흐름과 호환. 테스트 파일은 이 Task에서 PIANO만 다루고, Task 6/7/8이 같은 파일에 import와 describe를 append하며 각자 통과시킨다(각 Task 종료 시 `npm test` 완전 통과).

---

## Task 6: 북 연습곡 모드 (#1 드럼)

**Files:** Modify `src/activities.jsx` (`DrumActivity` line 3487~)

**Interfaces:**
- Consumes: `useFollowPattern`, `DRUM_PADS`, `playDrum`, `playSfx`.
- Produces: `export const DRUM_SONGS`(리듬 패턴 곡, 각 step은 패드 id).

- [ ] **Step 1: DRUM_SONGS + DrumActivity 'song' 모드**

`DRUM_PADS` 정의 **다음**(`DrumActivity` 함수 앞)에 추가:
```jsx
// 북 연습곡 — 패드 id 시퀀스(리듬). 저작권 곡 아님.
export const DRUM_SONGS = [
  { id: 'd1', name: '쿵짝짝',   emoji: '🥁', notes: ['kick','snare','snare','kick','snare','snare','kick','snare'] },
  { id: 'd2', name: '둥둥따',   emoji: '🪘', notes: ['tom','tom','snare','tom','tom','snare','kick','cymbal'] },
  { id: 'd3', name: '신나게',   emoji: '🎉', notes: ['kick','hihat','snare','hihat','kick','hihat','snare','cymbal','kick','snare'] },
];
```
`DrumActivity`에서 다음을 수정:

(a) 상태에 songId 추가 — `const [mode, setMode] = useStateA('free');`(line 3491) **다음 줄**에:
```jsx
  const [songId, setSongId] = useStateA(null);
```
(b) `[mode]` 리셋 effect(line 3502~3506)에 `setSongId(null)` 추가:
```jsx
  useEffectA(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    follow.setFixed([]); setSongId(null);
  }, [mode]);
```
(c) `startNewFollow`(line 3509) **다음**에 곡 헬퍼 추가:
```jsx
  const selectSong = (s) => { setSongId(s.id); follow.setFixed(s.notes); };
  const advanceSong = () => {
    const i = DRUM_SONGS.findIndex((s) => s.id === songId);
    const nx = DRUM_SONGS[(i + 1) % DRUM_SONGS.length];
    setSongId(nx.id); follow.setFixed(nx.notes);
  };
```
(d) `tap`의 follow 분기(line 3526~3533)를 song 포함으로 교체:
```jsx
    if ((mode === 'follow' || mode === 'song') && follow.pattern.length) {
      const result = follow.tap(pad.id);
      if (result === 'wrong') playSfx('wrong');
      else if (result === 'done') {
        onComplete && onComplete(mode === 'song' ? 3 : 2);
        addTimer(setTimeout(() => { if (mode === 'song') advanceSong(); else startNewFollow(); }, 900));
      }
    }
```
(e) 모드 탭(line 3562)에 '연습곡' 추가:
```jsx
        {[{ id: 'free', name: '자유연주', emoji: '🥁' }, { id: 'follow', name: '따라치기', emoji: '🎼' }, { id: 'song', name: '연습곡', emoji: '🎵' }].map((m) => {
```
(f) 가이드 패널의 상단 버튼 행(line 3597~3611, `<div ...justify-content:space-between>` 안의 `startNewFollow` 버튼)을 모드별 분기로 교체:
```jsx
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              {mode === 'song' ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DRUM_SONGS.map((s) => (
                    <button key={s.id} onClick={() => selectSong(s)}
                      style={{ height: 42, padding: '0 14px', borderRadius: 21, background: songId === s.id ? color : '#fff',
                        color: songId === s.id ? t.textOnColor : t.text, border: songId === s.id ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                        fontSize: fontSize - 4, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{s.emoji} {s.name}</button>
                  ))}
                </div>
              ) : (
                <button onClick={startNewFollow}
                  style={{ height: 42, padding: '0 18px', borderRadius: 21, background: t.accent, color: t.text,
                    border: t.outline === 'none' ? 'none' : t.outline, fontSize: fontSize - 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🎲 새 패턴</button>
              )}
              {follow.pattern.length > 0 && (
                <button onClick={preview}
                  style={{ height: 38, padding: '0 14px', borderRadius: 19, background: '#fff', color: t.text,
                    border: accentBorder, fontSize: fontSize - 4, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🔊 들어보기</button>
              )}
            </div>
```
(g) 빈-패턴 안내문(line 3631 `🎲 새 패턴을 눌러서 시작해봐`)을 모드별로:
```jsx
              <div style={{ textAlign: 'center', fontSize: fontSize - 4, color: t.textMuted, fontWeight: 700 }}>{mode === 'song' ? '🎵 연습곡을 골라봐' : '🎲 새 패턴을 눌러서 시작해봐'}</div>
```

- [ ] **Step 2: 테스트에 DRUM describe append**

`src/__tests__/activity-polish.test.js` 상단 import에 `DRUM_SONGS` 추가:
```js
import { PIANO_SONGS, DRUM_SONGS } from '../activities.jsx'
```
파일 끝에 describe 추가:
```js
const DRUM = new Set(['kick','snare','tom','hihat','cymbal'])
describe('DRUM_SONGS', () => {
  it('3곡+, 각 step은 드럼 패드 id, 길이 ≥8', () => {
    expect(DRUM_SONGS.length).toBeGreaterThanOrEqual(3)
    DRUM_SONGS.forEach((s) => {
      expect(s.notes.length).toBeGreaterThanOrEqual(8)
      s.notes.forEach((n) => expect(DRUM.has(n)).toBe(true))
    })
  })
})
```

- [ ] **Step 3: 전체 테스트 통과 + 빌드**

Run: `npm test` → 전체 PASS. `npm run build` → SUCCESS, 무경고.

- [ ] **Step 4: Commit**
```bash
git add src/activities.jsx src/__tests__/activity-polish.test.js
git commit -m "feat(drum): 연습곡 모드 추가(리듬 곡 선택→따라치기) + DRUM_SONGS"
```

## Context
'song'은 'follow'와 동일 메커니즘(`follow.setFixed`로 고정 패턴 로드)이라 패턴 스트립/패드 글로우/preview/tap이 그대로 재사용된다. 차이는 새 패턴 대신 곡 선택, done 시 다음 곡으로 진행. `gridTemplateColumns`·패드 렌더는 무수정.

---

## Task 7: 실로폰 연습곡 모드 (#1 실로폰)

**Files:** Modify `src/activities.jsx` (`XyloActivity` line 3683~)

**Interfaces:**
- Consumes: `useFollowPattern`, `XYLO_BARS`, `playTone`, `playSfx`.
- Produces: `export const XYLO_SONGS`(동요, 각 note는 막대 id C~C5).

- [ ] **Step 1: XYLO_SONGS + XyloActivity 'song' 모드**

`XYLO_BARS` 정의 **다음**(`XyloActivity` 함수 앞)에 추가:
```jsx
// 실로폰 연습곡 — 막대 id 시퀀스(동요). 백건반 음역(C~C5).
export const XYLO_SONGS = [
  { id: 'x1', name: '작은별', emoji: '⭐', notes: ['C','C','G','G','A','A','G','F','F','E','E','D','D','C'] },
  { id: 'x2', name: '비행기', emoji: '✈️', notes: ['G','E','E','F','D','D','C','D','E','F','G','G','G'] },
  { id: 'x3', name: '나비야', emoji: '🦋', notes: ['G','E','E','F','D','D','C','D','E','F','G','G','E'] },
];
```
`XyloActivity`에서 수정(드럼과 동일 패턴):

(a) `const [mode, setMode] = useStateA('free');`(line 3687) **다음 줄**:
```jsx
  const [songId, setSongId] = useStateA(null);
```
(b) `[mode]` effect(line 3698~3702)에 `setSongId(null)` 추가:
```jsx
  useEffectA(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    follow.setFixed([]); setSongId(null);
  }, [mode]);
```
(c) `startNewFollow`(line 3705)·`playBar`(line 3706) **다음**에:
```jsx
  const selectSong = (s) => { setSongId(s.id); follow.setFixed(s.notes); };
  const advanceSong = () => {
    const i = XYLO_SONGS.findIndex((s) => s.id === songId);
    const nx = XYLO_SONGS[(i + 1) % XYLO_SONGS.length];
    setSongId(nx.id); follow.setFixed(nx.notes);
  };
```
(d) `tap`의 follow 분기(line 3723~3730)를 song 포함으로 교체:
```jsx
    if ((mode === 'follow' || mode === 'song') && follow.pattern.length) {
      const result = follow.tap(bar.id);
      if (result === 'wrong') playSfx('wrong');
      else if (result === 'done') {
        onComplete && onComplete(mode === 'song' ? 3 : 2);
        addTimer(setTimeout(() => { if (mode === 'song') advanceSong(); else startNewFollow(); }, 900));
      }
    }
```
(e) 모드 탭(line 3759)에 '연습곡' 추가:
```jsx
        {[{ id: 'free', name: '자유연주', emoji: '🎼' }, { id: 'follow', name: '따라치기', emoji: '🎵' }, { id: 'song', name: '연습곡', emoji: '⭐' }].map((m) => {
```
(f) 가이드 패널 상단 버튼 행(line 3794~3808, `startNewFollow` 버튼 포함 div)을 교체:
```jsx
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              {mode === 'song' ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {XYLO_SONGS.map((s) => (
                    <button key={s.id} onClick={() => selectSong(s)}
                      style={{ height: 42, padding: '0 14px', borderRadius: 21, background: songId === s.id ? color : '#fff',
                        color: songId === s.id ? t.textOnColor : t.text, border: songId === s.id ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                        fontSize: fontSize - 4, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{s.emoji} {s.name}</button>
                  ))}
                </div>
              ) : (
                <button onClick={startNewFollow}
                  style={{ height: 42, padding: '0 18px', borderRadius: 21, background: t.accent, color: t.text,
                    border: t.outline === 'none' ? 'none' : t.outline, fontSize: fontSize - 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🎲 새 패턴</button>
              )}
              {follow.pattern.length > 0 && (
                <button onClick={preview}
                  style={{ height: 38, padding: '0 14px', borderRadius: 19, background: '#fff', color: t.text,
                    border: accentBorder, fontSize: fontSize - 4, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>🔊 들어보기</button>
              )}
            </div>
```
(g) 빈-패턴 안내문(line 3829 `🎲 새 패턴을 눌러서 시작해봐`)을:
```jsx
              <div style={{ textAlign: 'center', fontSize: fontSize - 4, color: t.textMuted, fontWeight: 700 }}>{mode === 'song' ? '🎵 연습곡을 골라봐' : '🎲 새 패턴을 눌러서 시작해봐'}</div>
```

- [ ] **Step 2: 테스트에 XYLO describe append**

`src/__tests__/activity-polish.test.js` 상단 import에 `XYLO_SONGS` 추가:
```js
import { PIANO_SONGS, DRUM_SONGS, XYLO_SONGS } from '../activities.jsx'
```
파일 끝에 describe 추가(`WHITE`는 파일 상단에 이미 선언됨 — 재사용):
```js
describe('XYLO_SONGS', () => {
  it('3곡+, 각 note는 막대 id, 길이 ≥8', () => {
    expect(XYLO_SONGS.length).toBeGreaterThanOrEqual(3)
    XYLO_SONGS.forEach((s) => {
      expect(s.notes.length).toBeGreaterThanOrEqual(8)
      s.notes.forEach((n) => expect(WHITE.has(n)).toBe(true))
    })
  })
})
```

- [ ] **Step 3: 전체 테스트 통과 + 빌드**

Run: `npm test` → 전체 PASS. `npm run build` → SUCCESS, 무경고.

- [ ] **Step 4: Commit**
```bash
git add src/activities.jsx src/__tests__/activity-polish.test.js
git commit -m "feat(xylo): 연습곡 모드 추가(동요 선택→따라치기) + XYLO_SONGS"
```

## Context
드럼과 동일 구조·동일 편집. 실로폰 막대는 C~C5라 동요(C~B 범위)가 그대로 연주된다. 패턴 스트립은 `bar.ko`(도레미)를 표시(기존).

---

## Task 8: ABC 노래 멜로디 (#7)

**Files:** Modify `src/english.jsx` (`AbcSongActivity` line 409~, import line 5)

**Interfaces:**
- Consumes: `ALPHABET`, `playTone`(audio.js), `speakEn`.
- Produces: `export const ABC_SONG`(26항 `{ letter, note, dur }`).

- [ ] **Step 1: import + ABC_SONG 데이터**

`src/english.jsx` line 5 import에 `playTone` 추가:
```jsx
import { playSfx, speakEn, playTone } from './lib/audio.js'
```
`AbcSongActivity` 함수 **앞**에 추가:
```jsx
// ABC 노래 = 반짝반짝 작은별 곡조. dur: 1=기본, 0.5=빠름(LMNOP), 2=길게.
const ABC_NOTE_FREQ = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.00, A: 440.00 };
export const ABC_SONG = [
  { letter: 'A', note: 'C', dur: 1 }, { letter: 'B', note: 'C', dur: 1 }, { letter: 'C', note: 'G', dur: 1 }, { letter: 'D', note: 'G', dur: 1 },
  { letter: 'E', note: 'A', dur: 1 }, { letter: 'F', note: 'A', dur: 1 }, { letter: 'G', note: 'G', dur: 2 },
  { letter: 'H', note: 'F', dur: 1 }, { letter: 'I', note: 'F', dur: 1 }, { letter: 'J', note: 'E', dur: 1 }, { letter: 'K', note: 'E', dur: 1 },
  { letter: 'L', note: 'D', dur: 0.5 }, { letter: 'M', note: 'D', dur: 0.5 }, { letter: 'N', note: 'D', dur: 0.5 }, { letter: 'O', note: 'D', dur: 0.5 }, { letter: 'P', note: 'C', dur: 2 },
  { letter: 'Q', note: 'G', dur: 1 }, { letter: 'R', note: 'G', dur: 1 }, { letter: 'S', note: 'F', dur: 2 },
  { letter: 'T', note: 'F', dur: 1 }, { letter: 'U', note: 'E', dur: 1 }, { letter: 'V', note: 'E', dur: 2 },
  { letter: 'W', note: 'D', dur: 1 }, { letter: 'X', note: 'D', dur: 1 }, { letter: 'Y', note: 'D', dur: 1 }, { letter: 'Z', note: 'C', dur: 2 },
];
```

- [ ] **Step 2: play()를 멜로디 재생으로 교체**

`play`(line 424~439)를 교체 — 음 길이에 맞춰 누적 타이밍, 각 음에 글자 하이라이트 + 톤 + 발음:
```jsx
  const play = () => {
    if (playing.current) { stop(); return; }
    playing.current = true; setIsPlaying(true);
    const BEAT = 520; // ms per dur=1
    let at = 0;
    ABC_SONG.forEach((step, i) => {
      addT(setTimeout(() => {
        if (!playing.current) return;
        setPlayIdx(i);
        playTone(ABC_NOTE_FREQ[step.note], { dur: Math.max(0.25, step.dur * 0.5), peak: 0.4, type: 'triangle' });
        speakEn(step.letter, { rate: 1.0 });
        if (i === ABC_SONG.length - 1) {
          addT(setTimeout(() => {
            playing.current = false; setIsPlaying(false); setPlayIdx(-1);
            if (!wonRef.current) { wonRef.current = true; onComplete && onComplete(3); }
          }, step.dur * BEAT + 300));
        }
      }, at));
      at += step.dur * BEAT;
    });
  };
```
(주의: `setPlayIdx(i)`는 `ABC_SONG`의 인덱스. 글자 격자는 `ALPHABET`(A~Z 동일 순서)이라 `playIdx === i` 하이라이트가 그대로 맞는다.)

- [ ] **Step 3: 테스트에 ABC describe append**

`src/__tests__/activity-polish.test.js`에 `english.jsx` import 줄 추가(상단, activities import 아래):
```js
import { ABC_SONG } from '../english.jsx'
```
파일 끝에 describe 추가:
```js
describe('ABC_SONG', () => {
  it('26글자 A~Z 순서 + 유효 음/길이', () => {
    expect(ABC_SONG).toHaveLength(26)
    const NOTE = new Set(['C','D','E','F','G','A'])
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((ch, i) => {
      expect(ABC_SONG[i].letter).toBe(ch)
      expect(NOTE.has(ABC_SONG[i].note)).toBe(true)
      expect(ABC_SONG[i].dur).toBeGreaterThan(0)
    })
  })
})
```

- [ ] **Step 4: 검증 + Commit**

Run: `npm test` → **전체 PASS**(4개 export 전부 채워짐). `npm run build` → SUCCESS, 무경고.
Run: `npm run dev` → 영어 > ABC 노래 ▶ → **작은별 곡조 멜로디**가 글자 하이라이트와 함께 흐르고, 글자도 음에 맞춰 발음된다(LMNOP 빠르게).
```bash
git add src/english.jsx src/__tests__/activity-polish.test.js
git commit -m "feat(english): ABC 노래에 작은별 멜로디 + 글자 싱크(합성음)"
```

## Context
멜로디는 `playTone`(피아노와 동일 합성음). `speakEn`은 음 위에 베스트에포트로 얹힘(빠른 LMNOP 구간은 일부 잘릴 수 있음 — 합성음 한계, 진짜 보컬은 후속 mp3). `ALPHABET[i].u`/`.l` 격자 렌더는 무수정(하이라이트만 `playIdx`로 동작).

---

## 마무리 검증
- [ ] `npm test` 전체 PASS, `npm run build` 무경고.
- [ ] 5 선택차단 / 8 글짓기 드래그 정렬 / 3·4 자음모음 음성(이름→텀→단어) / 6 음성 덜 기계적 / 2 피아노 장곡 / 1 북·실로폰 연습곡 / 7 ABC 멜로디 — 전부 동작.
- [ ] 설계 대조: 8건 전부 구현. 자연 음성 mp3·ABC 보컬은 후속으로 명시.

후속: neural TTS mp3(자음/모음/낱말/예시단어/ABC 보컬) 생성 — 본인 Azure `SPEECH_KEY` 필요. 별도 설계.
