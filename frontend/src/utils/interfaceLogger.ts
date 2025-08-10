/**
 * Logger pour les événements de l'interface utilisateur
 * Permet de tracer les actions utilisateur et les événements système
 */

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  timestamp: string;
  category: string;
  level: LogLevel;
  message: string;
}

class InterfaceLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Limite pour éviter la surcharge mémoire
  private listeners: ((entry: LogEntry) => void)[] = [];

  /**
   * Ajoute un log à l'interface
   */
  addLog(category: string, level: LogLevel, message: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      category,
      level,
      message
    };

    // Ajouter le log
    this.logs.push(entry);

    // Limiter le nombre de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notifier les listeners
    this.listeners.forEach(listener => listener(entry));

    // Log dans la console pour le debug
    const consoleMethod = level === 'ERROR' ? 'error' : 
                         level === 'WARNING' ? 'warn' : 
                         level === 'DEBUG' ? 'debug' : 'log';
    
    console[consoleMethod](`[${category}] ${message}`);
  }

  /**
   * Récupère tous les logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Récupère les logs filtrés par catégorie
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Récupère les logs filtrés par niveau
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Efface tous les logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Ajoute un listener pour les nouveaux logs
   */
  addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Supprime un listener
   */
  removeListener(listener: (entry: LogEntry) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}

// Instance singleton
const interfaceLogger = new InterfaceLogger();

/**
 * Fonction utilitaire pour ajouter un log
 */
export const addInterfaceLog = (category: string, level: LogLevel, message: string): void => {
  interfaceLogger.addLog(category, level, message);
};

/**
 * Fonction utilitaire pour ajouter un log d'information
 */
export const addInfoLog = (category: string, message: string): void => {
  interfaceLogger.addLog(category, 'INFO', message);
};

/**
 * Fonction utilitaire pour ajouter un log d'avertissement
 */
export const addWarningLog = (category: string, message: string): void => {
  interfaceLogger.addLog(category, 'WARNING', message);
};

/**
 * Fonction utilitaire pour ajouter un log d'erreur
 */
export const addErrorLog = (category: string, message: string): void => {
  interfaceLogger.addLog(category, 'ERROR', message);
};

/**
 * Fonction utilitaire pour ajouter un log de debug
 */
export const addDebugLog = (category: string, message: string): void => {
  interfaceLogger.addLog(category, 'DEBUG', message);
};

export default interfaceLogger;
