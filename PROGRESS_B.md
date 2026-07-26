# PROGRESS_B

| 날짜 | 이름 | 한 일 |
| :--- | :--- | :--- |
| 2026-07-23 | Antigravity | 로컬 데이터(주가/거시/공시) 수집 기간 2020년 소급 백필(25,182행), 14,246건의 대용량 ESG 뉴스를 로컬 룰베이스로 정제 조인, run_experiments.py ML 실험 재수행 및 data_analysis_definition.md(데이터 분석 정의서) 최종 작성 완료 |
| 2026-07-23 | Antigravity | run_experiments.py 내 실험 구성을 중복 없이 깔끔한 10대 대조 실험군으로 구조화 완료하고 최종 진단 보고서(실험 10 기반) 업데이트 및 data_analysis_definition.md 싱크 정렬 완료 |
| 2026-07-23 | Antigravity | train_xgboost.py(급락 리스크 모델) 성능 개선을 위해 10가지 가중치/하이퍼파라미터 대조 실험 구동 완료. max_depth=2 축소 및 scale_pos_weight 보정을 통해 AUC-ROC 0.6246 / PR-AUC 0.2767 달성하는 최적 앙상블 조합(실험 7) 도출 |
| 2026-07-25 | Claude | 메인화면 '종목별 날씨' 번개(thunder) 과다 발생 이슈 진단·수정 (backend/main.py `_prob_to_weather`). 원인: ①모델 라벨이 20일 방향예측(coin-flip)인데 임계값이 prob_down≥0.65부터 번개라 하락 쪽이면 흔하게 발생 ②대시보드가 최신일 1건만 조회해 시장 하락일엔 전 종목이 동시 번개(공통 macro 피처) ③UI 문구는 '-10% 급락 긴급경고'로 심각도 과장. 조치: (v2) prob_down 임계값 0.45/0.60/0.75로 상향 → 전체 이력 기준 번개 14%→5% (v3) 횡단면 정규화 추가 — `_market_prob_down_baseline`으로 최신일 시장평균 하락확률 산출 후 공통분을 ALPHA(0.7)만큼 제거해 '시장 대비 종목 고유 위험' 반영. 실데이터 하락일 16종목 검증 시 번개 11→4개로 완화, 정상일엔 shift≈0으로 절대 임계값 유지. 종목<5개면 중립(0.5) 폴백 |
| 2026-07-25 | Claude | 메인화면 위젯 프론트 수정. ①StockWeatherList: '실시간' 배지 삭제, 목록 등락률(%)을 하락예측률 구간 기반 위험등급(양호/보통/위험/매우위험)으로 대체, 종목 클릭 시 상세 패널 등락률을 '주식 실시간 시세'(watchlist-prices, KIS 실시간 API)와 동일 소스로 연동(30초 폴링·부호 기준 판단). ②KosdaqMiniChart: isUp 플래그 대신 실제 등락률 부호로 판단하도록 수정해 '-5.72%'가 '+-5.72%'+초록색으로 뜨던 오류 해결. ③diagnosis/page.js: 미정의 변수 `portfolioRisk`→`simulatedRisk` 교체로 ReferenceError 해결 |
| 2026-07-25 | Claude | 'AI 판단 근거'가 항상 하드코딩처럼 보이던 문제 진단·수정. 원인 ① `gemini-1.5-flash`가 이미 서비스 종료(404)되어 매 호출 실패 → 항상 정적 폴백 문구만 출력, `.env`에 `GEMINI_MODEL=gemini-3.1-flash-lite`(현재 GA 모델) 설정으로 해결. 원인 ② `_call_gemini` 실패 시 상태코드/응답을 로그로 남기지 않아 원인 추적 불가 → 로깅 추가. 원인 ③ Mongo `ai_briefings` 캐시가 폴백 결과를 성공처럼 저장해 모델을 고쳐도 예전 실패 캐시가 영구 재사용됨 → `is_fallback` 플래그를 추가해 폴백 캐시는 히트로 치지 않고 재시도하도록 `generate_ai_briefing`/`get_weather_briefing` 수정. 추가로 프론트(`page.js`)에 브리핑 전용 전역 캐시(`globalBriefingCache`)를 도입해, 확정된 문구가 있으면 다른 페이지 이동 후 복귀 시에도 재요청·스켈레톤 재노출 없이 즉시 재사용되도록 개선 |

