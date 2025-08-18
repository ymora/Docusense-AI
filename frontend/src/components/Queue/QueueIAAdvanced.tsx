
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowPathIcon, TrashIcon, PauseIcon, PlayIcon, XMarkIcon,
  ClockIcon, CheckCircleIcon, ExclamationTriangleIcon,
  CogIcon, FunnelIcon, ArrowsUpDownIcon,
  CpuChipIcon, DocumentIcon, EyeIcon, ArrowDownTrayIcon, ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useQueueStore } from '../../stores/queueStore';
import { useSimpleConfirm } from '../../hooks/useSimpleConfirm';
import { queueService } from '../../services/queueService';
import { pdfService } from '../../services/pdfService';
import { promptService, Prompt } from '../../services/promptService';
import { logService } from '../../services/logService';
import { formatFileSize } from '../../utils/fileUtils';
import { getPriorityColor } from '../../utils/statusUtils';
import { UnifiedTable, TableColumn } from '../UI/UnifiedTable';

// Fonctions utilitaires pour les emojis de statut (spécifiques à ce composant)
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

// Composant pour les boutons d'action modernes
const StatusActionButton: React.FC<{
  action: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
}> = ({ action, onClick, icon, label, variant, disabled = false }) => {
  const { colors } = useColors();
  
  const getVariantStyles = () => {
    switch (variant) {
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
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${getVariantStyles()} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

// Composant pour afficher les informations harmonisées
const QueueItemInfo: React.FC<{ 
  item: any; 
  colors: any; 
  editingItem?: string | null;
  onEditStart?: (itemId: string, provider: string, prompt: string) => void;
  onEditSave?: (itemId: string) => void;
  onEditCancel?: () => void;
  editingProvider?: string;
  editingPrompt?: string;
  onProviderChange?: (provider: string) => void;
  onPromptChange?: (prompt: string) => void;
  availableProviders?: string[];
  availablePrompts?: string[];
}> = ({ 
  item, 
  colors, 
  editingItem,
  onEditStart,
  onEditSave,
  onEditCancel,
  editingProvider,
  editingPrompt,
  onProviderChange,
  onPromptChange,
  availableProviders = [],
  availablePrompts = []
}) => {
  const isEditing = editingItem === item.id;
  
  return (
    <div className="space-y-2">
      {/* Ligne 1: ID */}
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: colors.textSecondary }}>
          ID: <span style={{ color: colors.text, fontFamily: 'monospace' }}>{item.id}</span>
        </span>
      </div>
      
      {/* Ligne 2: Nom du fichier */}
      <div className="flex items-center gap-2">
        <DocumentIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
        <span className="text-sm font-medium truncate" style={{ color: colors.text }}>
          {item.file_info?.name || 'N/A'}
        </span>
      </div>
      
      {/* Ligne 3: Taille et type */}
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: colors.textSecondary }}>
          {item.file_info?.size ? formatFileSize(item.file_info.size) : ''}
        </span>
        <span style={{ color: colors.textSecondary }}>
          {item.file_info?.mime_type || ''}
        </span>
      </div>
      
      {/* Ligne 4: Type d'analyse et fournisseur */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <CpuChipIcon className="w-3 h-3" style={{ color: colors.textSecondary }} />
          <span style={{ color: colors.text }}>
            {item.analysis_type || 'N/A'}
          </span>
        </div>
        <span style={{ color: colors.textSecondary }}>
          {item.analysis_provider || 'N/A'}
        </span>
      </div>
      
      {/* Ligne 5: Date de création */}
      <div className="flex items-center gap-1 text-xs">
        <ClockIcon className="w-3 h-3" style={{ color: colors.textSecondary }} />
        <span style={{ color: colors.textSecondary }}>
          {new Date(item.created_at).toLocaleString('fr-FR')}
        </span>
      </div>
    </div>
  );
};

