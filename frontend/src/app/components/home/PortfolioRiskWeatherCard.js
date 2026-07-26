'use client';

import React, { useState } from 'react';
import AssetChart from '../AssetChart';
import Icon from '../Icon';

// ── 날씨별 도넛 색상 팔레트 ──────────────────────────────────────
const WEATHER_PALETTES = {
  sunny: [
    '#fbbf24', '#fde047', '#fef08a', '#fef9c3',
    '#f59e0b', '#facc15', '#fcd34d', '#fefce8',
  ],
  cloudy: [
    '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff',
    '#6366f1', '#93c5fd', '#bfdbfe', '#eff6ff',
  ],
  rainy: [
    '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe',
    '#0ea5e9', '#67e8f9', '#a5f3fc', '#f0fdff',
  ],
  thunder: [
    '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6',
    '#f43f5e', '#fca5a5', '#fed7d7', '#fff1f2',
  ],
};

// ── 레이더 5대 축 정의 ──────────────────────────────────────────
const RADAR_AXES = [
  { key: 'sectorDiv',    label: '업종\n다각화', desc: '금융·IT·철강 등 특정 산업군에 자산이 쏠리지 않고 분산된 정도' },
  { key: 'stockSpread',  label: '종목\n분산도', desc: '특정 1~2개 종목에 자금이 몰리지 않고 고르게 나뉜 투자 비중' },
  { key: 'volatilityFit',label: '변동성\n적합도', desc: '고객님의 투자 위험 성향 대비 포트폴리오 주가 변동 폭의 적합성' },
  { key: 'capStability', label: '시총\n안정성', desc: '대형 우량주 비중 기반의 재무 펀더멘털 및 주가 하방 안정성' },
  { key: 'esgRisk',      label: 'ESG\n안전도', desc: 'E(환경)·S(사회)·G(지배구조) 사법/공시 리스크 노출도가 낮고 안전한 정도' },
];

const N = RADAR_AXES.length;
const CENTER = 110;
const R = 58; 

