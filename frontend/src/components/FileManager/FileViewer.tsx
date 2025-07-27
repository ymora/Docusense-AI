import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';

interface FileViewerProps {
  file: any;
  onClose: () => void;
  currentIndex?: number;
  totalFiles?: number;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose, currentIndex, totalFiles }) => {
  const { colors } = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Déterminer le type de fichier
  const getFileType = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType) {
      if (mimeType.startsWith('text/')) return 'text';
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('excel')) return 'document';
    }
    
    if (extension) {
      const textExtensions = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'sql'];
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
      const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
      
      if (textExtensions.includes(extension)) return 'text';
      if (imageExtensions.includes(extension)) return 'image';
      if (videoExtensions.includes(extension)) return 'video';
    }
    
    return 'unknown';
  };

  const fileType = getFileType(file.name, file.mime_type);

  // Charger le contenu du fichier
  useEffect(() => {
    const loadFileContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 FileViewer: Chargement du fichier:', file.name, 'Type:', fileType);

        if (fileType === 'text') {
          // Pour les fichiers texte, essayer de récupérer le contenu
          console.log('📝 FileViewer: Chargement du contenu texte...');
          const response = await fetch(`/api/files/${file.id}/content`);
          if (response.ok) {
            const content = await response.text();
            setFileContent(content);
            console.log('✅ FileViewer: Contenu texte chargé');
          } else {
            console.error('❌ FileViewer: Erreur lors du chargement du contenu texte:', response.status);
            setError('Impossible de charger le contenu du fichier');
          }
        } else if (fileType === 'image' || fileType === 'video') {
          // Pour les images et vidéos, créer une URL
          console.log('🖼️ FileViewer: Chargement de l\'image/vidéo...');
          const response = await fetch(`/api/files/${file.id}/download`);
          console.log('📡 FileViewer: Réponse du serveur:', response.status, response.statusText);
          
          if (response.ok) {
            const blob = await response.blob();
            console.log('📦 FileViewer: Blob créé, taille:', blob.size, 'type:', blob.type);
            const url = URL.createObjectURL(blob);
            setFileUrl(url);
            console.log('✅ FileViewer: URL créée:', url);
          } else {
            console.error('❌ FileViewer: Erreur lors du téléchargement:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('❌ FileViewer: Détails de l\'erreur:', errorText);
            setError('Impossible de charger le fichier');
          }
        }
      } catch (err) {
        console.error('❌ FileViewer: Erreur de chargement:', err);
        setError('Erreur lors du chargement du fichier');
      } finally {
        setIsLoading(false);
      }
    };

    if (file) {
      loadFileContent();
    }

    // Nettoyer l'URL lors du démontage
    return () => {
      if (fileUrl) {
        console.log('🧹 FileViewer: Nettoyage de l\'URL:', fileUrl);
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file, fileType]);

  // Télécharger le fichier
  const handleDownload = async () => {
    if (!file || !file.id) {
      console.warn('Tentative de téléchargement sans fichier valide');
      return;
    }

    try {
      const response = await fetch(`/api/files/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        console.error('Erreur lors du téléchargement:', response.statusText);
      }
    } catch (err) {
      console.error('Erreur de téléchargement:', err);
    }
  };

  // Obtenir l'icône du fichier
  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <PhotoIcon className="h-8 w-8" style={{ color: colors.textSecondary }} />;
      case 'video':
        return <VideoCameraIcon className="h-8 w-8" style={{ color: colors.textSecondary }} />;
      default:
        return <DocumentIcon className="h-8 w-8" style={{ color: colors.textSecondary }} />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div 
        className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        <div className="flex items-center space-x-3">
          {getFileIcon()}
          <div>
            <h3 
              className="text-lg font-semibold"
              style={{ color: colors.text }}
            >
              {file.name}
            </h3>
            {currentIndex !== undefined && totalFiles && (
              <p 
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                {currentIndex + 1} / {totalFiles} fichiers
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Télécharger"
            style={{
              backgroundColor: 'transparent',
              color: colors.textSecondary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.border;
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textSecondary;
            }}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Fermer (Échap)"
            style={{
              backgroundColor: 'transparent',
              color: colors.textSecondary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.border;
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textSecondary;
            }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: colors.config }}
            ></div>
            <span 
              className="ml-3"
              style={{ color: colors.textSecondary }}
            >
              Chargement...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div 
              className="text-6xl mb-4"
              style={{ color: colors.error }}
            >
              ⚠️
            </div>
            <h3 
              className="text-lg font-medium mb-2"
              style={{ color: colors.text }}
            >
              Erreur de chargement
            </h3>
            <p style={{ color: colors.textSecondary }}>{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Informations du fichier */}
            <div 
              className="rounded-lg p-4"
              style={{ backgroundColor: colors.surface }}
            >
              <h4 
                className="text-sm font-medium mb-3"
                style={{ color: colors.text }}
              >
                Informations
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{ color: colors.textSecondary }}>Type MIME:</span>
                  <span 
                    className="ml-2"
                    style={{ color: colors.text }}
                  >
                    {file.mime_type || 'Inconnu'}
                  </span>
                </div>
                <div>
                  <span style={{ color: colors.textSecondary }}>Chemin:</span>
                  <span 
                    className="ml-2 truncate"
                    style={{ color: colors.text }}
                  >
                    {file.path}
                  </span>
                </div>
              </div>
            </div>

            {/* Contenu du fichier selon le type */}
            {fileType === 'text' && fileContent && (
              <div 
                className="rounded-lg border flex-1"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <div 
                  className="px-4 py-2 border-b"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }}
                >
                  <h4 
                    className="text-sm font-medium"
                    style={{ color: colors.text }}
                  >
                    Contenu du fichier
                  </h4>
                </div>
                <div className="p-4">
                  <pre 
                    className="text-sm whitespace-pre-wrap overflow-x-auto"
                    style={{ color: colors.text }}
                  >
                    {fileContent}
                  </pre>
                </div>
              </div>
            )}

            {fileType === 'image' && fileUrl && (
              <div 
                className="rounded-lg border p-4 flex-1"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <div className="flex justify-center">
                  {console.log('🖼️ FileViewer: Rendu de l\'image avec URL:', fileUrl)}
                  <img 
                    src={fileUrl} 
                    alt={file.name}
                    className="max-w-full max-h-96 object-contain"
                    onLoad={() => console.log('✅ FileViewer: Image chargée avec succès')}
                    onError={(e) => console.error('❌ FileViewer: Erreur de chargement de l\'image:', e)}
                  />
                </div>
              </div>
            )}

            {fileType === 'video' && fileUrl && (
              <div 
                className="rounded-lg border p-4 flex-1"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <div className="flex justify-center">
                  <video controls className="max-w-full max-h-96">
                    <source src={fileUrl} type={file.mime_type} />
                    Votre navigateur ne supporte pas l'élément vidéo.
                  </video>
                </div>
              </div>
            )}

            {fileType === 'document' && (
              <div 
                className="rounded-lg border p-8 flex-1"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <div className="text-center">
                  <DocumentIcon 
                    className="h-16 w-16 mx-auto mb-4"
                    style={{ color: colors.textSecondary }}
                  />
                  <h4 
                    className="text-lg font-medium mb-2"
                    style={{ color: colors.text }}
                  >
                    Document non prévisualisable
                  </h4>
                  <p 
                    className="mb-4"
                    style={{ color: colors.textSecondary }}
                  >
                    Ce type de document ne peut pas être prévisualisé directement.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Télécharger pour visualiser
                  </button>
                </div>
              </div>
            )}

            {fileType === 'unknown' && (
              <div 
                className="rounded-lg border p-8 flex-1"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <div className="text-center">
                  <DocumentIcon 
                    className="h-16 w-16 mx-auto mb-4"
                    style={{ color: colors.textSecondary }}
                  />
                  <h4 
                    className="text-lg font-medium mb-2"
                    style={{ color: colors.text }}
                  >
                    Type de fichier non supporté
                  </h4>
                  <p 
                    className="mb-4"
                    style={{ color: colors.textSecondary }}
                  >
                    Ce type de fichier ne peut pas être prévisualisé.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Télécharger le fichier
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;