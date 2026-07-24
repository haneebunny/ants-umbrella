"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import RainEffect from '../../components/RainEffect';
import Icon from '../../components/Icon';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const TICKER_NAME_MAP = {
  '000660': 'SK하이닉스',
  '005930': '삼성전자',
  '005380': '현대차',
  '035420': 'NAVER',
  '055550': '신한지주',
  '017670': 'SK텔레콤',
  '005490': 'POSCO홀딩스',
  '010950': 'S-Oil',
  '028260': '삼성물산',
  '000270': '기아',
  '068270': '셀트리온',
  '035720': '카카오',
  '051910': 'LG화학',
  '003550': 'LG',
  '036570': '엔씨소프트',
  '373220': 'LG에너지솔루션',
  '006400': '삼성SDI',
  '086520': '에코프로',
  '247540': '에코프로비엠',
  '196170': '알테오젠',
  '032830': '삼성생명',
  '033780': 'KT&G',
  '105560': 'KB금융',
  '047050': '포스코인터내셔널',
  '036460': '한국가스공사',
  '096770': '한국가스공사',
  '009150': '삼성전기',
  '011200': '한진',
  '251270': '넷마블',
};

// 마크다운 볼드 파서
const renderMarkdownBold = (text) => {
  if (!text) return '';
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    return index % 2 === 1 ? <strong key={index} className="font-extrabold">{part}</strong> : part;
  });
};

/** 
 * 가독성을 극대화한 깔끔한 기간별 주가 데이터 포인트 생성 함수
 */
function buildPeriodSparklines(basePrice, high52, low52, direction = 'down') {
  const isUp = direction === 'up';
  
  // 1D: 7개 타임스탬프 (오늘 하루)
  const d1 = isUp
    ? [basePrice * 0.99, basePrice * 0.993, basePrice * 0.991, basePrice * 0.996, basePrice * 0.994, basePrice * 0.998, basePrice]
    : [basePrice * 1.01, basePrice * 1.008, basePrice * 1.006, basePrice * 1.003, basePrice * 1.004, basePrice * 1.001, basePrice];

  // 1W: 7개 거래일
  const w1 = isUp
    ? [basePrice * 0.96, basePrice * 0.975, basePrice * 0.968, basePrice * 0.982, basePrice * 0.98, basePrice * 0.99, basePrice]
    : [basePrice * 1.04, basePrice * 1.025, basePrice * 1.03, basePrice * 1.015, basePrice * 1.02, basePrice * 1.005, basePrice];

  // 1M: 8개 주차 포인트
  const m1 = isUp
    ? [basePrice * 0.91, basePrice * 0.93, basePrice * 0.925, basePrice * 0.95, basePrice * 0.94, basePrice * 0.97, basePrice * 0.985, basePrice]
    : [basePrice * 1.08, basePrice * 1.06, basePrice * 1.07, basePrice * 1.04, basePrice * 1.05, basePrice * 1.02, basePrice * 1.01, basePrice];

  // 1Y: 10개 월별 포인트
  const y1 = isUp
    ? [low52 * 1.02, low52 * 1.1, basePrice * 0.85, basePrice * 0.88, basePrice * 0.92, basePrice * 0.9, basePrice * 0.95, high52 * 0.96, basePrice * 0.98, basePrice]
    : [high52 * 0.98, high52 * 0.95, basePrice * 1.15, basePrice * 1.12, basePrice * 1.08, basePrice * 1.06, basePrice * 1.04, low52 * 1.05, basePrice * 1.02, basePrice];

  return {
    '1D': d1.map(v => Math.round(v)),
    '1W': w1.map(v => Math.round(v)),
    '1M': m1.map(v => Math.round(v)),
    '1Y': y1.map(v => Math.round(v)),
  };
}

