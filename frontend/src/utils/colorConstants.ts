/**
 * 🎨 CONSTANTES DE COULEURS ET TYPOGRAPHIE CENTRALISÉES
 *
 * Ce fichier définit toutes les couleurs et styles typographiques utilisés dans l'application
 * pour assurer la cohérence visuelle entre tous les onglets.
 */

// ================================
// 🎨 MODES DE COULEURS
// ================================

export type ColorMode = 'dark' | 'light';

// ================================
// 🏷️ COULEURS DE STATUTS
// ================================

export const STATUS_COLORS = {
  // Statuts principaux
  pending: '#f59e0b',      // Orange/Jaune - En attente
  processing: '#3b82f6',   // Bleu - En cours
  completed: '#10b981',    // Vert - Terminé
  failed: '#ef4444',       // Rouge - Échoué
  paused: '#8b5cf6',       // Violet - En pause
  unsupported: '#6b7280',  // Gris - Non supporté

  // Statuts de configuration IA
  empty: '#6b7280',        // Gris - Non configuré
  configured: '#3b82f6',   // Bleu - Configuré
  invalid: '#ef4444',      // Rouge - Échec
  functional: '#f59e0b',   // Orange - Fonctionnel
  active: '#10b981',       // Vert - Actif
  testing: '#3b82f6',      // Bleu - Test en cours
} as const;

// ================================
// 📊 COULEURS DE NIVEAUX DE LOGS
// ================================

export const LOG_LEVEL_COLORS = {
  error: '#ef4444',        // Rouge - Erreur
  warning: '#f59e0b',      // Orange - Avertissement
  info: '#3b82f6',         // Bleu - Information
  debug: '#6b7280',        // Gris - Debug
} as const;

// ================================
// 📁 COULEURS DE TYPES DE FICHIERS
// ================================

export const FILE_TYPE_COLORS = {
  image: '#10b981',        // Vert - Images
  video: '#8b5cf6',        // Violet - Vidéos
  audio: '#f59e0b',        // Orange - Audio
  document: '#3b82f6',     // Bleu - Documents
  text: '#6b7280',         // Gris - Texte
  spreadsheet: '#10b981',  // Vert - Tableurs
  email: '#f59e0b',        // Orange - Emails
  archive: '#f59e0b',      // Orange - Archives
  presentation: '#f59e0b', // Orange - Présentations
  chart: '#3b82f6',        // Bleu - Graphiques
} as const;

// ================================
// 🔧 COULEURS D'ACTIONS
// ================================

export const ACTION_COLORS = {
  // Actions principales
  start: '#10b981',        // Vert - Démarrer
  pause: '#f59e0b',        // Orange - Pause
  retry: '#3b82f6',        // Bleu - Relancer
  view: '#3b82f6',         // Bleu - Visualiser
  duplicate: '#f59e0b',    // Orange - Dupliquer
  compare: '#8b5cf6',      // Violet - Comparer
  delete: '#ef4444',       // Rouge - Supprimer

  // Types de providers
  local: '#3b82f6',        // Bleu - IA Locale
  web: '#8b5cf6',          // Violet - IA Web
} as const;

// ================================
// 🎯 COULEURS DE DISPONIBILITÉ
// ================================

export const AVAILABILITY_COLORS = {
  available: '#10b981',    // Vert - Disponible
  unavailable: '#ef4444',  // Rouge - Non disponible
} as const;

// ================================
// 🎨 COULEURS DE FOND TRANSPARENTES
// ================================

export const BACKGROUND_COLORS = {
  // Statuts
  pending: 'rgba(245, 158, 11, 0.1)',    // Orange transparent
  processing: 'rgba(59, 130, 246, 0.1)',  // Bleu transparent
  completed: 'rgba(16, 185, 129, 0.1)',   // Vert transparent
  failed: 'rgba(239, 68, 68, 0.1)',       // Rouge transparent
  paused: 'rgba(139, 92, 246, 0.1)',      // Violet transparent
  unsupported: 'rgba(107, 114, 128, 0.1)', // Gris transparent

  // Types de fichiers
  image: 'rgba(16, 185, 129, 0.1)',       // Vert transparent
  video: 'rgba(139, 92, 246, 0.1)',       // Violet transparent
  audio: 'rgba(245, 158, 11, 0.1)',       // Orange transparent
  document: 'rgba(59, 130, 246, 0.1)',    // Bleu transparent
  text: 'rgba(107, 114, 128, 0.1)',       // Gris transparent
} as const;

// ================================
// 📝 COULEURS DE TEXTE
// ================================

export const TEXT_COLORS = {
  // Mode sombre
  dark: {
    primary: '#f1f5f9',        // Blanc principal
    secondary: '#94a3b8',      // Gris clair secondaire
    muted: '#64748b',          // Gris atténué
    accent: '#3b82f6',         // Bleu accent
    success: '#10b981',        // Vert succès
    warning: '#f59e0b',        // Orange avertissement
    error: '#ef4444',          // Rouge erreur
    link: '#60a5fa',           // Bleu lien
    code: '#e2e8f0',           // Blanc code
  },

  // Mode clair
  light: {
    primary: '#18181b',        // Noir principal
    secondary: '#71717a',      // Gris foncé secondaire
    muted: '#a1a1aa',          // Gris atténué
    accent: '#2563eb',         // Bleu accent
    success: '#16a34a',        // Vert succès
    warning: '#ca8a04',        // Orange avertissement
    error: '#dc2626',          // Rouge erreur
    link: '#2563eb',           // Bleu lien
    code: '#1e293b',           // Noir code
  }
} as const;

