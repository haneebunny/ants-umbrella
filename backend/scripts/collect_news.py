# backend/scripts/collect_news.py
import os
import re
import html
import time
from datetime import datetime
import requests
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
dotenv_path = PROJECT_ROOT / "backend" / ".env"
if not dotenv_path.exists():
    dotenv_path = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path)

NCP_API_KEY_ID = os.getenv("NCP_API_KEY_ID")
NCP_API_KEY = os.getenv("NCP_API_KEY")

if not NCP_API_KEY_ID or not NCP_API_KEY:
    print("[ERROR] NCP_API_KEY_ID 또는 NCP_API_KEY가 .env 파일에 존재하지 않습니다.")
    exit(1)

NEWS_API_URL = "https://naverapihub.apigw.ntruss.com/search/v1/news"
HEADERS = {
    "X-NCP-APIGW-API-KEY-ID": NCP_API_KEY_ID,
    "X-NCP-APIGW-API-KEY": NCP_API_KEY,
}

# 7개 대표 종목 수집
TARGET_COMPANIES = [
    "삼성전자",
    "SK하이닉스",
    "LG에너지솔루션",
    "카카오",
    "NAVER",
    "현대차",
    "POSCO홀딩스",
]

MAX_PER_COMPANY = 50      # 종목당 최대 수집 건수 (과호출 및 비용 절약)
REQUEST_SLEEP_SEC = 0.3

def clean_text(raw: str) -> str:
    text = re.sub(r"<.*?>", "", raw)
    text = html.unescape(text)
    return text.strip()

def fetch_news_for_company(company: str, display: int = 50) -> list[dict]:
    params = {
        "query": company,
        "display": min(display, 100),
        "start": 1,
        "sort": "sim",  # 정확도순으로 변경하여 영양가 높은 대형 뉴스 위주 수집
    }
    resp = requests.get(NEWS_API_URL, headers=HEADERS, params=params, timeout=10)
    resp.raise_for_status()
    items = resp.json().get("items", [])

    rows = []
    for item in items:
        # description 대신 중간이 잘리지 않는 title(기사 헤드라인 제목)을 핵심 텍스트로 채택
        title = clean_text(item.get("title", ""))
        if not title:
            continue
        rows.append({
            "text": title,
            "company": company,
            "source_link": item.get("originallink") or item.get("link"),
            "pub_date": item.get("pubDate"),
        })
    return rows

def main():
    all_rows = []
    for company in TARGET_COMPANIES:
        print(f"[수집중] {company} 뉴스 가져오는 중...")
        try:
            rows = fetch_news_for_company(company, display=MAX_PER_COMPANY)
            print(f"  -> {len(rows)}개 문장 확보")
            all_rows.extend(rows)
        except Exception as e:
            print(f"  [실패] {company}: {e}")
        time.sleep(REQUEST_SLEEP_SEC)

    if not all_rows:
        print("[ERROR] 수집된 뉴스가 없습니다.")
        return

    df = pd.DataFrame(all_rows)
    print(f"\n총 수집 문장 수(정제 전): {len(df)}")

    # 회사명이 문장 안에 포함된 경우만 필터링
    df = df[df.apply(lambda r: r["company"] in r["text"], axis=1)]
    df = df[df["text"].str.len() >= 8]
    df = df.drop_duplicates(subset="text").reset_index(drop=True)
    print(f"필터·중복 제거 후 문장 수: {len(df)}")

    out_path = PROJECT_ROOT / "data" / f"raw_news_collected.csv"
    df.to_csv(out_path, index=False, encoding="utf-8-sig")
    print(f"\n[DONE] 원본 뉴스 수집 완료 및 저장: {out_path} ({len(df)}건)")

if __name__ == "__main__":
    main()
