"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../hooks/useTheme';
import IntroScreen from '../components/IntroScreen';
import SurveyScreen from '../components/SurveyScreen';
import { QUESTIONS, calculateRiskProfile } from '../components/questions';

export default function OnboardingPage() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const [step, setStep] = useState('INTRO');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleStartSurvey = () => {
    setStep('SURVEY');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleSelectOption = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setStep('INTRO');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // 설문 완료 → profile 계산 후 localStorage 저장 → 포트폴리오 등록으로 이동
      const profile = calculateRiskProfile(answers);
      localStorage.setItem('ants_result_profile', JSON.stringify(profile));
      router.push('/portfolio/register');
    }
  };

  const handleCancelSurvey = () => {
    const ok = window.confirm('진행 중인 성향 진단을 중단하고 인트로 화면으로 돌아가시겠습니까?');
    if (!ok) return;
    setStep('INTRO');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  return (
    <main className="flex-1 flex flex-col w-full min-h-screen">
      {step === 'INTRO' && (
        <IntroScreen
          theme={theme}
          onStart={handleStartSurvey}
          toggleTheme={toggleTheme}
        />
      )}

      {step === 'SURVEY' && (
        <SurveyScreen
          theme={theme}
          toggleTheme={toggleTheme}
          questions={QUESTIONS}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          onSelectOption={handleSelectOption}
          onPrev={handlePrevQuestion}
          onNext={handleNextQuestion}
          onCancel={handleCancelSurvey}
        />
      )}
    </main>
  );
}
