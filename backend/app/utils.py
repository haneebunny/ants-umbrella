# app/utils.py
import pandas as pd

def normalize_ticker(series: pd.Series) -> pd.Series:
    """모든 종목코드를 6자리 문자열로 통일. 회사명이 섞여 있으면 그대로 둔다(별도 변환 필요)."""
    extracted = series.astype(str).str.extract(r"(\d+)")[0]
    return extracted.str.zfill(6).fillna(series.astype(str))