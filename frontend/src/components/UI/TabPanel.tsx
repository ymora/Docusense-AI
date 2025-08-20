import React from 'react';
import { useColors } from '../../hooks/useColors';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  errorCount?: number;
  warningCount?: number;
}

interface TabPanelProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabPanel: React.FC<TabPanelProps> = ({ tabs, activeTab, onTabChange }) => {
  const { colors } = useColors();



  return (
    <div className="flex border-b" style={{ borderColor: colors.border }}>
             {tabs.map((tab) => {
         const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-300 ease-in-out border-b-2 hover:scale-105 ${
              isActive
                ? 'border-b-3'
                : 'border-transparent hover:border-opacity-50'
            }`}
            style={{
              borderColor: isActive ? colors.primary : 'transparent',
              color: isActive ? colors.primary : colors.textSecondary,
              backgroundColor: isActive ? colors.primary + '15' : 'transparent',
              borderBottomWidth: isActive ? '3px' : '2px'
            }}
            data-active={isActive}

          >
            <div className="transition-transform duration-200">
              {tab.icon}
            </div>
            <span>{tab.label}</span>
            {tab.id === 'analyses' && (tab.errorCount !== undefined || tab.warningCount !== undefined) ? (
              <div className="flex items-center gap-1">
                {tab.errorCount !== undefined && tab.errorCount > 0 && (
                  <span 
                    className="text-xs font-bold transition-all duration-300 ease-in-out hover:scale-110"
                    style={{
                      color: '#ef4444',
                      fontSize: '11px'
                    }}
                    title={`${tab.errorCount} erreur${tab.errorCount > 1 ? 's' : ''}`}
                  >
                    {tab.errorCount}
                  </span>
                )}
                {tab.warningCount !== undefined && tab.warningCount > 0 && (
                  <span 
                    className="text-xs font-bold transition-all duration-300 ease-in-out hover:scale-110"
                    style={{
                      color: '#f59e0b',
                      fontSize: '11px'
                    }}
                    title={`${tab.warningCount} warning${tab.warningCount > 1 ? 's' : ''}`}
                  >
                    {tab.warningCount}
                  </span>
                )}
              </div>
            ) : tab.count !== undefined && tab.count > 0 && (
              <span 
                className="text-xs font-bold transition-all duration-300 ease-in-out hover:scale-110"
                style={{
                  color: tab.id === 'config' ? '#10b981' : 
                         tab.id === 'queue' ? '#f59e0b' : 
                         (isActive ? colors.primary : colors.textSecondary),
                  fontSize: '11px'
                }}
                title={tab.id === 'config' ? `${tab.count} IA(s) active(s)` : 
                       tab.id === 'queue' ? `${tab.count} analyse(s) en attente` : 
                       `${tab.count} élément(s)`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabPanel;
