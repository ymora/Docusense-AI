import React, { useState, useEffect, useRef } from 'react';
import { DeviceTabletIcon } from '@heroicons/react/24/outline';

interface DirectorySelectorProps {
  onDirectorySelect: (directory: string) => void;
  currentDirectory?: string;
  className?: string;
}

const DirectorySelector: React.FC<DirectorySelectorProps> = ({
  onDirectorySelect,
  currentDirectory = '',
  className = '',
}) => {
  const [showDrives, setShowDrives] = useState(false);
  const [availableDrives, setAvailableDrives] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Charger la liste réelle des lecteurs accessibles depuis l'API backend
  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const res = await fetch('/api/files/drives');
        const data = await res.json();
        setAvailableDrives(data.drives || []);
        
        // Démarrer automatiquement dans le répertoire du projet DocuSense AI seulement si aucun répertoire n'est déjà sélectionné
        if (data.drives && data.drives.length > 0 && !isInitialized && !currentDirectory) {
          const projectPath = 'C:\\Users\\ymora\\Desktop\\Docusense AI';
          onDirectorySelect(projectPath);
          setIsInitialized(true);
        }
      } catch (e) {
        console.error('Erreur lors du chargement des disques:', e);
        setAvailableDrives([]);
      }
    };
    fetchDrives();
  }, [onDirectorySelect, currentDirectory, isInitialized]);

  // Fermer le menu si clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShowDrives(false);
      }
    }
    if (showDrives) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDrives]);

  const handleDriveSelect = (drivePath: string) => {
    setShowDrives(false);
    // Navigation libre vers le disque sélectionné
    onDirectorySelect(drivePath);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setShowDrives(!showDrives)}
        className="p-2 hover:bg-slate-700 rounded text-blue-400 hover:text-blue-500 hover:scale-105 transition-all duration-200 focus:outline-none"
        title="Sélectionner un disque système"
      >
        <DeviceTabletIcon className="w-6 h-6" />
      </button>
      {showDrives && (
        <div className="absolute left-0 mt-2 w-32 bg-slate-800 border border-slate-600 rounded shadow-lg z-50">
          <ul className="py-1">
            {availableDrives.length === 0 && (
              <li className="px-3 py-2 text-slate-400 text-xs">Aucun lecteur détecté</li>
            )}
            {availableDrives.map((drive) => (
              <li key={drive}>
                <button
                  onClick={() => handleDriveSelect(drive)}
                  className="w-full flex items-center px-3 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors"
                  title={`Naviguer vers ${drive}`}
                >
                  <DeviceTabletIcon className="h-4 w-4 mr-2 text-blue-400" />
                  {drive}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DirectorySelector;