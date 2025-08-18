import React, { useState, useEffect } from 'react';
import LeftPanel from './LeftPanel';
import MainPanel from './MainPanel';

import { StartupLoader } from '../UI/StartupLoader';
import { useUIStore } from '../../stores/uiStore';
import { useQueueStore } from '../../stores/queueStore';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';
import { useStartupInitialization } from '../../hooks/useStartupInitialization';
import { analysisService } from '../../services/analysisService';
import { queueService } from '../../services/queueService';
import { promptService } from '../../services/promptService';
import { fileService } from '../../services/fileService';
import { logService } from '../../services/logService';


const Layout: React.FC = () => {
  const { selectedFile, selectedFiles, selectFile, markFileAsViewed, files } = useFileStore();
  const { queueItems, loadQueueItems } = useQueueStore();
  const { isInitialized, isLoading, initializationStep } = useStartupInitialization();
  const { sidebarWidth, setSidebarWidth, activePanel, setActivePanel } = useUIStore();
  const { colors } = useColors();
  const [isResizing, setIsResizing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // États pour les actions de fichiers

  


  // L'application est maintenant initialisée automatiquement via le hook useStartupInitialization

  // Gestion des actions de fichiers (menu contextuel)
  useEffect(() => {
    const handleFileAction = async (event: CustomEvent) => {
      const { action, file } = event.detail;
      
      if (action === 'view' && file) {
        // Sélectionner le fichier pour l'afficher dans le MainPanel
        selectFile(file);
        setActivePanel('main');
      } else if (action === 'download_file' && file) {
        // Télécharger un fichier individuel
        try {
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
        } catch (error) {
          logService.error('Erreur lors du téléchargement du fichier', 'Layout', { error: error.message, file: file.name });
        }
             } else if (action === 'download_directory' && file) {
        // Télécharger le dossier en ZIP
        try {
          const downloadUrl = `/api/download/directory/${encodeURIComponent(file.path)}`;
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${file.name || 'folder'}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          logService.error('Erreur lors du téléchargement du dossier', 'Layout', { error: error.message, file: file.name });
        }
             } else if (action === 'explore_directory' && file) {
         // Explorer le contenu du dossier
         selectFile(file);
         setActivePanel('main');
       } else if (action === 'view_directory_thumbnails' && file) {
         // Visualiser tous les fichiers du dossier en miniatures
         selectFile(file);
         setActivePanel('main');
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
             setActivePanel('analyses');
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
             setActivePanel('analyses');
           } else {
             logService.error('Erreur lors de l\'analyse des fichiers supportés du dossier', 'Layout', { directory: file.path });
           }
         } catch (error) {
           logService.error('Erreur lors de l\'analyse des fichiers supportés du dossier', 'Layout', { error: error.message, directory: file.path });
         }
       } else if (action === 'view_directory_analyses' && file) {
        // Voir les analyses du dossier
        setActivePanel('analyses');
        window.dispatchEvent(new CustomEvent('filterAnalysesByDirectory', {
          detail: { directoryPath: file.path }
        }));
      } else if (action === 'retry_analysis' && file) {
        // Relancer l'analyse avec un nouveau prompt
        const fileIds = [file.id || file.path];
        handleAddToQueue(fileIds);
        setActivePanel('analyses');
      } else if (action === 'compare_analyses' && file) {
        // Comparer les analyses du fichier
        setActivePanel('analyses');
        window.dispatchEvent(new CustomEvent('compareAnalyses', {
          detail: { fileId: file.id, filePath: file.path }
        }));
      } else if (action === 'analyze_multiple' && file) {
        // Analyser tous les fichiers sélectionnés
        handleAddToQueue(selectedFiles);
        setActivePanel('analyses');
      } else if (action === 'compare_multiple' && file) {
        // Comparer les analyses des fichiers sélectionnés
        setActivePanel('analyses');
        window.dispatchEvent(new CustomEvent('compareMultipleAnalyses', {
          detail: { fileIds: selectedFiles }
        }));
             } else if (action === 'add_to_queue' && file) {
        const fileIds = [file.id || file.path];
        handleAddToQueue(fileIds);
      } else if (action === 'view_analyses' && file) {
        // Basculer vers l'onglet Analyses IA et filtrer par fichier
        setActivePanel('analyses');
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
          
          // Si pas trouvé localement, essayer de le récupérer depuis le service
          if (!file && typeof fileId === 'number') {
            try {
              file = await fileService.getFileById(fileId);
              logService.info(`Fichier trouvé par service: ${file.name}`, 'Layout', { fileId: file.id });
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
          const analysisResponse = await analysisService.createPendingAnalysis({
            file_path: file.path,
            prompt_id: 'default',
            analysis_type: 'general',
            custom_prompt: ''
          });
          
          // Ajouter à la queue
          if (analysisResponse && analysisResponse.analysis_id) {
            await queueService.addToQueue(analysisResponse.analysis_id, 'normal');
          }
          
          return analysisResponse;
        } catch (error) {
          logService.error('Erreur pour le fichier', 'Layout', { fileId, error: error.message });
          return null;
        }
      });
      
      const results = await Promise.all(queuePromises);
      const successCount = results.filter(result => result !== null).length;
      
      if (successCount > 0) {
        await loadQueueItems();

        setActivePanel('analyses');
      }
      
            } catch (error) {
          logService.error('Erreur lors de l\'ajout à la queue', 'Layout', { error: error.message });
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
    
    loadQueueItems();
    
    // Démarrer les mises à jour en temps réel
    // Gestion des mises à jour en temps réel
    
    return () => {
      // Nettoyage des mises à jour en temps réel
    };
      }, [loadQueueItems]);



  // Écouteur pour l'affichage des fichiers dans le MainPanel
  useEffect(() => {
    const handleViewFileInMainPanel = (event: CustomEvent) => {
      const { file, mode } = event.detail;
      
      if (file) {
        // Sélectionner le fichier dans le store
        selectFile(file);
        
        // S'assurer que le MainPanel est actif
        setActivePanel('main');
      }
    };

    window.addEventListener('viewFileInMainPanel', handleViewFileInMainPanel as EventListener);
    return () => window.removeEventListener('viewFileInMainPanel', handleViewFileInMainPanel as EventListener);
  }, [selectFile, setActivePanel]);

  // Écouteur pour changer de panneau depuis d'autres composants
  useEffect(() => {
    const handleSetActivePanel = (event: CustomEvent) => {
      const { panel } = event.detail;
      if (panel && ['main', 'config', 'analyses', 'queue'].includes(panel)) {
        setActivePanel(panel as 'main' | 'config' | 'analyses' | 'queue');
      }
    };

    window.addEventListener('setActivePanel', handleSetActivePanel as EventListener);
    return () => window.removeEventListener('setActivePanel', handleSetActivePanel as EventListener);
  }, [setActivePanel]);

  // Gestion du redimensionnement
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
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
              logService.info('Redimensionnement du panneau', 'Layout', { newWidth, maxSidebarWidth, clampedWidth });
      setSidebarWidth(clampedWidth);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
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
      // Si la sidebar dépasse 1/2 de la largeur, la redimensionner
      if (sidebarWidth > window.innerWidth * 0.5) {
        setSidebarWidth(window.innerWidth * 0.5);
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
      

      
      <div
        className="flex h-screen"
        style={{ backgroundColor: colors.background }}
      >
      {/* Panneau de gauche */}
      <div
        className="overflow-hidden"
        style={{
          width: sidebarWidth,
          minWidth: '200px',
          maxWidth: '33%',
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
        className="w-2 cursor-col-resize transition-colors hover:w-3"
        style={{
          backgroundColor: isResizing ? colors.primary : colors.border,
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
      />

      {/* Panneau principal */}
      <div className="flex-1 flex flex-col">
        
        {/* Contenu principal */}
        <div className="flex-1">
          <MainPanel 
            activePanel={activePanel} 
            onSetActivePanel={setActivePanel}
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default Layout;