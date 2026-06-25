# 활동 다듬기 배치 설계 (음악·음성·드래그·선택차단)

> 작성일: 2026-06-25
> 대상: 사용자 피드백 8건을 한 배치로 처리. **전부 순수 코드**(자연스러운 사람 목소리용 neural TTS mp3 생성은 본인 Azure 키가 필요해 후속으로 분리).
> 근거 매핑: `src/activities.jsx`(음악·한글·낱말·글짓기), `src/english.jsx`(ABC), `src/lib/audio.js`(음성), `src/styles.css`(선택차단), `src/main.jsx`(scale 컨테이너).

---

## 목표

만 3~5세 유아 앱의 활동 품질 피드백 8건을 코드로 고친다:
1. 북·실로폰에 연습곡 추가
2. 피아노 연습곡 추가 + 더 긴 곡
3. 한글 자음/모음 들어보기 음성이 안 나옴(호출 누락) → 나오게
4. 자음/모음 들어보기: 이름 → 1~2초 텀 → 예시 단어 순서 재생
5. 화면 롱프레스 영역선택 원천 차단
6. 낱말 맞추기(및 전반) 음성이 기계적 → 덜 기계적으로 튜닝
7. ABC 노래: 단순 읽기 → 멜로디(작은별 곡조) + 글자 싱크
8. 글짓기(한글·영어) 드래그 좌표 어긋남 수정

## 비목표 (후속)

- **자연스러운 사람 목소리(neural TTS mp3)** — 별도 후속(Azure `SPEECH_KEY` 필요). 이번엔 브라우저 `speechSynthesis` 파라미터 튜닝까지만. 실제 "부르는" ABC 녹음도 후속.

---

## A. 버그 수정

### 5. 영역선택(롱프레스) 원천 차단
`src/styles.css`에 전역 규칙 추가:
- `html, body, #root { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }`
- 텍스트 입력 요소는 현재 앱에 없음(부모설정은 토글/슬라이더). 전역 차단 안전.

### 8. 글짓기 드래그 좌표 (`SentenceBuilderActivity`, activities.jsx:1625)
**원인:** 앱 전체가 `main.jsx`의 `transform: scale(s)` 컨테이너 안에서 렌더되는데, 글짓기만 떠다니는 카드를 `position:'fixed'` + 생 `clientX/Y`(drag.x/y)로 그려 스케일/오프셋만큼 어긋남. 드롭 판정은 `getBoundingClientRect` vs `clientX/Y`라 정상 — **시각(떠다니는 카드)만** 틀어짐.
**수정:** 스티커/꾸미기와 동일한 **컨테이너-상대 % 좌표** 패턴으로 전환.
- `SentenceBuilderActivity` 루트 `<div>`에 `stageRef` 추가.
- `cardMove`에서 `drag`를 `{ cardIdx, xPct, yPct }`로 저장(`xPct = (clientX - rect.left)/rect.width*100`, y 동일).
- 떠다니는 카드를 루트 컨테이너 안에 `position:'absolute'`, `left: xPct%`, `top: yPct%`, `transform:'translate(-50%,-50%)'`로 렌더. (% 좌표는 스케일과 무관하게 시각 정렬됨.)
- 드롭 히트테스트(`cardUp`)는 기존 `getBoundingClientRect` vs `clientX/Y` 유지(정상). 한글·영어 공용 컴포넌트라 한 번에 해결.

## B. 음성 코드 (3·4·6)

### 3+4. 자음/모음 들어보기 (`HangulActivity`, activities.jsx:2388)
**현재:** `learn()`이 `speak`을 전혀 호출하지 않음(무음). 데이터: `{ ch, name, word, emoji }`(예 `{ch:'ㄱ', name:'기역', word:'기린'}`).
**수정:** `learn()`에서 음성 시퀀스 재생:
- `speakKo(cur.name)` 즉시(예 "기역") → 약 1300ms 후 `speakKo(cur.word)`(예 "기린").
- 지연 재생 타이머를 `useRefA`로 보관, 화면 이동(`next`/`prev`/idx 변경)·언마운트 시 정리(스테일 단어 방지).
- 큰 글자 버튼과 🔊 들어보기 버튼 모두 동일 시퀀스.
- 모음도 동일(이름→예시, 예 `{ch:'ㅏ', name:'아', word:'아기'}`).

