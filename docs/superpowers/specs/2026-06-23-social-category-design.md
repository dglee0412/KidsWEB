# 놀이마을(소셜) 카테고리 설계

> 작성일: 2026-06-23
> 대상: `social` 카테고리(현재 `done:false` → 통째 미구현, `PlaceholderScreen` 폴백)를
> 정식 활동 카테고리로 구현한다.
> 참고: 기획서 `Doc/01_기획서.md` §J 소셜/역할놀이(메신저 놀이·사진 꾸미기·역할놀이),
> `src/english.jsx`·`src/shape.jsx`(별도 파일 분리 + 공용 부품 재활용 선례).

---

## 목표

만 3~5세 유아가 **사회적 상호작용(인사·감정·직업 역할·꾸미기)**을 경험하는 카테고리를 추가한다.
3개 서브활동(메신저 놀이·역할놀이·꾸미기)으로 구성하며, 전부 로컬·오프라인이고 카메라/네트워크를 쓰지 않는다.

기획서의 "사진 꾸미기"는 카메라 접근(유아 앱 프라이버시 부담) + 기존 자유색칠과 중복 때문에,
**준비된 장면 배경에 스티커/프레임을 꾸미는 방식**으로 대체한다(카메라 불필요).

## 아키텍처 / 코드 위치

`english`/`shape` 카테고리가 별도 파일로 분리된 선례를 따른다.

- **신규 `src/social.jsx`** — 데이터 + 순수함수 + `SocialActivity`(서브활동 라우터) + 3개 활동 컴포넌트.
  공용 부품 import: `activities.jsx`에서 `LevelStepper`, `useMultiPick`, `multiTargetOptions`, `PickMark`;
  `shell.jsx`에서 `VoiceGuide`; `lib/audio.js`에서 `playSfx`, `speakKo`.
  React alias(`useStateA`/`useEffectA`/`useRefA`)는 파일 상단에서 선언(shape.jsx와 동일 패턴).
  꾸미기의 스티커 드래그/저장은 `FreeColoringActivity`의 포인터 드래그 + localStorage 갤러리 패턴을 따른다(코드 복제가 아니라 동일 상호작용 패턴 적용).
- `src/activities.jsx` 디스패처(`function Activity`)에 분기 추가(`english` 분기 근처):
  `if (cat.id === 'social') return <SocialActivity tone={tone} subId={sub?.id || 'messenger'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;`
  + 상단에 `import { SocialActivity } from './social.jsx'`.
- `src/themes.jsx` — `social` 항목을 `hasSub:true, done:true`로 변경(`cat.social` 색상 키는 세 톤 모두 존재).
- `src/shell.jsx` — `SUBMENUS.social` 3항목 추가.

## 서브활동 3개

공통 관례: 음성 `speakKo`, `VoiceGuide` 안내 문구, 정답 `playSfx('correct')`·오답 `playSfx('wrong')`, ⭐ 적립(`onComplete(1)` 라운드/스텝, `onComplete(3)` 완주).

### 1. 메신저 놀이 (`messenger`)
친구 캐릭터가 음성+말풍선으로 묻는다("안녕! 만나서 반가워"). 아이는 하단 보기 이모티콘 중 알맞은 답을 탭한다.
정답이면 캐릭터가 음성+이모지로 리액션하고 대화가 말풍선으로 쌓인다. 오답은 ✗ + 효과음.
- 3레벨 + `LevelStepper`(◀▶, 항상 1레벨부터), 라운드 5문항.
- 보기선택은 `useMultiPick`/`PickMark` 단일타깃 패턴(shape.jsx의 PickActivity와 동형).
- 레벨↑: 질문 다양도/보기 수 증가(L1 보기3 / L2 보기4 / L3 보기4·질문 다양).

### 2. 역할놀이 (`roleplay`)
직업 6개(의사·요리사·소방관·경찰·수의사·화가) 중 하나를 ◀▶로 고른다.
음성 안내("열을 재요 🌡️")가 나오면 보기 도구 중 알맞은 것을 **순서대로 탭**한다. 3~4단계를 차례로 완수하면 칭찬.
- 직업 전환이 레벨 스테퍼를 대체(◀▶로 직업 순회, 진행 비저장).
- 각 step은 정답 도구 1개 + 방해 도구로 보기를 구성. 정답 탭 시 다음 step, 오답은 ✗.
- 직업 완수 시 ⭐ + 칭찬 → 다음 직업 또는 끝내기.

