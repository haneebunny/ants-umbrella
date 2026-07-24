# -*- coding: utf-8 -*-
import os
import sys
import requests
import pandas as pd
from pathlib import Path
from datetime import datetime
from app.db import get_collection

# 16개 포트폴리오 기업명 매핑
TICKER_NAME_MAP = {
    "005930": "삼성전자", "000660": "SK하이닉스", "035420": "NAVER", "035720": "카카오",
    "373220": "LG에너지솔루션", "006400": "삼성SDI", "086520": "에코프로", "247540": "에코프로비엠",
    "196170": "알테오젠", "005490": "POSCO홀딩스", "032830": "삼성생명", "033780": "KT&G",
    "105560": "KB금융", "005380": "현대차", "068270": "셀트리온", "055550": "신한지주",
    "000270": "기아", "017670": "SK텔레콤", "096770": "S-Oil", "028260": "삼성물산",
    "051910": "LG화학", "003550": "LG", "036570": "엔씨소프트", "251270": "넷마블"
}

def get_event_details(ticker, date_str):
    name = TICKER_NAME_MAP.get(ticker, "알 수 없는 종목")
    
    root_path = Path(__file__).resolve().parent.parent.parent
    
    # 1. raw_news_collected.csv에서 뉴스 제목과 링크 매핑 시도
    news_path = root_path / "data" / "raw_news_collected.csv"
    if news_path.exists():
        try:
            df = pd.read_csv(news_path, dtype={"ticker": str})
            rows = df[df["company"] == name]
            if not rows.empty:
                row = rows.iloc[0]
                title = row.get("text", "중대 ESG 뉴스")
                url = row.get("source_link", "#")
                return name, f"[뉴스] {title}", url
        except Exception as e:
            print(f"[WARN] Failed to read news csv: {e}")
            
    # 2. corporate_support.csv (공시)에서 공시 카테고리 매핑 시도
    supp_path = root_path / "data" / "reference" / "corporate_support.csv"
    if supp_path.exists():
        try:
            df = pd.read_csv(supp_path, dtype={"ticker": str})
            rows = df[df["ticker"].astype(str).str.zfill(6) == ticker]
            if not rows.empty:
                row = rows.iloc[0]
                title = row.get("disclosure_category", "주요 경영 사항 공시")
                url = f"https://m.stock.naver.com/domestic/stock/{ticker}/disclosure"
                return name, f"[공시] {title}", url
        except Exception as e:
            print(f"[WARN] Failed to read support csv: {e}")
            
    return name, "중대 리스크 요인 감지", "#"

def send_slack_alert():
    slack_webhook = os.environ.get("SLACK_WEBHOOK_URL", "").strip()
    if not slack_webhook:
        print("[INFO] SLACK_WEBHOOK_URL is not configured. Skipping Slack alert.")
        return

    today_str = datetime.now().strftime("%Y-%m-%d")
    is_test_mode = "--test" in sys.argv or os.environ.get("TEST_MODE") == "true"
    
    try:
        esg_col = get_collection("esg_events")
        
        # 1. 오늘 날짜의 중대 리스크(is_material == 1, negative) 뉴스/공시 조회
        query = {
            "is_material": 1,
            "news_direction": "negative",
            "date": today_str
        }
        
        docs = []
        if hasattr(esg_col, "find"):
            try:
                docs = list(esg_col.find(query).sort("date", -1).limit(5))
            except Exception as find_err:
                print(f"[INFO] MongoDB query failed ({find_err}), trying JSON fallback.")
                
        if not docs and hasattr(esg_col, "data"):
            # local JSON mock DB fallback
            filtered = [
                d for d in esg_col.data 
                if d.get("is_material") == 1 and d.get("news_direction") == "negative" and d.get("date") == today_str
            ]
            filtered.sort(key=lambda x: x.get("date", ""), reverse=True)
            docs = filtered[:5]
            
        # 2. 테스트 모드이거나 수집된 오늘의 데이터가 없을 때 폴백 테스트 데이터 주입
        if not docs:
            if is_test_mode:
                print("[INFO] No risk events found today. Test mode enabled: inserting mock data.")
                docs = [
                    {
                        "ticker": "005930",
                        "news_category": "노사관계 (Social)",
                        "date": today_str
                    },
                    {
                        "ticker": "000660",
                        "news_category": "품질/안전 (Social)",
                        "date": today_str
                    }
                ]
            else:
                # 오늘 분석된 중요 리스크가 아니면 조용히 넘어가기
                print(f"[INFO] No critical risk events found for today ({today_str}). Silently skipping Slack alert.")
                return

        # 3. 슬랙 Block Kit 페이로드 구성
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 개미의 우산 - 중대 리스크 감지 🚨",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"오늘 아침 배치를 통해 분석된 뉴스/공시 중 포트폴리오에 영향을 주는 *중대 리스크 요인 {len(docs)}건*이 포착되었습니다. 🐜☔"
                }
            },
            {"type": "divider"}
        ]
        
        for doc in docs:
            ticker = doc.get("ticker", "005930")
            name, title, url = get_event_details(ticker, today_str)
            
            # 슬랙 mrkdwn 링크 포맷 적용
            details_str = f"<{url}|{title}>" if url and url.startswith("http") else title
            
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*대상 종목*: *{name}* (`{ticker}`)\n*이슈 유형*: `[{doc.get('news_category', '리스크')}]`\n*상세 내용*: {details_str}\n*분석 시각*: {doc.get('date', today_str)}"
                }
            })
            blocks.append({"type": "divider"})

        # 대시보드 바로가기 버튼 링크 추가
        blocks.append({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "📊 내 포트폴리오 진단 보러가기",
                        "emoji": True
                    },
                    "url": "http://localhost:3000",  # 배포 후 실제 운영 도메인 주소로 교체 가능
                    "action_id": "button-action"
                }
            ]
        })

        payload = {"blocks": blocks}
        res = requests.post(slack_webhook, json=payload, timeout=5)
        if res.status_code == 200:
            print("[SUCCESS] Slack notification sent successfully!")
        else:
            print(f"[ERROR] Slack returned code {res.status_code}: {res.text}")
            
    except Exception as e:
        print(f"[ERROR] Slack notification failed: {e}")

if __name__ == '__main__':
    send_slack_alert()
