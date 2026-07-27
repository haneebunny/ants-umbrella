# backend/scripts/save_risk_scores.py
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from pathlib import Path
import sys

# app 모듈 로드를 위한 경로 수정
sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.db import get_collection
from app.schemas import DailyRiskScore
from pymongo import UpdateOne

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "ml_ready_real.csv"

# 서빙 모델 피처 리스트
#
# ※ 뉴스 건수·누적 피처(news_count, news_neg_count, news_*_5d/20d)는 의도적으로 제외한다.
#   join_features.py 가 이 피처들을 만들어 ml_ready_real.csv 에 담고 있고
#   health_check.py 는 평가용으로 사용하지만, 서빙 모델에는 넣지 않는다.
#
#   근거 — 급락 예측 기여가 확인되지 않았다. 조건을 4번 바꿔가며 측정했으나
#   결론이 계속 뒤집혔고, 최종(17종목·중립 처리 개선 완료) 측정에서는 오히려 악화됐다.
#       뉴스 1종목만        ΔPR-AUC 95%CI [-0.0066, +0.0030]  P(개선)=0.25
#       17종목 확대         ΔPR-AUC 95%CI [-0.0048, +0.0049]  P(개선)=0.53
#       + 중립 처리 개선     ΔPR-AUC 95%CI [-0.0009, +0.0196]  P(개선)=0.96
#       + 전 종목 완비(최종) ΔPR-AUC 95%CI [-0.0212, -0.0027]  P(개선)=0.00  ← 악화
#   종목 하나 추가로 부호가 뒤집힌다는 것은 안정적인 신호가 없다는 뜻이다.
#   (재현: backend/scripts/health_check.py 의 D 섹션)
#
#   단 뉴스를 버리는 것은 아니다. 위험 판정의 "근거 표시"와 Slack 알림의
#   악재 필터에는 계속 사용한다. 예측이 아니라 설명을 담당하도록 역할을 나눴다.
# 피처를 2개로 줄였다. 피처를 더할수록 순위도 확률도 나빠졌기 때문이다.
# 워크포워드(엠바고 20) 실측 — 괄호는 예측평균÷실제급락률(1.0이 정확):
#     변동성 1개        PR-AUC 0.271  보정 0.96  Brier 0.175
#     변동성+수익률 2개  PR-AUC 0.270  보정 0.97  Brier 0.177   ← 채택
#     가격 4개          PR-AUC 0.260  보정 0.90  Brier 0.185
#     가격4+거시 6개     PR-AUC 0.255  보정 0.60  Brier 0.200
#     기존 10개         PR-AUC 0.254  보정 0.56  Brier 0.200
#
# 특히 거시(macro_rate·macro_fx)를 넣는 순간 보정이 0.90 → 0.60 으로 무너진다.
# 모든 종목이 같은 값을 공유하는 피처라 종목 간 판별에 기여하지 못하면서
# 확률만 왜곡시킨 것으로 보인다. 화면에 "급락 확률 N%"를 그대로 노출하므로
# 순위(PR-AUC)보다 보정이 어긋나는 쪽이 더 치명적이다.
#
# 뉴스·공시 피처도 함께 제외했다. 기여가 확인되지 않았고(아래 이력 참조)
# 확률 보정을 악화시킨다. 다만 뉴스는 위험 판정의 "근거 표시"와
# Slack 알림의 악재 필터에는 계속 사용한다 — 예측이 아니라 설명을 담당한다.
#
#   [뉴스 기여 측정 이력] backend/scripts/health_check.py D 섹션에서 재현 가능
#     뉴스 1종목만        ΔPR-AUC 95%CI [-0.0066, +0.0030]  P(개선)=0.25
#     17종목 확대         ΔPR-AUC 95%CI [-0.0048, +0.0049]  P(개선)=0.53
#     + 중립 처리 개선     ΔPR-AUC 95%CI [-0.0009, +0.0196]  P(개선)=0.96
#     + 전 종목 완비(최종) ΔPR-AUC 95%CI [-0.0212, -0.0027]  P(개선)=0.00
#   종목 하나 추가로 부호가 뒤집힌다는 것은 안정적인 신호가 없다는 뜻이다.
FEATURE_COLS = [
    "volatility_20d",   # 20일 변동성 — 단일 피처 중 급락 예측력이 가장 높다
    "log_return_1d",    # 전일 대비 수익률
]
LABEL_COL = "label_drawdown_20d"  # 주 타깃: 향후 20거래일 내 -10% 급락 여부

