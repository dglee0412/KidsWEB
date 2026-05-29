# KidsWeb 제품화 (경로 A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** claude.ai/design이 만든 동작하는 프로토타입 `sample2/`를, 브라우저 내 Babel 없이 실제 빌드되는 설치형 PWA로 제품화한다 — Vite 번들링, ESM 모듈화, 설정·진행도 영속화, 부모 설정 톤 선택, 오프라인 지원.

**Architecture:** `sample2/`의 앱 코드(themes / shell / worldmap / activities / app)를 `src/`로 옮겨 Vite + React SPA로 빌드한다. 디자인 하니스(design-canvas, tweaks-panel, ios-frame)는 버린다. 브라우저 전역(`window`) 공유 방식을 ES 모듈 import/export로 전환한다. 앱은 1024×768 고정 디자인을 화면 크기에 맞춰 스케일한다. 설정·별·장소 진행도는 localStorage에 저장한다.

**Tech Stack:** Vite, React 18.3.1, plain JavaScript (.jsx), vite-plugin-pwa, localStorage

**이 계획은 다음 두 계획을 대체한다 (경로 B — Next.js 재구현 — 는 보류):**
- `docs/superpowers/plans/2026-04-13-project-setup-main-screen.md`
- `docs/superpowers/plans/2026-05-20-worldmap.md`

설계 문서(`docs/superpowers/specs/2026-05-20-worldmap-redesign-design.md`)와 기획/와이어프레임은 그대로 유효하다.

---

## 사전 메모

### sample2 모듈 익스포트 맵 (window 전역 → ESM 전환 대상)

| 파일 | 현재 `window`로 노출하는 식별자 |
|---|---|
| `kidsweb-themes.jsx` | `KIDS_CATEGORIES`, `KIDS_TONES`, `timeOfDayBg`, `toneTexture` |
| `kidsweb-shell.jsx` | `IPadFrame`, `Mascot`, `StarCounter`, `BackButton`, `VoiceGuide`, `BigButton`, `HomeScreen`, `SubmenuScreen`, `PlaceholderScreen`, `ColorMenuScreen`, `FreeBgScreen`, `CelebrationScreen`, `ParentSettings`, `GalleryScreen`, `SUBMENUS`, `COLOR_MENU_ITEMS`, `FREE_BG_TABS` |
| `kidsweb-worldmap.jsx` | `WorldMapHome` (그리고 `window.HomeScreen`을 덮어씀) |
| `kidsweb-activities.jsx` | `Activity`, `COLORING_TEMPLATES` |
| `kidsweb-app.jsx` | `KidsApp`, `SplashScreen` |

전환 원칙: 각 파일에서 `Object.assign(window, …)` / `window.X =` 줄을 삭제하고, 해당 식별자 선언에 `export`를 붙이고, 다른 파일의 식별자를 쓰는 곳엔 파일 상단에 `import`를 추가한다. 모든 파일은 `React` 전역에 의존하므로 상단에 `import React from 'react'`를 추가한다.

### 최종 폴더 구조

```
KidsWeb/
├── index.html                  Vite 진입 HTML (Gaegu 폰트 link 포함)
├── package.json
├── vite.config.js
├── public/
│   ├── icons/                  PWA 아이콘 (192, 512)
│   └── (manifest는 vite-plugin-pwa가 생성)
├── src/
│   ├── main.jsx                진입점 — RootApp(설정 소유) + 1024×768 스케일 래퍼
│   ├── styles.css              전역 CSS + 공용 키프레임
│   ├── lib/
│   │   └── storage.js          localStorage 영속화 헬퍼
│   ├── themes.jsx              ← kidsweb-themes.jsx
│   ├── shell.jsx               ← kidsweb-shell.jsx
│   ├── worldmap.jsx            ← kidsweb-worldmap.jsx
│   ├── activities.jsx          ← kidsweb-activities.jsx
│   └── app.jsx                 ← kidsweb-app.jsx (KidsApp)
├── sample2/                    (원본 보존 — 참고용, 빌드에서 제외)
└── Doc/, docs/                 (기존 문서)
```

