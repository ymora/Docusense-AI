import React, { useState } from 'react';
import { useColors } from '../../hooks/useColors';
import { FolderIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface BreadcrumbNavigationProps {
  currentDirectory?: string | null;
  onDirectorySelect: (directory: string) => void;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  currentDirectory,
  onDirectorySelect
}) => {
  const { colors } = useColors();
  const [isDirectorySelectorOpen, setIsDirectorySelectorOpen] = useState(false);



  const navigateToDrive = (drive: string) => {
    onDirectorySelect(drive);
  };

  const navigateToPath = (path: string) => {
    onDirectorySelect(path);
  };

  // Disques disponibles (à adapter selon le système)
  const availableDrives = [
    { letter: 'C:', label: 'Disque système (C:)' },
    { letter: 'D:', label: 'Disque de données (D:)' },
    { letter: 'E:', label: 'Disque externe (E:)' },
    { letter: 'F:', label: 'Disque réseau (F:)' }
  ];

  const handleDriveSelect = (drive: string) => {
    onDirectorySelect(drive);
    setIsDirectorySelectorOpen(false);
  };

  const handleCustomPath = () => {
    // Ouvrir un dialogue de sélection de dossier
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = false;
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const path = target.files[0].path;
        // Extraire le chemin du dossier parent
        const directoryPath = path.substring(0, path.lastIndexOf('\\'));
        onDirectorySelect(directoryPath);
      }
    };
    
    input.click();
    setIsDirectorySelectorOpen(false);
  };

  // Extraire les parties du chemin
  const getPathParts = () => {
    if (!currentDirectory) return [];
    
    const driveMatch = currentDirectory.match(/^([A-Z]:)(.*)$/i);
    if (!driveMatch) return [];
    
    const [, drive, relativePath] = driveMatch;
    const cleanPath = relativePath.replace(/^[\\\/]+|[\\\/]+$/g, '');
    const pathParts = cleanPath ? cleanPath.split(/[\\\/]+/) : [];
    
    const parts = [{ name: drive, path: drive, isDrive: true }];
    
    let currentPath = drive;
    pathParts.forEach(part => {
      currentPath += '\\' + part;
      parts.push({ name: part, path: currentPath, isDrive: false });
    });
    
    return parts;
  };

  const pathParts = getPathParts();

  return (
    <div className="flex items-center space-x-1 text-sm overflow-x-auto">
      {/* Sélecteur de disque intégré */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setIsDirectorySelectorOpen(!isDirectorySelectorOpen)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors hover:bg-slate-700/50"
          style={{
            borderColor: colors.border,
            color: colors.primary,
            backgroundColor: colors.surface,
          }}
          title="Choisir un autre disque ou répertoire"
        >
          <FolderIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {!currentDirectory ? 'Sélection de disque' : 'Choisir disque'}
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${isDirectorySelectorOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDirectorySelectorOpen && (
          <div
            className="absolute top-full left-0 mt-1 rounded-lg border shadow-lg z-[100] min-w-48"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="p-2">
              {/* Disques disponibles */}
              <div className="space-y-1">
                {availableDrives.map((drive) => (
                  <button
                    key={drive.letter}
                    onClick={() => handleDriveSelect(drive.letter)}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors hover:bg-slate-700/50 text-left"
                    style={{ color: colors.text }}
                  >
                    <FolderIcon className="h-4 w-4" style={{ color: colors.primary }} />
                    <span>{drive.label}</span>
                  </button>
                ))}
              </div>

              {/* Séparateur */}
              <div className="my-2 border-t" style={{ borderColor: colors.border }} />

              {/* Option personnalisée */}
              <button
                onClick={handleCustomPath}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors hover:bg-slate-700/50 text-left"
                style={{ color: colors.text }}
              >
                <FolderIcon className="h-4 w-4" style={{ color: colors.primary }} />
                <span>Autre répertoire...</span>
              </button>
            </div>
          </div>
        )}

        {/* Overlay pour fermer le menu */}
        {isDirectorySelectorOpen && (
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setIsDirectorySelectorOpen(false)}
          />
        )}
      </div>

                {/* Séparateur */}
          {currentDirectory && (
            <>
              <span style={{ color: colors.textSecondary }} className="flex-shrink-0">|</span>
              
              
              
              {/* Chemin cliquable */}
              <span style={{ color: colors.textSecondary }} className="flex-shrink-0">|</span>
          
          {/* Affichage du chemin avec liens cliquables */}
          <div className="flex items-center space-x-1 flex-1 min-w-0">
            {pathParts.map((part, index) => (
              <React.Fragment key={part.path}>
                {/* Lien vers ce niveau du chemin */}
                <button
                  onClick={() => navigateToPath(part.path)}
                  className={`px-2 py-1 rounded transition-colors hover:bg-slate-700/50 truncate max-w-32 ${
                    index === pathParts.length - 1 
                      ? 'font-semibold' 
                      : 'hover:underline'
                  }`}
                  style={{ 
                    color: index === pathParts.length - 1 
                      ? colors.text 
                      : colors.primary 
                  }}
                  title={`Naviguer vers: ${part.path}`}
                >
                  {part.name}
                </button>
                
                {/* Chevron séparateur (sauf pour le dernier élément) */}
                {index < pathParts.length - 1 && (
                  <ChevronRightIcon 
                    className="h-4 w-4 flex-shrink-0" 
                    style={{ color: colors.textSecondary }} 
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BreadcrumbNavigation;
