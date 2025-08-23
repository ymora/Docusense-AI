import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface StartupState {
  // État d'initialisation
  isInitialized: boolean;
  initializationStep: 'idle' | 'prompts' | 'config' | 'files' | 'complete' | 'error';
  
  // Métadonnées
  startupTime: string | null;
  version: string;
  
  // Actions
  initialize: () => Promise<void>;
  setInitializationStep: (step: StartupState['initializationStep']) => void;
  reset: () => void;
}

export const useStartupStore = create<StartupState>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        isInitialized: false,
        initializationStep: 'idle',
        startupTime: null,
        version: '1.0.0',

        // Initialisation complète (protégée contre les appels multiples)
        initialize: (() => {
          let isInitializing = false;
          return async () => {
            if (isInitializing || get().isInitialized) {
              return;
            }
            
            isInitializing = true;
            set({ initializationStep: 'prompts' });

            try {
              // Vérifier l'authentification avant de charger les données
              const { default: useAuthStore } = await import('../stores/authStore');
              const authState = useAuthStore.getState();
              
              if (!authState.isAuthenticated) {
                // Si pas authentifié, utiliser seulement les données par défaut
                console.log('🔒 Utilisateur non authentifié - Utilisation des données par défaut');
                
                // Initialiser les prompts avec les données par défaut
                const { usePromptStore } = await import('../stores/promptStore');
                const promptStore = usePromptStore.getState();
                await promptStore.loadDefaultPromptsOnly();
                set({ initializationStep: 'config' });

                // Initialiser les configurations avec les valeurs par défaut
                const { useConfigStore } = await import('../stores/configStore');
                const configStore = useConfigStore.getState();
                await configStore.loadDefaultConfig();
                set({ initializationStep: 'files' });

                // Initialiser le fileStore (reset seulement)
                const { useFileStore } = await import('../stores/fileStore');
                const fileStore = useFileStore.getState();
                fileStore.resetState();
                set({ initializationStep: 'complete' });

                // Marquer comme initialisé
                set({ 
                  isInitialized: true,
                  startupTime: new Date().toISOString()
                });
                return;
              }

              // Si authentifié, charger toutes les données
              console.log('✅ Utilisateur authentifié - Chargement complet des données');
              
              // Initialiser les prompts
              const { usePromptStore } = await import('../stores/promptStore');
              const promptStore = usePromptStore.getState();
              await promptStore.loadPrompts();
              set({ initializationStep: 'config' });

              // Initialiser les configurations
              const { useConfigStore } = await import('../stores/configStore');
              const configStore = useConfigStore.getState();
              await configStore.loadAIProviders();
              set({ initializationStep: 'complete' });

              // Initialiser les analyses
              const { useAnalysisStore } = await import('../stores/analysisStore');
              const analysisStore = useAnalysisStore.getState();
              await analysisStore.loadAnalyses();
              set({ initializationStep: 'files' });

              // Initialiser le fileStore (reset seulement)
              const { useFileStore } = await import('../stores/fileStore');
              const fileStore = useFileStore.getState();
              fileStore.resetState();
              set({ initializationStep: 'complete' });

              // Marquer comme initialisé
              set({ 
                isInitialized: true,
                startupTime: new Date().toISOString()
              });

            } catch (error) {
              console.error('❌ Erreur lors de l\'initialisation:', error);
              set({ 
                initializationStep: 'error',
                isInitialized: true
              });
            } finally {
              isInitializing = false;
            }
          };
        })(),

        // Définir l'étape d'initialisation
        setInitializationStep: (step: StartupState['initializationStep']) => {
          set({ initializationStep: step });
        },

        // Réinitialiser
        reset: () => {
          set({
            isInitialized: false,
            initializationStep: 'idle',
            startupTime: null
          });
        }
      }),
      {
        name: 'startup-store',
        partialize: (state) => ({
          isInitialized: state.isInitialized,
          startupTime: state.startupTime,
          version: state.version
        })
      }
    )
  )
); 