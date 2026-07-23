# backend/scripts/process_news_features.py
import pandas as pd
import numpy as np
from pathlib import Path
import sys
import os
import re
from datetime import datetime
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from sentence_transformers import SentenceTransformer, util

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(PROJECT_ROOT / "backend"))

INPUT_PATH = PROJECT_ROOT / "data" / "raw_news_collected.csv"
OUTPUT_PATH_1 = PROJECT_ROOT / "data" / "news_features_dummy.csv"
OUTPUT_PATH_2 = PROJECT_ROOT / "data" / "news_features_day2.csv"
MATERIALITY_MAP_PATH = PROJECT_ROOT / "data" / "reference" / "materiality_map.csv"

# 16개 포트폴리오 기업 이름을 SASB 11대 업종군으로 바로 연결하는 딕셔너리
COMPANY_TO_SASB = {
    '삼성전자': 'Technology & Communications',
    'SK하이닉스': 'Technology & Communications',
    'LG에너지솔루션': 'Extractives & Minerals Processing',
    '현대차': 'Transportation',
    '기아': 'Transportation',
    'POSCO홀딩스': 'Resource Transformation',
    '카카오': 'Technology & Communications',
    'NAVER': 'Technology & Communications',
    '셀트리온': 'Health Care',
    '신한지주': 'Financials',
    'LG화학': 'Resource Transformation',
    '삼성물산': 'Services',
    'SK텔레콤': 'Technology & Communications',
    'S-Oil': 'Extractives & Minerals Processing',
    'KT&G': 'Food & Beverage',
    '삼성생명': 'Financials',
    'KB금융': 'Financials'
}

def semantic_deduplicate(df: pd.DataFrame, sbert_model, threshold: float = 0.82) -> pd.DataFrame:
    """
    각 기업(company)별로 SBERT 문장 임베딩과 코사인 유사도를 연산하여,
    설정한 threshold(유사도 기준) 이상의 중복 이벤트를 제거합니다.
    """
    if df.empty:
        return df
        
    keep_indices = []
    
    for company, group in df.groupby("company"):
        group = group.reset_index()
        if len(group) == 1:
            keep_indices.append(group.loc[0, "index"])
            continue
            
        titles = group["text"].fillna("").astype(str).tolist()
        
        # 문장을 임베딩 벡터로 변환
        embeddings = sbert_model.encode(titles, convert_to_tensor=True)
        
        # 코사인 유사도 매트릭스 계산
        sim_matrix = util.cos_sim(embeddings, embeddings).cpu().numpy()
        
        selected_in_group = []
        for i in range(len(group)):
            is_duplicate = False
            for j in selected_in_group:
                if sim_matrix[i, j] >= threshold:
                    is_duplicate = True
                    break
            if not is_duplicate:
                selected_in_group.append(i)
                keep_indices.append(group.loc[i, "index"])
                
    print(f"✂️ SBERT 세만틱 중복 제거 완료: {len(df)}건 -> {len(keep_indices)}건")
    return df.loc[keep_indices].reset_index(drop=True)

def save_to_mongodb(features):
    from app.db import get_collection
    
    corp_map_path = PROJECT_ROOT / "data" / "corp_code_map.csv"
    if not corp_map_path.exists():
        print(f"[WARN] corp_code_map.csv가 존재하지 않아 MongoDB 적재를 건너뜁니다.")
        return
        
    try:
        corp_map = pd.read_csv(corp_map_path, dtype=str)
        name_to_code = dict(zip(corp_map["corp_name"], corp_map["stock_code"]))
    except Exception as e:
        print(f"[WARN] corp_code_map.csv 로드 실패 ({e}). MongoDB 적재를 건너뜁니다.")
        return
        
    collection = get_collection("esg_events")
    
    print("\n📤 MongoDB 'esg_events' 컬렉션에 적재 중...")
    success_count = 0
    for item in features:
        company_name = item["ticker"]
        stock_code = name_to_code.get(company_name, company_name)
        # 단일 문자열 종목코드 정규화
        match = re.search(r"\d+", str(stock_code))
        if match:
            stock_code = match.group(0).zfill(6)
        else:
            stock_code = str(stock_code)
            
        doc = {
            "ticker": stock_code,
            "date": item["date"],
            "news_related": True,
            "news_direction": item["news_direction"],
            "news_severity": item["news_severity"],
            "news_category": item["news_category"],
            "is_material": item["is_material"],
            "confidence_score": item["confidence_score"]
        }
        
        try:
            collection.update_one(
                {"ticker": stock_code, "date": item["date"]},
                {"$set": doc},
                upsert=True
            )
            success_count += 1
        except Exception as e:
            print(f"  [오류] {stock_code} - {item['date']} 저장 실패: {e}")
            
    print(f"✅ MongoDB 적재 완료: {success_count}건 성공")

