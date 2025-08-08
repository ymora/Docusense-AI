import { useEffect } from 'react';
import { usePromptStore } from '../stores/promptStore';

/**
 * Hook pour initialiser les prompts au démarrage de l'application
 * Les prompts sont chargés une seule fois et mis en cache
 */
export const usePromptInitialization = () => {
  const { loadPrompts, isInitialized } = usePromptStore();

  useEffect(() => {
    // Charger les prompts seulement si pas encore initialisé
    if (!isInitialized) {

      loadPrompts();
    } else {

    }
  }, [loadPrompts, isInitialized]);

  return { isInitialized };
}; 