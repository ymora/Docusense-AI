
import React, { useState, useEffect } from 'react';
import { 
  ArrowPathIcon, TrashIcon, PauseIcon, PlayIcon, XMarkIcon,
  ClockIcon,
  CogIcon, FunnelIcon,
  CpuChipIcon, DocumentIcon, EyeIcon, ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon, Squares2X2Icon
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
import { UnifiedTable, TableColumn } from '../UI/UnifiedTable';
import { Prompt } from '../../services/promptService';



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

// Composant pour afficher le type de fichier
const FileTypeDisplay: React.FC<{
  item: any;
  colors: any;
}> = ({ item, colors }) => {
  const getFileTypeInfo = () => {
    const fileName = item.file_info?.name || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    // Déterminer le type de fichier basé sur l'extension
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
      return {
        label: 'Image',
        color: '#10b981', // Vert
        bgColor: 'rgba(16, 185, 129, 0.1)',
      };
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileExtension)) {
      return {
        label: 'Vidéo',
        color: '#8b5cf6', // Violet
        bgColor: 'rgba(139, 92, 246, 0.1)',
      };
    } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(fileExtension)) {
      return {
        label: 'Audio',
        color: '#f59e0b', // Orange
        bgColor: 'rgba(245, 158, 11, 0.1)',
      };
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(fileExtension)) {
      return {
        label: 'Document',
        color: '#3b82f6', // Bleu
        bgColor: 'rgba(59, 130, 246, 0.1)',
      };
    } else {
      return {
        label: 'Texte',
        color: '#6b7280', // Gris
        bgColor: 'rgba(107, 114, 128, 0.1)',
      };
    }
  };

  const typeInfo = getFileTypeInfo();

  return (
    <div className="flex items-center gap-2">
      <span
        className="px-2 py-1 rounded text-xs font-medium"
        style={{
          backgroundColor: typeInfo.bgColor,
          color: typeInfo.color,
          border: `1px solid ${typeInfo.color}`
        }}
      >
        {typeInfo.label}
      </span>
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
  const { getAIProviders } = useConfigStore();
  const allAIProviders = getAIProviders();
  
  // Créer la liste complète avec statut de disponibilité basé sur la configuration réelle
  // Utiliser tous les providers de la configuration IA, pas seulement les fonctionnels
  const allProvidersWithStatus = allAIProviders.map(provider => ({
    id: provider.name,
    name: getProviderDisplayName(provider.name),
    available: provider.is_active && provider.is_functional
  }));
  
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
  
  // Utiliser les sélections locales ou les valeurs par défaut
  const localSelection = localSelections[item.id] || {};
  let selectedProvider = localSelection.provider !== undefined ? localSelection.provider : (item.analysis_provider || '');
  
  // S'assurer que la valeur sélectionnée est dans la liste des options disponibles
  if (selectedProvider && !allProvidersWithStatus.some(p => p.id === selectedProvider)) {
    console.warn(`Provider ${selectedProvider} non trouvé dans les options disponibles:`, allProvidersWithStatus.map(p => p.id));
    selectedProvider = ''; // Réinitialiser si non trouvé
  }
  
  // Debug temporaire pour voir les fournisseurs IA disponibles
  console.log(`🔍 Fournisseurs IA pour item ${item.id}:`, {
    allProvidersWithStatus: allProvidersWithStatus.map(p => ({ id: p.id, name: p.name, available: p.available })),
    selectedProvider,
    itemProvider: item.analysis_provider,
    localSelection: localSelection,
    // Debug spécifique pour comprendre le problème
    debug: {
      hasLocalSelection: !!localSelection.provider,
      localSelectionProvider: localSelection.provider,
      itemAnalysisProvider: item.analysis_provider,
      finalSelectedProvider: selectedProvider,
      isProviderInAvailable: allProvidersWithStatus.some(p => p.id === selectedProvider && p.available),
      // Debug du select
      selectValue: selectedProvider,
      selectOptions: allProvidersWithStatus.map(p => ({ value: p.id, label: p.name, available: p.available }))
    }
  });
  
     // Pour les prompts, on doit trouver l'ID correspondant au contenu
   let selectedPromptId = '';
   if (localSelection.prompt !== undefined) {
     selectedPromptId = localSelection.prompt;
       } else if ((item as any).analysis_prompt) {
      // Chercher le prompt par son contenu
      const matchingPrompt = prompts.find(p => p.prompt === (item as any).analysis_prompt);
      selectedPromptId = matchingPrompt?.id || '';
   } else {
     // Sélection automatique basée sur le type de fichier
     const fileName = item.file_info?.name || '';
     const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
     
     // Déterminer le type de fichier et sélectionner un prompt par défaut
     let defaultDomain = 'GENERAL';
     if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
       defaultDomain = 'IMAGE';
     } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileExtension)) {
       defaultDomain = 'VIDEO';
     } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(fileExtension)) {
       defaultDomain = 'AUDIO';
     } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(fileExtension)) {
       defaultDomain = 'DOCUMENT';
     }
     
     // Trouver le premier prompt du domaine correspondant
     const defaultPrompt = prompts.find(p => (p.domain || 'GENERAL').toUpperCase() === defaultDomain);
     if (defaultPrompt) {
       selectedPromptId = defaultPrompt.id;
       // Mettre à jour automatiquement la sélection locale
       if (!localSelection.prompt) {
         onPromptChange(item.id, defaultPrompt.id);
       }
     }
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
                       {allProvidersWithStatus.map(provider => (
              <option 
                key={provider.id} 
                value={provider.id}
                style={{
                  color: provider.available ? '#10b981' : '#ef4444' // Vert si disponible, rouge si non disponible
                }}
              >
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
           {(() => {
             // Grouper les prompts par domaine
             const groupedPrompts = prompts.reduce((groups, prompt) => {
               const domain = prompt.domain || 'GENERAL';
               if (!groups[domain]) {
                 groups[domain] = [];
               }
               groups[domain].push(prompt);
               return groups;
             }, {} as { [key: string]: Prompt[] });

             // Trier les domaines
             const sortedDomains = Object.keys(groupedPrompts).sort();

             return sortedDomains.map(domain => (
               <optgroup key={domain} label={domain.toUpperCase()}>
                 {groupedPrompts[domain].map(prompt => (
                   <option key={prompt.id} value={prompt.id}>
                     {prompt.name}
                   </option>
                 ))}
               </optgroup>
             ));
           })()}
         </select>
                 {selectedPromptId && (
           <span className="text-xs text-gray-500">
             {selectedPromptId === (item as any).analysis_prompt ? '(défaut)' : '(modifié)'}
           </span>
         )}
      </div>
    </div>
  );
};

// Composant pour afficher le statut avec couleur
const StatusDisplay: React.FC<{
  item: any;
  colors: any;
}> = ({ item, colors }) => {
  const getStatusConfig = () => {
    switch (item.status) {
      case 'pending':
        return {
          label: 'En attente',
          color: '#f59e0b', // Orange
          bgColor: 'rgba(245, 158, 11, 0.1)'
        };
      case 'processing':
        return {
          label: 'En cours',
          color: '#3b82f6', // Bleu
          bgColor: 'rgba(59, 130, 246, 0.1)'
        };
      case 'completed':
        return {
          label: 'Terminé',
          color: '#10b981', // Vert
          bgColor: 'rgba(16, 185, 129, 0.1)'
        };
      case 'failed':
        return {
          label: 'Échoué',
          color: '#ef4444', // Rouge
          bgColor: 'rgba(239, 68, 68, 0.1)'
        };
      case 'paused':
        return {
          label: 'En pause',
          color: '#8b5cf6', // Violet
          bgColor: 'rgba(139, 92, 246, 0.1)'
        };
      default:
        return {
          label: 'Inconnu',
          color: colors.textSecondary,
          bgColor: 'rgba(107, 114, 128, 0.1)'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className="px-2 py-1 rounded text-xs font-medium"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.color}`
      }}
    >
      {config.label}
    </span>
  );
};

// Composant pour les actions utilitaires (dupliquer, supprimer, visualiser) + actions de statut
const UtilityActions: React.FC<{
  item: any;
  onAction: (action: string, itemId: string) => void;
  colors: any;
  localSelections: { [itemId: string]: { provider?: string; prompt?: string } };
}> = ({ item, onAction, colors, localSelections }) => {
  const isAnalysisCompleted = item.status === 'completed';
  const isAnalysisProcessing = item.status === 'processing';
  const isAnalysisFailed = item.status === 'failed';
  const isAnalysisPending = item.status === 'pending';
  const isAnalysisPaused = item.status === 'paused';

  const localSelection = localSelections[item.id] || {};
  const hasProvider = localSelection.provider !== undefined ? localSelection.provider : item.analysis_provider;
  const hasPrompt = localSelection.prompt !== undefined ? localSelection.prompt : (item as any).analysis_prompt;
  const canStart = hasProvider && hasPrompt;

       // Configuration des actions avec une seule icône principale qui change selon le contexte
  const actionConfig = {
    main: {
      action: '', icon: null, variant: 'primary', disabled: true, tooltip: ''
    },
    view: {
      action: 'view_file', icon: <EyeIcon className="w-4 h-4" />, variant: 'info', disabled: true, tooltip: 'Visualiser le fichier'
    },
    duplicate: {
      action: 'duplicate_item', icon: <DocumentDuplicateIcon className="w-4 h-4" />, variant: 'warning', disabled: false, tooltip: 'Dupliquer l\'analyse' // Always active
    },
    delete: {
      action: 'delete_item', icon: <TrashIcon className="w-4 h-4" />, variant: 'danger', disabled: false, tooltip: 'Supprimer l\'analyse' // Always active
    }
  };

  // Logique pour l'action principale qui change selon le contexte
  if (isAnalysisPending) {
    if (canStart) {
      actionConfig.main = { action: 'start_analysis', icon: <PlayIcon className="w-4 h-4" />, variant: 'success', disabled: false, tooltip: 'Démarrer l\'analyse' };
    } else {
      actionConfig.main = { action: '', icon: <PlayIcon className="w-4 h-4" />, variant: 'primary', disabled: true, tooltip: 'Configurer l\'IA et le prompt pour démarrer' };
    }
  } else if (isAnalysisProcessing) {
    actionConfig.main = { action: 'pause_item', icon: <PauseIcon className="w-4 h-4" />, variant: 'warning', disabled: false, tooltip: 'Mettre en pause l\'analyse' };
  } else if (isAnalysisPaused) {
    actionConfig.main = { action: 'start_analysis', icon: <PlayIcon className="w-4 h-4" />, variant: 'success', disabled: false, tooltip: 'Reprendre l\'analyse' };
  } else if (isAnalysisCompleted) {
    actionConfig.main = { action: 'retry_analysis', icon: <ArrowPathIcon className="w-4 h-4" />, variant: 'primary', disabled: false, tooltip: 'Relancer l\'analyse' };
    actionConfig.view.disabled = false; // Peut visualiser si terminée
  } else if (isAnalysisFailed) {
    actionConfig.main = { action: 'retry_analysis', icon: <ArrowPathIcon className="w-4 h-4" />, variant: 'primary', disabled: false, tooltip: 'Relancer l\'analyse' };
  } else { // Unknown status
    actionConfig.main = { action: '', icon: <PlayIcon className="w-4 h-4" />, variant: 'primary', disabled: true, tooltip: 'Statut inconnu' };
    actionConfig.view.disabled = true;
  }

  return (
    <div className="flex items-center gap-1">
      {/* Bouton d'action principal (Démarrer/Pause/Relancer) - change selon le contexte */}
      <button
        onClick={() => onAction(actionConfig.main.action, item.id)}
        disabled={actionConfig.main.disabled}
        className={`inline-flex items-center justify-center px-3 py-2 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.main.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${actionConfig.main.disabled ? '#6b7280' : actionConfig.main.variant === 'success' ? '#10b981' : actionConfig.main.variant === 'warning' ? '#f59e0b' : actionConfig.main.variant === 'primary' ? '#3b82f6' : '#6b7280'}`,
          color: actionConfig.main.disabled ? '#6b7280' : actionConfig.main.variant === 'success' ? '#10b981' : actionConfig.main.variant === 'warning' ? '#f59e0b' : actionConfig.main.variant === 'primary' ? '#3b82f6' : '#6b7280',
          minHeight: '28px'
        }}
        title={actionConfig.main.tooltip || 'Action principale'}
      >
        {actionConfig.main.icon || <div className="w-4 h-4" />}
      </button>

      {/* Bouton de visualisation - toujours visible */}
      <button
        onClick={() => onAction(actionConfig.view.action, item.id)}
        disabled={actionConfig.view.disabled}
        className={`inline-flex items-center justify-center px-3 py-2 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.view.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${actionConfig.view.disabled ? '#6b7280' : '#3b82f6'}`,
          color: actionConfig.view.disabled ? '#6b7280' : '#3b82f6',
          minHeight: '28px'
        }}
        title={actionConfig.view.tooltip}
      >
        {actionConfig.view.icon}
      </button>

      {/* Bouton de duplication - toujours visible et actif */}
      <button
        onClick={() => onAction(actionConfig.duplicate.action, item.id)}
        disabled={actionConfig.duplicate.disabled}
        className={`inline-flex items-center justify-center px-3 py-2 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.duplicate.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${actionConfig.duplicate.disabled ? '#6b7280' : '#f59e0b'}`,
          color: actionConfig.duplicate.disabled ? '#6b7280' : '#f59e0b',
          minHeight: '28px'
        }}
        title={actionConfig.duplicate.tooltip}
      >
        {actionConfig.duplicate.icon}
      </button>

      {/* Bouton de suppression - toujours visible et actif */}
      <button
        onClick={() => onAction(actionConfig.delete.action, item.id)}
        disabled={actionConfig.delete.disabled}
        className={`inline-flex items-center justify-center px-3 py-2 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.delete.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${actionConfig.delete.disabled ? '#6b7280' : '#ef4444'}`,
          color: actionConfig.delete.disabled ? '#6b7280' : '#ef4444',
          minHeight: '28px'
        }}
        title={actionConfig.delete.tooltip}
      >
        {actionConfig.delete.icon}
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
      key: 'file_type',
      label: 'Type',
      sortable: true,
      render: (item) => (
        <FileTypeDisplay
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
        <StatusDisplay
          item={item}
          colors={colors}
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
          localSelections={localSelections}
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
        
        <select
          value={filters.file_type}
          onChange={(e) => onFilterChange({ ...filters, file_type: e.target.value })}
          className="px-2 py-1 rounded text-xs border"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
            minWidth: '120px'
          }}
        >
          <option value="">Tous les types de fichiers</option>
          <option value="text">Texte</option>
          <option value="image">Image</option>
          <option value="video">Vidéo</option>
          <option value="audio">Audio</option>
          <option value="document">Document</option>
        </select>
        
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Rechercher par nom de fichier..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="px-2 py-1 rounded text-xs border w-full"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
              minWidth: '150px'
            }}
          />
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-help"
            title="Recherche par nom de fichier. Utilisez ';' pour séparer plusieurs termes (ex: 'doc;rapport')."
          >
            ⓘ
          </div>
        </div>
        
        <button
          onClick={() => onFilterChange({ status: '', file_type: '', search: '' })}
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
  const { loadAIProviders, refreshAIProviders, isInitialized: configInitialized } = useConfigStore();
  
  const currentPrompts = getPrompts();
  
  React.useEffect(() => {
    console.log('🔄 Chargement des données de la queue...');
    loadQueueItems();
    if (!configInitialized) {
      console.log('🔄 Chargement de la configuration IA...');
      loadAIProviders();
    } else {
      // Rafraîchir la configuration IA pour s'assurer d'avoir les dernières données
      console.log('🔄 Rafraîchissement de la configuration IA...');
      refreshAIProviders();
    }
  }, [loadQueueItems, loadAIProviders, refreshAIProviders, configInitialized]);

     // Debug: Afficher l'état des données
   React.useEffect(() => {
     console.log('📊 État des données:', {
       queueItems: queueItems.length,
       prompts: currentPrompts.length,
       configInitialized,
       loadingPrompts
     });
   }, [queueItems, currentPrompts, configInitialized, loadingPrompts]);






  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
     const [filters, setFilters] = useState({
     status: '',
     file_type: '',
     search: ''
   });

   // Filtrer les éléments selon les critères
   const filteredItems = React.useMemo(() => {
     return queueItems.filter(item => {
       // Filtre par statut
       if (filters.status && item.status !== filters.status) {
         return false;
       }

       // Filtre par type de fichier
       if (filters.file_type) {
         const fileName = item.file_info?.name || '';
         const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
         
         let itemFileType = 'text';
         if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
           itemFileType = 'image';
         } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileExtension)) {
           itemFileType = 'video';
         } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(fileExtension)) {
           itemFileType = 'audio';
         } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(fileExtension)) {
           itemFileType = 'document';
         }
         
         if (itemFileType !== filters.file_type) {
           return false;
         }
       }

       // Filtre par recherche (nom de fichier)
       if (filters.search) {
         const fileName = item.file_info?.name || '';
         const searchTerms = filters.search.split(';').map(term => term.trim().toLowerCase());
         const fileNameLower = fileName.toLowerCase();
         
         // Au moins un terme doit correspondre
         const hasMatch = searchTerms.some(term => fileNameLower.includes(term));
         if (!hasMatch) {
           return false;
         }
       }

       return true;
     });
   }, [queueItems, filters]);
  
  // État local pour les sélections d'IA et prompt
  const [localSelections, setLocalSelections] = useState<{
    [itemId: string]: {
      provider?: string;
      prompt?: string;
    }
  }>({});

  // Initialiser les sélections locales avec les valeurs de la base de données
  React.useEffect(() => {
    if (queueItems.length > 0 && currentPrompts.length > 0 && configInitialized) {
      setLocalSelections(prev => {
        const updatedSelections = { ...prev };
        let hasChanges = false;
        
        queueItems.forEach(item => {
          // Ne pas écraser les sélections locales existantes
          if (!prev[item.id]) {
            // Seulement initialiser si aucune sélection locale n'existe
            if (item.analysis_provider || item.analysis_prompt) {
              // Pour les prompts, on doit trouver l'ID correspondant au contenu
              let promptId = undefined;
              if (item.analysis_prompt) {
                const matchingPrompt = currentPrompts.find(p => p.prompt === item.analysis_prompt);
                promptId = matchingPrompt?.id;
              }
              
              updatedSelections[item.id] = {
                provider: item.analysis_provider || undefined,
                prompt: promptId
              };
              hasChanges = true;
            }
          }
        });
        
        return hasChanges ? updatedSelections : prev;
      });
    }
  }, [queueItems, currentPrompts, configInitialized]);
  
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
            
            // Pour les prompts, on doit récupérer le contenu du prompt sélectionné
            let duplicatePrompt = '';
            if (duplicateLocalSelection.prompt) {
              const selectedPromptObj = currentPrompts.find(p => p.id === duplicateLocalSelection.prompt);
              duplicatePrompt = selectedPromptObj?.prompt || '';
            } else if (item.analysis_prompt) {
              duplicatePrompt = item.analysis_prompt;
            }
           
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
           // Suppression directe sans confirmation
           try {
             await queueService.deleteQueueItem(parseInt(itemId));
             logService.info('Analyse supprimée', 'QueueIAAdvanced', { itemId, itemName });
             await loadQueueItems();
           } catch (error) {
             logService.error('Erreur lors de la suppression', 'QueueIAAdvanced', { itemId, itemName, error: error.message });
           }
           break;
                         case 'start_analysis':
            // Récupérer les sélections locales ou les valeurs par défaut
            const startLocalSelection = localSelections[itemId] || {};
            const selectedProvider = startLocalSelection.provider || item.analysis_provider;
            
            // Pour les prompts, on doit récupérer le contenu du prompt sélectionné
            let selectedPrompt = '';
            if (startLocalSelection.prompt) {
              const selectedPromptObj = currentPrompts.find(p => p.id === startLocalSelection.prompt);
              selectedPrompt = selectedPromptObj?.prompt || '';
            } else if (item.analysis_prompt) {
              selectedPrompt = item.analysis_prompt;
            }
           
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
        case 'retry_analysis':
          logService.debug('Relance de l\'analyse', 'QueueIAAdvanced', { itemId, itemName });
          try {
            await queueService.retryQueueItem(parseInt(itemId));
            logService.info('Analyse relancée', 'QueueIAAdvanced', { itemId, itemName });
            await loadQueueItems();
          } catch (error) {
            logService.error('Erreur lors de la relance', 'QueueIAAdvanced', { itemId, itemName, error: error.message });
          }
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
                 case 'compare_selected':
           if (selectedItems.length < 2) {
             logService.warning('Comparaison impossible - moins de 2 éléments sélectionnés', 'QueueIAAdvanced', { selectedItems });
             return;
           }
           logService.info('Comparaison des analyses sélectionnées', 'QueueIAAdvanced', { selectedItems });
           // TODO: Implémenter la logique de comparaison
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
               <button
                 onClick={() => handleBulkAction('compare_selected')}
                 disabled={selectedItems.length < 2}
                 className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded transition-colors ${
                   selectedItems.length >= 2 
                     ? 'text-white bg-blue-600 hover:bg-blue-700' 
                     : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                 }`}
               >
                 <Squares2X2Icon className="w-3 h-3 mr-1" />
                 Comparer
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
                  items={filteredItems}
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
