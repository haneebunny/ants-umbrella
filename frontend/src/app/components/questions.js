// --- Core Questions Data (v0.2 Spec-compliant) ---
export const QUESTIONS = [
  {
    id: 1,
    phase: "1단계: 위험 감수 능력 진단",
    category: "투자 예정 기간",
    text: "현재 투자한 자금을 사용할 예정 시점은 언제인가요?",
    subtext: "가용 기간이 길수록 시장의 일시적인 파동을 극복할 가능성이 높아집니다.",
    icon: "clock",
    options: [
      {
        id: "H1",
        text: "1년 이내",
        explanation: "단기 유동성 자금으로 가까운 시일 내에 인출할 계획이 있습니다.",
        scoreWeight: 0
      },
      {
        id: "H2",
        text: "1년 이상 3년 이내",
        explanation: "중단기적인 포트폴리오 운용 후 현금화가 필요할 수 있습니다.",
        scoreWeight: 1
      },
      {
        id: "H3",
        text: "3년 이상 5년 이내",
        explanation: "중장기 자산 증식을 목표로 여유 있는 투자가 가능합니다.",
        scoreWeight: 2
      },
      {
        id: "H4",
        text: "5년 이상 10년 이내",
        explanation: "장기 복리 효과를 누릴 수 있으며, 변동성에 충분히 대처할 수 있습니다.",
        scoreWeight: 3
      },
      {
        id: "H5",
        text: "10년 이후 또는 사용 계획 없음",
        explanation: "시간적 제약 없이 초장기로 운영 가능한 자금입니다.",
        scoreWeight: 4
      }
    ]
  },
  {
    id: 2,
    phase: "2단계: 위험 감수 성향 진단",
    category: "투자 목표",
    text: "귀하가 투자를 통해 달성하고자 하는 주된 목표는 무엇인가요?",
    subtext: "목표 수익률이 높을수록 감내해야 하는 리스크도 커집니다.",
    icon: "target",
    options: [
      {
        id: "G1",
        text: "원금 손실을 최대한 피한다",
        explanation: "이익 성취보다 원금의 완전한 방어가 최우선 목적입니다.",
        scoreWeight: 0
      },
      {
        id: "G2",
        text: "예·적금보다 조금 높은 수익을 원한다",
        explanation: "인플레이션을 약간 방어하는 안정적인 성장을 추구합니다.",
        scoreWeight: 1
      },
      {
        id: "G3",
        text: "일정한 위험을 감수하고 안정적으로 늘린다",
        explanation: "시장 평균 수준의 적절한 성장과 위험 조화를 지향합니다.",
        scoreWeight: 2
      },
      {
        id: "G4",
        text: "높은 변동성을 감수하고 높은 수익을 추구한다",
        explanation: "장기 고성장을 위해 계좌의 상당한 변동성 노출을 감내합니다.",
        scoreWeight: 3
      },
      {
        id: "G5",
        text: "단기간에 큰 수익을 추구한다",
        explanation: "리스크가 극대화되더라도 단기 알파 수익률 달성을 목표로 삼습니다.",
        scoreWeight: 4
      }
    ]
  },
  {
    id: 3,
    phase: "2단계: 위험 감수 성향 진단",
    category: "최대 손실 감내도",
    text: "귀하가 투자를 진행하며 최악의 경우 감내할 수 있는 최대 손실 수준은 얼마인가요?",
    subtext: "실제 계좌가 해당 손실율을 기록할 때 버틸 수 있는 한계선입니다.",
    icon: "scale",
    options: [
      {
        id: "L1",
        text: "손실을 거의 감당하기 어렵다",
        explanation: "단 1%의 손실도 큰 스트레스이며 안정을 지키고 싶습니다.",
        scoreWeight: 0
      },
      {
        id: "L2",
        text: "약 5% 이내",
        explanation: "원금이 소폭 깎이더라도 철저히 하방을 제한하는 선을 원합니다.",
        scoreWeight: 1
      },
      {
        id: "L3",
        text: "약 10% 이내",
        explanation: "일시적인 하락 범위가 두 자릿수를 넘지 않는 완화된 손실 한도를 원합니다.",
        scoreWeight: 2
      },
      {
        id: "L4",
        text: "약 20% 이내",
        explanation: "중장기 회복을 신뢰하며 감당 가능한 합리적 변동 폭입니다.",
        scoreWeight: 3
      },
      {
        id: "L5",
        text: "30% 이상도 장기적으로 감당 가능",
        explanation: "대폭락장에서도 매도하지 않고 장기 복리 성장으로 극복할 준비가 되어 있습니다.",
        scoreWeight: 4
      }
    ]
  },
  {
    id: 4,
    phase: "2단계: 위험 감수 성향 진단",
    category: "시장 변동성 대응",
    text: "시장 전체가 20% 하락했지만 보유 기업의 전망에는 변화가 없을 때, 어떻게 행동하시겠습니까?",
    subtext: "심리적 회복탄력성과 실전 하락장에서의 예상 대응 행동입니다.",
    icon: "trendingUp",
    options: [
      {
        id: "D1",
        text: "전부 매도",
        explanation: "추가 손실 공포를 피하기 위해 전량 현금화하여 방어합니다.",
        scoreWeight: 0
      },
      {
        id: "D2",
        text: "대부분 매도",
        explanation: "위험 자산 비중을 최소한으로 줄여 추이를 관망합니다.",
        scoreWeight: 1
      },
      {
        id: "D3",
        text: "일부 매도 후 관찰",
        explanation: "포트폴리오의 리스크를 소폭 헷지하고 관찰합니다.",
        scoreWeight: 2
      },
      {
        id: "D4",
        text: "그대로 보유",
        explanation: "일시적 시세 파동에 동요하지 않고 기존 전략을 고수합니다.",
        scoreWeight: 3
      },
      {
        id: "D5",
        text: "추가 매수",
        explanation: "전망이 유효하므로 가치 대비 저렴해진 염가 매수 기회로 활용합니다.",
        scoreWeight: 4
      },
      {
        id: "D0",
        text: "잘 모르겠다",
        explanation: "실제 하락 상황을 겪어본 적이 없거나 판단을 유보합니다.",
        scoreWeight: null
      }
    ]
  },
  {
    id: 5,
    phase: "2단계: 위험 감수 성향 진단",
    category: "선호 자산 구조",
    text: "다음 중 귀하의 성향에 가장 잘 부합하는 금융 상품 선호 조합은 무엇인가요?",
    subtext: "상품 A(수익 약 3%, 손실 극소), 상품 B(큰 손실 가능성 및 큰 이익 가능성)",
    icon: "coins",
    options: [
      {
        id: "P1",
        text: "반드시 상품 A",
        explanation: "수수하더라도 원금을 온전히 보장하는 예적금식 구조를 취합니다.",
        scoreWeight: 0
      },
      {
        id: "P2",
        text: "상품 A를 선택할 가능성이 높음",
        explanation: "절대 다수의 안전 자산에 일부 성장 자산을 조미료 정도로만 더합니다.",
        scoreWeight: 1
      },
      {
        id: "P3",
        text: "두 상품을 비슷하게 선택",
        explanation: "자산의 절반 정도를 안전 자산과 주식 등으로 균형 있게 나눕니다.",
        scoreWeight: 2
      },
      {
        id: "P4",
        text: "상품 B를 선택할 가능성이 높음",
        explanation: "고성장을 위해 주식 및 성장형 펀드 위주로 자산을 집중 배분합니다.",
        scoreWeight: 3
      },
      {
        id: "P5",
        text: "반드시 상품 B",
        explanation: "레버리지나 암호화폐처럼 고위험 자산에 전천후 편입을 선호합니다.",
        scoreWeight: 4
      }
    ]
  },
  {
    id: 6,
    phase: "3단계: 금융 지식 및 경험 진단",
    category: "투자 경험",
    text: "과거에 변동성이 있는 자산(주식, 암호화폐, 펀드 등)에 투자해 본 총 기간은 어떻게 되나요?",
    subtext: "실전 시장에서의 참여 경험 및 연차 기준입니다. (성향 평가 점수에는 미산입)",
    icon: "award",
    options: [
      {
        id: "E1",
        text: "경험 없음",
        explanation: "은행 저축 상품 이외에 직접 투자 거래를 수행해 본 적이 없습니다.",
        scoreWeight: 0
      },
      {
        id: "E2",
        text: "1년 미만",
        explanation: "비교적 최근에 투자를 개시하여 시장 트렌드를 익히고 있습니다.",
        scoreWeight: 1
      },
      {
        id: "E3",
        text: "1년 이상 3년 미만",
        explanation: "몇 차례의 등락 사이클을 가볍게 겪으며 투자 원리를 파악했습니다.",
        scoreWeight: 2
      },
      {
        id: "E4",
        text: "3년 이상 5년 미만",
        explanation: "상승장과 조정 국면을 고루 관망하며 기업 분석 및 포트폴리오를 관리합니다.",
        scoreWeight: 3
      },
      {
        id: "E5",
        text: "5년 이상",
        explanation: "장기 투자자 혹은 풍부한 실전 매매 스킬을 정립하여 노련하게 대처합니다.",
        scoreWeight: 4
      }
    ]
  },
  {
    id: 7,
    phase: "1단계: 위험 감수 능력 진단",
    category: "비상 자금 여력",
    text: "갑작스러운 지출에 대비해 유동화할 수 있는 여유 비상자금은 어느 정도 규모인가요?",
    subtext: "비상자금이 두둑할수록 재무적 위험감수능력이 튼튼히 보강됩니다.",
    icon: "wallet",
    options: [
      {
        id: "C1",
        text: "거의 없음",
        explanation: "비상 출금 여력이 부족하여 예기치 못한 지출 시 투자를 중단해야 할 수 있습니다.",
        scoreWeight: 0
      },
      {
        id: "C2",
        text: "1개월 생활비 미만",
        explanation: "초단기 임시 대처만 가능한 수준의 극소수 예비 자금을 쥐고 있습니다.",
        scoreWeight: 1
      },
      {
        id: "C3",
        text: "1~3개월 생활비",
        explanation: "온화한 지출 소요에 대해서는 투자 계좌 훼손 없이 방어가 됩니다.",
        scoreWeight: 2
      },
      {
        id: "C4",
        text: "3~6개월 생활비",
        explanation: "안정적인 캐시 플로우 완충 지대를 설계해 재무 리스크를 통제합니다.",
        scoreWeight: 3
      },
      {
        id: "C5",
        text: "6개월 이상 생활비",
        explanation: "어떤 돌발 지출 위험에도 투자를 지속할 수 있는 막강한 유동성 보루가 있습니다.",
        scoreWeight: 4
      }
    ]
  },
  {
    id: 8,
    phase: "3단계: 금융 지식 및 경험 진단",
    category: "최근 3개월 거래 빈도",
    text: "최근 3개월간 평균적으로 주식이나 자산을 매매한 거래 빈도는 어느 정도인가요?",
    subtext: "거래 빈도가 잦을수록 활동적 매매자로 성격이 정의됩니다. (성향 평가 점수에는 미산입)",
    icon: "compass",
    options: [
      {
        id: "T1",
        text: "거래하지 않음",
        explanation: "거의 손대지 않고 기존 포지션을 장기 보관하고 있습니다.",
        scoreWeight: 0
      },
      {
        id: "T2",
        text: "월 1~2회",
        explanation: "필요 시 극히 제한적으로 월간 재배정(Rebalancing)만 가동합니다.",
        scoreWeight: 1
      },
      {
        id: "T3",
        text: "월 3~5회",
        explanation: "주 단위 혹은 주요 이슈 발생 시 기민하게 주문을 처리합니다.",
        scoreWeight: 2
      },
      {
        id: "T4",
        text: "월 6~10회",
        explanation: "시장 흐름에 맞추어 격일 혹은 주 수회 포지션 진입을 즐깁니다.",
        scoreWeight: 3
      },
      {
        id: "T5",
        text: "월 11회 이상",
        explanation: "스윙 트레이딩, 데일리 단기 매매로 시장 알파 수익을 주도적으로 사냥합니다.",
        scoreWeight: 4
      },
      {
        id: "T0",
        text: "잘 모르겠다",
        explanation: "정확한 매매 빈도를 집계하기 모호합니다.",
        scoreWeight: null
      }
    ]
  },
  {
    id: 9,
    phase: "3단계: 금융 지식 및 경험 진단",
    category: "최근 3개월 포트폴리오 구성 변경 정도",
    text: "최근 3개월 동안 포트폴리오 내 자산군들의 가중치 비중이 얼마나 바뀌었나요?",
    subtext: "보유 종목들의 전반적인 교체 폭과 활동성을 의미합니다. (성향 평가 점수에는 미산입)",
    icon: "barChart2",
    options: [
      {
        id: "R1",
        text: "거의 바뀌지 않음",
        explanation: "동일한 포트폴리오 구조를 그대로 고수하여 보존하고 있습니다.",
        scoreWeight: 0
      },
      {
        id: "R2",
        text: "25% 미만",
        explanation: "포트폴리오의 뼈대는 유지한 채 미세 조정 위주로 관리했습니다.",
        scoreWeight: 1
      },
      {
        id: "R3",
        text: "약 25~50%",
        explanation: "일부 섹터를 적극 청산하고 매력적인 신규 종목으로 교체했습니다.",
        scoreWeight: 2
      },
      {
        id: "R4",
        text: "약 50~75%",
        explanation: "절반 이상의 지분을 전술적으로 탈바꿈하여 변동성을 활용했습니다.",
        scoreWeight: 3
      },
      {
        id: "R5",
        text: "대부분 변경",
        explanation: "완전한 포트폴리오 리빌딩 및 물갈이로 전면 리셋을 수행했습니다.",
        scoreWeight: 4
      },
      {
        id: "R0",
        text: "잘 모르겠다",
        explanation: "포트폴리오 비중 변화의 정확한 폭을 가늠하기 어렵습니다.",
        scoreWeight: null
      }
    ]
  },
  {
    id: 10,
    phase: "PHASE 03: FINANCIAL KNOWLEDGE",
    category: "수익·손실 종목 처분 기준",
    text: "보유 중인 종목이 기대 수익을 달성하거나 반대로 손실을 볼 때 귀하가 내리는 결정 기준은 무엇인가요?",
    subtext: "행동적 처분 효과(Disposition Effect)를 진단하기 위한 질적 질문입니다. (성향 평가 점수에는 미산입)",
    icon: "scale",
    options: [
      {
        id: "S1",
        text: "수익 종목을 먼저 매도",
        explanation: "확보된 이익을 빠르게 정산하고 손실 종목은 회복 시까지 묻어둡니다.",
        scoreWeight: 0
      },
      {
        id: "S2",
        text: "손실 종목을 먼저 매도",
        explanation: "부진한 자산을 빠르게 잘라내어 기회비용을 절감하고 수익 종목을 극대화합니다.",
        scoreWeight: 0
      },
      {
        id: "S3",
        text: "기업 전망을 기준으로 결정",
        explanation: "가격 등락과 무관하게 내재 가치 훼손 여부를 정밀 판정하여 행동합니다.",
        scoreWeight: 0
      },
      {
        id: "S4",
        text: "손절선·목표수익률 기준",
        explanation: "사전에 기계적으로 세팅해 둔 퍼센트 수치 밴드에 걸리면 즉각 철회/실현합니다.",
        scoreWeight: 0
      },
      {
        id: "S5",
        text: "상황에 따라 결정",
        explanation: "그때그때 마켓 감정과 수급, 심리적 기분에 의존해 탄력적으로 조치합니다.",
        scoreWeight: 0
      },
      {
        id: "S0",
        text: "경험이 없거나 잘 모름",
        explanation: "아직 구체적인 익절/손절 매도 처분 원칙을 정립하지 못했습니다.",
        scoreWeight: 0
      }
    ]
  }
];