---

### Task 1: Vite 프로젝트 셋업

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.gitignore`
- Create: `src/main.jsx`, `src/styles.css`

- [ ] **Step 1: package.json 생성 및 의존성 설치**

```bash
cd D:/DGLee/KidsWeb
npm init -y
npm install react@18.3.1 react-dom@18.3.1
npm install -D vite@5 @vitejs/plugin-react@4
```

- [ ] **Step 2: package.json scripts 설정**

`package.json`의 `"scripts"`를 다음으로 교체:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```
또한 `package.json`에 `"type": "module"`을 추가한다.

- [ ] **Step 3: vite.config.js 생성**

`vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
})
```

- [ ] **Step 4: .gitignore 생성**

`.gitignore`:
```
node_modules/
dist/
*.local
.DS_Store
```

- [ ] **Step 5: index.html 생성**

`index.html` (프로젝트 루트):
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>KidsWeb · 만 3~5세 유아용</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Jua&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 6: src/styles.css 생성**

`sample2/KidsWeb.html`의 `<style>` 블록 안에 있는 전역 스타일과 `@keyframes`(kw-pop, kw-ripple, kw-star-pop, kw-wave, kw-voice, kw-spin, kw-float, kw-splash-rainbow, kw-splash-title, kw-splash-sub, kw-pulse, kw-toast, kw-ring, kw-shake, kw-confetti, kw-star-spring, kw-celeb-title, kw-celeb-card, `.kw-voice-bar`)를 그대로 `src/styles.css`로 복사한다. 단 `html, body`의 `font-family`는 유지하고, 다음을 추가한다:
```css
html, body { margin: 0; padding: 0; height: 100%; background: #1c1b22; overflow: hidden; }
#root { width: 100vw; height: 100vh; }
```
(`worldmap.jsx`의 키프레임은 자체 주입되므로 여기 옮기지 않는다.)

- [ ] **Step 7: 임시 src/main.jsx 로 빌드 확인**

`src/main.jsx` (임시):
```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <h1 style={{ color: '#fff', fontFamily: 'Gaegu, sans-serif' }}>KidsWeb</h1>
)
```

Run: `npm run dev`
Expected: http://localhost:3000 에 "KidsWeb"이 Gaegu 폰트로 표시됨.

- [ ] **Step 8: 커밋**

```bash
cd D:/DGLee/KidsWeb
git init
git add package.json package-lock.json vite.config.js index.html .gitignore src/
git commit -m "chore: scaffold Vite + React project"
```

---

### Task 2: 앱 파일 이동 + ESM 전환

각 파일을 `src/`로 옮기고 `window` 전역 공유를 ES 모듈로 바꾼다.

**Files:**
- Create (sample2에서 복사): `src/themes.jsx`, `src/shell.jsx`, `src/worldmap.jsx`, `src/activities.jsx`, `src/app.jsx`

- [ ] **Step 1: 5개 파일을 src/로 복사**

```bash
cd D:/DGLee/KidsWeb
cp sample2/kidsweb-themes.jsx     src/themes.jsx
cp sample2/kidsweb-shell.jsx      src/shell.jsx
cp sample2/kidsweb-worldmap.jsx   src/worldmap.jsx
cp sample2/kidsweb-activities.jsx src/activities.jsx
cp sample2/kidsweb-app.jsx        src/app.jsx
```

- [ ] **Step 2: src/themes.jsx — ESM 전환**

파일 맨 위에 추가:
```javascript
import React from 'react'
```
파일 맨 아래의 다음 블록을 삭제:
```javascript
Object.assign(window, {
  KIDS_CATEGORIES,
  KIDS_TONES,
  timeOfDayBg,
  toneTexture,
});
```
삭제한 자리에 추가:
```javascript
export { KIDS_CATEGORIES, KIDS_TONES, timeOfDayBg, toneTexture }
```

