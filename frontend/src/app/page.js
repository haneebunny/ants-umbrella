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
    setStep('INTRO');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleReset = () => {
    setStep('INTRO');
    setCurrentQuestionIndex(0);
    setAnswers({});
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
