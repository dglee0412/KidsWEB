# KidsWeb Plan 1: Project Setup + Main Screen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a working Next.js app shell with splash screen, home screen (10 category grid), category sub-menus, result/praise screen, and local data persistence — the foundation for all future feature plans.

**Architecture:** Next.js App Router with dynamic `[category]` routing. Zustand for in-memory state, Dexie.js (IndexedDB) for persistence via a StorageService interface (swappable to Supabase in Phase 2). All interactive components are client components with Framer Motion animations. Content data separated from code in `lib/categories.ts`.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, Framer Motion, Zustand, Dexie.js, Vitest + React Testing Library

---

## File Structure

```
D:\DGLee\KidsWeb\
├── app/
│   ├── globals.css               Global styles + Tailwind theme (kid colors)
│   ├── layout.tsx                Root layout with providers
│   ├── page.tsx                  Home screen (splash overlay + category grid)
│   ├── [category]/
│   │   └── page.tsx              Dynamic sub-menu for all 10 categories
│   └── result/
│       └── page.tsx              Common result/praise screen
├── components/
│   ├── SplashOverlay.tsx         Full-screen splash (fades out after 1.5s)
│   ├── BackButton.tsx            64px round back button
│   ├── StarCounter.tsx           Star count badge
│   ├── CategoryCard.tsx          120x120 category icon card
│   ├── SubMenuCard.tsx           200x180 sub-feature card
│   ├── SubMenuPage.tsx           Shared sub-menu layout
│   ├── ResultScreen.tsx          Celebration + star reward
│   └── TimeBackground.tsx        Time-of-day gradient background
├── lib/
│   ├── types.ts                  Shared TypeScript types
│   ├── categories.ts             All 10 categories + sub-items data
│   ├── db.ts                     Dexie database schema
│   ├── storage.ts                StorageService interface + LocalStorageService
│   ├── store.ts                  Zustand app store
│   └── sounds.ts                 Audio playback utility
├── __tests__/
│   ├── lib/
│   │   ├── categories.test.ts
│   │   ├── storage.test.ts
│   │   └── store.test.ts
│   └── components/
│       ├── CategoryCard.test.tsx
│       └── SubMenuPage.test.tsx
├── public/
│   ├── audio/                    (empty, placeholder for future sound files)
│   └── images/                   (empty, placeholder for future images)
├── Doc/                          (existing planning documents)
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── vitest.config.ts
├── vitest.setup.ts
└── .gitignore
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `.gitignore`
- Create: `app/layout.tsx` (minimal)
- Create: `app/page.tsx` (minimal)
- Create: `app/globals.css` (minimal)

- [ ] **Step 1: Initialize package.json and install dependencies**

```bash
cd D:\DGLee\KidsWeb
npm init -y
npm install next@latest react@latest react-dom@latest typescript @types/react @types/react-dom @types/node
npm install tailwindcss @tailwindcss/postcss postcss
npm install zustand dexie framer-motion howler @types/howler
```

- [ ] **Step 2: Create configuration files**

`next.config.ts`:
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`postcss.config.mjs`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

`.gitignore`:
```
node_modules/
.next/
out/
*.tsbuildinfo
.env*.local
```

- [ ] **Step 3: Create minimal app files to verify dev server**

`app/globals.css`:
```css
@import "tailwindcss";
```

`app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KidsWeb',
  description: '유아용 교육 웹앱',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
```

`app/page.tsx`:
```tsx
export default function HomePage() {
  return <h1>KidsWeb</h1>
}
```

Add scripts to `package.json`:
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "test": "vitest"
  }
}
```

- [ ] **Step 4: Verify dev server starts**

```bash
cd D:\DGLee\KidsWeb
npm run dev
```

Expected: Server starts on http://localhost:3000, page shows "KidsWeb".

- [ ] **Step 5: Initialize git and commit**

