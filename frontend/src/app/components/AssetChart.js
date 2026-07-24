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

export default function AssetChart({ theme, weights }) {
  const router = useRouter();
  const isDark = theme === 'dark';
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const activeWeights = weights.filter(w => w.weight > 0);
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
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
      <div className="relative w-[180px] h-[180px]">
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

      <div className="flex-1 space-y-3 w-full sm:w-auto">
        {weights.map((asset) => {
          const isHovered = hoveredCategory === asset.category;
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
                    : 'bg-[#f4f9f7] border border-[#3eb489]/40 translate-x-1'
                  : isDark 
                    ? 'bg-[#1a1c1c]/50 border-transparent' 
                    : 'bg-white border border-[#3eb489]/10 soft-shadow-light'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span 
                  className="w-3.5 h-3.5 rounded-sm block border"
                  style={{ 
                    backgroundColor: asset.color,
                    borderColor: isDark ? 'transparent' : 'rgba(62, 180, 137, 0.3)'
                  }}
                />
                <span className={`text-xs font-bold font-sans ${isDark ? 'text-slate-300' : 'text-[#0f1713]'}`}>
                  {asset.category}
                </span>
              </div>
              <span className={`font-mono text-xs font-black ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>
                {asset.weight}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
