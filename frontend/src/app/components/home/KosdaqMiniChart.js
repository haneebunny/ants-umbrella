'use client';

import React from 'react';
import Icon from '../Icon';

/**
 * 코스닥 미니 지수 위젯 (토스증권 스타일)
 * @param {Object}  props.index  - kosdaqIndex 객체
 * @param {boolean} props.isDark
 */
export default function KosdaqMiniChart({ index, isDark }) {
  const { currentPrice = 0, change = 0, changeRate = 0, isUp = true, sparkline = [] } = index || {};

  // SVG 스파크라인 경로 계산
  const w = 96, h = 36;
  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline);
  const range = max - min || 1;
  const points = sparkline.map((v, i) => {
    const x = (i / (sparkline.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  const color = isUp ? '#3eb489' : '#ff6b6b';
  const colorDark = isUp ? '#69dbad' : '#ff8b8b';
  const lineColor = isDark ? colorDark : color;

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 ${
        isDark
          ? 'bg-[#141615] border-white/5'
          : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            코스닥
          </p>
          <p className={`text-2xl font-black font-mono leading-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
            {currentPrice.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className={`flex items-center gap-1 text-sm font-black ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500'}`}>
            <Icon name={isUp ? 'trendingUp' : 'trendingDown'} className="w-4 h-4" />
            {isUp ? '+' : ''}{changeRate.toFixed(2)}%
          </div>
          <p className={`text-[11px] font-mono font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {isUp ? '+' : '-'}{Math.abs(change).toFixed(2)}
          </p>
        </div>
      </div>

      {/* 스파크라인 */}
      {sparkline.length > 1 && (
        <div className="relative">
          <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-9 w-full">
            {/* 그라데이션 fill */}
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points={points + ` ${w},${h} 0,${h}`}
              fill="url(#sparkGrad)"
              stroke="none"
            />
            <polyline
              points={points}
              fill="none"
              stroke={lineColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
        최근 7거래일 추이
      </p>
    </div>
  );
}
