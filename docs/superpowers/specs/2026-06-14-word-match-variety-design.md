# 단어 맞추기 다양화 설계 (#6)

> 작성일: 2026-06-14
> 범위: 영어 단어(`EnglishWordsActivity`) + 한글 낱말(`HangulWordsActivity`)에 (1) 출제 방식 다양화, (2) 단어 세트 확장 + 주제(theme) 선택, (3) 공용 컴포넌트화
> 사용자 백로그: #6
> 후속(별도): #7 글짓기
> 기준 코드: `src/english.jsx`(WORD_SET, EnglishWordsActivity), `src/activities.jsx`(HANGUL_WORDS, HangulWordsActivity, 공용 useMultiPick/multiTargetOptions/LevelStepper/PickMark), `src/lib/audio.js`.

---

## 현재 상태
- 두 활동 모두 **그림(이모지)→단어** 한 가지 형식. 5레벨(Lv1~3 단일, Lv4~5 멀티타깃, `useMultiPick`/`multiTargetOptions`).
- 단어 데이터: `WORD_SET`(영어 14, `{word,emoji}`), `HANGUL_WORDS`(한글 ~20, `{word,emoji}`). **주제 없음.**
- 한국어 임의 단어 TTS 함수 없음(`audio.js`에 `speakEn`만 export, `fallbackSpeak`는 내부).

## 핵심 통찰 (구현 단순화)
출제 모드는 **렌더링/프롬프트만 바꾸고 내부 로직은 그대로**다. 정답 식별 키는 항상 `word`(각 단어의 이모지는 고유). 보기 생성(`multiTargetOptions`)·선택(`useMultiPick`)은 word 키 기준으로 변함없다. 모드는 (a) 프롬프트 표시(이모지/글자/🔊), (b) 보기 버튼 표시(글자/이모지)만 결정한다.

---

## 1. 출제 방식 다양화 (라운드마다 랜덤 모드)
라운드 생성 시 모드를 무작위 선택:
- `pic2word` — 프롬프트=타깃 이모지, 보기=단어(글자). (기존)
- `word2pic` — 프롬프트=타깃 단어(글자), 보기=이모지(그림).
- `listen2pic` — 프롬프트=타깃마다 🔊 버튼(누르면 그 단어 발음), 보기=이모지. 라운드 시작 시 1회 자동 발음.

규칙:
- 타깃·보기 모두 **word 키**. `multiTargetOptions(targetWords, options, poolWords)`로 보기 word 목록 생성(기존 그대로).
- 보기 버튼 렌더: `pic2word`면 단어 글자, 그 외(`word2pic`/`listen2pic`)면 그 단어의 이모지.
- 프롬프트 렌더: `pic2word`=이모지, `word2pic`=글자, `listen2pic`=🔊 버튼(speak(word)).
- 멀티타깃(Lv4·5)에도 동일 적용(프롬프트 N개, 보기 N+distractor개).
- 정답 시 항상 그 단어를 발음(speak)해 청각 피드백(기존 영어 동작과 유사, 한글은 speakKo).

## 2. 단어 세트 확장 + 주제(theme)
- 각 단어에 `theme` 추가. 주제: 동물(animal)·음식(food)·탈것(vehicle)·자연(nature)·사물(object) 5종.
- 각 세트를 **주제별 8단어**(총 40)로 확장(이모지로 표현 가능한 기초어).
  - 영어 예: animal[cat,dog,fox,lion,bear,rabbit,pig,frog], food[apple,banana,grape,egg,bread,cake,milk,corn], vehicle[car,bus,train,plane,ship,bike,truck,taxi], nature[sun,moon,star,tree,flower,rain,cloud,snow], object[hat,cup,ball,book,clock,key,gift,umbrella].
  - 한글 예: 동물[고양이,강아지,여우,사자,곰,토끼,돼지,개구리], 음식[사과,바나나,포도,달걀,빵,케이크,우유,옥수수], 탈것[자동차,버스,기차,비행기,배,자전거,트럭,택시], 자연[해,달,별,나무,꽃,비,구름,눈], 사물[모자,컵,공,책,시계,열쇠,선물,우산].
  - (이모지는 각 단어에 1:1 매핑.)
