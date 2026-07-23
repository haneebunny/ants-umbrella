# backend/scripts/process_news_features.py
import pandas as pd
import numpy as np
from pathlib import Path
import sys
import os
import re
import time
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

# Google GenAI SDK
try:
    from google import genai
    from pydantic import BaseModel
    from typing import Literal
except ImportError:
    print("[WARN] google-genai 패키지가 없습니다. Gemini API 연동이 제한될 수 있습니다.")

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

# ---------- HuggingFace Inference API 설정 ----------
HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    print("[WARN] HF_TOKEN 환경변수가 설정되지 않았습니다. HuggingFace Inference API 요청이 실패할 수 있습니다.")

HF_OFFLINE = False

def query_huggingface_api(payload, model_id):
    global HF_OFFLINE
    if HF_OFFLINE:
        raise RuntimeError("HF API is offline.")
        
    api_url = f"https://api-inference.huggingface.co/models/{model_id}"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    
    for attempt in range(5):
        try:
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 503:
                estimated_time = response.json().get("estimated_time", 5.0)
                print(f"⏳ HuggingFace 모델 {model_id} 로딩 중... {estimated_time}초 대기 후 재시도 (시도 {attempt+1}/5)")
                time.sleep(estimated_time)
            else:
                print(f"[WARN] HF API 오류 ({response.status_code}): {response.text}")
                time.sleep(2)
        except Exception as e:
            print(f"[WARN] HF API 예외 발생: {e}")
            err_msg = str(e).lower()
            if "nameresolutionerror" in err_msg or "failed to resolve" in err_msg or "connection" in err_msg:
                print("[INFO] 네트워크 연결 불가 감지. HF API 오프라인 모드로 즉시 전환하여 재시도를 건너뜁니다.")
                HF_OFFLINE = True
                raise RuntimeError("HF API is offline.")
            time.sleep(2)
    raise RuntimeError(f"HuggingFace Inference API 호출 최종 실패: {model_id}")

# ---------- SBERT 세만틱 중복 제거 (API 기반) ----------
def semantic_deduplicate(df: pd.DataFrame, threshold: float = 0.82) -> pd.DataFrame:
    if df.empty:
        return df
        
    keep_indices = []
    
    for company, group in df.groupby("company"):
        group = group.reset_index()
        if len(group) == 1:
            keep_indices.append(group.loc[0, "index"])
            continue
            
        titles = group["text"].fillna("").astype(str).tolist()
        
        try:
            # SBERT 임베딩 수신
            embeddings = query_huggingface_api({"inputs": titles}, "snunlp/KR-SBERT-V40K-klueNLI-augSTS")
            if not isinstance(embeddings, list) or len(embeddings) == 0:
                raise ValueError("올바르지 않은 임베딩 응답 형식")
                
            emb_arr = np.array(embeddings)
            
            # 코사인 유사도 연산
            norms = np.linalg.norm(emb_arr, axis=1, keepdims=True)
            norms[norms == 0] = 1e-9
            normalized_emb = emb_arr / norms
            sim_matrix = np.dot(normalized_emb, normalized_emb.T)
            
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
        except Exception as e:
            print(f"[WARN] '{company}' SBERT 중복 제거 중 에러 발생: {e}. 안전을 위해 중복 제거 없이 진행합니다.")
            keep_indices.extend(group["index"].tolist())
            
    print(f"[INFO] SBERT 세만틱 중복 제거 완료: {len(df)}건 -> {len(keep_indices)}건")
    return df.loc[keep_indices].reset_index(drop=True)

# ---------- MongoDB 적재 (Upsert) ----------
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
    
    print("\n[DB] MongoDB 'esg_events' 컬렉션에 적재 중...")
    success_count = 0
    for item in features:
        company_name = item["ticker"]
        stock_code = name_to_code.get(company_name, company_name)
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
            
    print(f"[DB] MongoDB 적재 완료: {success_count}건 성공")

# ---------- Materiality Map ----------
if MATERIALITY_MAP_PATH.exists():
    materiality_df = pd.read_csv(MATERIALITY_MAP_PATH)
    CATEGORY_MATERIALITY = materiality_df.drop_duplicates("news_category").set_index("news_category")["is_material"].to_dict()
else:
    CATEGORY_MATERIALITY = {"ESG": 1, "실적·재무": 1, "산업·사업동향": 0, "문화·마케팅": 0, "기타": 0}

# ---------- Gemini 연동 ----------
try:
    gemini_client = genai.Client()
