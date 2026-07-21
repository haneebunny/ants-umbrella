import React, { useState } from 'react';
import Icon from './Icon';
import AssetChart from './AssetChart';

export default function ResultsScreen({ theme, profile, onReset, toggleTheme }) {
  const isDark = theme === 'dark';
  const [showDemoPortfolio, setShowDemoPortfolio] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

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

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 pb-32 w-full ${
      isDark ? 'bg-[#0d0f0f] text-[#e2e2e2]' : 'bg-[#f4f9f7] text-[#0f1713]'
    }`}>
      {/* Background patterns */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: isDark 
            ? 'radial-gradient(#69dbad 1px, transparent 1px)' 
            : 'radial-gradient(#3eb489 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Atmospheric bottom glows */}
      <div className={`fixed top-1/4 -right-20 w-96 h-96 rounded-full blur-[120px] pointer-events-none -z-10 ${
        isDark ? 'bg-[#69dbad]/5' : 'bg-[#3eb489]/5'
      }`} />
      <div className={`fixed bottom-1/4 -left-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none -z-10 ${
        isDark ? 'bg-[#d7ffc5]/5' : 'bg-[#3eb489]/30'
      }`} />

      {/* Header Top Bar */}
      <header className={`flex justify-between items-center px-6 h-16 w-full fixed top-0 z-50 transition-all ${
        isDark 
          ? 'bg-[#0d0f0f]/80 backdrop-blur-md border-b border-[#3d4943]' 
          : 'bg-[#f4f9f7]/80 backdrop-blur-md border-b border-[#3eb489]/20'
      }`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onReset}
            aria-label="Restart survey" 
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
            aria-label="Toggle theme"
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
              alt="Avatar"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-6 max-w-5xl mx-auto space-y-8 z-10 relative">
        
        {/* Toast feedback banner */}
        {feedbackMsg && (
          <div className={`p-4 rounded-xl font-mono text-xs flex items-center gap-3 transition-all ${
            isDark ? 'bg-[#1e2020] border border-[#69dbad] text-[#69dbad]' : 'bg-white border border-[#3eb489]/20 text-[#3eb489] font-bold soft-shadow-light'
          }`}>
            <Icon name="sparkles" className="w-4 h-4 animate-spin" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Title Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-mono text-[10px] tracking-widest font-black uppercase px-2.5 py-1 rounded-lg ${
              isDark ? 'bg-[#69dbad]/10 text-[#69dbad] border border-[#69dbad]/20' : 'bg-[#3eb489]/10 text-[#3eb489] border border-[#3eb489]/20'
            }`}>
              ANALYSIS COMPLETE
            </span>
            <span className="text-slate-500 text-xs font-mono font-bold">TERMINAL_ID: RF-294-X</span>
            <span className="text-slate-500 text-xs font-mono font-bold">CONFIDENCE: {profile.confidence_score * 100}%</span>
          </div>
          <h1 className={`font-sans text-2xl md:text-4xl font-black tracking-tight leading-tight uppercase ${
            isDark ? 'text-white' : 'text-[#0f1713]'
          }`}>
            응답 기준으로 <span className={isDark ? 'text-[#69dbad]' : 'text-[#3eb489] bg-[#3eb489]/5 border border-[#3eb489]/15 px-2 py-0.5 rounded-lg'}>[{profile.titleKo}]</span> 성향이 추정됩니다
          </h1>
          <p className={`font-sans text-xs md:text-sm max-w-3xl leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            AI 투자 분석 매트릭스가 산출한 귀하의 투자 기상도는 <span className={`font-bold ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>&apos;{profile.titleEn}&apos;</span>입니다. {profile.description}
          </p>

          {/* System Flags Warning Banner */}
          {profile.flags && profile.flags.length > 0 && (
            <div className={`p-4 rounded-xl border mt-4 space-y-2 text-left ${
              isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center gap-2 font-bold text-xs">
                <Icon name="alertTriangle" className="w-4 h-4 text-amber-500" />
                <span>시스템 경고 및 예외 제한 규칙 적용</span>
              </div>
              <ul className="list-disc list-inside text-xs space-y-1 opacity-90 font-sans">
                {profile.flags.map(flag => {
                  switch (flag) {
                    case 'SHORT_TERM_LIMIT':
                      return <li key={flag}>투자 예정 기간이 1년 이내로 단기 자금에 해당하여, 상한 규정에 의해 최종 성향이 &apos;안정추구형&apos; 이하로 하향 제한되었습니다.</li>;
                    case 'LOW_EMERGENCY_FUND_LIMIT':
                      return <li key={flag}>비상자금 여유분이 매우 부족하여 재무 능력 보존을 위해 최종 성향이 &apos;안정추구형&apos; 이하로 하향 제한되었습니다.</li>;
                    case 'INSUFFICIENT_WILLINGNESS_RESPONSES':
                      return <li key={flag}>위험 선호 관련 주요 문항에 응답하지 않아 평가의 신뢰성이 저하되었습니다.</li>;
                    case 'SHORT_TERM_HIGH_RETURN_FLAG':
                      return <li key={flag}>단기간 내에 고수익을 달성하기 위한 고위험 지향성이 탐지되었습니다.</li>;
                    case 'INCONSISTENT_ANSWER_FLAG':
                      return <li key={flag}>설문 응답 간에 논리적 모순이 감지되었습니다. (예: 낮은 손실 허용과 공격적인 매수 행동이 동시 선택됨)</li>;
                    default:
                      return <li key={flag}>감지된 플래그: {flag}</li>;
                  }
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Identity Card (4 cols) */}
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
            <p className="font-mono text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-6">
              {profile.titleEn}
            </p>

            <div className={`w-full h-[1.5px] mb-6 ${isDark ? 'bg-[#3d4943]/60' : 'bg-[#3eb489]/10'}`} />

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="text-left">
                <p className="font-mono text-[9px] uppercase text-slate-500 font-bold">목표 위험 점수</p>
                <p className={`font-mono text-lg font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  {profile.target_risk_score_adjusted}
                </p>
              </div>
              <div className={`text-left pl-4 border-l ${isDark ? 'border-[#3d4943]/60' : 'border-l border-[#3eb489]/15'}`}>
                <p className="font-mono text-[9px] uppercase text-slate-500 font-bold">기대 매칭 수익</p>
                <p className={`font-mono text-lg font-black ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>
                  {profile.expectedReturn}
                </p>
              </div>
            </div>
          </div>

          {/* Right Spectrum Card (8 cols) */}
          <div className={`md:col-span-8 p-8 rounded-2xl flex flex-col justify-between ${
            isDark 
              ? 'bg-[#1e2020]/70 backdrop-blur-sm border border-[#3d4943]' 
              : 'bg-white border border-[#3eb489]/15 soft-shadow-light'
          }`}>
            <div>
              <h4 className={`font-sans text-base font-black mb-6 uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-[#0f1713]'
              }`}>
                투자 성향 스펙트럼
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
                  <div className={`font-mono text-[9px] font-black px-2 py-0.5 rounded shadow-lg uppercase ${
                    isDark ? 'bg-[#3eb489] text-[#002115]' : 'bg-[#3eb489] text-white'
                  }`}>
                    YOU
                  </div>
                  <div className={`w-1 h-12 mt-1 ${isDark ? 'bg-[#3eb489]' : 'bg-[#3eb489]'}`} />
                </div>

                <div className="flex justify-between mt-4 font-mono text-[10px] text-slate-500 font-bold">
                  <span className={profile.target_risk_band === 'CONSERVATIVE' ? 'text-[#3eb489] font-black' : ''}>안정형</span>
                  <span className={profile.target_risk_band === 'MODERATE_CONSERVATIVE' ? 'text-[#3eb489] font-black' : ''}>안정추구</span>
                  <span className={profile.target_risk_band === 'BALANCED' ? 'text-[#3eb489] font-black' : ''}>위험중립</span>
                  <span className={(profile.target_risk_band === 'GROWTH' || profile.target_risk_band === 'AGGRESSIVE') ? 'text-[#3eb489] font-black' : ''}>적극/공격</span>
                </div>
              </div>
            </div>

            {/* Core Strategy Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#3eb489]/15">
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#1a1c1c]/50 border-transparent' : 'bg-[#f4f9f7]/50 border-[#3eb489]/15'
              }`}>
                <p className="font-mono text-[10px] text-[#3eb489] font-bold mb-1">시장 대응 성향</p>
                <p className="font-sans text-xs font-semibold leading-relaxed">{profile.marketResponse}</p>
              </div>
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#1a1c1c]/50 border-transparent' : 'bg-[#f4f9f7]/50 border-[#3eb489]/15'
              }`}>
                <p className="font-mono text-[10px] text-[#3eb489] font-bold mb-1">매칭 자산 배분</p>
                <p className="font-sans text-xs font-semibold leading-relaxed">{profile.assetAllocationDesc}</p>
              </div>
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#1a1c1c]/50 border-transparent' : 'bg-[#f4f9f7]/50 border-[#3eb489]/15'
              }`}>
                <p className="font-mono text-[10px] text-[#3eb489] font-bold mb-1">핵심 키워드</p>
                <p className="font-sans text-xs font-semibold leading-relaxed">{profile.keywords}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Metric Dimensions (Bento Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Appetite */}
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

          {/* Capacity */}
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
                  <circle cx="28" cy="28" r="24" fill="transparent" stroke={isDark ? '#282a2a' : '#f1f5f3'} strokeWidth="3" />
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="24" 
                    fill="transparent" 
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
              <div className="font-mono text-[10px] text-slate-500 space-y-1">
                <p>유동성: <span className="text-[#3eb489] font-bold">{profile.liquidity}</span></p>
                <p>기간한도: <span className="text-[#3eb489] font-bold">{profile.horizon}</span></p>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-sans leading-relaxed mt-1">
              투자기간과 비상자금 여력 등 재무적 현실을 바탕으로 실제 손실을 감당할 수 있는 객관적인 리스크 수용 한계치입니다.
            </p>
          </div>

          {/* Activity */}
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

            <div className="font-mono text-xs space-y-1.5 pb-2">
              <div className="flex justify-between border-b border-[#3d4943]/20 pb-1">
                <span className="text-slate-500">활동성 강도:</span>
                <span className="font-bold text-[#3eb489]">{profile.activity_band}</span>
              </div>
              <div className="flex justify-between border-b border-[#3d4943]/20 pb-1">
                <span className="text-slate-500">처분 기준:</span>
                <span className="font-bold text-[#3eb489]">{profile.disposition_style}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500">경험 수준:</span>
                <span className="font-bold">Lv. {profile.experience_level}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-sans leading-relaxed mt-2">
              최근 3개월 매매 빈도와 구성 비중의 변경을 종합하여 진단한 활동성 강도 및 익절/손절 시의 처분 결정 성향입니다.
            </p>
          </div>

        </div>

        {/* Compatibility Simulator */}
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
                <span className="font-mono text-[10px] font-black uppercase">Portfolio Compatibility Check</span>
              </div>

              <h2 className={`font-sans text-xl md:text-2xl font-black mb-4 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                현재 보유 포트폴리오와의 적합도를 확인하세요
              </h2>

              <p className={`font-sans text-xs md:text-sm leading-relaxed max-w-xl mb-8 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                고객님의 현재 자산 배분 비중이 분석된 <span className={`font-bold ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>&apos;{profile.titleKo}&apos;</span>의 목표 지분 가중치와 적정 정렬상태(Aligned)를 유지하는지 정밀 스캔합니다. 데모 모드를 켜거나 실제 계좌를 암호화 보안 연동하여 정밀 편차를 진단하십시오.
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
                  <p className="font-mono text-[9px] text-slate-500 font-bold uppercase">DEVIATION DETECTED</p>
                  <p className={`font-mono text-base font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    +32.4% GAP
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] leading-relaxed italic text-slate-500 font-sans">
                  &quot;현재 수동 배분된 포트폴리오는 &apos;{profile.titleKo}&apos;에 비해 지나치게 안전 추구 지향성을 띠고 있어 자본 증식 효율(Alpha)이 제한적입니다. 적극적인 성장 자산 편입을 추천합니다.&quot;
                </p>
              </div>
            </div>

          </div>

          {/* Expanded Chart */}
          {showDemoPortfolio && (
            <div className={`p-8 border-t transition-all ${
              isDark ? 'bg-[#0d0f0f]/50 border-[#3d4943]/60' : 'bg-white border-t border-[#3eb489]/10'
            }`}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-black text-sm uppercase tracking-wider">
                    [{profile.titleKo}] 맞춤 권장 포트폴리오 지분 배분 모델
                  </h3>
                  <span className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                    isDark ? 'bg-slate-800 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#3eb489]'
                  }`}>
                    RECOMMENDED
                  </span>
                </div>
                <AssetChart theme={theme} weights={profile.assetWeights} />
              </div>
            </div>
          )}
        </section>

        {/* Footer actions */}
        <footer className="py-12 border-t border-[#3eb489]/15 text-center space-y-6 z-10 relative">
          <p className="text-[10px] font-sans text-slate-500 leading-relaxed max-w-3xl mx-auto uppercase tracking-wider">
            본 투자성향 분석 결과는 사용자가 입력한 정보를 바탕으로 산출된 고유 AI 알고리즘 추정치이며, 장래의 투자 수익을 보장하지 않습니다. 
            금융 시장의 단기 변동성은 예측 불가능하며, 모든 투자 판단에 대한 최종적인 법적 귀책사유는 자본 운용 주체인 귀하 본인에게 귀속됩니다. 
            과거의 성과 시나리오가 미래의 실현 손익을 대리 표상하지 않음을 강력히 유의하십시오.
          </p>

          <div className="flex justify-center gap-6 text-slate-500">
            <button 
              onClick={() => showToast('공유용 고유 분석 링크 복사 완료!')}
              className={`flex items-center gap-1 hover:text-[#3eb489] cursor-pointer font-mono text-[11px] transition-colors p-2 rounded-lg ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-white border border-[#3eb489]/10 soft-shadow-light'
              }`}
            >
              <Icon name="share2" className="w-4 h-4" />
              <span>SHARE</span>
            </button>
            <button 
              onClick={() => showToast('투자분석보고서(PDF) 다운로드가 시작되었습니다.')}
              className={`flex items-center gap-1 hover:text-[#3eb489] cursor-pointer font-mono text-[11px] transition-colors p-2 rounded-lg ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-white border border-[#3eb489]/10 soft-shadow-light'
              }`}
            >
              <Icon name="download" className="w-4 h-4" />
              <span>DOWNLOAD</span>
            </button>
            <button 
              onClick={() => window.print()}
              className={`flex items-center gap-1 hover:text-[#3eb489] cursor-pointer font-mono text-[11px] transition-colors p-2 rounded-lg ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-white border border-[#3eb489]/10 soft-shadow-light'
              }`}
            >
              <Icon name="printer" className="w-4 h-4" />
              <span>PRINT</span>
            </button>
          </div>
        </footer>

      </main>

      {/* Bottom Floating Nav */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 pb-6 pt-3 backdrop-blur-xl md:max-w-md md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:rounded-full md:shadow-2xl transition-all ${
        isDark 
          ? 'bg-[#1e2020]/90 border-t border-white/5 md:border border-slate-700' 
          : 'bg-white/95 border-t border-[#3eb489]/15 md:border md:border-[#3eb489]/20 soft-shadow-light'
      }`}>
        <button 
          onClick={() => showToast('기상도 대기 모니터를 갱신합니다.')}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-[#3eb489] transition-colors cursor-pointer"
        >
          <Icon name="cloudRain" className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-1">Atmosphere</span>
        </button>
        <button 
          onClick={() => showToast('시장 레이더 스캔을 가동합니다.')}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-[#3eb489] transition-colors cursor-pointer"
        >
          <Icon name="radar" className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-1">Radar</span>
        </button>
        <button 
          onClick={() => {
            setShowDemoPortfolio(true);
            showToast('추천 맞춤 자산 포트폴리오를 로드합니다.');
          }}
          className={`flex flex-col items-center justify-center rounded-full px-5 py-2 scale-110 shadow-lg cursor-pointer ${
            isDark ? 'bg-[#3eb489] text-[#002115]' : 'bg-[#3eb489] text-white shadow-[0_4px_12px_rgba(62,180,137,0.3)]'
          }`}
        >
          <Icon name="wallet" className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-1 font-bold">Assets</span>
        </button>
        <button 
          onClick={() => showToast('신규 긴급 거시 변동 알림이 없습니다.')}
          className="flex flex-col items-center justify-center text-slate-400 hover:text-[#3eb489] transition-colors cursor-pointer"
        >
          <Icon name="bell" className="w-5 h-5" />
          <span className="font-mono text-[9px] mt-1">Alerts</span>
        </button>
      </nav>

    </div>
  );
}
