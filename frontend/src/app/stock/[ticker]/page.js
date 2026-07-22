"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../components/layout/Header';
import Icon from '../../../components/Icon';

// 종목별 상세 Mock 데이터
const STOCK_DATA = {
  '005490': { name: 'POSCO홀딩스', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.4, weight: 12,
    evidences: [{ type: '공시', direction: '부정', title: '탄소 배출권 관련 비용 증가 공시' }],
    sparkline: [285000,282000,279000,281000,278000,276000,275200],
    aiBriefing: 'POSCO홀딩스는 탄소 배출 규제 강화에 따른 비용 증가 압박이 지속되고 있습니다. 철강 업황 둔화와 맞물려 단기 하락 압력이 있으나, 수소환원제철 전환 투자로 중장기 긍정 신호도 공존합니다.',
  },
  '068270': { name: '셀트리온', weather: 'sunny', direction: 'up', confidence: 'weak', change: 0.3, weight: 13,
    evidences: [],
    sparkline: [195000,197000,199000,198000,200000,201000,202400],
    aiBriefing: '임상 3상 중간 결과 발표 지연이 일부 불확실성을 키우고 있으나, 기존 바이오시밀러 라인업의 글로벌 판매 호조로 기초 체력은 견고합니다.',
  },
  '055550': { name: '신한지주', weather: 'sunny', direction: 'up', confidence: 'medium', change: 1.0, weight: 12,
    evidences: [{ type: '재무', direction: '긍정', title: '금리 방어선 유지 및 대출 포트폴리오 성장세 지속' }],
    sparkline: [47200,47500,47800,47600,48100,48400,48900],
    aiBriefing: '고금리 환경에서 순이자마진(NIM) 방어에 성공하며 안정적인 이익 성장이 지속되고 있습니다. 대출 포트폴리오 성장과 건전성 지표 개선이 긍정 요인입니다.',
  },
  '000270': { name: '기아', weather: 'sunny', direction: 'up', confidence: 'weak', change: 0.2, weight: 12,
    evidences: [],
    sparkline: [109000,110000,109500,111000,112000,111500,112300],
    aiBriefing: '전기차 전환 가속화와 SUV 라인업 강화로 글로벌 수요가 확대되고 있습니다. 원화 약세 효과도 수출 실적에 긍정적입니다.',
  },
  '051910': { name: 'LG화학', weather: 'cloudy', direction: 'down', confidence: 'medium', change: -0.7, weight: 13,
    evidences: [{ type: '공시', direction: '부정', title: '교환사채 2,000억 규모 발행' }],
    sparkline: [348000,344000,341000,339000,336000,334000,332500],
    aiBriefing: '교환사채 발행으로 단기 재무 부담이 증가하고 있습니다. 배터리 소재 부문의 수익성 개선은 긍정적이나, 전반적인 화학 업황 부진이 지속되고 있습니다.',
  },
  '028260': { name: '삼성물산', weather: 'sunny', direction: 'up', confidence: 'weak', change: 0.1, weight: 12,
    evidences: [],
    sparkline: [115000,115500,116000,115800,116200,116500,116800],
    aiBriefing: '건설 부문 해외 수주 회복과 상사 부문 자원 트레이딩 이익 개선으로 안정적인 실적을 유지하고 있습니다.',
  },
  '017670': { name: 'SK텔레콤', weather: 'sunny', direction: 'up', confidence: 'medium', change: 0.8, weight: 13,
    evidences: [{ type: '재무', direction: '긍정', title: 'AI 기반 B2B 서비스 매출 성장' }],
    sparkline: [52500,53000,53400,53200,54000,54500,55100],
    aiBriefing: 'AI 인프라 투자와 B2B 서비스 확장으로 통신 본업 외 신성장 동력이 가시화되고 있습니다. 안정적인 배당 정책도 장기 투자자에게 매력적입니다.',
  },
  '010950': { name: 'S-Oil', weather: 'rainy', direction: 'down', confidence: 'weak', change: -0.3, weight: 13,
    evidences: [{ type: 'ESG', direction: '부정', title: '정제마진 하락 및 유가 변동성 확대' }],
    sparkline: [78000,76500,75000,74200,73800,73200,72800],
    aiBriefing: '정제마진 하락과 글로벌 유가 변동성 확대로 단기 실적 압박이 예상됩니다. 샤힌 프로젝트(석유화학 설비) 완공 이후의 중장기 성장 기대감은 유지됩니다.',
  },
};

