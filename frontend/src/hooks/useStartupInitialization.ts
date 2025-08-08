import { useEffect } from 'react';
import { useStartupStore } from '../stores/startupStore';

/**
 * Hook pour initialiser l'application au démarrage
 * Gère l'initialisation des prompts, configurations et autres données nécessaires
 */
export const useStartupInitialization = () => {
  const { initialize, isInitialized, initializationStep } = useStartupStore();

  useEffect(() => {
    // Initialiser seulement si pas encore fait
    if (!isInitialized) {

      initialize();
    } else {

    }
  }, [initialize, isInitialized]);

  return { 
    isInitialized, 
    initializationStep,
    isLoading: !isInitialized && initializationStep !== 'error'
  };
}; 