import React, { useState, useEffect, useRef } from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useFileStore, File } from '../../stores/fileStore';
import { useQueueStore } from '../../stores/queueStore';
import { promptService, PromptContext } from '../../services/promptService';
import { authService } from '../../services/authService';
import AuthModal from '../UI/AuthModal';

interface FileTreeProps {
  onDirectorySelect: (directory: string) => void;
  currentDirectory: string;
  onFileSelect: (file: File) => void;
  selectedFiles: (number | string)[];
}

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  file: any;
  onClose: () => void;
  onAction: (action: string, file: any) => void;
  selectedFiles: (number | string)[];
  onPositionChange: (x: number, y: number) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, x, y, file, onClose, onAction, selectedFiles, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const newX = event.clientX - dragOffset.x;
        const newY = event.clientY - dragOffset.y;
        
        // Empêcher le menu de sortir de l'écran
        const menuRect = menuRef.current?.getBoundingClientRect();
        if (menuRect) {
          const maxX = window.innerWidth - menuRect.width;
          const maxY = window.innerHeight - menuRect.height;
          const constrainedX = Math.max(0, Math.min(newX, maxX));
          const constrainedY = Math.max(0, Math.min(newY, maxY));
          onPositionChange(constrainedX, constrainedY);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [visible, isDragging, dragOffset, onClose, onPositionChange]);

  if (!visible) return null;

  const handleAction = (action: string) => {
    onAction(action, file);
    onClose();
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setIsDragging(true);
      const rect = menuRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
      }
    }
  };

  const isFileInAction = file.id && selectedFiles.includes(file.id);
  const fileStatus = file.status || 'none';
  const isFileSelected = selectedFiles.includes(file.id);

  // Fonctions pour déterminer le libellé et l'icône selon le type de fichier
  const getFileType = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'raw', 'heic', 'heif', 'cr2', 'nef', 'arw'].includes(extension || '') ||
        mimeType?.startsWith('image/')) {
      return 'image';
    }

    // Audio
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'aiff', 'alac'].includes(extension || '') ||
        mimeType?.startsWith('audio/')) {
      return 'audio';
    }

    // Vidéo
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv', 'ts', 'mts', 'm2ts'].includes(extension || '') ||
        mimeType?.startsWith('video/')) {
      return 'video';
    }

    // Documents
    if (['pdf', 'docx', 'doc', 'rtf', 'odt', 'pages', 'ppt', 'pptx', 'odp', 'key'].includes(extension || '') ||
        mimeType?.startsWith('application/pdf') || mimeType?.startsWith('application/vnd.openxmlformats') || 
        mimeType?.startsWith('application/msword') || mimeType?.startsWith('application/vnd.ms-powerpoint')) {
      return 'document';
    }

    // Tableurs
    if (['xlsx', 'xls', 'csv', 'ods', 'numbers'].includes(extension || '') ||
        mimeType?.startsWith('application/vnd.ms-excel') || mimeType?.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) {
      return 'spreadsheet';
    }

    // Emails
    if (['eml', 'msg', 'pst', 'ost'].includes(extension || '') ||
        mimeType?.startsWith('message/')) {
      return 'email';
    }

    // Texte
    if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'tex', 'log', 'ini', 'cfg', 'conf', 'yaml', 'yml', 'sql', 'sh', 'bat', 'ps1'].includes(extension || '') ||
        mimeType?.startsWith('text/')) {
      return 'text';
    }

    return 'other';
  };

  const getViewActionLabel = (file: any) => {
    const fileType = getFileType(file.name, file.mime_type);
    switch (fileType) {
      case 'image':
        return 'Voir l\'image dans le panneau principal';
      case 'audio':
        return 'Écouter l\'audio dans le panneau principal';
      case 'video':
        return 'Regarder la vidéo dans le panneau principal';
      case 'document':
        return 'Ouvrir le document dans le panneau principal';
      case 'spreadsheet':
        return 'Ouvrir le tableur dans le panneau principal';
      case 'email':
        return 'Lire l\'email dans le panneau principal';
      case 'text':
        return 'Lire le contenu du fichier texte dans le panneau principal';
      default:
        return 'Visualiser le fichier dans le panneau principal';
    }
  };

  const getViewActionIcon = (file: any) => {
    const fileType = getFileType(file.name, file.mime_type);
    switch (fileType) {
      case 'image':
        return '🖼️';
      case 'audio':
        return '🎵';
      case 'video':
        return '🎬';
      case 'document':
        return '📄';
      case 'spreadsheet':
        return '📊';
      case 'email':
        return '📧';
      case 'text':
        return '📝';
      default:
        return '👁️';
    }
  };

  const getViewActionTitle = (file: any) => {
    const fileType = getFileType(file.name, file.mime_type);
    switch (fileType) {
      case 'image':
        return 'Voir l\'image dans le panneau principal';
      case 'audio':
        return 'Écouter l\'audio dans le panneau principal';
      case 'video':
        return 'Regarder la vidéo dans le panneau principal';
      case 'document':
        return 'Ouvrir le document dans le panneau principal';
      case 'spreadsheet':
        return 'Ouvrir le tableur dans le panneau principal';
      case 'email':
        return 'Lire l\'email dans le panneau principal';
      case 'text':
        return 'Lire le contenu du fichier texte dans le panneau principal';
      default:
        return 'Visualiser le fichier dans le panneau principal';
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-slate-700 border border-slate-600 rounded shadow-lg py-1 min-w-48 max-w-80"
      style={{ 
        left: x, 
        top: y,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header déplaçable */}
      <div 
        className="px-3 py-1.5 border-b border-slate-600 bg-slate-800 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="text-sm font-medium text-slate-200 truncate">{file.name}</div>
        <div className="text-xs text-slate-400 truncate">{file.path}</div>
        <div className="text-xs text-slate-500 mt-1">Cliquez et glissez pour déplacer</div>
      </div>

      {/* Actions */}
      <div className="py-1">
        {/* Titre pour les actions de fichier */}
        <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
          Actions Fichier
        </div>

        <button
          onClick={() => handleAction('view')}
          className={`w-full px-3 py-1.5 text-left text-xs flex items-center ${
            !isFileSelected || selectedFiles.length > 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'
          }`}
          disabled={!isFileSelected || selectedFiles.length > 1}
          title={
            !isFileSelected 
              ? 'Sélectionnez le fichier d\'abord' 
              : selectedFiles.length > 1 
              ? 'Visualisation impossible en sélection multiple' 
              : getViewActionTitle(file)
          }
        >
          <span className="mr-2">{getViewActionIcon(file)}</span>
          {getViewActionLabel(file)}
        </button>

        <button
          onClick={() => handleAction('save')}
          className={`w-full px-3 py-1.5 text-left text-xs flex items-center ${
            !isFileSelected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'
          }`}
          disabled={!isFileSelected}
          title={!isFileSelected ? 'Sélectionnez le fichier d\'abord' : 'Télécharger le fichier'}
        >
          <span className="mr-2">💾</span>
          Sauvegarder (télécharger)
        </button>

        {/* Téléchargement ZIP pour plusieurs fichiers sélectionnés */}
        {selectedFiles.length > 1 && (
          <button
            onClick={() => handleAction('download_zip')}
            className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
            title={`Télécharger ${selectedFiles.length} fichiers en ZIP`}
          >
            <span className="mr-2">📦</span>
            Télécharger ZIP ({selectedFiles.length} fichiers)
          </button>
        )}

        {file.id ? (
          <>
            <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Analyses IA
            </div>

            {promptService.cachedPrompts === null ? (
              <div className="px-3 py-2 text-sm text-slate-400">Chargement des actions IA...</div>
            ) : (() => {
              const context: PromptContext = {
                fileStatus,
                selectedFilesCount: selectedFiles.length,
                fileType: file.mime_type || file.name?.split('.').pop(),
                allSelectedFilesTypes: selectedFiles.map(() => file.mime_type || file.name?.split('.').pop()),
              };
              const promptsWithState = promptService.getPromptsWithState(context);

              if (promptsWithState.length === 0) {
                return (
                  <div className="px-3 py-2 text-sm text-slate-400">
                    Aucune analyse disponible pour ce type de fichier
                  </div>
                );
              }

              const promptsByDomain = promptsWithState.reduce((acc, { prompt, disabled, reason }) => {
                const domain = prompt.domain;
                if (!acc[domain]) acc[domain] = [];
                acc[domain].push({ prompt, disabled, reason });
                return acc;
              }, {} as Record<string, typeof promptsWithState>);

              return Object.entries(promptsByDomain).map(([domain, domainPrompts]) => (
                <div key={domain} className="border-t border-slate-600">
                  <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center">
                    <span className="mr-1">
                      {domain === 'juridical' ? '⚖️' :
                        domain === 'technical' ? '🔧' :
                          domain === 'administrative' ? '📋' :
                            domain === 'general' ? '📄' : '🔍'}
                    </span>
                    {promptService.getDomainDisplayName(domain)}
                  </div>

                  {domainPrompts.map(({ prompt, disabled, reason }) => {
                    const isActionDisabled = disabled || isFileInAction || !isFileSelected;
                    const actionReason = !isFileSelected 
                      ? 'Sélectionnez le fichier d\'abord' 
                      : isFileInAction 
                      ? 'Action en cours...' 
                      : reason;

                    return (
                      <button
                        key={prompt.name}
                        onClick={() => !isActionDisabled && handleAction(`prompt_${prompt.name.toLowerCase().replace(/\s+/g, '_')}`)}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'}`}
                        title={isActionDisabled ? actionReason || prompt.description : prompt.description}
                        disabled={isActionDisabled}
                      >
                        <div className="flex-1 truncate">{prompt.name}</div>
                      </button>
                    );
                  })}
                </div>
              ));
            })()}

            {/* Retry pour les fichiers en échec */}
            {fileStatus === 'failed' && (
              <button
                onClick={() => !isFileInAction && isFileSelected && handleAction('retry')}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center ${
                  isFileInAction || !isFileSelected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600'
                }`}
                disabled={isFileInAction || !isFileSelected}
                title={
                  !isFileSelected 
                    ? 'Sélectionnez le fichier d\'abord' 
                    : isFileInAction 
                    ? 'Action en cours...' 
                    : 'Relancer l\'analyse'
                }
              >
                <span className="mr-2">🔄</span>
                Réessayer
              </button>
            )}

            {/* Information pour les fichiers terminés */}
            {fileStatus === 'completed' && (
              <div className="px-3 py-1.5 text-xs text-slate-300">
                ✅ Analyse terminée
              </div>
            )}

            {/* Information pour les fichiers en cours */}
            {fileStatus === 'processing' && (
              <div className="px-3 py-1.5 text-xs text-slate-300">
                ⏳ Analyse en cours...
              </div>
            )}
          </>
                 ) : (
           <>
             <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
               Fichier non analysé
             </div>
             <div className="px-3 py-1.5 text-xs text-slate-300">
               Ce fichier n'a pas encore été analysé par le système.
             </div>
             <div className="px-3 py-1 text-xs text-slate-500">
               Type: {file.mime_type || 'Inconnu'}
             </div>
             {file.is_supported === false && (
               <div className="px-3 py-1 text-xs text-red-400">
                 ⚠️ Format non supporté
               </div>
             )}
           </>
         )}
      </div>
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ onDirectorySelect, currentDirectory, onFileSelect, selectedFiles }) => {
  // Détecter le thème actuel pour l'encadrement
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // État pour l'authentification
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: string; file: any } | null>(null);
  
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.body.getAttribute('data-theme');
      setIsDarkMode(theme !== 'light');
    };
    
    checkTheme();
    // Observer les changements de thème
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  const { toggleFileSelection } = useFileStore();
  const { queueItems, loadQueueItems, loadQueueStatus } = useQueueStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [filesystemData, setFilesystemData] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{visible: boolean, x: number, y: number, file: any}>({
    visible: false, x: 0, y: 0, file: null,
  });

  // Charger l'arborescence du système de fichiers via l'endpoint /list
  const loadedRoot = React.useRef<string | null>(null);
  useEffect(() => {
    const root = currentDirectory?.split(/[\\/]/)[0];
    if (root && loadedRoot.current !== root) {
      loadFilesystemData(root);
      loadedRoot.current = root;
    }
  }, [currentDirectory]);

  // Fonction pour naviguer dans l'arborescence
  const handleDirectoryNavigation = async (directory: string) => {
    console.log('🔍 Navigation vers le répertoire:', directory);
    console.log('📊 Répertoire actuel avant navigation:', currentDirectory);
    
    try {
      await loadFilesystemData(directory);
      console.log('✅ Données chargées pour:', directory);
      onDirectorySelect(directory);
      console.log('✅ Navigation terminée vers:', directory);
    } catch (error) {
      console.error('❌ Erreur lors de la navigation:', error);
    }
  };

  // Fonction pour charger les données du système de fichiers
  const loadFilesystemData = async (directory: string) => {
    try {
      const encodedDirectory = encodeURIComponent(directory.replace(/\\/g, '/'));
      const response = await fetch(`/api/files/list/${encodedDirectory}`);
      const data = await response.json();
      
      // Debug: afficher les données reçues
      console.log('Données reçues du backend:', {
        directory: data.directory,
        subdirectories: data.subdirectories,
        files: data.files,
        total_subdirectories: data.total_subdirectories,
        total_files: data.total_files
      });
      
      setFilesystemData(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données du système de fichiers:', error);
    }
  };

  // Initialiser l'expansion des dossiers
  useEffect(() => {
    const newExpanded = new Set<string>();
    if (filesystemData && filesystemData.directory) {
      newExpanded.add(filesystemData.directory);
    }
    setExpandedNodes(newExpanded);
  }, [filesystemData]);

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: File['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'unsupported': return 'unsupported-cross';
    }
  };

  // Fonction pour obtenir le texte du statut
  const getStatusText = (status: File['status']) => {
    switch (status) {
      case 'pending': return 'Non analysé par IA';
      case 'processing': return 'Analyse IA en cours';
      case 'paused': return 'Analyse IA en pause';
      case 'completed': return 'Analysé par IA';
      case 'failed': return 'Échec d\'analyse IA';
      case 'unsupported': return 'Format non supporté';
    }
  };

  // Fonction pour obtenir le statut d'un fichier depuis la queue
  const getFileStatusFromQueue = (filePath: string): File['status'] | 'none' => {
    const queueItem = queueItems.find(item => {
      const itemPath = item.queue_metadata?.file_path ||
                      item.queue_metadata?.filename ||
                      item.queue_metadata?.path;
      return itemPath && itemPath.toLowerCase() === filePath.toLowerCase();
    });

    if (queueItem && queueItem.status !== 'none') {
      return queueItem.status as File['status'];
    }
    return 'none';
  };

  // Gestion des clics sur les fichiers
  const handleFileClick = (file: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const fileIdentifier = file.id || file.path;
    toggleFileSelection(fileIdentifier);
  };

  const handleFileDoubleClick = (file: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Visualisation uniquement pour un seul fichier
    if (file.id && selectedFiles.length <= 1) {
      onFileSelect(file);
    }
  };

  const handleFileRightClick = (file: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculer la position optimale pour que le menu reste visible
    const menuWidth = 320; // Largeur approximative du menu
    const menuHeight = 400; // Hauteur approximative du menu
    const padding = 10;

    let x = e.clientX;
    let y = e.clientY;

    // Ajuster la position horizontale si le menu dépasse à droite
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }

    // Ajuster la position verticale si le menu dépasse en bas
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }

    // S'assurer que le menu ne sorte pas à gauche ou en haut
    x = Math.max(padding, x);
    y = Math.max(padding, y);

    setContextMenu({
      visible: true,
      x,
      y,
      file,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, file: null });
  };

  const updateContextMenuPosition = (x: number, y: number) => {
    setContextMenu(prev => ({ ...prev, x, y }));
  };

  // Fonction pour gérer le téléchargement authentifié
  const handleAuthenticatedDownload = async (file: any) => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Token d\'authentification manquant');
        return;
      }

      const encodedPath = encodeURIComponent(file.path);
      const response = await fetch(`/api/download/file/${encodedPath}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        console.error('Erreur lors du téléchargement authentifié');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement authentifié:', error);
    }
  };

  // Fonction appelée après authentification réussie
  const handleAuthSuccess = async () => {
    if (pendingAction) {
      if (pendingAction.action === 'save') {
        await handleAuthenticatedDownload(pendingAction.file);
      }
      setPendingAction(null);
    }
  };

  // Fonction pour fermer la modal d'authentification
  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setPendingAction(null);
  };

  // Gestion des actions du menu contextuel
  const handleContextMenuAction = async (action: string, file: any) => {
    try {
      if (action === 'view') {
        // Émettre un événement pour la visualisation dans le MainPanel
        window.dispatchEvent(new CustomEvent('viewFileInMainPanel', { 
          detail: { file } 
        }));
        // Le fichier sera sélectionné et visualisé directement dans le MainPanel
      } else if (action === 'save') {
        // Vérifier si l'utilisateur est local ou distant
        const isLocal = authService.isLocalUser();
        
        if (isLocal) {
          // Utilisateur local : téléchargement direct
          const encodedPath = encodeURIComponent(file.path);
          const downloadUrl = `/api/files/download-by-path/${encodedPath}`;
          
          // Créer un lien temporaire pour le téléchargement
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Utilisateur distant : vérifier l'authentification
          if (!authService.getAuthStatus()) {
            // Pas authentifié : afficher la modal
            setPendingAction({ action, file });
            setShowAuthModal(true);
            return;
          }
          
          // Authentifié : téléchargement avec token
          await handleAuthenticatedDownload(file);
        }
      } else if (action === 'download_zip') {
        // Téléchargement ZIP pour plusieurs fichiers sélectionnés
        const isLocal = authService.isLocalUser();
        
        try {
          let response;
          
          if (isLocal) {
            // Utilisateur local : téléchargement direct
            response = await fetch('/api/files/download-selected', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
          } else {
            // Utilisateur distant : vérifier l'authentification
            if (!authService.getAuthStatus()) {
              // Pas authentifié : afficher la modal
              setPendingAction({ action, file });
              setShowAuthModal(true);
              return;
            }
            
            // Authentifié : téléchargement avec token
            const token = authService.getAuthToken();
            response = await fetch('/api/files/download-selected', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          }
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `selected_files_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else {
            console.error('Erreur lors du téléchargement ZIP:', response.statusText);
          }
        } catch (error) {
          console.error('Erreur lors du téléchargement ZIP:', error);
        }
      } else if (action.startsWith('prompt_')) {
        const type = action.replace('prompt_', '');
        if (file.id) {
          const response = await fetch('/api/analysis/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_ids: [file.id], analysis_type: type }),
          });

          if (response.ok) {
            // Synchronisation immédiate
            await loadQueueItems();
            await loadQueueStatus();
            
            // Puis synchronisation continue pour suivre le progrès
            const syncInterval = setInterval(async () => {
              await loadQueueItems();
              await loadQueueStatus();
              
              // Arrêter la synchronisation si le fichier n'est plus en cours
              const currentQueueItems = await fetch('/api/queue/status').then(r => r.json());
              const fileInQueue = currentQueueItems.queue_items?.some((item: any) => 
                item.queue_metadata?.file_id === file.id && 
                ['pending', 'processing'].includes(item.status)
              );
              
              if (!fileInQueue) {
                clearInterval(syncInterval);
                // Dernière synchronisation pour avoir le statut final
                await loadQueueItems();
                await loadQueueStatus();
              }
            }, 1000); // Vérification toutes les secondes
            
            // Arrêter après 5 minutes maximum
            setTimeout(() => clearInterval(syncInterval), 300000);
          }
        }
      } else if (action === 'retry') {
        if (file.id) {
          const response = await fetch('/api/analysis/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_ids: [file.id], analysis_type: 'general' }),
          });

          if (response.ok) {
            // Synchronisation immédiate
            await loadQueueItems();
            await loadQueueStatus();
            
            // Puis synchronisation continue pour suivre le progrès
            const syncInterval = setInterval(async () => {
              await loadQueueItems();
              await loadQueueStatus();
              
              // Arrêter la synchronisation si le fichier n'est plus en cours
              const currentQueueItems = await fetch('/api/queue/status').then(r => r.json());
              const fileInQueue = currentQueueItems.queue_items?.some((item: any) => 
                item.queue_metadata?.file_id === file.id && 
                ['pending', 'processing'].includes(item.status)
              );
              
              if (!fileInQueue) {
                clearInterval(syncInterval);
                // Dernière synchronisation pour avoir le statut final
                await loadQueueItems();
                await loadQueueStatus();
              }
            }, 1000); // Vérification toutes les secondes
            
            // Arrêter après 5 minutes maximum
            setTimeout(() => clearInterval(syncInterval), 300000);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
    }
  };

  // Fermer le menu contextuel avec Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronisation automatique intelligente
  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentDirectory) {
        try {
          await loadQueueItems();
          await loadQueueStatus();
          
          // Vérifier s'il y a des actions en cours pour ajuster la fréquence
          const hasActiveItems = queueItems.some((item: any) => 
            ['pending', 'processing'].includes(item.status)
          );
          
          // Si des actions sont en cours, synchroniser plus fréquemment
          if (hasActiveItems) {
            // Synchronisation rapide toutes les 3 secondes
            setTimeout(async () => {
              await loadQueueItems();
              await loadQueueStatus();
            }, 3000);
          }
        } catch (error) {
          console.error('Erreur lors de la synchronisation:', error);
        }
      }
    }, 10000); // Synchronisation de base toutes les 10 secondes

    return () => clearInterval(interval);
  }, [currentDirectory, loadQueueItems, loadQueueStatus, queueItems]);

  // Rendu d'un fichier
  const renderFile = (file: any, level: number) => {
    const queueStatus = getFileStatusFromQueue(file.path);
    const finalStatus = queueStatus !== 'none' ? queueStatus : (file.status || 'none');
    const isSelected = selectedFiles.includes(file.id || file.path);
    const isInAction = file.id && queueItems.some(item => 
      item.queue_metadata?.file_id === file.id && item.status !== 'none'
    );

    return (
      <div
        key={file.path}
        className={`flex items-center px-2 py-1 cursor-pointer rounded transition-colors text-sm relative ${
          isSelected ? `border ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}` : 'text-slate-300 hover:bg-slate-700'
        } ${isInAction ? 'bg-yellow-900/20 border-l-2 border-yellow-400' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={(e) => handleFileClick(file, e)}
        onDoubleClick={(e) => handleFileDoubleClick(file, e)}
        onContextMenu={(e) => handleFileRightClick(file, e)}
        title={`${file.name} - Clic: sélectionner, Double-clic: ouvrir, Clic droit: menu`}
      >
        <DocumentIcon className="h-4 w-4 mr-2 flex-shrink-0 text-blue-400" />
        <span className="flex-1 truncate">{file.name}</span>
        
        {/* Indicateur de statut */}
        <div className="flex items-center ml-2">
          {isInAction ? (
            <div
              className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"
              title="Action en cours..."
            />
          ) : finalStatus === 'unsupported' ? (
            <svg
              className="w-3 h-3 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              title={getStatusText(finalStatus)}
            >
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(finalStatus)} ${
                finalStatus === 'processing' || finalStatus === 'paused' ? 'animate-pulse' : ''
              }`}
              title={getStatusText(finalStatus)}
            />
          )}
        </div>
      </div>
    );
  };



  // Rendu d'un dossier
  const renderDirectory = (dir: any, level: number) => {
    const isExpanded = expandedNodes.has(dir.path);
    
    const toggleExpansion = (e: React.MouseEvent) => {
      e.stopPropagation();
      const newExpanded = new Set(expandedNodes);
      if (isExpanded) {
        newExpanded.delete(dir.path);
      } else {
        newExpanded.add(dir.path);
      }
      setExpandedNodes(newExpanded);
    };

    // Debug: afficher les informations du dossier
    console.log(`Rendering directory: ${dir.name}`, {
      path: dir.path,
      subdirectories: dir.subdirectories,
      files: dir.files,
      isExpanded,
      level
    });

    return (
      <div key={dir.path}>
        <div
          className={`flex items-center px-2 py-1 rounded transition-colors text-sm hover:bg-slate-700 ${
            dir.path === currentDirectory ? 'bg-slate-700 text-slate-200' : 'text-slate-300'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Zone du chevron - séparée du clic sur le dossier */}
          {(dir.subdirectories && dir.subdirectories.length > 0) || (dir.files && dir.files.length > 0) ? (
            <div
              className="mr-1 cursor-pointer hover:bg-slate-600 rounded p-0.5 flex-shrink-0"
              onClick={toggleExpansion}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
            </div>
          ) : (
            <div className="mr-1 w-3 h-3 flex-shrink-0"></div> // Espace vide pour aligner
          )}
          
          {/* Zone du dossier - clic pour naviguer */}
          <div
            className="flex items-center flex-1 cursor-pointer"
            onClick={(e) => {
              console.log('🖱️ Clic détecté sur le dossier:', dir.name, 'chemin:', dir.path);
              e.stopPropagation();
              handleDirectoryNavigation(dir.path);
            }}
          >
            <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0 text-blue-400" />
            <span className="flex-1 truncate">{dir.name}</span>
            <span className="text-xs text-slate-400">
              ({dir.subdirectories?.length || 0} dossier{(dir.subdirectories?.length || 0) > 1 ? 's' : ''}, {dir.file_count || 0} fichier{(dir.file_count || 0) > 1 ? 's' : ''})
            </span>
          </div>
        </div>
        
        {/* Contenu du dossier si expansé */}
        {isExpanded && (
          <div>
            {/* Sous-dossiers */}
            {dir.subdirectories && dir.subdirectories.length > 0 && (
              <div>
                {dir.subdirectories.map((subdir: any) => 
                  renderDirectory(subdir, level + 1)
                )}
              </div>
            )}
            
            {/* Fichiers groupés par statut */}
            {dir.files && dir.files.length > 0 && 
              dir.files.map((file: any) => renderFile(file, level + 1))
            }
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-2">
      {!filesystemData ? (
        <div className="text-center py-4 text-slate-400 text-sm">
                        <div className="text-2xl mb-2 text-blue-400">📁</div>
          <p>Chargement de l'arborescence...</p>
        </div>
      ) : (
        <div>
          {/* Répertoire racine */}
          <div
            className={`flex items-center px-2 py-1 cursor-pointer rounded transition-colors text-sm hover:bg-slate-700 ${
              filesystemData.directory === currentDirectory ? 'bg-slate-700 text-slate-200' : 'text-slate-300'
            }`}
            onClick={() => handleDirectoryNavigation(filesystemData.directory)}
          >
            <FolderIcon className="h-4 w-4 mr-2 text-blue-400" />
            <span className="flex-1 truncate">{filesystemData.directory || 'Racine'}</span>
            <span className="text-xs text-slate-400">
              ({filesystemData.total_subdirectories} dossier{filesystemData.total_subdirectories > 1 ? 's' : ''}, {filesystemData.total_files} fichier{filesystemData.total_files > 1 ? 's' : ''})
            </span>
          </div>
          
          {/* Sous-répertoires */}
          {filesystemData.subdirectories && filesystemData.subdirectories.map((subdir: any) => 
            renderDirectory(subdir, 1)
          )}
          
          {/* Fichiers du répertoire racine */}
          {filesystemData.files && filesystemData.files.length > 0 && 
            filesystemData.files.map((file: any) => renderFile(file, 1))
          }
        </div>
      )}

      {/* Menu contextuel */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        file={contextMenu.file}
        onClose={closeContextMenu}
        onAction={handleContextMenuAction}
        selectedFiles={selectedFiles}
        onPositionChange={updateContextMenuPosition}
      />

      {/* Modal d'authentification */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default FileTree;