import { useState, useCallback, useEffect } from 'react';

/**
 * Système de cache intelligent pour optimiser les performances
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  ttl: number; // Time to live en millisecondes
  maxSize: number; // Nombre maximum d'entrées
}

export class SmartCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanupInterval();
  }

  set(key: string, data: T, ttl?: number): void {
    // Nettoyer les entrées expirées avant d'ajouter
    this.cleanup();

    // Si le cache est plein, supprimer l'entrée la plus ancienne
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  clearPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    const matchingKeys = keys.filter(key => key.includes(pattern));
    matchingKeys.forEach(key => this.cache.delete(key));
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private startCleanupInterval(): void {
    // Nettoyer toutes les 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
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

// Cache spécifique pour les utilisateurs (TTL moyen)
export const userCache = new SmartCache({
  ttl: 3 * 60 * 1000, // 3 minutes
  maxSize: 30
});

// Fonction utilitaire pour les requêtes avec cache
export async function cachedRequest<T>(
  cache: SmartCache<T>,
  key: string,
  requestFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Vérifier le cache d'abord
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  // Faire la requête si pas en cache
  try {
    const data = await requestFn();
    cache.set(key, data, ttl);
    return data;
  } catch (error) {
    // OPTIMISATION: Suppression des console.error pour éviter la surcharge
    throw error;
  }
}

// Fonction pour invalider le cache
export function invalidateCache(cache: SmartCache, pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }

  // Supprimer les entrées qui correspondent au pattern
  for (const key of cache['cache'].keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Fonction pour obtenir des statistiques du cache
export function getCacheStats() {
  return {
    global: globalCache.size(),
    analysis: analysisCache.size(),
    config: configCache.size(),
    user: userCache.size()
  };
}
