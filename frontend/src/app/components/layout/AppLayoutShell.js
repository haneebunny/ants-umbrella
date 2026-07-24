'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Header from './Header';

export default function AppLayoutShell({ children }) {
  const { isDark, toggleTheme, mounted } = useTheme();
  const pathname = usePathname() || '';

  // 경로별 헤더 상단 타이틀 동적 결정
  let pageTitle = '개미의 우산';
  if (pathname === '/') pageTitle = '홈 대시보드';
  else if (pathname.startsWith('/stock/')) pageTitle = '종목 상세 분석';
  else if (pathname === '/diagnosis') pageTitle = '위험 진단';
  else if (pathname === '/alerts') pageTitle = '위험 알림';
  else if (pathname === '/portfolio/register') pageTitle = '포트폴리오 관리';
  else if (pathname === '/onboarding') pageTitle = '투자성향 진단';
  else if (pathname === '/onboarding/result') pageTitle = '투자성향 분석 결과';

  const isOnboarding = pathname === '/onboarding';

  // 테마 마운트 완료 전 플리커링 방지용 로딩 프레임
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#080b08] text-white flex items-center justify-center font-mono text-xs">
        Loading Ants Umbrella System...
      </div>
    );
  }

  // 온보딩(성향 테스트) 페이지는 사이드바/공통헤더가 없는 독립 풀스크린 레이아웃 제공
  // IntroScreen/SurveyScreen/ResultsScreen이 자체 고정 헤더와 레이아웃을 관리하므로 그대로 통과
  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      isDark ? 'bg-[#080b08] text-[#e2e2e2]' : 'bg-[#f5f6f4] text-[#0f1713]'
    }`}>
      {/* 글로벌 통합 헤더 및 사이드바 */}
      <Header isDark={isDark} toggleTheme={toggleTheme} title={pageTitle} />

      {/* 심플한 사이드바 패딩 오프셋 및 중앙 정렬 본문 컨테이너 */}
      <div className="w-full lg:pl-52 min-h-screen">
        <main className="w-full pt-14 px-4 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
