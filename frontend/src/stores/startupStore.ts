import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface StartupState {
  // État d'initialisation
  isInitialized: boolean;
  initializationStep: 'idle' | 'prompts' | 'config' | 'complete' | 'error';
  
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

        // Initialisation complète
        initialize: async () => {
          const { isInitialized } = get();
          
          if (isInitialized) {
            console.log('🚀 Application déjà initialisée, utilisation du cache');
            return;
          }

          console.log('🚀 Démarrage de l\'initialisation de l\'application...');
          set({ initializationStep: 'prompts' });

          try {
            // Initialiser les prompts
            console.log('📋 Initialisation des prompts...');
            const { usePromptStore } = await import('../stores/promptStore');
            const promptStore = usePromptStore.getState();
            await promptStore.loadPrompts();
            set({ initializationStep: 'config' });

            // Initialiser les configurations
            console.log('🔑 Initialisation des configurations...');
            const { useConfigStore } = await import('../stores/configStore');
            const configStore = useConfigStore.getState();
            await configStore.loadAIProviders();
            set({ initializationStep: 'complete' });

            // Marquer comme initialisé
            set({ 
              isInitialized: true,
              startupTime: new Date().toISOString()
            });

            console.log('✅ Initialisation de l\'application terminée avec succès');
          } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            set({ 
              initializationStep: 'error',
              isInitialized: true // Marquer comme initialisé même en cas d'erreur
            });
          }
        },

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