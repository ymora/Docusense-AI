import { useState, useEffect, useCallback, useRef } from 'react';
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

// Cache global pour éviter les rechargements multiples
// Pas de durée d'expiration - le cache reste valide jusqu'à invalidation manuelle
let globalCache: {
  data: AIConfigState | null;
  timestamp: number | null;
} = {
  data: null,
  timestamp: null
};

export const useAIConfig = (): AIConfigState & AIConfigActions => {
  const [state, setState] = useState<AIConfigState>({
    providers: [],
    providerStatuses: {},
    apiKeys: {},
    priorities: {},
    strategy: 'priority',
    metrics: {},
    loading: true,
    error: null,
    lastLoaded: null
  });

  const loadingRef = useRef(false);

  // Charger les providers et leur configuration avec cache
  const loadProviders = useCallback(async (forceRefresh = false) => {
    // Éviter les chargements multiples simultanés
    if (loadingRef.current && !forceRefresh) {
      return;
    }

    // Vérifier le cache si pas de force refresh
    if (!forceRefresh && globalCache.data) {
      setState(prev => ({
        ...prev,
        ...globalCache.data!,
        loading: false
      }));
      return;
    }

    loadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Appel unique optimisé - charger toutes les données en parallèle
      const [response, priorities, strategy, metrics] = await Promise.all([
        ConfigService.getAIProviders(),
        ConfigService.getProviderPriorities(),
        ConfigService.getStrategy(),
        ConfigService.getMetrics()
      ]);

      // Extraire les clés API et créer les statuts
      const apiKeys: Record<string, string> = {};
      const providerStatuses: Record<string, ProviderStatus> = {};
      
      response.providers.forEach((provider: AIProvider) => {
        if (provider.api_key) {
          apiKeys[provider.name] = provider.api_key;
        }
        
        // Utiliser les statuts conservés en base de données
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

      const newState = {
        providers: response.providers,
        providerStatuses,
        apiKeys,
        priorities,
        strategy,
        metrics,
        loading: false,
        error: null,
        lastLoaded: Date.now()
      };

      // Mettre à jour le cache global (sans timestamp d'expiration)
      globalCache = {
        data: newState,
        timestamp: null
      };

      setState(newState);
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration IA:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
    } finally {
      loadingRef.current = false;
    }
  }, []); // Dépendances vides pour éviter les re-créations

  // Forcer le rechargement (invalider le cache)
  const forceRefresh = useCallback(async () => {
    globalCache = { data: null, timestamp: null };
    await loadProviders(true);
  }, [loadProviders]); // Dépendance stable

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
        
        // Invalider le cache et recharger
        await forceRefresh();
      }
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de la clé API pour ${provider}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, [forceRefresh]);

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
      
      // Recharger les providers seulement si le test n'était pas en cache et a réussi
      if (result.success && !result.cached) {
        await forceRefresh();
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
  }, [forceRefresh]);

  // Définir la priorité d'un provider
  const setPriority = useCallback(async (provider: string, priority: number) => {
    try {
      const result = await ConfigService.setProviderPriority(provider, priority);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          priorities: { ...prev.priorities, [provider]: priority }
        }));
        
        // Invalider le cache pour refléter les changements
        globalCache = { data: null, timestamp: null };
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
        await forceRefresh();
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la validation des priorités:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }, [forceRefresh]);

  // Réinitialiser les priorités
  const resetPriorities = useCallback(async () => {
    try {
      const result = await ConfigService.resetPriorities();
      
      if (result.success) {
        setState(prev => ({ ...prev, priorities: {} }));
        // Invalider le cache
        globalCache = { data: null, timestamp: null };
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

  // Supprimer le chargement automatique au montage
  // Le chargement se fera maintenant seulement quand ConfigContent est monté

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
    getProviderStatus,
    forceRefresh
  };
}; 