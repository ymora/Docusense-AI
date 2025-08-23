import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import { usePromptStore } from '../stores/promptStore';
import { useConfigStore } from '../stores/configStore';
import { useAnalysisStore } from '../stores/analysisStore';
import { logService } from '../services/logService';
import { streamService } from '../services/streamService';
import { useBackendConnection } from './useBackendConnection';

/**
 * Hook pour gérer les streams SSE après authentification
 * Remplace les requêtes directes par des streams en temps réel
 */
export const useAuthReload = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const { loadPrompts } = usePromptStore();
  const { loadAIProviders } = useConfigStore();
  const { loadAnalyses } = useAnalysisStore();
  const { isOnline, consecutiveFailures } = useBackendConnection();

  useEffect(() => {
    if (isAuthenticated) {
      // Démarrer tous les streams SSE après authentification
      const startStreams = async () => {
        try {
          logService.info('Démarrage des streams SSE après authentification', 'AuthReload');
          
          // Stream des analyses
          streamService.startStream('analyses', {
            onMessage: (message) => {
              if (message.type === 'analyses_initial') {
                // Charger les analyses initiales depuis le stream
                const analyses = message.analyses || [];
                useAnalysisStore.setState({ analyses, totalAnalyses: analyses.length });
                logService.info(`Analyses chargées via stream: ${analyses.length}`, 'AuthReload');
              } else if (message.type === 'analysis_update') {
                // Mettre à jour une analyse spécifique
                const { analysis } = message;
                useAnalysisStore.setState((state) => {
                  const existingIndex = state.analyses.findIndex(a => a.id === analysis.id);
                  if (existingIndex >= 0) {
                    const newAnalyses = [...state.analyses];
                    newAnalyses[existingIndex] = analysis;
                    return { analyses: newAnalyses };
                  } else {
                    return { analyses: [...state.analyses, analysis] };
                  }
                });
              }
            },
            onError: (error) => {
              logService.error('Erreur stream analyses', 'AuthReload', { error: error.type });
            }
          });

          // Stream des configurations IA
          streamService.startStream('config', {
            onMessage: (message) => {
              if (message.type === 'config_initial') {
                // Charger la configuration initiale depuis le stream
                const providers = message.providers || [];
                useConfigStore.setState({ aiProviders: providers, isInitialized: true });
                logService.info(`Configuration IA chargée via stream: ${providers.length} providers`, 'AuthReload');
              } else if (message.type === 'config_update') {
                // Mettre à jour la configuration
                const { config } = message;
                useConfigStore.setState({ aiProviders: config.providers || [] });
              }
            },
            onError: (error) => {
              logService.error('Erreur stream config', 'AuthReload', { error: error.type });
            }
          });

          // Stream des utilisateurs
          streamService.startStream('users', {
            onMessage: (message) => {
              if (message.type === 'user_event') {
                logService.info('Événement utilisateur reçu', 'AuthReload', { event: message.event });
              }
            },
            onError: (error) => {
              logService.error('Erreur stream users', 'AuthReload', { error: error.type });
            }
          });

          // Stream des fichiers
          streamService.startStream('files', {
            onMessage: (message) => {
              if (message.type === 'file_event') {
                logService.info('Événement fichier reçu', 'AuthReload', { event: message.event });
              }
            },
            onError: (error) => {
              logService.error('Erreur stream files', 'AuthReload', { error: error.type });
            }
          });

          // Redémarrer le stream SSE des logs backend
          logService.restartBackendLogStream();
          
          logService.info('Tous les streams SSE démarrés avec succès', 'AuthReload');
        } catch (error) {
          logService.error('Erreur lors du démarrage des streams SSE', 'AuthReload', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      };

      startStreams();
    } else {
      // Arrêter tous les streams lors de la déconnexion
      logService.info('Arrêt de tous les streams SSE lors de la déconnexion', 'AuthReload');
      streamService.stopAllStreams();
      logService.stopBackendLogStream();
    }
  }, [isAuthenticated]);

  // Déconnexion automatique si le backend tombe en panne
  useEffect(() => {
    if (isAuthenticated && !isOnline && consecutiveFailures >= 3) {
      logService.warning('Déconnexion automatique - Backend indisponible', 'AuthReload', {
        consecutiveFailures,
        lastCheck: new Date().toISOString()
      });
      logout();
    }
  }, [isAuthenticated, isOnline, consecutiveFailures, logout]);
};
