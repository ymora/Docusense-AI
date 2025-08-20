import React from 'react';
import { useColors } from '../../hooks/useColors';

interface StartupLoaderProps {
  isLoading: boolean;
  initializationStep: string;
  isInitialized: boolean;
}

export const StartupLoader: React.FC<StartupLoaderProps> = ({
  isLoading,
  initializationStep,
  isInitialized
}) => {
  const { colors } = useColors();

  if (!isLoading && isInitialized) {
    return null;
  }

  const getStepMessage = () => {
    switch (initializationStep) {
      case 'prompts':
        return 'Chargement des prompts...';
      case 'config':
        return 'Chargement des configurations...';
      case 'queue':
        return 'Chargement de la file d\'attente...';
      case 'files':
        return 'Initialisation des fichiers...';
      case 'complete':
        return 'Initialisation terminée';
      case 'error':
        return 'Erreur lors de l\'initialisation';
      default:
        return 'Démarrage de l\'application...';
    }
  };

  const getStepIcon = () => {
    switch (initializationStep) {
      case 'prompts':
        return '📋';
      case 'config':
        return '🔑';
      case 'queue':
        return '📋';
      case 'files':
        return '📁';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🚀';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div 
        className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">
            {getStepIcon()}
          </div>
          
          <h2 
            className="text-xl font-semibold mb-2"
            style={{ color: colors.text }}
          >
            DocuSense AI
          </h2>
          
          <p 
            className="text-sm mb-4"
            style={{ color: colors.textSecondary }}
          >
            {getStepMessage()}
          </p>
          
          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          )}
          
          {initializationStep === 'error' && (
            <p 
              className="text-xs mt-4 p-2 rounded"
              style={{ 
                backgroundColor: colors.error + '20',
                color: colors.error 
              }}
            >
              L'application continuera avec les données en cache
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 