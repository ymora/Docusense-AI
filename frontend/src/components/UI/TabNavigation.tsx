import React from 'react';
import { useColors } from '../../hooks/useColors';
import { useConfigStore } from '../../stores/configStore';
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
  const { getActiveProviders, isInitialized, loadAIProviders } = useConfigStore();
  
  // S'assurer que le store est initialisé
  React.useEffect(() => {
    if (!isInitialized) {
      loadAIProviders();
    }
  }, [isInitialized, loadAIProviders]);
  
  // Obtenir les providers actifs pour l'indicateur
  const allProviders = getActiveProviders();
  const activeProviders = allProviders.filter(provider => provider.is_active === true);
  
  // Debug pour voir les providers
  console.log('🔍 TabNavigation - Providers:', {
    allProviders: allProviders.map(p => ({ name: p.name, is_active: p.is_active, is_functional: p.is_functional, status: p.status })),
    activeProviders: activeProviders.map(p => ({ name: p.name, is_active: p.is_active, is_functional: p.is_functional, status: p.status })),
    isInitialized,
    count: activeProviders.length,
    shouldShowIndicator: true
  });

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
              {tab.id === 'config' && (
                <div 
                  className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white ml-1"
                  style={{ backgroundColor: activeProviders.length > 0 ? colors.primary : '#6b7280' }}
                  title={`${activeProviders.length} IA(s) active(s)`}
                >
                  {activeProviders.length}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
