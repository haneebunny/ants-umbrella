from __future__ import annotations

import time
from pathlib import Path

import FinanceDataReader as fdr
import numpy as np
import pandas as pd
from pykrx import stock


START_DATE = "20230101"
END_DATE = "20260720"


# KOSPI 지수 코드
MARKET_INDEX_TICKER = "1001"

TARGET_STOCKS = {
    "373220": "LG에너지솔루션",
    "000660": "SK하이닉스",
    "005380": "현대차",
    "005930": "삼성전자",
    "005490": "POSCO홀딩스",
    "035720": "카카오",
    "035420": "NAVER",
}

RAW_DIR = Path("data/raw")
PROCESSED_DIR = Path("data/processed")


def prepare_directories() -> None:
    """데이터 저장 폴더를 생성한다."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def collect_market_index(
    start: str,
    end: str,
) -> pd.DataFrame:
    """
    FinanceDataReader로 KOSPI 지수를 가져온다.

    FDR 날짜 형식:
    YYYY-MM-DD
    """

    start_date = pd.to_datetime(
        start,
        format="%Y%m%d",
    ).strftime("%Y-%m-%d")

    end_date = pd.to_datetime(
        end,
        format="%Y%m%d",
    ).strftime("%Y-%m-%d")

    index_df = fdr.DataReader(
        "KS11",
        start_date,
        end_date,
    )

    if index_df.empty:
        raise RuntimeError(
            "FinanceDataReader에서도 "
            "KOSPI 지수 데이터가 없습니다."
        )

    index_df = (
        index_df.reset_index()
        .rename(
            columns={
                "Date": "date",
                "Close": "market_close",
                "Volume": "market_volume",
            }
        )
    )

    index_df["date"] = pd.to_datetime(
        index_df["date"]
    )

    index_df["market_return"] = np.log(
        index_df["market_close"]
        / index_df["market_close"].shift(1)
    )

    keep_columns = [
        "date",
        "market_close",
        "market_volume",
        "market_return",
    ]

    return index_df[keep_columns]


def collect_stock_ohlcv(
    ticker: str,
    company_name: str,
    start: str,
    end: str,
) -> pd.DataFrame:
    """개별 종목의 일별 수정주가와 거래량을 수집한다."""

    ohlcv = stock.get_market_ohlcv_by_date(
        fromdate=start,
        todate=end,
        ticker=ticker,
        adjusted=True,
    )

    if ohlcv.empty:
        raise RuntimeError(
            f"{company_name}({ticker}) 가격 데이터가 없습니다."
        )

    ohlcv = (
        ohlcv.reset_index()
        .rename(
            columns={
                "날짜": "date",
                "시가": "open",
                "고가": "high",
                "저가": "low",
                "종가": "close",
                "거래량": "volume",
                "거래대금": "trading_value",
                "등락률": "change_rate",
            }
        )
    )

    ohlcv["date"] = pd.to_datetime(ohlcv["date"])
    ohlcv["ticker"] = ticker
    ohlcv["company_name"] = company_name

    column_order = [
        "ticker",
        "company_name",
        "date",
        "open",
        "high",
        "low",
        "close",
        "volume",
        "trading_value",
        "change_rate",
    ]

    # pykrx 반환 열이 버전에 따라 일부 다를 가능성에 대비
    available_columns = [
        column
        for column in column_order
        if column in ohlcv.columns
    ]

    return ohlcv[available_columns]


def calculate_rolling_beta(
    stock_return: pd.Series,
    market_return: pd.Series,
    window: int = 60,
) -> pd.Series:
    """
    rolling beta = 종목·시장수익률 공분산 / 시장수익률 분산
    """

    rolling_covariance = stock_return.rolling(
        window=window,
        min_periods=window,
    ).cov(market_return)

    rolling_market_variance = market_return.rolling(
        window=window,
        min_periods=window,
    ).var()

    beta = rolling_covariance / rolling_market_variance

    # 시장수익률 분산이 0인 비정상적인 경우 제거
    return beta.replace([np.inf, -np.inf], np.nan)


def create_price_features(
    stock_df: pd.DataFrame,
    market_df: pd.DataFrame,
) -> pd.DataFrame:
    """원시 가격 데이터로 모델 입력용 가격 피처를 만든다."""

    df = stock_df.merge(
        market_df[["date", "market_return"]],
        on="date",
        how="left",
        validate="many_to_one",
    )

    df = df.sort_values("date").reset_index(drop=True)

    # 전 거래일 대비 일간 로그수익률
    df["log_return_1d"] = np.log(
        df["close"] / df["close"].shift(1)
    )

    # 20거래일 로그수익률 표준편차
    df["volatility_20d"] = (
        df["log_return_1d"]
        .rolling(window=20, min_periods=20)
        .std()
    )

    # 거래량 20거래일 이동평균·표준편차
    volume_mean_20d = (
        df["volume"]
        .rolling(window=20, min_periods=20)
        .mean()
    )

    volume_std_20d = (
        df["volume"]
        .rolling(window=20, min_periods=20)
        .std()
    )

    # 평소 거래량에서 얼마나 벗어났는지 표준화
    df["volume_zscore"] = (
        df["volume"] - volume_mean_20d
    ) / volume_std_20d.replace(0, np.nan)

    # 60거래일 롤링 베타
    df["beta_60d"] = calculate_rolling_beta(
        stock_return=df["log_return_1d"],
        market_return=df["market_return"],
        window=60,
    )

    return df


def build_schema_output(df: pd.DataFrame) -> pd.DataFrame:
    """
    C 담당자의 PriceFeature 스키마에 전달할 열만 선택한다.
    컬럼명은 임의로 변경하지 않는다.
    """

    required_columns = [
        "ticker",
        "date",
        "log_return_1d",
        "volatility_20d",
        "volume_zscore",
        "beta_60d",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"필수 컬럼이 없습니다: {missing_columns}"
        )

    return df[required_columns].copy()


def main() -> None:
    prepare_directories()

    print("KOSPI 지수 수집 중...")
    market_df = collect_market_index(
        start=START_DATE,
        end=END_DATE,
    )

    market_df.to_csv(
        RAW_DIR / "market_index.csv",
        index=False,
        encoding="utf-8-sig",
    )

    raw_results: list[pd.DataFrame] = []
    feature_results: list[pd.DataFrame] = []

    for ticker, company_name in TARGET_STOCKS.items():
        try:
            print(f"{company_name}({ticker}) 수집 중...")

            stock_df = collect_stock_ohlcv(
                ticker=ticker,
                company_name=company_name,
                start=START_DATE,
                end=END_DATE,
            )

            feature_df = create_price_features(
                stock_df=stock_df,
                market_df=market_df,
            )

            raw_results.append(stock_df)
            feature_results.append(
                build_schema_output(feature_df)
            )

            print(
                f"완료: {company_name}, "
                f"{len(stock_df):,}개 거래일"
            )

            # 연속 요청으로 인한 서버 부담 완화
            time.sleep(1)

        except Exception as error:
            print(
                f"실패: {company_name}({ticker}) / {error}"
            )

    if not raw_results:
        raise RuntimeError(
            "수집에 성공한 종목이 없습니다."
        )

    raw_price_df = pd.concat(
        raw_results,
        ignore_index=True,
    )

    price_feature_df = pd.concat(
        feature_results,
        ignore_index=True,
    )

    raw_price_df.to_csv(
        RAW_DIR / "stock_prices.csv",
        index=False,
        encoding="utf-8-sig",
    )

    price_feature_df.to_csv(
        PROCESSED_DIR / "price_features_raw.csv",
        index=False,
        encoding="utf-8-sig",
    )

    print("\n수집 완료")
    print(
        f"원시 가격: {RAW_DIR / 'stock_prices.csv'}"
    )
    print(
        "가격 피처: "
        f"{PROCESSED_DIR / 'price_features_raw.csv'}"
    )
    print(price_feature_df.tail())


if __name__ == "__main__":
    main()