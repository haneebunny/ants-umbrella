# -*- coding: utf-8 -*-
import os
import sys
import requests
import numpy as np
import pandas as pd
import pytz
from pathlib import Path
from datetime import datetime

# Google GenAI SDK
try:
    from google import genai
    from pydantic import BaseModel
    HAS_GENAI = True
    
    class RiskValidationResult(BaseModel):
        is_real_risk: bool
        reason: str
except ImportError:
    genai = None
    BaseModel = object
    HAS_GENAI = False
    
    class RiskValidationResult:
        pass

# app 모듈 로드를 위한 경로 수정
sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.db import get_collection

DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite"

# LLM 악재 검증이 실제로 수행됐는지 추적. 한 건이라도 검증 없이 통과했다면
# 알림 본문에서 "검증된 뉴스" 표현을 빼고 미검증 경고를 노출한다.
LLM_FILTER_STATE = {"failed": False, "reason": ""}

# ── 알림 발송 임계값 ────────────────────────────────────────────────
# main.py의 날씨 컷과 동일한 기준을 쓴다(_WEATHER_CUT_CLOUDY / _WEATHER_CUT_RAINY).
# 여기 값을 바꿀 때는 main.py의 날씨 임계값도 함께 맞출 것.
#
# 이전에는 위험 여부와 무관하게 하위 3종목을 무조건 "고위험"으로 발송했다.
# 실측(806거래일) 결과 위험 종목이 0개인 날이 15.9%, 3개 미만인 날이 39.5%였는데도
# 매일 3건을 경보해 과잉 경보가 발생했고, 반대로 위험 종목이 6개 이상인 날에도
# 3건만 보내 누락이 생겼다. 절대 임계값 방식으로 바꿔 양방향 오류를 제거한다.
# 알림 임계값은 날씨 컷보다 한 단계 높게 잡는다.
# 서빙 모델을 2개 피처로 줄이면서 확률이 제대로 보정되자(예측평균 0.21 ≈ 실제 0.219)
# '비' 컷(0.260)을 넘는 종목이 하루 4개꼴로 나와, 99% 날에 알림이 발송됐다.
# 매일 울리는 경보는 무시당하므로 '번개' 컷을 알림 기준으로 쓴다.
#
# OOS 실측 (무작위 급락률 0.219):
#   상위3 고정   1,491건  정밀도 0.281 (1.29배)  발송일 100%
#   0.260('비')  2,111건  정밀도 0.272 (1.24배)  발송일  99%
#   0.363('번개') 899건   정밀도 0.317 (1.45배)  발송일  80%   ← 채택
#   0.450        393건   정밀도 0.379 (1.73배)  발송일  47%
# 0.45 이상은 정밀도가 더 오르지만 절반 이상의 날을 놓쳐 경보 역할을 못 한다.
ALERT_PROB_THRESHOLD = 0.363   # 알림 대상 = main.py _WEATHER_CUT_RAINY('번개' 컷)
ALERT_SEVERE_THRESHOLD = 0.450  # 강조 표기 (정밀도 0.379)
ALERT_MAX_ITEMS = 5             # 한 번에 나열할 최대 종목 수

