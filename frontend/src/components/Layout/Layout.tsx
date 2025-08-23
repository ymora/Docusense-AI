import React, { useState, useEffect } from 'react';
import LeftPanel from './LeftPanel';
import MainPanel from './MainPanel';

import { StartupLoader } from '../UI/StartupLoader';
import { UserIcon } from '../UI/UserIcon';
import { useUIStore } from '../../stores/uiStore';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';
import { useStartupInitialization } from '../../hooks/useStartupInitialization';
import { useFileService } from '../../hooks/useFileService';
import { useAnalysisService } from '../../hooks/useAnalysisService';
import useAuthStore from '../../stores/authStore';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { CpuChipIcon, UserIcon as UserIconHero, EyeIcon, PlusIcon } from '@heroicons/react/24/outline';

import { logService } from '../../services/logService';

// Composant de notification d'erreur
const ErrorNotification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  const { colors } = useColors();
  
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div 
        className="p-4 rounded-lg shadow-lg border-l-4 flex items-center justify-between"
        style={{
          backgroundColor: colors.surface,
          borderColor: '#ef4444',
          borderLeftColor: '#ef4444',
        }}
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">⚠️</span>
          <span style={{ color: colors.text }} className="text-sm">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600"
          style={{ color: colors.textSecondary }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Composant de notification de succès
const SuccessNotification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  const { colors } = useColors();
  
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div 
        className="p-4 rounded-lg shadow-lg border-l-4 flex items-center justify-between"
        style={{
          backgroundColor: colors.surface,
          borderColor: '#22c55e',
          borderLeftColor: '#22c55e',
        }}
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">✅</span>
          <span style={{ color: colors.text }} className="text-sm">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600"
          style={{ color: colors.textSecondary }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const Layout: React.FC = () => {
  const { selectedFile, selectedFiles, selectFile, markFileAsViewed, files } = useFileStore();
  const { analyses } = useAnalysisStore();
  const { isInitialized, isLoading, initializationStep } = useStartupInitialization();
  const { sidebarWidth, setSidebarWidth, activePanel, setActivePanel } = useUIStore();
  const { colors } = useColors();
  const { isAuthenticated, setUser, setTokens, setAuthenticated, accessToken, refreshToken } = useAuthStore();
  const { loginAsGuest } = useUnifiedAuth();
  const fileService = useFileService();
  const analysisService = useAnalysisService();
  const [isResizing, setIsResizing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [resizeStartWidth, setResizeStartWidth] = useState<number | null>(null);
  
  // États pour les notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Gestionnaire d'erreurs global
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Erreur globale détectée:', event.error);
      setErrorMessage('Une erreur inattendue s\'est produite. Veuillez rafraîchir la page.');
      
      // Log de l'erreur
      logService.error('Erreur globale', 'Layout', {
        error: event.error?.message || 'Erreur inconnue',
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Promesse rejetée non gérée:', event.reason);
      setErrorMessage('Une erreur de communication s\'est produite. Veuillez réessayer.');
      
      // Log de l'erreur
      logService.error('Promesse rejetée', 'Layout', {
        reason: event.reason?.message || String(event.reason),
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  // Vérification d'authentification au démarrage
  useEffect(() => {
    const { user } = useAuthStore.getState();
    
    // Si l'utilisateur n'a pas de tokens, forcer la déconnexion
    if (!accessToken && !refreshToken) {
      setUser(null);
      setTokens('', '');
      setAuthenticated(false);
    } else if (accessToken && !isAuthenticated) {
      // Si on a des tokens mais que isAuthenticated est false, corriger l'état
      setAuthenticated(true);
    } else if (isAuthenticated && !user) {
      // Si on est authentifié mais sans utilisateur, forcer la déconnexion
      setUser(null);
      setTokens('', '');
      setAuthenticated(false);
    }
  }, [accessToken, refreshToken, isAuthenticated, setUser, setTokens, setAuthenticated]);

  // Vérification des permissions pour le panneau actif
  useEffect(() => {
    const { isAdmin } = useAuthStore.getState();
    
    // Si l'utilisateur n'est pas admin et que le panneau actif est admin, rediriger
    if (!isAdmin() && (activePanel === 'logs' || activePanel === 'system' || activePanel === 'ai-config' || activePanel === 'users' || activePanel === 'api-docs')) {
      logService.info('Redirection automatique - changement d\'utilisateur', 'Layout', {
        fromPanel: activePanel,
        toPanel: 'queue',
        reason: 'Utilisateur non-admin détecté sur panneau admin',
        timestamp: new Date().toISOString()
      });
      setActivePanel('queue');
    }
  }, [isAuthenticated, activePanel, setActivePanel]);
  
  // États pour les actions de fichiers

  


  // L'application est maintenant initialisée automatiquement via le hook useStartupInitialization

  // L'authentification est maintenant gérée par le store useAuthStore

  // Basculement automatique vers l'onglet visualisation quand un fichier est sélectionné
  useEffect(() => {
    if (selectedFile && activePanel !== 'viewer') {
      logService.info('Basculement automatique vers l\'onglet visualisation', 'Layout', {
        fileName: selectedFile.name,
        filePath: selectedFile.path,
        fromPanel: activePanel,
        toPanel: 'viewer',
        timestamp: new Date().toISOString()
      });
      setActivePanel('viewer');
    }
  }, [selectedFile, setActivePanel]);

  // Gestion des actions de fichiers (menu contextuel)
  useEffect(() => {
    const handleFileAction = async (event: CustomEvent) => {
      const { action, file } = event.detail;
      
      logService.info('Action sur fichier reçue', 'Layout', {
        action: action,
        fileName: file?.name,
        filePath: file?.path,
        timestamp: new Date().toISOString()
      });
      
      if (action === 'view' && file) {
        // Sélectionner le fichier pour l'afficher dans le MainPanel
        selectFile(file);
        setActivePanel('viewer');
      } else if (action === 'download_file' && file) {
        // Télécharger un fichier individuel
        try {
          logService.info('Téléchargement de fichier individuel', 'Layout', {
            fileName: file.name,
            filePath: file.path,
            timestamp: new Date().toISOString()
          });

          const response = await fileService.downloadFile(`/api/files/download-by-path/${encodeURIComponent(file.path)}?t=${Date.now()}`);
          
          if (response) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }

          logService.info('Téléchargement de fichier individuel terminé', 'Layout', {
            fileName: file.name,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          logService.error('Erreur lors du téléchargement du fichier', 'Layout', { 
            error: error.message, 
            file: file.name,
            timestamp: new Date().toISOString()
          });
        }
      } else if (action === 'download_directory' && file) {
        // Télécharger le dossier en ZIP
        try {
          logService.info('Téléchargement de dossier en ZIP', 'Layout', {
            folderName: file.name,
            folderPath: file.path,
            timestamp: new Date().toISOString()
          });

          const response = await fileService.downloadFile(`/api/download/directory/${encodeURIComponent(file.path)}`);
          
          if (response) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${file.name || 'folder'}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }

          logService.info('Téléchargement de dossier en ZIP terminé', 'Layout', {
            folderName: file.name,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          logService.error('Erreur lors du téléchargement du dossier', 'Layout', { 
            error: error.message, 
            file: file.name,
            timestamp: new Date().toISOString()
          });
        }
      } else if (action === 'explore_directory' && file) {
        // Explorer le contenu du dossier
        selectFile(file);
        setActivePanel('viewer');
      } else if (action === 'view_directory_thumbnails' && file) {
        // Visualiser tous les fichiers du dossier en miniatures
        selectFile(file);
        setActivePanel('viewer');
        // Déclencher l'affichage en mode miniatures
        window.dispatchEvent(new CustomEvent('viewDirectoryThumbnails', {
          detail: { directoryPath: file.path }
        }));
      } else if (action === 'analyze_directory' && file) {
        // Analyser tous les fichiers du dossier
        try {
          const result = await fileService.analyzeDirectory(file.path);
          if (result.success) {
            setActivePanel('queue');
          } else {
            logService.error('Erreur lors de l\'analyse du dossier', 'Layout', { directory: file.path });
          }
        } catch (error) {
          logService.error('Erreur lors de l\'analyse du dossier', 'Layout', { error: error.message, directory: file.path });
        }
      } else if (action === 'analyze_directory_supported' && file) {
        // Analyser uniquement les fichiers supportés du dossier
        try {
          const result = await fileService.analyzeDirectory(file.path);
          if (result.success) {
            setActivePanel('queue');
          } else {
            logService.error('Erreur lors de l\'analyse des fichiers supportés du dossier', 'Layout', { directory: file.path });
          }
        } catch (error) {
          logService.error('Erreur lors de l\'analyse des fichiers supportés du dossier', 'Layout', { error: error.message, directory: file.path });
        }
      } else if (action === 'view_directory_analyses' && file) {
        // Voir les analyses du dossier
        setActivePanel('queue');
        window.dispatchEvent(new CustomEvent('filterAnalysesByDirectory', {
          detail: { directoryPath: file.path }
        }));
      } else if (action === 'retry_analysis' && file) {
        // Relancer l'analyse avec un nouveau prompt
        const fileIds = [file.id || file.path];
        handleAddToQueue(fileIds);
        setActivePanel('queue');
      } else if (action === 'compare_analyses' && file) {
        // Comparer les analyses du fichier
        setActivePanel('queue');
        window.dispatchEvent(new CustomEvent('compareAnalyses', {
          detail: { fileId: file.id, filePath: file.path }
        }));
      } else if (action === 'analyze_multiple' && file) {
        // Analyser tous les fichiers sélectionnés
        handleAddToQueue(selectedFiles);
        setActivePanel('queue');
      } else if (action === 'compare_multiple' && file) {
        // Comparer les analyses des fichiers sélectionnés
        setActivePanel('queue');
        window.dispatchEvent(new CustomEvent('compareMultipleAnalyses', {
          detail: { fileIds: selectedFiles }
        }));
      } else if (action === 'add_to_queue' && file) {
        const fileIds = [file.id || file.path];
        handleAddToQueue(fileIds);
      } else if (action === 'view_analyses' && file) {
        // Basculer vers l'onglet Analyses IA et filtrer par fichier
        setActivePanel('queue');
        window.dispatchEvent(new CustomEvent('filterAnalysesByFile', {
          detail: { filePath: file.path }
        }));
      } else if (action === 'download_multiple' && file) {
        // Téléchargement ZIP pour plusieurs fichiers sélectionnés
        try {
          const filePaths = [];
          selectedFiles.forEach((fileId) => {
            const file = files.find(f => f.id === fileId || f.path === fileId);
            if (file) {
              filePaths.push(file.path);
            }
          });
          
          if (filePaths.length === 0) {
            logService.error('Aucun fichier valide trouvé pour le téléchargement ZIP', 'Layout', { selectedFiles: selectedFiles.length });
            return;
          }
          
          const response = await fetch('/api/files/download-multiple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_paths: filePaths,
              zip_name: `documents_${new Date().toISOString().slice(0, 10)}.zip`
            })
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `documents_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else {
            logService.error('Erreur lors du téléchargement ZIP', 'Layout', { status: response.statusText });
          }
        } catch (error) {
          logService.error('Erreur lors du téléchargement ZIP', 'Layout', { error: error.message });
        }
      }
    };

    // Écouter les événements d'action de fichiers
    window.addEventListener('fileAction', handleFileAction as EventListener);
    
    return () => {
      window.removeEventListener('fileAction', handleFileAction as EventListener);
    };
  }, [selectedFiles, selectFile, setActivePanel, analysisService]);

  // Fonction pour ajouter des fichiers en attente d'analyse
  const handleAddToQueue = async (fileIds: (number | string)[]) => {
    try {
      // Ajouter les fichiers à la queue d'analyse
      const queuePromises = fileIds.map(async (fileId) => {
        try {
          // Trouver le fichier dans la liste actuelle
          let file = files.find(f => f.id === fileId || f.path === fileId);
          
          // Si pas trouvé localement, essayer de le récupérer depuis le service
          if (!file && typeof fileId === 'number') {
            try {
              // Utiliser le service unifié pour récupérer le fichier
              const fileResponse = await analysisService.getAnalysisById(fileId);
              if (fileResponse.success && fileResponse.data) {
                file = fileResponse.data;
                logService.info(`Fichier trouvé par service: ${file.name}`, 'Layout', { fileId: file.id });
              }
            } catch (error) {
              logService.warning(`Fichier ${fileId} non trouvé`, 'Layout', { error: error.message });
              return null;
            }
          }
          
          if (!file) {
            logService.error('Fichier non trouvé pour l\'ID', 'Layout', { fileId });
            return null;
          }
          
          // Créer une analyse en attente
          const analysisResponse = await analysisService.createAnalysis({
            file_id: file.id,
            analysis_type: 'general',
            provider: 'ollama',
            model: 'llama2',
            prompt: 'Analyse générale du document'
          });
          
          // L'analyse est maintenant créée directement avec le statut approprié
          
          return analysisResponse;
        } catch (error) {
          logService.error('Erreur lors de l\'ajout à la queue', 'Layout', { fileId, error: error.message });
          return null;
        }
      });

      // Attendre que tous les fichiers soient ajoutés
      const results = await Promise.all(queuePromises);
      const successCount = results.filter(r => r !== null).length;
      
      if (successCount > 0) {
        logService.info(`${successCount} fichier(s) ajouté(s) à la queue`, 'Layout', { 
          totalFiles: fileIds.length, 
          successCount 
        });
        
        // Basculer vers l'onglet queue pour voir les résultats
        setActivePanel('queue');
      }
      
    } catch (error) {
      logService.error('Erreur lors de l\'ajout en lot à la queue', 'Layout', { error: error.message });
    }
  };

  // Fonction pour la connexion invité
  const handleGuestLogin = async () => {
    try {
      logService.info('Connexion invité demandée par l\'utilisateur', 'Layout', {
        timestamp: new Date().toISOString()
      });
      
      const authResponse = await loginAsGuest();
      if (authResponse && authResponse.user) {
        logService.info('Connexion invité réussie via Layout', 'Layout', {
          userId: authResponse.user.id,
          username: authResponse.user.username,
          timestamp: new Date().toISOString()
        });
        
        setUser(authResponse.user);
        setTokens(authResponse.access_token, authResponse.refresh_token);
        setAuthenticated(true);
      } else {
        logService.error('Échec de la connexion invité via Layout', 'Layout', {
          error: authResponse?.error || 'Réponse invalide',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logService.error('Erreur de connexion invité via Layout', 'Layout', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      });
    }
  };


  // Fonction pour basculer le thème jour/nuit
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Appliquer le thème au document
    if (newDarkMode) {
      document.body.removeAttribute('data-theme');
    } else {
      document.body.setAttribute('data-theme', 'light');
    }
  };

  // Charger le statut de la queue au montage et démarrer les mises à jour en temps réel
  useEffect(() => {
    // Charger les données initiales seulement au montage
    // La queue est maintenant gérée par SSE dans QueueIAAdvanced
    
    return () => {
      // Nettoyage des mises à jour en temps réel
    };
  }, []);



  // Écouteur pour l'affichage des fichiers dans le MainPanel
  useEffect(() => {
    const handleViewFileInMainPanel = (event: CustomEvent) => {
      const { file, mode } = event.detail;
      
      if (file) {
        // Sélectionner le fichier dans le store
        selectFile(file);
        
        // S'assurer que le MainPanel est actif
        setActivePanel('viewer');
      }
    };

    window.addEventListener('viewFileInMainPanel', handleViewFileInMainPanel as EventListener);
    return () => window.removeEventListener('viewFileInMainPanel', handleViewFileInMainPanel as EventListener);
  }, [selectFile, setActivePanel]);

  // Écouteur pour changer de panneau depuis d'autres composants
  useEffect(() => {
    const handleSetActivePanel = (event: CustomEvent) => {
      const { panel } = event.detail;
      if (panel && ['viewer', 'queue', 'logs'].includes(panel)) {
        logService.info('Changement de panel programmatique', 'Layout', {
          fromPanel: activePanel,
          toPanel: panel,
          timestamp: new Date().toISOString()
        });
        setActivePanel(panel as 'viewer' | 'queue' | 'logs');
      }
    };

    window.addEventListener('setActivePanel', handleSetActivePanel as EventListener);
    return () => window.removeEventListener('setActivePanel', handleSetActivePanel as EventListener);
  }, [setActivePanel]);

  // Gestion du redimensionnement
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Début du redimensionnement, largeur actuelle: ${sidebarWidth}
    setIsResizing(true);
    setResizeStartWidth(sidebarWidth);
    
    // Empêcher la sélection de texte
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      // Le panneau gauche doit faire maximum 1/3 de la largeur totale
      const maxSidebarWidth = window.innerWidth * 0.33;
      const minSidebarWidth = 200; // Largeur minimale
      const clampedWidth = Math.max(minSidebarWidth, Math.min(maxSidebarWidth, newWidth));
      
      // Empêcher la sélection de texte pendant le redimensionnement
      e.preventDefault();
      
      // Mettre à jour la largeur immédiatement pour une réponse fluide
      if (clampedWidth !== sidebarWidth) {
        // Redimensionnement: ${JSON.stringify({ 
        //   newWidth, 
        //   maxSidebarWidth, 
        //   clampedWidth, 
        //   currentSidebarWidth: sidebarWidth,
        //   windowWidth: window.innerWidth
        // })}
        setSidebarWidth(clampedWidth);
      }
    }
  };

  const handleResizeEnd = () => {
    // Fin du redimensionnement, largeur finale: ${sidebarWidth}
    setIsResizing(false);
    setResizeStartWidth(null);
    
    // Restaurer les styles du body
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Calcul de la largeur optimale
  const calculateOptimalWidth = () => {
    const fileCount = files.length;
    const avgFileNameLength = files.reduce((acc, file) => acc + file.name.length, 0) / fileCount;
    
    // Largeur de base + ajustement selon la longueur moyenne des noms
    let optimalWidth = 300; // Largeur de base augmentée
    if (avgFileNameLength > 30) optimalWidth += 50;
    if (avgFileNameLength > 50) optimalWidth += 50;
    
    // Limiter à 1/2 de la largeur totale (plus flexible)
    const maxWidth = window.innerWidth * 0.5;
    return Math.max(200, Math.min(maxWidth, optimalWidth));
  };

  // Redimensionnement automatique
  const handleAutoResize = () => {
    const optimalWidth = calculateOptimalWidth();
    setSidebarWidth(optimalWidth);
  };

  // Redimensionner le panneau gauche à 1/3 de la largeur
  const handleResizeToThird = () => {
    const newSidebarWidth = window.innerWidth * 0.4; // 40% de la largeur (plus flexible)
    setSidebarWidth(newSidebarWidth);
  };

  // Gestion du redimensionnement de la fenêtre
  useEffect(() => {
    const handleWindowResize = () => {
      // Si la sidebar dépasse 1/3 de la largeur, la redimensionner
      if (sidebarWidth > window.innerWidth * 0.33) {
        setSidebarWidth(window.innerWidth * 0.33);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [sidebarWidth, setSidebarWidth]);







  // Navigation entre fichiers
  const navigateToFile = (direction: 'prev' | 'next') => {
    if (!selectedFile || files.length <= 1) return;
    
    const currentIndex = files.findIndex(f => f.id === selectedFile.id || f.path === selectedFile.path);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
    } else {
      newIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
    }
    
    const newFile = files[newIndex];
    if (newFile) {
      selectFile(newFile);
    }
  };

  return (
    <>
      {/* Notifications */}
      {errorMessage && (
        <ErrorNotification 
          message={errorMessage} 
          onClose={() => setErrorMessage(null)} 
        />
      )}
      {successMessage && (
        <SuccessNotification 
          message={successMessage} 
          onClose={() => setSuccessMessage(null)} 
        />
      )}
      
      <StartupLoader 
        isLoading={isLoading}
        initializationStep={initializationStep}
        isInitialized={isInitialized}
      />
      
      {/* L'authentification est maintenant gérée par le composant UserIcon */}
      

      
      <div
        className="flex h-screen overflow-hidden"
        style={{ backgroundColor: colors.background }}
      >
        {/* Contenu principal - l'authentification est gérée par le store */}
        <>
          <>
            {/* Panneau de gauche */}
            <div
              className="overflow-hidden flex-shrink-0"
              style={{
                width: `${sidebarWidth}px`,
                minWidth: '200px',
                maxWidth: `${window.innerWidth * 0.33}px`,
                backgroundColor: colors.surface,
                borderRight: `1px solid ${colors.border}`,
              }}
              onDoubleClick={handleAutoResize}
              onContextMenu={(e) => {
                e.preventDefault();
                handleResizeToThird();
              }}
              title="Double-clic pour redimensionner automatiquement, Clic droit pour redimensionner à 40%"
            >
              <LeftPanel />
            </div>

            {/* Séparateur redimensionnable */}
            <div
              className="w-2 cursor-col-resize transition-all duration-200 hover:w-3 relative group"
              style={{
                backgroundColor: isResizing ? colors.primary : colors.border,
                minWidth: '8px',
                maxWidth: '12px'
              }}
              onMouseEnter={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.backgroundColor = colors.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.backgroundColor = colors.border;
                }
              }}
              onMouseDown={handleResizeStart}
              title="Glisser pour redimensionner le panneau gauche (max 1/3 de l'écran)"
            >
              {/* Indicateur visuel */}
              <div 
                className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
              />
              
              {/* Zone invisible pour faciliter la saisie */}
              <div 
                className="absolute inset-0 w-6 -left-2 cursor-col-resize"
                style={{ backgroundColor: 'transparent' }}
                onMouseDown={handleResizeStart}
              />
            </div>

            {/* Panneau principal */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              
              {/* En-tête avec icône utilisateur */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                    DocuSense AI
                  </h1>
                </div>
                <UserIcon />
              </div>
              
              {/* Contenu principal */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <MainPanel 
                  activePanel={activePanel} 
                  onSetActivePanel={setActivePanel}
                />
              </div>
            </div>
          </>
        </>
        
        {/* Overlay de connexion - seulement si non authentifié */}
        {!isAuthenticated && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40 backdrop-blur-sm">
            <div className="w-96 p-8 rounded-xl shadow-2xl" style={{ 
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`,
            }}>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mb-4 flex justify-center">
                  ��
                </div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                  DocuSense AI
                </h1>
                <p className="text-lg" style={{ color: colors.textSecondary }}>
                  Analyse intelligente de documents
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="space-y-4">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('openLoginModal'));
                  }}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-semibold text-base"
                  style={{
                    backgroundColor: 'transparent',
                    border: `2px solid ${colors.primary}`,
                    color: colors.primary,
                  }}
                >
                  <UserIconHero className="w-5 h-5" />
                  <span>Se connecter</span>
                </button>

                <button
                  onClick={handleGuestLogin}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-semibold text-base"
                  style={{
                    backgroundColor: 'transparent',
                    border: `2px solid ${colors.primary}`,
                    color: colors.primary,
                  }}
                >
                  <EyeIcon className="w-5 h-5" />
                  <span>Invité</span>
                </button>

                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('openRegisterModal'));
                  }}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-semibold text-base"
                  style={{
                    backgroundColor: 'transparent',
                    border: `2px solid ${colors.primary}`,
                    color: colors.primary,
                  }}
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Créer un compte</span>
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
    </>
  );
};

export default Layout;