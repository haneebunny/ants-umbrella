import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.db import get_collection
from app.schemas import DailyRiskScore
import FinanceDataReader as fdr
from dotenv import load_dotenv

# .env 파일 로드 (KIS_APP_KEY, KIS_APP_SECRET 등)
load_dotenv()

app = FastAPI()

from app.recommendation_service import get_or_create_recommendation_reason

@app.get("/api/v1/recommendations/reasons")
def get_recommendation_reasons_api(ticker: str, risk_band: str, stock_name: str = "추천종목", tag: str = "#우량주"):
    """
    [Cache-First Strategy]
    DB/로컬 캐시를 우선 확인하여 기존 생성된 뉴닉 톤 해설을 LLM 호출 없이 0ms로 반환합니다.
    캐시가 없을 때만 LLM을 1회 호출해 생성 후 DB/로컬 캐시에 영구 저장하여 재활용합니다.
    """
    return get_or_create_recommendation_reason(ticker, stock_name, risk_band, tag)

@app.get("/api/v1/recommendations/all_cache")
def get_all_cached_reasons_api():
    """DB/로컬에 담긴 전체 추천 해설 캐시 맵을 반환합니다."""
    col = get_collection("recommendation_reasons")
    docs = list(col.find({}, {"_id": 0})) if hasattr(col, "find") else getattr(col, "data", [])
    return {"status": "success", "count": len(docs), "data": docs}


# ── ⏰ APScheduler 동적 배치 스케줄러 ───────────────────────────────
from apscheduler.schedulers.background import BackgroundScheduler
import subprocess
import sys
from datetime import datetime

scheduler = BackgroundScheduler(timezone="Asia/Seoul")

def run_daily_batch_job():
    print(f"[SCHEDULER] 배치 작업 시작 시간: {datetime.now().isoformat()}")
    try:
        from pathlib import Path
        project_root = Path(__file__).resolve().parent.parent
        run_pipeline_path = project_root / "backend" / "scripts" / "run_pipeline.py"
        slack_notifier_path = project_root / "backend" / "scripts" / "slack_notifier.py"
        
        # run_pipeline.py 비동기 실행 (출력물은 백엔드 프로세스 로그에 남김)
        print(f"[SCHEDULER] run_pipeline.py 실행: {run_pipeline_path}")
        p1 = subprocess.Popen([sys.executable, str(run_pipeline_path)])
        p1.wait() # 파이프라인 구동 대기
        
        # slack_notifier.py 실행
        print(f"[SCHEDULER] slack_notifier.py 실행: {slack_notifier_path}")
        p2 = subprocess.Popen([sys.executable, str(slack_notifier_path)])
        p2.wait()
        print("[SCHEDULER] 배치 작업 및 슬랙 알림 발송 완료.")
    except Exception as e:
        print(f"[SCHEDULER] 배치 작업 실행 중 에러 발생: {e}")

def reschedule_alert_jobs(alert_times: list[str]):
    # 기존에 등록된 모든 잡 삭제
    scheduler.remove_all_jobs()
    for time_str in alert_times:
        try:
            hour, minute = map(int, time_str.split(":"))
            job_id = f"batch_{hour:02d}_{minute:02d}"
            scheduler.add_job(
                run_daily_batch_job,
                "cron",
                hour=hour,
                minute=minute,
                id=job_id,
                name=f"Daily Batch at {time_str}"
            )
            print(f"[SCHEDULER] 크론 잡 등록 완료: {job_id} ({time_str})")
        except Exception as e:
            print(f"[SCHEDULER] 스케줄 등록 에러 ({time_str}): {e}")

@app.on_event("startup")
def startup_event():
    scheduler.start()
    print("[SCHEDULER] APScheduler 백그라운드 스케줄러 시작 완료.")
    # DB에서 기존 설정값 읽어와서 복원
    try:
        settings_col = get_collection("user_settings")
        # JSON Mock DB 및 복합 인덱스 매칭을 위해 ticker/date를 settings/alert_config로 처리
        cfg = settings_col.find_one({"ticker": "settings", "date": "alert_config"})
        alert_times = cfg.get("alert_times", ["07:00", "10:27"]) if cfg else ["07:00", "10:27"]
    except Exception as e:
        print(f"[SCHEDULER] 기존 알림 시간 스케줄 로드 실패: {e}")
        alert_times = ["07:00", "10:27"]
    reschedule_alert_jobs(alert_times)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",                          # 로컬 개발
        "https://ants-umbrella.vercel.app",               # Vercel 프로덕션
        "https://ants-umbrella-production.up.railway.app", # Railway (자기 자신 참조 허용)
        os.environ.get("FRONTEND_URL", ""),               # 추가 도메인 환경변수로 주입 가능
    ],
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

# ── 🔑 KIS 토큰 파일 기반 캐싱 및 도메인 자동 전환 ─────────────────────
def get_kis_access_token_and_domain() -> tuple[str, str]:
    import time
    import json
    from pathlib import Path
    
    project_root = Path(__file__).resolve().parent.parent
    cache_path = project_root / "data" / "kis_token_cache.json"
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    
    now = time.time()
    token = None
    domain = "https://openapi.koreainvestment.com:9443"
    expires_at = 0
    cooldown_until = 0
    
    # 1. 파일에서 캐시 로드
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached = json.load(f)
                token = cached.get("token")
                domain = cached.get("domain", "https://openapi.koreainvestment.com:9443")
                expires_at = cached.get("expires_at", 0)
                cooldown_until = cached.get("cooldown_until", 0)
        except Exception as e:
            print(f"[WARN] KIS 토큰 파일 캐시 로드 실패: {e}")
            
    # 2. 쿨다운 적용 중이고 유효한 이전 토큰도 없으면 빠르게 None 반환
    if cooldown_until > now and not (token and expires_at > now + 5):
        print(f"[INFO] KIS API 토큰 요청 쿨다운 중... {int(cooldown_until - now)}초 대기 필요. API 호출 스킵.")
        return None, domain
        
    # 3. 유효한 캐시 즉시 반환 (완전 만료 1분 전까지 재사용)
    if token and expires_at > now + 60:
        if expires_at > now + 600:
            return token, domain
        if cooldown_until > now:
            # 10분 이내로 남았더라도 쿨다운 대기 중인 경우 새 호출 방지 위해 기존 토큰 재사용
            return token, domain

    # 4. KIS API 호출하여 새 토큰 받기
    kis_key = (os.environ.get("KIS_APP_KEY") or os.environ.get("KIS_APPKEY") or "").strip()
    kis_secret = (os.environ.get("KIS_APP_SECRET") or os.environ.get("KIS_APPSECRET") or "").strip()
    if not kis_key or not kis_secret:
        return None, domain
        
    headers = {"content-type": "application/json"}
    body = {
        "grant_type": "client_credentials",
        "appkey": kis_key,
        "appsecret": kis_secret
    }
    
    real_domain = "https://openapi.koreainvestment.com:9443"
    mock_domain = "https://openapivts.koreainvestment.com:29443"
    
    # 5. 기억된 캐시 도메인이 mock이면 mock 도메인부터 먼저 시도 (VTS 키일 때 속도 향상 및 실전 도메인 에러 스킵)
    primary_domain = domain if domain in [real_domain, mock_domain] else real_domain
    secondary_domain = mock_domain if primary_domain == real_domain else real_domain
    
    try:
        # 기본 도메인 호출
        res = requests.post(f"{primary_domain}/oauth2/tokenP", headers=headers, data=json.dumps(body), timeout=5)
        if res.status_code == 200:
            data = res.json()
            token = data.get("access_token")
            domain = primary_domain
            expires_at = now + int(data.get("expires_in", 7200))
            
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump({"token": token, "domain": domain, "expires_at": expires_at, "cooldown_until": 0}, f)
            print(f"[SUCCESS] KIS ({domain}) token saved. Expires at {datetime.fromtimestamp(expires_at).isoformat()}")
            return token, domain
            
        # 기본 도메인이 실패했고, 에러 코드가 잘못된 도메인(실전 vs 모의 키 불일치)을 나타낼 때 세컨더리 시도
        res_json = res.json()
        error_code = res_json.get("error_code")
        error_desc = res_json.get("error_description", "")
        
        is_invalid_key = (error_code == "EGW00103" or "AppKey" in error_desc)
        
        if is_invalid_key:
            print(f"[INFO] KIS 도메인 전환 시도 ({primary_domain} -> {secondary_domain})")
            res_mock = requests.post(f"{secondary_domain}/oauth2/tokenP", headers=headers, data=json.dumps(body), timeout=5)
            if res_mock.status_code == 200:
                data = res_mock.json()
                token = data.get("access_token")
                domain = secondary_domain
                expires_at = now + int(data.get("expires_in", 7200))
                
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump({"token": token, "domain": domain, "expires_at": expires_at, "cooldown_until": 0}, f)
                print(f"[SUCCESS] KIS ({domain}) token saved. Expires at {datetime.fromtimestamp(expires_at).isoformat()}")
                return token, domain
                
        # 호출 실패 시 (예: EGW00133 1분 제한 등) 60초 쿨다운 적용
        # 단, 기존에 사용 가능했던 유효 토큰이 남아 있으면, 캐시 파일에서 토큰 값을 지우지 않고 쿨다운 시간만 설정하여 저장!
        new_cooldown = now + 60
        old_token_valid = token and expires_at > now
        
        saved_token = token if old_token_valid else None
        saved_expires = expires_at if old_token_valid else 0
        
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump({
                "token": saved_token, 
                "domain": domain, 
                "expires_at": saved_expires, 
                "cooldown_until": new_cooldown
            }, f)
            
        print(f"[WARN] KIS token issue failed. Applied 60s cooldown. "
              f"Using old valid token: {old_token_valid} (expires_at={saved_expires})")
              
        if old_token_valid:
            return token, domain
            
    except Exception as e:
        print(f"[ERROR] KIS 토큰 발급/캐싱 도중 예외 발생: {e}")
        
