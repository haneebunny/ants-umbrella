import pandas as pd
import numpy as np
from datetime import date, timedelta
import os

# 디렉토리 경로 자동 생성 (프로젝트 루트의 data/)
scripts_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(scripts_dir))
data_dir = os.path.join(project_root, "data")
os.makedirs(data_dir, exist_ok=True)

np.random.seed(42)
tickers = ["005930", "000660", "035420"]  # 예시 종목
dates = [date(2026, 7, 1) + timedelta(days=i) for i in range(20)]

# 더미 뉴스 피처 (B 산출물 흉내)
news_rows = []
categories = ["ESG", "실적·재무", "산업·사업동향", "문화·마케팅", "기타"]
for t in tickers:
    for d in dates:
        if np.random.rand() < 0.4:  # 뉴스 없는 날도 있게
            continue
        news_rows.append({
            "ticker": t, "date": d,
            "news_related": True,
            "news_direction": np.random.choice(["positive", "negative"]),
            "news_severity": round(np.random.rand(), 2),
            "news_category": np.random.choice(categories),
            "is_material": np.random.choice([0, 1]),
            "confidence_score": round(np.random.uniform(0.5, 0.99), 2),
        })
pd.DataFrame(news_rows).to_csv(os.path.join(data_dir, "news_features_dummy.csv"), index=False)

# 더미 가격 피처 (A 산출물 흉내)
price_rows = []
for t in tickers:
    for d in dates:
        price_rows.append({
            "ticker": t, "date": d,
            "log_return_1d": round(np.random.normal(0, 0.02), 4),
            "volatility_20d": round(np.random.uniform(0.1, 0.4), 3),
            "volume_zscore": round(np.random.normal(0, 1), 2),
            "beta_60d": round(np.random.uniform(0.7, 1.5), 2),
            "sector": "반도체" if t == "005930" else "기타업종",
            "macro_rate": 3.5, "macro_fx": 1385.2,
            "label_direction_next_day": np.random.choice([0, 1]),
        })
pd.DataFrame(price_rows).to_csv(os.path.join(data_dir, "price_features_dummy.csv"), index=False)

print(f"더미 데이터 생성 완료: {os.path.join(data_dir, 'news_features_dummy.csv')}, {os.path.join(data_dir, 'price_features_dummy.csv')}")