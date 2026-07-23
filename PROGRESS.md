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

