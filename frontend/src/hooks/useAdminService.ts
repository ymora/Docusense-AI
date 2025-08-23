import { useBackendConnection } from './useBackendConnection';
import { adminService, User, SystemInfo, AdminServiceResponse } from '../services/adminService';
import { useUnifiedAuth } from './useUnifiedAuth';

// Hook pour utiliser le service d'administration avec guards de connexion
export const useAdminService = () => {
  const { conditionalRequest } = useBackendConnection();
  const { isAuthenticated, isAdmin } = useUnifiedAuth();
  
  return {
    getUsersList: (): Promise<AdminServiceResponse<User[]>> => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de chargement des utilisateurs');
        return Promise.resolve({ success: false, data: [], error: 'Accès non autorisé' });
      }
      return conditionalRequest(
        () => adminService.getUsersList(),
        { success: false, data: [], error: 'Backend déconnecté' }
      );
    },
    
    createUser: (userData: { username: string; email: string; password: string; role?: string }): Promise<AdminServiceResponse<User>> => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de création d\'utilisateur');
        return Promise.resolve({ success: false, error: 'Accès non autorisé' });
      }
      return conditionalRequest(
        () => adminService.createUser(userData),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    updateUser: (id: number, userData: Partial<User>): Promise<AdminServiceResponse<User>> => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de modification d\'utilisateur:', id);
        return Promise.resolve({ success: false, error: 'Accès non autorisé' });
      }
      return conditionalRequest(
        () => adminService.updateUser(id, userData),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    deleteUser: (id: number): Promise<AdminServiceResponse<void>> => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de suppression d\'utilisateur:', id);
        return Promise.resolve({ success: false, error: 'Accès non autorisé' });
      }
      return conditionalRequest(
        () => adminService.deleteUser(id),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    activateUser: (id: number): Promise<AdminServiceResponse<void>> => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas d\'activation d\'utilisateur:', id);
        return Promise.resolve({ success: false, error: 'Accès non autorisé' });
      }
      return conditionalRequest(
        () => adminService.activateUser(id),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    deactivateUser: (id: number): Promise<AdminServiceResponse<void>> => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de désactivation d\'utilisateur:', id);
        return Promise.resolve({ success: false, error: 'Accès non autorisé' });
      }
      return conditionalRequest(
        () => adminService.deactivateUser(id),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    getSystemInfo: (): Promise<AdminServiceResponse<SystemInfo>> => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de récupération d\'infos système');
        return Promise.resolve({ success: false, error: 'Accès non autorisé' });
      }
      return conditionalRequest(
        () => adminService.getSystemInfo(),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    getDatabaseStatus: (): Promise<AdminServiceResponse<string>> => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de récupération du statut DB');
        return Promise.resolve({ success: false, data: 'error: Accès non autorisé', error: 'Accès non autorisé' });
      }
      return conditionalRequest(
        () => adminService.getDatabaseStatus(),
        { success: false, data: 'error: Backend déconnecté', error: 'Backend déconnecté' }
      );
    },
    
    getBackendLogs: (): Promise<AdminServiceResponse<string[]>> => {
      if (!isAuthenticated || !isAdmin()) {
        console.log('[AdminService] Utilisateur non authentifié ou non admin - pas de récupération des logs');
        return Promise.resolve({ success: false, data: [], error: 'Accès non autorisé' });
      }
      return conditionalRequest(
        () => adminService.getBackendLogs(),
        { success: false, data: [], error: 'Backend déconnecté' }
      );
    }
  };
};

export type { User, SystemInfo, AdminServiceResponse };
