"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AntPet({ weather, portfolio }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  // 날씨 상태에 따른 이미지 매핑 (사용자 지시: mimi_0 제외, mimi_1~4 매핑)
  const getPetImage = (w) => {
    switch (w) {
      case 'sunny':
        return '/images/mimi/mimi_2.png'; // 맑음: 썬캡 무지개 개미
      case 'cloudy':
        return '/images/mimi/mimi_3.png'; // 구름/흐림: 손 흔드는 개미
      case 'rainy':
        return '/images/mimi/mimi_4.png'; // 비: 우비 입은 개미
      case 'thunder':
        return '/images/mimi/mimi_1.png'; // 천둥번개: 먹구름 아래 시무룩 개미
      default:
        return '/images/mimi/mimi_3.png';
    }
  };

  // 날씨와 포트폴리오 상태에 따른 나개미 브리핑 멘트 동적 생성
  useEffect(() => {
    if (!portfolio || portfolio.length === 0) {
      setMessage('반가워요! 주식 초보 나개미를 위한 우산 비서입니다. 종목을 등록하시면 분석을 시작할게요 🐜');
      return;
    }

    // 1. 천둥번개 (thunder) 상태의 긴급 알람 추출
    if (weather === 'thunder') {
      // 공시 보조 신호가 감지된 종목이 있는지 탐색
      const disclosureStock = portfolio.find(stock => 
        stock.evidences && stock.evidences.some(ev => ev.type === '공시')
      );
      
      // 하락 확신도 강(strong)인 종목 탐색
      const strongDownStock = portfolio.find(stock => 
        stock.direction === 'down' && stock.confidence === 'strong'
      );

      if (disclosureStock) {
        const targetEv = disclosureStock.evidences.find(ev => ev.type === '공시');
        setMessage(`⚡ 긴급 비상! [${disclosureStock.stock_name}]에 자본/재무 위기 관련 공시(${targetEv.title})가 포착되었어요! 투자 비중을 꼭 체크해 보세요!`);
      } else if (strongDownStock) {
        setMessage(`⚡ 천둥번개 주의보! [${strongDownStock.stock_name}]의 다음 거래일 하락 예측 확신도가 '강'입니다. 거시 지표 하방 압력이 매우 거세니 조심하세요!`);
      } else {
        setMessage('⚡ 포트폴리오에 강한 하락 압력이 포착되었습니다. 구름이 거세고 번개가 칠 예정이니 대비책을 세워보아요!');
      }
    }
    // 2. 비 (rainy) 상태의 하락 알람 추출
    else if (weather === 'rainy') {
      const downStock = portfolio.find(stock => stock.direction === 'down');
      if (downStock) {
        setMessage(`🌧️ 주륵주륵.. [${downStock.stock_name}] 종목에 하방 시그널이 감지되었어요. 비에 젖지 않게 우산을 챙기듯 리스크 관리를 시작해볼까요?`);
      } else {
        setMessage('🌧️ 포트폴리오 전반에 하락 비구름이 퍼져 있어요. 일부 종목에 비를 피할 대피 구역이 필요한 시점입니다.');
      }
    }
    // 3. 구름/흐림 (cloudy) 상태
    else if (weather === 'cloudy') {
      const cautionStock = portfolio.find(stock => stock.direction === 'down');
      if (cautionStock) {
        setMessage(`⛅ 오늘은 구름이 조금 꼈네요. [${cautionStock.stock_name}]에 소소한 약보합 압력이 흐르고 있으니 관망해보는 것을 권장합니다.`);
      } else {
        setMessage('⛅ 오늘은 하늘이 흐린 날이네요. 뚜렷한 급락 악재는 없으나 시장 전반이 횡보세일 수 있으니 신중하게 움직여요!');
      }
    }
    // 4. 맑음 (sunny) 상태
    else {
      setMessage('☀️ 쨍쨍! 오늘의 포트폴리오 투자 기상도는 맑음입니다! 보유 자산들이 안정적인 흐름을 유지하고 있으니 기분 좋게 관찰해 보세요 🐜');
    }
  }, [weather, portfolio]);

  return (
    <div className="fixed right-8 bottom-24 z-50 flex flex-col items-end pointer-events-none">
      {/* 말풍선 UI */}
      <div 
        className={`mb-4 max-w-[280px] p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-emerald-500/30 text-zinc-800 dark:text-zinc-100 text-sm font-medium shadow-xl transition-all duration-300 transform pointer-events-auto soft-shadow-light ${
          isOpen 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="relative">
          <p className="leading-relaxed whitespace-pre-wrap">{message}</p>
          {/* 말풍선 꼬리 */}
          <div className="absolute right-6 -bottom-5 w-0 h-0 border-8 border-transparent border-t-white/90 dark:border-t-zinc-900/90"></div>
          <div className="absolute right-6 -bottom-[21px] w-0 h-0 border-8 border-transparent border-t-emerald-500/30 -z-10"></div>
        </div>
      </div>

      {/* 둥둥 뜨는 펫 캐릭터 */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-24 h-24 cursor-pointer pointer-events-auto animate-float transition-transform duration-300 hover:scale-110 active:scale-95 select-none"
        title="개미 비서 클릭하여 브리핑 보기"
      >
        <Image 
          src={getPetImage(weather)} 
          alt="Ant Pet" 
          width={96}
          height={96}
          className="object-contain"
          priority
        />
        {/* 알림 배지 (날씨가 나쁘거나 말풍선이 닫혀있을 때 반짝임) */}
        {!isOpen && (weather === 'thunder' || weather === 'rainy') && (
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
          </span>
        )}
      </div>
    </div>
  );
}
