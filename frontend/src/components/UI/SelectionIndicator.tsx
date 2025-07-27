import React, { useState } from 'react';
import { XMarkIcon, FolderIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useFileStore } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';

const SelectionIndicator: React.FC = () => {
  const { colors } = useColors();
  const { selectedFiles, files, clearSelection, toggleFileSelection } = useFileStore();
  const [showDetails, setShowDetails] = useState(false);

  // Si aucun fichier sélectionné, ne rien afficher
  if (selectedFiles.length === 0) {
    return null;
  }

  // Obtenir les fichiers sélectionnés
  const selectedFileObjects = files.filter(file => selectedFiles.includes(file.id));

  // Grouper par répertoire
  const filesByDirectory = selectedFileObjects.reduce((acc, file) => {
    const dir = file.parent_directory || 'Racine';
    if (!acc[dir]) {
      acc[dir] = [];
    }
    acc[dir].push(file);
    return acc;
  }, {} as Record<string, typeof selectedFileObjects>);

  const handleClearSelection = () => {
    clearSelection();
  };

  const handleRemoveFile = (fileId: number) => {
    toggleFileSelection(fileId);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Indicateur principal */}
      <div
        className="flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg border cursor-pointer transition-all duration-200 hover:scale-105"
        style={{
          backgroundColor: colors.surface + 'F0',
          borderColor: colors.border,
          backdropFilter: 'blur(8px)'
        }}
        onClick={() => setShowDetails(!showDetails)}
        title="Cliquer pour voir les détails"
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: colors.config }}
        />
        <span
          className="text-sm font-medium"
          style={{ color: colors.text }}
        >
          {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClearSelection();
          }}
          className="p-1 rounded hover:bg-red-500/20 transition-colors"
          title="Désélectionner tous les fichiers"
        >
          <XMarkIcon className="h-4 w-4" style={{ color: colors.error }} />
        </button>
      </div>

      {/* Détails au survol */}
      {showDetails && (
        <div
          className="mt-2 p-3 rounded-lg shadow-lg border max-w-md max-h-96 overflow-y-auto"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4
              className="text-sm font-medium"
              style={{ color: colors.text }}
            >
              Fichiers sélectionnés
            </h4>
            <button
              onClick={handleClearSelection}
              className="text-xs px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
              style={{ color: colors.error }}
            >
              Tout désélectionner
            </button>
          </div>

          <div className="space-y-2">
            {Object.entries(filesByDirectory).map(([directory, files]) => (
              <div key={directory} className="space-y-1">
                <div className="flex items-center space-x-1 text-xs opacity-70">
                  <FolderIcon className="h-3 w-3" style={{ color: colors.textSecondary }} />
                  <span style={{ color: colors.textSecondary }}>{directory}</span>
                </div>
                <div className="ml-4 space-y-1">
                  {files.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between text-xs p-1 rounded hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-1 min-w-0 flex-1">
                        <DocumentIcon className="h-3 w-3 flex-shrink-0" style={{ color: colors.textSecondary }} />
                        <span
                          className="truncate"
                          style={{ color: colors.text }}
                          title={file.name}
                        >
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-0.5 rounded hover:bg-red-500/20 transition-colors ml-1 flex-shrink-0"
                        title="Retirer de la sélection"
                      >
                        <XMarkIcon className="h-3 w-3" style={{ color: colors.error }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionIndicator; 