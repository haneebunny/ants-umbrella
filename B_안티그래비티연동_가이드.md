# B 가이드 — run_experiments.py로 튜닝 실험하기

## 지금 전체 파이프라인에서 어디를 작업 중인가

```
[A 담당] process_news_features.py
   - B가 준 모델(weights.pt + classfier_head.pkl)로 방향·강도 판정
   - B가 준 materiality_map으로 is_material 판정
        │
        ▼  news_features_day2.csv
[C 담당] join_features.py
   - A의 뉴스 + 가격/공시 + 거시지표를 종목·날짜로 조인
        │
        ▼  ml_ready_real.csv
[B 담당] run_experiments.py                           ← 지금 여기
   - 결측치/이상치 처리 방식 실험
   - XGBoost 하이퍼파라미터 튜닝
   - 데이터 분석 정의서 작성
```

**담당 범위**: `run_experiments.py` 실행·튜닝, `materiality_map.csv` 작성, 최종 "데이터 분석 정의서" 문서화. (모델 자체를 만드는 Colab 작업은 이미 끝냈고, `classfier_head.pkl`에 `id2label` 라벨 순서까지 넣어서 넘긴 것 확인함 — 덕분에 A가 라벨 순서를 추측할 필요가 없어졌다.)

**받는 것 (협업 필요)**: C로부터 `ml_ready_real.csv` — 이게 없으면 오늘 실험을 못 돌린다.

**넘기는 것**: `materiality_map.csv`는 A에게 (A의 `is_material` 계산에 씀), 최종 튜닝 결과·데이터 분석 정의서는 팀 전체(발표자료용)에게.

**참고**: A의 `process_news_features.py`에 이제 Gemini API 폴백이 추가됐다(키워드/모델이 애매해할 때만 호출). `GEMINI_API_KEY`는 A가 개별 발급받아 쓰면 되고, B의 `run_experiments.py`에는 영향 없음 — 그냥 A 쪽 파이프라인이 더 정교해졌다고 알아두면 된다.

---

## 지금 상태 요약

`run_experiments.py`는 이미 잘 짜여 있다. 큰 수정 없이 실행하면서 결과를 읽고, 숫자를 바꿔가며 실험하는 게 오늘 할 일이다. 손댈 게 많은 A와 달리, B는 **실행 전제조건 맞추기 + 숫자 실험 + 결과 해석**이 중심이다.

---

## 0. 지금 당장 실행 가능한가? — 아니다, 순서가 있다

`run_experiments.py`는 `data/ml_ready_real.csv`(12번 줄)를 읽는다. 이 파일은 **C가 `join_features.py`를 실제 데이터로 돌려야 생긴다.** 아직 안 됐으면(지금 상태), 23번 줄에서 바로 `FileNotFoundError`가 난다.

**지금 할 수 있는 것 두 가지:**
1. C한테 "`ml_ready_real.csv` 나왔어?" 확인 — 나왔으면 바로 2단계로
2. 아직이면, 아래 1단계(materiality_map 파일 배치)만 먼저 끝내놓고 대기

---

## 1. materiality_map.csv 배치

`materiality_map_draft.csv`를 아래 경로·이름으로 옮겨라:

```
data/reference/materiality_map.csv
```

A의 `process_news_features.py`가 이 정확한 경로에서 파일을 읽게 되어 있다(A 가이드 참고). 이름·위치가 다르면 A쪽이 에러 난다.

**지금 이 파일 내용도 알아둬야 할 것**: 지금은 모든 업종(SASB 11개)이 카테고리별로 똑같은 값이다 (`ESG`/`실적·재무`=1, 나머지=0). 업종별로 다르게 정교화하는 건 아직 안 한 상태 — 시간 남으면 업종별 특성 반영해서 세분화할 수 있지만, 지금은 이대로도 파이프라인이 정상 작동한다.

---

## 2. `data/ml_ready_real.csv`가 생기면 — 그냥 실행

```bash
poetry run python scripts/run_experiments.py
```

세 가지 실험이 순서대로 돌아간다:
1. **실험 1**: 결측치는 그냥 버림, 이상치 처리 안 함 (제일 단순한 기본값)
2. **실험 2**: 결측치는 중앙값으로 채움, 이상치는 1~99% 구간으로 깎음
3. **실험 3**: 실험 2 데이터에 + 나무 깊이를 2로 낮추고 나무 개수를 150개로 늘림 (과적합 방지 튜닝)

