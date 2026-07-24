"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Header from '../../components/layout/Header';
import RainEffect from '../../components/RainEffect';
import Icon from '../../components/Icon';

// Mock 데이터 정의 (DART/ECOS 통계가 비어있을 때를 위한 최후의 fallback)
const STOCK_DATA = {
  '032830': { name: '삼성생명', weather: 'sunny', direction: 'up', confidence: 'medium', change: 1.2, weight: 16,
    evidences: [{ type: '재무', direction: '긍정', title: '금리 방어력 우수 및 배당 성장주 매력', date: '2026.07.22' }],
    sparkline: [82000, 83100, 82500, 83900, 84200, 83800, 85000],
    aiBriefing: '금리 동결 여건이 장기화되며 보험 손익 방어력이 견고하게 유지되고 있어 긍정적 흐름이 지속됩니다.',
  },
  '033780': { name: 'KT&G', weather: 'cloudy', direction: 'up', confidence: 'weak', change: 0.2, weight: 17,
    evidences: [{ type: '산업', direction: '부정', title: '해외 담배 원가율 단기 상승 압박', date: '2026.07.20' }],
    sparkline: [97000, 96800, 97500, 97900, 97200, 98100, 98000],
    aiBriefing: '내수랑 글로벌 유통망 만드느라 단기 비용이 살짝 늘었지만, 배당 매력은 여전히 든든하고 견고해요! 🚬',
  },
  '105560': { name: 'KB금융', weather: 'sunny', direction: 'up', confidence: 'strong', change: 2.1, weight: 16,
    evidences: [{ type: '재무', direction: '긍정', title: '역대 최대 이익 전망 및 자사주 매입 발표', date: '2026.07.24' }],
    sparkline: [79500, 81000, 80400, 81500, 82300, 81900, 83100],
    aiBriefing: '비은행 계열사들의 실적이 골고루 좋아졌고, 자사주 소각 같은 강력한 주주환원 정책이 주가를 든든하게 받쳐주고 있어요! 🏦',
  },
  '005380': { name: '현대차', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.5, weight: 15,
    evidences: [{ type: '산업', direction: '긍정', title: '북미 하이브리드 차량 판매 호조 지속', date: '2026.07.23' }],
    sparkline: [248000, 251000, 249000, 252500, 254000, 253000, 256000],
    aiBriefing: '미국에서 하이브리드 차가 아주 잘 팔려 마진율이 쏠쏠해요! 덕분에 실적도 견조하게 우상향 곡선을 그리고 있답니다. 🚗',
  },
  '005930': { name: '삼성전자', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.8, weight: 20,
    evidences: [
      { type: '산업', direction: '부정', title: '고성능 반도체 부품 단기 수급 지연 우려', date: '2026.07.22' },
      { type: '공시', direction: '부정', title: '주요 계열사 단기 채무 보증 변경 공시 확인', date: '2026.07.21' }
    ],
    sparkline: [77200, 76500, 76900, 76100, 75800, 76400, 75500],
    aiBriefing: '메모리 고정거래가 상승 둔화 및 미중 통상 압박 우려가 부각되어 단기 박스권 횡보 흐름이 지속될 여지가 있습니다.',
  },
  '000660': { name: 'SK하이닉스', weather: 'rainy', direction: 'down', confidence: 'medium', change: -1.5, weight: 22,
    evidences: [{ type: '산업', direction: '부정', title: '글로벌 테크 섹터 단기 차익 실현 매물 출회', date: '2026.07.24' }],
    sparkline: [199000, 196500, 198000, 194200, 191500, 192800, 189500],
    aiBriefing: 'AI 메모리 리더십은 굳건하지만, 미국의 대중 규제 발언 때문에 기관들이 눈치를 보며 파는 압력이 있는 상태예요! 칩 💻',
  },
  '373220': { name: 'LG에너지솔루션', weather: 'thunder', direction: 'down', confidence: 'strong', change: -3.2, weight: 15,
    evidences: [
      { type: 'ESG', direction: '부정', title: '유럽 공장 환경 기준 변경 및 보증금 이슈 발생', date: '2026.07.18' },
      { type: '재무', direction: '부정', title: '2분기 메탈가 하락 연동으로 영업이익 적자 전환', date: '2026.07.23' }
    ],
    sparkline: [378000, 369000, 372000, 365500, 359000, 361000, 348000],
    aiBriefing: '전기차 전환 속도가 늦어지고 리튬 가격도 약세를 보여서 3분기까지는 실적 압박이 이어질 수 있으니 조심해요! 🔋',
  },
  '035420': { name: 'NAVER', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.5, weight: 22,
    evidences: [{ type: '산업', direction: '부정', title: 'C-커머스(알리/테무) 국내 침투로 쇼핑 경쟁 심화', date: '2026.07.21' }],
    sparkline: [172000, 171500, 170900, 169800, 171200, 168900, 169000],
    aiBriefing: '웹툰 상장 호재는 기대되지만 국내 광고와 커머스 성장이 주춤해서, 바닥을 다지는 조정 국면을 거치는 중이에요. 🕸️',
  },
  '005490': { name: 'POSCO홀딩스', weather: 'thunder', direction: 'down', confidence: 'medium', change: -1.2, weight: 12,
    evidences: [{ type: 'ESG', direction: '부정', title: '글로벌 철강 수요 악화 및 탄소 배출 규제 비용 발생', date: '2026.07.22' }],
    sparkline: [315000, 313000, 316000, 309500, 308000, 311000, 306000],
    aiBriefing: '중국발 저가 철강재 덤핑 장기화 및 환경 탄소배출권 지출 비용 누적으로 철강 부문 마진 압박이 지속됩니다.',
  },
  '068270': { name: '셀트리온', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.8, weight: 13,
    evidences: [{ type: '재무', direction: '긍정', title: '미국 짐펜트라 신규 등재 확대 소식', date: '2026.07.24' }],
    sparkline: [173000, 174500, 173900, 175200, 176900, 174800, 176500],
    aiBriefing: '신약의 글로벌 승인과 직판 전환 덕분에 원가가 절감되어, 하반기부터 본격적인 이익 성장이 기대되고 있어요! 💊',
  },
  '000270': { name: '기아', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.8, weight: 11,
    evidences: [{ type: '재무', direction: '긍정', title: '분기 영업이익률 최고치 경신 및 배당 기대', date: '2026.07.24' }],
    sparkline: [108500, 110200, 109800, 111500, 113000, 112500, 114500],
    aiBriefing: '마진이 많이 남는 RV 차종 중심의 판매 호조 덕분에, 시장 예상을 훌쩍 뛰어넘는 영업이익률을 달성해 돋보여요! 🚘',
  },
  '051910': { name: 'LG화학', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.9, weight: 13,
    evidences: [{ type: '재무', direction: '부정', title: '석유화학 스프레드 악화 지속', date: '2026.07.19' }],
    sparkline: [348000, 344500, 347000, 341000, 338000, 342500, 336000],
    aiBriefing: '중국 공급 과잉으로 화학 실적이 계속 밀리고 있고, 배터리 양극재 출하가 둔화될 우려도 함께 남아있어요. 🧪',
  },
  '028260': { name: '삼성물산', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.6, weight: 16,
    evidences: [{ type: '재무', direction: '긍정', title: '건설 수주 호조 및 자사주 전량 소각 발표', date: '2026.07.23' }],
    sparkline: [142000, 143500, 142800, 144500, 145000, 144200, 146000],
    aiBriefing: '친환경 신사업 추진과 투명한 자사주 소각 약속 덕분에 주가 우상향 힘이 든든하게 작용하고 있어요! 🌱',
  },
  '017670': { name: 'SK텔레콤', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.4, weight: 18,
    evidences: [{ type: '재무', direction: '긍정', title: '안정적 5G 가입자 수 기반 현금 흐름', date: '2026.07.22' }],
    sparkline: [55200, 55600, 55300, 55800, 56200, 56000, 56500],
    aiBriefing: '통신 본업의 안정적인 배당 수익 메리트와 AI 인프라 데이터센터 매출 성장이라는 모멘텀이 균형을 잡았습니다.',
  },
  '010950': { name: 'S-Oil', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.3, weight: 16,
    evidences: [{ type: '재무', direction: '부정', title: '정제마진 하락 및 유가 하방 변동성', date: '2026.07.20' }],
    sparkline: [71000, 70500, 71200, 70400, 69800, 70200, 69500],
    aiBriefing: '글로벌 경기 둔화 우려에 따른 국제 유가 변동성 및 정제마진 정체로 정유 부문 3분기 손익이 조정을 겪고 있습니다.',
  },
  '006400': { name: '삼성SDI', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.6, weight: 20,
    evidences: [{ type: '산업', direction: '긍정', title: '유럽 프리미엄 전장 배터리 공급 물량 증가', date: '2026.07.24' }],
    sparkline: [362000, 365000, 363500, 368000, 370500, 367000, 371500],
    aiBriefing: '북미 공장이 안정적으로 잘 돌아가고 ESS 솔루션 다각화 덕분에 경쟁사들에 비해 실적을 훌륭히 방어하고 있답니다! ⚡',
  },
  '096770': { name: '한국가스공사', weather: 'rainy', direction: 'down', confidence: 'medium', change: -1.1, weight: 18,
    evidences: [{ type: '공시', direction: '부정', title: '미수금 누적에 따른 무배당 기조 유지 우려', date: '2026.07.18' }],
    sparkline: [38500, 38100, 37800, 37400, 37900, 37200, 36800],
    aiBriefing: '동해 가스전 기대는 선반영되었지만, 미수금 리스크가 길어지고 부채 비율이 높아서 주가 회복을 꾹 누르고 있어요. ⚓',
  },
  '047050': { name: '포스코인터', weather: 'rainy', direction: 'down', confidence: 'weak', change: -0.5, weight: 15,
    evidences: [{ type: '산업', direction: '부정', title: '글로벌 원자재 트레이딩 물동량 일시 정체', date: '2026.07.21' }],
    sparkline: [58000, 57400, 57900, 57100, 56500, 56900, 56000],
    aiBriefing: '글로벌 통상 환경이 나빠져 무역 부문 수익은 주춤하지만, 친환경 에너지 사업으로 든든한 복원력을 쌓는 중이에요! 🌎',
  },
  '009150': { name: '삼성전기', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.3, weight: 15,
    evidences: [{ type: '산업', direction: '부정', title: 'IT용 MLCC 회복 속도 지연', date: '2026.07.16' }],
    sparkline: [135000, 134200, 133800, 134500, 133900, 133200, 132800],
    aiBriefing: '전장용 MLCC 매출 비중 증가세는 긍정적이나 IT 수요 회복 지연으로 단기 조정 국면을 거치고 있습니다.',
  },
  '011200': { name: '한진', weather: 'sunny', direction: 'up', confidence: 'weak', change: 0.4, weight: 15,
    evidences: [{ type: '산업', direction: '긍정', title: '여행 수요 및 해외 물동량 지속 증가', date: '2026.07.23' }],
    sparkline: [19800, 20100, 20000, 20400, 20700, 20600, 21000],
    aiBriefing: '물류 및 항공 화물 물동량 확대로 운임 수익성이 개선되고 있어 안정적인 흐름을 유지하고 있습니다.',
  },
  '055550': { name: '신한지주', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.9, weight: 14,
    evidences: [{ type: '재무', direction: '긍정', title: '연간 실적 호조 및 적극적 주주환원 의지 표명', date: '2026.07.24' }],
    sparkline: [42000, 43100, 42500, 43900, 44200, 43800, 45000],
    aiBriefing: '금리를 잘 방어해 주는 이자 이익 덕에 기초 체력이 탄탄하고, 자사주 소각 등 주주친화정책이 주가를 든든히 지탱해 줘요! 📈',
  },
};


