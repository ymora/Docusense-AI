import React, { useState, useEffect, useRef } from 'react';
import { useColors } from '../../hooks/useColors';
import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button, IconButton } from '../UI/Button';
import MediaPlayer from './MediaPlayer';
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
  const [isLoading, setIsLoading] = useState(true);

  // Effet pour gérer le chargement initial
  useEffect(() => {
    setIsLoading(true);
    // Simuler un délai de chargement pour les types qui se chargent instantanément
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [file]);

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
        <div className="flex-1 overflow-hidden p-4">
          {contentType.startsWith('image/') && fileUrl && (
            <div className="flex items-center justify-center h-full overflow-hidden">
              <img
                src={fileUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                style={{
                  width: 'auto',
                  height: 'auto'
                }}
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

  // Composant pour l'affichage des emails intégré
  const EmailViewerIntegrated: React.FC<{ file: any }> = ({ file }) => {
    const [emailData, setEmailData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showHeaders, setShowHeaders] = useState(false);

    useEffect(() => {
      loadEmailContent();
    }, [file]);

    const loadEmailContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/emails/parse/${encodeURIComponent(file.path)}`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setEmailData(data.data);
        } else {
          throw new Error(data.message || 'Erreur lors du parsing de l\'email');
        }
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement de l\'email');
      } finally {
        setIsLoading(false);
      }
    };

    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateString;
      }
    };

    if (isLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Chargement de l'email...</p>
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
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <button
              onClick={loadEmailContent}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    if (!emailData) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <p className="text-slate-400">Aucune donnée email disponible</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-slate-900 flex flex-col overflow-hidden">
        {/* Barre d'outils */}
        <div className="bg-slate-800 border-b border-slate-700 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">📧</div>
              <div>
                <h2 className="text-lg font-semibold text-slate-200">{emailData.subject}</h2>
                <p className="text-sm text-slate-400">Email parsé - {file.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Afficher/masquer les headers */}
              <button
                onClick={() => setShowHeaders(!showHeaders)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                title={showHeaders ? 'Masquer les headers' : 'Afficher les headers'}
              >
                {showHeaders ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        {/* Contenu principal avec scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Informations de base */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400">De :</label>
                  <p className="text-slate-200">{emailData.from_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">À :</label>
                  <p className="text-slate-200">{emailData.to_address}</p>
                </div>
                {emailData.cc && (
                  <div>
                    <label className="text-sm font-medium text-slate-400">CC :</label>
                    <p className="text-slate-200">{emailData.cc}</p>
                  </div>
                )}
                {emailData.bcc && (
                  <div>
                    <label className="text-sm font-medium text-slate-400">BCC :</label>
                    <p className="text-slate-200">{emailData.bcc}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-400">Date :</label>
                  <p className="text-slate-200">{formatDate(emailData.date)}</p>
                </div>
              </div>
            </div>

            {/* Headers techniques (optionnel) */}
            {showHeaders && (
              <div className="bg-slate-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Headers techniques</h3>
                <div className="bg-slate-900 rounded p-4 overflow-y-auto max-h-64">
                  <pre className="text-xs text-slate-300">
                    {JSON.stringify(emailData, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Contenu HTML de l'email */}
            {emailData.html_content && (
              <div className="bg-slate-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Contenu HTML</h3>
                <div 
                  className="bg-white rounded p-4 overflow-y-auto max-h-96"
                  dangerouslySetInnerHTML={{ __html: emailData.html_content }}
                  style={{ 
                    color: '#000',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                />
              </div>
            )}

            {/* Contenu texte de l'email */}
            {emailData.text_content && (
              <div className="bg-slate-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Contenu texte</h3>
                <div className="bg-slate-900 rounded p-4 overflow-y-auto max-h-64">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                    {emailData.text_content}
                  </pre>
                </div>
              </div>
            )}

            {/* Pièces jointes avec prévisualisation intégrée */}
            {emailData.has_attachments && emailData.attachments && (
              <div className="bg-slate-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                  📎 Pièces jointes ({emailData.attachments.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {emailData.attachments.map((attachment: any, index: number) => (
                    <AttachmentPreview 
                      key={index}
                      attachment={attachment}
                      attachmentIndex={index}
                      file={file}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Composant pour la prévisualisation des pièces jointes
  const AttachmentPreview: React.FC<{
    attachment: any;
    attachmentIndex: number;
    file: any;
  }> = ({ attachment, attachmentIndex, file }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      loadAttachmentPreview();
    }, [attachment, attachmentIndex]);

    const loadAttachmentPreview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const contentType = attachment.content_type;
        
        // Pour les images, PDFs et autres types supportés
        if (contentType.startsWith('image/') || contentType === 'application/pdf') {
          const response = await fetch(`/api/emails/attachment-preview/${encodeURIComponent(file.path)}/${attachmentIndex}`);
          
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
          } else {
            throw new Error('Impossible de charger la pièce jointe');
          }
        } else {
          // Pour les autres types, pas de prévisualisation
          setPreviewUrl(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const getAttachmentIcon = () => {
      const contentType = attachment.content_type;
      if (contentType.startsWith('image/')) return '🖼️';
      if (contentType === 'application/pdf') return '📄';
      if (contentType.startsWith('video/')) return '🎬';
      if (contentType.startsWith('audio/')) return '🎵';
      if (contentType.includes('word') || contentType.includes('document')) return '📝';
      if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
      if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📈';
      return '📎';
    };

    return (
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-2xl">{getAttachmentIcon()}</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-slate-200 truncate">
              {attachment.filename}
            </h4>
            <p className="text-xs text-slate-400">
              {attachment.content_type} • {formatFileSize(attachment.size)}
            </p>
          </div>
        </div>

        {/* Prévisualisation */}
        {isLoading && (
          <div className="flex items-center justify-center h-32 bg-slate-600 rounded">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-32 bg-slate-600 rounded">
            <p className="text-xs text-red-400">Erreur de chargement</p>
          </div>
        )}

        {previewUrl && !isLoading && !error && (
          <div className="h-32 bg-slate-600 rounded overflow-hidden">
            {attachment.content_type.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt={attachment.filename}
                className="w-full h-full object-cover"
              />
            ) : attachment.content_type === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title={attachment.filename}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-4xl">{getAttachmentIcon()}</span>
              </div>
            )}
          </div>
        )}

        {/* Bouton de téléchargement */}
        <button
          onClick={() => {
            const link = document.createElement('a');
            link.href = `/api/emails/attachment-download/${encodeURIComponent(file.path)}/${attachmentIndex}`;
            link.download = attachment.filename;
            link.click();
          }}
          className="w-full mt-3 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          📥 Télécharger
        </button>
      </div>
    );
  };

  // Fonction utilitaire pour formater la taille des fichiers
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Rendu du contenu selon le type
  const renderContent = () => {
    switch (fileCategory) {
      case 'media':
        return <MediaPlayer file={file} onError={(error) => setError(error)} />;
      
      case 'pdf':
        return (
          <div className="w-full h-full bg-slate-900 overflow-hidden flex flex-col">
            <iframe
              src={`/api/files/stream-by-path/${encodeURIComponent(file.path)}?native=true`}
              className="w-full h-full border-0 flex-1"
              style={{ 
                width: '100%', 
                height: '100%', 
                display: 'block',
                maxWidth: '100%',
                maxHeight: '100%',
                minHeight: '100%'
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
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onMouseEnter={() => setShowImageControls(true)}
            onMouseLeave={() => setShowImageControls(false)}
          >
            <img
              src={`/api/files/stream-by-path/${encodeURIComponent(file.path)}`}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                width: 'auto',
                height: 'auto'
              }}
              onError={(e) => {
                setError('Erreur lors du chargement de l\'image');
              }}
            />
            {renderFloatingActions()}
          </div>
        );
      
      case 'email':
        return <EmailViewerIntegrated file={file} />;
      
      case 'office':
        return (
          <div className="h-full bg-slate-900 overflow-hidden flex flex-col">
            <iframe
              src={`/api/files/stream-by-path/${encodeURIComponent(file.path)}?html=true`}
              className="w-full h-full border-0 flex-1"
              style={{
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                minHeight: '100%'
              }}
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
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <img
                src={`/api/files/stream-by-path/${encodeURIComponent(file.path)}`}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                style={{
                  width: 'auto',
                  height: 'auto'
                }}
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
        <IconButton
          icon={<MagnifyingGlassMinusIcon />}
          onClick={handleZoomOut}
          variant="secondary"
          size="sm"
          tooltip="Zoom arrière"
          className="transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg active:scale-95"
        />
        
        {/* Zoom Level Indicator */}
        <div className="px-2 py-1 rounded-lg font-medium text-xs border" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff'
        }}>
          {Math.round(zoom * 100)}%
        </div>
        
        {/* Zoom In */}
        <IconButton
          icon={<MagnifyingGlassPlusIcon />}
          onClick={handleZoomIn}
          variant="secondary"
          size="sm"
          tooltip="Zoom avant"
          className="transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg active:scale-95"
        />
        
        {/* Reset Zoom */}
        {zoom !== 1 && (
          <Button
            onClick={resetZoom}
            variant="secondary"
            size="sm"
            className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <span className="text-xs font-bold">1:1</span>
          </Button>
        )}
        
        {/* Download */}
        <IconButton
          icon={<ArrowDownTrayIcon />}
          onClick={handleDownload}
          variant="primary"
          size="sm"
          tooltip="Télécharger"
          className="transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-lg active:scale-95"
        />
      </div>
    );
  };





  // Mode normal
  return (
    <div className="h-full bg-slate-900 overflow-hidden flex flex-col">
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

      {/* Animation de chargement centrée */}
      {!error && isLoading && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Chargement du fichier...</p>
          </div>
        </div>
      )}
      
      {/* Contenu principal */}
      {!error && !isLoading && (
        <div className="flex-1 overflow-hidden relative" style={{ height: '100%', maxHeight: '100%' }}>
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default UnifiedFileViewer; 