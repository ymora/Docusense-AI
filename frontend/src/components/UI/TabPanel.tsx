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

  console.log('🔍 TabPanel - activeTab:', activeTab);
  console.log('🔍 TabPanel - tabs:', tabs.map(t => ({ id: t.id, label: t.label })));

  return (
    <div className="flex border-b" style={{ borderColor: colors.border }}>
             {tabs.map((tab) => {
         const isActive = activeTab === tab.id;
         console.log(`🔍 TabPanel - Onglet ${tab.id}: isActive = ${isActive}`);
        
        return (
          <button
            key={tab.id}
            onClick={() => {
              console.log('🖱️ TabPanel - Clic manuel sur onglet:', tab.id);
              onTabChange(tab.id);
            }}
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
            {tab.count !== undefined && tab.count > 0 && (
              <span 
                className="text-xs px-2 py-1 rounded-full border transition-all duration-300 ease-in-out hover:scale-110"
                style={{
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  color: isActive ? '#ffffff' : colors.textSecondary,
                  fontWeight: isActive ? 'bold' : 'normal',
                  boxShadow: isActive ? `0 0 8px ${colors.primary}40` : 'none'
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
