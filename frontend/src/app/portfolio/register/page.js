"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import Header from '../../components/layout/Header';
import Icon from '../../components/Icon';

// 종목 검색용 데이터
const SAMPLE_STOCKS = [
  { ticker: '005930', name: '삼성전자',        category: '테크' },
  { ticker: '000660', name: 'SK하이닉스',      category: '테크' },
  { ticker: '005490', name: 'POSCO홀딩스',     category: '소재' },
  { ticker: '068270', name: '셀트리온',        category: '바이오' },
  { ticker: '055550', name: '신한지주',        category: '금융' },
  { ticker: '000270', name: '기아',            category: '자동차' },
  { ticker: '051910', name: 'LG화학',          category: '화학' },
  { ticker: '028260', name: '삼성물산',        category: '건설' },
  { ticker: '017670', name: 'SK텔레콤',       category: '통신' },
  { ticker: '010950', name: 'S-Oil',           category: '에너지' },
  { ticker: '033780', name: 'KT&G',            category: '소비재' },
  { ticker: '035420', name: 'NAVER',           category: '플랫폼' },
];

// 원클릭 템플릿 프리셋
const PRESET_TEMPLATES = [
  {
    id: 'stable',
    name: '🛡️ 배당안정형',
    desc: '금융·통신 우량주 중심',
    items: [
      { ticker: '055550', name: '신한지주', quantity: 50 },
      { ticker: '017670', name: 'SK텔레콤', quantity: 40 },
      { ticker: '028260', name: '삼성물산', quantity: 30 },
    ],
  },
  {
    id: 'growth',
    name: '🚀 AI테크성장형',
    desc: '반도체·플랫폼 중심',
    items: [
      { ticker: '000660', name: 'SK하이닉스', quantity: 30 },
      { ticker: '005930', name: '삼성전자',   quantity: 50 },
      { ticker: '035420', name: 'NAVER',      quantity: 20 },
    ],
  },
  {
    id: 'esg',
    name: '🌿 ESG다각화형',
    desc: '2차전지·친환경 중심',
    items: [
      { ticker: '051910', name: 'LG화학',      quantity: 20 },
      { ticker: '005490', name: 'POSCO홀딩스', quantity: 25 },
      { ticker: '033780', name: 'KT&G',        quantity: 30 },
    ],
  },
];

