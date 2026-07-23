'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ants_theme';

/**
 * 초기값을 즉시 SSR-safe하게 읽어 flicker 방지
 * layout.js의 인라인 스크립트가 이미 <html>에 클래스를 적용해 두므로
 * useState 초기값도 localStorage에서 읽어 일치시킨다.
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'; // SSR
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  // 테마 변경 시 DOM 클래스 + localStorage 동기화
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark',  theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
