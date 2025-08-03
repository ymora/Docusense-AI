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
      console.log('🚀 Initialisation des configurations au démarrage de l\'application...');
      loadAIProviders();
    } else {
      console.log('🔑 Configurations déjà initialisées, utilisation du cache');
    }
  }, [loadAIProviders, isInitialized]);

  return { isInitialized };
}; 