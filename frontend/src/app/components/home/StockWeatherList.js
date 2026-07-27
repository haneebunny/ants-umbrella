'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const WEATHER_ICON = {
  sunny:   { icon: 'sun',       label: '맑음', color: 'text-amber-400',  pillBg: 'bg-amber-50 border-amber-200',     darkPillBg: 'bg-amber-900/30 border-amber-700/40'   },
  cloudy:  { icon: 'cloud',     label: '구름', color: 'text-slate-400',  pillBg: 'bg-slate-50 border-slate-200',     darkPillBg: 'bg-slate-800/40 border-slate-600/30'   },
  rainy:   { icon: 'cloudRain', label: '비',   color: 'text-sky-400',    pillBg: 'bg-sky-50 border-sky-200',         darkPillBg: 'bg-sky-900/30 border-sky-700/40'       },
  thunder: { icon: 'zap',       label: '번개', color: 'text-rose-400',   pillBg: 'bg-rose-50 border-rose-200',       darkPillBg: 'bg-rose-900/30 border-rose-700/40'     },
  // 예측 점수 없음 — 무채색으로 4단계와 구분한다
  unknown: { icon: 'cloud',     label: '예측 불가', color: 'text-slate-400', pillBg: 'bg-slate-50 border-slate-200', darkPillBg: 'bg-slate-800/40 border-slate-600/30' },
};

const INDICATOR_COLOR = {
  sunny:   'bg-amber-400',
  cloudy:  'bg-slate-400',
  rainy:   'bg-sky-400',
  thunder: 'bg-rose-400',
};

// 날씨(=하락예측률 구간) → 하락 위험 등급
const RISK_LABEL = {
  sunny:   { text: '양호',     color: 'text-emerald-500' },
  cloudy:  { text: '보통',     color: 'text-slate-400'   },
  rainy:   { text: '위험',     color: 'text-orange-500'  },
  thunder: { text: '매우위험', color: 'text-rose-500'    },
  // '보통'으로 표기하면 안 된다 — 판정을 못 한 것이지 위험이 낮은 게 아니다
  unknown: { text: '판정 불가', color: 'text-slate-400'  },
};

const WEATHER_BG = {
  sunny:   { from: '#fbbf24', to: '#fde047' },
  cloudy:  { from: '#818cf8', to: '#a5b4fc' },
  rainy:   { from: '#38bdf8', to: '#7dd3fc' },
  thunder: { from: '#fb7185', to: '#fda4af' },
};

