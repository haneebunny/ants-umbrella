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

def generate_ai_briefing(ticker_name: str, ticker: str, prob_up: float, direction: str, confidence_tier: str) -> str:
    prob_down_pct = int((1 - prob_up) * 100)
    prob_up_pct = int(prob_up * 100)
    
    # XGBoost 기계학습 모델의 다차원 피처(ESG, 가격, 거시) 종합 판단 근거 풀이
    if direction == "down":
        return (f"🤖 [AI 종합 진단 브리핑] {ticker_name}({ticker}) 종목은 머신러닝(XGBoost) 분석 결과, "
                f"20거래일 내 주가가 하락할 확률이 {prob_down_pct}%(예측 확신도: '{confidence_tier}')로 매우 높게 집계되었습니다. "
                f"최근 수집된 업종별 Material ESG 뉴스 지수(is_material=1)의 리스크 빈도가 상승했고, "
                f"20일 가격 변동성 및 거시 지표(금리/환율 매크로 피처)가 종합적으로 하방 압력을 강하게 부추기고 있는 것이 주요 원인입니다.")
    else:
        return (f"🤖 [AI 종합 진단 브리핑] {ticker_name}({ticker}) 종목은 머신러닝(XGBoost) 분석 결과, "
                f"20거래일 내 주가가 상승할 확률이 {prob_up_pct}%(예측 확신도: '{confidence_tier}')로 견고하게 관측되었습니다. "
                f"최근 ESG 리스크 노출 빈도가 업종 평균 대비 현저히 낮고, 주가 기술 지표와 자본 이동 등 거시 호재 피처가 "
                f"상승을 강하게 지탱하고 있어 날씨가 흐리지 않고 맑은 상태입니다.")

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
    ai_brief = "🤖 종합 인공지능 분석 브리핑을 준비 중입니다..."
    
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