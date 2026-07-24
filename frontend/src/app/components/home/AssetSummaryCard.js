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
  const [hoveredAx, setHoveredAx] = useState(null);
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
    <div className="flex flex-col items-center gap-2">
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

        {/* 각 축별 시각적 밸런스 옵티컬 오프셋 정의 */}
        {/* Index 0: 업종 다각화(약간 아래로 +6px), Index 1: 종목 분산도(우측 바깥 +10px), Index 4: ESG 안전도(좌측 바깥 -10px) */}
        {dataPoints.map((pt, i) => {
          const ax = RADAR_AXES[i];
          const score = scores[ax.key] ?? 0;
          
          const axisOffsets = [
            { r: R + 26, offsetY: 6,   offsetX: 0 },   // 0: 업종 다각화 (상단 center, 약간 내림)
            { r: R + 44, offsetY: -2,  offsetX: 6 },   // 1: 종목 분산도 (우측상단, 4px 왼쪽으로 이동)
            { r: R + 28, offsetY: -3,  offsetX: 8 },   // 2: 변동성 적합도 (우측하단)
            { r: R + 28, offsetY: -3,  offsetX: -8 },  // 3: 시총 안정성 (좌측하단)
            { r: R + 44, offsetY: -2,  offsetX: -10 }, // 4: ESG 안전도 (좌측상단, 바깥으로 벌림)
          ];




          const off = axisOffsets[i] || { r: R + 36, offsetX: 0, offsetY: 0 };
          const lpRaw = polarToXY((360 / N) * i, off.r);
          const lp = {
            x: lpRaw.x + off.offsetX,
            y: lpRaw.y + off.offsetY,
          };

          const isHovered = hoveredAx?.key === ax.key;
          const labelText = `${score}점 ${ax.label.replace('\n', ' ')}`;
          const badgeWidth = Math.max(76, labelText.length * 9.5);

          return (
            <g
              key={ax.key}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredAx(ax)}
              onMouseLeave={() => setHoveredAx(null)}
              onClick={() => setHoveredAx(isHovered ? null : ax)}
            >
              {/* 데이터 점 (호버 시 확대 & 글로우) */}
              <circle
                cx={pt.x.toFixed(1)} cy={pt.y.toFixed(1)}
                r={isHovered ? "5" : "3.5"}
                fill={dotColor}
                stroke={isDark ? '#0d0f0d' : '#fff'}
                strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 0 5px ${dotColor})` }}
              />

              {/* 옵션 3: 글자 뒤 반투명 글래스 뱃지 배경 (Text Backplate) */}
              <rect
                x={(lp.x - badgeWidth / 2).toFixed(1)}
                y={(lp.y - 10).toFixed(1)}
                width={badgeWidth.toFixed(1)}
                height="20"
                rx="10"
                fill={isDark ? 'rgba(15, 20, 17, 0.88)' : 'rgba(255, 255, 255, 0.92)'}
                stroke={isHovered ? dotColor : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)')}
                strokeWidth="1"
                className="transition-all duration-200"
                style={{
                  filter: isHovered ? `drop-shadow(0 0 6px ${dotColor})` : 'none',
                }}
              />

              {/* 꼭짓점 스마트 뱃지 텍스트 (점수 + 지표명) */}
              <text
                x={lp.x.toFixed(1)} y={(lp.y + 0.5).toFixed(1)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10.5"
                fontFamily="inherit"
              >
                <tspan fontWeight="900" fill={dotColor}>{score}점 </tspan>
                <tspan fontWeight="700" fill={isHovered ? (isDark ? '#fff' : '#0f1713') : labelColor}>
                  {ax.label.replace('\n', ' ')}
                </tspan>
              </text>
            </g>
          );
        })}


      </svg>

      {/* ── ℹ️ 툴팁 스마트 해설 카드 (높이 고정하여 레이아웃 시프트 방지) ── */}
      <div className="w-full min-h-[96px] h-[96px] flex items-stretch">
        {hoveredAx ? (
          <div className={`w-full p-3 rounded-xl border text-left transition-all animate-fadeIn ${
            isDark
              ? 'bg-zinc-800/90 border-emerald-500/40 text-slate-200 shadow-xl'
              : 'bg-white border-emerald-500/30 text-slate-800 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`font-black text-xs ${isDark ? 'text-[#69dbad]' : 'text-[#2d966e]'}`}>
                {hoveredAx.label.replace('\n', ' ')} ({scores[hoveredAx.key] ?? 0}점)
              </span>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ℹ️ 지표 스마트 해설</span>
            </div>
            <p className={`text-[12px] leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {hoveredAx.desc}
            </p>
          </div>
        ) : (
          <div className={`w-full p-2.5 rounded-xl text-[11px] text-center flex items-center justify-center transition-all ${
            isDark ? 'text-slate-400 bg-white/5 border border-white/5' : 'text-slate-500 bg-slate-50 border border-slate-200'
          }`}>
            <span>💡 각 항목 지표를 마우스로 건드리면 상세 해설이 나타납니다</span>
          </div>
        )}
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
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      isDark ? `bg-[#141715] ${border} card-glow-dark` : `bg-white ${border} shadow-sm card-glow-light`
    }`}>
      {/* ── 헤더 (종목별 날씨 카드 헤더와 100% 수평 Y축 픽셀 라인 맞춤) ── */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-50'}`}>
        <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
          보유 자산
        </p>
        <a
          href="/portfolio/register"
          className={`text-xs font-bold flex items-center gap-1 transition-all ${
            isDark ? 'text-[#69dbad] hover:text-[#52c49b]' : 'text-[#3eb489] hover:text-[#2ea070]'
          }`}
        >
          <Icon name="edit" className="w-3 h-3" />
          <span>편집</span>
        </a>
      </div>

      {/* ── 카드 본문 (p-5) ── */}
      <div className="p-5">
        {/* 하단 라인: 총 자산 금액(좌) + 우측 위험자산 뱃지(우) */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-baseline gap-1">
            <span className={`text-lg font-black font-mono ${accent}`}>₩</span>
            <span className={`text-2xl font-black font-mono leading-none ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
              {formatted}
            </span>
          </div>

          <div className="flex items-center justify-end">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0 ${
              isDark ? 'bg-rose-950/40 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              <span>위험자산</span>
              <span className="font-mono font-black">{riskAssetRatio}%</span>
            </span>
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
    </div>
  );
}
