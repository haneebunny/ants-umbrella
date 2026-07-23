import React from 'react';
import Icon from './Icon';

export default function IntroScreen({ theme, onStart, toggleTheme }) {
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 w-full ${
      isDark ? 'bg-[#0d0f0f] text-[#e2e2e2]' : 'bg-[#f4f9f7] text-[#0f1713]'
    }`}>
      {/* Dynamic grid background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: isDark 
            ? 'radial-gradient(#69dbad 1px, transparent 1px)' 
            : 'radial-gradient(#3eb489 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Atmospheric Blurs */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none z-0 ${
        isDark ? 'bg-[#69dbad]/5' : 'bg-[#3eb489]/5'
      }`} />

      {/* Top Header */}
      <header className={`fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 transition-all ${
        isDark 
          ? 'bg-[#0d0f0f]/80 backdrop-blur-md border-b border-[#3d4943]' 
          : 'bg-[#f4f9f7]/80 backdrop-blur-md border-b border-[#3eb489]/20'
      }`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <img src="/images/ants_umbrella_logo.png" alt="로고" className="w-8 h-8 object-contain" />
          <span className={`font-sans text-xl font-black tracking-tight px-2.5 py-0.5 rounded transition-all ${
            isDark 
              ? 'text-[#69dbad] bg-[#69dbad]/5' 
              : 'text-[#3eb489] bg-[#3eb489]/5 border border-[#3eb489]/20'
          }`}>
            개미의 우산
          </span>
          <div className={`h-4 w-[1px] ${isDark ? 'bg-[#3d4943]' : 'bg-[#3eb489]/20'} mx-2`} />
          <span className={`hidden md:inline-block font-mono text-xs tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Ants Umbrella Terminal
          </span>
        </div>

        {/* Global Stats */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Icon name="checkCircle2" className="w-4 h-4 text-[#3eb489]" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>정답이 없다</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Icon name="timer" className="w-4 h-4 text-[#3eb489]" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>약 2분 소요</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Icon name="info" className="w-4 h-4 text-[#3eb489]" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>결과는 참고 정보</span>
          </div>
        </div>

        {/* Action Controls & Avatar */}
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

          <div className={`w-8 h-8 rounded-full overflow-hidden border ${
            isDark ? 'border-[#3d4943]' : 'border-[#3eb489]/20'
          }`}>
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNY5NDw88xhiYKkv9zCStz5DeMSn1z9x8zbDEx8Rmtv-n1RzKTRZ9dW9UhzlRHyZVWZoZQWIgGrILxwoqhuvl-E2ALQKOZP4takWWeAs8l5pY1um27lbAj3JMxxbpdMPhrhgxjN7zloMUtTXtAR3HY8bp-VPpO8U9XXb_gIZoBe67AWv-AiR0mdCPjITnxwgaskhC0aJ-adj7QC2z6MT6ZzfiNq2r4kW_S-EELFtuFBRT-0TbmZOpqIw" 
              alt="Financial Analyst Avatar"
            />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="min-h-screen pt-24 pb-16 flex items-center justify-center relative z-10 px-6 w-full max-w-5xl mx-auto">
        <div className="w-full text-center">
          
          {/* Umbrella Illustration */}
          <div className="mb-10 relative inline-block">
            <div className={`absolute inset-0 blur-3xl rounded-full scale-125 opacity-70 ${
              isDark ? 'bg-[#69dbad]/15' : 'bg-[#3eb489]/10'
            }`} />
            
            <div className={`relative transition-all duration-500 rounded-full p-6 w-56 h-56 mx-auto flex items-center justify-center border-2 shadow-2xl ${
              isDark 
                ? 'bg-[#1e2020]/75 backdrop-blur-md border-[#69dbad]/40' 
                : 'bg-white/80 backdrop-blur-md border-[#3eb489]/30 soft-shadow-light hover:soft-shadow-hover-light'
            }`}>
              <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#3eb489_1px,transparent_1px)] [background-size:12px_12px]" />
              
              <div className="relative w-44 h-44 flex items-center justify-center transition-transform hover:scale-110 duration-300">
                <img src="/images/ants_umbrella_logo.png" alt="개미의 우산 로고" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Core Info */}
          <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className={`font-sans text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase ${
              isDark ? 'text-white' : 'text-[#0f1713]'
            }`}>
              투자 방식엔 <br className="sm:hidden" />
              <span className={`inline-block relative px-3 py-1 rounded-xl transition-all ${
                isDark 
                  ? 'text-[#69dbad] underline decoration-[#69dbad]/40 underline-offset-8' 
                  : 'text-[#3eb489] bg-[#3eb489]/5 border border-[#3eb489]/15'
              }`}>
                정답이 없어요
              </span>
            </h1>

            <p className={`font-sans text-sm md:text-base leading-relaxed font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              개미의 우산의 정교한 알고리즘을 통해 당신만의 독특한 투자 성향을 파악하세요.<br className="hidden md:inline" /> 
              심리적 회복탄력성과 시장 대응력을 심층 분석하여 최적의 포트폴리오 전략적 가중치를 제안합니다.
            </p>

            {/* Mobile Info Cards */}
            <div className="grid grid-cols-3 gap-3 pt-6 md:hidden">
              <div className={`p-3 rounded-xl transition-all border ${
                isDark 
                  ? 'bg-[#1a1c1c] border-[#3d4943]' 
                  : 'bg-white border-[#3eb489]/15 soft-shadow-light'
              }`}>
                <Icon name="checkCircle2" className="w-5 h-5 text-[#3eb489] mx-auto mb-1" />
                <p className="text-[10px] font-mono font-bold">UNBIASED</p>
              </div>
              <div className={`p-3 rounded-xl transition-all border ${
                isDark 
                  ? 'bg-[#1a1c1c] border-[#3d4943]' 
                  : 'bg-white border-[#3eb489]/15 soft-shadow-light'
              }`}>
                <Icon name="timer" className="w-5 h-5 text-[#3eb489] mx-auto mb-1" />
                <p className="text-[10px] font-mono font-bold">2 MINS</p>
              </div>
              <div className={`p-3 rounded-xl transition-all border ${
                isDark 
                  ? 'bg-[#1a1c1c] border-[#3d4943]' 
                  : 'bg-white border-[#3eb489]/15 soft-shadow-light'
              }`}>
                <Icon name="info" className="w-5 h-5 text-[#3eb489] mx-auto mb-1" />
                <p className="text-[10px] font-mono font-bold">REFERENCE</p>
              </div>
            </div>

            {/* Main Button */}
            <div className="pt-8 flex flex-col items-center gap-4">
              <button
                onClick={onStart}
                className={`group px-10 py-5 rounded-full font-bold text-base transition-all flex items-center gap-3 cursor-pointer ${
                  isDark 
                    ? 'bg-[#3eb489] hover:bg-[#69dbad] text-[#002115] hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(62,180,137,0.3)]' 
                    : 'bg-[#3eb489] hover:brightness-105 text-white hover:scale-105 active:scale-95 shadow-[0_10px_25px_rgba(62,180,137,0.25)]'
                }`}
              >
                <span>진단 시작하기</span>
                <Icon name="arrowRight" className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <p className={`font-mono text-[10px] tracking-widest uppercase opacity-50 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                INSTITUTIONAL GRADE ASSESSMENT V2.4.0
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Side Elements */}
        <div className="absolute left-8 bottom-12 hidden xl:block w-48 opacity-40 font-mono text-[11px] space-y-2 text-slate-500">
          <div className={`h-[1px] w-full ${isDark ? 'bg-[#3d4943]' : 'bg-[#3eb489]/20'}`} />
          <p><span className="text-[#3eb489] font-bold">MARKET_VOLATILITY:</span> LOW</p>
          <div className={`h-[1px] w-1/2 ${isDark ? 'bg-[#3d4943]' : 'bg-[#3eb489]/20'}`} />
          <p><span className="text-[#3eb489] font-bold">SYSTEM_LATENCY:</span> 12ms</p>
        </div>

        <div className="absolute right-8 top-24 hidden xl:block w-64 opacity-35 font-mono">
          <div className={`p-4 rounded-xl border transition-all ${
            isDark ? 'bg-[#1e2020] border-[#3d4943]' : 'bg-white border-[#3eb489]/15 soft-shadow-light'
          }`}>
            <div className="flex justify-between mb-2 text-xs font-bold">
              <span>Risk Vector</span>
              <span className="text-[#3eb489]">0.82</span>
            </div>
            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#0d0f0f]' : 'bg-slate-200'}`}>
              <div className="bg-[#3eb489] h-full w-[82%]" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`fixed bottom-0 left-0 right-0 h-12 flex justify-between items-center px-6 z-30 transition-all text-[10px] font-mono ${
        isDark 
          ? 'bg-[#0d0f0f]/90 border-t border-[#3d4943] text-slate-500' 
          : 'bg-[#f4f9f7]/90 backdrop-blur-md border-t border-[#3eb489]/20 text-slate-600 font-bold'
      }`}>
        <div>
          <span>© 2026 ANTS UMBRELLA. ALL RIGHTS RESERVED.</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="hover:underline cursor-pointer">Disclaimers</span>
          <span className="hover:underline cursor-pointer">Regulatory Status</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#30f802] animate-pulse" />
            <span className="opacity-80">HEALTH: NOMINAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
