# backend/scripts/migrate_esg_events.py
import sys
from pathlib import Path
import re

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(PROJECT_ROOT / "backend"))

from app.db import get_collection

COMPANY_NAME_TO_CODE = {
    "삼성전자": "005930",
    "SK하이닉스": "000660",
    "NAVER": "035420",
    "카카오": "035720",
    "LG에너지솔루션": "373220",
    "삼성SDI": "006400",
    "에코프로": "086520",
    "에코프로비엠": "247540",
    "알테오젠": "196170",
    "POSCO홀딩스": "005490",
    "포스코홀딩스": "005490",
    "삼성생명": "032830",
    "KT&G": "033780",
    "KB금융": "105560",
    "현대차": "005380",
    "현대자동차": "005380",
    "셀트리온": "068270",
    "신한지주": "055550",
    "기아": "000270",
    "SK텔레콤": "017670",
    "S-Oil": "010950",
    "에스오일": "010950",
    "삼성물산": "028260",
    "LG화학": "051910",
    "LG": "003550",
    "엔씨소프트": "036570",
    "넷마블": "251270",
    "한국전력": "015760"
}

def main():
    print("[MIGRATION] MongoDB 'esg_events' 컬렉션 마이그레이션 시작...")
    collection = get_collection("esg_events")
    if collection is None:
        print("[ERROR] MongoDB 연결 실패")
        return
        
    cursor = collection.find({})
    migrated_count = 0
    deleted_invalid_count = 0
    
    for doc in cursor:
        ticker = doc.get("ticker")
        doc_id = doc.get("_id")
        
        # 만약 ticker가 한글명이거나, 올바른 6자리 숫자가 아니라면 변환 시도
        if ticker in COMPANY_NAME_TO_CODE:
            new_ticker = COMPANY_NAME_TO_CODE[ticker]
            print(f" -> 마이그레이션 대상 발견: _id={doc_id} | '{ticker}' -> '{new_ticker}'")
            
            # 기존 오염된 문서 제거 (동일 날짜/새 코드로 머지 혹은 교체하기 위함)
            # 만약 새로운 ticker 코드로 동일한 날짜의 문서가 이미 있을 수도 있으므로, 안전하게 update 또는 delete 후 신규 생성 처리
            collection.delete_one({"_id": doc_id})
            
            doc["ticker"] = new_ticker
            # _id 제거하여 중복 insert/upsert 시 충돌 방지
            doc.pop("_id", None)
            
            collection.update_one(
                {"ticker": new_ticker, "date": doc["date"]},
                {"$set": doc},
                upsert=True
            )
            migrated_count += 1
            
        elif ticker and not ticker.isdigit():
            # 숫자가 아예 아닌 유효하지 않은 도큐먼트는 삭제
            print(f" -> 유효하지 않은 ticker 포맷 삭제: _id={doc_id} | ticker='{ticker}'")
            collection.delete_one({"_id": doc_id})
            deleted_invalid_count += 1
            
    print(f"[MIGRATION] 완료! 변경 적용 {migrated_count}건, 잘못된 포맷 삭제 {deleted_invalid_count}건")

if __name__ == "__main__":
    main()
