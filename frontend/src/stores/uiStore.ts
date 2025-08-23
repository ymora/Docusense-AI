import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // État actuel
  sidebarWidth: number;
  theme: 'light' | 'dark';
  language: 'fr' | 'en';
  autoRefreshInterval: number;
  activePanel: 'viewer' | 'queue' | 'logs' | 'system' | 'ai-config' | 'users' | 'api-docs';

  // Actions
  setSidebarWidth: (width: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'fr' | 'en') => void;
  setAutoRefreshInterval: (interval: number) => void;
  setActivePanel: (panel: 'viewer' | 'queue' | 'logs' | 'system' | 'ai-config' | 'users' | 'api-docs') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarWidth: 400,
      theme: 'dark',
      language: 'fr',
      autoRefreshInterval: 10,
      activePanel: 'queue',

      // Actions
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setAutoRefreshInterval: (interval) => set({ autoRefreshInterval: interval }),
      setActivePanel: (panel) => set({ activePanel: panel }),
    }),
    {
      name: 'docusense-ui-storage',
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        theme: state.theme,
        language: state.language,
        autoRefreshInterval: state.autoRefreshInterval,
        activePanel: state.activePanel,
      }),
    },
  ),
);