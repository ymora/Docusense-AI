import React from 'react';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { useColors } from '../../hooks/useColors';

interface ConnectionStatusProps {
  showText?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showText = true, 
  showIcon = true,
  className = ''
}) => {
  const { isOnline, canMakeRequests, errorMessage, lastCheck } = useBackendConnection();
  const { colors } = useColors();

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (!canMakeRequests) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Déconnecté';
    if (!canMakeRequests) return 'En attente';
    return 'Connecté';
  };

  const getTooltipText = () => {
    if (!isOnline) {
      return `Backend déconnecté${errorMessage ? `: ${errorMessage}` : ''}`;
    }
    if (!canMakeRequests) {
      return 'Backend en attente de connexion';
    }
    return `Backend connecté${lastCheck ? ` (dernière vérification: ${new Date(lastCheck).toLocaleTimeString()})` : ''}`;
  };

  return (
    <div 
      className={`flex items-center gap-2 ${className}`}
      title={getTooltipText()}
    >
      {showIcon && (
        <div 
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${getStatusColor()}`}
        />
      )}
      {showText && (
        <span 
          className="text-xs transition-colors duration-300"
          style={{ color: colors.textSecondary }}
        >
          {getStatusText()}
        </span>
      )}
    </div>
  );
};
