import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score, roc_auc_score, brier_score_loss

PRICE_ONLY = ["log_return_1d", "volatility_20d", "volume_zscore", "beta_60d", "macro_rate", "macro_fx"]
NEWS_CATEGORY = PRICE_ONLY + ["category_material_value", "category_immaterial_value"]
FULL = NEWS_CATEGORY + ["capital_event_flag", "delisting_related_flag"]

def evaluate(df: pd.DataFrame, feature_cols: list[str], label_col: str = "label_direction_next_day"):
    df = df.sort_values("date")  # 시계열 정렬 (look-ahead bias 방지)
    X, y = df[feature_cols], df[label_col]

    tscv = TimeSeriesSplit(n_splits=3)
    accs, aucs, briers = [], [], []

    for train_idx, test_idx in tscv.split(X):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        model = XGBClassifier(n_estimators=100, max_depth=3, eval_metric="logloss")
        model.fit(X_train, y_train)

        prob = model.predict_proba(X_test)[:, 1]
        pred = (prob >= 0.5).astype(int)

        accs.append(accuracy_score(y_test, pred))
        aucs.append(roc_auc_score(y_test, prob) if len(set(y_test)) > 1 else float("nan"))
        briers.append(brier_score_loss(y_test, prob))

    return {
        "accuracy": sum(accs) / len(accs),
        "auc_roc": sum(aucs) / len(aucs),
        "brier": sum(briers) / len(briers),
    }

if __name__ == "__main__":
    import os
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(scripts_dir))
    data_path = os.path.join(project_root, "data", "ml_ready_dummy.csv")
    
    df = pd.read_csv(data_path, parse_dates=["date"])

    print("=== Ablation 1: 베이스라인 (가격 피처만) ===")
    print(evaluate(df, PRICE_ONLY))

    print("\n=== Ablation 2: +뉴스카테고리 신호 ===")
    print(evaluate(df, NEWS_CATEGORY))

    print("\n=== Ablation 3: +뉴스카테고리+보조신호(자본이벤트/상장폐지) ===")
    print(evaluate(df, FULL))