import React, { useState, useEffect } from 'react';
import DirectorySelector from '../FileManager/DirectorySelector';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';
import FileTree from '../FileManager/FileTree';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { promptService } from '../../services/promptService';

const LeftPanel: React.FC = () => {
  const { currentDirectory, loadDirectoryTree, setCurrentDirectory, selectedFiles, selectFile } = useFileStore();
  const { isOnline } = useBackendStatus();
  const { colors } = useColors();



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
        // Gestion silencieuse des erreurs
      }
    };
    loadPrompts();
  }, []);

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
      className="left-panel-container flex flex-col h-full overflow-hidden"
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
        <div
          className="w-3 h-3 rounded-full ml-2"
          style={{ backgroundColor: isOnline ? colors.success : colors.error }}
        />
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