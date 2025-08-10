import React from 'react';
import { useColors } from '../../hooks/useColors';
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

  const tabs: Tab[] = [
    {
      id: 'main',
      label: 'Visualisation',
      icon: EyeIcon,
      description: 'Visualisez vos fichiers'
    },
    {
      id: 'analyses',
      label: 'Queue IA',
      icon: QueueListIcon,
      description: 'Gérez vos analyses IA'
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: DocumentTextIcon,
      description: 'Consultez les logs'
    }
  ];

  const rightTabs: Tab[] = [
    {
      id: 'config',
      label: 'Configuration IA',
      icon: Cog6ToothIcon,
      description: 'Configurez vos providers IA'
    }
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
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
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
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
