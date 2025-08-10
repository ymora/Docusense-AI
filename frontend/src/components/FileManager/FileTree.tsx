import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useFileStore, File } from '../../stores/fileStore';
import { useQueueStore } from '../../stores/queueStore';
import { useColors } from '../../hooks/useColors';
import { getFileType } from '../../utils/fileTypeUtils';
import { getStatusColor, getStatusText } from '../../utils/statusUtils';
import { isSupportedFormat } from '../../utils/mediaFormats';
import ContextMenu from '../UI/ContextMenu';

interface FileTreeProps {
  onDirectorySelect: (directory: string) => void;
  currentDirectory: string;
  onFileSelect: (file: File) => void;
  selectedFiles: (number | string)[];
  onFileAction?: (action: string, file: any) => void;
}

const FileTree: React.FC<FileTreeProps> = ({ onDirectorySelect, currentDirectory, onFileSelect, selectedFiles, onFileAction }) => {
  const { colors } = useColors();
  const { toggleFileSelection, directoryTree, loading } = useFileStore();
  const { queueItems, loadQueueItems, loadQueueStatus } = useQueueStore();
  
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  // Debug: Log expandedNodes changes
  useEffect(() => {
    console.log('🔍 expandedNodes changed:', expandedNodes);
  }, [expandedNodes]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  
  // État du menu contextuel
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    file: any;
  }>({
    visible: false,
    x: 0,
    y: 0,
    file: null
  });

  // Vérifier le thème
  const checkTheme = () => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
  };

  useEffect(() => {
    checkTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);
    return () => mediaQuery.removeEventListener('change', checkTheme);
  }, []);

  // Navigation de répertoire - utilise le store
  const handleDirectoryNavigation = useCallback(async (directory: string) => {
    try {
      onDirectorySelect(directory);
    } catch (error) {
      console.error('❌ Erreur navigation:', error);
    }
  }, [onDirectorySelect]);

  // Charger les données initiales
  useEffect(() => {
    if (currentDirectory) {
      handleDirectoryNavigation(currentDirectory);
    }
  }, [currentDirectory]);

  // Gestion des clics sur fichiers
  const handleFileClick = useCallback((file: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Vérification de sécurité pour directoryTree
    if (!directoryTree || !directoryTree.files || !Array.isArray(directoryTree.files)) {
      return;
    }
    
    // Gestion de la sélection multiple
    if (e.shiftKey && selectedFiles.length > 0) {
      // Sélection par plage avec Shift
      const currentIndex = directoryTree.files.findIndex(f => f.id === file.id);
      const lastIndex = directoryTree.files.findIndex(f => f.id === selectedFiles[selectedFiles.length - 1]);
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      
      const filesInRange = directoryTree.files.slice(start, end + 1);
      const fileIdsInRange = filesInRange.map(f => f.id);
      
      // Utiliser la fonction de sélection existante
      fileIdsInRange.forEach(fileId => {
        if (!selectedFiles.includes(fileId)) {
          // Trouver le fichier correspondant
          const file = directoryTree.files.find(f => f.id === fileId);
          if (file) {
            onFileSelect(file);
          }
        }
      });
    } else if (e.ctrlKey || e.metaKey) {
      // Sélection multiple avec Ctrl/Cmd
      toggleFileSelection(file.id || file.path);
      
      // Désactiver l'affichage automatique en cas de sélection multiple
      window.dispatchEvent(new CustomEvent('disableMainPanelDisplay'));
    } else {
      // Sélection simple - AFFICHAGE IMMÉDIAT
      onFileSelect(file);
      
      // Fermer le PromptSelector si ouvert
      window.dispatchEvent(new CustomEvent('closePromptSelector'));
      
      // Afficher immédiatement la visualisation selon le type de fichier
      const mimeType = file.mime_type?.toLowerCase() || '';
      const fileName = file.name?.toLowerCase() || '';
      
      // Détection centralisée utilisant getFileType
      const fileType = getFileType(file.name, file.mime_type);
      
      let displayMode = 'details';
      if (fileType === 'audio' || fileType === 'video') {
        displayMode = 'media';
      } else if (fileType === 'image' || fileType === 'document') {
        displayMode = 'details'; // Affichage direct dans le MainPanel
      }
      
      // Envoyer l'événement pour afficher le fichier
      window.dispatchEvent(new CustomEvent('viewFileInMainPanel', {
        detail: { file, mode: displayMode }
      }));
    }
  }, [directoryTree?.files, selectedFiles, onFileSelect, toggleFileSelection]);

  const handleFileDoubleClick = (file: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Même comportement que le clic simple - pas d'affichage automatique
    handleFileClick(file, e);
  };

  const handleFileRightClick = (file: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Afficher le menu contextuel
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      file: file
    });
  };

  // Gestion des actions de fichiers
  const handleFileAction = (action: string, file: any) => {
    // Action reçue du menu contextuel
    
    // Fermer le menu contextuel
    setContextMenu(prev => ({ ...prev, visible: false }));
    
    // Propager l'action via un événement personnalisé pour que Layout puisse l'intercepter
    const customEvent = new CustomEvent('fileAction', {
      detail: { action, file }
    });
    window.dispatchEvent(customEvent);
    
    // Également appeler onFileAction si fourni (pour compatibilité)
    if (onFileAction) {
      onFileAction(action, file);
    }
  };

  // Composant DirectoryItem avec expansion simplifiée
  const DirectoryItem = React.memo(({ dir, level }: { dir: any; level: number }) => {
    const isExpanded = expandedNodes[dir.path] || false;
    const isCurrentDir = dir.path === currentDirectory;
    const isSelected = selectedFiles.includes(dir.path);
    const [children, setChildren] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const toggleExpansion = useCallback(async (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log('🔄 toggleExpansion appelé pour:', dir.path, 'isExpanded:', isExpanded);
      
      if (isExpanded) {
        // Réduire le dossier
        console.log('📁 Réduction du dossier:', dir.path);
        setExpandedNodes(prev => {
          const newExpanded = { ...prev };
          delete newExpanded[dir.path];
          console.log('📁 Nouvel état expandedNodes:', newExpanded);
          return newExpanded;
        });
      } else {
        // Déployer le dossier et charger les enfants
        console.log('📁 Expansion du dossier:', dir.path);
        setExpandedNodes(prev => {
          const newExpanded = { ...prev };
          newExpanded[dir.path] = true;
          console.log('📁 Nouvel état expandedNodes:', newExpanded);
          return newExpanded;
        });
        
        // Charger les enfants du dossier seulement si pas déjà chargés
        if (!hasLoaded) {
          setIsLoading(true);
          try {
            const encodedDirectory = encodeURIComponent(dir.path.replace(/\\/g, '/'));
            console.log('📁 Chargement des enfants pour:', dir.path, 'URL:', `/api/files/list/${encodedDirectory}`);
            console.log('📁 Path original:', dir.path, 'Encoded:', encodedDirectory);
            const response = await fetch(`/api/files/list/${encodedDirectory}`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📁 Réponse API pour:', dir.path, 'data:', data);
            
            const childItems = [
              ...(data.subdirectories || []).map((subdir: any) => ({
                ...subdir,
                type: 'directory',
                is_directory: true
              })),
              ...(data.files || []).map((file: any) => ({
                ...file,
                type: 'file',
                is_directory: false
              }))
            ];
            
            setChildren(childItems);
            setHasLoaded(true);
            console.log('📁 Enfants chargés pour:', dir.path, 'nombre:', childItems.length);
          } catch (error) {
            console.error('Erreur lors du chargement des enfants:', error);
            // En cas d'erreur, on peut quand même marquer comme chargé pour éviter les retry infinis
            setHasLoaded(true);
          } finally {
            setIsLoading(false);
          }
        }
      }
    }, [dir.path, isExpanded, hasLoaded]);

    const handleDirectoryClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Gestion de la sélection multiple pour les dossiers
      if (e.ctrlKey || e.metaKey) {
        // Sélection multiple avec Ctrl/Cmd
        toggleFileSelection(dir.path);
      } else if (e.shiftKey && selectedFiles.length > 0) {
        // Sélection par plage avec Shift
        toggleFileSelection(dir.path);
      } else {
        // Clic simple : naviguer vers le dossier
        handleDirectoryNavigation(dir.path);
      }
    }, [dir.path, selectedFiles.length]);

    const handleChevronClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      console.log('🔽 Chevron cliqué pour:', dir.path, 'isExpanded:', isExpanded);
      console.log('🔽 Event details:', e);
      toggleExpansion(e);
    }, [dir.path, isExpanded, toggleExpansion]);

    // Toujours afficher le chevron pour les dossiers (ils peuvent avoir des enfants)
    const hasChildren = true; // On suppose que tous les dossiers peuvent avoir des enfants

    return (
      <div key={dir.path}>
        <div
          className={`flex items-center px-2 py-1 rounded transition-colors text-sm hover:bg-slate-700 cursor-pointer ${
            isSelected 
              ? 'bg-blue-600 text-white' 
              : isCurrentDir 
                ? 'bg-slate-700 text-slate-200' 
                : 'text-slate-300'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Chevron indicateur (cliquable) */}
          <div 
            className="mr-1 flex-shrink-0 cursor-pointer hover:bg-slate-600 rounded p-0.5"
            onClick={handleChevronClick}
            title={isExpanded ? "Réduire le dossier" : "Développer le dossier"}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
            ) : isExpanded ? (
              <ChevronDownIcon className="h-3 w-3 text-blue-400" />
            ) : (
              <ChevronRightIcon className="h-3 w-3 text-blue-400" />
            )}
          </div>

          {/* Zone cliquable du dossier */}
          <div
            className="flex items-center flex-1"
            onClick={handleDirectoryClick}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleDirectoryNavigation(dir.path);
            }}
            title="Clic simple: naviguer vers le dossier • Double-clic: naviguer vers le dossier"
          >
            <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0 text-blue-400" />
            <span className="flex-1 truncate">{dir.name}</span>
          </div>
        </div>

        {/* Contenu du dossier si expansé */}
        {isExpanded && (
          <div>
            {/* Sous-dossiers */}
            {children.filter(item => item.is_directory).map((subdir: any) =>
              <DirectoryItem key={subdir.path} dir={subdir} level={level + 1} />
            )}

            {/* Fichiers */}
            {children.filter(item => !item.is_directory).map((file: any) => 
              <FileItem key={file.path} file={file} level={level + 1} />
            )}

            {/* Indicateur de chargement */}
            {isLoading && (
              <div className="flex items-center px-2 py-1" style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-2"></div>
                <span className="text-xs text-slate-400">Chargement...</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  });

  // Composant FileItem avec statuts et couleurs améliorés
  const FileItem = ({ file, level }: { file: any; level: number }) => {
    const isSelected = selectedFiles.includes(file.id || file.path);
    const statusColor = getStatusColor(file.status);
    const statusText = getStatusText(file.status);

    // Fonction pour déterminer si le fichier est analysable par l'IA
    const isAnalyzableByAI = (fileName: string, mimeType?: string) => {
      // Utiliser la fonction centralisée des formats supportés
      return isSupportedFormat(fileName);
    };

    const isAnalyzable = isAnalyzableByAI(file.name, file.mime_type);
    const fileColor = isAnalyzable ? colors.success : colors.textSecondary;

    return (
      <div
        className={`flex items-center px-2 py-1 rounded transition-colors text-sm cursor-pointer ${
          isSelected 
            ? 'bg-blue-600 text-white' 
            : 'hover:bg-slate-700'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={(e) => handleFileClick(file, e)}
        onDoubleClick={(e) => handleFileDoubleClick(file, e)}
        onContextMenu={(e) => handleFileRightClick(file, e)}
        title={`${file.name} - ${isAnalyzable ? 'Analysable par IA' : 'Non pris en charge par l\'IA'}${isSelected ? ' (Sélectionné)' : ''}`}
      >
        <DocumentIcon 
          className="h-4 w-4 mr-2 flex-shrink-0" 
          style={{ color: isSelected ? 'white' : fileColor }}
        />
        <span 
          className="flex-1 truncate"
          style={{ color: isSelected ? 'white' : fileColor }}
        >
          {file.name}
        </span>
      </div>
    );
  };

  // Vérification de sécurité avant le rendu
  if (!directoryTree) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500">
          <div className="text-center py-4 text-slate-400 text-sm">
            <div className="text-2xl mb-2 text-blue-400">📁</div>
            <p>Chargement de l'arborescence...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Indicateur de sélection multiple avec bouton de désélection */}
      {selectedFiles.length > 0 && (
        <div className="px-3 py-2 bg-blue-600 text-white text-sm font-medium flex items-center justify-between">
          <span>
            {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => {
              // Désélectionner tous les fichiers
              selectedFiles.forEach(fileId => {
                toggleFileSelection(fileId);
              });
            }}
            className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors flex items-center justify-center w-6 h-6"
            title="Désélectionner tous les fichiers"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Contenu principal avec barre de défilement */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500">
        <div>
          {/* Répertoire racine */}
          <div
            className={`flex items-center px-2 py-1 cursor-pointer rounded transition-colors text-sm hover:bg-slate-700 ${
              directoryTree.path === currentDirectory ? 'bg-slate-700 text-slate-200' : 'text-slate-300'
            }`}
            onClick={() => handleDirectoryNavigation(directoryTree.path)}
          >
            <FolderIcon className="h-4 w-4 mr-2 text-blue-400" />
            <span className="flex-1 truncate">{directoryTree.name || 'Racine'}</span>
            <span className="text-xs text-slate-400">
              ({directoryTree.children?.length || 0} dossier{(directoryTree.children?.length || 0) > 1 ? 's' : ''}, {directoryTree.file_count || 0} fichier{(directoryTree.file_count || 0) > 1 ? 's' : ''})
            </span>
          </div>

          {/* Sous-répertoires */}
          {directoryTree.children && directoryTree.children.length > 0 && (
            <div>
              {directoryTree.children.map((subdir: any) => {
                console.log('📁 Rendu DirectoryItem:', subdir.path, 'level: 1');
                return <DirectoryItem key={subdir.path} dir={subdir} level={1} />;
              })}
            </div>
          )}

          {/* Fichiers du répertoire racine - Vérification de sécurité */}
          {directoryTree.files && Array.isArray(directoryTree.files) && directoryTree.files.length > 0 && (
            <div>
              {directoryTree.files.map((file: any) => 
                <FileItem key={file.path} file={file} level={1} />
              )}
            </div>
          )}

          {/* Indicateur de chargement */}
          {loading && (
            <div className="text-center py-2 text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mx-auto"></div>
              <p>Chargement...</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu contextuel */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        file={contextMenu.file}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        onAction={handleFileAction}
        selectedFiles={selectedFiles}
        onPositionChange={(x, y) => setContextMenu(prev => ({ ...prev, x, y }))}
      />
    </div>
  );
};

export default FileTree;