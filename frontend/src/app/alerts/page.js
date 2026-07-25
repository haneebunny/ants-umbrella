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
  // ── ⚙️ 알림 설정 관련 상태 ──────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [alertTimes, setAlertTimes] = useState(['07:00']);
  const [categories, setCategories] = useState({
    price_risk: true,
    esg_news: true,
    disclosure: true
  });
  
  // 변경 사항 저장을 위한 임시 상태 (딸깍할 때마다 요청가지 않게 제어)
  const [tempAlertTimes, setTempAlertTimes] = useState(['07:00']);
  const [tempCategories, setTempCategories] = useState({
    price_risk: true,
    esg_news: true,
    disclosure: true
  });
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 백엔드 실시간 API 수집 알림 연동
  async function loadAlerts() {
    setLoading(true);
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
            read: false,
            category: item.category
          })));
        } else {
          setAlerts([]);
        }
      }
    } catch (e) {
      console.warn('[AlertsPage] API fetch fallback to preset mock:', e);
    } finally {
      setLoading(false);
    }
  }

  // 설정 및 알림 목록 로드
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch(`${API_BASE}/api/settings/alert-config`);
        if (res.ok) {
          const data = await res.json();
          if (data.alert_times) {
            setAlertTimes(data.alert_times);
            setTempAlertTimes(data.alert_times);
          }
          if (data.categories) {
            setCategories(data.categories);
            setTempCategories(data.categories);
          }
        }
      } catch (e) {
        console.warn('[AlertsPage] Failed to fetch settings config:', e);
      }
    }
    loadConfig();
    loadAlerts();
  }, []);

  // 설정 저장 API 호출
  const saveConfig = async () => {
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/api/settings/alert-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_times: tempAlertTimes, categories: tempCategories })
      });
      if (res.ok) {
        setAlertTimes(tempAlertTimes);
        setCategories(tempCategories);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        // 백엔드 필터링이 즉각 반영되도록 알림 목록 다시 리로드
        await loadAlerts();
      }
    } catch (e) {
      console.warn('[AlertsPage] Failed to save config:', e);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCategoryToggle = (key) => {
    setTempCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTimeClick = (time) => {
    if (tempAlertTimes.includes(time)) {
      if (tempAlertTimes.length === 1) return; // 최소 1개 필수
      setTempAlertTimes(prev => prev.filter(t => t !== time));
    } else {
      if (tempAlertTimes.length >= 3) return; // 최대 3개 제한
      setTempAlertTimes(prev => [...prev, time]);
    }
  };

  const handleSettingsToggle = () => {
    if (!showSettings) {
      // 열 때는 저장된 최신 설정으로 임시 상태 동기화
      setTempAlertTimes(alertTimes);
      setTempCategories(categories);
    }
    setShowSettings(!showSettings);
  };

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

  // 탭별 필터링 + 카테고리 필터링
  const getAlertCategory = (title) => {
    const t = title.toLowerCase();
    if (t.includes('공시') || t.includes('사채') || t.includes('증자') || t.includes('발행') || t.includes('결정') || t.includes('보고서')) return 'disclosure';
    if (t.includes('esg') || t.includes('환경') || t.includes('지배구조') || t.includes('노사') || t.includes('탄소') || t.includes('상생')) return 'esg_news';
    return 'price_risk';
  };

  const filteredAlerts = alerts.filter(a => {
    const cat = a.category || getAlertCategory(a.title);
    if (!categories[cat]) return false;
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

          <div className="flex items-center gap-2 flex-shrink-0">
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
            <button
              onClick={handleSettingsToggle}
              className={`p-1.5 rounded-xl border transition-all ${
                showSettings
                  ? 'bg-[#3eb489] border-[#3eb489] text-white'
                  : (isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm')
              }`}
              title="알림 스케줄 및 필터 설정"
            >
              <Icon name="settings" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── ⚙️ 알림 시간 및 카테고리 설정 패널 (Glassmorphism Slide-Down) ── */}
        {showSettings && (
          <div className={`mb-5 p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
            isDark 
              ? 'bg-white/5 border-white/10 text-slate-200' 
              : 'bg-slate-50/90 border-slate-100 text-slate-700 shadow-inner'
          }`}>
            <h2 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Icon name="settings" className="w-4 h-4 text-[#3eb489]" />
              알림 환경 설정 (저장 전 임시 변경)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 좌측: 알림 수신 카테고리 */}
              <div className="space-y-3">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>알림 수신 카테고리</p>
                
                {[
                  { key: 'price_risk', label: '📈 주가 급락 위험 리스크', desc: '모델 예측 하락확률 임계치 도달 알림' },
                  { key: 'esg_news', label: '📰 ESG 악재 및 평판 뉴스', desc: 'Materiality 매핑 ESG 부정 노이즈 알림' },
                  { key: 'disclosure', label: '🔔 중요 기업 공시 시그널', desc: '증자, 전환사채, 상장폐지 우려 공시 알림' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.desc}</p>
                    </div>
                    {/* iOS 스타일 토글 스위치 */}
                    <button
                      onClick={() => handleCategoryToggle(item.key)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 ${
                        tempCategories[item.key] ? 'bg-[#3eb489]' : (isDark ? 'bg-white/10' : 'bg-slate-200')
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        tempCategories[item.key] ? 'translate-x-5.5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* 우측: 알림 수신 시간 스케줄 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>알림 수신 시간 (최대 3개)</p>
                  <span className="text-[10px] font-bold text-[#3eb489]">선택됨 {tempAlertTimes.length}/3</span>
                </div>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  지정한 시간마다 최신 마켓 및 ESG 데이터를 분석해 슬랙 알림을 보냅니다.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['07:00', '09:00', '10:00', '10:20', '12:00', '15:00', '18:00', '21:00'].map(time => {
                    const isSelected = tempAlertTimes.includes(time);
                    const isDisabled = !isSelected && tempAlertTimes.length >= 3;
                    return (
                      <button
                        key={time}
                        disabled={isDisabled}
                        onClick={() => handleTimeClick(time)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                          isSelected
                            ? 'bg-[#3eb489] text-white shadow-sm'
                            : isDisabled
                              ? (isDark ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed')
                              : (isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50')
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 하단 제어 버튼 영역 */}
            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-200/50 dark:border-white/5">
              <button
                onClick={() => setShowSettings(false)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                닫기
              </button>
              <button
                onClick={saveConfig}
                disabled={saveLoading}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl bg-[#3eb489] text-white hover:bg-[#349c76] transition-all flex items-center gap-1.5 ${
                  saveLoading ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Icon name="check" className="w-3.5 h-3.5" />
                    저장 완료!
                  </>
                ) : saveLoading ? (
                  '저장 중...'
                ) : (
                  '설정 저장'
                )}
              </button>
            </div>
          </div>
        )}

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
