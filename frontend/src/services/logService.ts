import unifiedApiService from './unifiedApiService';
import useAuthStore from '../stores/authStore';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  source: string;
  message: string;
  details?: any;
  performance?: {
    executionTime?: number;
    memoryUsage?: number;
  };
  // NOUVEAU: Propriétés pour les logs backend
  isBackend?: boolean;
  module?: string;
  function?: string;
  line?: number;
  path?: string;
  exception?: {
    type?: string;
    message?: string;
    traceback?: string;
  };
}

class LogService {
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private maxLogs = 1000;
  private backendLogs: LogEntry[] = [];
  private backendSSE: EventSource | null = null;
  private storageKey = 'docusense-frontend-logs';
  
  // NOUVEAU: Configuration pour l'envoi au backend
  private sendToBackend = true;
  private criticalLevels = ['error']; // OPTIMISATION: Seulement ERROR pour éviter la surcharge

  constructor() {
    this.loadPersistedLogs();
    // OPTIMISATION: Ne pas initialiser les logs backend automatiquement
    // Ils seront initialisés après authentification via useAuthReload
    // OPTIMISATION: Suppression des console.log pour éviter la surcharge
  }

  private loadPersistedLogs() {
    try {
      const persistedLogs = localStorage.getItem(this.storageKey);
      if (persistedLogs) {
        this.logs = JSON.parse(persistedLogs);
        // ${this.logs.length} logs frontend chargés depuis le localStorage
      }
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
    }
  }

