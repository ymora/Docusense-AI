import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { handleApiError } from '../utils/apiUtils';
import { createLoadingActions, createCallGuard, createOptimizedUpdater } from '../utils/storeUtils';

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

interface FileState {
  files: File[];
  selectedFiles: (number | string)[]; // Accepter les IDs (number) et les chemins (string)
  selectedFile: File | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadFiles: () => Promise<void>;
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
  
  // Actions pour la performance sans cache
  updateFileStatus: (fileId: number, status: File['status'], result?: string) => void;

  // NOUVEAU: Actions pour le suivi des consultations
  markFileAsViewed: (fileId: number) => void;
  
  // NOUVEAU: Action de réinitialisation propre
  resetState: () => void;
}

export const useFileStore = create<FileState>()(
  devtools(
    persist(
      (set, get) => ({
        files: [],
        selectedFiles: [],
        selectedFile: null,
        loading: false,
        error: null,

        loadFiles: (() => {
          const callGuard = createCallGuard();
          return callGuard(async () => {
            const loadingActions = createLoadingActions(set, get);
            const updater = createOptimizedUpdater(set, get);
            
            if (!loadingActions.startLoading()) {
              return;
            }
            
            try {
              // Note: Cette méthode sera remplacée par le service unifié dans les composants
              // Le store garde cette méthode pour compatibilité mais les composants utiliseront
              // directement useUnifiedApiService pour les appels API
              
              // Les données sont déjà au bon format avec les vrais IDs
              const filesFromDB = ([]).map((file: any) => ({
                ...file,
                is_selected: false, // Réinitialiser la sélection
              }));

              // Fusionner avec les données de consultation persistées
              const filesWithViewData = filesFromDB.map((file: File) => {
                const existingFile = get().files.find(f => f.id === file.id);
                return {
                  ...file,
                  has_been_viewed: existingFile?.has_been_viewed || false,
                  viewed_at: existingFile?.viewed_at,
                };
              });

              updater.updateMultiple({ files: filesWithViewData });
              loadingActions.finishLoading();
            } catch (error) {
              console.error("❌ Erreur dans loadFiles:", error);
              loadingActions.finishLoadingWithError(handleApiError(error));
            }
          });
        })(),

        scanDirectory: (() => {
          const callGuard = createCallGuard();
          return callGuard(async (directory: string) => {
            const loadingActions = createLoadingActions(set, get);
            
            if (!loadingActions.startLoading()) {
              return;
            }
            
            try {
              // Note: Cette méthode sera remplacée par le service unifié dans les composants
              // Le store garde cette méthode pour compatibilité mais les composants utiliseront
              // directement useUnifiedApiService pour les appels API

              // Recharger les fichiers avec données fraîches
              await get().loadFiles();
              loadingActions.finishLoading();
            } catch (error) {
              loadingActions.finishLoadingWithError(handleApiError(error));
            }
          });
        })(),

        analyzeFiles: (() => {
          const callGuard = createCallGuard();
          return callGuard(async (fileIds: number[]) => {
            const loadingActions = createLoadingActions(set, get);
            
            if (!loadingActions.startLoading()) {
              return;
            }
            
            try {
              // Note: Cette méthode sera remplacée par le service unifié dans les composants
              // Le store garde cette méthode pour compatibilité mais les composants utiliseront
              // directement useUnifiedApiService pour les appels API

              // OPTIMISATION: Recharger les données après analyse
              await get().loadFiles();
              loadingActions.finishLoading();
            } catch (error) {
              loadingActions.finishLoadingWithError(handleApiError(error));
            }
          });
        })(),

        compareFiles: (() => {
          const callGuard = createCallGuard();
          return callGuard(async (fileIds: number[]) => {
            const loadingActions = createLoadingActions(set, get);
            
            if (!loadingActions.startLoading()) {
              return;
            }
            
            try {
              // Note: Cette méthode sera remplacée par le service unifié dans les composants
              // Le store garde cette méthode pour compatibilité mais les composants utiliseront
              // directement useUnifiedApiService pour les appels API

              // Recharger les fichiers avec données fraîches
              await get().loadFiles();
              loadingActions.finishLoading();
            } catch (error) {
              loadingActions.finishLoadingWithError(handleApiError(error));
            }
          });
        })(),

        retryFailedFiles: (() => {
          const callGuard = createCallGuard();
          return callGuard(async () => {
            const loadingActions = createLoadingActions(set, get);
            
            if (!loadingActions.startLoading()) {
              return;
            }
            
            try {
              const failedFiles = get().files.filter(f => f.status === 'failed');
              const fileIds = failedFiles.map(f => f.id);

              if (fileIds.length === 0) {
                loadingActions.finishLoading();
                return;
              }

              // Note: Cette méthode sera remplacée par le service unifié dans les composants
              // Le store garde cette méthode pour compatibilité mais les composants utiliseront
              // directement useUnifiedApiService pour les appels API

              // Recharger les fichiers avec données fraîches
              await get().loadFiles();
              loadingActions.finishLoading();
            } catch (error) {
              loadingActions.finishLoadingWithError(handleApiError(error));
            }
          });
        })(),

        toggleFileSelection: (fileId: number | string) => {
          set((state) => {
            const isSelected = state.selectedFiles.includes(fileId);
            const newSelectedFiles = isSelected
              ? state.selectedFiles.filter(id => id !== fileId)
              : [...state.selectedFiles, fileId];

            // Mettre à jour selectedFile si c'est le seul fichier sélectionné
            let newSelectedFile = state.selectedFile;
            if (newSelectedFiles.length === 1) {
              const file = state.files.find(f => (f.id === fileId || f.path === fileId));
              newSelectedFile = file || null;
            } else if (newSelectedFiles.length === 0) {
              newSelectedFile = null;
            }

            return { 
              selectedFiles: newSelectedFiles,
              selectedFile: newSelectedFile
            };
          });
        },

        selectFile: (file: File) => {
          set({ 
            selectedFile: file,
            selectedFiles: [file.id || file.path] // Ajouter le fichier à la liste des fichiers sélectionnés
          });
        },

        analyzeFile: async (fileId: number) => {
          set({ loading: true, error: null });

          try {
            // Note: Cette méthode sera remplacée par le service unifié dans les composants
            // Le store garde cette méthode pour compatibilité mais les composants utiliseront
            // directement useUnifiedApiService pour les appels API

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

        // NOUVEAU: Action de réinitialisation propre
        resetState: () => {
          set({
            files: [],
            selectedFiles: [],
            selectedFile: null,
            loading: false,
            error: null,
          });
        },
      }),
      {
        name: 'docusense-file-store',
        partialize: (state) => ({
          selectedFiles: state.selectedFiles,
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