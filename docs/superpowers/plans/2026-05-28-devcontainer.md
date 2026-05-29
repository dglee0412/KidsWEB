# KidsWeb — 회사 ↔ 집 PC 동기화 (devcontainer 설정 + git 푸시) [사용자 직접 진행 매뉴얼]

## Context

회사 PC에서 작업한 KidsWeb을 git에 올리고, 집 PC에서 추가 라이브러리 설치 부담 없이 바로 실행할 수 있게 한다.

핵심 산출물:
- `.devcontainer/devcontainer.json` — GitHub Codespaces + 로컬 VS Code Dev Container 둘 다 지원
- `vite.config.js` 수정 — 컨테이너에서 외부 접근(`host: true`)
- `README.md` — 세 가지 실행 방법(Codespaces / 로컬 Docker / Node 직접) 안내
- 미커밋 변경 8개 + 새 Azure 문서 + 신규 devcontainer 파일들 git 푸시

---

## 단계 0. 사전 확인

PowerShell에서 (작업 폴더는 `D:\DGLee\KidsWeb`):

```powershell
git status
git remote -v
git log -1 --oneline
```

기대값:
- modified 8개 (`Doc/01_기획서.md`, `package.json`, `src/activities.jsx`, `src/app.jsx`, `src/shell.jsx`, `src/styles.css`, `src/worldmap.jsx`, `vite.config.js`)
- untracked 1개 (`Doc/04_Azure_Migration.md`)
- origin: `https://github.com/dglee0412/KidsWEB.git`
- 최신 커밋: `ccf2878 docs: add planning documents and design prototypes`

---

## 단계 1. `.devcontainer/devcontainer.json` 만들기

VS Code 또는 메모장으로 `D:\DGLee\KidsWeb\.devcontainer\devcontainer.json` 새 파일 생성하고 아래 내용 그대로 붙여넣기:

```json
{
  "name": "KidsWeb",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm",
  "forwardPorts": [3100],
  "portsAttributes": {
    "3100": {
      "label": "KidsWeb Dev Server",
      "onAutoForward": "openPreview"
    }
  },
  "postCreateCommand": "npm install",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ],
      "settings": { "editor.tabSize": 2 }
    }
  }
}
```

> 폴더와 파일 이름 모두 점(`.`)으로 시작합니다 — `.devcontainer\devcontainer.json`.

---

## 단계 2. `vite.config.js`의 `server` 항목 한 줄만 수정

현재 `D:\DGLee\KidsWeb\vite.config.js` 마지막쪽:

```js
server: { port: 3100, strictPort: true },
```

이걸 다음으로 변경:

```js
server: { port: 3100, strictPort: true, host: true },
```

> `host: true`는 컨테이너 내부 dev server를 외부(forwardPort)로 노출하기 위함. 로컬 Node 실행 시 LAN에서도 접근 가능해지지만 집/회사 사용에는 문제 없음.

---

## 단계 3. `README.md` 만들기

`D:\DGLee\KidsWeb\README.md` 새 파일 생성하고 아래 내용 그대로 붙여넣기:

````markdown
# KidsWeb

만 3~5세 유아용 교육 놀이 PWA. Vite + React 기반.

## 실행 방법 (3가지 중 택1)

### 1) GitHub Codespaces — 브라우저로 즉시 (추천: 집/외부 PC, 아무것도 설치 X)
1. GitHub 저장소 페이지에서 녹색 **Code** 버튼 → **Codespaces** 탭 → **Create codespace on main**
2. 1~2분 대기 (자동 빌드 + `npm install`)
3. 터미널에서 `npm start`
4. 포트 3100이 자동으로 forwarded 되고 미리보기 탭이 열림

> 무료 한도 월 60시간(개인 학습용 충분).

