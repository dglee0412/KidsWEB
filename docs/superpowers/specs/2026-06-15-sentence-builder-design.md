# 글짓기 놀이 설계 (#7)

> 작성일: 2026-06-15
> 범위: 한글·영어 드래그앤드롭/탭 문장 만들기(빈칸 카드 채우기) + 읽기(TTS)·글자 노출. 공용 `SentenceBuilderActivity` + 언어 래퍼.
> 사용자 백로그: #7 (마지막 항목)
> 결정: 드래그+탭 둘 다 / 목표 문장 맞추기 / 빈칸 수로 레벨 / 한글·영어 둘 다.
> 기준 코드: `src/activities.jsx`(공용 헬퍼·디스패처·LevelStepper), `src/english.jsx`, `src/shell.jsx`(SUBMENUS), `src/lib/audio.js`(speakEn/speakKo).

---

## 데이터 모델 (문장 템플릿)
```js
{
  parts: [
    { type: 'slot',  answer: '포도',  emoji: '🍇' },
    { type: 'fixed', text: '를 ' },        // 조사/연결어 + 띄어쓰기
    { type: 'slot',  answer: '먹어요', emoji: '😋' },
  ],
}
```
- **slot**: 채울 빈칸. `answer`(정답 단어), `emoji`(정답 카드 그림).
- **fixed**: 고정 텍스트(조사/연결어). **띄어쓰기를 fixed.text에 포함**해 언어 무관하게 `join('')`로 조립한다(한글 "를 ", 영어 " is " 등).
- 문장 조립: `parts.map(p => p.type==='slot' ? (placed[slotIdx]?.word ?? '⬜') : p.text).join('')`.

## 카드(card)
`{ word, emoji }`. 트레이 카드 = 현재 문장의 모든 slot 정답 카드 + 방해 카드(distractor) 몇 개(다른 문장 단어 풀에서). 셔플. 같은 단어 중복 없음.

## 레벨 (빈칸 수)
- Lv1: slot 1개 / Lv2: slot 2개 / Lv3: slot 2~3개.
- `levels` = 레벨별 템플릿 배열의 배열. 레벨당 랜덤 템플릿, **레벨당 5문제**. `LevelStepper`(총 levels.length=3) + 항상 1레벨부터(기존 정책: levelIdx 0 시작, 비저장).
- 정답 시 진행 +1, 5문제 완료 → 레벨 클리어 패널(다시/다음 레벨/끝내기). 마지막 레벨 끝 → `onFinish`(칭찬화면).

## 상호작용
상태: `placed`(slot 인덱스→card|null 배열), `armedCardIdx`(탭 배치용 선택 카드), `drag`(드래그 중 카드 임시 위치 `{cardIdx,x,y}`).
- **탭 배치**: 트레이 카드 탭 → `armedCardIdx` 설정(강조). 빈칸 탭 → 그 slot에 해당 카드 배치, `armedCardIdx=null`.
- **드래그 배치**: 트레이 카드 pointerdown→드래그(임시 위치 렌더), pointerup 시 컨테이너 기준 좌표가 어느 slot rect 안인지 히트테스트 → 그 slot에 배치. slot rect는 각 slot DOM에 `ref` 달아 `getBoundingClientRect`로 비교(컨테이너 기준 상대 좌표).
- 카드는 트레이에 **항상 남음**(재사용). 빈칸 재배치 시 교체. **채운 빈칸 탭 → 비움**(armed 카드 없을 때).
- 드래그 성능: 드래그 중에는 `drag` 상태로만 갱신(다른 재렌더 최소화), 놓을 때 1회 `placed` 확정. 스티커 드래그 패턴과 동일 사상.

## 읽기 + 정답
- **🔊 읽기 버튼**: 현재 `placed` 상태로 문장 텍스트 조립 → `speak(text)` + 화면 하단에 **글자 문장 노출**(`reveal` 상태). 빈칸은 노출 시 `⬜`, 음성은 빈칸 건너뜀(빈 문자).
- **정답 판정**: 매 배치 후 `isSentenceComplete`(모든 slot의 placed.word === 그 slot.answer) 확인.
  - 완성되면: `playSfx('correct')`, 정답 문장 자동 읽기(`speak`) + reveal, 별(`onComplete`), 약 1.2초 후 진행 +1 / 다음 문장(또는 레벨 클리어).
  - 틀린 채 읽기 버튼은 언제든 동작(현재 상태 그대로 읽고 노출, 진행 변화 없음).
- 오답 카드 배치 자체는 막지 않음(자유 시도). 정답 슬롯 채워질 때 ✓ 표시(slot 테두리 녹색) 정도의 피드백.

