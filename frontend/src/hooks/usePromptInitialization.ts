import { useEffect } from 'react';
import { usePromptStore } from '../stores/promptStore';

export const usePromptInitialization = () => {
  const { loadPrompts, isInitialized } = usePromptStore();

  useEffect(() => {
    if (!isInitialized) {
      loadPrompts();
    }
  }, [loadPrompts, isInitialized]);

  return { isInitialized };
}; 