// Composant pour la sélection d'IA
const AIProviderSelector: React.FC<{
  item: any;
  colors: any;
  selectedProvider: string;
  onProviderChange: (itemId: string, provider: string) => void;
  isEditing: boolean;
}> = ({ item, colors, selectedProvider, onProviderChange, isEditing }) => {
  const availableProviders = [
    { id: 'openai', name: 'OpenAI GPT', description: 'GPT-4, GPT-3.5' },
    { id: 'claude', name: 'Claude', description: 'Claude 3, Claude 2' },
    { id: 'mistral', name: 'Mistral', description: 'Mistral Large, Mixtral' },
    { id: 'ollama', name: 'Ollama', description: 'Modèles locaux' }
  ];
  
  const selectedProviderInfo = availableProviders.find(p => p.id === selectedProvider);
  
  return (
    <div className="relative">
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CpuChipIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
            <span className="text-xs font-medium" style={{ color: colors.text }}>
              Fournisseur IA
            </span>
          </div>
          
          <select
            value={selectedProvider}
            onChange={(e) => onProviderChange(item.id, e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text
            }}
          >
            <option value="">Sélectionner un fournisseur...</option>
            {availableProviders.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          
          {selectedProviderInfo && (
            <div className="text-xs p-2 rounded border" style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.textSecondary 
            }}>
              <div className="font-medium mb-1" style={{ color: colors.text }}>
                {selectedProviderInfo.name}
              </div>
              <div className="text-xs">
                {selectedProviderInfo.description}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CpuChipIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
            <span className="text-xs font-medium" style={{ color: colors.text }}>
              Fournisseur IA
            </span>
          </div>
          
          {selectedProviderInfo ? (
            <div className="text-xs p-2 rounded border" style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border 
            }}>
              <div className="font-medium mb-1" style={{ color: colors.text }}>
                {selectedProviderInfo.name}
              </div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>
                {selectedProviderInfo.description}
              </div>
            </div>
          ) : (
            <div className="text-xs p-2 rounded border" style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.textSecondary 
            }}>
              Aucun fournisseur sélectionné
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Composant pour la sélection de prompts
const PromptSelector: React.FC<{
  item: any;
  colors: any;
  prompts: Prompt[];
  selectedPromptId: string;
  onPromptChange: (itemId: string, promptId: string) => void;
  isEditing: boolean;
}> = ({ item, colors, prompts, selectedPromptId, onPromptChange, isEditing }) => {
  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
  
  return (
    <div className="relative">
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
            <span className="text-xs font-medium" style={{ color: colors.text }}>
              Prompt d'analyse
            </span>
          </div>
          
          <select
            value={selectedPromptId}
            onChange={(e) => onPromptChange(item.id, e.target.value)}
            className="w-full px-2 py-1 text-xs rounded border"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text
            }}
          >
            <option value="">Sélectionner un prompt...</option>
            {prompts.map(prompt => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name} ({prompt.domain})
              </option>
            ))}
          </select>
          
          {selectedPrompt && (
            <div className="text-xs p-2 rounded border" style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.textSecondary 
            }}>
              <div className="font-medium mb-1" style={{ color: colors.text }}>
                {selectedPrompt.name}
              </div>
              <div className="text-xs">
                {selectedPrompt.description}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />
            <span className="text-xs font-medium" style={{ color: colors.text }}>
              Prompt d'analyse
            </span>
          </div>
          
          {selectedPrompt ? (
            <div className="text-xs p-2 rounded border" style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border 
            }}>
              <div className="font-medium mb-1" style={{ color: colors.text }}>
                {selectedPrompt.name}
              </div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>
                {selectedPrompt.description}
              </div>
              <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                Domaine: {selectedPrompt.domain}
              </div>
            </div>
          ) : (
            <div className="text-xs p-2 rounded border" style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.textSecondary 
            }}>
              Aucun prompt sélectionné
            </div>
          )}
        </div>
      )}
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
}

interface QueueFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
}



