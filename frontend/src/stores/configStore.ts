import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ConfigService, AIProvider, AIProvidersResponse } from '../services/configService';
import { createLoadingActions, createCallGuard, createOptimizedUpdater } from '../utils/storeUtils';
import { logService } from '../services/logService';

interface ConfigState {
  // État des providers IA
  aiProviders: AIProvider[];
  aiProvidersResponse: AIProvidersResponse | null;
  
  // État de chargement
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Métadonnées
  lastUpdated: string | null;
  version: string;

  // Actions pour les providers IA
  loadAIProviders: () => Promise<void>;
  refreshAIProviders: () => Promise<void>;
  saveAPIKey: (provider: string, apiKey: string) => Promise<{ success: boolean; message: string }>;
  testProvider: (provider: string) => Promise<{ success: boolean; message: string; cached?: boolean }>;
  setProviderPriority: (provider: string, priority: number) => Promise<{ success: boolean; message: string }>;
  setStrategy: (strategy: string) => Promise<{ success: boolean; message: string }>;
  
  // Getters
  getProviderByName: (name: string) => AIProvider | undefined;
  getFunctionalProviders: () => AIProvider[];
  getActiveProviders: () => AIProvider[];
  getConfiguredProviders: () => AIProvider[];
  getAIProviders: () => AIProvider[];
  getProviderStatus: (name: string) => 'valid' | 'invalid' | 'testing' | 'not_configured';
  
  // Utilitaires
  clearError: () => void;
  reset: () => void;
}

