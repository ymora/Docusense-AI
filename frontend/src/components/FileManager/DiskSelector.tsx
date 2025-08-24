import React, { useState, useEffect, useRef } from 'react';
import { FolderIcon, PlusIcon, ComputerDesktopIcon, ServerIcon, CloudIcon } from '@heroicons/react/24/outline';
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

interface CustomPath {
  id: string;
  path: string;
  name: string;
  type: 'network' | 'server' | 'local' | 'cloud';
  isOnline: boolean;
}

const DiskSelector: React.FC<DiskSelectorProps> = ({ onDiskSelect, currentDisk }) => {
  const { colors } = useColors();
  const fileService = useFileService();
  const { canMakeRequests } = useBackendConnection();
  const { isAuthenticated } = useAuthStore();
  const { startStream, stopStream } = useStreamService();
  const [isOpen, setIsOpen] = useState(false);
  const [availableDisks, setAvailableDisks] = useState<string[]>([]);
  const [customPaths, setCustomPaths] = useState<CustomPath[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [diskStatus, setDiskStatus] = useState<Record<string, { status: 'online' | 'offline' | 'error', lastUpdate: string }>>({});
  const [showAddPath, setShowAddPath] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [newPathName, setNewPathName] = useState('');
  const [newPathType, setNewPathType] = useState<'network' | 'server' | 'local' | 'cloud'>('local');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les chemins personnalisés depuis le localStorage
  useEffect(() => {
    const savedPaths = localStorage.getItem('docusense_custom_paths');
    if (savedPaths) {
      try {
        const parsed = JSON.parse(savedPaths);
        setCustomPaths(parsed);
      } catch (error) {
        logService.error('Erreur lors du chargement des chemins personnalisés', 'DiskSelector');
      }
    }
  }, []);

  // Sauvegarder les chemins personnalisés
  const saveCustomPaths = (paths: CustomPath[]) => {
    localStorage.setItem('docusense_custom_paths', JSON.stringify(paths));
    setCustomPaths(paths);
  };

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

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddPath(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDiskSelect = (disk: string) => {
    onDiskSelect(disk);
    setIsOpen(false);
    setShowAddPath(false);
  };

  const handleAddCustomPath = async () => {
    if (!newPath.trim() || !newPathName.trim()) return;

    try {
      // Tester l'accessibilité du chemin
      const testResult = await fileService.checkDiskAccess(newPath);
      
      if (testResult.success) {
        const newCustomPath: CustomPath = {
          id: `custom_${Date.now()}`,
          path: newPath,
          name: newPathName,
          type: newPathType,
          isOnline: true
        };

        const updatedPaths = [...customPaths, newCustomPath];
        saveCustomPaths(updatedPaths);
        
        // Sélectionner automatiquement le nouveau chemin
        handleDiskSelect(newPath);
        
        // Réinitialiser le formulaire
        setNewPath('');
        setNewPathName('');
        setNewPathType('local');
        setShowAddPath(false);
        
        logService.info('Chemin personnalisé ajouté', 'DiskSelector', {
          path: newPath,
          name: newPathName,
          type: newPathType
        });
      } else {
        alert(`Impossible d'accéder au chemin: ${testResult.error || 'Chemin invalide'}`);
      }
    } catch (error) {
      alert(`Erreur lors de l'ajout du chemin: ${error.message}`);
    }
  };

  const handleRemoveCustomPath = (pathId: string) => {
    const updatedPaths = customPaths.filter(p => p.id !== pathId);
    saveCustomPaths(updatedPaths);
  };

  const getPathIcon = (type: string) => {
    switch (type) {
      case 'network':
        return <ComputerDesktopIcon className="w-4 h-4" style={{ color: colors.primary }} />;
      case 'server':
        return <ServerIcon className="w-4 h-4" style={{ color: colors.success }} />;
      case 'cloud':
        return <CloudIcon className="w-4 h-4" style={{ color: colors.warning }} />;
      default:
        return <FolderIcon className="w-4 h-4" style={{ color: colors.textSecondary }} />;
    }
  };

  const getPathTypeLabel = (type: string) => {
    switch (type) {
      case 'network': return 'Réseau';
      case 'server': return 'Serveur';
      case 'cloud': return 'Cloud';
      case 'local': return 'Local';
      default: return 'Autre';
    }
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
          className="absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 max-h-96 overflow-y-auto"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          {/* Disques locaux */}
          <div className="p-2">
            <div className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
              Disques locaux
            </div>
            {availableDisks.map((disk) => (
              <button
                key={disk}
                onClick={() => handleDiskSelect(disk)}
                className={`w-full flex items-center p-2 rounded text-left hover:bg-slate-700 transition-colors ${
                  currentDisk === disk ? 'bg-blue-500/20' : ''
                }`}
                style={{ color: currentDisk === disk ? colors.primary : colors.text }}
              >
                <FolderIcon className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
                <span className="text-xs">{disk}</span>
              </button>
            ))}
          </div>

          {/* Séparateur */}
          {customPaths.length > 0 && (
            <div className="border-t mx-2" style={{ borderColor: colors.border }} />
          )}

          {/* Chemins personnalisés */}
          {customPaths.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                Chemins personnalisés
              </div>
              {customPaths.map((path) => (
                <div key={path.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-700 transition-colors">
                  <button
                    onClick={() => handleDiskSelect(path.path)}
                    className={`flex items-center flex-1 text-left ${
                      currentDisk === path.path ? 'text-blue-500' : ''
                    }`}
                    style={{ color: currentDisk === path.path ? colors.primary : colors.text }}
                  >
                    {getPathIcon(path.type)}
                    <div className="ml-2">
                      <div className="text-xs font-medium">{path.name}</div>
                      <div className="text-xs opacity-70">{path.path}</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRemoveCustomPath(path.id)}
                    className="p-1 rounded hover:bg-red-500/20 transition-colors ml-2"
                    title="Supprimer ce chemin"
                  >
                    <svg className="w-3 h-3" style={{ color: colors.error }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Séparateur */}
          <div className="border-t mx-2" style={{ borderColor: colors.border }} />

          {/* Ajouter un chemin personnalisé */}
          <div className="p-2">
            {!showAddPath ? (
              <button
                onClick={() => setShowAddPath(true)}
                className="w-full flex items-center justify-center p-2 rounded hover:bg-slate-700 transition-colors"
                style={{ color: colors.textSecondary }}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                <span className="text-xs">Ajouter un chemin</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  Nouveau chemin
                </div>
                
                {/* Type de chemin */}
                <select
                  value={newPathType}
                  onChange={(e) => setNewPathType(e.target.value as any)}
                  className="w-full p-1.5 rounded text-xs border"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <option value="local">Local</option>
                  <option value="network">Réseau</option>
                  <option value="server">Serveur</option>
                  <option value="cloud">Cloud</option>
                </select>

                {/* Nom du chemin */}
                <input
                  type="text"
                  placeholder="Nom du chemin (ex: Serveur Documents)"
                  value={newPathName}
                  onChange={(e) => setNewPathName(e.target.value)}
                  className="w-full p-1.5 rounded text-xs border"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                />

                {/* Chemin */}
                <input
                  type="text"
                  placeholder="Chemin (ex: \\\\serveur\\partage ou /mnt/share)"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  className="w-full p-1.5 rounded text-xs border"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                />

                {/* Boutons */}
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddCustomPath}
                    className="flex-1 p-1.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.background
                    }}
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPath(false);
                      setNewPath('');
                      setNewPathName('');
                      setNewPathType('local');
                    }}
                    className="flex-1 p-1.5 rounded text-xs border"
                    style={{
                      borderColor: colors.border,
                      color: colors.text
                    }}
                  >
                    Annuler
                  </button>
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
