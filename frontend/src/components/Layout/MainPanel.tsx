import React, { useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useConfigStore } from '../../stores/configStore';
import { logService } from '../../services/logService';
import { useColors } from '../../hooks/useColors';
import { formatFileSize } from '../../utils/fileUtils';
import { getFileType } from '../../utils/fileTypeUtils';
import { isSupportedFormat } from '../../utils/mediaFormats';
import { useFileService } from '../../services/fileService';

import {
  Cog6ToothIcon,
  DocumentTextIcon,
  EyeIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';


import { QueueIAAdvanced } from '../Queue/QueueIAAdvanced';
import LogsPanel from '../Logs/LogsPanel';
// AdminPanel supprimé - intégré directement dans MainPanel
import SystemPanel from '../Admin/SystemPanel';
import TabNavigation from '../UI/TabNavigation';
import SecureFileViewer from '../FileManager/SecureFileViewer';
import FileDetailsPanel from '../FileManager/FileDetailsPanel';
import ThumbnailGrid from '../FileManager/ThumbnailGrid';
import UnifiedFileViewer from '../FileManager/UnifiedFileViewer';
import { ConfigContent } from '../Config/ConfigWindow';
import UsersPanel from '../Admin/UsersPanel';
import APIDocsPanel from '../Admin/APIDocsPanel';
import { ReferenceDocumentsPanel } from '../ReferenceDocuments/ReferenceDocumentsPanel';

import { useUIStore } from '../../stores/uiStore';
import { useStartupInitialization } from '../../hooks/useStartupInitialization';
import useAuthStore from '../../stores/authStore';
import { UserIcon } from '../UI/UserIcon';


interface MainPanelProps {
  activePanel: 'viewer' | 'queue' | 'logs' | 'system' | 'ai-config' | 'users' | 'api-docs' | 'reference-docs';
  onSetActivePanel?: (panel: 'viewer' | 'queue' | 'logs' | 'system' | 'ai-config' | 'users' | 'api-docs' | 'reference-docs') => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ 
  activePanel, 
  onSetActivePanel
}) => {
  const { selectedFile, selectedFiles, files, selectFile } = useFileStore();
  const { colors } = useColors();
  const { getAnalysesCount, analyses } = useAnalysisStore();
  const { getActiveProviders } = useConfigStore();
  const { isInitialized, isLoading, initializationStep } = useStartupInitialization();
  const fileService = useFileService();
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'thumbnails'>('single');
  const [logsCount, setLogsCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const { isAdmin } = useAuthStore();


  // OPTIMISATION: Chargement des providers une seule fois
  const allProviders = getActiveProviders();
  const activeProviders = allProviders.filter(provider => provider.is_active === true);
  
  // Charger le nombre de logs et calculer les erreurs/warnings
  useEffect(() => {
    const updateLogsCount = () => {
      const logs = logService.getLogs();
      setLogsCount(logs.length);
      
      // Calculer le nombre d'erreurs et de warnings
      const errors = logs.filter(log => log.level === 'error').length;
      const warnings = logs.filter(log => log.level === 'warning').length;
      setErrorCount(errors);
      setWarningCount(warnings);
    };
    
    // Charger le nombre initial
    updateLogsCount();
    
    // S'abonner aux changements de logs
    const unsubscribe = logService.subscribe(() => {
      updateLogsCount();
    });
    
    return unsubscribe;
  }, []);
  
  const getViewerComponent = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {!selectedFile && selectedFiles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <EyeIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.textSecondary }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                Aucun fichier sélectionné
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Sélectionnez un fichier dans l'arborescence pour le visualiser
              </p>
            </div>
                          </div>
        ) : selectedFiles.length > 1 ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                    Fichiers sélectionnés ({selectedFiles.length})
                  </h2>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Mode visualisation multiple
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('single')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === 'single' ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor: viewMode === 'single' ? colors.primary : 'transparent',
                      color: viewMode === 'single' ? colors.background : colors.textSecondary,
                      border: `1px solid ${viewMode === 'single' ? colors.primary : colors.border}`,
                    }}
                  >
                    Vue unique
                  </button>
                  <button
                    onClick={() => setViewMode('thumbnails')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === 'thumbnails' ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor: viewMode === 'thumbnails' ? colors.primary : 'transparent',
                      color: viewMode === 'thumbnails' ? colors.background : colors.textSecondary,
                      border: `1px solid ${viewMode === 'thumbnails' ? colors.primary : colors.border}`,
                    }}
                  >
                    Miniatures
                  </button>
                          </div>
                        </div>
                      </div>
            
            <div className="flex-1 overflow-hidden">
              {viewMode === 'single' ? (
                <UnifiedFileViewer
                  file={selectedFile}
                />
              ) : (
                <ThumbnailGrid
                  files={files.filter(f => selectedFiles.includes(f.id || f.path))}
                  onFileSelect={selectFile}
                />
              )}
            </div>
          </div>
        ) : (() => {
          // Vue unique pour un seul fichier
          const fileToShow = selectedFile || files.find(f => selectedFiles.includes(f.id || f.path));
          
          if (!fileToShow) {
            return (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.warning }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                    Fichier non trouvé
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Le fichier sélectionné n'est plus disponible
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getFileType(fileToShow.name) === 'image' && <PhotoIcon className="h-5 w-5" style={{ color: colors.primary }} />}
                      {getFileType(fileToShow.name) === 'video' && <FilmIcon className="h-5 w-5" style={{ color: colors.primary }} />}
                      {getFileType(fileToShow.name) === 'audio' && <MusicalNoteIcon className="h-5 w-5" style={{ color: colors.primary }} />}
                      {getFileType(fileToShow.name) === 'document' && <DocumentTextIcon className="h-5 w-5" style={{ color: colors.primary }} />}
                      {getFileType(fileToShow.name) === 'document' && <FolderIcon className="h-5 w-5" style={{ color: colors.primary }} />}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                        {fileToShow.name}
                      </h2>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        {fileToShow.size ? formatFileSize(fileToShow.size) : 'Taille inconnue'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowFileDetails(!showFileDetails)}
                      className="px-3 py-1 rounded text-sm font-medium transition-colors border"
                      style={{
                        backgroundColor: showFileDetails ? colors.primary : 'transparent',
                        color: showFileDetails ? colors.background : colors.text,
                        borderColor: colors.border,
                      }}
                    >
                      {showFileDetails ? 'Masquer détails' : 'Afficher détails'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="h-full flex">
                  <div className={`flex-1 overflow-hidden ${showFileDetails ? 'border-r' : ''}`} style={{ borderColor: colors.border }}>
                    <SecureFileViewer
                      file={fileToShow}
                    />
                  </div>
                  {showFileDetails && (
                    <div className="w-80 overflow-y-auto">
                      <FileDetailsPanel file={fileToShow} onClose={() => setShowFileDetails(false)} />
                </div>
              )}
            </div>
          </div>
        </div>
      );
        })()}
      </div>
    );
  };

  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    // Vérifier les permissions pour les onglets admin
    if ((activePanel === 'system' || activePanel === 'ai-config' || activePanel === 'users' || activePanel === 'api-docs' || activePanel === 'reference-docs') && !isAdmin()) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.warning }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
              Accès refusé
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Vous devez être administrateur pour accéder à ce panneau.
            </p>
          </div>
        </div>
      );
    }

    switch (activePanel) {
      case 'queue':
        return (
          <div className="flex-1 overflow-hidden">
            <QueueIAAdvanced />
          </div>
        );

      case 'viewer':
        return getViewerComponent();

      case 'logs':
        return (
          <div className="flex-1 overflow-hidden">
            <LogsPanel />
          </div>
        );
      
      case 'system':
        return (
          <div className="flex-1 overflow-hidden">
            <SystemPanel />
          </div>
        );
      
      case 'ai-config':
        return (
          <div className="flex-1 overflow-hidden">
            <ConfigContent />
                    </div>
        );
      
      case 'users':
        return (
          <div className="flex-1 overflow-hidden">
            <UsersPanel />
                </div>
        );
      
      case 'api-docs':
        return (
          <div className="flex-1 overflow-hidden">
            <APIDocsPanel />
                  </div>
        );
      
      case 'reference-docs':
        return (
          <div className="flex-1 overflow-hidden">
            <ReferenceDocumentsPanel isAdminMode={true} />
                  </div>
        );
      
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
              <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.warning }} />
                    <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                Onglet non trouvé
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                L'onglet "{activePanel}" n'existe pas.
              </p>
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
      {/* Panneau haut (fixe) */}
      <div className="flex-shrink-0">
        {/* Header avec navigation et bouton utilisateur */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
          {/* TabNavigation (onglets) */}
          <div className="flex-1">
            <TabNavigation 
              activePanel={activePanel} 
              onTabChange={onSetActivePanel} 
            />
          </div>
          
          {/* Bouton utilisateur aligné à droite */}
          <div className="ml-4">
            <UserIcon />
          </div>
        </div>
        
        {/* Description dynamique */}
        <div className="p-4" style={{ borderColor: colors.border }}>
          {activePanel === 'queue' && (
            <>
              <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                Queue IA
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Gestion de la file d'attente des analyses IA
              </p>
            </>
          )}
          {activePanel === 'logs' && (
            <>
              <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                Logs
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Gestion et consultation des logs système avec filtres et actions
              </p>
            </>
          )}
          {activePanel === 'system' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                    Administration Système
                  </h1>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Monitoring et santé du backend DocuSense AI
                  </p>
                </div>
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  Actualisation automatique toutes les 30s
                </span>
              </div>
            </>
          )}

          {activePanel === 'ai-config' && (
            <>
              <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                Configuration IA
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Gestion des providers IA et validation des clés API
              </p>
            </>
          )}
          {activePanel === 'users' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                    Gestion des Utilisateurs
                  </h1>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Administration des comptes utilisateurs et permissions
                  </p>
                </div>
                <div className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: colors.primary + '20', color: colors.primary }}>
                  {/* Le nombre d'utilisateurs sera injecté ici via un store ou prop */}
                  <span id="users-count">-</span> utilisateur(s) trouvé(s)
                </div>
              </div>
            </>
          )}
          {activePanel === 'viewer' && (
            <>
              <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                Visualiseur de fichiers
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Visualisation et gestion des fichiers sélectionnés
              </p>
            </>
          )}
          {activePanel === 'api-docs' && (
            <>
              <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                API Docs
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Documentation de l'API DocuSense AI
              </p>
            </>
          )}
          {activePanel === 'reference-docs' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                    Documentation de Référence
                  </h1>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Gestion complète de la base de connaissances
                  </p>
                </div>
                <div className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: colors.primary + '20', color: colors.primary }}>
                  <span id="docs-count">-</span> document(s) disponible(s)
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>


    </div>
  );
};

export default MainPanel;