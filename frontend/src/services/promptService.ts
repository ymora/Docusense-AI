/**
 * Service unifié pour la gestion des prompts
 * Respecte l'architecture unifiée : services dans /services/, hooks dans /hooks/
 */

import { unifiedApiService } from './unifiedApiService';

export interface Prompt {
  id: string;
  name: string;
  prompt: string;
  description: string;
  category: string;
  file_types: string[];
}

export interface PromptCategory {
  name: string;
  prompts: Prompt[];
}

export interface PromptServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Service de base pour les prompts
export const promptService = {
  async getPrompts(): Promise<PromptServiceResponse<Prompt[]>> {
    try {
      const response = await unifiedApiService.get('/api/prompts') as any;
      if (response && response.data) {
        const defaultPrompts = response.data.default_prompts || [];
        const specializedPrompts = response.data.specialized_prompts || [];
        const allPrompts = [...defaultPrompts, ...specializedPrompts];
        return { success: true, data: allPrompts };
      }
      return { success: false, error: 'Réponse invalide' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async getPromptCategories(): Promise<PromptServiceResponse<PromptCategory[]>> {
    try {
      const response = await unifiedApiService.get('/api/prompts/categories') as any;
      if (response && response.data) {
        return { 
          success: true, 
          data: response.data,
          count: Object.keys(response.data).length
        };
      }
      return { success: false, error: 'Réponse invalide' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async getPromptsByCategory(category: string): Promise<PromptServiceResponse<Prompt[]>> {
    try {
      const response = await unifiedApiService.get(`/api/prompts/category/${category}`) as any;
      if (response && response.data) {
        return { success: true, data: response.data.prompts || [] };
      }
      return { success: false, error: 'Réponse invalide' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async getPromptsByFileType(fileType: string): Promise<PromptServiceResponse<Prompt[]>> {
    try {
      const response = await unifiedApiService.get(`/api/prompts/file-type/${fileType}`) as any;
      if (response && response.data) {
        return { success: true, data: response.data.prompts || [] };
      }
      return { success: false, error: 'Réponse invalide' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async getPromptFormat(): Promise<PromptServiceResponse<string>> {
    try {
      const response = await unifiedApiService.get('/api/prompts/format') as any;
      if (response && response.data) {
        return { success: true, data: response.data.format || '' };
      }
      return { success: false, error: 'Réponse invalide' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async getAllPrompts(): Promise<PromptServiceResponse<{ default_prompts: Prompt[]; specialized_prompts: Prompt[] }>> {
    try {
      const response = await unifiedApiService.get('/api/prompts/all') as any;
      if (response && response.data) {
        const defaultPrompts = response.data.default_prompts || [];
        const specializedPrompts = response.data.specialized_prompts || [];
        return { 
          success: true, 
          data: { default_prompts: defaultPrompts, specialized_prompts: specializedPrompts }
        };
      }
      return { success: false, error: 'Réponse invalide' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
};
