"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import ResultsScreen from '../../components/ResultsScreen';
import { DEMO_PROFILE } from '../../data/mockData';

export default function OnboardingResultPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ants_result_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error("Profile parsing error:", e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm font-bold animate-pulse text-slate-500">
          투자성향 결과를 분석하고 있어요... 🐜
        </p>
      </div>
    );
  }

  // 만약 진단 결과가 아직 없다면 온보딩 첫 화면으로 리다이렉트
  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-bold text-slate-500 mb-4">앗! 아직 진행된 투자성향 진단 결과가 없어요. 😢</p>
        <button
          onClick={() => router.push('/onboarding')}
          className="px-5 py-2.5 rounded-xl bg-[#3eb489] text-white font-black text-xs hover:bg-[#2d966e]"
        >
          투자성향 진단하러 가기 🛡️
        </button>
      </div>
    );
  }

  const handleStartWithDemo = () => {
    // 샘플 데이터 셋업 후 홈으로 이동
    let demoHoldings = [];
    const band = profile.target_risk_band;
    if (band === 'CONSERVATIVE' || band === 'MODERATE_CONSERVATIVE') {
      demoHoldings = [
        { ticker: '032830', name: '삼성생명', quantity: 10 },
        { ticker: '033780', name: 'KT&G', quantity: 15 },
        { ticker: '105560', name: 'KB금융', quantity: 20 },
        { ticker: '005380', name: '현대차', quantity: 8 }
      ];
    } else if (band === 'GROWTH' || band === 'AGGRESSIVE') {
      demoHoldings = [
        { ticker: '005930', name: '삼성전자', quantity: 30 },
        { ticker: '000660', name: 'SK하이닉스', quantity: 12 },
        { ticker: '373220', name: 'LG에너지솔루션', quantity: 5 },
        { ticker: '035420', name: 'NAVER', quantity: 15 }
      ];
    } else {
      demoHoldings = [
        { ticker: '005490', name: 'POSCO홀딩스', quantity: 10 },
        { ticker: '068270', name: '셀트리온', quantity: 8 },
        { ticker: '055550', name: '신한지주', quantity: 25 },
        { ticker: '000270', name: '기아', quantity: 15 }
      ];
    }
    localStorage.setItem('ants_portfolio', JSON.stringify(demoHoldings));
    localStorage.setItem('ants_survey_complete', 'true');
    router.push('/');
  };

  return (
    <div className="w-full space-y-6">
      {/* 안내 배너 (대시보드로 가기 버튼 제공) */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-[#191d1a] border-emerald-900/40' : 'bg-emerald-50/70 border-emerald-100'
      } flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm`}>
        <div className="flex-1">
          <h3 className={`text-sm font-black ${isDark ? 'text-emerald-400' : 'text-emerald-800'} flex items-center gap-1.5`}>
            🎉 투자성향 분석 완료!
          </h3>
          <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            나에게 딱 맞는 맞춤형 기상 예보를 바로 확인해 보세요! 대시보드로 이동하면 샘플데이터가 자동으로 준비된답니다. 🐜☔
          </p>
        </div>
        <button
          onClick={handleStartWithDemo}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#3eb489] text-[#002115] font-black text-xs hover:bg-[#329e76] transition-colors shadow-md cursor-pointer text-center"
        >
          🎯 샘플데이터로 대시보드 바로보기
        </button>
      </div>

      <ResultsScreen
        theme={isDark ? 'dark' : 'light'}
        profile={profile}
        onReset={() => router.push('/onboarding')}
        toggleTheme={toggleTheme}
        isDemoMode={false}
        inShell={true}
      />
    </div>
  );
}
