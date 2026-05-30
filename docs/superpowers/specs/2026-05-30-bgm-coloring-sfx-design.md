# 설계: 계절별 배경음악 + 자유 색칠놀이 효과음

> 작성일: 2026-05-30
> 선행: `src/lib/audio.js`(장소 음성 + 효과음 싱글톤, 직전 작업으로 도입됨)

## 배경 / 목적

직전 작업에서 홈 월드맵 장소 음성과 기본 효과음, 음량 슬라이더 연동을 도입했다.
이번에는 두 가지를 추가한다.

1. **계절별 배경음악(BGM)** — 월드맵 "곰곰이의 사계절 마을"의 세 구역(봄 동산 / 여름 바다 / 가을 숲)에 각각 다른 배경음악 루프가 흐르고, 스크롤로 계절이 바뀌면 음악도 전환된다. 그동안 미동작이던 부모설정 **배경음 슬라이더(`volBg`)가 실연동**된다.
2. **자유 색칠놀이 피드백 사운드** — 도구(크레용·붓·마커·연필·지우개·스티커) 선택 시 아이 목소리 음성, 펜으로 그릴 때 그리기 소리, 지울 때 지우기 소리, 스티커 부착 시 효과음.

기획서(`Doc/01_기획서.md`)의 "음성/효과음" 원칙과 `Doc/05_미구현_기능_목록.md`의 음성·효과음 갭을 잇는 작업이다.

## 확정된 결정 (브레인스토밍)

- BGM 소스: **로열티 프리 음악 파일**(사용자가 선곡·다운로드, 단계별 안내).
- BGM 범위: **홈 지도에서만** 재생. 장소를 탭해 활동으로 진입하면 정지(활동은 자체 소리 보유, 특히 피아노/색칠과 충돌 방지).
- 도구 선택 피드백: **아이 목소리 음성**(장소 음성과 동일 파이프라인, Azure로 6개 클립 추가 생성).
- 그리기·지우기·스티커 소리: **Web Audio 합성음**(에셋 0, 효과음 슬라이더로 일괄 음량 제어).

## 아키텍처

기존 단일 오디오 모듈 `src/lib/audio.js`를 확장한다. 네 채널(bgm / sfx / voice + 합성 그리기음)을 한 곳에서 관리하고, 음량은 부모설정 슬라이더(`volBg`/`volSfx`/`volVoice`)에 연동한다. React 컴포넌트는 이 모듈의 함수만 호출한다.

### A. 배경음악 (BGM)

`audio.js`에 BGM 서브시스템 추가:

- `playBgm(season)` — `season` ∈ `'spring'|'summer'|'fall'`. `/bgm/<season>.mp3`를 `loop=true` HTMLAudioElement로 재생. 이미 같은 곡이면 무시(재시작 안 함).
- `stopBgm()` — 페이드아웃 후 정지.
- **크로스페이드**: 계절 전환 시 현재 곡 gain↓ + 새 곡 gain↑ (약 0.6초). HTMLAudioElement 2개(A/B)를 번갈아 사용하거나, element.volume를 setInterval/transition으로 램프.
- 음량: `volBg`(0–100) → element.volume. `setVolumes({ bgm })`로 갱신.
- **autoplay 정책**: 자동재생은 사용자 제스처 전 차단됨. 홈 진입 시 재생을 시도하되, 차단되면 기존 전역 `pointerdown` 언락(첫 탭) 후 시작. worldmap에서 첫 포인터 상호작용에 BGM 재생을 보장.

파일(사용자 준비): `public/bgm/spring.mp3`, `public/bgm/summer.mp3`, `public/bgm/fall.mp3`. 짧은(30~90초) 매끄러운 루프 권장. 파일 없으면 무음(폴백 없음).

### B. 도구 선택 음성

기존 장소 음성 로직을 일반화:

- 내부 헬퍼 `playVoice(prefix, id, fallbackText)` — `/voices/<prefix>-<id>.mp3` 재생, 실패 시 `speechSynthesis`(ko-KR) 폴백. 재사용 HTMLAudioElement.
- `playPlaceVoice(catId)` = `playVoice('place', catId, PLACE_VOICE_TEXT[catId])` (기존 동작 유지).
- `playToolVoice(toolId)` = `playVoice('tool', toolId, TOOL_VOICE_TEXT[toolId])` (신규).
- `TOOL_VOICE_TEXT` 맵 추가. 문구는 짧게(빠른 피드백):
  - crayon "크레용!" / brush "붓!" / marker "마커!" / pencil "연필!" / eraser "지우개!" / sticker "스티커!"

파일(사용자 준비, Azure 스크립트 확장): `public/voices/tool-crayon.mp3` 외 5개. 생성 스크립트는 `scripts/voices.json`을 `{ places:{...}, tools:{...} }` 구조로 확장하거나 별도 `tools.json`을 추가하고, `gen-voices.ps1`/`.sh`가 두 묶음을 모두 생성하도록 한다. 파일 추가 전까지는 speechSynthesis 폴백으로 동작.

### C. 그리기 / 지우기 소리 (합성, 연속음)

