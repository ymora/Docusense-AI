import React, { useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import useAuthStore from '../../stores/authStore';
import { logService } from '../../services/logService';
import {
  EyeIcon,
  QueueListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ServerIcon,
  CpuChipIcon,
  UsersIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface TabNavigationProps {
  activePanel: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activePanel, onTabChange }) => {
  const { colors } = useColors();
  const { isAdmin } = useAuthStore();

  // Vérifier les permissions et rediriger si nécessaire
  useEffect(() => {
    const availableTabs = getAvailableTabs();
    const hasAccessToCurrentTab = availableTabs.some(tab => tab.id === activePanel);
    
    if (!hasAccessToCurrentTab) {
      // L'utilisateur n'a pas accès à l'onglet actuel, rediriger vers le premier onglet disponible
      const firstAvailableTab = availableTabs[0];
      if (firstAvailableTab) {
        logService.info('Redirection automatique - permissions insuffisantes', 'TabNavigation', {
          fromTab: activePanel,
          toTab: firstAvailableTab.id,
          reason: 'Permissions insuffisantes pour l\'onglet actuel',
          timestamp: new Date().toISOString()
        });
        onTabChange(firstAvailableTab.id);
      }
    }
  }, [activePanel, isAdmin, onTabChange]);

  // Fonction pour obtenir les onglets disponibles selon les permissions
  const getAvailableTabs = (): Tab[] => {
    const baseTabs: Tab[] = [
      {
        id: 'queue',
        label: 'Queue IA',
        icon: QueueListIcon,
        description: 'Gérez vos analyses IA'
      },
      {
        id: 'viewer',
        label: 'Visualisation',
        icon: EyeIcon,
        description: 'Visualisez vos fichiers'
      }
    ];

    // Ajouter les onglets admin seulement si l'utilisateur est admin
    if (isAdmin()) {
      return [
        ...baseTabs,
        {
          id: 'logs',
          label: 'Logs',
          icon: DocumentTextIcon,
          description: 'Consultez les logs'
        },
        {
          id: 'system',
          label: 'Système',
          icon: ServerIcon,
          description: 'Monitoring et santé du système'
        },
        {
          id: 'ai-config',
          label: 'Configuration IA',
          icon: CpuChipIcon,
          description: 'Gestion des providers IA'
        },
        {
          id: 'users',
          label: 'Utilisateurs',
          icon: UsersIcon,
          description: 'Gestion des utilisateurs'
        },
        {
          id: 'api-docs',
          label: 'API Docs',
          icon: BookOpenIcon,
          description: 'Documentation de l\'API'
        }
      ];
    }

    return baseTabs;
  };

  const handleTabChange = (tabId: string, tabLabel: string) => {
    logService.info(`Navigation: Changement d'onglet vers "${tabLabel}" (${tabId})`, 'TabNavigation', {
      fromTab: activePanel,
      toTab: tabId,
      timestamp: new Date().toISOString()
    });
    onTabChange(tabId);
  };

  const tabs = getAvailableTabs();

  return (
    <div
      className="flex items-center p-4 border-b"
      style={{
        backgroundColor: 'transparent',
        borderBottomColor: colors.border,
      }}
    >
      {/* Onglets */}
      <div className="flex items-center space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePanel === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id, tab.label)}
              className={`tab-button flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'shadow-sm' 
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: 'transparent',
                color: isActive ? colors.primary : colors.textSecondary,
                border: `1px solid ${isActive ? colors.primary : colors.border}`,
              }}
              title={tab.description}
              aria-label={`Onglet ${tab.label}`}
              data-tab-id={tab.id}
              data-tab-label={tab.label}
            >
              <Icon className="h-4 w-4" />
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
