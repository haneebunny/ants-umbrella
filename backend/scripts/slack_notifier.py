# -*- coding: utf-8 -*-
import os
import sys
import requests
import pandas as pd
import pytz
from pathlib import Path
from datetime import datetime

# Google GenAI SDK
try:
    from google import genai
    from pydantic import BaseModel
    
    class RiskValidationResult(BaseModel):
        is_real_risk: bool
        reason: str
except ImportError:
    pass

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

def validate_event_with_llm(name: str, title: str) -> bool:
    """LLM을 호출하여 해당 이벤트가 해당 기업에 대한 실질적인 ESG 악재 공시/뉴스인지 검증합니다.
    단순 클릭베이트성 낚시글, 기회성 긍정 뉴스, 혹은 무관한 스포츠/문화 기사는 필터링합니다.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not gemini_key:
        print("[INFO] GEMINI_API_KEY가 설정되지 않아 LLM 필터 검증을 건너뛰고 기본 통과 처리합니다.")
        return True

    try:
        client = genai.Client(api_key=gemini_key)
        prompt = f"""다음 뉴스/공시 제목은 주식 종목 "{name}"에 대한 실질적이고 즉각적인 기업 리스크나 하락 요인(예: 횡령, 규제 벌금, 영업이익 급감, 소송, 부정적 계약 취소, 유상증자 등)을 나타내는 중대 악재(Material Negative Event)가 맞는지 판정해 줘.

만약 단순 낚시성 뉴스(예: "반도체 6% 급락에도 초고수는 담았다..."), 긍정적 관점의 매수 추천 기사, 주가 하락과 관련 없는 마케팅/전시회 참가 소식 등이라면 반드시 False로 판정해 줘.

