import { create } from 'zustand';
import { queueService, queueSSEService } from '../services/queueService';
import { createLoadingActions, createCallGuard, createOptimizedUpdater } from '../utils/storeUtils';

export interface QueueItem {
  id: number;
  analysis_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';
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
  queue_metadata?: Record<string, unknown>;
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
  // OPTIMISATION: Marqueur pour éléments locaux temporaires
  is_local?: boolean;
}

interface QueueState {
  queueItems: QueueItem[];
  loading: boolean;
  error: string | null;
  isRealtimeConnected: boolean;

  // Actions optimisées
  loadQueueItems: () => Promise<void>;
  startRealtimeUpdates: () => void;
  stopRealtimeUpdates: () => void;
  
  // Actions de queue
  pauseQueue: () => Promise<void>;
  resumeQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
  retryFailedItems: () => Promise<void>;
  addToQueue: (analysisId: number, priority?: string) => Promise<void>;
  addLocalToQueue: (queueItem: any) => void;
  removeLocalItem: (localId: string) => void;
  
  // OPTIMISATION: Mise à jour directe via SSE
  updateQueueFromSSE: (data: any) => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queueItems: [],
  loading: false,
  error: null,
  isRealtimeConnected: false,

  // OPTIMISATION: Chargement initial uniquement
  loadQueueItems: (() => {
    const callGuard = createCallGuard();
    return callGuard(async () => {
      const loadingActions = createLoadingActions(set, get);
      const updater = createOptimizedUpdater(set, get);
      
      if (!loadingActions.startLoading()) {
        return;
      }
      
      try {
        const items = await queueService.getQueueItems();
        updater.updateMultiple({ queueItems: items });
        loadingActions.finishLoading();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement de la queue';
        loadingActions.finishLoadingWithError(errorMessage);
      }
    });
  })(),

  // NOUVEAU: Gestion SSE optimisée
  startRealtimeUpdates: () => {
    const { updateQueueFromSSE } = get();
    
    // Démarrer la connexion SSE
    queueService.startRealtimeUpdates();
    
    // S'abonner aux mises à jour
    const unsubscribe = queueService.subscribeToUpdates(updateQueueFromSSE);
    
    set({ isRealtimeConnected: true });
    
    // Retourner la fonction de nettoyage
    return unsubscribe;
  },

  stopRealtimeUpdates: () => {
    queueService.stopRealtimeUpdates();
    set({ isRealtimeConnected: false });
  },

  // OPTIMISATION: Mise à jour directe sans rechargement complet
  updateQueueFromSSE: (data: any) => {
    if (data.error) {
      console.error('❌ Erreur SSE:', data.error);
      return;
    }

    set((state) => {
      const updatedItems = state.queueItems.map(item => {
        const sseItem = data.items.find((sse: any) => sse.id === item.id);
        if (sseItem) {
          return {
            ...item,
            status: sseItem.status,
            progress: sseItem.progress,
            current_step: sseItem.current_step,
            error_message: sseItem.error_message,
            completed_at: sseItem.completed_at
          };
        }
        return item;
      });

      // Supprimer les éléments locaux qui ont été convertis en backend
      const filteredItems = updatedItems.filter(item => {
        if (item.is_local) {
          // Vérifier si un élément backend correspondant existe
          const hasBackendEquivalent = data.items.some((sse: any) => 
            sse.file_info?.name === item.file_info?.name
          );
          return !hasBackendEquivalent;
        }
        return true;
      });

      return { queueItems: filteredItems };
    });
  },

  // OPTIMISATION: Actions simplifiées sans rechargement automatique
  pauseQueue: async () => {
    set({ loading: true, error: null });
    try {
      await queueService.pauseQueue();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la pause de la queue';
      set({ error: errorMessage, loading: false });
    }
  },

  resumeQueue: async () => {
    set({ loading: true, error: null });
    try {
      await queueService.resumeQueue();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la reprise de la queue';
      set({ error: errorMessage, loading: false });
    }
  },

  clearQueue: async () => {
    set({ loading: true, error: null });
    try {
      await queueService.clearQueue();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du nettoyage de la queue';
      set({ error: errorMessage, loading: false });
    }
  },

  retryFailedItems: async () => {
    set({ loading: true, error: null });
    try {
      await queueService.retryFailedItems();
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la nouvelle tentative';
      set({ error: errorMessage, loading: false });
    }
  },

  addToQueue: async (analysisId: number, priority: string = 'normal') => {
    set({ loading: true, error: null });
    try {
      await queueService.addToQueue(analysisId, priority);
      set({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout à la queue';
      set({ error: errorMessage, loading: false });
    }
  },

  // OPTIMISATION: Gestion des éléments locaux
  addLocalToQueue: (queueItem: any) => {
    set((state) => ({
      queueItems: [...state.queueItems, queueItem],
      loading: false,
      error: null
    }));
  },

  removeLocalItem: (localId: string) => {
    set((state) => ({
      queueItems: state.queueItems.filter(item => item.id !== localId)
    }));
  },
}));