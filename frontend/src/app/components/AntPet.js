"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const renderMessage = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-extrabold text-emerald-600 dark:text-emerald-400">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default function AntPet({ weather, portfolio }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSleeping, setIsSleeping] = useState(false); // 반투명 흔적 취침 모드 상태
  
  // 드래그 위치 제어 상태
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false); // 클릭과 드래그 오동작 방지

  // 날씨 상태에 따른 이미지 매핑 (사용자 지정 사양 반영)
  const getPetImage = (w) => {
    switch (w) {
      case 'sunny':
        return '/images/mimi/mimi_1.png'; // 맑음: mimi_1
      case 'cloudy':
        return '/images/mimi/mimi_2.png'; // 구름/흐림: mimi_2
      case 'rainy':
        return '/images/mimi/mimi_3.png'; // 비: mimi_3
      case 'thunder':
        return '/images/mimi/mimi_4.png'; // 천둥번개: mimi_4
      default:
        return '/images/mimi/mimi_1.png';
    }
  };


  // 나개미 페르소나에 부합하도록 직관적이고 부드러운 맑음/흐림/비/천둥번개 멘트 매핑
  useEffect(() => {
    if (!portfolio || portfolio.length === 0) {
      setMessage('반가워요! 주식 초보 나개미를 위한 우산 비서입니다. 종목을 등록하시면 분석을 시작할게요 🐜');
      return;
    }

    // 1. 천둥번개 (thunder)
    if (weather === 'thunder') {
      const disclosureStock = portfolio.find(stock => 
        stock.evidences && stock.evidences.some(ev => ev.type === '공시')
      );
      const strongDownStock = portfolio.find(stock => 
        stock.direction === 'down' && stock.confidence === 'strong'
      );

      if (disclosureStock) {
        const targetEv = disclosureStock.evidences.find(ev => ev.type === '공시');
        setMessage(`⚡ 번개 주의보! **${disclosureStock.name}** 종목에 중요한 공시가 감지되었어요. 지금 바로 대시보드를 들여다보시는 것을 추천해요!`);
      } else if (strongDownStock) {
        setMessage(`⚡ 폭풍우가 몰아쳐요! **${strongDownStock.name}**의 하락 압력이 매우 거세질 수 있으니 꼭 확인해보세요!`);
      } else {
        setMessage('⚡ 에구구! 기상 환경이 많이 흐려요. 리스크 알림 탭에서 종목별 이슈를 한 번 점검해 보시길 권장해요.');
      }
    }
    // 2. 비 (rainy)
    else if (weather === 'rainy') {
      const downStock = portfolio.find(stock => stock.direction === 'down');
      if (downStock) {
        setMessage(`🌧️ 비가 올 것 같아요! **${downStock.name}** 종목의 분위기가 무거우니 지금 바로 확인해보시길 추천드려요.`);
      } else {
        setMessage('🌧️ 포트폴리오에 비가 내릴 기세예요. 우산을 준비하듯 어떤 종목이 흐린지 한 번 쓱 살펴보세요!');
      }
    }
    // 3. 구름/흐림 (cloudy)
    else if (weather === 'cloudy') {
      const cautionStock = portfolio.find(stock => stock.direction === 'down');
      if (cautionStock) {
        setMessage(`⛅ 하늘에 구름이 조금 끼었네요. **${cautionStock.name}** 종목에 흐릿한 신호가 있으니 시간 날 때 한 번 가볍게 체크해 보세요!`);
      } else {
        setMessage('⛅ 오늘은 하늘이 살짝 흐리네요. 너무 무리해서 움직이기보다는 차분히 시장의 흐름을 관망해보아요.');
      }
    }
    // 4. 맑음 (sunny)
    else {
      setMessage('☀️ 와! 오늘의 포트폴리오 날씨가 아주 쨍쨍해요! 모든 종목이 평온하니 기분 좋게 지켜보셔도 좋겠어요 🐜');
    }
  }, [weather, portfolio]);

  // 포인터(마우스/터치) 드래그 핸들러
  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    setHasMoved(false);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // 최소 3픽셀 이상 움직였을 때만 드래그로 간주
    if (Math.abs(newX - position.x) > 3 || Math.abs(newY - position.y) > 3) {
      setHasMoved(true);
    }
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  return (
    <div 
      className="fixed right-8 bottom-24 z-50 flex flex-col items-end select-none"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.15s ease-out'
      }}
    >
      {isSleeping ? (
        /* 반투명한 취침 흔적 개미 (드래그 가능, 클릭 시 원래 크기로 깨어남) */
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(e) => {
            handlePointerUp(e);
            if (!hasMoved) {
              setIsSleeping(false);
              setIsOpen(true); // 깨어날 때 말풍선도 즉시 켜기
            }
          }}
          className="relative w-10 h-10 flex items-center justify-center cursor-pointer pointer-events-auto rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 opacity-30 hover:opacity-100 hover:scale-110 active:scale-95 transition-all duration-200 soft-shadow-light"
          title="개미 비서 깨우기"
          style={{ touchAction: 'none' }}
        >
          <span className="text-xl">🐜</span>
          {/* 잔잔한 소환 유도 펄스 링 */}
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20 animate-ping"></span>
        </div>
      ) : (
        /* 원래의 개미 펫과 말풍선 */
        <>
          {/* 말풍선 UI */}
          <div 
            className={`mb-4 max-w-[280px] p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-emerald-500/30 text-zinc-800 dark:text-zinc-100 text-sm font-medium shadow-xl transition-all duration-300 transform soft-shadow-light ${
              isOpen 
                ? 'opacity-100 translate-y-0 scale-100' 
                : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
            }`}
          >
            <div className="relative">
              <p className="leading-relaxed whitespace-pre-wrap pr-1">{renderMessage(message)}</p>
              
              {/* 하단 사라지기(취침모드 전환) 링크 버튼 */}
              <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSleeping(true);
                    setIsOpen(false);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-rose-500 cursor-pointer transition-colors flex items-center gap-0.5 pointer-events-auto"
                >
                  <span>❌ 이제 사라져.</span>
                </button>
              </div>

              {/* 말풍선 꼬리 */}
              <div className="absolute right-6 -bottom-5 w-0 h-0 border-8 border-transparent border-t-white/95 dark:border-t-zinc-900/95"></div>
              <div className="absolute right-6 -bottom-[21px] w-0 h-0 border-8 border-transparent border-t-emerald-500/30 -z-10"></div>
            </div>
          </div>

          {/* 둥둥 뜨는 펫 캐릭터 */}
          <div 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(e) => {
              handlePointerUp(e);
              if (!hasMoved) {
                setIsOpen(!isOpen);
              }
            }}
            className={`relative w-24 h-24 cursor-grab active:cursor-grabbing select-none ${
              isDragging ? '' : 'animate-float'
            } transition-transform duration-200 hover:scale-105 active:scale-95 pointer-events-auto`}
            title="마우스로 드래그해서 위치를 변경하고, 클릭해서 대화를 시작해봐요!"
            style={{ touchAction: 'none' }}
          >
            <Image 
              src={getPetImage(weather)} 
              alt="Ant Pet" 
              width={96}
              height={96}
              className="object-contain pointer-events-none"
              priority
            />
            {/* 알림 경보 배지 */}
            {!isOpen && (weather === 'thunder' || weather === 'rainy') && (
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
