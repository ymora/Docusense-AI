import React, { useState, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import LeftPanel from './LeftPanel';
import MainPanel from './MainPanel';
import PromptSelector from '../FileManager/PromptSelector';
import { StartupLoader } from '../UI/StartupLoader';
import { useUIStore } from '../../stores/uiStore';
import { useQueueStore } from '../../stores/queueStore';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';
import { useStartupInitialization } from '../../hooks/useStartupInitialization';
import { analysisService } from '../../services/analysisService';
import { queueService } from '../../services/queueService';
import { promptService } from '../../services/promptService';

const Layout: React.FC = () => {
  const { selectedFile, selectedFiles, selectFile, markFileAsViewed, files } = useFileStore();
  const { queueItems, loadQueueStatus, loadQueueItems } = useQueueStore();
  const { isInitialized, isLoading, initializationStep } = useStartupInitialization();
  const { sidebarWidth, setSidebarWidth, activePanel, setActivePanel } = useUIStore();
  const { colors } = useColors();
  const [isResizing, setIsResizing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // États pour les actions de fichiers
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [promptSelectorMode, setPromptSelectorMode] = useState<'single' | 'comparison' | 'batch' | 'multiple_ai'>('single');
  const [promptSelectorFileIds, setPromptSelectorFileIds] = useState<number[]>([]);

  // L'application est maintenant initialisée automatiquement via le hook useStartupInitialization

  // Gestion des actions de fichiers (menu contextuel)
  useEffect(() => {
    const handleFileAction = (event: CustomEvent) => {
      const { action, file } = event.detail;
      
      if (action === 'view' && file) {
        // Sélectionner le fichier pour l'afficher dans le MainPanel
        selectFile(file);
        setActivePanel('main');
      } else if (action === 'download' && file) {
        // Télécharger le fichier directement
        try {
          console.log('🎯 Téléchargement du fichier:', {
            name: file.name,
            path: file.path,
            id: file.id,
            mime_type: file.mime_type
          });
          
          let downloadUrl;
          
          // Utiliser l'endpoint approprié selon si le fichier a un ID ou non
          if (file.id && file.id !== null) {
            // Fichier avec ID (supporté) - utiliser l'endpoint par ID
            downloadUrl = `/api/files/${file.id}/download`;
            console.log('🎯 Utilisation de l\'endpoint par ID:', downloadUrl);
          } else {
            // Fichier sans ID (non supporté) - utiliser l'endpoint par path
            downloadUrl = `/api/files/download-by-path/${encodeURIComponent(file.path)}`;
            console.log('🎯 Utilisation de l\'endpoint par path:', downloadUrl);
          }
          
          // Créer un lien temporaire pour forcer le téléchargement
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = file.name || 'download';
          link.target = '_self'; // Utiliser la même fenêtre
          link.rel = 'noopener noreferrer';
          
          // Ajouter un timestamp pour éviter le cache
          link.href += `?t=${Date.now()}`;
          
          console.log('🎯 URL finale de téléchargement:', link.href);
          
          // Ajouter le lien au DOM, cliquer dessus, puis le supprimer
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error('Erreur lors du téléchargement du fichier:', error);
        }
      } else if (action === 'analyze_ia' && file) {
        // Ajouter directement à la queue d'analyse
        const fileIds = selectedFiles && selectedFiles.length > 1
          ? selectedFiles
          : [file.id || file.path];
        handleAddToQueue(fileIds);
        // Basculer vers le panneau Analyse IA pour voir la liste
        setActivePanel('analyses');
      } else if (action === 'add_to_queue' && file) {
        const fileIds = [file.id || file.path];
        
        // Créer des analyses en attente pour le fichier
        handleAddToQueue(fileIds);
      } else if (action === 'analyze_with_prompt' && file && file.selectedPrompt) {
        const fileIds = selectedFiles && selectedFiles.length > 1
          ? selectedFiles
          : [selectedFile?.id || selectedFile?.path];
        
        // Lancer l'analyse avec le prompt sélectionné
        handleAnalyzeWithPrompt(fileIds, file.selectedPrompt);
      } else if (action === 'analyze_general' && file) {
        const fileIds = selectedFiles && selectedFiles.length > 1
          ? selectedFiles
          : [selectedFile?.id || selectedFile?.path];
        setPromptSelectorMode(fileIds.length > 1 ? 'batch' : 'single');
        setPromptSelectorFileIds(fileIds);
        setShowPromptSelector(true);
        setActivePanel('main');
      }
    };
    window.addEventListener('fileAction', handleFileAction as EventListener);
    return () => window.removeEventListener('fileAction', handleFileAction as EventListener);
  }, [setActivePanel, selectedFiles, selectedFile]);

  // Gestion de la sélection de prompt
  const handlePromptSelect = (promptId: string, prompt: any) => {
    // Ici on pourrait ajouter une notification de succès
    setShowPromptSelector(false);
  };

  // Fonction pour ajouter des fichiers en attente d'analyse
  const handleAddToQueue = async (fileIds: (number | string)[]) => {
    try {
      // Créer des analyses en attente pour chaque fichier
      const analysisPromises = fileIds.map(async (fileId) => {
        try {
          const response = await analysisService.createPendingAnalysis({
            file_id: fileId,
            prompt_id: 'default', // Utiliser le prompt par défaut
            analysis_type: 'general',
            status: 'pending'
          });
          
          // Ajouter l'analyse à la queue
          if (response.analysis_id) {
            await queueService.addToQueue(response.analysis_id, 'normal');
          }
          
          return response;
        } catch (error) {
          console.error('Erreur lors de la création de l\'analyse pour le fichier', fileId, ':', error);
          return null;
        }
      });
      
      const results = await Promise.all(analysisPromises);
      const successCount = results.filter(result => result !== null).length;
      
      // Recharger la queue pour afficher les nouveaux éléments
      await loadQueueItems();
      await loadQueueStatus();
      
      // Les analyses créées sont maintenant visibles directement dans la liste des analyses
      if (successCount > 0) {
        // Déclencher des événements pour recharger les listes
        window.dispatchEvent(new CustomEvent('reloadAnalyses'));
        window.dispatchEvent(new CustomEvent('reloadQueue'));
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout en attente:', error);
      
      // Message d'erreur plus informatif
      let errorMessage = 'Erreur lors de l\'ajout en attente d\'analyse';
      
      if (error instanceof Error) {
        if (error.message.includes('No functional AI providers')) {
          errorMessage = 'Aucun provider IA fonctionnel disponible. Veuillez configurer un provider IA dans les paramètres.';
        } else if (error.message.includes('File not found')) {
          errorMessage = 'Fichier non trouvé. Vérifiez que le fichier existe toujours.';
        } else {
          errorMessage = `Erreur: ${error.message}`;
        }
      }
      
      console.error('Erreur lors de l\'ajout en attente:', errorMessage);
    }
  };

  // Fonction pour analyser avec un prompt spécifique
  const handleAnalyzeWithPrompt = async (fileIds: (number | string)[], prompt: any) => {
    try {
      if (fileIds.length === 1) {
        // Analyse d'un seul fichier
        const response = await promptService.analyzeFileWithPriority(
          Number(fileIds[0]), 
          prompt.id, 
          ['openai', 'anthropic', 'google']
        );
      } else {
        // Analyse de plusieurs fichiers
        const response = await promptService.analyzeBatchWithPriority(
          fileIds.map(id => Number(id)), 
          prompt.id, 
          ['openai', 'anthropic', 'google']
        );
      }
      
      // Recharger les données si nécessaire
      // await loadQueueItems();
      // await loadQueueStatus();
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse avec prompt:', error);
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
    loadQueueStatus();
    loadQueueItems();
    
    // Démarrer les mises à jour en temps réel
    // Gestion des mises à jour en temps réel
    
    return () => {
      // Nettoyage des mises à jour en temps réel
    };
  }, [loadQueueStatus, loadQueueItems]);



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
      setSidebarWidth(Math.max(200, Math.min(600, newWidth)));
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
    let optimalWidth = 250;
    if (avgFileNameLength > 30) optimalWidth += 50;
    if (avgFileNameLength > 50) optimalWidth += 50;
    
    return Math.max(200, Math.min(500, optimalWidth));
  };

  // Redimensionnement automatique
  const handleAutoResize = () => {
    const optimalWidth = calculateOptimalWidth();
    setSidebarWidth(optimalWidth);
  };

  // Gestion du redimensionnement de la fenêtre
  useEffect(() => {
    const handleWindowResize = () => {
      if (sidebarWidth > window.innerWidth * 0.8) {
        setSidebarWidth(window.innerWidth * 0.4);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [sidebarWidth, setSidebarWidth]);

  // Gestionnaires de boutons
  const handleAnalysesButtonClick = () => {
    // Toggle : si on est déjà sur analyses, revenir à main, sinon aller à analyses
    if (activePanel === 'analyses') {
      setActivePanel('main');
    } else {
      setActivePanel('analyses');
    }
  };

  const handleConfigButtonClick = () => {
    // Toggle : si on est déjà sur config, revenir à main, sinon aller à config
    if (activePanel === 'config') {
      setActivePanel('main');
    } else {
      setActivePanel('config');
    }
  };

  // Styles des boutons
  const getButtonStyles = (isActive: boolean) => ({
    backgroundColor: isActive ? colors.primary : 'transparent',
    color: isActive ? colors.background : colors.textSecondary,
  });





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
        className="flex min-h-screen-dynamic"
        style={{ backgroundColor: colors.background }}
      >
      {/* Panneau de gauche */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{
          width: sidebarWidth,
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.border}`,
        }}
        onDoubleClick={handleAutoResize}
        title="Double-clic pour redimensionner automatiquement"
      >
        <LeftPanel />
      </div>

      {/* Séparateur redimensionnable */}
      <div
        className="w-1 cursor-col-resize transition-colors"
        style={{
          backgroundColor: colors.border,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.border;
        }}
        onMouseDown={handleResizeStart}
      />

      {/* Panneau principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barre d'outils */}
        <div
          className="flex items-center justify-between p-4"
          style={{
            backgroundColor: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center space-x-4">


            
            
            {/* Bouton Analyse IA */}
            <div className="flex items-center space-x-2">
              <div className="w-px h-6 bg-slate-600"></div>
              <button
                onClick={handleAnalysesButtonClick}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activePanel === 'analyses' ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                style={getButtonStyles(activePanel === 'analyses')}
                title={!queueItems || queueItems.length === 0 ? "Aucune analyse terminée - Lancez des analyses pour voir les analyses IA" : "Voir les analyses IA"}
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>Analyse IA {queueItems && queueItems.length > 0 && `(${queueItems.length})`}</span>
              </button>
            </div>



            {/* Navigation entre fichiers */}
            {((selectedFile && selectedFile.id) || selectedFiles.length > 0) && files.length > 1 && (
              <div className="flex items-center space-x-2">
                <div className="w-px h-6 bg-slate-600"></div>
                <button
                  onClick={() => navigateToFile('prev')}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Fichier précédent (←)"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigateToFile('next')}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Fichier suivant (→)"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Bouton configuration */}
            <button
              onClick={handleConfigButtonClick}
              className="p-2 transition-colors"
              style={{
                color: activePanel === 'config' ? colors.primary : colors.textSecondary,
              }}
              onMouseEnter={(e) => {
                if (activePanel !== 'config') {
                  e.currentTarget.style.color = colors.text;
                }
              }}
              onMouseLeave={(e) => {
                if (activePanel !== 'config') {
                  e.currentTarget.style.color = colors.textSecondary;
                }
              }}
              title="Configuration des providers IA"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>

            {/* Bouton thème jour/nuit */}
            <button
              onClick={toggleTheme}
              className="p-2 transition-colors"
              style={{
                color: colors.textSecondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.textSecondary;
              }}
              title={isDarkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-hidden">
          <MainPanel 
            activePanel={activePanel} 
            onSetActivePanel={setActivePanel}
          />
        </div>
        
        {/* PromptSelector pour les analyses IA */}
        <PromptSelector
          isOpen={showPromptSelector}
          onClose={() => setShowPromptSelector(false)}
          onPromptSelect={handlePromptSelect}
          fileIds={promptSelectorFileIds}
          mode={promptSelectorMode}
        />

      </div>
    </div>
    </>
  );
};

export default Layout;