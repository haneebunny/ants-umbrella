"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Icon from '../../components/Icon';
import { DEMO_PROFILE, kosdaqIndex, PORTFOLIO_PRESETS } from '../../data/mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';


function getSensitivityFactor(band) {
  switch (band) {
    case 'CONSERVATIVE': return 2.0;
    case 'MODERATE_CONSERVATIVE': return 1.5;
    case 'BALANCED': return 1.0;
    case 'GROWTH': return 0.6;
    case 'AGGRESSIVE': return 0.3;
    default: return 1.0;
  }
}

function calculateWeather(portfolio, band) {
  let totalScore = 0;
  portfolio.forEach(stock => {
    let stockRisk = 0;
    if (stock.direction === 'down') {
      if (stock.confidence === 'strong' || stock.weather === 'thunder') stockRisk = 10;
      else if (stock.confidence === 'medium' || stock.weather === 'rainy') stockRisk = 6;
      else stockRisk = 3;
    }
    totalScore += (stockRisk * (stock.weight || 15)) / 100;
  });
  const finalScore = totalScore * getSensitivityFactor(band);

  if (finalScore >= 8) return { label: '번개', icon: 'zap',       color: 'text-red-500',   score: finalScore };
  if (finalScore >= 5) return { label: '비',   icon: 'cloudRain', color: 'text-blue-500',  score: finalScore };
  if (finalScore >= 2) return { label: '구름', icon: 'cloud',     color: 'text-amber-500', score: finalScore };
  return                      { label: '맑음', icon: 'sun',       color: 'text-[#3eb489]', score: finalScore };
}

// 날씨별 AI 판단 근거 멘트 (날씨 라벨과 1:1 매핑)
const WEATHER_COMMENTS = {
  '번개': [
    '⚡️ 포트폴리오 전반에 걸쳐 고위험 신호가 다수 감지됐어요! 지금은 신중하게 상황을 점검할 타이밍이에요.',
    '🔴 하락 방향 예측 종목들이 집중돼 있어서 단기 손실 위험이 높아요. 손절 기준선을 미리 확인해 두는 게 좋아요.',
    '🚨 현재 위험 수준이 허용 한도를 크게 초과했어요. 고위험 종목 비중을 줄이거나 방어주로 일부 교체를 고려해 보세요!',
  ],
  '비': [
    '🌧️ 일부 종목에서 하락 리스크가 감지되고 있어요. 전체적으로 살짝 흐린 상황이에요.',
    '📉 약세 신호가 중간 수준으로 감지되고 있어요. 비중 조절과 현금 비중 확보를 고려해 볼 수 있어요.',
    '🌂 시장 변동성이 높아지는 구간이에요. 리밸런싱 전략을 점검하고 안정적인 종목 비중을 늘려보세요.',
  ],
  '구름': [
    '⛅ 포트폴리오 전반은 크게 문제없지만, 일부 종목에서 불확실성이 보여요.',
    '🟡 대부분 종목은 괜찮지만 단기 하락 리스크 신호가 일부 있어요. 지켜보면서 대응하면 충분해요.',
    '📊 전반적으로 중립 수준이에요. 분산 구성을 유지하면서 위험 종목만 추가 점검해 보세요!',
  ],
  '맑음': [
    '☀️ 배당 우량주 중심 구성 덕분에 포트폴리오 전반이 편안하고 안정적인 흐름을 유지하고 있어요! 🛡️',
    '📈 보유 종목들의 상승 신호가 고루 확인되고, ESG 평판 리스크도 낮아서 안심할 수 있는 구간이에요!',
    '💸 현재 위험 수준은 허용 범위 아래에 있어요. 원한다면 분산 투자를 더 든든하게 늘려봐도 좋아요!',
  ],
};


