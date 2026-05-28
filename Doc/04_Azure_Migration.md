# KidsWeb — Azure + PostgreSQL 아키텍처 기획서

> 본 문서는 [01_기획서.md](./01_기획서.md)의 **7. 기술 스택** / **8. 아키텍처 전략** 절을
> **Microsoft Azure + Azure Database for PostgreSQL** 기준으로 재정의한 것이다.
> 기능 요구사항(1~6장)과 MVP 우선순위(9장)는 변경 없음.

---

## 0. 변경 요약 (TL;DR)

| 레이어 | 기존(Vercel+Supabase) | 변경(Azure+PostgreSQL) |
|--------|----------------------|------------------------|
| 프론트 호스팅 | Vercel | **Azure Static Web Apps** |
| 백엔드 API | Vercel API Routes (Node.js) | **Azure Functions** (SWA에 통합) |
| 데이터베이스 | Supabase DB (관리형 Postgres) | **Azure Database for PostgreSQL — Flexible Server** |
| 인증 | Supabase Auth | **Azure AD B2C** (Kakao는 OIDC 커스텀 IdP) |
| 파일 저장 | Supabase Storage | **Azure Blob Storage** |
| 실시간 | Supabase Realtime | **Azure Web PubSub** (Phase 3에서 필요 시) |
| CDN | Vercel Edge | **Azure Front Door / SWA 내장 CDN** |
| 시크릿 관리 | Vercel Env Vars | **Azure Key Vault** + SWA App Settings |
| 모니터링 | Vercel Analytics | **Application Insights** |

> 데이터 레이어 추상화(StorageService 인터페이스) 설계 원칙은 그대로 유지되므로,
> 앱 코드 측면의 변경은 어댑터 1개(`AzureStorageService`) 교체로 끝난다.

---

## 1. 기술 스택 (변경판)

| 레이어 | 기술 | 비고 |
|--------|------|------|
| 프레임워크 | Next.js (React) + TypeScript | 동일 |
| 스타일링 | Tailwind CSS | 동일 |
| 캔버스 (색칠) | HTML5 Canvas API | 동일 |
| 도안 (영역 색칠) | SVG path | 동일 |
| 오디오 | Howler.js / Web Audio API | 동일 |
| 애니메이션 | Framer Motion + Lottie | 동일 |
| 상태관리 | Zustand | 동일 |
| 오프라인 | next-pwa (Service Worker) | 동일 |
| 저장 (Phase 1) | IndexedDB (Dexie.js) | 동일 — 로컬 전용 |
| **저장 (Phase 2~)** | **Azure Postgres + Azure Blob Storage** | 변경 |
| **인증 (Phase 2~)** | **Azure AD B2C** | 변경 |
| **호스팅** | **Azure Static Web Apps + Azure Functions** | 변경 |
| **모니터링** | **Application Insights** | 신규 |
| **시크릿** | **Azure Key Vault** | 신규 |
| **CI/CD** | **GitHub Actions** (SWA가 자동 구성) | 변경 |
| **PostgreSQL 클라이언트** | `pg` / `prisma` / `drizzle-orm` 택1 | 신규 |

> Next.js를 그대로 쓸 경우, **Static Web Apps의 "Next.js (Hybrid)" 모드** 또는
> Azure App Service(Linux/Node 20) 배포 둘 다 가능.
> 본 기획서는 **SWA Hybrid 우선**, App Service는 폴백으로 둔다.

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                Azure Static Web Apps                         │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  프론트엔드 (Next.js) │    │  Azure Functions (API)   │   │
│  │  - 화면 렌더링        │    │  - 결제 처리              │   │
│  │  - 캔버스/색칠        │ ──→│  - 결제 웹훅              │   │
│  │  - PWA / Service W.   │    │  - 학습 리포트 집계       │   │
│  └──────────────────────┘    └──────────┬───────────────┘   │
│             │                            │                   │
│             │                  ┌─────────┴────────┐          │
│             │                  │  Application      │          │
│             │                  │  Insights         │          │
│             │                  └──────────────────┘          │
└─────────────┼─────────────────────────────┼──────────────────┘
              │ Managed Identity            │
              │                             │
              ▼                             ▼
   ┌──────────────────────┐    ┌──────────────────────────┐
   │  Azure AD B2C        │    │  Azure Database for      │
   │  (소셜 로그인)        │    │  PostgreSQL              │
   │  - Google            │    │  Flexible Server          │
   │  - Microsoft         │    │  - kw_user, kw_progress  │
   │  - Kakao(OIDC 커스텀) │    │  - kw_gallery_meta       │
   │  - Email/Password    │    │  - kw_payment            │
   └──────────────────────┘    └──────────────────────────┘
                                          │
                                          │ Private Endpoint (권장)
                                          ▼
                               ┌──────────────────────────┐
                               │  Azure Blob Storage      │
                               │  - 갤러리 PNG            │
                               │  - 도안 SVG / 음원       │
                               │  + Azure CDN (선택)      │
                               └──────────────────────────┘

                  ─── Phase 3+ ───
                  ┌──────────────────────────┐
                  │  Azure Web PubSub        │
                  │  (실시간 동기화 필요 시)  │
                  └──────────────────────────┘
