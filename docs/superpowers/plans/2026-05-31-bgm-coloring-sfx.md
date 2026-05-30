# 계절별 배경음악 + 색칠놀이 효과음 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 월드맵에 계절별 배경음악을 입히고(부모설정 배경음 슬라이더 실연동), 자유 색칠놀이에 도구 음성·그리기/지우기/스티커 효과음을 추가한다.

**Architecture:** 기존 단일 오디오 싱글톤 `src/lib/audio.js`를 확장한다. BGM(HTMLAudioElement 2개 크로스페이드), 도구 음성(장소 음성 파이프라인 일반화), 그리기/지우기(합성 연속 노이즈), 스티커(합성 원샷)를 추가하고, 음량은 부모설정 슬라이더(`volBg`/`volSfx`/`volVoice`)에 연동한다. React 컴포넌트는 모듈 함수만 호출한다.

**Tech Stack:** React + Vite, Web Audio API, HTMLAudioElement, vite-plugin-pwa(workbox). 음성 파일은 Azure AI Speech(REST)로 생성.

> **테스트 정책:** 이 프로젝트는 자동화 테스트 하네스가 없다(직전 오디오 작업도 브라우저 수동 검증으로 출하). 각 태스크의 검증 단계는 `npm run dev` 후 **브라우저에서 무엇을 보고/들어야 하는지**를 명시한다. 단위 테스트 프레임워크를 새로 도입하지 않는다(YAGNI).

> **에셋 의존:** BGM mp3 3개와 도구 음성 mp3 6개는 사용자가 별도 생성한다(Task 7). 파일이 없어도 코드는 동작한다 — BGM은 무음, 도구 음성은 speechSynthesis 폴백. 따라서 Task 1~6은 에셋 없이도 검증 가능하다.

---

## File Structure

- **Modify** `src/lib/audio.js` — BGM/도구음성/그리기음/스티커음 + `setVolumes` bgm 확장 (Task 1~3)
- **Modify** `src/app.jsx` — init에서 `volBg`도 `setVolumes`로 전달 (Task 4)
- **Modify** `src/shell.jsx` — `ParentSettings.save`에서 `bgm: volBg` 전달 (Task 4)
- **Modify** `src/worldmap.jsx` — 계절 BGM 시작/전환/정지 (Task 5)
- **Modify** `src/activities.jsx` — `FreeColoringActivity` 도구/그리기/스티커 사운드 (Task 6)
- **Modify** `scripts/gen-voices.ps1` / `scripts/gen-voices.sh`, **Create** `scripts/tools.json` — 도구 음성 생성 (Task 7)
- `vite.config.js` — 변경 불필요(`globPatterns`에 이미 `mp3` 포함, bgm/tool 음성 자동 프리캐시)

---

## Task 1: 음성 재생 일반화 + 도구 음성 추가

**Files:**
- Modify: `src/lib/audio.js`

- [ ] **Step 1: `TOOL_VOICE_TEXT` 맵 추가**

`PLACE_VOICE_TEXT` 객체(라인 9~20) 바로 아래에 추가:

```js
// toolId → 도구 음성 폴백 텍스트 (mp3 없을 때 speechSynthesis)
export const TOOL_VOICE_TEXT = {
  crayon:  '크레용!',
  brush:   '붓!',
  marker:  '마커!',
  pencil:  '연필!',
  eraser:  '지우개!',
  sticker: '스티커!',
};
```

- [ ] **Step 2: 음성 섹션(라인 119~167)을 일반화 버전으로 교체**

기존 `// ── 장소 음성 ──` 부터 `preloadPlaceVoices` 끝(라인 119~167)까지를 아래로 교체:

