import { useCallback } from 'react';
import { useConfigStore } from '../stores/configStore';
import ConfigService, { AIProvider, ProviderStatus } from '../services/configService';

export interface AIConfigState {
  providers: AIProvider[];
  providerStatuses: Record<string, ProviderStatus>;
  apiKeys: Record<string, string>;
  priorities: Record<string, number>;
  strategy: string;
  metrics: any;
  loading: boolean;
  error: string | null;
  lastLoaded: number | null; // Timestamp du dernier chargement
}

export interface AIConfigActions {
  loadProviders: () => Promise<void>;
  saveAPIKey: (provider: string, apiKey: string) => Promise<{ success: boolean; message: string }>;
  testProvider: (provider: string) => Promise<{ success: boolean; message: string }>;
  setPriority: (provider: string, priority: number) => Promise<{ success: boolean; message: string }>;
  setStrategy: (strategy: string) => Promise<{ success: boolean; message: string }>;
  validateAndFixPriorities: () => Promise<{ success: boolean; message: string; fixes?: any }>;
  resetPriorities: () => Promise<{ success: boolean; message: string }>;
  getActiveValidProvidersCount: () => number;
  isProviderActive: (provider: AIProvider) => boolean;
  getProviderStatus: (providerName: string) => ProviderStatus | null;
  forceRefresh: () => Promise<void>; // Nouveau: forcer le rechargement
}

export const useAIConfig = (): AIConfigState & AIConfigActions => {
  const {
    aiProviders: providers,
    aiProvidersResponse,
    loading,
    error,
    lastUpdated,
    saveAPIKey,
    testProvider,
    setProviderPriority,
    setStrategy,
    refreshAIProviders,
    getProviderByName,
    getFunctionalProviders,
    getActiveProviders,
    getConfiguredProviders,
    getProviderStatus: getProviderStatusFromStore
  } = useConfigStore();

  // Charger les providers et leur configuration avec cache
  const loadProviders = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      await refreshAIProviders();
    }
  }, [refreshAIProviders]);

  // Forcer le rechargement (invalider le cache)
  const forceRefresh = useCallback(async () => {
    await refreshAIProviders();
  }, [refreshAIProviders]);

  // Sauvegarder une clé API (utilise le store)
  const saveAPIKeyWrapper = useCallback(async (provider: string, apiKey: string) => {
    return await saveAPIKey(provider, apiKey);
  }, []);

  // Tester un provider (utilise le store)
  const testProviderWrapper = useCallback(async (provider: string) => {
    return await testProvider(provider);
  }, []);

  // Définir la priorité d'un provider (utilise le store)
  const setPriorityWrapper = useCallback(async (provider: string, priority: number) => {
    return await setProviderPriority(provider, priority);
  }, []);

  // Définir la stratégie (utilise le store)
  const setStrategyWrapper = useCallback(async (strategy: string) => {
    return await setStrategy(strategy);
  }, []);

  // Valider et corriger les priorités (utilise le service directement)
  const validateAndFixPriorities = useCallback(async () => {
    try {
      const result = await ConfigService.validateAndFixPriorities();
      
      if (result.success) {
        // Recharger les providers pour voir les corrections
        await refreshAIProviders();
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la validation des priorités:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, [refreshAIProviders]);

  // Réinitialiser les priorités (utilise le service directement)
  const resetPriorities = useCallback(async () => {
    try {
      const result = await ConfigService.resetPriorities();
      
      if (result.success) {
        // Recharger les providers pour voir les changements
        await refreshAIProviders();
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des priorités:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, [refreshAIProviders]);

  // Obtenir le nombre de providers actifs et valides
  const getActiveValidProvidersCount = useCallback(() => {
    return providers.filter(p => {
      const status = getProviderStatusFromStore(p.name);
      const isActive = p.priority > 0;
      return status === 'valid' && isActive;
    }).length;
  }, [providers, getProviderStatusFromStore]);

  // Vérifier si un provider est actif
  const isProviderActive = useCallback((provider: AIProvider) => {
    return provider.priority > 0;
  }, []);

  // Obtenir le statut d'un provider
  const getProviderStatus = useCallback((providerName: string) => {
    const status = getProviderStatusFromStore(providerName);
    if (status === 'not_configured') {
      return { status: 'not_configured', message: 'Aucune clé API configurée' };
    } else if (status === 'valid') {
      return { status: 'valid', message: 'Clé API valide et connectée' };
    } else {
      return { status: 'invalid', message: 'Clé API invalide ou connexion échouée' };
    }
  }, [getProviderStatusFromStore]);

  // Calculer les données dérivées
  const providerStatuses: Record<string, ProviderStatus> = {};
  const apiKeys: Record<string, string> = {};
  const priorities: Record<string, number> = {};
  
  providers.forEach(provider => {
    providerStatuses[provider.name] = getProviderStatus(provider.name);
    if (provider.has_api_key) {
      apiKeys[provider.name] = 'configured';
    }
    priorities[provider.name] = provider.priority;
  });

  const strategy = aiProvidersResponse?.strategy || 'priority';
  const metrics = aiProvidersResponse || {};
  const lastLoaded = lastUpdated ? new Date(lastUpdated).getTime() : null;

  return {
    providers,
    providerStatuses,
    apiKeys,
    priorities,
    strategy,
    metrics,
    loading,
    error,
    lastLoaded,
    loadProviders,
    saveAPIKey: saveAPIKeyWrapper,
    testProvider: testProviderWrapper,
    setPriority: setPriorityWrapper,
    setStrategy: setStrategyWrapper,
    validateAndFixPriorities,
    resetPriorities,
    getActiveValidProvidersCount,
    isProviderActive,
    getProviderStatus,
    forceRefresh
  };
}; 