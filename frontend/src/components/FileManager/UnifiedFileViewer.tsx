import React, { useState, useEffect } from 'react';
import {
  ArrowDownTrayIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
} from '@heroicons/react/24/outline';
import MediaPlayer from './MediaPlayer';
import EmailViewer from './EmailViewer';
import { getFileType } from '../../utils/fileTypeUtils';
import { getFileIcon } from '../../utils/fileUtils';

interface UnifiedFileViewerProps {
  file: any;
  onClose?: () => void;
  onPreviewAttachment?: (attachment: any, index: number) => void;
}

const UnifiedFileViewer: React.FC<UnifiedFileViewerProps> = ({ file, onClose, onPreviewAttachment }) => {
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showImageControls, setShowImageControls] = useState(false);

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = `/api/files/download-by-path/${encodeURIComponent(file.path)}`;
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Ajouter un timestamp pour éviter le cache
      link.href += `?t=${Date.now()}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      

    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      setError('Erreur lors du téléchargement du fichier');
    }
  };



  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  // OPTIMISATION: Mémoisation de la détection du type de fichier
  const fileType = React.useMemo(() => getFileType(file.name, file.mime_type), [file.name, file.mime_type]);
  
  // Fonction pour obtenir la catégorie de type compatible avec l'ancienne logique
  const getFileCategory = React.useCallback((type: string): string => {
    if (type === 'audio' || type === 'video') return 'media';
    if (type === 'document' && file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
    if (type === 'document' || type === 'spreadsheet' || type === 'text') return 'document';
    if (type === 'email') return 'email';
    if (type === 'image') return 'image';
    
    // Vérification supplémentaire pour les emails
    const fileName = file.name?.toLowerCase() || '';
    const mimeType = file.mime_type?.toLowerCase() || '';
    if (fileName.endsWith('.eml') || fileName.endsWith('.msg') || 
        mimeType === 'message/rfc822' || mimeType === 'application/vnd.ms-outlook') {
      return 'email';
    }
    
    // Vérification pour les fichiers Office
    const officeExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.odt', '.ods', '.odp'];
    if (officeExtensions.some(ext => fileName.endsWith(ext))) {
      return 'office'; // Nouvelle catégorie pour les fichiers Office
    }
    
    return 'generic';
  }, [file.name, file.mime_type]);

  const fileCategory = getFileCategory(fileType);

  // Composant pour les fichiers texte et documents
  const TextDocumentViewer: React.FC<{ file: any; onClose?: () => void }> = ({ file, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const loadFileContent = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const contentType = file.mime_type?.toLowerCase() || '';
          
          // OPTIMISATION: Utiliser directement l'URL de streaming pour les images et PDFs
          if (contentType.startsWith('image/') || contentType === 'application/pdf') {
            const encodedPath = encodeURIComponent(file.path);
            const streamingUrl = `/api/files/stream-by-path/${encodedPath}?native=true`;
            setFileUrl(streamingUrl);
            setIsLoading(false);
            return;
          }
          

          
          // Pour les autres documents, charger le contenu texte
          const encodedPath = encodeURIComponent(file.path);
          const response = await fetch(`/api/files/stream-by-path/${encodedPath}`);
          
          if (response.ok) {
            const text = await response.text();
            setFileContent(text);
          } else {
            setError('Impossible de charger le fichier');
          }
        } catch (err) {
          setError('Erreur lors du chargement du fichier');
        } finally {
          setIsLoading(false);
        }
      };

      if (file) {
        loadFileContent();
      }

      return () => {
        // Nettoyage seulement si on a créé un blob URL
        if (fileUrl && fileUrl.startsWith('blob:')) {
          URL.revokeObjectURL(fileUrl);
        }
      };
    }, [file]);

    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Chargement du fichier...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <p className="text-red-400 mb-2">Erreur de chargement</p>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </div>
      );
    }

    const contentType = file.mime_type?.toLowerCase() || '';
    
    return (
      <div className="h-full flex flex-col bg-slate-900">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-600">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getFileIcon(file.name, file.mime_type)}
              <h3 className="text-lg font-semibold text-slate-200 truncate">
                {file.name}
              </h3>
            </div>
            <span className="text-sm text-slate-400">
              {contentType.startsWith('text/') ? '📝 Texte' : '📄 Document'}
            </span>
          </div>
        </div>

        {/* Contenu du fichier */}
        <div className="flex-1 overflow-auto p-4">
          {contentType.startsWith('image/') && fileUrl && (
            <div className="flex items-center justify-center h-full">
              <img
                src={fileUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                onError={() => setError('Erreur lors du chargement de l\'image')}
              />
            </div>
          )}
          

          

          
          {contentType.startsWith('text/') && fileContent && (
            <div className="bg-slate-800 rounded-lg p-4 h-full overflow-auto">
              <pre className="text-slate-200 text-sm whitespace-pre-wrap font-mono">
                {fileContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Composant pour les fichiers génériques


  // Rendu du contenu selon le type
  const renderContent = () => {
    switch (fileCategory) {
      case 'media':
        return <MediaPlayer file={file} onError={(error) => setError(error)} />;
      
      case 'pdf':
        return (
          <div className="w-full h-full bg-slate-900 min-h-screen-dynamic">
            <iframe
              src={`/api/files/stream-by-path/${encodeURIComponent(file.path)}?native=true`}
              className="w-full h-full border-0 min-h-screen-dynamic"
              style={{ 
                width: '100%', 
                height: '100%', 
                display: 'block'
              }}
              title={file.name}
              onError={(e) => {
                setError('Erreur lors du chargement du PDF');
              }}
            />
          </div>
        );
      
      case 'image':
        return (
          <div 
            className="relative w-full h-full"
            onMouseEnter={() => setShowImageControls(true)}
            onMouseLeave={() => setShowImageControls(false)}
          >
            <img
              src={`/api/files/stream-by-path/${encodeURIComponent(file.path)}`}
              alt={file.name}
              className="w-full h-full object-contain rounded-lg shadow-lg transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center center'
              }}
              onError={(e) => {
                setError('Erreur lors du chargement de l\'image');
              }}
            />
            {renderFloatingActions()}
          </div>
        );
      
      case 'email':
        return <EmailViewer file={file} onClose={onClose} onPreviewAttachment={onPreviewAttachment} />;
      
      case 'office':
        return (
          <div className="h-full bg-slate-900">
            <iframe
              src={`/api/files/stream-by-path/${encodeURIComponent(file.path)}?html=true`}
              className="w-full h-full border-0"
              title={file.name}
              onError={(e) => {
                setError('Erreur lors du chargement du document Office');
              }}
            />
          </div>
        );
      
      case 'document':
        return <TextDocumentViewer file={file} onClose={onClose} />;
      
      default:
        // Vérifier à nouveau si c'est une image (cas où la détection a échoué)
        const mimeType = file.mime_type?.toLowerCase() || '';
        const defaultFileName = file.name?.toLowerCase() || '';
        const extension = defaultFileName.split('.').pop()?.toLowerCase() || '';
        
        if (mimeType.startsWith('image/') || extension.match(/\.(jpg|jpeg|png|gif|bmp|tiff|webp|ico|svg|heic|heif)$/i)) {
          return (
            <div className="relative w-full h-full">
              <img
                src={`/api/files/stream-by-path/${encodeURIComponent(file.path)}`}
                alt={file.name}
                className="w-full h-full object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  setError('Erreur lors du chargement de l\'image');
                }}
              />
              {renderFloatingActions()}
            </div>
          );
        }
        
        // Fichier non supporté
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-slate-400 text-6xl mb-4">📄</div>
              <p className="text-slate-400 mb-2">
                Type de fichier non supporté
              </p>
              <p className="text-slate-500 text-sm">
                Ce type de fichier ne peut pas être affiché dans le navigateur
              </p>
              <button
                onClick={handleDownload}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Télécharger le fichier
              </button>
            </div>
          </div>
        );
    }
  };

  // Boutons d'action flottants pour les images
  const renderFloatingActions = () => {
    if (fileCategory !== 'image') {
      return null;
    }

    return (
      <div className={`absolute top-4 right-4 flex items-center space-x-2 z-10 transition-opacity duration-200 ${
        showImageControls ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-white"
          title="Zoom arrière"
        >
          <MagnifyingGlassMinusIcon className="h-4 w-4" />
        </button>
        
        {/* Zoom Level Indicator */}
        <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-lg font-medium">
          {Math.round(zoom * 100)}%
        </span>
        
        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-white"
          title="Zoom avant"
        >
          <MagnifyingGlassPlusIcon className="h-4 w-4" />
        </button>
        
        {/* Reset Zoom */}
        {zoom !== 1 && (
          <button
            onClick={resetZoom}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-white"
            title="Zoom normal"
          >
            <span className="text-xs font-bold">1:1</span>
          </button>
        )}
        
        {/* Download */}
        <button
          onClick={handleDownload}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors text-white"
          title="Télécharger"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
        </button>
        
        
      </div>
    );
  };





  // Mode normal
  return (
         <div className="h-full bg-slate-900 overflow-hidden flex flex-col min-h-screen-dynamic">
      {/* Affichage des erreurs */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-slate-900/95">
          <div className="bg-red-900/80 border border-red-600 rounded-lg p-6 max-w-md mx-4 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-red-200 mb-2">Erreur de chargement</h3>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <div className="text-xs text-red-400 mb-4">
              <p>Fichier: {file.name}</p>
              <p>Type: {file.mime_type}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}


      
      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden relative" style={{ height: '100%' }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default UnifiedFileViewer; 