import { useBackendConnection } from './useBackendConnection';
import { fileService, FileServiceResponse, DirectoryData } from '../services/fileService';
import { useMemo } from 'react';
import { useUnifiedAuth } from './useUnifiedAuth';

// Hook pour utiliser le service de fichiers avec guards de connexion
export const useFileService = () => {
  const { conditionalRequest } = useBackendConnection();
  const { isAuthenticated } = useUnifiedAuth();
  
  // Utiliser useMemo pour stabiliser l'objet retourné
  return useMemo(() => ({
    getDrives: () => {
      if (!isAuthenticated) {
        console.log('[FileService] Utilisateur non authentifié - pas de chargement des disques');
        return Promise.resolve({ success: false, data: [], error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => fileService.getDrives(),
        { success: false, data: [], error: 'Backend déconnecté' }
      );
    },
    
    listDirectory: (directory: string) => {
      if (!isAuthenticated) {
        console.log('[FileService] Utilisateur non authentifié - pas de chargement du répertoire:', directory);
        return Promise.resolve({ 
          success: false, 
          data: { directory, files: [], directories: [], error: 'Utilisateur non authentifié' },
          error: 'Utilisateur non authentifié'
        });
      }
      return conditionalRequest(
        () => fileService.listDirectory(directory),
        { 
          success: false, 
          data: { directory, files: [], directories: [], error: 'Backend déconnecté' },
          error: 'Backend déconnecté'
        }
      );
    },
    
    analyzeDirectory: (directory: string) => {
      if (!isAuthenticated) {
        console.log('[FileService] Utilisateur non authentifié - pas d\'analyse du répertoire:', directory);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => fileService.analyzeDirectory(directory),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    getDirectoryFiles: (directory: string) => {
      if (!isAuthenticated) {
        console.log('[FileService] Utilisateur non authentifié - pas de chargement des fichiers du répertoire:', directory);
        return Promise.resolve({ success: false, data: [], error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => fileService.getDirectoryFiles(directory),
        { success: false, data: [], error: 'Backend déconnecté' }
      );
    },
    
    streamByPath: (path: string) => {
      if (!isAuthenticated) {
        console.log('[FileService] Utilisateur non authentifié - pas de streaming du fichier:', path);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => fileService.streamByPath(path),
        { success: false, error: 'Backend déconnecté' }
      );
    },
    
    downloadFile: (id: string | number) => {
      if (!isAuthenticated) {
        console.log('[FileService] Utilisateur non authentifié - pas de téléchargement du fichier:', id);
        return Promise.resolve({ success: false, error: 'Utilisateur non authentifié' });
      }
      return conditionalRequest(
        () => fileService.downloadFile(id),
        { success: false, error: 'Backend déconnecté' }
      );
    }
  }), [conditionalRequest, isAuthenticated]);
};

export type { FileServiceResponse, DirectoryData };