import time

REALTIME_PRICE_CACHE = {}  # {ticker: {"timestamp": ..., "data": ...}}
CACHE_TTL = 15  # 15초 동안 가격 유지

def get_realtime_price_via_kis_cached(ticker: str) -> dict:
    now = time.time()
    if ticker in REALTIME_PRICE_CACHE:
        cached = REALTIME_PRICE_CACHE[ticker]
        if now - cached["timestamp"] < CACHE_TTL:
            return cached["data"]
            
    data = get_realtime_price_via_kis(ticker)
    if data:
        REALTIME_PRICE_CACHE[ticker] = {
            "timestamp": now,
            "data": data
        }
    return data


def get_realtime_price_via_kis(ticker: str) -> dict:
    return _get_realtime_price_via_kis_internal(ticker, retry_on_expire=True)

def _get_realtime_price_via_kis_internal(ticker: str, retry_on_expire: bool = True) -> dict:
    access_token, domain = get_kis_access_token_and_domain()
    if not access_token:
        return None
    try:
        # 2. 실시간 현재가 조회
        price_url = f"{domain}/uapi/domestic-stock/v1/quotations/inquire-price"
        price_headers = {
            "content-type": "application/json; charset=utf-8",
            "authorization": f"Bearer {access_token}",
            "appkey": (os.environ.get("KIS_APP_KEY") or os.environ.get("KIS_APPKEY") or "").strip(),
            "appsecret": (os.environ.get("KIS_APP_SECRET") or os.environ.get("KIS_APPSECRET") or "").strip(),
            "tr_id": "FHKST01010100"
        }
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": str(ticker).zfill(6)
        }
        price_res = requests.get(price_url, headers=price_headers, params=params, timeout=5)
        
        # 토큰 만료 에러 감지 (EGW00123)
        if price_res.status_code != 200:
            try:
                err_data = price_res.json()
                msg_cd = err_data.get("msg_cd")
                msg1 = err_data.get("msg1", "")
                
                if (msg_cd == "EGW00123" or "만료된 token" in msg1) and retry_on_expire:
                    print(f"[WARN] 만료된 토큰 감지 ({msg_cd}: {msg1}). 캐시 삭제 후 재갱신 시도...")
                    from pathlib import Path
                    project_root = Path(__file__).resolve().parent.parent
                    cache_path = project_root / "data" / "kis_token_cache.json"
                    if cache_path.exists():
                        try:
                            cache_path.unlink()
                            print("[SUCCESS] 만료 토큰 캐시 파일 제거 완료.")
                        except Exception as e:
                            print(f"[ERROR] 캐시 파일 삭제 실패: {e}")
                    return _get_realtime_price_via_kis_internal(ticker, retry_on_expire=False)
            except Exception as parse_err:
                print(f"[WARN] KIS API 오류 파싱 실패: {parse_err}")

        if price_res.status_code == 200:
            out = price_res.json().get("output", {})
            prpr = int(out.get("stck_prpr", 0))
            vrss = int(out.get("prdy_vrss", 0))
            ctrt = float(out.get("prdy_ctrt", 0.0))
            sign = out.get("prdy_vrss_sign", "3")
            if sign in ["4", "5"]:
                vrss = -abs(vrss)
            return {
                "ticker": str(ticker).zfill(6),
                "price": prpr,
                "change": vrss,
                "change_rate": ctrt,
                "direction": "down" if sign in ["4", "5"] else "up",
                "w52_hgpr": int(out.get("w52_hgpr", 0)),
                "w52_lwpr": int(out.get("w52_lwpr", 0))
            }
    except Exception as e:
        print(f"[ERROR] KIS API 현재가 조회 중 오류 발생 ({ticker}): {e}")
    return None

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
# v2 임계값 재보정 + v3 횡단면(cross-sectional) 정규화 + v4 급락 모델 전환.
#
# v2: 모델(20일 방향예측)의 prob_up 중앙값이 0.5 부근이라, 기존 임계값
#     (thunder>=0.65)은 "방향이 하락 쪽"인 흔한 케이스까지 번개로 잡았음.
#     prob_down 컷을 0.45/0.60/0.75로 상향해 번개를 하위 꼬리로 제한.
#
# v3: 시장 전체가 하락하는 날에는 거의 모든 종목의 prob_down이 동시에 치솟아
#     (macro 피처 공통) 전 종목이 번개가 되는 쏠림이 발생. 시장 공통 하락분
#     (market_pd - BASELINE)을 ALPHA만큼 각 종목에서 제거하여, 날씨가
#     "시장 대비 종목 고유 위험"을 반영하도록 정규화한다.
#
# v4: 예측 타깃을 20일 방향 → "20거래일 내 -10% 급락"으로 교체(PRD v2.3).
#     이제 prob_down == prob_crash 이며 분포 중심이 0.5가 아니라 급락 확률
#     중앙값(약 0.39) 쪽으로 내려온다. 그래서 v2 컷(0.45/0.60/0.75)을 그대로
#     쓰면 맑음이 59%까지 늘어 분포가 왜곡됨 → 기존 날씨 구성비
#     (맑음 41 / 구름 39 / 비 15 / 번개 4.7%)를 재현하는 분위수 컷으로 재보정.
#     보정 결과 실측 날씨별 급락 발생률은 단조 증가한다
#     (맑음 0.033 → 구름 0.155 → 비 0.491 → 번개 0.807).
#     ※ 서빙 모델은 확률 보정을 지키려고 scale_pos_weight를 쓰지 않으므로
#       prob_crash 분포가 실제 기저율(0.185)에 맞춰 낮게 형성된다. 컷도 같은
#       분포에서 산출했다. 학습 데이터가 크게 바뀌면 save_risk_scores.py가
#       출력하는 prob_crash 중앙값으로 BASELINE을 갱신할 것.
_WEATHER_ALPHA = 0.7        # 시장 공통분 제거 강도 (0=절대, 1=완전 상대화)
_WEATHER_BASELINE = 0.138   # 중립 급락확률 기준선 = prob_crash 중앙값
_WEATHER_CUT_SUNNY = 0.097
_WEATHER_CUT_CLOUDY = 0.252
_WEATHER_CUT_RAINY = 0.420
# 데이터 누락 시 쓰는 중립 prob_up (= 1 - 기준선). 급락 모델 전환 후에는 0.5가
# 아니라 이 값이 "위험도 보통"에 해당하므로 폴백 기본값으로 사용한다.
_NEUTRAL_PROB_UP = 1.0 - _WEATHER_BASELINE

