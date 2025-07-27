/**
 * Hook personnalisé pour les opérations sur les fichiers
 */

import { useState, useCallback } from 'react';
import { useFileStore } from '../stores/fileStore';
import { useQueueStore } from '../stores/queueStore';

export const useFileOperations = () => {
  const { selectedFile, selectFile, markFileAsViewed } = useFileStore();
  const { addToQueue, removeFromQueue } = useQueueStore();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Analyse un fichier avec un type d'analyse spécifique
   */
  const analyzeFile = useCallback(async (fileId: number, analysisType: string) => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/analysis/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_ids: [fileId], analysis_type: analysisType }),
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de l'analyse: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Analyse plusieurs fichiers avec un type d'analyse spécifique
   */
  const analyzeMultipleFiles = useCallback(async (fileIds: number[], analysisType: string) => {
    try {
      setIsProcessing(true);

      const response = await fetch('/api/analysis/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_ids: fileIds, analysis_type: analysisType }),
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de l'analyse: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Relance l'analyse d'un fichier en échec
   */
  const retryFile = useCallback(async (fileId: number) => {
    return await analyzeFile(fileId, 'general');
  }, [analyzeFile]);

  /**
   * Relance l'analyse de plusieurs fichiers en échec
   */
  const retryMultipleFiles = useCallback(async (fileIds: number[]) => {
    return await analyzeMultipleFiles(fileIds, 'general');
  }, [analyzeMultipleFiles]);

  /**
   * Supprime un fichier de la queue
   */
  const removeFileFromQueue = useCallback(async (fileId: number) => {
    try {
      const response = await fetch(`/api/queue/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression: ${response.status}`);
      }

      removeFromQueue(fileId);
    } catch (error) {
      throw error;
    }
  }, [removeFromQueue]);

  /**
   * Obtient les détails d'un fichier
   */
  const getFileDetails = useCallback(async (fileId: number) => {
    try {
      const response = await fetch(`/api/files/${fileId}/details`);

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Obtient le contenu d'un fichier texte
   */
  const getFileContent = useCallback(async (fileId: number) => {
    try {
      const response = await fetch(`/api/files/${fileId}/content`);

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Télécharge un fichier
   */
  const downloadFile = useCallback(async (fileId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`);

      if (!response.ok) {
        throw new Error(`Erreur lors du téléchargement: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    selectedFile,
    selectFile,
    markFileAsViewed,
    isProcessing,
    analyzeFile,
    analyzeMultipleFiles,
    retryFile,
    retryMultipleFiles,
    removeFileFromQueue,
    getFileDetails,
    getFileContent,
    downloadFile,
  };
};