import React from 'react';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { useColors } from '../../hooks/useColors';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface BackendStatusIndicatorProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BackendStatusIndicator: React.FC<BackendStatusIndicatorProps> = ({ 
  className = '', 
  showText = true,
  size = 'md' 
}) => {
  const { colors } = useColors();
  const { isConnected, isLoading, error } = useBackendConnection();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'lg':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-sm';
      default:
        return 'text-xs';
    }
  };

  const getStatusInfo = () => {
    if (isLoading) {
      return {
        color: '#f59e0b', // Orange
        text: 'Vérification...',
        icon: <div className={`${getSizeClasses()} animate-pulse rounded-full bg-orange-500`} />
      };
    }
    
    if (isConnected) {
      return {
        color: '#10b981', // Vert
        text: 'Backend connecté',
        icon: <WifiIcon className={getSizeClasses()} style={{ color: '#10b981' }} />
      };
    }
    
    return {
      color: '#ef4444', // Rouge
      text: 'Backend indisponible',
      icon: <ExclamationTriangleIcon className={getSizeClasses()} style={{ color: '#ef4444' }} />
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {statusInfo.icon}
      {showText && (
        <span 
          className={`font-medium ${getTextSize()}`}
          style={{ color: statusInfo.color }}
        >
          {statusInfo.text}
        </span>
      )}
    </div>
  );
};

export default BackendStatusIndicator;