```

---

## 3. 서비스별 역할 분담

| 기능 | 담당 | 비고 |
|------|------|------|
| 화면 표시 | SWA (Next.js) | Edge에서 정적/SSR 혼합 |
| 로그인/회원가입 | Azure AD B2C | Kakao 연동은 OIDC 커스텀 IdP 설정 필요 |
| 학습 진행률 저장 | Azure Postgres | Functions 경유, Managed Identity로 접근 |
| 갤러리 이미지 저장 | Azure Blob Storage | SAS Token 발급 → 프론트 직접 업로드 |
| 결제 처리 | Azure Functions | 시크릿은 Key Vault에서 로드 |
| 결제 완료 웹훅 | Azure Functions (Webhook) | HTTPS + Function Key 검증 |
| 부모 리포트 생성 | Azure Functions (Timer/HTTP) | Postgres 집계 쿼리 |
| 콘텐츠 관리 (도안/문제) | Postgres + Blob | 메타는 DB, 파일은 Blob |
| 모니터링/로그 | Application Insights | Functions·SWA 자동 연동 |

---

## 4. 프로젝트 폴더 구조

```
KidsWeb/
├── app/                              ← 프론트엔드 (Next.js App Router)
│   ├── page.tsx
│   ├── coloring/
│   │   ├── free/page.tsx
│   │   └── fill/page.tsx
│   ├── hangul/page.tsx
│   ├── math/page.tsx
│   ├── music/page.tsx
│   └── coding/page.tsx
│
├── api/                              ← Azure Functions (SWA의 /api 매핑)
│   ├── payment/
│   │   ├── function.json
│   │   └── index.ts
│   ├── webhook/
│   │   ├── function.json
│   │   └── index.ts
│   └── report/
│       ├── function.json
│       └── index.ts
│
├── lib/
│   ├── azure/
│   │   ├── postgres.ts               ← pg / drizzle 연결 (Managed Identity)
│   │   ├── blob.ts                   ← @azure/storage-blob, SAS 발급
│   │   ├── adb2c.ts                  ← MSAL 클라이언트
│   │   └── insights.ts               ← Application Insights 초기화
│   └── storage.ts                    ← StorageService 인터페이스 (어댑터 패턴)
│
├── infra/                            ← IaC (선택, Bicep 또는 Terraform)
│   ├── main.bicep                    ← SWA + Functions + Postgres + Blob + KV
│   └── parameters.json
│
├── staticwebapp.config.json          ← SWA 라우팅/인증 규칙
├── next.config.js
└── .github/workflows/
    └── azure-static-web-apps.yml     ← SWA 자동 생성
```

---

## 5. 데이터 레이어 추상화 (변경 없음 — 어댑터만 교체)

```ts
// 인터페이스 (변하지 않음)
interface StorageService {
  saveProgress(data: Progress): Promise<void>
  loadProgress(): Promise<Progress>
  saveGalleryImage(image: Blob): Promise<string>   // URL 반환
  loadGalleryImages(): Promise<GalleryItem[]>
}

// Phase 1
class LocalStorageService implements StorageService { /* IndexedDB */ }