```js
// ── 음성 (장소/도구) ─────────────────────────────────────────
// voiceCache 는 전체 파일 키로 캐싱: 'place-color', 'tool-crayon' 등.
const voiceCache = {};

function getVoiceEl(key) {
  if (!voiceCache[key]) {
    const a = new Audio(`/voices/${key}.mp3`);
    a.preload = 'auto';
    voiceCache[key] = a;
  }
  return voiceCache[key];
}

function fallbackSpeak(text) {
  try {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.95;
    u.pitch = 1.3;          // 아이 느낌으로 약간 높게
    u.volume = vols.voice;
    window.speechSynthesis.speak(u);
  } catch {}
}

// /voices/<key>.mp3 재생. 없거나 실패하면 speechSynthesis(fallbackText) 폴백.
function playVoice(key, fallbackText) {
  unlockAudio();
  try {
    const el = getVoiceEl(key);
    let fellBack = false;
    const fall = () => { if (!fellBack) { fellBack = true; fallbackSpeak(fallbackText); } };
    el.onerror = fall;
    el.volume = vols.voice;
    el.currentTime = 0;
    const p = el.play();
    if (p && p.catch) p.catch(fall);
  } catch {
    fallbackSpeak(fallbackText);
  }
}

export function playPlaceVoice(catId) {
  playVoice(`place-${catId}`, PLACE_VOICE_TEXT[catId]);
}

export function playToolVoice(toolId) {
  playVoice(`tool-${toolId}`, TOOL_VOICE_TEXT[toolId]);
}

// 첫 제스처 후 클립 워밍(best-effort). 파일 미추가 시 404 콘솔 경고는 정상.
export function preloadPlaceVoices() {
  try {
    for (const catId in PLACE_VOICE_TEXT) getVoiceEl(`place-${catId}`);
    for (const toolId in TOOL_VOICE_TEXT) getVoiceEl(`tool-${toolId}`);
  } catch {}
}
```

> 주의: `setVolumes`의 `for (const k in voiceCache)` 루프는 키만 바뀌고 동작은 동일하므로 수정 불필요.

- [ ] **Step 3: 빌드로 컴파일 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 성공(기존 "Duplicate key position" 경고는 무관, 무시).

- [ ] **Step 4: 커밋**

```bash
git add src/lib/audio.js
git commit -m "feat(audio): generalize voice playback, add playToolVoice"
```

---

## Task 2: 배경음악(BGM) 서브시스템

**Files:**
- Modify: `src/lib/audio.js`

- [ ] **Step 1: `vols`에 bgm 추가**

라인 25 `let vols = { sfx: 0.7, voice: 0.7 };` 를 교체:

```js
// 0–1 게인 (부모설정 기본값 → 0.7 / 배경음 50 → 0.5). setVolumes 로 갱신.
let vols = { sfx: 0.7, voice: 0.7, bgm: 0.5 };
```

- [ ] **Step 2: `setVolumes`에 bgm 처리 추가**

`setVolumes`(라인 49~54)를 교체:

```js
// 0–100 입력 → 0–1 게인. ctx 가 없으면 값만 저장(제스처 전 생성 방지).
export function setVolumes({ sfx, voice, bgm } = {}) {
  if (typeof sfx === 'number') vols.sfx = clamp01(sfx / 100);
  if (typeof voice === 'number') vols.voice = clamp01(voice / 100);
  if (typeof bgm === 'number') vols.bgm = clamp01(bgm / 100);
  if (sfxGain) sfxGain.gain.value = vols.sfx;
  for (const k in voiceCache) { try { voiceCache[k].volume = vols.voice; } catch {} }
  const cur = bgmActive >= 0 ? bgmEls[bgmActive] : null;
  if (cur) { try { cur.volume = vols.bgm; } catch {} }
}
```

- [ ] **Step 3: BGM 서브시스템 추가**

파일 끝(`preloadPlaceVoices` 다음)에 추가:

