/**
 * Hook d'optimisation des performances pour les composants React
 * Fournit des optimisations automatiques et des métriques de performance
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { logService } from '../services/logService';

interface PerformanceMetrics {
  renderCount: number;
  renderTime: number;
  memoryUsage: number;
  lastRender: Date;
}

interface UsePerformanceOptimizationOptions {
  componentName?: string;
  enableLogging?: boolean;
  autoOptimize?: boolean;
  maxRenderCount?: number;
}

export const usePerformanceOptimization = (options: UsePerformanceOptimizationOptions = {}) => {
  const {
    componentName = 'Unknown',
    enableLogging = false,
    autoOptimize = true,
    maxRenderCount = 100
  } = options;

  const renderCount = useRef(0);
  const renderStartTime = useRef(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    renderTime: 0,
    memoryUsage: 0,
    lastRender: new Date()
  });

  // Mesurer le temps de rendu
  const startRenderTimer = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderTimer = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current += 1;

    // Mesurer l'utilisation mémoire
    let memoryUsage = 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }

    const newMetrics: PerformanceMetrics = {
      renderCount: renderCount.current,
      renderTime,
      memoryUsage,
      lastRender: new Date()
    };

    setMetrics(newMetrics);

    // Log des performances si activé
    if (enableLogging) {
      logService.info('Performance metrics', 'usePerformanceOptimization', {
        componentName,
        renderCount: renderCount.current,
        renderTime: `${renderTime.toFixed(2)}ms`,
        memoryUsage: `${memoryUsage}MB`,
        timestamp: new Date().toISOString()
      });
    }

    // Optimisations automatiques
    if (autoOptimize) {
      // Avertir si trop de rendus
      if (renderCount.current > maxRenderCount) {
        logService.warning('Trop de rendus détectés', 'usePerformanceOptimization', {
          componentName,
          renderCount: renderCount.current,
          maxRenderCount,
          timestamp: new Date().toISOString()
        });
      }

      // Avertir si temps de rendu élevé
      if (renderTime > 100) {
        logService.warning('Temps de rendu élevé', 'usePerformanceOptimization', {
          componentName,
          renderTime: `${renderTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
      }
    }

    return newMetrics;
  }, [componentName, enableLogging, autoOptimize, maxRenderCount]);

  // Optimisations de mémoire
  const optimizeMemory = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Forcer le garbage collection si disponible
      if ('gc' in window) {
        (window as any).gc();
      }

      // Nettoyer les event listeners orphelins
      const cleanup = () => {
        // Cette fonction sera appelée lors du démontage
      };

      return cleanup;
    }
  }, []);

  // Optimisations de rendu
  const optimizeRendering = useCallback(() => {
    // Suggestions d'optimisation basées sur les métriques
    const suggestions: string[] = [];

    if (metrics.renderCount > maxRenderCount) {
      suggestions.push('Considérer React.memo ou useMemo');
    }

    if (metrics.renderTime > 50) {
      suggestions.push('Optimiser les calculs coûteux');
    }

    if (metrics.memoryUsage > 100) {
      suggestions.push('Vérifier les fuites mémoire');
    }

    if (suggestions.length > 0) {
      logService.info('Suggestions d\'optimisation', 'usePerformanceOptimization', {
        componentName,
        suggestions,
        metrics,
        timestamp: new Date().toISOString()
      });
    }

    return suggestions;
  }, [metrics, maxRenderCount, componentName]);

  // Hook de cycle de vie pour mesurer les rendus
  useEffect(() => {
    startRenderTimer();
    
    return () => {
      endRenderTimer();
    };
  });

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (enableLogging) {
        logService.info('Composant démonté', 'usePerformanceOptimization', {
          componentName,
          finalRenderCount: renderCount.current,
          finalMetrics: metrics,
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [componentName, enableLogging, metrics]);

  return {
    metrics,
    renderCount: renderCount.current,
    startRenderTimer,
    endRenderTimer,
    optimizeMemory,
    optimizeRendering,
    getPerformanceReport: () => ({
      componentName,
      metrics,
      suggestions: optimizeRendering()
    })
  };
};

export default usePerformanceOptimization;