  private persistLogs() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
    }
  }

  private initializeBackendLogs() {
    // OPTIMISATION: Vérifier si l'utilisateur est authentifié avant de charger les logs
    try {
      const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const isAuthenticated = authStore.state?.isAuthenticated || false;
      
      if (!isAuthenticated) {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        return;
      }
    } catch (error) {
      // OPTIMISATION: Suppression des console.log pour éviter la surcharge
      return;
    }
    
    // Charger les logs backend initiaux seulement si authentifié
    this.loadBackendLogs();
    
    // OPTIMISATION: Ne pas démarrer le streaming automatiquement
    // Le streaming sera démarré après authentification via useAuthReload
    // OPTIMISATION: Suppression des console.log pour éviter la surcharge
  }

  private async loadBackendLogs() {
    try {
      const response = await unifiedApiService.get('/api/logs/backend');
      if (response.data?.success && response.data?.data) {
        this.backendLogs = response.data.data.map((log: any) => ({
          ...log,
          isBackend: true,
          id: log.id || `backend_${Date.now()}_${Math.random()}`
        }));
        this.notifyListeners();
      }
    } catch (error) {
      // OPTIMISATION: Ne pas afficher d'erreur si le backend n'est pas disponible
      // C'est normal quand l'utilisateur n'est pas connecté ou le backend n'est pas démarré
      // OPTIMISATION: Suppression des console.log pour éviter la surcharge
    }
  }

  private startBackendLogStream() {
    try {
      // OPTIMISATION: Fermer la connexion existante avant d'en créer une nouvelle
      if (this.backendSSE) {
        this.backendSSE.close();
      }
      
      // OPTIMISATION: Vérifier si l'utilisateur est authentifié avant de démarrer le stream
      const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const isAuthenticated = authStore.state?.isAuthenticated || false;
      
      if (!isAuthenticated) {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        return;
      }
      
      this.backendSSE = new EventSource('/api/logs/backend/stream');
      
      this.backendSSE.onopen = () => {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
      };

      this.backendSSE.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // OPTIMISATION: Traitement optimisé des différents types de messages
          if (data.type === 'backend_log' && data.log) {
            const backendLog: LogEntry = {
              ...data.log,
              isBackend: true,
              id: data.log.id || `backend_${Date.now()}_${Math.random()}`
            };
            
            this.backendLogs.push(backendLog);
            
            // OPTIMISATION: Limiter la taille du buffer backend de manière plus efficace
            if (this.backendLogs.length > this.maxLogs) {
              this.backendLogs = this.backendLogs.slice(-this.maxLogs);
            }
            
            this.notifyListeners();
          } else if (data.type === 'heartbeat' || data.type === 'keepalive') {
            // OPTIMISATION: Traitement des heartbeats pour maintenir la connexion
            // Réduire les logs de debug des heartbeats (trop fréquents)
            // console.debug('💓 Heartbeat SSE reçu:', data.count || data.timestamp);
          }
        } catch (error) {
          // OPTIMISATION: Suppression des console.error pour éviter la surcharge
        }
      };

      this.backendSSE.onerror = (error) => {
        // OPTIMISATION: Suppression des console.error pour éviter la surcharge
        
        // OPTIMISATION: Tentative de reconnexion plus intelligente avec limite
        if (this.backendSSE && this.backendSSE.readyState === EventSource.CLOSED) {
          // Vérifier si l'utilisateur est toujours authentifié
          const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          const isAuthenticated = authStore.state?.isAuthenticated || false;
          
          if (isAuthenticated) {
            // OPTIMISATION: Suppression des console.log pour éviter la surcharge
            setTimeout(() => {
              this.startBackendLogStream();
            }, 5000); // Augmenté à 5s pour éviter les boucles
          } else {
            // OPTIMISATION: Suppression des console.log pour éviter la surcharge
          }
        }
      };
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
    }
  }

  private notifyListeners() {
    // Combiner les logs frontend et backend
    const allLogs = [...this.logs, ...this.backendLogs];
    
    // Trier par timestamp (plus récent en premier)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    this.listeners.forEach(callback => {
      try {
        callback(allLogs);
          } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
    }
    });
  }

  // Méthodes de logging avec catégorisation améliorée
  debug(message: string, source: string, details?: any, performance?: any) {
    this.addLog('debug', message, source, details, performance);
  }

  info(message: string, source: string, details?: any, performance?: any) {
    this.addLog('info', message, source, details, performance);
  }

  warning(message: string, source: string, details?: any, performance?: any) {
    this.addLog('warning', message, source, details, performance);
  }

  error(message: string, source: string, details?: any, performance?: any) {
    this.addLog('error', message, source, details, performance);
  }

  // NOUVEAU: Méthodes spécialisées pour différents types d'événements
  navigation(from: string, to: string, context?: any) {
    this.info(`Navigation: ${from} → ${to}`, 'Navigation', {
      from,
      to,
      ...context
    });
  }

  fileOperation(operation: string, fileName: string, details?: any) {
    this.info(`Opération fichier: ${operation}`, 'FileManager', {
      operation,
      fileName,
      ...details
    });
  }

  queueAction(action: string, itemId: string | number, details?: any) {
    this.info(`Action queue: ${action}`, 'QueueManager', {
      action,
      itemId,
      ...details
    });
  }

  apiCall(endpoint: string, method: string, success: boolean, details?: any) {
    const level = success ? 'info' : 'error';
    this[level](`API ${method} ${endpoint}`, 'APIClient', {
      endpoint,
      method,
      success,
      ...details
    });
  }

  configurationChange(setting: string, oldValue: any, newValue: any) {
    this.info(`Configuration modifiée: ${setting}`, 'ConfigManager', {
      setting,
      oldValue,
      newValue
    });
  }

  performance(operation: string, executionTime: number, memoryUsage?: number) {
    this.debug(`Performance: ${operation}`, 'Performance', {
      operation,
      executionTime,
      memoryUsage
    }, {
      executionTime,
      memoryUsage
    });
  }

  exception(error: Error, context: string, details?: any) {
    this.error(`Exception dans ${context}: ${error.message}`, 'ExceptionHandler', {
      context,
      errorType: error.constructor.name,
      errorMessage: error.message,
      stack: error.stack,
      ...details
    });
  }

  private addLog(level: LogEntry['level'], message: string, source: string, details?: any, performance?: any) {
    const logEntry: LogEntry = {
      id: `frontend_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      details,
      performance,
      isBackend: false
    };

    this.logs.unshift(logEntry);

    // Limiter le nombre de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Persister les logs dans le localStorage
    this.persistLogs();

    this.notifyListeners();

    // NOUVEAU: Envoyer les logs critiques au backend
    if (this.sendToBackend && this.criticalLevels.includes(level)) {
      this.sendLogToBackend(logEntry);
    }

    // Log dans la console pour le débogage
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warning' ? 'warn' : 
                         level === 'debug' ? 'debug' : 'info';
    
    // OPTIMISATION: Réduire les logs de debug pour améliorer les performances
    if (level !== 'debug') {
      console[consoleMethod](`[${source}] ${message}`, details || '');
    }
  }

  // NOUVEAU: Envoyer un log au backend pour persistance
  private async sendLogToBackend(logEntry: LogEntry) {
    try {
      // Vérifier si l'utilisateur est connecté
      const authStore = useAuthStore.getState();
      if (!authStore.isAuthenticated) {
        return; // Ne pas envoyer si pas authentifié
      }

      // Préparer les données pour le backend
      const backendLogData = {
        level: logEntry.level === 'warning' ? 'warning' : 'error', // Mapper au format backend
        source: `frontend_${logEntry.source}`,
        action: logEntry.message,
        details: {
          frontend_log: true,
          original_level: logEntry.level,
          original_source: logEntry.source,
          user_agent: navigator.userAgent,
          url: window.location.href,
          timestamp: logEntry.timestamp,
          ...logEntry.details
        }
      };

      // Envoyer au backend (ne pas attendre la réponse pour ne pas bloquer)
      // Note: L'endpoint manual-event nécessite des droits admin, donc on désactive temporairement
      // TODO: Créer un endpoint public pour les logs frontend
      /*
      apiRequest('/api/system-logs/manual-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendLogData)
      }).catch(error => {
        // OPTIMISATION: Suppression des console.warn pour éviter la surcharge
      });
      */

    } catch (error) {
      // OPTIMISATION: Suppression des console.warn pour éviter la surcharge
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs, ...this.backendLogs];
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.getLogs().filter(log => log.level === level);
  }

  getLogsBySource(source: string): LogEntry[] {
    return this.getLogs().filter(log => log.source === source);
  }

  getLogsByType(type: 'frontend' | 'backend'): LogEntry[] {
    if (type === 'frontend') {
      return [...this.logs];
    } else {
      return [...this.backendLogs];
    }
  }

  subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getListenerCount(): number {
    return this.listeners.size;
  }

  deleteLogs(logIds: string[]): void {
    this.logs = this.logs.filter(log => !logIds.includes(log.id));
    this.backendLogs = this.backendLogs.filter(log => !logIds.includes(log.id));
    this.notifyListeners();
  }

  clearLogs(): void {
    this.logs = [];
    this.backendLogs = [];
    this.notifyListeners();
  }

  async clearBackendLogs(): Promise<void> {
    try {
      await unifiedApiService.delete('/api/logs/backend');
      this.backendLogs = [];
      this.notifyListeners();
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw error;
    }
  }

  // Méthodes utilitaires pour l'analyse des logs
  getErrorCount(): number {
    return this.getLogsByLevel('error').length;
  }

  getWarningCount(): number {
    return this.getLogsByLevel('warning').length;
  }

  getRecentLogs(minutes: number = 5): LogEntry[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.getLogs().filter(log => new Date(log.timestamp) > cutoff);
  }

  getLogsByTimeRange(start: Date, end: Date): LogEntry[] {
    return this.getLogs().filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= start && logTime <= end;
    });
  }

  // Nettoyage à la destruction
  destroy() {
    if (this.backendSSE) {
      this.backendSSE.close();
      this.backendSSE = null;
    }
    this.listeners.clear();
    this.logs = [];
    this.backendLogs = [];
  }

  // NOUVEAU: Méthode pour redémarrer le stream SSE après authentification
  restartBackendLogStream() {
    // OPTIMISATION: Suppression des console.log pour éviter la surcharge
    this.startBackendLogStream();
  }

  // NOUVEAU: Méthode pour arrêter le stream SSE lors de la déconnexion
  stopBackendLogStream() {
    if (this.backendSSE) {
      // OPTIMISATION: Suppression des console.log pour éviter la surcharge
      this.backendSSE.close();
      this.backendSSE = null;
    }
  }
}

export const logService = new LogService();
