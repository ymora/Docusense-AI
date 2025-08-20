import { create } from 'zustand';
import { analysisService } from '../services/analysisService';
import { createLoadingActions, createCallGuard, createOptimizedUpdater } from '../utils/storeUtils';

export interface Analysis {
  id: number;
  file_info?: {
    id: number;
    name: string;
    path: string;
    size: number;
    mime_type: string;
  };
  analysis_type: string;
  status: string;
  provider: string;
  model: string;
  prompt: string;
  result?: string;
  analysis_metadata?: any;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  retry_count: number;
}

interface AnalysisState {
  analyses: Analysis[];
  totalAnalyses: number;
  loading: boolean;
  error: string | null;

  // Actions
  loadAnalyses: () => Promise<void>;
  getAnalysesCount: () => number;
  getAnalysesByStatus: (status: string) => Analysis[];
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  analyses: [],
  totalAnalyses: 0,
  loading: false,
  error: null,

  // Charger les analyses
  loadAnalyses: (() => {
    const callGuard = createCallGuard();
    return callGuard(async () => {
      const loadingActions = createLoadingActions(set, get);
      const updater = createOptimizedUpdater(set, get);
      
      if (!loadingActions.startLoading()) {
        return;
      }
      
      try {
        const response = await analysisService.getAnalysesList({ limit: 1000 }); // Récupérer toutes les analyses
        updater.updateMultiple({ 
          analyses: response.analyses,
          totalAnalyses: response.total
        });
        loadingActions.finishLoading();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des analyses';
        loadingActions.finishLoadingWithError(errorMessage);
      }
    });
  })(),

  // Obtenir le nombre total d'analyses
  getAnalysesCount: () => {
    return get().totalAnalyses;
  },

  // Obtenir les analyses par statut
  getAnalysesByStatus: (status: string) => {
    return get().analyses.filter(analysis => analysis.status === status);
  }
}));