```js
// ── 배경음악 (BGM) ───────────────────────────────────────────
// HTMLAudioElement 2개로 계절 전환 시 크로스페이드(약 0.6초).
const bgmEls = [null, null];
let bgmActive = -1;              // 현재 들리는 element 인덱스 (-1 = 없음)
let bgmSeason = null;           // 현재 재생 중인 계절
const bgmFades = [null, null];  // element별 진행 중 fade interval id

function getBgmEl(i) {
  if (!bgmEls[i]) {
    const a = new Audio();
    a.loop = true;
    a.preload = 'auto';
    a.volume = 0;
    bgmEls[i] = a;
  }
  return bgmEls[i];
}

function fadeEl(i, to, ms) {
  const el = bgmEls[i];
  if (!el) return;
  if (bgmFades[i]) { clearInterval(bgmFades[i]); bgmFades[i] = null; }
  const from = el.volume;
  const steps = Math.max(1, Math.round(ms / 40));
  let n = 0;
  bgmFades[i] = setInterval(() => {
    n++;
    el.volume = clamp01(from + (to - from) * (n / steps));
    if (n >= steps) {
      clearInterval(bgmFades[i]); bgmFades[i] = null;
      if (to === 0) { try { el.pause(); } catch {} }
    }
  }, 40);
}

// 계절 곡으로 전환. 같은 곡이면 (autoplay 차단 후 재개만) 처리.
export function playBgm(season) {
  if (season === bgmSeason && bgmActive >= 0) {
    const cur = bgmEls[bgmActive];
    if (cur && cur.paused) cur.play().catch(() => {});
    return;
  }
  const next = bgmActive === 0 ? 1 : 0;
  const el = getBgmEl(next);
  el.src = `/bgm/${season}.mp3`;
  el.volume = 0;
  const p = el.play();
  if (p && p.catch) p.catch(() => {});   // autoplay 차단 시 조용히 실패(제스처 후 재시도)
  fadeEl(next, vols.bgm, 600);
  if (bgmActive >= 0) fadeEl(bgmActive, 0, 600);
  bgmActive = next;
  bgmSeason = season;
}

export function stopBgm() {
  const i = bgmActive;
  bgmActive = -1;
  bgmSeason = null;
  if (i >= 0) fadeEl(i, 0, 400);
}
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/audio.js
git commit -m "feat(audio): add seasonal BGM with crossfade + volume wiring"
```

---

## Task 3: 그리기/지우기 합성음 + 스티커 효과음

**Files:**
- Modify: `src/lib/audio.js`

- [ ] **Step 1: `playSfx`에 'sticker' 케이스 추가**

`playSfx` switch의 `case 'star':` 블록 다음(라인 93 근처)에 추가:

```js
      case 'sticker':            // 팝 + 반짝
        blip(523, now, 0.10, 0.30);
        blip(1047, now + 0.06, 0.16, 0.28);
        break;
```

- [ ] **Step 2: 그리기/지우기 연속 합성음 추가**

`playTone` 함수(라인 117 끝) 다음에 추가:

