# backend/scripts/generate_labels.py
from pathlib import Path
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
INPUT_PATH = PROJECT_ROOT / "data" / "price_features_raw.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "price_features_labeled.csv"

WINDOW = 20  # 20거래일
DRAWDOWN_THRESHOLD = -0.10  # 급락 판정 기준: 20거래일 내 최대낙폭 -10% 이하

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
    # 미래 구간이 아직 없는 행(종목별 마지막 20거래일)은 0/1로 단정하면 안 되므로
    # 결측(pd.NA)으로 남긴다. 비교 연산은 NaN에 False를 주기 때문에 명시적 마스킹이 필요하다.
    df["label_direction_next_day"] = (
        (df["future_cum_return_20d"] > 0)
        .astype("Int8")
        .where(df["future_cum_return_20d"].notna())
    )

    # ── 급락 라벨(주 타깃): 향후 20거래일 내 최대낙폭이 -10% 이하인지 ──
    # 3) 종목별 누적 로그수익률 C를 만든다. cumsum은 NaN이 하나라도 있으면
    #    이후 전 구간이 NaN이 되므로 결측은 0(무변동)으로 채운 뒤 누적한다.
    df["_cum_log"] = (
        df.groupby("ticker")["log_return_1d"]
        .transform(lambda s: s.fillna(0).cumsum())
    )

    # 4) 종목별 20일 구간 C 최솟값 (위 누적합과 동일한 rolling → shift 패턴)
    df["_rolling_min_cum_log"] = (
        df.groupby("ticker")["_cum_log"]
        .transform(lambda s: s.rolling(window=WINDOW, min_periods=WINDOW).min())
    )

    # 5) t 시점 기준 미래 20일 구간의 저점 = t+20 위치의 rolling 최솟값
    df["_future_min_cum_log"] = (
        df.groupby("ticker")["_rolling_min_cum_log"].shift(-WINDOW)
    )

    # 6) 저점까지의 단순수익률로 환산: exp(C_min - C_t) - 1
    #    (로그수익률 차 → 단순수익률. expm1은 NaN을 그대로 전파)
    df["future_min_return_20d"] = np.expm1(
        df["_future_min_cum_log"] - df["_cum_log"]
    )

    df["label_drawdown_20d"] = (
        (df["future_min_return_20d"] <= DRAWDOWN_THRESHOLD)
        .astype("Int8")
        .where(df["future_min_return_20d"].notna())
    )

    # 종목별 마지막 20거래일은 미래 20일치가 없어 라벨을 확정할 수 없다.
    # 예전에는 이 행들을 통째로 제거했는데, 그러면 최신 거래일의 "피처"까지 함께
    # 사라져 추론·적재가 항상 20거래일 뒤처졌다(대시보드가 한 달 전 값을 표시).
    # 라벨만 결측으로 두고 행은 유지한다 — 학습은 dropna로 걸러 쓰고, 추론은 피처만 있으면 된다.

    return df.drop(columns=[
        "_rolling_sum_20d", "future_cum_return_20d",
        "_cum_log", "_rolling_min_cum_log", "_future_min_cum_log",
        "future_min_return_20d",
    ])

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

    pending = int(labeled_df["label_drawdown_20d"].isna().sum())
    print(f"총 {len(labeled_df):,}행 (최신 거래일: {labeled_df['date'].max().date()})")
    print(f"  → 라벨 미확정 {pending:,}행 = 종목별 마지막 {WINDOW}거래일 "
          f"(추론용으로 유지, 학습에서는 제외됨)")

    print("\n[주 타깃] label_drawdown_20d 분포 (20거래일 내 -10% 급락)")
    print(
        labeled_df["label_drawdown_20d"]
        .value_counts(dropna=False)
        .sort_index()
    )
    print(f"  → 양성률: {labeled_df['label_drawdown_20d'].mean():.4f}")

    print("\n[보조] label_direction_next_day 분포 (20일 누적 방향)")
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