```bash
cd D:\DGLee\KidsWeb
git init
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs .gitignore app/
git commit -m "feat: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Testing Infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Install test dependencies**

```bash
cd D:\DGLee\KidsWeb
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom fake-indexeddb
```

- [ ] **Step 2: Create vitest config**

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

`vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
```

- [ ] **Step 3: Create a smoke test to verify the setup**

`__tests__/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('test setup', () => {
  it('works', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 4: Run test**

```bash
npx vitest run
```

Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts vitest.setup.ts __tests__/ package.json package-lock.json
git commit -m "chore: add Vitest testing infrastructure"
```

---

### Task 3: Types, Category Data + Global Styles

**Files:**
- Create: `lib/types.ts`
- Create: `lib/categories.ts`
- Modify: `app/globals.css`
- Test: `__tests__/lib/categories.test.ts`

- [ ] **Step 1: Write failing test for categories data**

`__tests__/lib/categories.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { categories, getCategoryById } from '@/lib/categories'

describe('categories', () => {
  it('has exactly 10 categories', () => {
    expect(categories).toHaveLength(10)
  })

  it('every category has required fields', () => {
    for (const cat of categories) {
      expect(cat.id).toBeTruthy()
      expect(cat.name).toBeTruthy()
      expect(cat.icon).toBeTruthy()
      expect(cat.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(cat.items.length).toBeGreaterThan(0)
    }
  })

  it('getCategoryById returns correct category', () => {
    const coloring = getCategoryById('coloring')
    expect(coloring?.name).toBe('색칠놀이')
  })

  it('getCategoryById returns undefined for invalid id', () => {
    expect(getCategoryById('nonexistent')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/categories.test.ts
```

Expected: FAIL — module `@/lib/categories` not found.

- [ ] **Step 3: Create types and category data**

`lib/types.ts`:
```typescript
export interface SubMenuItem {
  id: string
  name: string
  icon: string
  description?: string
  implemented: boolean
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  items: SubMenuItem[]
}

export interface AppSettings {
  timeLimit: number
  volume: { bgm: number; sfx: number; voice: number }
  lockedCategories: string[]
}

export interface GalleryItem {
  id?: number
  imageBlob: Blob
  name: string
  createdAt: Date
}

export const DEFAULT_SETTINGS: AppSettings = {
  timeLimit: 0,
  volume: { bgm: 70, sfx: 90, voice: 100 },
  lockedCategories: [],
}
```

`lib/categories.ts`:
```typescript
import type { Category } from './types'

export const categories: Category[] = [
  {
    id: 'coloring',
    name: '색칠놀이',
    icon: '🎨',
    color: '#FF8A5C',
    items: [
      { id: 'free', name: '자유 색칠', icon: '🖌️', description: '배경 위에 자유롭게 그려요', implemented: false },
      { id: 'fill', name: '영역 색칠', icon: '🪣', description: '빈 칸을 색으로 채워요', implemented: false },
      { id: 'gallery', name: '내 갤러리', icon: '🖼️', description: '내 작품 모아보기', implemented: false },
    ],
  },
  {
    id: 'hangul',
    name: '한글학습',
    icon: '가',
    color: '#95E1D3',
    items: [
      { id: 'consonants', name: '자음 익히기', icon: 'ㄱ', implemented: false },
      { id: 'vowels', name: '모음 익히기', icon: 'ㅏ', implemented: false },
      { id: 'tracing', name: '따라쓰기', icon: '✏️', implemented: false },
      { id: 'combine', name: '글자 만들기', icon: '가', implemented: false },
      { id: 'words', name: '단어 맞추기', icon: '🍎', implemented: false },
      { id: 'cards', name: '단어 카드', icon: '🃏', implemented: false },
    ],
  },
  {
    id: 'english',
    name: '영어학습',
    icon: 'ABC',
    color: '#AA96DA',
    items: [
      { id: 'alphabet', name: '알파벳 익히기', icon: 'Aa', implemented: false },
      { id: 'tracing', name: '따라쓰기', icon: '✏️', implemented: false },
      { id: 'phonics', name: '파닉스', icon: '🔊', implemented: false },
      { id: 'words', name: '단어 맞추기', icon: '🖼️', implemented: false },
      { id: 'song', name: 'ABC 노래', icon: '🎵', implemented: false },
    ],
  },
  {
    id: 'math',
    name: '숫자/수학',
    icon: '123',
    color: '#FCF876',
    items: [
      { id: 'counting', name: '숫자 세기', icon: '🔢', implemented: false },
      { id: 'tracing', name: '숫자 따라쓰기', icon: '✏️', implemented: false },
      { id: 'compare', name: '크기 비교', icon: '⚖️', implemented: false },
      { id: 'sequence', name: '순서 맞추기', icon: '📊', implemented: false },
      { id: 'addition', name: '기초 덧셈', icon: '➕', implemented: false },
      { id: 'subtraction', name: '기초 뺄셈', icon: '➖', implemented: false },
    ],
  },
  {
    id: 'shapes',
    name: '도형/색깔',
    icon: '◆●▲',
    color: '#F38181',
    items: [
      { id: 'learn', name: '도형 학습', icon: '◆', implemented: false },
      { id: 'find', name: '같은 도형 찾기', icon: '🔍', implemented: false },
      { id: 'match', name: '도형 맞추기', icon: '🧩', implemented: false },
      { id: 'colors', name: '색깔 학습', icon: '🌈', implemented: false },
      { id: 'sort', name: '색깔 분류', icon: '📦', implemented: false },
      { id: 'pattern', name: '패턴 놀이', icon: '🔄', implemented: false },
    ],
  },
  {
    id: 'music',
    name: '음악',
    icon: '🎵',
    color: '#A8D8EA',
    items: [
      { id: 'piano', name: '피아노', icon: '🎹', implemented: false },
      { id: 'xylophone', name: '실로폰', icon: '🎵', implemented: false },
      { id: 'drum', name: '드럼', icon: '🥁', implemented: false },
      { id: 'follow', name: '따라치기', icon: '👆', implemented: false },
      { id: 'listen', name: '동요 감상', icon: '🎧', implemented: false },
      { id: 'rhythm', name: '리듬 게임', icon: '🎮', implemented: false },
    ],
  },
  {
    id: 'coding',
    name: '코딩놀이',
    icon: '🤖',
    color: '#98D6A6',
    items: [
      { id: 'direction', name: '방향 코딩', icon: '➡️', implemented: false },
      { id: 'move', name: '캐릭터 이동', icon: '🏃', implemented: false },
      { id: 'goal', name: '목표 도달', icon: '⭐', implemented: false },
      { id: 'repeat', name: '반복 블록', icon: '🔁', implemented: false },
    ],
  },
  {
    id: 'brain',
    name: '두뇌게임',
    icon: '🧩',
    color: '#DDA0DD',
    items: [
      { id: 'spot-diff', name: '틀린그림찾기', icon: '🔍', implemented: false },
      { id: 'memory', name: '카드 뒤집기', icon: '🃏', implemented: false },
      { id: 'puzzle', name: '퍼즐 맞추기', icon: '🧩', implemented: false },
      { id: 'maze', name: '미로찾기', icon: '🌀', implemented: false },
      { id: 'shadow', name: '그림자 맞추기', icon: '👤', implemented: false },
      { id: 'sequence', name: '순서 기억하기', icon: '💡', implemented: false },
    ],
  },
  {
    id: 'computer',
    name: '컴퓨터익히기',
    icon: '💻',
    color: '#87CEEB',
    items: [
      { id: 'touch', name: '터치 튜토리얼', icon: '👆', implemented: false },
      { id: 'keyboard', name: '가상 키보드', icon: '⌨️', implemented: false },
      { id: 'typing', name: '타자 연습', icon: '📝', implemented: false },
      { id: 'mouse', name: '마우스 연습', icon: '🖱️', implemented: false },
    ],
  },
  {
    id: 'social',
    name: '놀이마을',
    icon: '💬',
    color: '#FFDAC1',
    items: [
      { id: 'messenger', name: '메신저 놀이', icon: '💌', implemented: false },
      { id: 'photo', name: '사진 꾸미기', icon: '📸', implemented: false },
      { id: 'roleplay', name: '역할놀이', icon: '👩‍⚕️', implemented: false },
    ],
  },
]

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}

export function getAllCategoryIds(): string[] {
  return categories.map((c) => c.id)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/categories.test.ts
```

Expected: All 4 tests pass.

- [ ] **Step 5: Configure global styles with kid-friendly color system**

Replace `app/globals.css` with:
```css
@import "tailwindcss";

@theme inline {
  /* KidsWeb Color System (고채도 원색 - 유아 친화) */
  --color-kids-primary: #FF6B6B;
  --color-kids-secondary: #4ECDC4;
  --color-kids-accent: #FFE66D;
  --color-kids-bg: #F7F7F7;

  /* Category Colors */
  --color-kids-coloring: #FF8A5C;
  --color-kids-hangul: #95E1D3;
  --color-kids-english: #AA96DA;
  --color-kids-math: #FCF876;
  --color-kids-shapes: #F38181;
  --color-kids-music: #A8D8EA;
  --color-kids-coding: #98D6A6;
  --color-kids-brain: #DDA0DD;
  --color-kids-computer: #87CEEB;
  --color-kids-social: #FFDAC1;

  /* Time-of-day backgrounds */
  --color-sky-morning: #87CEEB;
  --color-sky-afternoon: #B0E0E6;
  --color-sky-evening: #FFDAB9;

  /* Font - system default for now */
  --font-sans: system-ui, -apple-system, sans-serif;
}

/* Global touch-friendly defaults */
* {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

body {
  overscroll-behavior: none;
  user-select: none;
  -webkit-user-select: none;
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/ __tests__/lib/categories.test.ts app/globals.css
git commit -m "feat: add types, category data, and kid-friendly color system"
```

---

### Task 4: Data Layer (StorageService)

**Files:**
- Create: `lib/db.ts`
- Create: `lib/storage.ts`
- Test: `__tests__/lib/storage.test.ts`

- [ ] **Step 1: Write failing tests for StorageService**

`__tests__/lib/storage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageService } from '@/lib/storage'
import type { AppSettings } from '@/lib/types'
import { DEFAULT_SETTINGS } from '@/lib/types'

describe('LocalStorageService', () => {
  let storage: LocalStorageService

  beforeEach(async () => {
    storage = new LocalStorageService()
    // Clear database before each test
    await storage.clear()
  })

  describe('stars', () => {
    it('returns 0 stars initially', async () => {
      const stars = await storage.getStars()
      expect(stars).toBe(0)
    })

    it('saves and loads stars', async () => {
      await storage.saveStars(15)
      const stars = await storage.getStars()
      expect(stars).toBe(15)
    })

    it('overwrites previous star count', async () => {
      await storage.saveStars(10)
      await storage.saveStars(25)
      const stars = await storage.getStars()
      expect(stars).toBe(25)
    })
  })

  describe('settings', () => {
    it('returns null when no settings saved', async () => {
      const settings = await storage.loadSettings()
      expect(settings).toBeNull()
    })

    it('saves and loads settings', async () => {
      const settings: AppSettings = {
        timeLimit: 20,
        volume: { bgm: 50, sfx: 80, voice: 100 },
        lockedCategories: ['music'],
      }
      await storage.saveSettings(settings)
      const loaded = await storage.loadSettings()
      expect(loaded).toEqual(settings)
    })
  })

  describe('progress', () => {
    it('returns null for unsaved category', async () => {
      const progress = await storage.loadProgress('hangul')
      expect(progress).toBeNull()
    })

    it('saves and loads progress per category', async () => {
      await storage.saveProgress('hangul', { level: 2, completed: ['ㄱ', 'ㄴ'] })
      await storage.saveProgress('math', { level: 1, completed: ['counting'] })

      const hangul = await storage.loadProgress('hangul')
      expect(hangul).toEqual({ level: 2, completed: ['ㄱ', 'ㄴ'] })

      const math = await storage.loadProgress('math')
      expect(math).toEqual({ level: 1, completed: ['counting'] })
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/storage.test.ts
```

Expected: FAIL — module `@/lib/storage` not found.

- [ ] **Step 3: Implement Dexie database and StorageService**

`lib/db.ts`:
```typescript
import Dexie, { type Table } from 'dexie'

export interface SettingsRecord {
  id: number
  data: string // JSON-serialized AppSettings
}

export interface ProgressRecord {
  categoryId: string
  data: string // JSON-serialized progress
}

export interface StarsRecord {
  id: number
  count: number
}

export interface GalleryRecord {
  id?: number
  imageBlob: Blob
  name: string
  createdAt: Date
}

export class KidsWebDB extends Dexie {
  settings!: Table<SettingsRecord>
  progress!: Table<ProgressRecord>
  stars!: Table<StarsRecord>
  gallery!: Table<GalleryRecord>

  constructor() {
    super('kidsweb')
    this.version(1).stores({
      settings: 'id',
      progress: 'categoryId',
      stars: 'id',
      gallery: '++id, createdAt',
    })
  }
}

export const db = new KidsWebDB()
```

`lib/storage.ts`:
```typescript
import type { AppSettings, GalleryItem } from './types'
import { db } from './db'

export interface StorageService {
  getStars(): Promise<number>
  saveStars(count: number): Promise<void>
  loadSettings(): Promise<AppSettings | null>
  saveSettings(settings: AppSettings): Promise<void>
  saveProgress(categoryId: string, data: Record<string, unknown>): Promise<void>
  loadProgress(categoryId: string): Promise<Record<string, unknown> | null>
  saveGalleryImage(image: Blob, name: string): Promise<number>
  loadGalleryImages(): Promise<GalleryItem[]>
  deleteGalleryImage(id: number): Promise<void>
  clear(): Promise<void>
}

export class LocalStorageService implements StorageService {
  async getStars(): Promise<number> {
    const record = await db.stars.get(1)
    return record?.count ?? 0
  }

  async saveStars(count: number): Promise<void> {
    await db.stars.put({ id: 1, count })
  }

  async loadSettings(): Promise<AppSettings | null> {
    const record = await db.settings.get(1)
    return record ? JSON.parse(record.data) : null
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await db.settings.put({ id: 1, data: JSON.stringify(settings) })
  }

  async saveProgress(categoryId: string, data: Record<string, unknown>): Promise<void> {
    await db.progress.put({ categoryId, data: JSON.stringify(data) })
  }

  async loadProgress(categoryId: string): Promise<Record<string, unknown> | null> {
    const record = await db.progress.get(categoryId)
    return record ? JSON.parse(record.data) : null
  }

  async saveGalleryImage(image: Blob, name: string): Promise<number> {
    return await db.gallery.add({ imageBlob: image, name, createdAt: new Date() })
  }

  async loadGalleryImages(): Promise<GalleryItem[]> {
    return await db.gallery.orderBy('createdAt').reverse().toArray()
  }

  async deleteGalleryImage(id: number): Promise<void> {
    await db.gallery.delete(id)
  }

  async clear(): Promise<void> {
    await db.stars.clear()
    await db.settings.clear()
    await db.progress.clear()
    await db.gallery.clear()
  }
}

let instance: StorageService | null = null

export function getStorageService(): StorageService {
  if (!instance) {
    instance = new LocalStorageService()
  }
  return instance
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/storage.test.ts
```

Expected: All 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts lib/storage.ts __tests__/lib/storage.test.ts
git commit -m "feat: add StorageService with Dexie.js (IndexedDB) implementation"
```

---

### Task 5: App Store (Zustand)

**Files:**
- Create: `lib/store.ts`
- Test: `__tests__/lib/store.test.ts`

- [ ] **Step 1: Write failing tests for app store**

`__tests__/lib/store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/lib/store'
import { LocalStorageService } from '@/lib/storage'

describe('useAppStore', () => {
  beforeEach(async () => {
    // Reset store between tests
    useAppStore.setState({
      stars: 0,
      isLoading: true,
      settings: {
        timeLimit: 0,
        volume: { bgm: 70, sfx: 90, voice: 100 },
        lockedCategories: [],
      },
    })
    const storage = new LocalStorageService()
    await storage.clear()
  })

  it('starts with 0 stars', () => {
    expect(useAppStore.getState().stars).toBe(0)
  })

  it('starts in loading state', () => {
    expect(useAppStore.getState().isLoading).toBe(true)
  })

  it('addStars increases star count', async () => {
    await useAppStore.getState().addStars(3)
    expect(useAppStore.getState().stars).toBe(3)
  })

  it('addStars accumulates', async () => {
    await useAppStore.getState().addStars(3)
    await useAppStore.getState().addStars(5)
    expect(useAppStore.getState().stars).toBe(8)
  })

  it('initialize loads persisted data', async () => {
    const storage = new LocalStorageService()
    await storage.saveStars(42)
    await storage.saveSettings({
      timeLimit: 20,
      volume: { bgm: 50, sfx: 80, voice: 100 },
      lockedCategories: ['music'],
    })

    await useAppStore.getState().initialize()

    expect(useAppStore.getState().stars).toBe(42)
    expect(useAppStore.getState().settings.timeLimit).toBe(20)
    expect(useAppStore.getState().isLoading).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/store.test.ts
```

Expected: FAIL — module `@/lib/store` not found.

- [ ] **Step 3: Implement Zustand store**

`lib/store.ts`:
```typescript
import { create } from 'zustand'
import type { AppSettings } from './types'
import { DEFAULT_SETTINGS } from './types'
import { getStorageService } from './storage'

interface AppState {
  stars: number
  isLoading: boolean
  settings: AppSettings

  initialize: () => Promise<void>
  addStars: (count: number) => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
  isCategoryLocked: (categoryId: string) => boolean
}

export const useAppStore = create<AppState>((set, get) => ({
  stars: 0,
  isLoading: true,
  settings: DEFAULT_SETTINGS,

  initialize: async () => {
    const storage = getStorageService()
    const [stars, settings] = await Promise.all([
      storage.getStars(),
      storage.loadSettings(),
    ])
    set({
      stars,
      settings: settings ?? DEFAULT_SETTINGS,
      isLoading: false,
    })
  },

  addStars: async (count: number) => {
    const newStars = get().stars + count
    set({ stars: newStars })
    const storage = getStorageService()
    await storage.saveStars(newStars)
  },

  updateSettings: async (partial: Partial<AppSettings>) => {
    const settings = { ...get().settings, ...partial }
    set({ settings })
    const storage = getStorageService()
    await storage.saveSettings(settings)
  },

  isCategoryLocked: (categoryId: string) => {
    return get().settings.lockedCategories.includes(categoryId)
  },
}))
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/store.test.ts
```

Expected: All 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/store.ts __tests__/lib/store.test.ts
git commit -m "feat: add Zustand app store with persistence"
```

---

### Task 6: Common UI Components

**Files:**
- Create: `components/BackButton.tsx`
- Create: `components/StarCounter.tsx`
- Create: `components/CategoryCard.tsx`
- Create: `components/SubMenuCard.tsx`
- Create: `components/SubMenuPage.tsx`
- Create: `components/TimeBackground.tsx`
- Create: `lib/sounds.ts`
- Test: `__tests__/components/CategoryCard.test.tsx`
- Test: `__tests__/components/SubMenuPage.test.tsx`

- [ ] **Step 1: Create sound utility**

`lib/sounds.ts`:
```typescript
'use client'

let Howl: typeof import('howler').Howl | null = null

const cache: Record<string, InstanceType<typeof import('howler').Howl>> = {}

async function ensureHowler() {
  if (!Howl) {
    const mod = await import('howler')
    Howl = mod.Howl
  }
  return Howl
}

export async function playSound(name: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const HowlClass = await ensureHowler()
    if (!cache[name]) {
      cache[name] = new HowlClass({ src: [`/audio/${name}.mp3`], volume: 0.8 })
    }
    cache[name].play()
  } catch {
    // Audio files may not exist yet in Phase 1 — silently skip
  }
}
```

- [ ] **Step 2: Create BackButton and StarCounter**

`components/BackButton.tsx`:
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export function BackButton() {
  const router = useRouter()

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={() => router.back()}
      className="w-16 h-16 rounded-full bg-white/80 shadow-lg flex items-center justify-center text-2xl backdrop-blur-sm"
      aria-label="뒤로가기"
    >
      ◀
    </motion.button>
  )
}
```

`components/StarCounter.tsx`:
```tsx
'use client'

import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'

export function StarCounter() {
  const stars = useAppStore((s) => s.stars)

  return (
    <motion.div
      className="flex items-center gap-1.5 bg-white/80 rounded-full px-4 py-2 shadow-md backdrop-blur-sm"
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-2xl">⭐</span>
      <span className="text-xl font-bold text-kids-primary">{stars}</span>
    </motion.div>
  )
}
```

- [ ] **Step 3: Create CategoryCard with test**

`__tests__/components/CategoryCard.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryCard } from '@/components/CategoryCard'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileTap, whileHover, ...rest } = props as Record<string, unknown>
      return <div {...rest}>{children}</div>
    },
  },
}))

describe('CategoryCard', () => {
  const defaultProps = {
    id: 'coloring',
    name: '색칠놀이',
    icon: '🎨',
    color: '#FF8A5C',
    locked: false,
  }

  it('renders category name and icon', () => {
    render(<CategoryCard {...defaultProps} />)
    expect(screen.getByText('색칠놀이')).toBeInTheDocument()
    expect(screen.getByText('🎨')).toBeInTheDocument()
  })

  it('shows lock icon when locked', () => {
    render(<CategoryCard {...defaultProps} locked={true} />)
    expect(screen.getByText('🔒')).toBeInTheDocument()
  })

  it('links to category page when not locked', () => {
    render(<CategoryCard {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/coloring')
  })
})
```

`components/CategoryCard.tsx`:
```tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface CategoryCardProps {
  id: string
  name: string
  icon: string
  color: string
  locked?: boolean
}

export function CategoryCard({ id, name, icon, color, locked }: CategoryCardProps) {
  if (locked) {
    return (
      <div className="w-[120px] h-[120px] rounded-2xl bg-gray-300/60 flex flex-col items-center justify-center shadow-md">
        <span className="text-3xl opacity-50">🔒</span>
        <span className="text-xs font-bold text-gray-500 mt-1">{name}</span>
      </div>
    )
  }

  return (
    <Link href={`/${id}`}>
      <motion.div
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        className="w-[120px] h-[120px] rounded-2xl shadow-lg flex flex-col items-center justify-center cursor-pointer"
        style={{ backgroundColor: color }}
      >
        <span className="text-4xl drop-shadow-sm">{icon}</span>
        <span className="text-sm font-bold text-white mt-1 drop-shadow-sm">{name}</span>
      </motion.div>
    </Link>
  )
}
```

- [ ] **Step 4: Run CategoryCard test**

```bash
npx vitest run __tests__/components/CategoryCard.test.tsx
```

Expected: All 3 tests pass.

- [ ] **Step 5: Create SubMenuCard and SubMenuPage with test**

`components/SubMenuCard.tsx`:
```tsx
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface SubMenuCardProps {
  name: string
  icon: string
  description?: string
  implemented: boolean
  onClick: () => void
}

export function SubMenuCard({ name, icon, description, implemented, onClick }: SubMenuCardProps) {
  const [showToast, setShowToast] = useState(false)

  function handleClick() {
    if (!implemented) {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 1500)
      return
    }
    onClick()
  }

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        onClick={handleClick}
        className={`w-[200px] h-[180px] rounded-3xl shadow-lg flex flex-col items-center justify-center gap-2 ${
          implemented ? 'bg-white' : 'bg-white/60'
        }`}
      >
        <span className="text-5xl">{icon}</span>
        <span className="text-lg font-bold text-gray-700">{name}</span>
        {description && (
          <span className="text-xs text-gray-400 px-2 text-center">{description}</span>
        )}
        {!implemented && (
          <span className="text-xs text-gray-400">준비 중</span>
        )}
      </motion.button>

      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full whitespace-nowrap"
        >
          곧 만나요! 🚧
        </motion.div>
      )}
    </div>
  )
}
```

`components/SubMenuPage.tsx`:
```tsx
'use client'

import { useRouter } from 'next/navigation'
import type { Category } from '@/lib/types'
import { BackButton } from './BackButton'
import { StarCounter } from './StarCounter'
import { SubMenuCard } from './SubMenuCard'

interface SubMenuPageProps {
  category: Category
}

export function SubMenuPage({ category }: SubMenuPageProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-kids-bg">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <BackButton />
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.icon}</span>
          <h1 className="text-2xl font-bold text-gray-700">{category.name}</h1>
        </div>
        <StarCounter />
      </div>

      {/* Sub-menu Grid */}
      <div className="flex flex-wrap justify-center gap-6 px-6 py-8">
        {category.items.map((item) => (
          <SubMenuCard
            key={item.id}
            name={item.name}
            icon={item.icon}
            description={item.description}
            implemented={item.implemented}
            onClick={() => router.push(`/${category.id}/${item.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
```

`__tests__/components/SubMenuPage.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SubMenuPage } from '@/components/SubMenuPage'
import type { Category } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileTap, whileHover, ...rest } = props as Record<string, unknown>
      return <button {...rest}>{children}</button>
    },
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileTap, whileHover, initial, animate, exit, ...rest } = props as Record<string, unknown>
      return <div {...rest}>{children}</div>
    },
  },
}))

vi.mock('@/lib/store', () => ({
  useAppStore: (selector: (s: { stars: number }) => number) => selector({ stars: 10 }),
}))

const mockCategory: Category = {
  id: 'coloring',
  name: '색칠놀이',
  icon: '🎨',
  color: '#FF8A5C',
  items: [
    { id: 'free', name: '자유 색칠', icon: '🖌️', implemented: false },
    { id: 'fill', name: '영역 색칠', icon: '🪣', implemented: false },
  ],
}

describe('SubMenuPage', () => {
  it('renders category title', () => {
    render(<SubMenuPage category={mockCategory} />)
    expect(screen.getByText('색칠놀이')).toBeInTheDocument()
  })

  it('renders all sub-menu items', () => {
    render(<SubMenuPage category={mockCategory} />)
    expect(screen.getByText('자유 색칠')).toBeInTheDocument()
    expect(screen.getByText('영역 색칠')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run SubMenuPage test**

```bash
npx vitest run __tests__/components/SubMenuPage.test.tsx
```

Expected: All 2 tests pass.

- [ ] **Step 7: Create TimeBackground component**

`components/TimeBackground.tsx`:
```tsx
'use client'

import { useMemo } from 'react'

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

const gradients = {
  morning: 'from-sky-morning via-blue-100 to-sky-100',
  afternoon: 'from-sky-afternoon via-cyan-50 to-blue-50',
  evening: 'from-sky-evening via-orange-100 to-amber-50',
}

export function TimeBackground({ children }: { children: React.ReactNode }) {
  const timeOfDay = useMemo(() => getTimeOfDay(), [])

  return (
    <div className={`min-h-screen bg-gradient-to-b ${gradients[timeOfDay]}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add components/ lib/sounds.ts __tests__/components/
git commit -m "feat: add common UI components (BackButton, StarCounter, CategoryCard, SubMenu, TimeBackground)"
```

---

### Task 7: App Layout + Splash Screen

**Files:**
- Create: `components/SplashOverlay.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create SplashOverlay component**

`components/SplashOverlay.tsx`:
```tsx
'use client'

import { motion } from 'framer-motion'

export function SplashOverlay() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-sky-200 to-purple-100"
    >
      {/* Logo area */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="text-6xl">🌈</span>
      </motion.div>

      <h1 className="text-4xl font-bold text-kids-primary mt-4 drop-shadow-md">
        KidsWeb
      </h1>

      {/* Loading spinner — rotating star */}
      <motion.div
        className="mt-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <span className="text-3xl">⭐</span>
      </motion.div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Update root layout with store initialization**

Replace `app/layout.tsx` with:
```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KidsWeb - 유아용 교육 웹앱',
  description: '만 3~5세 유아가 터치로 놀면서 배우는 교육 웹앱',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased overflow-x-hidden">{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/SplashOverlay.tsx app/layout.tsx
git commit -m "feat: add SplashOverlay and update root layout with viewport config"
```

---

### Task 8: Home Screen

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement the home screen with splash, character, and category grid**

Replace `app/page.tsx` with:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SplashOverlay } from '@/components/SplashOverlay'
import { CategoryCard } from '@/components/CategoryCard'
import { StarCounter } from '@/components/StarCounter'
import { TimeBackground } from '@/components/TimeBackground'
import { categories } from '@/lib/categories'
import { useAppStore } from '@/lib/store'

const greetings = [
  '안녕! 오늘은 뭐 하고 놀까?',
  '어서 와! 같이 놀자!',
  '오늘도 재미있게 놀아볼까?',
  '반가워! 뭐 하고 싶어?',
]

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true)
  const [greeting, setGreeting] = useState('')
  const { initialize, isCategoryLocked } = useAppStore()

  useEffect(() => {
    initialize()
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)])
    const timer = setTimeout(() => setShowSplash(false), 1500)
    return () => clearTimeout(timer)
  }, [initialize])

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashOverlay />}
      </AnimatePresence>

      <TimeBackground>
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">☁</span>
            <span className="text-sm text-gray-400">☁</span>
          </div>
          <h1 className="text-2xl font-bold text-kids-primary drop-shadow-sm">KidsWeb</h1>
          <div className="flex items-center gap-3">
            <StarCounter />
            <button
              className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-lg shadow"
              aria-label="부모 설정"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Character Greeting */}
        <div className="flex flex-col items-center py-4">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl"
          >
            🐻
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 bg-white/80 rounded-2xl px-6 py-3 shadow-md max-w-xs"
          >
            <p className="text-lg text-gray-700 text-center font-medium">{greeting}</p>
          </motion.div>
        </div>

        {/* Category Grid */}
        <div className="flex flex-wrap justify-center gap-4 px-4 py-6 max-w-3xl mx-auto">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <CategoryCard
                id={cat.id}
                name={cat.name}
                icon={cat.icon}
                color={cat.color}
                locked={isCategoryLocked(cat.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom Decoration */}
        <div className="fixed bottom-0 left-0 right-0 h-16 flex items-end justify-center gap-4 text-2xl pointer-events-none opacity-60">
          <span>🌿</span>
          <span>🌸</span>
          <span>🏠</span>
          <span>🌼</span>
          <span>🌿</span>
        </div>
      </TimeBackground>
    </>
  )
}
```

- [ ] **Step 2: Verify dev server shows the home screen**

```bash
npm run dev
```

Open http://localhost:3000. Expected:
1. Splash screen appears with rainbow + rotating star (1.5s)
2. Splash fades out revealing the home screen
3. Bear character with speech bubble greeting
4. 10 category cards in a grid with distinct colors
5. Star counter showing 0
6. Time-based gradient background
7. Bottom decoration (plants/flowers)

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: implement home screen with splash, greeting, and category grid"
```

---

### Task 9: Category Sub-menu (Dynamic Route)

**Files:**
- Create: `app/[category]/page.tsx`

- [ ] **Step 1: Create the dynamic category sub-menu page**

`app/[category]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { getCategoryById, getAllCategoryIds } from '@/lib/categories'
import { SubMenuPage } from '@/components/SubMenuPage'

export function generateStaticParams() {
  return getAllCategoryIds().map((id) => ({ category: id }))
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: categoryId } = await params
  const category = getCategoryById(categoryId)

  if (!category) {
    notFound()
  }

  return <SubMenuPage category={category} />
}
```

- [ ] **Step 2: Verify navigation works**

```bash
npm run dev
```

Test in browser:
1. Click "색칠놀이" card → navigates to `/coloring` sub-menu
2. Sub-menu shows "자유 색칠", "영역 색칠", "내 갤러리" cards
3. Click sub-menu item → shows "곧 만나요! 🚧" toast (since `implemented: false`)
4. Click back button → returns to home
5. Try `/hangul`, `/math`, etc. — all show correct sub-menus
6. Try `/nonexistent` → shows 404

- [ ] **Step 3: Commit**

```bash
git add app/\[category\]/page.tsx
git commit -m "feat: add dynamic category sub-menu routing for all 10 categories"
```

---

### Task 10: Result Screen + Final Verification

**Files:**
- Create: `components/ResultScreen.tsx`
- Create: `app/result/page.tsx`

- [ ] **Step 1: Create ResultScreen component**

`components/ResultScreen.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'

const praises = ['잘했어!', '대단해!', '멋지다!', '최고야!', '훌륭해!']

export function ResultScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const addStars = useAppStore((s) => s.addStars)
  const [praised, setPraised] = useState('')

  const earnedStars = Number(searchParams.get('stars') ?? 1)
  const from = searchParams.get('from') ?? '/'

  useEffect(() => {
    setPraised(praises[Math.floor(Math.random() * praises.length)])
    addStars(earnedStars)
  }, [earnedStars, addStars])

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-50 flex flex-col items-center justify-center gap-6">
      {/* Stars */}
      <div className="flex gap-2">
        {Array.from({ length: earnedStars }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.2 * i, type: 'spring' }}
            className="text-5xl"
          >
            ⭐
          </motion.span>
        ))}
      </div>

      {/* Praise */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-kids-primary">
          🎉 {praised} 🎉
        </h1>
      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-white/80 rounded-3xl px-8 py-6 shadow-lg text-center"
      >
        <p className="text-lg text-gray-600">오늘 받은 별: {earnedStars}개</p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex gap-4 mt-4"
      >
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => router.push('/')}
          className="flex flex-col items-center gap-2 bg-white rounded-2xl px-8 py-4 shadow-md"
        >
          <span className="text-3xl">🏠</span>
          <span className="text-sm font-bold text-gray-600">홈으로</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => router.push(from)}
          className="flex flex-col items-center gap-2 bg-white rounded-2xl px-8 py-4 shadow-md"
        >
          <span className="text-3xl">🔄</span>
          <span className="text-sm font-bold text-gray-600">다시하기</span>
        </motion.button>
      </motion.div>

      {/* Confetti particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{
              opacity: 1,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
              y: -20,
            }}
            animate={{
              y: (typeof window !== 'undefined' ? window.innerHeight : 600) + 20,
              rotate: Math.random() * 720,
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 1.5,
              ease: 'easeIn',
            }}
            className="absolute text-2xl"
          >
            {['🎊', '🎉', '✨', '🌟', '💫'][i % 5]}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create result page route**

`app/result/page.tsx`:
```tsx
import { Suspense } from 'react'
import { ResultScreen } from '@/components/ResultScreen'

export default function ResultPage() {
  return (
    <Suspense>
      <ResultScreen />
    </Suspense>
  )
}
```

(Suspense is needed because `ResultScreen` uses `useSearchParams`.)

- [ ] **Step 3: Verify result screen**

Open http://localhost:3000/result?stars=3&from=/coloring in browser. Expected:
1. 3 stars animate in with spring physics
2. Random praise text ("잘했어!" etc.)
3. Confetti particles fall from top
4. "홈으로" and "다시하기" buttons work
5. Star counter in store updates

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (smoke + categories + storage + store + CategoryCard + SubMenuPage).

- [ ] **Step 5: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors. All 10 category routes statically generated.

- [ ] **Step 6: Delete smoke test (no longer needed)**

```bash
rm __tests__/smoke.test.ts
```

- [ ] **Step 7: Final commit**

```bash
git add components/ResultScreen.tsx app/result/ __tests__/
git commit -m "feat: add result/praise screen with confetti and star rewards"
```

---

## Summary

After completing all 10 tasks, the app has:

| Feature | Status |
|---------|--------|
| Next.js + TypeScript + Tailwind | ✅ |
| Kid-friendly color system (14 colors) | ✅ |
| IndexedDB persistence (Dexie.js) | ✅ |
| StorageService interface (Phase 2 ready) | ✅ |
| Zustand store (stars, settings) | ✅ |
| Splash screen (1.5s fade-out) | ✅ |
| Home screen (character + 10 category grid) | ✅ |
| Category sub-menus (dynamic routing) | ✅ |
| Result/praise screen (confetti + stars) | ✅ |
| Touch-optimized (64px targets, animations) | ✅ |
| Time-based background | ✅ |
| Sound system infrastructure | ✅ |
| Test suite (Vitest) | ✅ |

**Next Plan:** Plan 2 — 색칠놀이 (자유 색칠 + 영역 색칠) — the core differentiating feature.
