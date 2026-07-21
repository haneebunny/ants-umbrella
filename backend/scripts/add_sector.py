# scripts/add_sector.py
import pandas as pd
import FinanceDataReader as fdr
import pathlib

# 프로젝트 루트 디렉터리 경로 설정
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent.parent
price_csv_path = BASE_DIR / "data" / "price_features_labeled.csv"

price_df = pd.read_csv(price_csv_path, dtype={"ticker": str})
price_df["ticker"] = price_df["ticker"].str.zfill(6)

# 이미 잘못 매핑된 sector 컬럼이 존재할 경우 삭제하여 중복 방지
if "sector" in price_df.columns:
    price_df = price_df.drop(columns=["sector"])

listing = fdr.StockListing("KRX-DESC")
sector_map = listing[["Code", "Industry"]].rename(columns={"Code": "ticker", "Industry": "sector"})
sector_map["ticker"] = sector_map["ticker"].astype(str).str.zfill(6)

price_df = price_df.merge(sector_map, on="ticker", how="left")
price_df.to_csv(price_csv_path, index=False)
print(price_df[["ticker", "sector"]].drop_duplicates())