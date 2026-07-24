"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';

// 초기 관심 주식 추천 데이터 (10개 주요 종목)
const DEFAULT_WATCHLIST = [
  { ticker: '005930', name: '삼성전자',        weather: 'sunny',   change:  1.2, direction: 'up',   price: '78,400' },
  { ticker: '000660', name: 'SK하이닉스',      weather: 'sunny',   change:  1.8, direction: 'up',   price: '189,500' },
  { ticker: '035420', name: 'NAVER',           weather: 'cloudy',  change: -0.5, direction: 'down', price: '182,000' },
  { ticker: '035720', name: '카카오',          weather: 'thunder', change: -1.2, direction: 'down', price: '37,900' },
  { ticker: '373220', name: 'LG에너지솔루션',  weather: 'cloudy',  change: -0.8, direction: 'down', price: '372,500' },
  { ticker: '006400', name: '삼성SDI',         weather: 'sunny',   change:  0.6, direction: 'up',   price: '395,000' },
  { ticker: '086520', name: '에코프로',        weather: 'thunder', change: -2.1, direction: 'down', price: '94,200' },
  { ticker: '247540', name: '에코프로비엠',    weather: 'rainy',   change: -1.5, direction: 'down', price: '184,000' },
  { ticker: '196170', name: '알테오젠',        weather: 'sunny',   change:  2.4, direction: 'up',   price: '284,500' },
  { ticker: '005490', name: 'POSCO홀딩스',     weather: 'cloudy',  change: -0.4, direction: 'down', price: '275,200' },
];

const WEATHER_MAP = {
  sunny:   { icon: 'sun',       color: 'text-amber-500', label: '맑음' },
  cloudy:  { icon: 'cloud',     color: 'text-slate-400', label: '구름' },
  rainy:   { icon: 'cloudRain', color: 'text-sky-400',   label: '비' },
  thunder: { icon: 'zap',       color: 'text-rose-400',  label: '번개' },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function WatchlistCard({ isDark, portfolio = [] }) {
  const router = useRouter();

  // 1. 포트폴리오 보유 종목을 실시간 시세 우선 순위에 두고, 10개가 안 채워지면 기본 추천주로 채움
  const mergedDefaultList = useMemo(() => {
    const holdingTickers = new Set((portfolio || []).map(p => p.ticker));
    
    const holdingsConverted = (portfolio || []).map(p => ({
      ticker: p.ticker,
      name: p.name,
      weather: p.weather || 'sunny',
      change: Math.abs(p.change || 0.0),
      direction: p.direction || 'up',
      price: p.price || (p.detail && p.detail.price) || '50,000'
    }));

    const nonOverlapDefault = DEFAULT_WATCHLIST.filter(d => !holdingTickers.has(d.ticker));
    const merged = [...holdingsConverted, ...nonOverlapDefault];
    return merged.slice(0, 10);
  }, [portfolio]);

  const [watchlist, setWatchlist] = useState(mergedDefaultList);

  // 포트폴리오 변경 시 리스트 갱신
  useEffect(() => {
    setWatchlist(mergedDefaultList);
  }, [mergedDefaultList]);

  // 실시간 KIS 가격 호출 연동
  useEffect(() => {
    const fetchWatchlistPrices = async () => {
      const tickers = mergedDefaultList.map(w => w.ticker).join(',');
      if (!tickers) return;
      try {
        const res = await fetch(`${API_BASE}/api/watchlist-prices?tickers=${tickers}`);
        if (res.ok) {
          const data = await res.json();
          const dataMap = {};
          data.forEach(item => {
            dataMap[item.ticker] = item;
          });
          
          setWatchlist(prevList => prevList.map(stock => {
            const live = dataMap[stock.ticker];
            if (live && live.price > 0) {
              return {
                ...stock,
                price: new Intl.NumberFormat('ko-KR').format(live.price),
                change: Math.abs(live.change_rate),
                direction: live.direction,
                weather: live.weather || stock.weather
              };
            }
            return stock;
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch watchlist live prices:', err);
      }
    };

    fetchWatchlistPrices();
    const interval = setInterval(fetchWatchlistPrices, 30000); // 30초 주기 실시간 연동
    return () => clearInterval(interval);
  }, [mergedDefaultList]);

  return (
    <div className={`flex flex-col rounded-2xl border p-5 transition-all duration-300 ${
      isDark
        ? 'bg-[#1e2220] border-white/5 card-glow-dark'
        : 'bg-white border-slate-100 shadow-sm card-glow-light'
    }`}>
      {/* ── 위젯 헤더 ── */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Icon name="activity" className="w-4 h-4 text-emerald-500" />
          <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
            주식 실시간 시세
          </h3>
        </div>
      </div>

      {/* ── 관심 종목 10개 (실시간 시세 항목 리스트) ── */}
      <div className="flex flex-col space-y-2 pt-1">
        {watchlist.map(stock => {
          const wCfg = WEATHER_MAP[stock.weather] || WEATHER_MAP.cloudy;
          const isUp = stock.direction === 'up';

          return (
            <div
              key={stock.ticker}
              onClick={() => router.push(`/stock/${stock.ticker}`)}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer transition-all ${
                isDark
                  ? 'hover:bg-white/5 border border-transparent hover:border-white/5'
                  : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
              }`}
            >
              {/* 좌측: 날씨 아이콘 + 종목명 */}
              <div className="flex items-center gap-3 min-w-0">
                <Icon name={wCfg.icon} className={`w-4 h-4 flex-shrink-0 ${wCfg.color}`} />
                
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    {stock.name}
                  </span>
                  <span className={`text-[9px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    {stock.ticker}
                  </span>
                </div>
              </div>

              {/* 우측: 주가 + 화살표 전일대비 등락률 */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                  {stock.price}원
                </span>

                <span className={`text-xs font-black font-mono flex items-center gap-0.5 w-16 justify-end ${
                  isUp
                    ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]')
                    : 'text-rose-500'
                }`}>
                  <span>{isUp ? '▲' : '▼'}</span>
                  <span>{stock.change.toFixed(1)}%</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
