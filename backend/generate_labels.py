from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_PATH = PROJECT_ROOT / "data" / "processed" / "price_features_raw.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "price_features_labeled.csv"


def add_labels(price_feature_path: Path) -> pd.DataFrame:
    df = pd.read_csv(
        price_feature_path,
        dtype={"ticker": str},
        parse_dates=["date"],
    )

    required_columns = {
        "ticker",
        "date",
        "log_return_1d",
    }

    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"라벨 생성 필수 컬럼 누락: {missing_columns}"
        )

    df = df.sort_values(
        ["ticker", "date"]
    ).reset_index(drop=True)

    # 다음 거래일의 일간 로그수익률
    df["next_day_return"] = (
        df.groupby("ticker")["log_return_1d"]
        .shift(-1)
    )

    # 다음 거래일 상승 여부
    df["label_direction_next_day"] = (
        df["next_day_return"] > 0
    ).astype("int8")

    # 종목별 마지막 행은 다음 거래일 데이터가 없으므로 제거
    df = df.dropna(
        subset=["next_day_return"]
    )

    return df.drop(
        columns=["next_day_return"]
    )


def main() -> None:
    labeled_df = add_labels(INPUT_PATH)

    OUTPUT_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    labeled_df.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8-sig",
    )

    print(f"저장 완료: {OUTPUT_PATH}")
    print("\n라벨 분포")
    print(
        labeled_df["label_direction_next_day"]
        .value_counts(dropna=False)
        .sort_index()
    )

    print("\n종목별 라벨 분포")
    print(
        labeled_df.groupby(
            ["ticker", "label_direction_next_day"]
        )
        .size()
        .unstack(fill_value=0)
    )


if __name__ == "__main__":
    main()