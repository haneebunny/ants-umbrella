# PROGRESS_A — AI 에이전트 수정 기록

> 이 파일은 AI 에이전트(Antigravity)가 수행한 코드 수정 내역을 날짜 순으로 기록합니다.  
> 형식: `날짜 | 파일 | 수정 내용`

---

## 2026-07-27

| 날짜 | 파일 | 수정 내용 |
|---|---|---|
| 2026-07-27 | `frontend/src/app/diagnosis/page.js` | 위험진단 페이지 상단에 중복 렌더링되던 정적 단계 표시 바(`① 위험 레이더 → ② 포트폴리오 날씨`) 제거. 클릭 기능이 있는 하단 탭 네비게이션 바(`위험 레이더 시뮬레이터 → 포트폴리오 날씨`)만 유지. |
| 2026-07-27 | `frontend/src/app/components/DiagnosisResultView.js` | 성향 종합 리포트 콘솔 에러 3건 수정: ① `useEffect` deps에 `currentRecs`(매 렌더마다 새 배열) 포함으로 인한 무한 루프 방지 → deps를 `[selectedBand, setIndex]`로 축소하고 내부에서 직접 참조하도록 변경. ② 백엔드 미연결 시 개별 fetch 실패(404 등)가 콘솔에 에러로 노출되던 문제 → 각 fetch를 try/catch로 감싸 `null` 반환하도록 수정. ③ `result/page.js`에서 전달하는 `isStandalone` prop 누락 경고 제거 → 컴포넌트 signature에 추가. |
| 2026-07-27 | `frontend/src/app/components/home/StockWeatherList.js` | 홈 대시보드 종목별 날씨에서 삼성생명(첫 번째 항목) 클릭 시 플로팅 패널의 "종목 상세 보기" 버튼이 안 눌리는 문제 수정: `overflow-hidden`으로 패널 하단 버튼이 잘리던 것 제거, 고정 `panelH=300` 대신 `estimatedH=320`으로 여유 있게 위치 계산, `top < 16` 가드 추가로 패널이 화면 위로 넘어가지 않도록 보완. |
| 2026-07-27 | `backend/main.py` | `/api/weather-briefing` AI 프롬프트 개선: 날씨가 '번개(위험)'일 때도 긍정적 문구가 출력되는 버그 수정. 기존 프롬프트에서 날씨 톤 지시가 약해 LLM이 무시하던 문제를 해결하기 위해 `TONE_INSTRUCTION` 딕셔너리(thunder/rainy/cloudy/sunny 전용 지시문)를 추가하고, `[현재 날씨 상태 — 이 지시를 최우선으로 따르세요]` 섹션으로 프롬프트 앞부분에 강제 지시. thunder·rainy 상태에서는 긍정 표현 금지 문구 명시. |



