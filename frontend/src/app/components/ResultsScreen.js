import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import AssetChart from './AssetChart';
import AntPet from './AntPet';


export default function ResultsScreen({ theme, profile, onReset, toggleTheme, isDemoMode = false, inShell = false }) {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('ATMOSPHERE'); // 기본 활성 탭: 투자 기상도
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDemoPortfolio, setShowDemoPortfolio] = useState(false);

  // 가상 포트폴리오 데이터 상태 (초기 기본값 지정 후 마운트 시 target_risk_band와 연동하여 동적 업데이트)
  const [portfolio, setPortfolio] = useState([
    { ticker: '005930', name: '삼성전자', weight: 25, direction: 'down', confidence: 'strong', change: -1.2, evidences: [] }
  ]);

  // 성향별 portfolio.json 스펙 기반 포트폴리오 로딩 및 실시간 백엔드 API 연동
  useEffect(() => {
    let initialHoldings = [];
    const band = profile.target_risk_band;
    
    if (band === 'CONSERVATIVE' || band === 'MODERATE_CONSERVATIVE') {
      // 1번 포트폴리오 [안정추구형] 대형 우량주 & 전통 배당·방어
      initialHoldings = [
        { ticker: '032830', name: '삼성생명', weight: 26, direction: 'down', confidence: 'medium', change: -0.5,
          evidences: [
            { type: 'ESG', direction: '부정', category: '지배구조', title: '계열사 지원 부담 및 지배구조 지배력 불투명성 부각', url: '#' }
          ]
        },
        { ticker: '033780', name: 'KT&G', weight: 25, direction: 'up', confidence: 'weak', change: 0.2, evidences: [] },
        { ticker: '105560', name: 'KB금융', weight: 25, direction: 'up', confidence: 'medium', change: 1.1,
          evidences: [
            { type: '재무', direction: '긍정', category: '실적·재무', title: '금리 방어선 유지 및 대출 포트폴리오 자산 성장세 지속', url: '#' }
          ]
        },
        { ticker: '005380', name: '현대차', weight: 24, direction: 'down', confidence: 'weak', change: -0.2, evidences: [] }
      ];
    } else if (band === 'GROWTH' || band === 'AGGRESSIVE') {
      // 2번 포트폴리오 [성장·테크 집중형] 대한민국 주도주
      initialHoldings = [
        { ticker: '005930', name: '삼성전자', weight: 25, direction: 'down', confidence: 'strong', change: -1.2,
          evidences: [
            { type: '공시', direction: '부정', category: '자본이벤트', title: '단기 설비 투자 차입금 증가 결정 공시', url: '#' }
          ]
        },
        { ticker: '000660', name: 'SK하이닉스', weight: 26, direction: 'up', confidence: 'medium', change: 2.1,
          evidences: [
            { type: '산업', direction: '긍정', category: '산업·사업동향', title: 'HBM4 기술 상용화 및 대규모 차세대 메모리 공급 계약 체결', url: '#' }
          ]
        },
        { ticker: '373220', name: 'LG에너지솔루션', weight: 24, direction: 'up', confidence: 'weak', change: 0.5, evidences: [] },
        { ticker: '035420', name: 'NAVER', weight: 25, direction: 'down', confidence: 'medium', change: -0.8, evidences: [] }
      ];
    } else {
      // 3번 포트폴리오 [복합 분산형] SASB 업종 다각화 8선 (BALANCED 등 기본값)
      initialHoldings = [
        { ticker: '005490', name: 'POSCO홀딩스', weight: 12, direction: 'down', confidence: 'medium', change: -0.4, evidences: [] },
        { ticker: '068270', name: '셀트리온', weight: 13, direction: 'up', confidence: 'weak', change: 0.3, evidences: [] },
        { ticker: '055550', name: '신한지주', weight: 12, direction: 'up', confidence: 'medium', change: 1.0, evidences: [] },
        { ticker: '000270', name: '기아', weight: 12, direction: 'up', confidence: 'weak', change: 0.2, evidences: [] },
        { ticker: '051910', name: 'LG화학', weight: 13, direction: 'down', confidence: 'medium', change: -0.7, evidences: [] },
        { ticker: '028260', name: '삼성물산', weight: 12, direction: 'up', confidence: 'weak', change: 0.1, evidences: [] },
        { ticker: '017670', name: 'SK텔레콤', weight: 13, direction: 'up', confidence: 'medium', change: 0.8,
          evidences: [
            { type: '공시', direction: '부정', category: '사업보고', title: '친환경 인프라 설비 감사 결과 부정 평가 지적', url: '#' }
          ]
        },
        { ticker: '010950', name: 'S-Oil', weight: 13, direction: 'down', confidence: 'weak', change: -0.3, evidences: [] }
      ];
    }

    setPortfolio(initialHoldings);

    // 백엔드 실시간 ESG 리스크 정보 연동
    const fetchLiveEvidence = async () => {
      const tickers = initialHoldings.map(h => h.ticker).join(',');
      try {
        const res = await fetch(`http://localhost:8000/api/dashboard-weather?tickers=${tickers}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const dataMap = {};
        data.forEach(item => {
          dataMap[item.ticker] = item;
        });

        // 가져온 실시간 감성/신호 정보로 포트폴리오 머지
        setPortfolio(prev => prev.map(stock => {
          const live = dataMap[stock.ticker];
          if (!live || !live.available) return stock;
          return {
            ...stock,
            direction: live.direction || stock.direction,
            confidence: live.confidence_tier || stock.confidence,
            evidences: (live.evidences && live.evidences.length > 0) ? live.evidences : stock.evidences,
            change: live.changePercent !== undefined ? live.changePercent : stock.change
          };
        }));
      } catch (err) {
        console.warn('백엔드 실시간 연동 생략 (Fallback 유지)');
      }
    };
    fetchLiveEvidence();
  }, [profile]);

  // 성향별 허용 위험 점수
  const bandToLimit = {
    CONSERVATIVE: 20,
    MODERATE_CONSERVATIVE: 40,
    BALANCED: 55,
    GROWTH: 75,
    AGGRESSIVE: 90
  };
  const toleranceLimit = bandToLimit[profile.target_risk_band] || 55;

  // 체질별 민감도 가중치 산출 함수
  const getSensitivityFactor = (band) => {
    switch (band) {
      case 'CONSERVATIVE': return 2.0;
      case 'MODERATE_CONSERVATIVE': return 1.5;
      case 'BALANCED': return 1.0;
      case 'GROWTH': return 0.6;
      case 'AGGRESSIVE': return 0.3;
      default: return 1.0;
    }
  };

  // 실시간 포트폴리오 가중치 기반 기상도 계산식
  const calculateAtmosphere = () => {
    let rawScore = 0;
    portfolio.forEach(s => {
      let score = 0;
      if (s.direction === 'down') {
        if (s.confidence === 'strong') score = 10;
        else if (s.confidence === 'medium') score = 6;
        else score = 3;
      }
      rawScore += (score * s.weight) / 100;
    });

    const factor = getSensitivityFactor(profile.target_risk_band);
    const finalScore = rawScore * factor;

    let weather = 'sunny';
    let label = '맑음';
    let icon = 'sun';
    let color = 'text-[#3eb489]';
    let bgColor = 'from-[#3eb489]/10 to-[#3eb489]/5 border-[#3eb489]/20';
    let textColor = 'text-[#3eb489]';
    let desc = '내가 가진 주식들에 특별한 리스크 신호가 잡히지 않아 날씨가 아주 맑고 평온해요! 안심하고 지켜봐도 좋은 상태랍니다. ☀️';

    if (finalScore >= 8) {
      weather = 'thunder';
      label = '번개';
      icon = 'zap';
      color = 'text-red-500';
      bgColor = 'from-red-500/10 to-red-500/5 border-red-500/20';
      textColor = 'text-red-500';
      desc = '🚨 경고! 내 포트폴리오의 주요 종목들에 하락 압박을 주는 중대성(Materiality) 리스크 요인들이 강하게 감지되었어요. 소나기를 피할 준비를 서둘러야 할지도 몰라요!';
    } else if (finalScore >= 5) {
      weather = 'rainy';
      label = '비';
      icon = 'cloudRain';
      color = 'text-blue-500';
      bgColor = 'from-blue-500/10 to-blue-500/5 border-blue-500/20';
      textColor = 'text-blue-500';
      desc = '☔ 주의! 주요 종목들에 하락 압력을 주는 뉴스나 공시 위험이 쌓여서 비가 내리는 날씨가 되었어요. 내 성향에 비해 위험 노출도가 살짝 높아진 상태니 조심해요!';
    } else if (finalScore >= 2) {
      weather = 'cloudy';
      label = '구름';
      icon = 'cloud';
      color = 'text-amber-500';
      bgColor = 'from-amber-500/10 to-amber-500/5 border-amber-500/20';
      textColor = 'text-amber-500';
      desc = '☁️ 포트폴리오의 일부 종목에 잔잔한 ESG 평판 리스크나 주가 변동성 징후가 포착되어 날씨가 조금 흐려요. 당분간은 꼼꼼히 지켜보는 게 좋겠어요!';
    }

    return { weather, label, icon, color, bgColor, textColor, desc, finalScore };
  };

  const currentAtmosphere = calculateAtmosphere();

  // 토스트 메시지 함수
  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 2500);
  };

  // 계좌 연동 모의 비동기 처리
  const handleConnectBroker = () => {
    if (isConnected) {
      setIsConnected(false);
      showToast('마이데이터 계좌 연동이 해제되었어요.');
      return;
    }
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      showToast('한국투자증권 API 계좌가 연동되었어요! 보유 자산 데이터가 실시간으로 쏙쏙 맞춰집니다. 🔗');
    }, 2000);
  };

  // 보유 자산 모의 가치
  const totalAssetVal = 8000000; // 800만원
  const getAssetValue = (weight) => {
    return Math.round((totalAssetVal * weight) / 100);
  };

  // 보유 비중 수동 조절 핸들러
  const handleWeightChange = (ticker, delta) => {
    setPortfolio(prev => {
      const target = prev.find(h => h.ticker === ticker);
      if (!target) return prev;
      
      const newWeight = Math.max(5, Math.min(60, target.weight + delta));
      const rest = prev.filter(h => h.ticker !== ticker);
      const restSum = rest.reduce((acc, curr) => acc + curr.weight, 0);
      const needed = 100 - newWeight;
      
      if (restSum === 0) return prev;
      
      const updatedRest = rest.map(h => ({
        ...h,
        weight: Math.round((h.weight / restSum) * needed)
      }));
      
      const finalMerged = [{ ...target, weight: newWeight }, ...updatedRest];
      const finalSum = finalMerged.reduce((acc, curr) => acc + curr.weight, 0);
      if (finalSum !== 100) {
        finalMerged[finalMerged.length - 1].weight += (100 - finalSum);
      }
      return finalMerged;
    });
  };

  // 균등 비분배 초기화 핸들러
  const handleEqualDistribution = () => {
    const activeCount = portfolio.length;
    if (activeCount === 0) return;
    const share = Math.floor(100 / activeCount);
    setPortfolio(prev => prev.map((s, idx) => ({
      ...s,
      weight: idx === activeCount - 1 ? 100 - (share * (activeCount - 1)) : share
    })));
    showToast('보유 비중을 균등하게 골고루 나눴어요! ⚖️');
  };

  return (
    <div className={inShell ? "w-full" : `min-h-screen relative overflow-hidden transition-colors duration-300 pb-32 w-full ${
      isDark ? 'bg-[#0d0f0f] text-[#e2e2e2]' : 'bg-[#f4f9f7] text-[#0f1713]'
    }`}>
      {/* 배경 그리드 및 블러 */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: isDark 
            ? 'radial-gradient(#69dbad 1px, transparent 1px)' 
            : 'radial-gradient(#3eb489 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className={`fixed top-1/4 -right-20 w-96 h-96 rounded-full blur-[120px] pointer-events-none -z-10 ${
        isDark ? 'bg-[#69dbad]/5' : 'bg-[#3eb489]/5'
      }`} />
      <div className={`fixed bottom-1/4 -left-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none -z-10 ${
        isDark ? 'bg-[#d7ffc5]/5' : 'bg-[#3eb489]/30'
      }`} />

      {/* 헤더 상단 바 */}
      {!inShell && (
      <header className={`flex justify-between items-center px-6 h-16 w-full fixed top-0 z-50 transition-all ${
        isDark 
          ? 'bg-[#0d0f0f]/80 backdrop-blur-md border-b border-[#3d4943]' 
          : 'bg-[#f4f9f7]/80 backdrop-blur-md border-b border-[#3eb489]/20'
      }`}>
        <div className="flex items-center gap-4">
          {!isDemoMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onReset(); }}
              aria-label="성향 테스트 다시 시작"
              className={`hover:opacity-80 transition-opacity p-2 cursor-pointer flex items-center justify-center rounded-full ${
                isDark ? 'hover:bg-slate-800 text-[#69dbad]' : 'hover:bg-slate-100 text-[#3eb489]'
              }`}
            >
              <Icon name="arrowLeft" className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <img src="/images/ants_umbrella_logo.png" alt="로고" className="w-7 h-7 object-contain" />
            <span className={`font-sans text-lg font-black tracking-tight ${isDark ? 'text-[#e2e2e2]' : 'text-[#0f1713]'}`}>
              개미의 우산
            </span>
          </div>
          {isDemoMode && (
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-tight border ${
                isDark
                  ? 'bg-amber-900/40 text-amber-300 border-amber-600/40'
                  : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}>
                내 성향: 데모 체험 중
              </span>
              <a
                href="/onboarding"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-90 ${
                  isDark
                    ? 'bg-[#3eb489] text-[#0a1f14] hover:bg-[#5ecfa0]'
                    : 'bg-[#3eb489] text-white hover:bg-[#2d966e]'
                }`}
              >
                내 포트폴리오 진단하기
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            aria-label="화면 테마 전환"
            className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 cursor-pointer relative flex items-center ${
              isDark 
                ? 'bg-zinc-800 border border-[#3d4943]' 
                : 'bg-emerald-100 border border-[#3eb489]/20 soft-shadow-light'
            }`}
          >
            <div 
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                isDark 
                  ? 'translate-x-7 bg-[#3eb489] text-[#002115]' 
                  : 'translate-x-0 bg-amber-500 text-white'
              }`}
            >
              {isDark ? <Icon name="moon" className="w-3.5 h-3.5" /> : <Icon name="sun" className="w-3.5 h-3.5" />}
            </div>
          </button>

          <div className={`w-8 h-8 rounded-full overflow-hidden border ${isDark ? 'border-[#3eb489]/20' : 'border-[#3eb489]/20'}`}>
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNY5NDw88xhiYKkv9zCStz5DeMSn1z9x8zbDEx8Rmtv-n1RzKTRZ9dW9UhzlRHyZVWZoZQWIgGrILxwoqhuvl-E2ALQKOZP4takWWeAs8l5pY1um27lbAj3JMxxbpdMPhrhgxjN7zloMUtTXtAR3HY8bp-VPpO8U9XXb_gIZoBe67AWv-AiR0mdCPjITnxwgaskhC0aJ-adj7QC2z6MT6ZzfiNq2r4kW_S-EELFtuFBRT-0TbmZOpqIw" 
              alt="아바타"
            />
          </div>
        </div>
      </header>
      )}

      {/* 메인 내용 영역 */}
      <main className={inShell ? "w-full space-y-8 relative" : "pt-24 px-6 max-w-5xl mx-auto space-y-8 z-10 relative"}>
        
        {/* 알림 토스트 배너 */}
        {feedbackMsg && (
          <div className={`p-4 rounded-xl font-sans text-xs flex items-center gap-3 transition-all ${
            isDark ? 'bg-[#1e2020] border border-[#69dbad] text-[#69dbad]' : 'bg-white border border-[#3eb489]/20 text-[#3eb489] font-bold soft-shadow-light'
          }`}>
            <Icon name="sparkles" className="w-4 h-4 animate-spin" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* 1. 투자 기상도 탭 (ATMOSPHERE) */}
        {activeTab === 'ATMOSPHERE' && (
          <div className="space-y-8 animate-fadeIn">
            {/* 상단 타이틀 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`font-sans text-[10px] tracking-wider font-bold px-2.5 py-1 rounded-lg ${
                  isDark ? 'bg-[#69dbad]/10 text-[#69dbad] border border-[#69dbad]/20' : 'bg-[#3eb489]/10 text-[#3eb489] border border-[#3eb489]/20'
                }`}>
                  실시간 포트폴리오 진단
                </span>
              </div>
              <h1 className={`font-sans text-2xl md:text-3xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                오늘 내 포트폴리오의 날씨는 <span className={currentAtmosphere.textColor}>[{currentAtmosphere.label}]</span> 이에요!
              </h1>
              <p className={`font-sans text-xs md:text-sm max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                내 투자 성향인 <span className="font-bold">[{profile.titleKo}]</span>의 위험 민감도와 오늘 내 보유 자산의 이슈들을 실시간으로 분석해서 알려주는 날씨 정보예요!
              </p>
            </section>

            {/* 대형 날씨 알림 카드 */}
            <div className={`p-8 rounded-3xl bg-gradient-to-br border transition-all duration-700 flex flex-col md:flex-row items-center justify-between gap-8 ${currentAtmosphere.bgColor} ${
              isDark ? 'border-[#3d4943]' : 'border-[#3eb489]/15'
            }`}>
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <span className={`font-sans text-xs font-bold px-3 py-1 rounded-full ${
                    isDark ? 'bg-black/30' : 'bg-white/60'
                  }`}>
                    체질 맞춤 위험 민감도: {getSensitivityFactor(profile.target_risk_band)}배
                  </span>
                  <span className={`font-sans text-xs font-bold px-3 py-1 rounded-full ${
                    isDark ? 'bg-[#69dbad]/20 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#3eb489]'
                  }`}>
                    종합 위험도: {currentAtmosphere.finalScore.toFixed(1)}점
                  </span>
                </div>
                
                <h2 className={`font-sans text-2xl font-black leading-snug ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  {currentAtmosphere.label === '맑음' ? '평화롭고 화창한 날씨예요. ☀️' : ''}
                  {currentAtmosphere.label === '구름' ? '구름이 조금 꼈어요. 꼼꼼히 살펴봐요! ☁️' : ''}
                  {currentAtmosphere.label === '비' ? '비가 오고 있어요! 하락 압박 요인들이 누적되었으니 주의하세요. ☔' : ''}
                  {currentAtmosphere.label === '번개' ? '⚡ 번개가 쳐요! 리스크 요인이 가득 모여 비상이 걸린 국면이에요!' : ''}
                </h2>
                
                <p className={`font-sans text-xs md:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {currentAtmosphere.desc}
                </p>
                <p className={`font-sans text-[11px] leading-relaxed opacity-60 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  * 각 종목에 감지된 최신 뉴스/공시 리스크에 대해 개인 투자성향 민감도가 곱해져 기상 날씨가 동적으로 변화합니다. 우량 자산의 비중을 늘리면 날씨가 맑아질 수 있습니다.
                </p>
              </div>
              
              <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center border shadow-inner ${
                isDark ? 'bg-zinc-800/80 border-zinc-700/50' : 'bg-white border-slate-100'
              }`}>
                <Icon name={currentAtmosphere.icon} className={`w-14 h-14 md:w-20 md:h-20 ${currentAtmosphere.textColor}`} />
              </div>
            </div>

            {/* 날씨 영향 지표 카드 격자 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#1e2020] border-white/5' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">체질 민감 가중치</p>
                <p className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{getSensitivityFactor(profile.target_risk_band)}배</p>
                <p className="text-xs text-slate-400 mt-2">내 투자 성향에 맞게 지정된 민감도 배수예요!</p>
              </div>

              <div className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#1e2020] border-white/5' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">허용 한계치</p>
                <p className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{toleranceLimit}점</p>
                <p className="text-xs text-slate-400 mt-2">감당할 수 있는 리스크의 상한선이에요!</p>
              </div>

              <div className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#1e2020] border-white/5' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">보유 자산 리스크 총점</p>
                <p className={`text-2xl font-black font-mono ${currentAtmosphere.textColor}`}>{currentAtmosphere.finalScore.toFixed(1)}점</p>
                <p className="text-xs text-slate-400 mt-2">내 민감도를 곱해 산출한 종합 리스크 점수예요!</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. 위험 레이더 탭 (RADAR) */}
        {activeTab === 'RADAR' && (
          <div className="space-y-8 animate-fadeIn">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`font-sans text-[10px] tracking-wider font-bold px-2.5 py-1 rounded-lg ${
                  isDark ? 'bg-[#69dbad]/10 text-[#69dbad] border border-[#69dbad]/20' : 'bg-[#3eb489]/10 text-[#3eb489] border border-[#3eb489]/20'
                }`}>
                  위험 한계치 매핑
                </span>
              </div>
              <h1 className={`font-sans text-2xl md:text-3xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                내 성향 대비 포트폴리오 위험 수준
              </h1>
              <p className={`font-sans text-xs md:text-sm max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                내 성향에 맞는 리스크 한계치와 지금 내 포트폴리오의 실시간 위험 수치를 한눈에 비교해 봐요!
              </p>
            </section>

            <div className={`p-8 rounded-3xl border ${
              isDark ? 'bg-[#1e2020] border-white/5' : 'bg-white border-slate-100 shadow-sm'
            } space-y-8`}>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>내 성향 위험 허용 한계선</span>
                    <span className={`font-mono font-black ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>{toleranceLimit}점</span>
                  </div>
                  <div className={`w-full h-4 rounded-full overflow-hidden ${isDark ? 'bg-black/30' : 'bg-slate-100'}`}>
                    <div 
                      className="h-full bg-[#3eb489] transition-all duration-1000 ease-out"
                      style={{ width: `${toleranceLimit}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>현재 포트폴리오 위험 스코어</span>
                    <span className={`font-mono font-black ${currentAtmosphere.textColor}`}>{currentAtmosphere.finalScore.toFixed(1)}점</span>
                  </div>
                  <div className={`w-full h-4 rounded-full overflow-hidden ${isDark ? 'bg-black/30' : 'bg-slate-100'}`}>
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${
                        currentAtmosphere.label === '맑음' ? 'bg-[#3eb489]' : ''
                      } ${
                        currentAtmosphere.label === '구름' ? 'bg-amber-400' : ''
                      } ${
                        currentAtmosphere.label === '비' ? 'bg-blue-500' : ''
                      } ${
                        currentAtmosphere.label === '번개' ? 'bg-red-500' : ''
                      }`}
                      style={{ width: `${Math.min(100, currentAtmosphere.finalScore * 10)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl text-xs leading-relaxed ${
                isDark ? 'bg-black/20 text-slate-400' : 'bg-slate-50 text-slate-600'
              }`}>
                포트폴리오의 실시간 가상 위험 스코어는 <span className="font-bold">{currentAtmosphere.finalScore.toFixed(1)}점</span>으로, 
                고객님의 성향 위험 수용치인 <span className="font-bold">{toleranceLimit}점</span> 대비 
                {currentAtmosphere.finalScore > toleranceLimit 
                  ? <span className="text-red-500 font-bold"> 위험 초과 상태</span> 
                  : <span className="text-[#3eb489] font-bold"> 안전 범위 안</span>
                }에 정상 유지되고 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* 3. 보유 자산 탭 (ASSETS) */}
        {activeTab === 'ASSETS' && (
          <div className="space-y-8 animate-fadeIn">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`font-sans text-[10px] tracking-wider font-bold px-2.5 py-1 rounded-lg ${
                  isDark ? 'bg-[#69dbad]/10 text-[#69dbad] border border-[#69dbad]/20' : 'bg-[#3eb489]/10 text-[#3eb489] border border-[#3eb489]/20'
                }`}>
                  Asset Allocation
                </span>
              </div>
              <h1 className={`font-sans text-2xl md:text-3xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                가상 포트폴리오 자산 배분 현황
              </h1>
              <p className={`font-sans text-xs md:text-sm max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                내 투자 성향에 맞춘 가상 자산 비중이에요. 비중을 요리조리 직접 조절하며 기상 변화를 실험해 볼 수 있답니다. 🧪
              </p>
            </section>

            {/* 마이데이터 계좌 연동 패널 */}
            <div className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
              isDark ? 'bg-[#1e2020] border-white/5' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isConnected 
                    ? 'bg-[#3eb489]/15 text-[#3eb489]' 
                    : (isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400')
                }`}>
                  <Icon name="link2" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    실제 보유 중인 증권사 계좌 연동
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isConnected ? '한국투자증권 연동이 완료되었어요' : '한국투자증권 API로 간편하게 내 계좌를 연동해 봐요'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleConnectBroker}
                disabled={isConnecting}
                className={`w-full md:w-auto px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isConnecting ? 'opacity-50 cursor-wait' : ''
                } ${
                  isConnected
                    ? (isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')
                    : 'bg-[#3eb489] text-white hover:brightness-105 shadow-lg shadow-emerald-500/10'
                }`}
              >
                {isConnecting ? '계좌 연동 중...' : (isConnected ? '🔗 연동 해제' : '💡 증권계좌 간편 연동')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* 왼쪽: 종목 비중 컨트롤러 리스트 */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-slate-400">내 보유 비중 조절하기</span>
                  <button 
                    onClick={handleEqualDistribution}
                    className={`text-[10px] font-bold px-2 py-1 rounded border hover:opacity-80 transition-opacity cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-[#69dbad]' : 'bg-slate-50 border-slate-200 text-[#3eb489]'
                    }`}
                  >
                    골고루 나누기 (1/N)
                  </button>
                </div>

                <div className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-[#1e2020] border-white/5' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  {portfolio.map((s, idx) => (
                    <div 
                      key={s.ticker}
                      className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                        idx < portfolio.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-50') : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{s.name}</h4>
                        <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {s.ticker} · {getAssetValue(s.weight).toLocaleString()}원
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* 수량 조절 버튼 */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleWeightChange(s.ticker, -5)}
                            className={`w-6 h-6 rounded flex items-center justify-center font-bold text-sm cursor-pointer ${
                              isDark ? 'bg-zinc-800 text-slate-400 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            -
                          </button>
                          <span className={`w-10 text-center text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {s.weight}%
                          </span>
                          <button
                            onClick={() => handleWeightChange(s.ticker, 5)}
                            className={`w-6 h-6 rounded flex items-center justify-center font-bold text-sm cursor-pointer ${
                              isDark ? 'bg-zinc-800 text-slate-400 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 오른쪽: 자산 도넛 차트 */}
              <div className="md:col-span-5">
                <div className={`p-6 rounded-2xl border text-center ${
                  isDark ? 'bg-[#1e2020] border-white/5' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">가상 포트폴리오 구성 비율</p>
                  
                  <div className="flex justify-center my-4">
                    <AssetChart data={portfolio} isDark={isDark} />
                  </div>

                  <div className="space-y-1.5 text-left mt-6">
                    <div className="flex justify-between text-xs border-b pb-1.5 border-slate-500/20">
                      <span className="text-slate-400">총 평가 자산</span>
                      <span className={`font-mono font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{totalAssetVal.toLocaleString()} KRW</span>
                    </div>
                    <div className="flex justify-between text-xs pt-1.5">
                      <span className="text-slate-400">자산 종류</span>
                      <span className={`font-mono font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>국내 KOSPI/KOSDAQ 주식 {portfolio.length}종</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. 위험 알림 탭 (ALERTS) */}
        {activeTab === 'ALERTS' && (
          <div className="space-y-8 animate-fadeIn">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`font-sans text-[10px] tracking-wider font-bold px-2.5 py-1 rounded-lg ${
                  isDark ? 'bg-[#69dbad]/10 text-[#69dbad] border border-[#69dbad]/20' : 'bg-[#3eb489]/10 text-[#3eb489] border border-[#3eb489]/20'
                }`}>
                  Materiality Alerts
                </span>
              </div>
              <h1 className={`font-sans text-2xl md:text-3xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                가상 포트폴리오 감지 리스크 내역
              </h1>
              <p className={`font-sans text-xs md:text-sm max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                최근 20거래일 동안 업종별 중대성 기준에 맞춘 부정적인 뉴스나 공시 리스크가 탐지된 내역을 쏙쏙 모았어요!
              </p>
            </section>

            {/* 중대성 리스크 알림 목록 카드 */}
            <div className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-[#1e2020] border-white/5' : 'bg-white border-slate-100 shadow-sm'
            }`}>
              {/* 모든 종목의 감지 이력 추출 */}
              {(() => {
                const list = [];
                portfolio.forEach(stock => {
                  if (stock.evidences && stock.evidences.length > 0) {
                    stock.evidences.forEach(ev => {
                      list.push({ ...ev, ticker: stock.ticker, name: stock.name });
                    });
                  }
                });

                if (list.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                      최근 20거래일 동안 업종별 중대성(Materiality) 맵에 어긋나는 평판 리스크 관련 미디어 부정보도가 아예 포착되지 않았어.
                    </div>
                  );
                }

                return list.map((ev, idx) => (
                  <div 
                    key={idx}
                    className={`p-5 flex items-start gap-4 transition-colors ${
                      idx < list.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-50') : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/10 text-red-500`}>
                      <Icon name="alertTriangle" className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          {ev.type} 부정 리스크
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                          isDark ? 'bg-zinc-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {ev.name} ({ev.ticker})
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500`}>
                          {ev.category}
                        </span>
                      </div>
                      <h4 className={`text-sm font-black leading-snug mt-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {ev.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">
                        수집 기준일: {ev.date || '2026.07.24'}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* 탭 컨트롤 고정 풋 바 (전체화면 지원) */}
        <footer className="pt-2 text-center">
          <div className="flex justify-center gap-4 text-xs font-mono font-bold">
            <button 
              onClick={() => window.print()}
              className={`flex items-center gap-1 hover:text-[#3eb489] cursor-pointer font-sans text-[11px] transition-colors p-2 rounded-lg ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-white border border-[#3eb489]/10 soft-shadow-light'
              }`}
            >
              <Icon name="printer" className="w-4 h-4" />
              <span>인쇄하기</span>
            </button>
          </div>
        </footer>

      </main>

      {/* 날씨 연동 플로팅 개미 비서 펫 */}
      <AntPet weather={currentAtmosphere.weather} portfolio={portfolio} />


      {/* 하단 플로팅 네비게이션 바 (수직 패딩 정렬 수정 및 한글화 적용) */}
      {!inShell && (
      <nav className={`fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 py-3 backdrop-blur-xl md:max-w-md md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:rounded-full md:shadow-2xl transition-all ${
        isDark 
          ? 'bg-[#1e2020]/90 border-t border-white/5 md:border border-slate-700' 
          : 'bg-white/95 border-t border-[#3eb489]/15 md:border md:border-[#3eb489]/20 soft-shadow-light'
      }`}>
        {[
          { id: 'ATMOSPHERE', label: '투자 기상도', icon: 'cloudRain' },
          { id: 'RADAR', label: '위험 레이더', icon: 'radar' },
          { id: 'ASSETS', label: '보유 자산', icon: 'wallet' },
          { id: 'ALERTS', label: '위험 알림', icon: 'bell' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                showToast(`[${tab.label}] 메뉴로 이동했어요! 👉`);
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive 
                  ? isDark 
                    ? 'bg-[#3eb489]/10 text-[#69dbad] font-bold' 
                    : 'bg-[#3eb489]/10 text-[#3eb489] font-bold'
                  : 'text-slate-400 hover:text-[#3eb489]'
              }`}
            >
              <Icon name={tab.icon} className="w-5 h-5" />
              <span className="font-sans text-[10px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </nav>
      )}

    </div>
  );
}
