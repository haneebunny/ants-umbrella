"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../hooks/useTheme';
import Header from '../components/layout/Header';
import Icon from '../components/Icon';
import { DEMO_PROFILE, riskRadar as mockRiskRadar } from '../data/mockData';

export default function DiagnosisPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(DEMO_PROFILE);

  // 시뮬레이터 비중 조절 상태 (기본 25% ➔ 사용자가 실시간 조절 가능)
  const [highRiskWeight, setHighRiskWeight] = useState(25);

  useEffect(() => {
    const saved = localStorage.getItem('ants_result_profile');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch { /* noop */ }
    }
  }, []);

  // 성향 기반 허용 위험 수준 (0~100)
  const bandToTolerance = {
    CONSERVATIVE: 20, MODERATE_CONSERVATIVE: 40,
    BALANCED: 55, GROWTH: 75, AGGRESSIVE: 90,
  };
  const userTolerance = bandToTolerance[profile?.target_risk_band] || 55;

  // 슬라이더 변경에 따른 실시간 포트폴리오 위험 시뮬레이션 연산
  const baseRisk = mockRiskRadar.currentPortfolioRisk;
  // 비중 조절에 따라 위험점수 변동 (25% 기본 대비 ± 1.2배 비례 연산)
  const simulatedRisk = Math.max(10, Math.min(100, Math.round(baseRisk + (highRiskWeight - 25) * 0.8)));

  const riskStatus = simulatedRisk <= userTolerance * 0.85 ? 'safe'
    : simulatedRisk <= userTolerance ? 'caution' : 'danger';

  const statusCfg = {
    safe:    { label: '안전',    color: 'text-[#3eb489]',  bg: 'bg-[#3eb489]/10',  border: 'border-[#3eb489]/30', weather: '맑음 ☀️' },
    caution: { label: '주의',    color: 'text-amber-500',   bg: 'bg-amber-500/10', border: 'border-amber-400/30',  weather: '구름 ⛅' },
    danger:  { label: '위험',    color: 'text-rose-500',    bg: 'bg-rose-500/10',   border: 'border-rose-400/30',   weather: '번개 ⚡' },
  };
  const sCfg = statusCfg[riskStatus];

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? 'bg-[#080b08] text-[#e2e2e2]' : 'bg-[#f0f2f0] text-[#0f1713]'}`}>
      <Header isDark={isDark} toggleTheme={toggleTheme} title="위험 진단" />

      <main className="pt-14 pb-10 px-4 max-w-4xl lg:ml-60 lg:w-[calc(100%-240px)]">

        {/* ── 2단계 탭 내비게이션 ── */}
        <div className="pt-6 pb-4 flex items-center gap-2">
          <button
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              isDark ? 'bg-[#3eb489]/20 text-[#69dbad]' : 'bg-[#3eb489]/10 text-[#3eb489]'
            }`}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black" style={{backgroundColor: isDark ? '#69dbad' : '#3eb489'}}>1</span>
            위험 레이더 시뮬레이터
          </button>

          <Icon name="arrowRight" className={`w-3.5 h-3.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />

          <button
            onClick={() => router.push('/diagnosis/weather')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              isDark ? 'bg-white/5 text-slate-500 hover:text-slate-300' : 'bg-white text-slate-400 border border-slate-200 hover:text-slate-600'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-white text-[9px] font-black">2</span>
            포트폴리오 날씨
          </button>
        </div>

        {/* ── 메인 위험 레이더 카드 ── */}
        <div className={`rounded-2xl border p-6 space-y-6 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>위험 레이더</p>
              <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                내 성향 대비 포트폴리오 위험 수준
              </h1>
            </div>
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black border ${sCfg.bg} ${sCfg.border} ${sCfg.color}`}>
              <Icon name={riskStatus === 'safe' ? 'shieldCheck' : riskStatus === 'caution' ? 'alertTriangle' : 'alertCircle'} className="w-4 h-4" />
              <span>{sCfg.label} ({sCfg.weather})</span>
            </div>
          </div>

          {/* 게이지 바 비교 */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>내 성향 허용치 ({profile?.titleKo || '균형투자형'})</span>
                <span className={`font-black font-mono ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>{userTolerance}점</span>
              </div>
              <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <div className="h-full rounded-full bg-[#3eb489] transition-all duration-700" style={{ width: `${userTolerance}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>시뮤레이션 포트폴리오 위험</span>
                <span className={`font-black font-mono ${sCfg.color}`}>{simulatedRisk}점</span>
              </div>
              <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <div className={`h-full rounded-full transition-all duration-500 ${riskStatus === 'safe' ? 'bg-[#3eb489]' : riskStatus === 'caution' ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${simulatedRisk}%` }} />
              </div>
            </div>
          </div>

          {/* ── 🎛️ 라이브 리스크 시뮬레이터 (슬라이더) ── */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                🎛️ 고위험 종목(POSCO홀딩스 등) 비중 조절 시뮬레이션
              </span>
              <span className={`text-xs font-black font-mono ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>
                {highRiskWeight}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={highRiskWeight}
              onChange={(e) => setHighRiskWeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-300 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#3eb489]"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5% (최저 위험)</span>
              <span>25% (현재)</span>
              <span>50% (최고 위험)</span>
            </div>
          </div>

          {/* ── ☂️ 개미 펫의 AI 처방전 스마트 카드 ── */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            riskStatus === 'safe'
              ? (isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
              : (isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800')
          }`}>
            <span className="text-xl">☂️</span>
            <div>
              <p className="text-xs font-black mb-1">개미 펫의 실시간 처방전</p>
              <p className="text-xs leading-relaxed opacity-95">
                {riskStatus === 'safe'
                  ? `고위험 종목 비중이 ${highRiskWeight}%로 안전하게 유지되어 포트폴리오 날씨가 '맑음' 상태입니다. 현재 비율을 지속 유지하세요!`
                  : `고위험 종목 비중이 ${highRiskWeight}%로 높아 성향 허용치(${userTolerance}점)에 근접했습니다. 비중을 15% 이하로 낮추시면 포트폴리오 날씨가 '맑음'으로 회복됩니다.`}
              </p>
            </div>
          </div>
        </div>

        {/* 다음 단계 이동 */}
        <button
          onClick={() => router.push('/diagnosis/weather')}
          className={`mt-6 w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
            isDark ? 'bg-[#3eb489] text-[#0a1f14] hover:bg-[#69dbad]' : 'bg-[#3eb489] text-white hover:bg-[#2d966e] shadow-[0_4px_20px_rgba(62,180,137,0.3)]'
          }`}
        >
          다음 단계: 포트폴리오 종합 날씨 상세 보기
          <Icon name="arrowRight" className="w-4 h-4" />
        </button>
      </main>
    </div>
  );
}
