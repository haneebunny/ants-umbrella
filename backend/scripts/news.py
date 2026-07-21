import os
import re
import html
import time
import random
from datetime import datetime

import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

NCP_API_KEY_ID = os.environ["NCP_API_KEY_ID"]
NCP_API_KEY = os.environ["NCP_API_KEY"]

NEWS_API_URL = "https://naverapihub.apigw.ntruss.com/search/v1/news"

HEADERS = {
    "X-NCP-APIGW-API-KEY-ID": NCP_API_KEY_ID,
    "X-NCP-APIGW-API-KEY": NCP_API_KEY,
}

# ── 여기를 실제 포트폴리오 종목명으로 바꿔서 쓰세요 ──────────────────
TARGET_COMPANIES = [
    "삼성전자",
    "SK하이닉스",
    "LG에너지솔루션",
    "카카오",
    "NAVER",
    "현대차",
    "POSCO홀딩스",
]
# ────────────────────────────────────────────────────────────────

MAX_PER_COMPANY = 100     # 종목당 최대 수집 건수 (display 100 x start 1회 = 100건, 필요시 늘리기)
SAMPLE_SIZE = 400         # 최종 라벨링용 샘플 개수
REQUEST_SLEEP_SEC = 0.3   # 과호출 방지용 텀


def clean_text(raw: str) -> str:
    """네이버 검색 API 응답의 <b> 태그, HTML 엔티티 제거"""
    text = re.sub(r"<.*?>", "", raw)
    text = html.unescape(text)
    return text.strip()


def fetch_news_for_company(company: str, display: int = 100) -> list[dict]:
    """회사명 하나에 대해 뉴스 검색 API 호출, 정제된 결과 리스트 반환"""
    params = {
        "query": company,
        "display": min(display, 100),  # 네이버 검색 API 1회 최대 100건
        "start": 1,
        "sort": "date",  # 최신순 (정확도순을 원하면 "sim")
    }
    resp = requests.get(NEWS_API_URL, headers=HEADERS, params=params, timeout=10)
    resp.raise_for_status()
    items = resp.json().get("items", [])

    rows = []
    for item in items:
        title = clean_text(item.get("title", ""))
        description = clean_text(item.get("description", ""))
        # 제목과 요약을 분리된 두 개의 후보 문장으로 넣어둠 (라벨링 단위를 문장으로)
        for text in [title, description]:
            if not text:
                continue
            rows.append(
                {
                    "text": text,
                    "company": company,
                    "source_link": item.get("originallink") or item.get("link"),
                    "pub_date": item.get("pubDate"),
                }
            )
    return rows


def main():
    all_rows = []
    for company in TARGET_COMPANIES:
        print(f"[수집중] {company}")
        try:
            rows = fetch_news_for_company(company, display=MAX_PER_COMPANY)
            print(f"  -> {len(rows)}개 문장 확보")
            all_rows.extend(rows)
        except requests.HTTPError as e:
            print(f"  [실패] {company}: {e}")
        time.sleep(REQUEST_SLEEP_SEC)

    df = pd.DataFrame(all_rows)
    print(f"\n총 수집 문장 수(정제 전): {len(df)}")

    # 종목명이 실제로 문장 안에 들어있는 것만 남기기 (제목/요약이 다른 회사 얘기인 경우 필터링)
    df = df[df.apply(lambda r: r["company"] in r["text"], axis=1)]

    # 너무 짧은 문장(단순 속보 태그 등) 제거
    df = df[df["text"].str.len() >= 8]

    # 중복 문장 제거
    df = df.drop_duplicates(subset="text").reset_index(drop=True)
    print(f"필터·중복 제거 후 문장 수: {len(df)}")

    # 랜덤 샘플링
    sample_n = min(SAMPLE_SIZE, len(df))
    df_sample = df.sample(n=sample_n, random_state=42).reset_index(drop=True)

    # 라벨링용 빈 컬럼 추가
    df_sample["esg_related"] = ""   # 0 또는 1 로 채울 것
    df_sample["direction"] = ""     # positive / negative / neutral 로 채울 것

    out_path = f"esg_labeling_sample_{datetime.now().strftime('%Y%m%d')}.csv"
    df_sample.to_csv(out_path, index=False, encoding="utf-8-sig")  # 엑셀/구글시트 한글 깨짐 방지
    print(f"\n저장 완료: {out_path} ({len(df_sample)}건)")
    print("이 파일을 구글시트에 업로드해서 esg_related / direction 컬럼을 팀원들과 나눠서 채우면 됩니다.")


if __name__ == "__main__":
    main()