/**
 * Service API unifié pour DocuSense AI Frontend
 * Consolide les fonctions communes entre les différents services
 */

import { apiRequest, handleApiError } from '../utils/apiUtils';
import { logService } from './logService';
import { useBackendConnection } from '../hooks/useBackendConnection';
import { globalCache } from '../utils/cacheUtils';

const DEFAULT_TIMEOUT = 30000; // 30 secondes

// Types communs
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  sort_by?: string;
  sort_order?: string;
}

// Service de base unifié
class UnifiedApiService {
  private baseUrl = '/api';

  /**
   * Requête GET générique avec cache
   */
  async get<T>(endpoint: string, useCache: boolean = false, cacheKey?: string): Promise<T> {
    try {
      // Vérifier le cache si activé
      if (useCache && cacheKey) {
        const cached = globalCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await apiRequest(`${this.baseUrl}${endpoint}`, {}, DEFAULT_TIMEOUT);
      
      // Sauvegarder en cache si activé
      if (useCache && cacheKey) {
        globalCache.set(cacheKey, response, 300000); // 5 minutes
      }

      return response;
    } catch (error) {
      logService.error(`Erreur GET ${endpoint}`, 'UnifiedApiService', { error: handleApiError(error) });
      throw error;
    }
  }

  /**
   * Requête POST générique
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await apiRequest(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }, DEFAULT_TIMEOUT);

      return response;
    } catch (error) {
      logService.error(`Erreur POST ${endpoint}`, 'UnifiedApiService', { error: handleApiError(error) });
      throw error;
    }
  }

  /**
   * Requête PUT générique
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await apiRequest(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }, DEFAULT_TIMEOUT);

      return response;
    } catch (error) {
      logService.error(`Erreur PUT ${endpoint}`, 'UnifiedApiService', { error: handleApiError(error) });
      throw error;
    }
  }

  /**
   * Requête DELETE générique
   */
  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await apiRequest(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
      }, DEFAULT_TIMEOUT);

      return response;
    } catch (error) {
      logService.error(`Erreur DELETE ${endpoint}`, 'UnifiedApiService', { error: handleApiError(error) });
      throw error;
    }
  }

  /**
   * Téléchargement de fichier
   */
  async downloadFile(downloadUrl: string): Promise<Response | null> {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      return response;
    } catch (error) {
      logService.error('Erreur lors du téléchargement', 'UnifiedApiService', { error: handleApiError(error) });
      return null;
    }
  }

  /**
   * Stream de fichier
   */
  async streamFile(path: string): Promise<Response> {
    const encodedPath = encodeURIComponent(path);
    return await fetch(`${this.baseUrl}/files/stream-by-path/${encodedPath}`);
  }

  /**
   * Nettoyer le cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      globalCache.clear(pattern);
    } else {
      globalCache.clear();
    }
  }

  /**
   * Vérifier l'accessibilité d'un endpoint
   */
  async checkAccess(endpoint: string): Promise<boolean> {
    try {
      await this.get(endpoint);
      return true;
    } catch {
      return false;
    }
  }
}

// Instance singleton
const unifiedApiService = new UnifiedApiService();

// Hook pour utiliser le service avec gestion de connexion
export const useUnifiedApiService = () => {
  const { isOnline, conditionalRequest } = useBackendConnection();

  return {
    // Méthodes avec gestion de connexion
    get: <T>(endpoint: string, useCache: boolean = false, cacheKey?: string) =>
      conditionalRequest(
        () => unifiedApiService.get<T>(endpoint, useCache, cacheKey),
        null
      ),

    post: <T>(endpoint: string, data: any) =>
      conditionalRequest(
        () => unifiedApiService.post<T>(endpoint, data),
        null
      ),

    put: <T>(endpoint: string, data: any) =>
      conditionalRequest(
        () => unifiedApiService.put<T>(endpoint, data),
        null
      ),

    delete: <T>(endpoint: string) =>
      conditionalRequest(
        () => unifiedApiService.delete<T>(endpoint),
        null
      ),

    // Méthodes sans gestion de connexion (pour les opérations critiques)
    downloadFile: (downloadUrl: string) => {
      if (!isOnline) {
        logService.warning('Téléchargement non disponible hors ligne', 'UnifiedApiService', { downloadUrl });
        return null;
      }
      return unifiedApiService.downloadFile(downloadUrl);
    },

    streamFile: (path: string) => {
      if (!isOnline) {
        logService.warning('Stream non disponible hors ligne', 'UnifiedApiService', { path });
        return null;
      }
      return unifiedApiService.streamFile(path);
    },

    // Utilitaires
    clearCache: unifiedApiService.clearCache.bind(unifiedApiService),
    checkAccess: (endpoint: string) => conditionalRequest(
      () => unifiedApiService.checkAccess(endpoint),
      false
    ),

    // État de connexion
    isOnline
  };
};

// Export du service de base pour compatibilité
export { unifiedApiService };
export default unifiedApiService;
