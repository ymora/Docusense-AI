import React, { useState, useEffect } from 'react';
import { MinusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useAIConfig } from '../../hooks/useAIConfig';

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
  
  const { colors, colorMode } = useColors();
  const [activeTab, setActiveTab] = useState<'providers' | 'strategy' | 'metrics'>('providers');
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [localApiKeys, setLocalApiKeys] = useState<Record<string, string>>({});

  // Utiliser le hook personnalisé pour la configuration IA
  const {
    providers,
    providerStatuses,
    apiKeys,
    priorities,
    strategy,
    metrics,
    loading,
    error,
    saveAPIKey,
    testProvider,
    setPriority,
    setStrategy,
    getActiveValidProvidersCount,
    isProviderActive,
    getProviderStatus,
    validateAndFixPriorities,
    resetPriorities
  } = useAIConfig();

  // Synchroniser l'état local avec les données du hook
  useEffect(() => {
    setLocalApiKeys(apiKeys);
  }, [apiKeys]);

  // Gérer le changement de clé API
  const handleApiKeyChange = async (provider: string, value: string) => {
    // Mettre à jour l'état local immédiatement pour permettre la saisie
    setLocalApiKeys(prev => ({ ...prev, [provider]: value }));
    
    // Si la clé est vide, ne pas faire de sauvegarde
    if (!value.trim()) {
      return;
    }

    // Sauvegarder la clé API en arrière-plan
    try {
      await saveAPIKey(provider, value);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de la clé API pour ${provider}:`, error);
    }
  };

  // Gérer le test d'un provider
  const handleTestProvider = async (provider: string) => {
    setTesting(prev => ({ ...prev, [provider]: true }));
    
    try {
      const result = await testProvider(provider);
      
    } catch (error) {
      console.error(`Erreur lors du test de ${provider}:`, error);
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  // Gérer le changement de stratégie
  const handleStrategyChange = async (newStrategy: string) => {
    await setStrategy(newStrategy);
  };

  // Gérer l'activation/désactivation d'un provider
  const handleToggleProvider = async (providerName: string) => {
    const currentPriority = priorities[providerName] || 0;
    const isCurrentlyActive = currentPriority > 0;
    const providerStatus = getProviderStatus(providerName);
    
    // Vérifier que le provider est valide avant activation
    if (!isCurrentlyActive && providerStatus?.status !== 'valid') {
      console.warn('Le provider doit avoir une clé API valide pour être activé');
      return;
    }
    
    if (isCurrentlyActive) {
      // Désactiver le provider
      await setPriority(providerName, 0);
    } else {
      // Activer le provider avec la priorité la plus basse disponible
      const activeProviders = providers.filter(p => (priorities[p.name] || 0) > 0);
      const maxPriority = Math.max(...activeProviders.map(p => priorities[p.name] || 0), 0);
      const newPriority = maxPriority + 1;
      await setPriority(providerName, newPriority);
    }
  };

  // Obtenir l'icône d'un provider
  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'openai': return '🔵'; // OpenAI
      case 'claude': return '🟠'; // Claude (Anthropic)
      case 'mistral': return '🟣'; // Mistral AI
      case 'ollama': return '🐙'; // Ollama
      default: return '❓';
    }
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

  // Obtenir la couleur d'un provider
  const getProviderColor = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'openai': return 'bg-green-500';
      case 'claude': return 'bg-orange-500';
      case 'mistral': return 'bg-purple-500';
      case 'ollama': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={isStandalone ? 'h-full' : 'flex-1 overflow-y-auto p-2'}>
      {/* Tabs avec couleurs centralisées */}
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
            borderBottomColor: activeTab === 'providers' ? colors.config : 'transparent',
          }}
        >
          Providers
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
            borderBottomColor: activeTab === 'strategy' ? colors.config : 'transparent',
          }}
        >
          Stratégie
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
            borderBottomColor: activeTab === 'metrics' ? colors.config : 'transparent',
          }}
        >
          Métriques
        </button>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div
          className="rounded-lg p-2 mb-2 text-xs"
          style={{
            backgroundColor: colors.error + '20',
            border: `1px solid ${colors.error}`,
            color: colors.error
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Contenu compact avec couleurs centralisées */}
      <div className="space-y-2">
        {activeTab === 'providers' && (
          <div className="space-y-2">
            {loading ? (
              <div
                className="text-center py-4 text-xs"
                style={{ color: colors.textSecondary }}
              >
                Chargement...
              </div>
            ) : (
              <>
                {/* Résumé des providers */}
                <div
                  className="rounded-lg p-2 border text-xs"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span style={{ color: colors.textSecondary }}>
                      Providers actifs et valides:
                    </span>
                    <span style={{ color: colors.text }}>
                      {getActiveValidProvidersCount()} / {providers.length}
                    </span>
                  </div>
                </div>

                {/* Liste des providers */}
                {providers.map((provider) => {
                  const status = getProviderStatus(provider.name);
                  const isActive = isProviderActive(provider);
                  
                  return (
                    <div
                      key={provider.name}
                      className="rounded-lg p-3 border flex flex-col text-xs mb-2"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: status?.status === 'testing' ? colors.config : colors.border,
                      }}
                    >
                      {/* En-tête du provider */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getProviderIcon(provider.name)}</span>
                          <div>
                            <div className="font-medium" style={{ color: colors.text }}>
                              {getProviderDisplayName(provider.name)}
                            </div>
                            <div className="text-xs" style={{ color: colors.textSecondary }}>
                              {status?.status === 'valid' ? '✅ Clé API valide' : 
                               status?.status === 'invalid' ? '❌ Clé API invalide' : 
                               status?.status === 'testing' ? '🔄 Test en cours...' : '⚪ Aucune clé API'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleProvider(provider.name)}
                          disabled={status?.status === 'testing'}
                          className="px-3 py-1 text-xs font-medium rounded border transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: isActive ? colors.error : colors.config,
                            color: 'white',
                            borderColor: isActive ? colors.error : colors.config,
                          }}
                          title={isActive ? "Désactiver" : "Activer"}
                        >
                          {isActive ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>

                      {/* Champ clé API */}
                      <div className="mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 relative">
                            <input
                              type="password"
                              value={localApiKeys[provider.name] || ''}
                              onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                              placeholder="Entrez votre clé API"
                              className="w-full text-xs px-3 py-2 rounded border focus:outline-none"
                              style={{
                                backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
                                color: colors.text,
                                borderColor: colors.border,
                                fontSize: '12px',
                              }}
                            />
                          </div>
                          <button
                            onClick={() => handleTestProvider(provider.name)}
                            disabled={testing[provider.name] || !localApiKeys[provider.name]}
                            className="px-3 py-2 text-xs font-medium rounded border transition-colors disabled:opacity-50"
                            style={{
                              backgroundColor: testing[provider.name] ? colors.textSecondary : colors.config,
                              color: 'white',
                              borderColor: colors.config,
                            }}
                            title="Tester la clé"
                          >
                            {testing[provider.name] ? (
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 border border-t-transparent rounded-full animate-spin mr-1"
                                  style={{
                                    borderColor: 'white',
                                    borderTopColor: 'transparent',
                                  }}
                                ></div>
                                Test...
                              </div>
                            ) : (
                              'Tester'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-4">
            <div
              className="rounded-lg p-3 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <h4
                className="text-sm font-medium mb-3"
                style={{ color: colors.text }}
              >
                Stratégie de sélection des providers
              </h4>
              <select
                value={strategy}
                onChange={(e) => handleStrategyChange(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded border focus:outline-none mb-3"
                style={{
                  backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
                  color: colors.text,
                  borderColor: colors.border,
                }}
              >
                <option value="priority">Ordre de priorité</option>
                <option value="fallback">Avec repli automatique</option>
                <option value="cost">Coût le plus bas</option>
                <option value="speed">Plus rapide</option>
              </select>
              
              <div
                className="text-xs p-3 rounded"
                style={{
                  backgroundColor: colorMode === 'dark' ? '#1e293b' : '#f1f5f9',
                  color: colors.textSecondary,
                }}
              >
                <div className="font-medium mb-2" style={{ color: colors.text }}>
                  {strategy === 'priority' && '🔄 Ordre de priorité'}
                  {strategy === 'fallback' && '🛡️ Avec repli automatique'}
                  {strategy === 'cost' && '💰 Coût le plus bas'}
                  {strategy === 'speed' && '⚡ Plus rapide'}
                </div>
                <p>
                  {strategy === 'priority' && 'Utilise les providers dans l\'ordre de priorité que vous avez défini. Si le premier échoue, passe au suivant.'}
                  {strategy === 'fallback' && 'Utilise le provider principal, mais bascule automatiquement vers un autre si celui-ci échoue ou est indisponible.'}
                  {strategy === 'cost' && 'Sélectionne automatiquement le provider avec le coût le plus bas pour chaque requête.'}
                  {strategy === 'speed' && 'Sélectionne automatiquement le provider le plus rapide en fonction des performances récentes.'}
                </p>
              </div>
            </div>

            {/* Section des priorités des providers */}
            <div
              className="rounded-lg p-3 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <h4
                className="text-sm font-medium mb-3"
                style={{ color: colors.text }}
              >
                Priorités des providers
              </h4>
              
              {/* Liste des providers avec leurs priorités */}
              <div className="space-y-2">
                {providers.map((provider) => {
                  const status = getProviderStatus(provider.name);
                  const currentPriority = priorities[provider.name] || 0;
                  const isActive = currentPriority > 0;
                  
                  return (
                    <div
                      key={provider.name}
                      className="flex items-center justify-between p-2 rounded border"
                      style={{
                        backgroundColor: colorMode === 'dark' ? '#1e293b' : '#f8fafc',
                        borderColor: colors.border,
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getProviderIcon(provider.name)}</span>
                        <div>
                          <div className="font-medium text-xs" style={{ color: colors.text }}>
                            {getProviderDisplayName(provider.name)}
                          </div>
                          <div className="text-xs" style={{ color: colors.textSecondary }}>
                            {status?.status === 'valid' ? '✅ Clé API valide' : 
                             status?.status === 'invalid' ? '❌ Clé API invalide' : 
                             status?.status === 'testing' ? '🔄 Test en cours...' : '⚪ Aucune clé API'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <select
                          value={currentPriority}
                          onChange={(e) => setPriority(provider.name, parseInt(e.target.value))}
                          disabled={status?.status !== 'valid'}
                          className="text-xs px-2 py-1 rounded border focus:outline-none"
                          style={{
                            backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
                            color: status?.status === 'valid' ? colors.text : colors.textSecondary,
                            borderColor: colors.border,
                          }}
                        >
                          <option value={0}>Désactivé</option>
                          <option value={1}>Priorité 1</option>
                          <option value={2}>Priorité 2</option>
                          <option value={3}>Priorité 3</option>
                        </select>
                        
                        {isActive && (
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor: colors.config,
                              color: 'white',
                            }}
                          >
                            {currentPriority === 1 ? 'Principal' :
                             currentPriority === 2 ? 'Secondaire' :
                             currentPriority === 3 ? 'Tertiaire' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Actions pour les priorités */}
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={async () => {
                    const result = await validateAndFixPriorities();
            
                  }}
                  className="px-3 py-1 text-xs font-medium rounded border transition-colors"
                  style={{
                    backgroundColor: colors.config,
                    color: 'white',
                    borderColor: colors.config,
                  }}
                >
                  Valider les priorités
                </button>
                
                <button
                  onClick={async () => {
                    const result = await resetPriorities();
            
                  }}
                  className="px-3 py-1 text-xs font-medium rounded border transition-colors"
                  style={{
                    backgroundColor: colors.error,
                    color: 'white',
                    borderColor: colors.error,
                  }}
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            <div
              className="rounded-lg p-3 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <h4
                className="text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                État des providers
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Providers valides:</span>
                  <span style={{ color: colors.success }}>
                    {providers.filter(p => getProviderStatus(p.name)?.status === 'valid').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Providers actifs:</span>
                  <span style={{ color: colors.text }}>
                    {getActiveValidProvidersCount()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Total configuré:</span>
                  <span style={{ color: colors.text }}>
                    {providers.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div
              className="rounded-lg p-3 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <h4
                className="text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Statistiques d'utilisation
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Requêtes totales:</span>
                  <span style={{ color: colors.text }}>{(metrics as any).total_requests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Requêtes réussies:</span>
                  <span style={{ color: colors.text }}>{(metrics as any).successful_requests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Taux de succès:</span>
                  <span style={{ color: colors.text }}>
                    {(metrics as any).total_requests ? (((metrics as any).successful_requests || 0) / (metrics as any).total_requests * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg p-3 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <h4
                className="text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Coûts estimés
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Coût total:</span>
                  <span style={{ color: colors.text }}>${(metrics as any).total_cost || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Coût moyen par requête:</span>
                  <span style={{ color: colors.text }}>
                    ${(metrics as any).total_requests ? (((metrics as any).total_cost || 0) / (metrics as any).total_requests).toFixed(4) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant original avec header pour utilisation standalone
const ConfigWindow: React.FC<ConfigWindowProps> = ({ onClose, onMinimize }) => {
  const { colors } = useColors();

  return (
    <div
      className="fixed right-0 top-0 h-full z-40 shadow-xl flex flex-col"
      style={{
        width: 360,
        minWidth: 260,
        maxWidth: 400,
        backgroundColor: colors.surface,
        borderLeft: `1px solid ${colors.border}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-2 border-b"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <h3
          className="text-xs font-semibold"
          style={{ color: colors.config }}
        >
          Configuration IA
        </h3>
        <div className="flex items-center space-x-1">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1 transition-colors"
              style={{
                color: colors.textSecondary,
              }}
              title="Minimiser"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 transition-colors"
              style={{
                color: colors.textSecondary,
              }}
              title="Fermer"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <ConfigContent onClose={onClose} onMinimize={onMinimize} />
    </div>
  );
};

export default ConfigWindow;