function polarToXY(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function radarPoints(scores, scale = 1) {
  return RADAR_AXES.map((ax, i) => {
    const angle = (360 / N) * i;
    const r = ((scores[ax.key] ?? 0) / 100) * R * scale;
    return polarToXY(angle, r);
  });
}

function pointsStr(pts) {
  return pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

const RADAR_COLORS = {
  sunny:   { fill: 'rgba(251,191,36,0.35)',  stroke: '#fbbf24' },
  cloudy:  { fill: 'rgba(129,140,248,0.35)', stroke: '#a5b4fc' },
  rainy:   { fill: 'rgba(56,189,248,0.35)',  stroke: '#38bdf8' },
  thunder: { fill: 'rgba(251,113,133,0.35)', stroke: '#fb7185' },
};

function RadarChart({ scores, weatherStatus, isDark }) {
  const [hoveredAx, setHoveredAx] = useState(null);
  const rings = [0.25, 0.5, 0.75, 1];
  const radarColor = RADAR_COLORS[weatherStatus] || RADAR_COLORS.sunny;
  const axisColor  = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const labelColor = isDark ? '#94a3b8' : '#64748b';

  const dataPoints = radarPoints(scores);
  const outerPoints = RADAR_AXES.map((_, i) => polarToXY((360 / N) * i, R));
  const perimeterApprox = R * 2 * Math.PI;

  return (
    <div className="flex flex-col items-center gap-2 px-6">
      <svg viewBox="0 0 220 220" className="w-full max-w-[200px]" style={{ overflow: 'visible' }}>
        {rings.map((r, ri) => (
          <polygon
            key={r}
            points={pointsStr(RADAR_AXES.map((_, i) => polarToXY((360 / N) * i, R * r)))}
            fill={isDark
              ? `rgba(255,255,255,${0.04 - ri * 0.008})`
              : `rgba(0,0,0,${0.05 - ri * 0.01})`
            }
            stroke={axisColor}
            strokeWidth="0.8"
          />
        ))}

        {outerPoints.map((pt, i) => (
          <line
            key={i}
            x1={CENTER} y1={CENTER}
            x2={pt.x.toFixed(1)} y2={pt.y.toFixed(1)}
            stroke={axisColor}
            strokeWidth="0.8"
          />
        ))}

        <style>{`
          @keyframes radarDrawIn {
            from { stroke-dashoffset: ${perimeterApprox.toFixed(0)}; fill-opacity: 0; }
            to   { stroke-dashoffset: 0; fill-opacity: 1; }
          }
        `}</style>
        <polygon
          key={JSON.stringify(scores)}
          points={pointsStr(dataPoints)}
          fill={radarColor.fill}
          stroke={radarColor.stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray={perimeterApprox.toFixed(0)}
          strokeDashoffset={perimeterApprox.toFixed(0)}
          style={{ animation: 'radarDrawIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        />

        {dataPoints.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x} cy={pt.y}
            r="3.5"
            fill={radarColor.stroke}
            className="transition-transform duration-200 hover:scale-150 cursor-pointer"
          />
        ))}

        {outerPoints.map((pt, i) => {
          const ax = RADAR_AXES[i];
          const isLeft = pt.x < CENTER - 10;
          const isRight = pt.x > CENTER + 10;
          const isTop = pt.y < CENTER - 30;
          const isBottom = pt.y > CENTER + 30;

          let textAnchor = 'middle';
          let dy = '0.3em';
          let dx = '0';

          if (isLeft) { textAnchor = 'end'; dx = '-6'; }
          else if (isRight) { textAnchor = 'start'; dx = '6'; }

          if (isTop) dy = '-8';
          else if (isBottom) dy = '16';

          const lines = ax.label.split('\n');

          return (
            <text
              key={i}
              x={pt.x}
              y={pt.y}
              dx={dx}
              dy={dy}
              textAnchor={textAnchor}
              className="text-[10px] font-black cursor-pointer select-none transition-all duration-300"
              fill={hoveredAx === ax.key ? (isDark ? '#69dbad' : '#3eb489') : labelColor}
              onMouseEnter={() => setHoveredAx(ax.key)}
              onMouseLeave={() => setHoveredAx(null)}
            >
              {lines.map((ln, li) => (
                <tspan key={li} x={pt.x} dy={li > 0 ? '1.1em' : dy} dx={dx}>
                  {ln}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>

      {/* 축 정보 설명 영역 */}
      <div className="h-10 text-center flex items-center justify-center max-w-[280px]">
        {hoveredAx ? (
          <p className="text-[10px] leading-relaxed animate-fadeIn text-slate-400">
            <span className={`font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {RADAR_AXES.find(a => a.key === hoveredAx)?.label.replace('\n', ' ')}:
            </span>{' '}
            {RADAR_AXES.find(a => a.key === hoveredAx)?.desc}
          </p>
        ) : (
          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            각 항목 글씨에 마우스를 올리면 상세 평가 기준이 나타납니다.
          </p>
        )}
      </div>
    </div>
  );
}

// ── 날씨별 아이콘 정보 ──────────────────────────────────────────
const WEATHER_MAP = {
  sunny:   { icon: 'sun',      color: 'text-amber-500',      bg: 'bg-amber-500/10',    label: '맑음' },
  cloudy:  { icon: 'cloud',    color: 'text-indigo-400',     bg: 'bg-indigo-400/10',   label: '흐림' },
  rainy:   { icon: 'rain',     color: 'text-sky-400',        bg: 'bg-sky-400/10',      label: '비' },
  thunder: { icon: 'lightning',color: 'text-rose-500',       bg: 'bg-rose-500/10',     label: '우레' },
};

export default function PortfolioRiskWeatherCard({ summary, radarScores, stocks, isDark, isLoading }) {
  const [activeTab, setActiveTab] = useState('donut'); // 'donut' | 'radar' | 'none'
  
  if (isLoading || !summary || !summary.holdings) {
    return (
      <div className={`flex flex-col rounded-2xl border p-6 animate-pulse min-h-[500px] ${
        isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="h-4 w-40 rounded mb-6 bg-slate-400/10" />
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="w-full lg:w-[40%] h-48 rounded-full bg-slate-400/10 mx-auto" />
          <div className="w-full lg:w-[60%] space-y-4 pt-4">
            <div className="h-10 w-full rounded bg-slate-400/10" />
            <div className="h-6 w-3/4 rounded bg-slate-400/5" />
          </div>
        </div>
        <div className="h-32 w-full rounded bg-slate-400/5" />
      </div>
    );
  }

  // ── 날씨와 보유 종목 결합 매핑 ──
  const mergedHoldings = summary.holdings.map(h => {
    const weatherStock = stocks.find(s => s.ticker === h.ticker);
    return {
      ...h,
      weather: weatherStock ? weatherStock.weather : 'cloudy',
      change: weatherStock ? weatherStock.change : 0,
      direction: weatherStock ? weatherStock.direction : 'same'
    };
  });

  // 날씨 상태 도출
  const weatherStatus = summary.weatherStatus || 'sunny';
  const palette = WEATHER_PALETTES[weatherStatus] || WEATHER_PALETTES.sunny;

  return (
    <div className={`flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
      isDark
        ? 'bg-[#1e2220] border-white/5 card-glow-dark'
        : 'bg-white border-slate-100 shadow-sm card-glow-light'
    }`}>
      
      {/* ── 1. 헤더 영역 (타이틀 및 탭 제어) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-dashed border-slate-200/10">
        <div className="flex items-center gap-2">
          <Icon name="briefcase" className="w-4 h-4 text-emerald-500" />
          <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
            내 포트폴리오 자산 및 위험 기상도
          </h3>
        </div>
        
        {/* 미니 탭 스위치 */}
        <div className="flex bg-slate-400/10 p-0.5 rounded-lg text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('donut')}
            className={`px-3 py-1 rounded-md font-bold transition-all ${
              activeTab === 'donut'
                ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            자산 구성 (도넛)
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1 rounded-md font-bold transition-all ${
              activeTab === 'radar'
                ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            포트폴리오 핏 (레이더)
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'none' ? 'donut' : 'none')}
            className={`px-2 py-1 rounded-md font-bold transition-all ${
              activeTab === 'none'
                ? (isDark ? 'bg-rose-950/40 text-rose-400' : 'bg-rose-50 text-rose-600')
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            차트 접기
          </button>
        </div>
      </div>

      {/* ── 2. 차트 및 총 자산 요약 영역 (ActiveTab에 따라 접기 지원) ── */}
      {activeTab !== 'none' && (
        <div className="flex flex-col lg:flex-row gap-8 items-center pb-6 mb-6 border-b border-dashed border-slate-200/10 animate-fadeIn">
          {/* 차트 렌더링 공간 */}
          <div className="w-full lg:w-[40%] flex justify-center flex-shrink-0">
            {activeTab === 'donut' ? (
              <div className="w-full max-w-[200px] h-[200px] flex items-center justify-center relative">
                <AssetChart
                  data={summary.holdings.map(h => ({ name: h.name, value: h.valuation }))}
                  palette={palette}
                  isDark={isDark}
                />
              </div>
            ) : (
              <RadarChart scores={radarScores} weatherStatus={weatherStatus} isDark={isDark} />
            )}
          </div>

          {/* 자산 현황 텍스트 */}
          <div className="w-full lg:w-[60%] grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>총 평가 자산</span>
              <p className={`text-base font-mono font-black mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {summary.totalValuation.toLocaleString()}원
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>평가 손익</span>
              <p className={`text-base font-mono font-black mt-1 ${
                summary.totalProfit >= 0
                  ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]')
                  : 'text-rose-500'
              }`}>
                {summary.totalProfit >= 0 ? '+' : ''}{summary.totalProfit.toLocaleString()}원
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>누적 수익률</span>
              <p className={`text-base font-mono font-black mt-1 ${
                summary.totalProfitRate >= 0
                  ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]')
                  : 'text-rose-500'
              }`}>
                {summary.totalProfitRate >= 0 ? '+' : ''}{summary.totalProfitRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. 자산 & 리스크 융합 테이블 (Holdings & Weather Table) ── */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left min-w-[650px] border-collapse">
          <thead>
            <tr className={`border-b text-[10px] font-black tracking-wider ${isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
              <th className="pb-2.5 w-14 text-center">날씨</th>
              <th className="pb-2.5">종목명 (비중)</th>
              <th className="pb-2.5 text-right w-28">보유수량 / 평단가</th>
              <th className="pb-2.5 text-right w-28">실시간 시세</th>
              <th className="pb-2.5 text-right w-36">평가액 / 손익 (수익률)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-slate-200/5">
            {mergedHoldings.map(h => {
              const wCfg = WEATHER_MAP[h.weather] || WEATHER_MAP.cloudy;
              const isUp = h.direction === 'up';
              const isProfitPositive = h.profit >= 0;

              return (
                <tr
                  key={h.ticker}
                  className={`group transition-all duration-150 ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                >
                  {/* 날씨 리스크 (아이콘 뱃지 형태) */}
                  <td className="py-3 text-center">
                    <div className="flex justify-center">
                      <span className={`p-1.5 rounded-lg flex items-center justify-center ${wCfg.bg}`}>
                        <Icon name={wCfg.icon} className={`w-4 h-4 ${wCfg.color}`} />
                      </span>
                    </div>
                  </td>

                  {/* 종목명 및 비중 */}
                  <td className="py-3">
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                        {h.name}
                      </span>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>
                        비중 {h.weight.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* 보유 수량 및 평단가 */}
                  <td className="py-3 text-right">
                    <div className="flex flex-col font-mono text-xs">
                      <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {h.quantity}주
                      </span>
                      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-0.5`}>
                        {h.purchasePrice.toLocaleString()}원
                      </span>
                    </div>
                  </td>

                  {/* 실시간 시세 (현재가 및 등락률 뱃지) */}
                  <td className="py-3 text-right">
                    <div className="flex flex-col items-end gap-1 font-mono">
                      <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {h.currentPrice.toLocaleString()}원
                      </span>
                      
                      {/* 미니 변동률 뱃지 */}
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        isUp
                          ? (isDark ? 'bg-[#69dbad]/15 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#3eb489]')
                          : (isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50/10 text-rose-600')
                      }`}>
                        <span>{isUp ? '▲' : '▼'}</span>
                        <span>{h.change.toFixed(1)}%</span>
                      </span>
                    </div>
                  </td>

                  {/* 평가액 / 손익 및 수익률 */}
                  <td className="py-3 text-right">
                    <div className="flex flex-col font-mono">
                      <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {h.valuation.toLocaleString()}원
                      </span>
                      
                      <span className={`text-[10px] font-black mt-0.5 ${
                        isProfitPositive
                          ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]')
                          : 'text-rose-500'
                      }`}>
                        {isProfitPositive ? '+' : ''}{h.profit.toLocaleString()}원 ({isProfitPositive ? '+' : ''}{h.profitRate.toFixed(2)}%)
                      </span>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
