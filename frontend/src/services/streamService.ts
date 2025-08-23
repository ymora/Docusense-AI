import { logService } from './logService';
import useAuthStore from '../stores/authStore';

export interface StreamMessage {
  type: string;
  timestamp: string;
  [key: string]: any;
}

export interface StreamCallbacks {
  onMessage?: (message: StreamMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

class StreamService {
  private streams: Map<string, EventSource> = new Map();
  private callbacks: Map<string, StreamCallbacks> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 2; // Réduit de 3 à 2
  private reconnectDelay = 10000; // 10 secondes au lieu de 5

  constructor() {
    // Nettoyer les streams à la fermeture de la page
    window.addEventListener('beforeunload', () => {
      this.closeAllStreams();
    });
  }

  /**
   * Démarrer un stream SSE
   */
  startStream(streamType: string, callbacks: StreamCallbacks = {}): boolean {
    // Vérifier l'authentification
    const authStore = useAuthStore.getState();
    if (!authStore.isAuthenticated) {
      logService.warning(`Tentative de démarrage du stream ${streamType} sans authentification`, 'StreamService');
      return false;
    }

    // Fermer le stream existant s'il y en a un
    this.closeStream(streamType);

    try {
      const eventSource = new EventSource(`/api/streams/${streamType}`);
      
      eventSource.onopen = () => {
        logService.info(`Stream ${streamType} connecté`, 'StreamService');
        this.reconnectAttempts.set(streamType, 0);
        callbacks.onOpen?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data: StreamMessage = JSON.parse(event.data);
          logService.debug(`Message reçu du stream ${streamType}`, 'StreamService', { messageType: data.type });
          callbacks.onMessage?.(data);
        } catch (error) {
          logService.error(`Erreur parsing message stream ${streamType}`, 'StreamService', { error: error instanceof Error ? error.message : String(error) });
        }
      };

      eventSource.onerror = (error) => {
        logService.error(`Erreur stream ${streamType}`, 'StreamService', { error: error.type });
        callbacks.onError?.(error);
        
        // Vérifier si c'est une erreur d'authentification
        if (error.type === 'error') {
          // Vérifier le statut de la réponse si possible
          const eventSource = this.streams.get(streamType);
          if (eventSource && eventSource.readyState === EventSource.CLOSED) {
            // Stream fermé - possible erreur d'authentification
            logService.warning(`Stream ${streamType} fermé, possible erreur d'authentification`, 'StreamService');
            
            // Vérifier l'authentification
            const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}');
            if (!authStore.state?.accessToken) {
              logService.warning('Token d\'authentification manquant, arrêt des streams', 'StreamService');
              this.closeAllStreams();
              return;
            }
          }
        }
        
        // Attendre un peu avant de tenter la reconnexion pour éviter les boucles
        setTimeout(() => {
          this.handleReconnect(streamType, callbacks);
        }, 2000);
      };

      this.streams.set(streamType, eventSource);
      this.callbacks.set(streamType, callbacks);
      
      logService.info(`Stream ${streamType} démarré`, 'StreamService');
      return true;

    } catch (error) {
      logService.error(`Erreur lors du démarrage du stream ${streamType}`, 'StreamService', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Fermer un stream spécifique
   */
  closeStream(streamType: string): void {
    const eventSource = this.streams.get(streamType);
    if (eventSource) {
      eventSource.close();
      this.streams.delete(streamType);
      this.callbacks.delete(streamType);
      this.reconnectAttempts.delete(streamType);
      logService.info(`Stream ${streamType} fermé`, 'StreamService');
    }
  }

  /**
   * Fermer tous les streams
   */
  closeAllStreams(): void {
    this.streams.forEach((eventSource, streamType) => {
      eventSource.close();
      logService.info(`Stream ${streamType} fermé`, 'StreamService');
    });
    
    this.streams.clear();
    this.callbacks.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Gérer la reconnexion automatique
   */
  private handleReconnect(streamType: string, callbacks: StreamCallbacks): void {
    const attempts = this.reconnectAttempts.get(streamType) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(streamType, attempts + 1);
      
      logService.info(`Tentative de reconnexion ${attempts + 1}/${this.maxReconnectAttempts} pour le stream ${streamType}`, 'StreamService');
      
      setTimeout(() => {
        // Vérifier si l'utilisateur est toujours authentifié
        const authStore = useAuthStore.getState();
        if (authStore.isAuthenticated) {
          this.startStream(streamType, callbacks);
        } else {
          logService.warning(`Reconnexion annulée - Utilisateur déconnecté`, 'StreamService');
        }
      }, this.reconnectDelay);
    } else {
      logService.error(`Échec de reconnexion du stream ${streamType} après ${this.maxReconnectAttempts} tentatives`, 'StreamService');
    }
  }

  /**
   * Vérifier si un stream est actif
   */
  isStreamActive(streamType: string): boolean {
    return this.streams.has(streamType);
  }

  /**
   * Obtenir la liste des streams actifs
   */
  getActiveStreams(): string[] {
    return Array.from(this.streams.keys());
  }

  /**
   * Redémarrer tous les streams (après reconnexion)
   */
  restartAllStreams(): void {
    logService.info('Redémarrage de tous les streams', 'StreamService');
    
    const activeCallbacks = new Map(this.callbacks);
    this.closeAllStreams();
    
    activeCallbacks.forEach((callbacks, streamType) => {
      this.startStream(streamType, callbacks);
    });
  }

  /**
   * Arrêter tous les streams (lors de la déconnexion)
   */
  stopAllStreams(): void {
    logService.info('Arrêt de tous les streams', 'StreamService');
    this.closeAllStreams();
  }
}

export const streamService = new StreamService();

// Hook pour utiliser le service de streams
export const useStreamService = () => {
  return {
    startStream: streamService.startStream.bind(streamService),
    closeStream: streamService.closeStream.bind(streamService),
    isStreamActive: streamService.isStreamActive.bind(streamService),
    getActiveStreams: streamService.getActiveStreams.bind(streamService),
    restartAllStreams: streamService.restartAllStreams.bind(streamService),
    stopAllStreams: streamService.stopAllStreams.bind(streamService)
  };
};
