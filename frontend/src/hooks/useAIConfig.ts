import { useState, useEffect, useCallback } from 'react';
import ConfigService, { AIProvider, ProviderStatus, ValidationResult } from '../services/configService';

export interface AIConfigState {
  providers: AIProvider[];
  providerStatuses: Record<string, ProviderStatus>;
  apiKeys: Record<string, string>;
  priorities: Record<string, number>;
  strategy: string;
  metrics: any;
  loading: boolean;
  error: string | null;
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
}

export const useAIConfig = (): AIConfigState & AIConfigActions => {
  const [state, setState] = useState<AIConfigState>({
    providers: [],
    providerStatuses: {},
    apiKeys: {},
    priorities: {},
    strategy: 'priority',
    metrics: {},
    loading: true,
    error: null
  });

  // Charger les providers et leur configuration
  const loadProviders = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await ConfigService.getAIProviders();
      const priorities = await ConfigService.getProviderPriorities();
      const strategy = await ConfigService.getStrategy();
      const metrics = await ConfigService.getMetrics();

      // Extraire les clés API et créer les statuts
      const apiKeys: Record<string, string> = {};
      const providerStatuses: Record<string, ProviderStatus> = {};
      
      response.providers.forEach((provider: AIProvider) => {
        if (provider.api_key) {
          apiKeys[provider.name] = provider.api_key;
        }
        
        // Définir le statut du provider
        if (provider.is_functional && provider.has_api_key) {
          providerStatuses[provider.name] = {
            status: 'valid',
            message: 'Clé API valide et connectée',
            lastTested: provider.last_tested
          };
        } else if (provider.has_api_key && !provider.is_functional) {
          providerStatuses[provider.name] = {
            status: 'invalid',
            message: 'Clé API invalide ou connexion échouée',
            lastTested: provider.last_tested
          };
        } else {
          providerStatuses[provider.name] = {
            status: 'not_configured',
            message: 'Aucune clé API configurée'
          };
        }
      });

      setState(prev => ({
        ...prev,
        providers: response.providers,
        providerStatuses,
        apiKeys,
        priorities,
        strategy,
        metrics,
        loading: false
      }));
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration IA:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
    }
  }, []);

  // Sauvegarder une clé API
  const saveAPIKey = useCallback(async (provider: string, apiKey: string) => {
    try {
      const result = await ConfigService.saveAPIKey(provider, apiKey);
      
      if (result.success) {
        // Mettre à jour l'état local
        setState(prev => ({
          ...prev,
          apiKeys: { ...prev.apiKeys, [provider]: apiKey }
        }));
        
        // Recharger les providers pour mettre à jour les statuts
        await loadProviders();
      }
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de la clé API pour ${provider}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, [loadProviders]);

  // Tester un provider
  const testProvider = useCallback(async (provider: string) => {
    
    
    // Marquer comme en cours de test
    setState(prev => ({
      ...prev,
      providerStatuses: {
        ...prev.providerStatuses,
        [provider]: {
          status: 'testing',
          message: 'Test de connexion en cours...'
        }
      }
    }));

    try {
      
      const result = await ConfigService.testProvider(provider);
      
      
      // Mettre à jour le statut selon le résultat
      setState(prev => ({
        ...prev,
        providerStatuses: {
          ...prev.providerStatuses,
          [provider]: {
            status: result.success ? 'valid' : 'invalid',
            message: result.message,
            lastTested: new Date().toISOString()
          }
        }
      }));
      
      // Recharger les providers si le test réussit
      if (result.success) {
        
        await loadProviders();
      } else {
        
      }
      
      return result;
    } catch (error) {
      console.error(`💥 Erreur lors du test du provider ${provider}:`, error);
      
      setState(prev => ({
        ...prev,
        providerStatuses: {
          ...prev.providerStatuses,
          [provider]: {
            status: 'invalid',
            message: 'Erreur de connexion',
            lastTested: new Date().toISOString()
          }
        }
      }));
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, [loadProviders]);

  // Définir la priorité d'un provider
  const setPriority = useCallback(async (provider: string, priority: number) => {
    try {
      const result = await ConfigService.setProviderPriority(provider, priority);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          priorities: { ...prev.priorities, [provider]: priority }
        }));
      }
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de la définition de la priorité pour ${provider}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, []);

  // Définir la stratégie
  const setStrategy = useCallback(async (strategy: string) => {
    try {
      const result = await ConfigService.setStrategy(strategy);
      
      if (result.success) {
        setState(prev => ({ ...prev, strategy }));
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la définition de la stratégie:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, []);

  // Valider et corriger les priorités
  const validateAndFixPriorities = useCallback(async () => {
    try {
      const result = await ConfigService.validateAndFixPriorities();
      
      if (result.success) {
        // Recharger les providers pour voir les corrections
        await loadProviders();
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la validation des priorités:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, [loadProviders]);

  // Réinitialiser les priorités
  const resetPriorities = useCallback(async () => {
    try {
      const result = await ConfigService.resetPriorities();
      
      if (result.success) {
        setState(prev => ({ ...prev, priorities: {} }));
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des priorités:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, []);

  // Obtenir le nombre de providers actifs et valides
  const getActiveValidProvidersCount = useCallback(() => {
    return state.providers.filter(p => {
      const status = state.providerStatuses[p.name];
      const isActive = state.priorities[p.name] > 0;
      return status?.status === 'valid' && isActive;
    }).length;
  }, [state.providers, state.providerStatuses, state.priorities]);

  // Vérifier si un provider est actif
  const isProviderActive = useCallback((provider: AIProvider) => {
    return state.priorities[provider.name] > 0;
  }, [state.priorities]);

  // Obtenir le statut d'un provider
  const getProviderStatus = useCallback((providerName: string) => {
    return state.providerStatuses[providerName] || null;
  }, [state.providerStatuses]);

  // Charger les données au montage
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return {
    ...state,
    loadProviders,
    saveAPIKey,
    testProvider,
    setPriority,
    setStrategy,
    validateAndFixPriorities,
    resetPriorities,
    getActiveValidProvidersCount,
    isProviderActive,
    getProviderStatus
  };
}; 