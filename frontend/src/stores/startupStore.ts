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
              // Initialiser les prompts
              const { usePromptStore } = await import('../stores/promptStore');
              const promptStore = usePromptStore.getState();
              await promptStore.loadPrompts();
              set({ initializationStep: 'config' });

              // Initialiser les configurations
              const { useConfigStore } = await import('../stores/configStore');
              const configStore = useConfigStore.getState();
              await configStore.loadAIProviders();
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