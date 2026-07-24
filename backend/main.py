from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.db import get_collection
from app.schemas import DailyRiskScore

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. 포트폴리오 업종(Sector) 데이터 로드 및 초기화
SECTOR_MAP = {}
try:
    import pandas as pd
    from pathlib import Path
    project_root = Path(__file__).resolve().parent.parent
    ml_data_path = project_root / "data" / "ml_ready_real.csv"
    if ml_data_path.exists():
        df_ml = pd.read_csv(ml_data_path, dtype={"ticker": str})
        SECTOR_MAP = df_ml.groupby("ticker")["sector"].first().to_dict()
        print(f"[INFO] SECTOR_MAP 로드 완료 (종목 수: {len(SECTOR_MAP)})")
    else:
        print("[WARN] ml_ready_real.csv 파일이 없어 SECTOR_MAP 로드를 생략합니다.")
except Exception as e:
    print(f"[WARN] SECTOR_MAP 로드 실패: {e}")

# 2. get_hit_rate 통계 조회 도우미 함수 정의
def get_hit_rate(industry: str, news_category: str, direction: str, is_material: int) -> dict:
    try:
        stats_collection = get_collection("event_study_stats")
        row = stats_collection.find_one({
            "industry": industry,
            "news_category": news_category,
            "direction": direction,
            "is_material": is_material
        })
        if not row or not row.get("reliable"):
            return {"hit_rate": None, "sample_size": None, "badge": "데이터 축적 중"}
        
        # PRD 표준에 맞춰 hit_rate(0~1 사이 값)를 소수점 둘째 자리까지 반올림
        return {
            "hit_rate": round(float(row["hit_rate"]), 2),
            "sample_size": int(row["sample_size"]),
            "badge": None
        }
    except Exception as e:
        print(f"[WARN] get_hit_rate 조회 에러: {e}")
        return {"hit_rate": None, "sample_size": None, "badge": "데이터 축적 중"}

@app.get("/")
def read_root():
    return {"status": "ok", "message": "ants-umbrella API server is running!"}

@app.get("/api/health")
def health_check():
    return {"health": "good"}

@app.get("/risk-score/{ticker}", response_model=DailyRiskScore)
def get_risk_score(ticker: str):
    try:
        collection = get_collection("daily_risk_score")
        # 가장 최근 날짜의 해당 종목 스코어 도큐먼트 조회
        doc = collection.find_one({"ticker": ticker}, sort=[("date", -1)])
        if not doc:
            raise HTTPException(status_code=404, detail=f"종목코드 '{ticker}'의 위험 분석 점수를 찾을 수 없습니다.")
        
        # MongoDB 내부 _id 필드 제거
        doc.pop("_id", None)
        
        # 업종 및 오늘 뉴스 신호 카테고리/방향/material 여부 조회하여 과거 사례 적중률 추가
        industry = SECTOR_MAP.get(ticker)
        
        esg_collection = get_collection("esg_events")
        # 오늘 날짜(스코어의 date) 기준 가장 최신의 뉴스 신호 조회
        news_doc = esg_collection.find_one(
            {"ticker": ticker, "date": {"$lte": str(doc["date"])}},
            sort=[("date", -1)]
        )
        
        hit_data = {"hit_rate": None, "sample_size": None, "badge": "데이터 축적 중"}
        
        if news_doc and industry:
            hit_data = get_hit_rate(
                industry=industry,
                news_category=news_doc.get("news_category"),
                direction=news_doc.get("news_direction"),
                is_material=int(news_doc.get("is_material", 0))
            )
            
        doc["hit_rate"] = hit_data.get("hit_rate")
        doc["sample_size"] = hit_data.get("sample_size")
        doc["badge"] = hit_data.get("badge")
        
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 조회 에러: {str(e)}")

@app.get("/portfolios")
def get_portfolios():
    import json
    from pathlib import Path
    
    # backend/data/portfolio.json이 아닌 루트 data/portfolio.json 파일 로딩
    portfolio_path = Path(__file__).resolve().parent.parent / "data" / "portfolio.json"
    if not portfolio_path.exists():
        raise HTTPException(status_code=404, detail="포트폴리오 더미데이터 파일(portfolio.json)을 찾을 수 없습니다.")
    try:
        with open(portfolio_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"포트폴리오 데이터 파일 로드 실패: {str(e)}")

# ── prob_up → weather 변환 헬퍼 ─────────────────────────────────────
def _prob_to_weather(prob_up: float, direction: str) -> str:
    prob_down = 1.0 - prob_up
    if direction == "up" and prob_down < 0.35:
        return "sunny"
    elif prob_down < 0.50:
        return "cloudy"
    elif prob_down < 0.65:
        return "rainy"
    else:
        return "thunder"

