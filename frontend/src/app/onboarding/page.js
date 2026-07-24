"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../hooks/useTheme';
import IntroScreen from '../components/IntroScreen';
import SurveyScreen from '../components/SurveyScreen';
import { QUESTIONS, calculateRiskProfile } from '../components/questions';

export default function OnboardingPage() {
  const router = useRouter();
  const { toggleTheme, theme } = useTheme();
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
      const computedProfile = calculateRiskProfile(answers);
      localStorage.setItem('ants_result_profile', JSON.stringify(computedProfile));
      
      // 진단결과 페이지로 분리 라우팅 이동!
      router.push('/onboarding/result');
    }
  };

  const handleCancelSurvey = () => {
    const ok = window.confirm('앗, 정말로 성향 진단을 중단하고 처음 화면으로 돌아갈까요? 😢');
    if (!ok) return;
    setStep('INTRO');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  return (
    <div className="w-full">
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
    </div>
  );
}