// Composant de tableau avancé avec tri et sélection
const QueueTable: React.FC<QueueTableProps> = ({ 
  items, 
  onAction, 
  selectedItems, 
  onSelectionChange, 
  prompts,
  onPromptChange,
  onProviderChange
}) => {
  const { colors } = useColors();
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' as 'asc' | 'desc' });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<string>('');
  const [editingPrompt, setEditingPrompt] = useState<string>('');
  
  // États pour les options des menus déroulants
  const [availableProviders, setAvailableProviders] = useState<string[]>(['openai', 'claude', 'mistral', 'ollama']);
  
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
    logService.debug(`Tri de la colonne ${key} en ${direction}`, 'QueueIAAdvanced', { key, direction });
  };
  
  // Fonctions pour la gestion de l'édition
  const handleEditStart = (itemId: string, currentProvider: string, currentPrompt: string) => {
    setEditingItem(itemId);
    setEditingProvider(currentProvider);
    setEditingPrompt(currentPrompt);
  };

  const handleEditSave = (itemId: string) => {
    onAction('update_provider_prompt', itemId);
    setEditingItem(null);
    setEditingProvider('');
    setEditingPrompt('');
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditingProvider('');
    setEditingPrompt('');
  };

  // Fonction pour obtenir l'action principale selon le statut
  const getPrimaryAction = (item: any) => {
    // Vérifier si l'IA et le prompt sont sélectionnés
    const hasProvider = item.selected_provider_id || item.analysis_provider;
    const hasPrompt = item.selected_prompt_id;
    const canStart = hasProvider && hasPrompt;
    
    switch (item.status) {
      case 'pending':
        return {
          action: 'start_analysis',
          onClick: () => onAction('start_analysis', item.id),
          icon: <PlayIcon className="w-4 h-4" />,
          label: canStart ? 'Démarrer' : 'Configurer',
          variant: canStart ? 'success' as const : 'warning' as const,
          disabled: !canStart
        };
        
      case 'processing':
        return {
          action: 'pause_item',
          onClick: () => onAction('pause_item', item.id),
          icon: <PauseIcon className="w-4 h-4" />,
          label: 'Pause',
          variant: 'warning' as const
        };
        
      case 'paused':
        return {
          action: 'retry_item',
          onClick: () => onAction('retry_item', item.id),
          icon: <PlayIcon className="w-4 h-4" />,
          label: 'Reprendre',
          variant: 'success' as const
        };
        
      case 'failed':
        return {
          action: 'retry_item',
          onClick: () => onAction('retry_item', item.id),
          icon: <ArrowPathIcon className="w-4 h-4" />,
          label: 'Relancer',
          variant: 'warning' as const
        };
        
      case 'completed':
        return {
          action: 'view_result',
          onClick: () => onAction('view_result', item.id),
          icon: <EyeIcon className="w-4 h-4" />,
          label: 'Voir',
          variant: 'primary' as const,
          secondaryAction: {
            action: 'generate_pdf',
            onClick: () => onAction('generate_pdf', item.id),
            icon: <ArrowDownTrayIcon className="w-3 h-3" />,
            label: 'PDF',
            variant: 'success' as const
          }
        };
        
      default:
        return null;
    }
  };

  // Fonction pour obtenir l'action secondaire (suppression)
  const getSecondaryAction = (item: any) => {
    return {
      action: 'delete_item',
      onClick: () => onAction('delete_item', item.id),
      icon: <TrashIcon className="w-3 h-3" />,
      label: 'Supprimer',
      variant: 'danger' as const
    };
  };

  // Définition des colonnes pour le tableau unifié
  const columns: TableColumn<any>[] = [
    {
      key: 'info',
      label: 'Informations',
      sortable: false,
      render: (item) => (
        <QueueItemInfo 
          item={item} 
          colors={colors}
          editingItem={editingItem}
          onEditStart={handleEditStart}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
          editingProvider={editingProvider}
          editingPrompt={editingPrompt}
          onProviderChange={setEditingProvider}
          onPromptChange={setEditingPrompt}
          availableProviders={availableProviders}
          availablePrompts={[]}
        />
      )
    },
    {
      key: 'provider',
      label: 'Fournisseur IA',
      sortable: false,
      render: (item) => (
        <AIProviderSelector
          item={item}
          colors={colors}
          selectedProvider={item.selected_provider_id || item.analysis_provider || ''}
          onProviderChange={(itemId, providerId) => onProviderChange(itemId, providerId)}
          isEditing={editingItem === item.id}
        />
      )
    },
    {
      key: 'prompt',
      label: 'Prompt d\'Analyse',
      sortable: false,
      render: (item) => (
        <PromptSelector
          item={item}
          colors={colors}
          prompts={prompts}
          selectedPromptId={item.selected_prompt_id || ''}
          onPromptChange={(itemId, promptId) => onPromptChange(itemId, promptId)}
          isEditing={editingItem === item.id}
        />
      )
    },
    {
      key: 'status',
      label: 'Statut & Actions',
      sortable: true,
      render: (item) => (
        <div className="space-y-3">
          {/* Badge de statut */}
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusColor(item.status)}`}>
              {getStatusIcon(item.status)}
              <span className="capitalize">{item.status}</span>
            </span>
          </div>
          
                    {/* Action principale */}
          <div className="flex flex-col gap-2 items-center">
            {(() => {
              const primaryAction = getPrimaryAction(item);
              const secondaryAction = getSecondaryAction(item);
              const hasProvider = item.selected_provider_id || item.analysis_provider;
              const hasPrompt = item.selected_prompt_id;
              
              return (
                <>
                  {/* Alertes pour éléments manquants */}
                  {item.status === 'pending' && (!hasProvider || !hasPrompt) && (
                    <div className="text-xs p-1 rounded border" style={{
                      backgroundColor: colors.surface,
                      borderColor: '#fbbf24',
                      color: '#92400e'
                    }}>
                      <div className="flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-3 h-3" />
                        <span>Configuration requise</span>
                      </div>
                      {!hasProvider && <div className="text-xs">• Fournisseur IA manquant</div>}
                      {!hasPrompt && <div className="text-xs">• Prompt manquant</div>}
                    </div>
                  )}
                  
                  {primaryAction && (
                    <StatusActionButton
                      action={primaryAction.action}
                      onClick={primaryAction.onClick}
                      icon={primaryAction.icon}
                      label={primaryAction.label}
                      variant={primaryAction.variant}
                      disabled={primaryAction.disabled}
                    />
                  )}
                  
                  {/* Actions secondaires */}
                  <div className="flex gap-1">
                    {/* Action secondaire spéciale (PDF pour completed) */}
                    {primaryAction?.secondaryAction && (
                      <button
                        onClick={primaryAction.secondaryAction.onClick}
                        className="text-xs px-2 py-1 rounded border hover:bg-green-50 hover:border-green-300 transition-colors"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.textSecondary,
                        }}
                        title={primaryAction.secondaryAction.label}
                      >
                        {primaryAction.secondaryAction.icon}
                      </button>
                    )}
                    
                    {/* Bouton de suppression discret */}
                    <button
                      onClick={secondaryAction.onClick}
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
                </>
              );
            })()}
          </div>
          
          {/* Progression si en cours */}
          {item.status === 'processing' && item.progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${item.progress * 100}%` }}
              />
            </div>
          )}
          
          {/* Étape actuelle */}
          {item.current_step && (
            <div className="text-xs text-center" style={{ color: colors.textSecondary }}>
              {item.current_step}
            </div>
          )}
        </div>
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



