import { useCallback } from 'react';
import { useBackendStatus } from './useBackendStatus';
import { logService } from '../services/logService';

export interface BackendConnectionState {
  isOnline: boolean;
  canMakeRequests: boolean;
  isInactive: boolean;
  lastCheck: Date | null;
  errorMessage: string | null;
  responseTime: number | null;
  consecutiveFailures: number;
}

export const useBackendConnection = () => {
  const backendStatus = useBackendStatus();
  
  const canMakeRequests = backendStatus.isOnline && !backendStatus.isInactive;

  const conditionalRequest = useCallback(
    async <T>(
      requestFn: () => Promise<T>,
      fallbackValue?: T
    ): Promise<T | null> => {
      if (!canMakeRequests) {
        logService.warning('Requête bloquée - Backend déconnecté', 'BackendConnection', {
          isOnline: backendStatus.isOnline,
          isInactive: backendStatus.isInactive,
          lastCheck: backendStatus.lastCheck?.toISOString(),
          timestamp: new Date().toISOString()
        });
        return fallbackValue || null;
      }

      try {
        return await requestFn();
      } catch (error) {
        logService.error('Erreur de requête', 'BackendConnection', {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
        
        // Si c'est une erreur de connexion, forcer une vérification
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
          await backendStatus.forceCheck();
        }
        
        return fallbackValue || null;
      }
    },
    [canMakeRequests, backendStatus]
  );

  const state: BackendConnectionState = {
    isOnline: backendStatus.isOnline,
    canMakeRequests,
    isInactive: backendStatus.isInactive,
    lastCheck: backendStatus.lastCheck,
    errorMessage: backendStatus.errorMessage,
    responseTime: backendStatus.responseTime,
    consecutiveFailures: backendStatus.consecutiveFailures
  };

  return {
    ...state,
    conditionalRequest,
    forceCheck: backendStatus.forceCheck,
    stopMonitoring: backendStatus.stopMonitoring,
    resumeMonitoring: backendStatus.resumeMonitoring
  };
};
