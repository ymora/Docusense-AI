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

const startPeriodicCheck = (interval: number = 120000) => { // 2 minutes au lieu de 30s
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Vérification initiale immédiate
  checkBackendHealth();
  
  // Puis vérification périodique
  checkInterval = setInterval(() => {
    // Vérifier si l'utilisateur est inactif (plus de 10 minutes sans activité)
    const lastActivity = localStorage.getItem('lastUserActivity');
    const now = Date.now();
    const inactiveThreshold = 10 * 60 * 1000; // 10 minutes
    
    if (lastActivity && (now - parseInt(lastActivity)) > inactiveThreshold) {
      globalState = { ...globalState, isInactive: true };
      notifySubscribers();
      return; // Ne pas vérifier le backend si inactif
    }
    
    checkBackendHealth();
  }, interval);
};

const stopPeriodicCheck = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

export const useBackendConnection = (checkIntervalMs: number = 120000) => { // 2 minutes par défaut
  const { isAuthenticated } = useAuthStore();
  const [state, setState] = useState<BackendConnectionState>(globalState);

  // Détection d'activité utilisateur
  useEffect(() => {
    const updateActivity = () => {
      localStorage.setItem('lastUserActivity', Date.now().toString());
      if (globalState.isInactive) {
        globalState = { ...globalState, isInactive: false };
        notifySubscribers();
      }
    };

    // Événements pour détecter l'activité
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

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
      // Utiliser requestIdleCallback pour éviter les violations de performance
      inactivityTimer = setTimeout(() => {
        requestIdleCallback(() => {
          globalState = { ...globalState, isInactive: true };
          notifySubscribers();
        });
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
      // Ne pas forcer isConnected à true quand non authentifié
      // Laisser la vérification réelle du backend
      if (!isInitialized) {
        isInitialized = true;
        checkBackendHealth();
      }
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
