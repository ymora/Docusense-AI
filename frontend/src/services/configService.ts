const API_BASE_URL = 'http://localhost:8000/api';

export interface ConfigService {
  testApiKey(provider: string, apiKey?: string): Promise<{ valid: boolean; message: string }>;
  saveApiKey(provider: string, apiKey: string): Promise<void>;
  getAiProviders(): Promise<any[]>;
  getAiPriorities(): Promise<any[]>;
  setAiPriority(provider: string, priority: number): Promise<void>;
  getAiStrategy(): Promise<string>;
  setAiStrategy(strategy: string): Promise<void>;
  getAIProviders(): Promise<any>;
  getAIStrategy(): Promise<any>;
  getAIPriority(): Promise<any>;
  saveAIProviderKey(provider: string, key: string): Promise<void>;
  getAIProviderKey(provider: string): Promise<any>;
  testAIProvider(provider: string): Promise<any>;
  saveAIStrategy(strategy: string): Promise<void>;
  saveAIPriority(provider: string, priority: number): Promise<void>;
  saveAIModel(provider: string, model: string): Promise<void>;
  resetAIPriorities(): Promise<void>;
}

class ConfigServiceImpl implements ConfigService {
  async testApiKey(provider: string, apiKey?: string): Promise<{ valid: boolean; message: string }> {
    try {
      const url = new URL(`${API_BASE_URL}/config/ai/test`);
      url.searchParams.append('provider', provider);

      const body: any = {};
      if (apiKey) {
        body.api_key = apiKey;
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        valid: data.valid,
        message: data.message,
      };
    } catch (error) {
      console.error('Error testing API key:', error);
      return {
        valid: false,
        message: `Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      };
    }
  }

  async saveApiKey(provider: string, apiKey: string): Promise<void> {
    try {
      const url = new URL(`${API_BASE_URL}/config/ai/key`);
      url.searchParams.append('provider', provider);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: apiKey }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  }

  async getAiProviders(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/providers`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.providers || [];
    } catch (error) {
      console.error('Error getting AI providers:', error);
      return [];
    }
  }

  async getAiPriorities(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/priority`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting AI priorities:', error);
      return [];
    }
  }

  async setAiPriority(provider: string, priority: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/priority?provider=${provider}&priority=${priority}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error setting AI priority:', error);
      throw error;
    }
  }

  async getAiStrategy(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/strategy`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.strategy || 'priority';
    } catch (error) {
      console.error('Error getting AI strategy:', error);
      return 'priority';
    }
  }

  async setAiStrategy(strategy: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/strategy?strategy=${strategy}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error setting AI strategy:', error);
      throw error;
    }
  }

  // Nouvelles méthodes pour la configuration complète
  async getAIProviders(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/providers`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting AI providers:', error);
      return { providers: [] };
    }
  }

  async getAIStrategy(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/strategy`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting AI strategy:', error);
      return { strategy: 'cost' };
    }
  }

  async getAIPriority(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/priority`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting AI priority:', error);
      return { priority: {} };
    }
  }

  async saveAIProviderKey(provider: string, key: string): Promise<void> {
    try {
      const url = new URL(`${API_BASE_URL}/config/ai/key`);
      url.searchParams.append('provider', provider);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: key }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving AI provider key:', error);
      throw error;
    }
  }

  async getAIProviderKey(provider: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/key/${provider}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting AI provider key:', error);
      throw error;
    }
  }

  async testAIProvider(provider: string): Promise<any> {
    try {
      const url = new URL(`${API_BASE_URL}/config/ai/test`);
      url.searchParams.append('provider', provider);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error testing AI provider:', error);
      return { success: false, message: 'Erreur de test' };
    }
  }

  async saveAIStrategy(strategy: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/strategy?strategy=${strategy}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving AI strategy:', error);
      throw error;
    }
  }

  async saveAIPriority(provider: string, priority: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/priority?provider=${provider}&priority=${priority}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving AI priority:', error);
      throw error;
    }
  }

  async saveAIModel(provider: string, model: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/model?provider=${provider}&model=${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving AI model:', error);
      throw error;
    }
  }

  async saveAIProviderModel(provider: string, model: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/model?provider=${provider}&model=${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving AI provider model:', error);
      throw error;
    }
  }

  async getAIMetrics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/metrics`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting AI metrics:', error);
      return { metrics: {} };
    }
  }

  async resetAIPriorities(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/ai/priority/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to reset priorities');
      }
    } catch (error) {
      console.error('Error resetting AI priorities:', error);
      throw error;
    }
  }
}

export const configService = new ConfigServiceImpl();