- [ ] **Step 3: src/shell.jsx — ESM 전환**

파일 맨 위에 추가:
```javascript
import React from 'react'
import { KIDS_CATEGORIES, KIDS_TONES, timeOfDayBg, toneTexture } from './themes.jsx'
```
파일에서 `KIDS_CATEGORIES`, `KIDS_TONES`, `timeOfDayBg`, `toneTexture` 중 실제로 참조되지 않는 것은 import 목록에서 빼도 된다 (Grep으로 확인: 각 식별자가 파일 안에서 쓰이는지 검색). 쓰이지 않는 것을 import하면 빌드 경고가 날 수 있으니, 쓰이는 것만 남긴다.

파일 맨 아래의 블록을 삭제:
```javascript
Object.assign(window, {
  IPadFrame, Mascot, StarCounter, BackButton, VoiceGuide, BigButton,
  HomeScreen, SubmenuScreen, PlaceholderScreen, ColorMenuScreen, FreeBgScreen, CelebrationScreen, ParentSettings, GalleryScreen,
  SUBMENUS, COLOR_MENU_ITEMS, FREE_BG_TABS,
});
```
삭제한 자리에 추가:
```javascript
export {
  IPadFrame, Mascot, StarCounter, BackButton, VoiceGuide, BigButton,
  HomeScreen, SubmenuScreen, PlaceholderScreen, ColorMenuScreen, FreeBgScreen,
  CelebrationScreen, ParentSettings, GalleryScreen,
  SUBMENUS, COLOR_MENU_ITEMS, FREE_BG_TABS,
}
```

- [ ] **Step 4: src/worldmap.jsx — ESM 전환**

파일 맨 위에 추가:
```javascript
import React from 'react'
import { KIDS_CATEGORIES } from './themes.jsx'
```
파일 맨 아래의 다음 두 줄을 삭제:
```javascript
window.HomeScreen = WorldMapHome;
Object.assign(window, { WorldMapHome });
```
삭제한 자리에 추가:
```javascript
export { WorldMapHome }
```
(`injectWorldMapKeyframes` IIFE는 그대로 둔다 — 모듈 로드 시 자체 실행되어 키프레임을 주입한다.)

- [ ] **Step 5: src/activities.jsx — ESM 전환**

파일 맨 위에 추가:
```javascript
import React from 'react'
```
이 파일이 `themes.jsx`의 식별자(`KIDS_CATEGORIES` 등)를 참조하면 그 import도 추가한다 (Grep으로 `KIDS_CATEGORIES`, `KIDS_TONES`, `timeOfDayBg`, `toneTexture`를 `src/activities.jsx`에서 검색해 쓰이는 것만 import). shell의 식별자를 참조하면 `./shell.jsx`에서 import한다.

파일 맨 아래의 블록을 삭제:
```javascript
Object.assign(window, { Activity, COLORING_TEMPLATES });
```
삭제한 자리에 추가:
```javascript
export { Activity, COLORING_TEMPLATES }
```

- [ ] **Step 6: src/app.jsx — ESM 전환 + 홈 화면을 WorldMapHome으로**

파일 맨 위에 추가:
```javascript
import React from 'react'
import { KIDS_CATEGORIES, timeOfDayBg, toneTexture } from './themes.jsx'
import {
  BackButton, StarCounter,
  SubmenuScreen, PlaceholderScreen, ColorMenuScreen, FreeBgScreen,
  CelebrationScreen, ParentSettings, GalleryScreen,
} from './shell.jsx'
import { WorldMapHome } from './worldmap.jsx'
import { Activity } from './activities.jsx'
```
(위 import 중 `app.jsx`에서 실제로 쓰이지 않는 식별자는 Grep으로 확인해 제거한다.)

