# 지지 (지영지니어스)
운동재활 과목 학습용 모바일 퍼스트 PWA.
듀오링고/산타토익 스타일 + 카피바라 마스코트.
앱 소개: "지영 지니어스의 줄임말. 곧 작치 과탑할 예정 😎"

## 기술스택
- React 18 + TypeScript + Vite
- Tailwind CSS (모바일 퍼스트, 375px 기준)
- Framer Motion (카드 뒤집기, 스와이프, 캐릭터 모션)
- Zustand + localStorage (상태 영속화, 오프라인)
- vite-plugin-pwa (오프라인 캐싱 + 푸시알림)
- react-router-dom (페이지 라우팅)
- pdf-parse (빌드 파이프라인 전용)
- @anthropic-ai/sdk (빌드 파이프라인 전용, 런타임에는 절대 사용 안 함)

## 디자인 시스템
- 배경: #faf5ef (따뜻한 크림색)
- Primary: #c9956a (카피바라 갈색)
- Secondary: #5a8fc4 (파란색 악센트)
- Success: #4CAF50
- Error: #ef5350
- 카드: white, rounded-2xl, shadow-sm
- 폰트: Pretendard (CDN), 16px 기본
- 모든 이미지에 image-rendering: pixelated (픽셀아트 보호)

## 핵심 원칙
1. 모바일 퍼스트 (375px), 한 손 조작 최적화
2. 5-10분 세션 (지하철 1-2정거장 분량)
3. 오프라인 완벽 동작 (Service Worker)
4. 게이미피케이션 (XP, 스트릭, 뱃지)
5. 런타임 AI 호출 없음 - 모든 콘텐츠는 사전 생성된 JSON

## 마스코트 "지지"
public/mascot/ 에 6종 PNG (픽셀아트, 투명배경):
- greeting.png: 손 흔드는 포즈 → 좌우 살랑살랑 흔들기 (홈화면)
- happy.png: 만세 포즈 → 통통 바운스 (정답)
- sad.png: 고개 숙인 포즈 → 느린 끄덕 + 눈물 (오답)
- studying.png: 안경+책 포즈 → 미세 좌우 흔들 (학습중)
- sleeping.png: 베개+Zzz 포즈 → 숨쉬기 + Zzz 떠오름 (미학습)
- fire.png: 불꽃+별눈 포즈 → 빠른 떨림 (연속학습)

## 데이터 구조
- 모든 학습 콘텐츠는 data/generated/ 의 JSON 파일
- 런타임에 AI API 호출 없음
- SM-2 간격반복으로 매일 다른 세트 자동 구성
