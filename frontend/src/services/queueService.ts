import { apiRequest, handleApiError, DEFAULT_TIMEOUT } from '../utils/apiUtils';

export interface QueueItem {
  id: number;
  analysis_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  progress: number;
  current_step?: string;
  total_steps: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  analysis_metadata?: any;
  file_info?: {
    id: number;
    name: string;
    path: string;
    size: number;
    mime_type: string;
  };
}



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
  async addToQueue(analysisId: number, priority: string = 'normal'): Promise<void> {
    try {
      await apiRequest('/api/queue/add', {
        method: 'POST',
        body: JSON.stringify({
          analysis_id: analysisId,
          priority: priority
        })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      console.error('❌ QueueService: Erreur lors de l\'ajout à la queue:', error);
      throw new Error(`Erreur lors de l'ajout à la queue: ${handleApiError(error)}`);
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
  }
};