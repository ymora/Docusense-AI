import React, { useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useQueueStore } from '../../stores/queueStore';
import { useConfigStore } from '../../stores/configStore';
import { useColors } from '../../hooks/useColors';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { formatFileSize } from '../../utils/fileUtils';
import { getFileType } from '../../utils/fileTypeUtils';
import { isSupportedFormat } from '../../utils/mediaFormats';

import {
  QueueListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  EyeIcon,
  DocumentTextIcon as LogsIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { ConfigContent } from '../Config/ConfigWindow';

import QueueIAAdvanced from '../Queue/QueueIAAdvanced';
import LogsPanel from '../Logs/LogsPanel';
import TabPanel from '../UI/TabPanel';
import SecureFileViewer from '../FileManager/SecureFileViewer';
import FileDetailsPanel from '../FileManager/FileDetailsPanel';
import ThumbnailGrid from '../FileManager/ThumbnailGrid';
import UnifiedFileViewer from '../FileManager/UnifiedFileViewer';

import { useUIStore } from '../../stores/uiStore';

interface MainPanelProps {
  activePanel: 'main' | 'config' | 'analyses' | 'queue';
  onSetActivePanel?: (panel: 'main' | 'config' | 'analyses' | 'queue') => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ 
  activePanel, 
  onSetActivePanel
}) => {
  const { selectedFile, selectedFiles, files, selectFile } = useFileStore();
  const { colors } = useColors();
  const { isOnline } = useBackendStatus();
  const { queueItems, loadQueueItems } = useQueueStore();
  const { getActiveProviders, isInitialized } = useConfigStore();
  const [activeTab, setActiveTab] = useState('viewer');
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'thumbnails'>('single');

  // Obtenir les providers actifs pour l'indicateur
  const allProviders = getActiveProviders();
  const activeProviders = allProviders.filter(provider => provider.is_active === true);
  
  // Debug pour voir les providers
  console.log('🔍 MainPanel - Providers actifs:', {
    allProviders: allProviders.map(p => ({ name: p.name, is_active: p.is_active, is_functional: p.is_functional })),
    activeProviders: activeProviders.map(p => ({ name: p.name, is_active: p.is_active, is_functional: p.is_functional })),
    count: activeProviders.length
  });

  // Définir les onglets
  const tabs = [
    {
      id: 'config',
      label: 'Configuration IA',
      icon: <Cog6ToothIcon className="h-4 w-4" />,
      count: activeProviders.length,
    },
    {
      id: 'queue',
      label: 'File d\'attente & Analyses',
      icon: <QueueListIcon className="h-4 w-4" />,
      count: queueItems?.length || 0,
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: <LogsIcon className="h-4 w-4" />,
    },
    {
      id: 'viewer',
      label: 'Visualiseur',
      icon: <EyeIcon className="h-4 w-4" />,
    },
  ];

  // Chargement des données de queue
  useEffect(() => {
    // Charger les données initiales seulement au montage
    loadQueueItems();
  }, [loadQueueItems]);

  // Écouter les événements de rechargement de la queue
  useEffect(() => {
    const handleReloadQueue = () => {
    };

    window.addEventListener('reloadQueue', handleReloadQueue);
    return () => {
      window.removeEventListener('reloadQueue', handleReloadQueue);
    };
  }, []);

  // Écouter l'événement d'affichage des détails de fichier
  useEffect(() => {
    const handleShowFileDetails = (event: CustomEvent) => {
      setShowFileDetails(true);
    };

    window.addEventListener('showFileDetails', handleShowFileDetails as EventListener);
    return () => {
      window.removeEventListener('showFileDetails', handleShowFileDetails as EventListener);
    };
  }, []);

  // Écouter l'événement d'affichage des miniatures de dossier
  useEffect(() => {
    const handleViewDirectoryThumbnails = (event: CustomEvent) => {
      const { directoryPath } = event.detail;
      setViewMode('thumbnails');
      setActiveTab('viewer');
      // Charger les fichiers du dossier pour l'affichage en miniatures
      fetchDirectoryFiles(directoryPath);
    };

    window.addEventListener('viewDirectoryThumbnails', handleViewDirectoryThumbnails as EventListener);
    return () => {
      window.removeEventListener('viewDirectoryThumbnails', handleViewDirectoryThumbnails as EventListener);
    };
  }, []);

  // Fonction pour charger les fichiers d'un dossier
  const fetchDirectoryFiles = async (directoryPath: string) => {
    try {
      const response = await fetch(`/api/files/directory-files/${encodeURIComponent(directoryPath)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files) {
          // Mettre à jour les fichiers sélectionnés pour l'affichage en miniatures
          useFileStore.getState().setSelectedFiles(data.files.map((f: any) => f.id));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers du dossier:', error);
    }
  };

  // Détecter automatiquement le mode d'affichage selon la sélection
  useEffect(() => {
    if (selectedFiles.length > 1) {
      // Plusieurs fichiers sélectionnés → mode miniatures
      setViewMode('thumbnails');
    } else if (selectedFile) {
      // Un seul fichier sélectionné → mode unique
      setViewMode('single');
    }
  }, [selectedFiles.length, selectedFile]);

  // Fonction pour obtenir le composant de visualisation approprié
  const getViewerComponent = (file: any) => {
    // Si c'est un dossier, afficher en mode miniature
    if (file.type === 'folder') {
      return (
        <div className="h-full w-full p-4 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="mb-4 flex-shrink-0">
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                📁 {file.name}
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {file.files?.length || 0} fichier(s), {file.subdirectories?.length || 0} sous-dossier(s)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Affichage des fichiers dans le dossier */}
              {file.files && file.files.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-3" style={{ color: colors.text }}>
                    Fichiers
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {file.files.map((f: any) => (
                      <div
                        key={f.path}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
                        style={{ borderColor: colors.border }}
                        onClick={() => {
                          // Sélectionner ce fichier pour l'affichage
                          selectFile(f);
                        }}
                      >
                        <div className="text-center">
                          {getFileType(f.name, f.mime_type) === 'image' ? (
                            <PhotoIcon className="h-8 w-8 mx-auto mb-2" style={{ color: colors.primary }} />
                          ) : getFileType(f.name, f.mime_type) === 'video' ? (
                            <FilmIcon className="h-8 w-8 mx-auto mb-2" style={{ color: colors.primary }} />
                          ) : getFileType(f.name, f.mime_type) === 'audio' ? (
                            <MusicalNoteIcon className="h-8 w-8 mx-auto mb-2" style={{ color: colors.primary }} />
                          ) : (
                            <DocumentTextIcon className="h-8 w-8 mx-auto mb-2" style={{ color: colors.primary }} />
                          )}
                          <div className="text-xs truncate" style={{ color: colors.text }}>
                            {f.name}
                          </div>
                          <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            {formatFileSize(f.size)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Affichage des sous-dossiers */}
              {file.subdirectories && file.subdirectories.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-3" style={{ color: colors.text }}>
                    Sous-dossiers
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {file.subdirectories.map((subfolder: any) => (
                      <div
                        key={subfolder.path}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
                        style={{ borderColor: colors.border }}
                        onClick={() => {
                          // Créer un objet dossier pour la visualisation
                          const folderForView = {
                            ...subfolder,
                            type: 'folder',
                            files: [], // Sera chargé si nécessaire
                            subdirectories: []
                          };
                          selectFile(folderForView);
                        }}
                      >
                        <div className="text-center">
                          <FolderIcon className="h-8 w-8 mx-auto mb-2" style={{ color: colors.primary }} />
                          <div className="text-xs truncate" style={{ color: colors.text }}>
                            {subfolder.name}
                          </div>
                          <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                            Dossier
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si dossier vide */}
              {(!file.files || file.files.length === 0) && (!file.subdirectories || file.subdirectories.length === 0) && (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">📁</div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Ce dossier est vide
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Pour les fichiers normaux, utiliser le visualiseur existant avec conteneur redimensionné
    return (
      <div className="h-full w-full">
        <UnifiedFileViewer 
          file={file}
          onClose={() => {
            // Logique de fermeture si nécessaire
          }}
        />
      </div>
    );
  };

  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 'queue':
        return <QueueIAAdvanced />;

      case 'config':
        return <ConfigContent />;

      case 'logs':
        return <LogsPanel />;

      case 'viewer':
      default:
        // Interface principale - visualiseur de fichiers
        return (
          <div className="h-full flex flex-col">
            {/* Barre d'outils pour le mode d'affichage */}
            {selectedFiles.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium" style={{ color: colors.text }}>
                    {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
                  </span>
                  {selectedFiles.length > 1 && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setViewMode('single')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          viewMode === 'single' 
                            ? 'bg-blue-600 text-white' 
                            : 'hover:bg-slate-700'
                        }`}
                        style={{ color: viewMode === 'single' ? 'white' : colors.text }}
                      >
                        <EyeIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setViewMode('thumbnails')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          viewMode === 'thumbnails' 
                            ? 'bg-blue-600 text-white' 
                            : 'hover:bg-slate-700'
                        }`}
                        style={{ color: viewMode === 'thumbnails' ? 'white' : colors.text }}
                      >
                        <PhotoIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Indicateur de support IA */}
                {selectedFiles.length === 1 && selectedFile && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs" style={{ color: colors.textSecondary }}>
                      {isSupportedFormat(selectedFile.name) ? 'Supporté par l\'IA' : 'Non supporté par l\'IA'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Zone de visualisation redimensionnée pour tenir dans le conteneur */}
            <div className="flex-1 overflow-hidden">
              {selectedFiles.length === 0 ? (
                // Aucun fichier sélectionné
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📁</div>
                    <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                      Aucun fichier sélectionné
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Sélectionnez un fichier dans l'arborescence pour le visualiser
                    </p>
                  </div>
                </div>
              ) : selectedFiles.length === 1 && selectedFile ? (
                // Un seul fichier sélectionné - conteneur redimensionné
                <div className="h-full w-full">
                  {getViewerComponent(selectedFile)}
                </div>
              ) : selectedFiles.length > 1 ? (
                // Plusieurs fichiers sélectionnés - conteneur redimensionné
                <div className="h-full w-full overflow-hidden">
                  {viewMode === 'thumbnails' ? (
                    <ThumbnailGrid 
                      files={files.filter(f => selectedFiles.includes(f.id || f.path))}
                      onFileSelect={(file) => {
                        // Sélectionner le fichier pour l'affichage unique
                        selectFile(file);
                      }}
                    />
                  ) : (
                    // Mode liste pour plusieurs fichiers - conteneur redimensionné
                    <div className="h-full w-full p-4 overflow-hidden">
                      <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                        {files
                          .filter(f => selectedFiles.includes(f.id || f.path))
                          .map((file) => (
                            <div
                              key={file.id || file.path}
                              className="p-4 border rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
                              style={{ borderColor: colors.border }}
                              onClick={() => {
                                // Sélectionner ce fichier pour l'affichage
                                selectFile(file);
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                {getFileType(file.name, file.mime_type) === 'image' ? (
                                  <PhotoIcon className="h-8 w-8" style={{ color: colors.primary }} />
                                ) : getFileType(file.name, file.mime_type) === 'video' ? (
                                  <FilmIcon className="h-8 w-8" style={{ color: colors.primary }} />
                                ) : getFileType(file.name, file.mime_type) === 'audio' ? (
                                  <MusicalNoteIcon className="h-8 w-8" style={{ color: colors.primary }} />
                                ) : (
                                  <DocumentTextIcon className="h-8 w-8" style={{ color: colors.primary }} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium truncate" style={{ color: colors.text }}>
                                    {file.name}
                                  </h4>
                                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                                    {formatFileSize(file.size)}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs" style={{ color: colors.textSecondary }}>
                                      {isSupportedFormat(file.name) ? 'Supporté' : 'Non supporté'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // État de chargement ou erreur
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Chargement...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden relative"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      {/* Onglets */}
      <TabPanel 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      {/* Contenu des onglets */}
      <div className="flex-1 min-h-0">
        {renderTabContent()}
      </div>

      {/* Panneau de détails du fichier */}
      <FileDetailsPanel
        file={selectedFile}
        onClose={() => setShowFileDetails(false)}
        showDetails={showFileDetails}
      />
    </div>
  );
};

export default MainPanel;