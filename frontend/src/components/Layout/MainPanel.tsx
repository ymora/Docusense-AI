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
  ChartBarIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
  ClockIcon as ClockIconSolid,
  FireIcon,
  BoltIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
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
import { analysisService } from '../../services/analysisService';
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

  // États pour les statistiques IA
  const [analysisStats, setAnalysisStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

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

  // Charger les statistiques IA
  const loadAnalysisStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await analysisService.getAnalysisStats();
      setAnalysisStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Charger les statistiques au montage
  useEffect(() => {
    if (activePanel === 'main') {
      loadAnalysisStats();
    }
  }, [activePanel]);

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



  // Données de statistiques simulées (à remplacer par les vraies données)
  const statsData = {
    // Statistiques générales
    total_analyses: 0,
    successful_analyses: 0,
    failed_analyses: 0,
    success_rate: 0,
    
    // Performance
    avg_processing_time: 0,
    fastest_analysis: 0,
    slowest_analysis: 0,
    total_processing_time: 0,
    
    // Coûts
    total_cost: 0,
    avg_cost_per_analysis: 0,
    cost_by_provider: {
      openai: 0,
      claude: 0,
      mistral: 0,
      ollama: 0
    },
    
    // Utilisation par type
    analyses_by_type: {
      general: 0,
      summary: 0,
      extraction: 0,
      classification: 0,
      ocr: 0,
      juridical: 0,
      technical: 0,
      administrative: 0,
      comparison: 0
    },
    
    // Utilisation par provider
    analyses_by_provider: {
      openai: 0,
      claude: 0,
      mistral: 0,
      ollama: 0
    },
    
    // Fichiers traités
    files_processed: 0,
    total_file_size: 0,
    files_by_type: {
      pdf: 0,
      docx: 0,
      txt: 0,
      email: 0,
      image: 0,
      video: 0,
      audio: 0,
      other: 0
    },
    
    // Activité temporelle
    analyses_today: 0,
    analyses_this_week: 0,
    analyses_this_month: 0,
    peak_hour: '14:00',
    peak_day: 'Mardi',
    
    // Qualité
    avg_confidence_score: 0,
    high_confidence_analyses: 0,
    low_confidence_analyses: 0,
    
    // Erreurs
    error_types: {
      timeout: 0,
      api_error: 0,
      file_error: 0,
      format_error: 0,
      other: 0
    }
  };

  // Composant pour afficher une métrique
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = colors.text,
    bgColor = colors.surface,
    trend = null 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: string;
    bgColor?: string;
    trend?: 'up' | 'down' | null;
  }) => (
    <div 
      className="p-4 rounded-lg border"
      style={{ 
        backgroundColor: bgColor,
        borderColor: colors.border 
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5" style={{ color }} />
          <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>
            {title}
          </span>
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            {trend === 'up' ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-xs" style={{ color: colors.textSecondary }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  // Composant pour afficher un graphique en barres simple
  const SimpleBarChart = ({ 
    data, 
    title, 
    maxValue = 100,
    height = 120 
  }: {
    data: Record<string, number>;
    title: string;
    maxValue?: number;
    height?: number;
  }) => (
    <div className="p-4 rounded-lg border" style={{ 
      backgroundColor: colors.surface,
      borderColor: colors.border 
    }}>
      <h4 className="text-sm font-medium mb-3" style={{ color: colors.text }}>
        {title}
      </h4>
      <div className="space-y-2" style={{ height }}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center space-x-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs truncate" style={{ color: colors.textSecondary }}>
                  {key}
                </span>
                <span className="text-xs font-medium" style={{ color: colors.text }}>
                  {value}
                </span>
              </div>
              <div 
                className="h-2 rounded-full"
                style={{ backgroundColor: colors.border }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(value / maxValue) * 100}%`,
                    backgroundColor: colors.queue,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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

              {/* Statistiques IA */}
              {activePanel === 'main' && (
                <div className="mt-8 p-4 rounded-lg border" style={{ 
                  backgroundColor: colors.surface,
                  borderColor: colors.border 
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <ChartBarIcon className="h-5 w-5" style={{ color: colors.config }} />
                      <span className="text-sm font-medium" style={{ color: colors.text }}>
                        Statistiques IA
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSetActivePanel?.('analyses')}
                        className="text-xs px-3 py-1 rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: colors.queue,
                          color: colors.background
                        }}
                      >
                        Voir les analyses
                      </button>
                      <button
                        onClick={loadAnalysisStats}
                        disabled={statsLoading}
                        className="text-xs px-3 py-1 rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: colors.config,
                          color: colors.background
                        }}
                      >
                        {statsLoading ? 'Chargement...' : 'Actualiser'}
                      </button>
                    </div>
                  </div>
                  
                  {analysisStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: colors.text }}>
                          {analysisStats.total_analyses || 0}
                        </div>
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Analyses totales</span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: colors.success }}>
                          {analysisStats.success_rate || 0}%
                        </div>
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Taux de succès</span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: colors.warning }}>
                          {analysisStats.avg_processing_time || 0}s
                        </div>
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Temps moyen</span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: colors.error }}>
                          ${analysisStats.total_cost || 0}
                        </div>
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Coût total</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        {statsLoading ? 'Chargement des statistiques...' : 'Aucune statistique disponible'}
                      </span>
                    </div>
                  )}
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