import React from 'react';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { useColors } from '../../hooks/useColors';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface OfflineIndicatorProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showOverlay?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  children, 
  fallback,
  showOverlay = true 
}) => {
  const { isOnline, canMakeRequests, errorMessage } = useBackendConnection();
  const { colors } = useColors();

  // Si on peut faire des requêtes, afficher le contenu normal
  if (canMakeRequests) {
    return <>{children}</>;
  }

  // Si on a un fallback personnalisé, l'utiliser
  if (fallback) {
    return <>{fallback}</>;
  }

  // Sinon, afficher l'indicateur par défaut
  return (
    <div className="relative">
      {children}
      
      {showOverlay && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ backgroundColor: `${colors.background}CC` }}
        >
          <div className="text-center p-6 rounded-lg border max-w-sm mx-4" style={{
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}>
            <div className="flex items-center justify-center mb-4">
              <ExclamationTriangleIcon 
                className="w-8 h-8 mr-2" 
                style={{ color: colors.warning }}
              />
              <WifiIcon 
                className="w-6 h-6" 
                style={{ color: colors.textSecondary }}
              />
            </div>
            
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
              Backend déconnecté
            </h3>
            
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {isOnline 
                ? 'En attente de reconnexion...' 
                : 'Impossible de se connecter au serveur'
              }
            </p>
            
            {errorMessage && (
              <p className="text-xs p-2 rounded bg-red-50 border" style={{
                backgroundColor: `${colors.error}10`,
                borderColor: colors.error,
                color: colors.error
              }}>
                {errorMessage}
              </p>
            )}
            
            <div className="text-xs mt-4" style={{ color: colors.textSecondary }}>
              Les fonctionnalités seront disponibles une fois la connexion rétablie
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
