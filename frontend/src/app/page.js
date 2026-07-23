"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import Header from './components/layout/Header';
import WeatherBanner from './components/home/WeatherBanner';
import KosdaqMiniChart from './components/home/KosdaqMiniChart';
import AssetSummaryCard from './components/home/AssetSummaryCard';
import PortfolioProfileCard from './components/home/PortfolioProfileCard';
import StockWeatherList from './components/home/StockWeatherList';
import GuestCTABanner from './components/home/GuestCTABanner';
import AntPet from './components/AntPet';
import { PORTFOLIO_PRESETS, kosdaqIndex } from './data/mockData';

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const [isDemo, setIsDemo] = useState(true);

  // 선택된 포트폴리오 ID (기본 = 1번)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(1);

  // 선택된 포트폴리오 데이터
  const selectedPortfolio = PORTFOLIO_PRESETS.find(p => p.id === selectedPortfolioId) || PORTFOLIO_PRESETS[0];
  const { overallWeather, assetSummary, stockWeatherList, profile, radarScores } = selectedPortfolio;

  // 마운트 시 localStorage에서 완료된 진단 결과 복원
  useEffect(() => {
    const complete = localStorage.getItem('ants_survey_complete');
    const saved    = localStorage.getItem('ants_result_profile');
    if (complete === 'true' && saved) {
      try { setIsDemo(false); } catch { setIsDemo(true); }
    }
  }, []);

  const alertCount = 2;

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      isDark ? 'bg-[#080b08] text-[#e2e2e2]' : 'bg-[#f0f2f0] text-[#0f1713]'
    }`}>

      {/* 공통 헤더 */}
      <Header isDark={isDark} toggleTheme={toggleTheme} alertCount={alertCount} />

      {/* ── 메인 콘텐츠 ── */}
      <main className="pt-14 pb-2 px-4 lg:px-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-56px)] overflow-hidden">

        {/* ─ 게스트 CTA (데모 시에만) ─ */}
        {isDemo && (
          <div className="flex items-center pt-2 pb-2 flex-shrink-0">
            <GuestCTABanner isDemoMode={isDemo} isDark={isDark} compact />
          </div>
        )}
        {!isDemo && <div className="pt-3 flex-shrink-0" />}

        {/* 섹션 1: 전체 날씨 예보 배너 */}
        <div className="mb-3 flex-shrink-0">
          <WeatherBanner weather={overallWeather} isDark={isDark} />
        </div>

        {/* ── 비균형 3열 그리드 (5 : 4 : 2 = 11) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 flex-1 min-h-0 items-start overflow-hidden">

          {/* ┌── 왼쪽 (2칸) — 코스닥 + 투자성향 & 포트폴리오 선택 ──┐ */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full overflow-auto">
            <KosdaqMiniChart index={kosdaqIndex} isDark={isDark} />
            <PortfolioProfileCard
              profile={profile}
              isDemoMode={isDemo}
              isDark={isDark}
              presets={PORTFOLIO_PRESETS}
              selectedId={selectedPortfolioId}
              onSelect={setSelectedPortfolioId}
            />
          </div>

          {/* ┌── 중간 (4칸) — 종목별 날씨 ──┐ */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-auto">
            <StockWeatherList stocks={stockWeatherList} isDark={isDark} />
          </div>

          {/* ┌── 오른쪽 (5칸) — 보유 자산 도넛 ──┐ */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-full overflow-auto">
            <AssetSummaryCard
              summary={assetSummary}
              radarScores={radarScores}
              isDark={isDark}
              weatherStatus={overallWeather.status}
            />
          </div>

        </div>

      </main>

      {/* 나개미 캐릭터 플로팅 */}
      <AntPet weather={overallWeather.status} portfolio={stockWeatherList} />
    </div>
  );
}
