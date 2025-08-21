import React, { useState, useEffect, useCallback } from 'react';
import { useColors } from '../../hooks/useColors';
import { useTypography } from '../../hooks/useTypography';
import { useAnalysisStore } from '../../stores/analysisStore';
import { usePromptStore } from '../../stores/promptStore';
import { useConfigStore } from '../../stores/configStore';
import { useUIStore } from '../../stores/uiStore';
import { useSimpleConfirm } from '../../hooks/useSimpleConfirm';
import { logService } from '../../services/logService';
import { pdfService } from '../../services/pdfService';
import { analysisService } from '../../services/analysisService';
import { Search, Filter, SortAsc, SortDesc, RefreshCw, Trash2, RotateCcw, Download, Eye } from 'lucide-react';
import { 
  EyeIcon, 
  DocumentDuplicateIcon, 
  Squares2X2Icon, 
  TrashIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { UnifiedTable } from '../UI/UnifiedTable';
import { Prompt } from '../../services/promptService';

interface TableColumn<T> {
  key: string;
  label: string;
  sortable: boolean;
  render: (item: T) => React.ReactNode;
}

interface QueueTableProps {
  items: any[];
  onAction: (action: string, itemId: string) => void;
  selectedItems: string[];
  onSelectionChange: (itemIds: string[]) => void;
  prompts: Prompt[];
  onPromptChange: (itemId: string, promptId: string) => void;
  onProviderChange: (itemId: string, provider: string) => void;
  localSelections: { [itemId: string]: { provider?: string; prompt?: string } };
  textColors: any;
}

interface QueueFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
}

// Composant d'affichage des informations de fichier
const FileInfo: React.FC<{ item: any; colors: any; textColors: any }> = ({ item, colors, textColors }) => {
  // Fonction pour nettoyer le nom de fichier des caractères temporaires Windows
  const cleanFileName = (fileName: string) => {
    if (!fileName) return fileName;
    // Supprimer les caractères ~$ au début du nom de fichier (fichiers temporaires Windows)
    return fileName.replace(/^~\$/, '');
  };

  return (
    <div className="space-y-1">
      <div className="font-medium text-sm" style={{ color: colors.text }}>
        {cleanFileName(item.file_info?.name) || `Analyse #${item.id}`}
      </div>
      <div className="text-xs" style={{ color: colors.textSecondary }}>
        {item.file_info?.path && (
          <span title={item.file_info.path} className="truncate max-w-xs block">
            📁 {item.file_info.path}
          </span>
        )}
      </div>
    </div>
  );
};

// Composant d'affichage du type de fichier
const FileTypeDisplay: React.FC<{ item: any; colors: any }> = ({ item, colors }) => (
  <div className="text-sm" style={{ color: colors.textSecondary }}>
    {item.analysis_type || 'Général'}
  </div>
);

// Composant de configuration compacte
const ConfigurationCompact: React.FC<{ 
  item: any; 
  colors: any; 
  textColors: any; 
  prompts: Prompt[];
  onProviderChange: (itemId: string, provider: string) => void;
  onPromptChange: (itemId: string, promptId: string) => void;
  localSelections: { [itemId: string]: { provider?: string; prompt?: string } };
}> = ({ item, colors, textColors, prompts, onProviderChange, onPromptChange, localSelections }) => {
  const { aiProviders } = useConfigStore();
  const localSelection = localSelections[item.id] || {};

  return (
    <div className="space-y-2">
      {/* Provider */}
      <div className="flex items-center space-x-2">
        <span className="text-xs w-12" style={{ color: colors.textSecondary }}>IA:</span>
        <select
          value={localSelection.provider || item.provider || 'priority_mode'}
          onChange={(e) => onProviderChange(item.id, e.target.value)}
          className="text-xs border rounded px-1 py-0.5 flex-1"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text
          }}
        >
          {/* Option Mode Priorité par défaut */}
          <option value="priority_mode" style={{ fontWeight: 'bold' }}>
            🔄 Mode Priorité (Recommandé)
          </option>
          
          {/* Séparateur */}
          <option disabled>──────────</option>
          
          {/* Providers individuels */}
          {aiProviders.filter(p => p.is_active).map(provider => (
            <option key={provider.name} value={provider.name}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt */}
      <div className="flex items-center space-x-2">
        <span className="text-xs w-12" style={{ color: colors.textSecondary }}>Prompt:</span>
        <select
          value={localSelection.prompt || ''}
          onChange={(e) => onPromptChange(item.id, e.target.value)}
          className="text-xs border rounded px-1 py-0.5 flex-1"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text
          }}
        >
          {prompts.map(prompt => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// Composant d'affichage du statut
const StatusDisplay: React.FC<{ item: any; colors: any }> = ({ item, colors }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <span 
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: getStatusColor(item.status) + '20',
        color: getStatusColor(item.status)
      }}
    >
      <span className="mr-1">{getStatusIcon(item.status)}</span>
      <span>{item.status}</span>
    </span>
  );
};

