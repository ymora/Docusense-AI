import { useState, useEffect } from 'react';

export interface BackendStatus {
  isOnline: boolean;
  lastCheck: Date | null;
  errorMessage: string | null;
  responseTime: number | null;
  isInactive: boolean; // Nouveau: indique si le frontend est inactif
}

export const useBackendStatus = (checkInterval: number = 60000) => { // OPTIMISATION: Augmenté à 60s pour réduire les logs
  const [status, setStatus] = useState<BackendStatus>({
    isOnline: true, // On commence optimiste
    lastCheck: null,
    errorMessage: null,
    responseTime: null,
    isInactive: false, // Nouveau: commence actif
  });

  const [isMonitoring, setIsMonitoring] = useState(true);

  const checkBackendHealth = async () => {
    // Ne pas vérifier si le frontend est inactif et qu'on n'a pas de connexion
    if (status.isInactive && !status.isOnline) {
      return;
    }

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
          isInactive: false, // Réactiver quand la connexion est rétablie
        });
      } else {
        setStatus({
          isOnline: false,
          lastCheck: new Date(),
          errorMessage: `Erreur HTTP: ${response.status} ${response.statusText}`,
          responseTime,
          isInactive: status.isInactive, // Conserver l'état d'inactivité
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
        isInactive: status.isInactive, // Conserver l'état d'inactivité
      });
    }
  };

  // Détection d'inactivité
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_TIMEOUT = 30000; // 30 secondes d'inactivité pour réduire les logs

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (status.isInactive) {

        setStatus(prev => ({ ...prev, isInactive: false }));
      }
      inactivityTimer = setTimeout(() => {
        // L'état inactif se déclenche indépendamment du statut du backend

        setStatus(prev => ({ ...prev, isInactive: true }));
      }, INACTIVITY_TIMEOUT);
    };

    // Événements pour détecter l'activité
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Démarrer le timer d'inactivité
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
    };
  }, [status.isInactive]);

  useEffect(() => {
    // Vérification immédiate au montage
    checkBackendHealth();

    // Vérification périodique seulement si on surveille
    let interval: NodeJS.Timeout;
    if (isMonitoring) {
      interval = setInterval(checkBackendHealth, checkInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [checkInterval, isMonitoring, status.isInactive]);

  // Fonction pour forcer une vérification manuelle (reconnexion)
  const forceCheck = async () => {

    
    // Réactiver la surveillance si elle était désactivée
    if (!isMonitoring) {
      setIsMonitoring(true);
    }
    
    // Réactiver l'état actif
    setStatus(prev => ({ ...prev, isInactive: false }));
    
    // Effectuer une vérification immédiate
    await checkBackendHealth();
  };

  // Fonction pour arrêter la surveillance (quand inactif)
  const stopMonitoring = () => {

    setIsMonitoring(false);
  };

  // Fonction pour reprendre la surveillance
  const resumeMonitoring = () => {

    setIsMonitoring(true);
  };

  return {
    ...status,
    forceCheck,
    stopMonitoring,
    resumeMonitoring,
  };
};