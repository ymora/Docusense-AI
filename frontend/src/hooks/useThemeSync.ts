import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

/**
 * Hook pour synchroniser le thème du store UI avec le DOM
 */
export const useThemeSync = () => {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    // Appliquer le thème au DOM
    document.body.setAttribute('data-theme', theme);
    
    // Appliquer aussi la classe pour Tailwind
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
};