def _prob_to_weather(prob_up: float, direction: str = "up", market_pd: float = _WEATHER_BASELINE) -> str:
    # prob_up = 1 - P(급락) 으로 저장되므로 prob_down 이 곧 급락 확률
    prob_down = 1.0 - prob_up
    # 횡단면 정규화: 시장 공통 위험분을 부분 제거
    shift = _WEATHER_ALPHA * (market_pd - _WEATHER_BASELINE)
    pd_adj = min(max(prob_down - shift, 0.0), 1.0)
    if pd_adj < _WEATHER_CUT_SUNNY:
        return "sunny"
    elif pd_adj < _WEATHER_CUT_CLOUDY:
        return "cloudy"
    elif pd_adj < _WEATHER_CUT_RAINY:
        return "rainy"
    else:
        return "thunder"

def _market_prob_down_baseline(collection) -> float:
    """
    최신 날짜의 전 종목 평균 급락확률 = 시장 공통 위험 수준.
    횡단면 정규화의 기준(market_pd)으로 사용. 표본이 부족하면 기준선을 그대로
    반환 → shift=0 이 되어 절대 임계값으로 자연 폴백.
    """
    try:
        latest = collection.find_one({}, sort=[("date", -1)])
        if not latest:
            return _WEATHER_BASELINE
        docs = list(collection.find({"date": latest.get("date")}, {"prob_up": 1}))
        if len(docs) < 5:
            return _WEATHER_BASELINE
        pds = [1.0 - float(x.get("prob_up", 1.0 - _WEATHER_BASELINE)) for x in docs]
        return sum(pds) / len(pds)
    except Exception:
        return _WEATHER_BASELINE

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

    # 횡단면 정규화 기준: 최신일 시장 전체 평균 하락확률 (요청당 1회 계산)
    market_pd = _market_prob_down_baseline(collection)

    # 1. 병렬로 실시간 시세 및 등락률 수집 (ThreadPoolExecutor)
    from concurrent.futures import ThreadPoolExecutor
    
    def fetch_live_data(ticker):
        live_price = None
        change = None
        try:
            kis_data = get_realtime_price_via_kis_cached(ticker)
            if kis_data:
                live_price = kis_data.get("price")
                change = kis_data.get("change_rate")
        except Exception as e:
            print(f"[WARN] Failed KIS fetch for {ticker}: {e}")
        return ticker, live_price, change

    with ThreadPoolExecutor(max_workers=min(len(ticker_list), 10)) as executor:
        futures = [executor.submit(fetch_live_data, t) for t in ticker_list]
        live_results = {ticker: (live_price, change) for ticker, live_price, change in [f.result() for f in futures]}

    results = []
    for ticker in ticker_list:
        try:
            doc = collection.find_one({"ticker": ticker}, sort=[("date", -1)])
            if not doc:
                # 해당 종목 데이터 없으면 null 반환 → 프론트에서 mockData 사용
                results.append({"ticker": ticker, "available": False})
                continue

            prob_up   = float(doc.get("prob_up", _NEUTRAL_PROB_UP))
            direction = doc.get("direction", "up")
            weather   = _prob_to_weather(prob_up, direction, market_pd)

            # 수집된 실시간 가격 및 변동률 가져오기
            live_price, change = live_results.get(ticker, (None, None))

            if change is None:
                try:
                    price_col = get_collection("price_macro")
                    price_doc = price_col.find_one({"ticker": ticker}, sort=[("date", -1)])
                    if price_doc:
                        change = round(float(price_doc.get("log_return_1d", 0)) * 100, 2)
                        live_price = price_doc.get("close")
                except Exception:
                    pass

            if live_price is None:
                live_price = DEFAULT_MOCK_PRICES.get(ticker, 70000)

            results.append({
                "ticker":           ticker,
                "available":        True,
                "weather":          weather,
                "direction":        direction,
                "prob_up":          round(prob_up, 4),
                "confidence_tier":  doc.get("confidence_tier", "weak"),
                "change":           change,
                "currentPrice":     live_price,
                "date":             str(doc.get("date", "")),
                "esgScore":         None,   # esg_events에서 추후 집계 가능
            })
        except Exception as e:
            print(f"[WARN] dashboard-weather {ticker}: {e}")
            results.append({"ticker": ticker, "available": False})

    return results

DEFAULT_MOCK_PRICES = {
    '000660': 180000,  # SK하이닉스
    '005930': 72000,   # 삼성전자
    '005380': 250000,  # 현대차
    '035420': 170000,  # NAVER
    '055550': 50000,   # 신한지주
    '017670': 52000,   # SK텔레콤
    '005490': 360000,  # POSCO홀딩스
    '010950': 68000,   # S-Oil
    '028260': 140000,  # 삼성물산
    '000270': 110000,  # 기아
    '068270': 190000,  # 셀트리온
    '035720': 42000,   # 카카오
    '051910': 380000,  # LG화학
    '003550': 78000,   # LG
    '036570': 180000,  # 엔씨소프트
    '373220': 390000,  # LG에너지솔루션
    '006400': 370000,  # 삼성SDI
    '086520': 90000,   # 에코프로
    '247540': 180000,  # 에코프로비엠
    '196170': 270000,  # 알테오젠
    '032830': 80000,   # 삼성생명
    '033780': 92000,   # KT&G
    '105560': 78000,   # KB금융
    '047050': 55000,   # 포스코인터
    '036460': 42000,   # 한국가스공사
    '009150': 140000,  # 삼성전기
    '011200': 220000,  # 한진
    '251270': 58000,   # 넷마블
    '015760': 21000,   # 한국전력
}

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

@app.get("/api/watchlist-prices")
def get_watchlist_prices(tickers: str = ""):
    """한국투자증권 API 연동 실시간 주가 리스트 조회 API"""
    if not tickers.strip():
        return []
    ticker_list = [t.strip() for t in tickers.split(",") if t.strip()]
    results = []
    
    access_token, domain = get_kis_access_token_and_domain()
    kis_key = (os.environ.get("KIS_APP_KEY") or os.environ.get("KIS_APPKEY") or "").strip()
    kis_secret = (os.environ.get("KIS_APP_SECRET") or os.environ.get("KIS_APPSECRET") or "").strip()

    for ticker in ticker_list:
        ticker_formatted = ticker.zfill(6)
        data = None
        
        # 1. KIS 실시간 API 조회 시도
        if access_token:
            try:
                price_url = f"{domain}/uapi/domestic-stock/v1/quotations/inquire-price"
                price_headers = {
                    "content-type": "application/json; charset=utf-8",
                    "authorization": f"Bearer {access_token}",
                    "appkey": kis_key,
                    "appsecret": kis_secret,
                    "tr_id": "FHKST01010100"
                }
                params = {
                    "FID_COND_MRKT_DIV_CODE": "J",
                    "FID_INPUT_ISCD": ticker_formatted
                }
                price_res = requests.get(price_url, headers=price_headers, params=params, timeout=3)
                if price_res.status_code == 200:
                    out = price_res.json().get("output", {})
                    prpr = int(out.get("stck_prpr", 0))
                    vrss = int(out.get("prdy_vrss", 0))
                    ctrt = float(out.get("prdy_ctrt", 0.0))
                    sign = out.get("prdy_vrss_sign", "3")
                    if sign in ["4", "5"]:
                        vrss = -abs(vrss)
                    if prpr > 0:
                        data = {
                            "ticker": ticker_formatted,
                            "price": prpr,
                            "change": vrss,
                            "change_rate": ctrt,
                            "direction": "down" if sign in ["4", "5"] else "up",
                            "w52_hgpr": int(out.get("w52_hgpr", 0)),
                            "w52_lwpr": int(out.get("w52_lwpr", 0))
                        }
            except Exception as e:
                print(f"[WARN] KIS 실시간가 개별 조회 실패 ({ticker_formatted}): {e}")
        
        # 2. FDR fallback — 네이버 기반 실제 시장 종가 (신뢰도 높음)
        if not data:
            try:
                df = fdr.DataReader(ticker_formatted)
                if not df.empty and len(df) >= 2:
                    latest = df.iloc[-1]
                    prev = df.iloc[-2]
                    price = int(latest["Close"])
                    prev_price = int(prev["Close"])
                    change = price - prev_price
                    change_rate = round((change / prev_price) * 100, 2)
                    data = {
                        "ticker": ticker_formatted,
                        "price": price,
                        "change": change,
                        "change_rate": change_rate,
                        "direction": "up" if change >= 0 else "down"
                    }
            except Exception as e:
                print(f"[WARN] FDR fallback 실패 ({ticker_formatted}): {e}")

        # 3. 최종 fallback
        if not data:
            data = {
                "ticker": ticker_formatted,
                "price": 0,
                "change": 0,
                "change_rate": 0.0,
                "direction": "up"
            }
                
        results.append(data)
            
    return results

