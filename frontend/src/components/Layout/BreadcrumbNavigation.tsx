import React, { useState, useEffect, useRef } from 'react';
import { useColors } from '../../hooks/useColors';
import { FolderIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface BreadcrumbNavigationProps {
  currentDirectory?: string | null;
  onDirectorySelect: (directory: string) => void;
}

interface Drive {
  letter: string;
  label: string;
  available: boolean;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  currentDirectory,
  onDirectorySelect
}) => {
  const { colors } = useColors();
  const [isDirectorySelectorOpen, setIsDirectorySelectorOpen] = useState(false);
  const [availableDrives, setAvailableDrives] = useState<Drive[]>([]);
  const [isLoadingDrives, setIsLoadingDrives] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Charger les disques disponibles depuis le backend
  useEffect(() => {
    const loadAvailableDrives = async () => {
      setIsLoadingDrives(true);
      try {
        const response = await fetch('/api/files/drives');
        if (response.ok) {
          const data = await response.json();
          // L'API retourne {drives: Array} - extraire le tableau
          if (data && data.drives && Array.isArray(data.drives)) {
            // Convertir les chaînes de caractères en objets Drive
            const driveObjects = data.drives.map((drive: string) => ({
              letter: drive,
              label: `Disque ${drive}`,
              available: true
            }));
            setAvailableDrives(driveObjects);
            
            // Forcer la navigation vers le lecteur D si aucun répertoire n'est sélectionné
            if (!currentDirectory && driveObjects.length > 0) {
              const driveD = driveObjects.find(drive => drive.letter.toUpperCase().includes('D:'));
              if (driveD) {
                console.log('🚀 Breadcrumb: Navigation automatique vers le lecteur D:', driveD.letter);
                onDirectorySelect(driveD.letter);
              } else {
                console.log('⚠️ Breadcrumb: Lecteur D non trouvé, utilisation du premier lecteur:', driveObjects[0].letter);
                onDirectorySelect(driveObjects[0].letter);
              }
            }
          } else {
            console.error('L\'API a retourné un format invalide:', data);
            // Fallback vers des disques par défaut
            setAvailableDrives([
              { letter: 'C:', label: 'Disque système (C:)', available: true },
              { letter: 'D:', label: 'Disque de données (D:)', available: true },
              { letter: 'E:', label: 'Disque externe (E:)', available: true }
            ]);
            
            // Forcer la navigation vers D: même en fallback
            if (!currentDirectory) {
              console.log('🚀 Breadcrumb: Navigation automatique vers D: (fallback)');
              onDirectorySelect('D:');
            }
          }
        } else {
          console.error('Erreur API:', response.status, response.statusText);
          // Fallback vers des disques par défaut si l'API échoue
          setAvailableDrives([
            { letter: 'C:', label: 'Disque système (C:)', available: true },
            { letter: 'D:', label: 'Disque de données (D:)', available: true },
            { letter: 'E:', label: 'Disque externe (E:)', available: true }
          ]);
          
          // Forcer la navigation vers D: même en cas d'erreur
          if (!currentDirectory) {
            console.log('🚀 Breadcrumb: Navigation automatique vers D: (erreur API)');
            onDirectorySelect('D:');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des disques:', error);
        // Fallback vers des disques par défaut
        setAvailableDrives([
          { letter: 'C:', label: 'Disque système (C:)', available: true },
          { letter: 'D:', label: 'Disque de données (D:)', available: true },
          { letter: 'E:', label: 'Disque externe (E:)', available: true }
        ]);
        
        // Forcer la navigation vers D: même en cas d'exception
        if (!currentDirectory) {
          console.log('🚀 Breadcrumb: Navigation automatique vers D: (exception)');
          onDirectorySelect('D:');
        }
      } finally {
        setIsLoadingDrives(false);
      }
    };

    loadAvailableDrives();
  }, [currentDirectory, onDirectorySelect]);

  const navigateToDrive = (drive: string) => {
    onDirectorySelect(drive);
  };

  const navigateToPath = (path: string) => {
    onDirectorySelect(path);
  };

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

  // Gestion de la navigation au clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isDirectorySelectorOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => {
            const totalItems = availableDrives.length + 1; // +1 pour "Autre répertoire"
            return prev < totalItems - 1 ? prev + 1 : 0;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => {
            const totalItems = availableDrives.length + 1;
            return prev > 0 ? prev - 1 : totalItems - 1;
          });
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex < availableDrives.length) {
            handleDriveSelect(availableDrives[selectedIndex].letter);
          } else {
            handleCustomPath();
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsDirectorySelectorOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDirectorySelectorOpen, selectedIndex, availableDrives]);

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsDirectorySelectorOpen(false);
      }
    };

    if (isDirectorySelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDirectorySelectorOpen]);

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
    <div className="flex flex-col space-y-2 text-sm overflow-hidden">
      {/* Sélecteur de disque intégré */}
      <div className="relative flex-shrink-0">
        <button
          ref={buttonRef}
          onClick={() => {
            setIsDirectorySelectorOpen(!isDirectorySelectorOpen);
            setSelectedIndex(0); // Réinitialiser la sélection
          }}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors hover:bg-slate-700/50"
          style={{
            borderColor: colors.border,
            color: colors.primary,
            backgroundColor: colors.surface,
          }}
          title="Choisir un autre disque ou répertoire (Utilisez les flèches du clavier)"
          disabled={isLoadingDrives}
        >
          <FolderIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isLoadingDrives ? 'Chargement...' : (!currentDirectory ? 'Sélection de disque' : 'Choisir disque')}
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
            ref={dropdownRef}
            className="absolute top-full left-0 mt-1 rounded-lg border shadow-lg z-[9999] min-w-48 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="p-2">
              {isLoadingDrives ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: colors.primary }}></div>
                  <span className="ml-2 text-sm" style={{ color: colors.textSecondary }}>Chargement des disques...</span>
                </div>
              ) : (
                <>
                  {/* Disques disponibles */}
                  <div className="space-y-1">
                    {Array.isArray(availableDrives) && availableDrives.map((drive, index) => (
                      <button
                        key={drive.letter}
                        onClick={() => handleDriveSelect(drive.letter)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors text-left ${
                          !drive.available ? 'opacity-50 cursor-not-allowed' : 
                          index === selectedIndex ? 'bg-slate-600' : 'hover:bg-slate-700/50'
                        }`}
                        style={{ color: colors.text }}
                        disabled={!drive.available}
                        title={drive.available ? `Naviguer vers ${drive.label} (Entrée pour sélectionner)` : `${drive.label} - Non disponible`}
                      >
                        <FolderIcon className="h-4 w-4 flex-shrink-0" style={{ color: colors.primary }} />
                        <span className="truncate">{drive.label}</span>
                        {!drive.available && (
                          <span className="text-xs" style={{ color: colors.textSecondary }}>(N/A)</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Séparateur */}
                  <div className="my-2 border-t" style={{ borderColor: colors.border }} />

                  {/* Option personnalisée */}
                  <button
                    onClick={handleCustomPath}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors text-left ${
                      selectedIndex === availableDrives.length ? 'bg-slate-600' : 'hover:bg-slate-700/50'
                    }`}
                    style={{ color: colors.text }}
                    title="Sélectionner un autre répertoire (Entrée pour sélectionner)"
                  >
                    <FolderIcon className="h-4 w-4 flex-shrink-0" style={{ color: colors.primary }} />
                    <span className="truncate">Autre répertoire...</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}


      </div>

      {/* Chemin actuel - affiché sous le sélecteur */}
      {currentDirectory && (
        <div className="flex items-center space-x-1 min-w-0 overflow-hidden">
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
      )}
    </div>
  );
};

export default BreadcrumbNavigation;
