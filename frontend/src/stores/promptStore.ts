import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { promptService, Prompt, PromptCategory } from '../services/promptService';
import { createLoadingActions, createCallGuard, createOptimizedUpdater } from '../utils/storeUtils';
import { getFileTypeFromMime } from '../utils/fileTypeUtils';

interface PromptState {
  prompts: Prompt[];
  categories: PromptCategory[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  loadPrompts: () => Promise<void>;
  getPrompts: () => Prompt[];
  getCategories: () => PromptCategory[];
  getPromptById: (id: string) => Prompt | undefined;
  getPromptsByDomain: (domain: string) => Prompt[];
  getPromptsByType: (type: string) => Prompt[];
  getComparisonPrompts: () => Prompt[];
  getAnalysisPrompts: () => Prompt[];
  getPromptsForFileType: (mimeType: string) => Prompt[];
  refreshPrompts: () => Promise<void>;
}

export const usePromptStore = create<PromptState>()(
  devtools(
    persist(
      (set, get) => ({
        prompts: [],
        categories: [],
        loading: false,
        error: null,
        isInitialized: false,

        loadPrompts: (() => {
          const callGuard = createCallGuard();
          return callGuard(async () => {
            const { isInitialized } = get();
            
            // Ne charger qu'une seule fois au démarrage
            if (isInitialized) {

              return;
            }

            const loadingActions = createLoadingActions(set, get);
            const updater = createOptimizedUpdater(set, get);
            
            if (!loadingActions.startLoading()) {
              return;
            }
            
            try {

              const prompts = await promptService.getPrompts();
              const categories = promptService.getPromptCategories();
              
              updater.updateMultiple({ 
                prompts, 
                categories, 
                isInitialized: true,
                error: null 
              });
              
              loadingActions.finishLoading();

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des prompts';
              loadingActions.finishLoadingWithError(errorMessage);
              set({ isInitialized: true }); // Marquer comme initialisé même en cas d'erreur
              console.error('❌ Erreur lors du chargement des prompts:', error);
            }
          });
        })(),

        getPrompts: () => {
          return get().prompts;
        },

        getCategories: () => {
          return get().categories;
        },

        getPromptById: (id: string) => {
          return get().prompts.find(prompt => prompt.id === id);
        },

        getPromptsByDomain: (domain: string) => {
          return get().prompts.filter(prompt => prompt.domain === domain);
        },

        getPromptsByType: (type: string) => {
          return get().prompts.filter(prompt => prompt.type === type);
        },

        getComparisonPrompts: () => {
          return get().prompts.filter(prompt => prompt.type === 'comparison');
        },

        getAnalysisPrompts: () => {
          return get().prompts.filter(prompt => prompt.type === 'analysis');
        },

        getPromptsForFileType: (mimeType: string) => {
          const prompts = get().prompts;
          const fileType = getFileTypeFromMime(mimeType);
          
          switch (fileType) {
            case 'document':
              return prompts.filter(p => p.domain !== 'technical' || p.type === 'analysis');
            case 'image':
              return prompts.filter(p => p.type === 'analysis' || p.type === 'extraction');
            case 'media':
              return prompts.filter(p => p.type === 'analysis' || p.type === 'extraction');
            default:
              return prompts;
          }
        },

        refreshPrompts: async () => {
          set({ loading: true, error: null });
          
          try {

            const prompts = await promptService.getPrompts();
            const categories = promptService.getPromptCategories();
            
            set({ 
              prompts, 
              categories, 
              loading: false,
              error: null 
            });
            

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'actualisation des prompts';
            set({ 
              error: errorMessage, 
              loading: false
            });
            console.error('❌ Erreur lors de l\'actualisation des prompts:', error);
          }
        }
      }),
      {
        name: 'prompt-store',
        partialize: (state) => ({
          prompts: state.prompts,
          categories: state.categories,
          isInitialized: state.isInitialized
        })
      }
    )
  )
);

 