// Composant de filtres amélioré
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
          onChange={(e) => {
            logService.debug(`Filtre statut changé: ${e.target.value}`, 'QueueIAAdvanced', { status: e.target.value });
            onFilterChange({ ...filters, status: e.target.value });
          }}
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
          value={filters.analysis_type}
          onChange={(e) => {
            logService.debug(`Filtre type d'analyse changé: ${e.target.value}`, 'QueueIAAdvanced', { analysis_type: e.target.value });
            onFilterChange({ ...filters, analysis_type: e.target.value });
          }}
          className="px-2 py-1 rounded text-xs border"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
            minWidth: '120px'
          }}
        >
          <option value="">Tous les types</option>
          <option value="ocr">OCR</option>
          <option value="ai">IA</option>
          <option value="hybrid">Hybride</option>
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

// Composant principal de l'interface queue avancée
export const QueueIAAdvanced: React.FC = () => {
  const { colors } = useColors();
  const { queueItems } = useQueueStore();
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    analysis_type: '',
    search: ''
  });
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  useEffect(() => {
    // Log d'initialisation seulement si pas déjà fait dans cette session
    if (!(window as any).queueIAAdvancedInitialized) {
      logService.debug('QueueIAAdvanced initialisé', 'QueueIAAdvanced');
      (window as any).queueIAAdvancedInitialized = true;
    }
    
    const interval = setInterval(() => {
      // Log seulement toutes les 5 minutes pour éviter le spam
      const now = Date.now();
      if (!(window as any).lastQueueReloadLog || now - (window as any).lastQueueReloadLog > 300000) {
        logService.debug('Rechargement automatique de la queue', 'QueueIAAdvanced');
        (window as any).lastQueueReloadLog = now;
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Charger les prompts au démarrage
  useEffect(() => {
    const loadPrompts = async () => {
      setLoadingPrompts(true);
      try {
        const specializedPrompts = await promptService.getSpecializedPrompts();
        const promptsArray = Object.entries(specializedPrompts).map(([id, prompt]) => ({
          id,
          ...prompt
        }));
        setPrompts(promptsArray);
        logService.debug(`Chargement de ${promptsArray.length} prompts`, 'QueueIAAdvanced');
      } catch (error) {
        // Le service ne devrait plus lancer d'erreur, mais au cas où
        logService.warning('Erreur inattendue lors du chargement des prompts', 'QueueIAAdvanced', { error: error.message });
        console.warn('Erreur inattendue lors du chargement des prompts:', error);
      } finally {
        setLoadingPrompts(false);
      }
    };

    loadPrompts();
  }, []);
  
  const { simpleDelete, simpleAction } = useSimpleConfirm();

  // Gérer le changement de prompt pour un élément de queue
  const handlePromptChange = async (itemId: string, promptId: string) => {
    try {
      const item = queueItems.find(q => q.id.toString() === itemId);
      const itemName = item?.file_info?.name || `ID: ${itemId}`;
      
      logService.debug(`Changement de prompt pour ${itemName}`, 'QueueIAAdvanced', { itemId, promptId, itemName });
      
      // TODO: Implémenter la mise à jour du prompt dans la base de données
      // Pour l'instant, on log juste le changement
      console.log(`Prompt changé pour l'élément ${itemId}: ${promptId}`);
      
    } catch (error) {
      logService.error(`Erreur lors du changement de prompt`, 'QueueIAAdvanced', { itemId, promptId, error: error.message });
      console.error('Erreur lors du changement de prompt:', error);
    }
  };

  // Gérer le changement de fournisseur IA pour un élément de queue
  const handleProviderChange = async (itemId: string, providerId: string) => {
    try {
      const item = queueItems.find(q => q.id.toString() === itemId);
      const itemName = item?.file_info?.name || `ID: ${itemId}`;
      
      logService.debug(`Changement de fournisseur IA pour ${itemName}`, 'QueueIAAdvanced', { itemId, providerId, itemName });
      
      // TODO: Implémenter la mise à jour du fournisseur dans la base de données
      // Pour l'instant, on log juste le changement
      console.log(`Fournisseur IA changé pour l'élément ${itemId}: ${providerId}`);
      
    } catch (error) {
      logService.error(`Erreur lors du changement de fournisseur IA`, 'QueueIAAdvanced', { itemId, providerId, error: error.message });
      console.error('Erreur lors du changement de fournisseur IA:', error);
    }
  };

  const handleAction = async (action: string, itemId: string, additionalData?: any) => {
    try {
      // Trouver l'item pour le logging
      const item = queueItems.find(q => q.id.toString() === itemId);
      const itemName = item?.file_info?.name || `ID: ${itemId}`;
      
      logService.debug(`Action ${action} sur ${itemName}`, 'QueueIAAdvanced', { action, itemId, itemName });
      
      switch (action) {
        case 'view_details':
          logService.debug('Ouverture des détails', 'QueueIAAdvanced', { itemId, itemName });
          // Ouvrir modal de détails
          break;
        case 'change_priority':
          logService.debug('Changement de priorité', 'QueueIAAdvanced', { itemId, itemName });
          // Ouvrir modal de changement de priorité
          break;
        case 'update_provider_prompt':
          if (additionalData && additionalData.provider && additionalData.prompt) {
            logService.debug('Mise à jour du fournisseur et du prompt', 'QueueIAAdvanced', { 
              itemId, 
              itemName, 
              provider: additionalData.provider, 
              prompt: additionalData.prompt 
            });
            // Appeler le service pour mettre à jour l'analyse
            await queueService.updateAnalysisProviderAndPrompt(itemId, additionalData.provider, additionalData.prompt);
            logService.info('Fournisseur et prompt mis à jour', 'QueueIAAdvanced', { itemId, itemName });
          }
          break;
        case 'retry_item':
          await queueService.retryQueueItem(parseInt(itemId));
          logService.info('Analyse relancée', 'QueueIAAdvanced', { itemId, itemName });
          break;
        case 'view_result':
          logService.debug('Ouverture du résultat', 'QueueIAAdvanced', { itemId, itemName });
          // Ouvrir modal ou naviguer vers la page de résultat
          // TODO: Implémenter l'ouverture du résultat
          break;
        case 'generate_pdf':
          await pdfService.generateAnalysisPDF(parseInt(itemId));
          logService.info('PDF généré', 'QueueIAAdvanced', { itemId, itemName });
          break;
        case 'delete_item':
          // Utiliser notre nouveau système de confirmation
          simpleDelete(
            `l'analyse "${itemName}"`,
            async () => {
              await queueService.deleteQueueItem(parseInt(itemId));
              logService.info('Analyse supprimée', 'QueueIAAdvanced', { itemId, itemName });

            }
          );
          return; // Ne pas continuer car la confirmation est asynchrone
        case 'start_analysis':
          // Vérifier que l'IA et le prompt sont sélectionnés
          const hasProvider = (item as any).selected_provider_id || item.analysis_provider;
          const hasPrompt = (item as any).selected_prompt_id;
          
          if (!hasProvider || !hasPrompt) {
            logService.warning('Impossible de démarrer l\'analyse - IA ou prompt manquant', 'QueueIAAdvanced', { 
              itemId, 
              itemName, 
              hasProvider, 
              hasPrompt 
            });
            // TODO: Afficher un message d'erreur à l'utilisateur
            return;
          }
          
          logService.debug('Démarrage de l\'analyse', 'QueueIAAdvanced', { itemId, itemName, provider: hasProvider, prompt: hasPrompt });
          // Implémenter le démarrage
          break;
        case 'pause_item':
          logService.debug('Mise en pause de l\'analyse', 'QueueIAAdvanced', { itemId, itemName });
          // Implémenter la pause
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
        // Utiliser notre nouveau système de confirmation
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
        return; // Ne pas continuer car la confirmation est asynchrone
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
         Gestion avancée de la queue d'analyses avec tableaux, filtres et actions
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
                prompts={prompts}
                onPromptChange={handlePromptChange}
                onProviderChange={handleProviderChange}
              />
           )}
         </div>
       </div>
     </div>
   </div>
 );
};

export default QueueIAAdvanced;
