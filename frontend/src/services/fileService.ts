import { useBackendConnection } from '../hooks/useBackendConnection';
import { logService } from './logService';
import { globalCache } from '../utils/cacheUtils';
import unifiedApiService from './unifiedApiService';

// Service de base pour les fichiers (utilise uniquement le service unifié)
const baseFileService = {
  async getDrives() {
    return await unifiedApiService.get('/api/files/drives', true, 'drives');
  },

  async listDirectory(directory: string) {
    const encodedDirectory = encodeURIComponent(directory);
    return await unifiedApiService.get(`/api/files/list/${encodedDirectory}`, true, `directory_${directory}`);
  },

  async analyzeDirectory(directoryPath: string) {
    return await unifiedApiService.post('/api/files/analyze-directory', { directory_path: directoryPath });
  },

  async analyzeDirectorySupported(directoryPath: string) {
    return await unifiedApiService.post('/api/files/analyze-directory-supported', { directory_path: directoryPath });
  },

  async getDirectoryFiles(directoryPath: string) {
    const encodedPath = encodeURIComponent(directoryPath);
    return await unifiedApiService.get(`/api/files/directory-files/${encodedPath}`, true, `directory_files_${directoryPath}`);
  },

  async streamByPath(path: string) {
    return await unifiedApiService.streamFile(path);
  },

  async downloadFile(downloadUrl: string) {
    return await unifiedApiService.downloadFile(downloadUrl);
  }
};

// Hook pour utiliser le service avec cache (utilise le service unifié)
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
          const response = await unifiedApiService.get('/api/files/drives', true, 'drives');
          return response.data?.drives || response.data || [];
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
          const response = await unifiedApiService.get(`/api/files/check-access/${encodedDisk}`);
          return {
            success: response.data?.success || false,
            status: response.data?.status || 'error',
            error: response.data?.error || null
          };
        } else {
          return {
            success: false,
            status: 'offline',
            error: 'Pas de connexion au serveur'
          };
        }
      } catch (error) {
        return {
          success: false,
          status: 'error',
          error: error.message || 'Erreur inconnue'
        };
      }
    },

    listDirectory: async (directory: string) => {
      try {
        if (isOnline) {
          const response = await unifiedApiService.get(`/api/files/list/${encodeURIComponent(directory)}`, true, `directory_${directory}`);
          return response.data;
        } else {
          return getCachedData(`directory_${directory}`) || { files: [], directories: [], error: 'Données en cache' };
        }
      } catch (error) {
        logService.warning('Erreur lors du chargement du répertoire, utilisation du cache', 'FileService', { error, directory });
        return getCachedData(`directory_${directory}`) || { files: [], directories: [], error: 'Erreur de chargement' };
      }
    },

    analyzeDirectory: async (directoryPath: string) => {
      try {
        if (isOnline) {
          const response = await unifiedApiService.post('/api/files/analyze-directory', { directory_path: directoryPath });
          return response.data;
        } else {
          return { success: false, error: 'Backend déconnecté' };
        }
      } catch (error) {
        logService.error('Erreur lors de l\'analyse du répertoire', 'FileService', { error, directoryPath });
        throw error;
      }
    },

    analyzeDirectorySupported: async (directoryPath: string) => {
      try {
        if (isOnline) {
          const response = await unifiedApiService.post('/api/files/analyze-directory-supported', { directory_path: directoryPath });
          return response.data;
        } else {
          return { success: false, error: 'Backend déconnecté' };
        }
      } catch (error) {
        logService.error('Erreur lors de l\'analyse du répertoire supporté', 'FileService', { error, directoryPath });
        throw error;
      }
    },

    getDirectoryFiles: async (directoryPath: string) => {
      try {
        if (isOnline) {
          const response = await unifiedApiService.get(`/api/files/directory-files/${encodeURIComponent(directoryPath)}`, true, `directory_files_${directoryPath}`);
          return response.data;
        } else {
          return getCachedData(`directory_files_${directoryPath}`) || [];
        }
      } catch (error) {
        logService.warning('Erreur lors du chargement des fichiers du répertoire, utilisation du cache', 'FileService', { error, directoryPath });
        return getCachedData(`directory_files_${directoryPath}`) || [];
      }
    },

    streamByPath: async (path: string) => {
      try {
        if (isOnline) {
          return await unifiedApiService.streamFile(path);
        } else {
          throw new Error('Backend déconnecté');
        }
      } catch (error) {
        logService.error('Erreur lors du streaming du fichier', 'FileService', { error, path });
        throw error;
      }
    },

    downloadFile: async (downloadUrl: string) => {
      try {
        if (isOnline) {
          return await unifiedApiService.downloadFile(downloadUrl);
        } else {
          throw new Error('Backend déconnecté');
        }
      } catch (error) {
        logService.error('Erreur lors du téléchargement du fichier', 'FileService', { error, downloadUrl });
        throw error;
      }
    }
  };
};

// Export du service de base pour compatibilité
export const fileService = baseFileService;
