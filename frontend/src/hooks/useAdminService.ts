import { useBackendConnection } from './useBackendConnection';
import { adminService, User, SystemInfo, HealthData, PerformanceMetrics } from '../services/adminService';
import useAuthStore from '../stores/authStore';

// Hook pour utiliser le service d'administration avec guards de connexion
export const useAdminService = () => {
  const { conditionalRequest } = useBackendConnection();
  const { isAuthenticated, isAdmin } = useAuthStore();
  
  return {
    getUsers: () => {
      if (!isAuthenticated || !isAdmin()) {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        return Promise.resolve([]);
      }
      return conditionalRequest(
        () => adminService.getUsers(),
        []
      );
    },
    
    createUser: (userData: { username: string; email: string; password: string; role?: string }) => {
      if (!isAuthenticated || !isAdmin()) {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.createUser(userData),
        null
      );
    },
    
    updateUser: (id: number, userData: Partial<User>) => {
      if (!isAuthenticated || !isAdmin()) {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.updateUser(id, userData),
        null
      );
    },
    
    deleteUser: (id: number) => {
      if (!isAuthenticated || !isAdmin()) {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.deleteUser(id),
        null
      );
    },
    
    getDetailedHealth: () => {
      if (!isAuthenticated || !isAdmin()) {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.getDetailedHealth(),
        null
      );
    },
    
    getPerformanceMetrics: () => {
      if (!isAuthenticated || !isAdmin()) {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.getPerformanceMetrics(),
        null
      );
    },
    
    getSystemInfo: () => {
      if (!isAuthenticated || !isAdmin()) {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.getSystemInfo(),
        null
      );
    },
    
    getBackendLogs: () => {
      if (!isAuthenticated || !isAdmin()) {
        // OPTIMISATION: Suppression des console.log pour éviter la surcharge
        return Promise.resolve([]);
      }
      return conditionalRequest(
        () => adminService.getBackendLogs(),
        []
      );
    }
  };
};

export type { User, SystemInfo, HealthData, PerformanceMetrics };
