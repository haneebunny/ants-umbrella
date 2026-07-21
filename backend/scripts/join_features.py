import pandas as pd
import os

def build_ml_rows(news_csv: str, price_csv: str) -> pd.DataFrame:
    news = pd.read_csv(news_csv, parse_dates=["date"])
    price = pd.read_csv(price_csv, parse_dates=["date"])

    # direction(긍정/부정)을 +1/-1로 바꿔서 severity와 곱함
    news["signed_value"] = news["news_severity"] * news["news_direction"].map(
        {"positive": 1, "negative": -1}
    )

    # material/immaterial 분리 집계 (PRD 4-3 ④ 공식)
    daily = (
        news.groupby(["ticker", "date", "is_material"])["signed_value"]
        .sum()
        .unstack(fill_value=0)
        .rename(columns={1: "category_material_value", 0: "category_immaterial_value"})
        .reset_index()
    )
    # 컬럼이 하나만 생겼을 경우(더미 데이터 편차) 방어 코드
    for col in ["category_material_value", "category_immaterial_value"]:
        if col not in daily.columns:
            daily[col] = 0.0

    merged = price.merge(daily, on=["ticker", "date"], how="left")
    merged[["category_material_value", "category_immaterial_value"]] = merged[
        ["category_material_value", "category_immaterial_value"]
    ].fillna(0.0)

    # 보조신호 플래그는 아직 A의 공시 태깅 스크립트가 없으니 0으로 채워둠 (Day2에 교체)
    merged["capital_event_flag"] = 0
    merged["delisting_related_flag"] = 0

    return merged

if __name__ == "__main__":
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(scripts_dir))
    data_dir = os.path.join(project_root, "data")
    
    news_path = os.path.join(data_dir, "news_features_dummy.csv")
    price_path = os.path.join(data_dir, "price_features_dummy.csv")
    out_path = os.path.join(data_dir, "ml_ready_dummy.csv")
    
    result = build_ml_rows(news_path, price_path)
    result.to_csv(out_path, index=False)
    print(result.head())
    print(f"\n총 {len(result)}행 생성 완료 → {out_path}")