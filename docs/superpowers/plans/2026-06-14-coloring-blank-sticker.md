# 색칠 개선 (빈 종이 + 스티커 연속/드래그) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 자유 색칠(`FreeColoringActivity`)에 윤곽선 없는 "빈 종이" 옵션을 추가하고, 스티커를 연속으로 배치하고 드래그로 이동할 수 있게 한다.

**Architecture:** 모든 변경은 `src/activities.jsx`의 `FreeColoringActivity` 한 컴포넌트 안에서 처리한다. 빈 종이는 `currentId='blank'` 의사-도안 + 윤곽선 SVG 가드. 스티커는 배치 후 무장 유지(연속) + 배치된 스티커 div에 포인터 드래그 핸들러(드래그 중에는 임시 `drag` 상태로만 위치 갱신, 손 뗄 때 `actions`에 확정).

**Tech Stack:** React 18(전역 alias), Vite 5, Canvas 2D + Pointer Events. (단위 테스트 없음 — 인터랙션 중심, 수동 검증.)

설계: `docs/superpowers/specs/2026-06-14-coloring-blank-sticker-design.md`

---

## File Structure
- `src/activities.jsx` — `FreeColoringActivity`만 수정. 데이터/디스패처/`shell.jsx`/`themes.jsx` 변경 없음.

---

## Task 1: 빈 종이 옵션

**Files:** Modify `src/activities.jsx` (`FreeColoringActivity`)

- [ ] **Step 1: 윤곽선 SVG를 tpl 가드로 감싸기**

`FreeColoringActivity`의 캔버스 위 윤곽선 SVG 블록을 찾는다(현재 모습):
```jsx
          {/* 도안 윤곽선 레이어 (캔버스 위, 항상 보임, 포인터 이벤트 차단 안 함) */}
          <svg viewBox={tpl.viewBox} preserveAspectRatio="xMidYMid meet"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              pointerEvents: 'none',
            }}>
            {tpl.parts.map((p) => (
              <path key={p.id} d={p.d}
                fill="none"
                stroke={t.text} strokeWidth="3.5"
                strokeLinejoin="round" strokeLinecap="round"
              />
            ))}
          </svg>
```
이 블록 전체를 `{tpl && (...)}`로 감싼다:
```jsx
          {/* 도안 윤곽선 레이어 — 빈 종이(tpl 없음)면 렌더 안 함 */}
          {tpl && (
            <svg viewBox={tpl.viewBox} preserveAspectRatio="xMidYMid meet"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                pointerEvents: 'none',
              }}>
              {tpl.parts.map((p) => (
                <path key={p.id} d={p.d}
                  fill="none"
                  stroke={t.text} strokeWidth="3.5"
                  strokeLinejoin="round" strokeLinecap="round"
                />
              ))}
            </svg>
          )}
```
그리고 `FreeColoringActivity` 함수 안에서 `tpl.`을 **무방비로** 참조하는 다른 곳이 없는지 grep으로 확인한다(`tpl.` 검색). 현재 `const tpl = COLORING_TEMPLATES[currentId];`와 `const [activeCat, setActiveCat] = useStateA(tpl?.category || 'animal');`(이미 옵셔널)만 있으면 OK. 만약 다른 `tpl.foo` 직접 참조가 있으면 `tpl?.foo`로 가드한다.

- [ ] **Step 2: "빈 종이" 버튼 추가**

도안 가로 스크롤 컨테이너를 찾는다(현재 `{visibleIds.map((id) => { ... })}`를 감싼 div). `visibleIds.map(...)` 바로 **앞**(스크롤 div의 첫 자식)에 빈 종이 버튼을 추가한다:
```jsx
          <button key="blank" onClick={() => setCurrentId('blank')}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 130 })}
            style={{
              flex: '0 0 auto', width: 130, height: 60,
              background: currentId === 'blank' ? colorCat : '#fff',
              color: currentId === 'blank' ? t.textOnColor : t.text,
              border: currentId === 'blank' ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
              borderRadius: t.cardRadius, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: currentId === 'blank' ? t.shadow : t.shadowSm, padding: '0 10px',
            }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>📄</span>
            <span style={{ fontSize: fontSize - 6, fontWeight: 900, whiteSpace: 'nowrap' }}>빈 종이</span>
          </button>
```
(`colorCat`, `accentBorder`, `currentId`, `setCurrentId`, `t`, `fontSize`는 이미 컴포넌트 스코프에 존재.)

- [ ] **Step 3: 검증**

