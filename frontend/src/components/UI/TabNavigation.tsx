import React from 'react';
import { useColors } from '../../hooks/useColors';
import useAuthStore from '../../stores/authStore';
import { logService } from '../../services/logService';
import {
  EyeIcon,
  QueueListIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface TabNavigationProps {
  activePanel: string;
  onTabChange: (panel: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activePanel, onTabChange }) => {
  const { colors } = useColors();
  const { isAdmin } = useAuthStore();

  const handleTabChange = (tabId: string, tabLabel: string) => {
    logService.info(`Navigation: Changement d'onglet vers "${tabLabel}" (${tabId})`, 'TabNavigation', {
      fromTab: activePanel,
      toTab: tabId,
      timestamp: new Date().toISOString()
    });
    onTabChange(tabId);
  };

  const tabs: Tab[] = [
    {
      id: 'viewer',
      label: 'Visualisation',
      icon: EyeIcon,
      description: 'Visualisez vos fichiers'
    },
    {
      id: 'queue',
      label: 'Queue IA',
      icon: QueueListIcon,
      description: 'Gérez vos analyses IA'
    },
    // Onglet Logs visible uniquement pour l'admin, placé juste après Queue IA
    ...(isAdmin() ? [{
      id: 'logs',
      label: 'Logs',
      icon: DocumentTextIcon,
      description: 'Consultez les logs'
    }] : [])
  ];



  return (
    <div
      className="flex items-center p-4 border-b"
      style={{
        backgroundColor: colors.surface,
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
                  : 'hover:bg-slate-700/50'
              }`}
              style={{
                backgroundColor: isActive ? colors.primary : 'transparent',
                color: isActive ? colors.background : colors.textSecondary,
                border: isActive ? `1px solid ${colors.primary}` : '1px solid transparent',
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
