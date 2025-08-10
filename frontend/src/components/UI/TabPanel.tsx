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
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === tab.id
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && tab.count > 0 && (
            <span className="bg-slate-600 text-slate-200 text-xs px-2 py-1 rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default TabPanel;
