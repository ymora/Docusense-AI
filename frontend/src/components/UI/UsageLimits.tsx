import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import useAuthStore from '../../stores/authStore';
import { useAuthUsageService } from '../../services/authUsageService';

import { 
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon,
  PhotoIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

interface UsageLimitsProps {
  className?: string;
}

interface FeatureUsage {
  used: number;
  remaining: number;
  limit: number;
}

export const UsageLimits: React.FC<UsageLimitsProps> = ({ className = '' }) => {
  const { colors } = useColors();
  const { user, isGuest } = useAuthStore();

  const authUsageService = useAuthUsageService();

  // Si ce n'est pas un invité, ne pas afficher
  if (!isGuest()) {
    return null;
  }

  // État pour les données d'usage
  const [usageData, setUsageData] = useState<Record<string, FeatureUsage>>({
    file_browsing: { used: 0, remaining: 5, limit: 5 },
    file_viewing: { used: 0, remaining: 5, limit: 5 },
    analysis_viewing: { used: 0, remaining: 5, limit: 5 },
    multimedia_viewing: { used: 0, remaining: 5, limit: 5 }
  });
  const [totalUsage, setTotalUsage] = useState(0);
  const [remainingGlobal, setRemainingGlobal] = useState(25);

  // Charger les données d'usage depuis l'API
  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        const data = await authUsageService.getGuestUsage();
        if (data && data.success && data.data) {
          setTotalUsage(data.data.total_usage || 0);
          setRemainingGlobal(data.data.remaining_global || 25);
          
          // Mettre à jour les données par fonctionnalité
          const features = data.data.features || {};
          setUsageData({
            file_browsing: features.file_browsing || { used: 0, remaining: 5, limit: 5 },
            file_viewing: features.file_viewing || { used: 0, remaining: 5, limit: 5 },
            analysis_viewing: features.analysis_viewing || { used: 0, remaining: 5, limit: 5 },
            multimedia_viewing: features.multimedia_viewing || { used: 0, remaining: 5, limit: 5 }
          });
        }
      } catch (error) {
        // OPTIMISATION: Suppression des console.error pour éviter la surcharge // console.error('Erreur lors du chargement des statistiques:', error);
      }
    };

    if (isGuest()) {
      fetchUsageStats();
    }
  }, [isGuest, authUsageService]);

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'file_browsing':
        return <FolderIcon className="w-4 h-4" />;
      case 'file_viewing':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'analysis_viewing':
        return <EyeIcon className="w-4 h-4" />;
      case 'multimedia_viewing':
        return <PhotoIcon className="w-4 h-4" />;
      default:
        return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const getFeatureName = (feature: string) => {
    switch (feature) {
      case 'file_browsing':
        return 'Navigation fichiers';
      case 'file_viewing':
        return 'Visualisation fichiers';
      case 'analysis_viewing':
        return 'Consultation analyses';
      case 'multimedia_viewing':
        return 'Visualisation multimédia';
      default:
        return feature;
    }
  };

  const getUsageColor = (usage: FeatureUsage) => {
    const percentage = (usage.used / usage.limit) * 100;
    if (percentage >= 80) return '#ef4444'; // Rouge
    if (percentage >= 60) return '#f59e0b'; // Orange
    return '#10b981'; // Vert
  };

  return (
    <div 
      className={`p-4 rounded-lg border ${className}`}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {/* En-tête */}
      <div className="flex items-center space-x-2 mb-4">
        <ExclamationTriangleIcon 
          className="w-5 h-5" 
          style={{ color: '#f59e0b' }} 
        />
        <h3 
          className="text-sm font-medium"
          style={{ color: colors.text }}
        >
          Limites d'usage - Mode Invité
        </h3>
        <ClockIcon 
          className="w-4 h-4" 
          style={{ color: colors.textSecondary }} 
        />
      </div>

             {/* Message d'information */}
       <p 
         className="text-xs mb-4"
         style={{ color: colors.textSecondary }}
       >
         En mode invité, vous avez accès à 5 essais par fonctionnalité toutes les 24h 
         (limite globale: 25 utilisations). Créez un compte pour un accès illimité.
       </p>

       {/* Statistiques globales */}
       <div className="mb-4 p-2 rounded" style={{ backgroundColor: colors.background }}>
         <div className="flex justify-between items-center text-xs">
           <span style={{ color: colors.textSecondary }}>Utilisations totales:</span>
           <span style={{ color: colors.text }}>
             {totalUsage}/25 ({remainingGlobal} restantes)
           </span>
         </div>
         <div 
           className="w-full h-2 rounded-full overflow-hidden mt-1"
           style={{ backgroundColor: colors.border }}
         >
           <div
             className="h-full rounded-full transition-all duration-300"
             style={{
               backgroundColor: totalUsage >= 20 ? '#ef4444' : totalUsage >= 15 ? '#f59e0b' : '#10b981',
               width: `${(totalUsage / 25) * 100}%`
             }}
           />
         </div>
       </div>

      {/* Liste des fonctionnalités */}
      <div className="space-y-3">
        {Object.entries(usageData).map(([feature, usage]) => (
          <div 
            key={feature}
            className="flex items-center justify-between p-2 rounded"
            style={{ backgroundColor: colors.background }}
          >
            {/* Icône et nom */}
            <div className="flex items-center space-x-2">
              <div style={{ color: getUsageColor(usage) }}>
                {getFeatureIcon(feature)}
              </div>
              <span 
                className="text-xs font-medium"
                style={{ color: colors.text }}
              >
                {getFeatureName(feature)}
              </span>
            </div>

            {/* Barre de progression */}
            <div className="flex items-center space-x-2">
              <div 
                className="w-16 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.border }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: getUsageColor(usage),
                    width: `${(usage.used / usage.limit) * 100}%`
                  }}
                />
              </div>
              <span 
                className="text-xs font-mono"
                style={{ 
                  color: getUsageColor(usage),
                  minWidth: '2rem',
                  textAlign: 'right'
                }}
              >
                {usage.remaining}/{usage.limit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton d'action */}
      <div className="mt-4 pt-3 border-t" style={{ borderColor: colors.border }}>
        <button
          className="w-full px-3 py-2 text-xs font-medium rounded transition-colors hover:bg-opacity-80"
          style={{
            backgroundColor: colors.primary,
            color: '#ffffff'
          }}
          onClick={() => {
            // Ouvrir le modal d'inscription
            const event = new CustomEvent('openRegisterModal');
            window.dispatchEvent(event);
          }}
        >
          Créer un compte pour un accès illimité
        </button>
      </div>
    </div>
  );
};

export default UsageLimits;
