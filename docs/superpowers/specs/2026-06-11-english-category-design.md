# 영어놀이 카테고리 + 레벨 활동 정책 설계

> 작성일: 2026-06-11
> 범위: (A) 레벨형 활동 공통 정책 변경(수기 ◀▶ 이동 + 항상 1레벨부터), (B) 영어놀이(english) 신규 카테고리 6활동
> 사용자 백로그: #4(영어놀이) + 추가요구(단계 수기 하향 + 종료해도 1부터)
> 신규 카테고리 순서: 영어 → 모양 → 컴퓨터(별도 명세). 본 문서는 **영어**만 다룬다.
> 기준 코드: `src/activities.jsx`(활동·디스패처), `src/shell.jsx`(`SUBMENUS`), `src/themes.jsx`(카테고리), `src/lib/audio.js`(음성).

---

## A. 레벨 활동 공통 정책 (기존 + 신규 모두)

레벨/스테이지가 있는 모든 활동에 동일 정책을 적용한다.

대상: **코딩(스테이지)**, **카드뒤집기(레벨)**, **그림자(레벨)**, 그리고 신규 **영어 파닉스/단어(레벨)**.

1. **수기 ◀▶ 레벨 이동**: 제목줄에 `◀`/`▶` 스테퍼를 두어 **언제든 상/하로 한 단계씩** 이동(아래로 내리기 포함).
   - 코딩은 이미 ◀▶ 보유 → 유지.
   - **카드뒤집기·그림자에는 ◀▶ 추가**(현재 "다음 레벨"만 있어 하향 불가).
   - 첫 레벨에서 ◀ 비활성, 마지막 레벨에서 ▶ 도 다음 단계가 없으면 비활성(또는 그대로 두되 동작만 막음).
2. **진행 비저장 — 항상 1레벨부터**: 활동 진입 시 **항상 레벨/스테이지 1**에서 시작한다.
   - `localStorage`의 현재 레벨 복원을 제거: `kw-coding-stage`, `kw-memory-level`, `kw-shadow-level` 의 **resume 읽기 삭제**(로드 시 항상 0).
   - 해당 레벨 저장 쓰기도 제거(불필요해짐). `kw-*-cleared`(최고 도달 기록)는 어디에도 사용되지 않으므로 함께 제거(쓰기 삭제) — YAGNI.
   - 세션 중에는 "다음 레벨/스테이지"(완료 오버레이) 및 ◀▶로 자유 이동 가능하되, **재진입하면 1부터**.
3. 완료 흐름(마지막 레벨 클리어 → 칭찬화면 `onFinish`)은 유지.

### 기존 활동별 변경 요약
- **CodingActivity**: `loadStage()` → 항상 0 반환(저장 복원 제거). `nextStage`/`prevStage`에서 `kw-coding-stage` 쓰기 제거. `stageWin`의 `kw-coding-cleared` 쓰기 제거. ◀▶ 유지.
- **MemoryActivity**: `loadLevel()` → 항상 0. `kw-memory-level`/`kw-memory-cleared` 쓰기 제거. 제목줄에 ◀▶ 스테퍼 추가(prevLevel/nextLevel ±1). 완료 오버레이의 "다음 레벨"은 유지.
- **ShadowActivity**: `loadLevel()` → 항상 0. `kw-shadow-level`/`kw-shadow-cleared` 쓰기 제거. 제목줄에 ◀▶ 스테퍼 추가. 완료 화면 "다음 레벨" 유지.

### 공용 헬퍼
중복을 줄이기 위해 `activities.jsx`에 작은 스테퍼 컴포넌트를 둔다:
```
<LevelStepper tone cur total onPrev onNext />  // 제목줄 우측 ◀ N/total ▶
```
코딩/메모리/그림자/영어가 공유. (코딩 기존 ◀▶도 이걸로 교체해 일관화.)

---

## B. 영어놀이(english) 카테고리

### 결정 요약
- 풀세트 6활동, 대/소문자 **별도 화면**, 음성은 **en-US `speechSynthesis`**, 단어는 **일상 혼합**.
- 한글 활동 패턴 재사용(플래시카드/따라쓰기/낱말).

