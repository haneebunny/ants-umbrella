/**
 * mockData.js
 * 홈 대시보드 위젯용 데모 Mock 데이터 (Gated Demo 상태)
 *
 * ─ WeatherStatus: 'sunny' | 'cloudy' | 'rainy' | 'thunder'
 */

// ─────────────────────────────────────────────────────────────────
// 1. 전체 종합 날씨
// ─────────────────────────────────────────────────────────────────
export const overallWeather = {
  status: 'cloudy',
  label: '구름',
  summary: [
    'SK하이닉스 HBM4 수주 확대로 반도체 섹터 긍정 신호가 감지되었으나, 삼성전자 자본이벤트 공시가 단기 하락 리스크를 일부 상쇄하고 있습니다.',
    '카카오 경영진 리스크 지속 및 LG화학 교환사채 발행이 포트폴리오 전반의 불확실성을 키우고 있습니다.',
    '현재 투자 성향 대비 포트폴리오 위험 수준이 허용 범위 내에 있으므로 주의 관찰이 권장됩니다.',
  ],
  updatedAt: '2026-07-22T09:00:00+09:00',
};

// ─────────────────────────────────────────────────────────────────
// 2. 코스닥 미니 지수
// ─────────────────────────────────────────────────────────────────
export const kosdaqIndex = {
  currentPrice: 768.42,
  change: 5.18,
  changeRate: 0.68,
  isUp: true,
  sparkline: [748.0, 751.3, 745.9, 758.2, 762.1, 763.2, 768.42],
};

// ─────────────────────────────────────────────────────────────────
// 3. 위험 레이더
// ─────────────────────────────────────────────────────────────────
export const riskRadar = {
  userRiskTolerance: 55,
  currentPortfolioRisk: 42,
  status: 'safe',
  label: '안전',
};

// ─────────────────────────────────────────────────────────────────
// 4. 보유 자산 요약 (도넛차트용)
// ─────────────────────────────────────────────────────────────────
export const assetSummary = {
  totalAsset: 39920000,
  riskAssetRatio: 68,
  holdings: [
    { ticker: '005490', name: 'POSCO홀딩스', weight: 12, color: '#3eb489' },
    { ticker: '068270', name: '셀트리온',    weight: 13, color: '#69dbad' },
    { ticker: '055550', name: '신한지주',    weight: 12, color: '#2d966e' },
    { ticker: '000270', name: '기아',        weight: 12, color: '#a8edcc' },
    { ticker: '051910', name: 'LG화학',      weight: 13, color: '#1a7a52' },
    { ticker: '028260', name: '삼성물산',    weight: 12, color: '#b2f0d8' },
    { ticker: '017670', name: 'SK텔레콤',   weight: 13, color: '#52c49b' },
    { ticker: '010950', name: 'S-Oil',       weight: 13, color: '#c8f5e4' },
  ],
};

// ─────────────────────────────────────────────────────────────────
// 5. 종목별 날씨 리스트
// ─────────────────────────────────────────────────────────────────
export const stockWeatherList = [
  { ticker: '005490', name: 'POSCO홀딩스', weight: 12, weather: 'cloudy',  weatherLabel: '구름', change: -0.4, direction: 'down' },
  { ticker: '068270', name: '셀트리온',    weight: 13, weather: 'sunny',   weatherLabel: '맑음', change:  0.3, direction: 'up'   },
  { ticker: '055550', name: '신한지주',    weight: 12, weather: 'sunny',   weatherLabel: '맑음', change:  1.0, direction: 'up'   },
  { ticker: '000270', name: '기아',        weight: 12, weather: 'sunny',   weatherLabel: '맑음', change:  0.2, direction: 'up'   },
  { ticker: '051910', name: 'LG화학',      weight: 13, weather: 'cloudy',  weatherLabel: '구름', change: -0.7, direction: 'down' },
  { ticker: '028260', name: '삼성물산',    weight: 12, weather: 'sunny',   weatherLabel: '맑음', change:  0.1, direction: 'up'   },
  { ticker: '017670', name: 'SK텔레콤',   weight: 13, weather: 'sunny',   weatherLabel: '맑음', change:  0.8, direction: 'up'   },
  { ticker: '010950', name: 'S-Oil',       weight: 13, weather: 'rainy',   weatherLabel: '비',   change: -0.3, direction: 'down' },
];

// ─────────────────────────────────────────────────────────────────
// 데모 모드용 profile (calculateRiskProfile 반환값 구조와 동일)
// target_risk_band='BALANCED' → 복합분산형 포트폴리오 사용
// ─────────────────────────────────────────────────────────────────
export const DEMO_PROFILE = {
  target_risk_band: 'BALANCED',
  risk_willingness_score: 50,
  risk_capacity_score: 50,
  target_risk_score_raw: 50,
  target_risk_score_adjusted: 50,
  maximum_loss_tolerance: 0.10,
  investment_horizon_code: 'H3',
  experience_level: 2,
  self_reported_activity_score: 40,
  activity_band: 'GENERAL_MANAGEMENT',
  disposition_style: 'UNKNOWN',
  confidence_score: 0,
  flags: [],
  // RESULT_PROFILES 기반 표시용 필드
  label: '균형투자형',
  description: '안정과 성장을 균형 있게 추구하는 투자 성향입니다.',
  color: '#3eb489',
};

// ─────────────────────────────────────────────────────────────────
// 통합 export
// ─────────────────────────────────────────────────────────────────
export const dashboardMockData = {
  overallWeather,
  kosdaqIndex,
  riskRadar,
  assetSummary,
  stockWeatherList,
};

export default dashboardMockData;