const DEFAULT_STOCK = {
  name: '종목 분석 리포트', weather: 'cloudy', direction: 'down', confidence: 'weak', change: 0, weight: 0,
  evidences: [{ type: 'AI 분석', direction: '중립', title: '수집된 과거 리스크 이력이 적어서 표준 모니터링 모드로 표시하고 있어요!' }],
  sparkline: [100, 100, 100, 100, 100, 100, 100],
  aiBriefing: '해당 종목은 현재 기본 안전 지표 위주로 모니터링 중이며, 추가 데이터 수집이 진행됨에 따라 실시간 브리핑이 업데이트됩니다.',
};

const WEATHER_CFG = {
  sunny:   { icon: 'sun',       label: '맑음', color: 'text-amber-500' },
  cloudy:  { icon: 'cloud',     label: '구름', color: 'text-slate-500' },
  rainy:   { icon: 'cloudRain', label: '비',   color: 'text-blue-500'  },
  thunder: { icon: 'zap',       label: '번개', color: 'text-red-500'   },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 마크다운 볼드 파서
const renderMarkdownBold = (text) => {
  if (!text) return '';
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    return index % 2 === 1 ? <strong key={index} className="font-extrabold">{part}</strong> : part;
  });
};

// 확신도 한글 매핑 딕셔너리
const CONFIDENCE_KO = {
  strong: '높음',
  medium: '보통',
  weak: '낮음',
  '강': '높음',
  '중': '보통',
  '약': '낮음'
};
const getConfidenceLabel = (conf) => {
  if (!conf) return '낮음';
  const val = String(conf).trim().toLowerCase();
  return CONFIDENCE_KO[val] || CONFIDENCE_KO[conf] || conf;
};

