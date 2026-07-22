"use client";

import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Icon from '../components/Icon';

const MOCK_ALERTS = [
  { id: 1, level: 'danger',  ticker: 'LG화학',    title: '교환사채 2,000억 규모 발행 공시',                       time: '오늘 09:12', read: false },
  { id: 2, level: 'danger',  ticker: '삼성전자',   title: '단기 설비 투자 차입금 증가 결정',                       time: '오늘 08:45', read: false },
  { id: 3, level: 'caution', ticker: 'POSCO홀딩스', title: '탄소 배출 규제 강화 관련 환경부 브리핑',               time: '어제 15:30', read: true  },
  { id: 4, level: 'caution', ticker: '셀트리온',   title: '임상 3상 중간 결과 발표 지연 안내',                     time: '어제 11:00', read: true  },
  { id: 5, level: 'info',    ticker: '신한지주',   title: '금리 방어선 유지 및 대출 포트폴리오 자산 성장세 지속',  time: '2일 전',     read: true  },
];

const LEVEL_CFG = {
  danger:  { icon: 'alertCircle',   label: '위험',   color: 'text-red-500',    bg: 'bg-red-50',    dark: 'bg-red-900/20 text-red-400'  },
  caution: { icon: 'alertTriangle', label: '주의',   color: 'text-amber-500',  bg: 'bg-amber-50',  dark: 'bg-amber-900/20 text-amber-400' },
  info:    { icon: 'info',          label: '정보',   color: 'text-blue-500',   bg: 'bg-blue-50',   dark: 'bg-blue-900/20 text-blue-400'  },
};

export default function AlertsPage() {
  const [theme, setTheme] = useState('light');
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? 'bg-[#0d0f0d] text-[#e2e2e2]' : 'bg-[#f5f6f4] text-[#0f1713]'}`}>
      <Header isDark={isDark} toggleTheme={toggleTheme} showBack title="위험 알림" />

      <main className="pt-14 pb-10 px-4 max-w-2xl mx-auto">
        <div className="pt-6 pb-4">
          <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>위험 알림</h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            오늘 기준 미확인 알림 {MOCK_ALERTS.filter(a => !a.read).length}건
          </p>
        </div>

        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#141615] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
          {MOCK_ALERTS.map((alert, idx) => {
            const cfg = LEVEL_CFG[alert.level];
            const isLast = idx === MOCK_ALERTS.length - 1;
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                  !isLast ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-50') : ''
                } ${!alert.read ? (isDark ? 'bg-white/3' : 'bg-slate-50/70') : ''}`}
              >
                {/* 아이콘 */}
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDark ? cfg.dark.split(' ')[0] : cfg.bg
                }`}>
                  <Icon name={cfg.icon} className={`w-4 h-4 ${isDark ? cfg.dark.split(' ')[1] : cfg.color}`} />
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black ${isDark ? cfg.dark.split(' ')[1] : cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {alert.ticker}
                    </span>
                    {!alert.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm font-bold leading-snug ${isDark ? 'text-slate-200' : 'text-[#0f1713]'}`}>
                    {alert.title}
                  </p>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    {alert.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