# 확신도 등급 기준.
# 급락 확률은 0.5가 아니라 기저율(약 0.18) 부근에 분포하므로 0.5를 기준점으로 쓰면
# 거의 모든 종목이 한쪽으로 쏠린다. 예측 분포의 중앙값을 기준점으로 삼아 위/아래가
# 고르게 갈리도록 한다. (main.py의 _WEATHER_BASELINE과 같은 이유)
CONF_WEAK_MAX = 0.30    # 기준점 대비 ±30% 미만이면 약
CONF_MEDIUM_MAX = 0.80  # ±80% 미만이면 중, 그 이상이면 강

# 1회 bulk_write 묶음 크기 (MongoDB 서버 16MB 도큐먼트 한도를 고려)
BULK_CHUNK_SIZE = 1000

def build_operations(df_clean, pivot):
    """전체 데이터프레임으로부터 bulk_write용 UpdateOne 작업 목록 생성

    pivot: 예측 급락확률 분포의 중앙값. 이 값보다 높으면 "시장 대비 위험"으로 본다.
    """
    ops = []
    for _, row in df_clean.iterrows():
        prob_crash = float(row["prob_crash"])
        # 다운스트림 호환: prob_down = 1 - prob_up 이 곧 급락 확률이 되도록 정의
        prob_up = 1.0 - prob_crash

        # 위험 방향은 분포 중앙값 대비로 판정
        direction = "down" if prob_crash >= pivot else "up"

        deviation = abs(prob_crash - pivot) / pivot if pivot > 0 else 0.0
        if deviation < CONF_WEAK_MAX:
            confidence_tier = "weak"
        elif deviation < CONF_MEDIUM_MAX:
            confidence_tier = "medium"
        else:
            confidence_tier = "strong"

        ticker = row["ticker"]
        date_str = pd.to_datetime(row["date"]).strftime("%Y-%m-%d")

        # Pydantic 스키마 정합성 검증
        risk_score = DailyRiskScore(
            ticker=ticker,
            date=date_str,
            prob_crash=prob_crash,
            prob_up=prob_up,
            direction=direction,
            confidence_tier=confidence_tier,
            model_version="v2.0-drawdown"
        )
        doc = risk_score.model_dump()
        doc["date"] = str(doc["date"])  # Date -> string

        ops.append(UpdateOne(
            {"ticker": ticker, "date": doc["date"]},
            {"$set": doc},
            upsert=True
        ))
    return ops

