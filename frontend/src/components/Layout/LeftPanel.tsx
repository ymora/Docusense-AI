import React, { useState, useEffect } from 'react';
import BreadcrumbNavigation from './BreadcrumbNavigation';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';
import FileTree from '../FileManager/FileTree';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { useQueueStore } from '../../stores/queueStore';
import { useUIStore } from '../../stores/uiStore';
import { addInterfaceLog } from '../../utils/interfaceLogger';
import {
  EyeIcon,
  QueueListIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const LeftPanel: React.FC = () => {
  const { currentDirectory, loadDirectoryTree, setCurrentDirectory, selectedFiles, selectFile } = useFileStore();
  const { isOnline, isInactive, consecutiveFailures } = useBackendStatus();
  const { setInactive, forceRefresh } = useQueueStore();
  const { activePanel, setActivePanel } = useUIStore();
  const { colors } = useColors();

  // Synchroniser l'état d'inactivité entre les stores
  useEffect(() => {
    setInactive(isInactive);
  }, [isInactive, setInactive]);

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

  // Suppression de l'initialisation automatique du disque D:
  // L'utilisateur choisira manuellement son disque

  const handleDirectorySelect = async (directory: string) => {
    addInterfaceLog('Navigation', 'INFO', `📁 Sélection du répertoire: ${directory}`);
    await loadDirectoryTree(directory);
  };

  const navigateToParent = async () => {
    if (!currentDirectory) {
      return;
    }

    addInterfaceLog('Navigation', 'INFO', `⬆️ Navigation vers le répertoire parent`);
    
    // Extraire le disque et le chemin relatif
    const driveMatch = currentDirectory.match(/^([A-Z]:)(.*)$/i);
    if (!driveMatch) {
      return;
    }
    
    const [, drive, relativePath] = driveMatch;
    
    // Nettoyer le chemin relatif et le diviser
    const cleanPath = relativePath.replace(/^[\\\/]+|[\\\/]+$/g, ''); // Enlever les séparateurs en début/fin
    const pathParts = cleanPath ? cleanPath.split(/[\\\/]+/) : [];
    
    if (pathParts.length === 0) {
      // On est déjà à la racine du disque
      setCurrentDirectory(null);
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
    addInterfaceLog('Fichiers', 'INFO', `📄 Sélection du fichier: ${file.name}`);
    selectFile(file as any);
  };

  // Gestion des actions de fichiers
  const handleFileAction = (action: string, file: any) => {
    addInterfaceLog('Fichiers', 'INFO', `⚡ Action sur fichier: ${action} - ${file.name}`);
    // Déclencher un événement personnalisé pour que le Layout puisse gérer l'action
    window.dispatchEvent(new CustomEvent('fileAction', {
      detail: { action, file }
    }));
  };

  const toggleTheme = () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    addInterfaceLog('Interface', 'INFO', `🎨 Changement de thème: ${newTheme}`);
  };

  // Déterminer la couleur du titre selon l'état du backend
  const getTitleColor = () => {
    if (!isOnline || consecutiveFailures >= 3) {
      return colors.error || '#ef4444'; // Rouge quand le backend ne répond pas
    }
    return colors.text; // Couleur normale
  };

  // Déterminer le tooltip du titre
  const getTitleTooltip = () => {
    if (!isOnline || consecutiveFailures >= 3) {
      return 'Backend déconnecté';
    }
    return 'Backend connecté';
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: colors.surface,
        color: colors.text,
      }}
    >
      {/* Header avec titre et contrôles */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <div className="flex items-center space-x-3">
          <span
            className="text-lg font-semibold transition-colors duration-300"
            style={{ 
              color: getTitleColor(),
              animation: (!isOnline || consecutiveFailures >= 3) ? 'pulse 2s infinite' : 'none'
            }}
            title={getTitleTooltip()}
          >
            DocuSense IA
          </span>
        </div>
        
        {/* Bouton thème jour/nuit */}
        <button
          onClick={toggleTheme}
          className="p-2 transition-colors rounded-lg hover:bg-slate-700"
          style={{
            color: colors.textSecondary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.textSecondary;
          }}
          title="Basculer le thème"
        >
          {document.body.getAttribute('data-theme') === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Navigation breadcrumb - toujours visible */}
      <div
        className="px-4 py-2 border-b flex-shrink-0"
        style={{
          backgroundColor: colors.hover.surface,
          borderBottomColor: colors.border,
        }}
      >
        <BreadcrumbNavigation
          currentDirectory={currentDirectory}
          onDirectorySelect={handleDirectorySelect}
        />
      </div>

      {/* Arborescence des fichiers - seulement si un répertoire est sélectionné */}
      {currentDirectory && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-auto">
          <FileTree
            onDirectorySelect={handleDirectorySelect}
            currentDirectory={currentDirectory}
            onFileSelect={handleFileClick}
            selectedFiles={selectedFiles}
            onFileAction={handleFileAction}
          />
        </div>
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
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.success }}
            />
            <span style={{ color: colors.textSecondary }}>Analysable par IA</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.textSecondary }}
            />
            <span style={{ color: colors.textSecondary }}>Non pris en charge par l'IA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;