// ================================
// 🔤 TYPOGRAPHIE
// ================================

export const TYPOGRAPHY = {
  // Familles de polices
  fontFamily: {
    primary: "'Inter', 'Segoe UI', Arial, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    display: "'Inter', 'Segoe UI', Arial, sans-serif",
  },

  // Tailles de police
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },

  // Poids de police
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Hauteur de ligne
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// ================================
// 🎨 COULEURS DE THÈME COMPLÈTES
// ================================

export const THEME_COLORS = {
  // Mode sombre
  dark: {
    // Couleurs principales des panneaux
    config: '#3b82f6',      // Bleu pour Configuration IA
    queue: '#eab308',       // Jaune pour File d'attente
    analyses: '#16a34a',    // Vert foncé pour Analyses IA

    // Couleurs du thème
    background: '#0f172a',  // Fond principal
    surface: '#1e293b',     // Surfaces (panneaux, cartes)
    border: '#334155',      // Bordures

    // Couleurs d'accent
    primary: '#3b82f6',     // Bleu principal
    success: '#22c55e',     // Vert succès
    warning: '#eab308',     // Jaune avertissement
    error: '#ef4444',       // Rouge erreur

    // Couleurs d'interaction
    hover: {
      config: 'rgba(59, 130, 246, 0.1)',    // Bleu transparent
      queue: 'rgba(234, 179, 8, 0.1)',      // Jaune transparent
      analyses: 'rgba(74, 222, 128, 0.1)',  // Vert transparent
      primary: 'rgba(59, 130, 246, 0.1)',   // Bleu transparent
      surface: 'rgba(148, 163, 184, 0.1)',   // Gris transparent
    },
  },

  // Mode clair
  light: {
    // Couleurs principales des panneaux
    config: '#2563eb',      // Bleu foncé pour Configuration IA
    queue: '#ca8a04',       // Jaune foncé pour File d'attente
    analyses: '#16a34a',    // Vert foncé pour Analyses IA

    // Couleurs du thème
    background: '#ffffff',  // Fond principal
    surface: '#f4faff',     // Surfaces (panneaux, cartes)
    border: '#b6c6e3',      // Bordures

    // Couleurs d'accent
    primary: '#2563eb',     // Bleu principal
    success: '#16a34a',     // Vert succès
    warning: '#ca8a04',     // Jaune avertissement
    error: '#dc2626',       // Rouge erreur

    // Couleurs d'interaction
    hover: {
      config: 'rgba(37, 99, 235, 0.1)',     // Bleu transparent
      queue: 'rgba(202, 138, 4, 0.1)',      // Jaune transparent
      analyses: 'rgba(22, 163, 74, 0.1)',   // Vert transparent
      primary: 'rgba(37, 99, 235, 0.1)',    // Bleu transparent
      surface: 'rgba(113, 113, 122, 0.1)',   // Gris transparent
    },
  },
} as const;

// ================================
// 🔧 FONCTIONS UTILITAIRES
// ================================

/**
 * Obtient la couleur d'un statut
 */
export const getStatusColor = (status: keyof typeof STATUS_COLORS): string => {
  return STATUS_COLORS[status] || STATUS_COLORS.unsupported;
};

/**
 * Obtient la couleur d'un niveau de log
 */
export const getLogLevelColor = (level: keyof typeof LOG_LEVEL_COLORS): string => {
  return LOG_LEVEL_COLORS[level] || LOG_LEVEL_COLORS.debug;
};

/**
 * Obtient la couleur d'un type de fichier
 */
export const getFileTypeColor = (type: keyof typeof FILE_TYPE_COLORS): string => {
  return FILE_TYPE_COLORS[type] || FILE_TYPE_COLORS.text;
};

/**
 * Obtient la couleur d'une action
 */
export const getActionColor = (action: keyof typeof ACTION_COLORS): string => {
  return ACTION_COLORS[action] || ACTION_COLORS.view;
};

/**
 * Obtient la couleur de fond transparente d'un statut
 */
export const getStatusBackgroundColor = (status: keyof typeof BACKGROUND_COLORS): string => {
  return BACKGROUND_COLORS[status] || BACKGROUND_COLORS.unsupported;
};

/**
 * Obtient la couleur de fond transparente d'un type de fichier
 */
export const getFileTypeBackgroundColor = (type: keyof typeof FILE_TYPE_COLORS): string => {
  const backgroundMap = {
    image: BACKGROUND_COLORS.image,
    video: BACKGROUND_COLORS.video,
    audio: BACKGROUND_COLORS.audio,
    document: BACKGROUND_COLORS.document,
    text: BACKGROUND_COLORS.text,
  };
  return backgroundMap[type] || BACKGROUND_COLORS.text;
};

/**
 * Obtient la couleur de texte selon le mode et le type
 */
export const getTextColor = (mode: 'dark' | 'light', type: keyof typeof TEXT_COLORS.dark): string => {
  return TEXT_COLORS[mode][type];
};

/**
 * Obtient la couleur de thème selon le mode
 */
export const getThemeColor = (mode: 'dark' | 'light', category: keyof typeof THEME_COLORS.dark): any => {
  return THEME_COLORS[mode][category];
};

/**
 * Obtient la couleur de disponibilité
 */
export const getAvailabilityColor = (available: boolean): string => {
  return available ? AVAILABILITY_COLORS.available : AVAILABILITY_COLORS.unavailable;
};
