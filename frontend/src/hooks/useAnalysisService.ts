import { useBackendConnection } from './useBackendConnection';
import { analysisService, Analysis, CreateAnalysisRequest, AnalysisServiceResponse } from '../services/analysisService';
import { useUnifiedAuth } from './useUnifiedAuth';

// Hook pour utiliser le service d'analyses avec guards de connexion
export const useAnalysisService = () => {
  const { conditionalRequest } = useBackendConnection();
  const { isAuthenticated } = useUnifiedAuth();
  
  return {
    getAnalysesList: (): Promise<AnalysisServiceResponse<Analysis[]>> => {
      if (!isAuthenticated) {
        console.log('[AnalysisService] Utilisateur non authentifié - pas de chargement des analyses');
        return Promise.resolve({ success: false, data: [], error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => analysisService.getAnalysesList(),
        { success: false, data: [], error: 'Backend déconnecté' }
      );
    },
    
    createAnalysis: (request: CreateAnalysisRequest): Promise<AnalysisServiceResponse<Analysis>> => {
      if (!isAuthenticated) {
        console.log('[AnalysisService] Utilisateur non authentifié - pas de création d\'analyse');
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => analysisService.createAnalysis(request),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    retryAnalysis: (id: number): Promise<AnalysisServiceResponse<Analysis>> => {
      if (!isAuthenticated) {
        console.log('[AnalysisService] Utilisateur non authentifié - pas de relance d\'analyse:', id);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => analysisService.retryAnalysis(id),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    deleteAnalysis: (id: number): Promise<AnalysisServiceResponse<void>> => {
      if (!isAuthenticated) {
        console.log('[AnalysisService] Utilisateur non authentifié - pas de suppression d\'analyse:', id);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => analysisService.deleteAnalysis(id),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    getAnalysisById: (id: number): Promise<AnalysisServiceResponse<Analysis>> => {
      if (!isAuthenticated) {
        console.log('[AnalysisService] Utilisateur non authentifié - pas de récupération d\'analyse:', id);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => analysisService.getAnalysisById(id),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    startAnalysis: (id: number): Promise<AnalysisServiceResponse<Analysis>> => {
      if (!isAuthenticated) {
        console.log('[AnalysisService] Utilisateur non authentifié - pas de démarrage d\'analyse:', id);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => analysisService.startAnalysis(id),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    hasPDF: (id: number): Promise<boolean> => {
      if (!isAuthenticated) {
        console.log('[AnalysisService] Utilisateur non authentifié - pas de vérification PDF:', id);
        return Promise.resolve(false);
      }
      return conditionalRequest(
        () => analysisService.hasPDF(id),
        false
      );
    }
  };
};

export type { Analysis, CreateAnalysisRequest, AnalysisServiceResponse };
