import React, { useState, useEffect, useRef } from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { useFileService } from '../../services/fileService';
import { logService } from '../../services/logService';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import useAuthStore from '../../stores/authStore';
import { useStreamService } from '../../services/streamService';

interface DiskSelectorProps {
  onDiskSelect: (disk: string) => void;
  currentDisk?: string;
}

const DiskSelector: React.FC<DiskSelectorProps> = ({ onDiskSelect, currentDisk }) => {
  const { colors } = useColors();
  const fileService = useFileService();
  const { canMakeRequests } = useBackendConnection();
  const { isAuthenticated } = useAuthStore();
  const { startStream, stopStream } = useStreamService();
  const [isOpen, setIsOpen] = useState(false);
  const [availableDisks, setAvailableDisks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [diskStatus, setDiskStatus] = useState<Record<string, { status: 'online' | 'offline' | 'error', lastUpdate: string }>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les disques disponibles avec streams SSE
  useEffect(() => {
    const fetchDisks = async () => {
      try {
        setIsLoading(true);
        logService.info('Chargement des disques disponibles', 'DiskSelector', {
          timestamp: new Date().toISOString()
        });
        
        const disks = await fileService.getDrives();
        setAvailableDisks(disks);
        
        // Initialiser le statut des disques
        const initialStatus: Record<string, { status: 'online' | 'offline' | 'error', lastUpdate: string }> = {};
        disks.forEach(disk => {
          initialStatus[disk] = { status: 'online', lastUpdate: new Date().toISOString() };
        });
        setDiskStatus(initialStatus);
        
        logService.info('Disques chargés avec succès', 'DiskSelector', {
          availableDisks: disks,
          count: disks.length,
          timestamp: new Date().toISOString()
        });
        
        // Sélection automatique : D si disponible, sinon C
        if (disks.length > 0) {
          const preferredDisk = disks.find(disk => disk === 'D:') || disks.find(disk => disk === 'C:') || disks[0];
          if (preferredDisk && !currentDisk) {
            logService.info('Sélection automatique du disque', 'DiskSelector', {
              selectedDisk: preferredDisk,
              timestamp: new Date().toISOString()
            });
            onDiskSelect(preferredDisk);
          }
        }
      } catch (error) {
        logService.error('Erreur lors du chargement des disques', 'DiskSelector', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
        setAvailableDisks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisks();
  }, [currentDisk, onDiskSelect, isAuthenticated, canMakeRequests]);

  // Stream SSE pour les mises à jour des disques (optionnel)
  useEffect(() => {
    if (isAuthenticated && availableDisks.length > 0) {
      // Démarrer le stream pour les mises à jour des fichiers
      const streamStarted = startStream('files', {
        onMessage: (message) => {
          if (message.type === 'disk_status_update') {
            setDiskStatus(prev => ({
              ...prev,
              [message.disk]: {
                status: message.status,
                lastUpdate: new Date().toISOString()
              }
            }));
          }
        },
        onError: (error) => {
          // Erreur silencieuse - utilisation du cache
          logService.debug('Stream disques non disponible, utilisation du cache', 'DiskSelector');
        }
      });

      return () => {
        if (streamStarted) {
          stopStream('files');
        }
      };
    }
  }, [isAuthenticated, availableDisks, startStream, stopStream]);

  // Fermer le menu si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDiskSelect = (disk: string) => {
    logService.info('Sélection manuelle d\'un disque', 'DiskSelector', {
      selectedDisk: disk,
      previousDisk: currentDisk,
      timestamp: new Date().toISOString()
    });
    onDiskSelect(disk);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 hover:bg-slate-700`}
        style={{ 
          borderColor: colors.border,
          color: colors.textSecondary,
          backgroundColor: colors.surface,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = colors.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = colors.textSecondary;
        }}
        disabled={isLoading}
      >
        <div className="flex items-center">
          <FolderIcon className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
          <span className="text-xs font-medium">
            {isLoading ? 'Chargement...' : 
             (currentDisk ? `Disque: ${currentDisk}` : 'Sélectionner un disque')}
          </span>
        </div>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border rounded-lg shadow-xl z-[9999] max-h-80 overflow-hidden"
          style={{ borderColor: colors.border }}
        >
          {/* Header */}
          <div 
            className="p-2.5 border-b"
            style={{ borderColor: colors.border }}
          >
            <div className="flex items-center">
              <span className="text-base mr-2">💾</span>
              <div>
                <div className="text-xs font-medium" style={{ color: colors.text }}>
                  Disques disponibles
                </div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>
                  {availableDisks.length} disque(s) détecté(s)
                </div>
              </div>
            </div>
          </div>

          {/* Liste des disques */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 mx-auto mb-2" style={{ borderColor: colors.primary }}></div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>
                  Chargement des disques...
                </div>
              </div>
            ) : availableDisks.length > 0 ? (
              <div className="py-1">
                {availableDisks.map((disk) => (
                  <button
                    key={disk}
                    onClick={() => handleDiskSelect(disk)}
                    className="w-full flex items-center px-3 py-2 text-left hover:bg-slate-800 transition-colors border-b last:border-b-0"
                    style={{ 
                      color: colors.text,
                      borderColor: colors.border 
                    }}
                    title={`Naviguer vers ${disk}`}
                  >
                    <FolderIcon className="h-4 w-4 mr-2 flex-shrink-0" style={{ color: colors.primary }} />
                    <div className="flex-1">
                      <div className="text-xs font-medium flex items-center">
                        {disk}
                        {diskStatus[disk] && (
                          <div 
                            className={`ml-2 w-2 h-2 rounded-full ${
                              diskStatus[disk].status === 'online' ? 'bg-green-500' :
                              diskStatus[disk].status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                            title={`Statut: ${diskStatus[disk].status}`}
                          />
                        )}
                      </div>
                      <div className="text-xs" style={{ color: colors.textSecondary }}>
                        {diskStatus[disk]?.status === 'online' ? 'Disque accessible' :
                         diskStatus[disk]?.status === 'error' ? 'Erreur d\'accès' : 'Vérification...'}
                      </div>
                    </div>
                    {currentDisk === disk && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center">
                <div className="text-lg mb-2">💾</div>
                <div className="text-xs" style={{ color: colors.textSecondary }}>
                  Aucun lecteur détecté
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiskSelector;
