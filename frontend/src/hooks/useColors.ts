import { useState, useEffect } from 'react';
import { COLORS, CSS_VARIABLES, getColor, getStatusColor, getHoverColor, type ColorMode } from '../utils/colors';

// 🎨 Hook pour gérer les couleurs de manière centralisée
export const useColors = () => {
  const [colorMode, setColorMode] = useState<ColorMode>('dark');

  // Détecter le mode de couleur actuel
  useEffect(() => {
    const checkColorMode = () => {
      const theme = document.body.getAttribute('data-theme');
      setColorMode(theme === 'light' ? 'light' : 'dark');
    };

    checkColorMode();
    
    // Observer les changements de thème
    const observer = new MutationObserver(checkColorMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  // Appliquer les variables CSS au document
  useEffect(() => {
    const cssVariables = CSS_VARIABLES[colorMode];
    Object.entries(cssVariables).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }, [colorMode]);

  // Fonctions utilitaires pour les couleurs
  const colors = {
    // Couleurs principales
    config: COLORS[colorMode].config,
    queue: COLORS[colorMode].queue,
    analyses: COLORS[colorMode].analyses,
    primary: COLORS[colorMode].primary,
    success: COLORS[colorMode].success,
    warning: COLORS[colorMode].warning,
    error: COLORS[colorMode].error,
    
    // Couleurs du thème
    background: COLORS[colorMode].background,
    surface: COLORS[colorMode].surface,
    text: COLORS[colorMode].text,
    textSecondary: COLORS[colorMode].textSecondary,
    border: COLORS[colorMode].border,
    
    // Couleurs de statut
    status: COLORS[colorMode].status,
    
    // Couleurs d'interaction
    hover: COLORS[colorMode].hover,
    
    // Fonctions utilitaires
    getStatusColor: (status: string) => getStatusColor(colorMode, status),
    getHoverColor: (element: string) => getHoverColor(colorMode, element),
    getColor: (category: keyof typeof COLORS.dark, subcategory?: string) => 
      getColor(colorMode, category, subcategory)
  };

  return {
    colorMode,
    setColorMode,
    colors,
    isDark: colorMode === 'dark',
    isLight: colorMode === 'light'
  };
};

// 🎯 Hook spécialisé pour les panneaux
export const usePanelColors = () => {
  const { colors } = useColors();
  
  return {
    config: colors.config,
    queue: colors.queue,
    analyses: colors.analyses,
    configHover: colors.hover.config,
    queueHover: colors.hover.queue,
    analysesHover: colors.hover.analyses
  };
};

// 🎯 Hook spécialisé pour les statuts
export const useStatusColors = () => {
  const { colors } = useColors();
  
  return {
    pending: colors.status.pending,
    processing: colors.status.processing,
    completed: colors.status.completed,
    failed: colors.status.failed,
    paused: colors.status.paused,
    unsupported: colors.status.unsupported,
    getStatusColor: colors.getStatusColor
  };
}; 