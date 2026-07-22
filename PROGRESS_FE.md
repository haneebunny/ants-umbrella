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
| 2026-07-22 | Antigravity | Header.js 사이드 네비게이션 드로어 추가 — 햄버거(☰) 클릭 시 슬라이드인, 활성 경로 하이라이트 |
| 2026-07-22 | Antigravity | AntPet 캐릭터 홈 화면 복원 (드래그 가능 플로팅) |
| 2026-07-22 | Antigravity | `stock/[ticker]/page.js` 빌드 오류 수정 — import 경로 `../../../` 오타 수정 |
| 2026-07-22 | Antigravity | 홈 대시보드 3열 비균형 레이아웃 적용 (보유자산 4칸 / 종목날씨 5칸 / 코스닥+성향 3칸, 합계 12칸) |
| 2026-07-22 | Antigravity | 전체 레이아웃 너비 max-w-5xl → max-w-7xl로 확대, 헤더도 동일 너비로 정렬 |
| 2026-07-22 | Antigravity | 테마 flicker 완전 제거 — layout.js에 인라인 스크립트로 첫 Paint 전 localStorage 테마 즉시 적용 |
| 2026-07-22 | Antigravity | useTheme 훅 개선 — getInitialTheme()로 첫 렌더부터 올바른 테마 초기화 (모든 페이지 공유) |
| 2026-07-22 | Antigravity | KosdaqMiniChart, ProfileBadge 컴팩트 조정 (p-3, 폰트 축소) — 좁은 3칸 열 대응 |
| 2026-07-22 | Antigravity | 홈 그리드 5+5+2 → 6+4+2 조정 (종목 날씨 열 축소, 보유자산 열 확대) |
| 2026-07-22 | Antigravity | AssetSummaryCard: "보유 자산" 라벨-금액 간격 추가(mt-3), ₩ 기호 분리(text-lg) + 숫자(text-2xl) 비율 정렬 |
| 2026-07-22 | Antigravity | WeatherBanner: 날씨별 애니메이션 배경 추가 — 맑음(태양광선), 구름(drift), 비(rain streaks), 번개(flash) |
| 2026-07-22 | Antigravity | WeatherBanner: 색상 전면 강화 — 맑음(금빛), 구름(인디고), 비(시안), 번개(로즈) 3-stop 그라디언트 |
| 2026-07-22 | Antigravity | WeatherBanner: 텍스트·버튼·AI근거 배경을 흰색/반투명으로 통일, 가독성 개선 |
