'use client';

import React from 'react';
import Icon from '../Icon';

const BAND_CONFIG = {
  CONSERVATIVE:          { label: '안정추구형', emoji: '🛡️', color: 'text-sky-500',   darkColor: 'text-sky-400',   bg: 'bg-sky-50',    darkBg: 'bg-sky-900/20',    border: 'border-sky-200',    darkBorder: 'border-sky-700/40',    bar: 'bg-sky-400'    },
  MODERATE_CONSERVATIVE: { label: '안정성장형', emoji: '🌿', color: 'text-teal-500',  darkColor: 'text-teal-400',  bg: 'bg-teal-50',   darkBg: 'bg-teal-900/20',   border: 'border-teal-200',   darkBorder: 'border-teal-700/40',   bar: 'bg-teal-400'   },
  BALANCED:              { label: '균형투자형', emoji: '⚖️', color: 'text-[#3eb489]', darkColor: 'text-[#69dbad]', bg: 'bg-emerald-50',darkBg: 'bg-emerald-900/20',border: 'border-emerald-200',darkBorder: 'border-emerald-700/40',bar: 'bg-emerald-400' },
  GROWTH:                { label: '성장추구형', emoji: '🚀', color: 'text-amber-500', darkColor: 'text-amber-400', bg: 'bg-amber-50',  darkBg: 'bg-amber-900/20',  border: 'border-amber-200',  darkBorder: 'border-amber-700/40',  bar: 'bg-amber-400'  },
  AGGRESSIVE:            { label: '공격투자형', emoji: '⚡', color: 'text-red-500',   darkColor: 'text-red-400',   bg: 'bg-red-50',    darkBg: 'bg-red-900/20',    border: 'border-red-200',    darkBorder: 'border-red-700/40',    bar: 'bg-red-400'    },
};
const BANDS = ['CONSERVATIVE', 'MODERATE_CONSERVATIVE', 'BALANCED', 'GROWTH', 'AGGRESSIVE'];

/**
 * 투자성향 + 체험 포트폴리오 선택 통합 카드
 * @param {Object}   props.profile           - 현재 선택된 포트폴리오의 profile 객체
 * @param {boolean}  props.isDemoMode
 * @param {boolean}  props.isDark
 * @param {Array}    props.presets            - PORTFOLIO_PRESETS 배열
 * @param {number}   props.selectedId         - 현재 선택된 포트폴리오 id
 * @param {Function} props.onSelect           - (id) => void
 */
export default function PortfolioProfileCard({
  profile, isDemoMode = false, isDark,
  presets = [], selectedId, onSelect,
}) {
  const band = profile?.target_risk_band || 'BALANCED';
  const cfg  = BAND_CONFIG[band] || BAND_CONFIG.BALANCED;

  return (
    <div
      className={`rounded-2xl border p-3 flex flex-col gap-2.5 ${
        isDark
          ? `bg-[#141615] ${cfg.darkBorder} border`
          : `${cfg.bg} ${cfg.border} border`
      }`}
    >

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <p className={`text-[10px] font-bold tracking-wider uppercase ${
          isDark ? 'text-slate-500' : 'text-slate-400'
        }`}>
          내 투자성향
        </p>
      </div>

      {/* ── 성향명 ── */}
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{cfg.emoji}</span>
        <p className={`text-sm font-black ${isDark ? cfg.darkColor : cfg.color}`}>
          {cfg.label}
        </p>
      </div>

      {/* ── 스펙트럼 바 ── */}
      <div className="flex gap-0.5">
        {BANDS.map(b => (
          <div
            key={b}
            className={`h-1 flex-1 rounded-full transition-all ${
              b === band ? cfg.bar : (isDark ? 'bg-white/10' : 'bg-slate-200')
            }`}
          />
        ))}
      </div>

      {/* ── 구분선 ── */}
      <div className={`border-t ${isDark ? 'border-white/5' : 'border-black/5'}`} />

      {/* ── 포트폴리오 선택 섹션 ── */}
      <p className={`text-[10px] font-bold tracking-wider uppercase ${
        isDark ? 'text-slate-500' : 'text-slate-400'
      }`}>
        체험 포트폴리오
      </p>

      <div className="flex flex-col gap-1">
        {presets.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all ${
              p.id === selectedId
                ? isDark
                  ? 'bg-white/10 ring-1 ring-white/20'
                  : 'bg-white/80 ring-1 ring-black/10 shadow-sm'
                : isDark
                  ? 'hover:bg-white/5 opacity-60 hover:opacity-100'
                  : 'hover:bg-white/60 opacity-60 hover:opacity-100'
            }`}
          >
            <span className="text-base flex-shrink-0">{p.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-bold leading-tight truncate ${
                isDark ? 'text-slate-200' : 'text-[#0f1713]'
              }`}>
                {p.label}
              </p>
              <p className={`text-[10px] font-mono leading-tight ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {p.totalLabel}
              </p>
            </div>
            {p.id === selectedId && (
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.bar}`} />
            )}
          </button>
        ))}
      </div>

      {/* ── CTA ── */}
      <a
        href="/onboarding"
        className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[11px] font-bold transition-all mt-0.5 ${
          isDark
            ? 'bg-[#3eb489]/20 text-[#69dbad] border border-[#3eb489]/30 hover:bg-[#3eb489]/30'
            : 'bg-[#3eb489] text-white hover:bg-[#2ea070] shadow-sm'
        }`}
      >
        <Icon name="refreshCw" className="w-3 h-3" />
        {isDemoMode ? '내 성향 직접 진단하기' : '성향 다시 진단하기'}
      </a>
    </div>
  );
}
