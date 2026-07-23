"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Header from '../../components/layout/Header';
import Icon from '../../components/Icon';
import RainEffect from '../../components/RainEffect';

// 종목별 상세 Mock 데이터
const STOCK_DATA = {
  '005930': { name: '삼성전자', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.5, weight: 25, dropProb: 8.4,
    esgBreakdown: { e: { status: 'safe', text: '친환경 반도체 공정 전환' }, s: { status: 'safe', text: '안전보건 경영 강화' }, g: { status: 'safe', text: '투명 이사회 운용' } },
    sparklines: {
      '1D': [76200, 76400, 76100, 76500, 76700, 76800],
      '1W': [74000, 74500, 75200, 74800, 75500, 76000, 76800],
      '1M': [71000, 72500, 73000, 74200, 75000, 76800],
      '1Y': [65000, 68000, 71500, 73000, 75000, 76800],
    },
    evidences: [
      { type: '산업', direction: '긍정', title: 'HBM 메모리 공급 확대 및 메모리 반도체 실적 개선', date: '2026.07.23' },
      { type: '재무', direction: '긍정', title: '반도체 사업부 3분기 영업이익 전년 대비 45% 상승 전망', date: '2026.07.22' },
    ],
    aiBriefing: '글로벌 AI 반도체 수요 폭증에 따른 HBM 공급 확대로 실적 회복세가 뚜렷합니다. 주가 안정성이 유지되는 대표 우량주입니다.',
  },
  '005380': { name: '현대차', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.9, weight: 18, dropProb: 11.2,
    esgBreakdown: { e: { status: 'safe', text: '수소/전기차 라인업 확대' }, s: { status: 'caution', text: '노사 협상 일정 진행' }, g: { status: 'safe', text: '주주환원 배당 확대' } },
    sparklines: {
      '1D': [251000, 252000, 250500, 252500, 254000],
      '1W': [240000, 242000, 245000, 243000, 248000, 251000, 254000],
      '1M': [230000, 235000, 241000, 246000, 254000],
      '1Y': [200000, 215000, 230000, 242000, 254000],
    },
    evidences: [{ type: '재무', direction: '긍정', title: '북미 하이브리드/전기차 판매 호조 및 주주환원 확대', date: '2026.07.23' }],
    aiBriefing: '하이브리드 라인업의 호조와 고부가가치 RV 판매 증가로 견고한 영업이익률을 유지하고 있습니다.',
  },
  '035420': { name: 'NAVER', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.5, weight: 15, dropProb: 24.8,
    esgBreakdown: { e: { status: 'safe', text: '친환경 데이터센터 운용' }, s: { status: 'caution', text: '플랫폼 독점 공정위 조사' }, g: { status: 'safe', text: '자사주 소각 추진' } },
    sparklines: {
      '1D': [171000, 170500, 170000, 169800, 169500],
      '1W': [175000, 173000, 172000, 174000, 171000, 170000, 169500],
      '1M': [182000, 179000, 176000, 172000, 169500],
      '1Y': [195000, 188000, 180000, 174000, 169500],
    },
    evidences: [{ type: '산업', direction: '부정', title: '플랫폼 커머스 경쟁 심화 및 마케팅비증가', date: '2026.07.21' }],
    aiBriefing: 'C-커머스 공세와 검색 광고 성장세 둔화가 단기 부담 요인이나, 생성형 AI 서비스 가시화로 중장기 모멘텀이 상존합니다.',
  },
  '055550': { name: '신한지주', weather: 'sunny', direction: 'up', confidence: 'medium', change: 1.0, weight: 16, dropProb: 9.5,
    esgBreakdown: { e: { status: 'safe', text: '녹색금융 대출 확대' }, s: { status: 'safe', text: '금융 소비자 보호 강화' }, g: { status: 'safe', text: '분기 배당 정례화' } },
    sparklines: {
      '1D': [48400, 48600, 48500, 48800, 48900],
      '1W': [47200, 47500, 47800, 47600, 48100, 48400, 48900],
      '1M': [45500, 46200, 47000, 47800, 48900],
      '1Y': [41000, 43500, 45000, 47200, 48900],
    },
    evidences: [{ type: '재무', direction: '긍정', title: '금리 방어선 유지 및 대출 포트폴리오 성장세 지속', date: '2026.07.23' }],
    aiBriefing: '고금리 환경에서 순이자마진(NIM) 방어에 성공하며 안정적인 이익 성장이 지속되고 있습니다. 대출 포트폴리오 성장과 건전성 지표 개선이 긍정 요인입니다.',
  },
  '017670': { name: 'SK텔레콤', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.8, weight: 15, dropProb: 8.8,
    esgBreakdown: { e: { status: 'safe', text: '통신 기지국 에너지 절감' }, s: { status: 'safe', text: '통신 장애 예방 시스템' }, g: { status: 'safe', text: '고배당 주주 환원' } },
    sparklines: {
      '1D': [54600, 54800, 54700, 55000, 55100],
      '1W': [52500, 53000, 53400, 53200, 54000, 54500, 55100],
      '1M': [51000, 52200, 53000, 54100, 55100],
      '1Y': [47000, 49500, 51500, 53500, 55100],
    },
    evidences: [{ type: '재무', direction: '긍정', title: 'AI 기반 B2B 서비스 매출 성장 및 5G 가입자 유지', date: '2026.07.22' }],
    aiBriefing: 'AI 인프라 투자와 B2B 서비스 확장으로 통신 본업 외 신성장 동력이 가시화되고 있습니다. 안정적인 배당 정책도 장기 투자자에게 매력적입니다.',
  },
  '005490': { name: 'POSCO홀딩스', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.4, weight: 14, dropProb: 38.5,
    esgBreakdown: { e: { status: 'danger', text: '탄소 배출권 관련 비용 부담' }, s: { status: 'safe', text: '친환경 제철 작업 환경' }, g: { status: 'safe', text: '지주사 이사회 개편' } },
    sparklines: {
      '1D': [276500, 276000, 275800, 275500, 275200],
      '1W': [285000, 282000, 279000, 281000, 278000, 276000, 275200],
      '1M': [298000, 290000, 284000, 279000, 275200],
      '1Y': [340000, 315000, 295000, 282000, 275200],
    },
    evidences: [{ type: '공시', direction: '부정', title: '중국 철강 수요 둔화 및 탄소 배출권 관련 비용 증가 공시', date: '2026.07.21' }],
    aiBriefing: 'POSCO홀딩스는 탄소 배출 규제 강화에 따른 비용 증가 압박이 지속되고 있습니다. 철강 업황 둔화와 맞물려 단기 하락 압력이 있으나, 수소환원제철 전환 투자로 중장기 긍정 신호도 공존합니다.',
  },
  '010950': { name: 'S-Oil', weather: 'rainy', direction: 'down', confidence: 'weak', change: -0.3, weight: 13, dropProb: 44.2,
    esgBreakdown: { e: { status: 'danger', text: '정제 유황 및 탄소배출 이슈' }, s: { status: 'safe', text: '화학 설비 안전 보건' }, g: { status: 'safe', text: '지배구조 투명성' } },
    sparklines: {
      '1D': [73400, 73100, 73000, 72900, 72800],
      '1W': [78000, 76500, 75000, 74200, 73800, 73200, 72800],
      '1M': [81000, 79000, 76500, 74500, 72800],
      '1Y': [88000, 84000, 79000, 75000, 72800],
    },
    evidences: [{ type: 'ESG', direction: '부정', title: '정제마진 하락 및 유가 변동성 확대', date: '2026.07.20' }],
    aiBriefing: '정제마진 하락과 글로벌 유가 변동성 확대로 단기 실적 압박이 예상됩니다. 샤힌 프로젝트(석유화학 설비) 완공 이후의 중장기 성장 기대감은 유지됩니다.',
  },
  '028260': { name: '삼성물산', weather: 'sunny', direction: 'up', confidence: 'weak', change: 0.1, weight: 14, dropProb: 12.0,
    esgBreakdown: { e: { status: 'safe', text: '친환경 건축 자재 확대' }, s: { status: 'safe', text: '건설 현장 안전관리' }, g: { status: 'safe', text: '주주가치 제고' } },
    sparklines: {
      '1D': [116400, 116600, 116500, 116700, 116800],
      '1W': [115000, 115500, 116000, 115800, 116200, 116500, 116800],
      '1M': [112000, 113500, 115000, 116000, 116800],
      '1Y': [105000, 109000, 112000, 115000, 116800],
    },
    evidences: [{ type: '산업', direction: '긍정', title: '해외 건설 수주 잔고 확대', date: '2026.07.23' }],
    aiBriefing: '건설 부문 해외 수주 회복과 상사 부문 자원 트레이딩 이익 개선으로 안정적인 실적을 유지하고 있습니다.',
  },
  '000270': { name: '기아', weather: 'sunny', direction: 'up', confidence: 'weak', change: 0.2, weight: 14, dropProb: 10.5,
    esgBreakdown: { e: { status: 'safe', text: '전기차 EV 시리즈 확대' }, s: { status: 'safe', text: '글로벌 품질 관리' }, g: { status: 'safe', text: '자사주 소각 추진' } },
    sparklines: {
      '1D': [111800, 112000, 112100, 112200, 112300],
      '1W': [109000, 110000, 109500, 111000, 112000, 111500, 112300],
      '1M': [104000, 107000, 110000, 111500, 112300],
      '1Y': [92000, 98000, 105000, 110000, 112300],
    },
    evidences: [{ type: '산업', direction: '긍정', title: '전기차 JV 확대 소식 및 북미/유럽 수출 회복', date: '2026.07.22' }],
    aiBriefing: '전기차 전환 가속화와 SUV 라인업 강화로 글로벌 수요가 확대되고 있습니다. 원화 약세 효과도 수출 실적에 긍정적입니다.',
  },
  '068270': { name: '셀트리온', weather: 'cloudy', direction: 'down', confidence: 'weak', change: -0.2, weight: 14, dropProb: 22.1,
    esgBreakdown: { e: { status: 'safe', text: '바이오 폐기물 처리 강화' }, s: { status: 'safe', text: '의약품 접근성 확대' }, g: { status: 'caution', text: '합병 이슈 모니터링' } },
    sparklines: {
      '1D': [201500, 202000, 201800, 202200, 202400],
      '1W': [195000, 197000, 199000, 198000, 200000, 201000, 202400],
      '1M': [188000, 193000, 198000, 200000, 202400],
      '1Y': [175000, 185000, 194000, 200000, 202400],
    },
    evidences: [{ type: '재무', direction: '부정', title: '임상 3상 데이터 승인 일정 지연', date: '2026.07.19' }],
    aiBriefing: '임상 3상 중간 결과 발표 지연이 일부 불확실성을 키우고 있으나, 기존 바이오시밀러 라인업의 글로벌 판매 호조로 기초 체력은 견고합니다.',
  },
  '000660': { name: 'SK하이닉스', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.8, weight: 22, dropProb: 6.2,
    esgBreakdown: { e: { status: 'safe', text: '저전력 HBM3e/4 개발' }, s: { status: 'safe', text: '안전보건 최고등급' }, g: { status: 'safe', text: '독립적 이사회 수립' } },
    sparklines: {
      '1D': [187000, 188000, 187500, 189000, 189500],
      '1W': [172000, 175000, 174000, 178000, 182000, 186000, 189500],
      '1M': [160000, 168000, 175000, 183000, 189500],
      '1Y': [130000, 150000, 168000, 180000, 189500],
    },
    evidences: [{ type: '산업', direction: '긍정', title: 'HBM4 대형 수주 계약 확정 및 글로벌 AI 반도체 수요 급증', date: '2026.07.23' }],
    aiBriefing: 'SK하이닉스는 차세대 HBM 수주를 독점적으로 확대하며 메모리 반도체 업황 개선을 선도하고 있습니다. 강력한 기술 우위와 매출 성장이 관측됩니다.',
  },
  '035720': { name: '카카오', weather: 'thunder', direction: 'down', confidence: 'strong', change: -1.2, weight: 18, dropProb: 68.5,
    esgBreakdown: { e: { status: 'safe', text: '카카오 데이터센터 서버 절전' }, s: { status: 'danger', text: '골목상권 상생 갈등' }, g: { status: 'danger', text: '경영진 사법 리스크' } },
    sparklines: {
      '1D': [38200, 38000, 37900, 37800, 37900],
      '1W': [42000, 41200, 40500, 39800, 39200, 38500, 37900],
      '1M': [46000, 43500, 41000, 39000, 37900],
      '1Y': [55000, 48000, 43000, 39500, 37900],
    },
    evidences: [{ type: 'ESG', direction: '부정', title: '주요 임원 사법 리스크 및 광고/플랫폼 성장률 둔화', date: '2026.07.21' }],
    aiBriefing: '경영진 법적 리스크 이슈와 지배구조 지적 등이 주가 하방 압력을 강하게 부추기고 있습니다. 신사업 가시화 전까지는 주의가 필요합니다.',
  },
};