// Phase 2 — Azure 어댑터 (신규)
class AzureStorageService implements StorageService {
  // saveProgress  → POST /api/progress  → Functions → Postgres INSERT/UPDATE
  // saveGalleryImage → /api/upload-token으로 SAS 받기 → 프론트가 Blob 직접 PUT → URL 반환
  // loadGalleryImages → GET /api/gallery → Functions → Postgres + Blob URL 조합
}
```

> 기존 설계에서 클래스 이름과 SDK 의존성만 바뀐다.
> 앱 코드(useGallery, useProgress 등)는 인터페이스만 보므로 무변경.

---

## 6. 인증 — Azure AD B2C 가이드

### 6.1 기본 제공 IdP
- **Microsoft Account, Google, Facebook, Apple, Email/Password** → B2C 포털에서 클릭으로 연결

### 6.2 Kakao 연동
- B2C는 Kakao를 "기본 제공"하지 않음 → **OIDC 커스텀 ID Provider** 로 추가
- 필요한 것:
  - Kakao Developers에서 OIDC 클라이언트 등록 (Redirect URI: B2C 테넌트의 콜백)
  - B2C → Identity providers → "OpenID Connect" → metadata URL 입력
  - 사용자 흐름(User Flow) 또는 커스텀 정책에 Kakao IdP 추가

> 카카오 사용자가 한국 KidsWeb의 주요 타겟이라면, Phase 2에서 **B2C 커스텀 정책**으로
> Kakao를 정식 IdP로 등록할 것을 권장. (10~20시간 분량의 초기 설정)

### 6.3 SWA 통합
- SWA `staticwebapp.config.json`에서 `auth` 섹션에 **AAD B2C 커스텀 IdP** 등록
- 또는 프론트에서 직접 MSAL.js로 토큰 획득 후 Functions에 `Authorization: Bearer` 전달

---

## 7. Phase별 로드맵 (변경판)

```
Phase 1 (현재)              Phase 2 (검증)              Phase 3 (상용화)
────────────────           ──────────────────         ──────────────────
내 아이용 MVP               지인/커뮤니티 공개          정식 출시

[인프라]                    [인프라]                    [인프라]
SWA Free 또는               SWA Free                    SWA Standard
로컬 dev 서버               + AD B2C (무료 5만 MAU)     + Postgres GP D2s
정적 호스팅                 + Postgres Burstable B1ms   + Blob Hot + CDN
로컬 데이터(IndexedDB)      + Blob Storage Hot          + Key Vault
                            + App Insights              + Front Door (WAF)
                            + Key Vault                 + Web PubSub (선택)

[기능]                      [기능]                      [기능]
메인화면 + 색칠놀이          콘텐츠 보강                 프리미엄 구독
한글/수학/두뇌/음악/코딩     사용자 피드백 반영           부모 대시보드
                            학습 리포트 기초             푸시 알림(WebPush+ANS)
                                                        매월 콘텐츠 업데이트

[비용 — 후술]               [비용]                      [비용]
₩0                          ₩2만~3만/월                 ₩7만~30만/월
```

---

## 8. 비용 예측 (Azure)

> Azure 한국 중부(Korea Central) 리전, 2026년 1월 시점 기준 추정치.
> 정확한 가격은 [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)에서 산정.

| 사용자 규모 | SWA | Postgres | Blob/CDN | AD B2C | App Insights | 합계 (월) |
|------------|-----|----------|----------|--------|--------------|----------|
| 1명 (내 아이) | Free | 미사용 | 미사용 | 미사용 | Free 5GB | **₩0** |
| ~100명 (베타) | Free | B1ms ~$13 | ~$1 | 무료 | Free 5GB | **약 ₩2만** |
| ~1,000명 (초기) | Free | B1ms ~$13 | ~$3 | 무료 | Free 5GB | **약 ₩2.5만** |
| ~10,000명 (성장) | Standard $9 | B2s ~$30 | ~$10 | 무료 | $5 | **약 ₩7만** |
| ~100,000명 (확장) | Standard $9 | GP D2s_v3 ~$120 | $40 + CDN $30 | ~$30 | $20 | **약 ₩35만** |

### 비교: Supabase 대비
- 1,000명 규모까지는 거의 동일(Supabase 무료 vs Azure 약 ₩2.5만)
- 10,000명 규모: Supabase $25/월 vs Azure ~$50/월 → **Azure가 약 2배**
- 100,000명 규모: Supabase Pro $599/월 vs Azure ~$240/월 → **Azure가 더 저렴**

> 즉, **초중기에는 Azure가 약간 비싸지만 확장 시 역전**되는 구조.
> 무료 Azure 크레딧(Pay-As-You-Go $200, 학생/스타트업 등)이 있다면 Phase 2까지는 사실상 무료.

---

## 9. 마이그레이션 체크리스트 (Phase 2 진입 시)

### 9.1 Azure 리소스 프로비저닝
- [ ] 리소스 그룹 `rg-kidsweb-prod` 생성 (Korea Central)
- [ ] **Static Web Apps** 생성 → GitHub 저장소 연동 (자동 워크플로 생성)
- [ ] **Azure Database for PostgreSQL — Flexible Server** B1ms 생성
  - [ ] `kidsweb` 데이터베이스 생성
  - [ ] 방화벽 규칙 또는 Private Endpoint 설정
  - [ ] **Microsoft Entra 인증 활성화** (Managed Identity 사용을 위해)
- [ ] **Storage Account** 생성 → `gallery` 컨테이너 (Private)
- [ ] **Azure AD B2C 테넌트** 생성 → 사용자 흐름 정의
- [ ] **Key Vault** 생성 → 카카오/결제 시크릿 보관
- [ ] **Application Insights** 생성 → SWA·Functions에 연결

### 9.2 코드/설정
- [ ] `lib/azure/postgres.ts`, `lib/azure/blob.ts` 구현
- [ ] `AzureStorageService` 어댑터 구현 + 로컬과 토글 가능하게
- [ ] Functions에 **Managed Identity** 부여 → Postgres·Blob·KV 접근 권한 부여
- [ ] `staticwebapp.config.json`에 인증·라우팅 규칙 작성
- [ ] DB 스키마 마이그레이션 도구 도입 (drizzle-kit / prisma migrate)
- [ ] App Insights SDK 프론트(브라우저)·Functions 양쪽 초기화

### 9.3 DB 초기 스키마 (예시)

```sql
CREATE TABLE kw_user (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  b2c_object_id TEXT UNIQUE NOT NULL,   -- AD B2C oid
  display_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kw_progress (
  user_id   UUID REFERENCES kw_user(id) ON DELETE CASCADE,
  category  TEXT NOT NULL,             -- 'color' | 'hangul' | 'math' | ...
  sub_id    TEXT,
  stars     INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category, sub_id)
);

