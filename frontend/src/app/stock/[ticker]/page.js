"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Header from '../../components/layout/Header';
import Icon from '../../components/Icon';
import RainEffect from '../../components/RainEffect';


// 종목별 상세 Mock 데이터 (모든 포트폴리오 종목망 망라)
const STOCK_DATA = {
  '005930': { name: '삼성전자', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.5, weight: 25,
    evidences: [{ type: '산업', direction: '긍정', title: 'HBM 메모리 공급 확대 및 메모리 반도체 실적 개선', date: '2026.07.23' }],
    sparkline: [74000, 74500, 75200, 74800, 75500, 76000, 76800],
    aiBriefing: '글로벌 AI 반도체 수요 폭증에 따른 HBM 공급 확대로 실적 회복세가 뚜렷합니다. 주가 안정성이 유지되는 대표 우량주입니다.',
  },
  '005380': { name: '현대차', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.9, weight: 18,
    evidences: [{ type: '재무', direction: '긍정', title: '북미 하이브리드/전기차 판매 호조 및 주주환원 확대', date: '2026.07.23' }],
    sparkline: [240000, 242000, 245000, 243000, 248000, 251000, 254000],
    aiBriefing: '하이브리드 라인업의 호조와 고부가가치 RV 판매 증가로 견고한 영업이익률을 유지하고 있습니다.',
  },
  '035420': { name: 'NAVER', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.5, weight: 15,
    evidences: [{ type: '산업', direction: '부정', title: '플랫폼 커머스 경쟁 심화 및 마케팅비증가', date: '2026.07.21' }],
    sparkline: [175000, 173000, 172000, 174000, 171000, 170000, 169500],
    aiBriefing: 'C-커머스 공세와 검색 광고 성장세 둔화가 단기 부담 요인이나, 생성형 AI 서비스 가시화로 중장기 모멘텀이 상존합니다.',
  },
  '055550': { name: '신한지주', weather: 'sunny', direction: 'up', confidence: 'medium', change: 1.0, weight: 16,
    evidences: [{ type: '재무', direction: '긍정', title: '금리 방어선 유지 및 대출 포트폴리오 성장세 지속', date: '2026.07.23' }],
    sparkline: [47200, 47500, 47800, 47600, 48100, 48400, 48900],
    aiBriefing: '고금리 환경에서 순이자마진(NIM) 방어에 성공하며 안정적인 이익 성장이 지속되고 있습니다. 대출 포트폴리오 성장과 건전성 지표 개선이 긍정 요인입니다.',
  },
  '017670': { name: 'SK텔레콤', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.8, weight: 15,
    evidences: [{ type: '재무', direction: '긍정', title: 'AI 기반 B2B 서비스 매출 성장 및 5G 가입자 유지', date: '2026.07.22' }],
    sparkline: [52500, 53000, 53400, 53200, 54000, 54500, 55100],
    aiBriefing: 'AI 인프라 투자와 B2B 서비스 확장으로 통신 본업 외 신성장 동력이 가시화되고 있습니다. 안정적인 배당 정책도 장기 투자자에게 매력적입니다.',
  },
  '005490': { name: 'POSCO홀딩스', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.4, weight: 14,
    evidences: [{ type: '공시', direction: '부정', title: '중국 철강 수요 둔화 및 탄소 배출권 관련 비용 증가 공시', date: '2026.07.21' }],
    sparkline: [285000, 282000, 279000, 281000, 278000, 276000, 275200],
    aiBriefing: 'POSCO홀딩스는 탄소 배출 규제 강화에 따른 비용 증가 압박이 지속되고 있습니다. 철강 업황 둔화와 맞물려 단기 하락 압력이 있으나, 수소환원제철 전환 투자로 중장기 긍정 신호도 공존합니다.',
  },
  '010950': { name: 'S-Oil', weather: 'rainy', direction: 'down', confidence: 'weak', change: -0.3, weight: 13,
    evidences: [{ type: 'ESG', direction: '부정', title: '정제마진 하락 및 유가 변동성 확대', date: '2026.07.20' }],
    sparkline: [78000, 76500, 75000, 74200, 73800, 73200, 72800],
    aiBriefing: '정제마진 하락과 글로벌 유가 변동성 확대로 단기 실적 압박이 예상됩니다. 샤힌 프로젝트(석유화학 설비) 완공 이후의 중장기 성장 기대감은 유지됩니다.',
  },
  '028260': { name: '삼성물산', weather: 'sunny', direction: 'up', confidence: 'weak', change: 0.1, weight: 14,
    evidences: [{ type: '산업', direction: '긍정', title: '해외 건설 수주 잔고 확대', date: '2026.07.23' }],
    sparkline: [115000, 115500, 116000, 115800, 116200, 116500, 116800],
    aiBriefing: '건설 부문 해외 수주 회복과 상사 부문 자원 트레이딩 이익 개선으로 안정적인 실적을 유지하고 있습니다.',
  },
  '000270': { name: '기아', weather: 'sunny', direction: 'up', confidence: 'weak', change: 0.2, weight: 14,
    evidences: [{ type: '산업', direction: '긍정', title: '전기차 JV 확대 소식 및 북미/유럽 수출 회복', date: '2026.07.22' }],
    sparkline: [109000, 110000, 109500, 111000, 112000, 111500, 112300],
    aiBriefing: '전기차 전환 가속화와 SUV 라인업 강화로 글로벌 수요가 확대되고 있습니다. 원화 약세 효과도 수출 실적에 긍정적입니다.',
  },
  '068270': { name: '셀트리온', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.2, weight: 14,
    evidences: [{ type: '재무', direction: '부정', title: '임상 3상 데이터 승인 일정 지연', date: '2026.07.19' }],
    sparkline: [195000, 197000, 199000, 198000, 200000, 201000, 202400],
    aiBriefing: '임상 3상 중간 결과 발표 지연이 일부 불확실성을 키우고 있으나, 기존 바이오시밀러 라인업의 글로벌 판매 호조로 기초 체력은 견고합니다.',
  },

  // ── 2번: 성장·테크형 ────────────────────────────
  '000660': { name: 'SK하이닉스', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.8, weight: 22,
    evidences: [{ type: '산업', direction: '긍정', title: 'HBM4 대형 수주 계약 확정 및 글로벌 AI 반도체 수요 급증', date: '2026.07.23' }],
    sparkline: [172000, 175000, 174000, 178000, 182000, 186000, 189500],
    aiBriefing: 'SK하이닉스는 차세대 HBM 수주를 독점적으로 확대하며 메모리 반도체 업황 개선을 선도하고 있습니다. 강력한 기술 우위와 매출 성장이 관측됩니다.',
  },
  '035720': { name: '카카오', weather: 'thunder', direction: 'down', confidence: 'strong', change: -1.2, weight: 18,
    evidences: [{ type: 'ESG', direction: '부정', title: '주요 임원 사법 리스크 및 광고/플랫폼 성장률 둔화', date: '2026.07.21' }],
    sparkline: [42000, 41200, 40500, 39800, 39200, 38500, 37900],
    aiBriefing: '경영진 법적 리스크 이슈와 지배구조 지적 등이 주가 하방 압력을 강하게 부추기고 있습니다. 신사업 가시화 전까지는 주의가 필요합니다.',
  },
  '051910': { name: 'LG화학', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.7, weight: 16,
    evidences: [{ type: '공시', direction: '부정', title: '교환사채 2,000억 규모 발행 및 양극재 단가 하락', date: '2026.07.20' }],
    sparkline: [348000, 344000, 341000, 339000, 336000, 334000, 332500],
    aiBriefing: '교환사채 발행으로 단기 재무 부담이 증가하고 있습니다. 배터리 소재 부문의 수익성 개선은 긍정적이나, 전반적인 화학 업황 부진이 지속되고 있습니다.',
  },
  '003550': { name: 'LG', weather: 'cloudy', direction: 'up', confidence: 'weak', change: 0.3, weight: 15,
    evidences: [{ type: '재무', direction: '긍정', title: '자회사 실적 혼조세 속에 지주사 주주환원책 발표', date: '2026.07.22' }],
    sparkline: [74000, 74500, 74200, 75000, 75400, 75200, 75800],
    aiBriefing: '주요 계열사 실적이 혼조세를 보이고 있으나, 지주사 차원의 배당 확대 및 자사주 매입 정책이 완만한 상승세를 지탱하고 있습니다.',
  },
  '036570': { name: 'NC소프트', weather: 'rainy', direction: 'down', confidence: 'medium', change: -0.9, weight: 15,
    evidences: [{ type: '산업', direction: '부정', title: '신작 게임 성과 부진 및 기존 IP 이용자 이탈 지속', date: '2026.07.18' }],
    sparkline: [185000, 182000, 179000, 176000, 173000, 171000, 168500],
    aiBriefing: '기존 핵심 IP의 매출 감퇴와 신작 모멘텀 부재로 리스크가 지속되고 있습니다. 비용 구조 개편 결과를 지켜볼 필요가 있습니다.',
  },
  '251270': { name: '넷마블', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.4, weight: 14,
    evidences: [{ type: '산업', direction: '부정', title: '신작 라인업 출시 연기 및 마케팅 비용 증가', date: '2026.07.17' }],
    sparkline: [56000, 55500, 55200, 54800, 54400, 54100, 53800],
    aiBriefing: '신작 출시 지연에 따른 마케팅비 부담이 흑자 전환 폭을 제한하고 있으나, 차기 신작 릴리즈 일정에 따라 반등 가능성이 존재합니다.',
  },

  // ── 3번: SASB 다각화형 ────────────────────────────
  '006400': { name: '삼성SDI', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.6, weight: 20,
    evidences: [{ type: '산업', direction: '긍정', title: '유럽 배터리 공급 대형 계약 체결', date: '2026.07.23' }],
    sparkline: [380000, 384000, 382000, 388000, 392000, 390000, 395000],
    aiBriefing: '유럽 프리미엄 완성차 업체와의 배터리 장기 수주 계약으로 수익 체질이 강화되고 있으며, 영업이익 회복세가 뚜렷합니다.',
  },
  '096770': { name: '한국가스공사', weather: 'rainy', direction: 'down', confidence: 'medium', change: -1.1, weight: 18,
    evidences: [{ type: '공시', direction: '부정', title: '환경 규제 준수 기준 미달 관련 주요 공시', date: '2026.07.21' }],
    sparkline: [38500, 38000, 37400, 36900, 36200, 35800, 35200],
    aiBriefing: '환경 준수 관련 정기 평가 공시 결과 기준 미달 사항이 관측되어 단기 리스크 지수가 상승했습니다.',
  },
  '033780': { name: 'KT&G', weather: 'cloudy', direction: 'up', confidence: 'weak', change: 0.2, weight: 17,
    evidences: [{ type: 'ESG', direction: '부정', title: '국내 담배 규제 강화 논의', date: '2026.07.19' }],
    sparkline: [102000, 102500, 102200, 103000, 103200, 103100, 103500],
    aiBriefing: '국내 규제 우려가 상존하나 높은 해외 수출 성장세와 강력한 배당 정책이 하방을 든든히 지지하고 있습니다.',
  },
  '047050': { name: '포스코인터', weather: 'rainy', direction: 'down', confidence: 'weak', change: -0.5, weight: 15,
    evidences: [{ type: '산업', direction: '부정', title: '중국 경기 둔화에 따른 교역량 감소', date: '2026.07.18' }],
    sparkline: [58000, 57400, 56900, 56200, 55800, 55400, 55000],
    aiBriefing: '글로벌 통상 환경 악화로 트레이딩 부문 수익성이 둔화되었으나 친환경 에너지 사업 확대로 복원력을 확보 중입니다.',
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
};


const DEFAULT_STOCK = {
  name: '종목 분석 리포트', weather: 'cloudy', direction: 'down', confidence: 'weak', change: 0, weight: 0,
  evidences: [{ type: 'AI 분석', direction: '중립', title: '수집된 과거 리스크 이력이 적어 표준 모니터링 모드로 표시 중입니다.' }],
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
            evidences: evRes?.evidences
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
    : (baseStock.aiBriefing || `🤖 [AI 종합 진단 브리핑] ${baseStock.name}(${ticker}) 종목은 머신러닝 분석 결과 최근 리스크 노출도가 업종 평균 수준으로 관측되고 있습니다.`);

  const stock = {
    ...baseStock,
    direction: liveData?.direction || baseStock.direction,
    confidence: liveData?.confidence_tier || baseStock.confidence,
    aiBriefing: aiBriefingText,
    evidences: (liveData?.evidences && liveData.evidences.length > 0) ? liveData.evidences : baseStock.evidences
  };

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
    <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? 'bg-[#080b08] text-[#e2e2e2]' : 'bg-[#f5f6f4] text-[#0f1713]'}`}>
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      <RainEffect weatherStatus={stock.weather} isDark={isDark} />

      <main className="relative z-10 pt-14 pb-10 px-4 max-w-3xl lg:ml-60 lg:w-[calc(100%-240px)] space-y-4">


        <div className="pt-6">
          {/* 종목 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{stock.name}</h1>
              <p className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{ticker}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1.5 ${wCfg.color}`}>
                <Icon name={wCfg.icon} className="w-5 h-5" />
                <span className="text-sm font-black">{wCfg.label}</span>
              </div>
              <span className={`text-sm font-black font-mono ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500'}`}>
                {isUp ? '▲ +' : '▼ '}{stock.change.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 주가 그래프 — 상세 페이지에만 노출 */}
          <div className={`rounded-2xl border p-5 mb-4 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              최근 7거래일 주가
            </p>
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-20 w-full">
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={points + ` ${w},${h} 0,${h}`} fill="url(#stockGrad)" stroke="none" />
              <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex justify-between mt-2">
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {sl[0].toLocaleString()}원
              </span>
              <span className={`text-[10px] font-mono font-black ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500'}`}>
                {sl[sl.length-1].toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 보유 정보 */}
          <div className={`rounded-2xl border p-5 mb-4 grid grid-cols-3 gap-4 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            {[
              { label: '보유 비중', value: `${stock.weight}%` },
              { label: '전망', value: isUp ? '상승' : '하락', color: isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500' },
              { label: '확신도', value: stock.confidence === 'strong' ? '강' : stock.confidence === 'medium' ? '중' : '약' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                <p className={`text-lg font-black mt-0.5 ${item.color || (isDark ? 'text-white' : 'text-[#0f1713]')}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* 위험 근거 */}
          {stock.evidences && stock.evidences.length > 0 && (
            <div className={`rounded-2xl border p-5 mb-4 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className={`text-xs font-black mb-3 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>위험 근거</p>
              <div className="space-y-2">
                {stock.evidences.map((ev, i) => (
                  <div key={i} className={`flex items-start justify-between gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                        ev.direction === '부정' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>{ev.type}</span>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{ev.title}</p>
                    </div>
                    <span className={`text-[10px] font-mono flex-shrink-0 mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {ev.date || '2026.07.23'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* AI 브리핑 */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#0f2318] border-[#3eb489]/20' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-[#3eb489]/20'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="sparkles" className={`w-4 h-4 ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`} />
              <p className={`text-xs font-black ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>AI 브리핑</p>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {stock.aiBriefing}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