def main():
    if not DATA_PATH.exists():
        print(f"[ERROR] 피처 병합본이 존재하지 않습니다: {DATA_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH, dtype={"ticker": str})
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    # 추론셋과 학습셋을 분리한다.
    #  - 추론에는 피처만 있으면 된다. 라벨(label_drawdown_20d)은 미래 20거래일을
    #    참조하므로 가장 최근 20거래일에는 존재할 수 없다. 여기서 라벨 결측을 이유로
    #    행을 버리면 최신 거래일 점수가 영원히 적재되지 않는다(대시보드 20거래일 지연).
    #  - 학습에는 정답 라벨이 있는 행만 쓴다 (추론셋의 부분집합).
    df_infer = df.dropna(subset=FEATURE_COLS).copy()
    df_train = df_infer.dropna(subset=[LABEL_COL]).copy()

    if df_infer.empty:
        print(f"[ERROR] 피처가 온전한 행이 없습니다: {DATA_PATH}")
        sys.exit(1)
    if df_train.empty:
        print(f"[ERROR] 라벨({LABEL_COL})이 있는 학습용 행이 없습니다: {DATA_PATH}")
        sys.exit(1)

    unlabeled = len(df_infer) - len(df_train)
    print(f"학습 대상 {len(df_train):,}행 / 추론 대상 {len(df_infer):,}행 "
          f"(라벨 미확정 최신 {unlabeled:,}행 포함)")
    print(f"추론셋 최신 거래일: {df_infer['date'].max().date()}")

    X_train = df_train[FEATURE_COLS]
    y = df_train[LABEL_COL].astype(int)

    # 1. XGBoost 모델 학습 (라벨이 있는 행만 사용)
    #    ※ 여기서는 scale_pos_weight를 쓰지 않는다.
    #      불균형 보정은 순위 지표(PR-AUC) 평가에는 타당하지만, 예측 확률을 실제
    #      기저율(0.185)이 아니라 균형 사전분포 쪽으로 밀어올린다. 실측상 적용 시
    #      평균 확률이 0.389로 실제의 2.1배가 되고 Brier도 0.101 → 0.154로 악화됐다.
    #      이 확률은 사용자에게 "급락 확률 N%"로 그대로 표시되므로, 서빙에서는
    #      보정 없이 학습해 확률값 자체의 신뢰도를 지킨다.
    #      (불균형 보정을 적용한 Ablation 평가는 scripts/train_xgboost.py 참고)
    pos = int(y.sum())
    neg = int(len(y) - pos)
    base_rate = float(y.mean())

    print(f"급락 라벨 양성률 {base_rate:.4f} (양성 {pos:,} / 음성 {neg:,})")
    print("XGBoost 모델 훈련 개시... (확률 보정 유지를 위해 scale_pos_weight 미적용)")
    model = XGBClassifier(
        n_estimators=100,
        max_depth=3,
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(X_train, y)

    # 2. 급락 확률 추론 (prob_crash)
    #    학습은 라벨 있는 행으로만, 추론은 피처가 온전한 전 구간(최신 20거래일 포함)에 대해.
    print("종목별 예측 급락 확률 계산 중...")
    probs = model.predict_proba(df_infer[FEATURE_COLS])[:, 1]
    df_infer["prob_crash"] = probs
    print(f"  예측 평균 {probs.mean():.4f} (실제 기저율 {base_rate:.4f} — 보정 없이 일치해야 정상)")

    # 등급 판정 기준점 = 예측 분포의 중앙값 (main.py의 _WEATHER_BASELINE과 동일 개념)
    pivot = float(pd.Series(probs).median())
    print(f"등급 기준점(prob_crash 중앙값) = {pivot:.4f}")

    # 3. MongoDB 커넥션 로드
    collection = get_collection("daily_risk_score")

    # 4. 전체 작업 목록 생성
    print(f"MongoDB bulk_write 작업 준비 중... (총 {len(df_infer)}건)")
    all_ops = build_operations(df_infer, pivot)

    # 5. BULK_CHUNK_SIZE 단위로 나눠서 bulk_write 실행
    total_upserted = 0
    total_modified = 0
    for i in range(0, len(all_ops), BULK_CHUNK_SIZE):
        chunk = all_ops[i:i + BULK_CHUNK_SIZE]
        result = collection.bulk_write(chunk, ordered=False)
        total_upserted += result.upserted_count
        total_modified += result.modified_count
        print(f"  [{i + len(chunk)}/{len(all_ops)}] chunk 완료 "
              f"(신규: {result.upserted_count}, 갱신: {result.modified_count})")

    print(f"[SUCCESS] MongoDB daily_risk_score 적재 완료 — "
          f"신규 {total_upserted}건 삽입, {total_modified}건 갱신")

if __name__ == "__main__":
    main()
