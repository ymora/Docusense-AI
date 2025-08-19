import { useState, useEffect } from 'react';
import { 
  TEXT_COLORS, 
  TYPOGRAPHY, 
  getTextColor, 
  getThemeColor,
  type ColorMode 
} from '../utils/colorConstants';

/**
 * 🎨 Hook pour gérer la typographie et les couleurs de texte de manière centralisée
 */
export const useTypography = () => {
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

  // Couleurs de texte selon le mode
  const textColors = {
    primary: getTextColor(colorMode, 'primary'),
    secondary: getTextColor(colorMode, 'secondary'),
    muted: getTextColor(colorMode, 'muted'),
    accent: getTextColor(colorMode, 'accent'),
    success: getTextColor(colorMode, 'success'),
    warning: getTextColor(colorMode, 'warning'),
    error: getTextColor(colorMode, 'error'),
    link: getTextColor(colorMode, 'link'),
    code: getTextColor(colorMode, 'code'),
  };

  // Couleurs de thème selon le mode
  const themeColors = {
    config: getThemeColor(colorMode, 'config'),
    queue: getThemeColor(colorMode, 'queue'),
    analyses: getThemeColor(colorMode, 'analyses'),
    background: getThemeColor(colorMode, 'background'),
    surface: getThemeColor(colorMode, 'surface'),
    border: getThemeColor(colorMode, 'border'),
    primary: getThemeColor(colorMode, 'primary'),
    success: getThemeColor(colorMode, 'success'),
    warning: getThemeColor(colorMode, 'warning'),
    error: getThemeColor(colorMode, 'error'),
    hover: getThemeColor(colorMode, 'hover'),
  };

  // Styles typographiques
  const typography = {
    fontFamily: TYPOGRAPHY.fontFamily,
    fontSize: TYPOGRAPHY.fontSize,
    fontWeight: TYPOGRAPHY.fontWeight,
    lineHeight: TYPOGRAPHY.lineHeight,
  };

  // Classes CSS utilitaires pour la typographie
  const textClasses = {
    // Tailles de texte
    xs: `text-xs font-${TYPOGRAPHY.fontWeight.normal}`,
    sm: `text-sm font-${TYPOGRAPHY.fontWeight.normal}`,
    base: `text-base font-${TYPOGRAPHY.fontWeight.normal}`,
    lg: `text-lg font-${TYPOGRAPHY.fontWeight.medium}`,
    xl: `text-xl font-${TYPOGRAPHY.fontWeight.semibold}`,
    '2xl': `text-2xl font-${TYPOGRAPHY.fontWeight.semibold}`,
    '3xl': `text-3xl font-${TYPOGRAPHY.fontWeight.bold}`,
    '4xl': `text-4xl font-${TYPOGRAPHY.fontWeight.bold}`,

    // Couleurs de texte
    primary: `text-[${textColors.primary}]`,
    secondary: `text-[${textColors.secondary}]`,
    muted: `text-[${textColors.muted}]`,
    accent: `text-[${textColors.accent}]`,
    success: `text-[${textColors.success}]`,
    warning: `text-[${textColors.warning}]`,
    error: `text-[${textColors.error}]`,
    link: `text-[${textColors.link}]`,
    code: `text-[${textColors.code}] font-mono`,
  };

  // Styles inline pour les couleurs
  const textStyles = {
    primary: { color: textColors.primary },
    secondary: { color: textColors.secondary },
    muted: { color: textColors.muted },
    accent: { color: textColors.accent },
    success: { color: textColors.success },
    warning: { color: textColors.warning },
    error: { color: textColors.error },
    link: { color: textColors.link },
    code: { color: textColors.code, fontFamily: TYPOGRAPHY.fontFamily.mono },
  };

  return {
    colorMode,
    textColors,
    themeColors,
    typography,
    textClasses,
    textStyles,
    isDark: colorMode === 'dark',
    isLight: colorMode === 'light',
  };
};
