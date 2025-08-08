
import { apiRequest, handleApiError } from '../utils/apiUtils';

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
      const response = await apiRequest('/api/config/ai/providers', {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Erreur lors du chargement des providers IA:', error);
      throw new Error(`Impossible de charger les providers IA: ${handleApiError(error)}`);
    }
  }

  // Sauvegarder une clé API
  static async saveAPIKey(provider: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest(`/api/config/ai/key?provider=${encodeURIComponent(provider)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey })
      });

      return {
        success: response.success,
        message: response.message || 'Clé API sauvegardée'
      };
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de la clé API pour ${provider}:`, error);
      return {
        success: false,
        message: `Erreur lors de la sauvegarde: ${handleApiError(error)}`
      };
    }
  }

  // Tester un provider (optimisé avec cache)
  static async testProvider(provider: string, apiKey?: string): Promise<{ success: boolean; message: string; cached?: boolean }> {
    try {
      const requestBody = apiKey ? { api_key: apiKey } : {};
      
      const response = await apiRequest(`/api/config/ai/test?provider=${encodeURIComponent(provider)}`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }, 30000); // 30 secondes de timeout pour les tests

      return {
        success: response.success || false,
        message: response.message || 'Test terminé',
        cached: response.cached || false
      };
    } catch (error) {
      console.error(`Erreur lors du test du provider ${provider}:`, error);
      return {
        success: false,
        message: `Erreur de test: ${handleApiError(error)}`,
        cached: false
      };
    }
  }

  // Définir la priorité d'un provider
  static async setProviderPriority(provider: string, priority: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest(`/api/config/ai/priority?provider=${encodeURIComponent(provider)}&priority=${priority}`, {
        method: 'POST'
      });

      return {
        success: response.success,
        message: response.message || 'Priorité mise à jour'
      };
    } catch (error) {
      console.error(`Erreur lors de la définition de la priorité pour ${provider}:`, error);
      return {
        success: false,
        message: `Erreur lors de la mise à jour: ${handleApiError(error)}`
      };
    }
  }

  // Obtenir les priorités des providers
  static async getProviderPriorities(): Promise<Record<string, number>> {
    try {
      const response = await apiRequest('/api/config/ai/priority', {
        method: 'GET'
      });
      return response.priority || {};
    } catch (error) {
      console.error('Erreur lors du chargement des priorités:', error);
      return {};
    }
  }

  // Définir la stratégie de sélection
  static async setStrategy(strategy: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest(`/api/config/ai/strategy?strategy=${encodeURIComponent(strategy)}`, {
        method: 'POST'
      });

      return {
        success: response.success,
        message: response.message || 'Stratégie mise à jour'
      };
    } catch (error) {
      console.error('Erreur lors de la définition de la stratégie:', error);
      return {
        success: false,
        message: `Erreur lors de la mise à jour: ${handleApiError(error)}`
      };
    }
  }

  // Obtenir la stratégie actuelle
  static async getStrategy(): Promise<string> {
    try {
      const response = await apiRequest('/api/config/ai/strategy', {
        method: 'GET'
      });
      return response.strategy || 'priority';
    } catch (error) {
      console.error('Erreur lors du chargement de la stratégie:', error);
      return 'priority';
    }
  }

  // Obtenir les métriques
  static async getMetrics(): Promise<any> {
    try {
      const response = await apiRequest('/api/config/ai/metrics', {
        method: 'GET'
      });
      return response.metrics || {};
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
      return {};
    }
  }

  // Valider et corriger les priorités automatiquement
  static async validateAndFixPriorities(): Promise<{ success: boolean; message: string; fixes?: any }> {
    try {
      const response = await apiRequest('/api/config/ai/priority/validate', {
        method: 'POST'
      });

      return {
        success: response.success,
        message: response.message || 'Validation terminée',
        fixes: response.fixes_applied
      };
    } catch (error) {
      console.error('Erreur lors de la validation des priorités:', error);
      return {
        success: false,
        message: `Erreur lors de la validation: ${handleApiError(error)}`
      };
    }
  }

  // Réinitialiser toutes les priorités
  static async resetPriorities(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest('/api/config/ai/priority/reset', {
        method: 'POST'
      });

      return {
        success: response.success,
        message: response.message || 'Priorités réinitialisées'
      };
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des priorités:', error);
      return {
        success: false,
        message: `Erreur lors de la réinitialisation: ${handleApiError(error)}`
      };
    }
  }

  // Obtenir les providers fonctionnels uniquement
  static async getFunctionalProviders(): Promise<AIProvider[]> {
    try {
      const response = await apiRequest('/api/config/ai/providers/functional', {
        method: 'GET'
      });
      return response.functional_providers || [];
    } catch (error) {
      console.error('Erreur lors du chargement des providers fonctionnels:', error);
      return [];
    }
  }

  // Définir le statut d'un provider (actif/inactif)
  static async setProviderStatus(provider: string, status: 'valid' | 'inactive'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest(`/api/config/ai/providers/status?provider=${encodeURIComponent(provider)}&status=${status}`, {
        method: 'POST'
      });

      return {
        success: response.success || false,
        message: response.message || `Statut de ${provider} mis à jour`
      };
    } catch (error) {
      console.error(`Erreur lors du changement de statut pour ${provider}:`, error);
      return {
        success: false,
        message: `Erreur lors du changement de statut: ${handleApiError(error)}`
      };
    }
  }

  // Obtenir le statut d'un provider
  static async getProviderStatus(provider: string): Promise<{ success: boolean; status?: string; is_functional?: boolean }> {
    try {
      const response = await apiRequest(`/api/config/ai/providers/status/${encodeURIComponent(provider)}`, {
        method: 'GET'
      });

      return {
        success: response.success || false,
        status: response.status,
        is_functional: response.is_functional
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération du statut pour ${provider}:`, error);
      return {
        success: false
      };
    }
  }
}

export default ConfigService;