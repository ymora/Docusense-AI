import React, { useState, useEffect } from 'react';
import {
  FolderIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface DirectoryNavigatorProps {
  currentPath: string;
  onPathChange: (path: string) => void;
}

interface DirectoryItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  mime_type?: string;
  is_supported?: boolean;
  file_count?: number;
  has_permission?: boolean;
}

interface DirectoryContent {
  directory: string;
  files: DirectoryItem[];
  subdirectories: DirectoryItem[];
  total_files: number;
  total_subdirectories: number;
}

const DirectoryNavigator: React.FC<DirectoryNavigatorProps> = ({
  currentPath,
  onPathChange,
}) => {
  const [content, setContent] = useState<DirectoryContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  // Charger le contenu du répertoire
  const loadDirectoryContent = async (path: string) => {
    if (!path) {return;}

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/files/list/${encodeURIComponent(path)}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setContent(data);

      // Ajouter au historique de navigation
      if (!pathHistory.includes(path)) {
        setPathHistory(prev => [...prev, path]);
      } else {
        // Si le chemin existe déjà, retirer tous les chemins après celui-ci
        setPathHistory(prev => {
          const index = prev.indexOf(path);
          return prev.slice(0, index + 1);
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  // Charger le contenu quand le chemin change
  useEffect(() => {
    if (currentPath) {
      loadDirectoryContent(currentPath);
    }
  }, [currentPath]);

  // Navigation vers un sous-dossier
  const navigateToDirectory = (path: string) => {
    onPathChange(path);
  };

  // Navigation vers le dossier parent
  const navigateToParent = () => {
    if (!currentPath) return;
    
    // Si on est à la racine d'un disque (ex: 'C:'), ne rien faire
    if (/^[A-Z]:$/i.test(currentPath)) {
      console.log('📍 Déjà à la racine du disque, impossible de remonter');
      return;
    }
    
    // Sinon, remonter d'un niveau
    const parts = currentPath.split(/[/\\]/).filter(Boolean);
    if (parts.length > 1) {
      let parentPath = parts.slice(0, -1).join('\\');
      // Si on arrive à un disque (ex: 'C:'), garder le format
      if (/^[A-Z]:$/i.test(parentPath)) {
        parentPath = parentPath.toUpperCase();
      }
      console.log('⬆️ Remontée vers le dossier parent:', parentPath);
      onPathChange(parentPath);
    }
  };

  // Navigation vers un dossier précédent
  const navigateToPrevious = () => {
    if (pathHistory.length > 1) {
      const newHistory = [...pathHistory];
      newHistory.pop(); // Retirer le chemin actuel
      const previousPath = newHistory[newHistory.length - 1];
      setPathHistory(newHistory);
      onPathChange(previousPath);
    } else if (currentPath) {
      // Si pas d'historique, utiliser la logique de remontée vers le parent
      navigateToParent();
    }
  };

  // Formater la taille des fichiers
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Obtenir l'icône pour un fichier
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {return '🖼️';}
    if (mimeType.startsWith('video/')) {return '🎥';}
    if (mimeType.startsWith('audio/')) {return '🎵';}
    if (mimeType.includes('pdf')) {return '📄';}
    if (mimeType.includes('word') || mimeType.includes('document')) {return '📝';}
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {return '📊';}
    return '📄';
  };

  return (
    <div className="space-y-4">
      {/* Barre de navigation */}
      <div className="bg-slate-700 rounded-lg p-3">
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={navigateToPrevious}
            disabled={!currentPath || (pathHistory.length <= 1 && /^[A-Z]:$/i.test(currentPath))}
            className="p-1 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title={pathHistory.length > 1 ? "Retour au dossier précédent" : "Retour au dossier parent"}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          <button
            onClick={navigateToParent}
            disabled={!currentPath || currentPath.split('\\').length <= 1}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 transition-colors"
            title="Dossier parent"
          >
            <ChevronUpIcon className="h-4 w-4" />
            <span className="text-xs">Parent</span>
          </button>

          <div className="flex-1 text-sm text-slate-300 truncate">
            {currentPath || 'Aucun répertoire sélectionné'}
          </div>
        </div>

        {/* Breadcrumb */}
        {currentPath && (
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            {currentPath.split('\\').map((part, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span>/</span>}
                <button
                  onClick={() => {
                    const path = currentPath.split('\\').slice(0, index + 1).join('\\');
                    onPathChange(path);
                  }}
                  className="hover:text-slate-200 hover:underline"
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Contenu du répertoire */}
      <div className="bg-slate-800 rounded-lg p-3">
        <h3 className="text-sm font-medium text-slate-200 mb-3">Contenu du répertoire</h3>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-slate-400">Chargement...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-400">
            <p>Erreur: {error}</p>
            <button
              onClick={() => loadDirectoryContent(currentPath)}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && content && (
          <div className="space-y-2">
            {/* Sous-dossiers */}
            {content.subdirectories.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Dossiers ({content.total_subdirectories})
                </h4>
                <div className="space-y-1">
                  {content.subdirectories.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigateToDirectory(item.path)}
                      className="w-full flex items-center p-2 rounded hover:bg-slate-700 transition-colors text-left"
                      disabled={!item.has_permission}
                    >
                      <FolderIcon className="h-4 w-4 mr-2 text-blue-400" />
                      <span className="flex-1 truncate text-slate-300">
                        {item.name}
                      </span>
                      {/* Ancien affichage du nombre de fichiers supprimé */}
                      {/* <span className="text-xs text-slate-500 ml-1">({item.file_count} fichiers)</span> */}
                      {!item.has_permission && (
                        <span className="text-xs text-red-400 ml-2">Accès refusé</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fichiers */}
            {content.files.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Fichiers ({content.total_files})
                </h4>
                <div className="space-y-1">
                  {content.files.map((item) => (
                    <div
                      key={item.path}
                      className="flex items-center p-2 rounded hover:bg-slate-700 transition-colors"
                    >
                      <span className="mr-2 text-lg">
                        {getFileIcon(item.mime_type || 'unknown')}
                      </span>
                      <span className="flex-1 truncate text-slate-300">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        {formatFileSize(item.size || 0)}
                      </span>
                      {item.is_supported && (
                        <span className="text-xs text-green-400 ml-2">✓ Supporté</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {content.total_files === 0 && content.total_subdirectories === 0 && (
              <div className="text-center py-8 text-slate-400">
                <div className="text-2xl mb-2">📁</div>
                <p>Ce répertoire est vide</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryNavigator;