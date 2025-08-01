import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiRequest, handleApiError } from '../utils/apiUtils';

export interface File {
  id: number;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused' | 'unsupported' | 'none';
  created_at: string;
  updated_at: string;
  extracted_text?: string;
  analysis_result?: string;
  analysis_metadata?: {
    provider?: string;
    model?: string;
    processing_time?: number;
    tokens_used?: number;
    estimated_cost?: number;
    timestamp?: number;
  };
  error_message?: string;
  is_selected: boolean;
  parent_directory?: string;
  // Nouveau: Suivi de consultation
  has_been_viewed?: boolean;
  viewed_at?: string;
}

export interface DirectoryTree {
  name: string;
  path: string;
  is_directory: boolean;
  file_count: number;
  children: DirectoryTree[];
  files: File[];
}

interface FileState {
  files: File[];
  directoryTree: DirectoryTree | null;

  currentDirectory: string | null;
  selectedFiles: (number | string)[]; // Accepter les IDs (number) et les chemins (string)
  selectedFile: File | null;
  loading: boolean;
  error: string | null;

  // Navigation sans cache - données toujours fraîches

  // Actions
  loadFiles: () => Promise<void>;
  loadDirectoryTree: (directory: string) => Promise<void>;

  scanDirectory: (directory: string) => Promise<void>;
  analyzeFiles: (fileIds: number[]) => Promise<void>;
  analyzeFile: (fileId: number) => Promise<void>;
  compareFiles: (fileIds: number[]) => Promise<void>;
  retryFailedFiles: () => Promise<void>;
  toggleFileSelection: (fileId: number | string) => void;
  selectFile: (file: File) => void;
  clearSelection: () => void;
  selectAllFiles: () => void;
  deselectAllFiles: () => void;
  setCurrentDirectory: (directory: string | null) => void;

          // Actions pour la performance sans cache
        updateFileStatus: (fileId: number, status: File['status'], result?: string) => void;

  // NOUVEAU: Actions pour le suivi des consultations
  markFileAsViewed: (fileId: number) => void;
}

// OPTIMISATION: Fonction utilitaire pour la gestion du cache
// Fonctions utilitaires pour les requêtes API

// Utilisation des utilitaires centralisés

