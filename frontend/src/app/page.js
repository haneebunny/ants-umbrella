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

/** 20거래일 전(약 한 달 전) 실제 우량주 가격 캐시 사전 (3안 백테스팅 매핑용) */
const HISTORICAL_PRICE_20D = {
  '005930': 71500,  // 삼성전자
  '000660': 168000, // SK하이닉스
  '005490': 395000, // POSCO홀딩스
  '068270': 175000, // 셀트리온
  '055550': 45000,  // 신한지주
  '000270': 116000, // 기아
  '051910': 440000, // LG화학
  '028260': 147000, // 삼성물산
  '017670': 51000,  // SK텔레콤
  '010950': 78000,  // S-Oil
  '033780': 90500,  // KT&G
  '035420': 195000, // NAVER
  '373220': 405000, // LG에너지솔루션
};

/** 컴포넌트 언마운트(페이지 이동) 시에도 유지되는 전역 날씨 캐시 */
const globalWeatherCache = {};

/**
 * AI 판단 근거(브리핑) 전역 캐시 — 포트폴리오/날씨/하락종목 구성이 그대로면
 * 다른 페이지로 이동했다가 돌아와도 재요청·스켈레톤 노출 없이 확정된 문구를 즉시 재사용.
 * (탭을 유지하는 동안만 유효, 새로고침 시 초기화됨 — 백엔드 캐시와는 별개의 프론트 레이어)
 */
const globalBriefingCache = {};

function buildBriefingKey(portfolioId, status, riskyTickers) {
  const riskyStr = riskyTickers.map(t => `${t.name}:${t.direction}`).sort().join(',');
  return `${portfolioId}|${status}|${riskyStr}`;
}

/** prob_down 기반 전체 날씨 집계: 보유 종목 weather 배열 → 대표 weather
 *
 * 'unknown'(예측 점수 없음)은 위험도 순위 계산에서 제외한다. 예측이 없는 것을
 * 조용히 '맑음'이나 '구름'으로 처리하면 사용자가 "안전하다"고 오인하기 때문이다.
 * 판정 가능한 종목이 하나도 없으면 전체 상태를 'unknown'으로 올린다.
 */
function aggregateWeather(stocks) {
  const priority = { thunder: 4, rainy: 3, cloudy: 2, sunny: 1 };
  const known = stocks.filter(s => priority[s.weather]);
  const unknownCount = stocks.length - known.length;

  if (known.length === 0) {
    return { status: 'unknown', label: '예측 불가', unknownCount };
  }
  let worst = 'sunny';
  for (const s of known) {
    if (priority[s.weather] > priority[worst]) worst = s.weather;
  }
  const label = { sunny: '맑음', cloudy: '구름', rainy: '비', thunder: '번개' };
  // 일부만 예측 불가일 때는 대표 날씨를 유지하되 건수를 함께 넘겨 배지로 안내한다
  return { status: worst, label: label[worst], unknownCount };
}

/** 마운트 시점에 동기적으로 브리핑 캐시 키를 계산 (liveStockList 초기값과 동일한 방식) */
function getInitialBriefingKey(portfolioId, mockPortfolio) {
  const cachedStocks = globalWeatherCache[portfolioId];
  const stocks = cachedStocks || mockPortfolio.stockWeatherList;
  const status = cachedStocks ? aggregateWeather(cachedStocks).status : mockPortfolio.overallWeather.status;
  const riskyTickers = stocks.filter(s => s.direction === 'down').map(s => ({ name: s.name, direction: s.direction }));
  return buildBriefingKey(portfolioId, status, riskyTickers);
}