```js
// ── 그리기/지우기 합성음 (연속) ──────────────────────────────
let noiseBuffer = null;
function getNoiseBuffer() {
  if (noiseBuffer || !ctx) return noiseBuffer;
  const len = Math.floor(ctx.sampleRate * 1.0);
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

let drawNodes = null;   // { src, filter, gain }
let drawBase = 0;       // 기본 음량(도구별)

export function startDraw(kind = 'draw') {
  try {
    ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    stopDraw();                       // 이전 세션 정리
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer();
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    if (kind === 'erase') { filter.type = 'lowpass'; filter.frequency.value = 900; }
    else { filter.type = 'bandpass'; filter.frequency.value = 1800; filter.Q.value = 0.7; }
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    src.connect(filter); filter.connect(gain); gain.connect(sfxGain);
    src.start();
    drawNodes = { src, filter, gain };
    drawBase = kind === 'erase' ? 0.10 : 0.07;
    gain.gain.setTargetAtTime(drawBase, ctx.currentTime, 0.03);
  } catch {}
}

// onPointerMove 에서 호출 — 이동 속도(px)에 비례해 음량 변조(멈추면 작게).
export function drawTick(speed = 0) {
  if (!drawNodes || !ctx) return;
  const lvl = Math.min(0.16, drawBase + Math.min(0.09, speed / 1200));
  try { drawNodes.gain.gain.setTargetAtTime(lvl, ctx.currentTime, 0.02); } catch {}
}

export function stopDraw() {
  if (!drawNodes || !ctx) { drawNodes = null; return; }
  const { src, gain } = drawNodes;
  drawNodes = null;
  try {
    gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
    src.stop(ctx.currentTime + 0.12);
  } catch {}
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 4: 커밋**

```bash
git add src/lib/audio.js
git commit -m "feat(audio): add draw/erase synth + sticker sfx"
```

---

## Task 4: 배경음 슬라이더 실연동 (app.jsx, shell.jsx)

**Files:**
- Modify: `src/app.jsx` (init useEffect, 약 라인 22~31)
- Modify: `src/shell.jsx` (`ParentSettings.save`, 약 라인 988)

- [ ] **Step 1: app.jsx init에서 volBg 전달**

`src/app.jsx`의 init useEffect 내부:

```js
      const ps = { volSfx: 70, volVoice: 70, ...JSON.parse(localStorage.getItem('kw-parent-settings') || '{}') };
      setVolumes({ sfx: ps.volSfx, voice: ps.volVoice });
```

를 아래로 교체:

```js
      const ps = { volBg: 50, volSfx: 70, volVoice: 70, ...JSON.parse(localStorage.getItem('kw-parent-settings') || '{}') };
      setVolumes({ sfx: ps.volSfx, voice: ps.volVoice, bgm: ps.volBg });
```

- [ ] **Step 2: shell.jsx save에서 bgm 전달**

`src/shell.jsx` `ParentSettings.save`의:

```js
    setVolumes({ sfx: next.volSfx, voice: next.volVoice });
```

를 교체:

```js
    setVolumes({ sfx: next.volSfx, voice: next.volVoice, bgm: next.volBg });
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 4: 커밋**

```bash
git add src/app.jsx src/shell.jsx
git commit -m "feat(audio): wire background-music volume slider"
```

---

## Task 5: 월드맵 계절 BGM 연동 (worldmap.jsx)

**Files:**
- Modify: `src/worldmap.jsx` (import 라인 8, currentPage 인근에 effect 추가)

- [ ] **Step 1: import 확장**

라인 8 `import { unlockAudio, playSfx, playPlaceVoice } from './lib/audio.js'` 를 교체:

```js
import { unlockAudio, playSfx, playPlaceVoice, playBgm, stopBgm } from './lib/audio.js'
```

- [ ] **Step 2: 계절 BGM effect 추가**

`currentPage` 변경 시 배지 애니메이션을 트리거하는 effect(약 라인 162 `useEffectMap(() => { setPageBadgeKey... }, [currentPage]);`) **바로 다음**에 추가:

```js
  // 계절별 배경음악 — 현재 보이는 계절로 전환
  useEffectMap(() => {
    playBgm(SEASON_PAGES[currentPage].id);
  }, [currentPage]);

  // 홈 마운트: autoplay 차단 대비 첫 포인터 입력에 재생 보장. 언마운트(활동 진입) 시 정지.
  useEffectMap(() => {
    const kick = () => playBgm(SEASON_PAGES[currentPage].id);
    window.addEventListener('pointerdown', kick, { once: true });
    return () => {
      window.removeEventListener('pointerdown', kick);
      stopBgm();
    };
  }, []);
```

> `kick`은 마운트 시점 `currentPage`(초기 봄)를 캡처하지만, 이후 스크롤로 계절이 바뀌면 위 `[currentPage]` effect가 곡을 교정하므로 문제없다.

