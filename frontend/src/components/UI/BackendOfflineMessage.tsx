import React from 'react';
import { useColors } from '../../hooks/useColors';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { 
  ExclamationTriangleIcon, 
  ServerIcon,
  CpuChipIcon,
  UsersIcon,
  DocumentTextIcon,
  QueueListIcon,
  EyeIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface BackendOfflineMessageProps {
  panel: 'queue' | 'viewer' | 'logs' | 'system' | 'ai-config' | 'users' | 'api-docs';
  className?: string;
}

export const BackendOfflineMessage: React.FC<BackendOfflineMessageProps> = ({ 
  panel, 
  className = '' 
}) => {
  const { colors } = useColors();
  const { isOnline, canMakeRequests } = useBackendConnection();

  // Si le backend est connecté, ne rien afficher
  if (isOnline && canMakeRequests) {
    return null;
  }

  // Configuration spécifique pour chaque onglet
  const getPanelConfig = () => {
    switch (panel) {
      case 'queue':
        return {
          icon: QueueListIcon,
          title: 'Queue IA indisponible',
          message: 'Impossible de récupérer la liste des analyses et de gérer la queue IA.',
          description: 'Les analyses en cours et l\'historique ne peuvent pas être affichés.'
        };
      
      case 'viewer':
        return {
          icon: EyeIcon,
          title: 'Visualisation indisponible',
          message: 'Impossible d\'accéder aux fichiers et à la visualisation.',
          description: 'La navigation dans les fichiers et l\'aperçu ne sont pas disponibles.'
        };
      
      case 'logs':
        return {
          icon: DocumentTextIcon,
          title: 'Logs indisponibles',
          message: 'Impossible de récupérer les logs système et d\'application.',
          description: 'L\'historique des événements et les diagnostics ne peuvent pas être consultés.'
        };
      
      case 'system':
        return {
          icon: ServerIcon,
          title: 'Monitoring indisponible',
          message: 'Impossible de récupérer les métriques système et les informations de santé.',
          description: 'Les performances, l\'état de la base de données et les statistiques ne sont pas accessibles.'
        };
      
      case 'ai-config':
        return {
          icon: CpuChipIcon,
          title: 'Configuration IA indisponible',
          message: 'Impossible d\'accéder à la configuration des providers IA.',
          description: 'La gestion des clés API, les tests de connexion et les priorités ne sont pas disponibles.'
        };
      
      case 'users':
        return {
          icon: UsersIcon,
          title: 'Gestion utilisateurs indisponible',
          message: 'Impossible d\'accéder à la gestion des utilisateurs.',
          description: 'La liste des utilisateurs, les modifications et les statistiques ne peuvent pas être récupérées.'
        };
      
      case 'api-docs':
        return {
          icon: BookOpenIcon,
          title: 'Documentation API indisponible',
          message: 'Impossible d\'accéder à la documentation de l\'API.',
          description: 'La documentation interactive et les exemples ne sont pas disponibles.'
        };
      
      default:
        return {
          icon: ExclamationTriangleIcon,
          title: 'Service indisponible',
          message: 'Impossible de se connecter au backend.',
          description: 'Vérifiez que le serveur backend est démarré et accessible.'
        };
    }
  };

  const config = getPanelConfig();
  const IconComponent = config.icon;

  return (
    <div 
      className={`p-6 rounded-lg border ${className}`}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: '1px'
      }}
    >
      <div className="flex items-start space-x-4">
        {/* Icône */}
        <div 
          className="flex-shrink-0 p-3 rounded-lg"
          style={{
            backgroundColor: `${colors.warning}15`,
            color: colors.warning
          }}
        >
          <IconComponent className="h-6 w-6" />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: colors.text }}
          >
            {config.title}
          </h3>
          
          <p 
            className="text-sm mb-2"
            style={{ color: colors.textSecondary }}
          >
            {config.message}
          </p>
          
          <p 
            className="text-xs"
            style={{ color: colors.textSecondary }}
          >
            {config.description}
          </p>

          {/* Indicateur de statut */}
          <div className="mt-4 flex items-center space-x-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: colors.warning }}
            />
            <span 
              className="text-xs font-medium"
              style={{ color: colors.warning }}
            >
              Backend déconnecté
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
