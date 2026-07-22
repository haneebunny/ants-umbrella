# PROGRESS_A — A 파트 작업 기록

| 날짜 | 이름 | 한 일 |
| :--- | :--- | :--- |
| 2026-07-22 | A (Antigravity 지원) | Poetry 캐시 권한 에러 우회(Cache_new 경로 변경) 조치 완료 |
| 2026-07-22 | A (Antigravity 지원) | **2단계**: `process_news_features.py` — pkl 피클 로더 변경(torch→pickle), Gemini API 키 예외 처리 보완, 뉴스 피처 578건 생성 완료 (`data/news_features_day2.csv`) |
| 2026-07-22 | A (Antigravity 지원) | **3단계**: `collect_dart.py` — 가이드 규격으로 교체, DART_API_KEY/OPENDART_API_KEY 이중 지원 추가 후 공시 수집 완료 (`data/supplementary_signals.csv`) |
| 2026-07-22 | A (Antigravity 지원) | **4단계**: `collect_price.py` — matplotlib DLL 에러 우회(Mock 주입), KRX-DESC 기반 업종 매핑 수정, KOSPI 지수 FinanceDataReader 대체 수집으로 13,840행 가격 데이터 생성 완료 (`data/price_features.csv`) |
| 2026-07-22 | A (Antigravity 지원) | **5단계**: `generate_labels.py` — 원격 브랜치(feature/be-experiments)에서 파일 복구 및 경로 수정, 라벨 생성 완료 (`data/price_features_labeled.csv`) |
| 2026-07-22 | A (Antigravity 지원) | **6단계**: `collect_macro.py` — pathlib 기반 저장 경로 수정, PublicDataReader 패키지 설치 후 실행 완료 (`data/macro_features.csv`, 2023~2026년 기준금리·환율 데이터) |
| 2026-07-22 | A (Antigravity 지원) | **최종 병합**: `join_features.py` 실행 완료 — 4개 데이터 통합, `data/ml_ready_real.csv` (13,824행 × 14컬럼) 생성 완료 |
