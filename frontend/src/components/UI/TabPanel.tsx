import React from 'react';
import { useColors } from '../../hooks/useColors';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
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
                ? 'border-b-2'
                : 'border-transparent hover:border-opacity-50'
            }`}
            style={{
              borderColor: isActive ? colors.primary : 'transparent',
              color: isActive ? colors.primary : colors.textSecondary,
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = colors.text;
                e.currentTarget.style.borderColor = colors.border;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = colors.textSecondary;
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <div className="transition-transform duration-200">
              {tab.icon}
            </div>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span 
                className="text-xs px-2 py-1 rounded-full border transition-all duration-300 ease-in-out hover:scale-110"
                style={{
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  color: isActive ? '#ffffff' : colors.textSecondary
                }}
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
