# backend/scripts/process_news_features.py
import pandas as pd
from pathlib import Path
import sys
from datetime import datetime

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
INPUT_PATH = PROJECT_ROOT / "data" / "raw_news_collected.csv"
OUTPUT_PATH_1 = PROJECT_ROOT / "data" / "news_features_dummy.csv"
OUTPUT_PATH_2 = PROJECT_ROOT / "data" / "news_features_day2.csv"

def classify_news(text):
    text_lower = text.lower()
    
    # 1. 카테고리 태깅
    if any(k in text_lower for k in ["esg", "탄소", "친환경", "지배구조", "이사회", "투명", "사법", "상생", "사회공헌", "안전", "근로", "수사", "고발"]):
        category = "ESG"
    elif any(k in text_lower for k in ["실적", "영업이익", "매출", "적자", "흑자", "배당", "재무", "자금", "부채", "금리", "실물"]):
        category = "실적·재무"
    elif any(k in text_lower for k in ["신기술", "계약", "협력", "수출", "공급", "메모리", "hbm", "인수", "합병", "공장", "반도체", "개발", "공동"]):
        category = "산업·사업동향"
    elif any(k in text_lower for k in ["마케팅", "이벤트", "캠페인", "브랜드", "홍보", "고객", "소비자"]):
        category = "문화·마케팅"
    else:
        category = "기타"
        
    # 2. 리스크 방향성 태깅
    if any(k in text_lower for k in ["하락", "감소", "적자", "우려", "리스크", "폐지", "혐의", "기소", "논란", "갈등", "부담", "소송", "조사"]):
        direction = "negative"
        severity = 0.8
    elif any(k in text_lower for k in ["상승", "증가", "호조", "최고", "공급", "계약", "개발", "최초", "체결", "달성"]):
        direction = "positive"
        severity = 0.75
    else:
        direction = "positive"
        severity = 0.55
        
    return category, direction, severity

def main():
    if not INPUT_PATH.exists():
        print(f"[ERROR] 원본 뉴스 수집 파일이 없습니다: {INPUT_PATH}")
        sys.exit(1)
        
    df = pd.read_csv(INPUT_PATH)
    
    features = []
    for idx, row in df.iterrows():
        text = str(row["text"])
        company = row["company"]
        pub_date = row["pub_date"]
        
        try:
            # 네이버 pubDate 포맷 파싱
            date_val = pd.to_datetime(pub_date).strftime("%Y-%m-%d")
        except:
            date_val = datetime.now().strftime("%Y-%m-%d")
            
        category, direction, severity = classify_news(text)
        
        features.append({
            "ticker": company,  # 한글 명칭은 join_features에서 종목코드로 치환됨
            "date": date_val,
            "news_related": True,
            "news_direction": direction,
            "news_severity": severity,
            "news_category": category,
            "is_material": 1,  # 룰 판정
            "confidence_score": 0.85
        })
        
    feat_df = pd.DataFrame(features)
    
    # 2가지 경로로 동시 저장하여 스키마 정합성 보장
    feat_df.to_csv(OUTPUT_PATH_1, index=False, encoding="utf-8-sig")
    feat_df.to_csv(OUTPUT_PATH_2, index=False, encoding="utf-8-sig")
    
    print(f"[SUCCESS] {len(feat_df)}건의 실전 뉴스 피처 데이터셋이 재생성되었습니다.")
    print(f" - {OUTPUT_PATH_1}")
    print(f" - {OUTPUT_PATH_2}")

if __name__ == "__main__":
    main()
