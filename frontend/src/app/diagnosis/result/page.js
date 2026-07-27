"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Icon from '../../components/Icon';
import DiagnosisResultView from '../../components/DiagnosisResultView';
import { DEMO_PROFILE } from '../../data/mockData';

export default function DiagnosisResultPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ants_result_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error("Profile parsing error:", e);
        setProfile(DEMO_PROFILE);
      }
    } else {
      // 저장된 프로필이 없으면 DEMO_PROFILE을 기본으로 사용
      setProfile(DEMO_PROFILE);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm font-bold animate-pulse text-slate-500">
          투자성향 리포트를 불러오는 중입니다... 🐜
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ── 3단계 탭/단계 내비게이션 ── */}
      <div className="pt-4 pb-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => router.push('/diagnosis')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isDark ? 'bg-white/5 text-slate-400 hover:text-slate-200' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-700'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-white text-[9px] font-black">1</span>
          위험 레이더
        </button>

        <Icon name="arrowRight" className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />

        <button
          onClick={() => router.push('/diagnosis/weather')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isDark ? 'bg-white/5 text-slate-400 hover:text-slate-200' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-700'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-white text-[9px] font-black">2</span>
          포트폴리오 날씨
        </button>

        <Icon name="arrowRight" className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            isDark ? 'bg-[#3eb489]/20 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#3eb489]'
          }`}
        >
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black" style={{ backgroundColor: isDark ? '#69dbad' : '#3eb489' }}>3</span>
          성향 종합 리포트
        </div>
      </div>

      <main className="pt-2 pb-10 px-1 max-w-7xl w-full">
        <DiagnosisResultView
          profile={profile}
          isDark={isDark}
          onReDiagnose={() => router.push('/onboarding')}
          isStandalone={true}
        />
      </main>
    </div>
  );
}