CREATE TABLE kw_gallery (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES kw_user(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,            -- 'free' | 'fill'
  blob_url   TEXT NOT NULL,
  meta       JSONB,                    -- fills, tplId 등 fill 메타
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gallery_user_created ON kw_gallery (user_id, created_at DESC);

CREATE TABLE kw_payment (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES kw_user(id),
  amount      INT NOT NULL,
  status      TEXT NOT NULL,           -- 'pending' | 'paid' | 'failed'
  provider    TEXT NOT NULL,           -- 'toss' | 'kakao' | ...
  ext_tx_id   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 10. Vercel/Supabase 대비 주의점

| 항목 | 변화 |
|------|------|
| **콜드 스타트** | Azure Functions Consumption 플랜은 콜드 스타트(~1-2s) 존재. 결제·웹훅은 Premium 플랜 고려. |
| **Postgres 연결 풀** | Postgres Flexible Server는 PgBouncer 내장(2024+). Functions에서는 반드시 풀러 경유. |
| **이미지 업로드** | Supabase Storage는 SDK가 직접 업로드. Azure Blob은 **SAS Token 발급 → 브라우저 직접 업로드** 패턴 사용 권장. |
| **Realtime** | Supabase Realtime은 Postgres LISTEN/NOTIFY 자동 연결. Azure는 Web PubSub로 직접 구현 필요. |
| **Edge** | Vercel은 글로벌 Edge 기본. SWA도 글로벌 CDN 내장(Standard 이상)이지만 SSR은 단일 리전. |
| **로컬 개발** | `swa start` CLI로 SWA + Functions 통합 에뮬레이션 가능. Postgres는 Docker로. |
| **Kakao 로그인** | Supabase Auth는 Kakao 클릭으로 지원. B2C는 OIDC 커스텀 IdP 직접 구성 필요. |

---

## 11. 결정 필요 항목 (사용자 확인 사항)

1. **호스팅 형태**: SWA Hybrid(권장) vs App Service(Next.js 전체 SSR을 풀로 쓰고 싶을 때)
2. **인증 범위**: Phase 2부터 Azure AD B2C 도입 vs Phase 3까지 로컬만 사용
3. **Kakao 로그인 필요 시점**: Phase 2 vs Phase 3
4. **리전**: Korea Central(권장, 지연 ↓) vs Japan East(가용성·SKU 더 다양)
5. **IaC 도입 여부**: Bicep/Terraform으로 자동화할지, 포털 수동 생성할지

---

## 12. 변경 영향 — 기존 기획서

본 문서 채택 시 [01_기획서.md](./01_기획서.md)에서 다음을 갱신해야 함:

- 7장 **기술 스택**: 저장(Phase 2~) / 호스팅 행 교체
- 8.1 **전체 구조** 다이어그램: Vercel+Supabase → Azure SWA+Postgres 다이어그램으로 교체
- 8.2 **역할 분담** 표: 본 문서 §3으로 교체
- 8.3 **폴더 구조**: `api/` (Functions) + `infra/` 추가
- 8.4 **데이터 레이어**: 클래스명 `SupabaseStorageService` → `AzureStorageService`
- 8.5 **로드맵**: 본 문서 §7로 교체
- 8.6 **비용 예측**: 본 문서 §8 표로 교체
- 8.8 **상용화 대비 설계 원칙** 중 "Supabase Auth 연동" → "Azure AD B2C 연동"

> 기존 기획서를 즉시 갱신할지, 본 문서를 보조 사양서로 병존시킬지는 별도 결정.
