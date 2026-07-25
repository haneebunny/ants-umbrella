'use client';

import React from 'react';
import Icon from '../Icon';

/**
 * 코스피 미니 지수 위젯 (토스증권 스타일)
 * @param {Object}  props.index  - kosdaqIndex 객체
 * @param {boolean} props.isDark
 */
export default function KosdaqMiniChart({ index, isDark }) {
  const { currentPrice = 0, change = 0, changeRate = 0, sparkline = [] } = index || {};

  // 상승/하락은 isUp 플래그가 아니라 실제 등락률 부호로 판단 (부호·색 불일치 방지)
  const up = changeRate > 0;
  const down = changeRate < 0;

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

  const color = up ? '#3eb489' : down ? '#ff6b6b' : '#94a3b8';
  const colorDark = up ? '#69dbad' : down ? '#ff8b8b' : '#94a3b8';
  const lineColor = isDark ? colorDark : color;

  return (
    <div
      className={`rounded-2xl border p-3 flex flex-col gap-2 ${
        isDark
          ? 'bg-[#1e2220] border-white/5 card-glow-dark'
          : 'bg-white border-slate-100 shadow-sm card-glow-light'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            코스피
          </p>
          <p className={`text-xl font-black font-mono leading-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
            {currentPrice.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className={`flex items-center gap-1 text-sm font-black ${up ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : down ? 'text-red-500' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
            <Icon name={up ? 'trendingUp' : 'trendingDown'} className="w-4 h-4" />
            {up ? '+' : ''}{changeRate.toFixed(2)}%
          </div>
          <p className={`text-[11px] font-mono font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {change > 0 ? '+' : change < 0 ? '-' : ''}{Math.abs(change).toFixed(2)}
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
