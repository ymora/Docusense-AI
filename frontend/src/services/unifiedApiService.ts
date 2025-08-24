/**
 * Service API unifié pour DocuSense AI
 * Centralise toutes les requêtes API et élimine les doublons
 */

import { logService } from './logService';
import { globalCache } from '../utils/cacheUtils';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  error: string;
  status: number;
  details?: any;
}

class UnifiedApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache: boolean = false,
    cacheKey?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...options.headers };

    // Ajouter le token d'authentification
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Vérifier le cache si demandé
      if (useCache && cacheKey) {
        const cached = globalCache.get(cacheKey);
        if (cached) {
          logService.info('Données récupérées depuis le cache', 'UnifiedApiService', { cacheKey });
          return cached;
        }
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Mettre en cache si demandé
      if (useCache && cacheKey) {
        globalCache.set(cacheKey, data);
      }

      logService.info('Requête API réussie', 'UnifiedApiService', { endpoint, status: response.status });
      return data;
    } catch (error) {
      logService.error('Erreur API', 'UnifiedApiService', { endpoint, error: error.message });
      throw error;
    }
  }

  // === MÉTHODES HTTP GÉNÉRIQUES (pour compatibilité) ===
  async get(endpoint: string, useCache: boolean = false, cacheKey?: string): Promise<ApiResponse> {
    return this.request(endpoint, {}, useCache, cacheKey);
  }

  async post(endpoint: string, data?: any, useCache: boolean = false, cacheKey?: string): Promise<ApiResponse> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, useCache, cacheKey);
  }

  async put(endpoint: string, data?: any): Promise<ApiResponse> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string): Promise<ApiResponse> {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // === MÉTHODES FICHIERS ===
  async getFiles(path: string): Promise<ApiResponse> {
    return this.request(`/api/files/list/${encodeURIComponent(path)}`, {}, true, `files_${path}`);
  }

  async listDirectory(path: string): Promise<ApiResponse> {
    return this.request(`/api/files/list/${encodeURIComponent(path)}`, {}, true, `directory_${path}`);
  }

  async downloadFile(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/files/download/${id}`, {
      headers: this.defaultHeaders,
    });
    return response.blob();
  }

  async uploadFile(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/api/files/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Pas de Content-Type pour FormData
    });
  }

  async getFileInfo(id: string): Promise<ApiResponse> {
    return this.request(`/api/files/info/${id}`, {}, true, `file_info_${id}`);
  }

  // === MÉTHODES ANALYSES ===
  async createAnalysis(request: any): Promise<ApiResponse> {
    return this.request('/api/analysis/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAnalysisStatus(id: string): Promise<ApiResponse> {
    return this.request(`/api/analysis/status/${id}`, {}, true, `analysis_status_${id}`);
  }

  async deleteAnalysis(id: string): Promise<ApiResponse> {
    return this.request(`/api/analysis/${id}`, {
      method: 'DELETE',
    });
  }

  async getAnalysisHistory(filters?: any): Promise<ApiResponse> {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/api/analysis/list?${params}`, {}, true, `analysis_history_${params}`);
  }

  // === MÉTHODES EMAILS ===
  async parseEmail(path: string): Promise<ApiResponse> {
    return this.request(`/api/emails/parse/${encodeURIComponent(path)}`, {}, true, `email_${path}`);
  }

  async getAttachment(path: string, index: number): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/emails/attachment/${encodeURIComponent(path)}/${index}`, {
      headers: this.defaultHeaders,
    });
    return response.blob();
  }

  // === MÉTHODES CONFIGURATION ===
  async testProvider(name: string, key?: string): Promise<ApiResponse> {
    return this.request('/api/config/test', {
      method: 'POST',
      body: JSON.stringify({ provider: name, api_key: key }),
    });
  }

  async saveProviderConfig(name: string, config: any): Promise<ApiResponse> {
    return this.request('/api/config/save', {
      method: 'POST',
      body: JSON.stringify({ provider: name, config }),
    });
  }

  async getProviderStatus(): Promise<ApiResponse> {
    return this.request('/api/config/providers', {}, true, 'providers_status');
  }

  // === MÉTHODES UTILITAIRES ===
  async streamFile(path: string): Promise<Response> {
    return fetch(`${this.baseUrl}/api/files/stream/${encodeURIComponent(path)}`, {
      headers: this.defaultHeaders,
    });
  }

  async invalidateCache(pattern?: string): Promise<void> {
    if (pattern) {
      // Utiliser une méthode alternative pour nettoyer le cache par pattern
      globalCache.clearPattern(pattern);
    } else {
      globalCache.clear();
    }
  }
}

// Instance singleton
const unifiedApiService = new UnifiedApiService();

// Export par défaut
export default unifiedApiService;

// Export nommé pour compatibilité
export { UnifiedApiService };
