import { QueueItem, QueueStatus } from '../stores/queueStore';
import { apiRequest, handleApiError, DEFAULT_TIMEOUT } from '../utils/apiUtils';

export const queueService = {
  // Obtenir le statut de la queue
  async getQueueStatus(): Promise<QueueStatus> {
    try {
      const data = await apiRequest('/api/queue/status', {}, DEFAULT_TIMEOUT);
      return data as QueueStatus;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du statut de la queue: ${handleApiError(error)}`);
    }
  },

  // Obtenir les éléments de la queue
  async getQueueItems(): Promise<QueueItem[]> {
    try {
      const data = await apiRequest('/api/queue/', {}, DEFAULT_TIMEOUT);
      return data as QueueItem[];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des éléments de la queue: ${handleApiError(error)}`);
    }
  },

  // Contrôles de la queue
  async pauseQueue(): Promise<void> {
    try {
      await apiRequest('/api/queue/control', {
        method: 'POST',
        body: JSON.stringify({ action: 'pause' })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors de la pause de la queue: ${handleApiError(error)}`);
    }
  },

  async resumeQueue(): Promise<void> {
    try {
      await apiRequest('/api/queue/control', {
        method: 'POST',
        body: JSON.stringify({ action: 'resume' })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors de la reprise de la queue: ${handleApiError(error)}`);
    }
  },

  async clearQueue(): Promise<void> {
    try {
      await apiRequest('/api/queue/control', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear' })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors du vidage de la queue: ${handleApiError(error)}`);
    }
  },

  async retryFailedItems(): Promise<void> {
    try {
      await apiRequest('/api/queue/control', {
        method: 'POST',
        body: JSON.stringify({ action: 'retry' })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors de la nouvelle tentative des éléments échoués: ${handleApiError(error)}`);
    }
  },

  // Ajouter un élément à la queue
  async addToQueue(analysisId: number, priority: string = 'normal'): Promise<void> {
    try {
      await apiRequest('/api/queue/add', {
        method: 'POST',
        body: JSON.stringify({ analysis_id: analysisId, priority })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout à la queue: ${handleApiError(error)}`);
    }
  },

  // Contrôles des éléments individuels
  async pauseItem(itemId: number): Promise<void> {
    try {
      await apiRequest(`/api/queue/items/${itemId}/control`, {
        method: 'POST',
        body: JSON.stringify({ action: 'pause' })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors de la pause de l'élément: ${handleApiError(error)}`);
    }
  },

  async resumeItem(itemId: number): Promise<void> {
    try {
      await apiRequest(`/api/queue/items/${itemId}/control`, {
        method: 'POST',
        body: JSON.stringify({ action: 'resume' })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors de la reprise de l'élément: ${handleApiError(error)}`);
    }
  },

  async deleteItem(itemId: number): Promise<void> {
    try {
      await apiRequest(`/api/queue/items/${itemId}`, {
        method: 'DELETE'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors de la suppression de l'élément: ${handleApiError(error)}`);
    }
  },

  async retryItem(itemId: number): Promise<void> {
    try {
      await apiRequest(`/api/queue/items/${itemId}/control`, {
        method: 'POST',
        body: JSON.stringify({ action: 'retry' })
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors de la nouvelle tentative de l'élément: ${handleApiError(error)}`);
    }
  },

  // Analyse multiple par IA
  async analyzeWithMultipleAI(
    fileIds: number[], 
    promptId: string, 
    providers: string[]
  ): Promise<any> {
    try {
      const response = await apiRequest('/api/analysis/multiple-ai', {
        method: 'POST',
        body: JSON.stringify({
          file_ids: fileIds,
          prompt_id: promptId,
          providers: providers
        })
      }, DEFAULT_TIMEOUT);
      
      return response;
    } catch (error) {
      throw new Error(`Erreur lors de l'analyse multiple par IA: ${handleApiError(error)}`);
    }
  }
};