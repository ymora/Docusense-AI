import React, { useState, useEffect } from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  ArrowPathIcon,
  TrashIcon,
  PlayIcon,
  EyeIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PlayCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useUIStore } from '../../stores/uiStore';
import { analysisService, Analysis, AnalysisListParams } from '../../services/analysisService';
import { formatFileSize } from '../../utils/fileUtils';
import { getStatusColor, getStatusIcon } from '../../utils/statusUtils';
import { promptService } from '../../services/promptService';

export const AnalysisListContent: React.FC = () => {
  const { colors } = useColors();
  const { activePanel } = useUIStore();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [sortParams, setSortParams] = useState<AnalysisListParams>({
    sort_by: 'created_at',
    sort_order: 'desc',
    limit: 50
  });
  const [filters, setFilters] = useState({
    status: '',
    prompt: '',
    search: ''
  });

  
  // États pour le sélecteur de prompts
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

  // Charger les analyses
  const loadAnalyses = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        ...sortParams,
        status_filter: filters.status || undefined,
        prompt_filter: filters.prompt || undefined,
        search: filters.search || undefined
      };
      
  
      const response = await analysisService.getAnalysesList(params);
      
      setAnalyses(response.analyses);
      
    } catch (error) {
      console.error('❌ AnalysisListContent: Erreur lors du chargement:', error);
      setError(`Erreur lors du chargement: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, [sortParams, filters]);

  // Recharger les analyses quand le panneau devient actif
  useEffect(() => {
    const handlePanelActivation = () => {
      
      loadAnalyses();
    };

    // Écouter les changements de panneau actif
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handlePanelActivation();
      }
    };

    // Recharger au montage et quand la fenêtre redevient visible
    handlePanelActivation();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Recharger les analyses quand le panneau "analyses" devient actif
  useEffect(() => {
    if (activePanel === 'analyses') {
      
      loadAnalyses();
    }
  }, [activePanel]);

  // Écouter les événements de rechargement des analyses
  useEffect(() => {
    const handleReloadAnalyses = () => {
      
      loadAnalyses();
    };

    window.addEventListener('reloadAnalyses', handleReloadAnalyses);
    return () => {
      window.removeEventListener('reloadAnalyses', handleReloadAnalyses);
    };
  }, []);

  // Test de connectivité au backend
  useEffect(() => {
    const testBackendConnection = async () => {
      try {

        const response = await fetch('/api/analysis/test');
        const data = await response.json();
        
        
        // Test direct de l'endpoint list
        
        const listResponse = await fetch('/api/analysis/list');
        const listData = await listResponse.json();
        
        
      } catch (error) {
        console.error('❌ AnalysisListContent: Test backend échoué:', error);
        setError('Impossible de se connecter au backend. Vérifiez que le serveur est démarré.');
      }
    };
    
    testBackendConnection();
  }, []);

  // Gestion du tri
  const handleSort = (field: 'created_at' | 'status' | 'provider' | 'file_name' | 'analysis_type' | 'prompt') => {
    setSortParams(prev => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Gestion des filtres
  const handleFilterChange = (field: 'status' | 'prompt' | 'search', value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Actions sur les analyses
  const handleRetryAnalysis = async (analysisId: number) => {
    try {
      await analysisService.retryAnalysis(analysisId);
      loadAnalyses(); // Recharger la liste
    } catch (error) {
      setError(`Erreur lors de la relance: ${error}`);
    }
  };

  const handleStartAnalysis = async (analysisId: number) => {
    try {
      await analysisService.startAnalysis(analysisId);
      loadAnalyses(); // Recharger la liste
    } catch (error) {
      setError(`Erreur lors du lancement: ${error}`);
    }
  };

  const handleDeleteAnalysis = async (analysisId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette analyse ?')) {
      try {
        await analysisService.deleteAnalysis(analysisId);
        loadAnalyses(); // Recharger la liste
      } catch (error) {
        setError(`Erreur lors de la suppression: ${error}`);
      }
    }
  };

  // Nouvelle fonction pour ouvrir le sélecteur de prompts
  const handleSelectPrompt = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
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
      loadAnalyses();
    } catch (error) {
      setError(`Erreur lors de la mise à jour: ${error}`);
    }
  };

  // Fonction pour fermer le sélecteur de prompts
  const handleClosePromptSelector = () => {
    setShowPromptSelector(false);
    setSelectedAnalysis(null);
  };

  const getPromptType = (analysis: Analysis) => {
    if (analysis.analysis_metadata?.prompt_type) {
      return analysis.analysis_metadata.prompt_type;
    }
    if (analysis.analysis_type) {
      return analysis.analysis_type;
    }
    return 'Général';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header avec tous les filtres sur une ligne */}
      <div className="p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
              Liste des Analyses IA
            </h2>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {analyses?.length || 0} analyse(s) trouvée(s)
            </p>
            
          </div>
          <button
            onClick={loadAnalyses}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            style={{ color: colors.textSecondary }}
            title="Actualiser"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Tous les filtres sur une ligne */}
        <div className="flex items-center space-x-4">
          {/* Recherche */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Rechercher..."
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
              <option value="summary">Résumé</option>
              <option value="extraction">Extraction</option>
              <option value="comparison">Comparaison</option>
              <option value="classification">Classification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-hidden">
        {error && (
          <div className="m-4 p-3 rounded-lg" style={{ 
            backgroundColor: colors.error + '10',
            borderColor: colors.error,
            border: '1px solid'
          }}>
            <span className="text-sm" style={{ color: colors.error }}>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: colors.textSecondary }} />
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0" style={{ backgroundColor: colors.surface }}>
                <tr>
                                     <th className="p-3 text-left">
                     <button
                       onClick={() => handleSort('created_at')}
                       className="flex items-center space-x-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                       style={{ color: colors.text }}
                     >
                       <span>Date</span>
                       {sortParams.sort_by === 'created_at' ? (
                         sortParams.sort_order === 'asc' ? 
                           <ChevronUpIcon className="h-4 w-4" style={{ color: colors.primary }} /> : 
                           <ChevronDownIcon className="h-4 w-4" style={{ color: colors.primary }} />
                       ) : (
                         <ChevronUpIcon className="h-4 w-4 opacity-30" style={{ color: colors.textSecondary }} />
                       )}
                     </button>
                   </th>
                   <th className="p-3 text-left">
                     <button
                       onClick={() => handleSort('file_name')}
                       className="flex items-center space-x-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                       style={{ color: colors.text }}
                     >
                       <span>Fichier</span>
                       {sortParams.sort_by === 'file_name' ? (
                         sortParams.sort_order === 'asc' ? 
                           <ChevronUpIcon className="h-4 w-4" style={{ color: colors.primary }} /> : 
                           <ChevronDownIcon className="h-4 w-4" style={{ color: colors.primary }} />
                       ) : (
                         <ChevronUpIcon className="h-4 w-4 opacity-30" style={{ color: colors.textSecondary }} />
                       )}
                     </button>
                   </th>
                   <th className="p-3 text-left">
                     <button
                       onClick={() => handleSort('analysis_type')}
                       className="flex items-center space-x-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                       style={{ color: colors.text }}
                     >
                       <span>Type</span>
                       {sortParams.sort_by === 'analysis_type' ? (
                         sortParams.sort_order === 'asc' ? 
                           <ChevronUpIcon className="h-4 w-4" style={{ color: colors.primary }} /> : 
                           <ChevronDownIcon className="h-4 w-4" style={{ color: colors.primary }} />
                       ) : (
                         <ChevronUpIcon className="h-4 w-4 opacity-30" style={{ color: colors.textSecondary }} />
                       )}
                     </button>
                   </th>
                   <th className="p-3 text-left">
                     <button
                       onClick={() => handleSort('status')}
                       className="flex items-center space-x-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                       style={{ color: colors.text }}
                     >
                       <span>Statut</span>
                       {sortParams.sort_by === 'status' ? (
                         sortParams.sort_order === 'asc' ? 
                           <ChevronUpIcon className="h-4 w-4" style={{ color: colors.primary }} /> : 
                           <ChevronDownIcon className="h-4 w-4" style={{ color: colors.primary }} />
                       ) : (
                         <ChevronUpIcon className="h-4 w-4 opacity-30" style={{ color: colors.textSecondary }} />
                       )}
                     </button>
                   </th>
                                      <th className="p-3 text-left">
                      <button
                        onClick={() => handleSort('provider')}
                        className="flex items-center space-x-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                        style={{ color: colors.text }}
                      >
                        <span>IA</span>
                        {sortParams.sort_by === 'provider' ? (
                          sortParams.sort_order === 'asc' ? 
                            <ChevronUpIcon className="h-4 w-4" style={{ color: colors.primary }} /> : 
                            <ChevronDownIcon className="h-4 w-4" style={{ color: colors.primary }} />
                        ) : (
                          <ChevronUpIcon className="h-4 w-4 opacity-30" style={{ color: colors.textSecondary }} />
                        )}
                      </button>
                    </th>
                                       <th className="p-3 text-left">
                      <button
                        onClick={() => handleSort('prompt')}
                        className="flex items-center space-x-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                        style={{ color: colors.text }}
                      >
                        <span>Prompt</span>
                        {sortParams.sort_by === 'prompt' ? (
                          sortParams.sort_order === 'asc' ? 
                            <ChevronUpIcon className="h-4 w-4" style={{ color: colors.primary }} /> : 
                            <ChevronDownIcon className="h-4 w-4" style={{ color: colors.primary }} />
                        ) : (
                          <ChevronUpIcon className="h-4 w-4 opacity-30" style={{ color: colors.textSecondary }} />
                        )}
                      </button>
                    </th>
                   <th className="p-3 text-left">
                     <span style={{ color: colors.text }}>Actions</span>
                   </th>
                </tr>
              </thead>
              <tbody>
                {analyses?.map((analysis) => (
                  <tr 
                    key={analysis.id}
                    className="border-b hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    style={{ borderColor: colors.border }}
                  >
                    <td className="p-3">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>
                        {formatDate(analysis.created_at)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="h-4 w-4" style={{ color: colors.textSecondary }} />
                        <div>
                          <div className="text-sm font-medium" style={{ color: colors.text }}>
                            {analysis.file_info?.name || 'Fichier inconnu'}
                          </div>
                          <div className="text-xs" style={{ color: colors.textSecondary }}>
                            {analysis.file_info?.size ? formatFileSize(analysis.file_info.size) : 'Taille inconnue'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm px-2 py-1 rounded" style={{ 
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        border: '1px solid',
                        color: colors.textSecondary
                      }}>
                        {getPromptType(analysis)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span style={{ color: getStatusColor(analysis.status) }}>
                          {getStatusIcon(analysis.status)}
                        </span>
                        <span className="text-sm capitalize" style={{ color: colors.text }}>
                          {analysis.status}
                        </span>
                      </div>
                    </td>
                                         <td className="p-3">
                       <div className="flex items-center space-x-2">
                         <span className="text-sm font-medium capitalize" style={{ color: colors.text }}>
                           {analysis.provider}
                         </span>
                         <span className="text-xs" style={{ color: colors.textSecondary }}>
                           {analysis.model}
                         </span>
                       </div>
                     </td>
                     <td className="p-3">
                       <div className="max-w-xs">
                         <div className="text-sm" style={{ color: colors.text }}>
                           {analysis.prompt && analysis.prompt.length > 100 
                             ? `${analysis.prompt.substring(0, 100)}...` 
                             : analysis.prompt || 'Aucun prompt'
                           }
                         </div>
                         {analysis.prompt && analysis.prompt.length > 100 && (
                           <button
                             onClick={() => {
                               // Afficher le prompt complet dans une alerte ou modal
                               alert(`Prompt complet:\n\n${analysis.prompt}`);
                             }}
                             className="text-xs mt-1 hover:underline"
                             style={{ color: colors.primary }}
                           >
                             Voir plus
                           </button>
                         )}
                       </div>
                     </td>
                     <td className="p-3">
                       <div className="flex items-center space-x-1">
                        {analysis.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleSelectPrompt(analysis)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                              style={{ color: colors.primary }}
                              title="Sélectionner un prompt"
                            >
                              <SparklesIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStartAnalysis(analysis.id)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                              style={{ color: colors.success }}
                              title="Lancer l'analyse avec le prompt actuel"
                            >
                              <PlayCircleIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {analysis.status !== 'pending' && (
                          <button
                            onClick={() => handleRetryAnalysis(analysis.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                            style={{ color: colors.textSecondary }}
                            title="Relancer"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAnalysis(analysis.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                          style={{ color: colors.error }}
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {(!analyses || analyses.length === 0) && (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: colors.textSecondary }} />
                  <p style={{ color: colors.textSecondary }}>Aucune analyse trouvée</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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