
import { apiRequest, handleApiError } from '../utils/apiUtils';
import { logService } from './logService';
import { useBackendConnection } from '../hooks/useBackendConnection';
import { useUnifiedApiService } from './unifiedApiService';

const DEFAULT_TIMEOUT = 30000; // 30 secondes

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

export interface AnalysisListParams {
  sort_by?: 'created_at' | 'status' | 'provider' | 'file_name' | 'analysis_type';
  sort_order?: 'asc' | 'desc';
  status_filter?: string;
  prompt_filter?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AnalysisListResponse {
  analyses: Analysis[];
  total: number;
  limit: number;
  offset: number;
  sort_by: string;
  sort_order: string;
}

export interface CreateAnalysisRequest {
  file_id?: number | string;
  file_path?: string;  // Nouveau: support du chemin de fichier
  prompt_id: string;
  analysis_type?: string;
  custom_prompt?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface CreateAnalysisResponse {
  analysis_id: number;
  status: string;
  message: string;
}

// Service de base sans vérification de connexion (utilise le service unifié)
const baseAnalysisService = {
  // Récupérer la liste des analyses avec tri et filtrage
  async getAnalysesList(params: AnalysisListParams = {}): Promise<AnalysisListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
      if (params.status_filter) queryParams.append('status_filter', params.status_filter);
      if (params.prompt_filter) queryParams.append('prompt_filter', params.prompt_filter);
      if (params.search) queryParams.append('search', params.search);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      
      const url = `/analysis/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const apiService = new (await import('./unifiedApiService')).default();
      const response = await apiService.get(url);
      
      logService.info('Liste des analyses récupérée', 'AnalysisService', {
        count: response.data?.length || 0,
        filters: params,
        timestamp: new Date().toISOString()
      });
      
      // Adapter la réponse de l'API au format attendu par le frontend
      const adaptedResponse: AnalysisListResponse = {
        analyses: response.data || [],
        total: response.pagination?.total || 0,
        limit: response.pagination?.limit || 50,
        offset: response.pagination?.offset || 0,
        sort_by: response.sort_by || 'created_at',
        sort_order: response.sort_order || 'desc'
      };
      
      return adaptedResponse;
    } catch (error) {
      logService.error('Erreur lors de la récupération des analyses', 'AnalysisService', {
        error: handleApiError(error),
        filters: params,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des analyses: ${handleApiError(error)}`);
    }
  },

  // Créer une nouvelle analyse
  async createAnalysis(request: CreateAnalysisRequest): Promise<CreateAnalysisResponse> {
    try {
      const response = await apiRequest('/api/analysis/create', {
        method: 'POST',
        body: JSON.stringify(request),
      }, DEFAULT_TIMEOUT) as any;

      logService.info('Analyse créée', 'AnalysisService', {
        analysisId: response.analysis_id,
        fileId: request.file_id,
        filePath: request.file_path,
        promptId: request.prompt_id,
        timestamp: new Date().toISOString()
      });

      return {
        analysis_id: response.analysis_id,
        status: response.status,
        message: response.message
      };
    } catch (error) {
      logService.error('Erreur lors de la création de l\'analyse', 'AnalysisService', {
        error: handleApiError(error),
        request,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la création de l'analyse: ${handleApiError(error)}`);
    }
  },

  // Démarrer une analyse
  async startAnalysis(analysisId: string | number): Promise<void> {
    try {
      await apiRequest(`/api/analysis/${analysisId}/start`, {
        method: 'POST',
      }, DEFAULT_TIMEOUT);

      logService.info('Analyse démarrée', 'AnalysisService', {
        analysisId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logService.error('Erreur lors du démarrage de l\'analyse', 'AnalysisService', {
        error: handleApiError(error),
        analysisId,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors du démarrage de l'analyse: ${handleApiError(error)}`);
    }
  },

  // Supprimer une analyse
  async deleteAnalysis(analysisId: string | number): Promise<void> {
    try {
      await apiRequest(`/api/analysis/${analysisId}`, {
        method: 'DELETE',
      }, DEFAULT_TIMEOUT);

      logService.info('Analyse supprimée', 'AnalysisService', {
        analysisId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logService.error('Erreur lors de la suppression de l\'analyse', 'AnalysisService', {
        error: handleApiError(error),
        analysisId,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la suppression de l'analyse: ${handleApiError(error)}`);
    }
  },

  // Supprimer plusieurs analyses
  async deleteMultipleAnalyses(analysisIds: (string | number)[]): Promise<void> {
    try {
      await apiRequest('/api/analysis/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ analysis_ids: analysisIds }),
      }, DEFAULT_TIMEOUT);

      logService.info('Analyses supprimées en lot', 'AnalysisService', {
        count: analysisIds.length,
        analysisIds,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logService.error('Erreur lors de la suppression en lot', 'AnalysisService', {
        error: handleApiError(error),
        count: analysisIds.length,
        analysisIds,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la suppression en lot: ${handleApiError(error)}`);
    }
  },

  // Obtenir les détails d'une analyse
  async getAnalysisDetails(analysisId: string | number): Promise<Analysis> {
    try {
      const apiService = new (await import('./unifiedApiService')).default();
      const response = await apiService.get(`/analysis/${analysisId}`) as Analysis;
      
      logService.info('Détails de l\'analyse récupérés', 'AnalysisService', {
        analysisId,
        status: response.status,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      logService.error('Erreur lors de la récupération des détails', 'AnalysisService', {
        error: handleApiError(error),
        analysisId,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des détails: ${handleApiError(error)}`);
    }
  },

  // Obtenir l'analyse d'un fichier (intégré depuis analysisFileService)
  async getAnalysisFile(fileId: number) {
    try {
      const apiService = new (await import('./unifiedApiService')).default();
      const response = await apiService.get(`/analysis/file/${fileId}`);
      
      logService.info('Analyse de fichier récupérée', 'AnalysisService', {
        fileId,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      logService.error('Erreur lors de la récupération de l\'analyse de fichier', 'AnalysisService', {
        error: handleApiError(error),
        fileId,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération de l'analyse de fichier: ${handleApiError(error)}`);
    }
  },

  // Relancer une analyse (intégré depuis analysisFileService)
  async retryAnalysis(analysisId: number) {
    try {
      const apiService = new (await import('./unifiedApiService')).default();
      const response = await apiService.post(`/analysis/${analysisId}/retry`, {});
      
      logService.info('Analyse relancée', 'AnalysisService', {
        analysisId,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      logService.error('Erreur lors du relancement de l\'analyse', 'AnalysisService', {
        error: handleApiError(error),
        analysisId,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors du relancement de l'analyse: ${handleApiError(error)}`);
    }
  }
};

// Hook pour utiliser le service avec vérification de connexion
export const useAnalysisService = () => {
  const { conditionalRequest } = useBackendConnection();

  return {
    getAnalysesList: (params: AnalysisListParams = {}) => 
      conditionalRequest(() => baseAnalysisService.getAnalysesList(params), {
        analyses: [],
        total: 0,
        limit: 50,
        offset: 0,
        sort_by: 'created_at',
        sort_order: 'desc'
      }),

    createAnalysis: (request: CreateAnalysisRequest) => 
      conditionalRequest(() => baseAnalysisService.createAnalysis(request), null),

    startAnalysis: (analysisId: string | number) => 
      conditionalRequest(() => baseAnalysisService.startAnalysis(analysisId), null),

    deleteAnalysis: (analysisId: string | number) => 
      conditionalRequest(() => baseAnalysisService.deleteAnalysis(analysisId), null),

    deleteMultipleAnalyses: (analysisIds: (string | number)[]) => 
      conditionalRequest(() => baseAnalysisService.deleteMultipleAnalyses(analysisIds), null),

    getAnalysisDetails: (analysisId: string | number) => 
      conditionalRequest(() => baseAnalysisService.getAnalysisDetails(analysisId), null),

    // Nouvelles méthodes intégrées depuis analysisFileService
    getAnalysisFile: (fileId: number) => 
      conditionalRequest(() => baseAnalysisService.getAnalysisFile(fileId), { success: false, error: 'Backend déconnecté', file: null }),

    retryAnalysis: (analysisId: number) => 
      conditionalRequest(() => baseAnalysisService.retryAnalysis(analysisId), { success: false, error: 'Backend déconnecté' })
  };
};

// Export du service de base pour compatibilité
export const analysisService = baseAnalysisService; 