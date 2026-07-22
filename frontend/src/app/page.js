"use client";

import React, { useState, useEffect } from 'react';
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
  const [theme, setTheme] = useState('light'); // 기본 라이트 테마
  const [isDemo, setIsDemo] = useState(true);
  const [profile, setProfile] = useState(DEMO_PROFILE);

  // 마운트 시 localStorage에서 완료된 진단 결과 복원
  useEffect(() => {
    const complete = localStorage.getItem('ants_survey_complete');
    const saved = localStorage.getItem('ants_result_profile');
    if (complete === 'true' && saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setIsDemo(false);
      } catch {
        setIsDemo(true);
      }
    }
  }, []);

  // 테마 클래스 적용
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  // 알림 건수 (추후 실제 API 연동)
  const alertCount = 2;

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${
        isDark ? 'bg-[#0d0f0d] text-[#e2e2e2]' : 'bg-[#f5f6f4] text-[#0f1713]'
      }`}
    >
      {/* 공통 헤더 */}
      <Header
        isDark={isDark}
        toggleTheme={toggleTheme}
        alertCount={alertCount}
        showBack={false}
      />

      {/* 메인 콘텐츠 */}
      <main className="pt-14 pb-10 px-4 max-w-2xl mx-auto space-y-4">

        {/* 게스트 CTA 배너 (데모 모드에서만) */}
        {isDemo && (
          <div className="pt-4">
            <GuestCTABanner isDemoMode={isDemo} isDark={isDark} />
          </div>
        )}

        {!isDemo && <div className="pt-4" />}

        {/* 섹션 1: 전체 날씨 예보 배너 */}
        <WeatherBanner weather={overallWeather} isDark={isDark} />

        {/* 섹션 2 + 4: 코스닥 지수 & 내 투자성향 (나란히) */}
        <div className="grid grid-cols-2 gap-4">
          <KosdaqMiniChart index={kosdaqIndex} isDark={isDark} />
          <ProfileBadge profile={profile} isDemoMode={isDemo} isDark={isDark} />
        </div>

        {/* 섹션 3: 보유 자산 요약 */}
        <AssetSummaryCard summary={assetSummary} isDark={isDark} />

        {/* 섹션 5: 종목별 날씨 목록 */}
        <StockWeatherList stocks={stockWeatherList} isDark={isDark} />

      </main>

      {/* 나개미 캐릭터 (드래그 가능 플로팅) */}
      <AntPet weather={overallWeather.status} portfolio={stockWeatherList} />
    </div>
  );
}
