# backend/scripts/run_experiments.py
import os
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score, roc_auc_score, brier_score_loss

# 1. 경로 설정
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPTS_DIR))
DATA_PATH = os.path.join(PROJECT_ROOT, "data", "ml_ready_real.csv")

# 실험용 피처 세트
PRICE_ONLY = ["log_return_1d", "volatility_20d", "volume_zscore", "beta_60d", "macro_rate", "macro_fx"]
NEWS_CATEGORY = PRICE_ONLY + ["category_material_value", "category_immaterial_value"]
FULL_FEATURES = NEWS_CATEGORY + ["capital_event_flag", "delisting_related_flag"]
LABEL_COL = "label_direction_next_day"

def load_and_diagnose_data():
    """데이터를 로드하고 결측치 및 이상치를 진단합니다."""
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"실험용 데이터가 존재하지 않습니다: {DATA_PATH}\n먼저 join_features.py를 가동하세요.")
        
    df = pd.read_csv(DATA_PATH, parse_dates=["date"])
    print(f"\n==================================================")
    print(f"📊 [데이터 기본 정보] 총 행수: {len(df)}개 | 기간: {df['date'].min().strftime('%Y-%m-%d')} ~ {df['date'].max().strftime('%Y-%m-%d')}")
    print(f"==================================================")
    
    # 2. 결측치(NaN) 분석
    print("\n[1] 🔍 결측치(NaN) 진단 리포트:")
    missing_counts = df[FULL_FEATURES].isna().sum()
    missing_pcts = df[FULL_FEATURES].isna().mean() * 100
    for col in FULL_FEATURES:
        if missing_counts[col] > 0:
            print(f"  - ⚠️ {col}: 결측치 {missing_counts[col]}개 ({missing_pcts[col]:.2f}%)")
        else:
            print(f"  - ✅ {col}: 결측치 없음 (0.00%)")
            
    # 3. 이상치(Outlier) 분석 (IQR 기준)
    print("\n[2] 🚨 이상치(Outlier) 진단 리포트 (IQR 1.5배 기준):")
    for col in PRICE_ONLY: # 수치형 가격/거시 변수만 진단
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
        outlier_pct = len(outliers) / len(df) * 100
        print(f"  - 📌 {col}: 범위 [{lower_bound:.4f} ~ {upper_bound:.4f}] | 이상치 비율 {outlier_pct:.2f}% ({len(outliers)}개)")
        
    return df

def preprocess_experiment(df: pd.DataFrame, imputation_method: str = "drop", handle_outliers: bool = False):
    """실험용 전처리 함수 (결측치 대체 및 이상치 클리핑 적용 옵션)"""
    df_processed = df.copy()
    
    # 결측치 처리 선택
    if imputation_method == "drop":
        # 결측치가 있는 행을 전부 날립니다 (현재 백엔드 기본값)
        df_processed = df_processed.dropna(subset=FULL_FEATURES + [LABEL_COL])
    elif imputation_method == "median":
        # 결측치를 중앙값으로 채웁니다 (데이터 손실 방지)
        for col in FULL_FEATURES:
            median_val = df_processed[col].median()
            df_processed[col] = df_processed[col].fillna(median_val)
        df_processed = df_processed.dropna(subset=[LABEL_COL])
        
    # 이상치 처리 선택 (클리핑/윈저라이징 기법)
    if handle_outliers:
        for col in PRICE_ONLY:
            q1 = df_processed[col].quantile(0.01) # 하위 1% 값
            q3 = df_processed[col].quantile(0.99) # 상위 99% 값
            df_processed[col] = np.clip(df_processed[col], q1, q3)
            
    df_processed = df_processed.sort_values("date").reset_index(drop=True)
    return df_processed