출력 맨 위에는 **결측치·이상치 진단 리포트**가 먼저 뜬다. 여기서 결측치 비율이 20~30% 넘는 컬럼이 있으면, 그 피처는 신뢰도가 낮다고 봐야 한다.

---

## 3. 결과 읽는 법

각 실험마다 이렇게 출력된다:
```
👉 [성능] Accuracy: 0.5230 | AUC-ROC: 0.5410 | Brier Loss: 0.2480
👉 [피처 기여도 Top 3]:
   * category_material_value: 0.1823
   * volatility_20d: 0.1502
   * beta_60d: 0.1290
```

- **Accuracy 0.5 근처** = 동전 던지기 수준. 낮다고 실패가 아니라 "아직 신호가 약하다"는 뜻.
- **AUC-ROC**가 실험 1→2→3으로 갈수록 올라가면 그 전처리/튜닝이 도움 된 것. 내려가면 그 방법이 이 데이터엔 안 맞는 것 — 둘 다 유의미한 결과다.
- **Brier Loss는 낮을수록 좋다** (0에 가까울수록 예측 확률이 실제와 잘 맞음).
- **피처 기여도 Top 3**에 `category_material_value`(뉴스 신호)가 있으면, 우리가 공들인 뉴스 파이프라인이 실제로 예측에 기여하고 있다는 뜻 — 발표에서 강조할 포인트.

---

## 4. 직접 숫자 바꿔보는 실습

파일 끝부분(정확히는 **159번 줄** — 콘솔에 "134라인"이라고 뜨는데 실제로는 159번 줄이니 그건 무시)에서 아래 값들을 바꿔가며 재실행해봐라:

```python
res3, imp3 = run_ml_experiment(df_exp2, FULL_FEATURES, n_estimators=150, max_depth=2, learning_rate=0.05)
```

- `n_estimators` (나무 개수): 50~300 사이로 바꿔보기
- `max_depth` (나무 깊이): 2, 3, 5, 8 각각 시도 — 8처럼 너무 깊게 주면 과적합으로 오히려 성능이 떨어지는 걸 확인할 수 있다
- `learning_rate`: 0.01~0.3 사이로 바꿔보기

바꿀 때마다 Accuracy/AUC-ROC가 어떻게 변하는지 표로 기록해두면, 그게 그대로 "데이터 분석 정의서"의 핵심 내용이 된다.

---

## 5. "데이터 분석 정의서" 작성 — Antigravity가 요청한 최종 산출물

아래 틀로 정리하면 된다:

```markdown
# 데이터 분석 정의서

## 1. 실험 설계
- 베이스라인: 가격/거시 피처만 사용
- 실험군 A: +뉴스카테고리 신호(category_material_value/immaterial_value)
- 실험군 B: +보조신호(capital_event_flag/delisting_related_flag)
- 검증 방식: TimeSeriesSplit(n_splits=3), 시간 순서 유지(look-ahead bias 방지)

## 2. 전처리 비교
| 방법 | 결측치 처리 | 이상치 처리 | Accuracy | AUC-ROC | Brier |
|---|---|---|---|---|---|
| 실험 1 | 행 제거 | 미적용 | ... | ... | ... |
| 실험 2 | 중앙값 대체 | 1~99% 클리핑 | ... | ... | ... |

## 3. 하이퍼파라미터 튜닝
| n_estimators | max_depth | learning_rate | Accuracy | AUC-ROC |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## 4. 피처 기여도 분석
(Top 3~5 피처와 해석)

## 5. 결론
- 베이스라인 대비 개선폭
- 어떤 전처리/튜닝이 가장 효과적이었는지
- 한계점 (데이터 규모, 기간 등)
```

3~4번 표는 위 4번 섹션 실습하면서 나온 숫자를 그대로 채우면 된다.

---

## 6. 체크리스트

- [ ] `materiality_map_draft.csv` → `data/reference/materiality_map.csv`로 이름·위치 맞춤
- [ ] C에게 `ml_ready_real.csv` 생성 여부 확인
- [ ] 파일 생기면 `run_experiments.py` 기본 실행, 결측치·이상치 진단 리포트 읽기
- [ ] 하이퍼파라미터(n_estimators/max_depth/learning_rate) 최소 3가지 조합 이상 시도하고 기록
- [ ] 피처 기여도 Top 3 확인 — 뉴스 신호가 실제로 기여하는지
- [ ] 데이터 분석 정의서 초안 작성 (위 5번 틀 사용)
