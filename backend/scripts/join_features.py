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

    # ── 뉴스 "존재" 및 "강도" 피처 ────────────────────────────────
    # signed_value는 neutral을 0으로 매핑한다. 그런데 수집된 기사의 약 64%가 neutral이라,
    # 위 집계만으로는 "뉴스가 아예 없는 날"과 "중립 뉴스만 있는 날"이 똑같이 0이 되어
    # 모델이 둘을 구분할 수 없다. 기사 건수를 별도 피처로 넣어 이를 분리한다.
    news["_is_neg"] = (news["news_direction"] == "negative").astype(int)
    daily_cnt = (
        news.groupby(["ticker", "date"])
        .agg(news_count=("news_direction", "size"),
             news_neg_count=("_is_neg", "sum"))
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
    
    # 뉴스 건수 결합 (없는 날은 0건)
    merged = merged.merge(daily_cnt, on=["ticker", "date"], how="left")
    merged[["news_count", "news_neg_count"]] = (
        merged[["news_count", "news_neg_count"]].fillna(0).astype(int)
    )

    # ── 뉴스 누적 피처 ────────────────────────────────────────────
    # 뉴스는 하루 단위로 보면 너무 드문드문해서(칸의 약 25%는 기사 0건) 모델이 배우기 어렵다.
    # 악재의 영향은 하루로 끝나지 않으므로 최근 5·20거래일 누적치를 함께 제공한다.
    # rolling은 과거 방향으로만 계산되므로 미래 정보 누수는 발생하지 않는다.
    merged = merged.sort_values(["ticker", "date"]).reset_index(drop=True)
    for w in (5, 20):
        for src, dst in [("category_material_value", f"news_mat_sum_{w}d"),
                         ("news_neg_count", f"news_neg_cnt_{w}d"),
                         ("news_count", f"news_cnt_{w}d")]:
            merged[dst] = (
                merged.groupby("ticker")[src]
                .transform(lambda s: s.rolling(w, min_periods=1).sum())
            )

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

    # 뉴스 피처 파일 우선순위
    #   1) news_features_all.csv    — 전 종목 빅카인즈 분류본 (콜랩 산출물)
    #   2) news_features_training.csv — 구 버전(네이버 단일 종목만 담겨 있음)
    #   3) news_features_day2.csv / dummy
    news_csv = data_dir / "news_features_all.csv"
    if not news_csv.exists():
        news_csv = data_dir / "news_features_training.csv"
    if not news_csv.exists():
        news_csv = data_dir / "news_features_day2.csv"
    if not news_csv.exists():
        news_csv = data_dir / "news_features_dummy.csv"
        if not news_csv.exists():
            print("[INFO] news_features_dummy.csv 파일이 없어 빈 템플릿 파일을 생성합니다.")
            df_empty = pd.DataFrame(columns=["ticker", "date", "news_related", "news_direction", "news_severity", "news_category", "is_material", "confidence_score"])
            df_empty.to_csv(news_csv, index=False)
            
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
    print(f"[SUCCESS] {len(result)}행의 통합 피처 데이터셋이 성공적으로 생성되었습니다 -> {out_path}\n")

    # ── [추가] MongoDB Atlas 'price_macro' 컬렉션 적재 ──
    try:
        from app.db import get_collection
        from pymongo import UpdateOne
        
        print("=== MongoDB 'price_macro' 적재 시작 ===")
        price_col = get_collection("price_macro")
        
        # 1. KOSPI 거시 지표 데이터 적재
        macro_df = pd.read_csv(macro_csv)
        macro_ops = []
        for _, row in macro_df.iterrows():
            d_str = str(row["date"])
            if len(d_str) == 8 and "-" not in d_str:
                d_str = f"{d_str[:4]}-{d_str[4:6]}-{d_str[6:]}"
            
            rate_val = row.get("macro_rate")
            fx_val = row.get("macro_fx")
            if pd.isna(rate_val) or pd.isna(fx_val):
                continue
                
            macro_ops.append(UpdateOne(
                {"ticker": "KOSPI", "date": d_str},
                {"$set": {
                    "ticker": "KOSPI",
                    "date": d_str,
                    "usd_krw": float(fx_val),
                    "bond_3y": float(rate_val)
                }},
                upsert=True
            ))
        
        # 2. 개별 종목 종가 데이터 적재
        stock_ops = []
        for _, row in result.iterrows():
            t_code = str(row["ticker"]).zfill(6)
            d_str = pd.to_datetime(row["date"]).strftime("%Y-%m-%d")
            
            close_val = row.get("close")
            ret_val = row.get("log_return_1d")
            if pd.isna(close_val):
                continue
                
            stock_ops.append(UpdateOne(
                {"ticker": t_code, "date": d_str},
                {"$set": {
                    "ticker": t_code,
                    "date": d_str,
                    "close": float(close_val),
                    "log_return_1d": float(ret_val) if not pd.isna(ret_val) else 0.0
                }},
                upsert=True
            ))
            
        print(f" -> KOSPI 거시 데이터 {len(macro_ops)}건 bulk_write...")
        if macro_ops:
            for idx in range(0, len(macro_ops), 1000):
                price_col.bulk_write(macro_ops[idx:idx+1000])
                
        print(f" -> 개별 종목 주가 데이터 {len(stock_ops)}건 bulk_write...")
        if stock_ops:
            for idx in range(0, len(stock_ops), 1000):
                price_col.bulk_write(stock_ops[idx:idx+1000])
                
        print("[SUCCESS] MongoDB 'price_macro' 적재 완료!")
    except Exception as mongo_err:
        print(f"[WARN] MongoDB 'price_macro' 적재 실패 (로컬 모드 시 우회됨): {mongo_err}")
    

    
    # 컬럼별 결측치 비율 산출
    print("=== 각 피처 컬럼별 결측치(NaN) 비율 ===")
    missing_pct = result.isna().mean() * 100
    for col, pct in missing_pct.items():
        print(f" - {col}: {pct:.2f}%")
        
    print("\n=== 데이터프레임 미리보기 (상위 5행) ===")
    print(result.head())