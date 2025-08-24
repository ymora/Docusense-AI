export interface DownloadOptions {
  filename?: string;
  addTimestamp?: boolean;
  openInNewTab?: boolean;
}

// Importer l'interface unifiée depuis fileUtils
import { FileInfo } from '../utils/fileUtils';

export const downloadFile = (file: FileInfo, options: DownloadOptions = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const link = document.createElement('a');
      const encodedPath = encodeURIComponent(file.path);
      
      // Construire l'URL de téléchargement
      let downloadUrl = `/api/files/download-by-path/${encodedPath}`;
      
      // Ajouter un timestamp si demandé
      if (options.addTimestamp !== false) {
        downloadUrl += `?t=${Date.now()}`;
      }
      
      link.href = downloadUrl;
      link.download = options.filename || file.name;
      
      // Configuration des attributs
      if (options.openInNewTab !== false) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      resolve();
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      reject(error);
    }
  });
};

export const downloadMultipleFiles = async (files: FileInfo[], options: DownloadOptions = {}): Promise<void> => {
  try {
    // Si un seul fichier, utiliser le téléchargement simple
    if (files.length === 1) {
      return await downloadFile(files[0], options);
    }
    
    // Pour plusieurs fichiers, créer un ZIP
    const filePaths = files.map(f => f.path);
    const encodedPaths = filePaths.map(path => encodeURIComponent(path));
    
    const link = document.createElement('a');
    const downloadUrl = `/api/download/multiple?files=${encodedPaths.join(',')}`;
    
    link.href = downloadUrl;
    link.download = options.filename || 'files.zip';
    
    if (options.openInNewTab !== false) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    // OPTIMISATION: Suppression des console.error pour éviter la surcharge
    throw error;
  }
};

export const downloadDirectory = (directoryPath: string, options: DownloadOptions = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const link = document.createElement('a');
      const encodedPath = encodeURIComponent(directoryPath);
      
      let downloadUrl = `/api/download/directory/${encodedPath}`;
      
      if (options.addTimestamp !== false) {
        downloadUrl += `?t=${Date.now()}`;
      }
      
      link.href = downloadUrl;
      link.download = options.filename || `${directoryPath.split('/').pop()}.zip`;
      
      if (options.openInNewTab !== false) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      resolve();
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      reject(error);
    }
  });
};

export const streamFile = async (file: FileInfo): Promise<Response> => {
  const encodedPath = encodeURIComponent(file.path);
  const response = await fetch(`/api/files/stream-by-path/${encodedPath}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response;
};

export const getFileContent = async (file: FileInfo): Promise<string> => {
  const response = await streamFile(file);
  return await response.text();
};

export const getFileBlob = async (file: FileInfo): Promise<Blob> => {
  const response = await streamFile(file);
  return await response.blob();
}; 