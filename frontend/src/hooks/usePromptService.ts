/**
 * Hook unifié pour la gestion des prompts
 * Utilise le service unifié et respecte l'architecture
 */

import { useBackendConnection } from './useBackendConnection';
import { promptService, Prompt, PromptCategory, PromptServiceResponse } from '../services/promptService';
import { useUnifiedAuth } from './useUnifiedAuth';

// Hook pour utiliser le service de prompts avec guards de connexion
export const usePromptService = () => {
  const { conditionalRequest } = useBackendConnection();
  const { isAuthenticated } = useUnifiedAuth();
  
  return {
    getPrompts: (): Promise<PromptServiceResponse<Prompt[]>> => {
      if (!isAuthenticated) {
        console.log('[PromptService] Utilisateur non authentifié - pas de chargement des prompts');
        return Promise.resolve({ success: false, data: [], error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => promptService.getPrompts(),
        { success: false, data: [], error: 'Backend déconnecté' }
      );
    },
    
    getPromptCategories: (): Promise<PromptServiceResponse<PromptCategory[]>> => {
      if (!isAuthenticated) {
        console.log('[PromptService] Utilisateur non authentifié - pas de chargement des catégories');
        return Promise.resolve({ success: false, data: [], error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => promptService.getPromptCategories(),
        { success: false, data: [], error: 'Backend déconnecté' }
      );
    },
    
    getPromptsByCategory: (category: string): Promise<PromptServiceResponse<Prompt[]>> => {
      if (!isAuthenticated) {
        console.log('[PromptService] Utilisateur non authentifié - pas de chargement des prompts par catégorie:', category);
        return Promise.resolve({ success: false, data: [], error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => promptService.getPromptsByCategory(category),
        { success: false, data: [], error: 'Backend déconnecté' }
      );
    },
    
    getPromptsByFileType: (fileType: string): Promise<PromptServiceResponse<Prompt[]>> => {
      if (!isAuthenticated) {
        console.log('[PromptService] Utilisateur non authentifié - pas de chargement des prompts par type de fichier:', fileType);
        return Promise.resolve({ success: false, data: [], error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => promptService.getPromptsByFileType(fileType),
        { success: false, data: [], error: 'Backend déconnecté' }
      );
    },
    
    getPromptFormat: (): Promise<PromptServiceResponse<string>> => {
      if (!isAuthenticated) {
        console.log('[PromptService] Utilisateur non authentifié - pas de récupération du format de prompt');
        return Promise.resolve({ success: false, data: '', error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => promptService.getPromptFormat(),
        { success: false, data: '', error: 'Backend déconnecté' }
      );
    },
    
    getAllPrompts: (): Promise<PromptServiceResponse<{ default_prompts: Prompt[]; specialized_prompts: Prompt[] }>> => {
      if (!isAuthenticated) {
        console.log('[PromptService] Utilisateur non authentifié - pas de chargement de tous les prompts');
        return Promise.resolve({ 
          success: false, 
          data: { default_prompts: [], specialized_prompts: [] }, 
          error: 'Utilisateur non authentifié' 
        });
      }
      return conditionalRequest(
        () => promptService.getAllPrompts(),
        { 
          success: false, 
          data: { default_prompts: [], specialized_prompts: [] }, 
          error: 'Backend déconnecté' 
        }
      );
    }
  };
};

export type { Prompt, PromptCategory, PromptServiceResponse };
