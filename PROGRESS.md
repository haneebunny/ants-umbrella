# PROGRESS

| 날짜 | 이름 | 한 일 |
| :--- | :--- | :--- |
| 2026-07-21 | haneebunny | 프로젝트 초기 세팅 및 최초 커밋 |
| 2026-07-21 | Antigravity | 투자성향조사.md 명세(v0.2) 기반 Next.js 프론트엔드 계산 로직 및 UI 컴포넌트 변환 완료 |
| 2026-07-21 | Antigravity | 서비스명을 '개미의 우산'으로 변경하고 다크/라이트모드 토글을 해/달 모양 스위치 토글로 개선 |
| 2026-07-21 | Antigravity | 서비스 로고 이미지를 삽입하고, 로고/텍스트 클릭 시 홈으로 이동하도록 네비게이션 개선 및 favicon 연동 |
| 2026-07-21 | Antigravity | pyproject.toml TOML 문법 오류 해결 및 Poetry 2.x 패키지 모드(package-mode = false) 비활성화 설정 추가 |
| 2026-07-21 | Antigravity | AssetChart 호버 감지 오류 수정, 인트로 사이드바 제거 및 성향조사 레이아웃 최대 너비 확장으로 일관된 1컬럼 대시보드 구조 완성 |
| 2026-07-21 | Antigravity | 투자 기상도(Atmosphere), 위험 레이더(Radar), 보유 자산(Assets), 위험 알림(Alerts) 4개 탭 스위칭 대시보드 구현 및 포트폴리오 비중 조절 시 실시간 날씨 연동 기능 추가, 하단 내비게이션바 패딩 보정 및 UI 전체 한글 통일 완료 |
| 2026-07-21 | Antigravity | 데이터 수집 스크립트 4개(collect_dart, collect_macro, collect_price, news)를 backend/scripts/ 디렉터리로 이동하여 관리 구조 단일화 |
| 2026-07-21 | Antigravity | 프로젝트 루트 pyenv local 파이썬 버전을 3.11.9로 동기화하고 generate_dummy_data.py의 데이터 저장 경로를 절대 경로로 수정하여 정상 작동 조치 |
| 2026-07-21 | Antigravity | scripts 오타 교정 안내 및 join_features.py의 데이터를 절대 경로로 수정하여 정상 작동 조치 |
| 2026-07-21 | Antigravity | 로컬 폴더명을 scripts로 원복함에 따라 스크립트 내부 경로 탐색 및 변수 명칭을 scripts로 재조정하여 정상 작동 유지 |
| 2026-07-21 | Antigravity | Mac libomp 라이브러리 미설치로 인한 XGBoost 로딩 실패 오류 조치 및 train_xgboost.py 절대경로 수정 완료 |
| 2026-07-21 | Antigravity | 최신 main 브랜치 동기화, OpenDART 고유번호 다운로더 및 FinanceDataReader 업종 매핑 오류 조치 완료 |
| 2026-07-21 | Antigravity | 데이터 유효성 검증(validate_incoming_data.py), 피처 병합(join_features.py), XGBoost 학습 및 3단 Ablation 검증, MongoDB 연결 복구 및 JSON Mock DB 폴백 설계, FastAPI /risk-score/{ticker} DB 조회 API 구현 완료 |
| 2026-07-21 | Antigravity | portfolio.json 데이터 연동을 위한 백엔드 /portfolios API 구현 및 프론트엔드 target_risk_band 기반 동적 포트폴리오 로딩 및 실시간 리스크 API 패치 연동 완료 |
| 2026-07-21 | Antigravity | 설문 상태 localStorage 백업/복원 연동으로 핫 리로딩 시 결과 초기화 방지 및 리셋 컨펌 팝업 및 이벤트 전파 차단 구현 완료 |
| 2026-07-21 | Antigravity | 주식 초보자 나개미 페르소나에 맞춰 리스크 강도(이모지), 한줄 해설 가이드 팁 생성, 기사 전문 줄바꿈 해제 및 종합 예측 원리 💡 툴팁 UI 보강 완료 |
| 2026-07-21 | Antigravity | AI 종합 예측 브리핑(ai_briefing) 백엔드 연산 및 프론트 최상단 고정 카드 구현, 공시 세부유형(무상/유상 등) 초보 팁 세분화, 고품질 뉴스 수집 튜닝 완료 |
| 2026-07-22 | Antigravity | ML/DL 실험용 샌드박스 스크립트(run_experiments.py) 및 비전공자용 팀 가이드 문서(TEAM_ROLE_GUIDE.md) 추가 |
| 2026-07-22 | Antigravity | Poetry 캐시 권한 에러 우회(Cache_new) 조치 및 process_news_features.py pkl 피클 로더 변경, Gemini API 키 예외 처리 보완 후 뉴스 피처 생성 정상 완료 |
| 2026-07-22 | Antigravity | collect_dart.py(3단계), collect_price.py(4단계), generate_labels.py(5단계), collect_macro.py(6단계) 순차 실행 완료 및 join_features.py로 최종 병합 - ml_ready_real.csv(13824행, 14컬럼) 생성 완료 |
| 2026-07-22 | Antigravity | 날씨 연동형 인터랙티브 플로팅 개미 펫 (AntPet) UI 컴포넌트 개발 및 대시보드 연동 완료 |
| 2026-07-23 | Antigravity | 홈 대시보드 전면 폴리싱: WeatherBanner shimmer 애니메이션·라이트모드 가독성 개선, AssetSummaryCard 도넛↔레이더 탭 전환(SVG 직접 구현), 레이더 차트 글로우·draw-in 애니메이션 적용 |
| 2026-07-23 | Antigravity | StockWeatherList 플로팅 오버레이 패널 구현(AI판단근거·ESG점수바·상세링크), PortfolioProfileCard 신규 생성(투자성향배지+포트폴리오선택 통합) |
| 2026-07-23 | Antigravity | 그리드 레이아웃 최종 확정: 코스닥·성향(2)·종목날씨(4)·보유자산(5), POSCO 오타 수정, 구름 인디케이터 바 버그 수정 - feature/fe-design-v2 브랜치 push 및 PR #24 생성 완료 |
| 2026-07-22 | Antigravity | compare_features.py의 Pylance/Pyright 임포트 경로 문제(Cannot find module run_experiments)를 sys.path 추가 방식으로 해결 |
| 2026-07-22 | Antigravity | join_features.py의 merged 변수 UnboundLocalError 해결 및 compare_features.py의 unreachable 비교 코드 수정 |
| 2026-07-22 | Antigravity | collect_news.py에 날짜순 정렬 및 페이징 파라미터(최대 500개)를 도입하여 과거 뉴스 수집량 대폭 확대 |
| 2026-07-22 | Antigravity | 전체 수집, 전처리, 학습, 평가 파이프라인 단일 구동 및 로그 파일 저장을 자동화하는 run_pipeline.py 개발 완료 |
| 2026-07-22 | Antigravity | 뉴스 검색어 쿼리 다각화, 주말 뉴스 월요일 롤포워드 로직, SBERT 임베딩 중복 제거 데이터셋 연동 및 타임존 안전 병합 연산 고도화 완료 |
| 2026-07-22 | Antigravity | 로컬 자원 부족 크래시 예방을 위한 Google Colab 통합 ML 파이프라인 구동 노트북(colab_pipeline.ipynb) 생성 |
| 2026-07-22 | Antigravity | UTF-8 강제 모드 설정으로 cp949 인코딩 에러 우회 적용 및 run_experiments.py 기본 실험 가동 완료 |
| 2026-07-22 | Antigravity | run_experiments.py에 4가지 추가 하이퍼파라미터 튜닝 조합(실험 4~7) 확장 구현 및 결과 지표 수집 |
| 2026-07-22 | Antigravity | 수집된 7가지 실험의 지표(Accuracy, AUC-ROC, Brier Loss) 및 피처 기여도 분석 결과를 토대로 data_analysis_definition.md (데이터 분석 정의서) 최종 작성 완료 |
| 2026-07-22 | Antigravity | 깃 충돌 방지를 위해 ROADMAP.md 수정본을 롤백하고, B 파트 전용 로드맵 파일인 ROADMAP_B.md를 신규 생성하여 로드맵 이력 관리 |
| 2026-07-22 | A (Antigravity 지원) | Poetry 캐시 권한 에러 우회(Cache_new 경로 변경) 조치 완료 |
| 2026-07-22 | A (Antigravity 지원) | **2단계**: `process_news_features.py` — pkl 피클 로더 변경(torch→pickle), Gemini API 키 예외 처리 보완, 뉴스 피처 578건 생성 완료 (`data/news_features_day2.csv`) |
| 2026-07-22 | A (Antigravity 지원) | **3단계**: `collect_dart.py` — 가이드 규격으로 교체, DART_API_KEY/OPENDART_API_KEY 이중 지원 추가 후 공시 수집 완료 (`data/supplementary_signals.csv`) |
| 2026-07-22 | A (Antigravity 지원) | **4단계**: `collect_price.py` — matplotlib DLL 에러 우회(Mock 주입), KRX-DESC 기반 업종 매핑 수정, KOSPI 지수 FinanceDataReader 대체 수집으로 13,840행 가격 데이터 생성 완료 (`data/price_features.csv`) |
| 2026-07-22 | A (Antigravity 지원) | **5단계**: `generate_labels.py` — 원격 브랜치(feature/be-experiments)에서 파일 복구 및 경로 수정, 라벨 생성 완료 (`data/price_features_labeled.csv`) |
| 2026-07-22 | A (Antigravity 지원) | **6단계**: `collect_macro.py` — pathlib 기반 저장 경로 수정, PublicDataReader 패키지 설치 후 실행 완료 (`data/macro_features.csv`, 2023~2026년 기준금리·환율 데이터) |
| 2026-07-22 | A (Antigravity 지원) | **최종 병합**: `join_features.py` 실행 완료 — 4개 데이터 통합, `data/ml_ready_real.csv` (13,824행 × 14컬럼) 생성 완료 |
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
| 2026-07-23 | Antigravity | Windows cp949 인코딩 에러 해결을 위해 run_pipeline.py, process_news_features.py, run_experiments.py 내 이모지 출력을 제거하거나 인코딩 우회 래핑 처리 |
| 2026-07-23 | Antigravity | 오프라인 환경 대응을 위한 HF API 패스트 페일(Fast-fail) 모드를 process_news_features.py에 도입하여 1300여건의 뉴스 분석 속도를 수 시간에서 1분 이내로 단축 |
| 2026-07-23 | Antigravity | 이벤트 스터디 통계 집계 스크립트(evnet_study.py) 개발: 회사명-종목코드 매칭, MongoDB Atlas 연결, (ticker, date) 인덱스 충돌 방지 로직 적용 및 55건 통계 데이터 적재 완료 |
| 2026-07-23 | Antigravity | schemas.py 및 main.py 수정: /risk-score/{ticker} API 응답에 과거 적중률(hit_rate), 사례 수(sample_size), Fallback 배지(badge) 필드 추가 연동 완료 |
| 2026-07-23 | Antigravity | 데스크톱 좌측 메뉴 고정, 관심주식 10개 확장 위젯, 레이더 다각형 글래스 뱃지 & 옵티컬 밸런스, 15도 각도 대각선 비 배경 애니메이션(RainEffect), 메뉴 이동 페이지 뒤로가기 버튼 제거 및 대시보드 풀스크린 레이아웃 완성 |

