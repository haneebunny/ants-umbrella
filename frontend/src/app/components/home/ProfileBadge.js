'use client';

import React from 'react';
import Icon from '../Icon';

const BAND_CONFIG = {
  CONSERVATIVE:          { label: '안정추구형',    emoji: '🛡️', pos: 1, color: 'text-sky-500',    bg: 'bg-sky-50',    border: 'border-sky-200',    darkColor: 'text-sky-400',    darkBg: 'bg-sky-900/20',    darkBorder: 'border-sky-700/40'    },
  MODERATE_CONSERVATIVE: { label: '안정성장형',    emoji: '🌿', pos: 2, color: 'text-teal-500',   bg: 'bg-teal-50',   border: 'border-teal-200',   darkColor: 'text-teal-400',   darkBg: 'bg-teal-900/20',   darkBorder: 'border-teal-700/40'   },
  BALANCED:              { label: '균형투자형',    emoji: '⚖️', pos: 3, color: 'text-[#3eb489]',  bg: 'bg-emerald-50',border: 'border-emerald-200', darkColor: 'text-[#69dbad]',  darkBg: 'bg-emerald-900/20',darkBorder: 'border-emerald-700/40' },
  GROWTH:                { label: '성장추구형',    emoji: '🚀', pos: 4, color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  darkColor: 'text-amber-400',  darkBg: 'bg-amber-900/20',  darkBorder: 'border-amber-700/40'  },
  AGGRESSIVE:            { label: '공격투자형',    emoji: '⚡', pos: 5, color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    darkColor: 'text-red-400',    darkBg: 'bg-red-900/20',    darkBorder: 'border-red-700/40'    },
};
const BANDS = ['CONSERVATIVE', 'MODERATE_CONSERVATIVE', 'BALANCED', 'GROWTH', 'AGGRESSIVE'];

/**
 * 내 투자성향 표시 배지 카드
 * @param {Object}  props.profile   - calculateRiskProfile 반환값 또는 DEMO_PROFILE
 * @param {boolean} props.isDemoMode
 * @param {boolean} props.isDark
 */
export default function ProfileBadge({ profile, isDemoMode = false, isDark }) {
  const band = profile?.target_risk_band || 'BALANCED';
  const cfg = BAND_CONFIG[band] || BAND_CONFIG.BALANCED;

  return (
    <div
      className={`rounded-2xl border p-3 ${
        isDark
          ? `bg-[#141615] ${cfg.darkBorder} border`
          : `${cfg.bg} ${cfg.border} border`
      }`}
    >
      {/* 라벨 */}
      <div className="flex items-center justify-between mb-3">
        <p className={`text-[10px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          내 투자성향
        </p>
        {isDemoMode && (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
            isDark ? 'bg-amber-900/40 text-amber-400 border border-amber-700/40' : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}>
            데모
          </span>
        )}
      </div>

      {/* 성향명 */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-lg">{cfg.emoji}</span>
        <p className={`text-base font-black ${isDark ? cfg.darkColor : cfg.color}`}>
          {cfg.label}
        </p>
      </div>

      {/* 스펙트럼 바 */}
      <div className="flex gap-1 mb-3">
        {BANDS.map((b, i) => (
          <div
            key={b}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              b === band
                ? (isDark ? cfg.darkColor.replace('text-', 'bg-') : cfg.color.replace('text-', 'bg-'))
                : (isDark ? 'bg-white/10' : 'bg-slate-200')
            }`}
          />
        ))}
      </div>

      {/* CTA */}
      <a
        href={isDemoMode ? '/onboarding' : '/onboarding'}
        className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[11px] font-bold transition-colors ${
          isDark
            ? 'bg-white/5 text-slate-300 hover:bg-white/10'
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
        }`}
      >
        <Icon name="refreshCw" className="w-3 h-3" />
        {isDemoMode ? '내 성향 직접 진단하기' : '성향 다시 진단하기'}
      </a>
    </div>
  );
}
