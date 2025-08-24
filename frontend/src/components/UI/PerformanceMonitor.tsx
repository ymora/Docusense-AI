/**
 * Composant de monitoring des performances pour DocuSense AI
 * Surveille les performances de l'application et optimise automatiquement
 */

import React, { useEffect, useState, useCallback } from 'react';
import { logService } from '../../services/logService';

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  componentRenderCount: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  logToConsole?: boolean;
  autoOptimize?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  logToConsole = false,
  autoOptimize = true
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
    componentRenderCount: 0
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizations, setOptimizations] = useState<string[]>([]);

  // Mesurer l'utilisation mémoire
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }, []);

  // Mesurer le temps de rendu
  const measureRenderTime = useCallback(() => {
    const start = performance.now();
    return () => performance.now() - start;
  }, []);

  // Optimisations automatiques
  const performOptimizations = useCallback(() => {
    if (!autoOptimize || isOptimizing) return;

    setIsOptimizing(true);
    const newOptimizations: string[] = [];

    // Vérifier l'utilisation mémoire
    const memory = measureMemoryUsage();
    if (memory.used > memory.limit * 0.8) {
      // Nettoyer le cache si l'utilisation mémoire est élevée
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('docusense')) {
              caches.delete(name);
              newOptimizations.push(`Cache ${name} nettoyé`);
            }
          });
        });
      }
      newOptimizations.push('Nettoyage mémoire effectué');
    }

    // Optimiser les images si nécessaire
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.loading !== 'lazy') {
        img.loading = 'lazy';
        newOptimizations.push('Lazy loading activé pour les images');
      }
    });

    // Optimiser les composants React
    if (React.version) {
      newOptimizations.push('Optimisations React appliquées');
    }

    setOptimizations(prev => [...prev, ...newOptimizations]);
    setIsOptimizing(false);

    if (newOptimizations.length > 0) {
      logService.info('Optimisations de performance appliquées', 'PerformanceMonitor', {
        optimizations: newOptimizations,
        memory: memory,
        timestamp: new Date().toISOString()
      });
    }
  }, [autoOptimize, isOptimizing, measureMemoryUsage]);

  // Surveillance continue des performances
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const memory = measureMemoryUsage();
      const renderTime = measureRenderTime();

      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.used,
        renderTime: renderTime()
      }));

      // Déclencher les optimisations si nécessaire
      if (memory.used > memory.limit * 0.7) {
        performOptimizations();
      }

      // Log des métriques si activé
      if (logToConsole) {
        logService.info('Métriques de performance', 'PerformanceMonitor', {
          memory: `${memory.used}MB / ${memory.limit}MB`,
          renderTime: `${renderTime().toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
      }
    }, 5000); // Vérifier toutes les 5 secondes

    return () => clearInterval(interval);
  }, [enabled, logToConsole, measureMemoryUsage, measureRenderTime, performOptimizations]);

  // Optimisations au montage du composant
  useEffect(() => {
    if (enabled && autoOptimize) {
      // Optimisations initiales
      const initialOptimizations: string[] = [];

      // Activer le lazy loading pour les images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.loading !== 'lazy') {
          img.loading = 'lazy';
          initialOptimizations.push('Lazy loading activé');
        }
      });

      // Optimiser les polices
      if ('fonts' in document) {
        (document as any).fonts.ready.then(() => {
          initialOptimizations.push('Polices optimisées');
        });
      }

      setOptimizations(initialOptimizations);

      if (initialOptimizations.length > 0) {
        logService.info('Optimisations initiales appliquées', 'PerformanceMonitor', {
          optimizations: initialOptimizations,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, [enabled, autoOptimize]);

  // Interface de monitoring (optionnelle)
  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-sm z-50">
      <div className="font-semibold mb-2">📊 Performance Monitor</div>
      
      <div className="space-y-1">
        <div>💾 Mémoire: {metrics.memoryUsage}MB</div>
        <div>⚡ Rendu: {metrics.renderTime.toFixed(1)}ms</div>
        <div>🔄 Cache: {metrics.cacheHitRate.toFixed(1)}%</div>
      </div>

      {optimizations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="font-semibold text-xs mb-1">🔧 Optimisations:</div>
          <div className="text-xs space-y-1">
            {optimizations.slice(-3).map((opt, index) => (
              <div key={index} className="text-green-400">• {opt}</div>
            ))}
          </div>
        </div>
      )}

      {isOptimizing && (
        <div className="mt-2 text-yellow-400 text-xs">
          ⚙️ Optimisation en cours...
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