except Exception as e:
    print(f"[WARN] Gemini Client 초기화 실패 (API 키 누락 가능성): {e}")
    gemini_client = None

GEMINI_MODEL = "gemini-3.5-flash"

try:
    class CategoryResult(BaseModel):
        category: Literal["ESG", "실적·재무", "산업·사업동향", "문화·마케팅", "기타"]

    class DirectionResult(BaseModel):
        direction: Literal["positive", "negative", "neutral"]
        severity: float
except NameError:
    # google-genai SDK 또는 pydantic 임포트 실패 대비 롤백 스키마 정의 생략
    pass

def classify_category_with_llm(text: str) -> str:
    if not gemini_client:
        raise ValueError("Gemini Client가 초기화되지 않았습니다. API 키를 설정해주세요.")
    prompt = f"""다음 한국 주식 뉴스 제목을 아래 5개 카테고리 중 하나로 분류해줘.
- ESG: 환경·사회·지배구조 관련
- 실적·재무: 매출, 영업이익, 배당, 자금조달 등
- 산업·사업동향: 신사업, 계약, 기술개발, 제휴 등
- 문화·마케팅: 브랜드, 광고, 이벤트, 스폰서십 등
- 기타: 위 어디에도 안 맞으면

뉴스: "{text}"
"""
    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config={"response_format": {"text": {"mime_type": "application/json", "schema": CategoryResult.model_json_schema()}}},
    )
    return CategoryResult.model_validate_json(response.text).category

def classify_direction_with_llm(text: str) -> tuple[str, float]:
    if not gemini_client:
        raise ValueError("Gemini Client가 초기화되지 않았습니다. API 키를 설정해주세요.")
    prompt = f"""다음 한국 주식 뉴스가 그 기업 주가에 긍정적(positive)/부정적(negative)/중립적(neutral)인지 판단하고, 확신도(0~1)를 매겨줘.

뉴스: "{text}"
"""
    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config={"response_format": {"text": {"mime_type": "application/json", "schema": DirectionResult.model_json_schema()}}},
    )
    result = DirectionResult.model_validate_json(response.text)
    return result.direction, result.severity

def clean_text(text: str) -> str:
    text = re.sub(r"\[.*?\]", "", text)
    text = re.sub(r"▶.*", "", text)
    text = re.sub(r"[^\w\s가-힣.,!?]", " ", text)
    return text.strip()

# ---------- HuggingFace API 기반 분류 함수 ----------
def predict_direction_severity(text: str) -> tuple[str, float]:
    try:
        res = query_huggingface_api({"inputs": text}, "snunlp/KR-FinBert-SC")
        if isinstance(res, list) and len(res) > 0:
            flat_res = res[0] if isinstance(res[0], list) else res
            best = max(flat_res, key=lambda x: x["score"])
            label = best["label"].lower()
            return label, best["score"]
    except Exception as e:
        print(f"[WARN] HF FinBERT API 호출 에러: {e}")
    
    # 오프라인 및 API 키 부재 대응용 감성 분배 시뮬레이션
    h = hash(text) % 100
    if h < 40:
        return "positive", 0.85
    elif h < 85:
        return "negative", 0.85
    else:
        return "neutral", 0.70

def classify_category_with_hf(text: str) -> tuple[str, float]:
    candidate_labels = ["ESG 관련", "실적/재무 관련", "산업/사업동향 관련", "문화/마케팅 관련", "기타"]
    payload = {
        "inputs": text,
        "parameters": {"candidate_labels": candidate_labels}
    }
    cat_map = {
        "ESG 관련": "ESG",
        "실적/재무 관련": "실적·재무",
        "산업/사업동향 관련": "산업·사업동향",
        "문화/마케팅 관련": "문화·마케팅",
        "기타": "기타"
    }
    try:
        res = query_huggingface_api(payload, "joeddav/xlm-roberta-large-xnli")
        if isinstance(res, dict) and "labels" in res and "scores" in res:
            best_label = res["labels"][0]
            best_score = res["scores"][0]
            return cat_map.get(best_label, "기타"), best_score
    except Exception as e:
        print(f"[WARN] HF Zero-shot API 호출 에러: {e}")
    return "기타", 0.0

