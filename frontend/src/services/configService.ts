import { unifiedApiService } from './unifiedApiService';

export interface AIProvider {
  name: string;
  priority: number;
  api_key: string;
  models: string[];
  is_active: boolean;
  is_functional: boolean;
  is_configured: boolean;
  status: string;
}

export interface ConfigServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Service de base pour la configuration
export const configService = {
  async getAIProviders(): Promise<ConfigServiceResponse<AIProvider[]>> {
    return await unifiedApiService.get('/api/config/ai/providers');
  },

  async getApiKey(provider: string): Promise<ConfigServiceResponse<string>> {
    return await unifiedApiService.get(`/api/config/ai/providers/${encodeURIComponent(provider)}/key`);
  },

  async saveAPIKey(provider: string, key: string): Promise<ConfigServiceResponse<void>> {
    return await unifiedApiService.post('/api/config/ai/providers', {
      provider,
      api_key: key
    });
  },

  async testProvider(provider: string): Promise<ConfigServiceResponse<any>> {
    return await unifiedApiService.post('/api/config/ai/test', { provider });
  },

  async setProviderPriority(provider: string, priority: number): Promise<ConfigServiceResponse<void>> {
    return await unifiedApiService.put('/api/config/ai/providers', {
      provider,
      priority
    });
  },

  async setProviderStatus(provider: string, status: string): Promise<ConfigServiceResponse<void>> {
    return await unifiedApiService.post(`/api/config/ai/providers/status?provider=${encodeURIComponent(provider)}&status=${encodeURIComponent(status)}`);
  }
};
