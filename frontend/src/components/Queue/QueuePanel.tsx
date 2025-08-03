import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowPathIcon, 
  TrashIcon, 
  PauseIcon, 
  PlayIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useQueueStore, QueueItem } from '../../stores/queueStore';
import { formatFileSize } from '../../utils/fileUtils';
import { getStatusIcon, getStatusColor } from '../../utils/statusUtils.tsx';

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
    deleteType,
    retryType,
  } = useQueueStore();

  useEffect(() => {
    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 15000);
    return () => clearInterval(interval);
  }, [loadQueueStatus]);

  // Écouter les événements de rechargement de la queue (optimisé)
  useEffect(() => {
    const handleReloadQueue = useCallback(() => {
      loadQueueStatus();
    }, [loadQueueStatus]);

    window.addEventListener('reloadQueue', handleReloadQueue);
    return () => {
      window.removeEventListener('reloadQueue', handleReloadQueue);
    };
  }, [loadQueueStatus]);

  // Fonction pour extraire le type de prompt depuis les métadonnées
  const getPromptType = (item: any) => {
    const metadata = item.analysis_metadata || {};
    const promptId = metadata.prompt_id || 'general_summary';
    
    // Extraire le type de prompt depuis l'ID
    if (promptId.includes('summary')) return 'summary';
    if (promptId.includes('extraction')) return 'extraction';
    if (promptId.includes('comparison')) return 'comparison';
    if (promptId.includes('classification')) return 'classification';
    if (promptId.includes('ocr')) return 'ocr';
    if (promptId.includes('juridical')) return 'juridical';
    if (promptId.includes('technical')) return 'technical';
    if (promptId.includes('administrative')) return 'administrative';
    if (promptId.includes('general')) return 'general';
    
    return 'general';
  };

  // Fonction pour déterminer si c'est une analyse multiple par IA
  const isMultipleAI = (item: any) => {
    const metadata = item.analysis_metadata || {};
    return metadata.is_multiple_ai === true || item.analysis_type === 'multiple_ai';
  };

  // Fonction pour obtenir les IA utilisées
  const getAIProviders = (item: any) => {
    const metadata = item.analysis_metadata || {};
    
    if (isMultipleAI(item)) {
      // Pour les analyses multiples, récupérer tous les providers
      const providers = new Set();
      queueItems.forEach(relatedItem => {
        if (relatedItem.analysis_metadata?.multiple_ai_file_ids === metadata.multiple_ai_file_ids) {
          providers.add(relatedItem.provider);
        }
      });
      return Array.from(providers);
    } else {
      // Pour les analyses simples, juste le provider actuel
      return [item.provider];
    }
  };

  // Liste ordonnée des types de prompt supportés
  const ALL_PROMPT_TYPES = [
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

  // Grouper les éléments par type de prompt
  const groupedItems: Record<string, typeof queueItems> = {};
  ALL_PROMPT_TYPES.forEach(type => {
    groupedItems[type] = [];
  });
  
  queueItems.forEach(item => {
    const promptType = getPromptType(item);
    if (groupedItems[promptType]) {
      groupedItems[promptType].push(item);
    } else {
      groupedItems['general'].push(item);
    }
  });

  const getPromptTypeName = (type: string) => {
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

  const getPromptTypeIcon = (type: string) => {
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

  const handleDeleteType = async (type: string) => {
    await deleteType(type);
  };

  const handleRetryType = async (type: string) => {
    await retryType(type);
  };

  // Actions individuelles (à implémenter dans le store)
  const handlePauseItem = async (itemId: string) => {
    // Implémentation future dans le store
  };

  const handleCancelItem = async (itemId: string) => {
    // Implémentation future dans le store
  };

  const handleRetryItem = async (itemId: string) => {
    // Implémentation future dans le store
  };

  // Rendu d'un élément de queue compact et épuré
  const renderQueueItem = (item: any) => (
    <div
      key={item.id}
      className="rounded-lg p-4 border mb-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {/* En-tête : Nom du fichier et statut */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate mb-1" style={{ color: colors.text }}>
            {item.file_info?.name || item.file_name || 'Fichier inconnu'}
          </h4>
          <div className="flex items-center space-x-3 text-xs" style={{ color: colors.textSecondary }}>
            <span>{formatFileSize(item.file_info?.size || item.file_size || 0)}</span>
            <span>•</span>
            <span>{getPromptTypeName(getPromptType(item))}</span>
            <span>•</span>
            <span>{new Date(item.created_at).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-3">
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ 
              color: getStatusColor(item.status),
              backgroundColor: colorMode === 'dark' ? getStatusColor(item.status) + '15' : getStatusColor(item.status) + '08'
            }}
          >
            {getStatusIcon(item.status)} {item.status}
          </span>
        </div>
      </div>

      {/* Informations techniques discrètes */}
      <div className="flex items-center space-x-2 mb-3">
        {/* Type d'analyse (Simple/Multiple) */}
        <span className="text-xs px-2 py-1 rounded border" style={{ 
          borderColor: colors.border,
          color: isMultipleAI(item) ? colors.primary : colors.textSecondary,
          backgroundColor: colors.surface,
          fontWeight: isMultipleAI(item) ? '600' : '400'
        }}>
          {isMultipleAI(item) ? '🔗 Multiple IA' : '🔹 IA Simple'}
        </span>
        
        {/* Providers IA utilisés */}
        {getAIProviders(item).map((provider, index) => (
          <span key={index} className="text-xs px-2 py-1 rounded border" style={{ 
            borderColor: colors.border,
            color: colors.textSecondary,
            backgroundColor: colors.surface
          }}>
            {provider}
          </span>
        ))}
        
        {/* Modèle actuel */}
        {item.analysis_model && (
          <span className="text-xs px-2 py-1 rounded border" style={{ 
            borderColor: colors.border,
            color: colors.textSecondary,
            backgroundColor: colors.surface
          }}>
            {item.analysis_model}
          </span>
        )}
        
        {/* Prompt ID */}
        {item.analysis_metadata?.prompt_id && (
          <span className="text-xs px-2 py-1 rounded border" style={{ 
            borderColor: colors.border,
            color: colors.textSecondary,
            backgroundColor: colors.surface
          }}>
            {item.analysis_metadata.prompt_id}
          </span>
        )}
      </div>

      {/* Barre de progression */}
      {(item.status === 'processing' || item.status === 'pending') && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              {item.current_step || 'En attente...'}
            </span>
            <span className="text-xs font-medium" style={{ color: colors.text }}>
              {Math.round((item.progress || 0) * 100)}%
            </span>
          </div>
          <div
            className="w-full rounded-full h-2"
            style={{ backgroundColor: colorMode === 'dark' ? '#374151' : '#e5e7eb' }}
          >
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(item.progress || 0) * 100}%`,
                backgroundColor: getStatusColor(item.status),
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-1">
        {item.status === 'processing' && (
          <button
            onClick={() => handlePauseItem(item.id)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            style={{ color: colors.textSecondary }}
            title="Mettre en pause"
          >
            <PauseIcon className="h-4 w-4" />
          </button>
        )}
        {item.status === 'paused' && (
          <button
            onClick={() => handleRetryItem(item.id)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            style={{ color: colors.textSecondary }}
            title="Relancer"
          >
            <PlayIcon className="h-4 w-4" />
          </button>
        )}
        {item.status === 'failed' && (
          <button
            onClick={() => handleRetryItem(item.id)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            style={{ color: colors.textSecondary }}
            title="Réessayer"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => handleCancelItem(item.id)}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            style={{ color: colors.textSecondary }}
          title="Annuler"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Message d'erreur (affiché seulement si erreur) */}
      {item.error_message && (
        <div className="mt-3 p-3 border rounded text-xs" style={{
          backgroundColor: colorMode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
          borderColor: colors.error,
        }}>
          <div className="flex items-start space-x-2">
            <span style={{ color: colors.error }}>⚠️</span>
            <span style={{ color: colors.textSecondary }}>{item.error_message}</span>
          </div>
        </div>
      )}
    </div>
  );

  // Rendu d'une section par type d'analyse
  const renderTypeSection = (type: string) => {
    if (!groupedItems[type] || groupedItems[type].length === 0) {
      return null;
    }
    
    const items = groupedItems[type];
    const pendingCount = items.filter(item => item.status === 'pending').length;
    const processingCount = items.filter(item => item.status === 'processing').length;
    const completedCount = items.filter(item => item.status === 'completed').length;
    const failedCount = items.filter((item: any) => item.status === 'failed').length;
    const pausedCount = items.filter((item: any) => item.status === 'paused').length;
    
    return (
      <div key={type} className="mb-6">
        {/* Header de section épuré */}
        <div className="flex items-center justify-between mb-4 p-4 rounded-lg border" style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border 
        }}>
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getPromptTypeIcon(type)}</span>
            <div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: colors.text }}>
                {getPromptTypeName(type)}
              </h3>
                              <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 rounded border" style={{ 
                    borderColor: colors.border,
                    color: colors.textSecondary,
                    backgroundColor: colors.surface
                  }}>
                    {items.length} total
                  </span>
                  
                  {/* Statistiques IA */}
                  {(() => {
                    const simpleAI = items.filter(item => !isMultipleAI(item)).length;
                    const multipleAI = items.filter(item => isMultipleAI(item)).length;
                    const uniqueProviders = new Set();
                    items.forEach(item => {
                      getAIProviders(item).forEach(provider => uniqueProviders.add(provider));
                    });
                    
                    return (
                      <>
                        {simpleAI > 0 && (
                          <span className="text-xs px-2 py-1 rounded border" style={{ 
                            borderColor: colors.border,
                            color: colors.textSecondary,
                            backgroundColor: colors.surface
                          }}>
                            🔹 {simpleAI} simple
                          </span>
                        )}
                        {multipleAI > 0 && (
                          <span className="text-xs px-2 py-1 rounded border" style={{ 
                            borderColor: colors.primary,
                            color: colors.primary,
                            backgroundColor: colors.primary + '10'
                          }}>
                            🔗 {multipleAI} multiple
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 rounded border" style={{ 
                          borderColor: colors.border,
                          color: colors.textSecondary,
                          backgroundColor: colors.surface
                        }}>
                          🤖 {uniqueProviders.size} IA
                        </span>
                      </>
                    );
                  })()}
                {pendingCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded border flex items-center space-x-1" style={{ 
                    borderColor: colors.border,
                    color: colors.textSecondary,
                    backgroundColor: colors.surface
                  }}>
                    <ClockIcon className="h-3 w-3" />
                    {pendingCount}
                  </span>
                )}
                {processingCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded border flex items-center space-x-1" style={{ 
                    borderColor: colors.border,
                    color: colors.textSecondary,
                    backgroundColor: colors.surface
                  }}>
                    <PlayIcon className="h-3 w-3" />
                    {processingCount}
                  </span>
                )}
                {pausedCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded border flex items-center space-x-1" style={{ 
                    borderColor: colors.border,
                    color: colors.textSecondary,
                    backgroundColor: colors.surface
                  }}>
                    <PauseIcon className="h-3 w-3" />
                    {pausedCount}
                  </span>
                )}
                {completedCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded border flex items-center space-x-1" style={{ 
                    borderColor: colors.border,
                    color: colors.textSecondary,
                    backgroundColor: colors.surface
                  }}>
                    <CheckCircleIcon className="h-3 w-3" />
                    {completedCount}
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded border flex items-center space-x-1" style={{ 
                    borderColor: colors.border,
                    color: colors.textSecondary,
                    backgroundColor: colors.surface
                  }}>
                    <ExclamationTriangleIcon className="h-3 w-3" />
                    {failedCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions de section */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleRetryType(type)}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              style={{ color: colors.textSecondary }}
              title={`Relancer toutes les analyses ${getAnalysisTypeName(type)}`}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteType(type)}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              style={{ color: colors.textSecondary }}
              title={`Supprimer toutes les analyses ${getAnalysisTypeName(type)}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Liste des éléments */}
        <div className="space-y-3">
          {items.map(item => renderQueueItem(item))}
        </div>
      </div>
    );
  };

  return (
    <div className={isStandalone ? 'h-full' : 'flex-1 overflow-y-auto p-2'}>
      {/* Contenu de la queue */}
      {queueItems.length === 0 ? (
        <div className="text-center py-8">
          <div
            className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.surface }}
          >
            <ArrowPathIcon className="h-6 w-6" style={{ color: colors.textSecondary }} />
          </div>
          <h3 className="text-sm font-medium mb-1" style={{ color: colors.text }}>
            File d'attente vide
          </h3>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            Aucune analyse en cours ou en attente
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sections par type d'analyse */}
          {ALL_ANALYSIS_TYPES.map(type => renderTypeSection(type))}
        </div>
      )}
    </div>
  );
};

// Export seulement QueueContent - plus de panel standalone
export default QueueContent;