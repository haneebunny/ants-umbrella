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
| 2026-07-24 | Antigravity | verify2.py의 ml_ready_real.csv 파일 경로를 로컬 상대 경로로 수정하고 성공적으로 스크립트 실행 및 결과 검증 완료 |
| 2026-07-24 | Antigravity | verify_news_contribution.py의 ml_ready_real.csv 파일 경로를 로컬 상대 경로로 수정하고 성공적으로 스크립트 실행 및 결과 검증 완료 |
| 2026-07-24 | Antigravity | collect_news.py 복구 및 실행(1,709건 뉴스 수집), process_news_features.py를 통한 뉴스 감성/카테고리 분류, run_pipeline.py(전체 ML 파이프라인 구동) 및 save_risk_scores.py(XGBoost 예측값 적재) 실행 완료 |
| 2026-07-24 | Antigravity | 신규 한국투자증권(KIS) API 키 환경 변수 갱신 후 test_kis_api.py를 통한 실시간 현재가 조회 연동 검증 완료 |
| 2026-07-24 | Antigravity | WeatherBanner.js의 삼각함수 연산 결과에 소수점 4자리 제한(.toFixed(4))을 걸어 Hydration Mismatch 에러를 해결하고, background 단축 스타일 속성을 backgroundImage로 변경하여 React 스타일 속성 충돌 경고 해결 완료 |
| 2026-07-24 | Antigravity | 고정 사이드바 너비를 w-60(240px)에서 w-52(208px)로 축소하고 이에 맞춰 각 페이지의 메인 레이아웃 및 헤더 마진을 조정했으며, 헤더 좌측에 데스크톱 포함 전 화면에서 로고와 브랜드가 상시 노출되도록 개선 완료 |
| 2026-07-24 | Antigravity | AntPet.js 내 펫의 말풍선 메시지에서 대괄호([]) 대신 마크다운 볼드체(**)로 렌더링되게 리팩토링하고, 데스크톱 헤더 로고 중복 제거(lg:hidden 복구) 및 모바일 전용 로고 상시 출력 보완, globals.css에 클릭/호버 가능 요소 대상 전역 마우스 포인터 스타일(cursor: pointer) 강제 규칙 반영 완료 |
| 2026-07-24 | Antigravity | AssetSummaryCard.js 레이더 차트의 R 반경 축소(58->48) 및 뱃지 거리 타이트화로 데스크톱 뱃지 잘림 방지, 좁은 화면(md 미만)일 때는 SVG 뱃지를 가리고 하단에 격자형 지표 리스트가 반응형으로 노출되도록 개선 완료 |
| 2026-07-24 | Antigravity | page.js 내 메인 그리드 및 위젯들의 반응형 분기(breakpoint)를 lg(1024px)에서 xl(1280px)로 상향하여 태블릿/노트북 화면에서 관심주식을 하단으로 내리고 3열 위젯을 2열로 넉넉히 배치해 종목명 생략 버그 차단 완료 |
| 2026-07-24 | Antigravity | backend/main.py에 KIS 실시간 주가 리스트 조회 API(/api/watchlist-prices)를 신설(FDR fallback 포함)하고, WatchlistCard.js에 30초 주기 가격 폴링 연동을 부착해 실시간 실제 가격이 반영되도록 패치 완료 |
| 2026-07-24 | Antigravity | WatchlistCard.js를 '주식 실시간 시세' 위젯으로 개편: 개수 배지 및 별 버튼 제거, 별 버튼 자리에 날씨 아이콘을 좌측 배치하고 우측에 현재가와 등락률(▲/▼ 세모 기호 포함)을 한눈에 보게끔 UI 디자인 전면 수정 완료 |
| 2026-07-24 | Antigravity | backend/main.py의 AI 브리핑 및 나개미 팁 어조를 뉴닉(NEWNEEK) 스타일로 전면 개편하여 친근한 대화체와 적절한 이모지를 통해 주식 초보자 눈높이의 친숙한 설명이 되도록 수정 완료 |
| 2026-07-24 | Antigravity | stock/[ticker]/page.js (종목 상세 페이지)에서 기존 통합 '위험 근거' 섹션을 모델 예측의 핵심인 '예측 판단 근거'(공시/재무)와 단순 기사 참고인 '관련 뉴스'(ESG/산업)로 두 개의 카드 영역으로 깔끔하게 이원화 렌더링하도록 수정 완료 |
| 2026-07-24 | Antigravity | backend/main.py 및 stock/[ticker]/page.js의 예측 확신도(confidence_tier) 텍스트를 영어(strong/medium/weak) 대신 한글(높음/보통/낮음)로 전면 번역 치환하고, 종목 상세페이지의 AI 브리핑 내 마크다운 볼드(**종목명**) 파서 헬퍼를 추가하여 실제 굵은 글씨로 올바르게 렌더링되도록 패치 완료 |
| 2026-07-24 | Antigravity | stock/[ticker]/page.js의 '예측 판단 근거' 및 '관련 뉴스' 아이템 마크업을 a 태그로 변경하고 hover 스타일(커서 손가락, 배경/글자 강조)을 입혀 클릭이 가능한 직관적 형태로 개선 완료 |
| 2026-07-24 | Antigravity | backend/main.py에서 공시 타입 증거 반환 시 종목별 네이버 증권 모바일 공시 리스트 URL을 동적으로 바인딩하여 클릭 시 원본 DART 공시 조회 화면으로 유연하게 이동하도록 패치 완료 |
| 2026-07-24 | Antigravity | stock/[ticker]/page.js (종목 상세 페이지) 레이아웃의 max-w 너비를 5xl로 넓히고 mx-auto를 주어 와이드 균형을 맞췄으며, 데스크톱용 2열 반응형 그리드(좌측 차트+AI브리핑 / 우측 보유정보+판단근거+뉴스)를 적용하여 시각적 단조로움 탈피 완료 |
| 2026-07-24 | Antigravity | backend/main.py의 /risk-evidences/{ticker} API 및 stock/[ticker]/page.js에서 XGBoost 모델이 진짜 참조한 4대 핵심 계량 피처(환율, 금리, 가격변동성, ESG중대성)에 대한 분석 결과와 영향도 라벨(높음/보통/낮음)을 동적 매핑하여 렌더링하도록 AI 피처 영향도 분석 카드 신설 완료 |
| 2026-07-24 | Antigravity | stock/[ticker]/page.js (종목 상세 페이지)의 2열 레이아웃 카드 배치를 좌측 열(차트, 보유정보, AI 브리핑)과 우측 열(피처 영향도 분석, 예측 판단 근거, 관련 뉴스)로 재분배하여 정보의 계통성을 강화 완료 |
| 2026-07-24 | Antigravity | stock/[ticker]/page.js 파일 내 Icon 컴포넌트의 오기입된 임포트 경로(components/common/Icon)를 올바른 공용 경로(components/Icon)로 수정하여 빌드 타임의 모듈 조회 실패 오류 해결 완료 |
| 2026-07-24 | Antigravity | stock/[ticker]/page.js 파일의 useTheme 훅 임포트를 default import에서 named import({ useTheme }) 형식으로 변경하여 훅 로딩 실패 컴파일 에러 원천 차단 완료 |
| 2026-07-24 | Antigravity | backend/main.py 및 stock/[ticker]/page.js에 FinanceDataReader 및 DB 조회 기반 최근 7거래일 실제 종가(sparkline)를 동적 수집하여 차트에 주입하도록 구조를 혁신함으로써 특정 종목에서 차트 미표시 오류를 완전 해결 완료 |
| 2026-07-24 | Antigravity | backend/main.py의 /risk-evidences/{ticker} API 및 stock/[ticker]/page.js에 KIS 실시간 API 조회를 연계하여 신한지주(104,400원선) 포함 상세페이지 내 상단 현재가 및 등락률을 실제 한국투자증권 실시간 호가 정보로 동적 주입 및 렌더링 동기화 완료 |
| 2026-07-24 | Antigravity | /risk-evidences/{ticker} API 함수 내부에서 발생하던 모듈 및 변수(kis_key, kis_secret, datetime)의 NameError(500 Internal Server Error 원인)를 감지하고 지역 임포트 및 초기화를 보장하여 실시간 주가/피처 렌더링 실패 오류를 영구 조치 완료 |
| 2026-07-24 | Antigravity | backend/main.py에 /api/alerts API를 신설하여 DB esg_events의 최신 리스크 보도를 동적으로 긁어오도록 하고, alerts/page.js에서 이 알림 목록을 불러와 클릭 시 해당 종목 상세페이지로 바로 라우팅 이동되게 연동 완료 |
| 2026-07-24 | Antigravity | 주가변동리스크 내의 XGBoost 머신러닝 단어 직접 언급을 브랜드명인 '개미의 우산 시세 판단 시스템'으로 대체하고, evidences의 뉴스 pub_date(정규표현식 파싱 거침) 및 공시 수집 date 필드를 API를 통해 동적 반환하도록 고쳐 상세페이지 판단근거의 하드코딩 날짜 오류를 완전 수정 완료 |
| 2026-07-24 | Antigravity | AI 종합 진단 브리핑의 'AI 비서' 단어를 '개미의 우산 AI 진단 시스템'으로 교정하고, 수집된 실시간 ESG 부정 뉴스 개수(esg_count)를 브리핑 인자로 연계해 모순된 텍스트 출력을 구조적으로 해결 완료 |
| 2026-07-24 | Antigravity | macro_analysis 내 ESG 중대성 피처의 주의 임계값 조건을 esg_news_count >= 1로 수정 조정하여, 종합 브리핑 멘트와 우측 카드 판단의 모순(노이즈 있음 vs 전혀 감지 안 됨)을 완벽히 정렬하여 해결 완료 |
| 2026-07-24 | Antigravity | frontend/src/app/page.js의 마운트 생명주기에 useRouter를 추가하고, ants_survey_complete 미등록(비진단자) 유저일 때 /onboarding 페이지로 리다이렉트시키는 최초 성향분석 필수 유입 장치를 성공적으로 복원 완료 |
| 2026-07-24 | Antigravity | onboarding/page.js 레이아웃에 Header와 main 정렬 클래스를 도입해 대시보드와 구조를 맞추고, 설문 직후 ResultsScreen 리포트를 선노출한 뒤 가이드 배너의 [샘플데이터로 먼저 보기] 및 [직접 등록] 버튼 액션을 매핑해 온보딩 흐름 개편 완료 |
| 2026-07-24 | Antigravity | ThemeProvider 컨텍스트 및 AppLayoutShell 글로벌 레이아웃 구조를 layout.js에 구축해 개별 페이지들의 Header/컨테이너 중복을 완전 청산하고, Intro/SurveyScreen의 fixed 헤더 제거 및 w-full/max-w-3xl 확장 정렬로 중앙 반응형 뷰를 완벽 개선 완료 |
| 2026-07-24 | Antigravity | page.js, ResultsScreen.js, diagnosis/weather/page.js, stock/[ticker]/page.js 내 중복 Header 및 찌그러짐을 유발하던 flex 래퍼/min-h-screen/z-10 absolute 고정 마진들을 완전 청산해 공용 레이아웃 쉘 상에서 와이드하게 정상 복원 완료 |
| 2026-07-24 | Antigravity | frontend/src/app/page.js에서 중복 및 구문 오류가 있던 비정상적인 코드 조각(return문 및 컴포넌트 꼬임 현상)을 정밀 복원하고 ESLint 구문 오류를 해결하여 빌드 컴파일을 정상화 완료 |
| 2026-07-24 | Antigravity | 대시보드 및 상세 페이지의 빗방울(RainEffect) 레이어를 relative z-10 콘텐츠 뒤(배경)에만 내리도록 조절하고, 메인 대시보드 3열 그리드를 3:5:4 비율로 재조정하여 종목명 잘림 현상 해결 및 전체 페이지(인트로, 온보딩, 진단 결과, 상세 페이지, 알림 등)의 톤앤매너를 뉴닉(NEWNEEK) 친근한 말투(해요체 및 이모지)로 전면 통합 완료 |
| 2026-07-24 | Antigravity | 메인 대시보드의 포트폴리오 기상 예보 및 AI 판단 근거 Mock 데이터 문구의 '합니다/입니다' 어미를 뉴닉 친근한 어조로 최종 변환 완료하고, 진단 페이지(/diagnosis) 및 세부 날씨 페이지(/diagnosis/weather)에서 sessionStorage의 현재 활성 선택 포트폴리오를 동적 매핑하여 연동되도록 긴급 조치 완료 |
| 2026-07-24 | Antigravity | 포트폴리오 직접 등록 기능을 임시 제거(사이드바 메뉴, 종목추가 버튼, 성향진단 결과 배너 버튼, 자산 편집 버튼 차단)하고 온보딩 완료 시 /onboarding/result 라우트로 분리 이동하게 했으며, 결과 페이지에서 투자기상도/레이더/자산 탭 메뉴(하단 플로팅 바)를 숨기고 대시보드로 이동 가능한 왼쪽 공통 사이드바가 렌더링되도록 수정 및 온보딩 헤더 높이 불일치 해결 완료 |
| 2026-07-24 | Antigravity | 주식 실시간 시세 위젯에서 현재 활성화된 포트폴리오의 보유 종목들을 무조건 상단에 고정 포함(DEFAULT_WATCHLIST 병합하여 10개 구성)하도록 동적 결합을 완료하고, 대형 우량주 포트폴리오 성격에 부합하게 대시보드 지수 위젯 및 데이터를 코스닥에서 코스피(KOSPI)로 개편 적용 완료했으며, 레이더 차트의 꼭짓점 툴팁 마우스 호버 시 카드 높이 변경으로 발생하던 layout shift 및 흔들림 현상을 96px 고정 높이 래퍼 컨테이너 방식을 통해 원천 해결 완료 |
| 2026-07-24 | Antigravity | GitHub Actions 자동화 배치(.github/workflows/daily_batch.yml)의 cron 실행 스케줄을 매일 아침 7시 KST (UTC 22시)로 변경 완료 |
| 2026-07-24 | Antigravity | 메인 대시보드 진입 시 로컬스토리지에 완료된 진단 기록이 없는 신규 게스트의 경우 강제 리다이렉트시키는 대신, 대시보드 데모 모드를 개방하고 투자성향 진단을 권유하는 세련된 팝업 모달을 띄우도록 사용자 유입 흐름 전면 개선 완료 |
| 2026-07-24 | Antigravity | 위험 진단(radar) 아이콘의 윗부분 와이파이 모양 호(arc)들의 Y좌표를 2px씩 아래로 하향 조절하여 상하 시각적 밸런스를 개선하고, 데일리 배치 종료 직후 실시간 감지된 핵심 리스크(is_material == 1 및 negative) 뉴스 5건을 슬랙 채널로 즉각 전송해 주는 Block Kit 기반 자동 연동 스크립트(backend/scripts/slack_notifier.py) 및 GitHub Actions 워크플로우 연동 완료 |
