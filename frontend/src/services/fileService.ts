import { useBackendConnection } from '../hooks/useBackendConnection';
import { logService } from './logService';

// Service de base pour les fichiers
const baseFileService = {
  async getDrives() {
    const response = await fetch('/api/files/drives');
    const data = await response.json();
    return data.drives || [];
  },

  async listDirectory(directory: string) {
    const encodedDirectory = encodeURIComponent(directory);
    const response = await fetch(`/api/files/list/${encodedDirectory}`);
    return await response.json();
  },

  async analyzeDirectory(directoryPath: string) {
    const response = await fetch(`/api/files/analyze-directory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directory_path: directoryPath })
    });
    return await response.json();
  },

  async analyzeDirectorySupported(directoryPath: string) {
    const response = await fetch(`/api/files/analyze-directory-supported`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directory_path: directoryPath })
    });
    return await response.json();
  },

  async getDirectoryFiles(directoryPath: string) {
    const response = await fetch(`/api/files/directory-files/${encodeURIComponent(directoryPath)}`);
    return await response.json();
  },

  async streamByPath(path: string) {
    const encodedPath = encodeURIComponent(path);
    const response = await fetch(`/api/files/stream-by-path/${encodedPath}`);
    return response;
  },

  async downloadFile(downloadUrl: string) {
    const response = await fetch(downloadUrl);
    return response;
  }
};

// Hook pour utiliser le service avec guards de connexion
export const useFileService = () => {
  const { conditionalRequest } = useBackendConnection();

  return {
    getDrives: () => conditionalRequest(
      () => baseFileService.getDrives(),
      [] // Fallback: liste vide
    ),

    listDirectory: (directory: string) => conditionalRequest(
      () => baseFileService.listDirectory(directory),
      { files: [], directories: [], error: 'Backend déconnecté' }
    ),

    analyzeDirectory: (directoryPath: string) => conditionalRequest(
      () => baseFileService.analyzeDirectory(directoryPath),
      { success: false, error: 'Backend déconnecté' }
    ),

    analyzeDirectorySupported: (directoryPath: string) => conditionalRequest(
      () => baseFileService.analyzeDirectorySupported(directoryPath),
      { success: false, error: 'Backend déconnecté' }
    ),

    getDirectoryFiles: (directoryPath: string) => conditionalRequest(
      () => baseFileService.getDirectoryFiles(directoryPath),
      { files: [], error: 'Backend déconnecté' }
    ),

    streamByPath: (path: string) => conditionalRequest(
      () => baseFileService.streamByPath(path),
      null
    ),

    downloadFile: (downloadUrl: string) => conditionalRequest(
      () => baseFileService.downloadFile(downloadUrl),
      null
    )
  };
};

// Export du service de base pour compatibilité
export const fileService = baseFileService;
