import React, { useState, useEffect } from 'react';
import DirectorySelector from '../FileManager/DirectorySelector';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';
import FileTree from '../FileManager/FileTree';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { useQueueStore } from '../../stores/queueStore';


const LeftPanel: React.FC = () => {
  const { currentDirectory, loadDirectoryTree, setCurrentDirectory, selectedFiles, selectFile } = useFileStore();
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

  // Initialisation automatique si aucun répertoire n'est sélectionné
  useEffect(() => {
    if (!currentDirectory) {

      // Essayer de charger le disque D: en premier, puis C: en fallback
      const initializeDirectory = async () => {
        try {

          await loadDirectoryTree("D:");

        } catch (error) {
          console.warn("⚠️ Impossible de charger le disque D, tentative avec C:", error);
          try {
            await loadDirectoryTree("C:");

          } catch (fallbackError) {
            console.error("❌ Impossible de charger aucun disque:", fallbackError);
          }
        }
      };
      initializeDirectory();
    }
  }, [currentDirectory, loadDirectoryTree]);

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
    

    
    // Extraire le disque et le chemin relatif
    const driveMatch = currentDirectory.match(/^([A-Z]:)(.*)$/i);
    if (!driveMatch) {

      handleShowDrives();
      return;
    }
    
    const [, drive, relativePath] = driveMatch;


    
    // Nettoyer le chemin relatif et le diviser
    const cleanPath = relativePath.replace(/^[\\\/]+|[\\\/]+$/g, ''); // Enlever les séparateurs en début/fin
    const pathParts = cleanPath ? cleanPath.split(/[\\\/]+/) : [];
    

    
    if (pathParts.length === 0) {
      // On est déjà à la racine du disque

      handleShowDrives();
    } else if (pathParts.length === 1) {
      // Un seul dossier, remonter à la racine du disque
      const parentPath = drive;

      setCurrentDirectory(parentPath);
      await loadDirectoryTree(parentPath);
    } else {
      // Plusieurs dossiers, remonter d'un niveau
      const parentPath = drive + '\\' + pathParts.slice(0, -1).join('\\');

      setCurrentDirectory(parentPath);
      await loadDirectoryTree(parentPath);
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
      className="left-panel-container flex flex-col h-screen overflow-hidden"
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
          className="p-4 border-b flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500"
          style={{ borderBottomColor: colors.border }}
        >
          <DirectorySelector onDirectorySelect={handleDirectorySelect} />
        </div>
      ) : (
        <>
          {/* Breadcrumb navigation */}
          <div
            className="px-4 py-2 border-b flex-shrink-0"
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
                    title="Remonter d'un niveau dans l'arborescence"
                  >
                    ↑ Niveau supérieur
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
          {/* Arborescence des fichiers avec ascenseur */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500">
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
        className="p-3 border-t flex-shrink-0"
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
            <span style={{ color: colors.textSecondary }}>En attente</span>
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
              style={{ backgroundColor: colors.status.paused }}
            />
            <span style={{ color: colors.textSecondary }}>En pause</span>
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