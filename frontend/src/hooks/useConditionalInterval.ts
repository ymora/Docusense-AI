import { useEffect, useRef } from 'react';
import { useBackendConnection } from './useBackendConnection';

interface UseConditionalIntervalOptions {
  callback: () => void | Promise<void>;
  delay: number;
  enabled?: boolean;
  immediate?: boolean;
}

export const useConditionalInterval = ({
  callback,
  delay,
  enabled = true,
  immediate = false
}: UseConditionalIntervalOptions) => {
  const { canMakeRequests } = useBackendConnection();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbackRef = useRef(callback);

  // Mettre à jour la référence du callback
  callbackRef.current = callback;

  useEffect(() => {
    // Nettoyer l'intervalle existant
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Vérifier si on peut démarrer l'intervalle
    const shouldStart = enabled && canMakeRequests && delay > 0;

    if (shouldStart) {
      // Exécuter immédiatement si demandé
      if (immediate) {
        callbackRef.current();
      }

      // Démarrer l'intervalle
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, delay);
    }

    // Nettoyage à la destruction
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, canMakeRequests, delay, immediate]);

  // Fonction pour forcer l'exécution du callback
  const executeNow = () => {
    if (canMakeRequests) {
      callbackRef.current();
    }
  };

  // Fonction pour redémarrer l'intervalle
  const restart = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (enabled && canMakeRequests && delay > 0) {
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, delay);
    }
  };

  return {
    isActive: !!intervalRef.current,
    executeNow,
    restart
  };
};
