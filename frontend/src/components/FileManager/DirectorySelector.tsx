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

        // Forcer automatiquement la navigation vers le lecteur D
        if (data.drives && data.drives.length > 0 && !isInitialized) {
          setIsInitialized(true);
          
          // Chercher le lecteur D en priorité
          const driveD = data.drives.find((drive: string) => drive.toUpperCase().includes('D:'));
          if (driveD) {
            console.log('🚀 Navigation automatique vers le lecteur D:', driveD);
            onDirectorySelect(driveD);
          } else {
            // Si pas de lecteur D, prendre le premier disponible
            console.log('⚠️ Lecteur D non trouvé, utilisation du premier lecteur:', data.drives[0]);
            onDirectorySelect(data.drives[0]);
          }
        }
      } catch (e) {
        console.error('❌ Erreur lors du chargement des lecteurs:', e);
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
        className="w-full flex items-center justify-between p-2 hover:bg-slate-700 rounded border border-slate-600 text-blue-400 hover:text-blue-500 transition-all duration-200"
        title="Sélectionner un disque système (D: par défaut)"
      >
        <div className="flex items-center">
          <DeviceTabletIcon className="w-5 h-5 mr-2" />
          <span className="text-sm">
            {currentDirectory ? `Disque actuel: ${currentDirectory}` : 'Choisir un disque (D: par défaut)'}
          </span>
        </div>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showDrives && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded shadow-lg z-50">
          <div className="p-2 border-b border-slate-600">
            <div className="text-xs text-slate-400 font-medium">Disques disponibles :</div>
          </div>
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
                  <span className="text-sm">{drive}</span>
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