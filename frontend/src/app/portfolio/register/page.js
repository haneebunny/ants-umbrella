"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Header from '../../components/layout/Header';
import Icon from '../../components/Icon';

// 종목 검색용 샘플 데이터 (실제 구현 시 API 연동)
const SAMPLE_STOCKS = [
  { ticker: '005930', name: '삼성전자' },
  { ticker: '000660', name: 'SK하이닉스' },
  { ticker: '005490', name: 'POSCO홀딩스' },
  { ticker: '068270', name: '셀트리온' },
  { ticker: '055550', name: '신한지주' },
  { ticker: '000270', name: '기아' },
  { ticker: '051910', name: 'LG화학' },
  { ticker: '028260', name: '삼성물산' },
  { ticker: '017670', name: 'SK텔레콤' },
  { ticker: '010950', name: 'S-Oil' },
  { ticker: '032830', name: '삼성생명' },
  { ticker: '033780', name: 'KT&G' },
  { ticker: '105560', name: 'KB금융' },
  { ticker: '005380', name: '현대차' },
  { ticker: '035420', name: 'NAVER' },
];

export default function PortfolioRegisterPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [holdings, setHoldings] = useState([]);

  const filtered = SAMPLE_STOCKS.filter(s =>
    (s.name.includes(search) || s.ticker.includes(search)) &&
    !holdings.find(h => h.ticker === s.ticker)
  );

  const addStock = (stock) => {
    setHoldings(prev => [...prev, { ...stock, quantity: 1 }]);
    setSearch('');
  };

  const removeStock = (ticker) => {
    setHoldings(prev => prev.filter(h => h.ticker !== ticker));
  };

  const updateQuantity = (ticker, qty) => {
    setHoldings(prev =>
      prev.map(h => h.ticker === ticker ? { ...h, quantity: Math.max(1, Number(qty)) } : h)
    );
  };

  const handleComplete = () => {
    localStorage.setItem('ants_portfolio', JSON.stringify(holdings));
    localStorage.setItem('ants_survey_complete', 'true');
    router.push('/');
  };

  return (
    <div className="w-full">
      <div className="pb-4">
        <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>포트폴리오 등록</h1>
        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          보유 중인 종목과 수량을 입력하세요. 실제 위험 분석에 사용됩니다.
        </p>
      </div>

      {/* 종목 검색 */}
      <div className={`rounded-2xl border p-4 mb-4 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        <p className={`text-xs font-black mb-3 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>종목 검색</p>
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <Icon name="search" className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="종목명 또는 코드 입력"
            className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-slate-600' : 'text-[#0f1713] placeholder-slate-400'}`}
          />
        </div>

        {/* 검색 결과 드롭다운 */}
        {search && filtered.length > 0 && (
          <div className={`mt-2 rounded-xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            {filtered.slice(0, 5).map((s, idx) => (
              <button
                key={s.ticker}
                onClick={() => addStock(s)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  idx > 0 ? (isDark ? 'border-t border-white/5' : 'border-t border-slate-50') : ''
                } ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
              >
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{s.name}</p>
                  <p className={`text-[11px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{s.ticker}</p>
                </div>
                <Icon name="plus" className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 보유 목록 */}
      <div className={`rounded-2xl border p-4 mb-4 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
        <p className={`text-xs font-black mb-3 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>등록된 보유 종목 ({holdings.length})</p>
        {holdings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            검색을 통해 종목을 추가하세요
          </div>
        ) : (
          <div className="space-y-3">
            {holdings.map((h, idx) => (
              <div
                key={h.ticker}
                className={`flex items-center justify-between py-2 ${
                  idx > 0 ? (isDark ? 'border-t border-white/5' : 'border-t border-slate-50') : ''
                }`}
              >
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{h.name}</p>
                  <p className={`text-[11px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{h.ticker}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center border rounded-xl overflow-hidden ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <input
                      type="number"
                      value={h.quantity}
                      onChange={e => updateQuantity(h.ticker, e.target.value)}
                      className={`w-14 text-center text-xs bg-transparent py-1.5 outline-none font-mono ${isDark ? 'text-white' : 'text-[#0f1713]'}`}
                    />
                    <span className={`text-[10px] pr-2.5 font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>주</span>
                  </div>
                  <button
                    onClick={() => removeStock(h.ticker)}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-50 text-slate-500'}`}
                  >
                    <Icon name="trash2" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleComplete}
        disabled={holdings.length === 0}
        className={`w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
          holdings.length === 0 ? 'opacity-40 cursor-not-allowed bg-slate-300' : ''
        } ${isDark ? 'bg-[#3eb489] text-[#0a1f14] hover:bg-[#69dbad]' : 'bg-[#3eb489] text-white hover:bg-[#2d966e] shadow-[0_4px_20px_rgba(62,180,137,0.3)]'}`}
      >
        {holdings.length === 0 ? '종목을 1개 이상 추가해주세요' : `${holdings.length}개 종목으로 분석 시작하기`}
      </button>

      {/* 건너뛰기 */}
      <button
        onClick={() => { localStorage.setItem('ants_survey_complete', 'true'); router.push('/'); }}
        className={`mt-3 w-full py-2.5 text-xs font-bold transition-colors ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}
      >
        나중에 등록하기 (샘플 데이터로 먼저 보기)
      </button>
    </div>
  );
}
