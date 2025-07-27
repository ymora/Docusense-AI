import { create } from 'zustand';
import { queueService } from '../services/queueService';

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
  queue_metadata?: Record<string, any>;
  // Nouvelles informations sur l'analyse
  analysis_type?: string;
  analysis_provider?: string;
  analysis_model?: string;
  file_info?: {
    id: number;
    name: string;
    size: number;
    mime_type: string;
  };
}

export interface QueueStatus {
  total_items: number;
  processing_items: number;
  pending_items: number;
  completed_items: number;
  failed_items: number;
  average_wait_time?: number;
  estimated_completion_time?: string;
  is_processing: boolean;
  is_paused: boolean;
}

interface QueueState {
  queueItems: QueueItem[];
  queueStatus: QueueStatus;
  loading: boolean;
  error: string | null;

  // Actions
  loadQueueItems: () => Promise<void>;
  loadQueueStatus: () => Promise<void>;
  pauseQueue: () => Promise<void>;
  resumeQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
  retryFailedItems: () => Promise<void>;
  addToQueue: (analysisId: number, priority?: string) => Promise<void>;

  // Actions par type
  pauseType: (type: string) => Promise<void>;
  resumeType: (type: string) => Promise<void>;
  deleteType: (type: string) => Promise<void>;
  retryType: (type: string) => Promise<void>;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queueItems: [],
  queueStatus: {
    total_items: 0,
    processing_items: 0,
    pending_items: 0,
    completed_items: 0,
    failed_items: 0,
    is_processing: false,
    is_paused: false,
  },
  loading: false,
  error: null,

  loadQueueItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await queueService.getQueueItems();
      set({ queueItems: items, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement de la queue';
      set({ error: errorMessage, loading: false });
      console.error('Erreur lors du chargement de la queue:', error);
    }
  },

  loadQueueStatus: async () => {
    try {
      const status = await queueService.getQueueStatus();
      set({ queueStatus: status, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement du statut de la queue';
      set({ error: errorMessage });
      console.error('Erreur lors du chargement du statut de la queue:', error);
    }
  },

  pauseQueue: async () => {
    set({ loading: true, error: null });
    try {
      await queueService.pauseQueue();
      await get().loadQueueStatus();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la pause de la queue';
      set({ error: errorMessage, loading: false });
      console.error('Erreur lors de la pause de la queue:', error);
    }
  },

  resumeQueue: async () => {
    set({ loading: true, error: null });
    try {
      await queueService.resumeQueue();
      await get().loadQueueStatus();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la reprise de la queue';
      set({ error: errorMessage, loading: false });
      console.error('Erreur lors de la reprise de la queue:', error);
    }
  },

  clearQueue: async () => {
    set({ loading: true, error: null });
    try {
      await queueService.clearQueue();
      await get().loadQueueItems();
      await get().loadQueueStatus();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du nettoyage de la queue';
      set({ error: errorMessage, loading: false });
      console.error('Erreur lors du nettoyage de la queue:', error);
    }
  },

  retryFailedItems: async () => {
    set({ loading: true, error: null });
    try {
      await queueService.retryFailedItems();
      await get().loadQueueItems();
      await get().loadQueueStatus();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la nouvelle tentative';
      set({ error: errorMessage, loading: false });
      console.error('Erreur lors de la nouvelle tentative:', error);
    }
  },

  addToQueue: async (analysisId: number, priority: string = 'normal') => {
    set({ loading: true, error: null });
    try {
      await queueService.addToQueue(analysisId, priority);
      await get().loadQueueItems();
      await get().loadQueueStatus();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout à la queue';
      set({ error: errorMessage, loading: false });
      console.error('Erreur lors de l\'ajout à la queue:', error);
    }
  },

  // Actions par type d'analyse
  pauseType: async (type: string) => {
    set({ loading: true, error: null });
    try {
      // Filtrer les éléments par type et les mettre en pause
      const itemsOfType = get().queueItems.filter(item => item.analysis_type === type);
      for (const item of itemsOfType) {
        await queueService.pauseItem(item.id);
      }
      await get().loadQueueItems();
      await get().loadQueueStatus();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la pause du type';
      set({ error: errorMessage, loading: false });
      console.error('Erreur lors de la pause du type:', error);
    }
  },

  resumeType: async (type: string) => {
    set({ loading: true, error: null });
    try {
      // Filtrer les éléments par type et les reprendre
      const itemsOfType = get().queueItems.filter(item => item.analysis_type === type);
      for (const item of itemsOfType) {
        await queueService.resumeItem(item.id);
      }
      await get().loadQueueItems();
      await get().loadQueueStatus();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la reprise du type';
      set({ error: errorMessage, loading: false });
      console.error('Erreur lors de la reprise du type:', error);
    }
  },

  deleteType: async (type: string) => {
    set({ loading: true, error: null });
    try {
      // Filtrer les éléments par type et les supprimer
      const itemsOfType = get().queueItems.filter(item => item.analysis_type === type);
      for (const item of itemsOfType) {
        await queueService.deleteItem(item.id);
      }
      await get().loadQueueItems();
      await get().loadQueueStatus();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression du type';
      set({ error: errorMessage, loading: false });
      console.error('Erreur lors de la suppression du type:', error);
    }
  },

  retryType: async (type: string) => {
    set({ loading: true, error: null });
    try {
      // Filtrer les éléments par type et les relancer
      const itemsOfType = get().queueItems.filter(item => item.analysis_type === type);
      for (const item of itemsOfType) {
        await queueService.retryItem(item.id);
      }
      await get().loadQueueItems();
      await get().loadQueueStatus();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la nouvelle tentative du type';
      set({ error: errorMessage, loading: false });
      console.error('Erreur lors de la nouvelle tentative du type:', error);
    }
  },
}));