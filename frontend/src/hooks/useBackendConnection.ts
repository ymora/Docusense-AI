import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/apiUtils';
import useAuthStore from '../stores/authStore';
import { logService } from '../services/logService';

interface BackendConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  lastCheck: Date | null;
  error: string | null;
  responseTime: number | null;
  isInactive: boolean;
  consecutiveFailures: number;
}

// Singleton global pour éviter les multiples instances
let globalState: BackendConnectionState = {
  isConnected: false,
  isLoading: true,
  lastCheck: null,
  error: null,
  responseTime: null,
  isInactive: false,
  consecutiveFailures: 0,
};

let subscribers: Set<(state: BackendConnectionState) => void> = new Set();
let checkInterval: NodeJS.Timeout | null = null;
let isInitialized = false;
let isMonitoring = false;

const notifySubscribers = () => {
  subscribers.forEach(callback => callback(globalState));
};

const checkBackendHealth = async () => {
  if (globalState.isLoading) return; // Éviter les vérifications simultanées
  
  globalState = { ...globalState, isLoading: true, error: null };
  notifySubscribers();

  const startTime = Date.now();

  try {
    const response = await apiRequest('/api/health/', {
      method: 'GET',
    }, 5000);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    globalState = {
      isConnected: true,
      isLoading: false,
      lastCheck: new Date(),
      error: null,
      responseTime,
      isInactive: false,
      consecutiveFailures: 0,
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    let errorMessage = 'Erreur de connexion';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout de connexion (5s)';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Backend inaccessible';
      } else {
        errorMessage = error.message;
      }
    }

    globalState = {
      isConnected: false,
      isLoading: false,
      lastCheck: new Date(),
      error: errorMessage,
      responseTime,
      isInactive: globalState.isInactive,
      consecutiveFailures: globalState.consecutiveFailures + 1,
    };
  }
  
  notifySubscribers();
};

const startPeriodicCheck = (interval: number = 5000) => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  checkInterval = setInterval(checkBackendHealth, interval);
};

const stopPeriodicCheck = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

export const useBackendConnection = (checkIntervalMs: number = 5000) => {
  const { isAuthenticated } = useAuthStore();
  const [state, setState] = useState<BackendConnectionState>(globalState);

  // Détection d'inactivité
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT = 30000;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (globalState.isInactive) {
        globalState = { ...globalState, isInactive: false };
        notifySubscribers();
      }
      inactivityTimer = setTimeout(() => {
        globalState = { ...globalState, isInactive: true };
        notifySubscribers();
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
    };
  }, []);

  // Gestion de l'authentification
  useEffect(() => {
    if (isAuthenticated) {
      isMonitoring = true;
      if (!isInitialized) {
        isInitialized = true;
        checkBackendHealth();
        startPeriodicCheck(checkIntervalMs);
      }
    } else {
      isMonitoring = false;
      globalState = {
        isConnected: true,
        isLoading: false,
        lastCheck: null,
        error: null,
        responseTime: null,
        isInactive: false,
        consecutiveFailures: 0,
      };
      notifySubscribers();
    }
  }, [isAuthenticated, checkIntervalMs]);

  useEffect(() => {
    const updateState = (newState: BackendConnectionState) => {
      setState(newState);
    };
    
    subscribers.add(updateState);
    
    return () => {
      subscribers.delete(updateState);
      
      if (subscribers.size === 0) {
        stopPeriodicCheck();
        isInitialized = false;
      }
    };
  }, []);

  const refreshConnection = useCallback(() => {
    checkBackendHealth();
  }, []);

  const forceCheck = useCallback(async () => {
    if (!isMonitoring) {
      isMonitoring = true;
    }
    globalState = { ...globalState, isInactive: false };
    notifySubscribers();
    await checkBackendHealth();
  }, []);

  const checkBackendOnce = useCallback(async (): Promise<boolean> => {
    try {
      await apiRequest('/api/health/', { method: 'GET' }, 3000);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // Fonction pour faire des requêtes conditionnelles selon l'état du backend
  const conditionalRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    fallbackValue: T
  ): Promise<T> => {
    if (!state.isConnected || state.isLoading) {
      return fallbackValue;
    }
    
    try {
      return await requestFn();
    } catch (error) {
      logService.error('Erreur lors de la requête conditionnelle', 'BackendConnection', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      return fallbackValue;
    }
  }, [state.isConnected, state.isLoading]);

  return {
    ...state,
    refreshConnection,
    forceCheck,
    checkBackendOnce,
    conditionalRequest,
    // Compatibilité avec l'ancien useBackendStatus
    isOnline: state.isConnected,
    canMakeRequests: state.isConnected && !state.isLoading,
    errorMessage: state.error,
  };
};
