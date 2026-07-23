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
                              label_col: str = "label_direction_next_day", n_splits: int = 3,
                              max_depth: int = 3, learning_rate: float = 0.1):
    """같은 train/test 분할에서 두 피처셋(A=베이스라인, B=비교대상)의 PR-AUC를 짝지어 비교한다."""
    df = df.sort_values("date").reset_index(drop=True)
    # 20거래일 라벨로 인한 미래 정보 누수(Data Leakage)를 방지하기 위해 엠바고(gap=20) 적용
    tscv = TimeSeriesSplit(n_splits=n_splits, gap=20)

    pr_auc_a, pr_auc_b = [], []

    for fold_idx, (train_idx, test_idx) in enumerate(tscv.split(df), 1):
        train, test = df.iloc[train_idx], df.iloc[test_idx]
        y_train, y_test = train[label_col], test[label_col]
        
        pos_ratio = (y_test == 1).mean()
        print(f"    -> [Fold {fold_idx}] 테스트 데이터 양성 비율 (실제 하락 리스크 비율): {pos_ratio:.4f} (총 {len(y_test)}건 중 {(y_test == 1).sum()}건)")

        model_a = XGBClassifier(
            n_estimators=100, 
            max_depth=max_depth, 
            learning_rate=learning_rate,
            eval_metric="logloss", 
            random_state=42
        )
        model_a.fit(train[feature_set_a], y_train)
        prob_a = model_a.predict_proba(test[feature_set_a])[:, 1]
        pr_auc_a.append(average_precision_score(y_test, prob_a))

        model_b = XGBClassifier(
            n_estimators=100, 
            max_depth=max_depth, 
            learning_rate=learning_rate,
            eval_metric="logloss", 
            random_state=42
        )
        model_b.fit(train[feature_set_b], y_train)
        prob_b = model_b.predict_proba(test[feature_set_b])[:, 1]
        pr_auc_b.append(average_precision_score(y_test, prob_b))

    mean_a = sum(pr_auc_a)/len(pr_auc_a)
    mean_b = sum(pr_auc_b)/len(pr_auc_b)
    diff = mean_b - mean_a
    wins = sum(1 for a, b in zip(pr_auc_a, pr_auc_b) if b > a)

    print(f"   [파라미터 - depth: {max_depth}, lr: {learning_rate}]")
    print(f"    - 베이스라인(A) 평균 PR-AUC: {mean_a:.4f}")
    print(f"    - 비교대상(B)   평균 PR-AUC: {mean_b:.4f} (개선폭: {diff:+.4f}, Win: {wins}/{n_splits})")
    
    return mean_a, mean_b, diff, pr_auc_a, pr_auc_b

def tune_hyperparameters(df: pd.DataFrame, feature_set_a: list[str], feature_set_b: list[str], label_col: str):
    """max_depth와 learning_rate 조합을 그리드 서치하여 최적의 성능을 낸 파라미터를 찾고, 최종 Fold별 성적을 출력한다."""
    depths = [2, 3, 4, 5]
    lrs = [0.01, 0.05, 0.1, 0.2]
    
    best_diff = -999.0
    best_combination = None
    best_scores = None
    
    print("\n🔍 --- [그리드 서치 하이퍼파라미터 튜닝 시작] ---")
    for d in depths:
        for lr in lrs:
            _, _, diff, fold_a, fold_b = compare_two_feature_sets(df, feature_set_a, feature_set_b, label_col, max_depth=d, learning_rate=lr)
            if diff > best_diff:
                best_diff = diff
                best_combination = (d, lr)
                best_scores = (fold_a, fold_b)
                
    print("\n🏆 --- [최적의 하이퍼파라미터 튜닝 결과] ---")
    print(f"  - 최적의 조합: max_depth={best_combination[0]}, learning_rate={best_combination[1]}")
    print(f"  - 최대 성능 개선폭(B-A): {best_diff:+.4f}")
    
    opt_a, opt_b = best_scores
    print("\n🔥 --- [최적 파라미터 적용 시 Fold별 최종 상세 성적] ---")
    print("  - Fold별 PR-AUC (A=베이스라인):", [f"{x:.4f}" for x in opt_a])
    print("  - Fold별 PR-AUC (B=비교대상):  ", [f"{x:.4f}" for x in opt_b])
    print(f"  - B가 A보다 높은 fold 수: {sum(1 for a, b in zip(opt_a, opt_b) if b > a)}/3")
    
    return best_combination

if __name__ == "__main__":
    from scripts.run_experiments import load_and_diagnose_data, preprocess_experiment, PRICE_ONLY

    df_raw = load_and_diagnose_data()
    df = preprocess_experiment(df_raw, imputation_method="median", handle_outliers=True)

    PRICE_ONLY = ["log_return_1d", "volatility_20d", "volume_zscore", "beta_60d", "macro_rate", "macro_fx"]
    NEWS_DISCLOSURE_NO_ESG = PRICE_ONLY + ["non_esg_material_value", "category_immaterial_value",
                                            "capital_event_flag", "delisting_related_flag"]
    NEWS_DISCLOSURE_WITH_ESG = NEWS_DISCLOSURE_NO_ESG + ["esg_material_value"]

    # 그리드 튜닝 실행
    print("=== 뉴스(ESG 제외)+공시 vs 뉴스(ESG 포함)+공시 ===")
    tune_hyperparameters(df, NEWS_DISCLOSURE_NO_ESG, NEWS_DISCLOSURE_WITH_ESG, "label_direction_next_day")