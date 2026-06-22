# 도형/색깔 카테고리 설계

> 작성일: 2026-06-19
> 대상: `shape` 카테고리(현재 `done:false` → 통째 미구현, `PlaceholderScreen` 폴백)를
> 정식 활동 카테고리로 구현하고, 도형 도안을 색칠놀이와 공유한다.
> 참고: `Doc/05_미구현_기능_목록.md`(통째 미구현 3카테고리 중 첫 번째), `src/english.jsx`(별도 파일 분리 선례).

---

## 목표

만 3~5세 유아가 **도형과 색깔을 인지·학습**하는 카테고리를 추가한다.
6개 서브활동(도형 배우기/찾기/맞추기, 색깔 배우기/분류, 도형 그리기)으로 구성하며,
도형 그리기는 기존 색칠 캔버스를 재사용하고 도형 윤곽선 도안을 색칠놀이 메뉴와 공유한다.

## 아키텍처 / 코드 위치

`english` 카테고리가 `src/english.jsx`로 분리된 선례를 따른다(`src/activities.jsx`가 이미 5000줄+이라 더 키우지 않는다).

- **신규 `src/shape.jsx`** — 도형/색깔 데이터 + 순수함수 + `ShapeActivity`(서브활동 라우터) + 6개 활동 컴포넌트.
  공용 부품은 `activities.jsx`에서 import: `LevelStepper`, `useMultiPick`, `multiTargetOptions`, `PickMark`, `playSfx`, `speakKo`, `VoiceGuide`, `shuffle`. (React alias `useStateA`/`useMemoA` 등은 파일 상단에서 동일하게 선언.)
- `src/activities.jsx` 디스패처(`function Activity`, line 5055~)에 분기 추가:
  `if (cat.id === 'shape') return <ShapeActivity tone={tone} subId={sub?.id || 'shape-learn'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;`
- `src/themes.jsx` — `shape` 항목을 `hasSub:true, done:true`로 변경(`cat.shape` 색상 키는 세 톤 모두 이미 존재).
- `src/shell.jsx` — `SUBMENUS.shape` 6항목 추가.
- **색칠 연동** — 도형 윤곽선 도안 9종을 색칠 템플릿 레지스트리(`COLORING_TEMPLATES`)에 추가하고, 색칠놀이 메뉴(`COLOR_MENU_ITEMS`)에 "도형" 항목으로 노출한다. 도형 카테고리의 "도형 그리기"는 같은 도안 세트로 `ColoringActivity`(또는 `FreeColoringActivity` 윤곽선 레이어)를 띄운다.

## 데이터

### 도형 9종
구조: `{ id, name, svgPath, viewBox, examples: [emoji…] }`
SVG path 하나를 "배우기" 대형 표시와 "그리기" 윤곽선에 **공유**한다(윤곽선 레이어는 `pointerEvents:none` 가이드).

| id | name | 예시 사물 | 레벨군 |
|---|---|---|---|
| circle | 동그라미 | 🕐 ⚽ 🍩 | 기본 |
| triangle | 세모 | 🍕 ⛰️ | 기본 |
| square | 네모 | 📺 🎁 🪟 | 기본 |
| star | 별 | ⭐ | 기본 |
| heart | 하트 | ❤️ | 기본 |
| diamond | 마름모 | 💎 🪁 | 확장 |
| oval | 타원 | 🥚 🏉 | 확장 |
| trapezoid | 사다리꼴 | 👜 | 확장 |
| pentagon | 오각형 | 🏠 | 확장 |

### 색깔 10종
구조: `{ id, name, hex, examples: [emoji…] }`. 흰색은 칩에 테두리를 둘러 배경과 구분.

| id | name | hex | 예시 사물 |
|---|---|---|---|
| red | 빨강 | #E53935 | 🍎 🍓 🌹 |
| orange | 주황 | #FB8C00 | 🍊 🥕 🦊 |
| yellow | 노랑 | #FDD835 | 🍌 🌟 🐤 |
| green | 초록 | #43A047 | 🥦 🌳 🐸 |
| blue | 파랑 | #1E88E5 | 🌊 💧 🐳 |
| purple | 보라 | #8E24AA | 🍇 🟣 🔮 |
| pink | 분홍 | #EC407A | 🌸 🎀 🐷 |
| brown | 갈색 | #6D4C41 | 🐻 🍫 🪵 |
| black | 검정 | #212121 | 🐜 🎩 🌑 |
| white | 흰색 | #FFFFFF | ☁️ 🥛 🦢 |

### 매핑
- **사물→도형**(도형 맞추기용): 예시 사물 이모지에 도형 id를 부여한 풀. 위 표의 examples를 역으로 사용.
- **사물→색**(색깔 분류용): 색별 예시 사물 풀. 위 표의 examples를 사용.

