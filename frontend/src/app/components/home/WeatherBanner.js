'use client';

import React from 'react';
import Icon from '../Icon';

/* ─── 날씨별 테마 설정 ─── */
const WEATHER_CONFIG = {
  sunny: {
    icon: 'sun',
    label: '맑음',
    text: 'text-amber-600',
    darkText: 'text-[#ffda6a]',
    /* 라이트 */ bgFrom: '#ff9e0c', bgMid: '#ffb700', bgTo: '#ffe066',
    /* 다크   */ darkBgFrom: '#3d1c00', darkBgMid: '#5c2e00', darkBgTo: '#7a3d00',
    border: 'border-amber-400/60',
    darkBorder: 'border-amber-800/50',
    accent: '#f59e0b',
    darkAccent: '#ffda6a',
    textOnBg: 'text-amber-900',
    darkTextOnBg: 'text-[#ffda6a]',
  },
  cloudy: {
    icon: 'cloud',
    label: '구름',
    text: 'text-indigo-600',
    darkText: 'text-[#a5b4fc]',
    bgFrom: '#6366f1', bgMid: '#818cf8', bgTo: '#c7d2fe',
    darkBgFrom: '#1e1b4b', darkBgMid: '#2e2b69', darkBgTo: '#1a1a3e',
    border: 'border-indigo-400/60',
    darkBorder: 'border-indigo-700/50',
    accent: '#6366f1',
    darkAccent: '#a5b4fc',
    textOnBg: 'text-indigo-900',
    darkTextOnBg: 'text-[#c7d2fe]',
  },
  rainy: {
    icon: 'cloudRain',
    label: '비',
    text: 'text-cyan-600',
    darkText: 'text-[#67e8f9]',
    bgFrom: '#0284c7', bgMid: '#0ea5e9', bgTo: '#67e8f9',
    darkBgFrom: '#042f4b', darkBgMid: '#063f63', darkBgTo: '#0a4f7a',
    border: 'border-cyan-400/60',
    darkBorder: 'border-cyan-800/50',
    accent: '#06b6d4',
    darkAccent: '#67e8f9',
    textOnBg: 'text-cyan-950',
    darkTextOnBg: 'text-[#a5f3fc]',
  },
  thunder: {
    icon: 'zap',
    label: '번개',
    text: 'text-rose-600',
    darkText: 'text-[#fca5a5]',
    bgFrom: '#9f1239', bgMid: '#e11d48', bgTo: '#fb7185',
    darkBgFrom: '#450a0a', darkBgMid: '#7f1d1d', darkBgTo: '#991b1b',
    border: 'border-rose-400/60',
    darkBorder: 'border-rose-800/50',
    accent: '#f43f5e',
    darkAccent: '#fca5a5',
    textOnBg: 'text-rose-950',
    darkTextOnBg: 'text-[#fecdd3]',
  },
};

/* ─── 맑음: 태양 광선 + 빛 원 ─── */
function SunnyDecor({ isDark }) {
  const c = isDark ? '#ffd16630' : '#f59e0b25';
  const c2 = isDark ? '#ffd16618' : '#f59e0b15';
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'hidden' }}>
      {/* 빛 원형 */}
      <circle cx="92%" cy="30%" r="90" fill={c} style={{ animation: 'pulse 3s ease-in-out infinite' }} />
      <circle cx="92%" cy="30%" r="60" fill={c} />
      <circle cx="92%" cy="30%" r="30" fill={isDark ? '#ffd16640' : '#f59e0b40'} />
      {/* 광선 */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
        <line key={i}
          x1="92%" y1="30%"
          x2={`${92 + Math.cos(deg * Math.PI / 180) * 18}%`}
          y2={`${30 + Math.sin(deg * Math.PI / 180) * 28}%`}
          stroke={c2} strokeWidth="1.5" strokeLinecap="round"
        />
      ))}
      {/* 구석 포인트 */}
      <circle cx="8%" cy="80%" r="40" fill={c2} />
    </svg>
  );
}

/* ─── 구름: 둥둥 떠다니는 구름들 ─── */
function CloudDecor({ isDark }) {
  const c = isDark ? '#94a3b820' : '#94a3b830';
  const c2 = isDark ? '#94a3b812' : '#94a3b820';
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'hidden' }}>
      {/* 큰 구름 */}
      <ellipse cx="80%" cy="28%" rx="80" ry="36" fill={c} style={{ animation: 'drift 8s ease-in-out infinite' }} />
      <ellipse cx="75%" cy="20%" rx="50" ry="28" fill={c} />
      <ellipse cx="88%" cy="24%" rx="45" ry="24" fill={c} />
      {/* 중간 구름 */}
      <ellipse cx="15%" cy="60%" rx="50" ry="24" fill={c2} style={{ animation: 'drift 12s ease-in-out infinite reverse' }} />
      <ellipse cx="10%" cy="54%" rx="35" ry="20" fill={c2} />
      {/* 작은 구름 */}
      <ellipse cx="55%" cy="10%" rx="30" ry="14" fill={c2} />
    </svg>
  );
}