const DEFAULT_STOCK = {
  name: '알 수 없는 종목', weather: 'cloudy', direction: 'down', confidence: 'weak', change: 0, weight: 0,
  evidences: [], sparkline: [100,100,100,100,100,100,100], aiBriefing: '데이터를 불러올 수 없습니다.',
};

const WEATHER_CFG = {
  sunny:   { icon: 'sun',       label: '맑음', color: 'text-amber-500' },
  cloudy:  { icon: 'cloud',     label: '구름', color: 'text-slate-500' },
  rainy:   { icon: 'cloudRain', label: '비',   color: 'text-blue-500'  },
  thunder: { icon: 'zap',       label: '번개', color: 'text-red-500'   },
};

export default function StockDetailPage() {
  const { ticker } = useParams();
  const [theme, setTheme] = useState('light');
  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }, [theme]);

  const stock = STOCK_DATA[ticker] || DEFAULT_STOCK;
  const wCfg = WEATHER_CFG[stock.weather] || WEATHER_CFG.cloudy;

  // 주가 스파크라인 계산
  const w = 320, h = 80;
  const sl = stock.sparkline;
  const min = Math.min(...sl), max = Math.max(...sl), range = max - min || 1;
  const points = sl.map((v, i) => {
    const x = (i / (sl.length - 1)) * w;
    const y = h - ((v - min) / range) * (h * 0.8) - h * 0.1;
    return `${x},${y}`;
  }).join(' ');

  const isUp = stock.direction === 'up';
  const lineColor = isDark ? (isUp ? '#69dbad' : '#ff8b8b') : (isUp ? '#3eb489' : '#ef4444');

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? 'bg-[#0d0f0d] text-[#e2e2e2]' : 'bg-[#f5f6f4] text-[#0f1713]'}`}>
      <Header isDark={isDark} toggleTheme={toggleTheme} showBack title={stock.name} />

      <main className="pt-14 pb-10 px-4 max-w-2xl mx-auto space-y-4">
        <div className="pt-6">
          {/* 종목 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{stock.name}</h1>
              <p className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{ticker}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1.5 ${wCfg.color}`}>
                <Icon name={wCfg.icon} className="w-5 h-5" />
                <span className="text-sm font-black">{wCfg.label}</span>
              </div>
              <span className={`text-sm font-black font-mono ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500'}`}>
                {isUp ? '▲ +' : '▼ '}{stock.change.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 주가 그래프 — 상세 페이지에만 노출 */}
          <div className={`rounded-2xl border p-5 mb-4 ${isDark ? 'bg-[#141615] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              최근 7거래일 주가
            </p>
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-20 w-full">
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={points + ` ${w},${h} 0,${h}`} fill="url(#stockGrad)" stroke="none" />
              <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex justify-between mt-2">
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {sl[0].toLocaleString()}원
              </span>
              <span className={`text-[10px] font-mono font-black ${isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500'}`}>
                {sl[sl.length-1].toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 보유 정보 */}
          <div className={`rounded-2xl border p-5 mb-4 grid grid-cols-3 gap-4 ${isDark ? 'bg-[#141615] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            {[
              { label: '보유 비중', value: `${stock.weight}%` },
              { label: '전망', value: isUp ? '상승' : '하락', color: isUp ? (isDark ? 'text-[#69dbad]' : 'text-[#3eb489]') : 'text-red-500' },
              { label: '확신도', value: stock.confidence === 'strong' ? '강' : stock.confidence === 'medium' ? '중' : '약' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</p>
                <p className={`text-lg font-black mt-0.5 ${item.color || (isDark ? 'text-white' : 'text-[#0f1713]')}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* 위험 근거 */}
          {stock.evidences && stock.evidences.length > 0 && (
            <div className={`rounded-2xl border p-5 mb-4 ${isDark ? 'bg-[#141615] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className={`text-xs font-black mb-3 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>위험 근거</p>
              <div className="space-y-2">
                {stock.evidences.map((ev, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      ev.direction === '부정' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>{ev.type}</span>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{ev.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 브리핑 */}
          <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#0f2318] border-[#3eb489]/20' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-[#3eb489]/20'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="sparkles" className={`w-4 h-4 ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`} />
              <p className={`text-xs font-black ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>AI 브리핑</p>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {stock.aiBriefing}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
