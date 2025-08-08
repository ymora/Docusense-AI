import { useState, useCallback } from 'react';
import { downloadFile, downloadMultipleFiles, downloadDirectory } from '../services/downloadService';

export interface FileOperationState {
  isDownloading: boolean;
  isProcessing: boolean;
  error: string | null;
  progress: number;
}

export interface FileOperationOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

export const useFileOperations = () => {
  const [state, setState] = useState<FileOperationState>({
    isDownloading: false,
    isProcessing: false,
    error: null,
    progress: 0
  });

  const resetState = useCallback(() => {
    setState({
      isDownloading: false,
      isProcessing: false,
      error: null,
      progress: 0
    });
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isDownloading: false,
      isProcessing: false
    }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress
    }));
  }, []);

  const downloadSingleFile = useCallback(async (
    file: any, 
    options: FileOperationOptions = {}
  ) => {
    try {
      setState(prev => ({
        ...prev,
        isDownloading: true,
        error: null,
        progress: 0
      }));

      setProgress(25);
      await downloadFile(file);
      setProgress(100);

      options.onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement';
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setState(prev => ({
        ...prev,
        isDownloading: false
      }));
    }
  }, [setError, setProgress]);

  const downloadMultipleFilesOperation = useCallback(async (
    files: any[], 
    options: FileOperationOptions = {}
  ) => {
    try {
      setState(prev => ({
        ...prev,
        isDownloading: true,
        error: null,
        progress: 0
      }));

      setProgress(25);
      await downloadMultipleFiles(files);
      setProgress(100);

      options.onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement multiple';
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setState(prev => ({
        ...prev,
        isDownloading: false
      }));
    }
  }, [setError, setProgress]);

  const downloadDirectoryOperation = useCallback(async (
    directoryPath: string, 
    options: FileOperationOptions = {}
  ) => {
    try {
      setState(prev => ({
        ...prev,
        isDownloading: true,
        error: null,
        progress: 0
      }));

      setProgress(25);
      await downloadDirectory(directoryPath);
      setProgress(100);

      options.onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement du répertoire';
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setState(prev => ({
        ...prev,
        isDownloading: false
      }));
    }
  }, [setError, setProgress]);

  const processFiles = useCallback(async (
    files: any[], 
    processor: (file: any) => Promise<any>,
    options: FileOperationOptions = {}
  ) => {
    try {
      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        progress: 0
      }));

      const totalFiles = files.length;
      const results = [];

      for (let i = 0; i < totalFiles; i++) {
        try {
          const result = await processor(files[i]);
          results.push(result);
          
          const progress = ((i + 1) / totalFiles) * 100;
          setProgress(progress);
          options.onProgress?.(progress);
        } catch (error) {
          console.error(`Erreur lors du traitement du fichier ${files[i].name}:`, error);
          // Continue avec les autres fichiers
        }
      }

      options.onSuccess?.();
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du traitement des fichiers';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return [];
    } finally {
      setState(prev => ({
        ...prev,
        isProcessing: false
      }));
    }
  }, [setError, setProgress]);

  return {
    // State
    ...state,
    
    // Actions
    downloadSingleFile,
    downloadMultipleFiles: downloadMultipleFilesOperation,
    downloadDirectory: downloadDirectoryOperation,
    processFiles,
    
    // Utilities
    resetState,
    setError,
    setProgress
  };
}; 