// Donut Chart 색상 파스텔 팔레트
const PIE_COLORS = ['#3eb489', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export default function PortfolioRegisterPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [holdings, setHoldings] = useState([]);

  // 마운트 시 기존 포트폴리오 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ants_portfolio');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setHoldings(parsed);
      }
    } catch { /* noop */ }
  }, []);

  const filtered = SAMPLE_STOCKS.filter(s =>
    (s.name.includes(search) || s.ticker.includes(search)) &&
    !holdings.find(h => h.ticker === s.ticker)
  );

  const addStock = (stock) => {
    setHoldings(prev => [...prev, { ...stock, quantity: 10 }]);
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

  // 프리셋 불러오기
  const applyPreset = (preset) => {
    setHoldings(preset.items);
  };

  const handleComplete = () => {
    localStorage.setItem('ants_portfolio', JSON.stringify(holdings));
    localStorage.setItem('ants_survey_complete', 'true');
    router.push('/');
  };

  // 총 주식 수량 계산 및 도넛 비중 계산
  const totalQuantity = holdings.reduce((sum, h) => sum + (Number(h.quantity) || 0), 0);
  const pieSegments = holdings.map((h, i) => {
    const qty = Number(h.quantity) || 0;
    const pct = totalQuantity > 0 ? (qty / totalQuantity) * 100 : 0;
    return { ...h, pct, color: PIE_COLORS[i % PIE_COLORS.length] };
  });

  // SVG 도넛 경로 계산 (React 19 Immutability 규칙 준수)
  const piePaths = pieSegments.reduce((acc, seg) => {
    const angle = (seg.pct / 100) * 360;
    const startAngle = acc.angle;
    const endAngle = acc.angle + angle;

    const r = 40;
    const cx = 50, cy = 50;

    const x1 = cx + r * Math.sin((startAngle * Math.PI) / 180);
    const y1 = cy - r * Math.cos((startAngle * Math.PI) / 180);
    const x2 = cx + r * Math.sin((endAngle * Math.PI) / 180);
    const y2 = cy - r * Math.cos((endAngle * Math.PI) / 180);

    const largeArc = angle > 180 ? 1 : 0;
    const d = angle === 360
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`
      : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

    return {
      angle: endAngle,
      paths: [...acc.paths, { ...seg, d }]
    };
  }, { angle: 0, paths: [] }).paths;

  return (
    <div className="w-full">
      <main className="pt-2 pb-10 px-1 max-w-5xl">
        {/* 헤더 안내 */}
        <div className="pt-2 pb-4">
          <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>포트폴리오 등록 및 관리</h1>
          <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            보유 종목과 수량을 등록하시면 실시간 위험 날씨 및 ESG 진단 분석을 제공합니다. 🐜
          </p>
        </div>

        {/* ── 1초 원클릭 템플릿 불러오기 프리셋 ── */}
        <div className="mb-4">
          <p className={`text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            ⚡ 원클릭 템플릿 자동 입력
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESET_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => applyPreset(tpl)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/5 hover:border-[#3eb489]/50 hover:bg-white/10'
                    : 'bg-white border-slate-200 hover:border-[#3eb489] hover:bg-slate-50 shadow-sm'
                }`}
              >
                <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{tpl.name}</p>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{tpl.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── 2컬럼 레이아웃 (좌: 검색 및 목록 7칸 / 우: 실시간 비중 도넛 5칸) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* ┌── 좌측 (7칸) — 검색 및 종목 입력 목록 ──┐ */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* 종목 검색 입력창 */}
            <div className={`rounded-2xl border p-4 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <p className={`text-xs font-black mb-3 ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>종목 검색 추가</p>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <Icon name="search" className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="삼성전자, SK하이닉스 등 검색..."
                  className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder-slate-600' : 'text-[#0f1713] placeholder-slate-400'}`}
                />
              </div>

              {/* 검색 결과 */}
              {search && filtered.length > 0 && (
                <div className={`mt-2 rounded-xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                  {filtered.slice(0, 5).map((s, idx) => (
                    <button
                      key={s.ticker}
                      onClick={() => addStock(s)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                        idx > 0 ? (isDark ? 'border-t border-white/5' : 'border-t border-slate-50') : ''
                      } ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                    >
                      <div>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{s.name}</span>
                        <span className={`text-[10px] font-mono ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.ticker}</span>
                      </div>
                      <Icon name="plus" className={`w-4 h-4 ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 등록된 종목 목록 */}
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-slate-50'}`}>
                <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  등록된 종목 ({holdings.length}개)
                </p>
                {holdings.length > 0 && (
                  <button
                    onClick={() => setHoldings([])}
                    className={`text-[11px] font-bold ${isDark ? 'text-rose-400 hover:underline' : 'text-rose-500 hover:underline'}`}
                  >
                    전체 삭제
                  </button>
                )}
              </div>

              {holdings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  위에서 종목을 검색하거나 템플릿을 선택하세요.
                </div>
              ) : (
                holdings.map((h, idx) => (
                  <div
                    key={h.ticker}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      idx < holdings.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-50') : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>{h.name}</p>
                    </div>

                    {/* 수량 조절 버튼 */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(h.ticker, h.quantity - 5)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                      >−</button>
                      <input
                        type="number"
                        value={h.quantity}
                        onChange={e => updateQuantity(h.ticker, e.target.value)}
                        className={`w-14 text-center text-xs font-black font-mono rounded-lg py-1 border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-[#0f1713]'}`}
                      />
                      <button
                        onClick={() => updateQuantity(h.ticker, h.quantity + 5)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                      >＋</button>
                      <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>주</span>
                    </div>

                    {/* 삭제 */}
                    <button
                      onClick={() => removeStock(h.ticker)}
                      className={`p-1 rounded-lg transition-colors ${isDark ? 'text-slate-600 hover:text-rose-400' : 'text-slate-300 hover:text-rose-500'}`}
                    >
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* 저장/완료 버튼 */}
            <button
              onClick={handleComplete}
              disabled={holdings.length === 0}
              className={`w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
                holdings.length === 0
                  ? (isDark ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')
                  : (isDark
                      ? 'bg-[#3eb489] text-[#0a1f14] hover:bg-[#69dbad]'
                      : 'bg-[#3eb489] text-white hover:bg-[#2d966e] shadow-[0_4px_20px_rgba(62,180,137,0.3)]')
              }`}
            >
              <Icon name="check" className="w-4 h-4" />
              {holdings.length === 0 ? '종목을 1개 이상 추가해주세요' : `${holdings.length}개 종목으로 진단 시작하기`}
            </button>
          </div>

          {/* └── 우측 (5칸) — 실시간 비중 도넛 프리뷰 ──┘ */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#1e2220] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                  포트폴리오 비중 프리뷰
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-[#69dbad]' : 'bg-emerald-50 text-[#3eb489]'}`}>
                  라이브 연동
                </span>
              </div>

              {/* 도넛 SVG 차트 */}
              <div className="relative w-44 h-44 mx-auto my-2 flex items-center justify-center">
                {pieSegments.length > 0 ? (
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {piePaths.map((seg) => (
                      <path
                        key={seg.ticker}
                        d={seg.d}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="16"
                        className="transition-all duration-300"
                      />
                    ))}
                  </svg>
                ) : (
                  <div className={`w-36 h-36 rounded-full border-4 border-dashed flex items-center justify-center ${isDark ? 'border-white/10 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
                    <span className="text-xs font-bold">비중 비어있음</span>
                  </div>
                )}

                {/* 중앙 텍스트 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>총 보유</span>
                  <span className={`text-lg font-black font-mono ${isDark ? 'text-white' : 'text-[#0f1713]'}`}>
                    {holdings.length}개
                  </span>
                </div>
              </div>

              {/* 종목별 비중범주 레전드 목록 */}
              <div className="space-y-2 mt-4 pt-3 border-t border-white/5">
                {pieSegments.map(seg => (
                  <div key={seg.ticker} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className={`font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{seg.name}</span>
                    </div>
                    <span className={`font-mono font-black ${isDark ? 'text-[#69dbad]' : 'text-[#3eb489]'}`}>
                      {seg.pct.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
=======
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
