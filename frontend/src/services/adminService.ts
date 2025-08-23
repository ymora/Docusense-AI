import { unifiedApiService } from './unifiedApiService';

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

export interface AdminServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Service de base pour l'administration
export const adminService = {
  async getUsersList(): Promise<AdminServiceResponse<User[]>> {
    return await unifiedApiService.get('/api/admin/users');
  },

  async createUser(userData: { username: string; email: string; password: string; role?: string }): Promise<AdminServiceResponse<User>> {
    return await unifiedApiService.post('/api/admin/users', userData);
  },

  async updateUser(id: number, userData: Partial<User>): Promise<AdminServiceResponse<User>> {
    return await unifiedApiService.put(`/api/admin/users/${id}`, userData);
  },

  async deleteUser(id: number): Promise<AdminServiceResponse<void>> {
    return await unifiedApiService.delete(`/api/admin/users/${id}`);
  },

  async activateUser(id: number): Promise<AdminServiceResponse<void>> {
    return await unifiedApiService.post(`/api/admin/users/${id}/activate`);
  },

  async deactivateUser(id: number): Promise<AdminServiceResponse<void>> {
    return await unifiedApiService.post(`/api/admin/users/${id}/deactivate`);
  },

  async getSystemInfo(): Promise<AdminServiceResponse<SystemInfo>> {
    return await unifiedApiService.get('/api/admin/system/info');
  },

  async getDatabaseStatus(): Promise<AdminServiceResponse<string>> {
    return await unifiedApiService.get('/api/admin/system/database-status');
  },

  async getBackendLogs(): Promise<AdminServiceResponse<string[]>> {
    return await unifiedApiService.get('/api/admin/system/logs');
  }
};