### 6. 낱말 맞추기 + 전반 자연스러움 (`src/lib/audio.js`)
**현재:** `speakKo(rate 0.95, pitch 1.3)`, `speakEn(rate 0.85, pitch 1.15)` — 피치 1.3이 기계적.
**수정:** 기본 파라미터 튜닝(전 호출처 공통):
- `speakKo` 기본 `pitch 1.3 → 1.05`, `rate 0.95 → 0.9`.
- `speakEn` 기본 `pitch 1.15 → 1.0`, `rate 0.85 유지~0.9`.
- 보이스 선택 개선: 한국어 보이스 중 품질 좋은 것 우선(이름에 'Google'/'Neural'/'Yuna' 등 포함 시 우선, 없으면 첫 `^ko`). 영어도 유사.
- *코드 한계상 "덜 기계적"까지. 진짜 자연스러움은 후속 mp3.*

## C. 음악/노래 기능 (1·2·7)

피아노 'song' 모드 구조: `MUSIC_MODES`에 `{id:'song'}`, `PIANO_SONGS`(`{id,name,emoji,notes[]}`), `follow.setFixed(notes)` + `advanceSong`. 북/실로폰은 'song' 모드 없음.

### 2. 피아노 연습곡 추가 + 장곡 (`PIANO_SONGS`, activities.jsx:3463)
기존 4곡 유지 + 백건반(C~B/C5)만 쓰는 **국민동요 장곡** 추가:
- 작은별: `C C G G A A G F F E E D D C` (14)
- 비행기: `G E E F D D C D E F G G G` (13)
- 나비야: `G E E F D D C D E F G G E` (13)
(모두 `WHITE_IDS`=C~B 범위. C5 불필요. 따라치기 호환.)

### 1. 북·실로폰 연습곡 (`DrumActivity` 3487, `XyloActivity` 3683)
피아노 'song' 모드 패턴을 두 컴포넌트에 이식:
- 모드 탭에 `{id:'song', name:'연습곡', emoji:'🎵'}` 추가, `setFixed`+`advanceSong` 로직 복제(각 컴포넌트 내).
- **실로폰**(`XYLO_BARS` C~C5 8음): 동요 곡(작은별·나비야 등, 피아노와 동일 음표 재사용 가능).
- **북**(`DRUM_PADS` kick/snare/tom/hihat/cymbal): 리듬 패턴 곡 — 예 '쿵짝짝'(`kick snare snare`)·'둥둥따'(`tom tom snare`) 반복, 8~12스텝.
- `DRUM_SONGS`/`XYLO_SONGS` 데이터 + 따라치기와 동일 preview/tap 흐름.

### 7. ABC 노래 (`AbcSongActivity`, english.jsx:409)
**현재:** 700ms 간격으로 `speakEn(letter)`만 — 멜로디 없음.
**수정:** **반짝반짝 작은별 = ABC 곡조**를 합성음으로 연주:
- 26글자를 작은별 멜로디 음에 매핑(`{ letter, note, dur }[]`), LMNOP는 빠른 구간. 음은 `playTone(freq)`로 연주(피아노 freq 재사용).
- 각 음 타이밍에 글자 하이라이트 + `speakEn(letter)` 동기 발음(베스트에포트; TTS는 음 위에 얹힘).
- ▶ 누르면 곡 전체 재생, 끝에 `onComplete(3)`. 타일 탭은 기존대로 글자 발음.
- *합성 멜로디 + 글자 음성까지. 실제 보컬 녹음은 후속.*

---

## 파일 변경 요약

- `src/styles.css` — 전역 선택차단(5).
- `src/activities.jsx` — `SentenceBuilderActivity` 드래그 %좌표(8); `HangulActivity.learn` 음성 시퀀스(3·4); `PIANO_SONGS` 곡 추가(2); `DrumActivity`/`XyloActivity` 'song' 모드 + `DRUM_SONGS`/`XYLO_SONGS`(1).
- `src/english.jsx` — `AbcSongActivity` 멜로디(7).
- `src/lib/audio.js` — `speakKo`/`speakEn` 파라미터·보이스 튜닝(6, 전반).

## 테스트 (vitest)
대부분 UI/오디오라 단위테스트 비중 작음. 순수 추출 가능한 것만:
- 곡 데이터 적합성: `PIANO_SONGS`/`XYLO_SONGS` 음표가 해당 악기 id 집합에 속함; `DRUM_SONGS` 패드가 `DRUM_PADS` id에 속함; 각 곡 `notes.length ≥ 8`(장곡).
- ABC 노래 매핑: 26글자 전부 매핑·각 note가 유효 freq 키.
- 나머지(드래그·음성 시퀀스·선택차단)는 빌드 + 수동 검증.

## 비고
- 음악 1·2·7은 합성음(에셋 불필요). 3·4·6의 "덜 기계적"은 브라우저 TTS 한계 내. 진짜 자연 음성·ABC 보컬은 **후속(Azure mp3)**.