- `startDraw(kind)` — `kind` ∈ `'draw'|'erase'`. 화이트노이즈 `AudioBufferSourceNode`(loop) → `BiquadFilter`(draw=대역통과 중역 스크래치 / erase=저역 문지름) → `GainNode` → `sfxGain`. gain을 0에서 살짝 올림.
- `drawTick(speed)` (선택) — `onPointerMove`에서 호출, 이동 속도에 비례해 gain을 잠깐 올렸다 자연 감쇠 → 펜이 멈추면 조용, 빠르게 그으면 커짐.
- `stopDraw()` — gain 페이드아웃(약 80ms) 후 소스 정지/해제.
- 노이즈 버퍼/소스는 그리기 세션마다 생성·해제(또는 모듈 레벨 재사용). 합성이므로 `sfxGain` 경유 → 효과음 슬라이더 적용.

### D. 스티커 부착음 (합성 원샷)

- `playSfx('sticker')` 레시피 추가: 짧은 "팝"(빠른 상승 블립) + 반짝(고음 트릴). 기존 `playSfx`의 `blip` 헬퍼 재사용.

### 음량 연동 확장

- `setVolumes({ sfx, voice, bgm })` — `bgm` 케이스 추가(현재 BGM element.volume 갱신).
- `app.jsx` init `useEffect`: `kw-parent-settings`에서 `volBg`도 읽어 `setVolumes`에 전달.
- `shell.jsx` `ParentSettings.save`: 이미 `setVolumes({ sfx, voice })` 호출 중 → `bgm: next.volBg` 추가. (배경음 슬라이더가 이제 실제로 동작.)

## 통합 지점 (파일별)

- **`src/lib/audio.js`**: `playBgm/stopBgm`, `playToolVoice`(+`playVoice` 일반화, `TOOL_VOICE_TEXT`), `startDraw/drawTick/stopDraw`, `playSfx('sticker')`, `setVolumes` bgm 확장.
- **`src/worldmap.jsx`**: 마운트/`currentPage` 변경 시 `playBgm(SEASON_PAGES[currentPage].id)`; 언마운트 cleanup에서 `stopBgm()`. 첫 포인터 상호작용에 재생 보장.
- **`src/activities.jsx` `FreeColoringActivity`**:
  - 도구 버튼 `onClick`(line ~777) → `setTool` 후 `playToolVoice(tw.id)`.
  - 스티커 토글 버튼(line ~797) → `playToolVoice('sticker')`. 스티커 칩 선택(line ~825) → 짧은 `playSfx('select')`(선택 피드백).
  - `onPointerDown`(line ~526): 스트로크 시작 시 `startDraw(tool === 'eraser' ? 'erase' : 'draw')`; armedSticker 배치 분기(line ~530)에서 `playSfx('sticker')`.
  - `onPointerMove`(line ~550): `drawTick(speed)`.
  - `onPointerUp`(line ~568): `stopDraw()`.
- **`src/app.jsx`** / **`src/shell.jsx`**: `setVolumes`에 bgm 전달(위 음량 연동).
- **`vite.config.js`**: workbox `globPatterns`에 이미 `mp3` 포함 → bgm/tool 음성 자동 프리캐시. (bgm이 커지면 추후 runtime CacheFirst로 분리 검토.)

## 사용자 준비 에셋

1. **BGM 3곡** — 로열티 프리 루프. `public/bgm/{spring,summer,fall}.mp3`. (Pixabay Music 등 선곡/다운로드 단계별 안내 예정.)
2. **도구 음성 6개** — Azure 스크립트 확장 후 `public/voices/tool-*.mp3` 생성.

## 검증 (end-to-end)

1. `npm run dev` (포트 3100).
2. **BGM**: 홈에서 첫 탭 후 봄 음악 재생 → 가로 스크롤로 여름/가을 이동 시 크로스페이드 전환 → 장소 탭해 활동 진입 시 정지 → 뒤로 홈 복귀 시 재개. 부모설정 배경음 슬라이더 0/100 실시간 반영.
3. **도구 음성**: 자유 색칠놀이에서 크레용/붓/마커/연필/지우개/스티커 탭 → 각 이름 음성(파일 없으면 speechSynthesis).
4. **그리기/지우기**: 펜으로 그으면 그리기 소리, 멈추면 조용, 지우개로 문지르면 지우기 소리. 효과음 슬라이더로 음량 변화.
5. **스티커**: 스티커 선택 후 캔버스 탭 → 부착 팝 효과음 + 별 보상.
6. **오프라인**: build + preview, offline에서 BGM/음성 재생(프리캐시).

## 리스크 / 엣지 케이스

- **autoplay**: BGM은 제스처 전 차단 → 홈 첫 탭에 시작 보장 필요(전역 pointerdown unlock 활용).
- **활동 진입 시 정지 누락**: worldmap 언마운트 cleanup에서 반드시 `stopBgm()` (메모리 누수·중복 재생 방지).
- **연속 그리기음 누수**: `stopDraw`에서 소스 정지/disconnect 확실히. 포인터 캡처 해제 경로(pointercancel)도 처리.
- **빠른 도구 연타**: 음성이 겹칠 수 있음 → `playVoice`는 재사용 element라 자동으로 직전 클립 중단(기존 동작). speechSynthesis 폴백도 `cancel()` 선행.
- **BGM 파일 용량**: 프리캐시가 커지면 초기 SW 설치 지연 → 곡당 1MB 내외 권장, 필요 시 runtime 캐싱으로 전환.
- **PowerShell 한글 인코딩**: 도구 음성 클립도 `voices.json`(UTF-8) 경유로 생성(기존 교훈 반영).
