/**
 * Service unifié pour tous les appels API avec cache et debounce
 */

import { logService } from './logService';

interface CacheOptions {
  ttl?: number;
  key?: string;
  enabled?: boolean;
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  cache?: CacheOptions;
}

class UnifiedApiService {
  public baseURL: string;
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly CACHE_TTL = 30000; // 30 secondes par défaut
  private readonly DEBOUNCE_DELAY = 100; // 100ms
  private authToken: string | null = null;

  constructor() {
    this.baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
    // Le token sera récupéré dynamiquement depuis le store
    this.authToken = null;
  }

  /**
   * Définir le token d'authentification
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Effacer le token d'authentification
   */
  clearAuthToken() {
    this.authToken = null;
  }

  /**
   * Effectue une requête HTTP avec cache et debounce
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { cache = {}, ...requestOptions } = options;
    const { ttl = this.CACHE_TTL, key, enabled = true } = cache;
    const cacheKey = key || `${options.method || 'GET'}:${endpoint}`;

    // Vérifier le cache
    if (enabled) {
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        logService.info('Cache hit', 'UnifiedApiService', { endpoint, cacheKey });
        return cached.data;
      }
    }

    // Debounce pour les endpoints fréquents
    if (this.shouldDebounce(endpoint)) {
      return new Promise((resolve, reject) => {
        const timerKey = `${options.method || 'GET'}:${endpoint}`;
        
        if (this.debounceTimers.has(timerKey)) {
          clearTimeout(this.debounceTimers.get(timerKey)!);
        }

        this.debounceTimers.set(timerKey, setTimeout(async () => {
          try {
            const result = await this.makeRequest<T>(endpoint, requestOptions, cacheKey, ttl);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, this.DEBOUNCE_DELAY));
      });
    }

    return this.makeRequest<T>(endpoint, requestOptions, cacheKey, ttl);
  }

  /**
   * Effectue la requête HTTP réelle
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestOptions, 
    cacheKey: string, 
    ttl: number
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Récupérer le token dynamiquement depuis le store
    const getAuthToken = () => {
      try {
        // Récupérer depuis localStorage (Zustand persist)
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsedAuth = JSON.parse(authStorage);
          return parsedAuth.state?.accessToken || null;
        }
        return null;
      } catch {
        return null;
      }
    };

    const currentToken = this.authToken || getAuthToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      credentials: 'include',
    };

    if (options.body) {
      fetchOptions.body = options.body;
    }

    try {
      const response = await fetch(url, fetchOptions);
      
      // Essayer de récupérer le contenu JSON de la réponse
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Si ce n'est pas du JSON, récupérer le texte
        data = await response.text();
      }
      
      if (!response.ok) {
        // Retourner l'erreur du backend au lieu de lancer une exception
        const errorMessage = data?.detail || data?.message || data || `HTTP error! status: ${response.status}`;
        logService.error('Erreur de requête API', 'UnifiedApiService', { 
          endpoint, 
          status: response.status,
          error: errorMessage
        });
        throw new Error(errorMessage);
      }
      
      // Mettre en cache si activé
      if (ttl > 0) {
        this.requestCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl
        });
      }

      return data;
    } catch (error) {
      logService.error('Erreur de requête API', 'UnifiedApiService', { 
        endpoint, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Méthodes de convenance pour les différents types de requêtes
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Détermine si un endpoint doit être debounced
   */
  private shouldDebounce(endpoint: string): boolean {
    const debouncedEndpoints = [
      '/api/files/list',
      '/api/analysis/list',
      '/api/logs/list'
    ];
    return debouncedEndpoints.some(pattern => endpoint.includes(pattern));
  }

  /**
   * Nettoie le cache
   */
  clearCache() {
    this.requestCache.clear();
    logService.info('Cache vidé', 'UnifiedApiService');
  }

  /**
   * Nettoie les timers de debounce
   */
  clearDebounceTimers() {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// Instance singleton
export const unifiedApiService = new UnifiedApiService();