- 활동 상단에 **주제 탭**: 전체(all)/동물/음식/탈것/자연/사물. 기본 "전체".
- 라운드는 **선택 주제의 풀**에서 타깃·distractor를 모두 뽑음(주제 내 학습). 주제 변경 시 진행 초기화(레벨은 유지하거나 1로 — 정책 일관성 위해 레벨 변경처럼 라운드만 리셋).
- 풀 크기 클램프: `targets = min(cfg.targets, pool.length)`, `options = min(cfg.options, pool.length)`. 주제별 8단어면 Lv5(타깃3·보기8→8로 클램프? 8단어면 보기 8 가능, 타깃3+distractor5=8) 충분.

## 3. 공용 컴포넌트화 (DRY)
두 활동의 라운드/렌더가 사실상 동일해지므로 공용 컴포넌트로 추출한다.
- `src/activities.jsx`에 `export function WordMatchActivity(props)` 추가. props:
  - `tone, fontSize, onComplete, onFinish, voiceShow`
  - `words` (`[{word,emoji,theme}]`)
  - `themes` (`[{id,name}]` — 탭 목록; 'all'은 컴포넌트가 앞에 자동 추가)
  - `levelConfig` (함수: level→{targets,options,questions})
  - `levelsLength` (5)
  - `color, icon, title`
  - `speak(word)` (영어=speakEn, 한글=speakKo)
- `EnglishWordsActivity`(english.jsx) / `HangulWordsActivity`(activities.jsx)는 각자 데이터·speak·config·색·제목을 주입하는 **얇은 래퍼**가 된다.
- 레벨 정책(◀▶ LevelStepper, 항상 1레벨부터), 완료 패널(다시/다음 레벨), ✓/✗(PickMark), 멀티선택(useMultiPick)은 공용 컴포넌트 안에서 유지.

## 신규 음성 — `src/lib/audio.js`에 `speakKo`
`speakEn` 미러, `lang:'ko-KR'`, pitch 약 1.3(아이 느낌, 기존 `fallbackSpeak`와 동일 톤), 음량 `vols.voice`.
```
export function speakKo(text, { rate = 0.95, pitch = 1.3 } = {}) { ... 'ko-KR' ... }
```

---

## 변경 파일
- `src/lib/audio.js` — `speakKo` 신규.
- `src/activities.jsx` — `WordMatchActivity` 공용 컴포넌트 신규(export), `HANGUL_WORDS`에 theme 추가·확장, `HangulWordsActivity`를 래퍼로 축소. 순수 함수 `wordsByTheme` export.
- `src/english.jsx` — `WORD_SET`에 theme 추가·확장, `EnglishWordsActivity`를 `WordMatchActivity` 래퍼로 축소, `speakKo`/`WordMatchActivity` import.

## 테스트 (vitest, 순수 함수)
- `wordsByTheme(words, theme)` → theme==='all'이면 전체, 아니면 해당 theme만. 빈/미존재 theme 처리.
- 데이터 적합성: 영어/한글 각 세트의 **모든 주제가 ≥6단어**(멀티 Lv5 보기 충족), 각 단어에 `theme` 존재, theme 값이 정의된 5종 중 하나.
- (기존 `multiTargetOptions`/`useMultiPick` 테스트 유지.)
UI(모드 렌더·주제 탭·음성)는 `npm run dev` 수동 확인.

## 검증
- 영어/한글 단어 맞추기: 라운드마다 그림→단어 / 단어→그림 / 🔊듣고→그림이 섞여 출제.
- 주제 탭으로 동물/음식/… 골라 그 주제만 출제. 전체 기본.
- Lv4·5 멀티에서도 모드/주제 동작, ✓/✗·다음 레벨 정상.
- `npm test` 순수함수 PASS, `npm run build` 무경고.

## 범위 밖(후속)
#7 글짓기 놀이.
