'use client';

import React from 'react';
import Icon from '../Icon';

const WEATHER_CONFIG = {
  sunny:   { icon: 'sun',       label: '맑음',     bg: 'from-amber-50 to-emerald-50', border: 'border-amber-200/60', text: 'text-amber-500', darkBg: 'from-[#1a2b1a] to-[#0d0f0f]', darkText: 'text-[#69dbad]' },
  cloudy:  { icon: 'cloud',     label: '구름',     bg: 'from-slate-50 to-sky-50',     border: 'border-slate-200/60', text: 'text-slate-500', darkBg: 'from-[#1e2228] to-[#0d0f0f]', darkText: 'text-slate-300' },
  rainy:   { icon: 'cloudRain', label: '비',       bg: 'from-blue-50 to-slate-50',    border: 'border-blue-200/60',  text: 'text-blue-500',  darkBg: 'from-[#1a2030] to-[#0d0f0f]', darkText: 'text-[#81a1c1]' },
  thunder: { icon: 'zap',       label: '번개',     bg: 'from-red-50 to-slate-50',     border: 'border-red-200/60',   text: 'text-red-500',   darkBg: 'from-[#2b1a1a] to-[#0d0f0f]', darkText: 'text-[#ff6b6b]' },
};

/**
 * 홈 최상단 날씨 예보 배너
 * @param {Object}  props
 * @param {Object}  props.weather  - overallWeather 객체
 * @param {boolean} props.isDark
 */
export default function WeatherBanner({ weather, isDark }) {
  const cfg = WEATHER_CONFIG[weather?.status] || WEATHER_CONFIG.sunny;

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 transition-all ${
        isDark
          ? `${cfg.darkBg} border-white/5`
          : `${cfg.bg} ${cfg.border}`
      }`}
    >
      {/* 날씨 상태 행 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDark ? 'bg-white/5' : 'bg-white/70'
            }`}
          >
            <Icon name={cfg.icon} className={`w-6 h-6 ${isDark ? cfg.darkText : cfg.text}`} />
          </div>
          <div>
            <p className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              오늘 내 포트폴리오 날씨
            </p>
            <p className={`text-xl font-black leading-tight ${isDark ? cfg.darkText : cfg.text}`}>
              {cfg.label}
            </p>
          </div>
        </div>

        <a
          href="/diagnosis"
          className={`text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors ${
            isDark
              ? 'bg-white/5 text-slate-400 hover:bg-white/10'
              : 'bg-white/70 text-slate-500 hover:bg-white'
          }`}
        >
          위험 진단
          <Icon name="arrowRight" className="w-3 h-3" />
        </a>
      </div>

      {/* AI 판단 근거 */}
      {weather?.summary && weather.summary.length > 0 && (
        <div
          className={`rounded-xl p-3.5 space-y-2 ${
            isDark ? 'bg-white/5' : 'bg-white/60'
          }`}
        >
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            AI 판단 근거
          </p>
          {weather.summary.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDark ? cfg.darkText.replace('text-', 'bg-') : cfg.text.replace('text-', 'bg-')}`} />
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {line}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