def main():
    if not INPUT_PATH.exists():
        print(f"[ERROR] 원본 뉴스 수집 파일이 없습니다: {INPUT_PATH}")
        sys.exit(1)
        
    df = pd.read_csv(INPUT_PATH)
    if df.empty:
        print("[WARN] 원본 뉴스 파일에 데이터가 없습니다.")
        return

    # 1. 디바이스 감지 (GPU 사용 가능 시 CUDA/MPS 자동 매핑)
    if torch.cuda.is_available():
        device_id = 0
        print("💡 GPU (CUDA) 가속을 사용하여 딥러닝 연산을 수행합니다.")
    elif torch.backends.mps.is_available():
        device_id = "mps"
        print("💡 GPU (Apple Silicon MPS) 가속을 사용하여 딥러닝 연산을 수행합니다.")
    else:
        device_id = -1
        print("💡 CPU 기반으로 딥러닝 연산을 수행합니다.")

    # 2. 딥러닝 모델 통합 로드
    print("📥 SBERT 문장 임베딩 모델 로딩 중...")
    sbert_model = SentenceTransformer("snunlp/KR-SBERT-V40K-klueNLI-augSTS", device=device_id)

    # 3. SBERT 세만틱 중복 기사 제거 먼저 적용하여 downstream 연산량 감축
    df = semantic_deduplicate(df, sbert_model, threshold=0.82)
    
    if df.empty:
        print("[WARN] 중복 제거 후 남은 뉴스가 없습니다.")
        return

    print("📥 FinBERT 감성 분류 모델 로딩 중...")
    sentiment_model_name = "snunlp/KR-FinBert-SC"
    sentiment_tokenizer = AutoTokenizer.from_pretrained(sentiment_model_name)
    sentiment_model = AutoModelForSequenceClassification.from_pretrained(sentiment_model_name)
    
    # MPS의 경우 pipeline에 직접 전달 시 호환성을 위해 디바이스 문자열 설정
    pipe_device = device_id
    sentiment_pipe = pipeline(
        "text-classification",
        model=sentiment_model,
        tokenizer=sentiment_tokenizer,
        device=pipe_device,
        truncation=True,
        max_length=512,
    )

    print("📥 XLM-RoBERTa Zero-shot 카테고리 분류 모델 로딩 중...")
    category_pipe = pipeline(
        "zero-shot-classification",
        model="joeddav/xlm-roberta-large-xnli",
        device=pipe_device,
    )

    # 4. 감성 분석 수행 (Batch 처리)
    print("🧠 뉴스 감성 분석(FinBERT) 수행 중...")
    texts = df["text"].fillna("").astype(str).tolist()
    sentiment_results = []
    
    # 16개 배치 처리
    batch_size = 16
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        outputs = sentiment_pipe(batch)
        sentiment_results.extend(outputs)
        
    label_map = {
        "negative": "negative",
        "neutral": "neutral",
        "positive": "positive"
    }
    df["news_direction"] = [label_map.get(r["label"], r["label"]) for r in sentiment_results]
    df["news_severity"] = [r["score"] for r in sentiment_results]

    # 5. 카테고리 판정 (Zero-shot Batch 처리)
    print("🧠 뉴스 카테고리 태깅(Zero-shot) 수행 중...")
    candidate_labels = [
        "ESG 관련",
        "실적/재무 관련",
        "산업/사업동향 관련",
        "문화/마케팅 관련",
        "기타",
    ]
    cat_map = {
        "ESG 관련": "ESG",
        "실적/재무 관련": "실적·재무",
        "산업/사업동향 관련": "산업·사업동향",
        "문화/마케팅 관련": "문화·마케팅",
        "기타": "기타",
    }
    
    categories = []
    confidences = []
    batch_size_cat = 8
    
    for i in range(0, len(texts), batch_size_cat):
        batch = texts[i:i+batch_size_cat]
        outputs = category_pipe(batch, candidate_labels)
        if isinstance(outputs, dict):
            outputs = [outputs]
        for out in outputs:
            categories.append(out["labels"][0])
            confidences.append(out["scores"][0])
            
    df["news_category"] = [cat_map[c] for c in categories]
    df["confidence_score"] = confidences

    # 6. SASB 중요도 매핑 및 is_material 결정
    print("📋 SASB Materiality Map 매핑 중...")
    if not MATERIALITY_MAP_PATH.exists():
        print(f"[WARN] materiality_map.csv 파일이 {MATERIALITY_MAP_PATH}에 존재하지 않습니다. 수동 생성합니다.")
        df["is_material"] = df["news_category"].apply(lambda c: 1 if c in ("ESG", "실적·재무") else 0)
    else:
        materiality_map = pd.read_csv(MATERIALITY_MAP_PATH)
        df["sasb_sector"] = df["company"].map(COMPANY_TO_SASB)
        
        # Merge materiality mapping
        df = df.merge(
            materiality_map,
            on=["sasb_sector", "news_category"],
            how="left"
        )
        df["is_material"] = df["is_material"].fillna(0).astype(int)

    # 7. 날짜 파싱 정리
    dates = []
    for pub_date in df["pub_date"]:
        try:
            date_val = pd.to_datetime(pub_date).strftime("%Y-%m-%d %H:%M:%S %z")
        except:
            try:
                date_val = pd.to_datetime(pub_date).strftime("%Y-%m-%d")
            except:
                date_val = datetime.now().strftime("%Y-%m-%d")
        dates.append(date_val)
    df["date"] = dates

    # 컬럼 표준화
    df["title"] = df["text"]
    df["ticker"] = df["company"]

    # 출력 CSV 컬럼 필터링 및 저장
    output_cols = ["ticker", "date", "title", "news_direction", "news_severity", "news_category", "is_material", "confidence_score"]
    output_cols = [c for c in output_cols if c in df.columns]
    
    feat_df = df[output_cols]
    
    # 2가지 경로로 동시 저장
    feat_df.to_csv(OUTPUT_PATH_1, index=False, encoding="utf-8-sig")
    feat_df.to_csv(OUTPUT_PATH_2, index=False, encoding="utf-8-sig")
    
    print(f"\n[SUCCESS] {len(feat_df)}건의 최종 실전 뉴스 피처 데이터셋이 생성되었습니다.")
    print(f" - {OUTPUT_PATH_1}")
    print(f" - {OUTPUT_PATH_2}")

    # 8. MongoDB에 최종 결과 적재 (Upsert)
    features_list = feat_df.to_dict(orient="records")
    save_to_mongodb(features_list)

if __name__ == "__main__":
    main()
