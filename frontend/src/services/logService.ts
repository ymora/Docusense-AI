import { apiRequest, handleApiError } from '../utils/apiUtils';

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

  constructor() {
    this.initializeBackendLogs();
  }

  private initializeBackendLogs() {
    // Charger les logs backend initiaux
    this.loadBackendLogs();
    
    // Démarrer le streaming des logs backend
    this.startBackendLogStream();
  }

  private async loadBackendLogs() {
    try {
      const response = await apiRequest('/api/logs/backend', {}, 5000);
      if (response.success && response.data) {
        this.backendLogs = response.data.map((log: any) => ({
          ...log,
          isBackend: true,
          id: log.id || `backend_${Date.now()}_${Math.random()}`
        }));
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs backend:', error);
    }
  }

  private startBackendLogStream() {
    try {
      this.backendSSE = new EventSource('/api/logs/backend/stream');
      
      this.backendSSE.onopen = () => {
        console.log('🔗 SSE connecté pour les logs backend');
      };

      this.backendSSE.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'backend_log' && data.log) {
            const backendLog: LogEntry = {
              ...data.log,
              isBackend: true,
              id: data.log.id || `backend_${Date.now()}_${Math.random()}`
            };
            
            this.backendLogs.push(backendLog);
            
            // Limiter la taille du buffer backend
            if (this.backendLogs.length > this.maxLogs) {
              this.backendLogs = this.backendLogs.slice(-this.maxLogs);
            }
            
            this.notifyListeners();
          }
        } catch (error) {
          console.error('Erreur parsing SSE logs backend:', error);
        }
      };

      this.backendSSE.onerror = (error) => {
        console.error('Erreur SSE logs backend:', error);
        // Tentative de reconnexion après 5 secondes
        setTimeout(() => {
          if (this.backendSSE) {
            this.backendSSE.close();
            this.startBackendLogStream();
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Erreur connexion SSE logs backend:', error);
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
        console.error('Erreur callback logs:', error);
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

    this.notifyListeners();

    // Log dans la console pour le débogage
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warning' ? 'warn' : 
                         level === 'debug' ? 'debug' : 'info';
    
    console[consoleMethod](`[${source}] ${message}`, details || '');
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
      await apiRequest('/api/logs/backend', { method: 'DELETE' }, 5000);
      this.backendLogs = [];
      this.notifyListeners();
    } catch (error) {
      console.error('Erreur lors de la suppression des logs backend:', error);
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
}

export const logService = new LogService();