export default function Home() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [isDemo, setIsDemo] = useState(true);

  // 선택된 포트폴리오 ID (sessionStorage 및 리포트 적용 파라미터 복원)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('applied') === 'true') {
        return 99; // 맞춤 포트폴리오 즉시 활성화
      }
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

  // 💡 선택된 포트폴리오 객체 동적 연산 (ID 99: 맞춤 포트폴리오)
  const mockPortfolio = React.useMemo(() => {
    if (selectedPortfolioId === 99 && typeof window !== 'undefined') {
      const customStocks = localStorage.getItem('ants_portfolio');
      const savedProfile = localStorage.getItem('ants_result_profile');
      if (customStocks) {
        try {
          const stocks = JSON.parse(customStocks);
          const prof = savedProfile ? JSON.parse(savedProfile) : PORTFOLIO_PRESETS[0].profile;
          
          // 맞춤 종목 리스트 포맷 (로컬스토리지 수량 및 평단가 반영 + 20거래일 전 종가 백테스팅 연동)
          const stockWeatherList = stocks.map(s => {
            const rawPrice = Number(s.purchasePrice);
            // 사용자가 수동 입력을 거치지 않은 경우(5만원 고정 상태) 20거래일 전 실제 종가 꽂아넣기
            const purchasePrice = (rawPrice === 50000 || !rawPrice)
              ? (HISTORICAL_PRICE_20D[s.ticker] || 50000)
              : rawPrice;

            return {
              ticker: s.ticker,
              name: s.name,
              weight: s.weight || 25,
              tag: s.tag || '#우량주',
              quantity: Number(s.quantity) || 10,
              purchasePrice: purchasePrice,
              weather: 'sunny',
              direction: 'up',
              change: 0.0,
              prob_up: 50.0,
            };
          });

          return {
            id: 99,
            emoji: '🎯',
            label: '내 맞춤 포트폴리오',
            totalLabel: `${stockWeatherList.map(s => s.name).slice(0, 3).join(', ')} 등`,
            profile: prof,
            radarScores: {
              esgScore: 85,
              riskScore: 35,
              marketSensitivity: 45,
            },
            assetSummary: {
              totalAsset: 120000000,
              totalPurchaseAsset: 120000000,
              totalProfitLoss: 0,
              totalProfitLossRate: 0,
              totalQuantity: 300,
              holdings: stockWeatherList.map(s => ({
                ticker: s.ticker,
                name: s.name,
                weight: s.weight,
                quantity: s.quantity,
                purchasePrice: s.purchasePrice,
                currentPrice: s.purchasePrice,
              }))
            },
            overallWeather: { status: 'sunny', label: '맑음' },
            stockWeatherList,
          };
        } catch (e) {
          console.warn('Failed to parse custom portfolio:', e);
        }
      }
    }
    return PORTFOLIO_PRESETS.find(p => p.id === selectedPortfolioId) || PORTFOLIO_PRESETS[0];
  }, [selectedPortfolioId]);

  // 초기 상태부터 전역 캐시된 데이터로 즉시 렌더링 (돌아왔을 때 딜레이/깜빡임 100% 차단)
  const [liveStockList, setLiveStockList] = useState(() => globalWeatherCache[selectedPortfolioId] || null);
  const [showSurveyPrompt, setShowSurveyPrompt] = useState(false);
  const [kospiIndex, setKospiIndex] = useState(null);
  const [apiLoading, setApiLoading] = useState(() => !globalWeatherCache[selectedPortfolioId]);
  const [apiFailed, setApiFailed] = useState(false);
  // AI 판단 근거 — 같은 포트폴리오/날씨/하락종목 구성이면 전역 캐시에서 즉시 복원되어
  // 재방문 시 스켈레톤이 다시 뜨지 않음 (구성이 바뀌었을 때만 새로 요청)
  const [aiSummary, setAiSummary] = useState(() => {
    const key = getInitialBriefingKey(selectedPortfolioId, mockPortfolio);
    return globalBriefingCache[key] || null;
  });
  const [briefingLoading, setBriefingLoading] = useState(() => {
    const key = getInitialBriefingKey(selectedPortfolioId, mockPortfolio);
    return !globalBriefingCache[key];
  });
  const [forceWeather, setForceWeather] = useState(null); // 'sunny' | 'cloudy' | 'rainy' | 'thunder' | null

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

    setApiFailed(false);
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
          prob_up:   live.prob_up   !== undefined ? live.prob_up : stock.prob_up,
          currentPrice: live.currentPrice !== undefined ? live.currentPrice : stock.currentPrice,
        };
      });

      // 전역 캐시 업데이트 & 상태 반영
      globalWeatherCache[portfolioId] = merged;
      setLiveStockList(merged);
    } catch (err) {
      console.warn('[Dashboard] API 조회 실패, 스켈레톤 상태 유지:', err.message);
      setApiFailed(true);
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
    setForceWeather(null); // 포트폴리오 변경 시 수동 날씨 조작 설정도 초기화
    if (globalWeatherCache[selectedPortfolioId]) {
      setLiveStockList(globalWeatherCache[selectedPortfolioId]);
    }
    fetchWeather(selectedPortfolioId, mockPortfolio);
    // AI 판단 근거는 여기서 초기화하지 않음 — 아래 브리핑 effect가 캐시 키(포트폴리오/날씨/
    // 하락종목 구성) 기준으로 판단해서, 구성이 그대로면 스켈레톤 없이 캐시된 문구를 유지함
  }, [selectedPortfolioId, fetchWeather, mockPortfolio]);

  // 실제로 렌더링할 종목 목록 (API 성공 → live, 실패/로딩 → mock)
  const stockWeatherList = liveStockList || mockPortfolio.stockWeatherList;

  // 전체 날씨 계산
  const baseWeather = liveStockList
    ? { ...aggregateWeather(liveStockList), updatedAt: new Date().toISOString() }
    : mockPortfolio.overallWeather;

  // forceWeather가 설정되어 있으면 전체 날씨의 status 및 label을 오버라이드
  const activeWeatherStatus = forceWeather || baseWeather.status;
  const activeWeatherLabel = activeWeatherStatus === 'thunder' ? '번개'
                           : activeWeatherStatus === 'rainy'   ? '비'
                           : activeWeatherStatus === 'cloudy'  ? '구름'
                           : '맑음';

  const overallWeather = {
    ...baseWeather,
    status: activeWeatherStatus,
    label: activeWeatherLabel,
    summary: aiSummary || []
  };

  const riskyTickers = React.useMemo(() => {
    return stockWeatherList
      .filter(s => s.direction === 'down')
      .map(s => ({ name: s.name, direction: s.direction }));
  }, [stockWeatherList]);

  const weatherStatusForRequest = activeWeatherStatus === 'thunder' ? 'thunder'
                                 : activeWeatherStatus === 'rainy'   ? 'rainy'
                                 : activeWeatherStatus === 'cloudy'  ? 'cloudy'
                                 : 'sunny';

  const briefingKey = React.useMemo(() => {
    return buildBriefingKey(selectedPortfolioId, weatherStatusForRequest, riskyTickers);
  }, [selectedPortfolioId, weatherStatusForRequest, riskyTickers]);

  // 날씨 상태 또는 구성 종목의 리스크 정보 변동 시에만 백엔드에 브리핑 요청.
  // 동일 구성(포트폴리오+날씨+하락종목)에 대해 이미 확정된 문구가 캐시에 있으면
  // 재요청·스켈레톤 노출 없이 즉시 재사용 → 다른 페이지 갔다 돌아와도 깜빡임 없음.
  useEffect(() => {
    if (!overallWeather?.status) return;

    const cachedSummary = globalBriefingCache[briefingKey];
    if (cachedSummary) {
      setAiSummary(cachedSummary);
      setBriefingLoading(false);
      return;
    }

    setBriefingLoading(true);
    setAiSummary(null); // 새로운 구성이라 캐시가 없을 때만 스켈레톤 노출

    fetch(`${API_BASE}/api/weather-briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolio_id: selectedPortfolioId,
        weather_status: weatherStatusForRequest,
        weather_label: overallWeather.label,
        risky_tickers: riskyTickers,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data?.summary?.length) {
          globalBriefingCache[briefingKey] = data.summary; // 확정된 문구를 전역 캐시에 저장해 재방문 시 재사용
          setAiSummary(data.summary);
        } else {
          setAiSummary(null);
        }
      })
      .catch(() => setAiSummary(null))
      .finally(() => setBriefingLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefingKey, overallWeather?.label, selectedPortfolioId]);


  const { profile, radarScores } = mockPortfolio;

  // holdings에 실시간 가격을 매핑한 liveAssetSummary 생성
  const liveAssetSummary = React.useMemo(() => {
    const defaultHoldings = mockPortfolio.assetSummary.holdings;
    
    const stockMap = {};
    stockWeatherList.forEach(s => {
      stockMap[s.ticker] = s;
    });

    let totalEvaluationAsset = 0; // 총 평가 자산
    let totalPurchaseAsset = 0; // 총 매수 자산
    let totalQuantity = 0; // 총 주식 보유량

    const updatedHoldings = [];
    for (const h of defaultHoldings) {
      const stockInfo = stockMap[h.ticker] || {};
      const quantity = stockInfo.quantity || h.quantity || 0;
      const purchasePrice = stockInfo.purchasePrice || h.purchasePrice || 0;
      
      const currentPrice = stockInfo.currentPrice !== undefined ? stockInfo.currentPrice 
                         : (stockInfo.change !== undefined ? (purchasePrice * (1 + stockInfo.change / 100)) : purchasePrice);
      
      const evaluationValue = currentPrice * quantity;
      const purchaseValue = purchasePrice * quantity;

      totalEvaluationAsset += evaluationValue;
      totalPurchaseAsset += purchaseValue;
      totalQuantity += quantity;

      const profitLoss = evaluationValue - purchaseValue;
      const profitLossRate = purchaseValue > 0 ? (profitLoss / purchaseValue) * 100 : 0;

      updatedHoldings.push({
        ...h,
        quantity,
        purchasePrice,
        currentPrice,
        evaluationValue,
        purchaseValue,
        profitLoss,
        profitLossRate,
      });
    }

    const totalProfitLoss = totalEvaluationAsset - totalPurchaseAsset;
    const totalProfitLossRate = totalPurchaseAsset > 0 ? (totalProfitLoss / totalPurchaseAsset) * 100 : 0;

    const finalHoldings = updatedHoldings.map(h => {
      const weight = totalEvaluationAsset > 0 ? Math.round((h.evaluationValue / totalEvaluationAsset) * 100) : h.weight;
      return { ...h, weight };
    });

    return {
      ...mockPortfolio.assetSummary,
      totalAsset: totalEvaluationAsset,
      totalPurchaseAsset,
      totalProfitLoss,
      totalProfitLossRate,
      totalQuantity,
      holdings: finalHoldings,
    };
  }, [mockPortfolio.assetSummary, stockWeatherList]);

  return (
    <div className="w-full relative">
      {/* 배경 대각선 비 내림 애니메이션 (날씨가 '비'나 '번개'일 때 작동) - z-0으로 렌더링 */}
      <RainEffect weatherStatus={overallWeather.status} isDark={isDark} />

      {/* ── 콘텐츠 영역을 relative z-10으로 감싸 빗방울이 뒤로 가게 함 ── */}
    <div className="relative z-10 w-full pt-4">
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
            <WeatherBanner 
              weather={overallWeather} 
              isDark={isDark} 
              isStatusLoading={apiLoading && !liveStockList}
              isBriefingLoading={briefingLoading || (apiLoading && !liveStockList) || !aiSummary}
              forceWeather={forceWeather}
              onForceWeatherChange={setForceWeather}
            />

            {/* 하단 위젯 그리드: 좌측 코스닥+투자성향(4열) / 우측 내 포트폴리오 & 자산 진단 통합 카드(8열) */}
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

              {/* 내 포트폴리오 & 자산 진단 (통합 카드 - 12열 중 9열 배정하여 훨씬 넓은 가로 공간 확보) */}
              <div className="md:col-span-1 lg:col-span-9 flex flex-col gap-4">
                <AssetSummaryCard
                  summary={liveAssetSummary}
                  stockWeatherList={stockWeatherList}
                  radarScores={radarScores}
                  isDark={isDark}
                  weatherStatus={overallWeather.status}
                  isLoading={apiLoading || apiFailed || !liveStockList}
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