const STOCK_DATA = {
  '005930': {
    name: '삼성전자', marketCap: '468.0조', high52w: '88,800원', low52w: '55,000원', currentPrice: '78,400원', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.2, weight: 28, dropProb: 8.4,
    esgBreakdown: {
      e: { status: 'safe', text: 'RE100 달성 가속화 및 친환경 반도체 공정 98% 전환' },
      s: { status: 'safe', text: '글로벌 안전보건 모니터링 고도화 및 협력사 상생 펀드 확대' },
      g: { status: 'safe', text: '독립 사외이사 비율 60% 확보 및 주주환원 자사주 소각 추진' }
    },
    sparklines: buildPeriodSparklines(78400, 88800, 55000, 'up'),
    evidences: [
      { type: '재무', direction: '긍정', title: 'HBM3E 12단 메인 고객사 공급 본격화에 따른 영업이익률 개선', date: '2026.07.24', link: '#' },
      { type: '공시', direction: '긍정', title: '단기 설비 투자 및 글로벌 자회사 차입금 일부 상환 완료', date: '2026.07.24', link: '#' },
      { type: '뉴스', direction: '긍정', title: '파운드리 2나노 수율 안정화 속도... 차세대 가속기 수주 청신호', date: '2026.07.23', link: '#' },
    ],
    aiBriefing: '삼성전자는 한 달 내 주가가 떨어질 위험이 8.4%로 매우 안전한 상태예요! HBM3E 공급 본격화와 메모리 업황 회복이 실적 상승을 든든히 뒷받침해 주고 있어서 우려하지 않으셔도 좋습니다. ☀️',
  },
  '000660': {
    name: 'SK하이닉스', marketCap: '138.0조', high52w: '240,000원', low52w: '110,000원', currentPrice: '189,500원', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.8, weight: 22, dropProb: 6.2,
    esgBreakdown: {
      e: { status: 'safe', text: '용인 반도체 클러스터 폐수 재활용률 95% 달성' },
      s: { status: 'safe', text: '반도체 인재 육성 아카데미 운영 및 지역사회 상생' },
      g: { status: 'safe', text: 'ESG 위원회 신설 및 투명 경영 지표 공시 강화' }
    },
    sparklines: buildPeriodSparklines(189500, 240000, 110000, 'up'),
    evidences: [
      { type: '재무', direction: '긍정', title: 'AI 가속기용 HBM4 1등 독점 지위 유지에 따른 역대 최대 매출', date: '2026.07.24', link: '#' },
      { type: '공시', direction: '긍정', title: '용인 반도체 클러스터 1기 팹 신설 시설 투자 확정', date: '2026.07.24', link: '#' },
    ],
    aiBriefing: 'SK하이닉스는 한 달 내 주가가 떨어질 위험이 6.2%로 극도로 안전한 독주 체제예요! HBM 프리미엄과 AI 서버용 메모리 독점 수요가 매출을 크게 끌어올리고 있습니다. 🚀',
  },
  '005380': {
    name: '현대차', marketCap: '52.0조', high52w: '290,000원', low52w: '180,000원', currentPrice: '245,000원', weather: 'sunny', direction: 'up', confidence: 'strong', change: 1.5, weight: 18, dropProb: 11.2,
    esgBreakdown: {
      e: { status: 'safe', text: '전기차 전용 공장 수소 가공 연료전지 시스템 도입' },
      s: { status: 'safe', text: '노사 분규 제로 달성 및 글로벌 품질 안전 평가 최고 등급' },
      g: { status: 'safe', text: '배당성향 25% 상향 및 분기 배당 제도 정착 완료' }
    },
    sparklines: buildPeriodSparklines(245000, 290000, 180000, 'up'),
    evidences: [
      { type: '재무', direction: '긍정', title: '북미 하이브리드(HEV) 판매 비중 폭증으로 분기 최대 이익', date: '2026.07.24', link: '#' },
      { type: '공시', direction: '긍정', title: '조지아 신공장(HMGMA) 가동률 90% 돌파 및 인센티브 확보', date: '2026.07.23', link: '#' },
    ],
    aiBriefing: '현대차는 한 달 내 주가가 떨어질 위험이 11.2%로 아주 편안한 흐름이에요. 북미 하이브리드 판매 호조와 든든한 주주환원 배당 정책이 차곡차곡 쌓이고 있습니다. 🚘',
  },
  '035420': {
    name: 'NAVER', marketCap: '29.8조', high52w: '230,000원', low52w: '160,000원', currentPrice: '182,000원', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.5, weight: 14, dropProb: 24.8,
    esgBreakdown: {
      e: { status: 'safe', text: '자체 데이터센터 각 세종 100% 친환경 수열 냉각 도입' },
      s: { status: 'caution', text: '플랫폼 커머스 소상공인 수수료 관련 국회 청문회 출석 요구' },
      g: { status: 'safe', text: '자사주 1% 소각 완료 및 이사회 독립 위원회 투명 운영' }
    },
    sparklines: buildPeriodSparklines(182000, 230000, 160000, 'down'),
    evidences: [
      { type: '뉴스', direction: '부정', title: '국내 검색 점유율 소폭 변동 및 플랫폼 수수료 규제 법안 발의', date: '2026.07.24', link: '#' },
      { type: '공시', direction: '긍정', title: 'AI 하이퍼클로바X B2B 매출 전년 대비 45% 성장', date: '2026.07.22', link: '#' },
    ],
    aiBriefing: 'NAVER는 한 달 내 주가가 떨어질 위험이 24.8%로 약간의 구름이 끼어있어요. 검색과 AI 본업은 건재하지만 플랫폼 규제 관련 뉴스 여파가 잠시 조정을 유발하고 있으니 관망을 추천해요. ⛅',
  },
  '051910': {
    name: 'LG화학', marketCap: '24.5조', high52w: '450,000원', low52w: '280,000원', currentPrice: '345,000원', weather: 'rainy', direction: 'down', confidence: 'medium', change: -1.8, weight: 10, dropProb: 28.5,
    esgBreakdown: {
      e: { status: 'caution', text: '석유화학 여수 공장 가동률 조정 및 탄소 배출권 부담 증가' },
      s: { status: 'safe', text: '배터리 소재 안전 관리 인증 및 글로벌 사업장 무재해' },
      g: { status: 'caution', text: 'LG에너지솔루션 보유 지분 매각 타당성 검토 관련 시장 우려' }
    },
    sparklines: buildPeriodSparklines(345000, 450000, 280000, 'down'),
    evidences: [
      { type: '공시', direction: '부정', title: '교환사채(EB) 2,000억 발행 추진에 따른 오버행 주가 압박', date: '2026.07.24', link: '#' },
      { type: '뉴스', direction: '부정', title: '글로벌 전기차 캐즘 여파로 양극재 출하량 일시적 감소', date: '2026.07.23', link: '#' },
    ],
    aiBriefing: 'LG화학은 한 달 내 주가가 떨어질 위험이 28.5%로 주의가 필요해요! 교환사채 발행과 2차전지 업황 캐즘 불확실성이 겹쳐 있으므로 당분간 서두르지 말고 천천히 지켜보시는 것을 권합니다. 🌧️',
  },
};

