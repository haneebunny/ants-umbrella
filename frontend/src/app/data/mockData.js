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
  currentPrice: 768.42,
  change: 5.18,
  changeRate: 0.68,
  isUp: true,
  sparkline: [748.0, 751.3, 745.9, 758.2, 762.1, 763.2, 768.42],
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
        '배당 우량주 중심 구성으로 포트폴리오 전반이 안정적인 흐름을 유지하고 있습니다.',
        '신한지주·SK텔레콤의 배당 공시가 긍정적이며, POSCO홀딩스는 철강 수요 회복 수혜가 기대됩니다.',
        '현재 위험 수준이 허용 범위 하단에 위치하여 추가 분산 투자를 고려할 수 있습니다.',
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
      { ticker: '055550', name: '신한지주',    weight: 16, weather: 'sunny',  change:  1.0, direction: 'up',   detail: { sector: '금융', esgScore: 82, reason: '배당 공시 신호 긍정적, 업이익 개선 예상 지속' } },
      { ticker: '017670', name: 'SK텔레콤',   weight: 15, weather: 'sunny',  change:  0.8, direction: 'up',   detail: { sector: '통신', esgScore: 79, reason: '5G 가입자 증가세 유지, 확정 배당 가능성 높음' } },
      { ticker: '005490', name: 'POSCO홀딩스', weight: 14, weather: 'cloudy', change: -0.4, direction: 'down', detail: { sector: '철강', esgScore: 65, reason: '중국 철강 수요 둔락과 환율 영향으로 단기 불확실성' } },
      { ticker: '010950', name: 'S-Oil',       weight: 13, weather: 'sunny',  change:  0.3, direction: 'up',   detail: { sector: '에너지', esgScore: 71, reason: '정유 마진 안정적, 단기 리스크 수준 양호' } },
      { ticker: '028260', name: '삼성물산',    weight: 14, weather: 'sunny',  change:  0.1, direction: 'up',   detail: { sector: '건설/유통', esgScore: 77, reason: '해외 건설 수주잔고 증가, ESG 예수 양호' } },
      { ticker: '000270', name: '기아',         weight: 14, weather: 'sunny',  change:  0.2, direction: 'up',   detail: { sector: '자동차', esgScore: 74, reason: '전기사JV 확대 소식 긍정적, 수출 회복세' } },
      { ticker: '068270', name: '셀트리온',    weight: 14, weather: 'cloudy', change: -0.2, direction: 'down', detail: { sector: '헬스케어', esgScore: 68, reason: '임상 데이터 승인 지연, 단기 실적 불확실성' } },
    ],
    radarScores: {
      sectorDiv:    82,  // 업종 다각화
      stockSpread:  78,  // 종목 분산도
      volatilityFit:88,  // 변동성 적합도
      capStability: 90,  // 시가충액 안정성
      esgRisk:      75,  // ESG 리스크 (높을수록 안전)
    },
    profile: {
      label: '안정추구형', description: '원금 보전을 최우선으로 하는 보수적 투자 성향입니다.',
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
        'SK하이닉스 HBM4 수주 확대로 반도체 섹터 긍정 신호가 감지되었으나, 단기 변동성이 존재합니다.',
        '카카오 경영진 리스크 지속 및 LG화학 교환사채 발행이 포트폴리오 불확실성을 키우고 있습니다.',
        '성장주 특성상 단기 조정 가능성에 주의하되, 중장기 성장 잠재력은 유효합니다.',
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
      { ticker: '000660', name: 'SK하이닉스', weight: 22, weather: 'sunny',   change:  1.8, direction: 'up',   detail: { sector: '반도체', esgScore: 72, reason: 'HBM4 수주 확대 및 AI 반도체 수요 급증 수혁' } },
      { ticker: '035720', name: '카카오',     weight: 18, weather: 'thunder', change: -1.2, direction: 'down', detail: { sector: 'IT/플랫폼', esgScore: 44, reason: '주요 임원 법적 리스크 지속, 광고 매출 둥락' } },
      { ticker: '051910', name: 'LG화학',     weight: 16, weather: 'cloudy',  change: -0.7, direction: 'down', detail: { sector: '화학', esgScore: 58, reason: '배터리 소재 단가 하락, 교환사체 발행 부담' } },
      { ticker: '003550', name: 'LG',         weight: 15, weather: 'cloudy',  change:  0.3, direction: 'up',   detail: { sector: '회사주', esgScore: 63, reason: '자회사 실적 혼조, 단기 시세 오름마' } },
      { ticker: '036570', name: 'NC소프트',   weight: 15, weather: 'rainy',   change: -0.9, direction: 'down', detail: { sector: '게임', esgScore: 51, reason: '신게임 실패 재기, 이용자 이탈 가속화' } },
      { ticker: '251270', name: '넷마블',     weight: 14, weather: 'cloudy',  change: -0.4, direction: 'down', detail: { sector: '게임', esgScore: 55, reason: '신게임 지연 및 마케팅 비용 과다 이슈' } },
    ],
    radarScores: {
      sectorDiv:    55,  // IT/게임 편중
      stockSpread:  48,  // SK하이닉스 높은 비중
      volatilityFit:62,  // 성장형에 맞는 편
      capStability: 70,  // 대형주 중심이지만 일부 변동
      esgRisk:      50,  // 카카오 경영진 리스크
    },
    profile: {
      label: '성장추구형', description: '높은 수익을 위해 변동성을 감내하는 공격적 투자 성향입니다.',
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
        'ESG·SASB 기준으로 구성된 포트폴리오에서 일부 섹터의 ESG 리스크 이벤트가 감지되었습니다.',
        '삼성SDI의 배터리 공급 계약은 긍정적이나, 한국가스공사의 환경 규제 공시가 단기 압박 요인입니다.',
        'SASB Materiality 기준 중요 이슈 대응 현황을 지속 모니터링할 것을 권장합니다.',
      ],
      updatedAt: '2026-07-22T09:00:00+09:00',
    },
    riskRadar: { userRiskTolerance: 55, currentPortfolioRisk: 48, status: 'caution', label: '주의' },
    assetSummary: {
      totalAsset: 8000000,
      riskAssetRatio: 60,
      holdings: [
        { ticker: '006400', name: '삼성SDI',    weight: 20, color: '#0ea5e9' },
        { ticker: '096770', name: '한국가스공사',weight: 18, color: '#38bdf8' },
        { ticker: '033780', name: 'KT&G',       weight: 17, color: '#7dd3fc' },
        { ticker: '047050', name: '포스코인터', weight: 15, color: '#0284c7' },
        { ticker: '009150', name: '삼성전기',   weight: 15, color: '#bae6fd' },
        { ticker: '011200', name: '한진',       weight: 15, color: '#e0f2fe' },
      ],
    },
    stockWeatherList: [
      { ticker: '006400', name: '삼성SDI',     weight: 20, weather: 'sunny',  change:  0.6, direction: 'up',   detail: { sector: '에너지/배터리', esgScore: 80, reason: '유럽 전기차 배터리 고장수주, 영업이익 회복세' } },
      { ticker: '096770', name: '한국가스공사', weight: 18, weather: 'rainy',  change: -1.1, direction: 'down', detail: { sector: '에너지', esgScore: 58, reason: '주요 공시에서 환경 규제 준수 기준 미달 1건 확인' } },
      { ticker: '033780', name: 'KT&G',        weight: 17, weather: 'cloudy', change:  0.2, direction: 'up',   detail: { sector: '소비재', esgScore: 73, reason: '국내 담맰 규제 강화 의식, 해외에서 성장 가능성 주목' } },
      { ticker: '047050', name: '포스코인터',  weight: 15, weather: 'rainy',  change: -0.5, direction: 'down', detail: { sector: '무역/유통', esgScore: 66, reason: '중국 경기 둥락에 따른 통상 화오 및 매출 압박' } },
      { ticker: '009150', name: '삼성전기',    weight: 15, weather: 'cloudy', change: -0.3, direction: 'down', detail: { sector: '전자부품', esgScore: 70, reason: '글로벌 IT 수요 회복 주시되나, 무라에 시야' } },
      { ticker: '011200', name: '한진',        weight: 15, weather: 'sunny',  change:  0.4, direction: 'up',   detail: { sector: '항공', esgScore: 68, reason: '얬행 수요 회복세 지속, 화물 웴량증가로 수익성 개선' } },
    ],
    radarScores: {
      sectorDiv:    88,  // SASB 보증 다각화
      stockSpread:  72,  // 균등 분산
      volatilityFit:68,  // 일부 고변동 종목 포함
      capStability: 74,  // 대중형주 혼합
      esgRisk:      80,  // ESG 필터링 적용
    },
    profile: {
      label: '균형투자형', description: 'ESG/SASB 기준으로 섹터를 다각화한 균형 투자 성향입니다.',
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
