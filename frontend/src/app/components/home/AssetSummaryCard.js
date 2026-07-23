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
  { key: 'sectorDiv',    label: '업종\n다각화' },
  { key: 'stockSpread',  label: '종목\n분산도' },
  { key: 'volatilityFit',label: '변동성\n적합도' },
  { key: 'capStability', label: '시총\n안정성' },
  { key: 'esgRisk',      label: 'ESG\n안전도' },
];

const N = RADAR_AXES.length;
const CENTER = 110;
const R = 58; // max radius (줄여서 여백 확보)

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

// 날씨별 레이더 색상
const RADAR_COLORS = {
  sunny:   { fill: 'rgba(251,191,36,0.35)',  stroke: '#fbbf24', glow: '0 0 8px rgba(251,191,36,0.8),  0 0 20px rgba(251,191,36,0.4)' },
  cloudy:  { fill: 'rgba(129,140,248,0.35)', stroke: '#a5b4fc', glow: '0 0 8px rgba(129,140,248,0.8), 0 0 20px rgba(129,140,248,0.4)' },
  rainy:   { fill: 'rgba(56,189,248,0.35)',  stroke: '#38bdf8', glow: '0 0 8px rgba(56,189,248,0.8),  0 0 20px rgba(56,189,248,0.4)'  },
  thunder: { fill: 'rgba(251,113,133,0.35)', stroke: '#fb7185', glow: '0 0 8px rgba(251,113,133,0.8), 0 0 20px rgba(251,113,133,0.4)' },
};

