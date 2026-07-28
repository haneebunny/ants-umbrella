"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import DiagnosisResultView from '../../components/DiagnosisResultView';
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
        setProfile(DEMO_PROFILE);
      }
    } else {
      setProfile(DEMO_PROFILE);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm font-bold animate-pulse text-slate-500">
          투자성향 리포트를 분석하고 있어요... 🐜
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen py-6 px-4 md:px-8 transition-colors duration-300 ${
      isDark ? 'bg-[#0d0f0f] text-[#e2e2e2]' : 'bg-[#f4f9f7] text-[#0f1713]'
    }`}>
      <div className="max-w-7xl mx-auto">
        <DiagnosisResultView
          profile={profile}
          isDark={isDark}
          onReDiagnose={() => router.push('/onboarding')}
        />
      </div>
    </div>
  );
}
