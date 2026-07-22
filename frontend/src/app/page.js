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
      <main className="pt-14 pb-12 px-4 lg:px-6 max-w-5xl mx-auto">

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

        {/* ── 2열 그리드 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

          {/* ┌── 왼쪽 열 ──┐ */}
          <div className="flex flex-col gap-4">
            {/* 섹션 2: 코스닥 미니 지수 */}
            <KosdaqMiniChart index={kosdaqIndex} isDark={isDark} />

            {/* 섹션 4: 내 투자성향 */}
            <ProfileBadge profile={profile} isDemoMode={isDemo} isDark={isDark} />

            {/* 섹션 3: 보유 자산 요약 (도넛 차트) */}
            <AssetSummaryCard summary={assetSummary} isDark={isDark} />
          </div>

          {/* ┌── 오른쪽 열 ──┐ */}
          <div className="flex flex-col gap-4">
            {/* 섹션 5: 종목별 날씨 목록 */}
            <StockWeatherList stocks={stockWeatherList} isDark={isDark} />
          </div>

        </div>
      </main>

      {/* 나개미 캐릭터 플로팅 */}
      <AntPet weather={overallWeather.status} portfolio={stockWeatherList} />
    </div>
  );
}
