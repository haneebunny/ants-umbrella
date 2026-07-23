"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import Header from './components/layout/Header';
import WeatherBanner from './components/home/WeatherBanner';
import KosdaqMiniChart from './components/home/KosdaqMiniChart';
import AssetSummaryCard from './components/home/AssetSummaryCard';
import PortfolioProfileCard from './components/home/PortfolioProfileCard';
import StockWeatherList from './components/home/StockWeatherList';
import GuestCTABanner from './components/home/GuestCTABanner';
import WatchlistCard from './components/home/WatchlistCard';
import AntPet from './components/AntPet';
import RainEffect from './components/RainEffect';
import { PORTFOLIO_PRESETS, kosdaqIndex } from './data/mockData';


const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/** 컴포넌트 언마운트(페이지 이동) 시에도 유지되는 전역 날씨 캐시 */
const globalWeatherCache = {};

/** prob_down 기반 전체 날씨 집계: 보유 종목 weather 배열 → 대표 weather */
function aggregateWeather(stocks) {
  const priority = { thunder: 4, rainy: 3, cloudy: 2, sunny: 1 };
  let worst = 'sunny';
  for (const s of stocks) {
    if ((priority[s.weather] || 0) > (priority[worst] || 0)) worst = s.weather;
  }
  const label = { sunny: '맑음', cloudy: '구름', rainy: '비', thunder: '번개' };
  return { status: worst, label: label[worst] || '맑음' };
}

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const [isDemo, setIsDemo] = useState(true);

  // 선택된 포트폴리오 ID (sessionStorage에서 복원하여 상세페이지 이동 후 복귀 시 유지)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('ants_selected_portfolio');
      if (saved) return Number(saved);
    }
    return 1;
  });

  // 선택된 포트폴리오 변경 시 sessionStorage 기록
  const handleSelectPortfolio = useCallback((id) => {
    setSelectedPortfolioId(id);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ants_selected_portfolio', String(id));
    }
  }, []);

  // 선택된 포트폴리오 mockData (기본값)
  const mockPortfolio = PORTFOLIO_PRESETS.find(p => p.id === selectedPortfolioId) || PORTFOLIO_PRESETS[0];

  // 초기 상태부터 전역 캐시된 데이터로 즉시 렌더링 (돌아왔을 때 딜레이/깜빡임 100% 차단)
  const [liveStockList, setLiveStockList] = useState(() => globalWeatherCache[selectedPortfolioId] || null);
  const [apiLoading, setApiLoading] = useState(false);

  // 마운트 시 localStorage에서 완료된 진단 결과 복원
  useEffect(() => {
    const complete = localStorage.getItem('ants_survey_complete');
    const saved    = localStorage.getItem('ants_result_profile');
    if (complete === 'true' && saved) {
      try { setIsDemo(false); } catch { setIsDemo(true); }
    }
  }, []);

  // 포트폴리오 변경 시 API 호출하여 실제 날씨 데이터 가져오기
  const fetchWeather = useCallback(async (portfolioId, portfolio) => {
    const tickers = portfolio.stockWeatherList.map(s => s.ticker).join(',');
    if (!tickers) return;

    if (!globalWeatherCache[portfolioId]) {
      setApiLoading(true);
    }

    try {
      const res = await fetch(`${API_BASE}/api/dashboard-weather?tickers=${tickers}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const apiData = await res.json();

      const apiMap = {};
      for (const row of apiData) apiMap[row.ticker] = row;

      const merged = portfolio.stockWeatherList.map(stock => {
        const live = apiMap[stock.ticker];
        if (!live || !live.available) return stock;
        return {
          ...stock,
          weather:   live.weather   || stock.weather,
          direction: live.direction || stock.direction,
          change:    live.change    !== null ? live.change : stock.change,
        };
      });

      // 전역 캐시 업데이트 & 상태 반영
      globalWeatherCache[portfolioId] = merged;
      setLiveStockList(merged);
    } catch (err) {
      console.warn('[Dashboard] API 조회 실패, mockData 사용:', err.message);
      if (!globalWeatherCache[portfolioId]) {
        setLiveStockList(null);
      }
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (globalWeatherCache[selectedPortfolioId]) {
      setLiveStockList(globalWeatherCache[selectedPortfolioId]);
    }
    fetchWeather(selectedPortfolioId, mockPortfolio);
  }, [selectedPortfolioId, fetchWeather, mockPortfolio]);

  // 실제로 렌더링할 종목 목록 (API 성공 → live, 실패/로딩 → mock)
  const stockWeatherList = liveStockList || mockPortfolio.stockWeatherList;

  // 전체 날씨: live 데이터가 있으면 재집계, 없으면 mockData 사용
  const overallWeather = liveStockList
    ? { ...aggregateWeather(liveStockList), summary: mockPortfolio.overallWeather.summary, updatedAt: new Date().toISOString() }
    : mockPortfolio.overallWeather;

  const { assetSummary, profile, radarScores } = mockPortfolio;
  const alertCount = 2;

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      isDark ? 'bg-[#080b08] text-[#e2e2e2]' : 'bg-[#f0f2f0] text-[#0f1713]'
    }`}>

      {/* 공통 헤더 */}
      <Header isDark={isDark} toggleTheme={toggleTheme} alertCount={alertCount} />

      {/* 배경 대각선 비 내림 애니메이션 (날씨가 '비'나 '번개'일 때 작동) */}
      <RainEffect weatherStatus={overallWeather.status} isDark={isDark} />

      {/* ── 메인 콘텐츠: 모든 카드가 비 애니메이션(z-0) 위로 오도록 relative z-10 적용 ── */}
      <main className="relative z-10 pt-14 pb-32 px-4 lg:px-6 lg:ml-60 lg:w-[calc(100%-240px)] max-w-[1920px] min-h-screen flex flex-col">


        {/* ─ 게스트 CTA (데모 시에만) ─ */}
        {isDemo && (
          <div className="flex items-center pt-2 pb-2 flex-shrink-0">
            <GuestCTABanner isDemoMode={isDemo} isDark={isDark} compact />
          </div>
        )}
        {!isDemo && <div className="pt-3 flex-shrink-0" />}

        {/* ── 메인 12열 그리드: 날씨 배너(9칸) + 상단 연동 관심 주식(3칸) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* 좌측 9칸 영역: 상단 날씨 배너 + 하단 3열 위젯 ── */}
          <div className="lg:col-span-9 flex flex-col gap-4">

            {/* 섹션 1: 날씨 예보 배너 (가로폭 9칸으로 조절) */}
            <div>
              <WeatherBanner weather={overallWeather} isDark={isDark} />
            </div>

            {/* 하단 3열 그리드 (2 : 3.5 : 3.5 = 9) */}
            <div className="grid grid-cols-1 lg:grid-cols-9 gap-4 items-start">

              {/* 1열 (2칸) — 코스닥 + 투자성향 & 포트폴리오 선택 */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <KosdaqMiniChart index={kosdaqIndex} isDark={isDark} />
                <PortfolioProfileCard
                  profile={profile}
                  isDemoMode={isDemo}
                  isDark={isDark}
                  presets={PORTFOLIO_PRESETS}
                  selectedId={selectedPortfolioId}
                  onSelect={handleSelectPortfolio}
                />
              </div>

              {/* 2열 (3.5칸) — 종목별 날씨 */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                <StockWeatherList
                  stocks={stockWeatherList}
                  isDark={isDark}
                  isLoading={apiLoading}
                />
              </div>

              {/* 3열 (3.5/4칸) — 보유 자산 도넛 */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <AssetSummaryCard
                  summary={assetSummary}
                  radarScores={radarScores}
                  isDark={isDark}
                  weatherStatus={overallWeather.status}
                />
              </div>

            </div>

          </div>

          {/* ── 우측 4열 (3칸) — 관심 주식 (자연스러운 컴팩트 고정 높이) ── */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <WatchlistCard isDark={isDark} />
          </div>

        </div>

      </main>

      {/* 나개미 캐릭터 플로팅 */}
      <AntPet weather={overallWeather.status} portfolio={stockWeatherList} />
    </div>
  );
}

