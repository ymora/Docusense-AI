import React, { useState, useEffect, useCallback } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';

import { useUIStore } from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import { addInterfaceLog } from '../../utils/interfaceLogger';
import DiskSelector from '../FileManager/DiskSelector';
import FileTreeSimple from '../FileManager/FileTreeSimple';
import { getFileIcon } from '../../utils/fileUtils';
import { 
  DocumentIcon
} from '@heroicons/react/24/outline';
import { UserIcon } from '../UI/UserIcon';

const LeftPanel: React.FC = () => {
  const { selectedFiles, selectFile, toggleFileSelection } = useFileStore();

  const { activePanel, setActivePanel } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const { colors } = useColors();
  
  const [currentDisk, setCurrentDisk] = useState<string>('');

  // Le titre utilise maintenant toujours la couleur normale
  // L'indicateur de statut backend est maintenant sur la page de connexion

  const toggleTheme = () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    addInterfaceLog('Interface', 'INFO', `🎨 Changement de thème: ${newTheme}`);
  };

  const handleDiskSelect = useCallback((disk: string) => {
    setCurrentDisk(disk);
    addInterfaceLog('Navigation', 'INFO', `📁 Sélection du disque: ${disk}`);
  }, []);

  const handleFileSelect = useCallback((file: any) => {
    addInterfaceLog('Fichiers', 'INFO', `📄 Sélection du fichier: ${file.name}`);
    selectFile(file);
  }, [selectFile]);

  const handleFileSelectionChange = useCallback((fileId: string | number) => {
    toggleFileSelection(fileId);
  }, [toggleFileSelection]);

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
            className="text-lg font-semibold"
            style={{ 
              color: colors.text
            }}
            title="DocuSense IA - Analyse intelligente de documents"
          >
            DocuSense IA
          </span>
          
          {/* Bouton thème jour/nuit */}
          <button
            onClick={toggleTheme}
            className="p-1 transition-colors hover:scale-110"
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

        {/* Espace réservé pour l'alignement */}
        <div className="w-8"></div>
      </div>

      {/* Sélecteur de disque - pour tous les utilisateurs (authentifié, invité, user, admin) */}
      <div className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
        <DiskSelector
          onDiskSelect={handleDiskSelect}
          currentDisk={currentDisk}
        />
      </div>

      {/* Arborescence des fichiers - pour tous les utilisateurs */}
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
            <DocumentIcon className="h-3 w-3" style={{ color: colors.success }} />
            <span style={{ color: colors.textSecondary }}>Analysable par IA</span>
          </div>
          <div className="flex items-center space-x-2">
            <DocumentIcon className="h-3 w-3" style={{ color: colors.warning }} />
            <span style={{ color: colors.textSecondary }}>Attente connexion backend</span>
          </div>
          <div className="flex items-center space-x-2">
            <DocumentIcon className="h-3 w-3" style={{ color: colors.textSecondary }} />
            <span style={{ color: colors.textSecondary }}>Non pris en charge par l'IA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;