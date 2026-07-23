# backend/scripts/generate_labels.py
from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
INPUT_PATH = PROJECT_ROOT / "data" / "processed" / "price_features_raw.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "price_features_labeled.csv"

WINDOW = 20  # 20거래일

def add_labels(price_feature_path: Path) -> pd.DataFrame:
    df = pd.read_csv(
        price_feature_path,
        dtype={"ticker": str},
        parse_dates=["date"],
    )

    required_columns = {"ticker", "date", "log_return_1d"}
    missing_columns = required_columns - set(df.columns)
    if missing_columns:
        raise ValueError(f"라벨 생성 필수 컬럼 누락: {missing_columns}")

    df = df.sort_values(["ticker", "date"]).reset_index(drop=True)

    # 1) 종목별로 20일 구간 누적합을 구함 (표준 rolling, 뒤쪽 20개를 더함)
    df["_rolling_sum_20d"] = (
        df.groupby("ticker")["log_return_1d"]
        .transform(lambda s: s.rolling(window=WINDOW, min_periods=WINDOW).sum())
    )

    # 2) t 시점의 "미래 20일 누적합" = t+20 위치의 rolling 값
    #    (rolling(20)이 i번째 행에서 구하는 값은 i-19~i 구간 합이므로,
    #     그 값을 20칸 앞으로 당기면 정확히 t+1~t+20 구간 합이 됨)
    df["future_cum_return_20d"] = (
        df.groupby("ticker")["_rolling_sum_20d"].shift(-WINDOW)
    )

    # 변수명은 하위 피처 파이프라인 호환성을 위해 유지하되, 기하학적 의미는 20일 미래 누적 증감 여부입니다.
    df["label_direction_next_day"] = (
        df["future_cum_return_20d"] > 0
    ).astype("int8")

    # 종목별 마지막 20거래일은 미래 20일치가 없어 라벨 계산 불가 → 제거
    df = df.dropna(subset=["future_cum_return_20d"])

    return df.drop(columns=["_rolling_sum_20d", "future_cum_return_20d"])

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