# scripts/compare_features.py
import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import average_precision_score
from scipy import stats
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

def compare_two_feature_sets(df: pd.DataFrame, feature_set_a: list[str], feature_set_b: list[str],
                              label_col: str = "label_direction_next_day", n_splits: int = 3):
    """같은 train/test 분할에서 두 피처셋(A=베이스라인, B=비교대상)의 PR-AUC를 짝지어 비교한다."""
    df = df.sort_values("date").reset_index(drop=True)
    tscv = TimeSeriesSplit(n_splits=n_splits)

    pr_auc_a, pr_auc_b = [], []

    for train_idx, test_idx in tscv.split(df):
        train, test = df.iloc[train_idx], df.iloc[test_idx]
        y_train, y_test = train[label_col], test[label_col]

        model_a = XGBClassifier(n_estimators=100, max_depth=3, eval_metric="logloss", random_state=42)
        model_a.fit(train[feature_set_a], y_train)
        prob_a = model_a.predict_proba(test[feature_set_a])[:, 1]
        pr_auc_a.append(average_precision_score(y_test, prob_a))

        model_b = XGBClassifier(n_estimators=100, max_depth=3, eval_metric="logloss", random_state=42)
        model_b.fit(train[feature_set_b], y_train)
        prob_b = model_b.predict_proba(test[feature_set_b])[:, 1]
        pr_auc_b.append(average_precision_score(y_test, prob_b))

    print("Fold별 PR-AUC (A=베이스라인):", [f"{x:.4f}" for x in pr_auc_a])
    print("Fold별 PR-AUC (B=비교대상):  ", [f"{x:.4f}" for x in pr_auc_b])

    diffs = [b - a for a, b in zip(pr_auc_a, pr_auc_b)]
    wins = sum(1 for d in diffs if d > 0)
    print(f"\nB가 A보다 높은 fold 수: {wins}/{len(diffs)}")
    print(f"평균 차이(B-A): {sum(diffs)/len(diffs):+.4f}")

    if len(diffs) >= 5:
        stat, p_value = stats.wilcoxon(pr_auc_b, pr_auc_a)
        print(f"Wilcoxon 검정 p-value: {p_value:.4f} ({'유의미함 (p<0.05)' if p_value < 0.05 else '유의미하다고 말하기 어려움'})")
    else:
        print("\n⚠️ fold 수가 3~4개뿐이라 정식 통계 검정(p-value)은 신뢰하기 어렵다.")
        print("   대신 '모든 fold에서 일관되게 B가 이기는지'를 근거로 삼는 게 현실적이다.")
        print(f"   → 지금 결과: {wins}/{len(diffs)} fold에서 B가 A보다 높음")

    return pr_auc_a, pr_auc_b

if __name__ == "__main__":
    from scripts.run_experiments import load_and_diagnose_data, preprocess_experiment, PRICE_ONLY

    df_raw = load_and_diagnose_data()
    df = preprocess_experiment(df_raw, imputation_method="median", handle_outliers=True)

    PRICE_ONLY = ["log_return_1d", "volatility_20d", "volume_zscore", "beta_60d", "macro_rate", "macro_fx"]
    NEWS_DISCLOSURE_NO_ESG = PRICE_ONLY + ["non_esg_material_value", "category_immaterial_value",
                                            "capital_event_flag", "delisting_related_flag"]
    NEWS_DISCLOSURE_WITH_ESG = NEWS_DISCLOSURE_NO_ESG + ["esg_material_value"]

    # 실행
    print("=== 뉴스(ESG 제외)+공시 vs 뉴스(ESG 포함)+공시 ===")
    compare_two_feature_sets(df, NEWS_DISCLOSURE_NO_ESG, NEWS_DISCLOSURE_WITH_ESG)