### 2) 로컬 Dev Container — VS Code + Docker Desktop
1. 집 PC에 [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
2. `git clone https://github.com/dglee0412/KidsWEB.git`
3. VS Code에서 폴더 열기 → 우측 하단 알림의 **"Reopen in Container"** 클릭 (없으면 Command Palette → "Dev Containers: Reopen in Container")
4. 빌드 완료 후 터미널에서 `npm start` → http://localhost:3100

### 3) Node.js 직접 — 컨테이너 없이
1. 집 PC에 [Node.js 20+](https://nodejs.org/) 설치
2. `git clone https://github.com/dglee0412/KidsWEB.git`
3. `npm install` (최초 1회만)
4. `npm start` → http://localhost:3100

## 일상 워크플로 (회사 ↔ 집)
- 작업 **시작 전**: `git pull`
- 작업 **종료 후**: `git add -A` → `git commit -m "..."` → `git push`

## 기획 문서
- [기획서](./Doc/01_기획서.md)
- [와이어프레임](./Doc/02_와이어프레임.md)
- [Design Brief](./Doc/03_DesignBrief.md)
- [Azure 마이그레이션 기획서](./Doc/04_Azure_Migration.md)
````

> README의 코드 블록을 그대로 쓰기 위해 위 매뉴얼에서는 백틱 4개(````)로 감쌌습니다. 파일에 저장할 때는 README 내부의 백틱 3개만 남기시면 됩니다 — VS Code에 그대로 붙여넣으면 자동 처리됩니다.

---

## 단계 4. 이 plan 파일 사본을 프로젝트에 두기 (선택)

`D:\DGLee\KidsWeb\docs\superpowers\plans\2026-05-28-devcontainer.md` 새 파일 생성하고 **이 plan 파일 전체 내용을 복사해서 붙여넣기**. (다른 기존 plan들이 같은 폴더에 있음 — 일관성 유지)

---

## 단계 5. 3개 커밋으로 분리해서 푸시

PowerShell에서 순서대로 실행:

### Commit 1 — 자유 색칠놀이 풀스펙 + 월드맵 풀컬러

```powershell
git add src/activities.jsx src/app.jsx src/shell.jsx src/styles.css src/worldmap.jsx
git commit -m "feat: free coloring with outline + world map full-color places"
```

### Commit 2 — Azure 마이그레이션 기획서 + 기획서 갱신

```powershell
git add "Doc/01_기획서.md" "Doc/04_Azure_Migration.md"
git commit -m "docs: add Azure migration spec, rewrite hosting/arch sections"
```

### Commit 3 — devcontainer + 포트 3100 + LAN 노출 + README

```powershell
git add .devcontainer/devcontainer.json vite.config.js package.json README.md docs/superpowers/plans/2026-05-28-devcontainer.md
git commit -m "chore: devcontainer setup, port 3100, host expose, README"
```

> 단계 4를 건너뛰셨다면 마지막 줄의 `docs/superpowers/plans/...` 부분만 빼시면 됩니다.

### 푸시

```powershell
git push origin main
```

---

## 단계 6. 푸시 확인

브라우저로 https://github.com/dglee0412/KidsWEB 들어가서:
- 최신 3개 커밋이 보이는지
- `.devcontainer/devcontainer.json`, `README.md`, `Doc/04_Azure_Migration.md` 파일이 보이는지
- 저장소 메인 페이지에 README가 렌더링되는지

---

## 단계 7. 집 PC에서 가져가기 (다음에 집에서 할 때)

세 가지 중 편한 방법:

### A. Codespaces (집 PC에 아무것도 설치 안 함)
- 브라우저에서 github.com/dglee0412/KidsWEB → **Code** → **Codespaces** → **Create codespace on main**
- 빌드 완료 후 터미널에 `npm start`

### B. 로컬 Docker Desktop
- 집 PC에 Docker Desktop + VS Code + Dev Containers 확장 설치
- `git clone https://github.com/dglee0412/KidsWEB.git`
- VS Code 열기 → "Reopen in Container" → `npm start`

### C. Node 직접
- 집 PC에 Node 20 설치
- `git clone …` → `npm install` → `npm start`

---

## 막혔을 때

각 단계 진행 중 에러나 결과물이 다르면 단계 번호와 함께 알려주세요. 해당 부분만 짚어 도와드리겠습니다.
