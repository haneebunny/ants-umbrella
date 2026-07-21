import React, { useState } from 'react';

export default function AssetChart({ theme, weights }) {
  const isDark = theme === 'dark';
  const [hoveredIndex, setHoveredIndex] = useState(null);

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


  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
      <div className="relative w-[180px] h-[180px]">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={isDark ? '#282a2a' : '#e0e9e4'}
            strokeWidth={strokeWidth - 4}
            className="transition-colors duration-300"
          />

          {activeWeightsWithOffsets.map((asset, idx) => {
            const strokeDasharray = `${(asset.weight / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((asset.offset / 100) * circumference);

            const isHovered = hoveredIndex === idx;

            return (
              <circle
                key={asset.category}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={asset.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
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
            {hoveredIndex !== null ? `${activeWeights[hoveredIndex].weight}%` : '100%'}
          </span>
          <span className="font-mono text-[9px] tracking-wider text-slate-500 uppercase font-bold mt-1">
            {hoveredIndex !== null ? activeWeights[hoveredIndex].category : '포트폴리오'}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3 w-full sm:w-auto">
        {activeWeights.map((asset, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <div 
              key={asset.category}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
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
