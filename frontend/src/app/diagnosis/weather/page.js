"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Icon from '../../components/Icon';
import { DEMO_PROFILE, kosdaqIndex, PORTFOLIO_PRESETS } from '../../data/mockData';

// 날씨 계산 (ResultsScreen.js와 동일 로직)
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
      if (stock.confidence === 'strong') stockRisk = 10;
      else if (stock.confidence === 'medium') stockRisk = 6;
      else stockRisk = 3;
    }
    totalScore += (stockRisk * stock.weight) / 100;
  });
  const finalScore = totalScore * getSensitivityFactor(band);

  if (finalScore >= 8) return { label: '번개', icon: 'zap',       color: 'text-red-500',   score: finalScore };
  if (finalScore >= 5) return { label: '비',   icon: 'cloudRain', color: 'text-blue-500',  score: finalScore };
  if (finalScore >= 2) return { label: '구름', icon: 'cloud',     color: 'text-amber-500', score: finalScore };
  return                      { label: '맑음', icon: 'sun',       color: 'text-[#3eb489]', score: finalScore };
}

export default function DiagnosisWeatherPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [profile, setProfile] = useState(DEMO_PROFILE);
  const [selectedId, setSelectedId] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem('ants_result_profile');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch { /* noop */ }
    }
    if (typeof window !== 'undefined') {
      const savedId = sessionStorage.getItem('ants_selected_portfolio');
      if (savedId) {
        setSelectedId(Number(savedId));
      }
    }
  }, []);

  const currentPreset = useMemo(() => {
    return PORTFOLIO_PRESETS.find(p => p.id === selectedId) || PORTFOLIO_PRESETS[0];
  }, [selectedId]);

  const portfolioList = currentPreset.stockWeatherList;

  const atmosphere = useMemo(
    () => calculateWeather(portfolioList, profile?.target_risk_band || 'BALANCED'),
    [portfolioList, profile]
  );

  // 보조 그래프: sparkline 데이터를 위험 점수로 노멀라이즈
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
      {/* 단계 표시 */}
      <div className="pb-4 flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? 'bg-white/5 text-slate-500' : 'bg-white text-slate-400 border border-slate-200'}`}>
          <span className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-white text-[9px] font-black">1</span>
          위험 레이더
        </div>
        <Icon name="arrowRight" className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? 'bg-[#3eb489]/15 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#3eb489]'}`}>
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black" style={{backgroundColor: isDark ? '#69dbad' : '#3eb489'}}>2</span>
          포트폴리오 날씨
        </div>
      </div>

      {/* 날씨 + 보조 그래프 카드 */}
      <div className={`rounded-2xl border p-6 space-y-6 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          
          {/* 날씨 상세 */}
          <div className="space-y-4 flex-1">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>포트폴리오 날씨</p>
              <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                오늘 나의 포트폴리오 날씨
              </h1>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 justify-between p-5 rounded-xl border border-[#3eb489]/20 bg-[#3eb489]/5">
              <div className="space-y-1.5 flex-1">
                <h2 className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  {profile?.titleKo || '균형투자형'} 성향 기준 날씨 : <span className={atmosphere.color}>{atmosphere.label}</span>
                </h2>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  내가 가진 종목들의 뉴스·공시 리스크에 내 투자 성향 민감도({getSensitivityFactor(profile?.target_risk_band || 'BALANCED')}배)를 쏙 반영해 계산한 결과예요! ☔
                </p>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border shadow-inner ${isDark ? 'bg-zinc-800/80 border-zinc-700/50' : 'bg-white border-slate-100'}`}>
                <Icon name={atmosphere.icon} className={`w-8 h-8 ${atmosphere.color}`} />
              </div>
            </div>

            {/* 맑음~번개 스펙트럼 */}
            <div className="space-y-2">
              <div className="w-full flex gap-1">
                {['맑음','구름','비','번개'].map((l, i) => (
                  <div key={l} className={`flex-1 h-1.5 rounded-full ${
                    (atmosphere.label === l)
                      ? ['bg-[#3eb489]','bg-amber-400','bg-blue-400','bg-red-500'][i]
                      : (isDark ? 'bg-white/10' : 'bg-slate-200')
                  }`} />
                ))}
              </div>
            </div>
          </div>

          {/* 지수 변동성 미니 차트 (우측 정렬) */}
          <div className={`w-full md:w-52 rounded-xl p-4 flex flex-col justify-between ${isDark ? 'bg-black/20 border border-white/5' : 'bg-slate-50 border border-slate-200/50'}`}>
            <div>
              <p className={`text-[9px] font-black uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>코스닥 변동성 (최근 7일)</p>
              <p className={`text-xs font-black font-mono ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>768.42</p>
            </div>
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-16 w-full my-2">
              <defs>
                <linearGradient id="diagGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3eb489" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3eb489" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={points + ` ${w},${h} 0,${h}`} fill="url(#diagGrad)" stroke="none" />
              <polyline points={points} fill="none" stroke={isDark ? '#69dbad' : '#3eb489'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

        </div>
      </div>

      {/* 보유 종목 상세 예측 상태 목록 */}
      <div className="mt-6 space-y-3">
        <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>보유 종목별 기상 세부</p>
        {portfolioList.map(s => (
          <button
            key={s.ticker}
            onClick={() => router.push(`/stock/${s.ticker}`)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition-all ${
              isDark ? 'bg-[#1e2220] border-white/5 hover:bg-[#252a27]' : 'bg-white border-slate-100 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <div className="flex-grow">
              <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{s.name}</p>
              <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.ticker} · 비중 {s.weight}%</p>
            </div>
            <span className={`text-xs font-black mr-3 ${s.direction === 'up' ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500'}`}>
              {s.direction === 'up' ? '▲' : '▼'} {s.confidence === 'strong' ? '강' : s.confidence === 'medium' ? '중' : '약'}
            </span>
            <Icon name="chevronRight" className={`w-4 h-4 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push('/')}
        className={`mt-6 w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
          isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
        }`}
      >
        <Icon name="home" className="w-4 h-4" />
        홈으로 돌아가기
      </button>
    </div>
  );
}
