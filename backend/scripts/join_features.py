# backend/scripts/join_features.py
import pandas as pd
import os
import sys
from pathlib import Path

# app 모듈 로드를 위한 경로 수정
sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.utils import normalize_ticker

def build_ml_rows(news_csv, price_csv, macro_csv, supplementary_csv, corp_code_map_csv):
    news = pd.read_csv(news_csv)
    price = pd.read_csv(price_csv, dtype={"ticker": str})
    macro = pd.read_csv(macro_csv)
    supp = pd.read_csv(supplementary_csv, dtype={"ticker": str})
    corp_map = pd.read_csv(corp_code_map_csv, dtype=str)

    # 기업명 -> 종목코드 변환 사전 구축
    name_to_code = dict(zip(corp_map["corp_name"], corp_map["stock_code"]))
    news["ticker"] = news["ticker"].map(name_to_code).fillna(news["ticker"])

    # 종목 코드 6자리 통일화
    news["ticker"] = normalize_ticker(news["ticker"])
    price["ticker"] = normalize_ticker(price["ticker"])
    supp["ticker"] = normalize_ticker(supp["ticker"])

    # 날짜 컬럼 datetime 변환
    try:
        # 뉴스 날짜가 타임존 정보가 포함된 경우 KST로 변환 후 타임존 정보 제거(naive)
        news["date"] = pd.to_datetime(news["date"], utc=True).dt.tz_convert("Asia/Seoul").dt.tz_localize(None).dt.normalize()
    except Exception:
        news["date"] = pd.to_datetime(news["date"], errors="coerce").dt.normalize()

    price["date"] = pd.to_datetime(price["date"])
    # macro_features.csv 날짜 컬럼 형식(정수형 YYYYMMDD 또는 문자열 YYYY-MM-DD)을 안전하게 datetime64로 변환
    macro["date"] = pd.to_datetime(macro["date"].astype(str), format="%Y%m%d", errors="coerce").fillna(
        pd.to_datetime(macro["date"], errors="coerce")
    )
    
    try:
        supp["date"] = pd.to_datetime(supp["date"], utc=True).dt.tz_convert("Asia/Seoul").dt.tz_localize(None).dt.normalize()
    except Exception:
        supp["date"] = pd.to_datetime(supp["date"], errors="coerce")

    # 주말(토요일 5, 일요일 6) 뉴스의 날짜를 다음주 월요일로 롤포워드
    weekday_news = news["date"].dt.weekday
    news.loc[weekday_news == 5, "date"] += pd.Timedelta(days=2) # 토요일 -> 월요일
    news.loc[weekday_news == 6, "date"] += pd.Timedelta(days=1) # 일요일 -> 월요일

    # 보조신호(supp) 날짜도 동일하게 롤포워드
    weekday_supp = supp["date"].dt.weekday
    supp.loc[weekday_supp == 5, "date"] += pd.Timedelta(days=2)
    supp.loc[weekday_supp == 6, "date"] += pd.Timedelta(days=1)

    # direction(긍정/부정)을 수치화하고 severity와 곱함
    news["signed_value"] = news["news_severity"] * news["news_direction"].map(
        {"positive": 1, "negative": -1, "neutral": 0}
    )
    
    # material/immaterial 분리 집계
    daily_news = (
        news.groupby(["ticker", "date", "is_material"])["signed_value"]
        .sum().unstack(fill_value=0)
        .rename(columns={1: "category_material_value", 0: "category_immaterial_value"})
        .reset_index()
    )

    # 기존 daily_news 집계 코드 아래에 추가
    news["is_esg"] = (news["news_category"] == "ESG").astype(int)

    daily_esg = (
        news[news["is_material"] == 1]
        .groupby(["ticker", "date", "is_esg"])["signed_value"]
        .sum()
        .unstack(fill_value=0)
        .rename(columns={1: "esg_material_value", 0: "non_esg_material_value"})
        .reset_index()
    )
    for col in ["esg_material_value", "non_esg_material_value"]:
        if col not in daily_esg.columns:
            daily_esg[col] = 0.0

    # 컬럼 누락 방지 방어 코드
    for col in ["category_material_value", "category_immaterial_value"]:
        if col not in daily_news.columns:
            daily_news[col] = 0.0

    # 보조신호 플래그 생성
    supp["is_capital"] = (supp["event_type"] == "CAPITAL_EVENT").astype(int)
    supp["is_delisting"] = (supp["event_type"] == "DELISTING_RELATED").astype(int)
    daily_supp = (
        supp.groupby(["ticker", "date"])[["is_capital", "is_delisting"]]
        .max().reset_index()
        .rename(columns={"is_capital": "capital_event_flag", "is_delisting": "delisting_related_flag"})
    )

    # 마스터 가격 테이블에 거시/뉴스/보조신호 병합
    merged = price.merge(macro, on="date", how="left")
    merged = merged.merge(daily_news, on=["ticker", "date"], how="left")
    
    # ESG 세부 집계 병합
    merged = merged.merge(daily_esg, on=["ticker", "date"], how="left")
    merged[["esg_material_value", "non_esg_material_value"]] = (
        merged[["esg_material_value", "non_esg_material_value"]].fillna(0.0)
    )
    
    # 뉴스가 없는 날은 리스크 누적치 0으로 채움
    merged[["category_material_value", "category_immaterial_value"]] = merged[
        ["category_material_value", "category_immaterial_value"]
    ].fillna(0.0)
    
    # 보조 신호 결합
    merged = merged.merge(daily_supp, on=["ticker", "date"], how="left")
    merged[["capital_event_flag", "delisting_related_flag"]] = (
        merged[["capital_event_flag", "delisting_related_flag"]].fillna(0).astype(int)
    )
    
    return merged

if __name__ == "__main__":
    scripts_dir = Path(__file__).resolve().parent
    backend_dir = scripts_dir.parent
    project_root = backend_dir.parent
    
    data_dir = project_root / "data"

    # 실전 및 더미 CSV 경로 지정
    news_csv = data_dir / "news_features_day2.csv"
    if not news_csv.exists():
        news_csv = data_dir / "news_features_dummy.csv"
        
    price_csv = data_dir / "price_features_labeled.csv"
    macro_csv = data_dir / "macro_features.csv"
    supp_csv = data_dir / "supplementary_signals.csv"
    corp_map_csv = data_dir / "corp_code_map.csv"
    
    out_path = data_dir / "ml_ready_real.csv"

    print("=== 피처 병합 파이프라인 가동 ===")
    result = build_ml_rows(
        news_csv=str(news_csv),
        price_csv=str(price_csv),
        macro_csv=str(macro_csv),
        supplementary_csv=str(supp_csv),
        corp_code_map_csv=str(corp_map_csv),
    )
    
    result.to_csv(out_path, index=False)
    print(f"[SUCCESS] {len(result)}행의 통합 피처 데이터셋이 성공적으로 생성되었습니다 ➔ {out_path}\n")
    

    
    # 컬럼별 결측치 비율 산출
    print("=== 각 피처 컬럼별 결측치(NaN) 비율 ===")
    missing_pct = result.isna().mean() * 100
    for col, pct in missing_pct.items():
        print(f" - {col}: {pct:.2f}%")
        
    print("\n=== 데이터프레임 미리보기 (상위 5행) ===")
    print(result.head())