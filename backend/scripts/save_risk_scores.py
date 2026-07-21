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

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "ml_ready_real.csv"

# 피처 리스트 (Ablation 3단 전체 적용)
FEATURE_COLS = [
    "log_return_1d", "volatility_20d", "volume_zscore", "beta_60d", "macro_rate", "macro_fx",
    "category_material_value", "category_immaterial_value",
    "capital_event_flag", "delisting_related_flag"
]
LABEL_COL = "label_direction_next_day"

def main():
    if not DATA_PATH.exists():
        print(f"[ERROR] 피처 병합본이 존재하지 않습니다: {DATA_PATH}")
        sys.exit(1)
        
    df = pd.read_csv(DATA_PATH, dtype={"ticker": str})
    
    # 결측치 정제
    df_clean = df.dropna(subset=FEATURE_COLS + [LABEL_COL]).copy()
    df_clean = df_clean.sort_values("date")
    
    X = df_clean[FEATURE_COLS]
    y = df_clean[LABEL_COL]
    
    # 1. XGBoost 모델 전체 학습
    print("XGBoost 모델 훈련 개시...")
    model = XGBClassifier(n_estimators=100, max_depth=3, eval_metric="logloss", random_state=42)
    model.fit(X, y)
    
    # 2. 상승 확률 추론 (prob_up)
    print("종목별 예측 상승 확률 계산 중...")
    probs = model.predict_proba(X)[:, 1]
    df_clean["prob_up"] = probs
    
    # 3. MongoDB 커넥션 로드
    print("MongoDB daily_risk_score 컬렉션 동기화 중...")
    collection = get_collection("daily_risk_score")
    
    upsert_count = 0
    # 모든 과거 예측 데이터를 이력으로 upsert 적재
    for idx, row in df_clean.iterrows():
        prob_up = float(row["prob_up"])
        direction = "up" if prob_up >= 0.5 else "down"
        
        # 신뢰 등급(confidence_tier) 계산 (PRD 287라인)
        deviation = abs(prob_up - 0.5)
        if deviation < 0.1:
            confidence_tier = "weak"
        elif deviation <= 0.25:
            confidence_tier = "medium"
        else:
            confidence_tier = "strong"
            
        ticker = row["ticker"]
        date_str = pd.to_datetime(row["date"]).strftime("%Y-%m-%d")
        
        # Pydantic 스키마 정합성 검증
        risk_score = DailyRiskScore(
            ticker=ticker,
            date=date_str,
            prob_up=prob_up,
            direction=direction,
            confidence_tier=confidence_tier,
            model_version="v1.0"
        )
        
        # MongoDB 도큐먼트 적재용 직렬화 가공
        doc = risk_score.model_dump()
        doc["date"] = str(doc["date"]) # Date -> string
        
        # 복합 인덱스 (ticker, date) 기준 중복 차단 및 업서트 실행
        collection.update_one(
            {"ticker": ticker, "date": doc["date"]},
            {"$set": doc},
            upsert=True
        )
        upsert_count += 1
        
    print(f"[SUCCESS] 총 {upsert_count}건의 리스크 점수를 MongoDB daily_risk_score 컬렉션에 적재 완료했습니다.")

if __name__ == "__main__":
    main()