- [ ] **Step 3: 수동 검증 (브라우저)**

Run: `npm run dev` → 브라우저에서 홈 진입.
- 첫 화면 탭 후(콘솔 에러 없음) — BGM 파일이 아직 없으면 무음이 정상. 네트워크 탭에 `/bgm/spring.mp3` 요청(404 예상)이 보이면 배선 OK.
- 가로 스크롤로 여름/가을 이동 시 `/bgm/summer.mp3`, `/bgm/fall.mp3` 요청 발생 확인.
- 장소를 탭해 활동에 들어갔다 뒤로 나오면 다시 `/bgm/<계절>.mp3` 요청(재개) 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/worldmap.jsx
git commit -m "feat(worldmap): play seasonal BGM on home, stop on leave"
```

---

## Task 6: 자유 색칠놀이 사운드 (activities.jsx)

**Files:**
- Modify: `src/activities.jsx` (import 라인 7; `FreeColoringActivity` 핸들러/버튼)

- [ ] **Step 1: import 확장**

라인 7 `import { playSfx, playTone } from './lib/audio.js'` 를 교체:

```js
import { playSfx, playTone, playToolVoice, startDraw, drawTick, stopDraw } from './lib/audio.js'
```

- [ ] **Step 2: 도구 버튼 onClick에 음성 추가**

`FREE_TOOLS.map`의 도구 버튼(약 라인 777):

```js
              <button key={tw.id} onClick={() => { setTool(tw.id); setArmedSticker(null); }}
```

를 교체:

```js
              <button key={tw.id} onClick={() => { setTool(tw.id); setArmedSticker(null); playToolVoice(tw.id); }}
```

- [ ] **Step 3: 스티커 토글 버튼에 음성 추가**

스티커 토글 버튼(약 라인 797):

```js
          <button onClick={() => setShowStickerPalette((v) => !v)}
```

를 교체:

```js
          <button onClick={() => setShowStickerPalette((v) => { const nv = !v; if (nv) playToolVoice('sticker'); return nv; })}
```

- [ ] **Step 4: 스티커 칩 선택에 효과음 추가**

스티커 팔레트의 칩 버튼(약 라인 825):

```js
              <button key={s} onClick={() => setArmedSticker(active ? null : s)}
```

를 교체:

```js
              <button key={s} onClick={() => { setArmedSticker(active ? null : s); playSfx('select'); }}
```

- [ ] **Step 5: onPointerDown — 스티커 배치음 + 그리기음 시작**

`onPointerDown`의 스티커 배치 분기(약 라인 530~537), `setArmedSticker(null);` 다음 줄에 `playSfx('sticker');` 추가:

```js
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

그리고 스트로크 시작부의 `renderStroke(ctx, drawingRef.current);`(약 라인 547) 다음 줄에 추가:

```js
    renderStroke(ctx, drawingRef.current);
    startDraw(tool === 'eraser' ? 'erase' : 'draw');
```

- [ ] **Step 6: onPointerMove — 속도 기반 그리기음 변조**

`onPointerMove`의 `ctx.stroke();`(약 라인 565) 다음 줄에 추가:

```js
    ctx.stroke();
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    drawTick(Math.hypot(b.x - a.x, b.y - a.y));
```

- [ ] **Step 7: onPointerUp — 그리기음 정지**

`onPointerUp`의 `try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}`(약 라인 570) 다음 줄에 `stopDraw();` 추가:

```js
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    stopDraw();
```

- [ ] **Step 8: 수동 검증 (브라우저)**

Run: `npm run dev` → 색칠 언덕 → 자유 색칠놀이.
- 도구(크레용/붓/마커/연필/지우개) 탭 → 이름 음성(파일 없으면 speechSynthesis로 "크레용!" 등) 들림.
- 캔버스에 펜을 그으면 그리기 소리, 멈추면 조용, 빠르게 그으면 커짐. 지우개로 문지르면 다른(낮은) 소리.
- 스티커 버튼 → "스티커!" 음성, 칩 선택 → 선택음, 캔버스 탭 → 팝 효과음 + 별.
- 부모설정 효과음 슬라이더로 그리기/스티커 음량 변화, 음성 슬라이더로 도구 음성 음량 변화 확인.

