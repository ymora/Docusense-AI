import unifiedApiService from './unifiedApiService';
import { logService } from './logService';
import { useBackendConnection } from '../hooks/useBackendConnection';
import { userCache, cachedRequest } from '../utils/cacheUtils';

const DEFAULT_TIMEOUT = 30000; // 30 secondes

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface SystemInfo {
  app_name: string;
  version: string;
  environment: string;
  database_status: string;
  backend_status: string;
}

export interface HealthData {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  database_status: string;
  backend_status: string;
  compression_enabled: boolean;
  rate_limit_enabled: boolean;
}

export interface PerformanceMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_usage_percent: number;
  uptime: number;
  process_count: number;
}

export interface AdminServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Service de base pour l'administration
const baseAdminService = {
  // Gestion des utilisateurs
  async getUsers(): Promise<User[]> {
    return cachedRequest(
      userCache,
      'admin-users',
      async () => {
        const response = await unifiedApiService.get('/api/admin/users');
        
        logService.info('Liste des utilisateurs récupérée', 'AdminService', {
          count: response.data?.length || 0,
          timestamp: new Date().toISOString()
        });
        
        return response.data || [];
      },
      2 * 60 * 1000 // Cache pendant 2 minutes
    );
  },

  async createUser(userData: { username: string; email: string; password: string; role?: string }): Promise<User> {
    try {
      const response = await unifiedApiService.post('/api/admin/users', userData);
      
      logService.info('Utilisateur créé', 'AdminService', {
        username: userData.username,
        role: userData.role || 'user',
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logService.error('Erreur lors de la création d\'utilisateur', 'AdminService', {
        error: errorMessage,
        username: userData.username,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la création d'utilisateur: ${errorMessage}`);
    }
  },

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const response = await unifiedApiService.put(`/api/admin/users/${id}`, userData);
      
      logService.info('Utilisateur mis à jour', 'AdminService', {
        userId: id,
        updatedFields: Object.keys(userData),
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logService.error('Erreur lors de la mise à jour d\'utilisateur', 'AdminService', {
        error: errorMessage,
        userId: id,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la mise à jour d'utilisateur: ${errorMessage}`);
    }
  },

  async deleteUser(id: number): Promise<void> {
    try {
      await unifiedApiService.delete(`/api/admin/users/${id}`);
      
      logService.info('Utilisateur supprimé', 'AdminService', {
        userId: id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logService.error('Erreur lors de la suppression d\'utilisateur', 'AdminService', {
        error: errorMessage,
        userId: id,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la suppression d'utilisateur: ${errorMessage}`);
    }
  },

  // Métriques système
  async getDetailedHealth(): Promise<HealthData> {
    try {
      const response = await unifiedApiService.get('/api/admin/system/health');
      
      logService.info('Données de santé système récupérées', 'AdminService', {
        status: response.data?.status,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logService.error('Erreur lors de la récupération des données de santé', 'AdminService', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des données de santé: ${errorMessage}`);
    }
  },

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await unifiedApiService.get('/api/admin/system/performance');
      
      logService.info('Métriques de performance récupérées', 'AdminService', {
        status: response.data?.status,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logService.error('Erreur lors de la récupération des métriques de performance', 'AdminService', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des métriques de performance: ${errorMessage}`);
    }
  },

  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const response = await unifiedApiService.get('/api/admin/system/info');
      
      logService.info('Informations système récupérées', 'AdminService', {
        app_name: response.data?.app_name,
        version: response.data?.version,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logService.error('Erreur lors de la récupération des informations système', 'AdminService', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des informations système: ${errorMessage}`);
    }
  },

  async getBackendLogs(): Promise<string[]> {
    try {
      const response = await unifiedApiService.get('/api/admin/system/logs');
      
      logService.info('Logs backend récupérés', 'AdminService', {
        count: response.data?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      return response.data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logService.error('Erreur lors de la récupération des logs backend', 'AdminService', {
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des logs backend: ${errorMessage}`);
    }
  }
};

// Hook pour utiliser le service avec vérification de connexion
export const useAdminService = () => {
  const { conditionalRequest } = useBackendConnection();

  return {
    getUsers: () => 
      conditionalRequest(() => baseAdminService.getUsers(), []),

    createUser: (userData: { username: string; email: string; password: string; role?: string }) => 
      conditionalRequest(() => baseAdminService.createUser(userData), null),

    updateUser: (id: number, userData: Partial<User>) => 
      conditionalRequest(() => baseAdminService.updateUser(id, userData), null),

    deleteUser: (id: number) => 
      conditionalRequest(() => baseAdminService.deleteUser(id), null),

    getDetailedHealth: () => 
      conditionalRequest(() => baseAdminService.getDetailedHealth(), null),

    getPerformanceMetrics: () => 
      conditionalRequest(() => baseAdminService.getPerformanceMetrics(), null),

    getSystemInfo: () => 
      conditionalRequest(() => baseAdminService.getSystemInfo(), null),

    getBackendLogs: () => 
      conditionalRequest(() => baseAdminService.getBackendLogs(), [])
  };
};

// Export du service de base pour compatibilité
export const adminService = baseAdminService;