## 레이아웃
- 상단 88: 제목(icon+title) + Lv 배지 + `LevelStepper`.
- 가운데(flex 1): **문장 줄** — parts 순서대로 렌더. slot=드롭박스(빈칸 점선/채우면 이모지 + 작은 단어), fixed=큰 텍스트. 가로 wrap.
- 그 아래(고정): `🔊 읽기` 버튼 + `reveal` 글자 문장(없으면 빈 영역).
- 하단(고정): 카드 트레이(가로, 드래그·탭). armed 카드 강조.

## 공용 컴포넌트 + 래퍼 + 배선
- `src/activities.jsx`: `export function SentenceBuilderActivity({ tone, fontSize, onComplete, onFinish, voiceShow, levels, color, icon, title, speak })`. 순수 함수 `sentenceText`/`isSentenceComplete`/`buildTray`(export) + `HANGUL_SENTENCES`.
- 한글 래퍼 `HangulSentenceActivity`(activities.jsx): `levels=HANGUL_SENTENCES`, `speak=speakKo`, `color=tone.cat.hangul`, `icon='✍️'`, `title='글짓기'`.
- `src/english.jsx`: `ENGLISH_SENTENCES`, `EnglishSentenceActivity` 래퍼(`speak=speakEn`, `color=tone.cat.english`, `icon='✍️'`, `title='Sentence'` 또는 '문장 만들기'), `SentenceBuilderActivity` import.
- 디스패처(activities.jsx): hangul `sub.id==='sentence'` → `HangulSentenceActivity`; english `subId==='sentence'`(EnglishActivity 라우터)→ `EnglishSentenceActivity`.
- `src/shell.jsx`: `SUBMENUS.hangul`/`SUBMENUS.english`에 `{ id:'sentence', name:'글짓기', emoji:'✍️', sub:'Lv.3' }` 추가.

## 콘텐츠 (이모지로 표현 가능한 문장; 동사=그림)
- 한글 동사 카드 예: 먹어요😋, 자요😴, 뛰어요🏃, 웃어요😄, 울어요😢, 마셔요🥤, 읽어요📖, 노래해요🎤.
- 한글 Lv1(1빈칸) 예: "[사과🍎]를 먹어요", "[강아지🐶]가 뛰어요", "[아기👶]가 자요", "[해☀️]가 떠요"(떠요 fixed), "[비🌧️]가 와요".
- 한글 Lv2(2빈칸) 예: "[포도🍇]를 [먹어요😋]", "[고양이🐱]가 [자요😴]", "[아이🧒]가 [웃어요😄]", "[우유🥛]를 [마셔요🥤]".
- 한글 Lv3(2~3빈칸) 예: "[토끼🐰]가 [당근🥕]을 [먹어요😋]", "[아기👶]가 [우유🥛]를 [마셔요🥤]".
- 영어 Lv1: "I see a [cat🐱]", "The [sun☀️] is up", "A [dog🐶] runs".
- 영어 Lv2: "The [cat🐱] is [sleeping😴]", "I [eat😋] an [apple🍎]".
- 영어 Lv3: "The [rabbit🐰] eats a [carrot🥕]", "A [bird🐦] sings a [song🎵]".
- (각 레벨 한글·영어 최소 4문장. 방해 카드 풀은 전체 slot 정답 모음에서 추출.)

## 테스트 (vitest, 순수 함수)
- `sentenceText(parts, placed)` — slot 채움/빈칸(`⬜`)·fixed 조립 정확.
- `isSentenceComplete(parts, placed)` — 전 slot 정답이면 true, 하나라도 빈칸/오답이면 false.
- `buildTray(template, poolCards, distractorN)` — 정답 카드 전부 포함 + 고유 + 길이 = 정답수+min(distractorN, 남은풀).
- 데이터: 각 언어 레벨별 템플릿 slot 수가 레벨 규칙에 맞고(L1=1, L2=2, L3∈{2,3}), 각 레벨 ≥4문장, 모든 slot에 answer+emoji.
UI(드래그·탭·읽기 음성)는 `npm run dev` 수동 확인.

## 검증
- 한글·영어 글짓기 진입(서브메뉴) → 빈칸 문장 + 카드 트레이. 드래그/탭으로 채움. 🔊 읽기 → 음성+글자. 다 맞추면 자동 읽기+칭찬+다음. ◀▶ 레벨, 재진입 1레벨.
- `npm test` 순수함수 PASS, `npm run build` 무경고.

## 범위 밖
없음(요청 9개 중 마지막). 추후: 고품질 mp3 보이스, 문장 세트 확장.
