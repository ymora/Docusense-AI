import { useEffect, useRef, useCallback } from 'react';
import { useBackendConnection } from './useBackendConnection';
import { logService } from '../services/logService';

interface LoadingOptions {
  enabled?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Hook pour optimiser le chargement des données
 * Évite les requêtes redondantes et gère intelligemment le cache
 */
export const useOptimizedDataLoading = <T>(
  loader: () => Promise<T>,
  options: LoadingOptions = {}
) => {
  const {
    enabled = true,
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes par défaut
    retryAttempts = 2,
    retryDelay = 5000
  } = options;

  const { canMakeRequests, isOnline } = useBackendConnection();
  const loadingRef = useRef(false);
  const lastLoadRef = useRef<number>(0);
  const retryCountRef = useRef(0);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  // Vérifier si on peut charger depuis le cache
  const getFromCache = useCallback((key: string): T | null => {
    if (!cacheKey) return null;
    
    const cached = cacheRef.current.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cacheTTL) {
      cacheRef.current.delete(key);
      return null;
    }

    return cached.data;
  }, [cacheKey, cacheTTL]);

  // Sauvegarder dans le cache
  const saveToCache = useCallback((key: string, data: T) => {
    if (!cacheKey) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  // Fonction de chargement optimisée
  const loadData = useCallback(async (forceRefresh = false): Promise<T | null> => {
    // Vérifications préliminaires
    if (!enabled || !canMakeRequests || !isOnline) {
      logService.debug('Chargement désactivé ou backend indisponible', 'OptimizedDataLoading');
      return null;
    }

    // Éviter les chargements simultanés
    if (loadingRef.current && !forceRefresh) {
      logService.debug('Chargement déjà en cours', 'OptimizedDataLoading');
      return null;
    }

    // Vérifier le cache si pas de force refresh
    if (!forceRefresh && cacheKey) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        logService.debug('Données récupérées depuis le cache', 'OptimizedDataLoading', { cacheKey });
        return cached;
      }
    }

    // Vérifier si on a chargé récemment (protection contre les appels multiples)
    const now = Date.now();
    const minInterval = 2000; // 2 secondes minimum entre les chargements
    if (!forceRefresh && (now - lastLoadRef.current) < minInterval) {
      logService.debug('Chargement trop récent, ignoré', 'OptimizedDataLoading');
      return null;
    }

    loadingRef.current = true;
    lastLoadRef.current = now;

    try {
      logService.debug('Début du chargement des données', 'OptimizedDataLoading');
      
      const data = await loader();
      
      // Sauvegarder dans le cache
      if (cacheKey) {
        saveToCache(cacheKey, data);
      }
      
      retryCountRef.current = 0; // Réinitialiser le compteur de tentatives
      logService.debug('Données chargées avec succès', 'OptimizedDataLoading');
      
      return data;
    } catch (error) {
      logService.error('Erreur lors du chargement', 'OptimizedDataLoading', { error });
      
      // Gestion des tentatives de retry
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        logService.info(`Tentative de retry ${retryCountRef.current}/${retryAttempts}`, 'OptimizedDataLoading');
        
        // Utiliser requestIdleCallback pour éviter les violations de performance
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => {
            loadData(forceRefresh);
          });
        } else {
          setTimeout(() => {
            loadData(forceRefresh);
          }, Math.min(retryDelay, 1000)); // Limiter le délai à 1 seconde max
        }
      }
      
      throw error;
    } finally {
      loadingRef.current = false;
    }
  }, [enabled, canMakeRequests, isOnline, loader, cacheKey, cacheTTL, retryAttempts, retryDelay, getFromCache, saveToCache]);

  // Fonction pour forcer le rechargement
  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  // Fonction pour invalider le cache
  const invalidateCache = useCallback(() => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
      logService.debug('Cache invalidé', 'OptimizedDataLoading', { cacheKey });
    }
  }, [cacheKey]);

  // Nettoyer le cache expiré périodiquement
  useEffect(() => {
    if (!cacheKey) return;

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of cacheRef.current.entries()) {
        if (now - entry.timestamp > cacheTTL) {
          cacheRef.current.delete(key);
        }
      }
    }, cacheTTL);

    return () => clearInterval(cleanupInterval);
  }, [cacheKey, cacheTTL]);

  return {
    loadData,
    refresh,
    invalidateCache,
    isLoading: loadingRef.current,
    canLoad: enabled && canMakeRequests && isOnline
  };
};

/**
 * Hook pour les données qui doivent être chargées automatiquement
 */
export const useAutoLoadingData = <T>(
  loader: () => Promise<T>,
  options: LoadingOptions & { autoLoad?: boolean } = {}
) => {
  const { autoLoad = true, ...loadingOptions } = options;
  const { loadData, refresh, invalidateCache, isLoading, canLoad } = useOptimizedDataLoading(loader, loadingOptions);

  // Chargement automatique
  useEffect(() => {
    if (autoLoad && canLoad) {
      loadData();
    }
  }, [autoLoad, canLoad, loadData]);

  return {
    loadData,
    refresh,
    invalidateCache,
    isLoading,
    canLoad
  };
};