`app.jsx`의 `route.screen === 'home'` 분기에서 `<HomeScreen … />`를 `<WorldMapHome … />`로 바꾼다. props는 동일하게 전달한다.

파일 맨 아래의 다음 줄을 삭제:
```javascript
Object.assign(window, { KidsApp, SplashScreen });
```
삭제한 자리에 추가:
```javascript
export { KidsApp, SplashScreen }
```

- [ ] **Step 7: main.jsx 에서 KidsApp 렌더 (임시 — 고정 크기)**

`src/main.jsx`를 다음으로 교체:
```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { KidsApp } from './app.jsx'
import { KIDS_TONES } from './themes.jsx'
import './styles.css'

function RootApp() {
  return (
    <div style={{ width: 1024, height: 768, position: 'relative', overflow: 'hidden' }}>
      <KidsApp
        tone={KIDS_TONES.C}
        fontSize={26}
        mascotOn={true}
        voiceShow={true}
        timeOfDay="day"
        splashKey={0}
      />
    </div>
  )
}

createRoot(document.getElementById('root')).render(<RootApp />)
```

- [ ] **Step 8: 빌드 검증**

Run: `npm run dev`
Expected: http://localhost:3000 에서 스플래시 → 월드맵 홈이 정상 표시. 콘솔 에러 없음. 장소 터치 → 곰곰이 걷기 → 서브메뉴/활동 진입까지 동작.

만약 `X is not defined` 류 에러가 나면, 해당 식별자를 정의한 파일을 익스포트 맵에서 찾아 import를 보강한다.

- [ ] **Step 9: 커밋**

```bash
git add src/ index.html
git commit -m "feat: port sample2 app to ESM modules under Vite"
```

---

### Task 3: 화면 맞춤 스케일 래퍼

앱은 1024×768 고정 좌표 기반(월드맵 SVG가 절대 px 사용)이므로, 실제 화면 크기에 맞춰 통째로 스케일한다.

**Files:**
- Modify: `src/main.jsx`

- [ ] **Step 1: ViewportFit 래퍼 구현**

`src/main.jsx`의 `RootApp`을 다음으로 교체:
```jsx
import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { KidsApp } from './app.jsx'
import { KIDS_TONES } from './themes.jsx'
import './styles.css'

const DESIGN_W = 1024
const DESIGN_H = 768

function useFitScale() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return scale
}

function RootApp() {
  const scale = useFitScale()
  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1c1b22', overflow: 'hidden',
    }}>
      <div style={{
        width: DESIGN_W, height: DESIGN_H,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        position: 'relative', overflow: 'hidden',
        flex: '0 0 auto',
      }}>
        <KidsApp
          tone={KIDS_TONES.C}
          fontSize={26}
          mascotOn={true}
          voiceShow={true}
          timeOfDay="day"
          splashKey={0}
        />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<RootApp />)
```

- [ ] **Step 2: 검증**

Run: `npm run dev`
브라우저 창 크기를 바꿔본다. 앱이 1024×768 비율을 유지하며 화면에 맞게 커지고 작아지고, 남는 공간은 어두운 배경으로 레터박스 처리됨. 월드맵 장소·곰곰이 위치가 배경과 어긋나지 않음.

- [ ] **Step 3: 커밋**

```bash
git add src/main.jsx
git commit -m "feat: scale-to-fit wrapper for fixed 1024x768 design"
```

---

### Task 4: 설정·진행도 localStorage 영속화

**Files:**
- Create: `src/lib/storage.js`
- Modify: `src/main.jsx`

- [ ] **Step 1: storage 헬퍼 작성**

