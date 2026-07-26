# TODO_B — 작업 현황 및 남은 할 일 (2026-07-25 기준)

> PROGRESS.md와의 git 충돌을 피하기 위해 이 브랜치(progress_B) 작업 기록·할 일은
> 이 파일(TODO_B.md)과 PROGRESS_B.md에만 정리합니다.

## 완료된 작업

| 영역 | 내용 | 파일 |
| :--- | :--- | :--- |
| 종목별 날씨 로직 | 번개(thunder) 과다 발생 임계값 재보정. `prob_down` 컷을 0.45/0.60/0.75로 상향 | `backend/main.py` `_prob_to_weather` |
| 종목별 날씨 로직 | 횡단면 정규화 추가. 시장 하락일에 전 종목이 동시에 번개가 되는 쏠림을 완화 | `backend/main.py` `_market_prob_down_baseline` |
| 종목별 날씨 위젯 | '실시간' 배지 버튼 삭제 | `frontend/.../home/StockWeatherList.js` |
| 종목별 날씨 위젯 | 목록 등락률(%) → 하락위험 등급(양호/보통/위험/매우위험)으로 대체 | 〃 |
| 종목별 날씨 위젯 | 종목 클릭 상세 패널 등락률을 '주식 실시간 시세'(watchlist-prices, KIS API)와 동일 소스로 연동 | 〃 |
| 코스피 위젯 | `isUp` 플래그 대신 실제 등락률 부호로 판단하도록 수정. `-5.72%`가 `+-5.72%`+초록색으로 뜨던 오류 해결 | `frontend/.../home/KosdaqMiniChart.js` |
| 진단 페이지 | 미정의 변수 `portfolioRisk` → `simulatedRisk`로 수정 (ReferenceError 해결) | `frontend/src/app/diagnosis/page.js` |
| AI 판단 근거 | 원인 진단: `gemini-1.5-flash`가 이미 서비스 종료(404)되어 항상 폴백 문구만 출력되고 있었음 | `backend/main.py` `_call_gemini` |
| AI 판단 근거 | `.env`에 `GEMINI_MODEL=gemini-3.1-flash-lite`(현재 GA 모델) 설정 | `backend/.env` (git 미추적) |
| AI 판단 근거 | Gemini 호출 실패 시 상태코드/응답을 로그로 남기도록 수정 (기존엔 조용히 무시됨) | `backend/main.py` `_call_gemini` |
| AI 판단 근거 | 캐시에 `is_fallback` 플래그 추가 — 과거 실패로 저장된 폴백 문구를 캐시 히트로 재사용하지 않고 재시도하도록 수정 | `backend/main.py` `generate_ai_briefing`, `get_weather_briefing` |

## 지금 당장 해야 할 일 (우선순위 순)

1. **백엔드 서버 재시작** — `.env`의 `GEMINI_MODEL` 변경과 캐시 로직 수정을 반영하려면 재시작이 필요함. 재시작 없이는 계속 예전 상태로 동작함.
2. **재시작 후 로그 확인**
   - `[CACHE SET] weather_briefing ... fallback=False` 가 찍히면 정상 (실제 LLM 문구 사용 중)
   - `fallback=True`가 계속 찍히면 바로 위에 `[WARN] Gemini API 호출 실패 (status=...)` 로그가 함께 남으므로, 그 상태코드로 원인(모델명 오탈자/쿼터 초과/리전 제한/키 만료 등) 파악
3. **`backend/main.py` 커밋 & 푸시** — Gemini 로깅 개선 + `is_fallback` 캐시 수정 건이 아직 커밋되지 않은 상태 (워킹트리에 남아 있음). `PROGRESS_B.md`에도 기록 추가 후 커밋 권장.
4. **화면에서 실제 확인** — 메인 화면 '오늘 내 포트폴리오 날씨' 배너와 종목 상세 패널의 'AI 판단 근거'가 매번 조금씩 다른 문장으로 나오는지 확인 (날씨 상태/하락 종목 구성이 그대로면 캐시로 동일 문구가 나오는 게 정상이며, 이건 의도된 동작).

## 검토 중 / 선택적 후속 개선 (아직 미적용)

- **프롬프트 데이터 보강**: 현재 `/api/weather-briefing` 프롬프트에는 날씨 라벨과 하락종목 이름만 들어가고 ESG 점수·하락확률 수치·종목별 사유는 빠져 있음. 이걸 포함하면 매번 더 구체적이고 다양한 문장이 나옴.
- **프론트 이중 폴백 정리**: `WeatherBanner.js`에 백엔드와 별개로 자체 하드코딩 폴백(`WEATHER_COMMENTS`)이 하나 더 있음. 백엔드 응답이 아예 안 올 때만 쓰이지만, 문구 톤이 서로 달라 일원화 필요.
- **캐시 만료 정책**: 현재 fingerprint에 날짜가 포함되지 않아, 날씨 상태·하락종목 구성이 오래 안 바뀌면 같은 문구가 계속 유지됨(의도된 최적화이나, 필요시 일 단위 강제 재생성 로직 고려 가능).
- **`gemini-3.1-flash-lite` 실제 운영 검증**: 이 작업 환경은 외부 네트워크(Gemini API, MongoDB)가 막혀 있어 실제 호출 성공 여부를 직접 테스트하지 못함. 반드시 실제 서버에서 1회 확인 필요.
- **`.gitattributes` 도입 검토**: 저장소 전체가 CRLF/LF 혼재 상태라 매 커밋마다 노이즈 diff가 발생함. `* text=auto eol=lf` 추가로 근본 정리 가능 (원치 않으면 보류).

## 참고 — Git 작업 시 유의사항

- 이 환경(Cowork 샌드박스)에는 GitHub 인증 정보가 없어 `git push`는 항상 실패함 → 커밋까지만 여기서 처리하고, push는 사용자 터미널에서 실행 필요.
- 진행 기록은 `PROGRESS.md`가 아니라 `PROGRESS_B.md`에만 반영 (충돌 방지, 사용자 지정 규칙).
