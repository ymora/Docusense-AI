import { useBackendConnection } from '../hooks/useBackendConnection';

// Service de base pour les analyses de fichiers
const baseAnalysisFileService = {
  async getAnalysisFile(fileId: number) {
    const response = await fetch(`/api/analysis/file/${fileId}`);
    return await response.json();
  },

  async retryAnalysis(analysisId: number) {
    const response = await fetch(`/api/analysis/${analysisId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  }
};

// Hook pour utiliser le service avec guards de connexion
export const useAnalysisFileService = () => {
  const { conditionalRequest } = useBackendConnection();

  return {
    getAnalysisFile: (fileId: number) => conditionalRequest(
      () => baseAnalysisFileService.getAnalysisFile(fileId),
      { success: false, error: 'Backend déconnecté', file: null }
    ),

    retryAnalysis: (analysisId: number) => conditionalRequest(
      () => baseAnalysisFileService.retryAnalysis(analysisId),
      { success: false, error: 'Backend déconnecté' }
    )
  };
};

// Export du service de base pour compatibilité
export const analysisFileService = baseAnalysisFileService;
