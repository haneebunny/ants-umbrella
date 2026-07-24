"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 초기 관심 주식 추천 데이터 (10개 주요 종목)
const DEFAULT_WATCHLIST = [
  { ticker: '005930', name: '삼성전자',        weather: 'sunny',   change:  1.5, direction: 'up',   price: '78,500원' },
  { ticker: '000660', name: 'SK하이닉스',      weather: 'sunny',   change:  1.8, direction: 'up',   price: '268,500원' },
  { ticker: '035420', name: 'NAVER',           weather: 'cloudy',  change: -0.5, direction: 'down', price: '169,500원' },
  { ticker: '035720', name: '카카오',          weather: 'thunder', change: -1.2, direction: 'down', price: '37,900원' },
  { ticker: '373220', name: 'LG에너지솔루션',  weather: 'cloudy',  change: -0.8, direction: 'down', price: '372,500원' },
  { ticker: '006400', name: '삼성SDI',         weather: 'sunny',   change:  0.6, direction: 'up',   price: '395,000원' },
  { ticker: '086520', name: '에코프로',        weather: 'thunder', change: -2.1, direction: 'down', price: '94,200원' },
  { ticker: '247540', name: '에코프로비엠',    weather: 'rainy',   change: -1.5, direction: 'down', price: '184,000원' },
  { ticker: '196170', name: '알테오젠',        weather: 'sunny',   change:  2.4, direction: 'up',   price: '284,500원' },
  { ticker: '005490', name: 'POSCO홀딩스',     weather: 'cloudy',  change: -0.4, direction: 'down', price: '275,200원' },
];

const WEATHER_MAP = {
  sunny:   { icon: 'sun',       color: 'text-amber-400', label: '맑음' },
  cloudy:  { icon: 'cloud',     color: 'text-slate-400', label: '구름' },
  rainy:   { icon: 'cloudRain', color: 'text-sky-400',   label: '비' },
  thunder: { icon: 'zap',       color: 'text-rose-400',  label: '번개' },
};

export default function WatchlistCard({ isDark }) {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [starred, setStarred] = useState(['005930', '000660', '035420', '196170']);

  // 마운트 시 localStorage 복원 및 백엔드 실제 실시간 주가 API 연동
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ants_watchlist_starred');
      if (saved) setStarred(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to load watchlist:', e);
    }

    async function fetchWatchlistLiveData() {
      try {
        const tickers = DEFAULT_WATCHLIST.map(s => s.ticker).join(',');
        const res = await fetch(`${API_BASE}/api/dashboard-weather?tickers=${tickers}`, {
          signal: AbortSignal.timeout(5000)
        });
        if (!res.ok) return;
        const apiData = await res.json();
        const apiMap = {};
        for (const row of apiData) apiMap[row.ticker] = row;

        setWatchlist(prev => prev.map(stock => {
          const live = apiMap[stock.ticker];
          if (!live || !live.available) return stock;
          return {
            ...stock,
            weather: live.weather || stock.weather,
            direction: live.direction || stock.direction,
            change: live.change !== null && live.change !== undefined ? live.change : stock.change,
            price: live.currentPrice ? `${live.currentPrice.toLocaleString()}원` : stock.price
          };
        }));
      } catch (err) {
        console.warn('[WatchlistCard] API fetch fallback to mock:', err);
      }
    }
    fetchWatchlistLiveData();
  }, []);

  // 즐겨찾기 토글
  const toggleStar = (e, ticker) => {
    e.stopPropagation();
    const next = starred.includes(ticker)
      ? starred.filter(t => t !== ticker)
      : [...starred, ticker];
    setStarred(next);
    try {
      localStorage.setItem('ants_watchlist_starred', JSON.stringify(next));
    } catch (err) {
      console.warn('Failed to save watchlist:', err);
    }
  };

  return (
    <div className={`flex flex-col rounded-2xl border p-4 sm:p-5 transition-all duration-300 ${
      isDark
        ? 'bg-[#141715] border-white/10 card-glow-dark'
        : 'bg-white border-slate-100 shadow-sm card-glow-light'
    }`}>
      {/* ── 위젯 헤더 ── */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Icon name="star" className="w-4 h-4 text-amber-400 fill-amber-400 -ml-0.5" />
          <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
            관심 주식
          </h3>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
            isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'
          }`}>
            {watchlist.length}개
          </span>
        </div>

        <button
          onClick={() => router.push('/portfolio/register')}
          className={`text-[11px] font-bold flex items-center gap-1 transition-all px-2.5 py-1 rounded-lg ${
            isDark ? 'bg-white/10 text-[#69dbad] hover:bg-white/15' : 'bg-slate-100 text-[#3eb489] hover:bg-slate-200'
          }`}
        >
          <span>+ 종목 추가</span>
        </button>
      </div>

      {/* ── 관심 종목 10개 (선택 버튼 좌측밀착 및 텍스트 간격 정밀 보정) ── */}
      <div className="flex flex-col space-y-1 pt-1">
        {watchlist.map(stock => {
          const isStarred = starred.includes(stock.ticker);
          const wCfg = WEATHER_MAP[stock.weather] || WEATHER_MAP.cloudy;
          const isUp = stock.direction === 'up';

          return (
            <div
              key={stock.ticker}
              onClick={() => router.push(`/stock/${stock.ticker}`)}
              className={`flex items-center justify-between px-2.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                isDark
                  ? 'hover:bg-white/10 border border-transparent hover:border-white/10'
                  : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
              }`}
            >
              {/* 좌측: 즐겨찾기 선택 버튼 (좌측으로 밀착하여 종목명과 간격 정밀 정렬) */}
              <div className="flex items-center gap-2 min-w-0 -ml-1">
                <button
                  onClick={(e) => toggleStar(e, stock.ticker)}
                  aria-label="즐겨찾기 토글"
                  className="p-1 rounded-lg transition-all active:scale-95 flex-shrink-0 hover:bg-white/10"
                >
                  <Icon
                    name="star"
                    className={`w-4 h-4 transition-colors ${
                      isStarred
                        ? 'text-amber-400 fill-amber-400'
                        : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-300 hover:text-slate-500')
                    }`}
                  />
                </button>

                <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  {stock.name}
                </span>
              </div>

              {/* 우측: 날씨 배지 + 주가 + 등락률 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Icon name={wCfg.icon} className={`w-3.5 h-3.5 ${wCfg.color}`} />

                <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {stock.price}
                </span>

                <span className={`text-xs font-black font-mono w-14 text-right ${
                  isUp
                    ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]')
                    : 'text-rose-400'
                }`}>
                  {isUp ? '+' : ''}{stock.change.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
