import os
import sys
import pandas as pd
from datetime import date
from pathlib import Path

# 프로젝트 루트 및 backend 경로를 sys.path에 추가하여 app 패키지를 임포트 가능하도록 설정
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
sys.path.append(str(PROJECT_ROOT / "backend"))

# ── 1. 두 파일 불러오기 ─────────────────────────────
news_path = PROJECT_ROOT / "data" / "news_features_day2.csv"
price_path = PROJECT_ROOT / "data" / "price_features_labeled.csv"
corp_map_path = PROJECT_ROOT / "data" / "corp_code_map.csv"

if not news_path.exists() or not price_path.exists() or not corp_map_path.exists():
    print("[ERROR] 필수 데이터 파일이 누락되었습니다. 파이프라인 수집 상태를 확인하세요.")
    sys.exit(1)

news = pd.read_csv(news_path, dtype={"ticker": str})
price = pd.read_csv(price_path, dtype={"ticker": str})
corp_map = pd.read_csv(corp_map_path, dtype=str)

# ── 1.5. 회사명을 종목 코드로 치환 (news["ticker"] 매핑) ──
name_to_code = dict(zip(corp_map["corp_name"], corp_map["stock_code"]))
news["ticker"] = news["ticker"].map(name_to_code).fillna(news["ticker"])

# 티커 자리수 통일 및 날짜 포맷 통일
news["ticker"] = news["ticker"].str.zfill(6)
price["ticker"] = price["ticker"].str.zfill(6)
news["date"] = pd.to_datetime(news["date"]).dt.normalize()
price["date"] = pd.to_datetime(price["date"]).dt.normalize()

# ── 2. 조인: 사건 발생일 기준으로 그날의 업종 + "다음날 실제 방향 라벨"을 붙임 ──
merged = news.merge(
    price[["ticker", "date", "sector", "label_direction_next_day"]],
    on=["ticker", "date"],
    how="inner",
)
print(f"조인된 사건 수: {len(merged)}건 (원본 뉴스 {len(news)}건 중)")

# ── 3. 적중 여부 계산 ────────────────────────────────
def compute_hit(row):
    if row["news_direction"] == "positive":
        return int(row["label_direction_next_day"] == 1)
    elif row["news_direction"] == "negative":
        return int(row["label_direction_next_day"] == 0)
    return None  # neutral은 적중/실패를 정의할 수 없어 제외

if not merged.empty:
    merged["hit"] = merged.apply(compute_hit, axis=1)
    valid = merged.dropna(subset=["hit"]).copy()
    valid["hit"] = valid["hit"].astype(int)
    print(f"neutral 제외하고 통계에 쓸 사건 수: {len(valid)}건")
else:
    valid = pd.DataFrame(columns=list(merged.columns) + ["hit"])
    print("neutral 제외하고 통계에 쓸 사건 수: 0건")

# ── 4. (업종, 카테고리, 방향, material여부)별 집계 ──────
if not valid.empty:
    stats = (
        valid.groupby(["sector", "news_category", "news_direction", "is_material"])
        .agg(sample_size=("hit", "count"), hit_rate=("hit", "mean"))
        .reset_index()
        .rename(columns={"sector": "industry", "news_direction": "direction"})
    )
    # PRD Fallback: 표본 5건 미만이면 신뢰 불가 표시 (화면에서 "데이터 축적 중"으로 대체)
    stats["reliable"] = stats["sample_size"] >= 5
    stats["window_months"] = None  # 전체 수집 기간 기준
    stats["updated_at"] = date.today().isoformat()
    stats = stats.sort_values("sample_size", ascending=False)
    print(stats.head(10))
    print(f"\n신뢰 가능한(표본 5건 이상) 조합: {stats['reliable'].sum()} / {len(stats)}개")
else:
    stats = pd.DataFrame(columns=["industry", "news_category", "direction", "is_material", "sample_size", "hit_rate", "reliable", "window_months", "updated_at"])
    print("\n집계 데이터가 없습니다.")

# ── 5. 파일 저장 ─────────────────────────────────────────
output_csv_path = PROJECT_ROOT / "data" / "event_study_stats.csv"
stats.to_csv(output_csv_path, index=False, encoding="utf-8-sig")
print(f"→ {output_csv_path} 저장 완료")

# ── 6. MongoDB Atlas 적재 (공용 db 모듈 활용) ──────────────────
try:
    from app.db import get_collection
    collection = get_collection("event_study_stats")
    
    # 집계 데이터이므로 불필요하게 상속된 (ticker, date) 유니크 인덱스가 있을 경우 제거
    try:
        collection.drop_indexes()
        print("MongoDB event_study_stats 컬렉션의 이전 인덱스 초기화 완료")
    except Exception as ie:
        pass
        
    # 기존 데이터 청소 (재실행 시 중복 방지)
    collection.delete_many({})
    
    if not stats.empty:
        records = stats.to_dict("records")
        collection.insert_many(records)
        print(f"MongoDB event_study_stats 컬렉션에 {len(records)}건 적재 완료 (Atlas 연결)")
    else:
        print("적재할 집계 데이터가 없어 MongoDB 작업을 생략합니다.")
except Exception as e:
    print(f"[WARN] MongoDB 적재 실패: {e}")