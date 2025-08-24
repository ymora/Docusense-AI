import React from 'react';
import { useColors } from '../../hooks/useColors';
import { ExclamationTriangleIcon, WifiIcon, ClockIcon, ServerIcon } from '@heroicons/react/24/outline';

interface ErrorDisplayProps {
  error: string | null;
  errorType?: 'auth' | 'backend' | 'timeout' | 'server' | 'generic' | null;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  errorType = 'generic',
  className = '', 
  showText = true,
  size = 'md',
  showIcon = true
}) => {
  const { colors } = useColors();

  if (!error) return null;

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

  const getErrorInfo = () => {
    switch (errorType) {
      case 'backend':
        return {
          color: '#ef4444', // Rouge
          icon: <WifiIcon className={getSizeClasses()} style={{ color: '#ef4444' }} />,
          text: error
        };
      case 'timeout':
        return {
          color: '#f59e0b', // Orange
          icon: <ClockIcon className={getSizeClasses()} style={{ color: '#f59e0b' }} />,
          text: error
        };
      case 'server':
        return {
          color: '#dc2626', // Rouge foncé
          icon: <ServerIcon className={getSizeClasses()} style={{ color: '#dc2626' }} />,
          text: error
        };
      case 'auth':
        return {
          color: '#ef4444', // Rouge
          icon: <ExclamationTriangleIcon className={getSizeClasses()} style={{ color: '#ef4444' }} />,
          text: error
        };
      default:
        return {
          color: '#ef4444', // Rouge
          icon: <ExclamationTriangleIcon className={getSizeClasses()} style={{ color: '#ef4444' }} />,
          text: error
        };
    }
  };

  const errorInfo = getErrorInfo();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && errorInfo.icon}
      {showText && (
        <span 
          className={`font-medium ${getTextSize()}`}
          style={{ color: errorInfo.color }}
        >
          {errorInfo.text}
        </span>
      )}
    </div>
  );
};

export default ErrorDisplay;
