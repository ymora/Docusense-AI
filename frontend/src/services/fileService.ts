import { apiRequest, handleApiError } from '../utils/apiUtils';
import { File } from '../stores/fileStore';

export interface FileListResponse {
  files: File[];
  total: number;
  limit: number;
  offset: number;
}

export const fileService = {
  // Récupérer un fichier par ID (depuis la liste du répertoire)
  async getFileById(fileId: number): Promise<File> {
    try {
      // Utiliser directement la liste du répertoire
      const currentDir = "C:/Users/ymora/Desktop/Docusense AI";
      const response = await apiRequest(`/api/files/list/${encodeURIComponent(currentDir)}`, {
        method: 'GET'
      });
      
      const files = response.files || [];
      const file = files.find((f: any) => f.id === fileId);
      
      if (!file) {
        throw new Error(`Fichier avec l'ID ${fileId} non trouvé`);
      }
      
      return file;
    } catch (error) {
      console.error(`Erreur lors de la récupération du fichier ${fileId}:`, error);
      throw new Error(`Impossible de récupérer le fichier: ${handleApiError(error)}`);
    }
  },

  // Récupérer la liste des fichiers avec filtres
  async getFiles(params: {
    directory?: string;
    status?: string;
    selected_only?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<FileListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.directory) queryParams.append('directory', params.directory);
      if (params.status) queryParams.append('status', params.status);
      if (params.selected_only) queryParams.append('selected_only', 'true');
      if (params.search) queryParams.append('search', params.search);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
      
      const url = `/api/files/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiRequest(url, {
        method: 'GET'
      });
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      throw new Error(`Impossible de récupérer les fichiers: ${handleApiError(error)}`);
    }
  },

  // Rechercher un fichier par chemin
  async searchFileByPath(filePath: string): Promise<File | null> {
    try {
      const response = await this.getFiles({ search: filePath, limit: 1 });
      return response.files.length > 0 ? response.files[0] : null;
    } catch (error) {
      console.error('Erreur lors de la recherche du fichier par chemin:', error);
      return null;
    }
  },

  // Récupérer tous les fichiers (pour la recherche par index)
  async getAllFiles(): Promise<File[]> {
    try {
      // Utiliser la liste du répertoire au lieu de la base de données
      const currentDir = "C:/Users/ymora/Desktop/Docusense AI";
      const response = await apiRequest(`/api/files/list/${encodeURIComponent(currentDir)}`, {
        method: 'GET'
      });
      
      return response.files || [];
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les fichiers:', error);
      return [];
    }
  }
};
