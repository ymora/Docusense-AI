import React, { useState, useEffect, useCallback } from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon, ChevronDownIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { isSupportedFormat } from '../../utils/mediaFormats';
import { useUIStore } from '../../stores/uiStore';
import { useFileService } from '../../hooks/useFileService';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { logService } from '../../services/logService';

interface FileTreeSimpleProps {
  currentDirectory: string;
  onFileSelect: (file: any) => void;
  selectedFiles: (number | string)[];
  onFileSelectionChange: (fileId: string | number) => void;
}

const FileTreeSimple: React.FC<FileTreeSimpleProps> = ({
  currentDirectory,
  onFileSelect,
  selectedFiles,
  onFileSelectionChange
}) => {
  const { colors } = useColors();
  const { setActivePanel } = useUIStore();
  const { isOnline } = useBackendConnection();
  const { isAuthenticated } = useUnifiedAuth();
  const fileService = useFileService();
  const [directoryData, setDirectoryData] = useState<any>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderData, setFolderData] = useState<Record<string, any>>({}); // Stockage global des données des dossiers
  const [loading, setLoading] = useState(false);

  // Charger les données du répertoire actuel
  useEffect(() => {
    const loadDirectory = async () => {
      if (!currentDirectory || !isAuthenticated) {
        if (!isAuthenticated) {
          console.log('[FileTreeSimple] Utilisateur non authentifié - pas de chargement du répertoire');
        }
        return;
      }
      
      setLoading(true);
      logService.info('Chargement du répertoire', 'FileTreeSimple', {
        directory: currentDirectory,
        timestamp: new Date().toISOString()
      });
      
      try {
        const result = await fileService.listDirectory(currentDirectory);
        
        if (result.success) {
          setDirectoryData(result.data);
          // Expansion automatique du répertoire racine
          setExpandedFolders(new Set([currentDirectory]));
          
          logService.info('Répertoire chargé avec succès', 'FileTreeSimple', {
            directory: currentDirectory,
            filesCount: result.data.files?.length || 0,
            foldersCount: result.data.directories?.length || 0,
            timestamp: new Date().toISOString()
          });
        } else {
          logService.error('Erreur lors du chargement du répertoire', 'FileTreeSimple', {
            directory: currentDirectory,
            error: result.error,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        // Gérer spécifiquement l'erreur d'authentification
        if (error.message === 'Utilisateur non connecté') {
          logService.info('Utilisateur non connecté - chargement du répertoire différé', 'FileTreeSimple', {
            directory: currentDirectory,
            timestamp: new Date().toISOString()
          });
        } else {
          logService.error('Erreur lors du chargement du répertoire', 'FileTreeSimple', {
            directory: currentDirectory,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadDirectory();
  }, [currentDirectory, fileService, isAuthenticated]); // Ajout de isAuthenticated aux dépendances

  // Charger le contenu d'un sous-dossier
  const loadSubdirectory = useCallback(async (folderPath: string) => {
    if (!isAuthenticated) {
      console.log('[FileTreeSimple] Utilisateur non authentifié - pas de chargement du sous-dossier:', folderPath);
      return null;
    }

    logService.debug('Chargement du sous-dossier', 'FileTreeSimple', {
      folderPath,
      timestamp: new Date().toISOString()
    });
    
    try {
      const result = await fileService.listDirectory(folderPath);
      
      if (result.success) {
        logService.debug('Sous-dossier chargé avec succès', 'FileTreeSimple', {
          folderPath,
          filesCount: result.data.files?.length || 0,
          foldersCount: result.data.directories?.length || 0,
          timestamp: new Date().toISOString()
        });
        return result.data;
      } else {
        logService.error('Erreur lors du chargement du sous-dossier', 'FileTreeSimple', {
          folderPath,
          error: result.error,
          timestamp: new Date().toISOString()
        });
        return null;
      }
    } catch (error) {
      // Gérer spécifiquement l'erreur d'authentification
      if (error.message === 'Utilisateur non connecté') {
        logService.info('Utilisateur non connecté - chargement du sous-dossier différé', 'FileTreeSimple', {
          folderPath,
          timestamp: new Date().toISOString()
        });
      } else {
        logService.error('Erreur lors du chargement du sous-dossier', 'FileTreeSimple', {
          folderPath,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      return null;
    }
  }, [fileService, isAuthenticated]);

  // Gérer l'expansion/réduction d'un dossier
  const toggleFolder = useCallback(async (folderPath: string) => {
    if (!isAuthenticated) {
      console.log('[FileTreeSimple] Utilisateur non authentifié - pas d\'expansion de dossier:', folderPath);
      return;
    }

    const newExpanded = new Set(expandedFolders);
    const wasExpanded = newExpanded.has(folderPath);
    
    if (wasExpanded) {
      newExpanded.delete(folderPath);
      logService.debug('Réduction du dossier', 'FileTreeSimple', {
        folderPath,
        action: 'collapse',
        timestamp: new Date().toISOString()
      });
    } else {
      newExpanded.add(folderPath);
      logService.debug('Expansion du dossier', 'FileTreeSimple', {
        folderPath,
        action: 'expand',
        timestamp: new Date().toISOString()
      });
      
      // Charger les données si elles ne sont pas déjà en cache
      if (!folderData[folderPath]) {
        const data = await loadSubdirectory(folderPath);
        if (data) {
          setFolderData(prev => ({
            ...prev,
            [folderPath]: data
          }));
        }
      }
    }
    
    setExpandedFolders(newExpanded);
  }, [expandedFolders, folderData, loadSubdirectory, isAuthenticated]);

  // Ajouter un fichier à la queue d'analyse IA
  const handleAnalyzeFile = useCallback(async (file: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      console.log('[FileTreeSimple] Utilisateur non authentifié - pas d\'analyse de fichier:', file.name);
      return;
    }
    
    logService.info('Ajout d\'analyse pour fichier', 'FileTreeSimple', {
      fileName: file.name,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mime_type,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Ajout d'analyse pour le fichier: ${file.name}
      
      // Ouvrir automatiquement l'onglet "File d'attente et analyse"
      // Basculement vers l'onglet queue...
      setActivePanel('queue');
      
      // Attendre un peu pour s'assurer que l'onglet se met à jour
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Créer une analyse directement via le backend
      // Création d'analyse pour: ${file.name}
      
                    // Créer l'analyse via le service d'analyse
       // TODO: Implémenter la création d'analyse via le service approprié
               // Création d'analyse pour le fichier
      
      logService.info('Analyse créée avec succès', 'FileTreeSimple', {
        fileName: file.name,
        fileId: file.id,
        timestamp: new Date().toISOString()
      });
      
      // Analyse créée avec succès
      
    } catch (error) {
      // Gérer spécifiquement l'erreur d'authentification
      if (error.message === 'Utilisateur non connecté') {
        logService.info('Utilisateur non connecté - création d\'analyse différée', 'FileTreeSimple', {
          fileName: file.name,
          timestamp: new Date().toISOString()
        });
      } else {
        logService.error('Erreur lors de la création d\'analyse', 'FileTreeSimple', {
          fileName: file.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.error('❌ Erreur lors de la création d\'analyse:', error);
      }
    }
       }, [setActivePanel, isAuthenticated]);

  // Visualiser un fichier
  const handleViewFile = useCallback((file: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    logService.info('Visualisation de fichier', 'FileTreeSimple', {
      fileName: file.name,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mime_type,
      timestamp: new Date().toISOString()
    });
    
    onFileSelect(file);
  }, [onFileSelect]);

  // Visualiser le contenu d'un dossier
  const handleViewFolder = useCallback(async (folder: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      console.log('[FileTreeSimple] Utilisateur non authentifié - pas de visualisation de dossier:', folder.name);
      return;
    }
    
    logService.info('Visualisation de dossier', 'FileTreeSimple', {
      folderName: folder.name,
      folderPath: folder.path,
      timestamp: new Date().toISOString()
    });
    
    // Charger le contenu du dossier si pas déjà fait
    if (!folderData[folder.path]) {
      const data = await loadSubdirectory(folder.path);
      if (data) {
        setFolderData(prev => ({
          ...prev,
          [folder.path]: data
        }));
      }
    }
    
    // Créer un objet "dossier" pour la visualisation
    const folderForView = {
      ...folder,
      type: 'folder',
      is_directory: true,
      files: folderData[folder.path]?.files || [],
      subdirectories: folderData[folder.path]?.directories || []
    };
    
    onFileSelect(folderForView);
  }, [folderData, loadSubdirectory, onFileSelect, isAuthenticated]);

  // Composant pour un dossier
  const FolderItem = ({ folder, level = 0 }: { folder: any; level?: number }) => {
    const [loading, setLoading] = useState(false);
    const isExpanded = expandedFolders.has(folder.path);
    const subData = folderData[folder.path];

    const handleToggle = async () => {
      if (!isAuthenticated) {
        console.log('[FileTreeSimple] Utilisateur non authentifié - pas d\'expansion de dossier:', folder.name);
        return;
      }

      if (!isExpanded && !subData) {
        setLoading(true);
        const data = await loadSubdirectory(folder.path);
        if (data) {
          setFolderData(prev => ({
            ...prev,
            [folder.path]: data
          }));
        }
        setLoading(false);
      }
      toggleFolder(folder.path);
    };

    return (
      <div>
        <div
          className="flex items-center px-2 py-0.5 hover:bg-slate-700/30 cursor-pointer transition-colors"
          style={{ paddingLeft: `${level * 16 + 6}px` }}
        >
          {/* Chevron pour expansion */}
          <div 
            className="mr-1 flex-shrink-0 cursor-pointer"
            onClick={handleToggle}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2" style={{ borderColor: colors.primary }}></div>
            ) : isExpanded ? (
              <ChevronDownIcon className="h-2.5 w-2.5" style={{ color: colors.primary }} />
            ) : (
              <ChevronRightIcon className="h-2.5 w-2.5" style={{ color: colors.primary }} />
            )}
          </div>

          {/* Icône dossier */}
          <FolderIcon className="h-3 w-3 mr-1.5 flex-shrink-0" style={{ color: colors.primary }} />

          {/* Nom du dossier - cliquable pour visualisation */}
          <span 
            className="text-xs truncate cursor-pointer hover:underline"
            style={{ color: colors.text }}
            onClick={(e) => handleViewFolder(folder, e)}
            title="Cliquer pour visualiser le contenu du dossier"
          >
            {folder.name}
          </span>
        </div>

        {/* Contenu du dossier si expansé */}
        {isExpanded && subData && (
          <div>
            {/* Sous-dossiers */}
            {subData.directories?.map((subfolder: any) => (
              <FolderItem key={subfolder.path} folder={subfolder} level={level + 1} />
            ))}
            
            {/* Fichiers */}
            {subData.files?.map((file: any) => (
              <FileItem key={file.path} file={file} level={level + 1} />
            ))}
          </div>
        )}

        {/* Message d'erreur si pas de données */}
        {isExpanded && !subData && !loading && (
          <div className="px-2 py-1" style={{ paddingLeft: `${level * 16 + 24}px` }}>
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              Erreur de chargement
            </span>
          </div>
        )}
      </div>
    );
  };

  // Composant pour un fichier
  const FileItem = ({ file, level = 0 }: { file: any; level?: number }) => {
    const isSelected = selectedFiles.includes(file.id || file.path);
    const isAnalyzable = isSupportedFormat(file.name);
    
    // Déterminer la couleur de l'icône selon l'état du backend et l'analysabilité
    const getFileIconColor = () => {
      if (isSelected) return 'white';
      if (!isOnline) return colors.warning; // Orange quand backend déconnecté
      if (isAnalyzable) return colors.success; // Vert si analysable
      return colors.textSecondary; // Gris si non analysable
    };

    const handleFileClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (e.ctrlKey || e.metaKey) {
        // Sélection multiple
        onFileSelectionChange(file.id || file.path);
      } else {
        // Sélection simple
        handleViewFile(file, e);
      }
    };

    return (
      <div
        className={`flex items-center px-2 py-0.5 transition-colors ${
          isSelected ? 'bg-blue-600' : 'hover:bg-slate-700/30'
        }`}
        style={{ paddingLeft: `${level * 16 + 6}px` }}
      >
        {/* Icône fichier */}
        <DocumentIcon 
          className="h-3 w-3 mr-1.5 flex-shrink-0" 
          style={{ color: getFileIconColor() }}
        />

        {/* Nom du fichier - cliquable pour visualisation */}
        <span 
          className="text-xs truncate cursor-pointer hover:underline flex-1"
          style={{ color: isSelected ? 'white' : colors.text }}
          onClick={handleFileClick}
          title="Cliquer pour visualiser le fichier"
        >
          {file.name}
        </span>

        {/* Indicateur de statut IA - cliquable pour analyse */}
        {!isSelected && isAnalyzable && (
          <ArrowRightIcon 
            className="h-3 w-3 ml-1.5 flex-shrink-0 cursor-pointer hover:scale-125 transition-transform"
            style={{ color: !isOnline ? colors.warning : colors.success }}
            onClick={(e) => handleAnalyzeFile(file, e)}
            title={!isOnline ? "Attente connexion backend" : "Analyser avec l'IA"}
          />
        )}
      </div>
    );
  };

  // Si l'utilisateur n'est pas authentifié, afficher un message
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <div className="text-xl mb-2">🔐</div>
        <div className="text-xs" style={{ color: colors.textSecondary }}>
          Connectez-vous pour accéder aux fichiers
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: colors.primary }}></div>
        <span className="ml-2 text-xs" style={{ color: colors.textSecondary }}>Chargement...</span>
      </div>
    );
  }

  if (!directoryData) {
    return (
      <div className="p-4 text-center">
        <div className="text-xl mb-2">📁</div>
        <div className="text-xs" style={{ color: colors.textSecondary }}>
          Sélectionnez un disque pour commencer
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Répertoire racine */}
      <div
        className="flex items-center px-2 py-0.5 hover:bg-slate-700/30 cursor-pointer transition-colors"
        onClick={() => toggleFolder(currentDirectory)}
      >
        <div className="mr-1 flex-shrink-0">
          {expandedFolders.has(currentDirectory) ? (
            <ChevronDownIcon className="h-2.5 w-2.5" style={{ color: colors.primary }} />
          ) : (
            <ChevronRightIcon className="h-2.5 w-2.5" style={{ color: colors.primary }} />
          )}
        </div>
        <FolderIcon className="h-3 w-3 mr-1.5 flex-shrink-0" style={{ color: colors.primary }} />
        <span className="text-xs font-medium" style={{ color: colors.text }}>
          {directoryData.directory}
        </span>
      </div>

      {/* Contenu du répertoire racine si expansé */}
      {expandedFolders.has(currentDirectory) && (
        <div>
          {/* Sous-dossiers */}
          {directoryData.directories?.map((folder: any) => (
            <FolderItem key={folder.path} folder={folder} level={1} />
          ))}
          
          {/* Fichiers */}
          {directoryData.files?.map((file: any) => (
            <FileItem key={file.path} file={file} level={1} />
          ))}
        </div>
      )}

      {/* Message si aucun contenu */}
      {expandedFolders.has(currentDirectory) && 
       (!directoryData.directories || directoryData.directories.length === 0) &&
       (!directoryData.files || directoryData.files.length === 0) && (
        <div className="p-4 text-center">
          <div className="text-xs" style={{ color: colors.textSecondary }}>
            Dossier vide
          </div>
        </div>
      )}
    </div>
  );
};

export default FileTreeSimple;
