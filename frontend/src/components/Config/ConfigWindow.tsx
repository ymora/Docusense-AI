import React, { useState, useEffect } from 'react';
import { MinusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import ConfigService from '../../services/configService';

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
  const [hasLoaded, setHasLoaded] = useState(false);

  // Charger les providers une seule fois au démarrage
  useEffect(() => {
    if (!hasLoaded) {
      loadProviders();
      setHasLoaded(true);
    }
  }, [hasLoaded]);

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
          valid[provider.name] = provider.status === 'valid';
        }
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
    const apiKey = apiKeys[provider];
    if (!apiKey?.trim()) {
      alert('Veuillez entrer une clé API pour tester');
      return;
    }

    if (testing[provider]) return;
    
    setTesting(prev => ({ ...prev, [provider]: true }));
    
    try {
      const result = await ConfigService.testProvider(provider, apiKey);
      if (result.success) {
        // Sauvegarder la clé si le test réussit
        await ConfigService.saveAPIKey(provider, apiKey);
        // Marquer la clé comme valide
        setValidKeys(prev => ({ ...prev, [provider]: true }));
        alert(`✅ Test réussi pour ${provider}`);
        // Recharger les providers pour mettre à jour l'état
        await loadProviders();
      } else {
        // Marquer la clé comme invalide
        setValidKeys(prev => ({ ...prev, [provider]: false }));
        alert(`❌ Test échoué pour ${provider}: ${result.message}`);
      }
    } catch (error) {
      console.error(`Erreur test ${provider}:`, error);
      // Marquer la clé comme invalide en cas d'erreur
      setValidKeys(prev => ({ ...prev, [provider]: false }));
      alert(`❌ Erreur lors du test de ${provider}`);
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
    if (validKeys[provider]) return '🔑'; // Clé verte (validée)
    if (apiKeys[provider]) return '🔑'; // Clé normale (non testée)
    return '🔑'; // Clé vide
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

  // Obtenir le statut d'un provider
  const getProviderStatus = (provider: any) => {
    if (provider.api_key) {
      return provider.status === 'valid' ? '✅ Valide' : '❌ Invalide';
    }
    return 'Non configuré';
  };

  // États pour la stratégie
  const [strategy, setStrategy] = useState<string>('priority');
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [strategyLoading, setStrategyLoading] = useState(false);

  // Charger la stratégie et les priorités
  useEffect(() => {
    if (activeTab === 'strategy' && !strategyLoading) {
      loadStrategy();
    }
  }, [activeTab]);

  const loadStrategy = async () => {
    try {
      setStrategyLoading(true);
      const response = await ConfigService.getAIProviders();
      
      // Charger la stratégie actuelle
      setStrategy(response.strategy || 'priority');
      
      // Charger les priorités des providers
      const providerPriorities: Record<string, number> = {};
      response.providers?.forEach((provider: any) => {
        if (provider.priority) {
          providerPriorities[provider.name] = provider.priority;
        }
      });
      setPriorities(providerPriorities);
    } catch (error) {
      console.error('Erreur chargement stratégie:', error);
    } finally {
      setStrategyLoading(false);
    }
  };

  // Changer la stratégie
  const handleStrategyChange = async (newStrategy: string) => {
    try {
      setStrategyLoading(true);
      await ConfigService.setStrategy(newStrategy);
      setStrategy(newStrategy);
      alert(`✅ Stratégie mise à jour: ${newStrategy}`);
    } catch (error) {
      console.error('Erreur changement stratégie:', error);
      alert('❌ Erreur lors du changement de stratégie');
    } finally {
      setStrategyLoading(false);
    }
  };

  // Changer la priorité d'un provider
  const handlePriorityChange = async (provider: string, newPriority: number) => {
    try {
      setStrategyLoading(true);
      await ConfigService.setProviderPriority(provider, newPriority);
      setPriorities(prev => ({ ...prev, [provider]: newPriority }));
      alert(`✅ Priorité mise à jour pour ${provider}: ${newPriority}`);
    } catch (error) {
      console.error(`Erreur changement priorité ${provider}:`, error);
      alert(`❌ Erreur lors du changement de priorité pour ${provider}`);
    } finally {
      setStrategyLoading(false);
    }
  };

  // Obtenir les providers triés par priorité
  const getProvidersByPriority = () => {
    return providers
      .filter(provider => priorities[provider.name])
      .sort((a, b) => (priorities[a.name] || 999) - (priorities[b.name] || 999));
  };

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
                  {/* Ligne 1: Nom du provider et statut */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getProviderIcon(provider.name)}</span>
                      <div>
                        <h4 className="font-medium text-sm" style={{ color: colors.text }}>
                          {getProviderDisplayName(provider.name)}
                        </h4>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {getProviderStatus(provider)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ligne 2: Clé API et bouton test */}
                  <div className="flex items-center space-x-2">
                    <span 
                      className="text-lg"
                      style={{ 
                        color: validKeys[provider.name] ? '#10b981' : colors.textSecondary 
                      }}
                      title={validKeys[provider.name] ? 'Clé validée' : 'Clé non validée'}
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
                      onClick={() => handleTestProvider(provider.name)}
                      disabled={testing[provider.name] || !apiKeys[provider.name]?.trim()}
                      className="px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                      style={{
                        backgroundColor: colors.primary,
                        color: colors.background
                      }}
                    >
                      {testing[provider.name] ? 'Test...' : 'Test'}
                    </button>
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
              {/* Sélection de la stratégie */}
              <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <h4 className="font-medium mb-3" style={{ color: colors.text }}>Stratégie de sélection</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="strategy"
                      value="priority"
                      checked={strategy === 'priority'}
                      onChange={(e) => handleStrategyChange(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm" style={{ color: colors.text }}>
                      <strong>Priorité</strong> - Utilise les providers dans l'ordre de priorité défini
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="strategy"
                      value="round_robin"
                      checked={strategy === 'round_robin'}
                      onChange={(e) => handleStrategyChange(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm" style={{ color: colors.text }}>
                      <strong>Round Robin</strong> - Alterne entre les providers disponibles
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="strategy"
                      value="random"
                      checked={strategy === 'random'}
                      onChange={(e) => handleStrategyChange(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm" style={{ color: colors.text }}>
                      <strong>Aléatoire</strong> - Sélectionne un provider au hasard
                    </span>
                  </label>
                </div>
              </div>

              {/* Configuration des priorités */}
              <div className="p-4 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <h4 className="font-medium mb-3" style={{ color: colors.text }}>Ordre de priorité des providers</h4>
                <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
                  Définissez l'ordre de priorité (1 = plus haute priorité)
                </p>
                
                <div className="space-y-2">
                  {getProvidersByPriority().map((provider, index) => (
                    <div key={provider.name} className="flex items-center justify-between p-2 rounded border" style={{ borderColor: colors.border }}>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getProviderIcon(provider.name)}</span>
                        <span className="text-sm font-medium" style={{ color: colors.text }}>
                          {getProviderDisplayName(provider.name)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs" style={{ color: colors.textSecondary }}>Priorité:</span>
                        <select
                          value={priorities[provider.name] || 1}
                          onChange={(e) => handlePriorityChange(provider.name, parseInt(e.target.value))}
                          className="px-2 py-1 rounded border text-xs"
                          style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text
                          }}
                        >
                          {[1, 2, 3, 4].map(priority => (
                            <option key={priority} value={priority}>
                              {priority}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informations sur la stratégie */}
              <div className="p-3 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <h4 className="font-medium mb-2" style={{ color: colors.text }}>Informations</h4>
                <div className="text-xs space-y-1" style={{ color: colors.textSecondary }}>
                  <p>• <strong>Priorité</strong> : Le système utilise toujours le provider de plus haute priorité disponible</p>
                  <p>• <strong>Round Robin</strong> : Alterne équitablement entre tous les providers fonctionnels</p>
                  <p>• <strong>Aléatoire</strong> : Sélectionne un provider au hasard à chaque requête</p>
                  <p>• Seuls les providers avec des clés API valides sont utilisés</p>
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
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Les métriques sont affichées dans le panneau principal.
          </p>
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