export const useFileStore = create<FileState>()(
  devtools(
    persist(
      (set, get) => ({
        files: [],
        directoryTree: null,

        currentDirectory: null,
        selectedFiles: [],
        selectedFile: null,
        loading: false,
        error: null,

        // Navigation sans cache - données toujours fraîches

        loadFiles: async () => {
          set({ loading: true, error: null });

          try {
            // Utiliser l'endpoint list_directory_content_paginated pour les données fraîches
            const currentDir = get().currentDirectory || "C:\\Users\\ymora\\Desktop\\Docusense AI";
            const encodedDirectory = encodeURIComponent(currentDir.replace(/\\/g, '/'));
            const data = await apiRequest(`/api/files/list/${encodedDirectory}?page=1&page_size=100`) as any;

            // Convertir les données du format list vers le format files
            const filesFromList = (data.files || []).map((file: any) => ({
              id: file.id || Math.random(), // ID temporaire si pas d'ID
              name: file.name,
              path: file.path,
              size: file.size,
              mime_type: file.mime_type,
              status: file.status || 'none',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_selected: false,
              parent_directory: file.path.substring(0, file.path.lastIndexOf('\\')),
            }));

            // Fusionner avec les données de consultation persistées
            const filesWithViewData = filesFromList.map((file: File) => {
              const existingFile = get().files.find(f => f.id === file.id);
              return {
                ...file,
                has_been_viewed: existingFile?.has_been_viewed || false,
                viewed_at: existingFile?.viewed_at,
              };
            });

            set({ files: filesWithViewData, loading: false });
          } catch (error) {
            set({
              error: handleApiError(error),
              loading: false,
            });
          }
        },

        loadDirectoryTree: async (directory: string) => {
          set({ loading: true, error: null });
          try {
            // Requête directe sans cache - données toujours fraîches
            const encodedDirectory = encodeURIComponent(directory.replace(/\\/g, '/'));
            const tree = await apiRequest(`/api/files/tree/${encodedDirectory}`);
            set({
              directoryTree: tree as DirectoryTree,
              currentDirectory: directory,
              loading: false,
            });
          } catch (error) {
            set({
              error: handleApiError(error),
              loading: false,
            });
          }
        },

        scanDirectory: async (directory: string) => {
          set({ loading: true, error: null });

          try {
            await apiRequest('/api/files/scan', {
              method: 'POST',
              body: JSON.stringify({ directory_path: directory }),
            });

            // Recharger l'arborescence avec données fraîches
            await get().loadDirectoryTree(directory);
          } catch (error) {
            set({
              error: handleApiError(error),
              loading: false,
            });
          }
        },

        analyzeFiles: async (fileIds: number[]) => {
          set({ loading: true, error: null });

          try {
            await apiRequest('/api/analysis/bulk', {
              method: 'POST',
              body: JSON.stringify({
                file_ids: fileIds,
                analysis_type: 'general',
                provider: 'openai',
                model: 'gpt-4',
              }),
            });

            // OPTIMISATION: Recharger les données après analyse

            // Recharger les fichiers
            await get().loadFiles();
          } catch (error) {
            set({
              error: handleApiError(error),
              loading: false,
            });
          }
        },

        compareFiles: async (fileIds: number[]) => {
          set({ loading: true, error: null });

          try {
            await apiRequest('/api/analysis/compare', {
              method: 'POST',
              body: JSON.stringify({
                file_ids: fileIds,
                analysis_type: 'comparison',
                provider: 'openai',
                model: 'gpt-4',
              }),
            });

            // Recharger les fichiers avec données fraîches
            await get().loadFiles();
          } catch (error) {
            set({
              error: handleApiError(error),
              loading: false,
            });
          }
        },

        retryFailedFiles: async () => {
          set({ loading: true, error: null });

          try {
            const failedFiles = get().files.filter(f => f.status === 'failed');
            const fileIds = failedFiles.map(f => f.id);

            if (fileIds.length === 0) {
              set({ loading: false });
              return;
            }

            await apiRequest('/api/analysis/retry', {
              method: 'POST',
              body: JSON.stringify({ file_ids: fileIds }),
            });

            // Recharger les fichiers avec données fraîches
            await get().loadFiles();
          } catch (error) {
            set({
              error: handleApiError(error),
              loading: false,
            });
          }
        },

        toggleFileSelection: (fileId: number | string) => {
          set((state) => {
            const isSelected = state.selectedFiles.includes(fileId);
            const newSelectedFiles = isSelected
              ? state.selectedFiles.filter(id => id !== fileId)
              : [...state.selectedFiles, fileId];

            return { selectedFiles: newSelectedFiles };
          });
        },

        selectFile: (file: File) => {
          set({ selectedFile: file });
        },

        analyzeFile: async (fileId: number) => {
          set({ loading: true, error: null });

          try {
            await apiRequest('/api/analysis/bulk', {
              method: 'POST',
              body: JSON.stringify({
                file_ids: [fileId],
                analysis_type: 'general',
                provider: 'openai',
                model: 'gpt-4',
              }),
            });

            // Recharger les fichiers avec données fraîches
            await get().loadFiles();
          } catch (error) {
            set({
              error: handleApiError(error),
              loading: false,
            });
          }
        },

        clearSelection: () => {
          set({ selectedFiles: [] });
        },

        selectAllFiles: () => {
          set((state) => ({
            selectedFiles: state.files.map(file => file.id),
          }));
        },

        deselectAllFiles: () => {
          set({ selectedFiles: [] });
        },

        setCurrentDirectory: (directory: string | null) => {
          set({ currentDirectory: directory });
        },

        // Actions pour la performance sans cache
        updateFileStatus: (fileId: number, status: File['status'], result?: string) => {
          set((state) => ({
            files: state.files.map(file =>
              file.id === fileId
                ? { ...file, status, analysis_result: result }
                : file,
            ),
          }));
        },

        // NOUVEAU: Actions pour le suivi des consultations
        markFileAsViewed: (fileId: number) => {
          set((state) => ({
            files: state.files.map(file =>
              file.id === fileId
                ? {
                  ...file,
                  has_been_viewed: true,
                  viewed_at: new Date().toISOString(),
                }
                : file,
            ),
          }));
        },
      }),
      {
        name: 'docusense-file-store',
        partialize: (state) => ({
          selectedFiles: state.selectedFiles,
          selectedFile: state.selectedFile,
          currentDirectory: state.currentDirectory,
          // NOUVEAU: Persister les données de consultation
          files: state.files.map(file => ({
            id: file.id,
            has_been_viewed: file.has_been_viewed,
            viewed_at: file.viewed_at,
          })),
        }),
      },
    ),
    {
      name: 'file-store',
    },
  ),
);