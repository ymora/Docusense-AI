// 🎨 COULEURS CENTRALISÉES DE L'INTERFACE
// Toutes les couleurs de l'application sont définies ici pour faciliter les modifications

export const COLORS = {
  // 🌙 Mode sombre
  dark: {
    // Couleurs principales des panneaux
    config: '#3b82f6',      // Bleu pour Configuration IA
    queue: '#eab308',       // Jaune pour File d'attente
    analyses: '#4ade80',    // Vert pour Analyses terminées
    
    // Couleurs du thème
    background: '#0f172a',  // Fond principal
    surface: '#1e293b',     // Surfaces (panneaux, cartes)
    text: '#f1f5f9',        // Texte principal
    textSecondary: '#94a3b8', // Texte secondaire
    border: '#334155',      // Bordures
    
    // Couleurs d'accent
    primary: '#3b82f6',     // Bleu principal (comme le titre)
    success: '#22c55e',     // Vert succès
    warning: '#eab308',     // Jaune avertissement
    error: '#ef4444',       // Rouge erreur
    
    // Couleurs de statut
    status: {
      pending: '#eab308',   // Jaune - En attente
      processing: '#3b82f6', // Bleu - En cours
      completed: '#22c55e', // Vert - Terminé
      failed: '#ef4444',    // Rouge - Échec
      paused: '#eab308',    // Jaune - En pause
      unsupported: '#475569' // Gris foncé - Non supporté
    },
    
    // Couleurs d'interaction
    hover: {
      config: 'rgba(59, 130, 246, 0.1)',    // Bleu transparent
      queue: 'rgba(234, 179, 8, 0.1)',      // Jaune transparent
      analyses: 'rgba(74, 222, 128, 0.1)',  // Vert transparent
      primary: 'rgba(59, 130, 246, 0.1)',   // Bleu transparent
      surface: 'rgba(148, 163, 184, 0.1)'   // Gris transparent
    }
  },
  
  // ☀️ Mode clair
  light: {
    // Couleurs principales des panneaux
    config: '#2563eb',      // Bleu foncé pour Configuration IA
    queue: '#ca8a04',       // Jaune foncé pour File d'attente
    analyses: '#16a34a',    // Vert foncé pour Analyses terminées
    
    // Couleurs du thème
    background: '#ffffff',  // Fond principal
    surface: '#f4faff',     // Surfaces (panneaux, cartes)
    text: '#18181b',        // Texte principal
    textSecondary: '#71717a', // Texte secondaire
    border: '#b6c6e3',      // Bordures
    
    // Couleurs d'accent
    primary: '#2563eb',     // Bleu principal
    success: '#16a34a',     // Vert succès
    warning: '#ca8a04',     // Jaune avertissement
    error: '#dc2626',       // Rouge erreur
    
    // Couleurs de statut
    status: {
      pending: '#ca8a04',   // Jaune foncé - En attente
      processing: '#2563eb', // Bleu foncé - En cours
      completed: '#16a34a', // Vert foncé - Terminé
      failed: '#dc2626',    // Rouge foncé - Échec
      paused: '#ca8a04',    // Jaune foncé - En pause
      unsupported: '#6b7280' // Gris - Non supporté
    },
    
    // Couleurs d'interaction
    hover: {
      config: 'rgba(37, 99, 235, 0.1)',     // Bleu transparent
      queue: 'rgba(202, 138, 4, 0.1)',      // Jaune transparent
      analyses: 'rgba(22, 163, 74, 0.1)',   // Vert transparent
      primary: 'rgba(37, 99, 235, 0.1)',    // Bleu transparent
      surface: 'rgba(113, 113, 122, 0.1)'   // Gris transparent
    }
  }
} as const;

// 🎯 Variables CSS pour utilisation dans les styles
export const CSS_VARIABLES = {
  // Mode sombre
  dark: {
    '--config-color': COLORS.dark.config,
    '--queue-color': COLORS.dark.queue,
    '--analyses-color': COLORS.dark.analyses,
    '--background-color': COLORS.dark.background,
    '--surface-color': COLORS.dark.surface,
    '--text-color': COLORS.dark.text,
    '--border-color': COLORS.dark.border,
    '--primary-color': COLORS.dark.primary,
    '--success-color': COLORS.dark.success,
    '--error-color': COLORS.dark.error,
    '--shadow': '0 2px 8px 0 rgba(30,41,59,0.10)'
  },
  
  // Mode clair
  light: {
    '--config-color': COLORS.light.config,
    '--queue-color': COLORS.light.queue,
    '--analyses-color': COLORS.light.analyses,
    '--background-color': COLORS.light.background,
    '--surface-color': COLORS.light.surface,
    '--text-color': COLORS.light.text,
    '--border-color': COLORS.light.border,
    '--primary-color': COLORS.light.primary,
    '--success-color': COLORS.light.success,
    '--error-color': COLORS.light.error,
    '--shadow': '0 2px 8px 0 rgba(30,41,59,0.06)'
  }
} as const;

// 🎨 Fonctions utilitaires pour les couleurs
export const getColor = (mode: 'dark' | 'light', category: keyof typeof COLORS.dark, subcategory?: string) => {
  const colorSet = COLORS[mode];
  if (subcategory && category === 'status') {
    return colorSet.status[subcategory as keyof typeof colorSet.status];
  }
  if (subcategory && category === 'hover') {
    return colorSet.hover[subcategory as keyof typeof colorSet.hover];
  }
  return colorSet[category];
};

export const getStatusColor = (mode: 'dark' | 'light', status: string) => {
  return getColor(mode, 'status', status);
};

export const getHoverColor = (mode: 'dark' | 'light', element: string) => {
  return getColor(mode, 'hover', element);
};

// 🎯 Classes CSS pour les boutons de panneaux
export const PANEL_BUTTON_CLASSES = {
  config: 'config-button',
  queue: 'queue-button',
  analyses: 'analyses-button'
} as const;

// 📝 Types TypeScript pour la sécurité des types
export type ColorMode = 'dark' | 'light';
export type StatusType = keyof typeof COLORS.dark.status;
export type HoverElement = keyof typeof COLORS.dark.hover;
export type PanelType = keyof typeof PANEL_BUTTON_CLASSES; 