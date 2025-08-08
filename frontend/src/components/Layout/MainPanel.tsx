import React, { useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useQueueStore } from '../../stores/queueStore';
import { useColors } from '../../hooks/useColors';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { formatFileSize } from '../../utils/fileUtils';

import {
  XMarkIcon,
  QueueListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
  ClockIcon as ClockIconSolid,
  FireIcon,
  BoltIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  CalendarIcon,
  UserGroupIcon,
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  EyeIcon,
  DocumentMagnifyingGlassIcon as SearchIcon
} from '@heroicons/react/24/outline';
import { ConfigContent } from '../Config/ConfigWindow';
import QueueContent from '../Queue/QueuePanel';
import UnifiedFileViewer from '../FileManager/UnifiedFileViewer';
import PromptSelector from '../FileManager/PromptSelector';
import EmailAttachmentViewer from '../FileManager/EmailAttachmentViewer';
import { AnalysisListContent } from '../Analysis/AnalysisListContent';

import { useUIStore } from '../../stores/uiStore';

interface MainPanelProps {
  activePanel: 'main' | 'config' | 'analyses' | 'queue';
  showPromptSelector?: boolean;
  promptSelectorMode?: 'single' | 'comparison' | 'batch';
  promptSelectorFileIds?: number[];
  onPromptSelect?: (promptId: string, prompt: any) => void;
  onClosePromptSelector?: () => void;
  onSetActivePanel?: (panel: 'main' | 'config' | 'analyses' | 'queue') => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ 
  activePanel, 
  showPromptSelector = false,
  promptSelectorMode = 'single',
  promptSelectorFileIds = [],
  onPromptSelect,
  onClosePromptSelector,
  onSetActivePanel
}) => {
  const { selectedFile, selectedFiles } = useFileStore();
  const { colors } = useColors();
  const { isOnline } = useBackendStatus();
  const { queueItems, queueStatus, loadQueueStatus } = useQueueStore();

  // États pour la prévisualisation des pièces jointes d'email
  const [emailAttachmentPreview, setEmailAttachmentPreview] = useState<{
    attachment: any;
    index: number;
  } | null>(null);

  // Chargement des données de queue
  useEffect(() => {
    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 15000);
    return () => clearInterval(interval);
  }, [loadQueueStatus]);

  // Écouter les événements de rechargement de la queue
  useEffect(() => {
    const handleReloadQueue = () => {
      loadQueueStatus();
    };

    window.addEventListener('reloadQueue', handleReloadQueue);
    return () => {
      window.removeEventListener('reloadQueue', handleReloadQueue);
    };
  }, [loadQueueStatus]);

  // NOTE: L'initialisation est maintenant gérée par useStartupInitialization dans LeftPanel
  // Plus besoin d'initialisation dupliquée ici

  // Fonction pour gérer la prévisualisation des pièces jointes d'email
  const handleEmailAttachmentPreview = (attachment: any, index: number) => {
    setEmailAttachmentPreview({ attachment, index });
  };

  // Fonction pour revenir à l'email
  const handleBackToEmail = () => {
    setEmailAttachmentPreview(null);
  };

  // Rendu du contenu selon le panel actif
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'queue':
        return (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b" style={{ borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <QueueListIcon className="h-6 w-6" style={{ color: colors.queue }} />
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
                      File d'attente des analyses IA
                    </h2>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Suivi en temps réel des analyses en cours
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>
                    {queueStatus.total_items} analyses
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <QueueContent />
            </div>
          </div>
        );

      case 'config':
        return (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b" style={{ borderColor: colors.border }}>
              <div className="flex items-center space-x-3">
                <Cog6ToothIcon className="h-6 w-6" style={{ color: colors.config }} />
                <div>
                  <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
                    Configuration IA
                  </h2>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Gérez vos providers IA et leurs paramètres
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConfigContent />
            </div>
          </div>
        );

      case 'analyses':
        return <AnalysisListContent />;



      case 'main':
      default:
        // PromptSelector intégré dans le MainPanel
        if (showPromptSelector) {
          return (
            <div className="h-full">
              <PromptSelector
                isOpen={true}
                onClose={onClosePromptSelector || (() => {})}
                onPromptSelect={onPromptSelect || (() => {})}
                fileIds={promptSelectorFileIds}
                mode={promptSelectorMode}
                fileType={selectedFile?.mime_type}
              />
            </div>
          );
        }

        // Prévisualisation de pièce jointe d'email
        if (emailAttachmentPreview) {
          return (
            <EmailAttachmentViewer
              file={selectedFile}
              attachment={emailAttachmentPreview.attachment}
              attachmentIndex={emailAttachmentPreview.index}
              onBack={handleBackToEmail}
            />
          );
        }

        // Interface principale
        return (
          <div className="h-full flex flex-col">
            {/* Header seulement si aucun fichier n'est sélectionné */}
            {!selectedFile && (
              <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📁</div>
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
                      DocuSense AI
                    </h2>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Gérez vos analyses IA
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-4">
              
              {/* Section Fichier sélectionné avec visualisation automatique */}
              {selectedFile && (
                <div className="mb-6">
                  
                  
                  {/* Visualisation directe du contenu */}
                  <div className="rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                    <UnifiedFileViewer 
                      file={selectedFile} 
                      onPreviewAttachment={handleEmailAttachmentPreview}
                    />
                  </div>

                  {/* Affichage des pièces jointes si en mode prévisualisation */}
                  {emailAttachmentPreview && emailAttachmentPreview.attachment && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                          Pièce jointe
                        </label>
                        <button
                          onClick={handleBackToEmail}
                          className="text-xs px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                          style={{ color: colors.textSecondary }}
                        >
                          ← Retour à l'email
                        </button>
                      </div>
                      <div className="rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                        <EmailAttachmentViewer
                          file={selectedFile}
                          attachment={emailAttachmentPreview.attachment}
                          attachmentIndex={emailAttachmentPreview.index}
                          onBack={handleBackToEmail}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Message si aucun fichier sélectionné */}
              {!selectedFile && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📁</div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                    Aucun fichier sélectionné
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Sélectionnez un fichier dans l'arborescence pour le visualiser
                  </p>
                </div>
              )}

              {/* Indicateur de queue en mode principal */}
              {queueItems.length > 0 && activePanel === 'main' && (
                <div className="mt-8 p-4 rounded-lg border" style={{ 
                  backgroundColor: colors.surface,
                  borderColor: colors.border 
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <QueueListIcon className="h-5 w-5" style={{ color: colors.queue }} />
                      <span className="text-sm font-medium" style={{ color: colors.text }}>
                        {queueStatus.total_items} analyse{queueStatus.total_items > 1 ? 's' : ''} en cours
                      </span>
                    </div>
                    <button
                      onClick={() => onSetActivePanel?.('queue')}
                      className="text-xs px-3 py-1 rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: colors.queue,
                        color: colors.background
                      }}
                    >
                      Voir la queue
                    </button>
                  </div>
                  
                  {/* Statistiques rapides */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <ClockIcon className="h-4 w-4 text-blue-400 mr-1" />
                        <span className="text-sm font-semibold text-blue-400">{queueStatus.pending_items}</span>
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>En attente</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <PlayIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-semibold text-yellow-400">{queueStatus.processing_items}</span>
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>En cours</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <CheckCircleIcon className="h-4 w-4 text-green-400 mr-1" />
                        <span className="text-sm font-semibold text-green-400">{queueStatus.completed_items}</span>
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>Terminées</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-1" />
                        <span className="text-sm font-semibold text-red-400">{queueStatus.failed_items || 0}</span>
                      </div>
                      <span className="text-xs" style={{ color: colors.textSecondary }}>Erreurs</span>
                    </div>
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
      className="flex-1 flex flex-col overflow-hidden relative min-h-screen-dynamic"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      {renderPanelContent()}
    </div>
  );
};

export default MainPanel;