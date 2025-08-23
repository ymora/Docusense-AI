import { useBackendConnection } from './useBackendConnection';
import { configService, AIProvider, ConfigServiceResponse } from '../services/configService';
import { useUnifiedAuth } from './useUnifiedAuth';

// Hook pour utiliser le service de configuration avec guards de connexion
export const useConfigService = () => {
  const { conditionalRequest } = useBackendConnection();
  const { isAuthenticated } = useUnifiedAuth();
  
  return {
    getAIProviders: (): Promise<ConfigServiceResponse<AIProvider[]>> => {
      if (!isAuthenticated) {
        console.log('[ConfigService] Utilisateur non authentifié - pas de chargement des providers IA');
        return Promise.resolve({ success: false, data: [], error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => configService.getAIProviders(),
        { success: false, data: [], error: 'Backend déconnecté' }
      );
    },
    
    getApiKey: (provider: string): Promise<ConfigServiceResponse<string>> => {
      if (!isAuthenticated) {
        console.log('[ConfigService] Utilisateur non authentifié - pas de récupération de clé API:', provider);
        return Promise.resolve({ success: false, data: '', error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => configService.getApiKey(provider),
        { success: false, data: '', error: 'Backend déconnecté' }
      );
    },
    
    saveAPIKey: (provider: string, key: string): Promise<ConfigServiceResponse<void>> => {
      if (!isAuthenticated) {
        console.log('[ConfigService] Utilisateur non authentifié - pas de sauvegarde de clé API:', provider);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => configService.saveAPIKey(provider, key),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    testProvider: (provider: string): Promise<ConfigServiceResponse<any>> => {
      if (!isAuthenticated) {
        console.log('[ConfigService] Utilisateur non authentifié - pas de test de provider:', provider);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => configService.testProvider(provider),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    setProviderPriority: (provider: string, priority: number): Promise<ConfigServiceResponse<void>> => {
      if (!isAuthenticated) {
        console.log('[ConfigService] Utilisateur non authentifié - pas de modification de priorité:', provider);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => configService.setProviderPriority(provider, priority),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    setProviderStatus: (provider: string, status: string): Promise<ConfigServiceResponse<void>> => {
      if (!isAuthenticated) {
        console.log('[ConfigService] Utilisateur non authentifié - pas de modification de statut:', provider);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => configService.setProviderStatus(provider, status),
        { success: false, error: 'Backend déconnecté' }
      );
    }
  };
};

export type { AIProvider, ConfigServiceResponse };
