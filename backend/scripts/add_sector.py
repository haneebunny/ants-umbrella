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

# 16개 핵심 포트폴리오 종목에 대한 정적 업종(섹터) 정보 백업 (FDR 404 에러 대비)
DEFAULT_SECTORS = {
    '005930': '전기전자',  # 삼성전자
    '000660': '전기전자',  # SK하이닉스
    '373220': '전기전자',  # LG에너지솔루션
    '005380': '운수장비',  # 현대차
    '000270': '운수장비',  # 기아
    '005490': '철강금속',  # POSCO홀딩스
    '035720': '서비스업',  # 카카오
    '035420': '서비스업',  # NAVER
    '068270': '의약품',    # 셀트리온
    '055550': '금융업',    # 신한지주
    '051910': '화학',      # LG화학
    '028260': '유통업',    # 삼성물산
    '017670': '통신업',    # SK텔레콤
    '010950': '화학',      # S-Oil
    '033780': '기타제조업', # KT&G
    '032830': '보험',      # 삼성생명
    '105560': '금융업'     # KB금융
}

try:
    listing = fdr.StockListing("KRX")
    if not listing.empty:
        sector_map = listing[["Code", "Industry"]].rename(columns={"Code": "ticker", "Industry": "sector"})
        sector_map["ticker"] = sector_map["ticker"].astype(str).str.zfill(6)
    else:
        raise ValueError("Empty listing")
except Exception as e:
    print(f"[WARN] FinanceDataReader 업종 수집 실패 ({e}). 백업 사전으로 대체합니다.")
    sector_map = pd.DataFrame(list(DEFAULT_SECTORS.items()), columns=["ticker", "sector"])

price_df = price_df.merge(sector_map, on="ticker", how="left")
price_df.to_csv(price_csv_path, index=False)
print(price_df[["ticker", "sector"]].drop_duplicates())