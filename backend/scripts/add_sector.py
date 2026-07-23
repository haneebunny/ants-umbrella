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

import requests, json
from datetime import datetime, timedelta
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://data.krx.co.kr/contents/MDC/MDI/outerLoader/index.cmd'
}
url = 'http://data.krx.co.kr/comm/bldAttendant/executeForResourceBundle.cmd?baseName=krx.mdc.i18n.component&key=B128.bld'
try:
    r = requests.get(url, headers=headers)
    j = json.loads(r.text)
    date_str = j['result']['output'][0]['max_work_dt']
    base_date = datetime.strptime(date_str, '%Y%m%d')
except Exception as e:
    print(f"Error fetching latest KRX date: {e}")
    base_date = datetime.now()

df = None
for i in range(15):
    target_date = (base_date - timedelta(days=i)).strftime('%Y-%m-%d')
    csv_url = f'https://raw.githubusercontent.com/FinanceData/fdr_krx_data_cache/refs/heads/master/data/listing/desc/{target_date}.csv'
    try:
        res = requests.head(csv_url, timeout=5)
        if res.status_code == 200:
            df = pd.read_csv(csv_url, index_col=0, dtype={'Code': str})
            print(f"  [INFO] KRX 업종 맵핑 캐시 로드 성공 ({target_date})")
            break
    except Exception:
        continue

if df is None:
    print("  [WARNING] 로컬 fallback 탐색 실패, 기존 fdr.StockListing 시도")
    df = fdr.StockListing("KRX-DESC")

sector_map = df[["Code", "Industry"]].rename(columns={"Code": "ticker", "Industry": "sector"})
sector_map["ticker"] = sector_map["ticker"].astype(str).str.zfill(6)

price_df = price_df.merge(sector_map, on="ticker", how="left")
price_df.to_csv(price_csv_path, index=False)
print(price_df[["ticker", "sector"]].drop_duplicates())