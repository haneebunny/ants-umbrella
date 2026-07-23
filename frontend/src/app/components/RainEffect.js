"use client";

import React, { useMemo } from 'react';

// 의사 난수(Deterministic Pseudo-Random) 함수 - React 19 Pure Component 규칙 준수
function seededRandom(seed) {
  const x = Math.sin(seed * 9999 + 1) * 10000;
  return x - Math.floor(x);
}

/**
 * 세로 방향 기준 15도 각도로 기울어진 가늘고 날렵한 대각선 비 내림 이펙트
 */
export default function RainEffect({ weatherStatus, isDark }) {
  const isRaining = weatherStatus === 'rainy' || weatherStatus === 'thunder';

  // 55개의 가늘고 날렵한 빗방울 (Pure Component 규칙 준수)
  const raindrops = useMemo(() => {
    return Array.from({ length: 55 }).map((_, i) => {
      const r1 = seededRandom(i * 1.1 + 1);
      const r2 = seededRandom(i * 2.3 + 2);
      const r3 = seededRandom(i * 3.7 + 3);
      const r4 = seededRandom(i * 4.9 + 4);
      const r5 = seededRandom(i * 5.3 + 5);

      return {
        id: i,
        left: `${(i * 1.8 + r1 * 2.0).toFixed(1)}%`,
        delay: `${(r2 * 2.0).toFixed(2)}s`,
        duration: `${(1.0 + r3 * 0.8).toFixed(2)}s`,
        height: `${Math.floor(22 + r4 * 25)}px`,
        opacity: (0.5 + r5 * 0.35).toFixed(2),
        width: r1 > 0.5 ? '1.5px' : '1.0px',
      };
    });
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
