
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowPathIcon, TrashIcon, PauseIcon, PlayIcon, XMarkIcon,
  ClockIcon, CheckCircleIcon, ExclamationTriangleIcon,
  CogIcon, FunnelIcon, ArrowsUpDownIcon,
  CpuChipIcon, DocumentIcon, EyeIcon, ArrowDownTrayIcon, ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useQueueStore } from '../../stores/queueStore';
import { usePromptStore } from '../../stores/promptStore';
import { useConfigStore } from '../../stores/configStore';
import { useSimpleConfirm } from '../../hooks/useSimpleConfirm';
import { queueService } from '../../services/queueService';
import { pdfService } from '../../services/pdfService';
import { logService } from '../../services/logService';
import { formatFileSize } from '../../utils/fileUtils';
import { getPriorityColor } from '../../utils/statusUtils';
import { UnifiedTable, TableColumn } from '../UI/UnifiedTable';
import { Prompt } from '../../services/promptService';

// Fonctions utilitaires pour les emojis de statut
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'paused':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return '✅';
    case 'processing':
      return '🔄';
    case 'pending':
      return '⏳';
    case 'failed':
      return '❌';
    case 'paused':
      return '⏸️';
    default:
      return '❓';
  }
};

// Composant pour afficher les informations du fichier (compact)
const FileInfo: React.FC<{ 
  item: any; 
  colors: any; 
}> = ({ 
  item, 
  colors
}) => {
  return (
    <div className="space-y-1">
      {/* Nom du fichier */}
      <div className="flex items-center gap-2">
        <DocumentIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
        <span className="text-sm font-medium truncate" style={{ color: colors.text }}>
          {item.file_info?.name || 'N/A'}
        </span>
      </div>
      
      {/* Taille et type */}
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: colors.textSecondary }}>
          {item.file_info?.size ? formatFileSize(item.file_info.size) : ''}
        </span>
        <span style={{ color: colors.textSecondary }}>
          {item.file_info?.mime_type || ''}
        </span>
      </div>
      
      {/* Date de création */}
      <div className="flex items-center gap-1 text-xs">
        <ClockIcon className="w-3 h-3" style={{ color: colors.textSecondary }} />
        <span style={{ color: colors.textSecondary }}>
          {new Date(item.created_at).toLocaleString('fr-FR')}
        </span>
      </div>
    </div>
  );
};

// Composant pour la configuration compacte (IA + Prompt en ligne)
const ConfigurationCompact: React.FC<{
  item: any;
  colors: any;
  prompts: Prompt[];
  onProviderChange: (itemId: string, provider: string) => void;
  onPromptChange: (itemId: string, promptId: string) => void;
  localSelections: { [itemId: string]: { provider?: string; prompt?: string } };
}> = ({ item, colors, prompts, onProviderChange, onPromptChange, localSelections }) => {
  const { getFunctionalProviders } = useConfigStore();
  const functionalProviders = getFunctionalProviders();
  
  const availableProviders = functionalProviders.map(provider => ({
    id: provider.name,
    name: getProviderDisplayName(provider.name)
  }));
  
  // Utiliser les sélections locales ou les valeurs par défaut
  const localSelection = localSelections[item.id] || {};
  const selectedProvider = localSelection.provider || item.analysis_provider || '';
  const selectedPromptId = localSelection.prompt || item.analysis_prompt || '';
  
  // Debug: Afficher les valeurs pour comprendre le problème
  console.log(`ConfigurationCompact pour item ${item.id}:`, {
    localSelection,
    itemProvider: item.analysis_provider,
    itemPrompt: item.analysis_prompt,
    selectedProvider,
    selectedPromptId
  });
  
  function getProviderDisplayName(providerName: string): string {
    const displayNames: { [key: string]: string } = {
      'openai': 'OpenAI GPT',
      'claude': 'Claude',
      'mistral': 'Mistral',
      'ollama': 'Ollama',
      'gemini': 'Google Gemini'
    };
    return displayNames[providerName] || providerName;
  }
  
  return (
    <div className="space-y-2">
      {/* Fournisseur IA */}
      <div className="flex items-center gap-2">
        <CpuChipIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
        <select
          value={selectedProvider}
          onChange={(e) => onProviderChange(item.id, e.target.value)}
          className="flex-1 px-2 py-1 text-xs rounded border"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text
          }}
        >
          <option value="">IA...</option>
          {availableProviders.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
        {selectedProvider && (
          <span className="text-xs text-gray-500">
            {selectedProvider === item.analysis_provider ? '(défaut)' : '(modifié)'}
          </span>
        )}
      </div>
      
      {/* Prompt */}
      <div className="flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
        <select
          value={selectedPromptId}
          onChange={(e) => onPromptChange(item.id, e.target.value)}
          className="flex-1 px-2 py-1 text-xs rounded border"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text
          }}
        >
          <option value="">Prompt...</option>
          {prompts.map(prompt => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.name} ({prompt.domain})
            </option>
          ))}
        </select>
        {selectedPromptId && (
          <span className="text-xs text-gray-500">
            {selectedPromptId === item.analysis_prompt ? '(défaut)' : '(modifié)'}
          </span>
        )}
      </div>
    </div>
  );
};