### 서브메뉴 (`SUBMENUS.english`, shell.jsx)
| id | 이름 | emoji | 패턴 |
|---|---|---|---|
| `upper` | 대문자 ABC | 'A' (text) | 플래시카드 |
| `lower` | 소문자 abc | 'a' (text) | 플래시카드 |
| `trace` | 따라쓰기 | ✏️ | 캔버스 트레이싱 |
| `phonics` | 파닉스 | 🔊 | 듣고 고르기(레벨) |
| `words` | 단어 맞추기 | 🧩 | 그림→단어(레벨) |
| `song` | ABC 노래 | 🎵 | 글자 퍼레이드 |

### 데이터 (`src/english.jsx`)
```js
// 알파벳 26 — 대/소문자 + 예시단어 + 이모지
const ALPHABET = [
  { u:'A', l:'a', word:'Apple',  emoji:'🍎' },
  { u:'B', l:'b', word:'Ball',   emoji:'⚽' },
  ... (C-Cat🐱, D-Dog🐶, E-Egg🥚, F-Fish🐟, G-Grape🍇, H-Hat🎩, I-Ice🧊,
       J-Juice🧃, K-Kite🪁, L-Lion🦁, M-Moon🌙, N-Nest🪺, O-Orange🍊,
       P-Pig🐷, Q-Queen👑, R-Rain🌧️, S-Sun☀️, T-Tree🌳, U-Umbrella☂️,
       V-Van🚐, W-Watch⌚, X-Xylophone🎼, Y-Yo-yo🪀, Z-Zebra🦓)
];
// 단어 맞추기(일상 혼합) — 이모지로 표현 가능한 기초 단어 ~14개
const WORD_SET = [
  { word:'cat', emoji:'🐱' }, { word:'dog', emoji:'🐶' }, { word:'sun', emoji:'☀️' },
  { word:'bus', emoji:'🚌' }, { word:'cup', emoji:'🥤' }, { word:'hat', emoji:'🎩' },
  { word:'egg', emoji:'🥚' }, { word:'fish', emoji:'🐟' }, { word:'star', emoji:'⭐' },
  { word:'moon', emoji:'🌙' }, { word:'tree', emoji:'🌳' }, { word:'car', emoji:'🚗' },
  { word:'apple', emoji:'🍎' }, { word:'ball', emoji:'⚽' },
];
```

### 활동 동작
1. **대문자/소문자 (`AlphabetActivity`, subId 'upper'|'lower')** — `HangulActivity` 구조 재사용.
   - 카드: 큰 글자(`A` 또는 `a`) + 예시단어/이모지(예 Apple 🍎).
   - 카드(또는 🔊 버튼) 탭 → `speakEn`으로 글자명 + 단어 발음, 별 적립(처음 탭한 글자만, 한글 자/모음과 동일).
   - ◀▶로 A~Z 순회. **레벨 없음**(자유 학습).
2. **따라쓰기 (`EnglishTraceActivity`, 'trace')** — 큰 글자 윤곽(대문자 A~Z)을 손가락으로 덧칠 → 커버리지 도달 시 완료, 다음 글자. (TraceActivity의 캔버스 커버리지 접근을 영어 글자에 맞춰 구현. 한글 TraceActivity와 독립.)
   - 글자 탭 시 `speakEn(글자)`로 발음.
3. **파닉스 (`PhonicsActivity`, 'phonics')** — **레벨 3** (정책 A 적용).
   - 🔊 버튼 → 글자 소릿값/이름 재생(`speakEn`). 보기 글자 중 정답 선택.
   - Lv1: 보기 4 · 쉬운 글자군(A,B,C,…) · 6문제 / Lv2: 보기 4 · 전체 A~Z · 8문제 / Lv3: 보기 6 · 10문제.
   - N문제 클리어 → 완료 패널("다음 레벨"/마지막은 칭찬화면). ◀▶ 수기 이동 + 1부터.
