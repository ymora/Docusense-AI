import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiRequest, handleApiError } from '../utils/apiUtils';
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
  
  // Initialisation automatique
  initializeDefaultDirectory: () => Promise<void>;
  
  // Actions pour la performance sans cache
  updateFileStatus: (fileId: number, status: File['status'], result?: string) => void;

  // NOUVEAU: Actions pour le suivi des consultations
  markFileAsViewed: (fileId: number) => void;
  
  // NOUVEAU: Action de réinitialisation propre
  resetState: () => void;
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

        loadFiles: (() => {
          const callGuard = createCallGuard();
          return callGuard(async () => {
            const loadingActions = createLoadingActions(set, get);
            const updater = createOptimizedUpdater(set, get);
            
            if (!loadingActions.startLoading()) {
              return;
            }
            
            try {
              // Utiliser l'endpoint /files/?directory= pour récupérer les données de la base de données
              const currentDir = get().currentDirectory || "D:";
              const encodedDirectory = encodeURIComponent(currentDir.replace(/\\/g, '/'));
              const data = await apiRequest(`/api/files/?directory=${encodedDirectory}&limit=100`) as any;



              // Les données sont déjà au bon format avec les vrais IDs
              const filesFromDB = (data.files || []).map((file: any) => ({
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

        loadDirectoryTree: (() => {
          const callGuard = createCallGuard();
          return callGuard(async (directory: string) => {
            const loadingActions = createLoadingActions(set, get);
            const updater = createOptimizedUpdater(set, get);
            

            
            if (!loadingActions.startLoading()) {

              return;
            }
            
            try {
              // Utiliser l'endpoint /list pour obtenir le contenu réel du répertoire
              const encodedDirectory = encodeURIComponent(directory.replace(/\\/g, '/'));
              const url = `/api/files/list/${encodedDirectory}`;

              
              const response = await apiRequest(url);

              
              // Construire la structure DirectoryTree à partir de la réponse /list
              const treeData = {
                name: directory.split(/[\\/]/).pop() || directory,
                path: directory,
                is_directory: true,
                file_count: response.total_files || 0,
                children: response.subdirectories || [],
                files: response.files || []
              };
              

              
              updater.updateMultiple({
                directoryTree: treeData as DirectoryTree,
                currentDirectory: directory,
              });

              
              // OPTIMISATION: Plus besoin de double chargement, les données sont déjà complètes
              
              loadingActions.finishLoading();
            } catch (error) {
              console.error("❌ Erreur dans loadDirectoryTree:", error);
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
              await apiRequest('/api/files/scan', {
                method: 'POST',
                body: JSON.stringify({ directory_path: directory }),
              });

              // Recharger l'arborescence avec données fraîches
              await get().loadDirectoryTree(directory);
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

              await apiRequest('/api/analysis/retry', {
                method: 'POST',
                body: JSON.stringify({ file_ids: fileIds }),
              });

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

        // Initialisation automatique du répertoire par défaut
        initializeDefaultDirectory: (() => {
          const callGuard = createCallGuard();
          return callGuard(async () => {
            try {

              
              // TOUJOURS démarrer à la racine du disque D (pas de restauration)

              try {
                await get().loadDirectoryTree("D:");

              } catch (error) {
                console.warn("⚠️ Impossible de charger le disque D, tentative avec C:", error);
                // Fallback vers le disque C si D n'est pas accessible
                await get().loadDirectoryTree("C:");

              }
            } catch (error) {
              console.error("❌ Erreur lors de l'initialisation du répertoire par défaut:", error);
            }
          });
        })(),

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
            directoryTree: null,
            currentDirectory: null,
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
          // selectedFile: state.selectedFile, // Ne pas persister le fichier sélectionné
          // currentDirectory: state.currentDirectory, // Ne pas persister le répertoire actuel
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