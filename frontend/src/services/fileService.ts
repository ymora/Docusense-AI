import { unifiedApiService } from './unifiedApiService';

export interface FileServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface DirectoryData {
  directory: string;
  files: any[];
  directories: any[];
}

// Service de base pour les fichiers
export const fileService = {
  async getDrives(): Promise<FileServiceResponse> {
    try {
      const response = await unifiedApiService.get('/api/files/drives') as any;
      // L'API retourne { drives: ["C:", "D:", ...] }, on extrait le tableau
      const drives = response?.drives || [];
      return { success: true, data: drives };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async listDirectory(directory: string): Promise<FileServiceResponse> {
    try {
      const data = await unifiedApiService.get(`/api/files/list/${encodeURIComponent(directory)}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async analyzeDirectory(directory: string): Promise<FileServiceResponse> {
    try {
      const data = await unifiedApiService.post('/api/files/analyze-directory', { directory });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async getDirectoryFiles(directory: string): Promise<FileServiceResponse> {
    try {
      const data = await unifiedApiService.get(`/api/files/directory-files/${encodeURIComponent(directory)}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async streamByPath(path: string): Promise<FileServiceResponse> {
    try {
      const data = await unifiedApiService.get(`/api/files/stream-by-path/${encodeURIComponent(path)}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async downloadFile(id: string | number): Promise<FileServiceResponse> {
    try {
      const data = await unifiedApiService.get(`/api/files/download/${id}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
};
