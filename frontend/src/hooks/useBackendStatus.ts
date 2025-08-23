import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '../utils/apiUtils';

export interface BackendStatus {
  isOnline: boolean;
  lastCheck: Date | null;
  errorMessage: string | null;
  responseTime: number | null;
  isInactive: boolean; // Nouveau: indique si le frontend est inactif
  consecutiveFailures: number; // Nombre d'échecs consécutifs
}

export const useBackendStatus = (checkInterval: number = 120000) => { // OPTIMISATION: Augmenté à 2 minutes pour réduire les logs
  const [status, setStatus] = useState<BackendStatus>({
    isOnline: true, // On commence optimiste
    lastCheck: null,
    errorMessage: null,
    responseTime: null,
    isInactive: false, // Nouveau: commence actif
    consecutiveFailures: 0, // Commence avec 0 échec
  });

  const [isMonitoring, setIsMonitoring] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckRef = useRef<Date | null>(null);

  // OPTIMISATION: Utiliser useCallback pour éviter les recréations de fonction
  const checkBackendHealth = useCallback(async () => {
    // Éviter les vérifications trop fréquentes (minimum 30 secondes entre les vérifications)
    const now = new Date();
    if (lastCheckRef.current && (now.getTime() - lastCheckRef.current.getTime()) < 30000) {
      return;
    }
    lastCheckRef.current = now;

    // Ne pas vérifier si le frontend est inactif et qu'on n'a pas de connexion
    if (status.isInactive && !status.isOnline) {
      return;
    }

    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:8000/api/health/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Si on arrive ici, la requête a réussi
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        lastCheck: new Date(),
        errorMessage: null,
        responseTime,
        isInactive: false, // Réactiver quand la connexion est rétablie
        consecutiveFailures: 0, // Réinitialiser les échecs consécutifs
      }));
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

      setStatus(prev => ({
        ...prev,
        isOnline: false,
        lastCheck: new Date(),
        errorMessage,
        responseTime,
        consecutiveFailures: prev.consecutiveFailures + 1, // Incrémenter les échecs
      }));
    }
  }, [status.isInactive, status.isOnline]);

  // Détection d'inactivité - OPTIMISATION: Utiliser useRef pour éviter les boucles
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 60000; // 60 secondes d'inactivité pour réduire les logs

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      setStatus(prev => {
        if (prev.isInactive) {
          return { ...prev, isInactive: false };
        }
        return prev;
      });

      inactivityTimerRef.current = setTimeout(() => {
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
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
    };
  }, []); // OPTIMISATION: Dépendances vides pour éviter les boucles

  // Vérification périodique - OPTIMISATION: Séparer la logique
  useEffect(() => {
    // Vérification immédiate au montage
    checkBackendHealth();

    // Nettoyer l'intervalle précédent
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Vérification périodique seulement si on surveille
    if (isMonitoring) {
      intervalRef.current = setInterval(checkBackendHealth, checkInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkInterval, isMonitoring, checkBackendHealth]); // OPTIMISATION: Ajouter checkBackendHealth

  // Fonction pour forcer une vérification manuelle (reconnexion)
  const forceCheck = useCallback(async () => {
    // Réactiver la surveillance si elle était désactivée
    if (!isMonitoring) {
      setIsMonitoring(true);
    }
    
    // Réactiver l'état actif
    setStatus(prev => ({ ...prev, isInactive: false }));
    
    // Effectuer une vérification immédiate
    await checkBackendHealth();
  }, [isMonitoring, checkBackendHealth]);

  // Fonction pour arrêter la surveillance (quand inactif)
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Fonction pour reprendre la surveillance
  const resumeMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  return {
    ...status,
    forceCheck,
    stopMonitoring,
    resumeMonitoring,
  };
};