from pathlib import Path

import pandas as pd


DATA_PATH = Path(
    "data/processed/price_features_labeled.csv"
)


def main() -> None:
    df = pd.read_csv(
        DATA_PATH,
        dtype={"ticker": str},
        parse_dates=["date"],
    )

    required_columns = [
        "ticker",
        "date",
        "log_return_1d",
        "volatility_20d",
        "volume_zscore",
        "beta_60d",
        "label_direction_next_day",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"필수 컬럼 누락: {missing_columns}"
        )

    duplicate_count = df.duplicated(
        subset=["ticker", "date"]
    ).sum()

    print("=== 데이터 기본 정보 ===")
    print(f"전체 행 수: {len(df):,}")
    print(f"종목 수: {df['ticker'].nunique():,}")
    print(f"중복 ticker-date: {duplicate_count:,}")
    print(
        f"기간: {df['date'].min()} "
        f"~ {df['date'].max()}"
    )

    print("\n=== 종목별 행 수 ===")
    print(
        df.groupby("ticker")
        .size()
        .sort_values(ascending=False)
    )

    print("\n=== 결측치 개수 ===")
    print(
        df[required_columns]
        .isna()
        .sum()
    )

    print("\n=== 라벨 분포 ===")
    print(
        df["label_direction_next_day"]
        .value_counts(normalize=False)
        .sort_index()
    )

    print("\n=== 라벨 비율 ===")
    print(
        df["label_direction_next_day"]
        .value_counts(normalize=True)
        .sort_index()
        .round(4)
    )

    invalid_label_count = (
        ~df["label_direction_next_day"]
        .isin([0, 1])
    ).sum()

    if duplicate_count > 0:
        print("\n경고: ticker-date 중복이 있습니다.")

    if invalid_label_count > 0:
        print("\n경고: 0과 1이 아닌 라벨이 있습니다.")

    if df["market_return"].isna().sum() > 0 \
            if "market_return" in df.columns \
            else False:
        print("\n경고: 시장수익률 결측치가 있습니다.")


if __name__ == "__main__":
    main()