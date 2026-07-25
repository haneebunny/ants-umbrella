import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from dotenv import load_dotenv

from .db import get_collection

# 환경 변수 로드
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
dotenv_path = PROJECT_ROOT / "backend" / ".env"
if not dotenv_path.exists():
    dotenv_path = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# 성향별 기본 개미 캐릭터 타이틀 맵핑
CHARACTER_MAP = {
    "CONSERVATIVE": "든든한 방패 개미 🛡️",
    "MODERATE_CONSERVATIVE": "신중한 파수꾼 개미 🦉",
    "BALANCED": "지혜로운 균형 개미 ⚖️",
    "GROWTH": "용감한 항해 개미 ⛵",
    "AGGRESSIVE": "불꽃 개척 개미 🔥",
}

def generate_reason_with_llm(ticker: str, stock_name: str, risk_band: str, tag: str) -> str:
    """
    LLM (Anthropic API 등)을 호출하여 특정 종목 및 성향에 맞는 
    '쉽고 톡톡 튀는 뉴닉(NEWNEEK) 대화체 말투' 추천 이유를 1회 자동 생성합니다.
    """
    char_name = CHARACTER_MAP.get(risk_band, "스마트 개미")
    
    if ANTHROPIC_API_KEY:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
            prompt = f"""
너는 개인 투자자를 돕는 톡톡 튀고 쉬운 시사 매거진 '뉴닉(NEWNEEK)' 캐릭터 고슴이 스타일의 금융 AI 에이전트야.
다음 종목을 [{char_name}] 성향 투자자에게 추천하는 이유를 뉴닉 말투(~라구!, ~이야!, ~했어!, ~해보자구!)로 2문장 이내로 아주 쉽게 설명해줘.

종목명: {stock_name} ({ticker})
특징태그: {tag}
투자자 성향: {risk_band} ({char_name})

반드시 뉴닉 캐릭터 이모지와 함께 대화체로 흥미롭고 쉽게 작성해줘. 이외의 인삿말은 생략하고 텍스트만 출력해줘.
"""
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )
            llm_text = response.content[0].text.strip()
            print(f"[LLM SUCCESS] Generated NEWNEEK reason for {stock_name} ({ticker}): {llm_text}")
            return llm_text
        except Exception as e:
            print(f"[LLM FALLBACK] Anthropic API 호출 실패 ({e}). 백엔드 뉴닉 템플릿으로 생성합니다.")

    # LLM API 키가 없거나 호출 실패 시의 템플릿 폴백 (뉴닉 대화체)
    fallback_templates = {
        "005930": f"메모리 반도체 수급 반등이랑 글로벌 AI 빅테크 대표 대장주라 포트폴리오의 든든한 기둥이 되어준다구! 💻",
        "000660": f"차세대 AI 메모리 HBM 시장 독점력으로 고성장 파도를 씽씽 타고 있어서 {char_name} 성향에 딱이라구! 🚀",
        "005380": f"글로벌 완성차 실적도 좋고 자사주 소각 밸류업 모멘텀으로 탄탄한 방어선과 주주환원을 동시에 챙겨줘 🚗",
        "105560": f"탄탄한 이자이익에 혜자로운 주주환원 분기 배당까지 챙겨주는 대표 배당 효자주라 계좌가 든든해져 💰",
        "032830": f"안정적인 재무구조랑 지배구조 방어력이 뛰어나서 시장 출렁임에도 하방을 든든하게 딱 잡아준다구! 🛡️",
        "373220": f"차세대 배터리 상용화랑 북미 공급망 확장 모멘텀으로 고성장 알파 슛을 쏠 수 있어! 🔋",
        "005490": f"전통 철강 산업 안정성에 친환경 리튬 이차전지 소재 다각화까지 다 잡은 무지개 종목이야 ⚙️",
        "035420": f"생성형 AI 플랫폼이랑 디지털 커머스 생태계로 매달 쏠쏠한 현금흐름을 만드는 IT 대표 주자라구 🌐",
    }
    
    return fallback_templates.get(
        ticker,
        f"{stock_name} 종목은 {tag} 모멘텀과 탄탄한 기업 체력으로 {char_name} 성향 투자자에게 추천할 만한 든든한 종목이라구! ✨"
    )


def get_or_create_recommendation_reason(ticker: str, stock_name: str, risk_band: str, tag: str = "#우량주") -> Dict[str, Any]:
    """
    [Cache First Strategy]
    1. DB/로컬 캐시(recommendation_reasons)에서 (ticker, risk_band)를 우선 검색.
    2. 존재하면 LLM을 호출하지 않고 0ms초 만에 즉시 기존 캐시된 해설 반환.
    3. 존재하지 않으면 LLM을 1회 호출해 생성 후 DB/로컬 캐시에 저장(upsert) 후 반환.
    """
    col = get_collection("recommendation_reasons")
    
    # 1. DB / 로컬 캐시 조회
    cached_doc = col.find_one({"ticker": ticker, "risk_band": risk_band})
    if cached_doc and "reason" in cached_doc:
        print(f"[CACHE HIT] {stock_name}({ticker}) [{risk_band}] 기존 캐시된 뉴닉 해설 반환 (LLM 미호출)")
        return {
            "ticker": ticker,
            "stock_name": stock_name,
            "risk_band": risk_band,
            "reason": cached_doc["reason"],
            "source": "cache", # 캐시 재활용 표시
            "cached_at": cached_doc.get("updated_at", "2026-07-25")
        }

    # 2. 캐시 없으면 LLM 호출해 생성
    print(f"[CACHE MISS] {stock_name}({ticker}) [{risk_band}] 캐시 없음. LLM 1회 호출 생성 시작...")
    generated_reason = generate_reason_with_llm(ticker, stock_name, risk_band, tag)

    # 3. DB / 로컬 파일 캐시에 영구 적재 (upsert)
    record = {
        "ticker": ticker,
        "stock_name": stock_name,
        "risk_band": risk_band,
        "reason": generated_reason,
        "tag": tag,
        "updated_at": "2026-07-25T16:35:00"
    }
    col.update_one(
        {"ticker": ticker, "risk_band": risk_band},
        {"$set": record},
        upsert=True
    )
    print(f"[CACHE SAVED] {stock_name}({ticker}) [{risk_band}] 생성 결과를 DB/로컬 캐시에 영구 재활용 목적으로 저장했습니다!")

    return {
        "ticker": ticker,
        "stock_name": stock_name,
        "risk_band": risk_band,
        "reason": generated_reason,
        "source": "llm_generated_and_cached",
        "cached_at": record["updated_at"]
    }
