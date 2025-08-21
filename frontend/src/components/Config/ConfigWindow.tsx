import React, { useState, useEffect } from 'react';
import { 
  MinusIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, EyeIcon, EyeSlashIcon,
  CpuChipIcon, ChatBubbleLeftRightIcon, SparklesIcon, CommandLineIcon, BeakerIcon
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import ConfigService from '../../services/configService';
import { logService } from '../../services/logService';
import { useConfigStore } from '../../stores/configStore';
import { IconButton } from '../UI/Button';
import { 
  getStatusColor, 
  getActionColor,
  ACTION_COLORS
} from '../../utils/colorConstants';

interface ConfigWindowProps {
  onClose?: () => void;
  onMinimize?: () => void;
}

interface ConfigContentProps {
  onClose?: () => void;
  onMinimize?: () => void;
  isStandalone?: boolean;
}

// Types pour les statuts des providers
type ProviderStatus = 'empty' | 'pending' | 'configured' | 'invalid' | 'functional' | 'active' | 'testing';

interface ProviderState {
  name: string;
  status: ProviderStatus;
  apiKey: string;
  priority: number;
  isVisible: boolean;
  errorMessage?: string;
}

// Composant de contenu simplifié pour utilisation dans MainPanel
export const ConfigContent: React.FC<ConfigContentProps> = ({ onClose, onMinimize, isStandalone = false }) => {
  const { colors } = useColors();
  const { isOnline, canMakeRequests } = useBackendConnection();
  const { aiProviders, loadAIProviders, refreshAIProviders, isInitialized } = useConfigStore();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderState[]>([]);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [priorityMode, setPriorityMode] = useState<'auto' | 'manual'>('auto');

  // Charger les providers depuis le store
  useEffect(() => {
    if (!isInitialized) {
      loadAIProviders();
    }
  }, [isInitialized, loadAIProviders]);

  // Mettre à jour les providers quand le store change
  useEffect(() => {
    if (aiProviders.length > 0) {
      updateProviderStates(aiProviders);
    }
  }, [aiProviders]);

    const updateProviderStates = async (aiProviders: any[]) => {
    try {
      setLoading(true);
      setError(null);
      

      
      // Récupérer les clés API pour tous les providers qui en ont une
      const providerStates: ProviderState[] = await Promise.all(aiProviders.map(async (provider: any) => {
        let status: ProviderStatus = 'empty';
        let errorMessage: string | undefined;



        // Déterminer le statut du provider
        if (provider.name.toLowerCase() === 'ollama') {
          // Pour Ollama, pas besoin de clé API
          if (provider.is_functional && provider.status === 'valid') {
            status = 'active';
          } else if (provider.is_functional) {
            status = 'functional';
          } else if (provider.status === 'valid') {
            // Ollama est marqué comme valide mais pas fonctionnel - probablement en cours de test
            status = 'pending';
          } else if (provider.is_functional === false) {
            // Ollama a été testé et n'est pas fonctionnel
            status = 'invalid';
            errorMessage = 'Ollama non accessible. Vérifiez qu\'il est installé et en cours d\'exécution sur http://localhost:11434.';
          } else {
            status = 'empty';
            errorMessage = 'Ollama non testé. Cliquez sur "Tester" pour vérifier la connexion.';
          }
        } else {
          // Pour les autres providers, vérifier la clé API
          if (!provider.has_api_key) {
            status = 'empty';
          } else if (provider.is_active) {
            // Si le provider est déjà actif, le garder actif
            status = 'active';
          } else if (provider.is_functional && provider.status === 'valid') {
            status = 'active';
          } else if (provider.is_functional) {
            status = 'functional';
          } else if (provider.has_api_key) {
            // Si une clé API est configurée mais pas testée
            status = 'pending';
          } else {
            status = 'invalid';
            errorMessage = 'Clé API invalide ou service non accessible.';
          }
        }

        // Récupérer la clé API si le provider en a une
        let apiKey = '';
        if (provider.has_api_key && provider.name.toLowerCase() !== 'ollama') {
          try {
            const keyResponse = await ConfigService.getAPIKey(provider.name);
            
            if (keyResponse.success && keyResponse.data && keyResponse.data.provider === provider.name) {
              apiKey = keyResponse.data.key || '';
            }
          } catch (error) {
            logService.warning(`Erreur récupération clé API ${provider.name}`, 'ConfigWindow', { 
              error: error.message, 
              provider: provider.name,
              timestamp: new Date().toISOString()
            });
          }
        }

        return {
          name: provider.name,
          status,
          apiKey,
          priority: provider.priority || 0,
          isVisible: false, // Masquer les clés API par défaut
          errorMessage
        };
      }));

      setProviders(providerStates);
    } catch (error) {
      logService.error('Erreur mise à jour providers', 'ConfigWindow', { error: error.message });
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de la mise à jour des providers';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de clé API
  const handleApiKeyChange = (providerName: string, value: string) => {
    logService.info('Changement de clé API', 'ConfigWindow', {
      provider: providerName,
      hasValue: !!value,
      valueLength: value.length,
      timestamp: new Date().toISOString()
    });
    
    // Nettoyer la valeur (supprimer les espaces en début/fin)
    const cleanedValue = value.trim();
    
    setProviders(prev => prev.map(p =>
      p.name === providerName
        ? {
            ...p,
            apiKey: value, // Garder la valeur originale pour l'affichage
            status: cleanedValue === '' ? 'empty' : 'pending',
            errorMessage: undefined // Effacer les erreurs précédentes
          }
        : p
    ));
  };

  // Tester un provider
  const handleTestProvider = async (providerName: string) => {
    try {
      setTesting(prev => ({ ...prev, [providerName]: true }));
      setError(null);

      const provider = providers.find(p => p.name === providerName);
      if (!provider) return;

      logService.info('Test de provider démarré', 'ConfigWindow', {
        provider: providerName,
        hasApiKey: providerName.toLowerCase() !== 'ollama' ? !!provider.apiKey : 'N/A',
        timestamp: new Date().toISOString()
      });

      let result;
      if (providerName.toLowerCase() === 'ollama') {
        // Test Ollama sans clé API
        result = await ConfigService.testProvider(providerName);
      } else {
        // Test avec la clé API fournie
        if (!provider.apiKey || provider.apiKey.trim() === '') {
          logService.warning('Test impossible - clé API manquante', 'ConfigWindow', {
            provider: providerName,
            timestamp: new Date().toISOString()
          });
          setError(`Veuillez saisir une clé API pour ${getProviderDisplayName(providerName)}`);
          return;
        }
        
        result = await ConfigService.testProvider(providerName, provider.apiKey);
      }

      if (result.success) {
        logService.info('Test de provider réussi', 'ConfigWindow', {
          provider: providerName,
          timestamp: new Date().toISOString()
        });

        // Sauvegarder la clé API si le test réussit
        if (providerName.toLowerCase() !== 'ollama' && provider.apiKey.trim()) {
          await ConfigService.saveAPIKey(providerName, provider.apiKey);
        }

        // Mettre à jour le statut local vers "configured" après test réussi
        setProviders(prev => prev.map(p =>
          p.name === providerName
            ? { ...p, status: 'configured' as ProviderStatus }
            : p
        ));

        // Activer le provider automatiquement après test réussi
        await ConfigService.setProviderStatus(providerName, 'valid');

        // Recharger tous les providers pour obtenir les statuts mis à jour
        await refreshAIProviders();
      } else {
        logService.warning('Test de provider échoué', 'ConfigWindow', {
          provider: providerName,
          error: result.message,
          timestamp: new Date().toISOString()
        });
        setError(`Test échoué pour ${getProviderDisplayName(providerName)}: ${result.message}`);
      }
    } catch (error) {
      logService.error(`Erreur test provider ${providerName}`, 'ConfigWindow', { error: error.message, provider: providerName });
      setError(`Erreur lors du test de ${getProviderDisplayName(providerName)}`);
    } finally {
      setTesting(prev => ({ ...prev, [providerName]: false }));
    }
  };

  // Activer/désactiver un provider
  const handleToggleProvider = async (providerName: string) => {
    try {
      const provider = providers.find(p => p.name === providerName);
      if (!provider) return;

      if (provider.status === 'active') {
        // Désactiver le provider
        await ConfigService.setProviderStatus(providerName, 'inactive');
        
        if (priorityMode === 'auto') {
          // En mode auto, recalculer les priorités après désactivation
          await recalculateAutoPriorities();
        }
      } else {
        // Activer le provider
        await ConfigService.setProviderStatus(providerName, 'valid');
        
        if (priorityMode === 'auto') {
          // En mode auto, recalculer toutes les priorités
          await recalculateAutoPriorities();
        } else {
          // En mode manuel, attribuer la prochaine priorité disponible
          const activeProviders = providers.filter(p => p.status === 'active');
          const nextPriority = activeProviders.length + 1;
          await ConfigService.setProviderPriority(providerName, nextPriority);
        }
      }

      // Recharger les providers
      await refreshAIProviders();
    } catch (error) {
      logService.error(`Erreur toggle provider ${providerName}`, 'ConfigWindow', { error: error.message, provider: providerName });
      setError(`Erreur lors de l'activation/désactivation de ${getProviderDisplayName(providerName)}`);
    }
  };

  // Recalculer les priorités automatiques
  const recalculateAutoPriorities = async () => {
    try {
      // Obtenir tous les providers actifs
      const activeProviders = providers.filter(p => p.status === 'active');
      const ollamaProvider = activeProviders.find(p => p.name.toLowerCase() === 'ollama');
      const otherProviders = activeProviders.filter(p => p.name.toLowerCase() !== 'ollama');
      
      // Ollama en priorité 1
      if (ollamaProvider) {
        await ConfigService.setProviderPriority(ollamaProvider.name, 1);
      }
      
      // Les autres providers en priorité 2, 3, 4...
      for (let i = 0; i < otherProviders.length; i++) {
        const priority = ollamaProvider ? i + 2 : i + 1;
        await ConfigService.setProviderPriority(otherProviders[i].name, priority);
      }
    } catch (error) {
      logService.error('Erreur recalcul priorités auto', 'ConfigWindow', { error: error.message });
    }
  };

  // Changer la priorité d'un provider
  const handlePriorityChange = async (providerName: string, newPriority: number) => {
    try {
      const provider = providers.find(p => p.name === providerName);
      if (!provider) return;

      const activeProviders = providers.filter(p => p.status === 'active');
      const currentPriority = provider.priority;
      
      logService.info('Changement de priorité provider', 'ConfigWindow', {
        provider: providerName,
        oldPriority: currentPriority,
        newPriority: newPriority,
        timestamp: new Date().toISOString()
      });
      
      // Vérifier s'il y a un conflit de priorité
      const existingProvider = activeProviders.find(p => p.name !== providerName && p.priority === newPriority);
      
      if (existingProvider) {
        // Échanger les priorités automatiquement
        logService.info('Échange automatique de priorités', 'ConfigWindow', {
          provider1: providerName,
          provider2: existingProvider.name,
          priority1: currentPriority,
          priority2: newPriority,
          timestamp: new Date().toISOString()
        });
        await ConfigService.setProviderPriority(existingProvider.name, currentPriority);
        await ConfigService.setProviderPriority(providerName, newPriority);
      } else {
        // Pas de conflit, mise à jour simple
        await ConfigService.setProviderPriority(providerName, newPriority);
      }
      
      // Recharger les providers
      await refreshAIProviders();
    } catch (error) {
      logService.error(`Erreur changement priorité ${providerName}`, 'ConfigWindow', { 
        error: error.message, 
        provider: providerName,
        oldPriority: provider?.priority,
        newPriority: newPriority,
        timestamp: new Date().toISOString()
      });
      setError(`Erreur lors du changement de priorité de ${getProviderDisplayName(providerName)}`);
    }
  };



  // Basculer la visibilité de la clé API
  const toggleApiKeyVisibility = (providerName: string) => {
    setProviders(prev => prev.map(p => 
      p.name === providerName 
        ? { ...p, isVisible: !p.isVisible }
        : p
    ));
  };

  // Obtenir l'icône d'un provider
  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'openai': return <SparklesIcon className="w-4 h-4" />;
      case 'claude': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      case 'mistral': return <BeakerIcon className="w-4 h-4" />;
      case 'ollama': return <CommandLineIcon className="w-4 h-4" />;
      case 'gemini': return <CpuChipIcon className="w-4 h-4" />;
      default: return <CpuChipIcon className="w-4 h-4" />;
    }
  };

  // Obtenir le nom d'affichage d'un provider
  const getProviderDisplayName = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'openai': return 'OpenAI';
      case 'claude': return 'Claude (Anthropic)';
      case 'mistral': return 'Mistral AI';
      case 'ollama': return 'Ollama';
      case 'gemini': return 'Google Gemini';
      default: return providerName;
    }
  };

     // Obtenir le statut visuel d'un provider
   const getProviderStatusInfo = (provider: ProviderState) => {
     // Si le backend est déconnecté, afficher "Attente connexion" pour tous les providers
     if (!isOnline) {
       return { 
         text: 'Attente connexion', 
         color: '#f97316', // Orange
         description: 'Backend déconnecté - impossible de vérifier le statut'
       };
     }

     switch (provider.status) {
       case 'empty':
         return { 
           text: 'Non configuré', 
           color: getStatusColor('empty'),
           description: provider.name.toLowerCase() === 'ollama' 
             ? 'Ollama non testé' 
             : 'Aucune clé API saisie'
         };
       case 'pending':
         return { 
           text: 'En attente', 
           color: getStatusColor('pending'),
           description: 'Clé API saisie, prêt à tester'
         };
       case 'configured':
         return { 
           text: 'Configuré', 
           color: getStatusColor('configured'),
           description: 'Test réussi, clé API validée'
         };
       case 'invalid':
         return { 
           text: 'Échec', 
           color: getStatusColor('invalid'),
           description: provider.errorMessage || 'Test échoué'
         };
       case 'functional':
         return { 
           text: 'Fonctionnel', 
           color: getStatusColor('functional'),
           description: 'Testé avec succès, prêt à activer'
         };
       case 'active':
         return { 
           text: 'Actif', 
           color: getStatusColor('active'),
           description: 'Provider actif et utilisable'
         };
       case 'testing':
         return { 
           text: 'Test...', 
           color: getStatusColor('testing'),
           description: 'Test en cours'
         };
       default:
         return { 
           text: 'Inconnu', 
           color: getStatusColor('empty'),
           description: 'Statut inconnu'
         };
     }
   };

  // Obtenir les providers organisés par type (local/web) et triés alphabétiquement
  const getOrganizedProviders = () => {
    const localProviders = providers.filter(provider => 
      provider.name.toLowerCase() === 'ollama'
    ).sort((a, b) => a.name.localeCompare(b.name));
    
    const webProviders = providers.filter(provider => 
      provider.name.toLowerCase() !== 'ollama'
    ).sort((a, b) => a.name.localeCompare(b.name));
    
    return { localProviders, webProviders };
  };

  // Obtenir les providers actifs triés par priorité
  const getActiveProviders = () => {
    return providers
      .filter(provider => provider.status === 'active')
      .sort((a, b) => a.priority - b.priority);
  };

  // Calculer les priorités automatiques
  const calculateAutoPriorities = () => {
    const activeProviders = providers.filter(p => p.status === 'active');
    const ollamaProvider = activeProviders.find(p => p.name.toLowerCase() === 'ollama');
    const otherProviders = activeProviders.filter(p => p.name.toLowerCase() !== 'ollama');
    
    // Ollama en priorité 1 par défaut
    if (ollamaProvider) {
      ollamaProvider.priority = 1;
    }
    
    // Les autres providers en priorité 2, 3, 4...
    otherProviders.forEach((provider, index) => {
      provider.priority = ollamaProvider ? index + 2 : index + 1;
    });
  };

  // Obtenir la priorité d'affichage pour un provider
  const getDisplayPriority = (provider: ProviderState) => {
    if (provider.status !== 'active') {
      return '--';
    }
    
    if (priorityMode === 'auto') {
      return provider.priority.toString();
    } else {
      return provider.priority.toString();
    }
  };

  // Vérifier si un provider doit afficher le menu déroulant en mode manuel
  const shouldShowPriorityDropdown = (provider: ProviderState) => {
    if (priorityMode !== 'manual') return false;
    return provider.status === 'active';
  };

  const { localProviders, webProviders } = getOrganizedProviders();
  const activeProviders = getActiveProviders();

  return (
    <div className={isStandalone ? 'h-full flex flex-col overflow-hidden' : 'flex-1 flex flex-col overflow-hidden'}>
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <div className="space-y-6">
            
            {!isOnline && (
              <div className="p-3 rounded-lg border" style={{ backgroundColor: '#fef3c7', borderColor: '#f97316' }}>
                <div className="flex items-center space-x-2">
                  <span style={{ color: '#f97316' }}>⚠️</span>
                  <span className="text-sm" style={{ color: '#92400e' }}>
                    Backend déconnecté - Les statuts des providers IA ne peuvent pas être vérifiés
                  </span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">⚠️</span>
                  <span className="text-sm text-red-700">{error}</span>
                  <IconButton
                    icon={<XMarkIcon />}
                    onClick={() => setError(null)}
                    variant="danger"
                    size="xs"
                    tooltip="Fermer"
                    className="transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
                  />
                </div>
              </div>
            )}
            
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }}></div>
                <span className="ml-2" style={{ color: colors.textSecondary }}>Chargement...</span>
              </div>
            ) : (
              <>
                                 {/* Tableau des providers */}
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h4 className="font-medium text-sm" style={{ color: colors.text }}>
                       🔑 Configuration et test des providers
                     </h4>
                     
                                           {/* Sélecteur de mode de priorité */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>
                          Mode priorité:
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="priorityMode"
                              value="auto"
                              checked={priorityMode === 'auto'}
                              onChange={async (e) => {
                                setPriorityMode(e.target.value as 'auto' | 'manual');
                                if (e.target.value === 'auto') {
                                  // Recalculer les priorités automatiques quand on passe en mode auto
                                  await recalculateAutoPriorities();
                                  await refreshAIProviders();
                                }
                              }}
                              className="w-3 h-3"
                            />
                            <span className="text-xs" style={{ color: colors.textSecondary }}>
                              Auto
                            </span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="priorityMode"
                              value="manual"
                              checked={priorityMode === 'manual'}
                              onChange={(e) => setPriorityMode(e.target.value as 'auto' | 'manual')}
                              className="w-3 h-3"
                            />
                            <span className="text-xs" style={{ color: colors.textSecondary }}>
                              Manuel
                            </span>
                          </label>
                        </div>
                      </div>
                   </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ borderColor: colors.border }}>
                                             <thead>
                         <tr style={{ backgroundColor: colors.surface }}>
                           <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                             Provider
                           </th>
                           <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                             Type
                           </th>
                           <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                             Statut
                           </th>
                           <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                             Clé API
                           </th>
                                                      <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                              Actions
                            </th>
                            <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                              Priorité
                            </th>
                         </tr>
                       </thead>
                                             <tbody>
                                                                                                                                    {/* Section IA Locales */}
                            {localProviders.map((provider) => {
                              const statusInfo = getProviderStatusInfo(provider);
                              const isTesting = testing[provider.name];
                              
                              return (
                                <tr key={provider.name} className="border-b" style={{ borderColor: colors.border }}>
                                  {/* Colonne Provider */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div style={{ color: colors.textSecondary }}>
                                        {getProviderIcon(provider.name)}
                                      </div>
                                      <span className="text-sm font-medium" style={{ color: colors.text }}>
                                        {getProviderDisplayName(provider.name)}
                                      </span>
                                    </div>
                                  </td>
                                  
                                                                   {/* Colonne Type */}
                                   <td className="p-3">
                                     <span className="text-xs px-2 py-1 rounded inline-block" style={{ 
                                       backgroundColor: 'transparent', 
                                       color: ACTION_COLORS.local,
                                       border: `1px solid ${ACTION_COLORS.local}`
                                     }}>
                                       Local
                                     </span>
                                   </td>
                                  
                                  {/* Colonne Statut */}
                                 <td className="p-3">
                                   <div className="flex flex-col space-y-1">
                                     <span 
                                       className="text-xs px-2 py-1 rounded inline-block w-fit"
                                       style={{ 
                                         backgroundColor: 'transparent',
                                         color: statusInfo.color,
                                         border: `1px solid ${statusInfo.color}`
                                       }}
                                     >
                                       {statusInfo.text}
                                     </span>
                                     {provider.errorMessage && (
                                       <span className="text-xs" style={{ color: '#ef4444' }}>
                                         {provider.errorMessage}
                                       </span>
                                     )}
                                   </div>
                                 </td>
                                 
                                 {/* Colonne Clé API */}
                                 <td className="p-3">
                                   {provider.name.toLowerCase() !== 'ollama' ? (
                                     <div className="relative">
                                                                              <input
                                         type={provider.isVisible ? "text" : "password"}
                                         name={`api-key-${provider.name.toLowerCase()}`}
                                         id={`api-key-${provider.name.toLowerCase()}`}
                                         autoComplete={`api-key-${provider.name.toLowerCase()}`}
                                         data-provider={provider.name.toLowerCase()}
                                         data-field-type="api-key"
                                         value={provider.apiKey}
                                         onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                                         onPaste={(e) => handleApiKeyChange(provider.name, e.clipboardData.getData('text'))}
                                         onKeyDown={(e) => {
                                           // Permettre toutes les touches
                                           if (e.key === 'Enter') {
                                             e.preventDefault();
                                             handleTestProvider(provider.name);
                                           }
                                         }}
                                         placeholder={`Clé API ${getProviderDisplayName(provider.name)}`}
                                         className="w-full px-2 py-1 rounded border text-xs"
                                         style={{
                                           backgroundColor: colors.background,
                                           borderColor: colors.border,
                                           color: colors.text
                                         }}
                                       />
                                      <button
                                        onClick={() => toggleApiKeyVisibility(provider.name)}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
                                        style={{
                                          backgroundColor: 'transparent',
                                          color: colors.textSecondary
                                        }}
                                        title={provider.isVisible ? "Masquer la clé" : "Afficher la clé"}
                                      >
                                        {provider.isVisible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs" style={{ color: colors.textSecondary }}>
                                      Non requis
                                    </span>
                                  )}
                                </td>
                               
                                                                 {/* Colonne Actions */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          if (isTesting) return;
                                          if (provider.status === 'active') {
                                            handleToggleProvider(provider.name);
                                          } else if (provider.status === 'configured' || provider.status === 'functional') {
                                            handleToggleProvider(provider.name);
                                          } else {
                                            handleTestProvider(provider.name);
                                          }
                                        }}
                                        disabled={isTesting || !isOnline || (provider.name.toLowerCase() !== 'ollama' && provider.status === 'empty')}
                                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
                                          isTesting || !isOnline || (provider.name.toLowerCase() !== 'ollama' && provider.status === 'empty') ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        style={{
                                          backgroundColor: 'transparent',
                                          border: `1px solid ${(() => {
                                            if (isTesting) return getActionColor('primary');
                                            if (provider.status === 'active') return getActionColor('delete');
                                            if (provider.status === 'configured' || provider.status === 'functional') return getActionColor('start');
                                            if (provider.status === 'pending') return getActionColor('pause');
                                            return getActionColor('primary');
                                          })()}`,
                                          color: (() => {
                                            if (isTesting) return getActionColor('primary');
                                            if (provider.status === 'active') return getActionColor('delete');
                                            if (provider.status === 'configured' || provider.status === 'functional') return getActionColor('start');
                                            if (provider.status === 'pending') return getActionColor('pause');
                                            return getActionColor('primary');
                                          })()
                                        }}
                                      >
                                       {(() => {
                                         if (isTesting) return 'Test...';
                                         if (provider.status === 'active') return 'Désactiver';
                                         if (provider.status === 'configured' || provider.status === 'functional') return 'Activer';
                                         if (provider.status === 'pending') return 'Tester';
                                         if (provider.status === 'empty') return 'Configurer';
                                         return 'Tester';
                                       })()}
                                     </button>
                                     
                                   </div>
                                 </td>
                                 
                                 {/* Colonne Priorité */}
                                 <td className="p-3">
                                   {shouldShowPriorityDropdown(provider) ? (
                                     <select
                                       value={provider.priority || 1}
                                       onChange={(e) => handlePriorityChange(provider.name, parseInt(e.target.value))}
                                       className="px-2 py-1 rounded border text-xs"
                                       style={{
                                         backgroundColor: colors.background,
                                         borderColor: colors.border,
                                         color: colors.text
                                       }}
                                     >
                                       {Array.from({ length: activeProviders.length }, (_, i) => i + 1).map(priority => (
                                         <option key={priority} value={priority}>
                                           {priority}
                                         </option>
                                       ))}
                                     </select>
                                   ) : (
                                     <span className="text-xs" style={{ color: colors.textSecondary }}>
                                       {getDisplayPriority(provider)}
                                     </span>
                                   )}
                                 </td>
                             </tr>
                           );
                         })}

                                                   {/* Séparateur IA Locales / IA Web */}
                          {localProviders.length > 0 && webProviders.length > 0 && (
                            <tr>
                              <td colSpan={6} className="p-0">
                                <div className="border-t" style={{ borderColor: colors.border, opacity: 0.3 }}></div>
                              </td>
                            </tr>
                          )}

                                                   {/* Section IA Web */}
                          {webProviders.map((provider) => {
                            const statusInfo = getProviderStatusInfo(provider);
                            const isTesting = testing[provider.name];
                            
                            return (
                              <tr key={provider.name} className="border-b" style={{ borderColor: colors.border }}>
                                {/* Colonne Provider */}
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div style={{ color: colors.textSecondary }}>
                                      {getProviderIcon(provider.name)}
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: colors.text }}>
                                      {getProviderDisplayName(provider.name)}
                                    </span>
                                  </div>
                                </td>
                                
                                                                 {/* Colonne Type */}
                                  <td className="p-3">
                                    <span className="text-xs px-2 py-1 rounded inline-block" style={{ 
                                      backgroundColor: 'transparent', 
                                      color: ACTION_COLORS.web,
                                      border: `1px solid ${ACTION_COLORS.web}`
                                    }}>
                                      Web
                                    </span>
                                  </td>
                                
                                {/* Colonne Statut */}
                                <td className="p-3">
                                  <div className="flex flex-col space-y-1">
                                    <span 
                                      className="text-xs px-2 py-1 rounded inline-block w-fit"
                                      style={{ 
                                        backgroundColor: 'transparent',
                                        color: statusInfo.color,
                                        border: `1px solid ${statusInfo.color}`
                                      }}
                                    >
                                      {statusInfo.text}
                                    </span>
                                    {provider.errorMessage && (
                                      <span className="text-xs" style={{ color: '#ef4444' }}>
                                        {provider.errorMessage}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                
                                                                {/* Colonne Clé API */}
                                 <td className="p-3">
                                   {provider.name.toLowerCase() !== 'ollama' ? (
                                     <div className="relative">
                                                                              <input
                                         type={provider.isVisible ? "text" : "password"}
                                         name={`api-key-${provider.name.toLowerCase()}`}
                                         id={`api-key-${provider.name.toLowerCase()}`}
                                         autoComplete={`api-key-${provider.name.toLowerCase()}`}
                                         data-provider={provider.name.toLowerCase()}
                                         data-field-type="api-key"
                                         value={provider.apiKey}
                                         onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                                         onPaste={(e) => handleApiKeyChange(provider.name, e.clipboardData.getData('text'))}
                                         onKeyDown={(e) => {
                                           // Permettre toutes les touches
                                           if (e.key === 'Enter') {
                                             e.preventDefault();
                                             handleTestProvider(provider.name);
                                           }
                                         }}
                                         placeholder={`Clé API ${getProviderDisplayName(provider.name)}`}
                                         className="w-full px-2 py-1 rounded border text-xs"
                                         style={{
                                           backgroundColor: colors.background,
                                           borderColor: colors.border,
                                           color: colors.text
                                         }}
                                       />
                                      <button
                                        onClick={() => toggleApiKeyVisibility(provider.name)}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
                                        style={{
                                          backgroundColor: 'transparent',
                                          color: colors.textSecondary
                                        }}
                                        title={provider.isVisible ? "Masquer la clé" : "Afficher la clé"}
                                      >
                                        {provider.isVisible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs" style={{ color: colors.textSecondary }}>
                                      Non requis
                                    </span>
                                  )}
                                </td>
                               
                                                                {/* Colonne Actions */}
                                 <td className="p-3">
                                   <div className="flex items-center gap-2">
                                     <button
                                       onClick={() => {
                                         if (isTesting) return;
                                         
                                         if (provider.status === 'active') {
                                           handleToggleProvider(provider.name);
                                         } else if (provider.status === 'configured' || provider.status === 'functional') {
                                           handleToggleProvider(provider.name);
                                         } else {
                                           handleTestProvider(provider.name);
                                         }
                                       }}
                                       disabled={isTesting || !isOnline || (provider.name.toLowerCase() !== 'ollama' && provider.status === 'empty')}
                                       className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 ${
                                         isTesting || !isOnline || (provider.name.toLowerCase() !== 'ollama' && provider.status === 'empty') ? 'opacity-50 cursor-not-allowed' : ''
                                       }`}
                                       style={{
                                         backgroundColor: 'transparent',
                                         border: `1px solid ${(() => {
                                           if (isTesting) return getActionColor('primary');
                                           if (provider.status === 'active') return getActionColor('delete');
                                           if (provider.status === 'configured' || provider.status === 'functional') return getActionColor('start');
                                           if (provider.status === 'pending') return getActionColor('pause');
                                           return getActionColor('primary');
                                         })()}`,
                                         color: (() => {
                                           if (isTesting) return getActionColor('primary');
                                           if (provider.status === 'active') return getActionColor('delete');
                                           if (provider.status === 'configured' || provider.status === 'functional') return getActionColor('start');
                                           if (provider.status === 'pending') return getActionColor('pause');
                                           return getActionColor('primary');
                                         })()
                                       }}
                                     >
                                      {(() => {
                                        if (isTesting) return 'Test...';
                                        if (provider.status === 'active') return 'Désactiver';
                                        if (provider.status === 'configured' || provider.status === 'functional') return 'Activer';
                                        if (provider.status === 'pending') return 'Tester';
                                        if (provider.status === 'empty') return 'Configurer';
                                        return 'Tester';
                                      })()}
                                    </button>
                                    
                                  </div>
                                </td>
                                
                                {/* Colonne Priorité */}
                                <td className="p-3">
                                  {shouldShowPriorityDropdown(provider) ? (
                                    <select
                                      value={provider.priority || 1}
                                      onChange={(e) => handlePriorityChange(provider.name, parseInt(e.target.value))}
                                      className="px-2 py-1 rounded border text-xs"
                                      style={{
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        color: colors.text
                                      }}
                                    >
                                      {Array.from({ length: activeProviders.length }, (_, i) => i + 1).map(priority => (
                                        <option key={priority} value={priority}>
                                          {priority}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-xs" style={{ color: colors.textSecondary }}>
                                      {getDisplayPriority(provider)}
                                    </span>
                                  )}
                                </td>
                             </tr>
                           );
                         })}
                       </tbody>
                    </table>
                  </div>
                </div>

                                     {/* Note sur les priorités */}
                   {activeProviders.length > 0 && (
                     <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                       <div className="text-sm space-y-2" style={{ color: colors.textSecondary }}>
                         <p className="font-semibold" style={{ color: colors.text }}>
                           💡 Gestion des priorités :
                         </p>
                                                   <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Mode Auto :</strong> Ollama priorité 1, autres providers 2, 3, 4... automatiquement</li>
                            <li><strong>Mode Manuel :</strong> Sélectionnez les priorités via les menus déroulants</li>
                            <li>En mode manuel, changer une priorité permute automatiquement avec l'autre</li>
                            <li>Les providers non actifs affichent "--" en priorité</li>
                            <li>Le recalcul automatique se fait à chaque activation/désactivation en mode auto</li>
                          </ul>
                       </div>
                     </div>
                   )}

                
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigWindow: React.FC<ConfigWindowProps> = ({ onClose, onMinimize }) => {
  const { colors } = useColors();
  const { isOnline, canMakeRequests } = useBackendConnection();
  const { getActiveProviders, isInitialized } = useConfigStore();
  
  // Obtenir les providers actifs pour l'indicateur
  const activeProviders = getActiveProviders().filter(provider => provider.is_functional);
  
  // Debug pour voir les providers
  // console.log('ConfigWindow - Providers actifs:', {
  //   allProviders: getActiveProviders(),
  //   functionalProviders: activeProviders,
  //   isInitialized,
  //   count: activeProviders.length
  // });

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
                 <div className="flex items-center space-x-3">
           <span className="text-2xl">⚙️</span>
           <div className="flex items-center gap-3">
             <div>
               <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                 Configuration IA
               </h2>
               <p className="text-sm" style={{ color: colors.textSecondary }}>
                 Validation des clés et gestion des priorités
               </p>
             </div>
                           {isInitialized && canMakeRequests && activeProviders.length > 0 && (
                <span 
                  className="text-xs font-bold"
                  style={{ 
                    color: '#10b981',
                    fontSize: '11px'
                  }}
                  title={`${activeProviders.length} IA(s) active(s)`}
                >
                  {activeProviders.length}
                </span>
              )}
           </div>
         </div>
        <div className="flex items-center space-x-2">
          {onMinimize && (
            <IconButton
              icon={<MinusIcon />}
              onClick={onMinimize}
              variant="secondary"
              size="sm"
              tooltip="Réduire"
              className="transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
            />
          )}
          {onClose && (
            <IconButton
              icon={<XMarkIcon />}
              onClick={onClose}
              variant="secondary"
              size="sm"
              tooltip="Fermer"
              className="transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
            />
          )}
        </div>
      </div>

      {/* Contenu */}
      <ConfigContent />
    </div>
  );
};

export default ConfigWindow;
