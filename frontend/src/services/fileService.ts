import { useBackendConnection } from '../hooks/useBackendConnection';
import { logService } from './logService';
import { globalCache } from '../utils/cacheUtils';
import { useUnifiedApiService } from './unifiedApiService';

// Service de base pour les fichiers (utilise le service unifié)
const baseFileService = {
  async getDrives() {
    const apiService = new (await import('./unifiedApiService')).default();
    return await apiService.get('/files/drives', true, 'drives');
  },

  async listDirectory(directory: string) {
    const apiService = new (await import('./unifiedApiService')).default();
    const encodedDirectory = encodeURIComponent(directory);
    return await apiService.get(`/files/list/${encodedDirectory}`, true, `directory_${directory}`);
  },

  async analyzeDirectory(directoryPath: string) {
    const apiService = new (await import('./unifiedApiService')).default();
    return await apiService.post('/files/analyze-directory', { directory_path: directoryPath });
  },

  async analyzeDirectorySupported(directoryPath: string) {
    const apiService = new (await import('./unifiedApiService')).default();
    return await apiService.post('/files/analyze-directory-supported', { directory_path: directoryPath });
  },

  async getDirectoryFiles(directoryPath: string) {
    const apiService = new (await import('./unifiedApiService')).default();
    const encodedPath = encodeURIComponent(directoryPath);
    return await apiService.get(`/files/directory-files/${encodedPath}`, true, `directory_files_${directoryPath}`);
  },

  async streamByPath(path: string) {
    const apiService = new (await import('./unifiedApiService')).default();
    return await apiService.streamFile(path);
  },

  async downloadFile(downloadUrl: string) {
    const apiService = new (await import('./unifiedApiService')).default();
    return await apiService.downloadFile(downloadUrl);
  }
};

// Hook pour utiliser le service avec cache (utilise le service unifié)
export const useFileService = () => {
  const { isOnline } = useBackendConnection();
  const { get, post, downloadFile, streamFile } = useUnifiedApiService();

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
          const drives = await get('/files/drives', true, 'drives');
          return drives.drives || drives || [];
        } else {
          return getCachedData('drives') || [];
        }
      } catch (error) {
        logService.warning('Erreur lors du chargement des disques, utilisation du cache', 'FileService', { error });
        return getCachedData('drives') || [];
      }
    },

    // Méthode pour vérifier l'accessibilité d'un disque
    checkDiskAccess: async (disk: string) => {
      try {
        if (isOnline) {
          const encodedDisk = encodeURIComponent(disk);
          const response = await fetch(`/api/files/check-access/${encodedDisk}`);
          const data = await response.json();
          return data.success ? 'online' : 'error';
        } else {
          return 'offline';
        }
      } catch (error) {
        return 'error';
      }
    },

    listDirectory: async (directory: string) => {
      try {
        if (isOnline) {
          const data = await get(`/files/list/${encodeURIComponent(directory)}`, true, `directory_${directory}`);
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
