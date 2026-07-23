'use client';

import React from 'react';
import Icon from '../Icon';

/**
 * 미등록/게스트 사용자 CTA 배너
 * @param {boolean} props.isDemoMode
 * @param {boolean} props.isDark
 * @param {boolean} props.compact  - true 이면 인라인 배지 형태로 렌더
 */
export default function GuestCTABanner({ isDemoMode = true, isDark, compact = false }) {
  if (!isDemoMode) return null;

  // ── compact: 상단 바용 작은 인라인 배지 ──
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
          isDark ? 'bg-[#3eb489]/15 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#2d7a5e]'
        }`}>
          📊 샘플 데이터 체험 중
        </span>
      </div>
    );
  }

  // ── 기본: 풀 배너 ──
  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
        isDark
          ? 'bg-[#0f2318] border-[#3eb489]/20'
          : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-[#3eb489]/25'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isDark ? 'bg-[#3eb489]/15' : 'bg-white shadow-sm'
      }`}>
        <span className="text-2xl">📊</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-black mb-0.5 ${isDark ? 'text-[#69dbad]' : 'text-[#2d7a5e]'}`}>
          지금은 샘플 데이터로 보고 있어요
        </p>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          내 포트폴리오를 등록하면 실제 보유 종목 기반으로 위험을 분석해 드려요.
        </p>
      </div>
      <a
        href="/onboarding"
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
          isDark
            ? 'bg-[#3eb489] text-[#0a1f14] hover:bg-[#69dbad]'
            : 'bg-[#3eb489] text-white hover:bg-[#2d966e] shadow-[0_4px_12px_rgba(62,180,137,0.25)]'
        }`}
      >
        내 데이터 넣어보기
        <Icon name="arrowRight" className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
