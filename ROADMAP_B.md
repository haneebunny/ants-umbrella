# ROADMAP_B (B 파트 로드맵 진행 상황)

깃 충돌을 방지하기 위해 `ROADMAP.md` 대신 B 파트 담당 체크리스트만 따로 관리하는 문서입니다.

---

## B 파트 담당 체크리스트 (Day 3 & Day 4)

- [x] `materiality_map_draft.csv` -> `data/reference/materiality_map.csv` 이름 및 위치 맞춤 확인
- [x] C로부터 `ml_ready_real.csv` 생성 완료 확인
- [x] `run_experiments.py` 가동 및 결측치/이상치 진단 리포트 수집
- [x] 하이퍼파라미터(`n_estimators`, `max_depth`, `learning_rate`) 최소 3가지 조합 시도 및 비교 분석 완료
- [x] 피처 기여도 Top 3 확인 (뉴스 신호 기여 여부 판정)
- [x] 데이터 분석 정의서 작성 (`data_analysis_definition.md`) 완료
- [x] Ablation 결과(loss curve, Accuracy/AUC-ROC 비교표 등) 문서로 정리 완료
