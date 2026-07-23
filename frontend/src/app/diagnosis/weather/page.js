"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Header from '../../components/layout/Header';
import Icon from '../../components/Icon';
import { DEMO_PROFILE, kosdaqIndex } from '../../data/mockData';

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

// 기본 BALANCED 포트폴리오
const DEFAULT_PORTFOLIO = [
  { ticker: '005490', name: 'POSCO홀딩스', weight: 12, direction: 'down', confidence: 'medium', change: -0.4 },
  { ticker: '068270', name: '셀트리온',    weight: 13, direction: 'up',   confidence: 'weak',   change:  0.3 },
  { ticker: '055550', name: '신한지주',    weight: 12, direction: 'up',   confidence: 'medium', change:  1.0 },
  { ticker: '000270', name: '기아',        weight: 12, direction: 'up',   confidence: 'weak',   change:  0.2 },
  { ticker: '051910', name: 'LG화학',      weight: 13, direction: 'down', confidence: 'medium', change: -0.7 },
  { ticker: '028260', name: '삼성물산',    weight: 12, direction: 'up',   confidence: 'weak',   change:  0.1 },
  { ticker: '017670', name: 'SK텔레콤',   weight: 13, direction: 'up',   confidence: 'medium', change:  0.8 },
  { ticker: '010950', name: 'S-Oil',       weight: 13, direction: 'down', confidence: 'weak',   change: -0.3 },
];

export default function DiagnosisWeatherPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(DEMO_PROFILE);

  useEffect(() => {
    const saved = localStorage.getItem('ants_result_profile');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch { /* noop */ }
    }
  }, []);

  const atmosphere = useMemo(
    () => calculateWeather(DEFAULT_PORTFOLIO, profile?.target_risk_band || 'BALANCED'),
    [profile]
  );

  // 보조 그래프: sparkline 데이터를 위험 점수로 노멀라이즈 (시뮬레이션)
  const sparkline = kosdaqIndex.sparkline;
  const w = 160, h = 56;
  const min = Math.min(...sparkline), max = Math.max(...sparkline), range = max - min || 1;
  const points = sparkline.map((v, i) => {
    const x = (i / (sparkline.length - 1)) * w;
    const y = h - ((v - min) / range) * (h * 0.8) - h * 0.1;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? 'bg-[#080b08] text-[#e2e2e2]' : 'bg-[#f5f6f4] text-[#0f1713]'}`}>
      <Header isDark={isDark} toggleTheme={toggleTheme} title="위험 진단" />

      <main className="pt-14 pb-10 px-4 max-w-4xl lg:ml-60 lg:w-[calc(100%-240px)]">

        {/* 단계 표시 */}
        <div className="pt-6 pb-4 flex items-center gap-2">
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
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>오늘 내 포트폴리오 날씨</p>
            <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
              현재 날씨:{' '}
              <span className={atmosphere.color}>{atmosphere.label}</span>
            </h1>
          </div>

          {/* 날씨 상세 + 보조 그래프 */}
          <div className="flex items-stretch gap-4">
            {/* 날씨 카드 */}
            <div className={`flex-1 rounded-xl p-4 flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <Icon name={atmosphere.icon} className={`w-14 h-14 ${atmosphere.color}`} />
              <div className="text-center">
                <p className={`text-2xl font-black ${atmosphere.color}`}>{atmosphere.label}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  종합 위험도 {atmosphere.score.toFixed(1)}점
                </p>
              </div>
              {/* 맑음~번개 스펙트럼 */}
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

            {/* 보조 리스크 미니 그래프 */}
            <div className={`w-44 rounded-xl p-4 flex flex-col justify-between ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>지수 추이</p>
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
              <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>최근 7거래일</p>
            </div>
          </div>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            보유 종목의 뉴스·공시 리스크에 투자 성향 민감도({getSensitivityFactor(profile?.target_risk_band || 'BALANCED')}배)를 적용하여 산출한 결과입니다.
          </p>
        </div>

        {/* 종목 요약 리스트 */}
        <div className={`mt-4 rounded-2xl border overflow-hidden ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className={`px-5 py-3 border-b text-xs font-black ${isDark ? 'border-white/5 text-white' : 'border-slate-50 text-[#0f1713]'}`}>
            종목별 위험 요약
          </div>
          {DEFAULT_PORTFOLIO.map((s, idx) => (
            <button
              key={s.ticker}
              onClick={() => router.push(`/stock/${s.ticker}`)}
              className={`w-full flex items-center px-5 py-3 text-left transition-colors ${
                idx < DEFAULT_PORTFOLIO.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-50') : ''
              } ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
            >
              <div className="flex-1">
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{s.name}</p>
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
      </main>
    </div>
  );
}