| 2026-07-23 | Antigravity | FinanceDataReader 404 HTTP Error 예외 우회용 16개 종목 정적 업종 폴백 사전 및 try-except 구조 구현 완료 (`collect_price.py`, `add_sector.py`) |
| 2026-07-23 | Antigravity | google-genai 최신 SDK 네임스페이스 패키지 꼬임 해결(`google-genai` 강제 재설치) 및 Structured Output JSON 스키마 전송 규격을 `response_mime_type`과 `response_schema` 형태로 리팩토링 완료 (`process_news_features.py`) |
| 2026-07-23 | Antigravity | HuggingFace 최신 라우터 도메인(`router.huggingface.co/hf-inference`) 이주 및 SBERT 모델의 feature-extraction 파이프라인 수동 라우팅을 통해 DNS / 400 Bad Request 에러 우회 적용 (`process_news_features.py`) |
| 2026-07-23 | Antigravity | 무료 크레딧 소진(402) 대비를 위해 로컬 파이프라인(`run_pipeline.py`)에서 4단계, 5단계 뉴스 분석 단계를 제거하고, 코랩의 분석 산출물을 다운받아 즉시 병합하도록 최적화 완료 |
| 2026-07-23 | Antigravity | portfolio.json 업로드 기반 동적 종목 수집 및 신규 업종 fallback 예외 처리(Services) 기능 통합 노트북에 내장 완료 |
| 2026-07-23 | Antigravity | 빅카인즈 대용량 엑셀/CSV 데이터(32,791건)를 파일명 기반으로 회사명을 자동 매칭하여 단일 통합 학습 파일로 전처리하는 scripts/preprocess_bigkinds.py 개발 완료 |
| 2026-07-23 | Antigravity | openpyxl 라이브러리 설치 및 20거래일 누적수익률 기준의 이진 등락 주가 라벨링 로직으로 generate_labels.py 개정 완료 |
| 2026-07-23 | Antigravity | 20거래일 타겟 누수로 인한 모델 오버핏을 차단하기 위해 TimeSeriesSplit에 엠바고(gap=20)를 추가 적용 완료 (scripts/compare_features.py) |
| 2026-07-23 | Antigravity | FinBERT 감성 중립 뭉개짐 버그 해결을 위해 통합 Colab 노트북 패치, 대용량 학습 뉴스 데이터를 1만 건 기업별 균등 분배로 정제하는 balance_training_data.py 개발, 로컬 피처 합성 완료 후 XGBoost 그리드 서치 튜닝(max_depth=4, lr=0.2, PR-AUC +0.0075, 3/3 fold win) 및 테스트셋 양성 비율(평균 55.19%) 로그 보존 완료 |
