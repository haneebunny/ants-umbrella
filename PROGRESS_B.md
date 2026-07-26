# PROGRESS_B

| 날짜 | 이름 | 한 일 |
| :--- | :--- | :--- |
| 2026-07-23 | Antigravity | 로컬 데이터(주가/거시/공시) 수집 기간 2020년 소급 백필(25,182행), 14,246건의 대용량 ESG 뉴스를 로컬 룰베이스로 정제 조인, run_experiments.py ML 실험 재수행 및 data_analysis_definition.md(데이터 분석 정의서) 최종 작성 완료 |
| 2026-07-23 | Antigravity | run_experiments.py 내 실험 구성을 중복 없이 깔끔한 10대 대조 실험군으로 구조화 완료하고 최종 진단 보고서(실험 10 기반) 업데이트 및 data_analysis_definition.md 싱크 정렬 완료 |
| 2026-07-23 | Antigravity | train_xgboost.py(급락 리스크 모델) 성능 개선을 위해 10가지 가중치/하이퍼파라미터 대조 실험 구동 완료. max_depth=2 축소 및 scale_pos_weight 보정을 통해 AUC-ROC 0.6246 / PR-AUC 0.2767 달성하는 최적 앙상블 조합(실험 7) 도출 |
| 2026-07-25 | Claude | 메인화면 '종목별 날씨' 번개(thunder) 과다 발생 이슈 진단·수정 (backend/main.py `_prob_to_weather`). 원인: ①모델 라벨이 20일 방향예측(coin-flip)인데 임계값이 prob_down≥0.65부터 번개라 하락 쪽이면 흔하게 발생 ②대시보드가 최신일 1건만 조회해 시장 하락일엔 전 종목이 동시 번개(공통 macro 피처) ③UI 문구는 '-10% 급락 긴급경고'로 심각도 과장. 조치: (v2) prob_down 임계값 0.45/0.60/0.75로 상향 → 전체 이력 기준 번개 14%→5% (v3) 횡단면 정규화 추가 — `_market_prob_down_baseline`으로 최신일 시장평균 하락확률 산출 후 공통분을 ALPHA(0.7)만큼 제거해 '시장 대비 종목 고유 위험' 반영. 실데이터 하락일 16종목 검증 시 번개 11→4개로 완화, 정상일엔 shift≈0으로 절대 임계값 유지. 종목<5개면 중립(0.5) 폴백 |
| 2026-07-25 | Claude | 메인화면 위젯 프론트 수정. ①StockWeatherList: '실시간' 배지 삭제, 목록 등락률(%)을 하락예측률 구간 기반 위험등급(양호/보통/위험/매우위험)으로 대체, 종목 클릭 시 상세 패널 등락률을 '주식 실시간 시세'(watchlist-prices, KIS 실시간 API)와 동일 소스로 연동(30초 폴링·부호 기준 판단). ②KosdaqMiniChart: isUp 플래그 대신 실제 등락률 부호로 판단하도록 수정해 '-5.72%'가 '+-5.72%'+초록색으로 뜨던 오류 해결. ③diagnosis/page.js: 미정의 변수 `portfolioRisk`→`simulatedRisk` 교체로 ReferenceError 해결 |
| 2026-07-25 | Claude | 'AI 판단 근거'가 항상 하드코딩처럼 보이던 문제 진단·수정. 원인 ① `gemini-1.5-flash`가 이미 서비스 종료(404)되어 매 호출 실패 → 항상 정적 폴백 문구만 출력, `.env`에 `GEMINI_MODEL=gemini-3.1-flash-lite`(현재 GA 모델) 설정으로 해결. 원인 ② `_call_gemini` 실패 시 상태코드/응답을 로그로 남기지 않아 원인 추적 불가 → 로깅 추가. 원인 ③ Mongo `ai_briefings` 캐시가 폴백 결과를 성공처럼 저장해 모델을 고쳐도 예전 실패 캐시가 영구 재사용됨 → `is_fallback` 플래그를 추가해 폴백 캐시는 히트로 치지 않고 재시도하도록 `generate_ai_briefing`/`get_weather_briefing` 수정. 추가로 프론트(`page.js`)에 브리핑 전용 전역 캐시(`globalBriefingCache`)를 도입해, 확정된 문구가 있으면 다른 페이지 이동 후 복귀 시에도 재요청·스켈레톤 재노출 없이 즉시 재사용되도록 개선 |
| 2026-07-25 | Antigravity | 메인 화면 보유 자산 탭을 '주식 보유량' 카드로 개편하고, 현재가와 평단가를 연동한 수익률(%), 보유 액수 및 수익(손실) 액수 실시간 계산/표시 기능 추가 및 하단 개별 종목 자산 구성 목록에 보유량/평단가/수익률/비중 통합 렌더링 구현 완료 |
| 2026-07-26 | Antigravity | 날씨 배너 내 AI 판단 근거 렌더링 시, 동적 Gemini API 데이터를 로딩하여 화면에 뿌려주는 트랜지션 단계에서 로컬 static 템플릿 문구가 일시적으로 노출되면서 화면이 왔다갔다 깜빡이는 버그 해결을 위해 isBriefingLoading 상태인 경우 static 템플릿의 fallback 주입을 완벽 차단하도록 렌더링 연산 정교화 완료 |
| 2026-07-26 | Antigravity | page.js 내 isBriefingLoading Prop의 판단 기준에 aiSummary.length === 0 조건을 보충하여, 로딩 중이거나 찰나의 트랜지션 시점에서도 로컬 템플릿 문구의 임시 노출을 완벽하게 통제하고 스켈레톤 로더가 단단히 고정되도록 버그 최종 보완 완료 |
| 2026-07-26 | Antigravity | handleSelectPortfolio 이벤트 핸들러 내부에서 성향 전환 즉시 대상 포트폴리오의 캐시 유무를 동기 조회하여 캐시 로드 혹은 즉시 aiSummary 초기화 및 briefingLoading=true 전환을 선제 실행하도록 개선하여 성향 탭 변경 시의 플리커링(이전 성향의 AI 답변 노출) 버그 완전 해결 완료 |
| 2026-07-26 | Antigravity | handleSelectPortfolio 핸들러에서 liveStockList 상태를 다음 포트폴리오의 캐시 유무에 따라 동기 리셋해 주도록 보강하여, 포트폴리오 변경 시 이전 날씨 테마/이모티콘이 화면에 선노출되는 찰나의 플리커링 버그를 원천 차단 완료 |
| 2026-07-26 | Antigravity | AssetChart.js의 자산 목록에 종목별 평가 금액(검정) 및 손익금(수익: 초록, 손실: 빨강)을 계산하여 수익률 왼쪽 가로 flex 레이아웃으로 추가 표출하고, WatchlistCard.js 및 main.py에 한국전력(015760, Mock가 21,000원)을 신규 등록하여 실시간 관심종목 시세판 연동 완료 |
| 2026-07-26 | Antigravity | WatchlistCard.js의 DEFAULT_WATCHLIST 내 한국전력(015760)의 순서를 4순위로 전진 배치하여, 보유 종목 수로 인한 10개 slice 제한 한도 내에 안전하게 정렬 노출되도록 배치 순서 조정 완료 |
| 2026-07-26 | Antigravity | 보유 종목 수가 8개인 SASB 다각화형 포트폴리오 선택 시 추천 관심주 잔여 슬롯(2개) 제한으로 한국전력이 슬라이싱 누락되는 문제를 해결하기 위해, WatchlistCard.js 내 한국전력(015760)의 추천 순위를 1순위로 격상 배치하여 노출 보장 완료 |