- [ ] **Step 9: 커밋**

```bash
git add src/activities.jsx
git commit -m "feat(coloring): tool voice + draw/erase/sticker sounds"
```

---

## Task 7: 도구 음성 생성 스크립트 확장 + BGM 소싱

**Files:**
- Create: `scripts/tools.json`
- Modify: `scripts/gen-voices.ps1`, `scripts/gen-voices.sh`

- [ ] **Step 1: tools.json 생성 (UTF-8, 한글은 데이터 파일에만)**

`scripts/tools.json`:

```json
{
  "crayon": "크레용!",
  "brush": "붓!",
  "marker": "마커!",
  "pencil": "연필!",
  "eraser": "지우개!",
  "sticker": "스티커!"
}
```

- [ ] **Step 2: gen-voices.ps1 — places + tools 둘 다 생성**

`scripts/gen-voices.ps1`에서 `$clips = ...` 한 줄과 그 아래 `foreach (...) { ... }` 루프 전체를 아래로 교체:

```powershell
# Read phrases explicitly as UTF-8 (encoding-safe)
$places = (Get-Content -Raw -Encoding UTF8 -Path (Join-Path $PSScriptRoot 'voices.json')) | ConvertFrom-Json
$tools  = (Get-Content -Raw -Encoding UTF8 -Path (Join-Path $PSScriptRoot 'tools.json'))  | ConvertFrom-Json

$OutDir = Join-Path $PSScriptRoot '..\public\voices'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$endpoint = "https://$Region.tts.speech.microsoft.com/cognitiveservices/v1"
$headers = @{
  'Ocp-Apim-Subscription-Key' = $Key
  'Content-Type'              = 'application/ssml+xml'
  'X-Microsoft-OutputFormat'  = 'audio-24khz-48kbitrate-mono-mp3'
  'User-Agent'                = 'kidsweb-gen-voices'
}

function Invoke-Gen($prefix, $obj) {
  foreach ($p in $obj.PSObject.Properties) {
    $ssml = "<speak version='1.0' xml:lang='ko-KR'><voice name='$Voice'><prosody pitch='$Pitch' rate='$Rate'>$($p.Value)</prosody></voice></speak>"
    $outFile = Join-Path $OutDir ("{0}-{1}.mp3" -f $prefix, $p.Name)
    Write-Host ("generating: {0}-{1}.mp3" -f $prefix, $p.Name)
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($ssml)
    Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $bodyBytes -OutFile $outFile
  }
}

Invoke-Gen 'place' $places
Invoke-Gen 'tool'  $tools
```

> 기존 스크립트 상단의 `$OutDir`/`$endpoint`/`$headers` 정의가 중복되면 위 블록 한 곳만 남기고 제거한다. `$Voice`/`$Pitch`/`$Rate`/`$Key`/`$Region`은 상단 정의를 그대로 사용.

- [ ] **Step 3: gen-voices.sh — tool 항목 추가**

`scripts/gen-voices.sh`의 `clips=( ... )` 배열에서 각 항목의 좌측 키를 `place-` 접두사 형태로 바꾸고, 출력 경로를 키 그대로 사용하도록 한다. 배열을 아래로 교체:

