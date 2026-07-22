# backend/scripts/process_news_features.py
import os
import pandas as pd
from pathlib import Path
import sys
import re
from datetime import datetime
import pickle
from dotenv import load_dotenv

load_dotenv()

import torch
from transformers import AutoTokenizer, AutoModel
from google import genai
from pydantic import BaseModel
from typing import Literal

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
INPUT_PATH = PROJECT_ROOT / "data" / "raw_news_collected.csv"
OUTPUT_PATH_1 = PROJECT_ROOT / "data" / "news_features_dummy.csv"
OUTPUT_PATH_2 = PROJECT_ROOT / "data" / "news_features_day2.csv"

MODEL_DIR = PROJECT_ROOT / "backend" / "models"
MATERIALITY_MAP_PATH = PROJECT_ROOT / "data" / "reference" / "materiality_map.csv"

# ---------- AI 모델 불러오기 ----------
print("[준비] AI 모델 불러오는 중...")

tokenizer = AutoTokenizer.from_pretrained("snunlp/KR-FinBert")
backbone = AutoModel.from_pretrained("snunlp/KR-FinBert")
state_dict = torch.load(MODEL_DIR / "weights.pt", map_location="cpu", weights_only=False)
stripped = {(k[len("bert."):] if k.startswith("bert.") else k): v for k, v in state_dict.items()}
backbone.load_state_dict(stripped, strict=False)
backbone.eval()

with open(MODEL_DIR / "classfier_head.pkl", "rb") as f:
    head_bundle = pickle.load(f)
classifier_head = head_bundle["classifier"]
id2label = head_bundle["id2label"]
classifier_head.eval()
LABELS = [id2label[i] for i in range(len(id2label))]

print("[준비] AI 모델 불러오기 완료")

# ---------- Materiality Map 불러오기 ----------
materiality_df = pd.read_csv(MATERIALITY_MAP_PATH)
CATEGORY_MATERIALITY = materiality_df.drop_duplicates("news_category").set_index("news_category")["is_material"].to_dict()

# ---------- Gemini (애매한 것만 재판정용) ----------
try:
    gemini_client = genai.Client()
except Exception as e:
    print(f"[WARN] Gemini Client 초기화 실패 (API 키 누락 가능성): {e}")
    gemini_client = None

GEMINI_MODEL = "gemini-3.5-flash"

class CategoryResult(BaseModel):
    category: Literal["ESG", "실적·재무", "산업·사업동향", "문화·마케팅", "기타"]

class DirectionResult(BaseModel):
    direction: Literal["positive", "negative", "neutral"]
    severity: float

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

@torch.no_grad()
def predict_direction_severity(text: str):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    cls_emb = backbone(**inputs).last_hidden_state[:, 0, :]
    probs = torch.softmax(classifier_head(cls_emb), dim=-1)[0]
    idx = probs.argmax().item()
    return LABELS[idx], probs[idx].item()

def classify_news(text):
    text_clean = clean_text(text)
    text_lower = text_clean.lower()

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

    if category == "기타":
        try:
            category = classify_category_with_llm(text_clean)
        except Exception as e:
            print(f"[WARN] LLM 카테고리 재분류 실패, '기타' 유지: {e}")

    direction, confidence = predict_direction_severity(text_clean)

    if confidence < 0.5:
        try:
            direction, confidence = classify_direction_with_llm(text_clean)
        except Exception as e:
            print(f"[WARN] LLM 방향 재판정 실패, 모델 결과 유지: {e}")

    severity = confidence
    is_material = CATEGORY_MATERIALITY.get(category, 0)

    return category, direction, severity, is_material, confidence

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

        if idx % 20 == 0:
            print(f"  진행: {idx}/{len(df)}")

    feat_df = pd.DataFrame(features)
    feat_df.to_csv(OUTPUT_PATH_1, index=False, encoding="utf-8-sig")
    feat_df.to_csv(OUTPUT_PATH_2, index=False, encoding="utf-8-sig")

    print(f"\n[SUCCESS] {len(feat_df)}건의 실전 뉴스 피처 데이터셋이 재생성되었습니다.")
    print(f" - {OUTPUT_PATH_1}")
    print(f" - {OUTPUT_PATH_2}")

if __name__ == "__main__":
    main()