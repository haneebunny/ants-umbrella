import React, { useState } from 'react';
import Icon from './Icon';
import AssetChart from './AssetChart';

export default function ResultsScreen({ theme, profile, onReset, toggleTheme }) {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('ATMOSPHERE'); // 기본 활성 탭: 투자 기상도
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDemoPortfolio, setShowDemoPortfolio] = useState(false);

  // 가상 포트폴리오 데이터 (사용자 슬라이더 수정 대응)
  const [portfolio, setPortfolio] = useState([
    { ticker: '005930', name: '삼성전자', weight: 35, direction: 'down', confidence: 'strong', change: -1.2,
      evidences: [
        { type: 'ESG', direction: '부정', category: '지배구조', title: '이사회 투명성 결여 및 ESG 지배구조 리스크 논란', url: '#' },
        { type: '공시', direction: '부정', category: '자본이벤트', title: '단기 차입금 증가 및 대규모 유상증자 결정 공시', url: '#' }
      ]
    },
    { ticker: '000660', name: 'SK하이닉스', weight: 25, direction: 'up', confidence: 'medium', change: 2.1,
      evidences: [
        { type: '산업', direction: '긍정', category: '산업·사업동향', title: '차세대 HBM4 패키징 기술 최초 상용화 및 대규모 공급 계약 체결', url: '#' }
      ]
    },
    { ticker: '005380', name: '현대차', weight: 20, direction: 'up', confidence: 'weak', change: 0.5,
      evidences: [
        { type: '재무', direction: '긍정', category: '실적·재무', title: '글로벌 하이브리드 판매 호조로 2분기 영업이익 역대 최고치 경신', url: '#' }
      ]
    },
    { ticker: '035720', name: '카카오', weight: 20, direction: 'down', confidence: 'medium', change: -0.8,
      evidences: [
        { type: 'ESG', direction: '부정', category: '지배구조', title: '계열사 지분 매각 추진 및 경영진 사법 리스크 확산 우려', url: '#' }
      ]
    }
  ]);

  // 성향별 리스크 민감도 배수
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

  // 종합 리스크 점수 기반 날씨 계산 로직
  const calculateWeather = (currentPortfolio, band) => {
    let totalScore = 0;
    currentPortfolio.forEach(stock => {
      let stockRisk = 0;
      if (stock.direction === 'down') {
        if (stock.confidence === 'strong') stockRisk = 10;
        else if (stock.confidence === 'medium') stockRisk = 6;
        else stockRisk = 3;
      }
      totalScore += (stockRisk * stock.weight) / 100;
    });

    const sensitivity = getSensitivityFactor(band);
    const finalScore = totalScore * sensitivity;

    let weather = 'sunny';
    let iconName = 'sun';
    let label = '맑음';
    let desc = '포트폴리오의 리스크가 아주 낮고 매우 청명한 상태입니다. 보유하신 종목군에서 감지된 당일 리스크 요인이 최소화되어 안정적인 위험 수준을 유지하고 있습니다.';
    let bgColor = isDark 
      ? 'from-[#0b2b1b] to-[#0d0f0f]' 
      : 'from-[#e6f4ea] to-[#f4f9f7]';
    let textColor = isDark ? 'text-[#69dbad]' : 'text-[#3eb489]';

    if (finalScore >= 8) {
      weather = 'thunder';
      iconName = 'zap';
      label = '번개';
      desc = '경보! 포트폴리오 내 다수 종목에서 중대 하락 위험 요인이 복합적으로 감지되어 번개가 치는 날씨입니다. 성향 대비 포트폴리오의 종합 리스크 강도가 높게 나타나고 있습니다.';
      bgColor = isDark 
        ? 'from-[#3c1d1d] to-[#0d0f0f]' 
        : 'from-[#fce8e6] to-[#f4f9f7]';
      textColor = isDark ? 'text-[#ff6b6b]' : 'text-[#d93025]';
    } else if (finalScore >= 5) {
      weather = 'rainy';
      iconName = 'cloudRain';
      label = '비';
      desc = '주의! 주요 핵심 종목군에 하락 압박을 주는 뉴스 및 공시 위협 요인이 누적되어 비가 내리는 날씨입니다. 성향 대비 위험 노출도가 상승한 상태입니다.';
      bgColor = isDark 
        ? 'from-[#1f2d3d] to-[#0d0f0f]' 
        : 'from-[#e8f0fe] to-[#f4f9f7]';
      textColor = isDark ? 'text-[#81a1c1]' : 'text-[#1a73e8]';
    } else if (finalScore >= 2) {
      weather = 'cloudy';
      iconName = 'cloud';
      label = '구름 조금';
      desc = '보유 자산 일부에서 단기적인 리스크 변동성 조짐이 포착되어 하늘에 구름이 낀 날씨입니다. 개별 기업의 리스크 요인들을 실시간 모니터링 중입니다.';
      bgColor = isDark 
        ? 'from-[#2b2b23] to-[#0d0f0f]' 
        : 'from-[#fef7e0] to-[#f4f9f7]';
      textColor = isDark ? 'text-[#ebcb4b]' : 'text-[#f9ab00]';
    }

    return { weather, iconName, label, desc, finalScore: Number(finalScore.toFixed(2)), bgColor, textColor };
  };

  const currentAtmosphere = calculateWeather(portfolio, profile.target_risk_band);

  const handleConnect = () => {
    setIsConnecting(true);
    setFeedbackMsg('안전한 보안 터널을 생성하여 증권 계좌 연동을 확인 중입니다...');
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setFeedbackMsg('계좌 연동 완료! 현재 포트폴리오와의 정밀 편차 분석을 마쳤습니다.');
    }, 1500);
  };

  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg('');
    }, 2500);
  };

  const getSpectrumLeftPosition = (band) => {
    switch (band) {
      case 'CONSERVATIVE': return '10%';
      case 'MODERATE_CONSERVATIVE': return '30%';
      case 'BALANCED': return '50%';
      case 'GROWTH': return '75%';
      case 'AGGRESSIVE': return '90%';
      default: return '50%';
    }
  };

  // 포트폴리오 비중 실시간 조정 핸들러
  const handleWeightChange = (index, value) => {
    setPortfolio(prev => {
      const next = [...prev];
      next[index].weight = Math.max(0, Math.min(100, Number(value)));
      return next;
    });
  };

  const totalPortfolioWeight = portfolio.reduce((sum, s) => sum + s.weight, 0);
  const isWeightValid = totalPortfolioWeight === 100;

  // 비중 자동 조절 보정 (100% 맞춤)
  const autoRebalance = () => {
    const activeCount = portfolio.length;
    const share = Math.floor(100 / activeCount);
    setPortfolio(prev => prev.map((s, idx) => ({
      ...s,
      weight: idx === activeCount - 1 ? 100 - (share * (activeCount - 1)) : share
    })));
    showToast('보유 비중을 균등하게 재배정했습니다.');
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 pb-32 w-full ${
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
      <header className={`flex justify-between items-center px-6 h-16 w-full fixed top-0 z-50 transition-all ${
        isDark 
          ? 'bg-[#0d0f0f]/80 backdrop-blur-md border-b border-[#3d4943]' 
          : 'bg-[#f4f9f7]/80 backdrop-blur-md border-b border-[#3eb489]/20'
      }`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onReset}
            aria-label="성향 테스트 다시 시작" 
            className={`hover:opacity-80 transition-opacity p-2 cursor-pointer flex items-center justify-center rounded-full ${
              isDark ? 'hover:bg-slate-800 text-[#69dbad]' : 'hover:bg-slate-100 text-[#3eb489]'
            }`}
          >
            <Icon name="arrowLeft" className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={onReset}>
            <img src="/images/ants_umbrella_logo.png" alt="로고" className="w-7 h-7 object-contain" />
            <span className={`font-sans text-lg font-black tracking-tight ${isDark ? 'text-[#e2e2e2]' : 'text-[#0f1713]'}`}>
              개미의 우산
            </span>
          </div>
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

      {/* 메인 내용 영역 */}
      <main className="pt-24 px-6 max-w-5xl mx-auto space-y-8 z-10 relative">
        
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
                오늘 나의 포트폴리오 기상도는 <span className={currentAtmosphere.textColor}>[{currentAtmosphere.label}]</span> 상태입니다
              </h1>
              <p className={`font-sans text-xs md:text-sm max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                귀하의 진단 투자 성향인 <span className="font-bold">[{profile.titleKo}]</span>의 위험 민감도와 보유 자산의 당일 변동 이슈를 실시간 연산하여 기상 날씨를 도출합니다.
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
                    isDark ? 'bg-black/30' : 'bg-white/60'
                  }`}>
                    종합 가중 위험도: {currentAtmosphere.finalScore}점
                  </span>
                </div>
                <h2 className={`font-sans text-2xl font-black leading-snug ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  {currentAtmosphere.desc}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  * 각 종목에 감지된 최신 뉴스/공시 리스크에 대해 개인 투자성향 민감도가 곱해져 기상 날씨가 동적으로 변화합니다. 우량 자산의 비중을 늘리면 날씨가 맑아질 수 있습니다.
                </p>
              </div>

              {/* 날씨 그래픽 비주얼 */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center w-40 h-40 relative">
                <div className={`absolute inset-0 blur-3xl rounded-full opacity-35 animate-pulse ${
                  currentAtmosphere.weather === 'thunder' ? 'bg-[#ff6b6b]' :
                  currentAtmosphere.weather === 'rainy' ? 'bg-[#81a1c1]' :
                  currentAtmosphere.weather === 'cloudy' ? 'bg-[#ebcb4b]' : 'bg-[#69dbad]'
                }`} />
                <div className={`relative w-28 h-28 flex items-center justify-center rounded-full border-2 ${
                  isDark ? 'bg-[#1e2020]/80 border-white/10' : 'bg-white/90 border-[#3eb489]/20 soft-shadow-light'
                }`}>
                  <Icon name={currentAtmosphere.iconName} className={`w-16 h-16 ${currentAtmosphere.textColor}`} />
                </div>
                <span className={`font-sans text-sm font-black mt-3 uppercase tracking-wider ${currentAtmosphere.textColor}`}>
                  {currentAtmosphere.label}
                </span>
              </div>
            </div>

            {/* 실시간 포트폴리오 비중 조정 시뮬레이터 */}
            <div className={`p-6 md:p-8 rounded-2xl border ${
              isDark ? 'bg-[#1e2020]/50 border-[#3d4943]' : 'bg-white border-[#3eb489]/15 soft-shadow-light'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className={`font-sans text-lg font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    보유 포트폴리오 위험 시뮬레이터
                  </h3>
                  <p className="text-xs text-slate-500 font-sans mt-1">
                    각 종목의 비중을 변경하여 포트폴리오의 실시간 날씨가 어떻게 개선되는지 확인하세요.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-xl text-xs font-bold font-mono border ${
                    isWeightValid 
                      ? 'bg-[#3eb489]/10 border-[#3eb489] text-[#3eb489]' 
                      : 'bg-red-500/10 border-red-500 text-red-500'
                  }`}>
                    총 비중 합계: {totalPortfolioWeight}%
                  </div>
                  {!isWeightValid && (
                    <button 
                      onClick={autoRebalance}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#3eb489] hover:brightness-105 text-white transition-all cursor-pointer"
                    >
                      균등 재조정
                    </button>
                  )}
                </div>
              </div>

              {!isWeightValid && (
                <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 text-xs font-sans mb-6 flex items-center gap-2">
                  <Icon name="alertCircle" className="w-4 h-4" />
                  <span>비중의 합이 정확히 100%가 되지 않았습니다. 날씨 연산 결과가 부정확할 수 있으니 맞춰주세요.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portfolio.map((stock, idx) => (
                  <div 
                    key={stock.ticker}
                    className={`p-4 rounded-xl border ${
                      isDark ? 'bg-[#1a1c1c]/50 border-[#3d4943]/40' : 'bg-[#f4f9f7]/40 border-[#3eb489]/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2 py-0.5 rounded font-mono ${
                          stock.direction === 'down' 
                            ? 'bg-red-500/10 text-red-500' 
                            : 'bg-[#3eb489]/10 text-[#3eb489]'
                        }`}>
                          {stock.direction === 'down' ? '하락 우려' : '상승 전망'}
                        </span>
                        <span className="text-sm font-bold font-sans">{stock.name}</span>
                      </div>
                      <span className="font-mono text-sm font-black">{stock.weight}%</span>
                    </div>

                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={stock.weight}
                      onChange={(e) => handleWeightChange(idx, e.target.value)}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-800 accent-[#3eb489]"
                    />

                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                      <span>0% (매도)</span>
                      <span>100% (올인)</span>
                    </div>
                  </div>
                ))}
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
                  종목별 위험 레이더
                </span>
              </div>
              <h1 className={`font-sans text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                오늘 보유 종목의 위협 신호 분석
              </h1>
              <p className={`font-sans text-xs md:text-sm max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                각 기업에 발생한 뉴스 데이터 중 핵심 업무성(Materiality)과 강도를 계산하여 도출한 인공지능 주가 전망 리스트입니다.
              </p>
            </section>

            <div className="space-y-6">
              {portfolio.map((stock) => (
                <div 
                  key={stock.ticker}
                  className={`p-6 rounded-2xl border ${
                    isDark ? 'bg-[#1e2020]/70 border-[#3d4943]' : 'bg-white border-[#3eb489]/15 soft-shadow-light'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#3eb489]/15 pb-4 mb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-500 font-bold">{stock.ticker}</span>
                      <h3 className="font-sans text-lg font-black">{stock.name}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-sans ${
                        stock.direction === 'down' 
                          ? 'bg-red-500/10 text-red-500' 
                          : 'bg-[#3eb489]/10 text-[#3eb489]'
                      }`}>
                        전망: {stock.direction === 'down' ? '하락 예상' : '상승 예상'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-sans ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        예측 확신도: {stock.confidence === 'strong' ? '강' : stock.confidence === 'medium' ? '중' : '약'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className={`font-sans text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      감지된 위험/상승 근거 원인:
                    </p>
                    <div className="space-y-2">
                      {stock.evidences.map((ev, evIdx) => (
                        <div 
                          key={evIdx}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs gap-3 ${
                            ev.direction === '부정'
                              ? isDark ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-800'
                              : isDark ? 'bg-[#3eb489]/5 border-[#3eb489]/20 text-[#69dbad]' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold px-2 py-0.5 rounded-full border border-current text-[10px]">
                              {ev.type} · {ev.category}
                            </span>
                            <span className="font-sans leading-relaxed">{ev.title}</span>
                          </div>
                          <span className="flex-shrink-0 underline hover:opacity-80 cursor-pointer font-sans font-bold">확인</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. 보유 자산 탭 (ASSETS) */}
        {activeTab === 'ASSETS' && (
          <div className="space-y-8 animate-fadeIn">
            {/* 타이틀 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`font-sans text-[10px] tracking-wider font-bold px-2.5 py-1 rounded-lg ${
                  isDark ? 'bg-[#69dbad]/10 text-[#69dbad] border border-[#69dbad]/20' : 'bg-[#3eb489]/10 text-[#3eb489] border border-[#3eb489]/20'
                }`}>
                  투자성향 분석 결과
                </span>
              </div>
              <h1 className={`font-sans text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                체질 진단 기준 <span className={isDark ? 'text-[#69dbad]' : 'text-[#3eb489] bg-[#3eb489]/5 border border-[#3eb489]/15 px-2 py-0.5 rounded-lg'}>[{profile.titleKo}]</span> 성향입니다
              </h1>
              <p className={`font-sans text-xs md:text-sm max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                체질 진단 점수에 기반하여 산출된 귀하의 상세 투자 프로필은 <span className="font-bold">[{profile.titleEn}]</span>입니다. {profile.description}
              </p>

              {/* 시스템 플래그 알림 배너 */}
              {profile.flags && profile.flags.length > 0 && (
                <div className={`p-4 rounded-xl border mt-4 space-y-2 text-left ${
                  isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Icon name="alertTriangle" className="w-4 h-4 text-amber-500" />
                    <span>시스템 안전장치 규칙 적용 안내</span>
                  </div>
                  <ul className="list-disc list-inside text-xs space-y-1 opacity-90 font-sans">
                    {profile.flags.map(flag => {
                      switch (flag) {
                        case 'SHORT_TERM_LIMIT':
                          return <li key={flag}>투자 가용 기간이 1년 이내로 초단기 자금에 해당하여, 위험등급 상한 규칙에 의해 성향이 &apos;안정추구형&apos; 이하로 하향 제한되었습니다.</li>;
                        case 'LOW_EMERGENCY_FUND_LIMIT':
                          return <li key={flag}>돌발 상황 대비 여유 비상자금이 매우 부족하여, 재무 능력 방어를 위해 최종 등급이 &apos;안정추구형&apos; 이하로 보정되었습니다.</li>;
                        case 'INSUFFICIENT_WILLINGNESS_RESPONSES':
                          return <li key={flag}>위험 수용 태도 관련 필수 문항에 대해 무응답 또는 기권이 발견되어 임시 등급이 산정되었습니다.</li>;
                        case 'SHORT_TERM_HIGH_RETURN_FLAG':
                          return <li key={flag}>단기간에 평균 시장 수익을 크게 상회하고자 하는 고위험 선호 경향이 감지되었습니다.</li>;
                        case 'INCONSISTENT_ANSWER_FLAG':
                          return <li key={flag}>문항 답변 간 논리적 충돌이 감지되었습니다. (예: 손실 허용은 극히 낮게 선택했으나 실제 행동은 초고위험 추가매수를 선택함)</li>;
                        default:
                          return <li key={flag}>시스템 감지 코드: {flag}</li>;
                      }
                    })}
                  </ul>
                </div>
              )}
            </section>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* 왼쪽 프로필 카드 */}
              <div className={`md:col-span-4 p-8 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden ${
                isDark 
                  ? 'bg-[#1e2020]/70 backdrop-blur-sm border border-[#3d4943] border-t-4 border-t-[#69dbad]' 
                  : 'bg-white border border-[#3eb489]/15 border-t-4 border-t-[#3eb489] soft-shadow-light'
              }`}>
                <div className={`absolute -top-12 -right-12 w-32 h-32 blur-3xl rounded-full ${
                  isDark ? 'bg-[#69dbad]/10' : 'bg-[#3eb489]/5'
                }`} />

                <div className="w-20 h-20 mb-4 relative">
                  <div className={`absolute inset-0 blur-xl rounded-full animate-pulse ${
                    isDark ? 'bg-[#69dbad]/20' : 'bg-[#3eb489]/10'
                  }`} />
                  <div className={`relative rounded-full w-full h-full flex items-center justify-center border-2 ${
                    isDark ? 'bg-[#1e2020] border-[#69dbad]/40' : 'bg-white border-[#3eb489]/30 soft-shadow-light'
                  }`}>
                    <Icon name="trendingUp" className={`w-8 h-8 ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`} />
                  </div>
                </div>

                <h3 className={`font-sans text-xl font-black mb-1 ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>
                  {profile.titleKo}
                </h3>
                <p className="font-sans text-[11px] text-slate-500 font-bold tracking-tight mb-6">
                  {profile.titleEn}
                </p>

                <div className={`w-full h-[1.5px] mb-6 ${isDark ? 'bg-[#3d4943]/60' : 'bg-[#3eb489]/10'}`} />

                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="text-left">
                    <p className="font-sans text-[9px] uppercase text-slate-500 font-bold">목표 위험 점수</p>
                    <p className={`font-mono text-lg font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                      {profile.target_risk_score_adjusted}
                    </p>
                  </div>
                  <div className={`text-left pl-4 border-l ${isDark ? 'border-[#3d4943]/60' : 'border-l border-[#3eb489]/15'}`}>
                    <p className="font-sans text-[9px] uppercase text-slate-500 font-bold">기대 매칭 수익</p>
                    <p className={`font-mono text-lg font-black ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>
                      {profile.expectedReturn}
                    </p>
                  </div>
                </div>
              </div>

              {/* 오른쪽 스펙트럼 카드 */}
              <div className={`md:col-span-8 p-8 rounded-2xl flex flex-col justify-between ${
                isDark 
                  ? 'bg-[#1e2020]/70 backdrop-blur-sm border border-[#3d4943]' 
                  : 'bg-white border-[#3eb489]/15 soft-shadow-light'
              }`}>
                <div>
                  <h4 className={`font-sans text-base font-black mb-6 uppercase tracking-wider ${
                    isDark ? 'text-white' : 'text-[#0f1713]'
                  }`}>
                    투자 성향 대역 스펙트럼
                  </h4>

                  <div className="relative pt-12 pb-6 px-4">
                    <div className={`h-3 w-full rounded-full flex overflow-hidden border ${
                      isDark ? 'bg-[#0d0f0f] border-transparent' : 'bg-slate-100 border-[#3eb489]/10'
                    }`}>
                      <div className={`h-full flex-1 border-r ${isDark ? 'border-[#0d0f0f]/40 bg-[#3eb489]/20' : 'border-[#f4f9f7] bg-[#3eb489]/20'}`} />
                      <div className={`h-full flex-1 border-r ${isDark ? 'border-[#0d0f0f]/40 bg-[#3eb489]/45' : 'border-[#f4f9f7] bg-[#3eb489]/45'}`} />
                      <div className={`h-full flex-1 border-r ${isDark ? 'border-[#0d0f0f]/40 bg-[#3eb489]/70' : 'border-[#f4f9f7] bg-[#3eb489]/70'}`} />
                      <div className={`h-full flex-1 border-r ${isDark ? 'border-[#0d0f0f]/40 bg-[#3eb489]' : 'border-[#f4f9f7] bg-[#3eb489]'}`} />
                      <div className={`h-full flex-1 bg-[#30f802]`} />
                    </div>

                    <div 
                      className="absolute top-1 flex flex-col items-center transition-all duration-1000 ease-out"
                      style={{ left: getSpectrumLeftPosition(profile.target_risk_band), transform: 'translateX(-50%)' }}
                    >
                      <div className={`font-sans text-[9px] font-black px-2 py-0.5 rounded shadow-lg uppercase ${
                        isDark ? 'bg-[#3eb489] text-[#002115]' : 'bg-[#3eb489] text-white'
                      }`}>
                        나의 성향
                      </div>
                      <div className={`w-1 h-12 mt-1 ${isDark ? 'bg-[#3eb489]' : 'bg-[#3eb489]'}`} />
                    </div>

                    <div className="flex justify-between mt-4 font-sans text-[10px] text-slate-500 font-bold">
                      <span className={profile.target_risk_band === 'CONSERVATIVE' ? 'text-[#3eb489] font-black' : ''}>안정형</span>
                      <span className={profile.target_risk_band === 'MODERATE_CONSERVATIVE' ? 'text-[#3eb489] font-black' : ''}>안정추구</span>
                      <span className={profile.target_risk_band === 'BALANCED' ? 'text-[#3eb489] font-black' : ''}>위험중립</span>
                      <span className={(profile.target_risk_band === 'GROWTH' || profile.target_risk_band === 'AGGRESSIVE') ? 'text-[#3eb489] font-black' : ''}>적극/공격</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#3eb489]/15">
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#1a1c1c]/50 border-transparent' : 'bg-[#f4f9f7]/50 border-[#3eb489]/15'
                  }`}>
                    <p className="font-sans text-[10px] text-[#3eb489] font-bold mb-1">시장 대응 성향</p>
                    <p className="font-sans text-xs font-semibold leading-relaxed">{profile.marketResponse}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#1a1c1c]/50 border-transparent' : 'bg-[#f4f9f7]/50 border-[#3eb489]/15'
                  }`}>
                    <p className="font-sans text-[10px] text-[#3eb489] font-bold mb-1">매칭 자산 배분</p>
                    <p className="font-sans text-xs font-semibold leading-relaxed">{profile.assetAllocationDesc}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#1a1c1c]/50 border-transparent' : 'bg-[#f4f9f7]/50 border-[#3eb489]/15'
                  }`}>
                    <p className="font-sans text-[10px] text-[#3eb489] font-bold mb-1">핵심 키워드</p>
                    <p className="font-sans text-xs font-semibold leading-relaxed">{profile.keywords}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Metric Dimensions (Bento Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 위험감수 성향 */}
              <div className={`p-6 rounded-2xl border-t-4 ${
                isDark 
                  ? 'bg-[#1e2020]/70 backdrop-blur-sm border-[#3d4943] border-t-[#3eb489]' 
                  : 'bg-white border-[#3eb489]/15 border-t-4 border-t-[#3eb489] soft-shadow-light'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-[#3eb489]/10 text-[#3eb489]' : 'bg-[#3eb489]/10 text-[#3eb489]'
                  }`}>
                    <Icon name="award" className="w-5 h-5" />
                  </div>
                  <span className={`font-mono text-xs font-black ${isDark ? 'text-slate-300' : 'text-[#3eb489]'}`}>
                    {profile.risk_willingness_score}%
                  </span>
                </div>

                <h4 className={`font-sans text-base font-black mb-2 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  위험감수성향 (Willingness)
                </h4>
                
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4].map((seg) => {
                    const isActive = seg <= Math.max(1, Math.ceil(profile.risk_willingness_score / 25));
                    return (
                      <div 
                        key={seg} 
                        className={`h-1.5 flex-1 rounded-full ${
                          isActive 
                            ? 'bg-[#3eb489]'
                            : isDark ? 'bg-[#282a2a]' : 'bg-slate-100 border border-slate-200'
                        }`} 
                      />
                    );
                  })}
                </div>

                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  손실과 변동성을 심리적으로 감수하려는 의지 수준입니다. 점수가 높을수록 단기적인 하락 변동에 동요하지 않는 경향이 있습니다.
                </p>
              </div>

              {/* 위험감수 능력 */}
              <div className={`p-6 rounded-2xl border-t-4 ${
                isDark 
                  ? 'bg-[#1e2020]/70 backdrop-blur-sm border-[#3d4943] border-t-[#3eb489]' 
                  : 'bg-white border-[#3eb489]/15 border-t-4 border-t-[#3eb489] soft-shadow-light'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-[#3eb489]/10 text-[#3eb489]' : 'bg-[#3eb489]/10 text-[#3eb489]'
                  }`}>
                    <Icon name="scale" className="w-5 h-5" />
                  </div>
                  <span className={`font-mono text-xs font-black ${isDark ? 'text-slate-300' : 'text-[#3eb489]'}`}>
                    {profile.risk_capacity_score}%
                  </span>
                </div>

                <h4 className={`font-sans text-base font-black mb-3 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  위험감수능력 (Capacity)
                </h4>

                <div className="flex items-center gap-4 py-2">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg width="56" height="56" className="transform -rotate-90">
                      <circle cx="28" cy="28" r="24" fill="none" stroke={isDark ? '#282a2a' : '#f1f5f3'} strokeWidth="3" />
                      <circle 
                        cx="28" 
                        cy="28" 
                        r="24" 
                        fill="none" 
                        stroke="#3eb489" 
                        strokeWidth="4" 
                        strokeDasharray={150.7} 
                        strokeDashoffset={150.7 - (150.7 * profile.risk_capacity_score) / 100} 
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black">
                      {profile.risk_capacity_score}%
                    </span>
                  </div>
                  <div className="font-sans text-[10px] text-slate-500 space-y-1">
                    <p>재무유동성: <span className="text-[#3eb489] font-bold">{profile.liquidity}</span></p>
                    <p>투자기간: <span className="text-[#3eb489] font-bold">{profile.horizon}</span></p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-sans leading-relaxed mt-1">
                  투자기간과 비상자금 여력 등 재무적 현실을 바탕으로 실제 손실을 감당할 수 있는 객관적인 리스크 수용 한계치입니다.
                </p>
              </div>

              {/* 매매 활동성 */}
              <div className={`p-6 rounded-2xl border-t-4 ${
                isDark 
                  ? 'bg-[#1e2020]/70 backdrop-blur-sm border-[#3d4943] border-t-[#3eb489]' 
                  : 'bg-white border-[#3eb489]/15 border-t-4 border-t-[#3eb489] soft-shadow-light'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-[#3eb489]/10 text-[#3eb489]' : 'bg-[#3eb489]/10 text-[#3eb489]'
                  }`}>
                    <Icon name="compass" className="w-5 h-5" />
                  </div>
                  <span className={`font-mono text-xs font-black ${isDark ? 'text-slate-300' : 'text-[#3eb489]'}`}>
                    {profile.self_reported_activity_score}%
                  </span>
                </div>

                <h4 className={`font-sans text-base font-black mb-2 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  매매 활동성 (Activity)
                </h4>

                <div className="font-sans text-xs space-y-1.5 pb-2">
                  <div className="flex justify-between border-b border-[#3d4943]/20 pb-1">
                    <span className="text-slate-500">회전율 강도:</span>
                    <span className="font-bold text-[#3eb489]">{profile.activity_band === 'GENERAL_MANAGEMENT' ? '일반 관리형' : profile.activity_band === 'LOW_TURNOVER' ? '저활동형' : '고회전 활동형'}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#3d4943]/20 pb-1">
                    <span className="text-slate-500">익손절 기준:</span>
                    <span className="font-bold text-[#3eb489]">
                      {profile.disposition_style === 'PROFIT_TAKING' ? '이익 실현 선호' : 
                       profile.disposition_style === 'LOSS_CUTTING' ? '손실 확정 선호' : 
                       profile.disposition_style === 'INFORMATION_BASED' ? '전망 근거 판단' : '시장 감정 대처'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500">경험 레벨:</span>
                    <span className="font-bold">Lv. {profile.experience_level}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-sans leading-relaxed mt-2">
                  최근 3개월 매매 빈도와 구성 비중의 변경을 종합하여 진단한 활동성 강도 및 익절/손절 시의 처분 결정 성향입니다.
                </p>
              </div>

            </div>

            {/* 권장 포트폴리오 */}
            <section className={`rounded-2xl border overflow-hidden transition-all duration-300 w-full ${
              isDark 
                ? 'bg-[#1e2020]/70 backdrop-blur-sm border-[#3d4943] hover:border-[#69dbad]/40 active-glow' 
                : 'bg-white border-[#3eb489]/15 soft-shadow-light hover:border-[#3eb489]/30'
            }`}>
              <div className="flex flex-col md:flex-row">
                
                <div className="p-8 md:w-2/3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 ${
                    isDark ? 'bg-[#3eb489]/10 text-[#69dbad] border border-[#69dbad]/20' : 'bg-[#3eb489]/10 text-[#3eb489] border border-[#3eb489]/20'
                  }`}>
                    <Icon name="lock" className="w-3.5 h-3.5" />
                    <span className="font-sans text-[10px] font-bold">포트폴리오 적합도 정밀 진단</span>
                  </div>

                  <h2 className={`font-sans text-xl md:text-2xl font-black mb-4 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    현재 보유 자산 비중과의 적합도를 체크하세요
                  </h2>

                  <p className={`font-sans text-xs md:text-sm leading-relaxed max-w-xl mb-8 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    고객님의 실제 계좌 비중이 진단된 <span className={`font-bold ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>&apos;{profile.titleKo}&apos;</span>의 권장 배분 모델과 일치하는지 스캔합니다. 데모 시뮬레이터를 켜서 오차를 확인해 보세요.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className={`px-6 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                        isConnecting ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isDark 
                          ? 'bg-[#3eb489] hover:bg-[#69dbad] text-[#002115]' 
                          : 'bg-[#3eb489] hover:brightness-105 text-white shadow-[0_4px_12px_rgba(62,180,137,0.2)]'
                      }`}
                    >
                      <Icon name="lock" className="w-4 h-4" />
                      <span>{isConnected ? '✅ 연동 완료' : '내 증권 계좌 연결하기'}</span>
                    </button>

                    <button
                      onClick={() => setShowDemoPortfolio(!showDemoPortfolio)}
                      className={`px-6 py-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                        isDark 
                          ? 'bg-transparent hover:bg-slate-800 border border-[#3d4943] text-[#e2e2e2]' 
                          : 'bg-[#f4f9f7] hover:bg-[#fafdfc] border border-[#3eb489]/20 text-[#3eb489]'
                      }`}
                    >
                      <Icon name="barChart2" className="w-4 h-4" />
                      <span>{showDemoPortfolio ? '시뮬레이터 닫기' : '데모 시뮬레이터 확인'}</span>
                    </button>
                  </div>
                </div>

                <div className={`md:w-1/3 p-8 flex flex-col justify-center border-t md:border-t-0 md:border-l ${
                  isDark 
                    ? 'bg-[#1a1c1c]/40 border-[#3d4943]' 
                    : 'bg-[#f4f9f7]/50 border-[#3eb489]/15'
                }`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${
                      isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      <Icon name="alertCircle" className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-sans text-[9px] text-slate-500 font-bold">포트폴리오 괴리 감지</p>
                      <p className={`font-mono text-base font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                        +32.4% 차이
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] leading-relaxed italic text-slate-500 font-sans">
                      &quot;현재 포트폴리오는 권장 자산배분에 비해 안전자산 비중이 상대적으로 높게 설정되어 있어, 진단된 투자 성향 대비 종합 위험 노출 수준이 보수적인 스펙트럼에 머물러 있습니다.&quot;
                    </p>
                  </div>
                </div>

              </div>

              {/* 데모 시뮬레이터 차트 확장 */}
              {showDemoPortfolio && (
                <div className={`p-8 border-t transition-all ${
                  isDark ? 'bg-[#0d0f0f]/50 border-[#3d4943]/60' : 'bg-white border-t border-[#3eb489]/10'
                }`}>
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-sans font-black text-sm uppercase tracking-wider">
                        [{profile.titleKo}] 권장 포트폴리오 비중 모델
                      </h3>
                      <span className={`font-sans text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                        isDark ? 'bg-slate-800 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#3eb489]'
                      }`}>
                        추천 비중
                      </span>
                    </div>
                    <AssetChart theme={theme} weights={profile.assetWeights} />
                  </div>
                </div>
              )}
            </section>
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
                  긴급 위험 알림 피드
                </span>
              </div>
              <h1 className={`font-sans text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                실시간 자본이벤트 및 중대 공시 경보
              </h1>
              <p className={`font-sans text-xs md:text-sm max-w-3xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                DART OpenDART 공시 시스템에서 수집된 증자, 사채 발행, 지배구조 변동 등의 주요 보조 신호 타임라인입니다.
              </p>
            </section>

            <div className="relative border-l-2 border-[#3eb489]/20 ml-3 pl-6 space-y-6">
              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#3eb489] bg-[#0d0f0f]" />
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#1e2020]/70 border-[#3d4943]' : 'bg-white border-[#3eb489]/15'
                }`}>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-2">
                    <span>DART 공시 · 주요사항보고서</span>
                    <span>2026-07-20 14:32</span>
                  </div>
                  <h4 className="text-sm font-bold font-sans text-red-500">삼성전자(005930) - 유상증자 결정 공시 감지 (자본이벤트)</h4>
                  <p className="text-xs text-slate-500 font-sans mt-2">
                    주주배정후 실권주 일반공모 방식의 대규모 유상증자 공시가 접수되었습니다. 단기 오버행 및 주주가치 희석 우려가 존재하므로 다음 거래일 하락 위험 가중치로 작용합니다.
                  </p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#3eb489] bg-[#0d0f0f]" />
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#1e2020]/70 border-[#3d4943]' : 'bg-white border-[#3eb489]/15'
                }`}>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-2">
                    <span>언론 속보 · ESG 지배구조</span>
                    <span>2026-07-20 11:05</span>
                  </div>
                  <h4 className="text-sm font-bold font-sans text-red-500">카카오(035720) - 경영진 사법 리스크 확산에 따른 리더십 변동</h4>
                  <p className="text-xs text-slate-500 font-sans mt-2">
                    사법 리스크와 불투명한 계열사 지분 매각 추진 등이 복합 작용하여 지배구조 안정성에 부정적 신호가 발생했습니다. 정보가 반도체/IT 서비스 업종의 중대(Material) 이슈로 판정되었습니다.
                  </p>
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#3eb489] bg-[#0d0f0f]" />
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#1e2020]/70 border-[#3d4943]' : 'bg-white border-[#3eb489]/15'
                }`}>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-2">
                    <span>DART 공시 · 단기 실적</span>
                    <span>2026-07-20 09:12</span>
                  </div>
                  <h4 className="text-sm font-bold font-sans text-[#3eb489]">현대차(005380) - 2분기 영업이익 역대 분기 최대 전망 공시</h4>
                  <p className="text-xs text-slate-500 font-sans mt-2">
                    영업이익 추정치가 컨센서스를 대폭 상회하여 실적 모멘텀이 기대됩니다. 이는 재무/실적 카테고리의 긍정 신호로 다음 거래일 주가에 우호적인 영향을 미칩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 푸터 영역 */}
        <footer className="py-12 border-t border-[#3eb489]/15 text-center space-y-6 z-10 relative">
          <p className="text-[10px] font-sans text-slate-500 leading-relaxed max-w-3xl mx-auto uppercase tracking-wider">
            본 투자성향 분석 및 기상 날씨 결과는 사용자가 제공한 입력을 바탕으로 알고리즘이 산출한 통계적 전망치이며, 향후 실제 투자 수익률이나 원금을 보장하지 않습니다. 
            모든 투자 결정에 따른 책임과 귀속은 본인에게 있으므로 최종 실행에 신중을 기해주시기 바랍니다.
          </p>

          <div className="flex justify-center gap-6 text-slate-500">
            <button 
              onClick={() => showToast('공유용 진단 보고서 링크 복사 완료!')}
              className={`flex items-center gap-1 hover:text-[#3eb489] cursor-pointer font-sans text-[11px] transition-colors p-2 rounded-lg ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-white border border-[#3eb489]/10 soft-shadow-light'
              }`}
            >
              <Icon name="share2" className="w-4 h-4" />
              <span>결과 공유</span>
            </button>
            <button 
              onClick={() => showToast('종합 투자 보고서(PDF) 다운로드를 개시합니다.')}
              className={`flex items-center gap-1 hover:text-[#3eb489] cursor-pointer font-sans text-[11px] transition-colors p-2 rounded-lg ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-white border border-[#3eb489]/10 soft-shadow-light'
              }`}
            >
              <Icon name="download" className="w-4 h-4" />
              <span>보고서 다운로드</span>
            </button>
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

      {/* 하단 플로팅 네비게이션 바 (수직 패딩 정렬 수정 및 한글화 적용) */}
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
                showToast(`[${tab.label}] 탭으로 이동합니다.`);
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

    </div>
  );
}
