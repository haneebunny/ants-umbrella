'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Icon from '../Icon';

const NAV_ITEMS = [
  { href: '/', icon: 'home', label: '홈 대시보드' },
  { href: '/diagnosis', icon: 'radar', label: '위험 진단' },
  { href: '/alerts', icon: 'bell', label: '위험 알림' },
  
  { href: '/onboarding', icon: 'trendingUp', label: '투자성향 재진단' },
];

/**
 * 공통 헤더 + 사이드 네비게이션 드로어
 */
export default function Header({ isDark, toggleTheme, alertCount = 0, showBack = false, title }) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const navigate = (href) => {
    closeDrawer();
    router.push(href);
  };

  return (
    <>
      {/* ── 상단 헤더 바 (사이드바 오른쪽 영역만 차지) ── */}
      <header
        className={`flex items-center fixed top-0 right-0 z-40 h-14 w-full lg:w-[calc(100%-208px)] transition-all ${isDark
          ? 'bg-[#080b08]/90 backdrop-blur-md border-b border-[#222422]'
          : 'bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm'
          }`}
      >
        {/* 헤더 내부 컨텐츠: 사이드바 공간을 비워둔 본문 헤더 정렬 */}
        <div className="flex justify-between items-center h-14 w-full max-w-[1920px] px-4 lg:px-6">
          {/* 좌측 */}
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => router.back()}
                aria-label="뒤로가기"
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                  }`}
              >
                <Icon name="arrowLeft" className="w-5 h-5" />
              </button>
            )}
            {!showBack && (
              <button
                onClick={openDrawer}
                aria-label="메뉴 열기"
                className={`p-2 rounded-full transition-colors lg:hidden ${isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                  }`}
              >
                <Icon name="menu" className="w-5 h-5" />
              </button>
            )}

            <div
              className="flex items-center gap-2 cursor-pointer lg:hidden"
              onClick={() => router.push('/')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/ants_umbrella_logo.png"
                alt="개미의 우산 로고"
                className="w-6 h-6 object-contain"
              />
              <span
                className={`font-sans text-base font-black tracking-tight ${isDark ? 'text-[#e2e2e2]' : 'text-[#0f1713]'
                  }`}
              >
                개미의 우산
              </span>
            </div>
          </div>

          {/* 우측 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/alerts')}
              aria-label="위험 알림"
              className={`relative p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                }`}
            >
              <Icon name="bell" className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>

            <button
              onClick={toggleTheme}
              aria-label="화면 테마 전환"
              className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 cursor-pointer relative flex items-center ${isDark ? 'bg-zinc-700 border border-zinc-600' : 'bg-slate-200 border border-slate-300'
                }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 transform ${isDark
                  ? 'translate-x-6 bg-[#3eb489] text-[#002115]'
                  : 'translate-x-0 bg-white text-amber-500 shadow-sm'
                  }`}
              >
                {isDark
                  ? <Icon name="moon" className="w-3 h-3" />
                  : <Icon name="sun" className="w-3 h-3" />
                }
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ── 모바일 사이드 드로어 오버레이 ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* ── 고정 사이드바 패널 (데스크톱: 좌측 상단 고정 z-50, 모바일: 슬라이드 z-70) ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-52 z-[70] lg:z-50 flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${isDark
            ? 'bg-[#111311] border-r border-[#222422]'
            : 'bg-white border-r border-slate-100 shadow-xl lg:shadow-none'
          }`}
      >
        {/* 사이드바 헤더 (로고) */}
        <div className={`flex items-center justify-between px-5 h-14 border-b flex-shrink-0 ${isDark ? 'border-[#222422]' : 'border-slate-100'}`}>
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate('/')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ants_umbrella_logo.png" alt="로고" className="w-7 h-7 object-contain" />
            <span className={`font-black text-base tracking-tight ${isDark ? 'text-[#e2e2e2]' : 'text-[#0f1713]'}`}>
              개미의 우산
            </span>
          </div>
          <button
            onClick={closeDrawer}
            aria-label="메뉴 닫기"
            className={`p-1.5 rounded-full transition-colors lg:hidden ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* 네비게이션 목록 */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${isActive
                  ? (isDark
                    ? 'bg-[#3eb489]/15 text-[#69dbad] font-bold'
                    : 'bg-[#3eb489]/10 text-[#3eb489] font-bold')
                  : (isDark
                    ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f1713]')
                  }`}
              >
                <Icon
                  name={item.icon}
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : ''}`}
                />
                <span className="text-xs font-bold">{item.label}</span>
                {isActive && (
                  <div className={`ml-auto w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#69dbad]' : 'bg-[#3eb489]'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* 사이드바 푸터 */}
        <div className={`px-4 py-4 border-t flex-shrink-0 ${isDark ? 'border-[#222422]' : 'border-slate-100'}`}>
          <p className={`text-[9px] font-black tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            개미의 우산 v0.2 · 주식 리스크 분석
          </p>
          <p className={`text-[9px] mt-0.5 tracking-tight ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            데이터는 매일 새벽 갱신됩니다
          </p>
        </div>
      </aside>
    </>
  );
}

