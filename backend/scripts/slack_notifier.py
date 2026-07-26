# -*- coding: utf-8 -*-
import os
import sys
import requests
import pandas as pd
from pathlib import Path
from datetime import datetime

# app 모듈 로드를 위한 경로 수정
sys.path.append(str(Path(__file__).resolve().parent.parent))
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
        # 1. 최신 거시 정보 수집 (ml_ready_real.csv 활용)
        macro_info = {}
        csv_path = Path(__file__).resolve().parent.parent.parent / "data" / "ml_ready_real.csv"
        if csv_path.exists():
            try:
                df_ml = pd.read_csv(csv_path)
                if not df_ml.empty:
                    latest_date = df_ml["date"].max()
                    latest_rows = df_ml[df_ml["date"] == latest_date]
                    if not latest_rows.empty:
                        first_row = latest_rows.iloc[0]
                        macro_info = {
                            "date": str(latest_date),
                            "rate": first_row.get("macro_rate"),
                            "fx": first_row.get("macro_fx")
                        }
            except Exception as e:
                print(f"[WARN] Failed to read ml_ready_real.csv for macro info: {e}")

        # 2. 오늘자 위험 예측 결과 수집 (하락확률 상위 3개)
        today_risks = []
        try:
            risk_col = get_collection("daily_risk_score")
            query_date = today_str
            if macro_info.get("date"):
                query_date = pd.to_datetime(macro_info["date"]).strftime("%Y-%m-%d")
            
            risk_docs = list(risk_col.find({"date": query_date}))
            if not risk_docs:
                latest_avail_doc = risk_col.find_one({}, sort=[("date", -1)])
                if latest_avail_doc:
                    query_date = latest_avail_doc.get("date")
                    risk_docs = list(risk_col.find({"date": query_date}))

            if risk_docs:
                # 하락 위험 순으로 정렬 (prob_up 오름차순)
                risk_docs.sort(key=lambda x: float(x.get("prob_up", 0.5)))
                for rdoc in risk_docs[:3]:
                    ticker = rdoc.get("ticker")
                    name = TICKER_NAME_MAP.get(ticker, ticker)
                    prob_down = (1.0 - float(rdoc.get("prob_up", 0.5))) * 100
                    today_risks.append({
                        "name": name,
                        "ticker": ticker,
                        "prob_down": round(prob_down, 1),
                        "confidence": rdoc.get("confidence_tier", "weak")
                    })
        except Exception as risk_err:
            print(f"[WARN] Failed to query daily_risk_score: {risk_err}")

        esg_col = get_collection("esg_events")
        
        # 3. 오늘 날짜의 중대 리스크(is_material == 1, negative) 뉴스/공시 조회
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
                
        if not docs and hasattr(esg_col, "data") and isinstance(getattr(esg_col, "data", None), list):
            # local JSON mock DB fallback
            filtered = [
                d for d in esg_col.data 
                if d.get("is_material") == 1 and d.get("news_direction") == "negative" and d.get("date") == today_str
            ]
            filtered.sort(key=lambda x: x.get("date", ""), reverse=True)
            docs = filtered[:5]
            
        # 테스트 모드일 때 폴백 테스트 데이터 주입
        if not docs and is_test_mode:
            print("[INFO] Test mode enabled: inserting mock data.")
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

        # 4. 사용자 설정에 따른 카테고리 필터링 적용 ──────────────────────
        try:
            settings_col = get_collection("user_settings")
            cfg = settings_col.find_one({"ticker": "settings", "date": "alert_config"})
            categories = cfg.get("categories", {"price_risk": True, "esg_news": True, "disclosure": True}) if cfg else {"price_risk": True, "esg_news": True, "disclosure": True}
        except Exception as e:
            print(f"[WARN] Failed to load alert config for Slack notifier: {e}")
            categories = {"price_risk": True, "esg_news": True, "disclosure": True}

        def get_alert_category(title: str, news_category: str = None) -> str:
            title_lower = title.lower()
            if any(k in title_lower for k in ["공시", "사채", "증자", "발행", "결정", "보고서"]):
                return "disclosure"
            if news_category == "ESG" or any(k in title_lower for k in ["esg", "환경", "지배구조", "노사", "탄소", "상생"]):
                return "esg_news"
            return "price_risk"

        filtered_docs = []
        for doc in docs:
            ticker = doc.get("ticker", "005930")
            name, title, url = get_event_details(ticker, today_str)
            cat = get_alert_category(title, doc.get("news_category"))
            if categories.get(cat, True):
                doc["_event_title"] = title
                doc["_event_name"] = name
                doc["_event_url"] = url
                doc["_event_category"] = cat
                filtered_docs.append(doc)
        
        docs = filtered_docs

        # 5. 슬랙 Block Kit 페이로드 구성
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 개미의 우산 - 마켓 및 ESG 리스크 일일 브리핑 🚨",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"오늘 아침 배치를 통해 분석된 시장 거시 지표, XGBoost 하락 위험 분석 결과 및 포트폴리오 ESG 개별 종목 리포트입니다. 🐜☔"
                }
            },
            {"type": "divider"}
        ]

        # 5-1. 거시 지표 블록 추가
        if macro_info:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"📊 *시장 주요 거시 경제 지표 ({macro_info['date']})*\n• *한국은행 기준금리*: `{macro_info['rate']}%`\n• *원/달러 환율*: `{macro_info['fx']}원`"
                }
            })
            blocks.append({"type": "divider"})

        # 5-2. 고위험 예측 종목 블록 추가
        if today_risks:
            risk_lines = []
            for tr in today_risks:
                risk_lines.append(f"• *{tr['name']}* (`{tr['ticker']}`): 하락 위험 확률 *{tr['prob_down']}%* (신뢰도: `{tr['confidence']}`)")
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"📉 *XGBoost 모델 예측 - 20거래일 내 하락 위험 상위 종목*\n" + "\n".join(risk_lines)
                }
            })
            blocks.append({"type": "divider"})

        # 5-3. 개별 종목 ESG 악재 리스트 추가
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"📰 *포트폴리오 주요 개별 종목 ESG 악재 및 공시 ({len(docs)}건 감지)*"
            }
        })
        
        if docs:
            for doc in docs:
                ticker = doc.get("ticker", "005930")
                name = doc.get("_event_name", "알 수 없는 종목")
                title = doc.get("_event_title", "중대 리스크 요인 감지")
                url = doc.get("_event_url", "#")
                details_str = f"<{url}|{title}>" if url and url.startswith("http") else title
                
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*대상 종목*: *{name}* (`{ticker}`)\n*이슈 유형*: `[{doc.get('news_category', '리스크')}]`\n*상세 내용*: {details_str}"
                    }
                })
        else:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "• 오늘 포착된 포트폴리오 개별 종목의 ESG 중대 악재 및 특이 공시는 없습니다."
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
                    "url": "https://ants-umbrella.vercel.app/",
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
