import { create } from 'zustand';
import { Analysis } from '../hooks/useAnalysisService';
import { useAnalysisService } from '../hooks/useAnalysisService';
import { logService } from '../services/logService';

interface AnalysisState {
  analyses: Analysis[];
  totalAnalyses: number;
  loading: boolean;
  error: string | null;

  // Actions d'état (sans appels API)
  setAnalyses: (analyses: Analysis[]) => void;
  setTotalAnalyses: (total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actions avec API
  loadAnalyses: () => Promise<void>;
  
  // Getters
  getAnalysesCount: () => number;
  getAnalysesByStatus: (status: string) => Analysis[];
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  analyses: [],
  totalAnalyses: 0,
  loading: false,
  error: null,

  // Actions d'état
  setAnalyses: (analyses: Analysis[]) => {
    set({ analyses });
  },

  setTotalAnalyses: (total: number) => {
    set({ totalAnalyses: total });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // Actions avec API
  loadAnalyses: async () => {
    try {
      set({ loading: true, error: null });
      
      logService.info('Chargement des analyses', 'AnalysisStore', {
        timestamp: new Date().toISOString()
      });

      console.log('🔍 [AnalysisStore] Début du chargement des analyses');

      const response = await fetch('/api/database/analyses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state?.accessToken : ''}`
        }
      });

      console.log('🔍 [AnalysisStore] Réponse reçue:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('🔍 [AnalysisStore] Données reçues:', data);
      
      // L'API retourne directement {analyses: [...], total: number, limit: number, offset: number}
      // On doit adapter la réponse au format attendu
      if (data.analyses) {
        console.log('🔍 [AnalysisStore] Analyses trouvées:', data.analyses.length);
        
        set({ 
          analyses: data.analyses, 
          totalAnalyses: data.total || data.analyses.length,
          loading: false 
        });
        
        logService.info('Analyses chargées avec succès', 'AnalysisStore', {
          count: data.analyses.length,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('🔍 [AnalysisStore] Aucune analyse trouvée dans la réponse');
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ [AnalysisStore] Erreur:', errorMessage);
      
      set({ error: errorMessage, loading: false });
      
      logService.error('Erreur lors du chargement des analyses', 'AnalysisStore', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Getters
  getAnalysesCount: () => {
    return get().totalAnalyses;
  },

  getAnalysesByStatus: (status: string) => {
    return get().analyses.filter(analysis => analysis.status === status);
  }
}));
