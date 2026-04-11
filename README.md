# 🦫 지지 (지영지니어스)

> 지영 지니어스의 줄임말. 곧 작치 과탑할 예정 😎

친한 여동생 **지영**이를 위해 만든 **운동재활 과목 학습용 모바일 PWA**입니다.
듀오링고/산타토익 스타일의 게이미피케이션 학습 앱에, 귀여운 카피바라 마스코트 **지지**가 함께합니다.

<p align="center">
  <img src="public/mascot/greeting.png" alt="지지 마스코트" width="120" />
</p>

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| **개념카드 학습** | 운동재활 핵심 개념을 카드 형태로 학습 |
| **플래시카드** | SM-2 간격반복 알고리즘으로 매일 다른 세트 자동 구성 |
| **퀴즈** | 4지선다 객관식 + 예상 시험 문제 포함 |
| **복습노트** | 틀린 문제만 모아 집중 복습 |
| **학습통계** | XP, 스트릭, 레벨 시스템, 뱃지 |
| **푸시알림** | 학습 완료 알림 + 리마인더 |
| **오프라인 지원** | Service Worker로 지하철에서도 완벽 동작 |
| **PWA 설치** | 홈 화면에 추가하면 네이티브 앱처럼 사용 |

## 🦫 마스코트 "지지"

픽셀아트 카피바라 마스코트가 학습 상태에 따라 다양한 모습으로 등장합니다.

| 상태 | 이미지 | 설명 |
|------|--------|------|
| 홈화면 | `greeting.png` | 손 흔들며 반겨주기 |
| 정답 | `happy.png` | 만세 포즈 + 바운스 |
| 오답 | `sad.png` | 고개 숙임 + 눈물 |
| 학습중 | `studying.png` | 안경 쓰고 책 읽기 |
| 미학습 | `sleeping.png` | 베개 위에서 Zzz |
| 연속학습 | `fire.png` | 불꽃 + 별눈 |

## 🛠 기술 스택

### 프론트엔드
- **React 19** + **TypeScript** — UI 프레임워크
- **Vite 8** — 빌드 도구
- **Tailwind CSS 4** — 모바일 퍼스트 스타일링 (375px 기준)
- **Framer Motion** — 카드 뒤집기, 스와이프, 마스코트 애니메이션
- **Zustand** + localStorage — 상태 관리 및 오프라인 영속화
- **React Router** — SPA 페이지 라우팅

### PWA & 오프라인
- **vite-plugin-pwa** + **Workbox** — Service Worker, 프리캐싱, 오프라인 캐싱
- 푸시 알림 (학습 완료 리마인더)
- iOS / Android 홈 화면 설치 지원

### 콘텐츠 파이프라인 (빌드 타임 전용)
- **pdf-parse** — 수업 자료 PDF 텍스트 추출
- **@anthropic-ai/sdk** (Claude API) — 플래시카드, 퀴즈, 개념카드 자동 생성
- **Sharp** — 마스코트 이미지 처리

> ⚠️ 런타임에 AI API를 호출하지 않습니다. 모든 학습 콘텐츠는 빌드 시점에 사전 생성된 JSON 파일입니다.

### 배포
- **Vercel** — 호스팅 및 자동 배포

## 📁 프로젝트 구조

```
jiji/
├── public/
│   └── mascot/          # 지지 마스코트 픽셀아트 PNG
├── data/
│   └── generated/       # 사전 생성된 학습 콘텐츠 JSON
│       ├── flashcards.json
│       ├── quizzes.json
│       └── concept-sets.json
├── scripts/             # 콘텐츠 생성 파이프라인
│   ├── 01-parse-pdfs.ts
│   ├── 02-generate-content.ts
│   ├── 03-add-manual-content.ts
│   ├── 04-add-exam-content.ts
│   └── 05-add-exam-predictions.ts
├── src/
│   ├── pages/           # 라우트별 페이지 컴포넌트
│   │   ├── Home.tsx
│   │   ├── Study.tsx
│   │   ├── Quiz.tsx
│   │   ├── Flashcards.tsx
│   │   ├── Review.tsx
│   │   ├── Stats.tsx
│   │   └── About.tsx
│   ├── components/      # 재사용 UI 컴포넌트
│   ├── stores/          # Zustand 상태 관리
│   ├── hooks/           # 커스텀 훅
│   ├── utils/           # 유틸리티 함수
│   └── sw.ts            # Service Worker
└── vite.config.ts
```

## 🚀 로컬 개발

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 빌드 미리보기
pnpm preview
```

### 콘텐츠 재생성 (선택사항)

학습 콘텐츠를 다시 생성하려면 `ANTHROPIC_API_KEY` 환경 변수가 필요합니다.

```bash
# 1. PDF에서 텍스트 추출
pnpm parse

# 2. Claude API로 콘텐츠 생성
pnpm generate
```

## 🎨 디자인 시스템

| 토큰 | 값 | 용도 |
|------|----|------|
| Background | `#faf5ef` | 따뜻한 크림색 배경 |
| Primary | `#c9956a` | 카피바라 갈색 (메인 액센트) |
| Secondary | `#5a8fc4` | 파란색 액센트 |
| Success | `#4CAF50` | 정답 피드백 |
| Error | `#ef5350` | 오답 피드백 |

- 폰트: **Pretendard** (CDN)
- 카드: `white`, `rounded-2xl`, `shadow-sm`
- 이미지: `image-rendering: pixelated` (픽셀아트 보호)

## 📱 학습 콘텐츠 현황

- 플래시카드: **117장**
- 퀴즈: **81문제** (예상 시험문제 포함)
- 개념카드: **10세트**

## 🧠 핵심 설계 원칙

1. **모바일 퍼스트** — 375px 기준, 한 손 조작 최적화
2. **짧은 세션** — 5~10분 (지하철 1~2정거장 분량)
3. **완전 오프라인** — Service Worker로 네트워크 없이 동작
4. **게이미피케이션** — XP, 스트릭, 레벨, 뱃지로 학습 동기 부여
5. **런타임 AI 없음** — 모든 콘텐츠는 사전 생성 JSON, 빠르고 안정적

---

지영아 과탑하자 🔥