def run_ml_experiment(df: pd.DataFrame, feature_cols: list[str], n_estimators=100, max_depth=3, learning_rate=0.1):
    """주어진 하이퍼파라미터로 시계열 검증 모델을 실행합니다."""
    X, y = df[feature_cols], df[LABEL_COL]
    
    if len(df) < 15:
        print("  - [경고] 데이터가 부족하여 실험을 진행할 수 없습니다.")
        return None
        
    tscv = TimeSeriesSplit(n_splits=3)
    
    accs, aucs, briers = [], [], []
    
    for fold, (train_idx, test_idx) in enumerate(tscv.split(X)):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        
        # 모델 세팅 (튜닝 파라미터 적용)
        model = XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            eval_metric="logloss",
            random_state=42
        )
        model.fit(X_train, y_train)
        
        prob = model.predict_proba(X_test)[:, 1]
        pred = (prob >= 0.5).astype(int)
        
        accs.append(accuracy_score(y_test, pred))
        aucs.append(roc_auc_score(y_test, prob) if len(set(y_test)) > 1 else float("nan"))
        briers.append(brier_score_loss(y_test, prob))
        
    # 최종 결과 평균
    results = {
        "accuracy": np.nanmean(accs),
        "auc_roc": np.nanmean(aucs),
        "brier": np.nanmean(briers)
    }
    
    # 피처 기여도 추출 (마지막 Fold 기준)
    importances = pd.Series(model.feature_importances_, index=feature_cols).sort_values(ascending=False)
    
    return results, importances

if __name__ == "__main__":
    # 데이터 로드 및 진단
    df_raw = load_and_diagnose_data()
    
    print("\n==================================================")
    print("🧪 [실험 1] 기존 기본 설정 (결측치 제거, 이상치 미처리)")
    print("==================================================")
    df_exp1 = preprocess_experiment(df_raw, imputation_method="drop", handle_outliers=False)
    print(f" - 분석 데이터 건수: {len(df_exp1)}개 (결측행 제거 후)")
    
    res1, imp1 = run_ml_experiment(df_exp1, FULL_FEATURES, n_estimators=100, max_depth=3, learning_rate=0.1)
    if res1:
        print(f"  👉 [성능] Accuracy: {res1['accuracy']:.4f} | AUC-ROC: {res1['auc_roc']:.4f} | Brier Loss: {res1['brier']:.4f}")
        print("  👉 [피처 기여도 Top 3]:")
        for k, v in imp1.head(3).items():
            print(f"     * {k}: {v:.4f}")
            
    print("\n==================================================")
    print("🧪 [실험 2] 전처리 변경 (결측치 중앙값 대체 + 이상치 1~99% 클리핑)")
    print("==================================================")
    df_exp2 = preprocess_experiment(df_raw, imputation_method="median", handle_outliers=True)
    print(f" - 분석 데이터 건수: {len(df_exp2)}개 (중앙값 대체 적용 후 데이터 유실 방지)")
    
    res2, imp2 = run_ml_experiment(df_exp2, FULL_FEATURES, n_estimators=100, max_depth=3, learning_rate=0.1)
    if res2:
        print(f"  👉 [성능] Accuracy: {res2['accuracy']:.4f} | AUC-ROC: {res2['auc_roc']:.4f} | Brier Loss: {res2['brier']:.4f}")
        print("  👉 [피처 기여도 Top 3]:")
        for k, v in imp2.head(3).items():
            print(f"     * {k}: {v:.4f}")
            
    print("\n==================================================")
    print("🧪 [실험 3] 하이퍼파라미터 튜닝 (Tree 깊이 낮추고 n_estimators 확장)")
    print("==================================================")
    # 과적합을 막기 위해 깊이(max_depth)를 2로 줄이고, 나무 개수(n_estimators)를 150개로 늘린 튜닝
    res3, imp3 = run_ml_experiment(df_exp2, FULL_FEATURES, n_estimators=150, max_depth=2, learning_rate=0.05)
    if res3:
        print(f"  👉 [성능] Accuracy: {res3['accuracy']:.4f} | AUC-ROC: {res3['auc_roc']:.4f} | Brier Loss: {res3['brier']:.4f}")
        print("  👉 [피처 기여도 Top 3]:")
        for k, v in imp3.head(3).items():
            print(f"     * {k}: {v:.4f}")
            
    print("\n💡 [실험 가이드]:")
    print("  - run_experiments.py 파일의 134라인에서 n_estimators, max_depth, learning_rate 값을 직접 바꿔보며 결과를 관찰하세요!")
    print("  - 피처 중요도를 보면서 기여도가 너무 낮은 피처는 지우거나, 더 유용한 피처를 생성해 결합해 보세요.")
