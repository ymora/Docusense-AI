
import { handleApiError } from '../utils/apiUtils';
import { logService } from './logService';
import unifiedApiService from './unifiedApiService';

export interface AIProvider {
  name: string;
  priority: number;
  models: string[];
  default_model: string;
  base_url?: string;
  is_active: boolean;
  has_api_key: boolean;
  is_connected: boolean;
  is_functional?: boolean;
  api_key?: string;
  last_tested?: string;
  is_configured?: boolean;
}

export interface ProviderStatus {
  status: 'valid' | 'invalid' | 'testing' | 'not_configured';
  message: string;
  lastTested?: string;
}

export interface AIProvidersResponse {
  providers: AIProvider[];
  strategy: string;
  available_providers: string[];
  active_count: number;
  total_count: number;
  functional_count: number;
  configured_count: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ConfigService {
  // Obtenir la configuration des providers IA
  static async getAIProviders(): Promise<AIProvidersResponse> {
    try {
      const response = await unifiedApiService.get('/api/config/ai/providers');
      
      logService.info('Configuration des providers IA chargée avec succès', 'ConfigService', { 
        providersCount: response.data?.providers?.length || 0,
        strategy: response.data?.strategy || 'priority'
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = `Impossible de charger les providers IA: ${handleApiError(error)}`;
      logService.error(errorMessage, 'ConfigService', { error: error.message });
      throw new Error(errorMessage);
    }
  }

  // Récupérer une clé API
  static async getAPIKey(provider: string): Promise<{ success: boolean; data?: { key: string; provider: string }; message?: string }> {
    try {
      const response = await unifiedApiService.get(`/api/config/ai/key/${encodeURIComponent(provider)}`);

      if (response.data?.success && response.data?.data) {
        // Vérifier que la réponse correspond bien au provider demandé
        if (response.data.data.provider === provider) {
          logService.info(`Clé API récupérée pour ${provider}`, 'ConfigService', { provider });
          return {
            success: true,
            data: response.data.data,
            message: response.data.message
          };
        } else {
          return {
            success: false,
            message: `Incohérence de provider: demandé ${provider}, reçu ${response.data.data.provider}`
          };
        }
      } else {
        logService.warning(`Échec de la récupération de la clé API pour ${provider}`, 'ConfigService', { 
          provider, 
          message: response.data?.message 
        });
        return {
          success: false,
          message: response.data?.message || 'Erreur inconnue'
        };
      }
    } catch (error) {
      const errorMessage = `Erreur lors de la récupération de la clé API pour ${provider}: ${handleApiError(error)}`;
      logService.error(errorMessage, 'ConfigService', { provider, error: error.message });
      return {
        success: false,
        message: `Erreur lors de la récupération: ${handleApiError(error)}`
      };
    }
  }

  // Sauvegarder une clé API
  static async saveAPIKey(provider: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await unifiedApiService.post('/api/config/ai/key', {
        provider,
        api_key: apiKey
      });

      if (response.data?.success) {
        logService.info(`Clé API sauvegardée pour ${provider}`, 'ConfigService', { provider });
        return {
          success: true,
          message: response.data.message || 'Clé API sauvegardée'
        };
      } else {
        logService.warning(`Échec de la sauvegarde de la clé API pour ${provider}`, 'ConfigService', { 
          provider, 
          message: response.data?.message 
        });
        return {
          success: false,
          message: response.data?.message || 'Erreur lors de la sauvegarde'
        };
      }
    } catch (error) {
      const errorMessage = `Erreur lors de la sauvegarde de la clé API pour ${provider}: ${handleApiError(error)}`;
      logService.error(errorMessage, 'ConfigService', { provider, error: error.message });
      return {
        success: false,
        message: `Erreur lors de la sauvegarde: ${handleApiError(error)}`
      };
    }
  }

  // Supprimer une clé API
  static async deleteAPIKey(provider: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await unifiedApiService.delete(`/api/config/ai/key/${encodeURIComponent(provider)}`);

      if (response.data?.success) {
        logService.info(`Clé API supprimée pour ${provider}`, 'ConfigService', { provider });
        return {
          success: true,
          message: response.data.message || 'Clé API supprimée'
        };
      } else {
        logService.warning(`Échec de la suppression de la clé API pour ${provider}`, 'ConfigService', { 
          provider, 
          message: response.data?.message 
        });
        return {
          success: false,
          message: response.data?.message || 'Erreur lors de la suppression'
        };
      }
    } catch (error) {
      const errorMessage = `Erreur lors de la suppression de la clé API pour ${provider}: ${handleApiError(error)}`;
      logService.error(errorMessage, 'ConfigService', { provider, error: error.message });
      return {
        success: false,
        message: `Erreur lors de la suppression: ${handleApiError(error)}`
      };
    }
  }

  // Tester une connexion (alias pour compatibilité)
  static async testConnection(provider: string, apiKey?: string): Promise<{ success: boolean; message: string; cached?: boolean }> {
    return this.testProvider(provider, apiKey);
  }

  // Tester un provider
  static async testProvider(provider: string, apiKey?: string): Promise<{ success: boolean; message: string; cached?: boolean }> {
    try {
      const response = await unifiedApiService.post('/api/config/ai/test', {
        provider,
        api_key: apiKey
      });

      if (response.data?.success) {
        logService.info(`Test de connexion réussi pour ${provider}`, 'ConfigService', { 
          provider, 
          cached: response.data.cached || false 
        });
        return {
          success: true,
          message: response.data.message || 'Test réussi',
          cached: response.data.cached || false
        };
      } else {
        logService.warning(`Test de connexion échoué pour ${provider}`, 'ConfigService', { 
          provider, 
          message: response.data?.message 
        });
        return {
          success: false,
          message: response.data?.message || 'Test échoué',
          cached: response.data?.cached || false
        };
      }
    } catch (error) {
      const errorMessage = `Erreur lors du test de connexion pour ${provider}: ${handleApiError(error)}`;
      logService.error(errorMessage, 'ConfigService', { provider, error: error.message });
      return {
        success: false,
        message: `Erreur lors du test: ${handleApiError(error)}`,
        cached: false
      };
    }
  }

  // Mettre à jour la priorité d'un provider
  static async updatePriority(provider: string, priority: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await unifiedApiService.put(`/api/config/ai/priority/${encodeURIComponent(provider)}`, {
        priority
      });

      if (response.data?.success) {
        logService.info(`Priorité mise à jour pour ${provider}`, 'ConfigService', { provider, priority });
        return {
          success: true,
          message: response.data.message || 'Priorité mise à jour'
        };
      } else {
        logService.warning(`Échec de la mise à jour de la priorité pour ${provider}`, 'ConfigService', { 
          provider, 
          priority,
          message: response.data?.message 
        });
        return {
          success: false,
          message: response.data?.message || 'Erreur lors de la mise à jour'
        };
      }
    } catch (error) {
      const errorMessage = `Erreur lors de la mise à jour de la priorité pour ${provider}: ${handleApiError(error)}`;
      logService.error(errorMessage, 'ConfigService', { provider, priority, error: error.message });
      return {
        success: false,
        message: `Erreur lors de la mise à jour: ${handleApiError(error)}`
      };
    }
  }