export default function DiagnosisWeatherPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [profile, setProfile] = useState(DEMO_PROFILE);
  const [selectedId, setSelectedId] = useState(1);
  const [aiSummary, setAiSummary] = useState(null); // Gemini 캐시 브리핑

  // 마운트 시 저장된 프로필 및 활성 포트폴리오 읽기
  useEffect(() => {
    const savedProfile = localStorage.getItem('ants_result_profile');
    if (savedProfile) {
      try { setProfile(JSON.parse(savedProfile)); } catch { /* noop */ }
    }

    if (typeof window !== 'undefined') {
      const savedPortId = sessionStorage.getItem('ants_selected_portfolio');
      if (savedPortId) {
        setSelectedId(Number(savedPortId));
      }
    }
  }, []);

  const activePortfolio = useMemo(() => {
    return PORTFOLIO_PRESETS.find(p => p.id === selectedId) || PORTFOLIO_PRESETS[0];
  }, [selectedId]);

  const stockList = useMemo(() => activePortfolio.stockWeatherList || [], [activePortfolio]);

  const atmosphere = useMemo(
    () => calculateWeather(stockList, profile?.target_risk_band || 'BALANCED'),
    [stockList, profile]
  );

  // 날씨/구성 변동 시에만 백엔드 Gemini 캐시 브리핑 요청
  useEffect(() => {
    if (!atmosphere) return;
    const riskyTickers = stockList
      .filter(s => s.direction === 'down')
      .map(s => ({ name: s.name, direction: s.direction }));

    fetch(`${API_BASE}/api/weather-briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolio_id: selectedId,
        weather_status: atmosphere.label === '번개' ? 'thunder'
                      : atmosphere.label === '비'   ? 'rainy'
                      : atmosphere.label === '구름' ? 'cloudy'
                      : 'sunny',
        weather_label: atmosphere.label,
        risky_tickers: riskyTickers,
      }),
    })
      .then(r => r.json())
      .then(data => { if (data?.summary?.length) setAiSummary(data.summary); })
      .catch(() => setAiSummary(null)); // 실패 시 하드코딩 fallback 유지
  }, [atmosphere, selectedId, stockList]);



  // 보조 미니 그래프
  const sparkline = kosdaqIndex.sparkline;
  const w = 160, h = 56;
  const min = Math.min(...sparkline), max = Math.max(...sparkline), range = max - min || 1;
  const points = sparkline.map((v, i) => {
    const x = (i / (sparkline.length - 1)) * w;
    const y = h - ((v - min) / range) * (h * 0.8) - h * 0.1;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full">
      <main className="pt-2 pb-10 px-1 max-w-4xl">

        {/* ── 3단계 탭 내비게이션 ── */}
        <div className="pt-4 pb-4 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push('/diagnosis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isDark ? 'bg-white/5 text-slate-500 hover:text-slate-300' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'}`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-white text-[9px] font-black">1</span>
            위험 레이더
          </button>
          
          <Icon name="arrowRight" className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? 'bg-[#3eb489]/15 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#3eb489]'}`}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black" style={{backgroundColor: isDark ? '#69dbad' : '#3eb489'}}>2</span>
            포트폴리오 날씨 ({activePortfolio.label})
          </div>

          <Icon name="arrowRight" className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />

          <button
            onClick={() => router.push('/diagnosis/result')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isDark ? 'bg-white/5 text-slate-500 hover:text-slate-300' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'}`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-white text-[9px] font-black">3</span>
            성향 종합 리포트
          </button>
        </div>

        {/* ── ☀️ 포트폴리오 날씨 카드 ── */}
        <div className={`rounded-2xl border p-6 space-y-6 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              오늘 내 포트폴리오 날씨 ({activePortfolio.label} - {activePortfolio.totalLabel})
            </p>
            <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
              현재 날씨:{' '}
              <span className={atmosphere.color}>{atmosphere.label}</span>
            </h1>
          </div>

          {/* 날씨 상세 + 보조 그래프 */}
          <div className="flex flex-col md:flex-row items-stretch gap-4">
            <div className={`flex-1 rounded-xl p-4 flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <Icon name={atmosphere.icon} className={`w-14 h-14 ${atmosphere.color}`} />
              <div className="text-center">
                <p className={`text-2xl font-black ${atmosphere.color}`}>{atmosphere.label}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  종합 위험도 {atmosphere.score.toFixed(1)}점
                </p>
              </div>

              {/* 맑음~번개 스펙트럼 */}
              <div className="w-full flex gap-1 mt-2">
                {['맑음','구름','비','번개'].map((l, i) => (
                  <div key={l} className={`flex-1 h-1.5 rounded-full ${
                    (atmosphere.label === l)
                      ? ['bg-[#3eb489]','bg-amber-400','bg-blue-400','bg-red-500'][i]
                      : (isDark ? 'bg-white/10' : 'bg-slate-200')
                  }`} />
                ))}
              </div>
            </div>

            <div className={`w-full md:w-52 rounded-xl p-4 flex flex-col justify-between ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>지수 추이 (최근 7일)</p>
              <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-14 w-full my-1">
                <defs>
                  <linearGradient id="diagGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3eb489" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3eb489" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline points={points + ` ${w},${h} 0,${h}`} fill="url(#diagGrad)" stroke="none" />
                <polyline points={points} fill="none" stroke={isDark ? '#69dbad' : '#3eb489'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>최근 7거래일 KOSPI 변동 폭</p>
            </div>
          </div>
        </div>

        {/* ── 🐜 AI 판단 근거 — Gemini 캐시 브리핑 (변동 시만 재생성) ── */}
        {(() => {
          const displaySummary = aiSummary || WEATHER_COMMENTS[atmosphere.label] || [];
          if (!displaySummary.length) return null;
          return (
            <div className={`mt-4 rounded-2xl border p-5 space-y-3 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                AI 판단 근거
                {aiSummary && <span className="ml-2 text-[#3eb489]">· Gemini 생성</span>}
              </p>
              {displaySummary.map((line, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    atmosphere.label === '번개' ? 'bg-red-500' :
                    atmosphere.label === '비'   ? 'bg-blue-400' :
                    atmosphere.label === '구름' ? 'bg-amber-400' : 'bg-[#3eb489]'
                  }`} />
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{line}</p>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── 📋 활성 포트폴리오 종목별 위험 요약 리스트 (터치/클릭 시 종목 상세 페이지 바로 이동!) ── */}
        <div className={`mt-4 rounded-2xl border overflow-hidden ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>

          <div className={`px-5 py-3 border-b text-xs font-black flex items-center justify-between ${isDark ? 'border-white/5 text-white' : 'border-slate-50 text-[#0f1713]'}`}>
            <span>종목별 위험 요약 ({activePortfolio.label} 보유 종목)</span>
            <span className="text-[10px] text-[#3eb489] font-bold">클릭 시 AI 종합 리포트 이동</span>
          </div>
          {stockList.map((s, idx) => (
            <button
              key={s.ticker}
              onClick={() => router.push(`/stock/${s.ticker}`)}
              className={`w-full flex items-center px-5 py-3.5 text-left transition-colors ${
                idx < stockList.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-50') : ''
              } ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{s.name}</p>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    {s.ticker} · 비중 {s.weight || 25}%
                  </span>
                </div>
                {s.detail?.reason && (
                  <p className={`text-xs mt-0.5 truncate max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {s.detail.reason}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-black ${s.direction === 'up' ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-rose-500'}`}>
                  {s.direction === 'up' ? '▲ 상승' : '▼ 하락'} ({s.change > 0 ? `+${s.change}%` : `${s.change}%`})
                </span>
                <Icon name="chevronRight" className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push('/diagnosis/result')}
          className={`mt-6 w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
            isDark ? 'bg-[#3eb489] text-[#0a1f14] hover:bg-[#69dbad]' : 'bg-[#3eb489] text-white hover:bg-[#2d966e] shadow-[0_4px_20px_rgba(62,180,137,0.3)]'
          }`}
        >
          다음 단계: 내 투자성향 종합 리포트 확인하기 🦔
          <Icon name="arrowRight" className="w-4 h-4" />
        </button>

        <button
          onClick={() => router.push('/')}
          className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            isDark ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-500'
          }`}
        >
          <Icon name="home" className="w-3.5 h-3.5" />
          홈으로 가기
        </button>
      </main>
    </div>
  );
}
