# scripts/collect_dart.py
import os, json, requests
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("DART_API_KEY") or os.getenv("OPENDART_API_KEY")
LIST_URL = "https://opendart.fss.or.kr/api/list.json"
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

CAPITAL_EVENT_KEYWORDS = ["유상증자", "무상증자", "전환사채", "신주인수권부사채", "교환사채"]
DELISTING_KEYWORDS = ["감사의견", "관리종목", "상장폐지", "거래정지", "실질심사"]

def get_portfolio_tickers() -> list[str]:
    portfolio_path = PROJECT_ROOT / "data" / "portfolio.json"
    with open(portfolio_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    tickers = set()
    for port in data.get("portfolios", []):
        for holding in port.get("holdings", []):
            code = holding.get("ticker")
            if code:
                tickers.add(str(code).zfill(6))
    return sorted(tickers)

def tag_report(report_nm: str) -> str | None:
    if "해외증권시장" in report_nm:
        return None  # 해외 상장 행정절차일 뿐, 국내 상장폐지 리스크 아님 → 제외
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
            "bgn_de": bgn_de,
            "end_de": end_de,
            "pblntf_ty": "B",
            "page_no": page_no,
            "page_count": 100,
        }
        resp = requests.get(LIST_URL, params=params).json()
        if resp.get("status") != "000":
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
    df = df[df["event_type"].notna()]

    df["ticker"] = stock_code
    df["date"] = pd.to_datetime(df["rcept_dt"], format="%Y%m%d").dt.date
    df["disclosure_category"] = df["report_nm"]

    return df[["ticker", "date", "event_type", "disclosure_category"]]

if __name__ == "__main__":
    corp_map = pd.read_csv(PROJECT_ROOT / "data" / "corp_code_map.csv", dtype=str)
    target_tickers = get_portfolio_tickers()
    print(f"대상 종목 {len(target_tickers)}개: {target_tickers}")

    results = []
    for ticker in target_tickers:
        row = corp_map[corp_map["stock_code"] == ticker]
        if row.empty:
            print(f"  {ticker}: corp_code 못 찾음, 건너뜀")
            continue
        corp_code = row.iloc[0]["corp_code"]
        signals = build_supplementary_signals(corp_code, ticker, "20230101", "20260721")
        print(f"  {ticker}: {len(signals)}건")
        results.append(signals)

    final = pd.concat(results, ignore_index=True) if results else pd.DataFrame()
    final.to_csv(PROJECT_ROOT / "data" / "supplementary_signals.csv", index=False, encoding="utf-8-sig")
    print(f"[DONE] 총 {len(final)}건 저장")