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

# 피처 리스트 (Ablation 3단 전체 적용)
FEATURE_COLS = [
    "log_return_1d", "volatility_20d", "volume_zscore", "beta_60d", "macro_rate", "macro_fx",
    "category_material_value", "category_immaterial_value",
    "capital_event_flag", "delisting_related_flag"
]
LABEL_COL = "label_direction_next_day"

# 1회 bulk_write 묶음 크기 (MongoDB 서버 16MB 도큐먼트 한도를 고려)
BULK_CHUNK_SIZE = 1000

def build_operations(df_clean):
    """전체 데이터프레임으로부터 bulk_write용 UpdateOne 작업 목록 생성"""
    ops = []
    for _, row in df_clean.iterrows():
        prob_up = float(row["prob_up"])
        direction = "up" if prob_up >= 0.5 else "down"

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
    df_clean = df_clean.copy()
    df_clean["prob_up"] = probs

    # 3. MongoDB 커넥션 로드
    collection = get_collection("daily_risk_score")

    # 4. 전체 작업 목록 생성
    print(f"MongoDB bulk_write 작업 준비 중... (총 {len(df_clean)}건)")
    all_ops = build_operations(df_clean)

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
