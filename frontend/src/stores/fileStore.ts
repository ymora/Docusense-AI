import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface File {
  id: number;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused' | 'unsupported';
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

  // OPTIMISATION: Cache et performance
  cache: Map<string, any>;
  lastFetch: number;
  cacheExpiry: number; // 5 minutes

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

  // OPTIMISATION: Nouvelles actions pour la performance
  clearCache: () => void;
  updateFileStatus: (fileId: number, status: File['status'], result?: string) => void;
  refreshFiles: () => Promise<void>;

  // NOUVEAU: Actions pour le suivi des consultations
  markFileAsViewed: (fileId: number) => void;
  getAnalysisStats: () => {
    completed: number;
    unviewed: number;
    viewed: number;
    total: number;
  };
}

// OPTIMISATION: Fonction utilitaire pour la gestion du cache
const getCacheKey = (endpoint: string, params?: Record<string, any>): string => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${endpoint}${paramString}`;
};

const isCacheValid = (timestamp: number, expiry: number): boolean => {
  return Date.now() - timestamp < expiry;
};

// OPTIMISATION: Fonction utilitaire pour la gestion des erreurs
const handleApiError = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Erreur inconnue';
};

// OPTIMISATION: Fonction utilitaire pour les requêtes API
const apiRequest = async (url: string, options?: RequestInit): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête expirée');
    }
    throw error;
  }
};

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

        // OPTIMISATION: Cache et performance
        cache: new Map(),
        lastFetch: 0,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes

        loadFiles: async () => {
          const state = get();
          const cacheKey = getCacheKey('/api/files/');

          // OPTIMISATION: Vérifier le cache
          if (state.cache.has(cacheKey) && isCacheValid(state.lastFetch, state.cacheExpiry)) {
            const cachedData = state.cache.get(cacheKey);
            set({ files: cachedData.files || [], loading: false });
            return;
          }

          set({ loading: true, error: null });

          try {
            // Ajouter les paramètres limit et offset requis par le backend
            const params = new URLSearchParams({
              limit: '100',  // Limite par défaut
              offset: '0',    // Commencer au début
            });
            const data = await apiRequest(`/api/files/?${params.toString()}`);

            // NOUVEAU: Fusionner avec les données de consultation persistées
            const filesWithViewData = (data.files || []).map((file: File) => {
              const existingFile = state.files.find(f => f.id === file.id);
              return {
                ...file,
                has_been_viewed: existingFile?.has_been_viewed || false,
                viewed_at: existingFile?.viewed_at || undefined,
              };
            });

            // OPTIMISATION: Mettre en cache
            state.cache.set(cacheKey, { ...data, files: filesWithViewData });
            set({
              files: filesWithViewData,
              loading: false,
              lastFetch: Date.now(),
            });
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
            const encodedDirectory = encodeURIComponent(directory.replace(/\\/g, '/'));
            const tree = await apiRequest(`/api/files/tree/${encodedDirectory}`);
            set({
              directoryTree: tree,
              currentDirectory: directory,
              loading: false,
              lastFetch: Date.now(),
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

            // OPTIMISATION: Invalider le cache après scan
            get().clearCache();

            // Recharger l'arborescence
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

            // OPTIMISATION: Invalider le cache après analyse
            get().clearCache();

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

            // OPTIMISATION: Invalider le cache après comparaison
            get().clearCache();

            // Recharger les fichiers
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

            // OPTIMISATION: Invalider le cache après retry
            get().clearCache();

            // Recharger les fichiers
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

            // OPTIMISATION: Invalider le cache après analyse
            get().clearCache();

            // Recharger les fichiers
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

        // OPTIMISATION: Nouvelles actions pour la performance
        clearCache: () => {
          set(() => ({
            cache: new Map(),
            lastFetch: 0,
          }));
        },

        updateFileStatus: (fileId: number, status: File['status'], result?: string) => {
          set((state) => ({
            files: state.files.map(file =>
              file.id === fileId
                ? { ...file, status, analysis_result: result }
                : file,
            ),
          }));
        },

        refreshFiles: async () => {
          get().clearCache();
          await get().loadFiles();
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

        getAnalysisStats: () => {
          const state = get();
          const completedFiles = state.files.filter(file =>
            file.status === 'completed' && file.analysis_result,
          );

          return {
            completed: completedFiles.length,
            unviewed: completedFiles.filter(file => !file.has_been_viewed).length,
            viewed: completedFiles.filter(file => file.has_been_viewed).length,
            total: state.files.length,
          };
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