`src/lib/storage.js`:
```javascript
// KidsWeb localStorage 영속화 헬퍼

const SETTINGS_KEY = 'kw-settings'

export const DEFAULT_SETTINGS = {
  toneId: 'C',        // 'A' | 'B' | 'C'
  fontSize: 26,
  mascotOn: true,
  voiceShow: true,
  timeLimit: 0,       // 분, 0 = 무제한
  volume: { bgm: 70, sfx: 90, voice: 100 },
}

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
    if (raw && typeof raw === 'object') {
      return { ...DEFAULT_SETTINGS, ...raw, volume: { ...DEFAULT_SETTINGS.volume, ...(raw.volume || {}) } }
    }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch {}
}

export function loadStars() {
  const n = Number(localStorage.getItem('kw-stars'))
  return Number.isFinite(n) ? n : 0
}

export function saveStars(n) {
  try { localStorage.setItem('kw-stars', String(n)) } catch {}
}
```

(장소별 별 `kw-place-stars`는 `worldmap.jsx`가 이미 localStorage로 읽고 있으므로 별도 처리 불필요. 데모용 `DEMO_STARS` 폴백은 Task 6에서 정리.)

- [ ] **Step 2: RootApp 이 설정을 소유·영속화하도록 수정**

`src/main.jsx`의 `RootApp`을 수정한다. 상단 import에 추가:
```jsx
import { loadSettings, saveSettings, loadStars, saveStars } from './lib/storage.js'
import { KIDS_TONES } from './themes.jsx'
```
`RootApp` 본문을 다음으로 교체:
```jsx
function RootApp() {
  const scale = useFitScale()
  const [settings, setSettings] = useState(loadSettings)

  const updateSettings = (partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }

  const tone = KIDS_TONES[settings.toneId] || KIDS_TONES.C

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1c1b22', overflow: 'hidden',
    }}>
      <div style={{
        width: DESIGN_W, height: DESIGN_H,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        position: 'relative', overflow: 'hidden',
        flex: '0 0 auto',
      }}>
        <KidsApp
          tone={tone}
          fontSize={settings.fontSize}
          mascotOn={settings.mascotOn}
          voiceShow={settings.voiceShow}
          timeOfDay="day"
          splashKey={0}
          settings={settings}
          onSettingsChange={updateSettings}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: KidsApp 이 별을 영속화하도록 수정**

`src/app.jsx`에서 `KidsApp`의 시그니처에 `settings`, `onSettingsChange`를 추가한다:
```jsx
function KidsApp({ tone, fontSize, mascotOn, voiceShow, timeOfDay, splashKey, settings, onSettingsChange }) {
```
`const [stars, setStars] = useStateApp(0)` 를 다음으로 바꿔 초기값을 localStorage에서 읽는다 (`app.jsx` 상단 import에 `import { loadStars, saveStars } from './lib/storage.js'` 추가):
```jsx
const [stars, setStars] = useStateApp(loadStars)
```
`onActivityReward` 함수 안에서 `setStars((s) => s + n)` 호출 직후에 별을 저장하도록, 해당 줄을 다음으로 교체:
```jsx
    setStars((s) => { const next = s + n; saveStars(next); return next; });
```
`ParentSettings`를 렌더하는 분기에 `settings`와 `onSettingsChange`를 전달한다:
```jsx
    content = <ParentSettings tone={tone} settings={settings} onSettingsChange={onSettingsChange} onClose={() => setRoute({ screen: 'home' })} />;
```

- [ ] **Step 4: 검증**

Run: `npm run dev`
활동을 완료해 별을 얻고 → 브라우저 새로고침 → 별 개수가 유지되는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/storage.js src/main.jsx src/app.jsx
git commit -m "feat: persist settings and stars to localStorage"
```

---

### Task 5: 부모 설정에 톤 선택 추가

**Files:**
- Modify: `src/shell.jsx` (`ParentSettings` 컴포넌트)

- [ ] **Step 1: ParentSettings 현재 구조 확인**

`src/shell.jsx`에서 `function ParentSettings(` 를 찾아 현재 props와 렌더 구조(시간 제한·음량·리포트·카테고리·데이터 관리 섹션)를 읽는다.

- [ ] **Step 2: ParentSettings 가 settings/onSettingsChange 를 받도록 수정**

`ParentSettings`의 시그니처에 `settings`, `onSettingsChange`를 추가한다. 기존 섹션 카드들 사이(맨 위 권장)에 톤 선택 섹션을 추가한다:
```jsx
{/* 화면 테마(톤) 선택 */}
<div style={{
  background: '#fff', borderRadius: 16, padding: '14px 16px',
  marginBottom: 12, border: tone.outline === 'none' ? '2px solid rgba(0,0,0,0.06)' : tone.outline,
}}>
  <div style={{ fontSize: 18, fontWeight: 900, color: tone.text, marginBottom: 10 }}>🎨 화면 테마</div>
  <div style={{ display: 'flex', gap: 10 }}>
    {[
      { id: 'A', name: '밝은 원색' },
      { id: 'B', name: '파스텔' },
      { id: 'C', name: '지브리 수채화' },
    ].map((opt) => {
      const active = (settings?.toneId || 'C') === opt.id
      return (
        <button key={opt.id}
          onClick={() => onSettingsChange && onSettingsChange({ toneId: opt.id })}
          style={{
            flex: 1, padding: '12px 8px', borderRadius: 12,
            border: active ? `3px solid ${tone.cat.color}` : '2px solid rgba(0,0,0,0.12)',
            background: active ? `${tone.cat.color}22` : '#fff',
            cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 16, fontWeight: 800, color: tone.text,
          }}>
          {opt.name}
        </button>
      )
    })}
  </div>
</div>
```
음량·시간 제한 등 다른 설정 컨트롤도 `onSettingsChange`로 연결하려면 같은 패턴(`onSettingsChange({ 키: 값 })`)을 쓴다. 이번 Task의 필수 범위는 톤 선택 연결까지다.

- [ ] **Step 3: 검증**

Run: `npm run dev`
홈 우상단 ⚙(또는 길게 누르기)로 부모 설정 진입 → 톤 A/B/C 버튼을 누르면 즉시 화면 톤이 바뀜 → 새로고침 후에도 선택한 톤이 유지됨.

- [ ] **Step 4: 커밋**

```bash
git add src/shell.jsx
git commit -m "feat: add tone (A/B/C) selector to parent settings"
```

---

### Task 6: 시간대 자동화 + 데모 데이터 정리

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/worldmap.jsx`

- [ ] **Step 1: 실제 시각으로 timeOfDay 결정**

`src/main.jsx` 상단에 헬퍼를 추가:
```jsx
function currentTimeOfDay() {
  const h = new Date().getHours()
  if (h < 11) return 'morning'
  if (h < 17) return 'day'
  return 'evening'
}
```
`RootApp`에서 `<KidsApp … timeOfDay="day" … />`를 `timeOfDay={currentTimeOfDay()}`로 바꾼다.

- [ ] **Step 2: 월드맵 데모 별 데이터 비우기**

`src/worldmap.jsx`의 `DEMO_STARS` 객체를 찾아, 모든 값을 `0`으로 바꾼다 (첫 실행 시 모든 장소가 미방문 상태로 시작하도록). `placeStars` useMemo의 `localStorage` 우선 로직은 유지한다 — 저장된 진행도가 있으면 그것을 쓰고, 없으면 전부 0.

- [ ] **Step 3: 검증**

Run: `npm run dev`
- 시간대가 현재 시각에 맞게 적용됨 (낮/저녁 하늘색).
- localStorage를 비운 새 상태에서 모든 장소가 흐릿(미방문)하게 시작.
- 장소에 진입했다 오면 그 장소가 또렷해지고 새로고침 후에도 유지.

- [ ] **Step 4: 커밋**

```bash
git add src/main.jsx src/worldmap.jsx
git commit -m "feat: derive time-of-day from clock, clear demo star data"
```

---

### Task 7: PWA (설치형 + 오프라인)

**Files:**
- Modify: `vite.config.js`, `package.json`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`

- [ ] **Step 1: vite-plugin-pwa 설치**

```bash
cd D:/DGLee/KidsWeb
npm install -D vite-plugin-pwa@0.20
```

- [ ] **Step 2: 앱 아이콘 준비**

`public/icons/` 폴더를 만들고 192×192, 512×512 PNG 아이콘을 넣는다. 임시로 단색 배경 + 🌈 또는 🐻 이모지를 렌더한 PNG를 써도 된다. (별도 디자인 아이콘이 없으면, 이 단계에서 단색 + 텍스트 아이콘을 생성해 넣고, 정식 아이콘은 후속 작업으로 남긴다.)

- [ ] **Step 3: vite.config.js 에 PWA 플러그인 추가**

`vite.config.js`를 다음으로 교체:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'KidsWeb — 곰곰이의 사계절 마을',
        short_name: 'KidsWeb',
        description: '만 3~5세 유아용 교육 놀이 앱',
        lang: 'ko',
        theme_color: '#FF6B6B',
        background_color: '#1c1b22',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
      },
    }),
  ],
  server: { port: 3000 },
})
```

- [ ] **Step 4: 빌드 + 오프라인 검증**

```bash
npm run build
npm run preview
```
- `dist/`에 `sw.js`, `manifest.webmanifest`가 생성됨.
- preview 서버 주소를 브라우저로 열고, 개발자도구 → Application → Service Workers 에 등록 확인.
- 네트워크를 Offline으로 바꾸고 새로고침 → 앱이 여전히 로드되는지 확인.
- 주소창의 설치 아이콘으로 앱 설치가 가능한지 확인.

- [ ] **Step 5: 커밋**

```bash
git add vite.config.js package.json package-lock.json public/
git commit -m "feat: add PWA support (installable, offline)"
```

---

### Task 8: 최종 점검 + 빌드

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 전체 플로우 수동 점검**

`npm run dev` 후 다음을 모두 확인:
1. 스플래시(1.5초) → 월드맵 홈.
2. 월드맵 좌우 자유 스크롤, 봄·여름·가을 + 하늘 요소(무지개·열기구·연·구름·낙엽 등) 정상.
3. 장소 터치(카드 어디든) 한 번 → 곰곰이가 일정 속도로 걸어가 진입.
4. 서브메뉴 → 활동 → 칭찬 화면 → 홈 복귀.
5. 별 획득·장소 진행도가 새로고침 후 유지.
6. 부모 설정에서 톤 A/B/C 전환 + 유지.
7. 창 크기 변경 시 1024×768 비율 유지하며 스케일.

- [ ] **Step 2: 프로덕션 빌드**

```bash
npm run build
```
Expected: `dist/` 생성, 에러 없음.

- [ ] **Step 3: 빌드 결과 점검**

```bash
npm run preview
```
preview 주소에서 Task 8 Step 1의 항목을 다시 한 번 확인.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "chore: KidsWeb productionization complete"
```

---

## Summary

완료 후 KidsWeb은:

| 항목 | 상태 |
|---|---|
| Vite 빌드 (브라우저 내 Babel 제거) | ✅ |
| ESM 모듈 구조 | ✅ |
| 1024×768 화면 맞춤 스케일 | ✅ |
| 설정·별·진행도 localStorage 영속화 | ✅ |
| 부모 설정 톤(A/B/C) 선택 | ✅ |
| 시간대 자동 적용 | ✅ |
| 설치형 PWA + 오프라인 | ✅ |
| 월드맵 + 서브메뉴 + 활동 게임 (sample2 자산 재사용) | ✅ |

**후속 작업:**
- 정식 앱 아이콘 디자인
- 음량·시간 제한 설정을 실제 동작과 연결 (현재 톤만 연결)
- 자유 색칠 갤러리 이미지 저장 (필요 시 IndexedDB/Dexie 도입)
- 효과음·음성(TTS) 에셋 추가
- Azure Static Web Apps 배포