```bash
clips=(
  "place-color|색칠 언덕으로 가자!"
  "place-shape|모양 꽃밭으로 가자!"
  "place-music|노래 폭포로 가자!"
  "place-hangul|글자나무 숲으로 가자!"
  "place-english|에이비씨 모래사장으로 가자!"
  "place-math|숫자 산으로 가자!"
  "place-code|로봇 공장으로 가자!"
  "place-brain|수수께끼 동굴로 가자!"
  "place-computer|반짝 등대로 가자!"
  "place-social|친구 광장으로 가자!"
  "tool-crayon|크레용!"
  "tool-brush|붓!"
  "tool-marker|마커!"
  "tool-pencil|연필!"
  "tool-eraser|지우개!"
  "tool-sticker|스티커!"
)
```

그리고 루프 내 출력 경로를 `place-${id}.mp3` 가 아니라 키 그대로 쓰도록 수정:

```bash
    --output "$OUTDIR/${id}.mp3"
```

(루프 상단 `id="${entry%%|*}"`, `text="${entry#*|}"`는 그대로.)

- [ ] **Step 4: BGM 파일 준비 (사용자, 수동)**

`public/bgm/spring.mp3`, `public/bgm/summer.mp3`, `public/bgm/fall.mp3` 를 로열티 프리 루프로 채운다.
- 추천 소스: Pixabay Music(가입 없이 무료, 상업적 사용 가능), Incompetech(Kevin MacLeod, 크레딧 권장).
- 곡 성격: 봄=밝고 경쾌, 여름=청량/잔잔, 가을=따뜻/포근. 30~90초 매끄러운 루프, 곡당 1MB 내외.
- (이 단계는 실행 시 사용자에게 단계별로 안내한다.)

- [ ] **Step 5: 도구 음성 생성 (사용자, 수동)**

PowerShell에서(키는 Task 직전 안내된 새 키 사용):

```powershell
$env:SPEECH_KEY    = "<new-key>"
$env:SPEECH_REGION = "koreacentral"
powershell -ExecutionPolicy Bypass -File scripts\gen-voices.ps1
```

Expected: `public\voices\`에 `place-*.mp3` 10개 + `tool-*.mp3` 6개.

- [ ] **Step 6: 전체 수동 검증 (에셋 포함)**

Run: `npm run dev`
- 홈: 계절별 BGM 재생/전환/정지(Task 5 검증의 무음 → 실제 음악으로).
- 자유 색칠놀이: 도구 음성이 speechSynthesis → 실제 아이 목소리 mp3로 바뀜.
- 부모설정 배경음/효과음/음성 슬라이더가 각각 BGM/효과음·그리기/음성에 실시간 반영.

- [ ] **Step 7: 커밋**

```bash
git add scripts/tools.json scripts/gen-voices.ps1 scripts/gen-voices.sh public/voices public/bgm
git commit -m "feat(assets): tool voices + seasonal BGM, gen scripts"
```

---

## Self-Review

**Spec coverage:**
- BGM 계절별 재생/전환/정지 → Task 2(엔진), Task 5(월드맵 연동). ✅
- 배경음 슬라이더 실연동 → Task 2(setVolumes bgm) + Task 4. ✅
- 도구 선택 음성(6개) → Task 1(playToolVoice), Task 6(버튼 배선), Task 7(클립 생성). ✅
- 그리기/지우기 연속음 → Task 3(startDraw/drawTick/stopDraw), Task 6(포인터 배선). ✅
- 스티커 부착음 → Task 3(playSfx 'sticker'), Task 6(배치 배선). ✅
- 오프라인 프리캐시 → `vite.config.js` 기존 mp3 glob으로 충족(변경 불필요, File Structure에 명시). ✅

**Type/이름 일관성:** `playToolVoice`, `playBgm`, `stopBgm`, `startDraw`, `drawTick`, `stopDraw`, `playSfx('sticker')`, `setVolumes({bgm})` — 정의 태스크와 사용 태스크에서 명칭 일치 확인. ✅

**Placeholder 스캔:** 모든 코드 단계에 실제 코드 포함, 수동 검증 단계는 관찰 대상 명시. 에셋 준비(Task 7 Step 4/5)는 사용자 수동 작업으로 명시. ✅