def _call_gemini(prompt: str) -> str:
    """Gemini REST API 직접 호출 (google-generativeai 패키지 불필요)."""
    import requests as req_lib
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    # 유저가 .env에 설정한 모델명 사용 (없을 경우 fallback 모델)
    model_name = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite").strip()
    
    if not api_key:
        return ""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    try:
        res = req_lib.post(url, json=body, timeout=10)
        if res.status_code == 200:
            candidates = res.json().get("candidates", [])
            if candidates:
                return candidates[0]["content"]["parts"][0]["text"].strip()
            print(f"[WARN] Gemini API 응답에 candidates 없음 (model={model_name}): {res.text[:300]}")
        else:
            # 404(모델 종료/오탈자), 429(쿼터 초과) 등 실패 상태코드를 로그로 남겨 원인 추적 가능하게 함
            print(f"[WARN] Gemini API 호출 실패 (model={model_name}, status={res.status_code}): {res.text[:300]}")
    except Exception as e:
        print(f"[WARN] Gemini API 호출 예외 (model={model_name}): {e}")
    return ""


def generate_ai_briefing(ticker_name: str, ticker: str, prob_up: float, direction: str, confidence_tier: str, esg_count: int = 0) -> str:
    import hashlib
    from datetime import datetime

    prob_down_pct = int((1 - prob_up) * 100)
    prob_up_pct = int(prob_up * 100)
    conf_map = {"strong": "높음", "medium": "보통", "weak": "낮음"}
    conf_ko = conf_map.get(str(confidence_tier).lower(), "낮음")

    # ESG 건수 구간화 (0건 / 1-3건 / 4건+) — 미미한 수치 변동엔 LLM 재호출 안 함
    esg_bucket = 0 if esg_count == 0 else (1 if esg_count <= 3 else 2)

    # ── 1. fingerprint 계산 ──────────────────────────────────────────
    fp_raw = f"{ticker}|{direction}|{confidence_tier}|{esg_bucket}|{int(prob_up * 10)}"
    fingerprint = hashlib.md5(fp_raw.encode()).hexdigest()[:12]

    # ── 2. 캐시 조회 (변동 없으면 즉시 반환) ──────────────────────────
    # is_fallback=True로 저장된 캐시(과거 Gemini 호출 실패로 템플릿을 썼던 경우)는
    # 히트로 치지 않고 매번 재시도한다. 그렇지 않으면 모델을 고쳐도 예전 실패 캐시가
    # 영구히 재사용되어 "항상 같은 하드코딩 문구"처럼 보이는 문제가 생긴다.
    try:
        cache_col = get_collection("ai_briefings")
        cached = cache_col.find_one({"ticker": ticker}, sort=[("date", -1)])
        if (cached and cached.get("fingerprint") == fingerprint
                and cached.get("briefing") and not cached.get("is_fallback")):
            print(f"[CACHE HIT] ai_briefings: {ticker} (fp={fingerprint})")
            return cached["briefing"]
    except Exception as e:
        print(f"[WARN] ai_briefings 캐시 조회 실패: {e}")

    # ── 3. 템플릿 fallback (Gemini 실패 시 사용) ──────────────────────
    esg_phrase = ("최근 이 회사에 관한 ESG/산업 부정적 노이즈가 포착된 상황이고,"
                  if esg_count > 0 else
                  "최근 ESG 평판이나 사회적 중대성 부문의 눈에 띄는 악재는 탐지되지 않았지만,")
    if direction == "down":
        fallback = (f"🐜 안녕 나개미! 최근 **{ticker_name}**의 주가 날씨 예보를 전하러 왔어! "
                    f"20거래일 안에 주가가 급락(-10% 이상)할 확률이 **{prob_down_pct}%**(예측 확신도: '{conf_ko}')로 집계됐어! ⚡ "
                    f"{esg_phrase} 금리·환율 같은 거시 지표들이 하방 압력을 더하고 있어. 비를 피할 준비를 해야 할 것 같아! ☔")
    else:
        fallback = (f"🐜 좋은 소식이야, 나개미! **{ticker_name}**의 20거래일 내 주가 예보는 '맑음'으로 예측됐어! "
                    f"상승할 확률이 **{prob_up_pct}%**(예측 확신도: '{conf_ko}')나 된다고 **개미의 우산**이 알려줬어! 🎉 "
                    f"주가 변동성·수급 신호들이 든든하게 지탱해 주고 있어. 편안한 마음으로 지켜보자! ☀️")

    # ── 4. Gemini로 신규 브리핑 생성 ──────────────────────────────────
    prompt = f"""당신은 주식 초보자에게 친근하게 정보를 전달하는 '나개미' 캐릭터입니다.
뉴닉(NEWNEEK) 스타일로 짧고 이해하기 쉽게, 이모지를 섞어서 2~3문장으로 브리핑해 주세요.

[입력 데이터]
- 종목: {ticker_name} ({ticker})
- 20거래일 내 하락 확률: {prob_down_pct}% (상승 확률: {prob_up_pct}%)
- 예측 방향: {"⚠️ 하락 주의" if direction == "down" else "☀️ 상승 전망"}
- 예측 확신도: {conf_ko}
- ESG/부정 뉴스 건수: {esg_count}건

[작성 규칙]
- "안녕! 든든한 투자 메이트, 미미야!" 로 시작
- 수치(확률, 확신도)를 자연스럽게 문장에 녹여서
- 초보 투자자가 바로 이해할 수 있는 쉬운 용어
- **굵게** 강조 필요한 단어에 마크다운 볼드 사용"""

    gemini_text = _call_gemini(prompt)
    
    if gemini_text:
        validation_prompt = f"""당신은 전문 금융 분석가이자 주식 초보자의 친근한 투자 메이트 '미미'입니다.
다음의 1차 리스크 분석 초고와 수집된 기업/시장 관련 원본 데이터를 종합 검토하고, 정보 누락이나 논리적 모순이 없는지 최종 팩트체크하여 투자자에게 도움이 되는 '자세하고 가독성이 뛰어난 분석 리포트 브리핑'으로 확장해 주세요.

[1차 초안 브리핑]
{gemini_text}

[입력 원본 데이터]
- 종목: {ticker_name} ({ticker})
- 20일 하락 확률: {prob_down_pct}% (상승 확률: {prob_up_pct}%)
- 관련 ESG/부정 보도량: {esg_count}건

[작성 및 가독성 규칙 (매우 중요)]
- 캐릭터 정체성인 '미미' 및 핵심 정보(하락 확률 등)를 확실히 반영해 친근하고 부드러운 말투(~어요, ~랍니다)로 설명하세요. '개미미'나 '나개미'는 절대 사용하지 마세요.
- 전체 글이 절대로 하나의 긴 덩어리 문단으로 합쳐지지 않게 하세요. 내용의 흐름(개요 / 원인 분석 / 대응 팁)에 따라 문단 사이에 반드시 '\\n\\n' (줄바꿈 2개)을 기입하여, 최소 3개 이상의 짧고 명확한 문단으로 단락을 나누어 작성하세요.
- 어려운 한자어나 금융 전문어(예: 보합, 오버행, 밸류에이션 등)는 초보자가 이해하기 쉽도록 한글로 풀어서 설명하세요.
- 반드시 브리핑 내용의 마지막 문장으로 "🔍 미미의 최종 리스크 검증 완료" 라는 검증 라벨을 단독 줄로 추가해 주세요.
- 강조하고 싶은 핵심 단어는 **굵게** 마크다운 볼드로 표기하세요.
"""
        verified_text = _call_gemini(validation_prompt)
        briefing = verified_text or gemini_text
        used_fallback = False
    else:
        briefing = fallback + "\n\n🔍 미미의 최종 리스크 검증 완료"
        used_fallback = True

    # ── 5. 결과 캐싱 (fingerprint 저장, 폴백 여부도 함께 기록) ───────────
    try:
        cache_col.update_one(
            {"ticker": ticker},
            {"$set": {
                "ticker": ticker,
                "fingerprint": fingerprint,
                "briefing": briefing,
                "is_fallback": used_fallback,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "updated_at": datetime.now().isoformat(),
            }},
            upsert=True
        )
        print(f"[CACHE SET] ai_briefings: {ticker} (fp={fingerprint})")
    except Exception as e:
        print(f"[WARN] ai_briefings 캐시 저장 실패: {e}")

    return briefing