/* ─── 비: 빗방울 라인들 ─── */
function RainDecor({ isDark }) {
  const c = isDark ? '#81a1c128' : '#3b82f625';
  const drops = Array.from({ length: 20 }, (_, i) => ({
    x: `${5 + i * 5}%`,
    delay: `${(i * 0.17).toFixed(2)}s`,
    height: 8 + (i % 4) * 4,
  }));
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'hidden' }}>
      {drops.map((d, i) => (
        <line key={i}
          x1={d.x} y1="-5%"
          x2={`calc(${d.x} + 3%)`} y2="110%"
          stroke={c} strokeWidth="1"
          strokeDasharray={`${d.height} ${40 - d.height}`}
          style={{ animation: `rain 1.2s linear ${d.delay} infinite` }}
        />
      ))}
      {/* 구름 실루엣 */}
      <ellipse cx="75%" cy="15%" rx="70" ry="28" fill={isDark ? '#1e3a5f30' : '#bfdbfe40'} />
      <ellipse cx="82%" cy="10%" rx="50" ry="22" fill={isDark ? '#1e3a5f25' : '#bfdbfe30'} />
    </svg>
  );
}

/* ─── 번개: 지그재그 + 극적인 분위기 ─── */
function ThunderDecor({ isDark }) {
  const boltC = isDark ? '#ff6b6b35' : '#ef444430';
  const glowC = isDark ? '#ff000020' : '#fee2e250';
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'hidden' }}>
      {/* 배경 glow */}
      <ellipse cx="85%" cy="20%" rx="100" ry="60" fill={glowC} />
      {/* 번개 볼트 1 */}
      <polyline
        points="82%,5% 78%,38% 84%,38% 79%,72%"
        fill="none" stroke={boltC} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
        style={{ animation: 'flash 3s ease-in-out infinite' }}
      />
      {/* 번개 볼트 2 (작은) */}
      <polyline
        points="90%,15% 87%,35% 91%,35% 88%,55%"
        fill="none" stroke={boltC} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
        style={{ animation: 'flash 3s ease-in-out 0.5s infinite' }}
      />
      {/* 어두운 구름 */}
      <ellipse cx="80%" cy="12%" rx="80" ry="30" fill={isDark ? '#4b000020' : '#9f121220'} />
      <ellipse cx="70%" cy="8%"  rx="55" ry="24" fill={isDark ? '#4b000018' : '#9f121218'} />
      {/* 하단 분위기 */}
      <ellipse cx="10%" cy="90%" rx="60" ry="30" fill={glowC} />
    </svg>
  );
}

const DECOR = { sunny: SunnyDecor, cloudy: CloudDecor, rainy: RainDecor, thunder: ThunderDecor };

/* ─── CSS keyframes (style tag) ─── */
const weatherKeyframes = `
@keyframes drift {
  0%, 100% { transform: translateX(0px); }
  50%       { transform: translateX(12px); }
}
@keyframes rain {
  0%   { transform: translateY(-10%); opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(110%); opacity: 0; }
}
@keyframes flash {
  0%, 90%, 100% { opacity: 0.3; }
  92%, 96%       { opacity: 1; }
  94%            { opacity: 0.5; }
}
@keyframes pulse {
  0%, 100% { r: 90; opacity: 0.7; }
  50%       { r: 100; opacity: 1; }
}
`;

/**
 * 홈 최상단 날씨 예보 배너 (날씨 배경 시각화)
 */
export default function WeatherBanner({ weather, isDark }) {
  const status = weather?.status || 'sunny';
  const cfg = WEATHER_CONFIG[status] || WEATHER_CONFIG.sunny;
  const Decor = DECOR[status] || SunnyDecor;

  const bgStyle = isDark
    ? { background: `linear-gradient(135deg, ${cfg.darkBgFrom} 0%, ${cfg.darkBgMid || cfg.darkBgFrom} 50%, ${cfg.darkBgTo} 100%)` }
    : { background: `linear-gradient(135deg, ${cfg.bgFrom} 0%, ${cfg.bgMid || cfg.bgTo} 50%, ${cfg.bgTo} 100%)` };

  return (
    <>
      <style>{weatherKeyframes}</style>
      <div
        className={`relative rounded-2xl border overflow-hidden p-5 transition-all ${isDark ? cfg.darkBorder : cfg.border}`}
        style={bgStyle}
      >
        {/* 날씨 배경 데코 */}
        <Decor isDark={isDark} />

        {/* 콘텐츠 (z-index 위) */}
        <div className="relative z-10">
          {/* 날씨 상태 행 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm"
                style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.6)' }}
              >
                <Icon
                  name={cfg.icon}
                  className={`w-10 h-10 ${isDark ? cfg.darkText : cfg.text}`}
                />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-white/60">
                  오늘 내 포트폴리오 날씨
                </p>
                <p className={`text-2xl font-black leading-tight ${isDark ? 'text-white' : 'text-white'}`}>
                  {cfg.label}
                </p>
              </div>
            </div>

            <a
              href="/diagnosis"
              className="text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors backdrop-blur-sm bg-white/20 text-white hover:bg-white/30"
            >
              위험 진단
              <Icon name="arrowRight" className="w-3 h-3" />
            </a>
          </div>

          {/* AI 판단 근거 */}
          {weather?.summary && weather.summary.length > 0 && (
            <div
              className="rounded-xl p-3.5 space-y-2 backdrop-blur-sm"
              style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)' }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-white/60">
                AI 판단 근거
              </p>
              {weather.summary.map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: isDark ? cfg.darkAccent : cfg.accent }}
                  />
                  <p className="text-xs leading-relaxed text-white/80">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
