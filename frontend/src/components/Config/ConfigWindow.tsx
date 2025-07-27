import React, { useState, useEffect } from 'react';
import { MinusIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  const [activeTab, setActiveTab] = useState<'providers' | 'strategy' | 'metrics'>('providers');
  const [providers, setProviders] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [strategy, setStrategy] = useState<string>('');
  const [priority, setPriority] = useState<Record<string, number>>({});
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Charger les providers et clés API
  const loadProviders = async () => {
    try {
      const response = await fetch('/api/config/ai/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
        
        // Charger les clés API existantes
        const keys: Record<string, string> = {};
        data.providers?.forEach((p: any) => {
          if (p.api_key) keys[p.name] = p.api_key;
        });
        setApiKeys(keys);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des providers:', error);
    }
  };

  // Charger la stratégie
  const loadStrategy = async () => {
    try {
      const response = await fetch('/api/config/ai/strategy');
      if (response.ok) {
        const data = await response.json();
        setStrategy(data.strategy || 'priority');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la stratégie:', error);
    }
  };

  // Charger les priorités
  const loadPriority = async () => {
    try {
      const response = await fetch('/api/config/ai/priority');
      if (response.ok) {
        const data = await response.json();
        setPriority(data.priority || {});
      }
    } catch (error) {
      console.error('Erreur lors du chargement des priorités:', error);
    }
  };

  // Charger les métriques
  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/config/ai/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || {});
      }
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
    }
  };

  // Gérer le changement de clé API
  const handleApiKeyChange = async (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    
    try {
      await fetch('/api/config/ai/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, api_key: value })
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la clé API:', error);
    }
  };

  // Tester un provider
  const handleTestProvider = async (provider: string) => {
    setTesting(prev => ({ ...prev, [provider]: true }));
    
    try {
      const response = await fetch('/api/config/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      
      if (response.ok) {
        alert(`${provider} : Connexion réussie !`);
      } else {
        alert(`${provider} : Échec de la connexion`);
      }
    } catch (error) {
      alert(`${provider} : Erreur de connexion`);
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  // Gérer le changement de stratégie
  const handleStrategyChange = async (newStrategy: string) => {
    setStrategy(newStrategy);
    
    try {
      await fetch('/api/config/ai/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: newStrategy })
      });
      
      // Mettre à jour les priorités selon la stratégie
      await updatePrioritiesForStrategy();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la stratégie:', error);
    }
  };

  // Mettre à jour les priorités selon la stratégie
  const updatePrioritiesForStrategy = async () => {
    try {
      const response = await fetch('/api/config/ai/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPriority(data.priority || {});
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des priorités:', error);
    }
  };

  // Gérer le changement de priorité
  const handlePriorityChange = async (provider: string, newPriority: number) => {
    const newPriorityMap = { ...priority, [provider]: newPriority };
    setPriority(newPriorityMap);
    
    try {
      await fetch('/api/config/ai/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriorityMap })
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la priorité:', error);
    }
  };

  // Obtenir l'icône d'un provider
  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'openai': return '🤖';
      case 'claude': return '🧠';
      case 'mistral': return '🌪️';
      case 'ollama': return '🐳';
      default: return '❓';
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

  // Obtenir le statut d'un provider
  const getProviderStatus = (provider: any) => {
    if (provider.api_key && apiKeys[provider.name]) {
      return 'connected';
    } else if (apiKeys[provider.name]) {
      return 'configured';
    }
    return 'not_configured';
  };

  // Obtenir le nombre de providers actifs
  const getActiveProvidersCount = () => {
    return providers.filter(p => getProviderStatus(p) === 'connected').length;
  };

  // Vérifier si un provider est actif
  const isProviderActive = (provider: any) => {
    return priority[provider.name] > 0;
  };

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadProviders(),
        loadStrategy(),
        loadPriority(),
        loadMetrics()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);



  return (
    <div className={isStandalone ? "h-full" : "flex-1 overflow-y-auto p-2"}>
      {/* Tabs (compact) */}
      <div className="flex border-b border-slate-600 bg-slate-700 mb-4">
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-2 py-1 text-xs font-medium transition-colors ${
            activeTab === 'providers'
              ? 'bg-slate-800 text-slate-100 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Providers
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`px-2 py-1 text-xs font-medium transition-colors ${
            activeTab === 'strategy'
              ? 'bg-slate-800 text-slate-100 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Stratégie
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-2 py-1 text-xs font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'bg-slate-800 text-slate-100 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          Métriques
        </button>
      </div>

      {/* Contenu compact */}
      <div className="space-y-2">
        {activeTab === 'providers' && (
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4 text-xs text-slate-400">Chargement...</div>
            ) : (
              providers.map((provider) => {
                const status = getProviderStatus(provider);
                const isActive = isProviderActive(provider);
                const currentPriority = priority[provider.name] || 0;
                return (
                  <div key={provider.name} className="bg-slate-700 rounded-lg p-2 border border-slate-600 flex flex-col text-xs mb-1">
                    {/* Ligne 1 : icône, nom, statut */}
                    <div className="flex items-center mb-1">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-white text-base mr-2 ${getProviderColor(provider.name)}`}>{getProviderIcon(provider.name)}</span>
                      <span className="font-medium capitalize mr-2 truncate" style={{ fontSize: '13px' }}>{provider.name}</span>
                      <span className={`w-2 h-2 rounded-full ml-1 ${
                        status === 'connected' ? 'bg-green-500' :
                          status === 'configured' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} title={status === 'connected' ? 'Connecté' : status === 'configured' ? 'Clé configurée' : 'Non configuré'}></span>
                      {currentPriority === 1 && isActive && (
                        <span className="text-green-400 text-xs ml-1" title="Provider principal">🥇</span>
                      )}
                    </div>
                    {/* Ligne 2 : champ clé API compact */}
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-slate-400 text-xs">🔑</span>
                      <input
                        type="password"
                        value={apiKeys[provider.name] || ''}
                        onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                        placeholder="Clé API"
                        className="flex-1 bg-slate-600 text-white text-xs px-2 py-1 rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                        style={{ fontSize: '12px' }}
                      />
                      <button
                        onClick={() => handleTestProvider(provider.name)}
                        disabled={testing[provider.name]}
                        className="p-1 text-blue-500 hover:text-blue-700 disabled:text-slate-500"
                        title="Tester la clé"
                        tabIndex={-1}
                      >
                        {testing[provider.name] ? (
                          <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span className="text-xs">✓</span>
                        )}
                      </button>
                    </div>
                    {/* Ligne 3 : priorité */}
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400 text-xs">🎯</span>
                      <select
                        value={currentPriority}
                        onChange={(e) => handlePriorityChange(provider.name, parseInt(e.target.value))}
                        className="flex-1 bg-slate-600 text-white text-xs px-2 py-1 rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
                        style={{ fontSize: '12px' }}
                      >
                        <option value={0}>Désactivé</option>
                        <option value={1}>Priorité 1</option>
                        <option value={2}>Priorité 2</option>
                        <option value={3}>Priorité 3</option>
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-4">
            <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
              <h4 className="text-sm font-medium text-slate-200 mb-2">Stratégie de sélection</h4>
              <select
                value={strategy}
                onChange={(e) => handleStrategyChange(e.target.value)}
                className="w-full bg-slate-600 text-white text-sm px-3 py-2 rounded border border-slate-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="priority">Priority (Ordre de priorité)</option>
                <option value="cost">Cost (Coût le plus bas)</option>
                <option value="performance">Performance (Meilleure performance)</option>
                <option value="fallback">Fallback (Avec repli)</option>
                <option value="quality">Quality (Meilleure qualité)</option>
                <option value="speed">Speed (Plus rapide)</option>
              </select>
              <p className="text-xs text-slate-400 mt-2">
                {strategy === 'priority' && 'Utilise les providers dans l\'ordre de priorité défini'}
                {strategy === 'cost' && 'Sélectionne le provider avec le coût le plus bas'}
                {strategy === 'performance' && 'Sélectionne le provider avec les meilleures performances'}
                {strategy === 'fallback' && 'Utilise le provider principal avec repli automatique'}
                {strategy === 'quality' && 'Sélectionne le provider avec la meilleure qualité de réponse'}
                {strategy === 'speed' && 'Sélectionne le provider le plus rapide'}
              </p>
            </div>

            <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
              <h4 className="text-sm font-medium text-slate-200 mb-2">Providers actifs</h4>
              <p className="text-xs text-slate-400">
                {getActiveProvidersCount()} provider(s) configuré(s) sur {providers.length}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
              <h4 className="text-sm font-medium text-slate-200 mb-2">Statistiques d'utilisation</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Requêtes totales:</span>
                  <span className="text-slate-200">{metrics.total_requests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requêtes réussies:</span>
                  <span className="text-slate-200">{metrics.successful_requests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taux de succès:</span>
                  <span className="text-slate-200">
                    {metrics.total_requests ? ((metrics.successful_requests || 0) / metrics.total_requests * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
              <h4 className="text-sm font-medium text-slate-200 mb-2">Coûts estimés</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Coût total:</span>
                  <span className="text-slate-200">${metrics.total_cost || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coût moyen par requête:</span>
                  <span className="text-slate-200">
                    ${metrics.total_requests ? ((metrics.total_cost || 0) / metrics.total_requests).toFixed(4) : 0}
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
  return (
    <div
      className="fixed right-0 top-0 h-full z-40 bg-slate-800 border-l border-slate-700 shadow-xl flex flex-col"
      style={{ width: 360, minWidth: 260, maxWidth: 400 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-slate-700 border-b border-slate-600">
        <h3 className="text-xs font-semibold" style={{ color: 'var(--config-color)' }}>Configuration IA</h3>
        <div className="flex items-center space-x-1">
          {onMinimize && (
            <button onClick={onMinimize} className="p-1 text-slate-400 hover:text-slate-100 transition-colors" title="Minimiser">
              <MinusIcon className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-red-400 transition-colors" title="Fermer">
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
