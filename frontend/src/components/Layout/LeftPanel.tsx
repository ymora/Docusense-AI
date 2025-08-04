import React, { useState, useEffect } from 'react';
import DirectorySelector from '../FileManager/DirectorySelector';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';
import FileTree from '../FileManager/FileTree';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { useQueueStore } from '../../stores/queueStore';
import { promptService } from '../../services/promptService';

const LeftPanel: React.FC = () => {
  const { currentDirectory, loadDirectoryTree, setCurrentDirectory, selectedFiles, selectFile, initializeDefaultDirectory } = useFileStore();
  const { isOnline, isInactive, forceCheck } = useBackendStatus();
  const { setInactive, forceRefresh } = useQueueStore();
  const { colors } = useColors();

  // Synchroniser l'état d'inactivité entre les stores
  useEffect(() => {
    setInactive(isInactive);
  }, [isInactive, setInactive]);

  // Gestion du clic sur l'indicateur de statut
  const handleStatusClick = async () => {
    if (isInactive) {
      // Tentative de reconnexion manuelle seulement si inactif
      await forceCheck();
      await forceRefresh();
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

  // Charger les prompts et initialiser le répertoire par défaut au démarrage
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("🚀 Initialisation de l'application...");
        
        // Charger les prompts
        await promptService.getPrompts();
        console.log("✅ Prompts chargés");
        
        // Initialiser le répertoire par défaut (disque D)
        console.log("📁 Initialisation du répertoire par défaut...");
        await initializeDefaultDirectory();
        console.log("✅ Répertoire par défaut initialisé");
      } catch (error) {
        console.error("❌ Erreur lors de l'initialisation:", error);
      }
    };
    
    // Délai pour s'assurer que l'application est complètement chargée
    const timer = setTimeout(() => {
      initializeApp();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [initializeDefaultDirectory]);

  // Permettre de revenir à la sélection de disque
  const handleShowDrives = () => {
    setCurrentDirectory(null);
  };

  // Écouter l'événement showDrives depuis FileTree
  useEffect(() => {
    const handleShowDrivesEvent = () => {
      handleShowDrives();
    };

    window.addEventListener('showDrives', handleShowDrivesEvent);
    return () => {
      window.removeEventListener('showDrives', handleShowDrivesEvent);
    };
  }, []);

  const handleDirectorySelect = async (directory: string) => {
    await loadDirectoryTree(directory);
  };

  const navigateToParent = async () => {
    if (!currentDirectory) {
      handleShowDrives();
      return;
    }
    
    // Normaliser le chemin pour gérer les séparateurs
    const normalizedPath = currentDirectory.replace(/\\/g, '/');
    const parts = normalizedPath.split('/').filter(Boolean);
    
    // Si on a au moins 2 parties (disque + au moins un dossier)
    if (parts.length >= 2) {
      // Reconstruire le chemin parent en gardant le format original
      let parentPath;
      if (parts.length === 2) {
        // Cas spécial: disque + 1 dossier (ex: D:/Textes -> D:)
        // Afficher l'arborescence de la racine du disque
        parentPath = parts[0];
      } else {
        // Cas général: disque + plusieurs dossiers (ex: D:/Textes/Yoann -> D:/Textes)
        parentPath = parts.slice(0, -1).join('/');
      }
      
      // Convertir les séparateurs selon le système
      parentPath = parentPath.replace(/\//g, '\\');
      
      await loadDirectoryTree(parentPath);
    } else {
      // Si on est déjà à la racine d'un disque, afficher l'arborescence de ce disque
      // au lieu de revenir à la sélection des disques
      await loadDirectoryTree(currentDirectory);
    }
  };

  const handleFileClick = (file: any) => {
    selectFile(file as any);
  };

  // Gestion des actions de fichiers
  const handleFileAction = (action: string, file: any) => {
    // Déclencher un événement personnalisé pour que le Layout puisse gérer l'action
    window.dispatchEvent(new CustomEvent('fileAction', {
      detail: { action, file }
    }));
  };

  return (
    <div
      className="left-panel-container flex flex-col min-h-screen-dynamic overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        borderRight: `1px solid ${colors.border}`,
      }}
    >
      {/* Header avec statut du backend */}
      <div
        className="flex items-center p-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: colors.text }}
        >
          DocuSense IA
        </span>
        <button
          onClick={handleStatusClick}
          className={`ml-2 p-1 rounded-full transition-all duration-200 ${
            isInactive 
              ? 'hover:scale-110 cursor-pointer' 
              : 'cursor-default'
          }`}
          title={
            isInactive 
              ? 'Cliquer pour tenter une reconnexion' 
              : isOnline 
                ? 'Backend connecté' 
                : 'Backend déconnecté'
          }
          disabled={!isInactive}
        >
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isInactive 
                ? 'animate-pulse' 
                : ''
            }`}
            style={{ 
              backgroundColor: isOnline 
                ? (isInactive ? colors.warning || '#f59e0b' : colors.success) // Orange si inactif, vert si actif
                : colors.error // Rouge si backend déconnecté
            }}
          />
        </button>
        {/* Indicateur visuel pour l'état inactif */}
        {isInactive && (
          <span
            className="ml-2 text-xs px-2 py-1 rounded-full"
            style={{ 
              backgroundColor: colors.warning || '#f59e0b',
              color: '#000'
            }}
          >
            Inactif
          </span>
        )}
      </div>

      {/* Sélecteur de disque ou navigation */}
      {!currentDirectory ? (
        <div
          className="p-4 border-b flex-1 overflow-y-auto"
          style={{ borderBottomColor: colors.border }}
        >
          <DirectorySelector onDirectorySelect={handleDirectorySelect} />
        </div>
      ) : (
        <>
          {/* Breadcrumb navigation */}
          <div
            className="px-4 py-2 border-b"
            style={{
              backgroundColor: colors.hover.surface,
              borderBottomColor: colors.border,
            }}
          >
            <div className="flex items-center space-x-2 text-sm">
              <button 
                onClick={handleShowDrives} 
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-xs" 
                style={{ color: colors.primary }}
              >
                Disques
              </button>
              {currentDirectory && currentDirectory !== '/' && (
                <>
                  <span style={{ color: colors.textSecondary }}>|</span>
                  <button
                    onClick={navigateToParent}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-xs"
                    style={{ color: colors.primary }}
                    title="Remonter au dossier parent"
                  >
                    ← Retour
                  </button>
                </>
              )}
              <span style={{ color: colors.textSecondary }}>|</span>
              <span
                className="truncate"
                style={{ color: colors.text }}
              >
                {currentDirectory}
              </span>
            </div>
          </div>
          {/* Arborescence des fichiers */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <FileTree
              onDirectorySelect={handleDirectorySelect}
              currentDirectory={currentDirectory}
              onFileSelect={handleFileClick}
              selectedFiles={selectedFiles}
              onFileAction={handleFileAction}
            />
          </div>
        </>
      )}

      {/* Légende des statuts - TOUJOURS en bas */}
      <div
        className="p-3 border-t"
        style={{
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <div className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
          Légende des statuts IA :
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.status.pending }}
            />
            <span style={{ color: colors.textSecondary }}>Non analysé ou en pause</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.status.completed }}
            />
            <span style={{ color: colors.textSecondary }}>Terminé</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.status.processing }}
            />
            <span style={{ color: colors.textSecondary }}>En cours</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.status.failed }}
            />
            <span style={{ color: colors.textSecondary }}>Échec</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.status.unsupported }}
            />
            <span style={{ color: colors.textSecondary }}>Non supporté</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default LeftPanel;