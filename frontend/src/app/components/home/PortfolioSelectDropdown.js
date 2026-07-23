'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '../Icon';

/**
 * ?�트?�리???�시 ?�택 ?�롭?�운
 * @param {Array}    props.presets          - PORTFOLIO_PRESETS 배열
 * @param {number}   props.selectedId       - ?�재 ?�택???�트?�리??id
 * @param {Function} props.onSelect         - ?�택 변�?콜백 (id) => void
 * @param {boolean}  props.isDark
 */
export default function PortfolioSelectDropdown({ presets, selectedId, onSelect, isDark }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = presets.find(p => p.id === selectedId) || presets[0];

  // ?��? ?�릭 ???�기
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* ?�리�?버튼 */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
          isDark
            ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
            : 'bg-white hover:bg-slate-50 text-[#0f1713] border border-slate-200 shadow-sm'
        }`}
      >
        <span>{selected.emoji}</span>
        <span className="hidden sm:inline">{selected.label}</span>
        <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
          {selected.totalLabel}
        </span>
        <Icon
          name="chevronRight"
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-90' : 'rotate-0'} ${
            isDark ? 'text-slate-400' : 'text-slate-400'
          }`}
        />
      </button>

      {/* ?�롭?�운 ?�널 */}
      {open && (
        <div
          className={`absolute top-full left-0 mt-2 z-50 min-w-[220px] rounded-2xl border shadow-2xl overflow-hidden ${
            isDark
              ? 'bg-[#1a1d1a] border-white/10'
              : 'bg-white border-slate-100'
          }`}
          style={{ animation: 'dropIn 0.15s ease-out' }}
        >
          <style>{`
            @keyframes dropIn {
              from { opacity: 0; transform: translateY(-8px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)    scale(1); }
            }
          `}</style>

          <div className={`px-3 py-2 border-b text-[10px] font-black uppercase tracking-widest ${
            isDark ? 'border-white/5 text-slate-500' : 'border-slate-50 text-slate-400'
          }`}>
            체험 ?�트?�리???�택
          </div>

          {presets.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                p.id === selectedId
                  ? isDark
                    ? 'bg-white/8 text-white'
                    : 'bg-[#f0faf5] text-[#0f1713]'
                  : isDark
                    ? 'hover:bg-white/5 text-slate-300'
                    : 'hover:bg-slate-50 text-[#0f1713]'
              }`}
            >
              <span className="text-xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">{p.label}</p>
                <p className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {p.totalLabel}
                </p>
              </div>
              {p.id === selectedId && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#3eb489] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
