import React from 'react';
import { useAIConfig } from '../../hooks/useAIConfig';
import { useColors } from '../../hooks/useColors';

export const AIConfigTest: React.FC = () => {
  const { colors } = useColors();
  const {
    providers,
    providerStatuses,
    apiKeys,
    priorities,
    strategy,
    loading,
    error,
    getActiveValidProvidersCount,
    validateAndFixPriorities,
    resetPriorities
  } = useAIConfig();

  const handleValidatePriorities = async () => {
    const result = await validateAndFixPriorities();
    
  };

  const handleResetPriorities = async () => {
    const result = await resetPriorities();
    
  };

  if (loading) {
    return (
      <div style={{ color: colors.text }}>
        Chargement de la configuration IA...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: colors.error }}>
        Erreur: {error}
      </div>
    );
  }

  return (
    <div style={{ color: colors.text, padding: '1rem' }}>
      <h3 style={{ color: colors.config, marginBottom: '1rem' }}>
        Test de Configuration IA
      </h3>

      <div style={{ marginBottom: '1rem' }}>
        <h4>Résumé</h4>
        <p>Providers actifs et valides: {getActiveValidProvidersCount()} / {providers.length}</p>
        <p>Stratégie actuelle: {strategy}</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h4>Providers</h4>
        {providers.map(provider => (
          <div key={provider.name} style={{ marginBottom: '0.5rem', padding: '0.5rem', border: `1px solid ${colors.border}` }}>
            <strong>{provider.name}</strong>
            <br />
            Priorité: {priorities[provider.name] || 0}
            <br />
            Statut: {providerStatuses[provider.name]?.status || 'inconnu'}
            <br />
            Message: {providerStatuses[provider.name]?.message || 'Aucun message'}
            <br />
            Clé API: {apiKeys[provider.name] ? 'Configurée' : 'Non configurée'}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h4>Actions de test</h4>
        <button
          onClick={handleValidatePriorities}
          style={{
            backgroundColor: colors.config,
            color: 'white',
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Valider et corriger les priorités
        </button>
        <button
          onClick={handleResetPriorities}
          style={{
            backgroundColor: colors.error,
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Réinitialiser toutes les priorités
        </button>
      </div>

      <div>
        <h4>Données brutes</h4>
        <pre style={{ 
          backgroundColor: colors.surface, 
          padding: '1rem', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify({
            providers: providers.length,
            priorities,
            strategy,
            activeValidCount: getActiveValidProvidersCount()
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}; 