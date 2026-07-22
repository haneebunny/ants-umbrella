'use client';

import React from 'react';
import AssetChart from '../AssetChart';
import Icon from '../Icon';

/**
 * 보유 자산 요약 카드 (토스증권 스타일)
 * @param {Object}  props.summary  - assetSummary 객체
 * @param {boolean} props.isDark
 */
export default function AssetSummaryCard({ summary, isDark }) {
  const { totalAsset = 0, riskAssetRatio = 0, holdings = [] } = summary || {};

  // AssetChart 호환 포맷으로 변환 (name → category)
  const chartWeights = holdings.map(h => ({
    category: h.name,
    weight: h.weight,
    color: h.color,
  }));

  const formatted = new Intl.NumberFormat('ko-KR').format(totalAsset);

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isDark
          ? 'bg-[#141615] border-white/5'
          : 'bg-white border-slate-100 shadow-sm'
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            보유 자산
          </p>
          <p className={`text-2xl font-black font-mono leading-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
            ₩{formatted}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-500'
            }`}
          >
            위험자산 {riskAssetRatio}%
          </span>
          <a
            href="/portfolio/register"
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon name="edit" className="w-3 h-3" />
            편집
          </a>
        </div>
      </div>

      {/* 도넛 차트 */}
      {chartWeights.length > 0 && (
        <AssetChart
          theme={isDark ? 'dark' : 'light'}
          weights={chartWeights}
        />
      )}
    </div>
  );
}
