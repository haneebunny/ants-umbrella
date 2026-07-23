"use client";

import React, { useMemo } from 'react';

/**
 * 세로 방향 기준 15도 각도로 기울어진 가늘고 날렵한 대각선 비 내림 이펙트
 */
export default function RainEffect({ weatherStatus, isDark }) {
  const isRaining = weatherStatus === 'rainy' || weatherStatus === 'thunder';

  // 55개의 가늘고 날렵한 빗방울 (1.0초 ~ 1.8초 속도)
  const raindrops = useMemo(() => {
    return Array.from({ length: 55 }).map((_, i) => ({
      id: i,
      left: `${(i * 1.8 + Math.random() * 2.0).toFixed(1)}%`,
      delay: `${(Math.random() * 2.0).toFixed(2)}s`,
      duration: `${(1.0 + Math.random() * 0.8).toFixed(2)}s`,
      height: `${Math.floor(22 + Math.random() * 25)}px`,
      opacity: (0.5 + Math.random() * 0.35).toFixed(2),
      width: Math.random() > 0.5 ? '1.5px' : '1.0px',
    }));
  }, []);

  if (!isRaining) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 세로 기준 15도 기울어진 회전 컨테이너 */}
      <div 
        className="absolute top-[-20%] bottom-[-20%] left-[-20%] right-[-20%]"
        style={{
          transform: 'rotate(15deg)',
          transformOrigin: 'center center',
        }}
      >
        <style jsx>{`
          @keyframes rainLinearFall {
            0% {
              transform: translateY(-100px);
            }
            100% {
              transform: translateY(140vh);
            }
          }
          .rain-drop {
            position: absolute;
            top: -80px;
            background: linear-gradient(
              to bottom,
              transparent,
              ${isDark ? 'rgba(105, 219, 173, 0.85)' : 'rgba(37, 99, 235, 0.75)'}
            );
            border-radius: 1px;
            will-change: transform;
            box-shadow: ${isDark ? '0 0 3px rgba(105, 219, 173, 0.3)' : '0 0 3px rgba(37, 99, 235, 0.25)'};
          }
        `}</style>

        {raindrops.map((drop) => (
          <div
            key={drop.id}
            className="rain-drop"
            style={{
              left: drop.left,
              height: drop.height,
              width: drop.width,
              opacity: drop.opacity,
              animation: `rainLinearFall ${drop.duration} linear infinite`,
              animationDelay: drop.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