### 3. 꾸미기 (`decorate`)
준비된 장면 배경(생일파티·바다·우주·공원 등)을 고르고, 스티커를 **드래그로 배치**하고 프레임을 선택해 꾸민 뒤 갤러리에 저장.
- 카메라/사진 불필요. `FreeColoringActivity`의 스티커 드래그 + 저장 패턴 재사용.
- 자유 놀이(레벨/정답 없음). 저장은 기존 갤러리(`kw-gallery`)에 **free 타입 PNG**로 저장(자유색칠과 동일 형식: 캔버스를 PNG로 떠서 `{ type:'free', png, savedAt }`). 갤러리가 그대로 표시.

## 서브메뉴 (shell.jsx `SUBMENUS.social`)

```
{ id:'messenger', name:'메신저 놀이', emoji:'💬', sub:'Lv.3' }
{ id:'roleplay',  name:'역할놀이',   emoji:'👩‍⚕️', sub:'6직업' }
{ id:'decorate',  name:'꾸미기',     emoji:'🎀', sub:'🎨' }
```
타이틀: `'놀이마을'`(또는 유사).

## 데이터 (social.jsx)

- **MESSENGER_LEVELS**: 3레벨 배열. 각 레벨 `[{ ask, options:[emoji…], answer }]`(레벨당 ≥4문항).
  예 L1: `{ ask:'안녕! 만나서 반가워', options:['👋','😴','🍎'], answer:'👋' }`,
  `{ ask:'나는 기분이 좋아. 너는?', options:['😄','😢','😡'], answer:'😄' }`.
- **ROLES**: 6직업 `[{ id, name, emoji, steps:[{ prompt, tool, distractors:[emoji…] }] }]`.
  예 의사: steps = `[{ prompt:'열을 재요', tool:'🌡️', distractors:['🍴','🎨'] }, { prompt:'약을 발라요', tool:'💊', distractors:['🧯','🚓'] }, { prompt:'밴드를 붙여요', tool:'🩹', distractors:['🖌️','🐶'] }]`.
- **DECORATE**: `SCENES`(장면 배경: emoji 라벨 + 배경 그라데이션/색), `DECORATE_STICKERS`(꾸미기 스티커 세트), `FRAMES`(테두리 몇 종).

## 순수함수 + 테스트 (vitest — `src/__tests__/social-logic.test.js`)

- `buildMessengerRound(level, levels)` → `{ ask, options, answer }`: answer ∈ options, options 고유, 보기 수 = 레벨 설정.
- `buildRoleStepOptions(step)` → `{ tool, options }`: 정답 tool ∈ options, options 고유(정답 + distractors 셔플).
- 데이터 적합성:
  - MESSENGER 3레벨, 각 ≥4문항, 모든 문항 `answer ∈ options`, options 길이 ≥2.
  - ROLES 6직업, 각 steps 길이 3~4, 모든 step에 `tool`(비어있지 않음) + `distractors` ≥1.
  - DECORATE: SCENES ≥4, DECORATE_STICKERS ≥6, FRAMES ≥2.

## 파일 변경 요약

- **신규** `src/social.jsx` — 데이터·순수함수·`SocialActivity`·3개 컴포넌트.
- **수정** `src/activities.jsx` — 디스패처 분기 1줄 + `SocialActivity` import.
- **수정** `src/themes.jsx` — `social` 플래그 `done/hasSub`.
- **수정** `src/shell.jsx` — `SUBMENUS.social` 추가.
- **신규** `src/__tests__/social-logic.test.js` — 순수함수 + 데이터 적합성.

## 비목표 (YAGNI)

- 실제 카메라/사진 촬영·합성 — 제외(장면 배경 + 스티커로 대체).
- 자유 텍스트 입력 채팅, 네트워크(실제 메시지 송수신) — 제외.
- 직업 진행 영속화(항상 처음부터) — 코딩 카테고리와 동일 정책.

## 후속

- 컴퓨터 익히기 카테고리(마지막 통째-미구현). 뽀로로 "컴교실"(마우스 클릭 연습·방향키 연습·메일/채팅)이 청사진 — 별도 설계.
