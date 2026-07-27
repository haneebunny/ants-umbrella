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
        '배당 우량주와 방어주 중심 구성 덕분에 포트폴리오 전반이 아주 편안하고 안정적인 흐름을 유지하고 있어요! 🛡️',
        '삼성생명과 현대차의 배당 매력이 든든하고, 한국전력은 전력 공급 독점 방어주로서 리스크 완화 역할을 톡톡히 해내고 있답니다! ⚡',
        '포트폴리오의 종합 하락 위험은 매우 안전한 범위에 있어 시장 흔들림에도 안심하고 보유하셔도 좋습니다! 💰',
      ],
      updatedAt: '2026-07-22T09:00:00+09:00',
    },
    riskRadar: { userRiskTolerance: 35, currentPortfolioRisk: 21, status: 'safe', label: '안전' },
    assetSummary: {
      totalAsset: 42020000,
      totalPurchaseAsset: 42020000,
      totalProfitLoss: 0,
      totalProfitLossRate: 0,
      riskAssetRatio: 24, // 현대차(24%) 등 주식 비중
      holdings: [
        { ticker: '032830', name: '삼성생명',   weight: 24, color: '#3eb489', quantity: 120, purchasePrice: 85000 },
        { ticker: '033780', name: 'KT&G',      weight: 23, color: '#69dbad', quantity: 100, purchasePrice: 98000 },
        { ticker: '105560', name: 'KB금융',    weight: 23, color: '#2d966e', quantity: 120, purchasePrice: 82000 },
        { ticker: '005380', name: '현대차',    weight: 24, color: '#a8edcc', quantity: 40, purchasePrice: 252000 },
        { ticker: '015760', name: '한국전력',   weight: 6,  color: '#1a7a52', quantity: 100, purchasePrice: 21000 },
      ],
    },
    stockWeatherList: [
      { ticker: '032830', name: '삼성생명',    weight: 24, weather: 'sunny',  change:  0.2, direction: 'up', quantity: 120, purchasePrice: 85000, detail: { sector: '보험', esgScore: 80, reason: '안정적인 이익 체력 및 주주환원 확대 모멘텀 긍정적' } },
      { ticker: '033780', name: 'KT&G',       weight: 23, weather: 'sunny',  change:  0.1, direction: 'up', quantity: 100, purchasePrice: 98000, detail: { sector: '기타제조업', esgScore: 78, reason: '해외 매출 성장세 지속, 견조한 배당 메력 기반 하방 지지력' } },
      { ticker: '105560', name: 'KB금융',     weight: 23, weather: 'sunny',  change:  0.8, direction: 'up', quantity: 120, purchasePrice: 82000, detail: { sector: '금융업', esgScore: 85, reason: '주주가치 제고 정책 가시성 극대화, 견고한 은행 마진' } },
      { ticker: '005380', name: '현대차',     weight: 24, weather: 'sunny',  change:  1.2, direction: 'up', quantity: 40, purchasePrice: 252000, detail: { sector: '운수장비', esgScore: 75, reason: '인도 법인 IPO 모멘텀 및 고배당·밸류업 대표 수혜주로 시세 견조' } },
      { ticker: '015760', name: '한국전력',    weight: 6,  weather: 'cloudy', change: -0.3, direction: 'down', quantity: 100, purchasePrice: 21000, detail: { sector: '전기가스업', esgScore: 68, reason: '전력 판매 실적은 방어적이나 원자재가 부담에 따른 소폭 조정' } },
    ],
    radarScores: {
      sectorDiv:    88,  
      stockSpread:  82,  
      volatilityFit:92,  
      capStability: 94,  
      esgRisk:      82,  
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
        'SK하이닉스의 HBM4 수주 성과로 테크 반도체 훈풍이 불고 있지만, 미국 IT 빅테크 변동성으로 단기 흔들림이 감지돼요! 💻',
        'LG에너지솔루션의 전기차 수요 정체 우려가 포트폴리오에 먹구름을 뿌리고 있습니다. ☁️',
        '성장 기술주 비중이 높은 만큼 실시간 거시 지표 변화에 집중하며 지켜봐요! 🚀',
      ],
      updatedAt: '2026-07-22T09:00:00+09:00',
    },
    riskRadar: { userRiskTolerance: 70, currentPortfolioRisk: 55, status: 'caution', label: '주의' },
    assetSummary: {
      totalAsset: 15018000,
      totalPurchaseAsset: 15018000,
      totalProfitLoss: 0,
      totalProfitLossRate: 0,
      riskAssetRatio: 75,
      holdings: [
        { ticker: '005930', name: '삼성전자',       weight: 25, color: '#6366f1', quantity: 50, purchasePrice: 76000 },
        { ticker: '000660', name: 'SK하이닉스',     weight: 26, color: '#818cf8', quantity: 20, purchasePrice: 195000 },
        { ticker: '373220', name: 'LG에너지솔루션', weight: 24, color: '#a5b4fc', quantity: 10, purchasePrice: 360000 },
        { ticker: '035420', name: 'NAVER',          weight: 25, color: '#4f46e5', quantity: 22, purchasePrice: 169000 },
      ],
    },
    stockWeatherList: [
      { ticker: '005930', name: '삼성전자',       weight: 25, weather: 'sunny',  change:  0.5, direction: 'up', quantity: 50, purchasePrice: 76000, detail: { sector: '전기전자', esgScore: 78, reason: '범용 D램 가격 반등 지지 및 파운드리 실적 턴어라운드 기대' } },
      { ticker: '000660', name: 'SK하이닉스',     weight: 26, weather: 'sunny',  change:  1.8, direction: 'up', quantity: 20, purchasePrice: 195000, detail: { sector: '전기전자', esgScore: 72, reason: 'HBM4 수주 주도권 장악, AI 반도체 메모리 수요 급증 수혜' } },
      { ticker: '373220', name: 'LG에너지솔루션', weight: 24, weather: 'cloudy', change: -0.8, direction: 'down', quantity: 10, purchasePrice: 360000, detail: { sector: '전기전자', esgScore: 79, reason: '유럽 및 북미 전기차 수요 일시 정체에 따른 배터리 단가 하락 리스크' } },
      { ticker: '035420', name: 'NAVER',          weight: 25, weather: 'sunny',  change:  0.2, direction: 'up', quantity: 22, purchasePrice: 169000, detail: { sector: '서비스업', esgScore: 82, reason: 'AI 검색 서비스 출시 긍정적, 광고 부문 견고한 캐시카우 역할' } },
    ],
    radarScores: {
      sectorDiv:    45,  
      stockSpread:  75,  
      volatilityFit:70,  
      capStability: 85,  
      esgRisk:      77,  
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
        'ESG 및 SASB 표준 다각화 포트폴리오에서 철강 업종 탄소 배출 규제 리스크가 감지되었어요! 🌿',
        '신한지주와 SK텔레콤의 안정적인 배당 신호는 든든하지만, S-Oil의 유가 변동 리스크가 지수를 누르고 있습니다. ☔',
        '다양한 섹터로 쪼갠 만큼 특정 이슈가 전체 흐름을 해치진 않으니 편안히 지켜봐요! 👀',
      ],
      updatedAt: '2026-07-22T09:00:00+09:00',
    },
    riskRadar: { userRiskTolerance: 55, currentPortfolioRisk: 48, status: 'caution', label: '주의' },
    assetSummary: {
      totalAsset: 8089000,
      totalPurchaseAsset: 8089000,
      totalProfitLoss: 0,
      totalProfitLossRate: 0,
      riskAssetRatio: 62,
      holdings: [
        { ticker: '005490', name: 'POSCO홀딩스', weight: 12, color: '#0ea5e9', quantity: 3, purchasePrice: 310000 },
        { ticker: '068270', name: '셀트리온',    weight: 13, color: '#38bdf8', quantity: 6, purchasePrice: 175000 },
        { ticker: '055550', name: '신한지주',    weight: 12, color: '#7dd3fc', quantity: 20, purchasePrice: 48000 },
        { ticker: '000270', name: '기아',        weight: 12, color: '#0284c7', quantity: 9, purchasePrice: 110000 },
        { ticker: '051910', name: 'LG화학',      weight: 13, color: '#bae6fd', quantity: 3, purchasePrice: 340000 },
        { ticker: '028260', name: '삼성물산',    weight: 13, color: '#e0f2fe', quantity: 7, purchasePrice: 145000 },
        { ticker: '017670', name: 'SK텔레콤',   weight: 12, color: '#93c5fd', quantity: 18, purchasePrice: 56000 },
        { ticker: '010950', name: 'S-Oil',       weight: 13, color: '#bfdbfe', quantity: 16, purchasePrice: 70000 },
      ],
    },
    stockWeatherList: [
      { ticker: '005490', name: 'POSCO홀딩스', weight: 12, weather: 'cloudy', change: -0.4, direction: 'down', quantity: 3, purchasePrice: 310000, detail: { sector: '철강금속', esgScore: 65, reason: '철강 수요 둔화 및 글로벌 탄소 규제에 따른 환경 비용 부담 우려' } },
      { ticker: '068270', name: '셀트리온',    weight: 13, weather: 'cloudy', change: -0.2, direction: 'down', quantity: 6, purchasePrice: 175000, detail: { sector: '의약품', esgScore: 68, reason: '바이오 시밀러 시장 경쟁 심화에 따른 일부 단기 실적 조정 우려' } },
      { ticker: '055550', name: '신한지주',    weight: 12, weather: 'sunny',  change:  1.0, direction: 'up', quantity: 20, purchasePrice: 48000, detail: { sector: '금융업', esgScore: 82, reason: '금리 방어력 우수 및 적극적인 자사주 매입·소각 등 주주환원 기대' } },
      { ticker: '000270', name: '기아',        weight: 12, weather: 'sunny',  change:  0.2, direction: 'up', quantity: 9, purchasePrice: 110000, detail: { sector: '운수장비', esgScore: 74, reason: '미국·유럽 친환경 믹스 개선에 따른 사상 최대 실적 흐름 지속' } },
      { ticker: '051910', name: 'LG화학',      weight: 13, weather: 'cloudy', change: -0.6, direction: 'down', quantity: 3, purchasePrice: 340000, detail: { sector: '화학', esgScore: 58, reason: '석유화학 스프레드 악화 및 이차전지 양극재 자회사 실적 영향' } },
      { ticker: '028260', name: '삼성물산',    weight: 13, weather: 'sunny',  change:  0.1, direction: 'up', quantity: 7, purchasePrice: 145000, detail: { sector: '유통업', esgScore: 77, reason: '친환경 에너지 신공법 해외 수주잔고 급증, 지배주주 배당 증가' } },
      { ticker: '017670', name: 'SK텔레콤',   weight: 12, weather: 'sunny',  change:  0.8, direction: 'up', quantity: 18, purchasePrice: 56000, detail: { sector: '통신업', esgScore: 79, reason: '안정적 무선 가입자 기반 고배당 유입 및 AI 데이터센터 신사업' } },
      { ticker: '010950', name: 'S-Oil',       weight: 13, weather: 'rainy',  change: -0.3, direction: 'down', quantity: 16, purchasePrice: 70000, detail: { sector: '화학', esgScore: 71, reason: '국제 유가 공급 과잉 가능성 대두 및 글로벌 정제마진 회복 지연 리스크' } },
    ],
    radarScores: {
      sectorDiv:    88,  
      stockSpread:  72,  
      volatilityFit:68,  
      capStability: 74,  
      esgRisk:      80,  
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
