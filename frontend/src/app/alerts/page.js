"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../hooks/useTheme';
import Icon from '../components/Icon';

const INITIAL_ALERTS = [
  { id: 1, level: 'danger',  ticker: 'LG화학',    code: '051910', title: '교환사채 2,000억 규모 발행 공시',                       time: '오늘 09:12', read: false },
  { id: 2, level: 'danger',  ticker: '삼성전자',   code: '005930', title: '단기 설비 투자 차입금 증가 결정',                       time: '오늘 08:45', read: false },
  { id: 3, level: 'caution', ticker: 'POSCO홀딩스', code: '005490', title: '탄소 배출 규제 강화 관련 환경부 브리핑',               time: '어제 15:30', read: true  },
  { id: 4, level: 'caution', ticker: '셀트리온',   code: '068270', title: '임상 3상 중간 결과 발표 지연 안내',                     time: '어제 11:00', read: true  },
  { id: 5, level: 'info',    ticker: '신한지주',   code: '055550', title: '금리 방어선 유지 및 대출 포트폴리오 자산 성장세 지속',  time: '2일 전',     read: true  },
];

const LEVEL_CFG = {
  danger:  { icon: 'alertCircle',   label: '위험',   color: 'text-rose-500',   bg: 'bg-rose-50',   dark: 'bg-rose-900/30 text-rose-400', border: 'border-rose-200' },
  caution: { icon: 'alertTriangle', label: '주의',   color: 'text-amber-500',  bg: 'bg-amber-50',  dark: 'bg-amber-900/30 text-amber-400', border: 'border-amber-200' },
  info:    { icon: 'info',          label: '정보',   color: 'text-sky-500',    bg: 'bg-sky-50',    dark: 'bg-sky-900/30 text-sky-400', border: 'border-sky-200' },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AlertsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);

  // 백엔드 실시간 API 수집 알림 연동
  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetch(`${API_BASE}/api/alerts`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setAlerts(data.map((item, idx) => ({
              id: item.id || idx + 1,
              level: item.level || 'danger',
              ticker: item.ticker_name || item.ticker || '종목',
              code: item.ticker_code || item.ticker || '005930',
              title: item.title || item.news_title || 'ESG 위험 감지 알림',
              time: item.time || '방금 전',
              read: false
            })));
          }
        }
      } catch (e) {
        console.warn('[AlertsPage] API fetch fallback to preset mock:', e);
      }
    }
    loadAlerts();
  }, []);

  const unreadCount = alerts.filter(a => !a.read).length;

  // 모두 읽음 처리
  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  // 개별 읽음 처리 & 종목 상세 페이지 이동
  const handleAlertClick = (alert) => {
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a));
    if (alert.code) {
      router.push(`/stock/${alert.code}`);
    }
  };

  // 탭별 필터링
  const filteredAlerts = alerts.filter(a => {
    if (activeTab === 'all') return true;
    return a.level === activeTab;
  });

  return (
    <div className="w-full">
      <main className="pt-2 pb-10 px-1 max-w-4xl">
        {/* 헤더 & 모두 읽음 액션 */}
        <div className="pt-2 pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>위험 알림</h1>
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                  미확인 {unreadCount}
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {loading ? '알림을 불러오는 중이에요...' : '내 보유 종목 관련 주요 공시 및 ESG 위험 알림 리스트입니다. 🔔'}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              모두 읽음
            </button>
          )}
        </div>

        {/* ── 필터 탭 (전체 / 🚨 위험 / ⚠️ 주의 / ℹ️ 정보) ── */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: 'all',     label: '전체', count: alerts.length },
            { key: 'danger',  label: '🚨 위험', count: alerts.filter(a => a.level === 'danger').length },
            { key: 'caution', label: '⚠️ 주의', count: alerts.filter(a => a.level === 'caution').length },
            { key: 'info',    label: 'ℹ️ 정보', count: alerts.filter(a => a.level === 'info').length },
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-[#3eb489] text-white shadow-md'
                    : (isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50')
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : (isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500')
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 알림 리스트 ── */}
        <div className={`rounded-2xl border overflow-hidden transition-all ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              해당하는 알림 내역이 없습니다. ☀️
            </div>
          ) : (
            filteredAlerts.map((alert, idx) => {
              const cfg = LEVEL_CFG[alert.level] || LEVEL_CFG.info;
              const isLast = idx === filteredAlerts.length - 1;
              return (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`flex items-center justify-between gap-4 px-5 py-4 cursor-pointer transition-all ${
                    !isLast ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''
                  } ${!alert.read ? (isDark ? 'bg-white/5' : 'bg-slate-50/80') : (isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50')}`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* 아이콘 */}
                    <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDark ? cfg.dark.split(' ')[0] : cfg.bg
                    }`}>
                      <Icon name={cfg.icon} className={`w-4 h-4 ${isDark ? cfg.dark.split(' ')[1] : cfg.color}`} />
                    </div>

                    {/* 내용 */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black ${isDark ? cfg.dark.split(' ')[1] : cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                          {alert.ticker}
                        </span>
                        {!alert.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-ping" />
                        )}
                      </div>
                      <p className={`text-xs font-bold leading-relaxed truncate ${isDark ? 'text-slate-100' : 'text-[#0f1713]'}`}>
                        {alert.title}
                      </p>
                      <p className={`text-[10px] mt-1 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {alert.time}
                      </p>
                    </div>
                  </div>

                  {/* 우측: 직행 버튼 */}
                  <div className={`text-xs font-bold flex items-center gap-1 flex-shrink-0 transition-colors ${
                    isDark ? 'text-[#69dbad] group-hover:text-white' : 'text-[#3eb489] group-hover:text-[#2d966e]'
                  }`}>
                    <span>상세 리포트</span>
                    <Icon name="arrowRight" className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