export default function StockDetailPage() {
  const { ticker } = useParams();
  const { isDark, toggleTheme } = useTheme();

  const [liveData, setLiveData] = React.useState(null);

  React.useEffect(() => {
    if (!ticker) return;
    async function loadApi() {
      try {
        const [scoreRes, evRes] = await Promise.all([
          fetch(`${API_BASE}/risk-score/${ticker}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE}/risk-evidences/${ticker}`).then(r => r.ok ? r.json() : null)
        ]);

        if (scoreRes || evRes) {
          setLiveData({
            prob_up: scoreRes?.prob_up,
            direction: scoreRes?.direction,
            confidence_tier: scoreRes?.confidence_tier,
            aiBriefing: evRes?.ai_briefing,
            evidences: evRes?.evidences,
            macroAnalysis: evRes?.macro_analysis,
            sparkline: evRes?.sparkline,
            currentPrice: evRes?.current_price,
            changePercent: evRes?.change_percent
          });
        }
      } catch (e) {
        console.warn('[StockDetail] Backend fetch fallback:', e);
      }
    }
    loadApi();
  }, [ticker]);

  const baseStock = STOCK_DATA[ticker] || DEFAULT_STOCK;
  const isPlaceholderBrief = liveData?.aiBriefing?.includes('준비 중입니다');
  const aiBriefingText = (!isPlaceholderBrief && liveData?.aiBriefing)
    ? liveData.aiBriefing
    : (baseStock.aiBriefing || `🤖 [AI 종합 진단 브리핑] ${baseStock.name}(${ticker}) 종목은 분석해 보니, 최근 리스크 노출도가 업종 평균 수준으로 아주 맑은 날씨가 예상돼요! ☀️`);

  const stock = {
    ...baseStock,
    direction: liveData?.direction || baseStock.direction,
    confidence: liveData?.confidence_tier || baseStock.confidence,
    aiBriefing: aiBriefingText,
    evidences: (liveData?.evidences && liveData.evidences.length > 0) ? liveData.evidences : baseStock.evidences,
    macroAnalysis: liveData?.macroAnalysis || [],
    sparkline: (liveData?.sparkline && liveData.sparkline.length > 0) ? liveData.sparkline : baseStock.sparkline,
    change: liveData?.changePercent !== undefined ? liveData.changePercent : baseStock.change,
    currentPrice: liveData?.currentPrice !== undefined ? liveData.currentPrice : (baseStock.sparkline ? baseStock.sparkline[baseStock.sparkline.length - 1] : 50000)
  };

  const decisionEvidences = stock.evidences?.filter(ev => ev.type === '공시' || ev.type === '재무') || [];
  const newsEvidences     = stock.evidences?.filter(ev => ev.type !== '공시' && ev.type !== '재무') || [];

  const wCfg = WEATHER_CFG[stock.weather] || WEATHER_CFG.cloudy;

  // 주가 스파크라인 계산
  const w = 320, h = 80;
  const sl = stock.sparkline;
  const min = Math.min(...sl), max = Math.max(...sl), range = max - min || 1;
  const points = sl.map((v, i) => {
    const x = (i / (sl.length - 1)) * w;
    const y = h - ((v - min) / range) * (h * 0.8) - h * 0.1;
    return `${x},${y}`;
  }).join(' ');

  const isUp = stock.direction === 'up';
  const lineColor = isDark ? (isUp ? '#69dbad' : '#ff8b8b') : (isUp ? '#3eb489' : '#ef4444');

  return (
    <div className="w-full relative">
      <RainEffect weatherStatus={stock.weather} isDark={isDark} />

      <div className="w-full relative z-10">
        <div className="pt-2">
          {/* 종목 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{stock.name}</h1>
              <p className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{ticker}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1.5 ${wCfg.color}`}>
                <Icon name={wCfg.icon} className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-black">{wCfg.label}</span>
              </div>
              <span className={`text-sm font-black font-mono ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500'}`}>
                {stock.currentPrice ? `${stock.currentPrice.toLocaleString()}원` : ''} ({isUp ? '▲ +' : '▼ '}{stock.change.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* 2열 반응형 그리드 배치 (데스크톱 와이드 공간 활용) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 좌측 열: 차트 + 보유 정보 (왼쪽에 보유비중, 전망, 확신도 배치!) + AI 브리핑 */}
            <div className="space-y-6">
              {/* 주가 그래프 */}
              <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  최근 7거래일 주가
                </p>
                <div className="relative">
                  <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-24 w-full">
                    <defs>
                      <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline points={points + ` ${w},${h} 0,${h}`} fill="url(#stockGrad)" stroke="none" />
                    <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex justify-between mt-2">
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    시작일: {sl[0].toLocaleString()}원
                  </span>
                  <span className={`text-[10px] font-mono font-black ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500'}`}>
                    현재가: {sl[sl.length-1].toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* 보유 정보 (비중, 전망, 확신도) - 좌측 열 배치 */}
              <div className={`rounded-2xl border p-5 grid grid-cols-3 gap-4 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                {[
                  { label: '보유 비중', value: `${stock.weight}%` },
                  { label: '전망', value: isUp ? '상승' : '하락', color: isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500' },
                  { label: '확신도', value: getConfidenceLabel(stock.confidence) },
                ].map(item => (
                  <div key={item.label} className="text-center flex flex-col items-center justify-center p-2 rounded-xl transition-colors hover:bg-slate-500/5">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                    <p className={`text-lg font-black mt-1 ${item.color || (isDark ? 'text-white' : 'text-[#0f1713]')}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* AI 종합 진단 브리핑 (고급스러운 카드 효과 반영) */}
              <div className={`rounded-2xl border p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
                isDark 
                  ? 'bg-[#0f2318] border-[#3eb489]/25 shadow-[0_0_20px_rgba(62,180,137,0.08)]' 
                  : 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-[#3eb489]/20 shadow-md shadow-emerald-100/30'
              }`}>
                {/* 배경🐜 실루엣 데코 */}
                <div className="absolute right-4 bottom-2 opacity-5 select-none text-7xl pointer-events-none">
                  🐜
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-1.5 rounded-lg ${isDark ? 'bg-[#3eb489]/15' : 'bg-[#3eb489]/10'}`}>
                    <Icon name="sparkles" className={`w-4 h-4 ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`} />
                  </div>
                  <p className={`text-sm font-black ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>AI 종합 진단 브리핑</p>
                </div>
                <div className={`text-[13px] leading-relaxed font-medium space-y-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {renderMarkdownBold(stock.aiBriefing)}
                </div>
              </div>
            </div>

            {/* 우측 열 (판단 근거 모음: 피처 영향도 + 예측 판단 근거 + 관련 뉴스) */}
            <div className="space-y-6">
              {/* AI 피처 영향도 분석 (환율, 금리, 변동성 등 판단 이유 제공) */}
              {stock.macroAnalysis && stock.macroAnalysis.length > 0 && (
                <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex items-center gap-1.5 mb-4">
                    <Icon name="sliders" className="w-4 h-4 text-emerald-500" />
                    <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                      AI 피처 영향도 분석
                    </p>
                  </div>
                  <div className="space-y-3.5">
                    {stock.macroAnalysis.map((item, idx) => {
                      const infColor = item.influence === 'high' 
                        ? 'text-rose-500 bg-rose-500/10' 
                        : (item.influence === 'medium' ? 'text-yellow-500 bg-yellow-500/10' : 'text-emerald-500 bg-emerald-500/10');
                      
                      const infLabel = item.influence === 'high' ? '높음' : (item.influence === 'medium' ? '보통' : '낮음');
                      
                      return (
                        <div key={idx} className="flex flex-col gap-1 pb-3 border-b border-dashed last:border-0 last:pb-0 last:mb-0 border-slate-500/10">
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                              {item.name}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${infColor}`}>
                              영향도: {infLabel}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 예측 판단 근거 */}
              {decisionEvidences.length > 0 && (
                <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Icon name="checkSquare" className="w-4 h-4 text-indigo-500" />
                    <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>예측 판단 근거</p>
                  </div>
                  <div className="space-y-2">
                    {decisionEvidences.map((ev, i) => (
                      <a
                        key={i}
                        href={ev.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-start justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                            {ev.type}
                          </span>
                          <p className="text-xs leading-relaxed font-semibold">{ev.title}</p>
                        </div>
                        <span className={`text-[10px] font-mono flex-shrink-0 mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {ev.date || '2026.07.23'}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 관련 뉴스 */}
              {newsEvidences.length > 0 && (
                <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Icon name="fileText" className="w-4 h-4 text-emerald-500" />
                    <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>관련 뉴스</p>
                  </div>
                  <div className="space-y-2">
                    {newsEvidences.map((ev, i) => (
                      <a
                        key={i}
                        href={ev.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-start justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                            ev.direction === '부정' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>{ev.type}</span>
                          <p className="text-xs leading-relaxed font-semibold">{ev.title}</p>
                        </div>
                        <span className={`text-[10px] font-mono flex-shrink-0 mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {ev.date || '2026.07.23'}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