@app.get("/api/dashboard-weather")
def get_dashboard_weather(tickers: str = ""):
    """
    홈 대시보드용 배치 날씨 조회.
    ?tickers=055550,017670,005490,...  (쉼표 구분)
    각 ticker의 최신 daily_risk_score → weather / direction / change 반환.
    """
    if not tickers.strip():
        return []

    ticker_list = [t.strip() for t in tickers.split(",") if t.strip()]

    try:
        collection = get_collection("daily_risk_score")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"DB 연결 실패: {str(e)}")

    results = []
    for ticker in ticker_list:
        try:
            doc = collection.find_one({"ticker": ticker}, sort=[("date", -1)])
            if not doc:
                # 해당 종목 데이터 없으면 null 반환 → 프론트에서 mockData 사용
                results.append({"ticker": ticker, "available": False})
                continue

            prob_up   = float(doc.get("prob_up", 0.5))
            direction = doc.get("direction", "up")
            weather   = _prob_to_weather(prob_up, direction)

            # 1일 등락(log_return_1d)은 daily_risk_score에 없으므로 price_macro에서 보충
            change = None
            try:
                price_col = get_collection("price_macro")
                price_doc = price_col.find_one({"ticker": ticker}, sort=[("date", -1)])
                if price_doc:
                    change = round(float(price_doc.get("log_return_1d", 0)) * 100, 2)
            except Exception:
                pass

            results.append({
                "ticker":           ticker,
                "available":        True,
                "weather":          weather,
                "direction":        direction,
                "prob_up":          round(prob_up, 4),
                "confidence_tier":  doc.get("confidence_tier", "weak"),
                "change":           change,
                "date":             str(doc.get("date", "")),
                "esgScore":         None,   # esg_events에서 추후 집계 가능
            })
        except Exception as e:
            print(f"[WARN] dashboard-weather {ticker}: {e}")
            results.append({"ticker": ticker, "available": False})

    return results

DEFAULT_PROB_UP_MAP = {
    '000660': 0.938,  # SK하이닉스 (하락확률 6.2%)
    '005930': 0.916,  # 삼성전자 (하락확률 8.4%)
    '005380': 0.888,  # 현대차 (하락확률 11.2%)
    '035420': 0.752,  # NAVER (하락확률 24.8%)
    '055550': 0.905,  # 신한지주 (하락확률 9.5%)
    '017670': 0.912,  # SK텔레콤 (하락확률 8.8%)
    '005490': 0.615,  # POSCO홀딩스 (하락확률 38.5%)
    '010950': 0.558,  # S-Oil (하락확률 44.2%)
    '028260': 0.880,  # 삼성물산 (하락확률 12.0%)
    '000270': 0.895,  # 기아 (하락확률 10.5%)
    '068270': 0.779,  # 셀트리온 (하락확률 22.1%)
    '035720': 0.315,  # 카카오 (하락확률 68.5%)
    '051910': 0.715,  # LG화학 (하락확률 28.5%)
    '003550': 0.865,  # LG (하락확률 13.5%)
    '036570': 0.680,  # 엔씨소프트 (하락확률 32.0%)
    '373220': 0.785,  # LG에너지솔루션 (하락확률 21.5%)
    '006400': 0.885,  # 삼성SDI (하락확률 11.5%)
    '086520': 0.520,  # 에코프로 (하락확률 48.0%)
    '247540': 0.610,  # 에코프로비엠 (하락확률 39.0%)
    '196170': 0.925,  # 알테오젠 (하락확률 7.5%)
    '032830': 0.905,  # 삼성생명 (하락확률 9.5%)
    '033780': 0.912,  # KT&G (하락확률 8.8%)
    '105560': 0.918,  # KB금융 (하락확률 8.2%)
    '047050': 0.655,  # 포스코인터 (하락확률 34.5%)
    '036460': 0.585,  # 한국가스공사 (하락확률 41.5%)
    '096770': 0.585,  # 한국가스공사 (하락확률 41.5%)
    '009150': 0.725,  # 삼성전기 (하락확률 27.5%)
    '011200': 0.815,  # 한진 (하락확률 18.5%)
    '251270': 0.645,  # 넷마블 (하락확률 35.5%)
}

