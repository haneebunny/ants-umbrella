# backend/scripts/test_kis_api.py
import os
import requests
import json
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

KIS_APPKEY = (os.environ.get("KIS_APP_KEY") or os.environ.get("KIS_APPKEY") or "").strip()
KIS_APPSECRET = (os.environ.get("KIS_APP_SECRET") or os.environ.get("KIS_APPSECRET") or "").strip()

def get_kis_client():
    if not KIS_APPKEY or not KIS_APPSECRET:
        raise ValueError("❌ .env 파일에 KIS_APP_KEY 또는 KIS_APP_SECRET이 설정되지 않았습니다.")
    
    # 1. 실전투자 도메인 시도
    real_domain = "https://openapi.koreainvestment.com:9443"
    mock_domain = "https://openapivts.koreainvestment.com:29443"
    
    headers = {"content-type": "application/json"}
    body = {
        "grant_type": "client_credentials",
        "appkey": KIS_APPKEY,
        "appsecret": KIS_APPSECRET
    }
    
    # 먼저 실전투자 인증 시도
    res = requests.post(f"{real_domain}/oauth2/tokenP", headers=headers, data=json.dumps(body), timeout=5)
    if res.status_code == 200:
        return real_domain, res.json()["access_token"]
    
    # 만약 유효하지 않은 키 에러(EGW00103) 등이 나면 모의투자 도메인으로 자동 전환 시도
    res_json = res.json()
    if res_json.get("error_code") == "EGW00103" or "AppKey" in res_json.get("error_description", ""):
        print("💡 실전투자 키가 아님을 감지 -> 모의투자(VTS) 도메인으로 자동 전환 시도합니다.")
        res_mock = requests.post(f"{mock_domain}/oauth2/tokenP", headers=headers, data=json.dumps(body), timeout=5)
        if res_mock.status_code == 200:
            return mock_domain, res_mock.json()["access_token"]
            
    raise Exception(f"❌ 토큰 발급 실패 (실전/모의 키 확인 필요): {res.text}")

def get_current_price(ticker: str):
    try:
        domain, token = get_kis_client()
    except Exception as e:
        print(e)
        return None
        
    url = f"{domain}/uapi/domestic-stock/v1/quotations/inquire-price"
    headers = {
        "content-type": "application/json; charset=utf-8",
        "authorization": f"Bearer {token}",
        "appkey": KIS_APPKEY,
        "appsecret": KIS_APPSECRET,
        "tr_id": "FHKST01010100"
    }
    params = {
        "FID_COND_MRKT_DIV_CODE": "J",
        "FID_INPUT_ISCD": ticker
    }
    
    res = requests.get(url, headers=headers, params=params, timeout=5)
    if res.status_code == 200:
        data = res.json()
        if data.get("rt_cd") == "0":
            output = data.get("output", {})
            return {
                "price": int(output.get("stck_prpr", 0)),
                "change": int(output.get("prdy_vrss", 0)),
                "change_rate": float(output.get("prdy_ctrt", 0.0))
            }
        else:
            print(f"❌ KIS API 에러 응답: {data.get('msg1')}")
    else:
        print(f"❌ HTTP 요청 에러: {res.status_code}")
    return None

def main():
    print("⚡ 한국투자증권 실시간 현재가 API 테스트 가동")
    print(f"🔎 디버그 - 로드된 KIS_APP_KEY: '{KIS_APPKEY}' (길이: {len(KIS_APPKEY) if KIS_APPKEY else 0})")
    print(f"🔎 디버그 문자 아스키 코드: {[ord(c) for c in KIS_APPKEY]}")
    print(f"🔎 디버그 - 로드된 KIS_APP_SECRET: '{KIS_APPSECRET}' (길이: {len(KIS_APPSECRET) if KIS_APPSECRET else 0})")
    
    ticker = "005930"
    info = get_current_price(ticker)
    if info:
        print(f"\n✅ [성공] {ticker} 현재가 정보:")
        print(f" - 현재가: {info['price']:,} 원")
        print(f" - 전일대비: {info['change']:,} 원 ({info['change_rate']}% )")
    else:
        print("\n❌ 조회 실패 (환경 변수를 확인해 주세요)")

if __name__ == "__main__":
    main()
