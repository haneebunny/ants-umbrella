/**
 * mockData.js
 * 홈 대시보드 위젯용 데모 Mock 데이터
 *
 * ─ WeatherStatus: 'sunny' | 'cloudy' | 'rainy' | 'thunder'
 */

// ─────────────────────────────────────────────────────────────────
// 코스닥 미니 지수 (공통 — 포트폴리오 무관)
// ─────────────────────────────────────────────────────────────────
export const kosdaqIndex = {
  currentPrice: 2768.42,
  change: 18.52,
  changeRate: 0.67,
  isUp: true,
  sparkline: [2710.0, 2732.5, 2715.9, 2748.2, 2755.1, 2758.2, 2768.42],
};

// ─────────────────────────────────────────────────────────────────
// 3가지 포트폴리오 예시 데이터
// ─────────────────────────────────────────────────────────────────
export const PORTFOLIO_PRESETS = [
  // ── 1번: 안정추구형 (4,000만 원) ─────────────────────────────
  {
    id: 1,
    label: '안정추구형',
    totalLabel: '4,000만 원',
    emoji: '🛡️',
    overallWeather: {
      status: 'sunny',
      label: '맑음',
      summary: [
        '배당 우량주 중심 구성 덕분에 포트폴리오 전반이 편안하고 안정적인 흐름을 유지하고 있어요! 🛡️',
        '신한지주와 SK텔레콤의 배당 공시가 긍정적이고, POSCO홀딩스는 철강 수요가 살아나면서 수혜를 톡톡히 입을 것으로 기대된답니다! 📈',
        '지금 포트폴리오의 위험 수준은 허용 범위 아주 아래쪽에 있어서, 원한다면 분산 투자를 더 든든하게 늘려봐도 좋아요! 💸',
      ],
      updatedAt: '2026-07-22T09:00:00+09:00',
    },
    riskRadar: { userRiskTolerance: 35, currentPortfolioRisk: 22, status: 'safe', label: '안전' },
    assetSummary: {
      totalAsset: 40000000,
      riskAssetRatio: 38,
      holdings: [
        { ticker: '055550', name: '신한지주',   weight: 16, color: '#3eb489' },
        { ticker: '017670', name: 'SK텔레콤',  weight: 15, color: '#69dbad' },
        { ticker: '005490', name: 'POSCO홀딩스',weight: 14, color: '#2d966e' },
        { ticker: '010950', name: 'S-Oil',      weight: 13, color: '#a8edcc' },
        { ticker: '028260', name: '삼성물산',   weight: 14, color: '#1a7a52' },
        { ticker: '000270', name: '기아',       weight: 14, color: '#b2f0d8' },
        { ticker: '068270', name: '셀트리온',   weight: 14, color: '#52c49b' },
      ],
    },
    stockWeatherList: [
      { ticker: '055550', name: '신한지주',    weight: 16, weather: 'sunny',  change:  1.0, direction: 'up',   detail: { sector: '금융', esgScore: 82, reason: '배당 공시 신호 긍정적, 영업이익 개선 예상 지속' } },
      { ticker: '017670', name: 'SK텔레콤',   weight: 15, weather: 'sunny',  change:  0.8, direction: 'up',   detail: { sector: '통신', esgScore: 79, reason: '5G 가입자 증가세 유지, 확정 배당 가능성 높음' } },
      { ticker: '005490', name: 'POSCO홀딩스', weight: 14, weather: 'cloudy', change: -0.4, direction: 'down', detail: { sector: '철강', esgScore: 65, reason: '중국 철강 수요 둔화와 환율 영향으로 단기 불확실성' } },
      { ticker: '010950', name: 'S-Oil',       weight: 13, weather: 'rainy',  change: -0.3, direction: 'down', detail: { sector: '에너지', esgScore: 71, reason: '정제마진 하락 및 유가 변동성 확대로 단기 리스크 상승' } },
      { ticker: '028260', name: '삼성물산',    weight: 14, weather: 'sunny',  change:  0.1, direction: 'up',   detail: { sector: '건설/유통', esgScore: 77, reason: '해외 건설 수주잔고 증가, ESG 지수 양호' } },
      { ticker: '000270', name: '기아',         weight: 14, weather: 'sunny',  change:  0.2, direction: 'up',   detail: { sector: '자동차', esgScore: 74, reason: '전기차 JV 확대 소식 긍정적, 수출 회복세' } },
      { ticker: '068270', name: '셀트리온',    weight: 14, weather: 'cloudy', change: -0.2, direction: 'down', detail: { sector: '헬스케어', esgScore: 68, reason: '임상 데이터 승인 지연, 단기 실적 불확실성' } },
    ],
    radarScores: {
      sectorDiv:    82,  // 업종 다각화
      stockSpread:  78,  // 종목 분산도
      volatilityFit:88,  // 변동성 적합도
      capStability: 90,  // 시가총액 안정성
      esgRisk:      75,  // ESG 리스크 (높을수록 안전)
    },
    profile: {
      label: '안정추구형', description: '원금을 든든하게 지키는 걸 가장 중요하게 생각하는 보수적인 투자 성향이에요! 🛡️',
      color: '#3eb489', target_risk_band: 'CONSERVATIVE',
    },
  },

  // ── 2번: 성장·테크형 (1,500만 원) ────────────────────────────
  {
    id: 2,
    label: '성장·테크형',
    totalLabel: '1,500만 원',
    emoji: '🚀',
    overallWeather: {
      status: 'cloudy',
      label: '구름',
      summary: [
        'SK하이닉스의 HBM4 수주 소식으로 반도체 훈풍이 불고 있지만, 단기적인 흔들림은 있을 수 있어요! 💻',
        '카카오 경영진 이슈와 LG화학의 교환사채 발행 소식이 포트폴리오에 먹구름을 뿌리고 있어요. ☁️',
        '성장주인 만큼 단기 조정이 올 수 있으니 살짝 긴장하면서 지켜봐요! 🚀',
      ],
      updatedAt: '2026-07-22T09:00:00+09:00',
    },
    riskRadar: { userRiskTolerance: 70, currentPortfolioRisk: 58, status: 'caution', label: '주의' },
    assetSummary: {
      totalAsset: 15000000,
      riskAssetRatio: 82,
      holdings: [
        { ticker: '000660', name: 'SK하이닉스', weight: 22, color: '#6366f1' },
        { ticker: '035720', name: '카카오',     weight: 18, color: '#818cf8' },
        { ticker: '051910', name: 'LG화학',     weight: 16, color: '#a5b4fc' },
        { ticker: '003550', name: 'LG',         weight: 15, color: '#4f46e5' },
        { ticker: '036570', name: 'NC소프트',   weight: 15, color: '#c7d2fe' },
        { ticker: '251270', name: '넷마블',     weight: 14, color: '#e0e7ff' },
      ],
    },
    stockWeatherList: [
      { ticker: '000660', name: 'SK하이닉스', weight: 22, weather: 'sunny',   change:  1.8, direction: 'up',   detail: { sector: '반도체', esgScore: 72, reason: 'HBM4 수주 확대 및 AI 반도체 수요 급증 수혜' } },
      { ticker: '035720', name: '카카오',     weight: 18, weather: 'thunder', change: -1.2, direction: 'down', detail: { sector: 'IT/플랫폼', esgScore: 44, reason: '주요 임원 법적 리스크 지속, 광고 매출 등락' } },
      { ticker: '051910', name: 'LG화학',     weight: 16, weather: 'cloudy',  change: -0.7, direction: 'down', detail: { sector: '화학', esgScore: 58, reason: '배터리 소재 단가 하락, 교환사채 발행 부담' } },
      { ticker: '003550', name: 'LG',         weight: 15, weather: 'cloudy',  change:  0.3, direction: 'up',   detail: { sector: '지주사', esgScore: 63, reason: '자회사 실적 혼조세, 단기 시세 오름세' } },
      { ticker: '036570', name: 'NC소프트',   weight: 15, weather: 'rainy',   change: -0.9, direction: 'down', detail: { sector: '게임', esgScore: 51, reason: '신작 게임 출시 지연, 이용자 이탈 가속화' } },
      { ticker: '251270', name: '넷마블',     weight: 14, weather: 'cloudy',  change: -0.4, direction: 'down', detail: { sector: '게임', esgScore: 55, reason: '신작 게임 지연 및 마케팅 비용 과다 이슈' } },
    ],
    radarScores: {
      sectorDiv:    55,  // IT/게임 편중
      stockSpread:  48,  // SK하이닉스 높은 비중
      volatilityFit:62,  // 성장형에 맞는 편
      capStability: 70,  // 대형주 중심이지만 일부 변동
      esgRisk:      50,  // 카카오 경영진 리스크
    },
    profile: {
      label: '성장추구형', description: '더 높은 수익을 얻기 위해서라면 짜릿한 변동성도 기꺼이 감수하는 성장 투자 성향이에요! 🚀',
      color: '#6366f1', target_risk_band: 'AGGRESSIVE',
    },
  },

  // ── 3번: SASB 다각화형 (800만 원) ────────────────────────────
  {
    id: 3,
    label: 'SASB 다각화형',
    totalLabel: '800만 원',
    emoji: '🌿',
    overallWeather: {
      status: 'rainy',
      label: '비',
      summary: [
        'ESG와 SASB 기준 포트폴리오에서 일부 종목의 평판 리스크가 감지되었어요! 🌿',
        '삼성SDI의 공급 소식은 반갑지만, 한국가스공사의 환경 규제 공시가 주가를 살짝 누르고 있어요! ☔',
        'SASB 기준의 중대한 이슈들이 어떻게 흘러가는지 계속 꼼꼼하게 모니터링해 봐요! 👀',
      ],
      updatedAt: '2026-07-22T09:00:00+09:00',
    },
    riskRadar: { userRiskTolerance: 55, currentPortfolioRisk: 48, status: 'caution', label: '주의' },
    assetSummary: {
      totalAsset: 8000000,
      riskAssetRatio: 60,
      holdings: [
        { ticker: '005490', name: 'POSCO홀딩스', weight: 14, color: '#0ea5e9' },
        { ticker: '068270', name: '셀트리온',    weight: 14, color: '#38bdf8' },
        { ticker: '055550', name: '신한지주',    weight: 13, color: '#7dd3fc' },
        { ticker: '000270', name: '기아',        weight: 13, color: '#0284c7' },
        { ticker: '051910', name: 'LG화학',      weight: 12, color: '#bae6fd' },
        { ticker: '028260', name: '삼성물산',    weight: 12, color: '#e0f2fe' },
        { ticker: '017670', name: 'SK텔레콤',   weight: 11, color: '#93c5fd' },
        { ticker: '010950', name: 'S-Oil',       weight: 11, color: '#bfdbfe' },
      ],
    },
    stockWeatherList: [
      { ticker: '005490', name: 'POSCO홀딩스', weight: 14, weather: 'cloudy', change: -0.4, direction: 'down', detail: { sector: '철강/금속', esgScore: 65, reason: '철강 수요 둔화 및 탄소 배출 규제 비용 발생 부담' } },
      { ticker: '068270', name: '셀트리온',    weight: 14, weather: 'cloudy', change: -0.2, direction: 'down', detail: { sector: '의약품', esgScore: 68, reason: '임상 승인 일정 지연 이슈 및 바이오 시장 조정세' } },
      { ticker: '055550', name: '신한지주',    weight: 13, weather: 'sunny',  change:  1.0, direction: 'up',   detail: { sector: '금융업', esgScore: 82, reason: '안정적인 이자 마진 유지 및 자사주 배당 정책 지속' } },
      { ticker: '000270', name: '기아',        weight: 13, weather: 'sunny',  change:  0.2, direction: 'up',   detail: { sector: '운수장비', esgScore: 74, reason: '전기차 및 해외 SUV 라인업 수출 호조세 유지' } },
      { ticker: '051910', name: 'LG화학',      weight: 12, weather: 'cloudy', change: -0.6, direction: 'down', detail: { sector: '화학', esgScore: 58, reason: '석유화학 업황 둔화 및 교환사채 발행 시세 상방 제약' } },
      { ticker: '028260', name: '삼성물산',    weight: 12, weather: 'sunny',  change:  0.1, direction: 'up',   detail: { sector: '유통업', esgScore: 77, reason: '해외 건설 수주 회복세 및 주주가치 제고 기대감' } },
      { ticker: '017670', name: 'SK텔레콤',   weight: 11, weather: 'sunny',  change:  0.8, direction: 'up',   detail: { sector: '통신업', esgScore: 79, reason: 'AI B2B 사업 성장 및 고배당 매력 지속' } },
      { ticker: '010950', name: 'S-Oil',       weight: 11, weather: 'rainy',  change: -0.3, direction: 'down', detail: { sector: '화학', esgScore: 71, reason: '글로벌 유가 변동성 확대 및 정제마진 약세' } },
    ],
    radarScores: {
      sectorDiv:    88,  // SASB 보증 다각화
      stockSpread:  72,  // 균등 분산
      volatilityFit:68,  // 일부 고변동 종목 포함
      capStability: 74,  // 대중형주 혼합
      esgRisk:      80,  // ESG 필터링 적용
    },
    profile: {
      label: '균형투자형', description: 'ESG와 SASB 기준을 토대로 여러 섹터에 골고루 분산 투자하는 균형 잡힌 투자 성향이에요! 🌿',
      color: '#0ea5e9', target_risk_band: 'BALANCED',
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// 데모 모드용 profile (기본 = 1번 안정추구형)
// ─────────────────────────────────────────────────────────────────
export const DEMO_PROFILE = PORTFOLIO_PRESETS[0].profile;

// ─────────────────────────────────────────────────────────────────
// 하위 호환: 기존 단일 export (기본값 = 1번 포트폴리오)
// ─────────────────────────────────────────────────────────────────
export const overallWeather   = PORTFOLIO_PRESETS[0].overallWeather;
export const riskRadar        = PORTFOLIO_PRESETS[0].riskRadar;
export const assetSummary     = PORTFOLIO_PRESETS[0].assetSummary;
export const stockWeatherList = PORTFOLIO_PRESETS[0].stockWeatherList;

export const dashboardMockData = { overallWeather, kosdaqIndex, riskRadar, assetSummary, stockWeatherList };
export default dashboardMockData;