  // Obtenir les priorités
  static async getPriorities(): Promise<Record<string, number>> {
    try {
      const response = await unifiedApiService.get('/api/config/ai/priorities');
      return response.data?.priority || {};
    } catch (error) {
      logService.error('Erreur lors de la récupération des priorités', 'ConfigService', { error: error.message });
      return {};
    }
  }

  // Mettre à jour la stratégie
  static async updateStrategy(strategy: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await unifiedApiService.put('/api/config/ai/strategy', { strategy });

      if (response.data?.success) {
        logService.info('Stratégie mise à jour', 'ConfigService', { strategy });
        return {
          success: true,
          message: response.data.message || 'Stratégie mise à jour'
        };
      } else {
        logService.warning('Échec de la mise à jour de la stratégie', 'ConfigService', { 
          strategy,
          message: response.data?.message 
        });
        return {
          success: false,
          message: response.data?.message || 'Erreur lors de la mise à jour'
        };
      }
    } catch (error) {
      const errorMessage = `Erreur lors de la mise à jour de la stratégie: ${handleApiError(error)}`;
      logService.error(errorMessage, 'ConfigService', { strategy, error: error.message });
      return {
        success: false,
        message: `Erreur lors de la mise à jour: ${handleApiError(error)}`
      };
    }
  }

  // Obtenir la stratégie actuelle
  static async getStrategy(): Promise<string> {
    try {
      const response = await unifiedApiService.get('/api/config/ai/strategy');
      return response.data?.strategy || 'priority';
    } catch (error) {
      logService.error('Erreur lors de la récupération de la stratégie', 'ConfigService', { error: error.message });
      return 'priority';
    }
  }

  // Obtenir les métriques
  static async getMetrics(): Promise<Record<string, any>> {
    try {
      const response = await unifiedApiService.get('/api/config/ai/metrics');
      return response.data?.metrics || {};
    } catch (error) {
      logService.error('Erreur lors de la récupération des métriques', 'ConfigService', { error: error.message });
      return {};
    }
  }

  // Valider la configuration
  static async validateConfig(): Promise<{ success: boolean; message: string; fixes?: string[] }> {
    try {
      const response = await unifiedApiService.post('/api/config/ai/validate');

      if (response.data?.success) {
        logService.info('Configuration validée', 'ConfigService', { 
          fixes: response.data.fixes_applied 
        });
        return {
          success: true,
          message: response.data.message || 'Validation terminée',
          fixes: response.data.fixes_applied
        };
      } else {
        logService.warning('Échec de la validation de la configuration', 'ConfigService', { 
          message: response.data?.message 
        });
        return {
          success: false,
          message: response.data?.message || 'Validation échouée',
          fixes: response.data?.fixes_applied
        };
      }
    } catch (error) {
      const errorMessage = `Erreur lors de la validation de la configuration: ${handleApiError(error)}`;
      logService.error(errorMessage, 'ConfigService', { error: error.message });
      return {
        success: false,
        message: `Erreur lors de la validation: ${handleApiError(error)}`
      };
    }
  }

  // Réinitialiser les priorités
  static async resetPriorities(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await unifiedApiService.post('/api/config/ai/reset-priorities');

      if (response.data?.success) {
        logService.info('Priorités réinitialisées', 'ConfigService');
        return {
          success: true,
          message: response.data.message || 'Priorités réinitialisées'
        };
      } else {
        logService.warning('Échec de la réinitialisation des priorités', 'ConfigService', { 
          message: response.data?.message 
        });
        return {
          success: false,
          message: response.data?.message || 'Erreur lors de la réinitialisation'
        };
      }
    } catch (error) {
      const errorMessage = `Erreur lors de la réinitialisation des priorités: ${handleApiError(error)}`;
      logService.error(errorMessage, 'ConfigService', { error: error.message });
      return {
        success: false,
        message: `Erreur lors de la réinitialisation: ${handleApiError(error)}`
      };
    }
  }

  // Obtenir les providers fonctionnels
  static async getFunctionalProviders(): Promise<string[]> {
    try {
      const response = await unifiedApiService.get('/api/config/ai/functional-providers');
      return response.data?.functional_providers || [];
    } catch (error) {
      logService.error('Erreur lors de la récupération des providers fonctionnels', 'ConfigService', { error: error.message });
      return [];
    }
  }

  // Mettre à jour le statut d'un provider
  static async updateProviderStatus(provider: string, status: boolean): Promise<{ success: boolean; message: string }> {
    try {
      const response = await unifiedApiService.put(`/api/config/ai/status/${encodeURIComponent(provider)}`, {
        is_active: status
      });

      if (response.data?.success) {
        logService.info(`Statut mis à jour pour ${provider}`, 'ConfigService', { provider, status });
        return {
          success: true,
          message: response.data.message || `Statut de ${provider} mis à jour`
        };
      } else {
        logService.warning(`Échec de la mise à jour du statut pour ${provider}`, 'ConfigService', { 
          provider, 
          status,
          message: response.data?.message 
        });
        return {
          success: false,
          message: response.data?.message || 'Erreur lors de la mise à jour'
        };
      }
    } catch (error) {
      const errorMessage = `Erreur lors de la mise à jour du statut pour ${provider}: ${handleApiError(error)}`;
      logService.error(errorMessage, 'ConfigService', { provider, status, error: error.message });
      return {
        success: false,
        message: `Erreur lors de la mise à jour: ${handleApiError(error)}`
      };
    }
  }

  // Obtenir le statut d'un provider
  static async getProviderStatus(provider: string): Promise<{ status: string; is_functional: boolean }> {
    try {
      const response = await unifiedApiService.get(`/api/config/ai/status/${encodeURIComponent(provider)}`);
      return {
        status: response.data?.status || 'unknown',
        is_functional: response.data?.is_functional || false
      };
    } catch (error) {
      logService.error(`Erreur lors de la récupération du statut pour ${provider}`, 'ConfigService', { error: error.message });
      return {
        status: 'error',
        is_functional: false
      };
    }
  }
}

// Export de l'instance pour compatibilité
export const configService = ConfigService;
export default ConfigService;