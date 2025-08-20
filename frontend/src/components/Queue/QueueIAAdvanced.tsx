import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowPathIcon, TrashIcon, PauseIcon, PlayIcon, XMarkIcon,
  ClockIcon,
  CogIcon, FunnelIcon,
  CpuChipIcon, DocumentIcon, EyeIcon, ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon, Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useTypography } from '../../hooks/useTypography';
import { useQueueStore } from '../../stores/queueStore';
import { usePromptStore } from '../../stores/promptStore';
import { useConfigStore } from '../../stores/configStore';
import { useSimpleConfirm } from '../../hooks/useSimpleConfirm';
import { queueService } from '../../services/queueService';
import { pdfService } from '../../services/pdfService';
import { logService } from '../../services/logService';
import { analysisService } from '../../services/analysisService';
import { formatFileSize } from '../../utils/fileUtils';
import { UnifiedTable, TableColumn } from '../UI/UnifiedTable';
import { Prompt } from '../../services/promptService';
import { useUIStore } from '../../stores/uiStore';
import { 
  getStatusColor, 
  getFileTypeColor, 
  getFileTypeBackgroundColor,
  getActionColor,
  getStatusBackgroundColor,
  AVAILABILITY_COLORS
} from '../../utils/colorConstants';



// Composant pour afficher les informations du fichier (compact)
const FileInfo: React.FC<{ 
  item: any; 
  colors: any; 
  textColors: any;
}> = ({ 
  item, 
  colors,
  textColors
}) => {
  return (
    <div className="space-y-1">
      {/* Nom du fichier */}
      <div className="flex items-center gap-2">
        <DocumentIcon className="w-4 h-4" style={{ color: textColors.secondary }} />
        <span className="text-sm font-medium truncate" style={{ color: textColors.primary }}>
          {item.file_info?.name || 'N/A'}
        </span>
      </div>
      
      {/* Taille et type */}
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: textColors.secondary }}>
          {item.file_info?.size ? formatFileSize(item.file_info.size) : ''}
        </span>
        <span style={{ color: textColors.secondary }}>
          {item.file_info?.mime_type || ''}
        </span>
      </div>
      
      {/* Date de création */}
      <div className="flex items-center gap-1 text-xs">
        <ClockIcon className="w-3 h-3" style={{ color: textColors.secondary }} />
        <span style={{ color: textColors.secondary }}>
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
        color: getFileTypeColor('image'),
        bgColor: getFileTypeBackgroundColor('image'),
      };
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(fileExtension)) {
      return {
        label: 'Vidéo',
        color: getFileTypeColor('video'),
        bgColor: getFileTypeBackgroundColor('video'),
      };
    } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(fileExtension)) {
      return {
        label: 'Audio',
        color: getFileTypeColor('audio'),
        bgColor: getFileTypeBackgroundColor('audio'),
      };
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(fileExtension)) {
      return {
        label: 'Document',
        color: getFileTypeColor('document'),
        bgColor: getFileTypeBackgroundColor('document'),
      };
    } else {
      return {
        label: 'Texte',
        color: getFileTypeColor('text'),
        bgColor: getFileTypeBackgroundColor('text'),
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
  textColors: any;
  prompts: Prompt[];
  onProviderChange: (itemId: string, provider: string) => void;
  onPromptChange: (itemId: string, promptId: string) => void;
  localSelections: { [itemId: string]: { provider?: string; prompt?: string } };
}> = ({ item, colors, textColors, prompts, onProviderChange, onPromptChange, localSelections }) => {
  const { getAIProviders } = useConfigStore();
  const allAIProviders = getAIProviders();
  
  // Fonction pour organiser les providers avec séparateurs (comme dans la configuration)
  const getOrganizedProviders = () => {
    const localProviders = allAIProviders.filter(provider => 
      provider.name.toLowerCase() === 'ollama'
    ).sort((a, b) => a.name.localeCompare(b.name));
    
    const webProviders = allAIProviders.filter(provider => 
      provider.name.toLowerCase() !== 'ollama'
    ).sort((a, b) => a.name.localeCompare(b.name));
    
    const organizedProviders: Array<{
      id: string;
      name: string;
      available: boolean;
      type: 'local' | 'web' | 'separator';
    }> = [];
    
    // Ajouter les providers locaux
    if (localProviders.length > 0) {
      organizedProviders.push({
        id: 'separator-local',
        name: '────────── IA Locale ──────────',
        available: false,
        type: 'separator'
      });
      
      localProviders.forEach(provider => {
        organizedProviders.push({
          id: provider.name,
          name: getProviderDisplayName(provider.name),
          available: provider.is_active && provider.is_functional,
          type: 'local'
        });
      });
    }
    
    // Ajouter les providers web
    if (webProviders.length > 0) {
      if (localProviders.length > 0) {
        organizedProviders.push({
          id: 'separator-web',
          name: '────────── IA Web ──────────',
          available: false,
          type: 'separator'
        });
      }
      
      webProviders.forEach(provider => {
        organizedProviders.push({
          id: provider.name,
          name: getProviderDisplayName(provider.name),
          available: provider.is_active && provider.is_functional,
          type: 'web'
        });
      });
    }
    
    return organizedProviders;
  };
  
  // Créer la liste complète avec statut de disponibilité basé sur la configuration réelle
  // Utiliser tous les providers de la configuration IA, pas seulement les fonctionnels
  const allProvidersWithStatus = getOrganizedProviders();
  
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
   }
   
   // Si aucun prompt n'est sélectionné, sélectionner automatiquement un prompt adapté au type de fichier
   if (!selectedPromptId) {
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
     
     // Chercher d'abord un prompt spécifique au domaine
     let defaultPrompt = prompts.find(p => (p.domain || 'GENERAL').toUpperCase() === defaultDomain);
     
     // Si aucun prompt spécifique n'est trouvé, chercher un prompt "Résumé général"
     if (!defaultPrompt) {
       defaultPrompt = prompts.find(p => p.name.toLowerCase().includes('résumé général') || p.name.toLowerCase().includes('resume general'));
     }
     
     // Si toujours aucun prompt trouvé, prendre le premier prompt disponible
     if (!defaultPrompt && prompts.length > 0) {
       defaultPrompt = prompts[0];
     }
     
     if (defaultPrompt) {
       selectedPromptId = defaultPrompt.id;
       // Mettre à jour automatiquement la sélection locale
       onPromptChange(item.id, defaultPrompt.id);
       
       console.log(`🔍 Prompt automatique sélectionné pour ${fileName}:`, {
         fileExtension,
         defaultDomain,
         selectedPrompt: defaultPrompt.name,
         promptId: defaultPrompt.id
       });
     }
   }
  

  

  

  

  
  return (
    <div className="space-y-2">
      {/* Fournisseur IA */}
      <div className="flex items-center gap-2">
        <CpuChipIcon className="w-4 h-4" style={{ color: textColors.secondary }} />
                 <select
           value={selectedProvider}
           onChange={(e) => onProviderChange(item.id, e.target.value)}
           className="flex-1 px-2 py-1 text-xs rounded border"
           style={{
             backgroundColor: colors.background,
             borderColor: colors.border,
             color: textColors.primary
           }}
         >
                       {allProvidersWithStatus.map(provider => {
              if (provider.type === 'separator') {
                return (
                  <option 
                    key={provider.id} 
                    value=""
                    disabled
                    style={{
                      color: '#6b7280',
                      fontStyle: 'italic',
                      backgroundColor: '#f3f4f6'
                    }}
                  >
                    {provider.name}
                  </option>
                );
              }
              
              return (
                <option 
                  key={provider.id} 
                  value={provider.id}
                  style={{
                    color: provider.available ? AVAILABILITY_COLORS.available : AVAILABILITY_COLORS.unavailable
                  }}
                >
                  {provider.name}
                </option>
              );
            })}
         </select>
         {selectedProvider && (
           <span className="text-xs text-gray-500">
             {selectedProvider === item.analysis_provider ? '(défaut)' : '(modifié)'}
           </span>
         )}
      </div>
      
      {/* Prompt */}
      <div className="flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="w-4 h-4" style={{ color: textColors.secondary }} />
                 <select
           value={selectedPromptId}
           onChange={(e) => onPromptChange(item.id, e.target.value)}
           className="flex-1 px-2 py-1 text-xs rounded border"
           style={{
             backgroundColor: colors.background,
             borderColor: colors.border,
             color: textColors.primary
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

              // Créer une liste plate avec séparateurs
              const organizedPrompts: Array<{
                id: string;
                name: string;
                type: 'separator' | 'prompt';
              }> = [];

              sortedDomains.forEach(domain => {
                // Ajouter le séparateur
                organizedPrompts.push({
                  id: `separator-${domain}`,
                  name: `────────── ${domain.toUpperCase()} ──────────`,
                  type: 'separator'
                });

                // Ajouter les prompts du domaine
                groupedPrompts[domain].forEach(prompt => {
                  organizedPrompts.push({
                    id: prompt.id,
                    name: prompt.name,
                    type: 'prompt'
                  });
                });
              });

              return organizedPrompts.map(item => {
                if (item.type === 'separator') {
                  return (
                    <option 
                      key={item.id} 
                      value=""
                      disabled
                      style={{
                        color: '#6b7280',
                        fontStyle: 'italic',
                        backgroundColor: '#f3f4f6'
                      }}
                    >
                      {item.name}
                    </option>
                  );
                }

                return (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                );
              });
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
          color: getStatusColor('pending'),
          bgColor: getStatusBackgroundColor('pending')
        };
      case 'processing':
        return {
          label: 'En cours',
          color: getStatusColor('processing'),
          bgColor: getStatusBackgroundColor('processing')
        };
      case 'completed':
        return {
          label: 'Terminé',
          color: getStatusColor('completed'),
          bgColor: getStatusBackgroundColor('completed')
        };
      case 'failed':
        return {
          label: 'Échoué',
          color: getStatusColor('failed'),
          bgColor: getStatusBackgroundColor('failed')
        };
      case 'paused':
        return {
          label: 'En pause',
          color: getStatusColor('paused'),
          bgColor: getStatusBackgroundColor('paused')
        };
      default:
        return {
          label: 'Inconnu',
          color: colors.textSecondary,
          bgColor: getStatusBackgroundColor('unsupported')
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
  selectedItems: string[];
}> = ({ item, onAction, colors, localSelections, selectedItems }) => {
  const isAnalysisCompleted = item.status === 'completed';
  const isAnalysisProcessing = item.status === 'processing';
  const isAnalysisFailed = item.status === 'failed';
  const isAnalysisPending = item.status === 'pending';
  const isAnalysisPaused = item.status === 'paused';

  const localSelection = localSelections[item.id] || {};
  const hasProvider = localSelection.provider !== undefined ? localSelection.provider : item.analysis_provider;
  const hasPrompt = localSelection.prompt !== undefined ? localSelection.prompt : (item as any).analysis_prompt;
  
  // Validation plus stricte : s'assurer qu'un prompt approprié est sélectionné (pas un prompt GENERAL)
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
          console.error('Erreur lors de la vérification du PDF:', error);
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
      action: 'view_file', 
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
       action: 'duplicate_item', icon: <DocumentDuplicateIcon className="w-4 h-4" />, variant: 'warning', disabled: false, tooltip: 'Dupliquer l\'analyse' // Always active
     },
           compare: {
        action: 'compare_item', 
        icon: <Squares2X2Icon className="w-4 h-4" />, 
        variant: 'info', 
        disabled: selectedItems.length < 2 || !selectedItems.includes(item.id.toString()), 
        tooltip: selectedItems.length < 2 ? 'Comparer avec d\'autres analyses (sélectionnez au moins 2 analyses)' : 
               !selectedItems.includes(item.id.toString()) ? 'Comparer avec d\'autres analyses (cet élément doit être sélectionné)' :
               'Comparer avec d\'autres analyses'
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
      const missingItems = [];
      if (!hasProvider) missingItems.push('IA');
      if (!hasValidPrompt) missingItems.push('prompt adapté');
      
      const tooltip = missingItems.length > 0 
        ? `Sélectionner ${missingItems.join(' et ')} pour démarrer`
        : 'Configurer l\'IA et le prompt pour démarrer';
        
      actionConfig.main = { action: '', icon: <PlayIcon className="w-4 h-4" />, variant: 'primary', disabled: true, tooltip };
    }
  } else if (isAnalysisProcessing) {
    actionConfig.main = { action: 'pause_item', icon: <PauseIcon className="w-4 h-4" />, variant: 'warning', disabled: false, tooltip: 'Mettre en pause l\'analyse' };
  } else if (isAnalysisPaused) {
    actionConfig.main = { action: 'start_analysis', icon: <PlayIcon className="w-4 h-4" />, variant: 'success', disabled: false, tooltip: 'Reprendre l\'analyse' };
  } else if (isAnalysisCompleted) {
    actionConfig.main = { action: 'retry_analysis', icon: <ArrowPathIcon className="w-4 h-4" />, variant: 'primary', disabled: false, tooltip: 'Relancer l\'analyse' };
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
        className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.main.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
                 style={{
           backgroundColor: 'transparent',
           border: `1px solid ${actionConfig.main.disabled ? '#6b7280' : actionConfig.main.variant === 'success' ? getActionColor('start') : actionConfig.main.variant === 'warning' ? getActionColor('pause') : actionConfig.main.variant === 'primary' ? getActionColor('retry') : '#6b7280'}`,
           color: actionConfig.main.disabled ? '#6b7280' : actionConfig.main.variant === 'success' ? getActionColor('start') : actionConfig.main.variant === 'warning' ? getActionColor('pause') : actionConfig.main.variant === 'primary' ? getActionColor('retry') : '#6b7280',
           minHeight: '24px'
         }}
        title={actionConfig.main.tooltip || 'Action principale'}
      >
        {actionConfig.main.icon || <div className="w-4 h-4" />}
      </button>

      {/* Bouton de visualisation - toujours visible */}
      <button
        onClick={() => onAction(actionConfig.view.action, item.id)}
        disabled={actionConfig.view.disabled}
        className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
          actionConfig.view.disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
                 style={{
           backgroundColor: 'transparent',
           border: `1px solid ${actionConfig.view.disabled ? '#6b7280' : getActionColor('view')}`,
           color: actionConfig.view.disabled ? '#6b7280' : getActionColor('view'),
           minHeight: '24px'
         }}
        title={actionConfig.view.tooltip}
      >
        {actionConfig.view.icon}
      </button>

             {/* Bouton de duplication - toujours visible et actif */}
       <button
         onClick={() => onAction(actionConfig.duplicate.action, item.id)}
         disabled={actionConfig.duplicate.disabled}
         className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
           actionConfig.duplicate.disabled ? 'opacity-50 cursor-not-allowed' : ''
         }`}
                   style={{
            backgroundColor: 'transparent',
            border: `1px solid ${actionConfig.duplicate.disabled ? '#6b7280' : getActionColor('duplicate')}`,
            color: actionConfig.duplicate.disabled ? '#6b7280' : getActionColor('duplicate'),
            minHeight: '24px'
          }}
         title={actionConfig.duplicate.tooltip}
       >
         {actionConfig.duplicate.icon}
       </button>

       {/* Bouton de comparaison - toujours visible et actif */}
       <button
         onClick={() => onAction(actionConfig.compare.action, item.id)}
         disabled={actionConfig.compare.disabled}
         className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
           actionConfig.compare.disabled ? 'opacity-50 cursor-not-allowed' : ''
         }`}
                   style={{
            backgroundColor: 'transparent',
            border: `1px solid ${actionConfig.compare.disabled ? '#6b7280' : getActionColor('compare')}`,
            color: actionConfig.compare.disabled ? '#6b7280' : getActionColor('compare'),
            minHeight: '24px'
          }}
         title={actionConfig.compare.tooltip}
       >
         {actionConfig.compare.icon}
       </button>

       {/* Bouton de suppression - toujours visible et actif */}
       <button
         onClick={() => onAction(actionConfig.delete.action, item.id)}
         disabled={actionConfig.delete.disabled}
         className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
           actionConfig.delete.disabled ? 'opacity-50 cursor-not-allowed' : ''
         }`}
                   style={{
            backgroundColor: 'transparent',
            border: `1px solid ${actionConfig.delete.disabled ? '#6b7280' : getActionColor('delete')}`,
            color: actionConfig.delete.disabled ? '#6b7280' : getActionColor('delete'),
            minHeight: '24px'
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
  textColors: any;
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
          <option value="paused">En pause</option>
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
          onClick={() => onFilterChange({ status: 'all', file_type: '', search: '' })}
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
  const { queueItems, startRealtimeUpdates, stopRealtimeUpdates } = useQueueStore();
  const { prompts, loading: loadingPrompts, loadPrompts } = usePromptStore();
  const { aiProviders, loadAIProviders, refreshAIProviders, isInitialized: configInitialized } = useConfigStore();
  const { setActivePanel } = useUIStore();
  
  const currentPrompts = prompts;
  
  // OPTIMISATION: États locaux simplifiés
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // OPTIMISATION: Chargement initial et SSE
  useEffect(() => {
    const initializeQueue = async () => {
      try {
        logService.info('Initialisation de la queue', 'QueueIAAdvanced', {
          timestamp: new Date().toISOString()
        });
        
        // Charger les données initiales
        await Promise.all([
          loadPrompts(),
          loadAIProviders()
        ]);
        
        // Démarrer les mises à jour temps réel
        startRealtimeUpdates();
        
        logService.info('Queue initialisée avec succès', 'QueueIAAdvanced', {
          promptsCount: currentPrompts.length,
          providersCount: aiProviders.length,
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

    // Nettoyage à la destruction du composant
    return () => {
      logService.debug('Nettoyage de la queue', 'QueueIAAdvanced', {
        timestamp: new Date().toISOString()
      });
      stopRealtimeUpdates();
    };
  }, []);

  // OPTIMISATION: Suppression des useEffect redondants
  // Plus besoin de recharger manuellement après chaque action

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
          // Toujours initialiser les sélections, même si aucune n'existe en base
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
            provider: item.analysis_provider || undefined,
            prompt: promptId
          };
          hasChanges = true;
          }
        });
        
        return hasChanges ? updatedSelections : prev;
      });
    }
  }, [queueItems, currentPrompts, configInitialized]);
  
     const { simpleDelete, simpleAction } = useSimpleConfirm();

   // Fonction pour vérifier les PDFs des éléments sélectionnés
   const checkPDFsForSelectedItems = React.useCallback(async (items: string[]) => {
     const pdfStatus: { [itemId: string]: boolean } = {};
     
     for (const itemId of items) {
       try {
         const hasPDF = await pdfService.hasPDF(parseInt(itemId));
         pdfStatus[itemId] = hasPDF;
       } catch (error) {
         pdfStatus[itemId] = false;
       }
     }
     
     return pdfStatus;
   }, []);

   // Vérifier les PDFs quand la sélection change
   React.useEffect(() => {
     if (selectedItems.size > 0) {
       checkPDFsForSelectedItems(Array.from(selectedItems));
     } else {
       // setItemsWithPDFs({}); // This state is no longer needed
     }
   }, [selectedItems, checkPDFsForSelectedItems]);

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

  const handleAction = async (action: string, itemId: string | number) => {
    const item = queueItems.find(q => q.id.toString() === itemId.toString());
    
    if (!item) {
      logService.error('Élément non trouvé pour action', 'QueueIAAdvanced', {
        itemId,
        action,
        availableItems: queueItems.map(i => i.id),
        timestamp: new Date().toISOString()
      });
      console.error(`❌ Élément avec ID ${itemId} non trouvé dans queueItems:`, queueItems);
      return;
    }

    logService.info('Action sur élément de queue', 'QueueIAAdvanced', {
      action,
      itemId,
      itemName: item.file_info?.name,
      itemStatus: item.status,
      isLocal: item.is_local,
      timestamp: new Date().toISOString()
    });

    try {
      setLoading(true);

      switch (action) {
        case 'start_analysis':
          if (item.is_local) {
            logService.info('Conversion locale → backend', 'QueueIAAdvanced', {
              itemId,
              fileName: item.file_info?.name,
              timestamp: new Date().toISOString()
            });
            await convertLocalToBackend(item);
          } else {
            logService.info('Redémarrage d\'analyse existante', 'QueueIAAdvanced', {
              itemId,
              fileName: item.file_info?.name,
              timestamp: new Date().toISOString()
            });
            await queueService.startQueueProcessing();
          }
          break;

        case 'duplicate_item':
          logService.info('Duplication d\'élément', 'QueueIAAdvanced', {
            itemId,
            fileName: item.file_info?.name,
            timestamp: new Date().toISOString()
          });
          await queueService.duplicateQueueItem(item.id);
          break;

        case 'delete_item':
          logService.info('Suppression d\'élément', 'QueueIAAdvanced', {
            itemId,
            fileName: item.file_info?.name,
            timestamp: new Date().toISOString()
          });
          await queueService.deleteQueueItem(item.id);
          break;

        case 'retry_item':
          logService.info('Nouvelle tentative d\'élément', 'QueueIAAdvanced', {
            itemId,
            fileName: item.file_info?.name,
            timestamp: new Date().toISOString()
          });
          await queueService.retryQueueItem(item.id);
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

  // OPTIMISATION: Conversion locale → backend simplifiée
  const convertLocalToBackend = async (localItem: any) => {
    logService.info('Début conversion locale → backend', 'QueueIAAdvanced', {
      fileName: localItem.file_info?.name,
      filePath: localItem.file_info?.path,
      provider: localItem.analysis_provider,
      prompt: localItem.prompt,
      timestamp: new Date().toISOString()
    });

    try {
      // Créer l'analyse backend
      const analysisResponse = await analysisService.createPendingAnalysis({
        file_path: localItem.file_info.path,
        prompt_id: localItem.prompt || 'auto',
        analysis_type: localItem.analysis_type || 'general',
        custom_prompt: '',
        provider: localItem.analysis_provider || 'ollama',
        model: localItem.analysis_model || 'llama2'
      });

      if (analysisResponse && analysisResponse.analysis_id) {
        // Ajouter à la queue backend
        await queueService.addToQueue(analysisResponse.analysis_id);
        
        // Démarrer le traitement
        await queueService.startQueueProcessing();
        
        logService.info('Conversion locale → backend réussie', 'QueueIAAdvanced', {
          fileName: localItem.file_info?.name,
          analysisId: analysisResponse.analysis_id,
          timestamp: new Date().toISOString()
        });
        
        console.log('✅ Élément local converti en backend:', analysisResponse.analysis_id);
      }
    } catch (error) {
      logService.error('Erreur conversion locale → backend', 'QueueIAAdvanced', {
        fileName: localItem.file_info?.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('❌ Erreur conversion locale → backend:', error);
      throw error;
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
      logService.debug(`Action bulk ${action} sur ${selectedItems.size} éléments`, 'QueueIAAdvanced', { action, selectedItems: Array.from(selectedItems) });
      
      switch (action) {
        case 'start_selected':
          logService.info('Démarrage d\'analyses sélectionnées', 'QueueIAAdvanced', {
            count: selectedItems.size,
            selectedItems: Array.from(selectedItems),
            timestamp: new Date().toISOString()
          });
          
          // Traiter chaque élément sélectionné
          for (const itemId of Array.from(selectedItems)) {
            try {
              const item = queueItems.find(q => q.id.toString() === itemId.toString());
              if (item) {
                if (item.is_local) {
                  await convertLocalToBackend(item);
                } else {
                  logService.debug('Redémarrage d\'analyse existante', 'QueueIAAdvanced', {
                    itemId,
                    fileName: item.file_info?.name,
                    timestamp: new Date().toISOString()
                  });
                }
              }
            } catch (error) {
              logService.error('Erreur lors du démarrage d\'analyse', 'QueueIAAdvanced', {
                itemId,
                error: error.message,
                timestamp: new Date().toISOString()
              });
            }
          }
          
          // Démarrer le traitement de la queue
          await queueService.startQueueProcessing();
          logService.info('Démarrage d\'analyses terminé', 'QueueIAAdvanced', {
            count: selectedItems.size,
            timestamp: new Date().toISOString()
          });
          break;

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
              queueItems: queueItems,
              isComparison: false
            }
          }));
          break;

        case 'duplicate_selected':
          logService.info('Début de la duplication multiple', 'QueueIAAdvanced', { 
            selectedItems: Array.from(selectedItems), 
            count: selectedItems.size,
            queueItemsCount: queueItems.length,
            timestamp: new Date().toISOString()
          });
          
          let successCount = 0;
          let errorCount = 0;
          
          // Traiter chaque duplication comme un ajout simple
          for (const itemId of Array.from(selectedItems)) {
            let item: any = null;
            try {
              item = queueItems.find(q => q.id.toString() === itemId.toString());
              
              if (item) {
                logService.debug('Duplication d\'élément', 'QueueIAAdvanced', {
                  itemId,
                  fileName: item.file_info?.name,
                  timestamp: new Date().toISOString()
                });
                
                await queueService.duplicateQueueItem(item.id);
                successCount++;
                
                // Pas besoin de rafraîchir - SSE s'en charge
                console.log(`✅ Élément dupliqué`);
                
              } else {
                logService.warning('Élément non trouvé pour duplication', 'QueueIAAdvanced', {
                  itemId,
                  timestamp: new Date().toISOString()
                });
                errorCount++;
              }
            } catch (error) {
              logService.error('Erreur lors de la duplication', 'QueueIAAdvanced', { 
                itemId, 
                fileName: item?.file_info?.name,
                error: error.message,
                timestamp: new Date().toISOString()
              });
              errorCount++;
            }
          }
          
          const summary = {
            total: selectedItems.size,
            success: successCount,
            error: errorCount
          };
          
          logService.info('Duplication multiple terminée', 'QueueIAAdvanced', {
            ...summary,
            timestamp: new Date().toISOString()
          });
          
          // Afficher un message à l'utilisateur
          if (successCount > 0) {
            console.log(`✅ ${successCount} analyse(s) dupliquée(s) avec succès`);
          }
          if (errorCount > 0) {
            console.log(`❌ ${errorCount} erreur(s) lors de la duplication`);
          }
          break;

        case 'delete_selected':
          logService.info('Suppression multiple d\'éléments', 'QueueIAAdvanced', {
            count: selectedItems.size,
            selectedItems: Array.from(selectedItems),
            timestamp: new Date().toISOString()
          });
          
          // Supprimer toutes les analyses sélectionnées
          for (const itemId of Array.from(selectedItems)) {
            try {
              await queueService.deleteQueueItem(parseInt(itemId));
              logService.debug('Analyse supprimée', 'QueueIAAdvanced', { 
                itemId,
                timestamp: new Date().toISOString()
              });
            } catch (error) {
              logService.error('Erreur lors de la suppression', 'QueueIAAdvanced', { 
                itemId, 
                error: error.message,
                timestamp: new Date().toISOString()
              });
            }
          }
          // Pas besoin de rafraîchir - SSE s'en charge
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
                queueItems: queueItems,
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

        case 'clear_completed':
          logService.info('Nettoyage des analyses terminées', 'QueueIAAdvanced', {
            timestamp: new Date().toISOString()
          });
          
          await simpleAction(
            'supprimer toutes les analyses terminées',
            'les analyses terminées',
            async () => {
              try {
                await queueService.clearQueue();
                logService.info('Analyses terminées supprimées', 'QueueIAAdvanced', {
                  timestamp: new Date().toISOString()
                });
                setSelectedItems(new Set());
              } catch (error) {
                logService.error('Erreur lors du nettoyage', 'QueueIAAdvanced', {
                  error: error.message,
                  timestamp: new Date().toISOString()
                });
              }
            },
            undefined,
            'danger'
          );
          break;

        default:
          logService.warning('Action en lot non reconnue', 'QueueIAAdvanced', {
            action,
            timestamp: new Date().toISOString()
          });
          console.warn(`Action en lot non reconnue: ${action}`);
      }
      
      if (action !== 'clear_completed') {
        setSelectedItems(new Set());
      }
      
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
                 disabled={selectedItems.size === 0 || Array.from(selectedItems).every(itemId => !pdfService.hasPDF(parseInt(itemId)).then(hasPDF => hasPDF))}
                 className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
                   selectedItems.size === 0 || Array.from(selectedItems).every(itemId => !pdfService.hasPDF(parseInt(itemId)).then(hasPDF => hasPDF)) ? 'opacity-50 cursor-not-allowed' : ''
                 }`}
                                   style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${selectedItems.size > 0 && Array.from(selectedItems).some(itemId => pdfService.hasPDF(parseInt(itemId)).then(hasPDF => hasPDF)) ? getActionColor('view') : '#6b7280'}`,
                    color: selectedItems.size > 0 && Array.from(selectedItems).some(itemId => pdfService.hasPDF(parseInt(itemId)).then(hasPDF => hasPDF)) ? getActionColor('view') : '#6b7280'
                  }}
               >
                 <EyeIcon className="w-3 h-3 mr-1" />
                 Visualiser
               </button>
                                <button
                  onClick={() => handleBulkAction('duplicate_selected')}
                  // disabled={selectedItems.size === 0 || isDuplicating} // This state is no longer needed
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
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
                 disabled={selectedItems.size < 2 || Array.from(selectedItems).every(itemId => !pdfService.hasPDF(parseInt(itemId)).then(hasPDF => hasPDF))}
                 className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
                   selectedItems.size < 2 || Array.from(selectedItems).every(itemId => !pdfService.hasPDF(parseInt(itemId)).then(hasPDF => hasPDF)) ? 'opacity-50 cursor-not-allowed' : ''
                 }`}
                                   style={{
                    backgroundColor: 'transparent',
                    border: `1px solid ${selectedItems.size >= 2 && Array.from(selectedItems).some(itemId => pdfService.hasPDF(parseInt(itemId)).then(hasPDF => hasPDF)) ? getActionColor('compare') : '#6b7280'}`,
                    color: selectedItems.size >= 2 && Array.from(selectedItems).some(itemId => pdfService.hasPDF(parseInt(itemId)).then(hasPDF => hasPDF)) ? getActionColor('compare') : '#6b7280'
                  }}
               >
                 <Squares2X2Icon className="w-3 h-3 mr-1" />
                 Comparer
               </button>
               <button
                 onClick={() => handleBulkAction('delete_selected')}
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
          <QueueFilters filters={{ status: filterStatus, file_type: '', search: searchTerm }} onFilterChange={({ status, file_type, search }) => {
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
                  items={queueItems.filter(item => {
                    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
                    const matchesFileType = true; // File type filtering is removed from UI
                    const matchesSearch = searchTerm === '' || item.file_info?.name?.toLowerCase().includes(searchTerm.toLowerCase());
                    return matchesStatus && matchesFileType && matchesSearch;
                  })}
                  onAction={handleAction}
                  selectedItems={Array.from(selectedItems)}
                  onSelectionChange={setSelectedItems}
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

export default QueueIAAdvanced;