4. **단어 맞추기 (`EnglishWordsActivity`, 'words')** — **레벨 3** (정책 A 적용). `HangulWordsActivity` 구조 재사용.
   - 그림(이모지) 제시 → 영어 단어 4(또는 6)지선다. 정답 시 `speakEn(word)`.
   - Lv1: 보기 4 · 6문제 / Lv2: 보기 4 · 8문제 / Lv3: 보기 6 · 10문제.
5. **ABC 노래 (`AbcSongActivity`, 'song')** — A~Z 격자.
   - ▶ "노래" → A부터 Z까지 순서대로 하이라이트하며 `speakEn(letter)`를 일정 템포로 재생(에셋 없이 TTS). 재생 중 ▶는 ⏸로.
   - 아무 글자나 탭 → 그 글자 `speakEn`. **레벨 없음**.
   - 전곡 1회 재생 완료 시 별 보너스.

### 신규 음성 — `src/lib/audio.js`에 `speakEn`
```js
export function speakEn(text, { rate = 0.85, pitch = 1.15 } = {}) {
  try {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = rate; u.pitch = pitch; u.volume = vols.voice;
    const en = (window.speechSynthesis.getVoices() || []).find((v) => /^en/i.test(v.lang));
    if (en) u.voice = en;
    window.speechSynthesis.speak(u);
  } catch {}
}
```
- 음량은 기존 voice 슬라이더(`vols.voice`)와 연동.
- 한국어 `fallbackSpeak`(ko-KR)와 **별개**. mp3는 본 단계 범위 외(추후 `/voices/en-*.mp3` 폴백 추가 여지).

### 파일 구성
- **신규 `src/english.jsx`**: `ALPHABET`, `WORD_SET`, 옵션 생성 순수 함수, 6개 활동, 그리고 라우팅 진입점 `EnglishActivity({ tone, subId, ... })`.
  - import: `VoiceGuide`(shell.jsx), `speakEn`(audio.js), `playSfx`(audio.js), 공용 `LevelStepper`(activities.jsx export).
  - 순환 import(english→shell→activities→english)는 렌더 시점 사용이라 기존 activities↔shell 패턴과 동일하게 안전.
- `src/activities.jsx` 디스패처: `if (cat.id === 'english') return <EnglishActivity .../>` 한 줄 위임 + `LevelStepper` export. (영어 본체는 activities.jsx에 두지 않아 파일 비대화 방지.)
- `src/shell.jsx`: `SUBMENUS.english` 추가(위 6항목).
- `src/themes.jsx`: english `{ done:true, hasSub:true }`로 변경(현재 false).

---

## C. 테스트 (vitest, 순수 함수)
숫자세기 무한루프 교훈을 반영해 **보기 생성기를 순수 함수로 분리·검증**한다.
- `phonicsOptions(targetIndex, optionCount, poolSize)` → 정답 포함 고유 글자 인덱스 N개(경계에서도 N개 보장, 무한루프 없음).
- `wordOptions(targetWord, optionCount, pool)` → 정답 포함 고유 단어 N개.
- `englishLevelConfig(level)` → `{ options, questions }` (그림자와 동일 형태, 클램프).
- 각 함수에 대해 모든 레벨/경계 타깃에서 길이·고유성·정답포함·범위 검증.

UI 동작(음성 재생, 트레이싱, 노래 퍼레이드)은 `npm run dev` 수동 확인.

---

## D. 범위 밖(후속)
- 고품질 사전녹음 영어 mp3(`/voices/en-*.mp3`) — TTS 폴백 위에 추후.
- 모양 꽃밭(shape), 컴퓨터/반짝등대(computer) 카테고리 — 각각 별도 명세.
- 한글 예시단어 듣기(#6) 등 한글 보강 — 별도.

## E. 검증
- 기존 코딩/메모리/그림자: 재진입 시 항상 1레벨, ◀▶로 하향 이동 가능, 세션 중 다음 레벨/스테이지 정상.
- 영어: 6개 서브 진입, en-US 음성 재생, 파닉스/단어 레벨 ◀▶ + 1부터, ABC 노래 퍼레이드.
- `npm test`(순수함수) + `npm run build` 무경고.
