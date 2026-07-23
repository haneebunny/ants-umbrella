import React from 'react';
import Icon from './Icon';

export default function SurveyScreen({
  theme,
  toggleTheme,
  questions,
  currentQuestionIndex,
  answers,
  onSelectOption,
  onPrev,
  onNext,
  onCancel
}) {
  const isDark = theme === 'dark';
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  const selectedOptionId = answers[currentQuestion.id] || '';

  // Map dynamic icons
  const getChoiceIcon = (questionId, optionIndex) => {
    if (questionId === 4) {
      if (optionIndex === 0) return <Icon name="frown" className="w-5 h-5 text-red-500" />;
      if (optionIndex === 1) return <Icon name="meh" className="w-5 h-5 text-amber-500" />;
      return <Icon name="trendingUp" className="w-5 h-5 text-[#30f802]" />;
    }
    switch (optionIndex) {
      case 0: return <Icon name="shield" className="w-5 h-5 text-[#3eb489]" />;
      case 1: return <Icon name="scale" className="w-5 h-5 text-[#d7ffc5]" />;
      case 2: return <Icon name="zap" className="w-5 h-5 text-[#30f802]" />;
      default: return <Icon name="helpCircle" className="w-5 h-5" />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center transition-colors duration-300 w-full ${
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

      {/* Top Header */}
      <header className={`flex justify-between items-center px-6 h-16 w-full fixed top-0 z-50 transition-all ${
        isDark 
          ? 'bg-[#0d0f0f]/80 backdrop-blur-md border-b border-[#3d4943]' 
          : 'bg-[#f4f9f7]/80 backdrop-blur-md border-b border-[#3eb489]/20'
      }`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            aria-label="Go back to intro" 
            className={`hover:opacity-80 transition-opacity p-2 cursor-pointer flex items-center justify-center rounded-full ${
              isDark ? 'hover:bg-slate-800 text-[#69dbad]' : 'hover:bg-slate-100 text-[#3eb489]'
            }`}
          >
            <Icon name="arrowLeft" className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={onCancel}>
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

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`hidden sm:inline-block px-2.5 py-1 rounded-lg ${
              isDark 
                ? 'bg-slate-800 text-[#69dbad]' 
                : 'bg-[#3eb489]/10 border border-[#3eb489]/20 text-[#3eb489] font-bold'
            }`}>
              질문 {String(currentQuestionIndex + 1).padStart(2, '0')}
            </span>
            <div className={`w-8 h-8 rounded-full overflow-hidden border ${isDark ? 'border-[#3d4943]' : 'border-[#3eb489]/20'}`}>
              <img 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNY5NDw88xhiYKkv9zCStz5DeMSn1z9x8zbDEx8Rmtv-n1RzKTRZ9dW9UhzlRHyZVWZoZQWIgGrILxwoqhuvl-E2ALQKOZP4takWWeAs8l5pY1um27lbAj3JMxxbpdMPhrhgxjN7zloMUtTXtAR3HY8bp-VPpO8U9XXb_gIZoBe67AWv-AiR0mdCPjITnxwgaskhC0aJ-adj7QC2z6MT6ZzfiNq2r4kW_S-EELFtuFBRT-0TbmZOpqIw" 
                alt="Avatar"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar Section */}
      <div className={`fixed top-16 w-full z-40 px-6 py-4 transition-all ${
        isDark ? 'bg-[#0d0f0f]/90' : 'bg-[#f4f9f7]/90 backdrop-blur-md border-b border-[#3eb489]/10'
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-end mb-2">
            <span className={`font-sans text-[10px] tracking-wider font-bold ${
              isDark ? 'text-[#69dbad]' : 'text-[#3eb489] bg-[#3eb489]/5 px-2 py-0.5 rounded'
            }`}>
              투자성향 진단 진행도
            </span>
            <span className="font-mono text-xs text-slate-500 font-bold">
              <span className={`font-bold ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>
                {String(currentQuestionIndex + 1).padStart(2, '0')}
              </span>{' '}
              / {String(totalQuestions).padStart(2, '0')}
            </span>
          </div>
          
          <div className={`w-full h-2 rounded-full overflow-hidden ${
            isDark ? 'bg-[#1e2020] border border-[#3d4943]/50' : 'bg-slate-200/50 border border-slate-300/30'
          }`}>
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                isDark 
                  ? 'bg-[#3eb489] shadow-[0_0_10px_rgba(105,219,173,0.5)]' 
                  : 'bg-[#3eb489] shadow-[0_2px_8px_rgba(62,180,137,0.2)]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-4xl px-6 pt-36 pb-32 z-10">
        <div className="space-y-8 max-w-2xl mx-auto">
          
          {/* Question Header */}
          <div className="space-y-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
              isDark 
                ? 'bg-[#1e2020] border-[#3d4943]/60' 
                : 'bg-white border-[#3eb489]/20 soft-shadow-light'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3eb489] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3eb489]"></span>
              </span>
              <span className={`font-sans text-[10px] font-bold ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>
                {currentQuestion.phase}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-[#3eb489]/10 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#3eb489]'
              }`}>
                <Icon name={currentQuestion.icon} className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs text-slate-500 font-bold uppercase tracking-wider">
                {currentQuestion.category}
              </span>
            </div>

            <h2 className={`font-sans text-xl md:text-2xl font-black leading-tight ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
              {currentQuestion.text}
            </h2>
            <p className={`font-sans text-xs md:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {currentQuestion.subtext}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOptionId === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => onSelectOption(currentQuestion.id, option.id)}
                  className={`w-full p-5 rounded-2xl text-left border transition-all relative flex gap-4 group cursor-pointer ${
                    isDark 
                      ? `border-transparent ${
                          isSelected 
                            ? 'border-[#69dbad] bg-[#69dbad]/5 shadow-[0_0_15px_rgba(105,219,173,0.1)]' 
                            : 'bg-[#1e2020] hover:bg-[#282a2a]'
                        }`
                      : `border bg-white transition-all ${
                          isSelected 
                            ? 'border-[#3eb489] bg-[#3eb489]/5 shadow-[0_4px_16px_rgba(62,180,137,0.12)]' 
                            : 'border-[#3eb489]/15 hover:border-[#3eb489]/40 hover:bg-[#fafdfc] soft-shadow-light'
                        }`
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isDark 
                      ? isSelected ? 'bg-[#3eb489]/20' : 'bg-[#282a2a] group-hover:bg-[#3eb489]/10'
                      : isSelected ? 'bg-[#3eb489]/20' : 'bg-slate-100 border border-slate-200'
                  }`}>
                    {getChoiceIcon(currentQuestion.id, idx)}
                  </div>

                  <div className="flex-grow pr-6">
                    <h3 className={`font-sans font-bold text-sm md:text-base mb-1 ${
                      isDark 
                        ? isSelected ? 'text-[#69dbad]' : 'text-white'
                        : isSelected ? 'text-[#3eb489]' : 'text-[#0f1713]'
                    }`}>
                      {option.text}
                    </h3>
                    <p className={`font-sans text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {option.explanation}
                    </p>
                  </div>

                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                  }`}>
                    <Icon name="checkCircle2" className={`w-5 h-5 ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`} />
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </main>

      {/* Fixed Footer */}
      <div className={`fixed bottom-0 left-0 right-0 py-5 px-6 border-t z-50 flex justify-center backdrop-blur-md transition-all ${
        isDark 
          ? 'bg-[#0d0f0f]/80 border-[#3d4943]/40' 
          : 'bg-[#f4f9f7]/80 border-[#3eb489]/15'
      }`}>
        <div className="w-full max-w-4xl flex items-center gap-4">
          <button
            onClick={onPrev}
            className={`px-6 py-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              isDark 
                ? 'bg-[#1e2020] hover:bg-[#282a2a] text-[#e2e2e2] border border-[#3d4943]' 
                : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 soft-shadow-light'
            }`}
          >
            이전
          </button>

          <button
            onClick={onNext}
            disabled={!selectedOptionId}
            className={`flex-grow py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !selectedOptionId ? 'opacity-40 cursor-not-allowed' : ''
            } ${
              isDark 
                ? 'bg-[#3eb489] hover:brightness-110 text-[#002115] shadow-[0_0_15px_rgba(62,180,137,0.3)]' 
                : 'bg-[#3eb489] hover:brightness-105 text-white shadow-[0_6px_20px_rgba(62,180,137,0.3)]'
            }`}
          >
            <span>{currentQuestionIndex === totalQuestions - 1 ? '결과 분석하기' : '다음 단계로 이동'}</span>
            <Icon name="arrowRight" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