// Composant pour le bouton d'action de statut dynamique
const StatusActionButton: React.FC<{
  item: any;
  onAction: (action: string, itemId: string) => void;
  colors: any;
  localSelections: { [itemId: string]: { provider?: string; prompt?: string } };
}> = ({ item, onAction, colors, localSelections }) => {
  // Utiliser les sélections locales ou les valeurs par défaut
  const localSelection = localSelections[item.id] || {};
  const hasProvider = localSelection.provider || item.analysis_provider;
  const hasPrompt = localSelection.prompt || item.analysis_prompt;
  const canStart = hasProvider && hasPrompt;
  
  const getButtonConfig = () => {
    switch (item.status) {
      case 'pending':
        if (!canStart) {
          return {
            action: 'configure',
            onClick: () => {}, // Pas d'action, juste indicateur
            icon: <CogIcon className="w-4 h-4" />,
            label: 'Configurer',
            variant: 'warning' as const,
            disabled: true
          };
        }
        return {
          action: 'start_analysis',
          onClick: () => onAction('start_analysis', item.id),
          icon: <PlayIcon className="w-4 h-4" />,
          label: 'Démarrer',
          variant: 'success' as const,
          disabled: false
        };
        
      case 'processing':
        return {
          action: 'pause_item',
          onClick: () => onAction('pause_item', item.id),
          icon: <PauseIcon className="w-4 h-4" />,
          label: 'Pause',
          variant: 'warning' as const,
          disabled: false
        };
        
      case 'paused':
        return {
          action: 'retry_item',
          onClick: () => onAction('retry_item', item.id),
          icon: <PlayIcon className="w-4 h-4" />,
          label: 'Reprendre',
          variant: 'success' as const,
          disabled: false
        };
        
      case 'failed':
        return {
          action: 'retry_item',
          onClick: () => onAction('retry_item', item.id),
          icon: <ArrowPathIcon className="w-4 h-4" />,
          label: 'Relancer',
          variant: 'warning' as const,
          disabled: false
        };
        
      case 'completed':
        return {
          action: 'view_result',
          onClick: () => onAction('view_result', item.id),
          icon: <EyeIcon className="w-4 h-4" />,
          label: 'Voir',
          variant: 'primary' as const,
          disabled: false
        };
        
      default:
        return {
          action: 'unknown',
          onClick: () => {},
          icon: <CogIcon className="w-4 h-4" />,
          label: 'Inconnu',
          variant: 'secondary' as const,
          disabled: true
        };
    }
  };
  
  const config = getButtonConfig();
  
  const getVariantStyles = () => {
    switch (config.variant) {
      case 'primary':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'secondary':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };
  
  return (
    <button
      onClick={config.onClick}
      disabled={config.disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${getVariantStyles()} ${
        config.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'
      }`}
      title={config.label}
    >
      {config.icon}
      <span>{config.label}</span>
    </button>
  );
};

// Composant pour les actions utilitaires (dupliquer, supprimer)
const UtilityActions: React.FC<{
  item: any;
  onAction: (action: string, itemId: string) => void;
  colors: any;
}> = ({ item, onAction, colors }) => {
  return (
    <div className="flex items-center gap-1">
      {/* Bouton de duplication */}
      <button
        onClick={() => onAction('duplicate_item', item.id)}
        className="text-xs px-2 py-1 rounded border hover:bg-blue-50 hover:border-blue-300 transition-colors"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
          color: colors.textSecondary,
        }}
        title="Dupliquer l'analyse"
      >
        <DocumentDuplicateIcon className="w-3 h-3" />
      </button>
      
      {/* Bouton de suppression */}
      <button
        onClick={() => onAction('delete_item', item.id)}
        className="text-xs px-2 py-1 rounded border hover:bg-red-50 hover:border-red-300 transition-colors"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
          color: colors.textSecondary,
        }}
        title="Supprimer"
      >
        <TrashIcon className="w-3 h-3" />
      </button>
    </div>
  );
};

interface QueueTableProps {
  items: any[];
  onAction: (action: string, itemId: string) => void;
  selectedItems: string[];
  onSelectionChange: (itemIds: string[]) => void;
  prompts: Prompt[];
  onPromptChange: (itemId: string, promptId: string) => void;
  onProviderChange: (itemId: string, provider: string) => void;
  localSelections: { [itemId: string]: { provider?: string; prompt?: string } };
}

interface QueueFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
}

// Composant de tableau simplifié
const QueueTable: React.FC<QueueTableProps> = ({ 
  items, 
  onAction, 
  selectedItems, 
  onSelectionChange, 
  prompts,
  onPromptChange,
  onProviderChange,
  localSelections
}) => {
  const { colors } = useColors();
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' as 'asc' | 'desc' });
  
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
    logService.debug(`Tri de la colonne ${key} en ${direction}`, 'QueueIAAdvanced', { key, direction });
  };

  // Définition des colonnes simplifiées
  const columns: TableColumn<any>[] = [
    {
      key: 'file',
      label: 'Fichier',
      sortable: true,
      render: (item) => (
        <FileInfo 
          item={item} 
          colors={colors}
        />
      )
    },
    {
      key: 'configuration',
      label: 'Configuration',
      sortable: false,
             render: (item) => (
         <ConfigurationCompact
           item={item}
           colors={colors}
           prompts={prompts}
           onProviderChange={onProviderChange}
           onPromptChange={onPromptChange}
           localSelections={localSelections}
         />
       )
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
             render: (item) => (
         <StatusActionButton
           item={item}
           onAction={onAction}
           colors={colors}
           localSelections={localSelections}
         />
       )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <UtilityActions
          item={item}
          onAction={onAction}
          colors={colors}
        />
      )
    }
  ];
  
  return (
    <UnifiedTable
      data={items}
      columns={columns}
      selectedItems={selectedItems}
      onSelectionChange={onSelectionChange}
      onSort={handleSort}
      sortConfig={sortConfig}
      getItemId={(item) => item.id}
      showCheckbox={true}
    />
  );
};

// Composant de filtres simplifié
const QueueFilters: React.FC<QueueFiltersProps> = ({ filters, onFilterChange }) => {
  const { colors } = useColors();
  
  return (
    <div className="mb-4 p-3 rounded-lg border" style={{
      backgroundColor: colors.surface,
      borderColor: colors.border,
    }}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
          <span className="text-sm font-medium" style={{ color: colors.text }}>
            Filtres
          </span>
        </div>
        
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="px-2 py-1 rounded text-xs border"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
            minWidth: '120px'
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="completed">Terminé</option>
          <option value="failed">Échoué</option>
          <option value="paused">En pause</option>
        </select>
        
        <input
          type="text"
          placeholder="Rechercher par nom..."
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="px-2 py-1 rounded text-xs border flex-1"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
            minWidth: '150px'
          }}
        />
        
        <button
          onClick={() => onFilterChange({ status: '', priority: '', analysis_type: '', search: '' })}
          className="px-2 py-1 text-xs rounded border hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.textSecondary,
          }}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

// Composant principal simplifié
export const QueueIAAdvanced: React.FC = () => {
  const { colors } = useColors();
  const { queueItems, loadQueueItems } = useQueueStore();
  const { prompts, loading: loadingPrompts, getPrompts } = usePromptStore();
  const { loadAIProviders, isInitialized: configInitialized } = useConfigStore();
  
  const currentPrompts = getPrompts();
  
  React.useEffect(() => {
    loadQueueItems();
    if (!configInitialized) {
      loadAIProviders();
    }
  }, [loadQueueItems, loadAIProviders, configInitialized]);

  // Debug: Afficher les données reçues
  React.useEffect(() => {
    if (queueItems.length > 0) {
      console.log('QueueItems reçus:', queueItems.map(item => ({
        id: item.id,
        analysis_provider: item.analysis_provider,
        analysis_prompt: item.analysis_prompt ? item.analysis_prompt.substring(0, 50) + '...' : null
      })));
    }
  }, [queueItems]);
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    analysis_type: '',
    search: ''
  });
  
  // État local pour les sélections d'IA et prompt
  const [localSelections, setLocalSelections] = useState<{
    [itemId: string]: {
      provider?: string;
      prompt?: string;
    }
  }>({});

  // Initialiser les sélections locales avec les valeurs de la base de données
  React.useEffect(() => {
    if (queueItems.length > 0) {
      const initialSelections: { [itemId: string]: { provider?: string; prompt?: string } } = {};
      
      queueItems.forEach(item => {
        if (item.analysis_provider || item.analysis_prompt) {
          initialSelections[item.id] = {
            provider: item.analysis_provider || undefined,
            prompt: item.analysis_prompt || undefined
          };
        }
      });
      
      setLocalSelections(prev => ({
        ...prev,
        ...initialSelections
      }));
    }
  }, [queueItems]);
  
  const { simpleDelete, simpleAction } = useSimpleConfirm();

  // Gérer le changement de prompt (mise à jour locale uniquement)
  const handlePromptChange = (itemId: string, promptId: string) => {
    const item = queueItems.find(q => q.id.toString() === itemId);
    const itemName = item?.file_info?.name || `ID: ${itemId}`;
    
    logService.debug(`Changement de prompt pour ${itemName}`, 'QueueIAAdvanced', { itemId, promptId, itemName });
    
    // Mise à jour de l'état local
    setLocalSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        prompt: promptId
      }
    }));
  };

  // Gérer le changement de fournisseur IA (mise à jour locale uniquement)
  const handleProviderChange = (itemId: string, providerId: string) => {
    const item = queueItems.find(q => q.id.toString() === itemId);
    const itemName = item?.file_info?.name || `ID: ${itemId}`;
    
    logService.debug(`Changement de fournisseur IA pour ${itemName}`, 'QueueIAAdvanced', { itemId, providerId, itemName });
    
    // Mise à jour de l'état local
    setLocalSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        provider: providerId
      }
    }));
  };

  const handleAction = async (action: string, itemId: string, additionalData?: any) => {
    try {
      const item = queueItems.find(q => q.id.toString() === itemId);
      const itemName = item?.file_info?.name || `ID: ${itemId}`;
      
      logService.debug(`Action ${action} sur ${itemName}`, 'QueueIAAdvanced', { action, itemId, itemName });
      
      switch (action) {
        case 'retry_item':
          await queueService.retryQueueItem(parseInt(itemId));
          logService.info('Analyse relancée', 'QueueIAAdvanced', { itemId, itemName });
          break;
        case 'view_result':
          logService.debug('Ouverture du résultat', 'QueueIAAdvanced', { itemId, itemName });
          // TODO: Implémenter l'ouverture du résultat
          break;
        case 'generate_pdf':
          await pdfService.generateAnalysisPDF(parseInt(itemId));
          logService.info('PDF généré', 'QueueIAAdvanced', { itemId, itemName });
          break;
                         case 'duplicate_item':
            logService.debug('Duplication de l\'analyse', 'QueueIAAdvanced', { itemId, itemName });
            
            // Récupérer les sélections locales ou les valeurs par défaut pour la duplication
            const duplicateLocalSelection = localSelections[itemId] || {};
            const duplicateProvider = duplicateLocalSelection.provider || item.analysis_provider;
            const duplicatePrompt = duplicateLocalSelection.prompt || item.analysis_prompt;
           
           try {
             const result = await queueService.duplicateAnalysis(
               parseInt(itemId), 
               duplicateProvider, 
               duplicatePrompt
             );
             
             logService.info('Analyse dupliquée avec succès', 'QueueIAAdvanced', { 
               itemId, 
               itemName, 
               newItemId: result.new_item_id,
               newAnalysisId: result.new_analysis_id,
               provider: duplicateProvider,
               prompt: duplicatePrompt
             });
             
             // Rafraîchir la queue pour afficher la nouvelle ligne
             await loadQueueItems();
             
           } catch (error) {
             logService.error('Erreur lors de la duplication de l\'analyse', 'QueueIAAdvanced', { 
               itemId, 
               itemName, 
               error: error.message 
             });
           }
           break;
         case 'delete_item':
           simpleDelete(
             `l'analyse "${itemName}"`,
             async () => {
               await queueService.deleteQueueItem(parseInt(itemId));
               logService.info('Analyse supprimée', 'QueueIAAdvanced', { itemId, itemName });
             }
           );
           return;
                 case 'start_analysis':
           // Récupérer les sélections locales ou les valeurs par défaut
           const localSelection = localSelections[itemId] || {};
           const selectedProvider = localSelection.provider || item.analysis_provider;
           const selectedPrompt = localSelection.prompt || item.analysis_prompt;
           
           if (!selectedProvider || !selectedPrompt) {
             logService.warning('Impossible de démarrer l\'analyse - IA ou prompt manquant', 'QueueIAAdvanced', { 
               itemId, 
               itemName, 
               selectedProvider, 
               selectedPrompt 
             });
             return;
           }
           
           logService.debug('Démarrage de l\'analyse', 'QueueIAAdvanced', { itemId, itemName, provider: selectedProvider, prompt: selectedPrompt });
           
           // Envoyer la requête au backend pour mettre à jour et démarrer l'analyse
           try {
             await queueService.updateAnalysisProviderAndPrompt(
               parseInt(itemId), 
               selectedProvider, 
               selectedPrompt
             );
             logService.info('Analyse démarrée avec succès', 'QueueIAAdvanced', { itemId, itemName, provider: selectedProvider, prompt: selectedPrompt });
             await loadQueueItems();
           } catch (error) {
             logService.error('Erreur lors du démarrage de l\'analyse', 'QueueIAAdvanced', { itemId, itemName, error: error.message });
           }
           break;
        case 'pause_item':
          logService.debug('Mise en pause de l\'analyse', 'QueueIAAdvanced', { itemId, itemName });
          // TODO: Implémenter la pause
          break;
        default:
          logService.warning('Action non implémentée', 'QueueIAAdvanced', { action, itemId, itemName });
          console.log('Action non implémentée:', action);
      }

    } catch (error) {
      logService.error(`Erreur lors de l'action ${action}`, 'QueueIAAdvanced', { action, itemId, error: error.message });
      console.error('Erreur lors de l\'action:', error);
    }
  };
  
  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) return;
    
    try {
      logService.debug(`Action bulk ${action} sur ${selectedItems.length} éléments`, 'QueueIAAdvanced', { action, selectedItems });
      
      switch (action) {
        case 'pause_all':
          await queueService.pauseQueue();
          logService.info('Queue mise en pause', 'QueueIAAdvanced');
          break;
        case 'resume_all':
          await queueService.resumeQueue();
          logService.info('Queue reprise', 'QueueIAAdvanced');
          break;
        case 'retry_failed':
          await queueService.retryFailedItems();
          logService.info('Analyses échouées relancées', 'QueueIAAdvanced');
          break;
        case 'clear_completed':
          simpleAction(
            'supprimer toutes les analyses terminées',
            'les analyses terminées',
            async () => {
              await queueService.clearQueue();
              logService.info('Analyses terminées supprimées', 'QueueIAAdvanced');
              setSelectedItems([]);
            },
            undefined,
            'danger'
          );
          return;
        default:
          logService.warning('Action bulk non implémentée', 'QueueIAAdvanced', { action });
          console.log('Action bulk non implémentée:', action);
      }
      if (action !== 'clear_completed') {
        setSelectedItems([]);
      }
    } catch (error) {
      logService.error(`Erreur lors de l'action bulk ${action}`, 'QueueIAAdvanced', { action, error: error.message });
      console.error('Erreur lors de l\'action bulk:', error);
    }
  };
  
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: colors.background }}>
      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: colors.border }}>
        <h1 className="text-xl font-bold" style={{ color: colors.text }}>
          Queue IA Avancée
        </h1>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Gestion simplifiée de la queue d'analyses
        </p>
      </div>
      
      <div className="flex-1 flex flex-col p-4 min-h-0">
        
        {/* Actions globales */}
        <div className="mb-4 p-3 rounded-lg border flex-shrink-0" style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: colors.text }}>
                Actions globales:
              </span>
              <button
                onClick={() => handleBulkAction('pause_all')}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
              >
                <PauseIcon className="w-3 h-3 mr-1" />
                Pause
              </button>
              <button
                onClick={() => handleBulkAction('resume_all')}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <PlayIcon className="w-3 h-3 mr-1" />
                Reprendre
              </button>
              <button
                onClick={() => handleBulkAction('retry_failed')}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <ArrowPathIcon className="w-3 h-3 mr-1" />
                Relancer
              </button>
              <button
                onClick={() => handleBulkAction('clear_completed')}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="w-3 h-3 mr-1" />
                Vider
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: colors.textSecondary }}>
                {selectedItems.length} élément(s) sélectionné(s)
              </span>
              {selectedItems.length > 0 && (
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-xs px-2 py-1 rounded border hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textSecondary,
                  }}
                >
                  Désélectionner
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Filtres */}
        <div className="flex-shrink-0">
          <QueueFilters filters={filters} onFilterChange={setFilters} />
        </div>
        
        {/* Tableau avec scroll */}
        <div className="flex-1 rounded-lg border min-h-0" style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}>
          <div className="h-full overflow-y-auto">
            {loadingPrompts ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <span style={{ color: colors.textSecondary }}>Chargement des prompts...</span>
                </div>
              </div>
            ) : (
                             <QueueTable
                 items={queueItems}
                 onAction={handleAction}
                 selectedItems={selectedItems}
                 onSelectionChange={setSelectedItems}
                 prompts={currentPrompts}
                 onPromptChange={handlePromptChange}
                 onProviderChange={handleProviderChange}
                 localSelections={localSelections}
               />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueIAAdvanced;
