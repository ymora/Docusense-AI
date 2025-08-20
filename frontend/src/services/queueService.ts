import { apiRequest, handleApiError, DEFAULT_TIMEOUT } from '../utils/apiUtils';
import { QueueItem, QueueStatus } from '../stores/queueStore';

// NOUVEAU: Service SSE pour les mises à jour temps réel
class QueueSSEService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Set<(data: any) => void> = new Set();

  connect() {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      this.eventSource = new EventSource('/api/queue/stream');
      
      this.eventSource.onopen = () => {
        console.log('🔗 SSE connecté pour la queue');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (error) {
          console.error('❌ Erreur parsing SSE:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ Erreur SSE:', error);
        this.handleReconnect();
      };

    } catch (error) {
      console.error('❌ Erreur connexion SSE:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentative de reconnexion SSE ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Échec reconnexion SSE après', this.maxReconnectAttempts, 'tentatives');
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Erreur callback SSE:', error);
      }
    });
  }
}

// Instance globale du service SSE
export const queueSSEService = new QueueSSEService();

export const queueService = {
  // Récupérer les éléments de la queue
  async getQueueItems(): Promise<QueueItem[]> {
    try {
      const response = await apiRequest('/api/queue/items', {}, DEFAULT_TIMEOUT);
      return response.data || [];
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la récupération des éléments de queue:', error);
      throw new Error(`Erreur lors de la récupération de la queue: ${handleApiError(error)}`);
    }
  },

  // Récupérer le statut de la queue
  async getQueueStatus(): Promise<QueueStatus> {
    try {
      const response = await apiRequest('/api/queue/status', {}, DEFAULT_TIMEOUT);
      return response.data || {
        total_items: 0,
        processing_items: 0,
        pending_items: 0,
        completed_items: 0,
        failed_items: 0,
        is_processing: false,
        is_paused: false
      };
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la récupération du statut de queue:', error);
      throw new Error(`Erreur lors de la récupération du statut: ${handleApiError(error)}`);
    }
  },

  // Ajouter un élément à la queue
  async addToQueue(analysisId: number): Promise<void> {
    try {
      await apiRequest('/api/queue/add', {
        method: 'POST',
        body: JSON.stringify({
          analysis_id: analysisId
        })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de l\'ajout à la queue:', error);
      throw new Error(`Erreur lors de l'ajout à la queue: ${handleApiError(error)}`);
    }
  },

  // Démarrer le traitement de la queue
  async startQueueProcessing(): Promise<void> {
    try {
      await apiRequest('/api/queue/start', {
        method: 'POST'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors du démarrage du traitement:', error);
      throw new Error(`Erreur lors du démarrage du traitement: ${handleApiError(error)}`);
    }
  },

  // Mettre en pause la queue
  async pauseQueue(): Promise<void> {
    try {
      await apiRequest('/api/queue/pause', {
        method: 'POST'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la pause de la queue:', error);
      throw new Error(`Erreur lors de la pause: ${handleApiError(error)}`);
    }
  },

  // Reprendre la queue
  async resumeQueue(): Promise<void> {
    try {
      await apiRequest('/api/queue/resume', {
        method: 'POST'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la reprise de la queue:', error);
      throw new Error(`Erreur lors de la reprise: ${handleApiError(error)}`);
    }
  },

  // Vider la queue
  async clearQueue(): Promise<void> {
    try {
      await apiRequest('/api/queue/clear', {
        method: 'POST'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors du nettoyage de la queue:', error);
      throw new Error(`Erreur lors du nettoyage: ${handleApiError(error)}`);
    }
  },

  // Relancer les éléments échoués
  async retryFailedItems(): Promise<void> {
    try {
      await apiRequest('/api/queue/retry-failed', {
        method: 'POST'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la relance des éléments échoués:', error);
      throw new Error(`Erreur lors de la relance: ${handleApiError(error)}`);
    }
  },

  // Supprimer un élément de la queue
  async deleteQueueItem(itemId: number): Promise<void> {
    try {
      await apiRequest(`/api/queue/items/${itemId}`, {
        method: 'DELETE'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la suppression de l\'élément:', error);
      throw new Error(`Erreur lors de la suppression: ${handleApiError(error)}`);
    }
  },

  // Relancer un élément spécifique
  async retryQueueItem(itemId: number): Promise<void> {
    try {
      await apiRequest(`/api/queue/items/${itemId}/retry`, {
        method: 'POST'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la relance de l\'élément:', error);
      throw new Error(`Erreur lors de la relance: ${handleApiError(error)}`);
    }
  },

  // Mettre en pause un élément spécifique
  async pauseQueueItem(itemId: number): Promise<void> {
    try {
      await apiRequest(`/api/queue/items/${itemId}/pause`, {
        method: 'POST'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la pause de l\'élément:', error);
      throw new Error(`Erreur lors de la pause: ${handleApiError(error)}`);
    }
  },

  // Reprendre un élément spécifique
  async resumeQueueItem(itemId: number): Promise<void> {
    try {
      await apiRequest(`/api/queue/items/${itemId}/resume`, {
        method: 'POST'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la reprise de l\'élément:', error);
      throw new Error(`Erreur lors de la reprise: ${handleApiError(error)}`);
    }
  },

  // Mettre à jour le fournisseur IA et le prompt d'une analyse
  async updateAnalysisProviderAndPrompt(itemId: string, provider: string, prompt: string): Promise<void> {
    try {
      // Vérifier que les paramètres ne sont pas vides
      if (!provider || !prompt) {
        throw new Error('Provider et prompt sont requis');
      }
      
      await apiRequest(`/api/queue/items/${itemId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          prompt
        })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la mise à jour du fournisseur et du prompt:', error);
      throw new Error(`Erreur lors de la mise à jour: ${handleApiError(error)}`);
    }
  },

  // Dupliquer une analyse
  async duplicateAnalysis(itemId: number, provider?: string, prompt?: string): Promise<any> {
    try {
      const body: any = {};
      if (provider) body.provider = provider;
      if (prompt) body.prompt = prompt;
      
      const response = await apiRequest(`/api/queue/items/${itemId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }, DEFAULT_TIMEOUT);
      
      return response.data;
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la duplication de l\'analyse:', error);
      throw new Error(`Erreur lors de la duplication: ${handleApiError(error)}`);
    }
  },

  // NOUVEAU: Méthodes optimisées
  startRealtimeUpdates: () => {
    queueSSEService.connect();
  },

  stopRealtimeUpdates: () => {
    queueSSEService.disconnect();
  },

  subscribeToUpdates: (callback: (data: any) => void) => {
    return queueSSEService.subscribe(callback);
  },

  // OPTIMISATION: Chargement initial uniquement
  getQueueItems: async (): Promise<QueueItem[]> => {
    try {
      const response = await apiRequest('/api/queue/items', {}, DEFAULT_TIMEOUT);
      return response.data || [];
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de la récupération des éléments de queue:', error);
      throw new Error(`Erreur lors de la récupération de la queue: ${handleApiError(error)}`);
    }
  },

  // OPTIMISATION: Pas de rechargement automatique après actions
  addToQueue: async (analysisId: number, priority?: string): Promise<void> => {
    try {
      await apiRequest('/api/queue/add', {
        method: 'POST',
        body: JSON.stringify({
          analysis_id: analysisId,
          priority: priority || 'normal'
        })
      }, DEFAULT_TIMEOUT);
      // Pas de rechargement - SSE s'en charge
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de l\'ajout à la queue:', error);
      throw new Error(`Erreur lors de l'ajout à la queue: ${handleApiError(error)}`);
    }
  },
};