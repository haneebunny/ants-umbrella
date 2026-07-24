"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../hooks/useTheme';
import Header from '../components/layout/Header';
import Icon from '../components/Icon';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const LEVEL_CFG = {
  danger:  { icon: 'alertCircle',   label: '위험',   color: 'text-red-500',    bg: 'bg-red-50',    dark: 'bg-red-900/20 text-red-400'  },
  caution: { icon: 'alertTriangle', label: '주의',   color: 'text-amber-500',  bg: 'bg-amber-50',  dark: 'bg-amber-900/20 text-amber-400' },
  info:    { icon: 'info',          label: '정보',   color: 'text-blue-500',   bg: 'bg-blue-50',   dark: 'bg-blue-900/20 text-blue-400'  },
};

export default function AlertsPage() {
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetch(`${API_BASE}/api/alerts`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        }
      } catch (e) {
        console.warn('[AlertsPage] Failed to fetch alerts:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="w-full">
      <div className="pb-4">
        <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>위험 알림</h1>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {loading ? '알림을 불러오는 중이에요...' : `실시간 수집 및 분석 완료! 아직 확인 안 한 알림이 ${unreadCount}건 있어요! 🔔`}
        </p>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            실시간 위험 분석 알림을 열심히 싣고 오는 중이에요! 잠시만 기다려주세요! ⏳
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            최근 20거래일 동안 특별히 감지된 리스크 알림이 없어요! 평화로운 날씨랍니다. ☀️
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const cfg = LEVEL_CFG[alert.level] || LEVEL_CFG.info;
            const isLast = idx === alerts.length - 1;
            return (
              <div
                key={alert.id}
                onClick={() => {
                  if (alert.ticker_code) {
                    router.push(`/stock/${alert.ticker_code}`);
                  }
                }}
                className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer hover:bg-slate-500/5 ${
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
          })
        )}
      </div>
    </div>
  );
}
