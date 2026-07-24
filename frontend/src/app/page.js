"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './hooks/useTheme';
import WeatherBanner from './components/home/WeatherBanner';
import KosdaqMiniChart from './components/home/KosdaqMiniChart';
import AssetSummaryCard from './components/home/AssetSummaryCard';
import PortfolioProfileCard from './components/home/PortfolioProfileCard';
import StockWeatherList from './components/home/StockWeatherList';
import GuestCTABanner from './components/home/GuestCTABanner';
import WatchlistCard from './components/home/WatchlistCard';
import AntPet from './components/AntPet';
import RainEffect from './components/RainEffect';
import Icon from './components/Icon';
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
  const router = useRouter();
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
  const [showSurveyPrompt, setShowSurveyPrompt] = useState(false);
  const [kospiIndex, setKospiIndex] = useState(kosdaqIndex);
  const [apiLoading, setApiLoading] = useState(false);

  // 마운트 시 localStorage에서 완료된 진단 결과 복원 및 게스트 모달 처리
  useEffect(() => {
    const complete = localStorage.getItem('ants_survey_complete');
    const saved    = localStorage.getItem('ants_result_profile');
    if (complete === 'true' && saved) {
      try { setIsDemo(false); } catch { setIsDemo(true); }
    } else {
      // 진단을 받지 않은 신규 유저인 경우 데모 모드로 둘러보기 지원하며, 검사 유도 모달 활성화
      setIsDemo(true);
      setShowSurveyPrompt(true);
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
      const res = await fetch(API_BASE + '/api/dashboard-weather?tickers=' + tickers, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('API ' + res.status);
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

  // KOSPI 실시간 지수 호출 연동 (30초 주기 폴링)
  useEffect(() => {
    const fetchKospiIndex = async () => {
      try {
        const res = await fetch(API_BASE + '/api/kospi-index');
        if (res.ok) {
          const data = await res.json();
          setKospiIndex(data);
        }
      } catch (err) {
        console.warn('Failed to fetch KOSPI index:', err);
      }
    };
    fetchKospiIndex();
    const interval = setInterval(fetchKospiIndex, 30000);
    return () => clearInterval(interval);
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

  return (
    <div className="w-full relative">
      {/* 배경 대각선 비 내림 애니메이션 (날씨가 '비'나 '번개'일 때 작동) - z-0으로 렌더링 */}
      <RainEffect weatherStatus={overallWeather.status} isDark={isDark} />

      {/* ── 콘텐츠 영역을 relative z-10으로 감싸 빗방울이 뒤로 가게 함 ── */}
      <div className="relative z-10 w-full">
        {/* ─ 게스트 CTA (데모 시에만) ─ */}
        {isDemo && (
          <div className="mb-3">
            <GuestCTABanner isDemoMode={isDemo} isDark={isDark} compact />
          </div>
        )}

        {/* ── 메인 2단 그리드 (좌: 콘텐츠 / 우: 관심주식) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">

          {/* ── 좌측 메인 콘텐츠 영역 ── */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* 날씨 배너 (전체 폭) */}
            <WeatherBanner weather={overallWeather} isDark={isDark} />

            {/* 하단 3열 위젯 그리드: 12열 레이아웃으로 변경하여 좌측은 좁히고 종목별 날씨는 넓힘 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-start">

              {/* 코스닥 + 투자성향 (12열 중 3열 배정, 컴팩트하게) */}
              <div className="md:col-span-1 lg:col-span-3 flex flex-col gap-4">
                <KosdaqMiniChart index={kospiIndex} isDark={isDark} />
                <PortfolioProfileCard
                  profile={profile}
                  isDemoMode={isDemo}
                  isDark={isDark}
                  presets={PORTFOLIO_PRESETS}
                  selectedId={selectedPortfolioId}
                  onSelect={handleSelectPortfolio}
                />
              </div>

              {/* 종목별 날씨 (12열 중 5열 배정, 종목명이 안 잘리도록 넉넉하게) */}
              <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-4">
                <StockWeatherList
                  stocks={stockWeatherList}
                  isDark={isDark}
                  isLoading={apiLoading}
                />
              </div>

              {/* 보유 자산 (md에서 2칸 차지, lg에서 4열 배정) */}
              <div className="md:col-span-2 lg:col-span-5 flex flex-col gap-4">
                <AssetSummaryCard
                  summary={assetSummary}
                  radarScores={radarScores}
                  isDark={isDark}
                  weatherStatus={overallWeather.status}
                />
              </div>

            </div>
          </div>

          {/* ── 우측 관심 주식 (xl 이상에서만 고정 사이드 패널) ── */}
          <div className="hidden xl:flex flex-col gap-4 min-w-0">
            <WatchlistCard isDark={isDark} portfolio={stockWeatherList} />
          </div>

        </div>

        {/* 모바일/태블릿: 관심주식을 하단에 배치 */}
        <div className="xl:hidden mt-4">
          <WatchlistCard isDark={isDark} portfolio={stockWeatherList} />
        </div>
      </div>


      {/* ── 팝업 모달: 비진단자(신규 방문자) 대상 성향 검사 유도 ── */}
      {showSurveyPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border p-6 text-center space-y-6 transform scale-100 transition-all ${
            isDark 
              ? 'bg-[#191d1a] border-emerald-500/30 text-white shadow-[0_10px_50px_rgba(0,0,0,0.5)]' 
              : 'bg-white border-slate-100 text-[#0f1713] shadow-[0_10px_50px_rgba(62,180,137,0.15)]'
          }`}>
            <div className="space-y-4">
              {/* 상단 레이더 펄스 아이콘 */}
              <div className="relative inline-block">
                <div className={`absolute inset-0 blur-2xl rounded-full scale-125 opacity-30 ${isDark ? 'bg-[#69dbad]' : 'bg-[#3eb489]'}`} />
                <div className={`relative rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center border shadow-inner ${
                  isDark ? 'bg-zinc-800/80 border-zinc-700/50 text-[#69dbad]' : 'bg-emerald-50 border-emerald-100 text-[#3eb489]'
                }`}>
                  <Icon name="radar" className="w-10 h-10 animate-pulse" />
                </div>
              </div>

              {/* 문구 설명 */}
              <div className="space-y-2">
                <h2 className="text-lg font-black tracking-tight leading-snug">
                  반가워요! 🐜 <br />내 투자 성향에 딱 맞는 리스크를 진단해 보세요!
                </h2>
                <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  개미의 우산은 회원님의 투자 체질(성향)에 따라 맞춤형 주식 기상도를 분석해 드리는 서비스예요.<br />
                  지금 성향 진단을 받아보시면 나만을 위한 포트폴리오 날씨와 위험 대비책을 바로 확인하실 수 있답니다! ☔
                </p>
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push('/onboarding')}
                className="w-full py-3 rounded-xl text-xs font-black bg-[#3eb489] text-[#002115] hover:bg-[#329e76] transition-all cursor-pointer shadow-md active:scale-[0.98]"
              >
                🎯 3분만에 내 투자성향 진단하기
              </button>
              <button
                onClick={() => setShowSurveyPrompt(false)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark 
                    ? 'border-white/10 hover:bg-white/5 text-slate-300' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-500 bg-white'
                }`}
              >
                👀 샘플데이터로 먼저 둘러볼래요
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 나개미 캐릭터 플로팅 */}
      <AntPet weather={overallWeather.status} portfolio={stockWeatherList} />
    </div>
  );
}
