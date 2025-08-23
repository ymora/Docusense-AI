/**
 * Utilitaires centralisés pour la gestion des stores
 * Évite la duplication de code et optimise la gestion des états de chargement
 */

import { StateCreator } from 'zustand';

// Types pour les stores Zustand
export type StoreState<T> = T;

// Fonction utilitaire pour créer un store avec persistance
export function createPersistedStore<T extends object>(
  initialState: T,
  storageKey: string
): StateCreator<T> {
  return (set, get, store) => {
    // Charger l'état depuis le localStorage
    const savedState = localStorage.getItem(storageKey);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        set({ ...initialState, ...parsedState });
      } catch (error) {
        console.error('Erreur lors du chargement de l\'état:', error);
        set(initialState);
      }
    } else {
      set(initialState);
    }

    // Sauvegarder automatiquement les changements
    const originalSet = set;
    set = (partial, replace) => {
      originalSet(partial, replace);
      const currentState = get();
      localStorage.setItem(storageKey, JSON.stringify(currentState));
    };

    return {
      ...initialState,
      set
    };
  };
}

// Fonction utilitaire pour créer un store avec debounce
export function createDebouncedStore<T extends object>(
  initialState: T,
  debounceDelay: number = 300
): StateCreator<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (set, get, store) => {
    const debouncedSet = (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        set(partial, replace);
        timeoutId = null;
      }, debounceDelay);
    };

    return {
      ...initialState,
      set: debouncedSet
    };
  };
}

// Fonction utilitaire pour créer un store avec validation
export function createValidatedStore<T extends object>(
  initialState: T,
  validator: (state: T) => boolean | string
): StateCreator<T> {
  return (set, get, store) => {
    const validatedSet = (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => {
      const newState = typeof partial === 'function' ? partial(get()) : { ...get(), ...partial };
      const validation = validator(newState);
      
      if (validation === true) {
        set(partial, replace);
      } else if (typeof validation === 'string') {
        console.error('Validation failed:', validation);
        throw new Error(validation);
      }
    };

    return {
      ...initialState,
      set: validatedSet
    };
  };
}

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
  set: StateCreator<T>['setState'],
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
  set: StateCreator<T>['setState'],
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
  set: StateCreator<T>['setState'],
  get: () => T
) => {
  return {
    // Mise à jour conditionnelle (seulement si les données ont changé)
    updateIfChanged: <K extends keyof T>(key: K, newValue: T[K]) => {
      const currentState = get();
      if (currentState[key] !== newValue) {
        set({ [key]: newValue } as Partial<T>);
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