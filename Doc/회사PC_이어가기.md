# 회사 PC에서 이어가기

> 다른 PC에서 KidsWEB 작업을 이어갈 때 따라 하는 메모.
> 모든 작업/에셋/설계문서는 GitHub(`github.com/dglee0412/KidsWEB`)에 푸시돼 있음.

## 1. 저장소 받기

**처음(클론):**
```
git clone https://github.com/dglee0412/KidsWEB.git
cd KidsWEB
npm install
npm run dev
```

**이미 클론돼 있으면(최신화):**
```
cd KidsWEB
git pull
npm install      # 의존성 바뀌었을 수 있으니
npm run dev
```

- dev 서버: http://localhost:3100

## 2. git으로 안 따라오는 것들

- **node_modules** — git에 없음 → `npm install` 필수
- **Azure SPEECH_KEY** — 환경변수라 안 넘어감. **음성·BGM 에셋은 이미 커밋돼 있어 앱 실행엔 키 불필요.** 음성을 *재생성*할 때만 필요:
  ```powershell
  $env:SPEECH_KEY    = "<새 키>"
  $env:SPEECH_REGION = "koreacentral"
  powershell -ExecutionPolicy Bypass -File scripts\gen-voices.ps1
  ```
  (키는 Azure 포털 → Speech 리소스 → "키 및 엔드포인트". 노출 시 "키 다시 생성"으로 폐기)

## 3. 회사 PC 첫 사용 체크

- **git 신원**:
  ```
  git config --global user.name "이름"
  git config --global user.email "이메일"
  ```
- **GitHub 인증**: `git push` 하려면 로그인 필요(HTTPS는 비밀번호 대신 **PAT** 또는 자격증명 관리자). 비공개 저장소면 `pull`에도 인증 필요.

## 4. 현재 진행 상황 (2026-05-31 기준)

**완료(오디오 시스템):**
- 장소 음성 + 도구 음성(아이 목소리), 효과음(select/correct/wrong/star/sticker)
- 그리기/지우기 합성음, 계절별 배경음악(봄/여름/가을, 크로스페이드)
- 부모설정 음량 슬라이더(배경음/효과음/음성) 실연동
- 가로화면 레터박스 테마 배경 처리
- 핵심 모듈: `src/lib/audio.js`. 설계/계획: `docs/superpowers/specs·plans/*bgm-coloring-sfx*`

**다음 후보(미구현 목록 `Doc/05_미구현_기능_목록.md` 참고):**
- 영어/도형·색깔/컴퓨터/소셜 카테고리(통째 미구현)
- 한글 따라쓰기, 수학 뺄셈·비교, 두뇌 틀린그림·퍼즐·미로 등 서브기능 보강
- 부모설정 사용시간 제한 실연동, 보상(스티커 수집·뱃지)

## 5. 빌드/배포 메모

- BGM mp3는 2MiB 초과라 PWA 프리캐시에서 제외하고 **런타임 캐싱(CacheFirst)** 으로 처리(`vite.config.js`의 `globIgnores` + `runtimeCaching`). 큰 에셋 추가 시 동일 패턴 필요.
- 배포: Azure Static Web Apps(워크플로 이미 설정). `npm run build` → `dist/`.
