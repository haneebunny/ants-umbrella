'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';

const WEATHER_ICON = {
  sunny:   { icon: 'sun',       label: '맑음', color: 'text-amber-400' },
  cloudy:  { icon: 'cloud',     label: '구름', color: 'text-slate-400' },
  rainy:   { icon: 'cloudRain', label: '비',   color: 'text-blue-400'  },
  thunder: { icon: 'zap',       label: '번개', color: 'text-red-400'   },
};

/**
 * 종목별 날씨 간략 목록 (홈 화면용)
 * 클릭 시 /stock/[ticker] 상세 페이지로 이동
 * @param {Array}   props.stocks  - stockWeatherList 배열
 * @param {boolean} props.isDark
 */
export default function StockWeatherList({ stocks = [], isDark }) {
  const router = useRouter();

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-[#141615] border-white/5' : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      {/* 섹션 헤더 */}
      <div className={`flex items-center px-5 py-3.5 border-b ${
        isDark ? 'border-white/5' : 'border-slate-50'
      }`}>
        <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
          종목별 날씨
        </p>
      </div>

      {/* 종목 목록 */}
      <div>
        {stocks.map((stock, idx) => {
          const wCfg = WEATHER_ICON[stock.weather] || WEATHER_ICON.cloudy;
          const isLast = idx === stocks.length - 1;

          return (
            <button
              key={stock.ticker}
              onClick={() => router.push(`/stock/${stock.ticker}`)}
              className={`w-full flex items-center px-5 py-3.5 text-left transition-colors ${
                !isLast ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-50') : ''
              } ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
            >
              {/* 종목명 */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  {stock.name}
                </p>
                <p className={`text-[10px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  {stock.ticker}
                </p>
              </div>

              {/* 비중 */}
              <span className={`text-xs font-mono font-bold mr-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {stock.weight}%
              </span>

              {/* 날씨 아이콘 */}
              <div className="flex items-center gap-1.5 mr-4 w-16 justify-end">
                <Icon name={wCfg.icon} className={`w-4 h-4 ${wCfg.color}`} />
                <span className={`text-[11px] font-bold ${wCfg.color}`}>{wCfg.label}</span>
              </div>

              {/* 등락률 */}
              <span
                className={`text-xs font-black font-mono w-14 text-right ${
                  stock.direction === 'up'
                    ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]')
                    : 'text-red-500'
                }`}
              >
                {stock.direction === 'up' ? '+' : ''}{stock.change.toFixed(1)}%
              </span>

              {/* 화살표 */}
              <Icon name="chevronRight" className={`w-4 h-4 ml-2 flex-shrink-0 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