Run: `npm run build` → SUCCESS, 무경고.
Run: `npm test` → 기존 테스트 그대로 통과(이 변경은 테스트 무관).
Run: `npm run dev` → 색칠 > 자유 색칠: "빈 종이" 버튼 클릭 시 윤곽선이 사라지고 흰 캔버스에 그릴 수 있음. 다른 도안 선택 시 윤곽선 복귀. 빈 종이↔도안 전환 시 캔버스 초기화 정상.

- [ ] **Step 4: Commit**
```bash
git add src/activities.jsx
git commit -m "feat(color): 자유 색칠에 빈 종이 옵션 추가"
```

## Context
자유 색칠은 항상 `COLORING_TEMPLATES[currentId]`(기본 'cat')의 윤곽선을 캔버스 위에 SVG로 깔았다. 'blank'는 `COLORING_TEMPLATES`에 없는 키라 `tpl`이 `undefined`가 되고, Step 1의 가드로 윤곽선이 렌더되지 않아 흰 종이가 된다. `[currentId]` 효과가 캔버스/액션을 초기화하므로 전환 시 깨끗한 흰 캔버스가 된다. 카테고리 탭/도안 목록은 그대로 두고, 빈 종이는 목록과 별개의 고정 버튼이다.

---

## Task 2: 스티커 연속 배치 + 드래그 이동

**Files:** Modify `src/activities.jsx` (`FreeColoringActivity`)

- [ ] **Step 1: 연속 배치 — 배치 후 무장 해제 제거**

`onPointerDown`의 스티커 배치 분기를 찾는다(현재):
```jsx
    if (armedSticker) {
      const sticker = { id: Date.now() + Math.random(), emoji: armedSticker, x: p.x, y: p.y, size: 64 };
      setActions((a) => [...a, { type: 'sticker', sticker }]);
      setRedoStack([]);
      setArmedSticker(null);
      playSfx('sticker');
      if (!doneOnce) { onComplete && onComplete(1); setDoneOnce(true); }
      return;
    }
```
`setArmedSticker(null);` 한 줄을 **삭제**한다(나머지 유지). 결과:
```jsx
    if (armedSticker) {
      const sticker = { id: Date.now() + Math.random(), emoji: armedSticker, x: p.x, y: p.y, size: 64 };
      setActions((a) => [...a, { type: 'sticker', sticker }]);
      setRedoStack([]);
      playSfx('sticker');
      if (!doneOnce) { onComplete && onComplete(1); setDoneOnce(true); }
      return;
    }
```
(무장 해제는 팔레트에서 같은 스티커 재탭(:`setArmedSticker(active ? null : s)`) 또는 그리기 도구 선택(:`setTool(...); setArmedSticker(null)`)으로만 — 둘 다 기존에 있음, 유지.)

- [ ] **Step 2: drag 상태 추가**

상태 선언부(다른 `useStateA` 선언들 근처, 예: `const [armedSticker, setArmedSticker] = useStateA(null);` 다음 줄)에 추가:
```jsx
  const [drag, setDrag] = useStateA(null); // 드래그 중 스티커: { id, x, y } (확정 전 임시 위치)
```

- [ ] **Step 3: 스티커 레이어를 드래그 가능하게 교체**