// Composant d'actions utilitaires
const UtilityActions: React.FC<{ 
  item: any; 
  onAction: (action: string, itemId: string) => void; 
  colors: any;
  localSelections: { [itemId: string]: { provider?: string; prompt?: string } };
  selectedItems: string[];
}> = ({ item, onAction, colors, localSelections, selectedItems }) => {
  const isAnalysisCompleted = item.status === 'completed';
  const isAnalysisProcessing = item.status === 'processing';
  const isAnalysisFailed = item.status === 'failed';
  const isAnalysisPending = item.status === 'pending';
  const isAnalysisPaused = item.status === 'paused';

  const localSelection = localSelections[item.id] || {};
  const hasProvider = localSelection.provider !== undefined ? localSelection.provider : item.provider;
  const hasPrompt = localSelection.prompt !== undefined ? localSelection.prompt : (item as any).analysis_prompt;
  
  // Validation plus stricte : s'assurer qu'un prompt approprié est sélectionné
  const hasValidPrompt = hasPrompt && hasPrompt.trim() !== '';
  const canStart = hasProvider && hasValidPrompt;

  // État pour vérifier l'existence du PDF
  const [hasPDF, setHasPDF] = React.useState<boolean>(false);
  const [isCheckingPDF, setIsCheckingPDF] = React.useState<boolean>(false);

  // Vérifier l'existence du PDF pour les analyses terminées
  React.useEffect(() => {
    if (isAnalysisCompleted) {
      setIsCheckingPDF(true);
      pdfService.hasPDF(parseInt(item.id))
        .then(exists => {
          setHasPDF(exists);
        })
        .catch(error => {
          // Gérer gracieusement l'erreur d'authentification ou autres erreurs
          console.warn('Impossible de vérifier l\'existence du PDF (erreur ignorée):', error.message);
          setHasPDF(false);
        })
        .finally(() => {
          setIsCheckingPDF(false);
        });
    } else {
      setHasPDF(false);
    }
  }, [item.id, isAnalysisCompleted]);

  // Configuration des actions avec une seule icône principale qui change selon le contexte
  const actionConfig = {
    main: {
      action: '', icon: null, variant: 'primary', disabled: true, tooltip: ''
    },
    view: {
      action: 'view', 
      icon: isCheckingPDF ? (
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <EyeIcon className="w-4 h-4" />
      ), 
      variant: 'info', 
      disabled: !isAnalysisCompleted || !hasPDF, 
      tooltip: isCheckingPDF ? 'Vérification du PDF...' : 
               !isAnalysisCompleted ? 'Analyse non terminée' :
               !hasPDF ? 'Aucun PDF disponible' : 'Visualiser le fichier'
    },
    duplicate: {
      action: 'duplicate', 
      icon: <DocumentDuplicateIcon className="w-4 h-4" />, 
      variant: 'warning', 
      disabled: false, 
      tooltip: 'Dupliquer l\'analyse'
    },
    compare: {
      action: 'compare', 
      icon: <Squares2X2Icon className="w-4 h-4" />, 
      variant: 'info', 
      disabled: selectedItems.length < 2 || !selectedItems.includes(item.id.toString()), 
      tooltip: selectedItems.length < 2 ? 'Comparer avec d\'autres analyses (sélectionnez au moins 2 analyses)' : 
             !selectedItems.includes(item.id.toString()) ? 'Comparer avec d\'autres analyses (cet élément doit être sélectionné)' :
             'Comparer avec d\'autres analyses'
    },
    delete: {
      action: 'delete', 
      icon: <TrashIcon className="w-4 h-4" />, 
      variant: 'danger', 
      disabled: false, 
      tooltip: 'Supprimer l\'analyse'
    }
  };

  // Logique pour l'action principale qui change selon le contexte
  if (isAnalysisPending) {
    if (canStart) {
      actionConfig.main = { action: 'start', icon: <div className="w-4 h-4">▶️</div>, variant: 'success', disabled: false, tooltip: 'Démarrer l\'analyse' };
    } else {
      const missingItems = [];
      if (!hasProvider) missingItems.push('IA');
      if (!hasValidPrompt) missingItems.push('prompt adapté');
      
      const tooltip = missingItems.length > 0 
        ? `Sélectionner ${missingItems.join(' et ')} pour démarrer`
        : 'Configurer l\'IA et le prompt pour démarrer';
        
      actionConfig.main = { action: '', icon: <div className="w-4 h-4">▶️</div>, variant: 'primary', disabled: true, tooltip };
    }
  } else if (isAnalysisProcessing) {
    actionConfig.main = { action: 'pause', icon: <div className="w-4 h-4">⏸️</div>, variant: 'warning', disabled: false, tooltip: 'Mettre en pause l\'analyse' };
  } else if (isAnalysisPaused) {
    actionConfig.main = { action: 'start', icon: <div className="w-4 h-4">▶️</div>, variant: 'success', disabled: false, tooltip: 'Reprendre l\'analyse' };
  } else if (isAnalysisCompleted) {
    actionConfig.main = { action: 'retry', icon: <RotateCcw size={16} />, variant: 'primary', disabled: false, tooltip: 'Relancer l\'analyse' };
  } else if (isAnalysisFailed) {
    actionConfig.main = { action: 'retry', icon: <RotateCcw size={16} />, variant: 'primary', disabled: false, tooltip: 'Relancer l\'analyse' };
  } else { // Unknown status
    actionConfig.main = { action: '', icon: <div className="w-4 h-4">▶️</div>, variant: 'primary', disabled: true, tooltip: 'Statut inconnu' };
    actionConfig.view.disabled = true;
  }

  return (
    <div className="flex items-center gap-1">
      {/* Bouton d'action principal (Démarrer/Pause/Relancer) - change selon le contexte */}
      <button
        onClick={() => onAction(actionConfig.main.action, item.id.toString())}
        disabled={actionConfig.main.disabled}
        className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.main.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${actionConfig.main.disabled ? '#6b7280' : actionConfig.main.variant === 'success' ? '#10b981' : actionConfig.main.variant === 'warning' ? '#f59e0b' : actionConfig.main.variant === 'primary' ? '#3b82f6' : '#6b7280'}`,
          color: actionConfig.main.disabled ? '#6b7280' : actionConfig.main.variant === 'success' ? '#10b981' : actionConfig.main.variant === 'warning' ? '#f59e0b' : actionConfig.main.variant === 'primary' ? '#3b82f6' : '#6b7280',
          minHeight: '24px'
        }}
        title={actionConfig.main.tooltip || 'Action principale'}
      >
        {actionConfig.main.icon || <div className="w-4 h-4" />}
      </button>

      {/* Bouton de visualisation - toujours visible */}
      <button
        onClick={() => onAction(actionConfig.view.action, item.id.toString())}
        disabled={actionConfig.view.disabled}
        className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.view.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${actionConfig.view.disabled ? '#6b7280' : '#10b981'}`,
          color: actionConfig.view.disabled ? '#6b7280' : '#10b981',
          minHeight: '24px'
        }}
        title={actionConfig.view.tooltip}
      >
        {actionConfig.view.icon}
      </button>

      {/* Bouton de duplication - toujours visible et actif */}
      <button
        onClick={() => onAction(actionConfig.duplicate.action, item.id.toString())}
        disabled={actionConfig.duplicate.disabled}
        className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.duplicate.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${actionConfig.duplicate.disabled ? '#6b7280' : '#3b82f6'}`,
          color: actionConfig.duplicate.disabled ? '#6b7280' : '#3b82f6',
          minHeight: '24px'
        }}
        title={actionConfig.duplicate.tooltip}
      >
        {actionConfig.duplicate.icon}
      </button>

      {/* Bouton de comparaison - toujours visible et actif */}
      <button
        onClick={() => onAction(actionConfig.compare.action, item.id.toString())}
        disabled={actionConfig.compare.disabled}
        className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.compare.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${actionConfig.compare.disabled ? '#6b7280' : '#f59e0b'}`,
          color: actionConfig.compare.disabled ? '#6b7280' : '#f59e0b',
          minHeight: '24px'
        }}
        title={actionConfig.compare.tooltip}
      >
        {actionConfig.compare.icon}
      </button>

      {/* Bouton de suppression - toujours visible et actif */}
      <button
        onClick={() => onAction(actionConfig.delete.action, item.id.toString())}
        disabled={actionConfig.delete.disabled}
        className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.delete.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${actionConfig.delete.disabled ? '#6b7280' : '#ef4444'}`,
          color: actionConfig.delete.disabled ? '#6b7280' : '#ef4444',
          minHeight: '24px'
        }}
        title={actionConfig.delete.tooltip}
      >
        {actionConfig.delete.icon}
      </button>
    </div>
  );
};

// Composant de tableau simplifié
const QueueTable: React.FC<QueueTableProps> = ({
  items,
  onAction,
  selectedItems,
  onSelectionChange,
  prompts,
  onPromptChange,
  onProviderChange,
  localSelections,
  textColors
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
          textColors={textColors}
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
          textColors={textColors}
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
          selectedItems={selectedItems}
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
          <option value="cancelled">Annulé</option>
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
          onClick={() => onFilterChange({ status: '', search: '' })}
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
  const { textColors } = useTypography();
  const { analyses, loadAnalyses } = useAnalysisStore();
  const { prompts, loading: loadingPrompts, loadPrompts } = usePromptStore();
  const { aiProviders, loadAIProviders, refreshAIProviders, isInitialized: configInitialized } = useConfigStore();
  const { setActivePanel } = useUIStore();

  const currentPrompts = prompts;

  // États locaux simplifiés
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Chargement initial
  useEffect(() => {
    const initializeQueue = async () => {
      try {
        logService.info('Initialisation de la queue', 'QueueIAAdvanced', {
          timestamp: new Date().toISOString()
        });

        // Charger les données initiales
        await Promise.all([
          loadPrompts(),
          loadAIProviders(),
          loadAnalyses()
        ]);

        logService.info('Queue initialisée avec succès', 'QueueIAAdvanced', {
          promptsCount: currentPrompts.length,
          providersCount: aiProviders.length,
          analysesCount: analyses.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logService.error('Erreur lors de l\'initialisation de la queue', 'QueueIAAdvanced', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.error('❌ Erreur initialisation queue:', error);
      }
    };

    initializeQueue();
  }, []);

  // État local pour les sélections d'IA et prompt
  const [localSelections, setLocalSelections] = useState<{
    [itemId: string]: {
      provider?: string;
      prompt?: string;
    }
  }>({});

  // Initialiser les sélections locales avec les valeurs de la base de données
  React.useEffect(() => {
    if (analyses.length > 0 && currentPrompts.length > 0 && configInitialized) {
      setLocalSelections(prev => {
        const updatedSelections = { ...prev };
        let hasChanges = false;

        analyses.forEach(item => {
          // Ne pas écraser les sélections locales existantes
          if (!prev[item.id]) {
            // Seulement initialiser si aucune sélection locale n'existe
            let promptId = undefined;

            // Si un prompt existe en base, l'utiliser
            if ((item as any).analysis_prompt) {
              const matchingPrompt = currentPrompts.find(p => p.prompt === (item as any).analysis_prompt);
              promptId = matchingPrompt?.id;
            }

            // Si aucun prompt n'est trouvé, sélectionner automatiquement un prompt adapté
            if (!promptId) {
              const fileName = item.file_info?.name || '';
              const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

              // Déterminer le type de fichier
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

              // Chercher un prompt spécifique au domaine
              let defaultPrompt = currentPrompts.find(p => (p.domain || 'GENERAL').toUpperCase() === defaultDomain);

              // Si aucun prompt spécifique, chercher "Résumé général"
              if (!defaultPrompt) {
                defaultPrompt = currentPrompts.find(p => p.name.toLowerCase().includes('résumé général') || p.name.toLowerCase().includes('resume general'));
              }

              // Si toujours aucun, prendre le premier disponible
              if (!defaultPrompt && currentPrompts.length > 0) {
                defaultPrompt = currentPrompts[0];
              }

              if (defaultPrompt) {
                promptId = defaultPrompt.id;
              }
            }

            updatedSelections[item.id] = {
              provider: item.provider || undefined,
              prompt: promptId
            };
            hasChanges = true;
          }
        });

        return hasChanges ? updatedSelections : prev;
      });
    }
  }, [analyses, currentPrompts, configInitialized]);

  const { simpleDelete, simpleAction } = useSimpleConfirm();

  // Log des changements de configuration
  const handleProviderChange = useCallback((itemId: string, providerId: string) => {
    logService.info('Changement de fournisseur IA', 'QueueIAAdvanced', {
      itemId,
      providerId,
      previousProvider: localSelections[itemId]?.provider,
      timestamp: new Date().toISOString()
    });

    setLocalSelections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], provider: providerId }
    }));
  }, [localSelections]);

  const handlePromptChange = useCallback((itemId: string, promptId: string) => {
    logService.info('Changement de prompt', 'QueueIAAdvanced', {
      itemId,
      promptId,
      previousPrompt: localSelections[itemId]?.prompt,
      timestamp: new Date().toISOString()
    });

    setLocalSelections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], prompt: promptId }
    }));
  }, [localSelections]);

  const handleAction = async (action: string, itemId: string) => {
    const item = analyses.find(a => a.id.toString() === itemId);

    if (!item) {
      logService.error('Élément non trouvé pour action', 'QueueIAAdvanced', {
        itemId,
        action,
        availableItems: analyses.map(i => i.id),
        timestamp: new Date().toISOString()
      });
      console.error(`❌ Élément avec ID ${itemId} non trouvé dans analyses:`, analyses);
      return;
    }

    logService.info('Action sur élément de queue', 'QueueIAAdvanced', {
      action,
      itemId,
      itemName: item.file_info?.name,
      itemStatus: item.status,
      timestamp: new Date().toISOString()
    });

    try {
      setLoading(true);

      switch (action) {
        case 'start':
          // Démarrer l'analyse
          await analysisService.retryAnalysis(item.id);
          break;
        case 'pause':
          // Mettre en pause l'analyse (à implémenter)
          console.log('Pause non encore implémentée');
          break;
        case 'retry':
          await analysisService.retryAnalysis(item.id);
          break;
        case 'delete':
          await analysisService.deleteAnalysis(item.id);
          break;
        case 'view':
          // Ouvrir le fichier dans le visualiseur
          setActivePanel('viewer');
          break;
        case 'duplicate':
          // Dupliquer l'analyse (à implémenter)
          console.log('Duplication non encore implémentée');
          break;
        case 'compare':
          // Comparer l'analyse (à implémenter)
          console.log('Comparaison non encore implémentée');
          break;
        default:
          logService.warning('Action non reconnue', 'QueueIAAdvanced', {
            action,
            itemId,
            timestamp: new Date().toISOString()
          });
          console.warn(`⚠️ Action non reconnue: ${action}`);
      }
    } catch (error) {
      logService.error('Erreur lors de l\'action', 'QueueIAAdvanced', {
        action,
        itemId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error(`❌ Erreur lors de l'action ${action}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedItems.size === 0) return;

    logService.info('Action en lot démarrée', 'QueueIAAdvanced', {
      action,
      selectedItemsCount: selectedItems.size,
      selectedItems: Array.from(selectedItems),
      timestamp: new Date().toISOString()
    });

    try {
      switch (action) {
        case 'view_multiple':
          logService.info('Visualisation multiple de PDFs', 'QueueIAAdvanced', {
            count: selectedItems.size,
            selectedItems: Array.from(selectedItems),
            timestamp: new Date().toISOString()
          });

          // Vérifier qu'au moins un PDF est disponible avant d'ouvrir la visualisation
          const itemsWithPDFs = await Promise.all(
            Array.from(selectedItems).map(async (itemId) => {
              try {
                const hasPDF = await pdfService.hasPDF(parseInt(itemId));
                return { itemId, hasPDF };
              } catch (error) {
                return { itemId, hasPDF: false };
              }
            })
          );

          const availablePDFs = itemsWithPDFs.filter(item => item.hasPDF);

          if (availablePDFs.length === 0) {
            logService.warning('Aucun PDF disponible pour la visualisation', 'QueueIAAdvanced', {
              selectedItems: Array.from(selectedItems),
              timestamp: new Date().toISOString()
            });
            return;
          }

          logService.info('Ouverture de la visualisation multiple', 'QueueIAAdvanced', {
            availablePDFs: availablePDFs.map(item => item.itemId),
            count: availablePDFs.length,
            timestamp: new Date().toISOString()
          });

          // Ouvrir la visualisation multiple dans l'onglet Visualiseur
          setActivePanel('viewer');
          window.dispatchEvent(new CustomEvent('openMultiplePDFsInViewer', {
            detail: {
              selectedItems: availablePDFs.map(item => item.itemId),
              analyses: analyses,
              isComparison: false
            }
          }));
          break;

        case 'duplicate_selected':
          logService.info('Début de la duplication multiple', 'QueueIAAdvanced', {
            selectedItems: Array.from(selectedItems),
            count: selectedItems.size,
            timestamp: new Date().toISOString()
          });
          
          // TODO: Implémenter la duplication via analysisService
          console.log('Duplication multiple non encore implémentée');
          break;

        case 'compare_selected':
          if (selectedItems.size < 2) {
            logService.warning('Comparaison impossible - moins de 2 éléments sélectionnés', 'QueueIAAdvanced', {
              selectedItems: Array.from(selectedItems),
              timestamp: new Date().toISOString()
            });
            return;
          }

          logService.info('Comparaison d\'analyses sélectionnées', 'QueueIAAdvanced', {
            selectedItems: Array.from(selectedItems),
            timestamp: new Date().toISOString()
          });

          // Vérifier qu'au moins un PDF est disponible pour la comparaison
          const itemsWithPDFsForCompare = await Promise.all(
            Array.from(selectedItems).map(async (itemId) => {
              try {
                const hasPDF = await pdfService.hasPDF(parseInt(itemId));
                return { itemId, hasPDF };
              } catch (error) {
                return { itemId, hasPDF: false };
              }
            })
          );

          const availablePDFsForCompare = itemsWithPDFsForCompare.filter(item => item.hasPDF);

          if (availablePDFsForCompare.length === 0) {
            logService.warning('Aucun PDF disponible pour la comparaison', 'QueueIAAdvanced', {
              selectedItems: Array.from(selectedItems),
              timestamp: new Date().toISOString()
            });
            return;
          }

          logService.info('Comparaison des analyses sélectionnées', 'QueueIAAdvanced', {
            selectedItems: Array.from(selectedItems),
            timestamp: new Date().toISOString()
          });

          try {
            // Ouvrir la visualisation multiple pour la comparaison dans l'onglet Visualiseur
            setActivePanel('viewer');
            window.dispatchEvent(new CustomEvent('openMultiplePDFsInViewer', {
              detail: {
                selectedItems: availablePDFsForCompare.map(item => item.itemId),
                analyses: analyses,
                isComparison: true
              }
            }));

            logService.info('Ouverture de la comparaison multiple dans l\'onglet Visualiseur', 'QueueIAAdvanced', {
              selectedItems: availablePDFsForCompare.map(item => item.itemId),
              count: availablePDFsForCompare.length,
              timestamp: new Date().toISOString()
            });

          } catch (error) {
            logService.error('Erreur lors de la comparaison', 'QueueIAAdvanced', {
              selectedItems: Array.from(selectedItems),
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
          break;

        case 'delete':
          for (const itemId of selectedItems) {
            await analysisService.deleteAnalysis(Number(itemId));
          }
          break;

        default:
          logService.warning('Action en lot non reconnue', 'QueueIAAdvanced', {
            action,
            timestamp: new Date().toISOString()
          });
          console.warn(`Action en lot non reconnue: ${action}`);
      }

      setSelectedItems(new Set());

      logService.info('Action en lot terminée', 'QueueIAAdvanced', {
        action,
        success: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logService.error('Erreur lors de l\'action en lot', 'QueueIAAdvanced', {
        action,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('Erreur lors de l\'action bulk:', error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'view': return '#10b981';
      case 'duplicate': return '#3b82f6';
      case 'compare': return '#f59e0b';
      case 'delete': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden" style={{ backgroundColor: colors.background }}>
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
              onClick={() => handleBulkAction('view_multiple')}
              disabled={selectedItems.size === 0}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
                selectedItems.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${selectedItems.size > 0 ? getActionColor('view') : '#6b7280'}`,
                color: selectedItems.size > 0 ? getActionColor('view') : '#6b7280'
              }}
            >
              <EyeIcon className="w-3 h-3 mr-1" />
              Visualiser
            </button>
            <button
              onClick={() => handleBulkAction('duplicate_selected')}
              disabled={selectedItems.size === 0}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
                selectedItems.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${selectedItems.size > 0 ? getActionColor('duplicate') : '#6b7280'}`,
                color: selectedItems.size > 0 ? getActionColor('duplicate') : '#6b7280'
              }}
            >
              <DocumentDuplicateIcon className="w-3 h-3 mr-1" />
              Dupliquer
            </button>
            <button
              onClick={() => handleBulkAction('compare_selected')}
              disabled={selectedItems.size < 2}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
                selectedItems.size < 2 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${selectedItems.size >= 2 ? getActionColor('compare') : '#6b7280'}`,
                color: selectedItems.size >= 2 ? getActionColor('compare') : '#6b7280'
              }}
            >
              <Squares2X2Icon className="w-3 h-3 mr-1" />
              Comparer
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={selectedItems.size === 0}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
                selectedItems.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${selectedItems.size > 0 ? getActionColor('delete') : '#6b7280'}`,
                color: selectedItems.size > 0 ? getActionColor('delete') : '#6b7280'
              }}
            >
              <TrashIcon className="w-3 h-3 mr-1" />
              Supprimer
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              {selectedItems.size} élément(s) sélectionné(s)
            </span>
            {selectedItems.size > 0 && (
              <button
                onClick={() => setSelectedItems(new Set())}
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
        <QueueFilters filters={{ status: filterStatus, search: searchTerm }} onFilterChange={({ status, search }) => {
          setFilterStatus(status);
          setSearchTerm(search);
        }} />
      </div>

      {/* Tableau avec scroll */}
      <div className="flex-1 rounded-lg border min-h-0 overflow-hidden" style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}>
        <div className="h-full overflow-auto table-scrollbar" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.border} ${colors.surface}`,
        }}>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <span style={{ color: colors.textSecondary }}>Chargement des analyses...</span>
              </div>
            </div>
          ) : (
                         <QueueTable
               items={analyses.filter(item => {
                 const matchesStatus = filterStatus === '' || item.status === filterStatus;
                 const matchesSearch = searchTerm === '' || item.file_info?.name?.toLowerCase().includes(searchTerm.toLowerCase());
                 return matchesStatus && matchesSearch;
               })}
               onAction={handleAction}
               selectedItems={Array.from(selectedItems)}
               onSelectionChange={(itemIds) => setSelectedItems(new Set(itemIds))}
               prompts={currentPrompts}
               onPromptChange={handlePromptChange}
               onProviderChange={handleProviderChange}
               localSelections={localSelections}
               textColors={textColors}
             />
          )}
        </div>
      </div>
    </div>
  );
};
