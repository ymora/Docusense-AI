import React, { useState } from 'react';
import { useColors } from '../../hooks/useColors';
import UnifiedFileViewer from './UnifiedFileViewer';
import {
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  FolderIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Button } from '../UI/Button';

interface File {
  id?: number;
  name: string;
  path: string;
  mime_type?: string;
  size?: number;
  is_directory?: boolean;
}

interface ThumbnailGridProps {
  files: File[];
  onFileSelect?: (file: File) => void;
}

const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({ files, onFileSelect }) => {
  const { colors } = useColors();
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);

  const getFileIcon = (file: File) => {
    if (file.is_directory) {
      return <FolderIcon className="h-8 w-8" style={{ color: colors.primary }} />;
    }

    const mimeType = file.mime_type || '';
    
    if (mimeType.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8" style={{ color: colors.primary }} />;
    } else if (mimeType.startsWith('video/')) {
      return <FilmIcon className="h-8 w-8" style={{ color: colors.primary }} />;
    } else if (mimeType.startsWith('audio/')) {
      return <MusicalNoteIcon className="h-8 w-8" style={{ color: colors.primary }} />;
    } else {
      return <DocumentIcon className="h-8 w-8" style={{ color: colors.primary }} />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleThumbnailClick = (file: File) => {
    setSelectedThumbnailFile(file);
  };

  const handleBackToThumbnails = () => {
    setSelectedThumbnailFile(null);
  };

  // Si un fichier est sélectionné pour l'affichage détaillé
  if (selectedThumbnailFile) {
    return (
      <div className="h-full flex flex-col">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0" style={{ borderColor: colors.border }}>
          <Button
            onClick={handleBackToThumbnails}
            variant="secondary"
            size="sm"
            icon={<ArrowLeftIcon />}
            className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Retour aux miniatures ({files.length})
          </Button>
          <h3 
            className="text-sm font-medium truncate mx-4" 
            title={selectedThumbnailFile.name}
            style={{ color: colors.text }}
          >
            {selectedThumbnailFile.name}
          </h3>
          <div className="w-32"></div>
        </div>
        
        {/* Contenu du fichier en plein écran */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="w-full h-full">
            <UnifiedFileViewer file={selectedThumbnailFile} />
          </div>
        </div>
      </div>
    );
  }

  // Affichage de la grille de miniatures
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🖼️</div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
              Miniatures ({files.length})
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Affichage en grille des fichiers sélectionnés
            </p>
          </div>
        </div>
      </div>

      {/* Grille de miniatures */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div
              key={`${file.path}-${index}`}
              className="group cursor-pointer"
              onClick={() => handleThumbnailClick(file)}
            >
              <div
                className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all duration-200 hover:border-solid hover:scale-105"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.backgroundColor = colors.hover.surface;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.backgroundColor = colors.surface;
                }}
              >
                {/* Icône du fichier */}
                <div className="mb-2">
                  {getFileIcon(file)}
                </div>
                
                {/* Nom du fichier */}
                <div className="text-center">
                  <p 
                    className="text-xs font-medium truncate w-full"
                    style={{ color: colors.text }}
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  
                  {/* Taille du fichier */}
                  {!file.is_directory && file.size && (
                    <p 
                      className="text-xs mt-1"
                      style={{ color: colors.textSecondary }}
                    >
                      {formatFileSize(file.size)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucun fichier */}
        {files.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🖼️</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
              Aucun fichier sélectionné
            </h3>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Sélectionnez des fichiers pour les afficher en miniatures
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThumbnailGrid;
