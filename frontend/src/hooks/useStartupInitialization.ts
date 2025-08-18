import { useEffect, useRef } from 'react';
import { useStartupStore } from '../stores/startupStore';

/**
 * Hook pour initialiser l'application au démarrage
 * Gère l'initialisation des prompts, configurations et autres données nécessaires
 */
export const useStartupInitialization = () => {
  const { initialize, isInitialized, initializationStep } = useStartupStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized && !hasInitialized.current) {
      hasInitialized.current = true;
      initialize();
    }
  }, [isInitialized]); // Retirer initialize des dépendances pour éviter les appels multiples

  return { 
    isInitialized, 
    initializationStep,
    isLoading: !isInitialized && initializationStep !== 'error'
  };
}; 