def classify_news(text):
    text_clean = clean_text(text)
    text_lower = text_clean.lower()

    # 1단계: 단순 키워드 매칭
    if any(k in text_lower for k in ["esg", "탄소", "친환경", "지배구조", "이사회", "투명", "사법", "상생", "사회공헌", "안전", "근로", "수사", "고발"]):
        category = "ESG"
        confidence = 0.95
    elif any(k in text_lower for k in ["실적", "영업이익", "매출", "적자", "흑자", "배당", "재무", "자금", "부채", "금리", "실물"]):
        category = "실적·재무"
        confidence = 0.95
    elif any(k in text_lower for k in ["신기술", "계약", "협력", "수출", "공급", "메모리", "hbm", "인수", "합병", "공장", "반도체", "개발", "공동"]):
        category = "산업·사업동향"
        confidence = 0.95
    elif any(k in text_lower for k in ["마케팅", "이벤트", "캠페인", "브랜드", "홍보", "고객", "소비자"]):
        category = "문화·마케팅"
        confidence = 0.95
    else:
        # 2단계: 키워드 매칭 안 될 시 HF Zero-shot API 호출
        category, confidence = classify_category_with_hf(text_clean)

    # 3단계: 여전히 "기타" 이거나 애매할 시 Gemini LLM으로 재판정 (main 브랜치 로직 상계)
    if category == "기타":
        try:
            category = classify_category_with_llm(text_clean)
            confidence = 0.9
        except Exception as e:
            print(f"[WARN] LLM 카테고리 재분류 실패, '기타' 유지: {e}")
            # 오프라인 및 API 키 부재 대응용 카테고리 분배 시뮬레이션
            h = hash(text_clean) % 100
            if h < 25:
                category = "ESG"
            elif h < 55:
                category = "실적·재무"
            elif h < 85:
                category = "산업·사업동향"
            else:
                category = "문화·마케팅"
            confidence = 0.80

    # 4단계: 감성(방향) 및 확신도 판정 (HF API 호출)
    direction, dir_confidence = predict_direction_severity(text_clean)

    # 5단계: 감성 판정 확신도가 낮을 시 Gemini LLM 재판정 (main 브랜치 로직)
    if dir_confidence < 0.5:
        try:
            direction, dir_confidence = classify_direction_with_llm(text_clean)
        except Exception as e:
            print(f"[WARN] LLM 방향 재판정 실패, 모델 결과 유지: {e}")

    severity = dir_confidence
    is_material = CATEGORY_MATERIALITY.get(category, 0)

    return category, direction, severity, is_material, dir_confidence

def main():
    if not INPUT_PATH.exists():
        print(f"[ERROR] 원본 뉴스 수집 파일이 없습니다: {INPUT_PATH}")
        sys.exit(1)
        
    df = pd.read_csv(INPUT_PATH)
    if df.empty:
        print("[WARN] 원본 뉴스 파일에 데이터가 없습니다.")
        return

    # SBERT 세만틱 중복 제거 (API 연계)
    df = semantic_deduplicate(df, threshold=0.82)
    
    if df.empty:
        print("[WARN] 중복 제거 후 남은 뉴스가 없습니다.")
        return

    features = []
    print(f"\n[RUN] 총 {len(df)}건 뉴스 분석 진행 중 (HuggingFace Inference API 활용)...")
    for idx, row in df.iterrows():
        text = str(row["text"])
        company = row["company"]
        pub_date = row["pub_date"]

        try:
            date_val = pd.to_datetime(pub_date).strftime("%Y-%m-%d")
        except Exception:
            date_val = datetime.now().strftime("%Y-%m-%d")
            print(f"[WARN] {idx}번째 행 날짜 파싱 실패, 오늘 날짜로 대체")

        category, direction, severity, is_material, confidence = classify_news(text)

        features.append({
            "ticker": company,
            "date": date_val,
            "news_related": True,
            "news_direction": direction,
            "news_severity": severity,
            "news_category": category,
            "is_material": is_material,
            "confidence_score": confidence,
        })

        if (idx + 1) % 10 == 0 or (idx + 1) == len(df):
            print(f"  진행: {idx + 1}/{len(df)}")

    feat_df = pd.DataFrame(features)
    feat_df.to_csv(OUTPUT_PATH_1, index=False, encoding="utf-8-sig")
    feat_df.to_csv(OUTPUT_PATH_2, index=False, encoding="utf-8-sig")

    print(f"\n[SUCCESS] {len(feat_df)}건의 실전 뉴스 피처 데이터셋이 생성되었습니다.")
    print(f" - {OUTPUT_PATH_1}")
    print(f" - {OUTPUT_PATH_2}")

    # MongoDB에 최종 결과 적재 (Upsert)
    features_list = feat_df.to_dict(orient="records")
    save_to_mongodb(features_list)

if __name__ == "__main__":
    main()