import { useState, useEffect } from 'react';

export interface BackendStatus {
  isOnline: boolean;
  lastCheck: Date | null;
  errorMessage: string | null;
  responseTime: number | null;
}

export const useBackendStatus = (checkInterval: number = 10000) => {
  const [status, setStatus] = useState<BackendStatus>({
    isOnline: true, // On commence optimiste
    lastCheck: null,
    errorMessage: null,
    responseTime: null,
  });

  const checkBackendHealth = async () => {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Timeout court pour détecter rapidement les problèmes
        signal: AbortSignal.timeout(5000),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        setStatus({
          isOnline: true,
          lastCheck: new Date(),
          errorMessage: null,
          responseTime,
        });
      } else {
        setStatus({
          isOnline: false,
          lastCheck: new Date(),
          errorMessage: `Erreur HTTP: ${response.status} ${response.statusText}`,
          responseTime,
        });
      }
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

      setStatus({
        isOnline: false,
        lastCheck: new Date(),
        errorMessage,
        responseTime,
      });
    }
  };

  useEffect(() => {
    // Vérification immédiate au montage
    checkBackendHealth();

    // Vérification périodique
    const interval = setInterval(checkBackendHealth, checkInterval);

    return () => {
      clearInterval(interval);
    };
  }, [checkInterval]);

  // Fonction pour forcer une vérification manuelle
  const forceCheck = () => {
    checkBackendHealth();
  };

  return {
    ...status,
    forceCheck,
  };
}; 