import React, { useState, useEffect, useCallback } from 'react';
import { FolderIcon, DocumentIcon, ChevronRightIcon, ChevronDownIcon, ArrowRightIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';

import { isSupportedFormat } from '../../utils/mediaFormats';
import { useUIStore } from '../../stores/uiStore';
import { analysisService } from '../../services/analysisService';
import { logService } from '../../services/logService';
import { useStreamService } from '../../services/streamService';
import { useAnalysisStore } from '../../stores/analysisStore';

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
  const { startStream, stopStream } = useStreamService();
  const { addAnalysis } = useAnalysisStore();

  const [directoryData, setDirectoryData] = useState<any>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderData, setFolderData] = useState<Record<string, any>>({}); // Stockage global des données des dossiers
  const [loading, setLoading] = useState(false);
  const [analysisQueue, setAnalysisQueue] = useState<Set<string>>(new Set()); // Fichiers en cours d'ajout à la queue

  // Charger les données du répertoire actuel
  useEffect(() => {
    const loadDirectory = async () => {
      if (!currentDirectory) return;
      
      setLoading(true);
      logService.info('Chargement du répertoire', 'FileTreeSimple', {
        directory: currentDirectory,
        timestamp: new Date().toISOString()
      });
      
      try {
        const encodedDirectory = encodeURIComponent(currentDirectory.replace(/\\/g, '/'));
        const response = await fetch(`/api/files/list/${encodedDirectory}`);
        const data = await response.json();
        
        if (data.success) {
          setDirectoryData(data.data);
          // Expansion automatique du répertoire racine
          setExpandedFolders(new Set([currentDirectory]));
          
          logService.info('Répertoire chargé avec succès', 'FileTreeSimple', {
            directory: currentDirectory,
            filesCount: data.data.files?.length || 0,
            foldersCount: data.data.subdirectories?.length || 0,
            timestamp: new Date().toISOString()
          });
        } else {
          logService.error('Erreur lors du chargement du répertoire', 'FileTreeSimple', {
            directory: currentDirectory,
            error: data,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logService.error('Erreur lors du chargement du répertoire', 'FileTreeSimple', {
          directory: currentDirectory,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    loadDirectory();
  }, [currentDirectory]);

  // Stream SSE pour les mises à jour des analyses (optionnel)
  useEffect(() => {
    const streamStarted = startStream('analyses', {
      onMessage: (message) => {
        if (message.type === 'analysis_created') {
          // Retirer le fichier de la queue d'ajout
          setAnalysisQueue(prev => {
            const newQueue = new Set(prev);
            newQueue.delete(message.file_path);
            return newQueue;
          });
        }
      },
      onError: (error) => {
        // Erreur silencieuse - fonctionnement normal sans stream
        logService.debug('Stream analyses non disponible, fonctionnement normal', 'FileTreeSimple');
      }
    });

    return () => {
      if (streamStarted) {
        stopStream('analyses');
      }
    };
  }, [startStream, stopStream]);

  // Charger le contenu d'un sous-dossier
  const loadSubdirectory = useCallback(async (folderPath: string) => {
    logService.debug('Chargement du sous-dossier', 'FileTreeSimple', {
      folderPath,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Pour Windows, utiliser les backslashes et encoder correctement
      const normalizedPath = folderPath.replace(/\//g, '\\');
      const encodedPath = encodeURIComponent(normalizedPath);
      const response = await fetch(`/api/files/list/${encodedPath}`);
      const data = await response.json();
      
      if (data.success) {
        logService.debug('Sous-dossier chargé avec succès', 'FileTreeSimple', {
          folderPath,
          filesCount: data.data.files?.length || 0,
          foldersCount: data.data.subdirectories?.length || 0,
          timestamp: new Date().toISOString()
        });
        return data.data;
      } else {
        logService.error('Erreur lors du chargement du sous-dossier', 'FileTreeSimple', {
          folderPath,
          error: data,
          timestamp: new Date().toISOString()
        });
        return null;
      }
    } catch (error) {
      logService.error('Erreur lors du chargement du sous-dossier', 'FileTreeSimple', {
        folderPath,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }, []);

  // Gérer l'expansion/réduction d'un dossier
  const toggleFolder = useCallback(async (folderPath: string) => {
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
  }, [expandedFolders, folderData, loadSubdirectory]);

  // Ajouter un fichier à la queue d'analyse IA avec feedback visuel
  const handleAnalyzeFile = useCallback(async (file: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Vérifier si le fichier est déjà en cours d'ajout
    if (analysisQueue.has(file.path)) {
      logService.info('Fichier déjà en cours d\'ajout à la queue', 'FileTreeSimple', {
        fileName: file.name,
        filePath: file.path
      });
      return;
    }
    
    // Ajouter le fichier à la queue d'ajout
    setAnalysisQueue(prev => new Set(prev).add(file.path));
    
    logService.info('Ajout d\'analyse pour fichier', 'FileTreeSimple', {
      fileName: file.name,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mime_type,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Ouvrir automatiquement l'onglet "File d'attente et analyse"
      setActivePanel('queue');
      
      // Attendre un peu pour s'assurer que l'onglet se met à jour
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Créer l'analyse via le service avec prompt intelligent
      const analysisRequest = {
        file_id: file.id,
        file_path: file.path,
        analysis_type: 'general',
        prompt_id: 'general_summary',
        provider: 'ollama', // Par défaut Ollama pour la rapidité
        model: 'llama3.2',
        custom_prompt: `Analyse générale du document "${file.name}". Fournis un résumé détaillé, les points clés et les informations importantes.`
      };
      
      const result = await analysisService.createAnalysis(analysisRequest);
      
      // Ajouter l'analyse au store pour mise à jour immédiate
      if (result && result.id) {
        addAnalysis({
          id: result.id,
          file_id: file.id,
          file_path: file.path,
          file_name: file.name,
          status: 'pending',
          analysis_type: 'general',
          prompt_id: 'general_summary',
          provider: 'ollama',
          model: 'llama3.2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      logService.info('Analyse créée avec succès', 'FileTreeSimple', {
        fileName: file.name,
        fileId: file.id,
        analysisId: result?.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      // Retirer le fichier de la queue en cas d'erreur
      setAnalysisQueue(prev => {
        const newQueue = new Set(prev);
        newQueue.delete(file.path);
        return newQueue;
      });
      
      logService.error('Erreur lors de la création d\'analyse', 'FileTreeSimple', {
        fileName: file.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }, [setActivePanel, analysisQueue, addAnalysis]);

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
      subdirectories: folderData[folder.path]?.subdirectories || []
    };
    
    onFileSelect(folderForView);
  }, [folderData, loadSubdirectory, onFileSelect]);

  // Composant pour un dossier
  const FolderItem = ({ folder, level = 0 }: { folder: any; level?: number }) => {
    const [loading, setLoading] = useState(false);
    const isExpanded = expandedFolders.has(folder.path);
    const subData = folderData[folder.path];

    const handleToggle = async () => {
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
            {subData.subdirectories?.map((subfolder: any) => (
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
      return colors.success; // Toujours vert maintenant
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
          <div className="flex items-center ml-1.5">
            {analysisQueue.has(file.path) ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2" style={{ borderColor: colors.primary }}></div>
                <span className="text-xs ml-1" style={{ color: colors.textSecondary }}>Ajout...</span>
              </div>
            ) : (
              <PlayIcon 
                className="h-3 w-3 flex-shrink-0 cursor-pointer hover:scale-125 transition-transform"
                style={{ color: colors.success }}
                onClick={(e) => handleAnalyzeFile(file, e)}
                title="Ajouter à la queue d'analyse IA"
              />
            )}
          </div>
        )}
      </div>
    );
  };

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
          {directoryData.subdirectories?.map((folder: any) => (
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
       (!directoryData.subdirectories || directoryData.subdirectories.length === 0) &&
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
