/**
 * Utilitaires centralisés pour la gestion des stores
 * Évite la duplication de code et optimise la gestion des états de chargement
 */

import { StateCreator } from 'zustand';

// Type pour les stores avec état de chargement
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

// Type pour les actions de base
export interface BaseActions {
  clearError: () => void;
  reset: () => void;
}

// Utilitaire pour créer des actions de chargement optimisées
export const createLoadingActions = <T extends LoadingState>(
  set: (fn: any) => void,
  get: () => T
) => {
  return {
    // Début de chargement avec protection contre les appels multiples
    startLoading: () => {
      const currentState = get();
      if (currentState.loading) {

        return false; // Indique que le chargement n'a pas été démarré
      }
      set({ loading: true, error: null });
      return true; // Indique que le chargement a été démarré
    },

    // Fin de chargement avec succès
    finishLoading: (data?: Partial<T>) => {
      set({ 
        loading: false, 
        error: null,
        ...data 
      });
    },

    // Fin de chargement avec erreur
    finishLoadingWithError: (error: string, data?: Partial<T>) => {
      set({ 
        loading: false, 
        error,
        ...data 
      });
    },

    // Effacer l'erreur
    clearError: () => {
      set({ error: null });
    },

    // Réinitialiser l'état de chargement
    resetLoading: () => {
      set({ loading: false, error: null });
    }
  };
};

// Wrapper pour les fonctions async avec gestion automatique du loading
export const withLoading = <T extends LoadingState>(
  set: (fn: any) => void,
  get: () => T,
  asyncFn: () => Promise<any>
) => {
  return async () => {
    const loadingActions = createLoadingActions(set, get);
    
    if (!loadingActions.startLoading()) {
      return; // Éviter les appels multiples
    }

    try {
      const result = await asyncFn();
      loadingActions.finishLoading();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      loadingActions.finishLoadingWithError(errorMessage);
      throw error;
    }
  };
};

// Utilitaire pour les mises à jour optimisées (évite les re-renders inutiles)
export const createOptimizedUpdater = <T>(
  set: (fn: any) => void,
  get: () => T
) => {
  return {
    // Mise à jour conditionnelle (seulement si les données ont changé)
    updateIfChanged: <K extends keyof T>(key: K, newValue: T[K]) => {
      const currentState = get();
      if (currentState[key] !== newValue) {
        set({ [key]: newValue } as any);
      }
    },

    // Mise à jour multiple optimisée
    updateMultiple: (updates: Partial<T>) => {
      const currentState = get();
      const hasChanges = Object.keys(updates).some(key => 
        currentState[key as keyof T] !== updates[key as keyof T]
      );
      
      if (hasChanges) {
        set(updates);
      }
    }
  };
};

// Debounce utilitaire pour éviter les appels multiples
export const createDebouncer = (delay: number = 500) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (fn: () => void) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(fn, delay);
  };
};

// Protection contre les appels multiples simultanés
export const createCallGuard = () => {
  let isExecuting = false;
  
  return <T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      if (isExecuting) {

        return;
      }
      
      isExecuting = true;
      try {
        const result = await fn(...args);
        return result;
      } finally {
        isExecuting = false;
      }
    };
  };
}; 