## 서브활동 6개

공통: 상단 타이틀 + `Lv.n` 뱃지 + `LevelStepper`(◀▶, 항상 1레벨부터), 라운드 5문제, 정답 `playSfx('correct')`·오답 효과음, `speakKo` 음성, `VoiceGuide` 안내, 정답 시 ⭐ 적립(`onComplete`).

1. **도형 배우기 (`shape-learn`)** — `HangulActivity`(자음/모음 익히기) 패턴. 대형 도형(SVG) + 이름 말풍선 + 🔊 들어보기(`speakKo(name)`) + ◀▶ 순회 + ⭐ 수집 + 예시 사물 그림. 9종. (Lv.1 둘러보기, 레벨 없음.)
2. **도형 찾기 (`shape-find`)** — 문제 도형 이름을 음성+글자로 제시("세모를 찾아봐") → 보기 도형 N개 중 1개 탭. ✓/✗ 마크. 레벨: L1 보기 3개·기본도형, L2 보기 4개, L3 보기 5~6개·확장도형 포함.
3. **도형 맞추기 (`shape-match`)** — 실생활 사물 이모지 제시 + "무슨 도형?" → 보기 도형 중 1개 고르기. ✓/✗. 사물→도형 매핑. 3레벨(보기 수·사물 다양도 증가).
4. **색깔 배우기 (`color-learn`)** — 배우기 패턴. 대형 색칩(hex) + 이름 + 🔊 + ◀▶ + ⭐ + 예시 사물. 10색.
5. **색깔 분류 (`color-sort`)** — "빨간 것을 모두 골라봐"(음성+글자) → 사물 이모지 그리드에서 해당 색 **여러 개 멀티선택**(`useMultiPick`/`PickMark`). 정답셋 모두 고르면 성공. 3레벨(그리드 크기·색 종류 증가).
6. **도형 그리기 (`shape-draw`)** — 색칠 캔버스 + 도형 윤곽선(9종 중 선택). `ColoringActivity` 재사용. 색칠놀이 메뉴의 "도형" 항목과 동일 도안.

## 서브메뉴 (shell.jsx `SUBMENUS.shape`)

```
{ id:'shape-learn', name:'도형 배우기', emoji:'▲',  sub:'9종' }
{ id:'shape-find',  name:'도형 찾기',   emoji:'🔍', sub:'Lv.3' }
{ id:'shape-match', name:'도형 맞추기', emoji:'🧩', sub:'Lv.3' }
{ id:'color-learn', name:'색깔 배우기', emoji:'🌈', sub:'10색' }
{ id:'color-sort',  name:'색깔 분류',   emoji:'🗂️', sub:'Lv.3' }
{ id:'shape-draw',  name:'도형 그리기', emoji:'🖍️', sub:'🎨' }
```
타이틀: `'도형이랑 색깔 놀이'`(또는 유사).

## 테스트 (순수함수, vitest — `src/__tests__/`)

- `buildShapeFindOptions(level, answerId, shapePool)` — 정답 포함·고유·레벨별 보기 수(L1=3/L2=4/L3=5~6).
- `buildColorSortGrid(level, targetColorId, objectPool)` — 정답색 사물 1개 이상 포함, 멀티선택 정답셋 = 그리드 내 targetColor 사물 전체.
- 데이터 적합성: 도형 9·색 10, 각 항목 `name`+예시(`examples.length>0`) 존재, 사물→도형/색 매핑 무결성(매핑된 도형/색 id가 정의에 존재).

## 파일 변경 요약

- **신규** `src/shape.jsx` — 데이터·순수함수·`ShapeActivity`·6개 컴포넌트.
- **수정** `src/activities.jsx` — 디스패처 분기 1줄 + 도형 윤곽선 도안 9종을 색칠 템플릿에 추가(또는 별도 export), `ShapeActivity` import.
- **수정** `src/themes.jsx` — `shape` 플래그 `done/hasSub`.
- **수정** `src/shell.jsx` — `SUBMENUS.shape` + `COLOR_MENU_ITEMS`에 도형 항목.
- **신규/수정** `src/__tests__/shape-logic.test.js` — 순수함수 + 데이터 적합성.

## 비목표 (YAGNI)

- 도형 분류/패턴(패턴은 두뇌 카테고리에 이미 존재) — 추가하지 않음.
- 색 혼합/그라데이션, 손글씨 도형 인식 — 범위 외.
- 드래그 기반 정식 분류(바구니에 넣기) — 멀티선택으로 대체.

## 후속

- 컴퓨터 익히기 카테고리(다음 순서), 놀이마을(소셜) 카테고리 — 각각 별도 설계.
