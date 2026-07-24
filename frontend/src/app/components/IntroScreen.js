import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';

export default function IntroScreen({ theme, onStart, toggleTheme }) {
  const isDark = theme === 'dark';
  const router = useRouter();

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 w-full flex flex-col justify-between ${
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
      <div className={`absolute top-1/4 -right-20 w-96 h-96 rounded-full blur-[120px] pointer-events-none -z-10 ${
        isDark ? 'bg-[#69dbad]/5' : 'bg-[#3eb489]/5'
      }`} />
      <div className={`absolute bottom-1/4 -left-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none -z-10 ${
        isDark ? 'bg-[#d7ffc5]/5' : 'bg-[#3eb489]/20'
      }`} />

      {/* Top Header */}
      <header className={`flex justify-between items-center px-6 h-14 w-full fixed top-0 z-50 transition-all ${
        isDark 
          ? 'bg-[#0d0f0f]/80 backdrop-blur-md border-b border-[#3d4943]' 
          : 'bg-[#f4f9f7]/80 backdrop-blur-md border-b border-[#3eb489]/20'
      }`}>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <img src="/images/ants_umbrella_logo.png" alt="로고" className="w-7 h-7 object-contain" />
          <span className={`font-sans text-lg font-black tracking-tight ${isDark ? 'text-[#e2e2e2]' : 'text-[#0f1713]'}`}>
            개미의 우산
          </span>
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
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-6 pt-28 pb-16 flex items-center justify-center relative z-10">
        <div className="text-center w-full max-w-3xl space-y-8">
          
          {/* Logo illustration */}
          <div className="mb-8 relative inline-block">
            <div className={`absolute inset-0 blur-3xl rounded-full scale-125 opacity-60 ${
              isDark ? 'bg-[#69dbad]/15' : 'bg-[#3eb489]/10'
            }`} />
            
            <div className={`relative rounded-full p-5 w-44 h-44 mx-auto flex items-center justify-center border-2 shadow-xl ${
              isDark 
                ? 'bg-[#1e2020]/75 backdrop-blur-md border-[#69dbad]/30' 
                : 'bg-white/80 backdrop-blur-md border-[#3eb489]/20 soft-shadow-light'
            }`}>
              <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#3eb489_1px,transparent_1px)] [background-size:10px_10px]" />
              <img src="/images/ants_umbrella_logo.png" alt="개미의 우산 로고" className="w-32 h-32 object-contain" />
            </div>
          </div>

          {/* Core Info */}
          <div className="space-y-6">
            <h1 className={`font-sans text-3xl md:text-5xl font-black tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-[#0f1713]'
            }`}>
              내 주식 포트폴리오{' '}
              <span className={`inline-block relative px-3 py-1 rounded-xl transition-all ${
                isDark 
                  ? 'text-[#69dbad] underline decoration-[#69dbad]/40 underline-offset-8' 
                  : 'text-[#3eb489] bg-[#3eb489]/5 border border-[#3eb489]/15'
              }`}>
                일기예보
              </span>
            </h1>

            <p className={`font-sans text-sm md:text-base leading-relaxed font-medium max-w-2xl mx-auto ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              ESG 뉴스·공시 리스크를 매일 자동 수집하고, 내 투자 성향에 맞게 가중치를 적용해{' '}
              <br className="hidden md:inline" />
              오늘 내 포트폴리오에 비가 내릴지 맑을지 쏙 알려주는 리스크 진단 서비스예요! ☔
            </p>

            {/* Stats Horizontal */}
            <div className="flex justify-center items-center gap-6 pt-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <Icon name="checkCircle2" className="w-4 h-4 text-[#3eb489]" />
                <span>정답 없음</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="timer" className="w-4 h-4 text-[#3eb489]" />
                <span>약 2분 소요</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="info" className="w-4 h-4 text-[#3eb489]" />
                <span>참고용 리포트</span>
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
                개미의 우산 ver.0.2 · 투자성향 진단
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`w-full h-12 flex justify-between items-center px-6 z-30 transition-all text-[10px] font-mono border-t ${
        isDark 
          ? 'bg-[#0d0f0f]/90 border-[#3d4943] text-slate-500' 
          : 'bg-[#f4f9f7]/90 backdrop-blur-md border-[#3eb489]/20 text-slate-600 font-bold'
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
