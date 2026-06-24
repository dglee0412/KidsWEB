# 컴퓨터 익히기 카테고리 설계

> 작성일: 2026-06-24
> 대상: `computer` 카테고리(현재 `done:false` → 통째 미구현, `PlaceholderScreen` 폴백)를
> 정식 활동 카테고리로 구현한다. 마지막 통째-미구현 카테고리.
> 참고: 기획서 `Doc/01_기획서.md` §I 컴퓨터 익히기(터치 튜토리얼·가상 키보드·타자 연습·마우스 연습),
> 뽀로로 "컴교실" 청사진(마우스 클릭·방향키·메일/채팅 — 채팅은 놀이마을에 이미 구현),
> `src/english.jsx`·`src/shape.jsx`·`src/social.jsx`(별도 파일 분리 + 공용 부품 재활용 선례).

---

## 목표

만 3~5세 유아가 **컴퓨터 기본 조작(터치 제스처·마우스 커서·키보드)**에 친숙해지는 카테고리를 추가한다.
4개 서브활동(터치 튜토리얼·마우스 놀이·가상 키보드·타자 연습)으로 구성하며, 전부 로컬·오프라인·터치 우선이다.

터치 우선 PWA이므로 기획서의 "마우스 연습(PC)"은 **화면 위 가상 커서**(손가락을 따라오는 포인터)로 재해석해
마우스 개념을 가르친다(뽀로로 코딩컴퓨터의 마우스 셀링포인트와 동일 취지).

## 아키텍처 / 코드 위치

`english`/`shape`/`social` 선례를 따른다.

- **신규 `src/computer.jsx`** — 데이터 + 순수함수 + `ComputerActivity`(서브활동 라우터) + 활동 컴포넌트.
  공용 부품 import: `activities.jsx`에서 `LevelStepper`, `useMultiPick`, `PickMark`;
  `shell.jsx`에서 `VoiceGuide`; `lib/audio.js`에서 `playSfx`, `speakKo`.
  React alias(`useStateA`/`useEffectA`/`useRefA`)는 파일 상단 선언(shape/social과 동일).
  포인터 드래그(마우스 놀이·터치 드래그)는 기존 스티커/꾸미기의 포인터 캡처 패턴을 따른다.
  미사용 import는 두지 않는다(필요한 것만 import).
- `src/activities.jsx` 디스패처(`function Activity`)에 분기 추가(`social` 분기 다음, `english` 앞):
  `if (cat.id === 'computer') return <ComputerActivity tone={tone} subId={sub?.id || 'touch'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;`
  + 상단에 `import { ComputerActivity } from './computer.jsx'`.
- `src/themes.jsx` — `computer` 항목을 `hasSub:true, done:true`로 변경(`cat.computer` 색상 키는 세 톤 모두 존재).
- `src/shell.jsx` — `SUBMENUS.computer` 4항목 추가.

## 서브활동 4개

공통 관례: 음성 `speakKo`, `VoiceGuide` 안내, 정답 `playSfx('correct')`·오답 `playSfx('wrong')`, ⭐ 적립(`onComplete(1)`/`onComplete(3)`).

### 1. 터치 튜토리얼 (`touch`)
탭/드래그/스와이프 세 제스처를 음성 안내로 연습한다. 라운드를 순차 진행(탭 → 드래그 → 스와이프), 각 제스처 여러 번 반복 후 다음으로.
- **탭**: 풍선 🎈이 화면에 뜸 → 탭하면 터짐(playSfx). 목표 수 채우면 다음.
- **드래그**: 사과 🍎를 바구니 🧺 영역으로 드래그(포인터 캡처 + 영역 히트테스트).
- **스와이프**: 카드를 옆으로 밀어(스와이프 거리 임계) 넘김.
- 진행 표시(제스처 3단계) + 완료 칭찬. ⭐는 각 제스처 성공마다 `onComplete(1)`, 전체 완료 `onComplete(3)`.

### 2. 마우스 놀이 (`mouse`)
화면 위 가상 커서(🖱️ 또는 화살표)가 손가락을 **살짝 위 오프셋**으로 따라온다(손가락에 안 가려지게). 과제 3종을 순차:
- **클릭**: 타겟(⭐ 등)을 커서로 탭 → 클릭 성공.
- **더블클릭**: 상자 📦를 빠르게 두 번 탭 → 열림 🎁.
- **드래그**: 아이템을 누르고 이동해 통/영역에 넣기.
- 과제 성공마다 `onComplete(1)`, 전체 `onComplete(3)`. 커서는 teaching device(직접-따라오기; 별도 터치패드는 비목표).