// --- Results Profiles Data (v0.2 Spec-compliant) ---
export const RESULT_PROFILES = {
  CONSERVATIVE: {
    category: 'CONSERVATIVE',
    titleKo: '안정형',
    titleEn: '원금 보존 지향형',
    precisionScore: 12.5,
    expectedReturn: '+3.2%',
    description: "원본 자금의 완벽한 보존을 최우선 목표로 삼는 보수적 투자 성향입니다. 인플레이션 방어 수준의 이자와 안정적 채권 흐름을 결합하여 자산 가치를 유지하는 데 집중합니다.",
    drawdownThreshold: '-3.0%',
    speculativeOverlay: '0.0%',
    riskCapacityPct: 15,
    liquidity: '충분',
    horizon: '1~2년',
    tradingFrequency: '연 1~2회 리밸런싱',
    avgHoldTime: '360일 이상',
    leverageUse: '사용하지 않음',
    assetClassFocus: ['현금성 자산', '국공채 및 단기채권'],
    marketResponse: "시장의 어떠한 단기 변동성에도 철저한 원금 안전을 선호하며 방어합니다.",
    assetAllocationDesc: "현금성 자산 및 국공채 비중이 90% 이상으로 극단적으로 치우친 저위험 자산 위주입니다.",
    keywords: "원금 보존, 유동성, 무위험 이자, 자산 유지",
    dimensions: {
      appetite: { value: 12, label: '매우 낮음', subtext: '변동성 수용 극도로 취약', bars: 1 },
      capacity: { value: 85, label: '매우 높음', subtext: '단기 유동성 가용성 압도적', bars: 4 },
      activity: { value: 10, label: '극히 비활성', subtext: '연간 극소수 포지션 재배치', bars: 1 }
    },
    assetWeights: [
      { category: '현금/CMA', weight: 65, color: '#69dbad' },
      { category: '국공채/채권', weight: 30, color: '#3eb489' },
      { category: '대형 우량주', weight: 5, color: '#d7ffc5' },
      { category: '대체 자산', weight: 0, color: '#30f802' }
    ]
  },
  MODERATE_CONSERVATIVE: {
    category: 'MODERATE_CONSERVATIVE',
    titleKo: '안정추구형',
    titleEn: '안정 성장 추구형',
    precisionScore: 35.8,
    expectedReturn: '+5.8%',
    description: "원금 손실 가능성은 최소화하되, 정기 예금보다는 조금 더 높은 이익 성장을 유도하려는 투자 성향입니다. 채권 혼합형 모델을 활용해 리스크가 온화하게 희석되도록 제어합니다.",
    drawdownThreshold: '-8.0%',
    speculativeOverlay: '2.5%',
    riskCapacityPct: 38,
    liquidity: '보통',
    horizon: '2~3년',
    tradingFrequency: '연 12회 내외',
    avgHoldTime: '120일 내외',
    leverageUse: '사용하지 않음',
    assetClassFocus: ['정부 국채', '배당 우량주'],
    marketResponse: "시장의 경미한 낙폭은 관망하나 심리적 하방 제한이 뚜렷합니다.",
    assetAllocationDesc: "채권 가중치가 지배적이며, 배당 성장주와 인덱스 펀드를 일부 결합하여 성장을 자극합니다.",
    keywords: "금리 상회, 배당 인컴, 저변동, 안정 성장",
    dimensions: {
      appetite: { value: 32, label: '보통 이하', subtext: '손실 한계가 제한적임', bars: 2 },
      capacity: { value: 70, label: '충분함', subtext: '여유 자금의 30%가 유연 대응 가능', bars: 3 },
      activity: { value: 30, label: '소극적 거래', subtext: '분기별 리밸런싱 및 배당 재투자', bars: 2 }
    },
    assetWeights: [
      { category: '현금/CMA', weight: 30, color: '#69dbad' },
      { category: '국공채/채권', weight: 45, color: '#3eb489' },
      { category: '대형 우량주', weight: 20, color: '#d7ffc5' },
      { category: '대체 자산', weight: 5, color: '#30f802' }
    ]
  },
  BALANCED: {
    category: 'BALANCED',
    titleKo: '위험중립형',
    titleEn: '균형 잡힌 자산배분형',
    precisionScore: 58.0,
    expectedReturn: '+8.5%',
    description: "수익성과 리스크의 황금율을 엄격하게 준수하는 중립적 투자 성향입니다. 채권과 글로벌 주식 자산 배분의 비중 조절을 통해 하락 저지력과 시세 차익 동력을 고루 갖춥니다.",
    drawdownThreshold: '-15.0%',
    speculativeOverlay: '5.0%',
    riskCapacityPct: 60,
    liquidity: '보통',
    horizon: '3~5년',
    tradingFrequency: '연 24회 내외',
    avgHoldTime: '45일 내외',
    leverageUse: '낮음',
    assetClassFocus: ['글로벌 ETF', '자산배분형 펀드'],
    marketResponse: "합리적인 기대수익 아래에서 마켓 조정 변동성을 객관적으로 수용합니다.",
    assetAllocationDesc: "전통적인 60/40 자산배분 모델에 기반하여 글로벌 지수와 중기 채권을 조합합니다.",
    keywords: "중립 포트폴리오, 인덱스 추종, 리스크 배분, 자산 성장",
    dimensions: {
      appetite: { value: 55, label: '적정 수준', subtext: '시장 평균 파도 감내 가능', bars: 2 },
      capacity: { value: 62, label: '양호함', subtext: '3~5년 이상의 중장기 복리 구조 확보', bars: 3 },
      activity: { value: 50, label: '주기적 활동', subtext: '월정액 적립식 또는 밴드 리밸런싱', bars: 2 }
    },
    assetWeights: [
      { category: '현금/CMA', weight: 15, color: '#69dbad' },
      { category: '국공채/채권', weight: 35, color: '#3eb489' },
      { category: '대형 우량주', weight: 45, color: '#d7ffc5' },
      { category: '대체 자산', weight: 5, color: '#30f802' }
    ]
  },
  GROWTH: {
    category: 'GROWTH',
    titleKo: '적극투자형',
    titleEn: '적극적 자산 성장주도형',
    precisionScore: 88.42,
    expectedReturn: '+12.4%',
    description: "변동성을 투자의 필연적인 동반자로 여기며 높은 리스크를 적극적으로 감수하는 성향입니다. 글로벌 하이테크 성장주와 암호화폐 영역까지 적극적으로 범위를 확장합니다.",
    drawdownThreshold: '-25.0%',
    speculativeOverlay: '15.0%',
    riskCapacityPct: 82,
    liquidity: '충분',
    horizon: '10년 이상',
    tradingFrequency: '연 40회 내외',
    avgHoldTime: '14일 내외',
    leverageUse: '보통',
    assetClassFocus: ['성장주 및 기술주', '디지털 자산'],
    marketResponse: "변동성을 감내하며 장기적 우상향과 기회 포착을 극대화합니다.",
    assetAllocationDesc: "글로벌 혁신 기업 및 디지털 자산 비중이 75% 이상 편입된 적극형 배분입니다.",
    keywords: "섹터 로테이션, 성장 촉진, 레버리지, 복리 극대화",
    dimensions: {
      appetite: { value: 88, label: '매우 높음', subtext: '심리적 변동성 수용력 탁월', bars: 3 },
      capacity: { value: 82, label: '최적화됨', subtext: '재무적 가용 주기 극도의 여유', bars: 3 },
      activity: { value: 75, label: '활발한 거래', subtext: '섹터 로테이션 및 모멘텀 트레이딩', bars: 4 }
    },
    assetWeights: [
      { category: '현금/CMA', weight: 5, color: '#69dbad' },
      { category: '국공채/채권', weight: 15, color: '#3eb489' },
      { category: '대형 우량주', weight: 65, color: '#d7ffc5' },
      { category: '대체 자산', weight: 15, color: '#30f802' }
    ]
  },
  AGGRESSIVE: {
    category: 'AGGRESSIVE',
    titleKo: '공격투자형',
    titleEn: '공격적 초고성장형',
    precisionScore: 98.15,
    expectedReturn: '+18.7%',
    description: "감내 가능한 리스크 한계가 거의 존재하지 않는 최고 수준의 공격 성향입니다. 단기적으로 극심한 원금 손실 가능성을 완전히 수용하고 오직 자본의 승수 성장에만 집중합니다.",
    drawdownThreshold: '-45.0%',
    speculativeOverlay: '35.0%',
    riskCapacityPct: 95,
    liquidity: '충분',
    horizon: '10년 이상',
    tradingFrequency: '연 120회 이상',
    avgHoldTime: '3일 내외',
    leverageUse: '높음',
    assetClassFocus: ['초고성장주', '파생상품 및 알트코인'],
    marketResponse: "조정 하락 국면을 대규모 저가 매수 및 역베팅 기회로 간주하며 즐깁니다.",
    assetAllocationDesc: "현금 및 안전자산을 최소화하고 순수 초성장주, 암호화폐, 레버리지 파생상품 위주로 적극 운용합니다.",
    keywords: "극대화된 알파, 레버리지 돌격, 초변동성 매집, 마켓 오버런",
    dimensions: {
      appetite: { value: 98, label: '극강 리스크', subtext: '위험 노출을 직접 전략화하여 사냥', bars: 4 },
      capacity: { value: 92, label: '방어력 충만', subtext: '인적 자본 및 현금 흐름 동력 막강함', bars: 4 },
      activity: { value: 95, label: '극도 민첩', subtext: '데일리 스윙 및 마진 타이트 리밸런싱', bars: 4 }
    },
    assetWeights: [
      { category: '현금/CMA', weight: 2, color: '#69dbad' },
      { category: '국공채/채권', weight: 5, color: '#3eb489' },
      { category: '대형 우량주', weight: 53, color: '#d7ffc5' },
      { category: '대체 자산', weight: 40, color: '#30f802' }
    ]
  }
};