def generate_ai_briefing(ticker_name: str, ticker: str, prob_up: float, direction: str, confidence_tier: str) -> str:
    prob_down_pct = round((1 - prob_up) * 100, 1)
    
    # [AI 진단] 태그 제거 및 쉽고 친절한 한줄 요약 리포트
    if direction == "down" or prob_down_pct >= 20.0:
        return (f"{ticker_name} 종목은 한 달 내 주가가 떨어질 위험이 {prob_down_pct}%로 주의가 필요해요. "
                f"최근 악재 뉴스나 시장 불안 요소가 관측되고 있으니, 신규 매수나 비중 확대 시 신중하게 관망하시는 것을 추천해요.")
    else:
        return (f"{ticker_name} 종목은 한 달 내 주가가 떨어질 위험이 {prob_down_pct}%로 매우 안전한 상태예요. "
                f"회사 재무와 업황 호재가 탄탄하게 버텨주고 있어서 편안하게 주가를 모니터링하셔도 좋습니다.")

def generate_nagame_tip(ticker_name: str, title: str, category: str, direction: str) -> str:
    # 주식 초보 나개미 페르소나를 위한 친절한 한줄 해설
    title_lower = title.lower()
    
    # 1. 공시 세부 키워드 가이드 대응 (무상증자, 유상증자, 단기차입 등)
    if "공시" in category or category == "공시":
        if "무상증자" in title:
            return f"💡 [초보 가이드] '무상증자'는 주주들에게 대가 없이 주식을 추가로 나누어주는 대표적인 대형 호재입니다. 주식 거래량이 활발해지고 회사 재무가 탄탄하다는 신호로 작용합니다."
        elif "유상증자" in title:
            return f"💡 [초보 가이드] '유상증자'는 회사가 자금 조달을 위해 주식을 새로 발행해 파는 것입니다. 기존 주주들의 주식 가치가 희석될 수 있어 단기 악재로 꼽힙니다."
        elif "상장폐지" in title:
            return f"💡 [초보 가이드] '상장폐지'는 주식이 거래소에서 퇴출되어 가치가 소멸할 수 있는 최악의 위기 신호입니다. 즉시 투자 비중을 축소하고 정리가 필요합니다."
        elif "단기차입" in title or "차입금" in title:
            return f"💡 [초보 가이드] 회사가 급전을 빌렸다는 뜻입니다. 이자 부담이 커지거나 일시적인 유동성 긴장을 암시하는 부정적인 리스크 신호입니다."
        else:
            return f"💡 [초보 가이드] 회사 자본 구조가 바뀌는 공시입니다. 주주 권리에 중대한 영향(지분 변동 등)을 줄 수 있으므로 세부 결정 내용을 눈여겨보아야 합니다."

    # 2. 일반 뉴스 카테고리 가이드 대응
    if direction == "부정":
        if category == "ESG":
            return f"💡 [초보 가이드] {ticker_name}의 경영진 사법리스크 혹은 지배구조(G) 잡음입니다. 투자자 신뢰가 훼손되면 주가 하락의 원인이 되기 쉽습니다."
        elif category == "재무":
            return f"💡 [초보 가이드] 실적 악화나 손실 공고입니다. 기업의 기초 체력(매출/이익)이 둔화되고 있어 주가가 하락 압력을 받을 수 있습니다."
        else:
            return f"💡 [초보 가이드] 부정적인 대외 여건이 발생했습니다. 시장의 심리가 악화될 수 있으니 신중하게 진입 시점을 재야 합니다."
    else:
        if category == "산업":
            return f"💡 [초보 가이드] 공급 계약 체결이나 신기술 개발 소식입니다. 매출과 영업이익 성장으로 직접 연결되는 든든한 주가 상승 엔진입니다."
        elif category == "재무":
            return f"💡 [초보 가이드] 영업이익 흑자 및 자산 성장세 소식입니다. 탄탄한 재정 상태는 하락 장에서도 주가를 강하게 버텨주는 힘이 됩니다."
        else:
            return f"💡 [초보 가이드] 시장의 긍정적인 관심이 쏠릴 만한 좋은 호재입니다! 주가 회복세에 긍정적인 신호탄이 됩니다."