const DEFAULT_STOCK = {
  name: '종목 분석 리포트', weather: 'cloudy', direction: 'down', confidence: 'weak', change: 0, weight: 15, dropProb: 15.0,
  esgBreakdown: { e: { status: 'safe', text: '환경 기준 충족' }, s: { status: 'safe', text: '사회 가치 이행' }, g: { status: 'safe', text: '이사회 운용 준수' } },
  sparklines: {
    '1D': [100, 101, 100, 102],
    '1W': [100, 102, 101, 103, 105],
    '1M': [95, 98, 101, 105],
    '1Y': [90, 95, 100, 105],
  },
  evidences: [{ type: 'AI 분석', direction: '중립', title: '수집된 과거 리스크 이력이 적어 표준 모니터링 모드로 표시 중입니다.', date: '2026.07.23' }],
  aiBriefing: '해당 종목은 현재 기본 안전 지표 위주로 모니터링 중이며, 추가 데이터 수집이 진행됨에 따라 실시간 브리핑이 업데이트됩니다.',
};

const WEATHER_CFG = {
  sunny:   { icon: 'sun',       label: '맑음', color: 'text-[#3eb489]' },
  cloudy:  { icon: 'cloud',     label: '구름', color: 'text-slate-400' },
  rainy:   { icon: 'cloudRain', label: '비',   color: 'text-sky-400'   },
  thunder: { icon: 'zap',       label: '번개', color: 'text-rose-400'  },
};

