import React, { useState, useEffect } from 'react';
import { MinusIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import ConfigService from '../../services/configService';
import { logService } from '../../services/logService';
import { useConfigStore } from '../../stores/configStore';

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
  const { aiProviders, loadAIProviders, refreshAIProviders, isInitialized } = useConfigStore();
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderState[]>([]);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Charger les providers depuis le store
  useEffect(() => {
    if (!isInitialized) {
      loadAIProviders();
    }
  }, [isInitialized, loadAIProviders]);

  // Mettre à jour les providers quand le store change
  useEffect(() => {
    console.log('🔄 ConfigWindow: aiProviders changé, longueur:', aiProviders.length);
    if (aiProviders.length > 0) {
      updateProviderStates(aiProviders);
    }
  }, [aiProviders]);

  const updateProviderStates = (aiProviders: any[]) => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Afficher les données reçues pour Mistral
      const mistralProvider = aiProviders.find((p: any) => p.name === 'mistral');
      if (mistralProvider) {
        console.log('🔍 Mistral dans ConfigWindow (depuis store):', {
          name: mistralProvider.name,
          is_active: mistralProvider.is_active,
          is_functional: mistralProvider.is_functional,
          status: mistralProvider.status,
          has_api_key: mistralProvider.has_api_key
        });
      }
      
             const providerStates: ProviderState[] = aiProviders.map((provider: any) => {
         let status: ProviderStatus = 'empty';
         let errorMessage: string | undefined;

         // Debug: Log pour chaque provider
         console.log(`🔍 Provider ${provider.name}:`, {
           is_functional: provider.is_functional,
           status: provider.status,
           has_api_key: provider.has_api_key,
           api_key: provider.api_key
         });

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
           console.log(`🔍 Logique pour ${provider.name}:`, {
             has_api_key: provider.has_api_key,
             is_functional: provider.is_functional,
             status: provider.status,
             condition1: !provider.api_key || provider.api_key.trim() === '',
             condition2: provider.is_functional && provider.status === 'valid',
             condition3: provider.is_functional,
             condition4: provider.has_api_key
           });
           
           if (!provider.has_api_key) {
             status = 'empty';
             console.log(`  → ${provider.name} → empty (pas de clé API)`);
           } else if (provider.is_functional && provider.status === 'valid') {
             status = 'active';
             console.log(`  → ${provider.name} → active (fonctionnel + valid)`);
           } else if (provider.is_functional) {
             status = 'functional';
             console.log(`  → ${provider.name} → functional (fonctionnel)`);
           } else if (provider.has_api_key) {
             // Si une clé API est configurée mais pas testée
             status = 'pending';
             console.log(`  → ${provider.name} → pending (clé API mais pas testé)`);
           } else {
             status = 'invalid';
             errorMessage = 'Clé API invalide ou service non accessible.';
             console.log(`  → ${provider.name} → invalid (échec)`);
           }
         }

        return {
          name: provider.name,
          status,
          apiKey: provider.api_key || '',
          priority: provider.priority || 0,
          isVisible: true,
          errorMessage
        };
      });

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
    setProviders(prev => prev.map(p =>
      p.name === providerName
        ? {
            ...p,
            apiKey: value,
            status: value.trim() === '' ? 'empty' : 'pending',
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

      let result;
      if (providerName.toLowerCase() === 'ollama') {
        // Test Ollama sans clé API
        result = await ConfigService.testProvider(providerName);
      } else {
        // Test avec la clé API fournie
        result = await ConfigService.testProvider(providerName, provider.apiKey);
      }

      if (result.success) {
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

        // Recalculer les priorités
        await recalculatePriorities();
      } else {
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
      } else {
        // Activer le provider
        await ConfigService.setProviderStatus(providerName, 'valid');
      }

             // Recharger les providers
       await refreshAIProviders();
       
       // Recalculer les priorités
       await recalculatePriorities();
    } catch (error) {
      logService.error(`Erreur toggle provider ${providerName}`, 'ConfigWindow', { error: error.message, provider: providerName });
      setError(`Erreur lors de l'activation/désactivation de ${getProviderDisplayName(providerName)}`);
    }
  };

  // Changer la priorité d'un provider
  const handlePriorityChange = async (providerName: string, newPriority: number) => {
    try {
      const provider = providers.find(p => p.name === providerName);
      if (!provider) return;

      const activeProviders = providers.filter(p => p.status === 'active');
      const currentPriority = provider.priority;
      
      // Vérifier s'il y a un conflit de priorité
      const existingProvider = activeProviders.find(p => p.name !== providerName && p.priority === newPriority);
      
      if (existingProvider) {
        // Échanger les priorités automatiquement
        await ConfigService.setProviderPriority(existingProvider.name, currentPriority);
        await ConfigService.setProviderPriority(providerName, newPriority);
      } else {
        // Pas de conflit, mise à jour simple
        await ConfigService.setProviderPriority(providerName, newPriority);
      }
      
      // Recharger les providers
      await refreshAIProviders();
    } catch (error) {
      logService.error(`Erreur changement priorité ${providerName}`, 'ConfigWindow', { error: error.message, provider: providerName });
      setError(`Erreur lors du changement de priorité de ${getProviderDisplayName(providerName)}`);
    }
  };

  // Recalculer les priorités pour les providers actifs
  const recalculatePriorities = async () => {
    try {
      const activeProviders = providers.filter(p => p.status === 'active');
      
      // Réassigner les priorités de 1 à N
      for (let i = 0; i < activeProviders.length; i++) {
        await ConfigService.setProviderPriority(activeProviders[i].name, i + 1);
      }
      
      // Recharger les providers
      await refreshAIProviders();
    } catch (error) {
      logService.error('Erreur recalcul priorités', 'ConfigWindow', { error: error.message });
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
      case 'openai': return '🔵';
      case 'claude': return '🟠';
      case 'mistral': return '🟣';
      case 'ollama': return '🐙';
      case 'gemini': return '🟢';
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
      case 'gemini': return 'Google Gemini';
      default: return providerName;
    }
  };

  // Obtenir le statut visuel d'un provider
  const getProviderStatusInfo = (provider: ProviderState) => {
    switch (provider.status) {
      case 'empty':
        return { 
          text: 'Non configuré', 
          color: '#6b7280',
          description: provider.name.toLowerCase() === 'ollama' 
            ? 'Ollama non testé' 
            : 'Aucune clé API saisie'
        };
      case 'pending':
        return { 
          text: '⏳ En attente', 
          color: '#f59e0b',
          description: 'Clé API saisie, prêt à tester'
        };
      case 'configured':
        return { 
          text: '🔑 Configuré', 
          color: '#3b82f6',
          description: 'Test réussi, clé API validée'
        };
      case 'invalid':
        return { 
          text: '❌ Échec', 
          color: '#ef4444',
          description: provider.errorMessage || 'Test échoué'
        };
      case 'functional':
        return { 
          text: '🟡 Fonctionnel', 
          color: '#f59e0b',
          description: 'Testé avec succès, prêt à activer'
        };
      case 'active':
        return { 
          text: '✅ Actif', 
          color: '#10b981',
          description: 'Provider actif et utilisable'
        };
      case 'testing':
        return { 
          text: '⏳ Test...', 
          color: '#3b82f6',
          description: 'Test en cours'
        };
      default:
        return { 
          text: 'Inconnu', 
          color: '#6b7280',
          description: 'Statut inconnu'
        };
    }
  };

  // Obtenir les providers actifs triés par priorité
  const getActiveProviders = () => {
    return providers
      .filter(provider => provider.status === 'active')
      .sort((a, b) => a.priority - b.priority);
  };

  const activeProviders = getActiveProviders();

  return (
    <div className={isStandalone ? 'h-full flex flex-col overflow-hidden' : 'flex-1 flex flex-col overflow-hidden'}>
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
              Configuration des Providers IA
            </h3>
            
            {error && (
              <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">⚠️</span>
                  <span className="text-sm text-red-700">{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
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
                  <h4 className="font-medium text-sm" style={{ color: colors.text }}>
                    🔑 Configuration et test des providers
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ borderColor: colors.border }}>
                      <thead>
                        <tr style={{ backgroundColor: colors.surface }}>
                          <th className="p-3 text-left text-xs font-medium border-b" style={{ color: colors.text, borderColor: colors.border }}>
                            Provider
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
                        {providers.map((provider) => {
                          const statusInfo = getProviderStatusInfo(provider);
                          const isTesting = testing[provider.name];
                          
                          return (
                            <tr key={provider.name} className="border-b" style={{ borderColor: colors.border }}>
                              {/* Colonne Provider */}
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{getProviderIcon(provider.name)}</span>
                                  <span className="text-sm font-medium" style={{ color: colors.text }}>
                                    {getProviderDisplayName(provider.name)}
                                  </span>
                                </div>
                              </td>
                              
                              {/* Colonne Statut */}
                              <td className="p-3">
                                <div className="flex flex-col space-y-1">
                                  <span 
                                    className="text-xs px-2 py-1 rounded inline-block w-fit"
                                    style={{ 
                                      backgroundColor: statusInfo.color,
                                      color: 'white'
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
                                      value={provider.apiKey}
                                      onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                                      placeholder="Clé API"
                                      className="w-full px-2 py-1 rounded border text-xs"
                                      style={{
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        color: colors.text
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => toggleApiKeyVisibility(provider.name)}
                                      className="absolute right-1 top-1/2 transform -translate-y-1/2 p-0.5"
                                      style={{ color: colors.textSecondary }}
                                    >
                                      {provider.isVisible ? (
                                        <EyeSlashIcon className="h-3 w-3" />
                                      ) : (
                                        <EyeIcon className="h-3 w-3" />
                                      )}
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
                                   disabled={isTesting || (provider.name.toLowerCase() !== 'ollama' && provider.status === 'empty')}
                                   className="px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                   style={{
                                     backgroundColor: (() => {
                                       if (isTesting) return '#3b82f6';
                                       if (provider.status === 'active') return '#ef4444';
                                       if (provider.status === 'configured' || provider.status === 'functional') return '#10b981';
                                       if (provider.status === 'pending') return '#f59e0b';
                                       return colors.primary;
                                     })(),
                                     color: 'white'
                                   }}
                                 >
                                   {(() => {
                                     if (isTesting) return '⏳ Test...';
                                     if (provider.status === 'active') return '❌ Désactiver';
                                     if (provider.status === 'configured' || provider.status === 'functional') return '✅ Activer';
                                     if (provider.status === 'pending') return '🔑 Tester';
                                     if (provider.status === 'empty') return '🔑 Configurer';
                                     return '🔧 Tester';
                                   })(                                   )}
                                 </button>
                               </td>
                               
                               {/* Colonne Priorité */}
                               <td className="p-3">
                                 {provider.status === 'active' ? (
                                   <select
                                     value={provider.priority}
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
                                     -
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
                   <div className="p-3 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                     <p className="text-xs" style={{ color: colors.textSecondary }}>
                       <strong>💡 Gestion des priorités :</strong> Définissez l'ordre d'utilisation des providers (1 = priorité la plus haute). 
                       <strong> Échange automatique :</strong> Si vous changez une priorité, les autres s'échangent automatiquement.
                     </p>
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
              Validation des clés et gestion des priorités
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