export const useConfigStore = create<ConfigState>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        aiProviders: [],
        aiProvidersResponse: null,
        loading: false,
        error: null,
        isInitialized: false,
        lastUpdated: null,
        version: '1.0.0',

        // Chargement initial des providers IA (protégé contre les appels multiples)
        loadAIProviders: (() => {
          const callGuard = createCallGuard();
          return callGuard(async () => {
            const loadingActions = createLoadingActions(set, get);
            
            if (!loadingActions.startLoading()) {
              return;
            }
            
            try {
              const response = await ConfigService.getAIProviders();
              
              set({ 
                aiProviders: response.providers || [],
                aiProvidersResponse: response,
                loading: false, 
                isInitialized: true,
                error: null,
                lastUpdated: new Date().toISOString()
              });
              
              // Vérifier et corriger les priorités au chargement
              await get()._ensurePrioritiesAreValid();
              
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des configurations';
              set({ 
                error: errorMessage, 
                loading: false,
                isInitialized: true
              });
              console.error('❌ Erreur lors du chargement des configurations:', error);
            }
          });
        })(),

        // Actualisation des providers IA (optimisée)
        refreshAIProviders: (() => {
          const callGuard = createCallGuard();
          return callGuard(async () => {
            const loadingActions = createLoadingActions(set, get);
            const updater = createOptimizedUpdater(set, get);
            
            if (!loadingActions.startLoading()) {
              return;
            }
            
            try {

              const response = await ConfigService.getAIProviders();
              
              updater.updateMultiple({
                aiProviders: response.providers || [],
                aiProvidersResponse: response,
                lastUpdated: new Date().toISOString()
              });
              
              loadingActions.finishLoading();

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'actualisation des configurations';
              loadingActions.finishLoadingWithError(errorMessage);
              console.error('❌ Erreur lors de l\'actualisation des configurations:', error);
            }
          });
        })(),

        // Sauvegarder une clé API (optimisée)
        saveAPIKey: (() => {
          const callGuard = createCallGuard();
          return callGuard(async (provider: string, apiKey: string) => {
            try {

              const result = await ConfigService.saveAPIKey(provider, apiKey);
              
              if (result.success) {
                // Mise à jour optimisée du provider
                const currentProviders = get().aiProviders;
                const updatedProviders = currentProviders.map(p => {
                  if (p.name === provider) {
                    return {
                      ...p,
                      has_api_key: true,
                      api_key_configured: true
                    };
                  }
                  return p;
                });
                
                const updater = createOptimizedUpdater(set, get);
                updater.updateMultiple({
                  aiProviders: updatedProviders,
                  lastUpdated: new Date().toISOString()
                });
                

              }
              
              return result;
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde';
              logService.error(`Erreur lors de la sauvegarde de la clé API: ${errorMessage}`, 'ConfigStore', { error: error.message });
              console.error('❌ Erreur lors de la sauvegarde de la clé API:', error);
              return {
                success: false,
                message: errorMessage
              };
            }
          });
        })(),

        // Tester un provider (optimisé)
        testProvider: (() => {
          const callGuard = createCallGuard();
          return callGuard(async (provider: string) => {
            try {

              const result = await ConfigService.testProvider(provider);
              
              // Mise à jour optimisée du statut du provider
              const currentProviders = get().aiProviders;
              const updatedProviders = currentProviders.map(p => {
                if (p.name === provider) {
                  return {
                    ...p,
                    status: result.success ? 'valid' : 'invalid',
                    is_functional: result.success,
                    last_tested: new Date().toISOString()
                  };
                }
                return p;
              });
              
              const updater = createOptimizedUpdater(set, get);
              updater.updateMultiple({
                aiProviders: updatedProviders,
                lastUpdated: new Date().toISOString()
              });
              

              
              return result;
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erreur lors du test';
              console.error('❌ Erreur lors du test du provider:', error);
              
              // Mise à jour du statut en cas d'erreur
              const currentProviders = get().aiProviders;
              const updatedProviders = currentProviders.map(p => {
                if (p.name === provider) {
                  return {
                    ...p,
                    status: 'invalid',
                    is_functional: false,
                    last_tested: new Date().toISOString()
                  };
                }
                return p;
              });
              
              const updater = createOptimizedUpdater(set, get);
              updater.updateMultiple({
                aiProviders: updatedProviders,
                lastUpdated: new Date().toISOString()
              });
              
              return {
                success: false,
                message: errorMessage,
                cached: false
              };
            }
          });
        })(),

        // Définir la priorité d'un provider
        setProviderPriority: async (provider: string, priority: number) => {
          try {

            const result = await ConfigService.setProviderPriority(provider, priority);
            
            if (result.success) {
              // Mettre à jour localement la priorité du provider
              const currentProviders = get().aiProviders;
              const updatedProviders = currentProviders.map(p => {
                if (p.name === provider) {
                  return {
                    ...p,
                    priority: priority
                  };
                }
                return p;
              });
              
              set({ 
                aiProviders: updatedProviders,
                lastUpdated: new Date().toISOString()
              });
              

            }
            
            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
            console.error('❌ Erreur lors de la définition de la priorité:', error);
            return {
              success: false,
              message: errorMessage
            };
          }
        },

        // Définir la stratégie
        setStrategy: async (strategy: string) => {
          try {

            const result = await ConfigService.setStrategy(strategy);
            
            if (result.success) {
              // Mettre à jour localement la stratégie
              const currentResponse = get().aiProvidersResponse;
              const updatedResponse = currentResponse ? {
                ...currentResponse,
                strategy: strategy
              } : { strategy: strategy, providers: [] };
              
              set({ 
                aiProvidersResponse: updatedResponse,
                lastUpdated: new Date().toISOString()
              });
              

            }
            
            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
            console.error('❌ Erreur lors de la définition de la stratégie:', error);
            return {
              success: false,
              message: errorMessage
            };
          }
        },

        // Getters
        getProviderByName: (name: string) => {
          return get().aiProviders.find(provider => provider.name === name);
        },

        getFunctionalProviders: () => {
          return get().aiProviders.filter(provider => provider.is_functional);
        },

        getActiveProviders: () => {
          return get().aiProviders.filter(provider => provider.is_active);
        },

        getConfiguredProviders: () => {
          return get().aiProviders.filter(provider => provider.has_api_key);
        },

        getAIProviders: () => {
          return get().aiProviders;
        },

        getProviderStatus: (name: string) => {
          const provider = get().getProviderByName(name);
          if (!provider) return 'not_configured';
          if (!provider.has_api_key) return 'not_configured';
          if (provider.is_functional) return 'valid';
          return 'invalid';
        },

        // Utilitaires (optimisés)
        clearError: () => {
          const loadingActions = createLoadingActions(set, get);
          loadingActions.clearError();
        },

        reset: () => {
          const loadingActions = createLoadingActions(set, get);
          loadingActions.resetLoading();
          set({
            aiProviders: [],
            aiProvidersResponse: null,
            isInitialized: false,
            lastUpdated: null
          });
        },

        // Méthode privée pour s'assurer que les priorités sont valides
        _ensurePrioritiesAreValid: async () => {
          try {
            const providers = get().aiProviders;
            const activeProviders = providers.filter(p => p.is_active);
            
            // Vérifier si les priorités sont séquentielles
            const priorities = activeProviders.map(p => p.priority).sort((a, b) => a - b);
            const expectedPriorities = Array.from({ length: activeProviders.length }, (_, i) => i + 1);
            
            const prioritiesAreValid = priorities.length === expectedPriorities.length && 
              priorities.every((p, i) => p === expectedPriorities[i]);
            
            if (!prioritiesAreValid && activeProviders.length > 0) {
              console.log('🔄 Correction automatique des priorités...');
              
              // Recharger les providers pour obtenir les priorités corrigées
              await get().refreshAIProviders();
            }
          } catch (error) {
            console.warn('⚠️ Erreur lors de la vérification des priorités:', error);
          }
        }
      }),
      {
        name: 'config-store',
        partialize: (state) => ({
          aiProviders: state.aiProviders,
          aiProvidersResponse: state.aiProvidersResponse,
          isInitialized: state.isInitialized,
          lastUpdated: state.lastUpdated,
          version: state.version
        })
      }
    )
  )
); 