export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source?: string;
  details?: any;
  performance?: {
    executionTime?: number;
    memoryUsage?: number;
  };
}

export interface LogStats {
  total: number;
  byLevel: Record<string, number>;
  bySource: Record<string, number>;
  performance: {
    averageExecutionTime: number;
    maxExecutionTime: number;
    totalMemoryUsage: number;
  };
}

class LogService {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private maxLogs = 1000; // Limite pour éviter la surcharge mémoire

  // Ajouter un log
  addLog(level: LogEntry['level'], message: string, source?: string, details?: any, performance?: LogEntry['performance']) {
    const log: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      details,
      performance
    };

    this.logs.unshift(log); // Ajouter au début pour avoir les plus récents en haut

    // Limiter le nombre de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notifier les listeners
    this.notifyListeners();

    // Log dans la console pour le debug
    console.log(`[${log.source || 'App'}] ${log.level.toUpperCase()}: ${log.message}`, details || '');
  }

  // Méthodes de convenance
  info(message: string, source?: string, details?: any, performance?: LogEntry['performance']) {
    this.addLog('info', message, source, details, performance);
  }

  warning(message: string, source?: string, details?: any, performance?: LogEntry['performance']) {
    this.addLog('warning', message, source, details, performance);
  }

  error(message: string, source?: string, details?: any, performance?: LogEntry['performance']) {
    this.addLog('error', message, source, details, performance);
  }

  debug(message: string, source?: string, details?: any, performance?: LogEntry['performance']) {
    this.addLog('debug', message, source, details, performance);
  }

  // Méthode pour logger avec performance
  performance(message: string, executionTime: number, source?: string, details?: any) {
    this.addLog('info', message, source, details, { executionTime });
  }

  // Obtenir tous les logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // S'abonner aux changements de logs
  subscribe(listener: (logs: LogEntry[]) => void) {
    // Éviter les doublons d'abonnements
    if (this.listeners.includes(listener)) {
      console.warn('[LogService] Tentative d\'abonnement en double détectée');
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }
    
    this.listeners.push(listener);
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notifier tous les listeners
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener([...this.logs]); // Envoyer une copie pour éviter les mutations
      } catch (error) {
        console.error('[LogService] Erreur lors de la notification d\'un listener:', error);
      }
    });
  }

  // Nettoyer tous les abonnements (pour le debug)
  clearAllListeners() {
    console.log(`[LogService] Nettoyage de ${this.listeners.length} listeners`);
    this.listeners = [];
  }

  // Obtenir le nombre d'abonnements actifs (pour le debug)
  getListenerCount() {
    return this.listeners.length;
  }

  // Effacer tous les logs
  clearLogs() {
    const count = this.logs.length;
    this.logs = [];
    this.notifyListeners();
  }

  // Supprimer des logs spécifiques par ID
  deleteLogs(logIds: string[]) {
    if (!logIds || logIds.length === 0) {
      return 0;
    }

    const initialCount = this.logs.length;
    const logsToDelete = this.logs.filter(log => logIds.includes(log.id));
    
    if (logsToDelete.length === 0) {
      return 0;
    }

    // Supprimer les logs
    this.logs = this.logs.filter(log => !logIds.includes(log.id));
    const deletedCount = initialCount - this.logs.length;
    
    // Notifier les listeners immédiatement
    this.notifyListeners();
    
    return deletedCount;
  }

  // Filtrer les logs
  filterLogs(level?: LogEntry['level'], source?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (source && log.source !== source) return false;
      return true;
    });
  }

  // Obtenir les statistiques des logs
  getStats(): LogStats {
    const stats: LogStats = {
      total: this.logs.length,
      byLevel: {},
      bySource: {},
      performance: {
        averageExecutionTime: 0,
        maxExecutionTime: 0,
        totalMemoryUsage: 0
      }
    };

    let totalExecutionTime = 0;
    let executionTimeCount = 0;

    this.logs.forEach(log => {
      // Compter par niveau
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Compter par source
      if (log.source) {
        stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
      }

      // Calculer les statistiques de performance
      if (log.performance?.executionTime) {
        totalExecutionTime += log.performance.executionTime;
        executionTimeCount++;
        stats.performance.maxExecutionTime = Math.max(stats.performance.maxExecutionTime, log.performance.executionTime);
      }

      if (log.performance?.memoryUsage) {
        stats.performance.totalMemoryUsage += log.performance.memoryUsage;
      }
    });

    if (executionTimeCount > 0) {
      stats.performance.averageExecutionTime = totalExecutionTime / executionTimeCount;
    }

    return stats;
  }

  // Méthode pour obtenir un résumé des logs
  getSummary(): string {
    const stats = this.getStats();
    return `Logs: ${stats.total} total | ${Object.entries(stats.byLevel).map(([level, count]) => `${level}: ${count}`).join(' | ')}`;
  }
}

// Instance singleton
export const logService = new LogService();

// Export pour utilisation globale
export default logService;
