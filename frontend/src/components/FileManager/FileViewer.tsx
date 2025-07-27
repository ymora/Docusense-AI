import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  DocumentIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface FileViewerProps {
  file: any;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose }) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Déterminer le type de fichier
  const getFileType = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '') ||
        mimeType?.startsWith('image/')) {
      return 'image';
    }

    // Audio
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension || '') ||
        mimeType?.startsWith('audio/')) {
      return 'audio';
    }

    // Vidéo
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '') ||
        mimeType?.startsWith('video/')) {
      return 'video';
    }

    // Texte
    if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'].includes(extension || '') ||
        mimeType?.startsWith('text/')) {
      return 'text';
    }

    // Documents
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '')) {
      return 'document';
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

        if (fileType === 'text') {
          // Pour les fichiers texte, essayer de lire le contenu
          try {
            const response = await fetch(`/api/files/${file.id}/content`);
            if (response.ok) {
              const content = await response.text();
              setFileContent(content);
            } else {
              setError('Impossible de charger le contenu du fichier');
            }
          } catch (err) {
            setError('Erreur lors du chargement du contenu');
          }
        } else if (['image', 'audio', 'video'].includes(fileType)) {
          // Pour les fichiers multimédias, créer une URL
          try {
            const response = await fetch(`/api/files/${file.id}/download`);
            if (response.ok) {
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              setFileUrl(url);
            } else {
              setError('Impossible de télécharger le fichier');
            }
          } catch (err) {
            setError('Erreur lors du téléchargement');
          }
        }
      } catch (err) {
        setError('Erreur inattendue');
      } finally {
        setIsLoading(false);
      }
    };

    if (file && file.id) {
      loadFileContent();
    } else {
      setIsLoading(false);
      setError('Fichier non disponible');
    }

    // Nettoyer l'URL lors du démontage
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file, fileType]);

  // Télécharger le fichier
  const handleDownload = async () => {
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
      }
    } catch (error) {

    }
  };

  // Obtenir l'icône appropriée
  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <PhotoIcon className="h-8 w-8 text-blue-400" />;
      case 'audio':
        return <MusicalNoteIcon className="h-8 w-8 text-green-400" />;
      case 'video':
        return <VideoCameraIcon className="h-8 w-8 text-purple-400" />;
      case 'text':
        return <DocumentTextIcon className="h-8 w-8 text-yellow-400" />;
      case 'document':
        return <DocumentIcon className="h-8 w-8 text-red-400" />;
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-400" />;
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {return '0 Bytes';}
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-600 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-700 px-4 py-3 border-b border-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFileIcon()}
            <div>
              <h3 className="text-lg font-semibold text-slate-200">{file.name}</h3>
              <p className="text-sm text-slate-400">
                {fileType.charAt(0).toUpperCase() + fileType.slice(1)} • {formatFileSize(file.size || 0)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-slate-600 rounded transition-colors text-slate-300"
              title="Télécharger"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-600 rounded transition-colors text-slate-300"
              title="Fermer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-slate-400">Chargement...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">Erreur de chargement</h3>
              <p className="text-slate-400">{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Informations du fichier */}
              <div className="bg-slate-750 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Informations</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Type MIME:</span>
                    <span className="ml-2 text-slate-200">{file.mime_type || 'Inconnu'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Chemin:</span>
                    <span className="ml-2 text-slate-200 truncate">{file.path}</span>
                  </div>
                </div>
              </div>

              {/* Contenu du fichier selon le type */}
              {fileType === 'text' && fileContent && (
                <div className="bg-slate-900 rounded-lg border border-slate-600">
                  <div className="bg-slate-800 px-4 py-2 border-b border-slate-600">
                    <h4 className="text-sm font-medium text-slate-300">Contenu du fichier</h4>
                  </div>
                  <div className="p-4">
                    <pre className="text-sm text-slate-200 whitespace-pre-wrap overflow-x-auto">
                      {fileContent}
                    </pre>
                  </div>
                </div>
              )}

              {fileType === 'image' && fileUrl && (
                <div className="bg-slate-900 rounded-lg border border-slate-600 p-4">
                  <div className="flex justify-center">
                    <img
                      src={fileUrl}
                      alt={file.name}
                      className="max-w-full max-h-96 object-contain rounded"
                    />
                  </div>
                </div>
              )}

              {fileType === 'audio' && fileUrl && (
                <div className="bg-slate-900 rounded-lg border border-slate-600 p-4">
                  <div className="flex justify-center">
                    <audio controls className="w-full max-w-md">
                      <source src={fileUrl} type={file.mime_type} />
                      Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                  </div>
                </div>
              )}

              {fileType === 'video' && fileUrl && (
                <div className="bg-slate-900 rounded-lg border border-slate-600 p-4">
                  <div className="flex justify-center">
                    <video controls className="max-w-full max-h-96">
                      <source src={fileUrl} type={file.mime_type} />
                      Votre navigateur ne supporte pas l'élément vidéo.
                    </video>
                  </div>
                </div>
              )}

              {fileType === 'document' && (
                <div className="bg-slate-900 rounded-lg border border-slate-600 p-8">
                  <div className="text-center">
                    <DocumentIcon className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-slate-200 mb-2">Document non prévisualisable</h4>
                    <p className="text-slate-400 mb-4">
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
                <div className="bg-slate-900 rounded-lg border border-slate-600 p-8">
                  <div className="text-center">
                    <DocumentIcon className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-slate-200 mb-2">Type de fichier non supporté</h4>
                    <p className="text-slate-400 mb-4">
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
    </div>
  );
};

export default FileViewer;