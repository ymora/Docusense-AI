import React, { useState, useEffect } from 'react';
import LeftPanel from './LeftPanel';
import MainPanel from './MainPanel';

import { StartupLoader } from '../UI/StartupLoader';

import { useUIStore } from '../../stores/uiStore';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';
import { useStartupInitialization } from '../../hooks/useStartupInitialization';
import { useAuthReload } from '../../hooks/useAuthReload';
import useAuthStore from '../../stores/authStore';
import { logService } from '../../services/logService';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useThemeSync } from '../../hooks/useThemeSync';

import { BackendStatusIndicator } from '../UI/BackendStatusIndicator';


const Layout: React.FC = () => {
  const { selectedFile, selectedFiles, selectFile, markFileAsViewed, files } = useFileStore();
  const { analyses } = useAnalysisStore();
  const { isInitialized, isLoading, initializationStep } = useStartupInitialization();
  const { sidebarWidth, setSidebarWidth, activePanel, setActivePanel } = useUIStore();
  const { colors } = useColors();
  const { isAuthenticated } = useAuthStore();
  
  // Recharger les données après authentification
  useAuthReload();
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartWidth, setResizeStartWidth] = useState<number | null>(null);
  
  // Utiliser le système centralisé de gestion du thème
  const { theme, toggleTheme, isDark } = useThemeSync();
  
  // États pour l'authentification (maintenant géré par le store)
  
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

          let downloadUrl = `/api/files/download-by-path/${encodeURIComponent(file.path)}`;
          
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = file.name || 'download';
          link.target = '_self';
          link.rel = 'noopener noreferrer';
          link.href += `?t=${Date.now()}`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

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

          const downloadUrl = `/api/download/directory/${encodeURIComponent(file.path)}`;
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${file.name || 'folder'}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

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
           const response = await fetch(`/api/files/analyze-directory`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ directory_path: file.path })
           });
           if (response.ok) {
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
           const response = await fetch(`/api/files/analyze-directory-supported`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ directory_path: file.path })
           });
           if (response.ok) {
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
          const downloadUrl = `/api/files/download-multiple`;
          
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
          
          const response = await fetch(downloadUrl, {
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
  }, [selectedFiles, selectFile, setActivePanel]);



  // Fonction pour ajouter des fichiers en attente d'analyse
  const handleAddToQueue = async (fileIds: (number | string)[]) => {
    try {
      // Ajouter les fichiers à la queue d'analyse
      const queuePromises = fileIds.map(async (fileId) => {
        try {
          // Trouver le fichier dans la liste actuelle
          let file = files.find(f => f.id === fileId || f.path === fileId);
          
                     // Si pas trouvé localement, ignorer le fichier
           if (!file) {
             logService.warning(`Fichier ${fileId} non trouvé localement`, 'Layout', { fileId });
             return null;
           }
          
          if (!file) {
            logService.error('Fichier non trouvé pour l\'ID', 'Layout', { fileId });
            return null;
          }
          
                     // Créer une analyse en attente (simulation)
           logService.info(`Analyse en attente créée pour: ${file.name}`, 'Layout', { 
             filePath: file.path,
             fileId: file.id 
           });
          
                     // Retourner un objet simulé pour la compatibilité
           return { success: true, file: file.name };
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
        setActivePanel(panel as 'viewer' | 'queue' | 'logs' | 'system' | 'ai-config' | 'users' | 'api-docs');
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
               <MainPanel 
                 activePanel={activePanel} 
                 onSetActivePanel={setActivePanel}
               />
             </div>
          </>
        </>
        
        {/* Overlay de floutage avec interface de connexion professionnelle */}
        {!isAuthenticated && (
          <div 
            className="fixed inset-0 z-40 pointer-events-none"
            style={{
              backdropFilter: 'blur(3px)',
              backgroundColor: 'rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Interface de connexion centrée */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <div 
                className="px-10 py-8 rounded-xl shadow-2xl text-center max-w-lg w-full mx-6 relative"
                style={{
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`,
                }}
              >
                {/* Icône jour/nuit en haut à droite */}
                <button
                  onClick={toggleTheme}
                  className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    color: colors.textSecondary,
                  }}
                  title={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
                >
                  {isDark ? (
                    <SunIcon className="w-5 h-5" />
                  ) : (
                    <MoonIcon className="w-5 h-5" />
                  )}
                </button>
                                 {/* Logo et titre */}
                 <div className="mb-8">
                   <div className="text-3xl mb-3" style={{ color: colors.primary }}>
                     🔐
                   </div>
                   <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
                     DocuSense AI
                   </h1>
                   <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                     Accédez à votre espace de travail
                   </p>
                   
                   {/* Indicateur de statut backend */}
                   <div className="mt-4 flex items-center justify-center">
                     <BackendStatusIndicator size="sm" />
                   </div>
                 </div>
                
                {/* Boutons de connexion */}
                <div className="space-y-4">
                  {/* Connexion utilisateur - Bouton principal */}
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openLoginModal'));
                    }}
                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-lg transition-all duration-300 font-semibold text-base hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: colors.primary,
                      color: 'white',
                      boxShadow: `0 4px 14px 0 ${colors.primary}40`,
                    }}
                  >
                    <span className="text-lg">👤</span>
                    <span>Se connecter</span>
                  </button>
                  
                  {/* Connexion invité - Bouton secondaire */}
                  <button
                    onClick={async () => {
                      // La méthode loginAsGuest gère maintenant le mode local automatiquement
                      await useAuthStore.getState().loginAsGuest();
                    }}
                    className="w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-lg transition-all duration-300 font-medium text-base hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: 'transparent',
                      border: `2px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  >
                    <span className="text-lg">👁️</span>
                    <span>Mode invité</span>
                  </button>
                  
                  {/* Séparateur */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: colors.border }}></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="px-2" style={{ backgroundColor: colors.surface, color: colors.textSecondary }}>
                        ou
                      </span>
                    </div>
                  </div>
                  
                  {/* Inscription - Bouton tertiaire */}
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openRegisterModal'));
                    }}
                    className="w-full flex items-center justify-center space-x-3 px-6 py-3 rounded-lg transition-all duration-300 font-medium text-sm hover:bg-opacity-80"
                    style={{
                      backgroundColor: 'transparent',
                      color: colors.textSecondary,
                    }}
                  >
                    <span className="text-base">➕</span>
                    <span>Créer un compte</span>
                  </button>
                </div>
                
                {/* Footer */}
                <div className="mt-8 pt-6 border-t" style={{ borderColor: colors.border }}>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    Sécurisé et optimisé pour votre productivité
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
    </>
  );
};

export default Layout;