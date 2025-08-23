import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AIProvider, ConfigServiceResponse } from '../hooks/useConfigService';
import { logService } from '../services/logService';
import { unifiedApiService } from '../services/unifiedApiService';

type AIProvidersResponse = ConfigServiceResponse<AIProvider[]>;

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

  // Actions d'état (sans appels API)
  setAIProviders: (providers: AIProvider[]) => void;
  setAIProvidersResponse: (response: AIProvidersResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setLastUpdated: (lastUpdated: string | null) => void;
  
  // Getters
  getProviderByName: (name: string) => AIProvider | undefined;
  getFunctionalProviders: () => AIProvider[];
  getActiveProviders: () => AIProvider[];
  getConfiguredProviders: () => AIProvider[];
  getAIProviders: () => AIProvider[];
  getProviderStatus: (name: string) => 'valid' | 'invalid' | 'testing' | 'not_configured';
  
  // Actions avec appels API
  loadAIProviders: () => Promise<void>;
  refreshAIProviders: () => Promise<void>;
  
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

        // Actions d'état
        setAIProviders: (providers: AIProvider[]) => {
          set({ aiProviders: providers });
        },

        setAIProvidersResponse: (response: AIProvidersResponse | null) => {
          set({ aiProvidersResponse: response });
        },

        setLoading: (loading: boolean) => {
          set({ loading });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        setInitialized: (initialized: boolean) => {
          set({ isInitialized: initialized });
        },

        setLastUpdated: (lastUpdated: string | null) => {
          set({ lastUpdated });
        },

        // Getters
        getProviderByName: (name: string) => {
          return get().aiProviders.find(provider => provider.name === name);
        },

        getFunctionalProviders: () => {
          return get().aiProviders.filter(provider => provider.is_functional);
        },

        getActiveProviders: () => {
          return get().aiProviders.filter(provider => provider.is_functional && provider.is_configured);
        },

        getConfiguredProviders: () => {
          return get().aiProviders.filter(provider => provider.is_configured);
        },

        getAIProviders: () => {
          return get().aiProviders;
        },

        getProviderStatus: (name: string) => {
          const provider = get().getProviderByName(name);
          return provider?.status || 'not_configured';
        },

        // Actions avec appels API
        loadAIProviders: async () => {
          try {
            set({ loading: true, error: null });
            
            logService.info('Chargement des providers IA', 'ConfigStore', {
              timestamp: new Date().toISOString()
            });

            const response = await unifiedApiService.get('/api/config/ai/providers');
            
            // L'API retourne directement { providers: [...] } au lieu de { success: true, data: [...] }
            if (response && response.providers) {
              const formattedResponse: ConfigServiceResponse<AIProvider[]> = {
                success: true,
                data: response.providers,
                message: 'Providers loaded successfully'
              };
              
              set({ 
                aiProviders: response.providers,
                aiProvidersResponse: formattedResponse,
                isInitialized: true,
                lastUpdated: new Date().toISOString(),
                loading: false
              });
              
              logService.info('Providers IA chargés avec succès', 'ConfigStore', {
                count: response.providers.length,
                timestamp: new Date().toISOString()
              });
            } else {
              throw new Error(response.error || 'Erreur lors du chargement des providers');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            set({ 
              error: errorMessage,
              loading: false
            });
            
            logService.error('Erreur lors du chargement des providers IA', 'ConfigStore', {
              error: errorMessage,
              timestamp: new Date().toISOString()
            });
          }
        },

        refreshAIProviders: async () => {
          const { loadAIProviders } = get();
          await loadAIProviders();
        },

        // Utilitaires
        clearError: () => {
          set({ error: null });
        },

        reset: () => {
          set({
            aiProviders: [],
            aiProvidersResponse: null,
            loading: false,
            error: null,
            isInitialized: false,
            lastUpdated: null,
          });
        },
      }),
      {
        name: 'config-storage',
        partialize: (state) => ({
          aiProviders: state.aiProviders,
          aiProvidersResponse: state.aiProvidersResponse,
          isInitialized: state.isInitialized,
          lastUpdated: state.lastUpdated,
          version: state.version,
        }),
      }
    )
  )
); 