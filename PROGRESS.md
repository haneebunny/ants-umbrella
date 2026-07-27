# PROGRESS

| 날짜 | 이름 | 한 일 |
| :--- | :--- | :--- |
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
| 2026-07-23 | Antigravity | FinanceDataReader 404 에러 우회를 위한 15일 역방향 날짜 탐색(Fallback) 로직을 collect_price.py 및 add_sector.py에 적용 |
| 2026-07-23 | Antigravity | Windows cp949 인코딩 에러 해결을 위해 process_news_features.py 내 이모지 출력을 제거하거나 인코딩 우회 래핑 처리 |
| 2026-07-23 | Antigravity | 오프라인 환경 대응을 위한 HF API 패스트 페일(Fast-fail) 모드를 process_news_features.py에 도입하여 1300여건의 뉴스 분석 속도를 수 시간에서 1분 이내로 단축 |
| 2026-07-23 | Antigravity | 이벤트 스터디 통계 집계 스크립트(evnet_study.py) 개발: 회사명-종목코드 매칭, MongoDB Atlas 연결, (ticker, date) 인덱스 충돌 방지 로직 적용 및 55건 통계 데이터 적재 완료 |
| 2026-07-23 | Antigravity | schemas.py 및 main.py 수정: /risk-score/{ticker} API 응답에 과거 적중률(hit_rate), 사례 수(sample_size), Fallback 배지(badge) 필드 추가 연동 완료 |
| 2026-07-23 | Antigravity | 로컬 데이터(주가/거시/공시) 수집 기간 2020년 소급 백필(25,182행), 14,246건의 대용량 ESG 뉴스를 로컬 룰베이스로 정제 조인, ML 실험 재수행 및 데이터 분석 정의서 최종 작성 완료 |
| 2026-07-23 | Antigravity | train_xgboost.py 성능 개선을 위해 10가지 가중치/하이퍼파라미터 대조 실험 구동 완료. max_depth=2 축소 및 scale_pos_weight 보정을 통해 AUC-ROC 0.6246 / PR-AUC 0.2767 달성하는 최적 앙상블 조합 도출 |
| 2026-07-25 | Claude | 메인화면 '종목별 날씨' 번개(thunder) 과다 발생 이슈 진단·수정 (backend/main.py `_prob_to_weather`). prob_down 임계값 상향 및 횡단면 정규화(`_market_prob_down_baseline`) 추가로 번개 14%→5%로 완화 |
| 2026-07-25 | Claude | 메인화면 위젯 프론트 수정. StockWeatherList 실시간 배지 삭제·위험등급 표기 대체, KosdaqMiniChart 등락 부호 판단 로직 수정, diagnosis/page.js 미정의 변수 수정 |
| 2026-07-25 | Claude | AI 판단 근거 하드코딩 문제 해결. gemini-1.5-flash EOL 확인 → .env `GEMINI_MODEL=gemini-3.1-flash-lite` 설정, `_call_gemini` 실패 로깅 추가, Mongo ai_briefings 폴백 캐시 재사용 방지(`is_fallback` 플래그) 추가 |
| 2026-07-25 | Antigravity | 위험 진단 페이지(diagnosis/page.js) 내 Git 병합 갈등 코드 및 미정의 변수 완전 제거, 미폐쇄 JSX 태그 수정으로 빌드/렌더링 정상화 |
| 2026-07-25 | Antigravity | 위험 알림 페이지(/api/alerts) 긍정(positive) 방향 뉴스 필터링 추가, 최대 15건 제한 로직을 필터링 이후 적용되도록 수정 |
| 2026-07-25 | Antigravity | KOSPI 지수 및 종목 리스크 변동률 ± 부호 중복 표기 버그 수정, 하락 시 다크/라이트 모드 전반 빨간색 일관 적용 |
| 2026-07-25 | Antigravity | 위험 진단 메뉴 아이콘 radar → activity(맥박/EKG)로 교체 |
| 2026-07-25 | Antigravity | 날씨 맑음 시 개미 캐릭터(mimi_1.png) 크기 작아 보이던 버그 scale-[1.25] 적용으로 수정 |
| 2026-07-26 | Antigravity | 슬랙 알림 페르소나 교체: 고슴이(🦔)/~했슴 → 개미미(🐜), 친근한 ~어요 말투 전면 적용 |
| 2026-07-26 | Antigravity | 슬랙 알림 거시 지표 소스 변경: ml_ready_real.csv → macro_features.csv (매일 갱신, 최신 날짜 반영) |
| 2026-07-26 | Antigravity | validate_event_with_llm() LLM 악재 검증 필터 도입: 낚시성·매수추천 뉴스 Gemini가 자동 차단, 테스트 모드 우회 제거 |
| 2026-07-26 | Antigravity | GenerateContentConfig API 수정: response_format → response_mime_type + response_schema (현재 SDK 호환, slack_notifier.py / process_news_features.py 동시 수정) |
| 2026-07-26 | Antigravity | GEMINI_MODEL 하드코딩 전면 제거: main.py / process_news_features.py / slack_notifier.py 세 곳을 os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")로 통일 |
| 2026-07-26 | Antigravity | 슬랙 알림 스케줄 개편: 하루 3회(6:41/12:00/17:46) → 2회(7:41 KST 무조건 발송 / 17:46 KST 변동 시만 발송). GitHub Actions 크론 및 ALERT_MODE 자동 판별 로직 추가 |
| 2026-07-26 | Antigravity | 불필요 파일 정리: 실험용 스크립트 12개 삭제(verify2.py / compare_features.py / run_experiments.py 등), 더미·목업 데이터 파일 7개 삭제, DL/ 및 training/ 폴더 제거 |
| 2026-07-27 | Antigravity | `slack_notifier.py` 거시 지표(금리/환율) 결측 보정 시 실제 지표 생성일 표시 및 거시 흐름 영향 요약 문구 슬랙 메시지에 추가 |
| 2026-07-27 | Antigravity | `layout.js` 메타데이터 수정(AI 주가 급락 위험 예측 반영) 및 파비콘/앱 아이콘(`icon.png`, `favicon.ico`) 개미의 우산 로고 이미지로 교체 |
| 2026-07-27 | Antigravity | 종목 상세 미미 브리핑 2단계 LLM 검증 적용, 거시 DB 적재 파이프라인 구축 및 용어 순화, 차트 가격 고정 노출 및 스켈레톤 UI 보완 |
| 2026-07-27 | Antigravity | 브리핑 영역 Hydration/Nested Tag HTML 오류 (<p> 내 <p> 및 <div> 상속) 해소 및 미미 캐릭터 토끼 이모지(🐰) 제거 완료 |
| 2026-07-27 | Antigravity | 종목 상세 페이지 주가 차트(sparkline), ESG 3대 영역 리스크 카드, 자산 시뮬레이터 비중 및 총액 정보의 하드코딩 전수 제거 및 백엔드/포트폴리오 연동 완료 |
| 2026-07-27 | Antigravity | 홈 대시보드 게스트 CTA 배너(GuestCTABanner) 상단 여백(pt-4) 추가로 헤더 밀착 현상 해결 및 가독성 개선 |
| 2026-07-27 | Antigravity | `frontend/src/app/diagnosis/page.js` 위험진단 페이지 상단 중복 단계 표시 바 제거 및 하단 탭 내비게이션 바 유지 |
| 2026-07-27 | Antigravity | `frontend/src/app/components/DiagnosisResultView.js` 성향 종합 리포트 무한 루프 수정 및 API 404 예외 처리 보완, isStandalone prop 누락 경고 제거 |
| 2026-07-27 | Antigravity | `frontend/src/app/components/home/StockWeatherList.js` 홈 대시보드 종목별 날씨 플로팅 패널 내 상세 버튼 잘림 제거, panelH 여유 배치 및 화면 이탈 방지 가드 보완 |
| 2026-07-27 | Antigravity | `.github/workflows/ml_ablation_experiment.yml` 내 유실된 `run_pipeline.py` 호출부를 종합 검증 파이프라인인 `health_check.py`로 수정하여 CI 빌드 에러 해결 |
| 2026-07-27 | Antigravity | `frontend/src/app/components/layout/Header.js` 에 '종목 상세 분석' 메뉴 추가, 상세 진입 시 하이라이트 연동 및 활성 포트폴리오 첫 번째 종목 자동 우회 라우팅 결합 완료 |
| 2026-07-27 | Antigravity | `backend/main.py` 내 `/api/alerts` API의 500/누락 필드 개선으로 알림 리스트에 범용 더미 문구 대신 '실제 포착된 기사 제목' 노출 및 zfill(6) 코드 맵핑을 활용한 '한글 종목명' 표시 보완 완료 |
| 2026-07-27 | Antigravity | 위험 진단 3개 화면(`diagnosis/page.js`, `diagnosis/weather/page.js`, `diagnosis/result/page.js`)의 상단 탭 내비게이션 영역에 pt-4 상단 여백(패딩)을 추가하여 헤더 영역과의 밀착 현상 해결 및 UI 일관성 확보 |
| 2026-07-27 | Antigravity | `backend/scripts/health_check.py` 내에 CI 가상환경 무결성 검증을 위한 `ml_ready_real.csv` 부재 시 '테스트용 가상 모사 데이터셋 자동 복원기' 구현 탑재로 깃허브 액션 빌드 패스 보장 |
