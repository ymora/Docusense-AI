import { create } from 'zustand';
import { Prompt } from '../services/promptService';
import { logService } from '../services/logService';

interface PromptState {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions d'état
  setPrompts: (prompts: Prompt[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearError: () => void;

  // Actions avec API
  loadPrompts: (promptService: any) => Promise<void>;

  // Getter
  getPrompts: () => Prompt[];
  isInitialized: boolean;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  loading: false,
  error: null,
  initialized: false,

  // Actions d'état
  setPrompts: (prompts: Prompt[]) => {
    set({ prompts });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setInitialized: (initialized: boolean) => {
    set({ initialized });
  },

  clearError: () => {
    set({ error: null });
  },

  // Actions avec API
  loadPrompts: async (promptService: any) => {
    try {
      set({ loading: true, error: null });
      
      logService.info('Chargement des prompts', 'PromptStore', {
        timestamp: new Date().toISOString()
      });

      const response = await promptService.getPrompts();
      
      if (response.success && response.data) {
        set({ 
          prompts: response.data, 
          loading: false,
          initialized: true
        });
        
        logService.info('Prompts chargés avec succès', 'PromptStore', {
          count: response.data.length,
          timestamp: new Date().toISOString()
        });
      } else {
        const errorMessage = response.error || 'Erreur lors du chargement des prompts';
        set({ 
          error: errorMessage, 
          loading: false 
        });
        
        logService.error('Erreur lors du chargement des prompts', 'PromptStore', {
          error: errorMessage,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      set({ 
        error: errorMessage, 
        loading: false 
      });
      
      logService.error('Erreur lors du chargement des prompts', 'PromptStore', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Getter
  getPrompts: () => {
    return get().prompts;
  },

  get isInitialized() {
    return get().initialized;
  }
}));

 