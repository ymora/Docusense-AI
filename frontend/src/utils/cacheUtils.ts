import { useState, useCallback, useEffect } from 'react';

/**
 * Système de cache intelligent pour éviter les requêtes redondantes
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
}

interface CacheOptions {
  ttl?: number; // Time to live par défaut (5 minutes)
  maxSize?: number; // Taille maximale du cache
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes par défaut
    this.maxSize = options.maxSize || 100;
  }

  /**
   * Obtenir une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Stocker une valeur dans le cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Nettoyer le cache si nécessaire
    this.cleanup();

    // Supprimer l'entrée existante si elle existe
    this.cache.delete(key);

    // Ajouter la nouvelle entrée
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Vérifier si une clé existe et n'a pas expiré
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoyer les entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    // Si le cache est trop grand, supprimer les entrées les plus anciennes
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, this.cache.size - this.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Obtenir la taille du cache
   */
  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats() {
    this.cleanup();
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL
    };
  }
}

// Cache global pour les données fréquemment utilisées
export const globalCache = new SmartCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 50
});

// Cache spécifique pour les analyses (TTL plus court)
export const analysisCache = new SmartCache({
  ttl: 2 * 60 * 1000, // 2 minutes
  maxSize: 20
});

// Cache spécifique pour les configurations (TTL plus long)
export const configCache = new SmartCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 10
});

/**
 * Hook pour utiliser le cache avec une fonction de chargement
 */
export const useCachedData = <T>(
  key: string,
  loader: () => Promise<T>,
  cache: SmartCache = globalCache,
  ttl?: number
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    // Vérifier le cache d'abord
    if (!forceRefresh) {
      const cached = cache.get<T>(key);
      if (cached) {
        setData(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await loader();
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [key, loader, cache, ttl]);

  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refresh };
};

/**
 * Fonction utilitaire pour invalider le cache
 */
export const invalidateCache = (pattern?: string) => {
  if (pattern) {
    // Invalider les clés qui correspondent au pattern
    const keys = Array.from(globalCache['cache'].keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        globalCache.delete(key);
      }
    });
  } else {
    // Vider tout le cache
    globalCache.clear();
  }
};

/**
 * Fonction pour nettoyer automatiquement le cache
 */
export const startCacheCleanup = () => {
  // Nettoyer le cache toutes les 5 minutes
  setInterval(() => {
    globalCache['cleanup']();
    analysisCache['cleanup']();
    configCache['cleanup']();
  }, 5 * 60 * 1000);
};
