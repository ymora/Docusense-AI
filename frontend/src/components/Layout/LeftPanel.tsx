import React, { useState, useEffect } from 'react';
import DirectorySelector from '../FileManager/DirectorySelector';
import { useFileStore } from '../../stores/fileStore';
import { useQueueStore } from '../../stores/queueStore';
import { promptService } from '../../services/promptService';
import FileTree from '../FileManager/FileTree';
import { useBackendStatus } from '../../hooks/useBackendStatus';

const LeftPanel: React.FC = () => {
  const { selectedFiles, toggleFileSelection, selectFile } = useFileStore();
  const { queueItems, loadQueueItems, loadQueueStatus } = useQueueStore();
  const { isOnline, lastCheck, errorMessage, responseTime, forceCheck } = useBackendStatus();

  // État local pour la navigation
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activePanel, setActivePanel] = useState<'main' | 'config' | 'queue' | 'analyses'>('main');

  // Fonction pour basculer le thème jour/nuit
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    // Appliquer le thème au document
    if (newDarkMode) {
      // Mode nuit : retirer l'attribut data-theme
      document.body.removeAttribute('data-theme');
    } else {
      // Mode jour : ajouter l'attribut data-theme="light"
      document.body.setAttribute('data-theme', 'light');
    }
  };

  // Fermer le menu contextuel avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Fermer les menus si nécessaire
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Charger les prompts au démarrage
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        await promptService.getPrompts();
      } catch (error) {
        console.error('Erreur lors du chargement des prompts:', error);
      }
    };
    loadPrompts();
  }, []);

  // Synchronisation automatique intelligente
  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentPath) {
        try {
          await loadQueueItems();
          await loadQueueStatus();
          
          // Vérifier s'il y a des actions en cours pour ajuster la fréquence
          const hasActiveItems = queueItems.some((item: any) => 
            ['pending', 'processing'].includes(item.status)
          );
          
          // Si des actions sont en cours, synchroniser plus fréquemment
          if (hasActiveItems) {
            // Synchronisation rapide toutes les 2 secondes
            setTimeout(async () => {
              await loadQueueItems();
              await loadQueueStatus();
            }, 2000);
          }
        } catch (error) {
          console.error('Erreur lors de la synchronisation:', error);
        }
      }
    }, 8000); // Synchronisation de base toutes les 8 secondes

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentPath, loadQueueItems, loadQueueStatus, queueItems]);

  const handleDirectorySelect = async (directory: string) => {
    setCurrentPath(directory);
  };

  const navigateToParent = () => {
    if (!currentPath) return;
    
    // Si on est à la racine d'un disque (ex: 'C:'), ne rien faire
    if (/^[A-Z]:$/i.test(currentPath)) {
      return;
    }
    
    // Sinon, remonter d'un niveau
    const parts = currentPath.split(/[/\\]/).filter(Boolean);
    if (parts.length > 1) {
      let parentPath = parts.slice(0, -1).join('\\');
      // Si on arrive à un disque (ex: 'C:'), garder le format
      if (/^[A-Z]:$/i.test(parentPath)) {
        parentPath = parentPath.toUpperCase();
      }
      setCurrentPath(parentPath);
    }
  };

  // Initialiser le thème au chargement
  useEffect(() => {
    // Appliquer le thème sombre par défaut
    console.log('Initializing dark theme');
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    setIsDarkMode(true);
  }, []);

  // Fonction pour sélectionner un fichier (utilisée dans l'arborescence)
  const handleFileSelect = (file: any) => {
    selectFile(file);
  };

  // Écouter les changements d'état depuis Layout
  useEffect(() => {
    const handlePanelChange = (event: CustomEvent) => {
      setActivePanel(event.detail.panel);
    };

    window.addEventListener('panelStateChange', handlePanelChange as EventListener);

    return () => {
      window.removeEventListener('panelStateChange', handlePanelChange as EventListener);
    };
  }, []);

  return (
    <div
      className="flex flex-col h-full border-r left-panel-container"
      style={{
        backgroundColor: 'var(--surface-color)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Header avec titre et boutons uniquement */}
      <div
        className="p-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-color)' }}
      >
        {/* Header avec titre et boutons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={forceCheck}
              className={`w-2 h-2 rounded-full cursor-help transition-all duration-200 hover:scale-110 ${
                isOnline 
                  ? 'bg-green-500' 
                  : 'bg-red-500 animate-pulse'
              }`}
              title={
                isOnline
                  ? `🟢 Backend connecté\n⏱️ Temps de réponse: ${responseTime ? responseTime + 'ms' : 'N/A'}\n🕐 Dernière vérification: ${lastCheck ? 'Il y a ' + Math.floor((Date.now() - lastCheck.getTime()) / 1000) + 's' : 'Jamais'}\n💡 Cliquez pour vérifier manuellement`
                  : `🔴 Backend déconnecté\n❌ Erreur: ${errorMessage}\n🕐 Dernière vérification: ${lastCheck ? 'Il y a ' + Math.floor((Date.now() - lastCheck.getTime()) / 1000) + 's' : 'Jamais'}\n🔄 Cliquez pour réessayer`
              }
            />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-blue-400">DocuSense AI</h1>
              <span className="text-xs text-slate-400">Analyse intelligente</span>
            </div>
          </div>

          {/* Boutons de configuration IA, liste d'attente et thème alignés à droite */}
          <div className="flex items-center space-x-2">
            {/* Bouton de configuration IA */}
            <button
              onClick={() => {
                // Simuler le clic sur le bouton de config du Layout
                const event = new CustomEvent('configButtonClick');
                window.dispatchEvent(event);
                setActivePanel(activePanel === 'config' ? 'main' : 'config');
              }}
              className={`p-1.5 rounded transition-all duration-300 config-button ${
                activePanel === 'config' ? 'scale-110 ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
              title="Configuration des API IA"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Bouton de file d'attente */}
            <button
              onClick={() => {
                // Simuler le clic sur le bouton de queue du Layout
                const event = new CustomEvent('queueButtonClick');
                window.dispatchEvent(event);
                setActivePanel(activePanel === 'queue' ? 'main' : 'queue');
              }}
              className={`p-1.5 rounded transition-all duration-300 queue-button ${
                activePanel === 'queue' ? 'scale-110 ring-2 ring-yellow-500 ring-opacity-50' : ''
              }`}
              title="File d'attente d'analyse"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>

            {/* Bouton analyses terminées */}
            <button
              onClick={() => {
                const event = new CustomEvent('analysesButtonClick');
                window.dispatchEvent(event);
                setActivePanel(activePanel === 'analyses' ? 'main' : 'analyses');
              }}
              className={`p-1.5 rounded transition-all duration-300 analyses-button ${
                activePanel === 'analyses' ? 'scale-110 ring-2 ring-green-500 ring-opacity-50' : ''
              }`}
              title="Analyses terminées"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>

            {/* Bouton thème jour/nuit */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded ${
                isDarkMode 
                  ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30' 
                  : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30'
              }`}
              title={isDarkMode ? 'Passer en mode jour' : 'Passer en mode nuit'}
            >
              {isDarkMode ? (
                // Icône soleil pour passer en mode jour
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Icône lune pour passer en mode nuit
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Zone de navigation avec sélecteur de disque */}
      <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        {/* Ligne avec sélecteur de disque et bouton parent */}
        <div className="flex items-center gap-2">
          {/* Sélecteur de disque */}
          <div className="min-w-0 flex-1">
            <DirectorySelector
              onDirectorySelect={handleDirectorySelect}
              currentDirectory={currentPath}
              className="w-full"
            />
          </div>

          {/* Bouton retour au parent si pas à la racine */}
          {currentPath && currentPath !== '/' && !/^[A-Z]:$/i.test(currentPath) && (
            <button
              className="flex items-center px-2 py-1 hover:bg-slate-700 cursor-pointer rounded transition-colors flex-shrink-0 bg-slate-800 border border-slate-600"
              onClick={navigateToParent}
              title="Retour au dossier parent"
            >
              <svg className="w-3 h-3 text-blue-400 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-xs text-slate-300 whitespace-nowrap">Parent</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenu principal - Arborescence uniquement */}
      <div className="flex-1 h-full">
        {!currentPath ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 text-blue-400 mb-4">💻</div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              Aucun disque sélectionné
            </h3>
            <p className="text-sm text-slate-400">
              Sélectionnez un disque dans le sélecteur ci-dessus pour voir l'arborescence
            </p>
          </div>
        ) : (
          // Arborescence du disque sélectionné
          <div className="h-full">
            <FileTree
              onDirectorySelect={handleDirectorySelect}
              currentDirectory={currentPath}
              onFileSelect={handleFileSelect}
              selectedFiles={selectedFiles}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;