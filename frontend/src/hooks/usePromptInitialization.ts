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
      console.log('🚀 Initialisation des prompts au démarrage de l\'application...');
      loadPrompts();
    } else {
      console.log('📋 Prompts déjà initialisés, utilisation du cache');
    }
  }, [loadPrompts, isInitialized]);

  return { isInitialized };
}; 