# 오답 피드백 통일 + 레벨 난이도 확장 (G1+G2) 설계

> 작성일: 2026-06-12
> 범위: (G1) 선택형 활동 오답 ✗/정답 ✓ 피드백 통일, (G2) 카드뒤집기 5레벨(3매칭+전레벨 미리보기)·그림자 멀티타깃·단어 맞추기 멀티선택(한글 레벨 신설 포함)
> 사용자 백로그: #1, #2, #3, #4, #5
> 후속(별도): #6 단어 다양화, #7 글짓기, #8 스티커, #9 빈 종이
> 기준 코드: `src/activities.jsx`(대부분 활동·디스패처), `src/english.jsx`(영어), `src/lib/audio.js`(playSfx).

---

## 공용 요소

### A. `PickMark` — 오답 ✗ / 정답 ✓ 오버레이 (G1)
`src/activities.jsx`에 작은 공용 컴포넌트를 두고 export(영어도 import).
```
<PickMark kind="right"|"wrong" />  // 보기 버튼 우상단에 절대배치된 ✓/✗ 배지
```
- 보기 버튼을 `position:relative`로 두고, 정답이면 `<PickMark kind="right"/>`, 오답(현재 선택한 틀린 보기)이면 `<PickMark kind="wrong"/>`.
- 오답 시 `playSfx('wrong')`가 반드시 호출되도록 통일(이미 있는 곳은 유지).

### B. `useMultiPick` — 멀티타깃 선택 훅 (G2 그림자·단어 공유)
`src/activities.jsx`에 export. N개 타깃을 모두 골라야 한 문제 완료.
- 상태: `found`(맞게 고른 key Set), `wrongKey`(방금 틀린 key, ✗·흔들림용). 내부 ref 미러로 빠른 연속 선택 stale 방지.
- `pick(key, targetKeys)` → `'already' | 'correct' | 'wrong' | 'complete'`
  - 이미 found → `'already'`(무시)
  - targetKeys 포함 & 새로 → found 추가; found 크기 === targetKeys 길이면 `'complete'`, 아니면 `'correct'`
  - 그 외 → `wrongKey` 설정(650ms 후 해제) → `'wrong'`
- `reset()` 라운드 전환 시 호출.
- 호출측이 사운드(correct/wrong)·진행·다음 라운드를 결정. **N=1도 동일 경로**(저레벨 단일타깃 = 1개 타깃) → 그림자/단어가 단일·멀티를 한 코드로 처리.

---

## G2-① 카드뒤집기 — 5레벨 + 3매칭 + 전레벨 미리보기 (#3, #4)

`MEMORY_LEVELS`를 확장(요소: `group`=매칭 장수, `count`=그룹 수, `cols`):
```js
const MEMORY_LEVELS = [
  { group: 2, count: 6,  cols: 4 }, // Lv1 12장 4×3
  { group: 2, count: 8,  cols: 4 }, // Lv2 16장 4×4
  { group: 2, count: 10, cols: 5 }, // Lv3 20장 5×4
  { group: 3, count: 4,  cols: 4 }, // Lv4 12장 4×3 (3매칭)
  { group: 3, count: 6,  cols: 6 }, // Lv5 18장 6×3 (3매칭)
];
export function memoryLevelConfig(level) { /* 클램프 후 반환 */ }
```
- 덱 구성: `MEMORY_EMOJI`에서 `count`개 골라 각 `group`번 복제 후 셔플. (MEMORY_EMOJI 10개 → 최대 10그룹/충분)
- **3매칭**: 한 번에 최대 `group`(3)장 뒤집어 모두 같으면 매칭. `flipped` 길이가 `group`에 도달하면 검사. 모두 같은 이모지 → matched, 아니면 되돌림.
- **미리보기(전 레벨)**: 라운드/덱 생성 시 `previewing=true` → 전체 카드 공개 + 입력 잠금 → **1.5초 후** 전체 가림 + 잠금 해제. 레벨 변경·새 게임 때마다 재실행.
- `pairsFound`/`allMatched` 계산을 `group` 기준으로(그룹 매칭 수 = matched / group). 완료 오버레이("다음 레벨")·`LevelStepper`(총 5)·"항상 1레벨부터"는 기존 정책 유지.

## G2-② 그림자 — 멀티타깃 상위 레벨 (#2)

`SHADOW_LEVELS`에 `targets`(타깃 수) 추가:
```js
const SHADOW_LEVELS = [
  { targets: 1, options: 4, questions: 6 },  // Lv1
  { targets: 1, options: 4, questions: 8 },  // Lv2
  { targets: 1, options: 6, questions: 10 }, // Lv3
  { targets: 2, options: 6, questions: 8 },  // Lv4
  { targets: 3, options: 8, questions: 10 }, // Lv5
];
```
- `newRound`: 풀 셔플 → 앞 `targets`개를 정답 실루엣, 나머지로 보기 `options`개(정답 N개 + distractor) 구성.
- 표시: 상단에 실루엣 **N개** 나란히. 보기에서 `useMultiPick`으로 N개 모두 고르면 한 문제 완료 → 별 + 진행 → 다음.
- 맞은 보기: ✓(PickMark)·잠금. 틀린 보기: ✗(PickMark)·흔들림·`playSfx('wrong')`·차감 없음.
- `LevelStepper`(총 5) + 항상 1레벨부터(기존 정책).

