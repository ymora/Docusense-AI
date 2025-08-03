import { useState, useEffect } from 'react';

export interface ThemeState {
  isDarkMode: boolean;
  checkTheme: () => void;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useTheme = (): ThemeState => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const checkTheme = () => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setTheme = (isDark: boolean) => {
    setIsDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    checkTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);
    return () => mediaQuery.removeEventListener('change', checkTheme);
  }, []);

  return { isDarkMode, checkTheme, toggleTheme, setTheme };
}; 