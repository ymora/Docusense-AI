import { unifiedApiService } from './unifiedApiService';

export interface Analysis {
  id: number;
  file_id: number;
  analysis_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  result?: string;
  error?: string;
  provider?: string;
  model?: string;
  prompt?: string;
  file_info?: {
    name: string;
    path: string;
    size: number;
    mime_type: string;
  };
}

export interface CreateAnalysisRequest {
  file_id: number;
  analysis_type: string;
  provider: string;
  model: string;
  prompt: string;
}

export interface AnalysisServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Service de base pour les analyses
export const analysisService = {
  async getAnalysesList(): Promise<AnalysisServiceResponse<Analysis[]>> {
    const response = await unifiedApiService.get('/api/database/analyses') as any;
    // L'API retourne directement {analyses: [...], total: number, limit: number, offset: number}
    // On doit adapter la réponse au format attendu
    if (response && response.analyses) {
      return {
        success: true,
        data: response.analyses
      };
    }
    return { success: false, error: 'Réponse invalide' };
  },

  async createAnalysis(request: CreateAnalysisRequest): Promise<AnalysisServiceResponse<Analysis>> {
    return await unifiedApiService.post('/api/analysis/create', request);
  },

  async retryAnalysis(id: number): Promise<AnalysisServiceResponse<Analysis>> {
    return await unifiedApiService.post(`/api/analysis/${id}/retry`);
  },

  async deleteAnalysis(id: number): Promise<AnalysisServiceResponse<void>> {
    return await unifiedApiService.delete(`/api/analysis/${id}`);
  },

  async getAnalysisById(id: number): Promise<AnalysisServiceResponse<Analysis>> {
    return await unifiedApiService.get(`/api/analysis/${id}`);
  },

  async startAnalysis(id: number): Promise<AnalysisServiceResponse<Analysis>> {
    return await unifiedApiService.post(`/api/analysis/${id}/start`);
  },

  async hasPDF(id: number): Promise<boolean> {
    try {
      const response = await unifiedApiService.get(`/api/analysis/${id}/has-pdf`) as AnalysisServiceResponse<boolean>;
      return response.success && response.data === true;
    } catch {
      return false;
    }
  }
};
