import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import { usePromptStore } from '../stores/promptStore';
import { useConfigStore } from '../stores/configStore';
import { useAnalysisStore } from '../stores/analysisStore';
import { logService } from '../services/logService';
import { streamService } from '../services/streamService';
import { useBackendConnection } from './useBackendConnection';
import { checkAuthToken } from '../utils/apiUtils';

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
      // Vérifier que le token d'authentification est valide
      if (!checkAuthToken()) {
        logService.warning('Token d\'authentification manquant ou invalide, déconnexion automatique', 'AuthReload');
        logout();
        return;
      }
      
      // Démarrer tous les streams SSE après authentification
      const startStreams = async () => {
        try {
          logService.info('Démarrage des streams SSE après authentification', 'AuthReload');
          
          // Charger les données initiales via API classique en parallèle
          const loadInitialData = async () => {
            try {
              await loadAIProviders();
              await loadAnalyses();
              await loadPrompts();
              logService.info('Données initiales chargées via API classique', 'AuthReload');
            } catch (error) {
              logService.warning('Impossible de charger les données initiales via API', 'AuthReload', { error: error instanceof Error ? error.message : String(error) });
              
              // En cas d'échec, charger au moins la configuration par défaut
              try {
                const configStore = useConfigStore.getState();
                if (!configStore.isInitialized) {
                  await configStore.loadDefaultConfig();
                  logService.info('Configuration par défaut chargée', 'AuthReload');
                }
              } catch (defaultError) {
                logService.error('Impossible de charger la configuration par défaut', 'AuthReload', { error: defaultError instanceof Error ? defaultError.message : String(defaultError) });
              }
            }
          };
          
          // Charger les données en arrière-plan
          loadInitialData();
          
          // Stream des analyses
          streamService.startStream('analyses', {
            onMessage: (message) => {
              try {
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
              } catch (error) {
                logService.error('Erreur lors du traitement du message analyses', 'AuthReload', { error, message });
              }
            },
            onError: (error) => {
              logService.error('Erreur stream analyses', 'AuthReload', { error: error.type });
              // Attendre un peu avant le fallback pour éviter les requêtes simultanées
              setTimeout(() => {
                loadAnalyses().catch(err => 
                  logService.warning('Impossible de charger les analyses via API', 'AuthReload', { error: err.message })
                );
              }, 2000);
            }
          });

          // Stream des configurations IA
          streamService.startStream('config', {
            onMessage: (message) => {
              if (message.type === 'config_initial') {
                // Charger la configuration initiale depuis le stream
                const providers = Array.isArray(message.providers) ? message.providers : [];
                useConfigStore.setState({ aiProviders: providers });
                logService.info(`Configuration IA chargée via stream: ${providers.length} providers`, 'AuthReload');
              } else if (message.type === 'config_update') {
                // Mettre à jour la configuration
                const { config } = message;
                const providers = Array.isArray(config?.providers) ? config.providers : [];
                useConfigStore.setState((state) => ({
                  aiProviders: providers.length > 0 ? providers : state.aiProviders
                }));
              }
            },
            onError: (error) => {
              logService.error('Erreur stream config', 'AuthReload', { error: error.type });
              // Attendre un peu avant le fallback pour éviter les requêtes simultanées
              setTimeout(() => {
                loadAIProviders().catch(err => 
                  logService.warning('Impossible de charger la config via API', 'AuthReload', { error: err.message })
                );
              }, 2000);
            }
          });

          // Stream des événements d'administration
          streamService.startStream('admin', {
            onMessage: (message) => {
              if (message.type === 'admin_initial') {
                // Charger les données initiales d'administration
                const { data } = message;
                logService.info(`Données admin initiales chargées via stream: ${data.users_count} utilisateurs`, 'AuthReload');
              } else if (message.type === 'user_management') {
                // Mettre à jour la liste des utilisateurs
                const { event_type, user } = message;
                logService.info(`Événement utilisateur reçu: ${event_type}`, 'AuthReload', { user });
                // Ici on pourrait mettre à jour un store d'utilisateurs si nécessaire
              } else if (message.type === 'system_metrics_update') {
                // Mettre à jour les métriques système
                const { metrics } = message;
                logService.info('Métriques système mises à jour via stream', 'AuthReload', { metrics });
                // Ici on pourrait mettre à jour un store de métriques système
              }
            },
            onError: (error) => {
              logService.error('Erreur stream admin', 'AuthReload', { error: error.type });
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
          
          // En cas d'échec global des streams, charger toutes les données via API classique
          try {
            await loadAIProviders();
            await loadAnalyses();
            await loadPrompts();
            logService.info('Données chargées via API classique après échec des streams', 'AuthReload');
          } catch (apiError) {
            logService.error('Impossible de charger les données via API classique', 'AuthReload', {
              error: apiError instanceof Error ? apiError.message : String(apiError)
            });
          }
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

  // Vérification périodique de la validité du token
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenInterval = setInterval(() => {
      if (!checkAuthToken()) {
        logService.warning('Token d\'authentification expiré, déconnexion automatique', 'AuthReload');
        logout();
      }
    }, 60000); // Vérifier toutes les minutes

    return () => clearInterval(checkTokenInterval);
  }, [isAuthenticated, logout]);
};
