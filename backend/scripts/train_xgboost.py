import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    roc_auc_score,
)

PRICE_ONLY = ["log_return_1d", "volatility_20d", "volume_zscore", "beta_60d", "macro_rate", "macro_fx"]
NEWS_CATEGORY = PRICE_ONLY + ["category_material_value", "category_immaterial_value"]
FULL = NEWS_CATEGORY + ["capital_event_flag", "delisting_related_flag"]

# 주 타깃: 향후 20거래일 내 -10% 급락 여부
LABEL_COL = "label_drawdown_20d"

# 라벨이 참조하는 미래 구간 길이. fold 경계에서 이만큼을 잘라내지 않으면
# 학습셋의 라벨이 테스트 구간을 들여다보는 look-ahead 누수가 발생한다.
EMBARGO = 20


def evaluate(df: pd.DataFrame, feature_cols: list[str], label_col: str = LABEL_COL):
    # 피처 및 라벨에 결측치가 없는 데이터만 필터링하여 스코어 계산 안정성 확보
    df_clean = df.dropna(subset=feature_cols + [label_col])
    df_clean = df_clean.sort_values("date")  # 시계열 정렬 (look-ahead bias 방지)

    X, y = df_clean[feature_cols], df_clean[label_col]

    if len(df_clean) < 10:
        return {"accuracy": float("nan"), "auc_roc": float("nan"),
                "pr_auc": float("nan"), "brier": float("nan")}

    tscv = TimeSeriesSplit(n_splits=3)
    accs, aucs, prs, briers = [], [], [], []

    for train_idx, test_idx in tscv.split(X):
        # 엠바고: 학습 구간 끝에서 EMBARGO 행을 잘라 라벨 창이 테스트와 겹치지 않게 함
        if len(train_idx) <= EMBARGO:
            continue
        train_idx = train_idx[:-EMBARGO]

        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        # 급락 라벨은 양성률 약 18%로 불균형 → scale_pos_weight로 보정
        pos = int(y_train.sum())
        neg = int(len(y_train) - pos)
        spw = (neg / pos) if pos > 0 else 1.0

        model = XGBClassifier(
            n_estimators=100,
            max_depth=3,
            eval_metric="logloss",
            scale_pos_weight=spw,
            random_state=42,
        )
        model.fit(X_train, y_train)

        prob = model.predict_proba(X_test)[:, 1]
        pred = (prob >= 0.5).astype(int)

        accs.append(accuracy_score(y_test, pred))
        if len(set(y_test)) > 1:
            aucs.append(roc_auc_score(y_test, prob))
            prs.append(average_precision_score(y_test, prob))
        briers.append(brier_score_loss(y_test, prob))

    def mean(xs):
        return sum(xs) / len(xs) if xs else float("nan")

    return {
        "accuracy": mean(accs),
        "auc_roc": mean(aucs),
        "pr_auc": mean(prs),   # 핵심 지표 (불균형 라벨이라 무작위 기준선 = 양성률)
        "brier": mean(briers),
    }


def _fmt(name: str, res: dict) -> str:
    return (f"{name:<28}"
            f"AUC-ROC {res['auc_roc']:.4f}  "
            f"PR-AUC {res['pr_auc']:.4f}  "
            f"Brier {res['brier']:.4f}  "
            f"Acc {res['accuracy']:.4f}")


if __name__ == "__main__":
    import os
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(scripts_dir))
    data_path = os.path.join(project_root, "data", "ml_ready_real.csv")

    df = pd.read_csv(data_path, parse_dates=["date"])

    print(f"=== y 라벨({LABEL_COL}) 분포 및 불균형 분석 ===")
    counts = df[LABEL_COL].value_counts(dropna=False)
    ratios = df[LABEL_COL].value_counts(normalize=True, dropna=False) * 100
    for val, cnt in counts.items():
        # 최근 20거래일은 미래 구간이 없어 라벨이 결측이다(추론 전용 행). evaluate()에서 제외됨.
        name = "라벨 미확정(추론 전용)" if pd.isna(val) else f"클래스 {int(val)}"
        print(f" - {name}: {cnt}건 ({ratios[val]:.2f}%)")
    base_rate = df[LABEL_COL].mean()
    print(f" - PR-AUC 무작위 기준선(=양성률): {base_rate:.4f}")
    print(f" - 검증: TimeSeriesSplit(n_splits=3) + 엠바고 gap={EMBARGO}")

    print("\n=== Ablation (가격+거시 → +뉴스 → +공시) ===")
    print(_fmt("1. 가격+거시 (베이스라인)", evaluate(df, PRICE_ONLY)))
    print(_fmt("2. +뉴스카테고리", evaluate(df, NEWS_CATEGORY)))
    print(_fmt("3. +공시 보조신호", evaluate(df, FULL)))