제목: "{title}"
"""
        response = client.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite").strip(),
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": RiskValidationResult,
            },
        )
        result = RiskValidationResult.model_validate_json(response.text)
        print(f"[LLM Filter] Ticker: {name} | Title: {title} | Validation: {result.is_real_risk} | Reason: {result.reason}")
        return result.is_real_risk
    except Exception as e:
        print(f"[WARN] LLM 검증 필터 도중 예외 발생 (기본값 True 처리): {e}")
        return True


def send_slack_alert():
    slack_webhook = os.environ.get("SLACK_WEBHOOK_URL", "").strip()
    if not slack_webhook:
        print("[INFO] SLACK_WEBHOOK_URL is not configured. Skipping Slack alert.")
        return

    today_str = datetime.now().strftime("%Y-%m-%d")
    is_test_mode = "--test" in sys.argv or os.environ.get("TEST_MODE") == "true"
    is_dispatch = os.environ.get("IS_DISPATCH") == "true"
    
    # KST 기준 시간 체크
    try:
        kst = pytz.timezone("Asia/Seoul")
        now_kst = datetime.now(kst)
        # 테스트 모드가 아니고, 수동 실행도 아니며, 오후 5시대(17시)가 아니라면 알림 전송을 스킵하고 DB 적재만 유지합니다.
        # (아침 6시 41분 및 점심 12시 배치는 데이터 수집, 가공 및 모델 추론 결과만 DB에 조용히 저장하고,
        # 최종 알림은 오후 5시 46분에 하루치 이벤트를 종합해서 1회 발송합니다.)
        if not is_test_mode and not is_dispatch and now_kst.hour != 17:
            print(f"[INFO] Current KST hour is {now_kst.hour}. Slack alert is scheduled to send only at 17:46 KST (hour 17). Skipping notification.")
            return
    except Exception as tz_err:
        print(f"[WARN] Failed to check timezone (proceeding with alert): {tz_err}")

    try:
        # 1. 최신 거시 정보 수집 (매일 새로 수집되는 macro_features.csv 직접 활용)
        macro_info = {}
        macro_csv_path = Path(__file__).resolve().parent.parent.parent / "data" / "macro_features.csv"
        if macro_csv_path.exists():
            try:
                df_macro = pd.read_csv(macro_csv_path)
                if not df_macro.empty:
                    # macro_features.csv 날짜 컬럼은 YYYYMMDD 정수형일 수 있으므로 안전하게 변환
                    df_macro["date"] = pd.to_datetime(
                        df_macro["date"].astype(str), format="%Y%m%d", errors="coerce"
                    ).fillna(pd.to_datetime(df_macro["date"], errors="coerce"))
                    df_macro = df_macro.dropna(subset=["date"])
                    latest_date = df_macro["date"].max()
                    latest_row = df_macro[df_macro["date"] == latest_date].iloc[-1]
                    # 환율 결측치(주말/공휴일)가 있으면 최근 유효값으로 대체
                    if pd.isna(latest_row.get("macro_fx")):
                        valid_fx = df_macro[df_macro["macro_fx"].notna()]
                        fx_val = valid_fx.iloc[-1]["macro_fx"] if not valid_fx.empty else None
                    else:
                        fx_val = latest_row.get("macro_fx")
                    macro_info = {
                        "date": latest_date.strftime("%Y-%m-%d"),
                        "rate": latest_row.get("macro_rate"),
                        "fx": fx_val
                    }
                    print(f"[INFO] 거시 지표 로드 완료: {macro_info['date']} 기준 금리={macro_info['rate']}, 환율={macro_info['fx']}")
            except Exception as e:
                print(f"[WARN] Failed to read macro_features.csv for macro info: {e}")

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
                docs = list(esg_col.find(query).sort("date", -1).limit(10)) # LLM 필터를 위해 여유 있게 가져옴
            except Exception as find_err:
                print(f"[INFO] MongoDB query failed ({find_err}), trying JSON fallback.")
                
        if not docs and hasattr(esg_col, "data") and isinstance(getattr(esg_col, "data", None), list):
            # local JSON mock DB fallback
            filtered = [
                d for d in esg_col.data 
                if d.get("is_material") == 1 and d.get("news_direction") == "negative" and d.get("date") == today_str
            ]
            filtered.sort(key=lambda x: x.get("date", ""), reverse=True)
            docs = filtered[:10]
            
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
            
            # 사용자 카테고리 설정 필터
            if categories.get(cat, True):
                # 🌟 LLM을 이용해 낚시성 뉴스나 기회성 매수(급락에도 담았다...) 뉴스 필터링
                if not validate_event_with_llm(name, title):
                    print(f"[LLM Filtered Out] {name}: {title}")
                    continue
                
                doc["_event_title"] = title
                doc["_event_name"] = name
                doc["_event_url"] = url
                doc["_event_category"] = cat
                filtered_docs.append(doc)
        
        docs = filtered_docs[:5] # 최종 상위 5개만 노출

        # 5. 슬랙 Block Kit 페이로드 구성 (개미미 페르소나 적용)
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🐜 개미미의 일일 리스크 브리핑이에요! 🚨",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"안녕하세요! 개미미가 오늘 하루 동안 꼬박 분석한 시장 지표와 위험 종목 정보들을 가져왔어요. 꼭 확인해 보세요! 🐜☔"
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
                    "text": f"📊 *시장 주요 거시 경제 지표 ({macro_info['date']} 기준)*\n• *한국은행 기준금리*: `{macro_info['rate']}%`\n• *원/달러 환율*: `{macro_info['fx']}원`\n거시 경제 흐름이 바뀌고 있다면 꼭 한번 살펴봐 주세요!"
                }
            })
            blocks.append({"type": "divider"})

        # 5-2. 고위험 예측 종목 블록 추가
        if today_risks:
            risk_lines = []
            for tr in today_risks:
                confidence_ko = "높음" if tr['confidence'] == "strong" else ("보통" if tr['confidence'] == "medium" else "낮음")
                risk_lines.append(f"• *{tr['name']}* (`{tr['ticker']}`): 향후 20일 내 하락 위험 확률 *{tr['prob_down']}%* (신뢰도: `{confidence_ko}`)")
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"📉 *개미미 AI가 주목한 하락 위험 종목*\n앞으로 20거래일 동안 10% 이상 하락할 가능성이 큰 종목들이에요. 꼼꼼히 확인해 보세요!\n" + "\n".join(risk_lines)
                }
            })
            blocks.append({"type": "divider"})

        # 5-3. 개별 종목 ESG 악재 리스트 추가
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"📰 *포트폴리오 주요 개별 종목 악재 및 공시 ({len(docs)}건 감지)*"
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
                        "text": f"*대상 종목*: *{name}* (`{ticker}`)\n*이슈 유형*: `[{doc.get('news_category', '리스크')}]`\n*상세 내용*: {details_str}\n실질적인 기업 악재로 검증된 뉴스예요. 꼭 꼼꼼히 확인해 보세요!"
                    }
                })
        else:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "• 오늘은 포트폴리오 종목 중 눈에 띄는 개별 악재나 부정적 공시 뉴스가 없었어요. 다행이네요!"
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
                        "text": "📊 내 포트폴리오 진단하러 가기",
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
