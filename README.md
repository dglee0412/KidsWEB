# KidsWeb

  만 3~5세 유아용 교육 놀이 PWA. Vite + React 기반.

  ## 실행 방법 (3가지 중 택1)

  ### 1) GitHub Codespaces — 브라우저로 즉시 (집/외부 PC, 아무것도 설치 X)
  1. GitHub 저장소 페이지에서 녹색 **Code** 버튼 → **Codespaces** 탭 → **Create codespace on main**
  2. 1~2분 대기 (자동 빌드 + `npm install`)
  3. 터미널에서 `npm start`
  4. 포트 3100이 자동으로 forwarded 되고 미리보기 탭이 열림

  > 무료 한도 월 60시간(개인 학습용 충분).

  ### 2) 로컬 Dev Container — VS Code + Docker Desktop
  1. 집 PC에 [Docker Desktop](https://www.docker.com/products/docker-desktop/) 설치
  2. `git clone https://github.com/dglee0412/KidsWEB.git`
  3. VS Code에서 폴더 열기 → 우측 하단 알림의 **"Reopen in Container"** 클릭
     (알림이 없으면 Command Palette → "Dev Containers: Reopen in Container")
  4. 빌드 완료 후 터미널에서 `npm start` → http://localhost:3100

  ### 3) Node.js 직접 — 컨테이너 없이
  1. 집 PC에 [Node.js 20+](https://nodejs.org/) 설치
  2. `git clone https://github.com/dglee0412/KidsWEB.git`
  3. `npm install` (최초 1회)
  4. `npm start` → http://localhost:3100

  ## 일상 워크플로 (회사 ↔ 집)
  - 작업 **시작 전**: `git pull`
  - 작업 **종료 후**: `git add -A` → `git commit -m "..."` → `git push`

  ## 기획 문서
  - [기획서](./Doc/01_기획서.md)
  - [와이어프레임](./Doc/02_와이어프레임.md)
  - [Design Brief](./Doc/03_DesignBrief.md)
  - [Azure 마이그레이션 기획서](./Doc/04_Azure_Migration.md)