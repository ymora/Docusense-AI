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
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de chargement des utilisateurs');
        return Promise.resolve([]);
      }
      return conditionalRequest(
        () => adminService.getUsers(),
        []
      );
    },
    
    createUser: (userData: { username: string; email: string; password: string; role?: string }) => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de création d\'utilisateur');
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.createUser(userData)
      );
    },
    
    updateUser: (id: number, userData: Partial<User>) => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de modification d\'utilisateur:', id);
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.updateUser(id, userData)
      );
    },
    
    deleteUser: (id: number) => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de suppression d\'utilisateur:', id);
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.deleteUser(id)
      );
    },
    
    getDetailedHealth: () => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de récupération d\'infos système');
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.getDetailedHealth()
      );
    },
    
    getPerformanceMetrics: () => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de récupération des métriques');
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.getPerformanceMetrics()
      );
    },
    
    getSystemInfo: () => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de récupération d\'infos système');
        return Promise.reject(new Error('Accès non autorisé'));
      }
      return conditionalRequest(
        () => adminService.getSystemInfo()
      );
    },
    
    getBackendLogs: () => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de récupération des logs');
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