### 3. 가상 키보드 (`keyboard`) — KeyboardActivity(mode='explore')
실제 배열 키보드를 띄우고 키를 누르면 큰 글자 표시 + `speakKo`. 한/영 토글. 목표/정답 없는 자유 탐색.

### 4. 타자 연습 (`typing`) — KeyboardActivity(mode='type')
같은 키보드 + 출제: "ㅂ를 찾아봐"(음성+글자) → 해당 키를 찾아 누름. 정답 ✓ + 다음, 오답 ✗ + 효과음(키보드 자체는 그대로).
- 3레벨 + `LevelStepper`(◀▶, 항상 1레벨부터), 라운드 5문항. 한/영 토글.
- 레벨↑: (선택) 타겟을 더 빠르게/연속으로. 최소 구현은 3레벨 모두 동일 난이도여도 무방하나 레벨 UI는 유지.

## 키보드 레이아웃 (data)

큰 키 그리드(행 단위). 시프트/특수문자 제외.
- **KEYBOARD_EN** (26): `['Q','W','E','R','T','Y','U','I','O','P']`, `['A','S','D','F','G','H','J','K','L']`, `['Z','X','C','V','B','N','M']`.
- **KEYBOARD_KO** 두벌식 (26): `['ㅂ','ㅈ','ㄷ','ㄱ','ㅅ','ㅛ','ㅕ','ㅑ','ㅐ','ㅔ']`, `['ㅁ','ㄴ','ㅇ','ㄹ','ㅎ','ㅗ','ㅓ','ㅏ','ㅣ']`, `['ㅋ','ㅌ','ㅊ','ㅍ','ㅠ','ㅜ','ㅡ']`.

## 순수함수 + 테스트 (vitest — `src/__tests__/computer-logic.test.js`)

- `pickTypingTarget(keys, prev)` → 랜덤 타겟 키: 결과 ∈ keys, (가능하면) prev와 다름.
- 데이터 적합성:
  - KEYBOARD_EN: 26키, 평탄화 시 A~Z 전부 고유.
  - KEYBOARD_KO: 26키, 모두 한글 자모, 고유.
  - 터치/마우스 과제 데이터(`TOUCH_GESTURES` 3종, `MOUSE_TASKS` 3종) 존재 + 필수 필드.
- **이 카테고리는 상호작용 중심이라 순수 로직·테스트 비중이 작다(설계상 명시). 컴포넌트 동작은 빌드 + Task 마지막 수동 검증으로 확인한다.**

## 파일 변경 요약

- **신규** `src/computer.jsx` — 데이터·순수함수·`ComputerActivity`·활동 컴포넌트(TouchTutorial / MousePlay / KeyboardActivity[explore·type 공유]).
- **수정** `src/activities.jsx` — 디스패처 분기 1줄 + `ComputerActivity` import.
- **수정** `src/themes.jsx` — `computer` 플래그 `done/hasSub`.
- **수정** `src/shell.jsx` — `SUBMENUS.computer` 4항목.
- **신규** `src/__tests__/computer-logic.test.js` — 순수함수 + 데이터 적합성.

## 서브메뉴 (shell.jsx `SUBMENUS.computer`)

```
{ id:'touch',    name:'터치 연습',   emoji:'👆', sub:'탭·드래그' }
{ id:'mouse',    name:'마우스 놀이', emoji:'🖱️', sub:'커서' }
{ id:'keyboard', name:'가상 키보드', emoji:'⌨️', sub:'한/영' }
{ id:'typing',   name:'타자 연습',   emoji:'🔤', sub:'Lv.3' }
```
타이틀: `'컴퓨터랑 친해지기'`(또는 유사).

## 비목표 (YAGNI)

- 실제 타이핑 속도/정확도 측정, 시프트·특수문자·한글 조합(낱자 입력만).
- 뽀로로식 별도 터치패드 하드웨어 흉내(커서는 직접-따라오기).
- 메일/채팅(놀이마을 메신저에 이미 구현).
- 방향키 길찾기(코딩 카테고리에 이미 격자 길찾기 존재).

## 후속

없음 — 통째-미구현 4개 카테고리(영어·도형/색깔·놀이마을·컴퓨터) 전부 완료. 추후: 기존 카테고리 서브기능 보강, mp3 보이스 확장.
