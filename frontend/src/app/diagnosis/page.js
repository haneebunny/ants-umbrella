"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../hooks/useTheme';
import Header from '../components/layout/Header';
import Icon from '../components/Icon';
import { DEMO_PROFILE, riskRadar as mockRiskRadar } from '../data/mockData';

export default function DiagnosisPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(DEMO_PROFILE);

  useEffect(() => {
    const saved = localStorage.getItem('ants_result_profile');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch { /* noop */ }
    }
  }, []);

  // 성향 기반 허용 위험 수준 (0~100)
  const bandToTolerance = {
    CONSERVATIVE: 20, MODERATE_CONSERVATIVE: 40,
    BALANCED: 55, GROWTH: 75, AGGRESSIVE: 90,
  };
  const userTolerance = bandToTolerance[profile?.target_risk_band] || 55;
  const portfolioRisk = mockRiskRadar.currentPortfolioRisk;
  const riskStatus = portfolioRisk <= userTolerance * 0.85 ? 'safe'
    : portfolioRisk <= userTolerance ? 'caution' : 'danger';

  const statusCfg = {
    safe:    { label: '안전',    color: 'text-[#3eb489]',  bg: 'bg-[#3eb489]/10',  border: 'border-[#3eb489]/30' },
    caution: { label: '주의',    color: 'text-amber-500',   bg: 'bg-amber-50',       border: 'border-amber-300'    },
    danger:  { label: '위험',    color: 'text-red-500',     bg: 'bg-red-50',         border: 'border-red-300'      },
  };
  const sCfg = statusCfg[riskStatus];

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? 'bg-[#0d0f0d] text-[#e2e2e2]' : 'bg-[#f0f2f0] text-[#0f1713]'}`}>
      <Header isDark={isDark} toggleTheme={toggleTheme} showBack title="위험 진단" />

      <main className="pt-14 pb-10 px-4 max-w-4xl mx-auto">
        {/* 단계 표시 */}
        <div className="pt-6 pb-4 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? 'bg-[#3eb489]/15 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#3eb489]'}`}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black" style={{backgroundColor: isDark ? '#69dbad' : '#3eb489'}}>1</span>
            위험 레이더
          </div>
          <Icon name="arrowRight" className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? 'bg-white/5 text-slate-500' : 'bg-white text-slate-400 border border-slate-200'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-white text-[9px] font-black">2</span>
            포트폴리오 날씨
          </div>
        </div>

        {/* 위험 레이더 카드 */}
        <div className={`rounded-2xl border p-6 space-y-6 ${isDark ? 'bg-[#141615] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>위험 레이더</p>
            <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
              내 성향 대비 포트폴리오 위험 수준
            </h1>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black border ${sCfg.bg} ${sCfg.border} ${sCfg.color}`}>
            <Icon name={riskStatus === 'safe' ? 'shieldCheck' : riskStatus === 'caution' ? 'alertTriangle' : 'alertCircle'} className="w-4 h-4" />
            {sCfg.label} — 성향 {riskStatus === 'safe' ? '허용 범위 내' : riskStatus === 'caution' ? '한계 근접' : '초과'}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>내 성향 위험 허용치</span>
                <span className={`font-black font-mono ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>{userTolerance}점</span>
              </div>
              <div className={`h-3 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <div className="h-full rounded-full bg-[#3eb489] transition-all duration-700" style={{ width: `${userTolerance}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>현재 포트폴리오 위험</span>
                <span className={`font-black font-mono ${sCfg.color}`}>{portfolioRisk}점</span>
              </div>
              <div className={`h-3 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <div className={`h-full rounded-full transition-all duration-700 ${riskStatus === 'safe' ? 'bg-[#3eb489]' : riskStatus === 'caution' ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${portfolioRisk}%` }} />
              </div>
            </div>
          </div>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            진단된 투자 성향({profile?.titleKo || '균형투자형'})의 위험 허용 범위와 현재 보유 종목의 종합 위험 수준을 비교합니다.
          </p>
        </div>

        <button
          onClick={() => router.push('/diagnosis/weather')}
          className={`mt-6 w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
            isDark ? 'bg-[#3eb489] text-[#0a1f14] hover:bg-[#69dbad]' : 'bg-[#3eb489] text-white hover:bg-[#2d966e] shadow-[0_4px_20px_rgba(62,180,137,0.3)]'
          }`}
        >
          다음: 오늘 내 포트폴리오 날씨 확인
          <Icon name="arrowRight" className="w-4 h-4" />
        </button>
      </main>
    </div>
  );
}
