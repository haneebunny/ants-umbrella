'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';

const WEATHER_ICON = {
  sunny:   { icon: 'sun',       label: '맑음', color: 'text-amber-400',  pillBg: 'bg-amber-50 border-amber-200',     darkPillBg: 'bg-amber-900/30 border-amber-700/40'   },
  cloudy:  { icon: 'cloud',     label: '구름', color: 'text-slate-400',  pillBg: 'bg-slate-50 border-slate-200',     darkPillBg: 'bg-slate-800/40 border-slate-600/30'   },
  rainy:   { icon: 'cloudRain', label: '비',   color: 'text-sky-400',    pillBg: 'bg-sky-50 border-sky-200',         darkPillBg: 'bg-sky-900/30 border-sky-700/40'       },
  thunder: { icon: 'zap',       label: '번개', color: 'text-rose-400',   pillBg: 'bg-rose-50 border-rose-200',       darkPillBg: 'bg-rose-900/30 border-rose-700/40'     },
};

const INDICATOR_COLOR = {
  sunny:   'bg-amber-400',
  cloudy:  'bg-slate-400',
  rainy:   'bg-sky-400',
  thunder: 'bg-rose-400',
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
function FloatingPanel({ stock, anchorRect, isDark, onClose, onNavigate }) {
  const wCfg   = WEATHER_ICON[stock.weather] || WEATHER_ICON.cloudy;
  const wBg    = WEATHER_BG[stock.weather]   || WEATHER_BG.cloudy;
  const panelW = 280;
  const panelH = 300;

  // anchorRect 기준 위치 계산 (오른쪽 or 왼쪽)
  const spaceRight = window.innerWidth - anchorRect.right;
  const left = spaceRight > panelW + 16
    ? anchorRect.right + 8
    : anchorRect.left - panelW - 8;

  // 세로 위치: 클릭 행 기준 (화면 아래 잘리면 위로)
  let top = anchorRect.top - 16;
  if (top + panelH > window.innerHeight - 16) {
    top = window.innerHeight - panelH - 16;
  }

  return (
    <>
      {/* 배경 딤 (클릭 닫기) */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* 패널 */}
      <div
        className={`fixed z-50 rounded-2xl shadow-2xl border overflow-hidden ${
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

          {/* 등락률 */}
          <p className={`text-xl font-black font-mono mt-2 ${
            stock.direction === 'up' ? 'text-white' : 'text-white/80'
          }`}>
            {stock.direction === 'up' ? '▲' : '▼'} {Math.abs(stock.change).toFixed(1)}%
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
              {stock.detail?.reason || '최근 수집된 특이 리스크 신호가 수집되지 않아 업종 평균 수준의 안정적 상태를 유지하고 있습니다.'}
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

/**
 * 종목별 날씨 목록 — 클릭 시 플로팅 오버레이 패널
 */
export default function StockWeatherList({ stocks = [], isDark }) {
  const router = useRouter();
  const [selected, setSelected]       = useState(null); // { stock, rect }
  const buttonRefs = useRef({});

  // 외부 클릭·ESC 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-[#69dbad]' : 'bg-slate-100 text-slate-600'}`}>
            실시간
          </span>
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

                {/* 등락률 */}
                <span className={`text-xs font-black font-mono w-14 text-right ${
                  stock.direction === 'up'
                    ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]')
                    : 'text-rose-400'
                }`}>
                  {stock.direction === 'up' ? '+' : ''}{stock.change.toFixed(1)}%
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
          anchorRect={selected.rect}
          isDark={isDark}
          onClose={() => setSelected(null)}
          onNavigate={(ticker) => router.push(`/stock/${ticker}`)}
        />
      )}
    </>
  );
}
