import { useEffect } from 'react';
import { useConfigStore } from '../stores/configStore';

/**
 * Hook pour initialiser les configurations au démarrage de l'application
 * Les configurations sont chargées une seule fois et mises en cache
 */
export const useConfigInitialization = () => {
  const { loadAIProviders, isInitialized } = useConfigStore();

  useEffect(() => {
    // Charger les configurations seulement si pas encore initialisé
    if (!isInitialized) {

      loadAIProviders();
    } else {

    }
  }, [loadAIProviders, isInitialized]);

  return { isInitialized };
}; 