function RadarChart({ scores, weatherStatus, isDark }) {
  const rings = [0.25, 0.5, 0.75, 1];
  const radarColor = RADAR_COLORS[weatherStatus] || RADAR_COLORS.sunny;
  const axisColor  = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const dotColor   = radarColor.stroke;

  const dataPoints = radarPoints(scores);
  const outerPoints = RADAR_AXES.map((_, i) => polarToXY((360 / N) * i, R));

  // 애니메이션용 perimeter 계산 (대략)
  const perimeterApprox = R * 2 * Math.PI;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 220 220" className="w-full max-w-[280px]" style={{ overflow: 'visible' }}>
        {/* 배경 링 — 안쪽일수록 진하게 (depth 그라디언트) */}
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

        {/* 축선 */}
        {outerPoints.map((pt, i) => (
          <line
            key={i}
            x1={CENTER} y1={CENTER}
            x2={pt.x.toFixed(1)} y2={pt.y.toFixed(1)}
            stroke={axisColor}
            strokeWidth="0.8"
          />
        ))}

        {/* 데이터 폴리곤 — draw-in 애니메이션 + 글로우 */}
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
          style={{
            animation: 'radarDrawIn 0.7s cubic-bezier(0.4,0,0.2,1) forwards',
            filter: `drop-shadow(${radarColor.glow})`,
          }}
        />

        {/* 데이터 점 */}
        {dataPoints.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x.toFixed(1)} cy={pt.y.toFixed(1)}
            r="3.5"
            fill={dotColor}
            stroke={isDark ? '#0d0f0d' : '#fff'}
            strokeWidth="1.5"
            style={{ filter: `drop-shadow(0 0 4px ${dotColor})` }}
          />
        ))}

        {/* 축 레이블 */}
        {outerPoints.map((pt, i) => {
          const labelR = R + 28;
          const lp = polarToXY((360 / N) * i, labelR);
          const lines = RADAR_AXES[i].label.split('\n');
          return (
            <text
              key={i}
              x={lp.x.toFixed(1)} y={(lp.y - (lines.length - 1) * 5).toFixed(1)}
              textAnchor="middle"
              fontSize="11"
              fill={labelColor}
              fontFamily="inherit"
            >
              {lines.map((ln, li) => (
                <tspan key={li} x={lp.x.toFixed(1)} dy={li === 0 ? 0 : 13}>{ln}</tspan>
              ))}
            </text>
          );
        })}
      </svg>

      {/* 점수 범례 */}
      <div className="grid grid-cols-5 gap-x-2 gap-y-1 w-full px-1">
        {RADAR_AXES.map(ax => (
          <div key={ax.key} className="flex flex-col items-center">
            <span className="text-[11px] font-black" style={{ color: dotColor }}>
              {scores[ax.key] ?? 0}
            </span>
            <span className={`text-[10px] text-center leading-tight ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {ax.label.replace('\n', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 보유 자산 요약 카드 (도넛 ↔ 레이더 탭 전환)
 * @param {Object}  props.summary        - assetSummary 객체
 * @param {Object}  props.radarScores    - 5대 포트폴리오 핏 점수
 * @param {boolean} props.isDark
 * @param {string}  props.weatherStatus  - 'sunny'|'cloudy'|'rainy'|'thunder'
 */
export default function AssetSummaryCard({ summary, radarScores, isDark, weatherStatus = 'sunny' }) {
  const [activeTab, setActiveTab] = useState('donut'); // 'donut' | 'radar'
  const { totalAsset = 0, riskAssetRatio = 0, holdings = [] } = summary || {};

  const palette = WEATHER_PALETTES[weatherStatus] || WEATHER_PALETTES.sunny;
  const chartWeights = holdings.map((h, i) => ({
    category: h.name,
    weight:   h.weight,
    color:    palette[i % palette.length],
  }));

  const formatted = new Intl.NumberFormat('ko-KR').format(totalAsset);

  const accentMap = {
    sunny:   isDark ? 'text-[#fbbf24]' : 'text-[#d97706]',
    cloudy:  isDark ? 'text-[#a5b4fc]' : 'text-[#4f46e5]',
    rainy:   isDark ? 'text-[#7dd3fc]' : 'text-[#0284c7]',
    thunder: isDark ? 'text-[#fda4af]' : 'text-[#e11d48]',
  };
  const borderMap = {
    sunny:   isDark ? 'border-amber-800/40'  : 'border-amber-200/70',
    cloudy:  isDark ? 'border-indigo-800/40' : 'border-indigo-200/70',
    rainy:   isDark ? 'border-cyan-800/40'   : 'border-cyan-200/70',
    thunder: isDark ? 'border-rose-800/40'   : 'border-rose-200/70',
  };
  const tabActiveMap = {
    sunny:   isDark ? 'bg-amber-800/40 text-amber-300'   : 'bg-amber-100 text-amber-800',
    cloudy:  isDark ? 'bg-indigo-800/40 text-indigo-300' : 'bg-indigo-100 text-indigo-800',
    rainy:   isDark ? 'bg-cyan-800/40 text-cyan-300'     : 'bg-cyan-100 text-cyan-800',
    thunder: isDark ? 'bg-rose-800/40 text-rose-300'     : 'bg-rose-100 text-rose-800',
  };

  const accent      = accentMap[weatherStatus]    || accentMap.sunny;
  const border      = borderMap[weatherStatus]    || borderMap.sunny;
  const tabActive   = tabActiveMap[weatherStatus] || tabActiveMap.sunny;
  const tabInactive = isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600';

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 ${
      isDark ? `bg-[#1e2220] ${border} card-glow-dark` : `bg-white ${border} shadow-sm card-glow-light`
    }`}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            보유 자산
          </p>
          <div className="flex items-baseline gap-1 mt-3">
            <span className={`text-lg font-black font-mono ${accent}`}>₩</span>
            <span className={`text-2xl font-black font-mono leading-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
              {formatted}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-500'
          }`}>
            위험자산 {riskAssetRatio}%
          </span>
          <a
            href="/portfolio/register"
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon name="edit" className="w-3 h-3" />
            편집
          </a>
        </div>
      </div>

      {/* ── 탭 버튼 ── */}
      <div className={`flex gap-1 mb-4 p-0.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
        {[
          { id: 'donut', icon: 'pieChart', label: '자산 구성' },
          { id: 'radar', icon: 'activity', label: '포트폴리오 핏' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              activeTab === tab.id ? tabActive : tabInactive
            }`}
          >
            <Icon name={tab.icon} className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 탭 콘텐츠 ── */}
      {activeTab === 'donut' && chartWeights.length > 0 && (
        <AssetChart theme={isDark ? 'dark' : 'light'} weights={chartWeights} />
      )}

      {activeTab === 'radar' && radarScores && (
        <RadarChart
          scores={radarScores}
          weatherStatus={weatherStatus}
          isDark={isDark}
        />
      )}
    </div>
  );
}
