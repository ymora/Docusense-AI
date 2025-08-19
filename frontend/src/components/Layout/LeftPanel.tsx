import React, { useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { useUIStore } from '../../stores/uiStore';
import { addInterfaceLog } from '../../utils/interfaceLogger';
import DiskSelector from '../FileManager/DiskSelector';
import FileTreeSimple from '../FileManager/FileTreeSimple';

const LeftPanel: React.FC = () => {
  const { selectedFiles, selectFile, toggleFileSelection } = useFileStore();
  const { isOnline, consecutiveFailures } = useBackendStatus();
  const { activePanel, setActivePanel } = useUIStore();
  const { colors } = useColors();
  
  const [currentDisk, setCurrentDisk] = useState<string>('');

  // Déterminer la couleur du titre selon l'état du backend
  const getTitleColor = () => {
    if (!isOnline || consecutiveFailures >= 3) {
      return '#ff0000'; // Rouge vif flashy quand le backend ne répond pas
    }
    return colors.text; // Couleur normale
  };

  // Déterminer le tooltip du titre
  const getTitleTooltip = () => {
    if (!isOnline || consecutiveFailures >= 3) {
      return `🚨 Backend déconnecté (${consecutiveFailures} échecs consécutifs)`;
    }
    return '✅ Backend connecté';
  };

  const toggleTheme = () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    addInterfaceLog('Interface', 'INFO', `🎨 Changement de thème: ${newTheme}`);
  };

  const handleDiskSelect = (disk: string) => {
    setCurrentDisk(disk);
    addInterfaceLog('Navigation', 'INFO', `📁 Sélection du disque: ${disk}`);
  };

  const handleFileSelect = (file: any) => {
    addInterfaceLog('Fichiers', 'INFO', `📄 Sélection du fichier: ${file.name}`);
    selectFile(file);
  };

  const handleFileSelectionChange = (fileId: string | number) => {
    toggleFileSelection(fileId);
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: colors.surface,
        color: colors.text,
      }}
    >
      {/* Header avec titre et contrôles */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <div className="flex items-center space-x-3">
          <span
            className="text-lg font-semibold transition-colors duration-300"
            style={{ 
              color: getTitleColor(),
              animation: (!isOnline || consecutiveFailures >= 3) ? 'flash 1s infinite' : 'none',
              textShadow: (!isOnline || consecutiveFailures >= 3) ? '0 0 10px #ff0000, 0 0 20px #ff0000' : 'none'
            }}
            title={getTitleTooltip()}
          >
            DocuSense IA
          </span>
        </div>
        
        {/* Bouton thème jour/nuit */}
        <button
          onClick={toggleTheme}
          className="p-2 transition-colors"
          style={{
            color: colors.textSecondary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.textSecondary;
          }}
          title="Basculer le thème"
        >
          {document.body.getAttribute('data-theme') === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Sélecteur de disque */}
      <div className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
        <DiskSelector
          onDiskSelect={handleDiskSelect}
          currentDisk={currentDisk}
        />
      </div>

      {/* Arborescence des fichiers */}
      <div className="flex-1 overflow-hidden">
        {currentDisk ? (
          <FileTreeSimple
            currentDirectory={currentDisk}
            onFileSelect={handleFileSelect}
            selectedFiles={selectedFiles}
            onFileSelectionChange={handleFileSelectionChange}
          />
        ) : (
          <div className="p-4 text-center">
            <div className="text-2xl mb-2">💾</div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              Sélectionnez un disque pour voir les fichiers
            </div>
          </div>
        )}
      </div>

      {/* Légende des statuts - TOUJOURS en bas */}
      <div
        className="p-3 border-t flex-shrink-0"
        style={{
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <div className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
          Légende des statuts IA :
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.success }}
            />
            <span style={{ color: colors.textSecondary }}>Analysable par IA</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.textSecondary }}
            />
            <span style={{ color: colors.textSecondary }}>Non pris en charge par l'IA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;