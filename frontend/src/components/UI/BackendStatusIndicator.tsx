import React from 'react';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { useColors } from '../../hooks/useColors';

interface BackendStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const BackendStatusIndicator: React.FC<BackendStatusIndicatorProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { 
    isOnline, 
    isInactive, 
    consecutiveFailures, 
    isChecking, 
    errorMessage, 
    lastCheck, 
    responseTime,
    forceCheck 
  } = useBackendStatus();
  
  const { colors } = useColors();

  // Si le backend est connecté, ne rien afficher
  if (isOnline && !isInactive) {
    return null;
  }

  // Déterminer l'état et la couleur
  const getStatusInfo = () => {
    if (isChecking) {
      return {
        color: colors.warning || '#f59e0b',
        text: 'Vérification...',
        tooltip: 'Vérification de la connexion en cours'
      };
    }
    
    if (consecutiveFailures >= 3) {
      return {
        color: colors.error || '#ef4444',
        text: 'Déconnecté',
        tooltip: `Backend déconnecté (${consecutiveFailures} échecs)`
      };
    }
    
    return {
      color: colors.warning || '#f59e0b',
      text: 'Problème',
      tooltip: `Problème de connexion (${consecutiveFailures} échecs)`
    };
  };

  const statusInfo = getStatusInfo();

  const handleClick = async () => {
    if (!isOnline || isInactive) {
      await forceCheck();
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Indicateur minimaliste */}
      <button
        onClick={handleClick}
        className="flex items-center space-x-1 px-2 py-1 rounded text-xs transition-all duration-200 hover:bg-slate-700 cursor-pointer"
        style={{ color: statusInfo.color }}
        title={statusInfo.tooltip}
        disabled={isChecking}
      >
        <span className="text-xs">{statusInfo.text}</span>
        
        {/* Animation de vérification */}
        {isChecking && (
          <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
        )}
      </button>
    </div>
  );
};

// Composant compact pour les headers - SIMPLIFIÉ
export const BackendStatusDot: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline, isInactive, consecutiveFailures, isChecking } = useBackendStatus();
  const { colors } = useColors();

  // Si le backend est connecté, ne rien afficher
  if (isOnline && !isInactive) {
    return null;
  }

  const getDotColor = () => {
    if (isChecking) return colors.warning || '#f59e0b';
    if (consecutiveFailures >= 3) return colors.error || '#ef4444';
    return colors.warning || '#f59e0b';
  };

  const getTooltip = () => {
    if (isChecking) return 'Vérification en cours...';
    if (consecutiveFailures >= 3) return 'Backend déconnecté';
    return 'Problème de connexion';
  };

  return (
    <div
      className={`w-2 h-2 rounded-full transition-all duration-300 ${
        isInactive ? 'animate-pulse' : ''
      } ${className}`}
      style={{ backgroundColor: getDotColor() }}
      title={getTooltip()}
    />
  );
};

