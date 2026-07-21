# scripts/collect_dart.py
import os, requests, pandas as pd
import pathlib
from dotenv import load_dotenv

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

API_KEY = os.getenv("DART_API_KEY") or os.getenv("OPENDART_API_KEY")
LIST_URL = "https://opendart.fss.or.kr/api/list.json"

# 보고서 제목(report_nm)에 이 키워드가 들어있으면 태깅한다.
# 실제 데이터를 좀 받아본 뒤 report_nm 목록을 눈으로 확인하고 키워드를 더 보강할 것.
CAPITAL_EVENT_KEYWORDS = ["유상증자", "무상증자", "전환사채", "신주인수권부사채", "교환사채"]
DELISTING_KEYWORDS = ["감사의견", "관리종목", "상장폐지", "거래정지", "실질심사"]

def tag_report(report_nm: str) -> str | None:
    if any(k in report_nm for k in CAPITAL_EVENT_KEYWORDS):
        return "CAPITAL_EVENT"
    if any(k in report_nm for k in DELISTING_KEYWORDS):
        return "DELISTING_RELATED"
    return None

def fetch_disclosures(corp_code: str, bgn_de: str, end_de: str) -> pd.DataFrame:
    all_rows = []
    page_no = 1
    while True:
        params = {
            "crtfc_key": API_KEY,
            "corp_code": corp_code,
            "bgn_de": bgn_de,     # YYYYMMDD
            "end_de": end_de,     # YYYYMMDD
            "pblntf_ty": "B",     # 주요사항보고
            "page_no": page_no,
            "page_count": 100,
        }
        resp = requests.get(LIST_URL, params=params).json()

        if resp.get("status") != "000":  # 000 = 정상, 013 = 조회된 데이터 없음 등
            break

        all_rows.extend(resp["list"])
        if page_no >= resp.get("total_page", 1):
            break
        page_no += 1

    return pd.DataFrame(all_rows)

def build_supplementary_signals(corp_code: str, stock_code: str, bgn_de: str, end_de: str) -> pd.DataFrame:
    df = fetch_disclosures(corp_code, bgn_de, end_de)
    if df.empty:
        return pd.DataFrame(columns=["ticker", "date", "event_type", "disclosure_category"])

    df["event_type"] = df["report_nm"].apply(tag_report)
    df = df[df["event_type"].notna()]  # 태깅 안 된 건 버림

    df["ticker"] = stock_code
    df["date"] = pd.to_datetime(df["rcept_dt"], format="%Y%m%d").dt.date
    df["disclosure_category"] = df["report_nm"]

    return df[["ticker", "date", "event_type", "disclosure_category"]]

if __name__ == "__main__":
    import pathlib
    base_dir = pathlib.Path(__file__).resolve().parent.parent
    corp_map_path = base_dir / "data" / "corp_code_map.csv"
    
    corp_map = pd.read_csv(corp_map_path, dtype=str)

    # 코스피/코스닥 주요 대형주 및 대표 종목 리스트 (예: 20개 대표 종목)
    sample_tickers = [
        "005930",  # 삼성전자
        "000660",  # SK하이닉스
        "373220",  # LG에너지솔루션
        "207940",  # 삼성바이오로직스
        "005380",  # 현대차
        "000270",  # 기아
        "068270",  # 셀트리온
        "105560",  # KB금융
        "055550",  # 신한지주
        "035420",  # NAVER
        "035720",  # 카카오
        "005490",  # POSCO홀딩스
        "051910",  # LG화학
        "012330",  # 현대모비스
        "028260",  # 삼성물산
        "032830",  # 삼성생명
        "086790",  # 하나금융지주
        "015760",  # 한국전력
        "003550",  # LG
        "034730",  # SK
    ]

    results = []
    start_date = "20230101"
    end_date = "20260721"
    print(f"주요 종목({len(sample_tickers)}개) {start_date} ~ {end_date} DART 주요사항보고서 수집 시작...")

    for idx, ticker in enumerate(sample_tickers, 1):
        row = corp_map[corp_map["stock_code"] == ticker]
        if row.empty:
            print(f"[{idx}/{len(sample_tickers)}] {ticker}: corp_code 못 찾음, 건너뜀")
            continue
        corp_code = row.iloc[0]["corp_code"]
        corp_name = row.iloc[0]["corp_name"]
        print(f"[{idx}/{len(sample_tickers)}] {corp_name}({ticker}) 수집 중...")
        signals = build_supplementary_signals(corp_code, ticker, start_date, end_date)
        if not signals.empty:
            results.append(signals)

    final = pd.concat(results, ignore_index=True) if results else pd.DataFrame()
    output_path = base_dir / "data" / "supplementary_signals.csv"
    final.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"\n[DONE] Successfully collected {len(final)} records: {output_path}")
    print(final.head(10))