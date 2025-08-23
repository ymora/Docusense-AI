import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useFileService } from '../../hooks/useFileService';
import { logService } from '../../services/logService';

interface DiskSelectorProps {
  onDiskSelect: (disk: string) => void;
  currentDisk?: string;
}

const DiskSelector: React.FC<DiskSelectorProps> = ({ onDiskSelect, currentDisk }) => {
  const { colors } = useColors();
  const fileService = useFileService();
  const [isOpen, setIsOpen] = useState(false);
  const [availableDisks, setAvailableDisks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Premier useEffect pour charger les disques
  useEffect(() => {
    const fetchDisks = async () => {
      try {
        setIsLoading(true);
        logService.info('Chargement des disques disponibles', 'DiskSelector', {
          timestamp: new Date().toISOString()
        });

        const result = await fileService.getDrives();
        if (result && result.success && result.data && Array.isArray(result.data)) {
          setAvailableDisks(result.data);
        } else {
          setAvailableDisks([]);
        }

        const disks = result && result.success && result.data && Array.isArray(result.data) ? result.data : [];
        logService.info('Disques chargés avec succès', 'DiskSelector', {
          availableDisks: disks,
          count: disks.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logService.error('Erreur lors du chargement des disques', 'DiskSelector', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.error('Erreur lors du chargement des disques:', error);
        setAvailableDisks([]);
      } finally {
        setIsLoading(false);
        setHasInitialized(true);
      }
    };

    fetchDisks();
  }, []); // Dépendances vides pour ne s'exécuter qu'une fois

  // Deuxième useEffect pour la sélection automatique
  useEffect(() => {
    if (hasInitialized && availableDisks.length > 0 && !currentDisk) {
      const preferredDisk = availableDisks.find(disk => disk === 'D:') || 
                           availableDisks.find(disk => disk === 'C:') || 
                           availableDisks[0];
      
      if (preferredDisk) {
        logService.info('Sélection automatique du disque', 'DiskSelector', {
          selectedDisk: preferredDisk,
          timestamp: new Date().toISOString()
        });
        onDiskSelect(preferredDisk);
      }
    }
  }, [hasInitialized, availableDisks, currentDisk]); // Supprimé onDiskSelect des dépendances

  const handleDiskSelect = (disk: string) => {
    logService.info('Sélection manuelle du disque', 'DiskSelector', {
      selectedDisk: disk,
      timestamp: new Date().toISOString()
    });
    onDiskSelect(disk);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors duration-200 hover:bg-opacity-10"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text
        }}
        disabled={isLoading}
      >
        <FolderIcon className="w-5 h-5" />
        <span className="font-medium">
          {isLoading ? 'Chargement...' : currentDisk || 'Sélectionner un disque'}
        </span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-48 rounded-lg border shadow-lg z-50 max-h-60 overflow-y-auto"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}
        >
          {Array.isArray(availableDisks) && availableDisks.map((disk) => (
            <button
              key={disk}
              onClick={() => handleDiskSelect(disk)}
              className="w-full px-3 py-2 text-left hover:bg-opacity-10 transition-colors duration-200 flex items-center gap-2"
              style={{
                color: colors.text
              }}
            >
              <FolderIcon className="w-4 h-4" />
              <span className="font-medium">{disk}</span>
              {disk === currentDisk && (
                <div
                  className="w-2 h-2 rounded-full ml-auto"
                  style={{ backgroundColor: colors.primary }}
                />
              )}
            </button>
          ))}
          
          {(!Array.isArray(availableDisks) || availableDisks.length === 0) && !isLoading && (
            <div
              className="px-3 py-2 text-sm"
              style={{ color: colors.textSecondary }}
            >
              Aucun disque disponible
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiskSelector;