def generate_nagame_tip(ticker_name: str, title: str, category: str, direction: str) -> str:
    # 주식 초보 나개미 페르소나를 위한 친절한 뉴닉 스타일 팁
    title_lower = title.lower()
    
    # 1. 공시 세부 키워드 가이드 대응 (무상증자, 유상증자, 단기차입 등)
    if "공시" in category or category == "공시":
        if "무상증자" in title:
            return f"💡 [초보 팁] '무상증자'는 주주들에게 주식을 공짜로 더 나눠주는 완전 대박 호재야! 회사 금간이 탄탄하다는 대표적인 좋은 신호이기도 해. 🎉"
        elif "유상증자" in title:
            return f"💡 [초보 팁] '유상증자'는 회사가 돈이 필요해서 새 주식을 찍어 주주에게 파는 거야. 내 주식의 가치가 다소 희석될 수 있어 단기적으로는 악재로 통해! 💸"
        elif "상장폐지" in title:
            return f"💡 [초보 팁] '상장폐지'는 주식이 거래소에서 쫓겨나는 무시무시한 악재야. 주식이 휴지조각이 될 수 있으니 빨리 투자금을 회수하는 걸 고민해야 해! 🚨"
        elif "단기차입" in title or "차입금" in title:
            return f"💡 [초보 팁] 회사가 다른 곳에서 급전을 빌렸다는 소식이야! 이자 갚을 돈이 늘어나서 일시적으로 재정이 쪼들릴 수 있는 조심스러운 신호야. 📉"
        else:
            return f"💡 [초보 팁] 회사 자본 구조가 바뀌는 공시야. 내 지분이나 가치가 영향받을 수 있으니 세부 소식을 눈여겨봐야 해! 👀"

    # 2. 일반 뉴스 카테고리 가이드 대응
    if direction == "부정":
        if category == "ESG":
            return f"💡 [초보 팁] {ticker_name}의 임원 사법리스크나 지배구조(G) 문제야. 회사 이미지가 나빠져 투자자 신뢰를 잃으면 주가 하락의 원인이 되기 쉬워! ⚡"
        elif category == "재무":
            return f"💡 [초보 팁] 실적 기대 이하로 나왔거나 손실이 났다는 슬픈 소식이야. 기초 체력이 둔화되고 있어서 당분간 하락 압력을 받을 수 있어! 📊"
        else:
            return f"💡 [초보 팁] 대외적인 나쁜 소식이 터졌대. 투자 심리가 꽁꽁 얼어붙을 수 있으니 무리해서 진입하기보다는 한 박자 쉬어가는 게 좋아! ❄️"
    else:
        if category == "산업":
            return f"💡 [초보 팁] 대규모 납품 계약을 맺거나 끝내주는 신기술을 발명했대! 회사 이익이 팍팍 늘어나서 주가를 띄우는 강력한 로켓이 될 거야! 🚀"
        elif category == "재무":
            return f"💡 [초보 팁] 영업이익 흑자나 자본 확대 소식이야! 탄탄한 지갑 상태는 어려운 시장 속에서도 주가를 지탱해 주는 든든한 방패 역할을 해줘. 🛡️"
        else:
            return f"💡 [초보 팁] 시장의 관심이 활짝 쏠릴 만한 기분 좋은 뉴스야! 주가 회복세를 알리는 신호탄이 될 수도 있어! ✨"

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
                prob_up=doc.get("prob_up", _NEUTRAL_PROB_UP),
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
    import re
    def parse_pub_date(pub_date_str: str) -> str:
        if not pub_date_str or not isinstance(pub_date_str, str):
            return "2026.07.24"
        try:
            match = re.search(r"(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})", pub_date_str)
            if match:
                day_str = match.group(1).zfill(2)
                month_str = match.group(2)
                year_str = match.group(3)
                
                months = {
                    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06",
                    "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
                }
                mon_num = months.get(month_str[:3], "07")
                return f"{year_str}.{mon_num}.{day_str}"
        except:
            pass
        return "2026.07.24"

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
                    "tip": tip_text,
                    "date": parse_pub_date(row_val.get("pub_date"))
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
                doc_date = str(row_val.get("date", "2026-07-21")).replace("-", ".")
                
                evidences.append({
                    "type": "공시",
                    "direction": "부정",
                    "category": cat_ko,
                    "title": disclosure_title,
                    "url": f"https://m.stock.naver.com/domestic/stock/{ticker}/disclosure",
                    "severity_score": severity,
                    "severity_emoji": emoji_str,
                    "tip": tip_text,
                    "date": doc_date
                })
        except Exception as e:
            print(f"Supp fetch error: {e}")

    # 2.5. 동적 AI 종합 진단 브리핑 생성 (수집된 esg_news_count를 고려)
    esg_news_count = sum(1 for e in evidences if e.get("type") in ["ESG", "산업"])
    try:
        collection = get_collection("daily_risk_score")
        doc = collection.find_one({"ticker": ticker}, sort=[("date", -1)])
        if doc:
            ai_brief = generate_ai_briefing(
                ticker_name=corp_name or ticker,
                ticker=ticker,
                prob_up=doc.get("prob_up", _NEUTRAL_PROB_UP),
                direction=doc.get("direction", "down"),
                confidence_tier=doc.get("confidence_tier", "medium"),
                esg_count=esg_news_count
            )
        else:
            ai_brief = generate_ai_briefing(
                ticker_name=corp_name or ticker,
                ticker=ticker,
                prob_up=_NEUTRAL_PROB_UP,
                direction="up",
                confidence_tier="medium",
                esg_count=esg_news_count
            )
    except Exception as e:
        print(f"Briefing gen error: {e}")

    # 3. 모델이 고려한 진짜 매크로/시장 피처 판단 영향도 역산분석
    macro_analysis = []
    try:
        price_col = get_collection("price_macro")
        latest_macro = price_col.find_one({"ticker": "KOSPI"}, sort=[("date", -1)])
        if not latest_macro:
            latest_macro = price_col.find_one({}, sort=[("date", -1)])
        
        usd_krw = 1380.0
        bond_3y = 3.5
        if latest_macro:
            usd_krw = float(latest_macro.get("usd_krw", 1380.0))
            bond_3y = float(latest_macro.get("bond_3y", 3.5))
        
        # 환율 매핑
        if usd_krw >= 1380.0:
            usd_status, usd_inf, usd_desc = "위험", "high", f"원/달러 환율이 {usd_krw:,.1f}원 선으로 지나치게 높아 외국인 수급 이탈 및 주가 하방 압박을 강하게 주고 있어."
        elif usd_krw >= 1340.0:
            usd_status, usd_inf, usd_desc = "주의", "medium", f"원/달러 환율이 {usd_krw:,.1f}원 선으로 고착되어 주식 시장 전반의 거래 활력을 다소 둔화시키는 중이야."
        else:
            usd_status, usd_inf, usd_desc = "안정", "low", f"원/달러 환율이 {usd_krw:,.1f}원 선으로 안정되어 자금 수급 측면에서 유리한 기류가 감지돼."

        # 금리 매핑
        if bond_3y >= 3.8:
            bond_status, bond_inf, bond_desc = "위험", "high", f"국고채 금리가 {bond_3y:.2f}%로 고금리 기조가 연장되어 기업의 단기 차입 이자 및 조달 비용 부담이 아주 큰 상태야."
        elif bond_3y >= 3.3:
            bond_status, bond_inf, bond_desc = "주의", "medium", f"국고채 금리가 {bond_3y:.2f}% 선에서 약간 높은 수준을 유지하고 있어 이자 비용을 줄이기에는 다소 무리인 보수적 장세야."
        else:
            bond_status, bond_inf, bond_desc = "안정", "low", f"국고채 금리가 {bond_3y:.2f}%로 연중 낮고 안정적인 범위에 있어 대출 및 금융 비용 관련 위협도가 뚝 낮아졌어."

        # 종목 고유 주가 변동성 역산 (하락 확률 연동)
        prob_down = 50
        try:
            score_col = get_collection("daily_risk_score")
            score_doc = score_col.find_one({"ticker": ticker}, sort=[("date", -1)])
            if score_doc:
                prob_down = int((1 - score_doc.get("prob_up", _NEUTRAL_PROB_UP)) * 100)
        except:
            pass

        if prob_down >= 60:
            vol_status, vol_inf, vol_desc = "과열", "high", f"종목의 최근 20거래일 가격 변동성이 극도로 과열되어, 개미의 우산 시세 판단 시스템이 투자 위험도가 매우 강하다고 판단했어."
        elif prob_down >= 40:
            vol_status, vol_inf, vol_desc = "보통", "medium", f"최근 시세 변동 범위가 안정적인 밴드 내에 들어있어 수급 쏠림이나 단기 급락 변동성 위협은 평이한 수준이야."
        else:
            vol_status, vol_inf, vol_desc = "안정", "low", f"변동폭이 매우 수축되어 장기 횡보하며 에너지를 고르고 있어 가격 꼬리 리스크 위협이 대폭 가라앉았어."

        # ESG 중대성 빈도 매핑
        esg_news_count = sum(1 for e in evidences if e.get("type") in ["ESG", "산업"])
        if esg_news_count >= 1:
            esg_status, esg_inf, esg_desc = "주의", "medium", f"최근 업종별 중대성(Materiality) 맵에 부합하는 리스크성 미디어 보도가 포착되어 사회·평판 위험 요소로 꼽혔어."
        else:
            esg_status, esg_inf, esg_desc = "안정", "low", f"최근 20거래일 동안 업종별 중대성(Materiality) 맵에 어긋나는 평판 리스크 관련 미디어 부정 보도가 전혀 탐지되지 않았어."

        macro_analysis = [
            { "name": "💵 원/달러 환율", "status": usd_status, "description": usd_desc, "influence": usd_inf },
            { "name": "📈 국고채 금리 (3Y)", "status": bond_status, "description": bond_desc, "influence": bond_inf },
            { "name": "📊 주가 변동 리스크", "status": vol_status, "description": vol_desc, "influence": vol_inf },
            { "name": "🌿 ESG 평판 중대성", "status": esg_status, "description": esg_desc, "influence": esg_inf }
        ]
    except Exception as e:
        print(f"Macro analysis generation failed: {e}")
        macro_analysis = [
            { "name": "💵 원/달러 환율", "status": "안정", "description": "원/달러 환율이 평이한 추세를 그려 대외 유동성 유출 우려는 낮은 편이야.", "influence": "low" },
            { "name": "📊 주가 변동 리스크", "status": "보통", "description": "시장 평균 변동폭을 보존하여 가격 과열 징후 리스크가 크지 않아.", "influence": "medium" }
        ]

    import os
    import requests
    from datetime import datetime, timedelta
    
    kis_key = (os.environ.get("KIS_APP_KEY") or os.environ.get("KIS_APPKEY") or "").strip()
    kis_secret = (os.environ.get("KIS_APP_SECRET") or os.environ.get("KIS_APPSECRET") or "").strip()

    # 4. 최근 7거래일 실제 주가(sparkline) 동적 수집/산출
    sparkline_data = []
    try:
        import FinanceDataReader as fdr
        from datetime import timedelta
        # 최신 15일치 일봉 가져와 종가 7개 취득
        df = fdr.DataReader(ticker, start=(datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d"))
        if not df.empty and "Close" in df.columns:
            sparkline_data = [int(x) for x in df["Close"].tail(7).tolist()]
    except Exception as e:
        print(f"FDR sparkline fetch failed: {e}")

    if not sparkline_data:
        # DB fallback
        try:
            price_col = get_collection("price_macro")
            docs = list(price_col.find({"ticker": ticker}).sort("date", -1).limit(7))
            if docs:
                docs.reverse()
                for d in docs:
                    price_val = d.get("close") or d.get("price")
                    if price_val:
                        sparkline_data.append(int(price_val))
        except Exception as e:
            print(f"DB sparkline query failed: {e}")

    if not sparkline_data:
        # 가상 변동 난수 흐름 빌드 fallback (현재가 50,000원 대리선)
        import random
        base_p = 50000
        try:
            price_col = get_collection("price_macro")
            latest_p = price_col.find_one({"ticker": ticker}, sort=[("date", -1)])
            if latest_p and (latest_p.get("close") or latest_p.get("price")):
                base_p = int(latest_p.get("close") or latest_p.get("price"))
        except:
            pass
        sparkline_data = []
        for _ in range(7):
            base_p = int(base_p * random.uniform(0.98, 1.02))
            sparkline_data.append(base_p)

    # 5. KIS 실시간 현재가 및 등락률 보강 조회
    current_price = None
    change_percent = 0.0
    if kis_key and kis_secret:
        try:
            access_token, domain = get_kis_access_token_and_domain()
            if access_token:
                price_url = f"{domain}/uapi/domestic-stock/v1/quotations/inquire-price"
                price_headers = {
                    "content-type": "application/json; charset=utf-8",
                    "authorization": f"Bearer {access_token}",
                    "appkey": kis_key,
                    "appsecret": kis_secret,
                    "tr_id": "FHKST01010100"
                }
                params = {
                    "FID_COND_MRKT_DIV_CODE": "J",
                    "FID_INPUT_ISCD": ticker.zfill(6)
                }
                res_p = requests.get(price_url, headers=price_headers, params=params, timeout=3)
                if res_p.status_code == 200:
                    output = res_p.json().get("output", {})
                    if output:
                        current_price = int(output.get("stck_prpr", 0))
                        change_percent = float(output.get("prdy_ctrt", 0.0))
        except Exception as e:
            print(f"[WARN] Detail page KIS fetch failed: {e}")

    # Fallback to DB
    if not current_price:
        try:
            price_col = get_collection("price_macro")
            doc_p = price_col.find_one({"ticker": ticker}, sort=[("date", -1)])
            if doc_p:
                current_price = int(doc_p.get("close") or doc_p.get("price") or 50000)
                change_percent = float(doc_p.get("log_return_1d", 0.0)) * 100
        except Exception as e:
            print(f"[WARN] Detail page DB price fetch failed: {e}")

    if not current_price:
        current_price = int(sparkline_data[-1]) if sparkline_data else 50000

    # 만약 sparkline의 마지막 값을 KIS 현재가로 덮어씌워 매끄럽게 동기화
    if sparkline_data and len(sparkline_data) > 0:
        sparkline_data[-1] = current_price

    return {
        "ticker": ticker, 
        "ai_briefing": ai_brief, 
        "evidences": evidences, 
        "macro_analysis": macro_analysis,
        "sparkline": sparkline_data,
        "current_price": current_price,
        "change_percent": change_percent
    }

@app.get("/api/alerts")
def get_alerts():
    import pandas as pd
    from pathlib import Path
    
    # ── 1. DB에서 사용자 알림 설정 조회 ──────────────────────────────────
    try:
        settings_col = get_collection("user_settings")
        cfg = settings_col.find_one({"ticker": "settings", "date": "alert_config"})
        categories = cfg.get("categories", {"price_risk": True, "esg_news": True, "disclosure": True}) if cfg else {"price_risk": True, "esg_news": True, "disclosure": True}
    except Exception as e:
        print(f"[WARN] Failed to load alert config for filtering alerts: {e}")
        categories = {"price_risk": True, "esg_news": True, "disclosure": True}

    def get_alert_category(title: str, news_category: str = None) -> str:
        title_lower = title.lower()
        if any(k in title_lower for k in ["공시", "사채", "증자", "발행", "결정", "보고서"]):
            return "disclosure"
        if news_category == "ESG" or any(k in title_lower for k in ["esg", "환경", "지배구조", "노사", "탄소", "상생"]):
            return "esg_news"
        return "price_risk"

    project_root = Path(__file__).resolve().parent.parent
    corp_map_path = project_root / "data" / "corp_code_map.csv"
    corp_dict = {}
    if corp_map_path.exists():
        try:
            corp_map = pd.read_csv(corp_map_path, dtype=str)
            for _, r in corp_map.iterrows():
                corp_dict[r["stock_code"]] = r["corp_name"]
        except:
            pass
            
    # ESG 뉴스 카테고리별 알림 제목 템플릿 (실제 기사 제목 미노출)
    CATEGORY_TITLE_MAP = {
        "환경": "ESG 환경(E) 미디어 이슈 포착",
        "사회": "ESG 사회(S) 미디어 이슈 포착",
        "지배구조": "ESG 지배구조(G) 미디어 이슈 포착",
        "노동": "ESG 노동·상생 이슈 포착",
        "탄소": "ESG 탄소배출 관련 이슈 포착",
    }

    alerts = []
    try:
        esg_col = get_collection("esg_events")
        # DB 레벨에서 긍정 뉴스 선필터 + 필요 필드만 projection으로 조회 (속도 개선)
        query = {"news_direction": {"$ne": "positive"}}
        projection = {"ticker": 1, "date": 1, "news_direction": 1, "is_material": 1, "news_category": 1, "_id": 0}
        docs = list(esg_col.find(query, projection, sort=[("date", -1)]).limit(15))

        for i, d in enumerate(docs):
            ticker = d.get("ticker", "005930")
            corp_name = corp_dict.get(ticker, ticker)

            is_mat = d.get("is_material", 0)
            direction = d.get("news_direction", "negative")

            level = "danger" if (is_mat == 1 and direction == "negative") else "caution"

            dt_str = d.get("date", "2026.07.24")
            news_category = d.get("news_category", "")

            # 실제 기사 제목 대신 카테고리 기반 범용 제목 사용
            generic_title = "ESG 미디어 이슈 포착"
            for keyword, label in CATEGORY_TITLE_MAP.items():
                if keyword in str(news_category):
                    generic_title = label
                    break

            # 카테고리 판별 및 백엔드 필터링
            cat = get_alert_category(generic_title, news_category)
            if not categories.get(cat, True):
                continue

            alerts.append({
                "id": len(alerts) + 1,
                "level": level,
                "ticker_code": ticker,
                "ticker": corp_name,
                "title": generic_title,
                "time": dt_str,
                "read": False,
                "category": cat
            })
    except Exception as e:
        print(f"[WARN] Alerts API failed: {e}")
        # fallback
        fallback_alerts = [
            { "id": 1, "level": "danger", "ticker_code": "051910", "ticker": "LG화학", "title": "교환사채 2,000억 규모 발행 공시", "time": "오늘 09:12", "read": False },
            { "id": 2, "level": "danger", "ticker_code": "005930", "ticker": "삼성전자", "title": "단기 설비 투자 차입금 증가 결정 공시", "time": "오늘 08:45", "read": False },
            { "id": 3, "level": "caution", "ticker_code": "005490", "ticker": "POSCO홀딩스", "title": "탄소 배출 규제 강화 관련 환경부 브리핑", "time": "어제 15:30", "read": True },
            { "id": 4, "level": "caution", "ticker_code": "068270", "ticker": "셀트리온", "title": "임상 3상 중간 결과 발표 지연 안내", "time": "어제 11:00", "read": True },
            { "id": 5, "level": "info", "ticker_code": "055550", "ticker": "신한지주", "title": "금리 방어선 유지 및 대출 포트폴리오 자산 성장세 지속", "time": "2일 전", "read": True }
        ]
        
        alerts = []
        for item in fallback_alerts:
            cat = get_alert_category(item["title"])
            if categories.get(cat, True):
                item["category"] = cat
                alerts.append(item)
        
    return alerts

@app.post("/api/weather-briefing")
def get_weather_briefing(body: dict):
    """
    포트폴리오 날씨 AI 판단 근거 — 날씨 상태/구성 변동 시에만 Gemini 호출, 캐시 활용.
    body: { portfolio_id, weather_status, weather_label, risky_tickers: [{name, direction}] }
    """
    import hashlib
    from datetime import datetime

    portfolio_id = body.get("portfolio_id", 0)
    weather_status = body.get("weather_status", "sunny")   # sunny/cloudy/rainy/thunder
    weather_label  = body.get("weather_label", "맑음")
    risky_tickers  = body.get("risky_tickers", [])         # [{"name":"삼성전자","direction":"down"}, ...]

    # ── 1. fingerprint 계산 ──────────────────────────────────────────
    risky_str = ",".join(sorted([f"{t['name']}:{t['direction']}" for t in risky_tickers]))
    fp_raw = f"weather|{portfolio_id}|{weather_status}|{risky_str}"
    fingerprint = hashlib.md5(fp_raw.encode()).hexdigest()[:12]

    cache_key = f"weather_{portfolio_id}"

    # ── 2. 캐시 조회 ────────────────────────────────────────────────
    # is_fallback=True 캐시(과거 Gemini 실패로 템플릿을 썼던 경우)는 히트로 치지 않고
    # 재시도한다 — 그래야 모델 설정을 고친 뒤 곧바로 실제 LLM 문구로 갱신된다.
    try:
        cache_col = get_collection("ai_briefings")
        cached = cache_col.find_one({"ticker": cache_key})
        if (cached and cached.get("fingerprint") == fingerprint
                and cached.get("briefing") and not cached.get("is_fallback")):
            print(f"[CACHE HIT] weather_briefing: portfolio={portfolio_id} (fp={fingerprint})")
            return {"summary": cached["briefing"].split("\n"), "cached": True}
    except Exception as e:
        print(f"[WARN] weather_briefing 캐시 조회 실패: {e}")

    # ── 3. 날씨별 fallback 멘트 ─────────────────────────────────────
    FALLBACK = {
        "thunder": [
            "⚡️ 포트폴리오 전반에 고위험 신호가 다수 감지됐어요! 지금은 신중하게 상황을 점검할 타이밍이에요.",
            "🔴 하락 방향 예측 종목들이 집중돼 있어서 단기 손실 위험이 높아요. 손절 기준선을 미리 확인해 두는 게 좋아요.",
            "🚨 고위험 종목 비중을 줄이거나 방어주로 일부 교체를 고려해 보세요!",
        ],
        "rainy": [
            "🌧️ 일부 종목에서 하락 리스크가 감지되고 있어요. 전체적으로 살짝 흐린 상황이에요.",
            "📉 약세 신호가 중간 수준이에요. 비중 조절과 현금 비중 확보를 고려해 볼 수 있어요.",
            "🌂 리밸런싱 전략을 점검하고 안정적인 종목 비중을 늘려보세요.",
        ],
        "cloudy": [
            "⛅ 포트폴리오 전반은 크게 문제없지만, 일부 종목에서 불확실성이 보여요.",
            "🟡 단기 하락 리스크 신호가 일부 있어요. 지켜보면서 대응하면 충분해요.",
            "📊 분산 구성을 유지하면서 위험 종목만 추가 점검해 보세요!",
        ],
        "sunny": [
            "☀️ 배당 우량주 중심 구성 덕분에 포트폴리오 전반이 안정적인 흐름을 유지하고 있어요! 🛡️",
            "📈 보유 종목들의 상승 신호가 고루 확인되고, ESG 평판 리스크도 낮아서 안심할 수 있는 구간이에요!",
            "💸 현재 위험 수준은 허용 범위 아래에 있어요. 원한다면 분산 투자를 더 늘려봐도 좋아요!",
        ],
    }
    fallback_lines = FALLBACK.get(weather_status, FALLBACK["sunny"])

    # ── 4. Gemini로 동적 브리핑 생성 ────────────────────────────────
    risky_desc = ", ".join([f"{t['name']}(하락)" for t in risky_tickers if t.get("direction") == "down"]) or "없음"
    prompt = f"""당신은 주식 초보자에게 친근하게 정보를 전달하는 '나개미' 캐릭터입니다.
뉴닉 스타일로 아래 포트폴리오 상황을 분석해서 AI 판단 근거를 3줄 bullet point로 작성해 주세요.

[포트폴리오 상황]
- 전체 날씨: {weather_label} ({weather_status})
- 하락 위험 종목: {risky_desc}

[작성 규칙]
- 각 줄을 이모지로 시작
- 초보자 눈높이의 쉬운 용어
- 날씨({weather_label})에 맞는 톤 (번개=긴급경고, 비=주의권고, 구름=중립, 맑음=안심)
- 각 줄은 완결된 한 문장
- 총 3줄만 출력, 다른 부가 설명 없이"""

    gemini_result = _call_gemini(prompt)
    used_fallback = False
    if gemini_result:
        summary_lines = [l.strip() for l in gemini_result.split("\n") if l.strip()][:3]
        if len(summary_lines) < 2:
            summary_lines = fallback_lines
            used_fallback = True
    else:
        summary_lines = fallback_lines
        used_fallback = True

    briefing_text = "\n".join(summary_lines)

    # ── 5. 캐싱 (폴백 여부도 함께 기록) ────────────────────────────────
    try:
        cache_col.update_one(
            {"ticker": cache_key},
            {"$set": {
                "ticker": cache_key,
                "fingerprint": fingerprint,
                "briefing": briefing_text,
                "is_fallback": used_fallback,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "updated_at": datetime.now().isoformat(),
            }},
            upsert=True
        )
        print(f"[CACHE SET] weather_briefing: portfolio={portfolio_id} (fp={fingerprint}, fallback={used_fallback})")
    except Exception as e:
        print(f"[WARN] weather_briefing 캐시 저장 실패: {e}")

    return {"summary": summary_lines, "cached": False}


@app.get("/api/kospi-index")

def get_kospi_index():
    import os
    import requests
    import json
    import FinanceDataReader as fdr
    from datetime import datetime, timedelta

    # 1. 기본 폴백값 (장마감 후 또는 API 실패 시 노출되는 대표값)
    current_price = 2768.42
    change = 18.52
    change_rate = 0.67
    is_up = True
    sparkline = [2710.0, 2732.5, 2715.9, 2748.2, 2755.1, 2758.2, 2768.42]

    # 2. FDR을 통해 최근 7거래일 일봉 종가 수집 및 전일대비 계산
    try:
        df = fdr.DataReader('KS11', start=(datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d"))
        if not df.empty and "Close" in df.columns:
            sparkline = [float(x) for x in df["Close"].tail(7).tolist()]
            current_price = float(df["Close"].iloc[-1])
            prev_close = float(df["Close"].iloc[-2]) if len(df) > 1 else current_price
            change = current_price - prev_close
            change_rate = (change / prev_close) * 100
            is_up = change >= 0
    except Exception as e:
        print(f"[WARN] FDR KOSPI fetch failed: {e}")

    # 3. KIS 실시간 API 조회가 가능하면 현재가를 실시간 호가 정보로 덮어씌움
    kis_key = (os.environ.get("KIS_APP_KEY") or os.environ.get("KIS_APPKEY") or "").strip()
    kis_secret = (os.environ.get("KIS_APP_SECRET") or os.environ.get("KIS_APPSECRET") or "").strip()
    
    if kis_key and kis_secret:
        try:
            access_token, domain = get_kis_access_token_and_domain()
            if access_token:
                price_url = f"{domain}/uapi/domestic-stock/v1/quotations/inquire-index-price"
                price_headers = {
                    "content-type": "application/json; charset=utf-8",
                    "authorization": f"Bearer {access_token}",
                    "appkey": kis_key,
                    "appsecret": kis_secret,
                    "tr_id": "FHPUP02100000"
                }
                params = {
                    "FID_COND_MRKT_DIV_CODE": "U",
                    "FID_INPUT_ISCD": "0001" # KOSPI 업종코드
                }
                res_p = requests.get(price_url, headers=price_headers, params=params, timeout=3)
                if res_p.status_code == 200:
                    output = res_p.json().get("output", {})
                    if output:
                        live_price = float(output.get("bstp_nmix_prpr", 0))
                        live_change = float(output.get("bstp_nmix_prdy_vrss", 0))
                        live_rate = float(output.get("bstp_nmix_prdy_ctrt", 0))
                        sign = output.get("bstp_nmix_prdy_vrss_sign", "1")
                        
                        if live_price > 0:
                            current_price = live_price
                            change = live_change
                            change_rate = live_rate
                            is_up = sign in ["1", "2", "3"]
                            if sparkline:
                                sparkline[-1] = current_price
        except Exception as e:
            print(f"[WARN] KIS KOSPI live fetch failed: {e}")

    return {
        "currentPrice": current_price,
        "change": change,
        "changeRate": change_rate,
        "isUp": is_up,
        "sparkline": sparkline
    }


@app.get("/api/settings/alert-config")
def get_alert_config():
    try:
        col = get_collection("user_settings")
        cfg = col.find_one({"ticker": "settings", "date": "alert_config"})
        if not cfg:
            return {
                "alert_times": ["07:00", "10:27"],
                "categories": {
                    "price_risk": True,
                    "esg_news": True,
                    "disclosure": True
                }
            }
        return {
            "alert_times": cfg.get("alert_times", ["07:00", "10:27"]),
            "categories": cfg.get("categories", {
                "price_risk": True,
                "esg_news": True,
                "disclosure": True
            })
        }
    except Exception as e:
        print(f"[ERROR] Failed to get alert config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/settings/alert-config")
def save_alert_config(body: dict):
    alert_times = body.get("alert_times", ["07:00", "10:27"])
    categories = body.get("categories", {
        "price_risk": True,
        "esg_news": True,
        "disclosure": True
    })
    
    try:
        col = get_collection("user_settings")
        col.update_one(
            {"ticker": "settings", "date": "alert_config"},
            {"$set": {
                "ticker": "settings",
                "date": "alert_config",
                "alert_times": alert_times,
                "categories": categories,
                "updated_at": datetime.now().isoformat()
            }},
            upsert=True
        )
        # 스케줄러 즉시 갱신
        reschedule_alert_jobs(alert_times)
        return {"success": True}
    except Exception as e:
        print(f"[ERROR] Failed to save alert config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

