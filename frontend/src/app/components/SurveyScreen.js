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

  const mimiQuestions = [
    "현재 투자한 자금을 사용할 예정 시점은 언제인가요? ⏳",
    "투자를 통해 달성하고자 하는 주된 목표는 무엇인가요? 🎯",
    "투자를 진행하며 감내할 수 있는 최대 손실 수준은 얼마인가요? 🛡️",
    "시장 전체가 20% 하락했을 때, 어떻게 행동하시겠습니까? 🌊",
    "귀하의 성향에 가장 잘 부합하는 금융 상품 조합은 무엇인가요? ⚖️",
    "변동성이 있는 자산(주식, 암호화폐 등)에 투자해 본 총 기간은 어떻게 되나요? 📝",
    "갑작스러운 지출에 대비해 유동화할 수 있는 여유 비상자금은 어느 정도인가요? 💼",
    "최근 3개월간 평균적으로 주식이나 자산을 매매한 거래 빈도는 어느 정도인가요? 🧭",
    "최근 3개월 동안 포트폴리오 자산 비중이 얼마나 바뀌었나요? 📊",
    "기대 수익을 달성하거나 손실을 볼 때 내리는 처분 결정 기준은 무엇인가요? 🚀"
  ];

  const mimiImages = [
    '/images/mimi/mimi_0.png',
    '/images/mimi/mimi_1.png',
    '/images/mimi/mimi_2.png',
    '/images/mimi/mimi_3.png',
    '/images/mimi/mimi_4.png'
  ];

  const currentMimiText = mimiQuestions[currentQuestionIndex] || currentQuestion.text;
  const currentMimiImage = mimiImages[currentQuestionIndex % mimiImages.length];

  // 옵션 선택 시 피드백 시각화 후 자동 다음 질문 이동 핸들러
  const handleOptionClick = (questionId, optionId) => {
    const updatedAnswers = { ...answers, [questionId]: optionId };
    onSelectOption(questionId, optionId);
    setTimeout(() => {
      onNext(updatedAnswers);
    }, 250);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-between transition-colors duration-300 w-full ${
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

      {/* Top Header */}
      <header className={`flex justify-between items-center px-6 h-16 w-full sticky top-0 z-50 transition-all ${
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
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={onCancel}>
            <img src="/images/ants_umbrella_logo.png" alt="로고" className="w-7 h-7 object-contain" />
            <span className={`font-sans text-lg font-black tracking-tight ${isDark ? 'text-[#e2e2e2]' : 'text-[#0f1713]'}`}>
              개미의 우산 <span className="text-xs font-semibold opacity-70 ml-1">| 3분 성향 진단</span>
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
            <span className={`px-2.5 py-1 rounded-lg ${
              isDark 
                ? 'bg-slate-800 text-[#69dbad]' 
                : 'bg-[#3eb489]/10 border border-[#3eb489]/20 text-[#3eb489] font-bold'
            }`}>
              질문 {String(currentQuestionIndex + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content: 데스크톱 대화형 2열 분할 레이아웃 */}
      <main className="flex-grow w-full max-w-6xl px-6 py-8 z-10 flex flex-col justify-center">
        
        {/* 상단 프로그레스 바 영역 */}
        <div className="w-full mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs font-bold ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>
              질문 {String(currentQuestionIndex + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
            </span>
            <span className="text-xs font-bold opacity-75">
              진행률 {progressPercent}%
            </span>
          </div>
          <div className={`w-full h-2.5 rounded-full overflow-hidden ${
            isDark ? 'bg-white/10' : 'bg-slate-200'
          }`}>
            <div 
              className="h-full bg-[#3eb489] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── 2열 그리드 구조 (좌: 개미 펫 미미 대화 존 / 우: 가이드 및 선택지) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* [좌측 5열] 개미 펫 미미 대화 존 (질문 및 가이드 전담) */}
          <div className={`lg:col-span-5 flex flex-col items-center justify-center text-center p-6 rounded-3xl border transition-all ${
            isDark ? 'bg-[#181c19]/90 border-white/10' : 'bg-white/90 border-emerald-100 shadow-xl'
          }`}>
            {/* 질문 단계 뱃지 (개미 질문 위로 이동) */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-emerald-100/80 border-emerald-200 text-emerald-800'
              }`}>
                {currentQuestion.phase}
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentQuestion.category}
              </span>
            </div>

            {/* 실시간 대화 질문 말풍선 */}
            <div className={`relative mb-4 p-4 rounded-2xl border text-sm sm:text-base font-extrabold leading-relaxed max-w-sm animate-fadeIn ${
              isDark ? 'bg-[#232925] border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <p>&quot;{currentMimiText}&quot;</p>
              {/* 말풍선 꼬리 */}
              <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 ${
                isDark ? 'border-t-[#232925]' : 'border-t-emerald-50'
              }`} />
            </div>

            {/* 미미 캐릭터 이미지 */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 mt-2 mb-3 flex items-center justify-center">
              <img
                src={currentMimiImage}
                alt="미미 캐릭터"
                className="w-full h-full object-contain -scale-x-100 filter drop-shadow-xl"
              />
              <div className="absolute -bottom-2 w-24 h-3 bg-black/15 dark:bg-emerald-500/15 rounded-full blur-md" />
            </div>

            {/* 💡 개미 밑 진단 가이드 박스 */}
            <div className={`w-full mt-1 p-3 rounded-2xl border text-xs font-medium leading-relaxed ${
              isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-emerald-50/70 border-emerald-100 text-slate-700'
            }`}>
              💡 <strong className="font-bold">진단 가이드:</strong> {currentQuestion.subtext}
            </div>
          </div>

          {/* [우측 7열] 선택 옵션 리스트 */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
            
            {/* 선택지 리스트 */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(currentQuestion.id, option.id)}
                    className={`w-full p-4 sm:p-5 rounded-2xl text-left border transition-all relative flex items-center gap-4 group cursor-pointer ${
                      isDark 
                        ? `border-transparent ${
                            isSelected 
                              ? 'border-[#69dbad] bg-[#69dbad]/10 shadow-[0_0_20px_rgba(105,219,173,0.15)] ring-1 ring-[#69dbad]' 
                              : 'bg-[#1e2220] hover:bg-[#252b28]'
                          }`
                        : `border bg-white ${
                            isSelected 
                              ? 'border-[#3eb489] bg-[#3eb489]/10 shadow-[0_4px_20px_rgba(62,180,137,0.15)] ring-1 ring-[#3eb489]' 
                              : 'border-slate-200 hover:border-[#3eb489]/50 hover:bg-slate-50'
                          }`
                    }`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isDark 
                        ? isSelected ? 'bg-[#3eb489]/30 text-[#69dbad]' : 'bg-white/5 text-slate-400 group-hover:bg-[#3eb489]/10'
                        : isSelected ? 'bg-[#3eb489]/20 text-[#3eb489]' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {getChoiceIcon(currentQuestion.id, idx)}
                    </div>

                    <div className="flex-grow pr-6">
                      <h3 className={`font-bold text-sm sm:text-base mb-0.5 ${
                        isDark 
                          ? isSelected ? 'text-[#69dbad]' : 'text-white'
                          : isSelected ? 'text-[#3eb489]' : 'text-[#0f1713]'
                      }`}>
                        {option.text}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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

            {/* 하단 내비게이션 버튼 (이전 / 다음) */}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={onPrev}
                className={`px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' 
                    : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                }`}
              >
                이전 질문
              </button>

              <button
                onClick={onNext}
                disabled={!selectedOptionId}
                className={`flex-grow py-3.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !selectedOptionId ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.01]'
                } ${
                  isDark 
                    ? 'bg-[#3eb489] text-[#002115] shadow-lg' 
                    : 'bg-[#3eb489] text-white shadow-lg'
                }`}
              >
                <span>{currentQuestionIndex === totalQuestions - 1 ? '결과 분석하기' : '다음 질문으로 이동'}</span>
                <Icon name="arrowRight" className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
