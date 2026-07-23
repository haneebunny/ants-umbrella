# scripts/collect_price.py
import sys
from unittest.mock import MagicMock

# matplotlib C-extension DLL 에러 우회를 위한 모킹 처리
matplotlib_mock = MagicMock()
matplotlib_mock.__path__ = []
sys.modules['matplotlib'] = matplotlib_mock
sys.modules['matplotlib.font_manager'] = MagicMock()
sys.modules['matplotlib.pyplot'] = MagicMock()

import json
import requests
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from pathlib import Path
import FinanceDataReader as fdr
from pykrx import stock

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

def get_portfolio_tickers() -> list[str]:
    portfolio_path = PROJECT_ROOT / "data" / "portfolio.json"
    with open(portfolio_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    tickers = set()
    for port in data.get("portfolios", []):
        for holding in port.get("holdings", []):
            code = holding.get("ticker")
            if code:
                tickers.add(str(code).zfill(6))
    return sorted(tickers)

def get_sector_map() -> pd.DataFrame:
    # 16개 핵심 포트폴리오 종목에 대한 정적 업종(섹터) 정보 백업 (FDR 404 에러 및 네트워크 단절 대비)
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
        try:
            print("  [WARNING] 로컬 fallback 탐색 실패, fdr.StockListing(KRX-DESC) 시도")
            df = fdr.StockListing("KRX-DESC")
            sector_map = df[["Code", "Industry"]].rename(columns={"Code": "ticker", "Industry": "sector"})
            sector_map["ticker"] = sector_map["ticker"].astype(str).str.zfill(6)
            return sector_map
        except Exception as e:
            print(f"  [ERROR] fdr.StockListing 실패 ({e}). 정적 백업 사전으로 대체합니다.")
            df = pd.DataFrame(list(DEFAULT_SECTORS.items()), columns=["ticker", "sector"])
            return df
    else:
        sector_map = df[["Code", "Industry"]].rename(columns={"Code": "ticker", "Industry": "sector"})
        sector_map["ticker"] = sector_map["ticker"].astype(str).str.zfill(6)
        return sector_map

def get_price_features(ticker: str, start: str, end: str, index_ticker: str = "1001") -> pd.DataFrame:
    ohlcv = stock.get_market_ohlcv_by_date(start, end, ticker)
    
    start_date = pd.to_datetime(start, format="%Y%m%d").strftime("%Y-%m-%d")
    end_date = pd.to_datetime(end, format="%Y%m%d").strftime("%Y-%m-%d")
    index_df = fdr.DataReader("KS11", start_date, end_date)

    df = pd.DataFrame({
        "date": ohlcv.index,
        "close": ohlcv["종가"],
        "volume": ohlcv["거래량"],
    })

    df["log_return_1d"] = np.log(df["close"] / df["close"].shift(1))
    df["volatility_20d"] = df["log_return_1d"].rolling(20).std()
    df["volume_zscore"] = (
        (df["volume"] - df["volume"].rolling(20).mean()) / df["volume"].rolling(20).std()
    )

    market_df = pd.DataFrame({
        "date": index_df.index,
        "market_close": index_df["Close"]
    })
    market_df["market_return"] = np.log(market_df["market_close"] / market_df["market_close"].shift(1))
    
    df["date"] = pd.to_datetime(df["date"])
    market_df["date"] = pd.to_datetime(market_df["date"])
    
    df = df.merge(market_df[["date", "market_return"]], on="date", how="left")
    df = df.sort_values("date").reset_index(drop=True)

    def rolling_beta(window: pd.DataFrame) -> float:
        cov = window["log_return_1d"].cov(window["market_return"])
        var = window["market_return"].var()
        return cov / var if var != 0 else np.nan

    df["beta_60d"] = [
        rolling_beta(df.iloc[max(0, i - 60):i + 1]) if i >= 59 else np.nan
        for i in range(len(df))
    ]

    df["ticker"] = str(ticker).zfill(6)
    return df[["ticker", "date", "log_return_1d", "volatility_20d", "volume_zscore", "beta_60d"]]

if __name__ == "__main__":
    sector_map = get_sector_map()
    target_tickers = get_portfolio_tickers()
    print(f"대상 종목 {len(target_tickers)}개: {target_tickers}")

    all_rows = []
    for ticker in target_tickers:
        print(f"[수집중] {ticker}")
        feat = get_price_features(ticker, "20230101", "20260721")
        all_rows.append(feat)

    price_df = pd.concat(all_rows, ignore_index=True)
    price_df = price_df.merge(sector_map, on="ticker", how="left")

    missing_sector = price_df[price_df["sector"].isna()]["ticker"].unique()
    if len(missing_sector) > 0:
        print(f"⚠️ 업종 정보 못 찾은 종목: {missing_sector}")

    price_df.to_csv(PROJECT_ROOT / "data" / "price_features_raw.csv", index=False, encoding="utf-8-sig")
    print(f"[DONE] {len(price_df)}행 저장 완료")
