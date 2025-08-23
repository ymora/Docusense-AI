import { create } from 'zustand';
import { promptService, Prompt } from '../services/promptService';
import { createLoadingActions, createCallGuard, createOptimizedUpdater } from '../utils/storeUtils';
import { logService } from '../services/logService';

interface PromptState {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  initialized: boolean; // Pour éviter les rechargements multiples

  // Actions
  loadPrompts: () => Promise<void>;
  loadDefaultPromptsOnly: () => Promise<void>;
  reloadPrompts: () => Promise<void>;
  clearError: () => void;
  
  // Getter qui charge automatiquement
  getPrompts: () => Prompt[];
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  loading: false,
  error: null,
  initialized: false,

  // Chargement automatique au premier accès
  loadPrompts: (() => {
    const callGuard = createCallGuard();
    return callGuard(async () => {
      const { initialized } = get();
      
      // Éviter les rechargements multiples
      if (initialized) {
        return;
      }

      const loadingActions = createLoadingActions(set, get);
      const updater = createOptimizedUpdater(set, get);
      
      if (!loadingActions.startLoading()) {
        return;
      }
      
      try {
        const specializedPrompts = await promptService.getSpecializedPrompts();
        const promptsArray = Object.entries(specializedPrompts).map(([id, prompt]) => ({
          id,
          ...prompt
        }));
        
        updater.updateMultiple({ 
          prompts: promptsArray,
          initialized: true 
        });
        loadingActions.finishLoading();
        
        // Log du chargement des prompts
        logService.debug(`Chargement de ${promptsArray.length} prompts`, 'PromptStore');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des prompts';
        loadingActions.finishLoadingWithError(errorMessage);
      }
    });
  })(),

  // Chargement des prompts par défaut uniquement (sans requête API)
  loadDefaultPromptsOnly: (() => {
    const callGuard = createCallGuard();
    return callGuard(async () => {
      const { initialized } = get();
      
      // Éviter les rechargements multiples
      if (initialized) {
        return;
      }

      const loadingActions = createLoadingActions(set, get);
      const updater = createOptimizedUpdater(set, get);
      
      if (!loadingActions.startLoading()) {
        return;
      }
      
      try {
        // Utiliser directement les données par défaut du service
        const defaultPrompts = await promptService.getDefaultPromptsOnly();
        const promptsArray = Object.entries(defaultPrompts).map(([id, prompt]) => ({
          id,
          name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `Prompt par défaut pour ${id.replace(/_/g, ' ')}`,
          domain: 'général',
          type: 'analysis',
          content: prompt
        }));
        
        updater.updateMultiple({ 
          prompts: promptsArray,
          initialized: true 
        });
        loadingActions.finishLoading();
        
        // Log du chargement des prompts par défaut
        logService.debug(`Chargement de ${promptsArray.length} prompts par défaut`, 'PromptStore');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des prompts par défaut';
        loadingActions.finishLoadingWithError(errorMessage);
      }
    });
  })(),

  reloadPrompts: (() => {
    const callGuard = createCallGuard();
    return callGuard(async () => {
      const loadingActions = createLoadingActions(set, get);
      const updater = createOptimizedUpdater(set, get);
      
      if (!loadingActions.startLoading()) {
        return;
      }
      
      try {
        const specializedPrompts = await promptService.getSpecializedPrompts();
        const promptsArray = Object.entries(specializedPrompts).map(([id, prompt]) => ({
          id,
          ...prompt
        }));
        
        updater.updateMultiple({ 
          prompts: promptsArray,
          initialized: true 
        });
        loadingActions.finishLoading();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du rechargement des prompts';
        loadingActions.finishLoadingWithError(errorMessage);
      }
    });
  })(),

  clearError: () => {
    set({ error: null });
  },

  // Getter qui charge automatiquement les prompts si nécessaire
  getPrompts: () => {
    const state = get();
    if (!state.initialized && !state.loading) {
      // Charger automatiquement si pas encore initialisé
      state.loadPrompts();
    }
    return state.prompts;
  }
}));

 