## G2-③ 단어 맞추기 — 멀티선택 (한글+영어) (#5)

그림자와 동일한 `useMultiPick` 메커닉. 그림 N개 → 보기 단어 중 맞는 N개 모두 선택.

### 영어(EnglishWordsActivity, english.jsx)
`ENGLISH_LEVELS`에 `targets` 추가(Lv1~3 targets=1, Lv4 targets=2, Lv5 targets=3). 레벨 5로 확장.
```js
const ENGLISH_LEVELS = [
  { targets: 1, options: 4, questions: 6 },
  { targets: 1, options: 4, questions: 8 },
  { targets: 1, options: 6, questions: 10 },
  { targets: 2, options: 6, questions: 8 },
  { targets: 3, options: 8, questions: 10 },
];
```
- 멀티 레벨: 그림 N개(이모지) 나란히 → 단어 보기 N개 모두 선택. `WORD_SET` 14개로 충분.
- 보기는 공용 순수 함수 `multiTargetOptions`(아래 테스트 절)로 생성(정답 N개 모두 포함·고유 보장).

### 한글(HangulWordsActivity, activities.jsx) — 레벨 체계 신설
현재 단일(10문제) → 5레벨로 재구성, `LevelStepper` + 항상 1레벨부터 정책 신규 적용.
```js
const HANGUL_WORD_LEVELS = [
  { targets: 1, options: 3, questions: 8 },
  { targets: 1, options: 4, questions: 10 },
  { targets: 1, options: 5, questions: 10 },
  { targets: 2, options: 5, questions: 8 },
  { targets: 3, options: 6, questions: 10 },
];
```
- 저레벨 단일타깃(현 동작과 유사), 상위 멀티타깃. `HANGUL_WORDS` 풀 크기에 맞춰 `options`/`targets` 상한 클램프(풀이 작으면 보기 수 축소).
- 완료 시 마지막 레벨에서만 `onFinish`(기존 즉시 onFinish 제거 → 레벨 완료 패널 + 다음 레벨, 그림자와 동일 UX).

---

## G1 적용 대상(✗/✓ 통일)
선택형 활동 보기 버튼에 `PickMark` 적용 + 오답 `playSfx('wrong')` 통일:
- 수학: `MathActivity`(세기), `AdditionActivity`, `SubtractionActivity`, `CompareActivity`, `OrderActivity`
- 한글: `HangulWordsActivity`
- 두뇌: `ShadowActivity`, `PatternActivity`
- 영어: `PhonicsActivity`, `EnglishWordsActivity`
(멀티선택 활동은 found=✓, wrongKey=✗로 자연 적용.)

---

## 테스트 (vitest, 순수 함수)
- `memoryLevelConfig(level)` → {group,count,cols} (클램프, 5레벨).
- `shadowLevelConfig(level)` → {targets,options,questions} (5레벨).
- `englishLevelConfig(level)` → {targets,options,questions} (5레벨).
- `hangulWordLevelConfig(level)` → {targets,options,questions} (5레벨, 풀 크기 클램프 반영).
- 멀티 보기 생성기(`multiTargetOptions(targetKeys, optionCount, poolKeys)` 또는 활동별 래퍼): 모든 레벨/타깃수에서 **정답 N개 모두 포함 + 고유 + 길이 = min(optionCount, pool)** 보장(무한루프 없음, shuffle+slice).
- `useMultiPick` 핵심 로직은 순수 함수 `multiPickNext(found, key, targetKeys)` → {found', result}로 분리해 검증.

UI(미리보기 타이밍, 멀티선택 인터랙션, ✗/✓ 표시)는 `npm run dev` 수동 확인.

## 검증
- 카드뒤집기: 전 레벨 1.5초 미리보기, Lv4·5 3장 매칭, 5레벨 ◀▶, 재진입 1레벨.
- 그림자/단어: 상위 레벨에서 실루엣/그림 N개 → N개 모두 선택해야 정답, ✓/✗ 표시.
- 한글 낱말: 5레벨 + ◀▶ + 1레벨부터.
- 모든 선택형: 오답 시 ✗ + 효과음, 정답 시 ✓.
- `npm test` 순수함수 PASS, `npm run build` 무경고.

## 범위 밖(후속)
#6 단어 다양화(출제방식·세트확장·주제선택), #7 글짓기, #8 스티커 드래그, #9 빈 종이.
