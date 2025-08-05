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
      console.log('🚀 Initialisation de l\'application au démarrage...');
      initialize();
    } else {
      // console.log('🚀 Application déjà initialisée, utilisation du cache'); // Log désactivé pour réduire le bruit
    }
  }, [initialize, isInitialized]);

  return { 
    isInitialized, 
    initializationStep,
    isLoading: !isInitialized && initializationStep !== 'error'
  };
}; 