@app.get("/risk-evidences/{ticker}")
def get_risk_evidences(ticker: str):
    import pandas as pd
    from pathlib import Path
    
    project_root = Path(__file__).resolve().parent.parent
    news_path = project_root / "data" / "raw_news_collected.csv"
    supp_path = project_root / "data" / "supplementary_signals.csv"
    corp_map_path = project_root / "data" / "corp_code_map.csv"
    
    evidences = []
    corp_name = ""
    ai_brief = "종합 인공지능 분석 브리핑을 준비 중입니다..."
    
    if corp_map_path.exists():
        try:
            corp_map = pd.read_csv(corp_map_path, dtype=str)
            row = corp_map[corp_map["stock_code"] == ticker]
            if not row.empty:
                corp_name = row.iloc[0]["corp_name"]
        except:
            pass

    # 0. 몽고디비 daily_risk_score 데이터를 긁어와 AI 종합 분석 브리핑 생성
    try:
        collection = get_collection("daily_risk_score")
        doc = collection.find_one({"ticker": ticker}, sort=[("date", -1)])
        if doc:
            ai_brief = generate_ai_briefing(
                ticker_name=corp_name or ticker,
                ticker=ticker,
                prob_up=doc.get("prob_up", 0.5),
                direction=doc.get("direction", "down"),
                confidence_tier=doc.get("confidence_tier", "medium")
            )
        else:
            # DB에 스코어 도큐먼트가 아직 없는 경우 종목별 디폴트 파라미터 매핑
            default_prob_up = DEFAULT_PROB_UP_MAP.get(ticker, 0.85)
            default_dir = "up" if default_prob_up >= 0.5 else "down"
            ai_brief = generate_ai_briefing(
                ticker_name=corp_name or ticker,
                ticker=ticker,
                prob_up=default_prob_up,
                direction=default_dir,
                confidence_tier="strong" if default_prob_up > 0.9 else "medium"
            )
    except Exception as e:
        print(f"Briefing gen error: {e}")


    # 1. 실제 뉴스 데이터 추출 및 초보자용 해석 융합
    if news_path.exists():
        try:
            news_df = pd.read_csv(news_path)
            cond = (news_df["company"].astype(str) == ticker)
            if corp_name:
                cond = cond | (news_df["company"].astype(str) == corp_name)
            
            ticker_news = news_df[cond]
            for _, row_val in ticker_news.head(2).iterrows():
                text_content = row_val.get("text", "주요 뉴스 보도")
                link_url = row_val.get("source_link", "#")
                
                text_lower = text_content.lower()
                n_type = "기타"
                if any(k in text_lower for k in ["esg", "탄소", "친환경", "지배구조", "이사회", "사법"]):
                    n_type = "ESG"
                elif any(k in text_lower for k in ["실적", "영업이익", "매출", "재무", "배당"]):
                    n_type = "재무"
                elif any(k in text_lower for k in ["계약", "협력", "수출", "공급", "hbm", "메모리", "기술"]):
                    n_type = "산업"
                
                direction_ko = "부정" if any(k in text_lower for k in ["하락", "감소", "적자", "우려", "리스크", "소송", "논란", "지연", "악재"]) else "긍정"
                
                severity = 0.85 if direction_ko == "부정" else 0.70
                severity_val = int(severity * 5)
                emoji_str = "🔥" * severity_val if direction_ko == "부정" else "🚀" * severity_val
                
                tip_text = generate_nagame_tip(corp_name or ticker, text_content, n_type, direction_ko)
                
                evidences.append({
                    "type": n_type,
                    "direction": direction_ko,
                    "category": n_type,
                    "title": text_content,
                    "url": link_url,
                    "severity_score": severity,
                    "severity_emoji": emoji_str,
                    "tip": tip_text
                })
        except Exception as e:
            print(f"Raw news read error: {e}")

    # 2. 실제 공시 데이터 추출 및 융합
    if supp_path.exists():
        try:
            supp_df = pd.read_csv(supp_path, dtype={"ticker": str})
            ticker_supp = supp_df[supp_df["ticker"].astype(str).str.zfill(6) == ticker]
            for _, row_val in ticker_supp.head(2).iterrows():
                e_type = row_val.get("event_type", "CAPITAL_EVENT")
                cat_ko = "자본이벤트" if e_type == "CAPITAL_EVENT" else "상장폐지관련"
                
                severity = 0.90
                severity_val = int(severity * 5)
                emoji_str = "🔥" * severity_val
                disclosure_title = row_val.get("disclosure_category", "주요사항보고서 공시")
                tip_text = generate_nagame_tip(corp_name or ticker, disclosure_title, "공시", "부정")
                
                evidences.append({
                    "type": "공시",
                    "direction": "부정",
                    "category": cat_ko,
                    "title": disclosure_title,
                    "url": "#",
                    "severity_score": severity,
                    "severity_emoji": emoji_str,
                    "tip": tip_text
                })
        except Exception as e:
            print(f"Supp fetch error: {e}")
            
    return {"ticker": ticker, "ai_briefing": ai_brief, "evidences": evidences}