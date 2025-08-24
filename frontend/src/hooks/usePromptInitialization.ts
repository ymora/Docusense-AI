import { useEffect } from 'react';
import { usePromptStore } from '../stores/promptStore';

/**
 * Hook pour initialiser les prompts au démarrage de l'application
 * Les prompts sont chargés une seule fois et mis en cache
 */
export const usePromptInitialization = () => {
  const { reloadPrompts } = usePromptStore();

  useEffect(() => {
    // Charger les prompts seulement si pas encore initialisé
    reloadPrompts();
  }, [reloadPrompts]);

  return { isInitialized: true };
}; 