const DEFAULT_STOCK = {
  name: '종목 분석 리포트', marketCap: '10.0조', high52w: '100,000원', low52w: '80,000원', currentPrice: '90,000원', weather: 'cloudy', direction: 'down', confidence: 'weak', change: 0, weight: 15, dropProb: 15.0,
  esgBreakdown: { e: { status: 'safe', text: '환경 기준 충족' }, s: { status: 'safe', text: '사회 가치 이행' }, g: { status: 'safe', text: '이사회 운용 준수' } },
  sparklines: buildPeriodSparklines(90000, 100000, 80000, 'down'),
  evidences: [{ type: 'AI 분석', direction: '중립', title: '수집된 과거 리스크 이력이 적어 표준 모니터링 모드로 표시 중입니다.', date: '2026.07.23' }],
  aiBriefing: '현재 해당 종목은 기본 안전 지표 위주로 모니터링 중입니다. 추가 데이터 수집에 따라 리포트가 업데이트됩니다.',
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
  const { isDark } = useTheme();

  // 라이브 API 데이터 연동 상태
  const [liveData, setLiveData] = useState(null);

  // 차트 기간 선택 탭 ('1D', '1W', '1M', '1Y')
  const [selectedPeriod, setSelectedPeriod] = useState('1W');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // 하락률 조절 슬라이더 (-5% 기본)
  const [simDropPct, setSimDropPct] = useState(5);
  // 가상 매수 금액 선택
  const [simVirtualAmount, setSimVirtualAmount] = useState(5000000);

  // AI 예측 원리 모달 상태
  const [showAiModal, setShowAiModal] = useState(false);

  // 📡 실시간 백엔드 DB/API 데이터 연동
  useEffect(() => {
    if (!ticker) return;
    async function fetchLiveData() {
      try {
        const [scoreRes, weatherRes, evRes] = await Promise.all([
          fetch(`${API_BASE}/risk-score/${ticker}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE}/api/dashboard-weather?tickers=${ticker}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE}/risk-evidences/${ticker}`).then(r => r.ok ? r.json() : null),
        ]);

        if (scoreRes || weatherRes || evRes) {
          const weatherItem = Array.isArray(weatherRes) ? weatherRes[0] : null;
          let rawBriefing = evRes?.ai_briefing || '';
          rawBriefing = rawBriefing.replace(/^💡\s*\[AI 진단\]\s*/, '').replace(/^\[AI 진단\]\s*/, '');

          setLiveData({
            prob_up: scoreRes?.prob_up,
            dropProb: scoreRes?.prob_up !== undefined ? Math.round((1 - scoreRes.prob_up) * 1000) / 10 : undefined,
            direction: weatherItem?.direction || scoreRes?.direction,
            weather: weatherItem?.weather,
            change: weatherItem?.change,
            currentPrice: weatherItem?.price !== undefined ? `${weatherItem.price.toLocaleString()}원` : scoreRes?.price !== undefined ? `${scoreRes.price.toLocaleString()}원` : undefined,
            aiBriefing: rawBriefing || undefined,
            evidences: evRes?.evidences,
          });
        }
      } catch (e) {
        console.warn('[StockDetail] Live backend API fetch fallback:', e);
      }
    }
    fetchLiveData();
  }, [ticker]);

  const fallbackName = TICKER_NAME_MAP[ticker] || '종목 분석 리포트';
  const baseStock = STOCK_DATA[ticker] || { ...DEFAULT_STOCK, name: fallbackName };
  const currentDropProb = liveData?.dropProb !== undefined && liveData.dropProb !== null ? liveData.dropProb : baseStock.dropProb;
  const currentDirection = liveData?.direction || baseStock.direction;

  const syncedAiBriefing = (liveData?.aiBriefing && !liveData.aiBriefing.includes('준비 중입니다'))
    ? liveData.aiBriefing
    : `${baseStock.name} 종목은 한 달 내 주가가 떨어질 위험이 ${currentDropProb}%로 ${
        currentDropProb < 20
          ? '매우 안전한 상태예요! 회사의 탄탄한 실적이 주가를 든든히 지원하고 있습니다.'
          : '주의가 필요해요! 최근 악재 신호가 관측되고 있으니 매수 전 신중히 관망해 보세요.'
      }`;

  const stock = {
    ...baseStock,
    currentPrice: liveData?.currentPrice || baseStock.currentPrice,
    weather: liveData?.weather || baseStock.weather,
    direction: currentDirection,
    change: liveData?.change !== undefined && liveData.change !== null ? liveData.change : baseStock.change,
    dropProb: currentDropProb,
    aiBriefing: syncedAiBriefing,
    evidences: (liveData?.evidences && liveData.evidences.length > 0) ? liveData.evidences : (baseStock.evidences || []),
  };

  const decisionEvidences = stock.evidences?.filter(ev => ev.type === '공시' || ev.type === '재무') || [];
  const newsEvidences     = stock.evidences?.filter(ev => ev.type !== '공시' && ev.type !== '재무') || [];

  const wCfg = WEATHER_CFG[stock.weather] || WEATHER_CFG.cloudy;
  const isUp = stock.direction === 'up';

  // 기간별 주가 데이터 및 툴팁 연산
  const chartData = stock.sparklines[selectedPeriod] || stock.sparklines['1W'];
  const chartW = 600, chartH = 120;
  const minP = Math.min(...chartData), maxP = Math.max(...chartData), rangeP = (maxP - minP) || 1;
  const isPeriodUp = chartData.length >= 2 ? (chartData[chartData.length - 1] >= chartData[0]) : isUp;

  const points = chartData.map((v, i) => {
    const x = (i / (chartData.length - 1)) * chartW;
    const y = chartH - ((v - minP) / rangeP) * (chartH * 0.72) - chartH * 0.14;
    return { x, y, val: v };
  });
  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
  const lineColor = isDark ? (isPeriodUp ? '#69dbad' : '#ff8b8b') : (isPeriodUp ? '#3eb489' : '#ef4444');

  // 내 자산 실시간 / 가상 매수 리스크 체감 연산
  const isHeld = Boolean(stock.weight && stock.weight > 0);
  const userTotalAsset = 40000000;
  const stockHoldingValue = Math.round((userTotalAsset * (stock.weight || 0)) / 100);
  const impactLossValue = isHeld
    ? Math.round(stockHoldingValue * (simDropPct / 100))
    : Math.round(simVirtualAmount * (simDropPct / 100));

  return (
    <div className="w-full relative">
      <RainEffect weatherStatus={stock.weather} isDark={isDark} />

      {/* ── 🚀 풀 화면 메인 컨테이너 ── */}
      <main className="relative z-10 pt-2 pb-10 px-1 max-w-[1920px]">

        {/* ── 🌟 [통합 1] 단일 통합 헬스체크 히어로 타일 ── */}
        <div className={`mt-2 mb-4 p-5 sm:p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-[#141715] border-white/10 shadow-lg' : 'bg-white border-slate-100 shadow-sm'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* 좌측 종목 기본 정보 */}
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{stock.name}</h1>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${isDark ? 'bg-white/15 text-slate-200 border border-white/10' : 'bg-slate-200 text-slate-600'}`}>
                    {ticker}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-mono">
                  <span className={`font-black text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{stock.currentPrice}</span>
                  <span className={`font-bold flex items-center gap-0.5 ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-rose-500'}`}>
                    {isUp ? '▲' : '▼'} {stock.change > 0 ? `+${stock.change}%` : `${stock.change}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* 우측 4분할 헬스체크 KPI 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>시가총액</p>
                <p className={`text-sm font-black font-mono mt-0.5 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{stock.marketCap}</p>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>52주 최고가</p>
                <p className={`text-sm font-black font-mono mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{stock.high52w}</p>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>52주 최저가</p>
                <p className={`text-sm font-black font-mono mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{stock.low52w}</p>
              </div>
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-rose-950/40 border-rose-500/30' : 'bg-rose-50 border-rose-200'}`}>
                <p className={`text-[10px] font-bold ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>20일 내 하락확률</p>
                <p className="text-sm font-black font-mono mt-0.5 text-rose-500">{stock.dropProb}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 🤖 AI 종합 진단 브리핑 카드 ── */}
        <div className={`mb-6 p-5 sm:p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-[#1a231e] border-[#3eb489]/30 shadow-lg' : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
        }`}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#3eb489] text-white flex items-center justify-center flex-shrink-0 shadow-md font-black">
              🤖
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className={`text-sm font-black ${isDark ? 'text-[#69dbad]' : 'text-[#2d966e]'}`}>
                  AI 리스크 분석 브리핑
                </h3>
                <button
                  onClick={() => setShowAiModal(true)}
                  className={`text-[11px] font-bold underline flex items-center gap-1 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Icon name="info" className="w-3.5 h-3.5" />
                  예측 원리 보기
                </button>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {renderMarkdownBold(stock.aiBriefing)}
              </p>
            </div>
          </div>
        </div>

        {/* ── 📊 모던 2컬럼 스마트 메인 레이아웃 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 👈 좌측 대형 인터랙티브 차트 & ESG 브레이크다운 (2 컬럼) */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. 대형 차트 카드 */}
            <div className={`p-5 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#141715] border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>주가 추이 차트</h3>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    선택한 기간 동안의 시세 움직임을 확인하세요.
                  </p>
                </div>
                {/* 기간 선택 탭 */}
                <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                  {['1D', '1W', '1M', '1Y'].map(pd => (
                    <button
                      key={pd}
                      onClick={() => setSelectedPeriod(pd)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedPeriod === pd
                          ? (isDark ? 'bg-[#3eb489] text-white shadow-sm' : 'bg-[#3eb489] text-white shadow-sm')
                          : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')
                      }`}
                    >
                      {pd}
                    </button>
                  ))}
                </div>
              </div>

              {/* 대형 인터랙티브 차트 박스 */}
              <div className="relative w-full h-48 sm:h-56 mt-4 select-none">
                <svg width="100%" height="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polyline points={`${pointsStr} ${chartW},${chartH} 0,${chartH}`} fill="url(#stockGrad)" stroke="none" />
                  <polyline points={pointsStr} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredIdx === idx ? 5 : 3}
                      fill={lineColor}
                      stroke={isDark ? '#141715' : '#ffffff'}
                      strokeWidth="1.5"
                      className="transition-all cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  ))}
                </svg>

                {/* 차트 툴팁 호버 박스 */}
                {hoveredIdx !== null && points[hoveredIdx] && (
                  <div
                    className={`absolute pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-xl z-20 ${
                      isDark ? 'bg-zinc-900 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                    style={{
                      left: `${(points[hoveredIdx].x / chartW) * 100}%`,
                      top: `${(points[hoveredIdx].y / chartH) * 100}%`,
                    }}
                  >
                    {points[hoveredIdx].val.toLocaleString()}원
                  </div>
                )}
              </div>
            </div>

            {/* 2. ESG 브레이크다운 3개 타일 카드 */}
            <div className={`p-5 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#141715] border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
              <h3 className={`text-sm font-black mb-3 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                ESG 리스크 영역별 모니터링
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['e', 's', 'g'].map(pillar => {
                  const item = stock.esgBreakdown[pillar];
                  const labels = { e: '🌱 환경 (Environment)', s: '👥 사회 (Social)', g: '🏛 지배구조 (Governance)' };
                  const isSafe = item.status === 'safe';
                  return (
                    <div
                      key={pillar}
                      className={`p-4 rounded-xl border ${
                        isSafe
                          ? (isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-100')
                          : (isDark ? 'bg-amber-950/20 border-amber-500/20' : 'bg-amber-50/50 border-amber-100')
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{labels[pillar]}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSafe
                            ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                            : (isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700')
                        }`}>
                          {isSafe ? '정상' : '관측'}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. 최근 주요 공시 & 뉴스 근거 리스트 */}
            <div className={`p-5 sm:p-6 rounded-2xl border ${isDark ? 'bg-[#141715] border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
              <h3 className={`text-sm font-black mb-4 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                주요 뉴스 및 공시 분석 근거
              </h3>
              
              <div className="space-y-3">
                {stock.evidences?.map((ev, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                      isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg flex-shrink-0 mt-0.5 ${
                        ev.direction === '긍정'
                          ? (isDark ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700')
                          : (isDark ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30' : 'bg-rose-100 text-rose-700')
                      }`}>
                        {ev.type || '이슈'} · {ev.direction}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold leading-relaxed truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {ev.title}
                        </p>
                        <p className={`text-[10px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{ev.date}</p>
                      </div>
                    </div>
                    {ev.link && ev.link !== '#' && (
                      <a
                        href={ev.link}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-xs font-bold flex items-center gap-1 flex-shrink-0 ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}
                      >
                        원문 <Icon name="arrowRight" className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 👉 우측 자산 영향도 계산기 & 실시간 슬라이더 (1 컬럼) */}
          <div className="space-y-6">

            {/* 자산 영향도 계산기 카드 */}
            <div className={`p-5 sm:p-6 rounded-2xl border ${
              isDark ? 'bg-[#141715] border-white/10 shadow-lg' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="calculator" className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  내 자산 영향도 시뮬레이터
                </h3>
              </div>

              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isHeld
                  ? `현재 보유 비중(${stock.weight}%)을 기준으로 주가 하락 시 내 자산 손실 규모를 실시간으로 계산해 드려요.`
                  : '가상 매수 금액을 선택하고 주가 하락 시 예상 리스크 체감 손실을 계산해 보세요.'}
              </p>

              {/* 보유 여부에 따른 분기 UI */}
              {!isHeld && (
                <div className="mb-4">
                  <p className={`text-[11px] font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>가상 매수 금액 선택</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1000000, 5000000, 10000000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setSimVirtualAmount(amt)}
                        className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                          simVirtualAmount === amt
                            ? (isDark ? 'bg-[#3eb489] text-white border-[#3eb489]' : 'bg-[#3eb489] text-white border-[#3eb489]')
                            : (isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600')
                        }`}
                      >
                        {(amt / 10000).toLocaleString()}만원
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 주가 하락률 슬라이더 (-3% ~ -20%) */}
              <div className="space-y-3 mb-5 p-4 rounded-xl border bg-white/5 border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>주가 시뮬레이션 하락률</span>
                  <span className="font-mono font-black text-rose-500">-{simDropPct}%</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="20"
                  value={simDropPct}
                  onChange={e => setSimDropPct(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-rose-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>-3%</span>
                  <span>-10%</span>
                  <span>-20%</span>
                </div>
              </div>

              {/* 손실 결과 박스 */}
              <div className={`p-4 rounded-xl border text-center ${
                isDark ? 'bg-rose-950/30 border-rose-500/30' : 'bg-rose-50 border-rose-200'
              }`}>
                <p className={`text-[11px] font-bold ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>예상 내 자산 영향 손실액</p>
                <p className="text-2xl font-black font-mono text-rose-500 mt-1">
                  -{impactLossValue.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* 개미 펫의 실시간 응원 한마디 */}
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#18201a] border-[#3eb489]/20' : 'bg-emerald-50/50 border-emerald-100'}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐜</span>
                <div>
                  <h4 className={`text-xs font-black ${isDark ? 'text-[#69dbad]' : 'text-[#2d966e]'}`}>개미 지키미 팁</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    주가가 일시 흔들려도 업황 기초 체력이 든든하다면 성급하게 매도하지 말고 분할 관망하는 지혜가 필요해요!
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* ── 💡 AI 예측 원리 모달 ── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${
            isDark ? 'bg-[#171a18] border-white/10 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-black flex items-center gap-2">
                <span>🤖</span> AI 20일 하락 확률 예측 원리
              </h3>
              <button onClick={() => setShowAiModal(false)} className="p-1 text-slate-400 hover:text-white">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                <strong>1. ESG 이슈 분류 (Zero-Shot)</strong><br />
                수집된 뉴스·공시 텍스트를 HuggingFace 최신 NLP 분류기로 분석하여 E/S/G 리스크 항목과 긍정/부정 방향을 즉시 판정합니다.
              </p>
              <p>
                <strong>2. Materiality 가중치 적용</strong><br />
                업종별 이진 마테리얼리티 Map(1/0)을 적용하여, 해당 산업군에서 실제로 주가에 유의미한 충격을 주는 중대 악재만을 걸러냅니다.
              </p>
              <p>
                <strong>3. XGBoost 머신러닝 모형 추론</strong><br />
                지수/원달러 거시 피처와 통합 집계된 리스크 점수를 기학습된 XGBoost 모델에 투입하여 **20거래일 내 주가 -10% 하락 확률**을 정밀 추정합니다.
              </p>
            </div>

            <button
              onClick={() => setShowAiModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#3eb489] text-white font-bold text-xs hover:bg-[#2d966e]"
            >
              확인하였습니다
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
