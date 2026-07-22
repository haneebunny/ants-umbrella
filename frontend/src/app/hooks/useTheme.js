'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ants_theme';

/**
 * 앱 전역 테마 훅
 * - localStorage에 저장해 페이지 전환 시에도 테마 유지
 * - 초기값: 'light'
 */
export function useTheme() {
  const [theme, setTheme] = useState('light');

  // 마운트 시 저장된 테마 복원
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    }
  }, []);

  // 테마 변경 시 DOM + localStorage 동기화
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
