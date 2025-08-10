import React from 'react';
import { create } from 'zustand';
import { useBackendStatus, BackendStatus } from './useBackendStatus';

interface BackendConnectionState {
  status: BackendStatus;
  isConnected: boolean;
  shouldRetry: boolean;
  retryCount: number;
  lastRetryTime: number | null;
  forceCheck: () => Promise<void>;
  stopMonitoring: () => void;
  resumeMonitoring: () => void;
  setShouldRetry: (shouldRetry: boolean) => void;
}

// Store global pour l'état de connexion backend
export const useBackendConnectionStore = create<BackendConnectionState>((set, get) => ({
  status: {
    isOnline: true,
    lastCheck: null,
    errorMessage: null,
    responseTime: null,
    isInactive: false,
    consecutiveFailures: 0,
    isChecking: false,
  },
  isConnected: true,
  shouldRetry: true,
  retryCount: 0,
  lastRetryTime: null,

  forceCheck: async () => {
    const { status } = get();
    console.log('🔄 Tentative de reconnexion globale...');
    
    set(state => ({
      ...state,
      retryCount: state.retryCount + 1,
      lastRetryTime: Date.now(),
      shouldRetry: true,
    }));
  },

  stopMonitoring: () => {
    console.log('⏸️ Arrêt du monitoring global');
    set(state => ({
      ...state,
      shouldRetry: false,
    }));
  },

  resumeMonitoring: () => {
    console.log('▶️ Reprise du monitoring global');
    set(state => ({
      ...state,
      shouldRetry: true,
    }));
  },

  setShouldRetry: (shouldRetry: boolean) => {
    set(state => ({
      ...state,
      shouldRetry,
    }));
  },
}));

// Hook pour utiliser la connexion backend de manière centralisée
export const useBackendConnection = () => {
  const backendStatus = useBackendStatus(30000); // 30 secondes
  const store = useBackendConnectionStore();

  // Synchroniser l'état du hook avec le store global
  React.useEffect(() => {
    store.status = backendStatus;
    store.isConnected = backendStatus.isOnline;
  }, [backendStatus, store]);

  return {
    ...backendStatus,
    ...store,
  };
};

// Hook pour vérifier si on peut faire des requêtes
export const useCanMakeRequests = () => {
  const { isOnline, consecutiveFailures, isChecking } = useBackendConnection();
  
  // On peut faire des requêtes si :
  // 1. Le backend est en ligne, OU
  // 2. On n'a pas eu trop d'échecs consécutifs (< 3), OU
  // 3. On est en train de vérifier (première tentative)
  const canMakeRequests = isOnline || consecutiveFailures < 3 || isChecking;
  
  return canMakeRequests;
};

// Hook pour les requêtes conditionnelles
export const useConditionalRequest = () => {
  const canMakeRequests = useCanMakeRequests();
  const { forceCheck } = useBackendConnection();

  const makeRequest = async <T>(
    requestFn: () => Promise<T>,
    fallbackValue?: T
  ): Promise<T | null> => {
    if (!canMakeRequests) {
      console.log('🚫 Requête bloquée - Backend déconnecté');
      return fallbackValue || null;
    }

    try {
      return await requestFn();
    } catch (error) {
      console.error('❌ Erreur de requête:', error);
      // Si c'est une erreur de connexion, forcer une vérification
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        await forceCheck();
      }
      return fallbackValue || null;
    }
  };

  return {
    canMakeRequests,
    makeRequest,
    forceCheck,
  };
};
