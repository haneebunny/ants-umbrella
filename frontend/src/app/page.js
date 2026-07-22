"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import Header from './components/layout/Header';
import WeatherBanner from './components/home/WeatherBanner';
import KosdaqMiniChart from './components/home/KosdaqMiniChart';
import AssetSummaryCard from './components/home/AssetSummaryCard';
import ProfileBadge from './components/home/ProfileBadge';
import StockWeatherList from './components/home/StockWeatherList';
import GuestCTABanner from './components/home/GuestCTABanner';
import AntPet from './components/AntPet';
import { DEMO_PROFILE, overallWeather, kosdaqIndex, assetSummary, stockWeatherList } from './data/mockData';

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const [isDemo, setIsDemo] = useState(true);
  const [profile, setProfile] = useState(DEMO_PROFILE);

  // 마운트 시 localStorage에서 완료된 진단 결과 복원
  useEffect(() => {
    const complete = localStorage.getItem('ants_survey_complete');
    const saved    = localStorage.getItem('ants_result_profile');
    if (complete === 'true' && saved) {
      try {
        setProfile(JSON.parse(saved));
        setIsDemo(false);
      } catch {
        setIsDemo(true);
      }
    }
  }, []);

  const alertCount = 2;

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      isDark ? 'bg-[#0d0f0d] text-[#e2e2e2]' : 'bg-[#f0f2f0] text-[#0f1713]'
    }`}>

      {/* 공통 헤더 */}
      <Header isDark={isDark} toggleTheme={toggleTheme} alertCount={alertCount} />

      {/* ── 메인 콘텐츠 (최대폭 고정, 중앙 정렬) ── */}
      <main className="pt-14 pb-12 px-4 lg:px-6 max-w-7xl mx-auto">

        {/* 게스트 CTA (데모 모드에서만) */}
        {isDemo && (
          <div className="pt-4 pb-2">
            <GuestCTABanner isDemoMode={isDemo} isDark={isDark} />
          </div>
        )}
        {!isDemo && <div className="pt-4" />}

        {/* 섹션 1: 전체 날씨 예보 배너 — 전체 너비 */}
        <div className="mb-4">
          <WeatherBanner weather={overallWeather} isDark={isDark} />
        </div>

        {/* ── 비균형 3열 그리드 (6 : 4 : 2 = 12) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* ┌── 왼쪽 (6칸) — 보유 자산 도넛 ──┐ */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <AssetSummaryCard summary={assetSummary} isDark={isDark} />
          </div>

          {/* ┌── 중간 (4칸) — 종목별 날씨 ──┐ */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <StockWeatherList stocks={stockWeatherList} isDark={isDark} />
          </div>

          {/* ┌── 오른쪽 (2칸, 좁음) — 코스닥 + 투자성향 ──┐ */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <KosdaqMiniChart index={kosdaqIndex} isDark={isDark} />
            <ProfileBadge profile={profile} isDemoMode={isDemo} isDark={isDark} />
          </div>

        </div>

      </main>

      {/* 나개미 캐릭터 플로팅 */}
      <AntPet weather={overallWeather.status} portfolio={stockWeatherList} />
    </div>
  );
}
