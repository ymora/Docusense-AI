import React, { useState, useEffect } from 'react';
import { MinusIcon, XMarkIcon, ChartBarIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import ConfigService from '../../services/configService';
import { analysisService } from '../../services/analysisService';

interface ConfigWindowProps {
  onClose?: () => void;
  onMinimize?: () => void;
}

interface ConfigContentProps {
  onClose?: () => void;
  onMinimize?: () => void;
  isStandalone?: boolean;
}

// Composant de contenu sans header pour utilisation dans MainPanel
export const ConfigContent: React.FC<ConfigContentProps> = ({ onClose, onMinimize, isStandalone = false }) => {
  
  const { colors } = useColors();
  const [activeTab, setActiveTab] = useState<'providers' | 'strategy' | 'metrics'>('providers');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [validKeys, setValidKeys] = useState<Record<string, boolean>>({});
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // États pour les statistiques
  const [analysisStats, setAnalysisStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Charger les providers et les recharger quand nécessaire
  useEffect(() => {
    loadProviders();
  }, [forceUpdate]);

  // Recharger les providers quand le panneau devient actif
  useEffect(() => {
    if (activeTab === 'providers') {
      loadProviders();
    }
  }, [activeTab]);

  // Charger les statistiques quand on passe aux onglets stratégie ou métriques
  useEffect(() => {
    if (activeTab === 'strategy' || activeTab === 'metrics') {
      loadAnalysisStats();
    }
  }, [activeTab]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await ConfigService.getAIProviders();
      setProviders(response.providers || []);
      
      // Remplir les clés API existantes et leur statut
      const keys: Record<string, string> = {};
      const valid: Record<string, boolean> = {};
      response.providers?.forEach((provider: any) => {
        if (provider.api_key) {
          keys[provider.name] = provider.api_key;
        }
        // Marquer comme valide si le provider est fonctionnel ou a été testé récemment
        valid[provider.name] = provider.status === 'valid' || provider.is_functional || 
                             (provider.last_tested && new Date(provider.last_tested) > new Date(Date.now() - 24 * 60 * 60 * 1000));
      });
      setApiKeys(keys);
      setValidKeys(valid);
    } catch (error) {
      console.error('Erreur chargement providers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de clé API
  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    // Réinitialiser le statut de validité quand la clé change
    setValidKeys(prev => ({ ...prev, [provider]: false }));
  };

     // Tester une clé API spécifique
   const handleTestProvider = async (provider: string) => {
     // Vérifier si une clé API est nécessaire (tous sauf Ollama)
     if (provider.toLowerCase() !== 'ollama') {
       const apiKey = apiKeys[provider];
       if (!apiKey?.trim()) {
         return;
       }
     }

     if (testing[provider]) return;
     
     setTesting(prev => ({ ...prev, [provider]: true }));
     
           try {
        const apiKey = apiKeys[provider] || '';
        const result = await ConfigService.testProvider(provider, apiKey);
                 if (result.success) {
           // Sauvegarder la clé si le test réussit (même vide pour Ollama)
           if (provider.toLowerCase() !== 'ollama') {
             await ConfigService.saveAPIKey(provider, apiKey);
           }
           // Marquer la clé comme valide
           setValidKeys(prev => ({ ...prev, [provider]: true }));
           
           // Activer automatiquement le provider si le test réussit
           await ConfigService.setProviderStatus(provider, 'valid');
           
           // Recharger les providers pour mettre à jour l'état
           await loadProviders();
           
           // Si on est en mode stratégie manuelle, recalculer les priorités
           if (strategy === 'priority') {
             await recalculatePrioritiesForActiveProviders();
           }
           
           // Forcer la mise à jour de l'interface
           setForceUpdate(prev => prev + 1);
           setTimeout(() => {
             loadProviders();
           }, 100);
                  } else {
            // Marquer la clé comme invalide
            setValidKeys(prev => ({ ...prev, [provider]: false }));
          }
             } catch (error) {
         console.error(`Erreur test ${provider}:`, error);
         // Marquer la clé comme invalide en cas d'erreur
         setValidKeys(prev => ({ ...prev, [provider]: false }));
       } finally {
        setTesting(prev => ({ ...prev, [provider]: false }));
      }
   };

  // Obtenir l'icône d'un provider
  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'openai': return '🔵';
      case 'claude': return '🟠';
      case 'mistral': return '🟣';
      case 'ollama': return '🐙';
      default: return '❓';
    }
  };

           // Obtenir l'icône de la clé selon le statut
    const getKeyIcon = (provider: string) => {
      if (testing[provider]) return '⏳';
      return '🔑';
    };

    // Obtenir la couleur de la clé selon son statut
    const getKeyColor = (provider: string) => {
      // Test en cours
      if (testing[provider]) return '#f59e0b'; // Orange pour test en cours
      
      // Pas de clé API
      if (!apiKeys[provider]) return '#6b7280'; // Gris pour clé absente
      
      // Clé présente - déterminer l'état selon le test
      const providerData = providers.find(p => p.name === provider);
      
      if (providerData && providerData.last_tested) {
        // Clé testée
        if (providerData.is_functional) {
          return '#10b981'; // Vert pour clé testée et valide
        } else {
          return '#ef4444'; // Rouge pour clé testée mais invalide
        }
      } else {
        // Clé présente mais pas encore testée
        return '#eab308'; // Jaune pour clé présente non testée
      }
    };

               // Obtenir l'icône de statut pour Ollama
     const getOllamaStatusIcon = (provider: string) => {
       if (testing[provider]) return '⏳';
       return '🔧';
     };

     // Obtenir la couleur de statut pour Ollama
     const getOllamaStatusColor = (provider: string) => {
       if (testing[provider]) return '#f59e0b'; // Orange pour test en cours
       if (validKeys[provider]) return '#10b981'; // Vert pour testé et fonctionnel
       return '#6b7280'; // Gris pour non testé
     };

  // Obtenir le nom d'affichage d'un provider
  const getProviderDisplayName = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'openai': return 'OpenAI';
      case 'claude': return 'Claude (Anthropic)';
      case 'mistral': return 'Mistral AI';
      case 'ollama': return 'Ollama';
      default: return providerName;
    }
  };

  // Fonction centralisée pour déterminer si un provider est actif
  const isProviderActive = (provider: any): boolean => {
    // Pour Ollama, vérifier seulement s'il est fonctionnel (pas de clé API)
    if (provider.name.toLowerCase() === 'ollama') {
      return provider.is_functional || validKeys[provider.name];
    }
    
    // Pour les autres providers, vérifier qu'ils ont une clé API valide ET qu'ils sont fonctionnels
    const hasValidApiKey = provider.api_key && provider.api_key.trim() !== '';
    const isFunctional = provider.is_functional || validKeys[provider.name];
    
    return hasValidApiKey && isFunctional;
  };

  // Fonction centralisée pour déterminer si un provider peut être activé
  const canProviderBeActivated = (provider: any): boolean => {
    // Pour Ollama, vérifier seulement s'il est fonctionnel
    if (provider.name.toLowerCase() === 'ollama') {
      return provider.is_functional || validKeys[provider.name];
    }
    
    // Pour les autres providers, vérifier qu'ils ont une clé API ET qu'elle est valide
    const hasApiKey = provider.api_key && provider.api_key.trim() !== '';
    const isKeyValid = provider.is_functional || validKeys[provider.name];
    
    return hasApiKey && isKeyValid;
  };

         // Obtenir le statut d'un provider
    const getProviderStatus = (provider: any) => {
      const isActive = isProviderActive(provider);
      const canBeActivated = canProviderBeActivated(provider);
      
      if (isActive) {
        return '✅ Actif';
      } else if (canBeActivated) {
        return '🟡 Prêt à activer';
      } else if (provider.api_key && provider.api_key.trim() !== '') {
        return '❌ Clé invalide';
      } else {
        return 'Non configuré';
      }
    };

  // Obtenir la couleur du statut d'un provider
  const getProviderStatusColor = (provider: any) => {
    const isActive = isProviderActive(provider);
    const canBeActivated = canProviderBeActivated(provider);
    
    if (isActive) {
      return '#10b981'; // Vert pour actif
    } else if (canBeActivated) {
      return '#f59e0b'; // Jaune pour prêt à activer
    } else if (provider.api_key && provider.api_key.trim() !== '') {
      return '#ef4444'; // Rouge pour clé invalide
    } else {
      return '#6b7280'; // Gris pour non configuré
    }
  };

  // États pour la stratégie
  const [strategy, setStrategy] = useState<string>('priority');
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [strategyLoading, setStrategyLoading] = useState(false);

  // Force update pour synchronisation entre onglets
  const [strategyForceUpdate, setStrategyForceUpdate] = useState(0);

  // Charger la stratégie et les priorités
  useEffect(() => {
    if (activeTab === 'strategy' && !strategyLoading) {
      loadStrategy();
    }
  }, [activeTab, forceUpdate, strategyForceUpdate]);

     const loadStrategy = async () => {
     try {
       setStrategyLoading(true);
       const response = await ConfigService.getAIProviders();
       
       // Forcer la stratégie "priority" (seule stratégie supportée)
       if (response.strategy !== 'priority') {

         await ConfigService.setStrategy('priority');
         setStrategy('priority');
       } else {
         setStrategy('priority');
       }
       
       // Charger les priorités des providers
       const providerPriorities: Record<string, number> = {};
       response.providers?.forEach((provider: any) => {
         if (provider.priority) {
           providerPriorities[provider.name] = provider.priority;
         }
       });
       setPriorities(providerPriorities);
       
       // Vérifier et corriger les priorités si nécessaire
       await validateAndFixPriorities();
     } catch (error) {
       console.error('Erreur chargement stratégie:', error);
       // En cas d'erreur, utiliser la stratégie par défaut
       setStrategy('priority');
     } finally {
       setStrategyLoading(false);
     }
   };

       // Valider et corriger les priorités si nécessaire
    const validateAndFixPriorities = async () => {
      try {
        const activeProviders = getActiveProvidersByPriority();
        const activeProvidersWithPriority = activeProviders.filter(p => priorities[p.name]);
        
        // Si le nombre de providers actifs avec priorité ne correspond pas au nombre de providers actifs
        if (activeProvidersWithPriority.length !== activeProviders.length) {
          await recalculatePrioritiesForActiveProviders();
        }
      } catch (error) {
        console.error('Erreur validation priorités:', error);
      }
    };

     // Changer la stratégie
     const handleStrategyChange = async (newStrategy: string) => {
    // Seule la stratégie "priority" est supportée
    if (newStrategy !== 'priority') {

      return;
    }
    
    try {
      setStrategyLoading(true);
      await ConfigService.setStrategy(newStrategy);
      setStrategy(newStrategy);
      
      // Recalculer les priorités pour les providers actifs
      await recalculatePrioritiesForActiveProviders();
      
      // Forcer la mise à jour de l'interface
      setStrategyForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('Erreur changement stratégie:', error);
    } finally {
      setStrategyLoading(false);
    }
  };

       // Recalculer les priorités pour les providers actifs
    const recalculatePrioritiesForActiveProviders = async () => {
      try {
        const activeProviders = getActiveProvidersByPriority();
        const newPriorities: Record<string, number> = {};
        
        // Réassigner les priorités de 1 à N pour les providers actifs
        activeProviders.forEach((provider, index) => {
          newPriorities[provider.name] = index + 1;
        });
        
        // Sauvegarder les nouvelles priorités
        for (const [providerName, priority] of Object.entries(newPriorities)) {
          await ConfigService.setProviderPriority(providerName, priority);
        }
        
        setPriorities(newPriorities);
        
        // Forcer la mise à jour de l'interface
        setStrategyForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('Erreur recalcul priorités:', error);
      }
    };

                               // Activer/désactiver un provider
      const handleToggleProvider = async (provider: string) => {
        try {
          const currentProvider = providers.find(p => p.name === provider);
          if (!currentProvider) return;
          
          // Vérifier si le provider peut être activé
          const canBeActivated = canProviderBeActivated(currentProvider);
          
          // Si le provider ne peut pas être activé, pas d'action possible
          if (!canBeActivated) {

            return;
          }
          
          // Déterminer le nouveau statut basé sur l'état actuel
          const isCurrentlyActive = isProviderActive(currentProvider);
          const newStatus = isCurrentlyActive ? 'inactive' : 'valid';
          

          
          // Appeler l'API pour changer le statut
          await ConfigService.setProviderStatus(provider, newStatus);
         
         // Recharger les providers pour mettre à jour l'état
         await loadProviders();
         
         // Si on désactive un provider, recalculer les priorités si nécessaire
         if (newStatus === 'inactive' && strategy === 'priority') {
           await recalculatePrioritiesForActiveProviders();
         }
         
         // Forcer la mise à jour de l'interface
         setForceUpdate(prev => prev + 1);
         setStrategyForceUpdate(prev => prev + 1);
       } catch (error) {
         console.error(`Erreur changement statut ${provider}:`, error);
       }
     };

     // Changer la priorité d'un provider avec échange automatique
   const handlePriorityChange = async (provider: string, newPriority: number) => {
     try {
       setStrategyLoading(true);
       
       const activeProviders = getActiveProvidersByPriority();
       const currentPriority = priorities[provider] || 1;
       

       
       // Vérifier s'il y a un conflit de priorité
       const existingProviderWithPriority = Object.entries(priorities).find(
         ([name, priority]) => name !== provider && priority === newPriority
       );
       
       if (existingProviderWithPriority) {
         // Échanger les priorités automatiquement
         const [existingProvider] = existingProviderWithPriority;
         

         
         // Mettre à jour les deux providers
         await ConfigService.setProviderPriority(existingProvider, currentPriority);
         await ConfigService.setProviderPriority(provider, newPriority);
         
         setPriorities(prev => ({
           ...prev,
           [existingProvider]: currentPriority,
           [provider]: newPriority
         }));
         

       } else {
         // Pas de conflit, mise à jour simple
         await ConfigService.setProviderPriority(provider, newPriority);
         setPriorities(prev => ({ ...prev, [provider]: newPriority }));
         

       }
       
       // Forcer la mise à jour de l'interface
       setStrategyForceUpdate(prev => prev + 1);
     } catch (error) {
       console.error(`Erreur changement priorité ${provider}:`, error);
     } finally {
       setStrategyLoading(false);
     }
   };

         // Obtenir les providers actifs triés par priorité
    const getActiveProvidersByPriority = () => {
      return providers
        .filter(provider => isProviderActive(provider))
        .sort((a, b) => (priorities[a.name] || 999) - (priorities[b.name] || 999));
    };

   // Obtenir les providers triés par priorité (pour compatibilité)
   const getProvidersByPriority = () => {
     return providers
       .filter(provider => priorities[provider.name])
       .sort((a, b) => (priorities[a.name] || 999) - (priorities[b.name] || 999));
   };

  // Charger les statistiques d'analyse
  const loadAnalysisStats = async () => {
    try {
      setStatsLoading(true);
      const response = await analysisService.getAnalysisStats();
      setAnalysisStats(response);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Composant pour afficher une métrique
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = colors.text,
    bgColor = colors.surface
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: string;
    bgColor?: string;
  }) => (
    <div 
      className="p-4 rounded-lg border"
      style={{ 
        backgroundColor: bgColor, 
        borderColor: colors.border 
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
            {title}
          </p>
          <p className="text-2xl font-bold" style={{ color }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
        <Icon className="h-8 w-8" style={{ color: colors.textSecondary }} />
      </div>
    </div>
  );

  return (
    <div className={isStandalone ? 'h-full' : 'flex-1 overflow-y-auto p-2'}>
      {/* Tabs */}
      <div
        className="flex border-b mb-4"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-2 py-1 text-xs font-medium transition-colors ${
            activeTab === 'providers'
              ? 'text-white border-b-2'
              : 'hover:text-white'
          }`}
          style={{
            backgroundColor: activeTab === 'providers' ? colors.surface : 'transparent',
            color: activeTab === 'providers' ? colors.text : colors.textSecondary,
            borderColor: activeTab === 'providers' ? colors.primary : 'transparent'
          }}
        >
          Providers IA
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`px-2 py-1 text-xs font-medium transition-colors ${
            activeTab === 'strategy'
              ? 'text-white border-b-2'
              : 'hover:text-white'
          }`}
          style={{
            backgroundColor: activeTab === 'strategy' ? colors.surface : 'transparent',
            color: activeTab === 'strategy' ? colors.text : colors.textSecondary,
            borderColor: activeTab === 'strategy' ? colors.primary : 'transparent'
          }}
        >
          Stratégie IA
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-2 py-1 text-xs font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'text-white border-b-2'
              : 'hover:text-white'
          }`}
          style={{
            backgroundColor: activeTab === 'metrics' ? colors.surface : 'transparent',
            color: activeTab === 'metrics' ? colors.text : colors.textSecondary,
            borderColor: activeTab === 'metrics' ? colors.primary : 'transparent'
          }}
        >
          Métriques
        </button>
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
            Configuration des Providers IA
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }}></div>
              <span className="ml-2" style={{ color: colors.textSecondary }}>Chargement...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <div
                  key={provider.name}
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }}
                >
                                     {/* Ligne 1: Nom du provider, statut et bouton activation */}
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center space-x-2">
                       <span className="text-xl">{getProviderIcon(provider.name)}</span>
                       <div>
                         <h4 className="font-medium text-sm" style={{ color: colors.text }}>
                           {getProviderDisplayName(provider.name)}
                         </h4>
                         {/* Texte de statut supprimé (on affiche seulement l'icône de clé colorée) */}
                       </div>
                     </div>
                     
                                                                                                                                   {/* Bouton supprimé - déplacé vers l'onglet Stratégie IA */}
                   </div>

                   {/* Ligne 2: Clé API et bouton test */}
                   <div className="flex items-center space-x-2">
                     {/* Champ de clé API pour tous les providers sauf Ollama */}
                     {provider.name.toLowerCase() !== 'ollama' && (
                       <form 
                         onSubmit={(e) => {
                           e.preventDefault();
                           handleTestProvider(provider.name);
                         }}
                         className="flex items-center space-x-2 flex-1"
                       >
                                                   <span 
                            className="text-lg"
                            style={{ 
                              color: getKeyColor(provider.name)
                            }}
                            title={
                              testing[provider.name] ? 'Test en cours...' :
                              validKeys[provider.name] ? 'Clé validée' :
                              apiKeys[provider.name] ? 
                                (providers.find(p => p.name === provider.name)?.last_tested && 
                                 !providers.find(p => p.name === provider.name)?.is_functional ? 
                                 'Clé invalide (test échoué)' : 'Clé présente mais non validée') :
                              'Aucune clé'
                            }
                          >
                            {getKeyIcon(provider.name)}
                          </span>
                         <input
                           type="password"
                           value={apiKeys[provider.name] || ''}
                           onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                           placeholder="Clé API"
                           className="flex-1 px-2 py-1 rounded border text-xs"
                           style={{
                             backgroundColor: colors.background,
                             borderColor: colors.border,
                             color: colors.text
                           }}
                         />
                                                   <button
                            type="submit"
                            disabled={testing[provider.name] || !apiKeys[provider.name]?.trim()}
                            className="px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center space-x-1"
                            style={{
                              backgroundColor: colors.primary,
                              color: colors.background
                            }}
                          >
                            {testing[provider.name] && (
                              <svg 
                                className="animate-spin h-3 w-3" 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24"
                              >
                                <circle 
                                  className="opacity-25" 
                                  cx="12" 
                                  cy="12" 
                                  r="10" 
                                  stroke="currentColor" 
                                  strokeWidth="4"
                                />
                                <path 
                                  className="opacity-75" 
                                  fill="currentColor" 
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            )}
                            <span>{testing[provider.name] ? 'Test...' : 'Test'}</span>
                          </button>
                       </form>
                     )}
                                           {/* Bouton test pour Ollama (pas de clé API) */}
                      {provider.name.toLowerCase() === 'ollama' && (
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleTestProvider(provider.name);
                          }}
                          className="flex items-center space-x-2 flex-1"
                        >
                                                     <span 
                             className="text-lg"
                             style={{ 
                               color: getOllamaStatusColor(provider.name)
                             }}
                             title={
                               testing[provider.name] ? 'Test en cours...' :
                               validKeys[provider.name] ? 'Ollama testé et fonctionnel' :
                               'Ollama non testé'
                             }
                           >
                             {getOllamaStatusIcon(provider.name)}
                           </span>
                          <div className="flex-1"></div>
                          <button
                            type="submit"
                            disabled={testing[provider.name]}
                            className="px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center space-x-1"
                            style={{
                              backgroundColor: colors.primary,
                              color: colors.background
                            }}
                          >
                            {testing[provider.name] && (
                              <svg 
                                className="animate-spin h-3 w-3" 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24"
                              >
                                <circle 
                                  className="opacity-25" 
                                  cx="12" 
                                  cy="12" 
                                  r="10" 
                                  stroke="currentColor" 
                                  strokeWidth="4"
                                />
                                <path 
                                  className="opacity-75" 
                                  fill="currentColor" 
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            )}
                            <span>{testing[provider.name] ? 'Test...' : 'Test'}</span>
                          </button>
                        </form>
                      )}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

             {activeTab === 'strategy' && (
         <div className="space-y-4">
           <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
             Stratégie d'utilisation des Providers
           </h3>
           
           {strategyLoading ? (
             <div className="flex items-center justify-center p-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }}></div>
               <span className="ml-2" style={{ color: colors.textSecondary }}>Chargement...</span>
             </div>
           ) : (
             <div className="space-y-4">
               {/* Configuration des priorités (visible pour tous les modes) */}
               <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                 <h4 className="font-medium mb-3" style={{ color: colors.text }}>
                   🎯 Ordre de priorité des providers
                 </h4>
                 <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                   Définissez l'ordre de priorité (1 = plus haute priorité). 
                   <strong> Échange automatique :</strong> Si vous changez une priorité, les autres s'échangent automatiquement.
                 </p>
                 
                 <div className="space-y-2">
                   {providers.map((provider, index) => {
                     const isActive = (provider.status === 'valid' || provider.is_functional || validKeys[provider.name]);
                     const currentPriority = priorities[provider.name] || 1;
                     const activeProviders = getActiveProvidersByPriority();
                     
                     return (
                       <div key={provider.name} className="flex items-center justify-between p-2 rounded border" style={{ borderColor: colors.border }}>
                         <div className="flex items-center space-x-2">
                           <span className="text-lg">{getProviderIcon(provider.name)}</span>
                           <span className="text-sm font-medium" style={{ color: colors.text }}>
                             {getProviderDisplayName(provider.name)}
                           </span>
                           <span className="text-xs px-2 py-1 rounded" style={{ 
                             backgroundColor: getProviderStatusColor(provider),
                             color: 'white'
                           }}>
                             {getProviderStatus(provider)}
                           </span>
                         </div>
                         <div className="flex items-center space-x-2">
                           {/* Bouton d'activation/désactivation déplacé ici */}
                           <button
                             onClick={() => handleToggleProvider(provider.name)}
                             className="px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                             style={{
                               backgroundColor: isProviderActive(provider) ? '#ef4444' : '#10b981',
                               color: 'white'
                             }}
                             title={
                               isProviderActive(provider) ? 
                               "Désactiver le provider" : 
                               canProviderBeActivated(provider) ? "Activer le provider" : "Clé API requise et testée pour activer"
                             }
                             disabled={!canProviderBeActivated(provider)}
                           >
                             {isProviderActive(provider) ? 'Désactiver' : 'Activer'}
                           </button>
                         </div>
                         <div className="flex items-center space-x-2">
                           <span className="text-xs" style={{ color: colors.textSecondary }}>Priorité:</span>
                           <select
                             value={currentPriority}
                             onChange={(e) => handlePriorityChange(provider.name, parseInt(e.target.value))}
                             className="px-2 py-1 rounded border text-xs"
                             disabled={!isActive}
                             style={{
                               backgroundColor: isActive ? colors.background : '#374151',
                               borderColor: isActive ? colors.border : '#4b5563',
                               color: isActive ? colors.text : '#6b7280',
                               opacity: isActive ? 1 : 0.5
                             }}
                           >
                             {Array.from({ length: activeProviders.length }, (_, i) => i + 1).map(priority => (
                               <option key={priority} value={priority}>
                                 {priority}
                               </option>
                             ))}
                           </select>
                         </div>
                       </div>
                     );
                   })}
                 </div>
                 
                 {/* Informations sur l'échange automatique */}
                 <div className="mt-3 p-2 rounded bg-blue-50 border border-blue-200">
                   <p className="text-xs text-blue-800">
                     <strong>💡 Échange automatique :</strong> Si vous changez la priorité 1 en 2, 
                     le provider qui avait la priorité 2 devient automatiquement priorité 1.
                   </p>
                 </div>
               </div>
             </div>
           )}
         </div>
       )}

      {activeTab === 'metrics' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
            Métriques d'utilisation
          </h3>
          
          {statsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }}></div>
              <span className="ml-2" style={{ color: colors.textSecondary }}>Chargement des statistiques...</span>
            </div>
          ) : analysisStats ? (
            <div className="space-y-6">
              {/* Cartes de métriques principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Analyses totales"
                  value={analysisStats.total || 0}
                  icon={DocumentTextIcon}
                  color={colors.text}
                />
                <MetricCard
                  title="Terminées"
                  value={analysisStats.completed || 0}
                  icon={CheckCircleIcon}
                  color="#10b981"
                />
                <MetricCard
                  title="Échecs"
                  value={analysisStats.failed || 0}
                  icon={ExclamationTriangleIcon}
                  color="#ef4444"
                />
                <MetricCard
                  title="En cours"
                  value={analysisStats.pending || 0}
                  icon={ClockIcon}
                  color={colors.primary}
                />
              </div>

              {/* Statistiques détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Taux de réussite */}
                <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <h4 className="font-medium mb-3" style={{ color: colors.text }}>Taux de réussite</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: colors.primary }}>
                      {analysisStats.total > 0 ? Math.round((analysisStats.completed / analysisStats.total) * 100) : 0}%
                    </div>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      {analysisStats.completed || 0} / {analysisStats.total || 0} analyses
                    </p>
                  </div>
                </div>

                {/* Répartition par statut */}
                <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <h4 className="font-medium mb-3" style={{ color: colors.text }}>Répartition par statut</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>Terminées</span>
                      <span className="font-medium" style={{ color: "#10b981" }}>{analysisStats.completed || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>En cours</span>
                      <span className="font-medium" style={{ color: colors.primary }}>{analysisStats.pending || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.textSecondary }}>Échecs</span>
                      <span className="font-medium" style={{ color: "#ef4444" }}>{analysisStats.failed || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4" style={{ color: colors.textSecondary }} />
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Aucune donnée de statistiques disponible
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ConfigWindow: React.FC<ConfigWindowProps> = ({ onClose, onMinimize }) => {
  const { colors } = useColors();

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
          <div>
            <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
              Configuration IA
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Gérez vos providers IA et leurs paramètres
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              style={{ color: colors.textSecondary }}
              title="Réduire"
            >
              <MinusIcon className="h-5 w-5" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              style={{ color: colors.textSecondary }}
              title="Fermer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Contenu */}
      <ConfigContent />
    </div>
  );
};

export default ConfigWindow;
