import React from 'react';
import { useColors } from '../../hooks/useColors';
import useAuthStore from '../../stores/authStore';
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
    }
  ];

  const rightTabs: Tab[] = [
    // Onglet Logs visible uniquement pour l'admin
    ...(isAdmin() ? [{
      id: 'logs',
      label: 'Logs',
      icon: DocumentTextIcon,
      description: 'Consultez les logs'
    }] : [])
  ];
  

  


  return (
    <div
      className="flex items-center justify-between p-4 border-b"
      style={{
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
      }}
    >
      {/* Onglets principaux */}
      <div className="flex items-center space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePanel === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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

      {/* Onglets de droite */}
      <div className="flex items-center space-x-1">
        {rightTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePanel === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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
