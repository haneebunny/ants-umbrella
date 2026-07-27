"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const NAME_TO_TICKER = {
  'SK하이닉스': '000660',
  '삼성전자': '005930',
  '현대차': '005380',
  'NAVER': '035420',
  '신한지주': '055550',
  'SK텔레콤': '017670',
  'POSCO홀딩스': '005490',
  'S-Oil': '010950',
  '삼성물산': '028260',
  '기아': '000270',
  '셀트리온': '068270',
  '카카오': '035720',
  'LG화학': '051910',
  'LG': '003550',
  '엔씨소프트': '036570',
  'LG에너지솔루션': '373220',
  '삼성SDI': '006400',
  '에코프로': '086520',
  '에코프로비엠': '247540',
  '알테오젠': '196170',
  '삼성생명': '032830',
  'KT&G': '033780',
  'KB금융': '105560',
  '포스코인터': '047050',
  '포스코인터내셔널': '047050',
  '한국가스공사': '036460',
  '삼성전기': '009150',
  '한진': '011200',
  '넷마블': '251270',
};

export default function AssetChart({ theme, weights, data, isDark: propIsDark }) {
  const router = useRouter();
  const isDark = theme === 'dark' || propIsDark;
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const CHART_COLORS = [
    '#ff5a79', '#3eb489', '#ffaa44', '#a855f7', '#06b6d4', 
    '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#84cc16'
  ];

  let resolvedWeights = weights || [];
  if (!resolvedWeights.length && data && data.length) {
    resolvedWeights = data.map((item, idx) => ({
      category: item.name,
      weight: item.weight,
      color: item.color || CHART_COLORS[idx % CHART_COLORS.length]
    }));
  }

  const activeWeights = resolvedWeights.filter(w => w.weight > 0);
  const size = 180;
  const radius = 65;
  const strokeWidth = isDark ? 16 : 20;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const activeWeightsWithOffsets = activeWeights.map((asset, index) => {
    const offset = activeWeights.slice(0, index).reduce((sum, item) => sum + item.weight, 0);
    return { ...asset, offset };
  });

  const activeHoveredAsset = activeWeights.find(w => w.category === hoveredCategory);

  const handleNavigate = (categoryName) => {
    const ticker = NAME_TO_TICKER[categoryName];
    if (ticker) {
      router.push(`/stock/${ticker}`);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 py-2 w-full overflow-hidden">
      {/* [좌측] 도넛 차트 */}
      <div className="relative w-[180px] h-[180px] flex-shrink-0 flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isDark ? '#282a2a' : '#e0e9e4'}
            strokeWidth={strokeWidth - 4}
            className="transition-colors duration-300"
          />

          {activeWeightsWithOffsets.map((asset) => {
            const strokeDasharray = `${(asset.weight / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((asset.offset / 100) * circumference);

            const isHovered = hoveredCategory === asset.category;

            return (
              <circle
                key={asset.category}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={asset.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                onMouseEnter={() => setHoveredCategory(asset.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => handleNavigate(asset.category)}
                className="transition-all duration-300 cursor-pointer"
                style={{
                  filter: isDark && isHovered ? `drop-shadow(0 0 6px ${asset.color})` : 'none',
                }}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`font-mono text-2xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
            {activeHoveredAsset ? `${activeHoveredAsset.weight}%` : '100%'}
          </span>
          <span className="font-mono text-[9px] tracking-wider text-slate-500 uppercase font-bold mt-1">
            {activeHoveredAsset ? activeHoveredAsset.category : '포트폴리오'}
          </span>
        </div>
      </div>

      {/* [우측] 종목 2열 타일 그리드 리스트 (스크롤 없이 시원하게 한눈에 렌더링) */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full min-w-0">
        {resolvedWeights.map((asset) => {
          const isHovered = hoveredCategory === asset.category;
          
          // data Prop(holdings)에서 해당 자산의 상세 수량/평단가/수익률을 추출
          const detail = (data || []).find(d => d.name === asset.category || d.category === asset.category) || {};
          const quantity = detail.quantity || 0;
          const purchasePrice = detail.purchasePrice || 0;
          const profitLossRate = detail.profitLossRate || 0;

          const weatherConfig = {
            sunny:   { label: '맑음', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            cloudy:  { label: '구름', color: 'text-slate-400', bg: 'bg-slate-500/10' },
            rainy:   { label: '비',   color: 'text-sky-400',   bg: 'bg-sky-500/10' },
            thunder: { label: '번개', color: 'text-rose-400',  bg: 'bg-rose-500/10' },
          }[detail.weather || 'cloudy'] || { label: '구름', color: 'text-slate-400', bg: 'bg-slate-500/10' };

          return (
            <div 
              key={asset.category}
              onMouseEnter={() => setHoveredCategory(asset.category)}
              onMouseLeave={() => setHoveredCategory(null)}
              onClick={() => handleNavigate(asset.category)}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                isHovered 
                  ? isDark 
                    ? 'bg-[#1e2020] border-[#69dbad]' 
                    : 'bg-[#f4f9f7] border border-[#3eb489]/40 translate-x-0.5'
                  : isDark 
                    ? 'bg-[#1a1c1c]/60 border-white/5' 
                    : 'bg-white border border-[#3eb489]/10 soft-shadow-light'
              }`}
            >
              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span 
                    className="w-2.5 h-2.5 rounded-full block border flex-shrink-0"
                    style={{ 
                      backgroundColor: asset.color,
                      borderColor: isDark ? 'transparent' : 'rgba(62, 180, 137, 0.3)'
                    }}
                  />
                  <span className={`text-[12px] font-bold font-sans truncate ${isDark ? 'text-slate-200' : 'text-[#0f1713]'}`}>
                    {asset.category}
                  </span>
                  {/* 날씨 리스크 배지 */}
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold flex-shrink-0 ${weatherConfig.bg} ${weatherConfig.color}`}>
                    <span className="text-[10px]">
                      {weatherConfig.label === '맑음' ? '☀️' : weatherConfig.label === '구름' ? '⛅' : weatherConfig.label === '비' ? '🌧️' : '⚡'}
                    </span>
                    <span>{weatherConfig.label}</span>
                  </span>
                </div>
                {/* 보유량 및 평단가 정보 */}
                <div className={`text-[9.5px] pl-4 mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {quantity}주 | {new Intl.NumberFormat('ko-KR').format(purchasePrice)}원
                </div>
              </div>

              {/* 수익률 및 비중 정보 */}
              <div className="text-right flex-shrink-0 pl-1">
                <div className={`text-[11px] font-mono font-black ${
                  profitLossRate >= 0
                    ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]')
                    : 'text-rose-500'
                }`}>
                  {profitLossRate >= 0 ? '+' : ''}{profitLossRate.toFixed(1)}%
                </div>
                <div className={`text-[9.5px] font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  비중 {asset.weight}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