배치된 스티커 렌더 블록을 찾는다(현재):
```jsx
          {/* 스티커 레이어 (DOM, 화면 표시용) */}
          {stickerActions.map((a) => (
            <div key={a.sticker.id} style={{
              position: 'absolute',
              left: a.sticker.x, top: a.sticker.y,
              transform: 'translate(-50%, -50%)',
              fontSize: a.sticker.size, lineHeight: 1,
              pointerEvents: 'none', userSelect: 'none',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))',
            }}>{a.sticker.emoji}</div>
          ))}
```
전체를 아래로 교체:
```jsx
          {/* 스티커 레이어 — armed면 통과(새 배치), 아니면 드래그 이동 */}
          {stickerActions.map((a) => {
            const dragging = drag && drag.id === a.sticker.id;
            const sx = dragging ? drag.x : a.sticker.x;
            const sy = dragging ? drag.y : a.sticker.y;
            return (
              <div key={a.sticker.id}
                onPointerDown={armedSticker ? undefined : (e) => {
                  e.stopPropagation();
                  try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                  setDrag({ id: a.sticker.id, x: a.sticker.x, y: a.sticker.y });
                }}
                onPointerMove={(e) => {
                  if (!drag || drag.id !== a.sticker.id) return;
                  e.stopPropagation();
                  const p = getPt(e);
                  setDrag({ id: a.sticker.id, x: p.x, y: p.y });
                }}
                onPointerUp={(e) => {
                  if (!drag || drag.id !== a.sticker.id) return;
                  e.stopPropagation();
                  try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                  const fx = drag.x, fy = drag.y;
                  setActions((arr) => arr.map((it) =>
                    (it.type === 'sticker' && it.sticker.id === a.sticker.id)
                      ? { ...it, sticker: { ...it.sticker, x: fx, y: fy } } : it));
                  setDrag(null);
                }}
                style={{
                  position: 'absolute',
                  left: sx, top: sy,
                  transform: 'translate(-50%, -50%)',
                  fontSize: a.sticker.size, lineHeight: 1,
                  pointerEvents: armedSticker ? 'none' : 'auto',
                  cursor: 'grab', touchAction: 'none', userSelect: 'none',
                  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))',
                }}>{a.sticker.emoji}</div>
            );
          })}
```
참고:
- `getPt(e)`는 캔버스 컨테이너와 동일 좌표계(논리 px)를 반환하므로 스티커 `left/top`과 일관됨(배치도 `getPt`로 저장).
- `armedSticker`일 때 `pointerEvents:'none'` + `onPointerDown=undefined`라 스티커 위 탭이 캔버스로 전달되어 **새 스티커 배치**(연속).
- `armedSticker`가 아닐 때 스티커를 누르면 드래그(이동), 빈 곳을 누르면 캔버스가 받아 **그리기**.
- 드래그 중에는 `drag` 상태로만 해당 div가 움직이고 `actions`(캔버스 획 재렌더 트리거)는 건드리지 않음 → 끊김 없음. 손 뗄 때 1회만 `actions`에 확정.

- [ ] **Step 4: reset/도안전환 시 drag 정리(안전)**

`reset` 함수(현재 `const reset = () => { setActions([]); setRedoStack([]); setArmedSticker(null); };`)에 `setDrag(null)`을 추가:
```jsx
  const reset = () => { setActions([]); setRedoStack([]); setArmedSticker(null); setDrag(null); };
```
그리고 `[currentId]` 초기화 효과(현재 `setActions([]); setRedoStack([]); setArmedSticker(null); setDoneOnce(false);`)에 `setDrag(null);`을 추가:
```jsx
  useEffectA(() => {
    drawingRef.current = null;
    setActions([]);
    setRedoStack([]);
    setArmedSticker(null);
    setDrag(null);
    setDoneOnce(false);
  }, [currentId]);
```

- [ ] **Step 5: 검증**

Run: `npm run build` → SUCCESS, 무경고.
Run: `npm test` → 기존 테스트 통과(무관).
Run: `npm run dev` → 색칠 > 자유 색칠:
- 스티커 하나 골라 캔버스 여러 곳을 탭 → **연속으로 여러 개** 배치됨(매번 다시 안 골라도 됨).
- 팔레트에서 같은 스티커 재탭 또는 그리기 도구 선택 → 스티커 모드 해제.
- 스티커 모드 해제 상태에서 배치된 스티커를 **끌어서 이동** 가능. 빈 곳을 그으면 정상 그리기.
- 저장/되돌리기/초기화 정상. (스티커 위치 이동 후 저장하면 옮긴 위치로 저장됨.)

- [ ] **Step 6: Commit**
```bash
git add src/activities.jsx
git commit -m "feat(color): 스티커 연속 배치 + 드래그 이동"
```

## Context
기존 스티커는 1개 배치 후 즉시 무장 해제됐고 `pointerEvents:'none'`이라 이동 불가였다. 이제 무장 유지로 연속 배치하고, 미무장 시 각 스티커 div가 포인터 드래그를 받아 이동한다. 드래그 중 `actions`를 건드리지 않는 이유: `actions` 변경 시 캔버스 전체 stroke 재렌더 효과가 돌아 드래그가 끊기기 때문(임시 `drag` 상태로 분리). `getPt`는 `canvasRef` 기준 논리 좌표를 반환하며 스티커 좌표계와 동일하다. `stopPropagation`은 스티커 위에서 시작한 포인터가 캔버스 그리기를 트리거하지 않도록 한다(미무장 시 스티커는 캔버스 위 형제 레이어).

---

## 마무리 검증
- [ ] `npm run build` 무경고, `npm test` 기존 통과.
- [ ] 빈 종이/스티커 연속/드래그/저장 수동 확인(위 각 Step의 dev 체크).
- [ ] 설계 대조: 스펙 A(빈 종이)·B1(연속)·B2(드래그) 구현.

후속(별도): #6 단어 다양화, #7 글짓기.
