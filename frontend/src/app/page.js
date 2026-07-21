"use client";

import React, { useState, useEffect } from 'react';
import IntroScreen from './components/IntroScreen';
import SurveyScreen from './components/SurveyScreen';
import ResultsScreen from './components/ResultsScreen';
import { QUESTIONS, calculateRiskProfile } from './components/questions';

export default function Home() {
  const [theme, setTheme] = useState('dark');
  const [step, setStep] = useState('INTRO');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // 컴포넌트 마운트 시 localStorage에서 설문 상태 복원 ( Fast Refresh / 핫 리로딩 대응 )
  useEffect(() => {
    const savedStep = localStorage.getItem('ants_survey_step');
    const savedAnswers = localStorage.getItem('ants_survey_answers');
    const savedIndex = localStorage.getItem('ants_survey_index');

    if (savedStep) setStep(savedStep);
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (e) {
        setAnswers({});
      }
    }
    if (savedIndex) setCurrentQuestionIndex(Number(savedIndex));
  }, []);

  // 상태가 변할 때마다 localStorage에 실시간 백업
  useEffect(() => {
    if (step === 'INTRO' && Object.keys(answers).length === 0) {
      // 초기 상태일 때는 로컬스토리지 클리어
      localStorage.removeItem('ants_survey_step');
      localStorage.removeItem('ants_survey_answers');
      localStorage.removeItem('ants_survey_index');
    } else {
      localStorage.setItem('ants_survey_step', step);
      localStorage.setItem('ants_survey_answers', JSON.stringify(answers));
      localStorage.setItem('ants_survey_index', String(currentQuestionIndex));
    }
  }, [step, answers, currentQuestionIndex]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleStartSurvey = () => {
    setStep('SURVEY');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleSelectOption = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
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
      setStep('RESULTS');
    }
  };

  const handleCancelSurvey = () => {
    const ok = window.confirm("진행 중인 성향 진단을 중단하고 인트로 화면으로 돌아가시겠습니까?");
    if (!ok) return;

    setStep('INTRO');
    setCurrentQuestionIndex(0);
    setAnswers({});
    localStorage.removeItem('ants_survey_step');
    localStorage.removeItem('ants_survey_answers');
    localStorage.removeItem('ants_survey_index');
  };

  const handleReset = () => {
    const ok = window.confirm("성향 진단을 처음부터 다시 시작하시겠습니까? 현재 진단 대시보드 내역은 초기화됩니다.");
    if (!ok) return;

    setStep('INTRO');
    setCurrentQuestionIndex(0);
    setAnswers({});
    localStorage.removeItem('ants_survey_step');
    localStorage.removeItem('ants_survey_answers');
    localStorage.removeItem('ants_survey_index');
  };

  const currentProfile = calculateRiskProfile(answers);

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

      {step === 'RESULTS' && (
        <ResultsScreen
          theme={theme}
          profile={currentProfile}
          onReset={handleReset}
          toggleTheme={toggleTheme}
        />
      )}
    </main>
  );
}
