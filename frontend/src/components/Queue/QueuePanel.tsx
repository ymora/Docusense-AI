import React, { useState, useEffect } from 'react';
import { useQueueStore } from '../../stores/queueStore';
import { useColors } from '../../hooks/useColors';
import { XMarkIcon, MinusIcon, FunnelIcon, ArrowPathIcon, PlayIcon, PauseIcon, TrashIcon, ViewColumnsIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

interface QueuePanelProps {
  onClose?: () => void;
  onMinimize?: () => void;
}

interface QueueContentProps {
  onClose?: () => void;
  onMinimize?: () => void;
  isStandalone?: boolean;
}

// Composant de contenu sans header pour utilisation dans MainPanel
export const QueueContent: React.FC<QueueContentProps> = ({ onClose, onMinimize, isStandalone = false }) => {
  const { colors, colorMode } = useColors();
  const {
    queueItems,
    queueStatus,
    loadQueueStatus,
    pauseType,
    resumeType,
    deleteType,
    retryType,
  } = useQueueStore();
  const [groupByType, setGroupByType] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 5000);
    return () => clearInterval(interval);
  }, [loadQueueStatus]);

  // Liste ordonnée des types d'analyse supportés
  const ALL_ANALYSIS_TYPES = [
    'general',
    'summary',
    'extraction',
    'classification',
    'ocr',
    'juridical',
    'technical',
    'administrative',
    'comparison',
  ];

  // Grouper les éléments par type d'analyse
  const groupedItems: Record<string, typeof queueItems> = {};
  ALL_ANALYSIS_TYPES.forEach(type => {
    groupedItems[type] = [];
  });
  queueItems.forEach(item => {
    const type = item.analysis_type || 'general';
    if (groupedItems[type]) {
      groupedItems[type].push(item);
    } else {
      groupedItems['general'].push(item); // fallback
    }
  });

  // Séparer les analyses individuelles des comparaisons
  const individualAnalyses = ALL_ANALYSIS_TYPES.filter(type => type !== 'comparison');
  const comparisonAnalyses = ['comparison'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.status.pending;
      case 'processing': return colors.status.processing;
      case 'completed': return colors.status.completed;
      case 'failed': return colors.status.failed;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getAnalysisTypeColor = (type: string) => {
    switch (type) {
      case 'general': return 'bg-blue-600 text-blue-200';
      case 'summary': return 'bg-green-600 text-green-200';
      case 'extraction': return 'bg-purple-600 text-purple-200';
      case 'comparison': return 'bg-orange-600 text-orange-200';
      case 'classification': return 'bg-indigo-600 text-indigo-200';
      case 'ocr': return 'bg-red-600 text-red-200';
      case 'juridical': return 'bg-yellow-600 text-yellow-200';
      case 'technical': return 'bg-cyan-600 text-cyan-200';
      case 'administrative': return 'bg-pink-600 text-pink-200';
      default: return 'bg-slate-600 text-slate-200';
    }
  };

  const getAnalysisTypeName = (type: string) => {
    switch (type) {
      case 'general': return 'Général';
      case 'summary': return 'Résumé';
      case 'extraction': return 'Extraction';
      case 'comparison': return 'Comparaison';
      case 'classification': return 'Classification';
      case 'ocr': return 'OCR';
      case 'juridical': return 'Juridique';
      case 'technical': return 'Technique';
      case 'administrative': return 'Administratif';
      default: return type;
    }
  };

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'general': return '📄';
      case 'summary': return '📝';
      case 'extraction': return '🔍';
      case 'comparison': return '⚖️';
      case 'classification': return '🏷️';
      case 'ocr': return '👁️';
      case 'juridical': return '⚖️';
      case 'technical': return '🔧';
      case 'administrative': return '📋';
      default: return '📄';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handlePauseType = async (type: string) => {
    await pauseType(type);
  };

  const handleResumeType = async (type: string) => {
    await resumeType(type);
  };

  const handleDeleteType = async (type: string) => {
    await deleteType(type);
  };

  const handleRetryType = async (type: string) => {
    await retryType(type);
  };

  // Rendu d'un élément de queue compact
  const renderQueueItemCompact = (item: any) => (
    <div 
      key={item.id} 
      className="rounded-lg p-2 border text-xs"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border
      }}
    >
      {/* Ligne 1 : nom du fichier et statut */}
      <div className="flex items-center justify-between mb-1">
        <span 
          className="font-medium truncate flex-1 mr-2"
          style={{ color: colors.text }}
        >
          {item.file_name}
        </span>
        <span 
          className="text-xs"
          style={{ color: getStatusColor(item.status) }}
        >
          {getStatusIcon(item.status)}
        </span>
      </div>
      {/* Ligne 2 : type d'analyse et taille */}
      <div className="flex items-center justify-between mb-1">
        <span 
          className="px-1 py-0.5 rounded text-xs"
          style={{
            backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
            color: colors.text
          }}
        >
          {getAnalysisTypeName(item.analysis_type)}
        </span>
        <span 
          className="text-xs"
          style={{ color: colors.textSecondary }}
        >
          {formatFileSize(item.file_size || 0)}
        </span>
      </div>
      {/* Ligne 3 : provider et actions */}
      <div className="flex items-center justify-between">
        <span 
          className="text-xs truncate"
          style={{ 
            color: colors.textSecondary,
            fontSize: '11px' 
          }}
        >
          {item.analysis_provider && item.analysis_model && (
            <>{item.analysis_provider} • {item.analysis_model}</>
          )}
        </span>
        <div className="flex items-center space-x-1 ml-2">
          <button 
            onClick={() => handleRetryType(item.analysis_type)} 
            className="p-1 hover:opacity-70" 
            style={{ color: colors.queue }}
            title="Relancer"
          >
            <ArrowPathIcon className="h-3 w-3" />
          </button>
          <button 
            onClick={() => handleDeleteType(item.analysis_type)} 
            className="p-1 hover:opacity-70" 
            style={{ color: colors.error }}
            title="Supprimer"
          >
            <TrashIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
      {/* Message d'erreur */}
      {item.error_message && (
        <div 
          className="mt-1 p-1 border rounded text-xs"
          style={{
            backgroundColor: colorMode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
            borderColor: colors.error
          }}
        >
          <strong style={{ color: colors.error }}>Erreur :</strong> 
          <span style={{ color: colors.textSecondary }}> {item.error_message}</span>
        </div>
      )}
    </div>
  );

  // Rendu d'une section par type d'analyse
  const renderTypeSection = (type: string) => {
    if (!groupedItems[type] || groupedItems[type].length === 0) {return null;}
    return (
      <div key={type} className="mb-3">
        {/* Titre de section */}
        <div className="flex items-center mb-1 px-1">
          <span className="text-lg mr-2">{getAnalysisTypeIcon(type)}</span>
          <span 
            className="font-semibold text-xs capitalize mr-2"
            style={{ color: colors.text }}
          >
            {getAnalysisTypeName(type)}
          </span>
          <span 
            className="text-xs rounded px-1 py-0.5 ml-1"
            style={{
              backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
              color: colors.text
            }}
          >
            {groupedItems[type].length}
          </span>
        </div>
        {/* Liste compacte des tâches de ce type */}
        <div className="space-y-1">
          {groupedItems[type].map(item => renderQueueItemCompact(item))}
        </div>
      </div>
    );
  };

  return (
    <div className={isStandalone ? "h-full" : "flex-1 overflow-y-auto p-2"}>
      {/* Progression globale */}
      <div 
        className="mb-3 p-2 rounded-lg border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span 
            className="text-xs font-medium"
            style={{ color: colors.text }}
          >
            Progression
          </span>
          <span 
            className="text-xs"
            style={{ color: colors.textSecondary }}
          >
            {queueStatus.completed_items}/{queueStatus.total_items}
          </span>
        </div>
        <div 
          className="w-full rounded-full h-1 mb-1"
          style={{ backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0' }}
        >
          <div
            className="h-1 rounded-full transition-all duration-300"
            style={{ 
              width: `${queueStatus.total_items > 0 ? (queueStatus.completed_items / queueStatus.total_items) * 100 : 0}%`,
              backgroundColor: colors.queue
            }}
          ></div>
        </div>
        <div 
          className="flex justify-between text-[10px]"
          style={{ color: colors.textSecondary }}
        >
          <span>Analyse IA en cours: {queueStatus.processing_items}</span>
          <span>Non analysés par IA: {queueStatus.pending_items}</span>
          <span>Analysés par IA: {queueStatus.completed_items}</span>
        </div>
      </div>
      {/* Liste par type d'analyse */}
      {queueItems.length === 0 ? (
        <div 
          className="text-center py-8 text-xs"
          style={{ color: colors.textSecondary }}
        >
          <div 
            className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.surface }}
          >
            <ArrowPathIcon className="h-5 w-5" />
          </div>
          <p 
            className="text-base font-medium mb-1"
            style={{ color: colors.text }}
          >
            Queue vide
          </p>
          <p className="text-xs">Aucun fichier non analysé par IA</p>
        </div>
      ) : (
        <div>
          {ALL_ANALYSIS_TYPES.map(type => renderTypeSection(type))}
        </div>
      )}
    </div>
  );
};

// Composant original avec header pour utilisation standalone
const QueuePanel: React.FC<QueuePanelProps> = ({ onClose, onMinimize }) => {
  const { colors } = useColors();
  const { queueItems } = useQueueStore();
  
  return (
    <div
      className="fixed right-0 top-0 h-full z-40 shadow-xl flex flex-col"
      style={{ 
        width: 360, 
        minWidth: 260, 
        maxWidth: 400,
        backgroundColor: colors.surface,
        borderLeft: `1px solid ${colors.border}`
      }}
    >
      {/* Header compact */}
      <div 
        className="flex items-center justify-between p-2 border-b"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        <h3 
          className="text-xs font-semibold"
          style={{ color: colors.queue }}
        >
          Queue d'Analyse 
          <span style={{ color: colors.textSecondary }}> ({queueItems.length})</span>
        </h3>
        <div className="flex items-center space-x-1">
          {onMinimize && (
            <button 
              onClick={onMinimize} 
              className="p-1 transition-colors" 
              style={{ color: colors.textSecondary }}
              title="Minimiser"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1 transition-colors" 
              style={{ color: colors.textSecondary }}
              title="Fermer"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      <QueueContent onClose={onClose} onMinimize={onMinimize} />
    </div>
  );
};

export default QueuePanel;