export default function StockDetailPage() {
  const { ticker } = useParams();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // 차트 선택 탭 ('1D', '1W', '1M', '1Y')
  const [selectedPeriod, setSelectedPeriod] = useState('1W');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // 실시간 하락률 슬라이더 상태 (기본 -5% 하락 시 영향도 연산)
  const [simDropPct, setSimDropPct] = useState(5);

  // AI 예측 원리 팝업 모달 상태
  const [showAiModal, setShowAiModal] = useState(false);

  const baseStock = STOCK_DATA[ticker] || DEFAULT_STOCK;
  const stock = { ...baseStock, evidences: baseStock.evidences || [] };
  const wCfg = WEATHER_CFG[stock.weather] || WEATHER_CFG.cloudy;
  const isUp = stock.direction === 'up';

  // 기간별 주가 데이터 및 툴팁 포인트 연산
  const chartData = stock.sparklines[selectedPeriod] || stock.sparklines['1W'];
  const chartW = 340, chartH = 90;
  const minP = Math.min(...chartData), maxP = Math.max(...chartData), rangeP = (maxP - minP) || 1;

  const points = chartData.map((v, i) => {
    const x = (i / (chartData.length - 1)) * chartW;
    const y = chartH - ((v - minP) / rangeP) * (chartH * 0.75) - chartH * 0.12;
    return { x, y, val: v };
  });
  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

  const lineColor = isDark ? (isUp ? '#69dbad' : '#ff8b8b') : (isUp ? '#3eb489' : '#ef4444');

  // 내 자산 실시간 영향도 계산 (가상 전체자산 4,000만원 기준)
  const userTotalAsset = 40000000;
  const stockHoldingValue = Math.round((userTotalAsset * stock.weight) / 100);
  const impactLossValue = Math.round(stockHoldingValue * (simDropPct / 100));

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? 'bg-[#080b08] text-[#e2e2e2]' : 'bg-[#f5f6f4] text-[#0f1713]'}`}>
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      <RainEffect weatherStatus={stock.weather} isDark={isDark} />

      <main className="relative z-10 pt-14 pb-10 px-4 max-w-6xl lg:ml-60 lg:w-[calc(100%-240px)]">

        {/* ── 🌟 상단 종목 히어로 헤더 타일 ── */}
        <div className={`mt-6 mb-4 p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-[#1e2220] border-white/5 shadow-md' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-100 text-[#0f1713]'
              }`}>
                {stock.name.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{stock.name}</h1>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                    {ticker}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ESG Materiality 기반 리스크 진단 보고서
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <div className={`flex items-center gap-1.5 ${wCfg.color}`}>
                  <Icon name={wCfg.icon} className="w-5 h-5" />
                  <span className="text-base font-black">{wCfg.label}</span>
                </div>
                <span className={`text-sm font-black font-mono mt-0.5 ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-rose-500'}`}>
                  {isUp ? '▲ +' : '▼ '}{stock.change.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2컬럼 레이아웃 (좌측 8칸 메인 분석 / 우측 4칸 최상단 자산 계산기 & AI 지표) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* ┌── 👈 좌측 메인 분석 영역 (8컬럼) ──┐ */}
          <div className="lg:col-span-8 space-y-4">

            {/* 📈 인터랙티브 주가 추이 차트 카드 */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    인터랙티브 주가 추이
                  </h2>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    그래프 데이터 지점에 마우스를 올리면 정확한 주가가 표시됩니다.
                  </p>
                </div>

                {/* 기간 선택 탭 (1D / 1W / 1M / 1Y) */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                  {['1D', '1W', '1M', '1Y'].map(t => (
                    <button
                      key={t}
                      onClick={() => { setSelectedPeriod(t); setHoveredIdx(null); }}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                        selectedPeriod === t
                          ? (isDark ? 'bg-[#3eb489] text-white shadow-sm' : 'bg-[#3eb489] text-white shadow-sm')
                          : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* SVG 차트 */}
              <div className="relative">
                <svg
                  width="100%"
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  preserveAspectRatio="none"
                  className="h-28 w-full cursor-crosshair overflow-visible"
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <defs>
                    <linearGradient id="stockGradDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polyline points={pointsStr + ` ${chartW},${chartH} 0,${chartH}`} fill="url(#stockGradDash)" stroke="none" />
                  <polyline points={pointsStr} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {points.map((p, idx) => (
                    <g key={idx} onMouseEnter={() => setHoveredIdx(idx)}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredIdx === idx ? 5 : 2.5}
                        fill={lineColor}
                        className="transition-all duration-200"
                      />
                      <rect
                        x={p.x - 15}
                        y={0}
                        width={30}
                        height={chartH}
                        fill="transparent"
                        className="cursor-pointer"
                      />
                    </g>
                  ))}
                </svg>

                {/* 툴팁 */}
                {hoveredIdx !== null && points[hoveredIdx] && (
                  <div
                    className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-black font-mono border shadow-lg pointer-events-none ${
                      isDark ? 'bg-slate-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    {points[hoveredIdx].val.toLocaleString()}원
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
                <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  최저 {minP.toLocaleString()}원
                </span>
                <span className={`text-xs font-mono font-black ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-rose-500'}`}>
                  최고 {maxP.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 💡 AI 종합 예측 브리핑 카드 */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <h2 className={`text-sm font-black mb-2 flex items-center gap-1.5 ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>
                <Icon name="sparkles" className="w-4 h-4" />
                AI 종합 예측 브리핑
              </h2>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {stock.aiBriefing}
              </p>
            </div>

            {/* 📋 핵심 위험 근거 타임라인 카드 */}
            {stock.evidences && stock.evidences.length > 0 && (
              <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <h2 className={`text-sm font-black mb-3 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>핵심 위험 근거</h2>
                <div className="space-y-2.5">
                  {stock.evidences.map((ev, i) => (
                    <div key={i} className={`flex items-start justify-between gap-3 p-3.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'}`}>
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                          ev.direction === '부정' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>{ev.type}</span>
                        <p className={`text-xs leading-relaxed font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{ev.title}</p>
                      </div>
                      <span className={`text-[11px] font-mono flex-shrink-0 mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {ev.date || '2026.07.23'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* └── 👉 우측 스마트 사이드 영역 (4컬럼 - 최상단 자산 계산기 재배치) ──┘ */}
          <div className="lg:col-span-4 space-y-4">

            {/* 💰 1. [맨 최상단 재배치] 내 자산 실시간 영향도 체감 시뮬레이터 카드 */}
            <div className={`rounded-2xl border p-5 transition-all ${
              isDark ? 'bg-[#1e2220] border-emerald-500/30 shadow-[0_4px_20px_rgba(62,180,137,0.08)]' : 'bg-white border-emerald-200 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💰</span>
                  <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    내 자산 실시간 영향도
                  </h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-[#3eb489]/20 text-[#69dbad]' : 'bg-emerald-100 text-[#2d966e]'
                }`}>
                  라이브 체감
                </span>
              </div>

              {/* 자산 현황 요약 */}
              <div className={`p-3 rounded-xl border mb-3 flex items-center justify-between ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>내 포트폴리오 비중</p>
                  <p className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    {stock.weight}%
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>평가 금액</p>
                  <p className={`text-sm font-black font-mono ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {(stockHoldingValue / 10000).toLocaleString()}만 원
                  </p>
                </div>
              </div>

              {/* 하락율 조절 인터랙티브 슬라이더 */}
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-rose-950/20 border-rose-500/20 text-rose-300' : 'bg-rose-50/70 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                  <span>주가 <strong className="font-mono text-rose-500">{simDropPct}%</strong> 하락 시 내 자산 변동</span>
                  <span className="font-black font-mono text-sm text-rose-500">
                    -{(impactLossValue).toLocaleString()}원
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={simDropPct}
                  onChange={(e) => setSimDropPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-rose-200 dark:bg-rose-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[9px] text-rose-400 mt-1">
                  <span>-1%</span>
                  <span>-5% (표준)</span>
                  <span>-20% (급락)</span>
                </div>
              </div>
            </div>

            {/* 🤖 2. XGBoost -10% 하락 위험 확률 AI 뱃지 카드 */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  하락 위험 확률
                </span>
                <button
                  onClick={() => setShowAiModal(true)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                    isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  AI 원리 💡
                </button>
              </div>

              <div className={`p-4 rounded-xl text-center border ${
                stock.dropProb < 20
                  ? (isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                  : (isDark ? 'bg-rose-950/20 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700')
              }`}>
                <p className="text-[10px] font-bold opacity-80 mb-1">20거래일 내 -10% 하락 확률</p>
                <p className="text-2xl font-black font-mono">
                  {stock.dropProb}%
                </p>
                <span className={`inline-block mt-2 text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  stock.dropProb < 20 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {stock.dropProb < 20 ? '안전 모니터링 🟢' : '주의 모니터링 🔴'}
                </span>
              </div>
            </div>

            {/* 🌿 3. 3대 ESG 영역별 브레이크다운 카드 */}
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <h3 className={`text-xs font-black mb-3 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                3대 ESG 영역별 브레이크다운
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'e', title: '🌿 환경(E)', item: stock.esgBreakdown?.e },
                  { key: 's', title: '🤝 사회(S)', item: stock.esgBreakdown?.s },
                  { key: 'g', title: '🏛️ 지배구조(G)', item: stock.esgBreakdown?.g },
                ].map(pillar => {
                  const isSafe = pillar.item?.status === 'safe';
                  const isDanger = pillar.item?.status === 'danger';
                  return (
                    <div
                      key={pillar.key}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isSafe
                          ? (isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/60 border-emerald-200')
                          : isDanger
                          ? (isDark ? 'bg-rose-950/20 border-rose-500/20' : 'bg-rose-50/60 border-rose-200')
                          : (isDark ? 'bg-amber-950/20 border-amber-500/20' : 'bg-amber-50/60 border-amber-200')
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span className={`text-[10px] font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{pillar.title}</span>
                        <p className={`text-[10px] font-bold leading-tight truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {pillar.item?.text || '표준 모니터링 이행'}
                        </p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isSafe ? 'bg-emerald-500/20 text-emerald-400' : isDanger ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {isSafe ? '맑음 🟢' : isDanger ? '위험 🔴' : '주의 🟡'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ── 💡 AI 예측 원리 모달 팝업 ── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#181b19] border-white/10 text-white' : 'bg-white border-slate-200 text-[#0f1713]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black flex items-center gap-2">
                💡 XGBoost AI 예측 산출 원리
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                <strong>1. Materiality(1/0) 판정</strong>: 해당 업종에 미치는 주요 ESG 이슈(탄소배출, 지배구조 등)를 이진 가중치로 분리 집계합니다.
              </p>
              <p>
                <strong>2. XGBoost ML 모델 추론</strong>: 최근 20거래일 내 주가가 10% 이상 하락할 확률을 가격, 거시경제 지표와 함께 앙상블 학습하여 도출합니다.
              </p>
              <p>
                <strong>3. 예측 적중률</strong>: 과거 1,382건의 학습 데이터 검증 결과 Accuracy 88.4%, AUC-ROC 0.91의 높은 정확도를 유지하고 있습니다.
              </p>
            </div>

            <button
              onClick={() => setShowAiModal(false)}
              className="w-full py-3 rounded-xl bg-[#3eb489] text-white text-xs font-black hover:bg-[#2d966e] transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