export function calculateRiskProfile(answers) {
  // answers: { 1: "H3", 2: "G2", ... }
  // Helper to extract score from code (e.g. "H3" -> 3 -> 2 points, "D0" -> null)
  const getScore = (code) => {
    if (!code) return null;
    if (code.endsWith('0')) return null; // D0, T0, R0, S0
    const num = parseInt(code.substring(1), 10);
    return num - 1; // 1-indexed code to 0-indexed score (0~4)
  };

  const q1 = getScore(answers[1]);
  const q2 = getScore(answers[2]);
  const q3 = getScore(answers[3]);
  const q4 = getScore(answers[4]);
  const q5 = getScore(answers[5]);
  const q6 = getScore(answers[6]);
  const q7 = getScore(answers[7]);
  const q8 = getScore(answers[8]);
  const q9 = getScore(answers[9]);
  
  // Q10 Style Map
  const q10StyleMap = {
    'S1': 'PROFIT_TAKING',
    'S2': 'LOSS_CUTTING',
    'S3': 'INFORMATION_BASED',
    'S4': 'RULE_BASED',
    'S5': 'SITUATIONAL',
    'S0': 'UNKNOWN'
  };
  const dispositionStyle = q10StyleMap[answers[10]] || 'UNKNOWN';

  // 4.1 위험감수성향 (Q2, Q3, Q4, Q5)
  const willingnessScores = [q2, q3, q4, q5].filter(v => v !== null);
  const willingnessAvg = willingnessScores.length > 0 
    ? willingnessScores.reduce((a, b) => a + b, 0) / willingnessScores.length 
    : 0;
  const riskWillingnessScore = (willingnessAvg / 4) * 100;

  // 4.2 위험감수능력 (Q1, Q7)
  const capacityScores = [q1, q7].filter(v => v !== null);
  const capacityAvg = capacityScores.length > 0 
    ? capacityScores.reduce((a, b) => a + b, 0) / capacityScores.length 
    : 0;
  const riskCapacityScore = (capacityAvg / 4) * 100;

  // 4.3 목표 위험 점수 (Raw)
  const targetRiskScoreRaw = riskWillingnessScore * 0.6 + riskCapacityScore * 0.4;

  // 4.3 상한 안전장치 적용
  let targetRiskScoreAdjusted = targetRiskScoreRaw;
  const flags = [];
  
  // 조건 1: 투자기간 1년 이내 (Q1이 H1인 경우) -> 최대 MODERATE_CONSERVATIVE (40)
  if (answers[1] === 'H1') {
    targetRiskScoreAdjusted = Math.min(targetRiskScoreAdjusted, 40);
    flags.push('SHORT_TERM_LIMIT');
  }

  // 조건 2: 비상자금 거의 없음 (Q7이 C1인 경우) -> 최대 MODERATE_CONSERVATIVE (40)
  if (answers[7] === 'C1') {
    targetRiskScoreAdjusted = Math.min(targetRiskScoreAdjusted, 40);
    flags.push('LOW_EMERGENCY_FUND_LIMIT');
  }

  // 조건 3: 위험성향 유효 응답 3개 미만 -> 결과 보류
  if (willingnessScores.length < 3) {
    flags.push('INSUFFICIENT_WILLINGNESS_RESPONSES');
  }

  // Q2의 G5는 short_term_high_return_flag 추가
  if (answers[2] === 'G5') {
    flags.push('SHORT_TERM_HIGH_RETURN_FLAG');
  }

  // 모순 응답 플래그 (inconsistent_answer_flag)
  const isLowLossTolerance = answers[3] === 'L1' || answers[3] === 'L2';
  const isAggressiveAction = answers[4] === 'D5';
  if (isLowLossTolerance && isAggressiveAction) {
    flags.push('INCONSISTENT_ANSWER_FLAG');
  }

  // 4.4 위험등급
  let targetRiskBand = 'BALANCED';
  if (targetRiskScoreAdjusted <= 20) {
    targetRiskBand = 'CONSERVATIVE';
  } else if (targetRiskScoreAdjusted <= 40) {
    targetRiskBand = 'MODERATE_CONSERVATIVE';
  } else if (targetRiskScoreAdjusted <= 60) {
    targetRiskBand = 'BALANCED';
  } else if (targetRiskScoreAdjusted <= 80) {
    targetRiskBand = 'GROWTH';
  } else {
    targetRiskBand = 'AGGRESSIVE';
  }

  // 4.5 자기보고 매매활동성 (Q8, Q9)
  const activityScores = [q8, q9].filter(v => v !== null);
  const activityAvg = activityScores.length > 0
    ? activityScores.reduce((a, b) => a + b, 0) / activityScores.length
    : 0;
  const selfReportedActivityScore = (activityAvg / 4) * 100;

  let activityBand = 'GENERAL_MANAGEMENT';
  if (selfReportedActivityScore <= 20) {
    activityBand = 'LOW_TURNOVER';
  } else if (selfReportedActivityScore <= 50) {
    activityBand = 'GENERAL_MANAGEMENT';
  } else if (selfReportedActivityScore <= 75) {
    activityBand = 'ACTIVE_TRADING';
  } else {
    activityBand = 'HIGH_TURNOVER';
  }

  // 4.6 응답 신뢰도
  const coreQuestions = [1, 2, 3, 4, 5, 7];
  const coreValidCount = coreQuestions.filter(qId => {
    const val = answers[qId];
    return val !== null && val !== undefined && !val.endsWith('0');
  }).length;
  const confidenceScore = coreValidCount / coreQuestions.length;

  // L1~L5 값을 수치로 변환
  const lossToleranceMap = {
    'L1': 0.01,
    'L2': 0.05,
    'L3': 0.10,
    'L4': 0.20,
    'L5': 0.30
  };
  const maximumLossTolerance = lossToleranceMap[answers[3]] || 0.0;

  const baseProfile = RESULT_PROFILES[targetRiskBand];

  return {
    ...baseProfile,
    risk_willingness_score: Number(riskWillingnessScore.toFixed(2)),
    risk_capacity_score: Number(riskCapacityScore.toFixed(2)),
    target_risk_score_raw: Number(targetRiskScoreRaw.toFixed(2)),
    target_risk_score_adjusted: Number(targetRiskScoreAdjusted.toFixed(2)),
    target_risk_band: targetRiskBand,
    maximum_loss_tolerance: maximumLossTolerance,
    investment_horizon_code: answers[1],
    experience_level: q6 !== null ? q6 : 0,
    self_reported_activity_score: Number(selfReportedActivityScore.toFixed(2)),
    activity_band: activityBand,
    disposition_style: dispositionStyle,
    confidence_score: Number(confidenceScore.toFixed(2)),
    flags: flags
  };
}