function EsgBar({ score, isDark }) {
  const color = score >= 75 ? '#3eb489' : score >= 55 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-black font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

/** 플로팅 오버레이 패널 */
function FloatingPanel({ stock, live, anchorRect, isDark, onClose, onNavigate }) {
  const wCfg   = WEATHER_ICON[stock.weather] || WEATHER_ICON.cloudy;
  const wBg    = WEATHER_BG[stock.weather]   || WEATHER_BG.cloudy;
  const panelW = 280;

  // 등락률: '주식 실시간 시세'(watchlist-prices)와 동일한 실시간 값 사용.
  // 실시간 조회 실패/미체결(price<=0) 시 예측 기반 change로 폴백.
  const hasLive = live && typeof live.change_rate === 'number' && live.price > 0;
  const rate    = hasLive ? live.change_rate : (stock.change ?? 0);
  const isUp    = rate >= 0;

  // anchorRect 기준 위치 계산 (오른쪽 or 왼쪽)
  const spaceRight = window.innerWidth - anchorRect.right;
  const left = spaceRight > panelW + 16
    ? anchorRect.right + 8
    : anchorRect.left - panelW - 8;

  // 세로 위치: anchorRect 중앙 기준, 화면 위/아래 여백 16px 확보
  // panelH를 고정하지 않고 충분한 공간 확보 (실제 높이는 auto)
  const estimatedH = 320; // 넉넉하게 추정
  let top = anchorRect.top - 16;
  if (top + estimatedH > window.innerHeight - 16) {
    top = Math.max(16, window.innerHeight - estimatedH - 16);
  }
  if (top < 16) top = 16;

  return (
    <>
      {/* 배경 딤 (클릭 닫기) */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* 패널 */}
      <div
        className={`fixed z-50 rounded-2xl shadow-2xl border ${
          isDark ? 'bg-[#1a1d1a] border-white/10' : 'bg-white border-slate-100'
        }`}
        style={{
          left, top,
          width: panelW,
          animation: 'floatIn 0.18s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <style>{`
          @keyframes floatIn {
            from { opacity: 0; transform: scale(0.95) translateY(4px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>

        {/* 헤더 — 날씨 그라디언트 */}
        <div
          className="px-4 pt-4 pb-3"
          style={{ background: `linear-gradient(135deg, ${wBg.from} 0%, ${wBg.to} 100%)` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-0.5">
                {stock.detail?.sector}
              </p>
              <p className="text-base font-black text-white">{stock.name}</p>
              <p className="text-[10px] font-mono text-white/60">{stock.ticker}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                <Icon name={wCfg.icon} className="w-3 h-3 text-white" />
                <span className="text-[10px] font-black text-white">{wCfg.label}</span>
              </div>
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Icon name="x" className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>

          {/* 등락률 — 실시간 시세 연동 */}
          <p className={`text-xl font-black font-mono mt-2 ${isUp ? 'text-white' : 'text-white/80'}`}>
            {isUp ? '▲' : '▼'} {Math.abs(rate).toFixed(1)}%
          </p>
        </div>

        {/* 본문 */}
        <div className="px-4 py-3 flex flex-col gap-3">
          {/* AI 판단 근거 */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>AI 판단 근거</p>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {stock.detail?.reason || '최근 특별히 포착된 리스크 신호가 없어서 업종 평균 수준의 안정적인 상태를 유지하고 있어요! ☀️'}
            </p>
          </div>

          {/* ESG 점수 */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>ESG 안전 점수</p>
            <EsgBar score={stock.detail?.esgScore ?? 72} isDark={isDark} />
          </div>

          {/* 상세 보기 버튼 */}
          <button
            onClick={() => onNavigate(stock.ticker)}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
              isDark
                ? 'bg-white/10 text-slate-200 hover:bg-white/15'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Icon name="arrowRight" className="w-3 h-3" />
            종목 상세 보기
          </button>
        </div>
      </div>
    </>
  );
}

export default function StockWeatherList({ stocks = [], isDark, isLoading }) {
  const router = useRouter();
  const [selected, setSelected]       = useState(null); // { stock, rect }
  const [livePrices, setLivePrices]   = useState({});    // ticker → 실시간 시세
  const buttonRefs = useRef({});

  // 외부 클릭·ESC 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // '주식 실시간 시세'와 동일한 KIS 실시간 시세 조회 (30초 폴링)
  const tickerKey = stocks.map(s => s.ticker).join(',');
  useEffect(() => {
    if (!tickerKey) return;
    let active = true;
    const fetchPrices = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/watchlist-prices?tickers=${tickerKey}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        const map = {};
        data.forEach(it => { map[it.ticker] = it; }); // 응답 ticker는 6자리
        setLivePrices(map);
      } catch { /* 조회 실패 시 예측값으로 폴백 */ }
    };
    fetchPrices();
    const id = setInterval(fetchPrices, 30000);
    return () => { active = false; clearInterval(id); };
  }, [tickerKey]);

  if (isLoading) {
    return (
      <div className={`rounded-2xl border overflow-hidden animate-pulse ${
        isDark ? 'bg-[#1e2220] border-white/5 card-glow-dark' : 'bg-white border-slate-100 shadow-sm card-glow-light'
      }`}>
        {/* 헤더 */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-50'}`}>
          <div className="flex items-center gap-2">
            <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
              종목별 날씨
            </p>
            <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              종목 클릭 시 AI 상세 분석
            </p>
          </div>
        </div>
        <div className="p-3 space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-transparent">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-white/10' : 'bg-[#0f1713]/10'}`} />
                <div className="flex flex-col gap-1 min-w-0">
                  <div className={`h-3 w-16 rounded ${isDark ? 'bg-white/10' : 'bg-[#0f1713]/10'}`} />
                  <div className={`h-2 w-10 rounded ${isDark ? 'bg-white/5' : 'bg-[#0f1713]/5'}`} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`h-3.5 w-14 rounded-full ${isDark ? 'bg-white/10' : 'bg-[#0f1713]/10'}`} />
                <div className={`h-3.5 w-12 rounded ${isDark ? 'bg-white/10' : 'bg-[#0f1713]/10'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleClick = (stock) => {
    if (selected?.stock.ticker === stock.ticker) {
      setSelected(null);
      return;
    }
    const rect = buttonRefs.current[stock.ticker]?.getBoundingClientRect();
    if (rect) setSelected({ stock, rect });
  };

  return (
    <>
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-[#1e2220] border-white/5 card-glow-dark' : 'bg-white border-slate-100 shadow-sm card-glow-light'
      }`}>
        {/* 헤더 */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-50'}`}>
          <div className="flex items-center gap-2">
            <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
              종목별 날씨
            </p>
            <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              종목 클릭 시 AI 상세 분석
            </p>
          </div>
        </div>

        {/* 목록 */}
        <div>
          {stocks.map((stock, idx) => {
            const wCfg   = WEATHER_ICON[stock.weather] || WEATHER_ICON.cloudy;
            const isOpen = selected?.stock.ticker === stock.ticker;
            const isLast = idx === stocks.length - 1;

            return (
              <button
                key={stock.ticker}
                ref={el => { buttonRefs.current[stock.ticker] = el; }}
                onClick={() => handleClick(stock)}
                className={`w-full flex items-center px-5 py-3.5 text-left transition-all ${
                  !isLast ? (isDark ? 'border-b border-white/10' : 'border-b border-slate-50') : ''
                } ${isOpen
                    ? (isDark ? 'bg-white/15' : 'bg-slate-100')
                    : (isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50')
                }`}
              >
                {/* 선택 인디케이터 바 */}
                <div className={`w-1 h-6 rounded-full mr-3 flex-shrink-0 transition-all ${
                  isOpen ? INDICATOR_COLOR[stock.weather] || 'bg-slate-400' : 'bg-transparent'
                }`} />

                {/* 종목명 */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    {stock.name}
                  </p>
                  <p className={`text-[11px] font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {stock.ticker}
                  </p>
                </div>

                {/* 날씨 */}
                <div className="flex items-center gap-1.5 mr-4 w-16 justify-end">
                  <Icon name={wCfg.icon} className={`w-4 h-4 ${wCfg.color}`} />
                  <span className={`text-[11px] font-bold ${wCfg.color}`}>{wCfg.label}</span>
                </div>

                {/* 하락 위험 등급 (하락예측률 구간 기반) */}
                <span className={`text-xs font-black w-16 text-right ${
                  (RISK_LABEL[stock.weather] || RISK_LABEL.cloudy).color
                }`}>
                  {(RISK_LABEL[stock.weather] || RISK_LABEL.cloudy).text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 플로팅 패널 */}
      {selected && (
        <FloatingPanel
          stock={selected.stock}
          live={livePrices[selected.stock.ticker] || livePrices[String(selected.stock.ticker).padStart(6, '0')]}
          anchorRect={selected.rect}
          isDark={isDark}
          onClose={() => setSelected(null)}
          onNavigate={(ticker) => router.push(`/stock/${ticker}`)}
        />
      )}
    </>
  );
}
