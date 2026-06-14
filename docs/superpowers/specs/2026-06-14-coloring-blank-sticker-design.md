# 색칠 개선 — 빈 종이 + 스티커 연속/드래그 설계

> 작성일: 2026-06-14
> 범위: 자유 색칠(`FreeColoringActivity`)에 (1) 윤곽선 없는 "빈 종이" 옵션, (2) 스티커 연속 배치 + 드래그 이동
> 사용자 백로그: #9(빈 종이), #8(스티커 한 번 배치 후 종료 → 연속 유지 + 드래그 이동)
> 후속(별도): #6 단어 다양화, #7 글짓기
> 기준 코드: `src/activities.jsx`의 `FreeColoringActivity`(현재 783~1345).

---

## 현재 동작
- 자유 색칠은 항상 도안 윤곽선(`COLORING_TEMPLATES[currentId]`, 기본 `'cat'`)을 캔버스 위 SVG로 깔고 그 위에 브러시로 그린다(activities.jsx:1120~1133).
- 스티커: 팔레트에서 하나를 골라 `armedSticker`로 무장 → 캔버스 탭 시 1개 배치 후 **`armedSticker`를 즉시 해제**(:884) → 매번 다시 골라야 함. 배치된 스티커는 `pointerEvents:'none'`(:1141)이라 **이동 불가**.

---

## A. 빈 종이 (#9)

도안 윤곽선이 없는 흰 캔버스 모드를 추가한다.

- 도안 가로 스크롤(activities.jsx:1064~) **맨 앞**에 항상 보이는 "📄 빈 종이" 버튼을 추가. 클릭 시 `setCurrentId('blank')`.
- `tpl = COLORING_TEMPLATES['blank']`는 존재하지 않으므로 `tpl`이 `undefined`가 된다. 윤곽선 SVG 렌더를 `{tpl && (<svg ...>...)}`로 가드하여 빈 종이일 때 윤곽선을 그리지 않는다.
- 빈 종이 버튼의 active 표시는 `currentId === 'blank'` 기준.
- 가드 필요 지점(현재 `tpl`을 전제로 한 곳):
  - `const [activeCat, setActiveCat] = useStateA(tpl?.category || 'animal')` — 이미 옵셔널. blank여도 `activeCat`은 마지막 선택 카테고리를 유지(빈 종이는 카테고리 필터와 무관한 별도 버튼).
  - SVG 렌더(:1121) → `tpl &&` 가드.
- `[currentId]` 효과(:819)는 캔버스/액션을 리셋한다 — blank 전환 시에도 동일하게 흰 캔버스로 초기화(정상).
- 도안 카테고리 탭/도안 목록은 그대로 유지. blank는 그 목록과 별개의 단일 버튼(목록 맨 앞 고정).

## B. 스티커 — 연속 배치 + 드래그 이동 (#8)

### B1. 연속 배치
- 배치 핸들러(onPointerDown의 `armedSticker` 분기, :880~888)에서 **`setArmedSticker(null)` 제거** → 무장 상태 유지로 연속 탭 배치.
- 무장 해제 경로(둘 다 기존에 존재, 유지):
  - 팔레트에서 현재 무장된 스티커를 다시 탭 → 토글 오프(:1213 `setArmedSticker(active ? null : s)`).
  - 그리기 도구 선택 → `setArmedSticker(null)`(:1165).
- 별 적립(`onComplete(1)` + `doneOnce`)은 첫 배치에서만 — 기존 로직 유지.

### B2. 드래그 이동
- 배치된 스티커(`stickerActions`, :1135~1144)를 손가락으로 끌어 이동.
- **상호작용 규칙(armed 여부로 분기):**
  - `armedSticker != null`(배치 모드): 스티커 레이어 `pointerEvents:'none'` → 탭이 캔버스로 전달되어 **새 스티커 배치**(연속).
  - `armedSticker == null`(이동 모드): 스티커 `pointerEvents:'auto'` → 스티커를 누르면 **드래그 이동**, 빈 곳을 누르면 캔버스로 전달되어 **그리기**.
- **드래그 구현(성능 고려):**
  - 캔버스 stroke 재렌더 효과(:856~865)는 `actions` 변경 시 전체 재렌더하므로, 드래그 중 매 이동마다 `actions`를 갱신하면 모든 획이 재렌더되어 끊긴다. → 드래그 중에는 임시 상태 `drag`(`{ id, x, y }`)로만 위치를 갱신하고, **손 뗄 때 한 번만** 해당 스티커의 `x/y`를 `actions`에 확정 반영한다.
  - 각 스티커 `<div>`에 포인터 핸들러:
    - `onPointerDown`: `setPointerCapture`, 시작점/오프셋 기록, `drag = { id, x, y }` 설정, 이벤트 전파 중단(`stopPropagation`)으로 캔버스 그리기 시작 방지.
    - `onPointerMove`: 컨테이너 기준 좌표로 새 위치 계산 → `drag` 갱신(렌더는 해당 div만 이동).
    - `onPointerUp`: `actions`에서 그 스티커의 `x/y`를 확정 갱신, `drag = null`, `releasePointerCapture`.
  - 좌표 변환: 캔버스 백킹스토어 좌표와 동일 기준을 쓰는 `getPt` 또는 컨테이너 `getBoundingClientRect` 기반 매핑을 사용(스티커는 컨테이너 좌표 px로 저장됨 — 현재 `left/top`이 캔버스 px, `getPt`가 같은 좌표계를 반환하므로 동일 변환 사용).
  - 렌더: `drag`가 있는 스티커는 `drag.x/drag.y`로, 나머지는 `actions`의 `x/y`로 표시. `transform: translate(-50%,-50%)` 유지.
  - 드래그 중 커서/터치: `touchAction:'none'`을 스티커 div에도 적용.
- 스티커 크기 변경/삭제는 범위 밖(요청 없음). 삭제는 기존 되돌리기(undo)로.

### 회귀 주의
- 드래그 도입으로 `stickerActions`가 더 이상 `pointerEvents:'none'` 고정이 아니므로, 그리기 중(빈 곳 터치) 동작이 영향받지 않는지 확인(armed 아닐 때만 auto, 그리고 stopPropagation은 스티커 위에서 시작한 경우에만).
- `armedSticker` 유지로 인해, 도구바의 그리기 도구를 누르면 확실히 해제되는지 확인.

---

## 변경 파일
- `src/activities.jsx` — `FreeColoringActivity`만 수정. 데이터/디스패처/`shell.jsx`/`themes.jsx` 변경 없음.

## 테스트
캔버스·포인터 인터랙션 중심이라 단위 테스트 가치가 낮다. 검증은 수동:
- `npm run build` → 무경고 성공.
- `npm run dev` → 자유 색칠:
  - "빈 종이" 선택 시 윤곽선 없이 흰 캔버스에 그려짐. 다른 도안으로 전환·복귀 정상.
  - 스티커 하나 골라 연속으로 여러 개 배치됨(매번 다시 안 골라도 됨).
  - 배치된 스티커를 끌어 이동 가능. 그리기 도구로 전환하면 스티커 모드 해제·정상 그리기.
  - 저장/되돌리기/초기화 정상.

## 범위 밖(후속)
#6 단어 다양화, #7 글짓기 놀이.
