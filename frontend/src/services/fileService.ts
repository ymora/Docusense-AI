import { useBackendConnection } from '../hooks/useBackendConnection';
import { logService } from './logService';
import { globalCache } from '../utils/cacheUtils';

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

// Hook pour utiliser le service avec cache (fonctionne pour tous les utilisateurs)
export const useFileService = () => {
  const { isOnline } = useBackendConnection();

  // Fonction pour récupérer les données du cache
  const getCachedData = (key: string) => {
    return globalCache.get(key);
  };

  // Fonction pour sauvegarder les données en cache
  const saveToCache = (key: string, data: any) => {
    globalCache.set(key, data, 300000); // Cache pour 5 minutes
  };

  return {
    getDrives: async () => {
      try {
        if (isOnline) {
          const drives = await baseFileService.getDrives();
          saveToCache('drives', drives);
          return drives;
        } else {
          return getCachedData('drives') || [];
        }
      } catch (error) {
        logService.warning('Erreur lors du chargement des disques, utilisation du cache', 'FileService', { error });
        return getCachedData('drives') || [];
      }
    },

    listDirectory: async (directory: string) => {
      try {
        if (isOnline) {
          const data = await baseFileService.listDirectory(directory);
          saveToCache(`directory_${directory}`, data);
          return data;
        } else {
          return getCachedData(`directory_${directory}`) || { files: [], directories: [], error: 'Données en cache' };
        }
      } catch (error) {
        logService.warning('Erreur lors du chargement du répertoire, utilisation du cache', 'FileService', { error, directory });
        return getCachedData(`directory_${directory}`) || { files: [], directories: [], error: 'Données en cache' };
      }
    },

    analyzeDirectory: async (directoryPath: string) => {
      try {
        if (isOnline) {
          const data = await baseFileService.analyzeDirectory(directoryPath);
          saveToCache(`analyze_${directoryPath}`, data);
          return data;
        } else {
          return getCachedData(`analyze_${directoryPath}`) || { success: false, error: 'Données en cache' };
        }
      } catch (error) {
        logService.warning('Erreur lors de l\'analyse du répertoire, utilisation du cache', 'FileService', { error, directoryPath });
        return getCachedData(`analyze_${directoryPath}`) || { success: false, error: 'Données en cache' };
      }
    },

    analyzeDirectorySupported: async (directoryPath: string) => {
      try {
        if (isOnline) {
          const data = await baseFileService.analyzeDirectorySupported(directoryPath);
          saveToCache(`analyze_supported_${directoryPath}`, data);
          return data;
        } else {
          return getCachedData(`analyze_supported_${directoryPath}`) || { success: false, error: 'Données en cache' };
        }
      } catch (error) {
        logService.warning('Erreur lors de l\'analyse des formats supportés, utilisation du cache', 'FileService', { error, directoryPath });
        return getCachedData(`analyze_supported_${directoryPath}`) || { success: false, error: 'Données en cache' };
      }
    },

    getDirectoryFiles: async (directoryPath: string) => {
      try {
        if (isOnline) {
          const data = await baseFileService.getDirectoryFiles(directoryPath);
          saveToCache(`files_${directoryPath}`, data);
          return data;
        } else {
          return getCachedData(`files_${directoryPath}`) || { files: [], error: 'Données en cache' };
        }
      } catch (error) {
        logService.warning('Erreur lors du chargement des fichiers, utilisation du cache', 'FileService', { error, directoryPath });
        return getCachedData(`files_${directoryPath}`) || { files: [], error: 'Données en cache' };
      }
    },

    streamByPath: async (path: string) => {
      if (!isOnline) {
        logService.warning('Stream non disponible hors ligne', 'FileService', { path });
        return null;
      }
      try {
        return await baseFileService.streamByPath(path);
      } catch (error) {
        logService.error('Erreur lors du stream', 'FileService', { error, path });
        return null;
      }
    },

    downloadFile: async (downloadUrl: string) => {
      if (!isOnline) {
        logService.warning('Téléchargement non disponible hors ligne', 'FileService', { downloadUrl });
        return null;
      }
      try {
        return await baseFileService.downloadFile(downloadUrl);
      } catch (error) {
        logService.error('Erreur lors du téléchargement', 'FileService', { error, downloadUrl });
        return null;
      }
    }
  };
};

// Export du service de base pour compatibilité
export const fileService = baseFileService;
