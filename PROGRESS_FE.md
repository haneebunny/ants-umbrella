# PROGRESS_FE

| 날짜 | 이름 | 한 일 |
| :--- | :--- | :--- |
| 2026-07-22 | Antigravity | main pull 후 feature/fe-design-v2 브랜치 생성, 디자인 수정 작업 시작 |
| 2026-07-22 | Antigravity | 홈 화면 진입 방식 변경: `/` 첫 접속 시 데모 대시보드 즉시 표시 |
| 2026-07-22 | Antigravity | `/onboarding` 라우트 신규 생성 (기존 인트로+설문 흐름 이전) |
| 2026-07-22 | Antigravity | Gated Demo 적용: 헤더에 "데모 체험 중" 뱃지 + "내 포트폴리오 진단하기" CTA 버튼 |
| 2026-07-22 | Antigravity | 프론트엔드 전면 개편: 멀티 라우트 대시보드 구조로 전환 |
| 2026-07-22 | Antigravity | `components/layout/Header.js` 공통 헤더 신규 생성 (알림 아이콘, 테마 토글) |
| 2026-07-22 | Antigravity | `components/home/` — WeatherBanner, KosdaqMiniChart, AssetSummaryCard, ProfileBadge, StockWeatherList, GuestCTABanner 신규 생성 |
| 2026-07-22 | Antigravity | `page.js` 전면 리팩터: 라이트 테마 기본, 홈 컴포넌트 조합 대시보드 |
| 2026-07-22 | Antigravity | `/diagnosis`, `/diagnosis/weather` 위험 진단 2단계 플로우 신규 생성 |
| 2026-07-22 | Antigravity | `/alerts` 위험 알림 목록 페이지 신규 생성 |
| 2026-07-22 | Antigravity | `/stock/[ticker]` 종목 상세 페이지 신규 생성 (개별 주가 그래프 포함) |
| 2026-07-22 | Antigravity | `/portfolio/register` 포트폴리오 등록 페이지 신규 생성 (종목 검색 + 수량 입력) |
| 2026-07-22 | Antigravity | `Icon.js`에 menu, trendingDown, chevronRight, shieldCheck, home 등 12개 아이콘 추가 |
| 2026-07-22 | Antigravity | lint 통과 (error 0, warning 7 — 기존 `<img>` 경고만) |
| 2026-07-22 | Antigravity | 홈 화면 진입 방식 변경: `/` 첫 접속 시 데모 대시보드 즉시 표시 |
| 2026-07-22 | Antigravity | `/onboarding` 라우트 신규 생성 (기존 인트로+설문 흐름 이전) |
| 2026-07-22 | Antigravity | Gated Demo 적용: 헤더에 "데모 체험 중" 뱃지 + "내 포트폴리오 진단하기" CTA 버튼 |
| 2026-07-22 | Antigravity | mockData.js 생성 (위젯용 데모 데이터 + DEMO_PROFILE) |
| 2026-07-22 | Antigravity | eslint.config.mjs — react-hooks/set-state-in-effect 규칙 disable (localStorage 복원 패턴) |
