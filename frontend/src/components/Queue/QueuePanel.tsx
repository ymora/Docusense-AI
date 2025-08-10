import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowPathIcon, 
  TrashIcon, 
  PauseIcon, 
  PlayIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  PlayCircleIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useQueueStore, QueueItem } from '../../stores/queueStore';
import { formatFileSize } from '../../utils/fileUtils';
import { getStatusIcon, getStatusColor, getStatusButton } from '../../utils/statusUtils.tsx';
import { analysisService } from '../../services/analysisService';
import { pdfService } from '../../services/pdfService';
import { promptService } from '../../services/promptService';

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
  } = useQueueStore();

  // États pour le sélecteur de prompts
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  // États pour les filtres et la recherche
  const [filters, setFilters] = useState({
    status: '',
    prompt: '',
    search: ''
  });

  useEffect(() => {
    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 15000);
    return () => clearInterval(interval);
  }, [loadQueueStatus]);

  // Écouter les événements de rechargement de la queue (optimisé)
  const handleReloadQueue = useCallback(() => {
    loadQueueStatus();
  }, [loadQueueStatus]);

  useEffect(() => {
    window.addEventListener('reloadQueue', handleReloadQueue);
    return () => {
      window.removeEventListener('reloadQueue', handleReloadQueue);
    };
  }, [handleReloadQueue]);

  // Écouter les événements de filtrage et comparaison
  useEffect(() => {
    const handleFilterByFile = (event: CustomEvent) => {
      const { filePath } = event.detail;
      if (filePath) {
        setFilters(prev => ({
          ...prev,
          search: filePath
        }));
      }
    };

    const handleFilterByDirectory = (event: CustomEvent) => {
      const { directoryPath } = event.detail;
      if (directoryPath) {
        setFilters(prev => ({
          ...prev,
          search: directoryPath
        }));
      }
    };

    const handleCompareAnalyses = (event: CustomEvent) => {
      const { fileId, filePath } = event.detail;
      // Activer le mode comparaison pour ce fichier
      setFilters(prev => ({
        ...prev,
        search: filePath,
        compareMode: true
      }));
    };

    const handleCompareMultipleAnalyses = (event: CustomEvent) => {
      const { fileIds } = event.detail;
      // Activer le mode comparaison multiple
      setFilters(prev => ({
        ...prev,
        compareMode: true,
        multipleCompare: fileIds
      }));
    };

    window.addEventListener('filterAnalysesByFile', handleFilterByFile as EventListener);
    window.addEventListener('filterAnalysesByDirectory', handleFilterByDirectory as EventListener);
    window.addEventListener('compareAnalyses', handleCompareAnalyses as EventListener);
    window.addEventListener('compareMultipleAnalyses', handleCompareMultipleAnalyses as EventListener);
    
    return () => {
      window.removeEventListener('filterAnalysesByFile', handleFilterByFile as EventListener);
      window.removeEventListener('filterAnalysesByDirectory', handleFilterByDirectory as EventListener);
      window.removeEventListener('compareAnalyses', handleCompareAnalyses as EventListener);
      window.removeEventListener('compareMultipleAnalyses', handleCompareMultipleAnalyses as EventListener);
    };
  }, []);





  // Liste des prompts disponibles
  const AVAILABLE_PROMPTS = [
    { value: 'default', label: 'Prompt par défaut' },
    { value: 'general_summary', label: 'Résumé général' },
    { value: 'juridical_analysis', label: 'Analyse juridique' },
    { value: 'technical_analysis', label: 'Analyse technique' },
    { value: 'administrative_analysis', label: 'Analyse administrative' },
    { value: 'extraction_key_points', label: 'Extraction points clés' },
    { value: 'comparison_analysis', label: 'Analyse comparative' },
    { value: 'ocr_analysis', label: 'Analyse OCR' },
    { value: 'classification_analysis', label: 'Classification' }
  ];

  // Liste des IA disponibles
  const AVAILABLE_AI_PROVIDERS = [
    { value: 'openai', label: 'OpenAI GPT' },
    { value: 'anthropic', label: 'Claude' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'gemini', label: 'Gemini' }
  ];

  // Types de prompts disponibles
  const ALL_PROMPT_TYPES = [
    'classification',
    'ocr',
    'juridical',
    'technical',
    'administrative',
    'comparison'
  ];

  // Fonction pour déterminer le type de prompt d'un élément
  const getPromptType = (item: any): string => {
    const promptId = item.analysis_metadata?.prompt_id || item.prompt_id || 'default';
    
    // Mapper les IDs de prompts vers les types
    if (promptId.includes('classification')) return 'classification';
    if (promptId.includes('ocr')) return 'ocr';
    if (promptId.includes('juridical')) return 'juridical';
    if (promptId.includes('technical')) return 'technical';
    if (promptId.includes('administrative')) return 'administrative';
    if (promptId.includes('comparison')) return 'comparison';
    
    return 'general';
  };

  // Grouper les éléments par type de prompt
  const groupedItems: Record<string, typeof queueItems> = {};
  ALL_PROMPT_TYPES.forEach(type => {
    groupedItems[type] = [];
  });
  // Initialiser le groupe 'general'
  groupedItems['general'] = [];
  
  queueItems.forEach(item => {
    const promptType = getPromptType(item);
    if (groupedItems[promptType]) {
      groupedItems[promptType].push(item);
    } else {
      groupedItems['general'].push(item);
    }
  });





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

  // Fonction pour changer le prompt d'une analyse en attente
  const handlePromptChange = async (itemId: string, newPromptId: string) => {
    try {
      // Mettre à jour le prompt dans l'analyse
      const response = await fetch(`/api/analysis/${itemId}/update-prompt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
        },
        body: JSON.stringify({
          prompt_id: newPromptId
        })
      });
      
      if (response.ok) {
        // Recharger la queue pour voir les changements
        loadQueueStatus();
      } else {
        console.error('Erreur lors de la mise à jour du prompt');
      }
    } catch (error) {
      console.error('Erreur lors du changement de prompt:', error);
    }
  };

  // Fonction pour changer l'IA d'une analyse en attente
  const handleAIChange = async (itemId: string, newProvider: string) => {
    try {
      // Mettre à jour le provider dans l'analyse
      const response = await fetch(`/api/analysis/${itemId}/update-provider`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
        },
        body: JSON.stringify({
          provider: newProvider
        })
      });
      
      if (response.ok) {
        // Recharger la queue pour voir les changements
        loadQueueStatus();
      } else {
        console.error('Erreur lors de la mise à jour du provider');
      }
    } catch (error) {
      console.error('Erreur lors du changement de provider:', error);
    }
  };

  // Fonction pour lancer une analyse en attente
  const handleStartAnalysis = async (itemId: string) => {
    try {
      // Lancer l'analyse
      const response = await fetch(`/api/analysis/${itemId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
        }
      });
      
      if (response.ok) {
        // Recharger la queue pour voir le changement de statut
        loadQueueStatus();
      } else {
        console.error('Erreur lors du lancement de l\'analyse');
      }
    } catch (error) {
      console.error('Erreur lors du lancement de l\'analyse:', error);
    }
  };

  // Fonction pour relancer une analyse échouée
  const handleRetryAnalysis = async (itemId: string) => {
    try {
      await analysisService.retryAnalysis(parseInt(itemId));
      loadQueueStatus();
    } catch (error) {
      console.error('Erreur lors de la relance:', error);
    }
  };

  // Fonction pour supprimer une analyse
  const handleDeleteAnalysis = async (itemId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette analyse ?')) {
      try {
        await analysisService.deleteAnalysis(parseInt(itemId));
        loadQueueStatus();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  // Fonction pour télécharger le PDF d'une analyse
  const handleDownloadPDF = async (itemId: string) => {
    try {
      await pdfService.downloadAndSavePDF(parseInt(itemId));
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
    }
  };

  // Fonction pour ouvrir le sélecteur de prompts
  const handleSelectPrompt = (item: any) => {
    setSelectedAnalysis(item);
    setShowPromptSelector(true);
  };

  // Fonction pour gérer la sélection d'un prompt
  const handlePromptSelect = async (promptId: string, prompt: any) => {
    if (!selectedAnalysis) return;
    
    try {
      // Supprimer l'ancienne analyse
      await analysisService.deleteAnalysis(selectedAnalysis.id);
      
      // Créer une nouvelle analyse avec le prompt sélectionné
      const fileId = selectedAnalysis.file_info?.id || selectedAnalysis.file_info?.path;
      if (fileId) {
        await analysisService.createPendingAnalysis({
          file_id: fileId,
          prompt_id: promptId,
          analysis_type: prompt.type || 'general'
        });
      }
      
      // Fermer le sélecteur et recharger
      setShowPromptSelector(false);
      setSelectedAnalysis(null);
      loadQueueStatus();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  // Fonction pour fermer le sélecteur de prompts
  const handleClosePromptSelector = () => {
    setShowPromptSelector(false);
    setSelectedAnalysis(null);
  };

  // Gestion des filtres
  const handleFilterChange = (field: 'status' | 'prompt' | 'search', value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filtrer les éléments de la queue
  const filteredQueueItems = queueItems.filter(item => {
    // Filtre par statut
    if (filters.status && item.status !== filters.status) {
      return false;
    }
    
    // Filtre par type de prompt
    if (filters.prompt) {
      const promptType = getPromptType(item);
      if (promptType !== filters.prompt) {
        return false;
      }
    }
    
    // Filtre par recherche (nom de fichier)
    if (filters.search) {
      const fileName = item.file_info?.name || item.file_name || '';
      if (!fileName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  // Rendu d'un élément de queue en format tableau
   const renderQueueItem = (item: any) => (
    <tr
       key={item.id}
      className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
       style={{
         backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* Fichier */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-sm truncate" style={{ color: colors.text }}>
            {item.file_info?.name || item.file_name || 'Fichier inconnu'}
          </span>
          <div className="flex items-center space-x-2 text-xs mt-1" style={{ color: colors.textSecondary }}>
             <span>{formatFileSize(item.file_info?.size || item.file_size || 0)}</span>
             <span>•</span>
             <span>{new Date(item.created_at).toLocaleTimeString('fr-FR', { 
               hour: '2-digit', 
               minute: '2-digit' 
             })}</span>
           </div>
        </div>
      </td>

      {/* Statut */}
      <td className="px-4 py-3">
        {getStatusButton(
          item.status,
          () => {
            // Actions selon le statut
            switch (item.status) {
              case 'pending':
                handleStartAnalysis(item.id);
                break;
              case 'processing':
                handlePauseItem(item.id);
                break;
              case 'paused':
                handleRetryItem(item.id);
                break;
              case 'failed':
                handleRetryItem(item.id);
                break;
              default:
                break;
            }
          }
        )}
      </td>

      {/* IA - Menu déroulant */}
      <td className="px-4 py-3">
        {item.status === 'pending' ? (
          <div className="relative">
            <select
              className="w-full px-3 py-1.5 text-sm rounded border appearance-none cursor-pointer"
            style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }}
              onChange={(e) => handleAIChange(item.id, e.target.value)}
              value={item.provider || 'openai'}
            >
              {AVAILABLE_AI_PROVIDERS.map(provider => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon 
              className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" 
              style={{ color: colors.textSecondary }}
            />
          </div>
        ) : (
          <span className="text-sm" style={{ color: colors.text }}>
            {AVAILABLE_AI_PROVIDERS.find(p => p.value === item.provider)?.label || item.provider}
          </span>
        )}
      </td>

      {/* Prompt - Menu déroulant */}
      <td className="px-4 py-3">
        {item.status === 'pending' ? (
          <div className="relative">
            <select
              className="w-full px-3 py-1.5 text-sm rounded border appearance-none cursor-pointer"
              style={{
           backgroundColor: colors.surface,
             borderColor: colors.border,
                color: colors.text
              }}
              onChange={(e) => handlePromptChange(item.id, e.target.value)}
              value={item.analysis_metadata?.prompt_id || 'default'}
            >
              {AVAILABLE_PROMPTS.map(prompt => (
                <option key={prompt.value} value={prompt.value}>
                  {prompt.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon 
              className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" 
              style={{ color: colors.textSecondary }}
            />
          </div>
        ) : (
          <span className="text-sm" style={{ color: colors.text }}>
            {AVAILABLE_PROMPTS.find(p => p.value === item.analysis_metadata?.prompt_id)?.label || 'Prompt par défaut'}
           </span>
         )}
      </td>

      {/* Progression */}
      <td className="px-4 py-3">
        {(item.status === 'processing' || item.status === 'pending') ? (
          <div className="flex items-center space-x-2">
            <div className="flex-1">
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
            <span className="text-xs font-medium min-w-[2.5rem]" style={{ color: colors.text }}>
              {Math.round((item.progress || 0) * 100)}%
            </span>
          </div>
        ) : (
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            {item.status === 'completed' ? 'Terminé' : 
             item.status === 'failed' ? 'Échec' : 
             item.status === 'paused' ? 'En pause' : '-'}
          </span>
        )}
      </td>

      {/* Actions */}
       <td className="px-4 py-3">
         <div className="flex items-center space-x-1">
        {item.status === 'pending' && (
          <>
               <button
                 onClick={() => handleSelectPrompt(item)}
                 className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                 style={{ color: colors.primary }}
                 title="Sélectionner un prompt"
               >
                 <SparklesIcon className="h-4 w-4" />
               </button>
            <button
              onClick={() => handleStartAnalysis(item.id)}
                 className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                 style={{ color: colors.success }}
              title="Lancer l'analyse"
            >
                 <PlayCircleIcon className="h-4 w-4" />
            </button>
          </>
        )}
        
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
           
           {(item.status === 'paused' || item.status === 'failed') && (
          <button
               onClick={() => handleRetryAnalysis(item.id)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            style={{ color: colors.textSecondary }}
            title="Relancer"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        )}
           
           {item.status === 'completed' && (
        <button
               onClick={() => handleDownloadPDF(item.id)}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
               style={{ color: colors.primary }}
               title="Télécharger le PDF"
        >
               <DocumentArrowDownIcon className="h-4 w-4" />
        </button>
           )}
           
            <button
             onClick={() => handleDeleteAnalysis(item.id)}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
             style={{ color: colors.error }}
             title="Supprimer"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
       </td>
    </tr>
  );

  // Grouper les éléments par statut pour les statistiques
  const getQueueStats = () => {
    const pendingCount = queueItems.filter(item => item.status === 'pending').length;
    const processingCount = queueItems.filter(item => item.status === 'processing').length;
    const completedCount = queueItems.filter(item => item.status === 'completed').length;
    const failedCount = queueItems.filter((item: any) => item.status === 'failed').length;
    const pausedCount = queueItems.filter((item: any) => item.status === 'paused').length;
    
    return { pendingCount, processingCount, completedCount, failedCount, pausedCount };
  };

  const stats = getQueueStats();

  return (
    <div className={isStandalone ? 'h-full' : 'flex-1 overflow-y-auto p-4'}>
      {/* Header avec filtres */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
            <div>
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
              File d'attente & Analyses
            </h2>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {filteredQueueItems.length} analyse(s) trouvée(s) sur {queueItems.length} total
            </p>
          </div>
          <button
            onClick={loadQueueStatus}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            style={{ color: colors.textSecondary }}
            title="Actualiser"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Filtres sur une ligne */}
        <div className="flex items-center space-x-4">
          {/* Recherche */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Rechercher un fichier..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }}
            />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
              <svg className="h-4 w-4" style={{ color: colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Statut */}
          <div className="flex-shrink-0">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                minWidth: '140px'
              }}
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="processing">En cours</option>
              <option value="completed">Terminé</option>
              <option value="failed">Échoué</option>
              <option value="paused">En pause</option>
            </select>
          </div>
          
          {/* Type de prompt */}
          <div className="flex-shrink-0">
            <select
              value={filters.prompt}
              onChange={(e) => handleFilterChange('prompt', e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                minWidth: '140px'
              }}
            >
              <option value="">Tous les types</option>
              <option value="general">Général</option>
              <option value="classification">Classification</option>
              <option value="ocr">OCR</option>
              <option value="juridical">Juridique</option>
              <option value="technical">Technique</option>
              <option value="administrative">Administratif</option>
              <option value="comparison">Comparaison</option>
            </select>
            </div>
        </div>
      </div>
      
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
            File d'attente & Analyses vides
          </h3>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            Aucune analyse en cours ou en attente
          </p>
        </div>
      ) : (
        <div className="space-y-4">
                     {/* Statistiques de la queue */}
           <div className="flex items-center space-x-4 p-4 rounded-lg border" style={{ 
             backgroundColor: colors.surface,
             borderColor: colors.border 
           }}>
             <span className="text-sm font-medium" style={{ color: colors.text }}>
               Total: {filteredQueueItems.length} / {queueItems.length}
             </span>
            {stats.pendingCount > 0 && (
              <div className="flex items-center space-x-1">
                {getStatusButton('pending', undefined, 'text-xs px-2 py-1')}
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  {stats.pendingCount}
                </span>
              </div>
            )}
            {stats.processingCount > 0 && (
              <div className="flex items-center space-x-1">
                {getStatusButton('processing', undefined, 'text-xs px-2 py-1')}
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  {stats.processingCount}
                </span>
              </div>
            )}
            {stats.pausedCount > 0 && (
              <div className="flex items-center space-x-1">
                {getStatusButton('paused', undefined, 'text-xs px-2 py-1')}
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  {stats.pausedCount}
                </span>
              </div>
            )}
            {stats.completedCount > 0 && (
              <div className="flex items-center space-x-1">
                {getStatusButton('completed', undefined, 'text-xs px-2 py-1')}
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  {stats.completedCount}
                </span>
              </div>
            )}
            {stats.failedCount > 0 && (
              <div className="flex items-center space-x-1">
                {getStatusButton('failed', undefined, 'text-xs px-2 py-1')}
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  {stats.failedCount}
                </span>
              </div>
            )}
          </div>

          {/* Tableau de la queue */}
          <div className="rounded-lg border overflow-hidden" style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border 
          }}>
            <table className="w-full">
              <thead>
                <tr style={{ 
                  backgroundColor: colorMode === 'dark' ? '#374151' : '#f9fafb',
                  borderBottom: `1px solid ${colors.border}`
                }}>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: colors.text }}>
                    Fichier
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: colors.text }}>
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: colors.text }}>
                    IA
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: colors.text }}>
                    Prompt
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: colors.text }}>
                    Progression
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: colors.text }}>
                    Actions
                  </th>
                </tr>
              </thead>
                             <tbody>
                 {filteredQueueItems.map(item => renderQueueItem(item))}
               </tbody>
            </table>
            
            {(!filteredQueueItems || filteredQueueItems.length === 0) && (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: colors.textSecondary }} />
                  <p style={{ color: colors.textSecondary }}>
                    {queueItems.length === 0 ? 'Aucune analyse trouvée' : 'Aucune analyse ne correspond aux filtres'}
                  </p>
                </div>
              </div>
            )}
          </div>
                 </div>
       )}

       {/* Sélecteur de prompts modal */}
       {showPromptSelector && selectedAnalysis && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                 Sélectionner un prompt pour l'analyse
               </h3>
               <button
                 onClick={handleClosePromptSelector}
                 className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                 style={{ color: colors.textSecondary }}
               >
                 <XMarkIcon className="h-5 w-5" />
               </button>
             </div>
             
             <div className="mb-4">
               <p className="text-sm" style={{ color: colors.textSecondary }}>
                 Fichier: <span style={{ color: colors.text }}>{selectedAnalysis.file_info?.name}</span>
               </p>
             </div>

             <div className="space-y-2">
               {promptService.getPromptCategories().map((category) => (
                 <div key={category.domain}>
                   <h4 className="text-sm font-medium mb-2" style={{ color: colors.text }}>
                     {category.name}
                   </h4>
                   <div className="space-y-1">
                     {category.prompts.map((prompt) => (
                       <button
                         key={prompt.id}
                         onClick={() => handlePromptSelect(prompt.id, prompt)}
                         className="w-full text-left p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                         style={{
                           borderColor: colors.border,
                           backgroundColor: colors.surface
                         }}
                       >
                         <div className="flex items-center justify-between">
                           <div>
                             <div className="font-medium" style={{ color: colors.text }}>
                               {prompt.name}
                             </div>
                             <div className="text-sm" style={{ color: colors.textSecondary }}>
                               {prompt.description}
                             </div>
                           </div>
                           <SparklesIcon className="h-4 w-4" style={{ color: colors.primary }} />
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Export seulement QueueContent - plus de panel standalone
export default QueueContent;