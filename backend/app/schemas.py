from pydantic import BaseModel
from datetime import date as Date
from typing import Literal, Optional

# ① 뉴스 사건 피처 — B가 만드는 것
class NewsFeature(BaseModel):
    ticker: str
    date: Date
    news_related: bool
    news_direction: Literal["positive", "negative"]
    news_severity: float          # 0~1
    news_category: Literal["ESG", "실적·재무", "산업·사업동향", "문화·마케팅", "기타"]
    is_material: Literal[0, 1]
    confidence_score: float       # 0~1

# ② 보조 신호(자본이벤트/상장폐지) — A가 규칙 기반으로 만드는 것
class SupplementarySignal(BaseModel):
    ticker: str
    date: Date
    event_type: Literal["CAPITAL_EVENT", "DELISTING_RELATED"]
    disclosure_category: str

# ③ 가격·거시 피처 — A가 만드는 것
class PriceFeature(BaseModel):
    ticker: str
    date: Date
    log_return_1d: float
    volatility_20d: float
    volume_zscore: float
    beta_60d: float
    sector: str
    macro_rate: float
    macro_fx: float

# ④ ML 학습 데이터 행 — C가 위 세 개를 조인해서 만드는 것
class MLRow(BaseModel):
    ticker: str
    date: Date
    category_material_value: float
    category_immaterial_value: float
    capital_event_flag: Literal[0, 1]
    delisting_related_flag: Literal[0, 1]
    log_return_1d: float
    volatility_20d: float
    volume_zscore: float
    beta_60d: float
    macro_rate: float
    macro_fx: float
    label_direction_next_day: Optional[Literal[0, 1]] = None  # 학습용, 추론 시엔 없음

# ⑤ 모델 출력
class DailyRiskScore(BaseModel):
    ticker: str
    date: Date
    prob_up: float
    direction: Literal["up", "down"]
    confidence_tier: Literal["weak", "medium", "strong"]
    model_version: str