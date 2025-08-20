
import { apiRequest, handleApiError } from '../utils/apiUtils';
import { logService } from './logService';

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

export const analysisService = {
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
      
      const url = `/api/analysis/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
      const response = await apiRequest(url, {}, DEFAULT_TIMEOUT);
      
      
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
      console.error('❌ AnalysisService: Erreur lors de la récupération des analyses:', error);
      throw new Error(`Erreur lors de la récupération des analyses: ${handleApiError(error)}`);
    }
  },

  // Créer une analyse en attente
  async createPendingAnalysis(request: CreateAnalysisRequest): Promise<CreateAnalysisResponse> {
    try {
      logService.info('Création d\'une analyse en attente', 'AnalysisService', { 
        filePath: request.file_path,
        analysisType: request.analysis_type,
        provider: request.provider
      });
  
      const response = await apiRequest('/api/analysis/create-pending', {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          status: 'pending'
        })
      }, DEFAULT_TIMEOUT);
      
      logService.info('Analyse en attente créée avec succès', 'AnalysisService', { 
        analysisId: response.data.analysis_id,
        filePath: request.file_path
      });
      
      return response.data as CreateAnalysisResponse;
    } catch (error) {
      logService.error('Erreur lors de la création de l\'analyse en attente', 'AnalysisService', { 
        filePath: request.file_path,
        error: error.message 
      });
      throw new Error(`Erreur lors de la création de l'analyse: ${handleApiError(error)}`);
    }
  },

  // Créer plusieurs analyses en attente (batch)
  async createPendingAnalyses(requests: CreateAnalysisRequest[]): Promise<CreateAnalysisResponse[]> {
    try {
      const data = await apiRequest('/api/analysis/create-pending-batch', {
        method: 'POST',
        body: JSON.stringify({
          analyses: requests.map(req => ({ ...req, status: 'pending' }))
        })
      }, DEFAULT_TIMEOUT);
      
      return data as CreateAnalysisResponse[];
    } catch (error) {
      throw new Error(`Erreur lors de la création des analyses: ${handleApiError(error)}`);
    }
  },

  // Lancer une analyse en attente
  async startAnalysis(analysisId: number): Promise<void> {
    try {
      logService.info('Démarrage de l\'analyse', 'AnalysisService', { analysisId });
      
      await apiRequest(`/api/analysis/${analysisId}/start`, {
        method: 'POST'
      }, DEFAULT_TIMEOUT);
      
      logService.info('Analyse démarrée avec succès', 'AnalysisService', { analysisId });
    } catch (error) {
      logService.error('Erreur lors du lancement de l\'analyse', 'AnalysisService', { analysisId, error: error.message });
      throw new Error(`Erreur lors du lancement de l'analyse: ${handleApiError(error)}`);
    }
  },



  // Supprimer une analyse
  async deleteAnalysis(analysisId: number): Promise<void> {
    try {
      console.log(`🔍 Tentative de suppression de l'analyse ${analysisId}`);
      const response = await apiRequest(`/api/analysis/${analysisId}`, {
        method: 'DELETE'
      }, DEFAULT_TIMEOUT);
      console.log(`✅ Analyse ${analysisId} supprimée avec succès`);
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de l'analyse ${analysisId}:`, error);
      throw new Error(`Erreur lors de la suppression de l'analyse: ${handleApiError(error)}`);
    }
  },

  // Relancer une analyse
  async retryAnalysis(analysisId: number): Promise<void> {
    try {
      await apiRequest(`/api/analysis/${analysisId}/retry`, {
        method: 'POST'
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors de la relance de l'analyse: ${handleApiError(error)}`);
    }
  },

  // Mettre à jour une analyse
  async updateAnalysis(analysisId: number, updates: Partial<Analysis>): Promise<void> {
    try {
      await apiRequest(`/api/analysis/${analysisId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }, DEFAULT_TIMEOUT);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l'analyse: ${handleApiError(error)}`);
    }
  }
}; 