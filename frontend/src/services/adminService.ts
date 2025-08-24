import { apiRequest, handleApiError } from '../utils/apiUtils';
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
        const response = await apiRequest('/api/admin/users', {}, DEFAULT_TIMEOUT);
        
        logService.info('Liste des utilisateurs récupérée', 'AdminService', {
          count: response.length || 0,
          timestamp: new Date().toISOString()
        });
        
        return response;
      },
      2 * 60 * 1000 // Cache pendant 2 minutes
    );
  },

  async createUser(userData: { username: string; email: string; password: string; role?: string }): Promise<User> {
    try {
      const response = await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      }, DEFAULT_TIMEOUT);
      
      logService.info('Utilisateur créé', 'AdminService', {
        username: userData.username,
        role: userData.role || 'user',
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      logService.error('Erreur lors de la création d\'utilisateur', 'AdminService', {
        error: handleApiError(error),
        username: userData.username,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la création d'utilisateur: ${handleApiError(error)}`);
    }
  },

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const response = await apiRequest(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      }, DEFAULT_TIMEOUT);
      
      logService.info('Utilisateur mis à jour', 'AdminService', {
        userId: id,
        updatedFields: Object.keys(userData),
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      logService.error('Erreur lors de la mise à jour d\'utilisateur', 'AdminService', {
        error: handleApiError(error),
        userId: id,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la mise à jour d'utilisateur: ${handleApiError(error)}`);
    }
  },

  async deleteUser(id: number): Promise<void> {
    try {
      await apiRequest(`/api/admin/users/${id}`, {
        method: 'DELETE'
      }, DEFAULT_TIMEOUT);
      
      logService.info('Utilisateur supprimé', 'AdminService', {
        userId: id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logService.error('Erreur lors de la suppression d\'utilisateur', 'AdminService', {
        error: handleApiError(error),
        userId: id,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la suppression d'utilisateur: ${handleApiError(error)}`);
    }
  },

  // Métriques système
  async getDetailedHealth(): Promise<HealthData> {
    try {
      const response = await apiRequest('/api/admin/system/health', {}, DEFAULT_TIMEOUT);
      
      logService.info('Données de santé système récupérées', 'AdminService', {
        status: response.status,
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      logService.error('Erreur lors de la récupération des données de santé', 'AdminService', {
        error: handleApiError(error),
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des données de santé: ${handleApiError(error)}`);
    }
  },

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await apiRequest('/api/admin/system/performance', {}, DEFAULT_TIMEOUT);
      
      logService.info('Métriques de performance récupérées', 'AdminService', {
        status: response.status,
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      logService.error('Erreur lors de la récupération des métriques de performance', 'AdminService', {
        error: handleApiError(error),
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des métriques de performance: ${handleApiError(error)}`);
    }
  },

  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const response = await apiRequest('/api/admin/system/info', {}, DEFAULT_TIMEOUT);
      
      logService.info('Informations système récupérées', 'AdminService', {
        app_name: response.app_name,
        version: response.version,
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      logService.error('Erreur lors de la récupération des informations système', 'AdminService', {
        error: handleApiError(error),
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des informations système: ${handleApiError(error)}`);
    }
  },

  async getBackendLogs(): Promise<string[]> {
    try {
      const response = await apiRequest('/api/admin/system/logs', {}, DEFAULT_TIMEOUT);
      
      logService.info('Logs backend récupérés', 'AdminService', {
        count: response.length || 0,
        timestamp: new Date().toISOString()
      });
      
      return response;
    } catch (error) {
      logService.error('Erreur lors de la récupération des logs backend', 'AdminService', {
        error: handleApiError(error),
        timestamp: new Date().toISOString()
      });
      throw new Error(`Erreur lors de la récupération des logs backend: ${handleApiError(error)}`);
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