# 16개 포트폴리오 기업명 매핑
TICKER_NAME_MAP = {
    "005930": "삼성전자", "000660": "SK하이닉스", "035420": "NAVER", "035720": "카카오",
    "373220": "LG에너지솔루션", "006400": "삼성SDI", "086520": "에코프로", "247540": "에코프로비엠",
    "196170": "알테오젠", "005490": "POSCO홀딩스", "032830": "삼성생명", "033780": "KT&G",
    "105560": "KB금융", "005380": "현대차", "068270": "셀트리온", "055550": "신한지주",
    "000270": "기아", "017670": "SK텔레콤", "096770": "S-Oil", "028260": "삼성물산",
    "051910": "LG화학", "003550": "LG", "036570": "엔씨소프트", "251270": "넷마블",
    "015760": "한국전력"
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

def _macro_freshness_note(macro_date_str: str) -> str:
    """거시 지표 기준일을 사람이 이해할 수 있게 표기한다.

    ECOS 환율은 영업일에만 발표되므로 월요일 아침 배치에서는 직전 금요일 값이 최신이다.
    이는 정상 동작이지만 '(7-24 기준)'만 찍히면 데이터가 낡은 것처럼 보인다.
    → 영업일 기준 며칠 전인지 계산해서 정상/지연을 구분해 보여준다.
    """
    try:
        macro_date = pd.to_datetime(macro_date_str).date()
        today = datetime.now(pytz.timezone("Asia/Seoul")).date()
        # 두 날짜 사이의 영업일 수 (주말 제외)
        business_gap = int(np.busday_count(macro_date, today))
        label = macro_date.strftime("%m월 %d일")
        if business_gap <= 1:
            return f"_{label} 기준(최근 영업일)이에요. 거시 흐름이 바뀌었다면 살펴봐 주세요!_"
        return (f"⚠️ _{label} 기준으로, 영업일 {business_gap}일 전 데이터예요. "
                f"거시 지표 수집이 밀렸을 수 있어요._")
    except Exception:
        return f"_{macro_date_str} 기준이에요._"


def validate_event_with_llm(name: str, title: str) -> bool:
    """LLM을 호출하여 해당 이벤트가 해당 기업에 대한 실질적인 ESG 악재 공시/뉴스인지 검증합니다.
    단순 클릭베이트성 낚시글, 기회성 긍정 뉴스, 혹은 무관한 스포츠/문화 기사는 필터링합니다.

    검증 불가 시(키 미설정·API 오류) 항목을 통과시키되 LLM_FILTER_STATE에 실패를 기록한다.
    호출부는 이 플래그를 보고 "검증됨" 문구를 빼고 "미검증" 배지를 붙인다.
    조용히 통과시키면서 "검증된 뉴스"라고 표기하는 것이 가장 나쁜 실패 모드이기 때문이다.
    """
    if not HAS_GENAI or genai is None:
        print("[ERROR] google-genai 패키지가 임포트되지 않았습니다 — LLM 악재 검증을 수행할 수 없습니다. "
              "항목을 통과시키되 '미검증'으로 표기합니다.")
        LLM_FILTER_STATE["failed"] = True
        LLM_FILTER_STATE["reason"] = "google-genai 패키지 미설치"
        return True

    # 주의: os.environ.get(key, default)는 키가 "없을 때"만 default를 쓴다.
    # GitHub Actions는 미설정 secret을 빈 문자열로 주입하므로 default가 적용되지 않는다.
    # 따라서 `or`로 빈 문자열까지 걸러야 한다.
    gemini_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not gemini_key:
        print("[ERROR] GEMINI_API_KEY 미설정 — LLM 악재 검증을 수행할 수 없습니다. "
              "항목을 통과시키되 '미검증'으로 표기합니다.")
        LLM_FILTER_STATE["failed"] = True
        LLM_FILTER_STATE["reason"] = "GEMINI_API_KEY 미설정"
        return True

    try:
        client = genai.Client(api_key=gemini_key)
        prompt = f"""다음 뉴스/공시 제목은 주식 종목 "{name}"에 대한 실질적이고 즉각적인 기업 리스크나 하락 요인(예: 횡령, 규제 벌금, 영업이익 급감, 소송, 부정적 계약 취소, 유상증자 등)을 나타내는 중대 악재(Material Negative Event)가 맞는지 판정해 줘.

만약 단순 낚시성 뉴스(예: "반도체 6% 급락에도 초고수는 담았다..."), 긍정적 관점의 매수 추천 기사, 주가 하락과 관련 없는 마케팅/전시회 참가 소식 등이라면 반드시 False로 판정해 줘.

제목: "{title}"
"""
        response = client.models.generate_content(
            model=(os.environ.get("GEMINI_MODEL") or DEFAULT_GEMINI_MODEL).strip(),
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
        print(f"[ERROR] LLM 검증 필터 예외 — 항목을 통과시키되 '미검증'으로 표기합니다: {e}")
        LLM_FILTER_STATE["failed"] = True
        LLM_FILTER_STATE["reason"] = f"LLM 호출 실패: {type(e).__name__}"
        return True


def send_slack_alert():
    slack_webhook = os.environ.get("SLACK_WEBHOOK_URL", "").strip()
    if not slack_webhook:
        print("[INFO] SLACK_WEBHOOK_URL is not configured. Skipping Slack alert.")
        return

    today_str = datetime.now().strftime("%Y-%m-%d")
    is_test_mode = "--test" in sys.argv or os.environ.get("TEST_MODE") == "true"
    is_dispatch = os.environ.get("IS_DISPATCH") == "true"
    # ALERT_MODE: morning = 오전 7:41 배치(항상 발송), evening = 오후 5:46 배치(변동 있을 때만 발송)
    alert_mode = os.environ.get("ALERT_MODE", "morning").strip().lower()
    if not alert_mode:
        alert_mode = "morning"

    print(f"[INFO] ALERT_MODE={alert_mode}, test={is_test_mode}, dispatch={is_dispatch}")

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
                    latest_date_str = latest_date.strftime("%Y-%m-%d")

                    # 환율 결측치(주말/공휴일)가 있으면 최근 유효값으로 대체 및 실제 날짜 추적
                    if pd.isna(latest_row.get("macro_fx")):
                        valid_fx = df_macro[df_macro["macro_fx"].notna()]
                        if not valid_fx.empty:
                            fx_val = valid_fx.iloc[-1]["macro_fx"]
                            fx_date_str = pd.to_datetime(valid_fx.iloc[-1]["date"]).strftime("%Y-%m-%d")
                        else:
                            fx_val = None
                            fx_date_str = None
                    else:
                        fx_val = latest_row.get("macro_fx")
                        fx_date_str = latest_date_str

                    # 기준금리 결측치가 있으면 최근 유효값으로 대체 및 실제 날짜 추적
                    if pd.isna(latest_row.get("macro_rate")):
                        valid_rate = df_macro[df_macro["macro_rate"].notna()]
                        if not valid_rate.empty:
                            rate_val = valid_rate.iloc[-1]["macro_rate"]
                            rate_date_str = pd.to_datetime(valid_rate.iloc[-1]["date"]).strftime("%Y-%m-%d")
                        else:
                            rate_val = None
                            rate_date_str = None
                    else:
                        rate_val = latest_row.get("macro_rate")
                        rate_date_str = latest_date_str

                    macro_info = {
                        "date": latest_date_str,
                        "rate": rate_val,
                        "rate_date": rate_date_str,
                        "fx": fx_val,
                        "fx_date": fx_date_str
                    }
                    print(f"[INFO] 거시 지표 로드 완료: {macro_info['date']} 기준 금리={macro_info['rate']}({macro_info['rate_date']}), 환율={macro_info['fx']}({macro_info['fx_date']})")
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
                # 급락 확률이 임계값을 넘는 종목만 선별 (없으면 빈 목록 → "특이사항 없음")
                scored = []
                for rdoc in risk_docs:
                    # prob_crash가 있으면 그대로, 없으면 prob_up에서 파생 (구버전 문서 호환)
                    if rdoc.get("prob_crash") is not None:
                        prob_crash = float(rdoc["prob_crash"])
                    elif rdoc.get("prob_up") is not None:
                        prob_crash = 1.0 - float(rdoc["prob_up"])
                    else:
                        continue
                    scored.append((prob_crash, rdoc))

                # 위험이 큰 순으로 정렬 후 임계값 통과분만 채택
                scored.sort(key=lambda x: x[0], reverse=True)
                for prob_crash, rdoc in scored:
                    if prob_crash < ALERT_PROB_THRESHOLD:
                        break
                    if len(today_risks) >= ALERT_MAX_ITEMS:
                        break
                    ticker = rdoc.get("ticker")
                    today_risks.append({
                        "name": TICKER_NAME_MAP.get(ticker, ticker),
                        "ticker": ticker,
                        "prob_down": round(prob_crash * 100, 1),
                        "confidence": rdoc.get("confidence_tier", "weak"),
                        "severe": prob_crash >= ALERT_SEVERE_THRESHOLD,
                    })

                print(f"[INFO] 위험 종목 {len(today_risks)}건 선별 "
                      f"(임계값 {ALERT_PROB_THRESHOLD:.0%}, 전체 {len(scored)}종목)")
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

        # 4-0. ALERT_MODE에 따라 발송 여부 결정 ──────────────────────────────
        try:
            settings_col = get_collection("user_settings")
            baseline_key = {"ticker": "_alert_baseline", "date": today_str}

            if alert_mode == "evening" and not is_test_mode and not is_dispatch:
                # 오전 베이스라인과 비교 → 새로운 이벤트가 없으면 발송 스킵
                baseline_doc = settings_col.find_one(baseline_key)
                morning_count = baseline_doc.get("event_count", 0) if baseline_doc else 0
                current_count = len(docs)
                print(f"[INFO] Evening mode — morning baseline: {morning_count}건, current: {current_count}건")
                if current_count <= morning_count:
                    print("[INFO] 오전 대비 새로운 이벤트가 없습니다. 저녁 알림을 생략합니다.")
                    return
                print(f"[INFO] {current_count - morning_count}건의 새 이벤트 감지 → 저녁 알림 발송합니다.")

            elif alert_mode == "morning" and not is_test_mode:
                # 오전 발송 후 베이스라인 저장 (저녁 비교용)
                settings_col.update_one(
                    baseline_key,
                    {"$set": {"event_count": len(docs), "updated_at": datetime.now().isoformat()}},
                    upsert=True
                )
                print(f"[INFO] Morning mode — 오전 베이스라인 저장 완료: {len(docs)}건")

        except Exception as baseline_err:
            print(f"[WARN] 베이스라인 처리 중 오류 (발송 진행): {baseline_err}")

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
            # 결측치를 대체하여 사용한 경우, 실제 지표의 기준일을 표시
            def format_date_suffix(target_date_str, base_date_str):
                if not target_date_str or target_date_str == base_date_str:
                    return ""
                try:
                    dt = pd.to_datetime(target_date_str)
                    return f" ({dt.strftime('%m/%d')} 값)"
                except:
                    return f" ({target_date_str} 값)"

            rate_suffix = format_date_suffix(macro_info.get("rate_date"), macro_info["date"])
            fx_suffix = format_date_suffix(macro_info.get("fx_date"), macro_info["date"])

            # 거시 흐름이 모델에 미치는 영향 요약
            macro_impact_note = (
                "\n\n💡 *거시 지표 영향 분석*\n"
                "• 거시 지표(기준금리, 환율)는 모델 예측 중요도의 *43% 이상*을 차지하는 핵심 변수예요.\n"
                "• 금리 인상이나 환율 상승은 전반적인 시장 위험과 개별 종목의 하락 위험을 높이는 주요인으로 작용합니다."
            )

            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"📊 *시장 주요 거시 경제 지표*\n"
                            f"• *한국은행 기준금리*: `{macro_info['rate']}%`{rate_suffix}\n"
                            f"• *원/달러 환율*: `{macro_info['fx']}원`{fx_suffix}\n"
                            f"{_macro_freshness_note(macro_info['date'])}"
                            f"{macro_impact_note}"
                }
            })
            blocks.append({"type": "divider"})

        # 5-2. 고위험 예측 종목 블록 추가
        #      임계값을 넘는 종목이 없으면 "특이사항 없음"으로 정직하게 알린다.
        #      (예전처럼 하위 3종목을 억지로 채워 넣지 않는다)
        if today_risks:
            risk_lines = []
            for tr in today_risks:
                confidence_ko = "높음" if tr['confidence'] == "strong" else ("보통" if tr['confidence'] == "medium" else "낮음")
                mark = "⚡ " if tr.get("severe") else ""
                risk_lines.append(
                    f"• {mark}*{tr['name']}* (`{tr['ticker']}`): "
                    f"향후 20거래일 내 10% 이상 급락 확률 *{tr['prob_down']}%* (신뢰도: `{confidence_ko}`)"
                )
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "📉 *개미미 AI가 주목한 급락 위험 종목*\n"
                            "아래 종목들은 급락 위험이 평소보다 높게 나왔어요. 꼼꼼히 확인해 보세요!\n"
                            + "\n".join(risk_lines)
                            + "\n\n_※ 과거 데이터 기반 추정치이며 투자 권유가 아니에요._"
                }
            })
            blocks.append({"type": "divider"})
        else:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "✅ *급락 위험 종목: 오늘은 없어요*\n"
                            "보유 종목 중 급락 위험이 두드러지게 높은 종목은 확인되지 않았어요. 편안한 하루 보내세요! 🐜"
                }
            })
            blocks.append({"type": "divider"})

        # 5-3. 개별 종목 ESG 악재 리스트 추가
        #      LLM 검증이 실패했다면 "검증됨"이라고 말해서는 안 된다.
        llm_ok = not LLM_FILTER_STATE["failed"]
        header_text = f"📰 *포트폴리오 주요 개별 종목 악재 및 공시 ({len(docs)}건 감지)*"
        if not llm_ok:
            header_text += (f"\n⚠️ _악재 검증 필터가 동작하지 않아 걸러지지 않은 뉴스가 섞여 있을 수 있어요_"
                            f"\n_(원인: {LLM_FILTER_STATE['reason']})_")
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": header_text
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
                        "text": f"*대상 종목*: *{name}* (`{ticker}`)\n*이슈 유형*: `[{doc.get('news_category', '리스크')}]`\n*상세 내용*: {details_str}\n"
                                + ("실질적인 기업 악재로 검증된 뉴스예요. 꼭 꼼꼼히 확인해 보세요!"
                                   if llm_ok else
                                   "⚠️ 미검증 항목이에요 — 실제 악재가 아닐 수 있으니 원문을 직접 확인해 주세요.")
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
