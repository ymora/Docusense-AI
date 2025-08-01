import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { formatFileSize, getEmailAttachmentEmoji, canPreviewFile, isVideoFormatSupported, getVideoErrorMessage } from '../../utils/fileUtils';

interface EmailAttachmentViewerProps {
  file: any;
  attachment: any;
  attachmentIndex: number;
  onBack: () => void;
}

const EmailAttachmentViewer: React.FC<EmailAttachmentViewerProps> = ({
  file,
  attachment,
  attachmentIndex,
  onBack
}) => {
  const { colors } = useColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'text' | 'image' | 'pdf' | 'video' | 'audio' | 'unsupported'>('text');

  useEffect(() => {
    loadAttachment();
  }, [attachment, attachmentIndex]);

  const loadAttachment = async () => {
    try {
      setLoading(true);
      setError(null);
      setPreviewData(null);

      // Déterminer le type de prévisualisation
      const contentType = attachment.content_type;
      const filename = attachment.filename;
      
      if (contentType.startsWith('image/')) {
        setPreviewType('image');
      } else if (contentType.startsWith('video/')) {
        setPreviewType('video');
      } else if (contentType.startsWith('audio/')) {
        setPreviewType('audio');
      } else if (contentType === 'application/pdf') {
        setPreviewType('pdf');
      } else if (contentType.startsWith('text/') || canPreviewFile(contentType, filename)) {
        setPreviewType('text');
      } else {
        setPreviewType('unsupported');
        setLoading(false);
        return;
      }

      // Récupérer la pièce jointe
      const response = await fetch(`/api/emails/attachment-preview/${encodeURIComponent(file.path)}/${attachmentIndex}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      if (previewType === 'text') {
        const textContent = await response.text();
        setPreviewData(textContent);
      } else {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPreviewData(url);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la prévisualisation:', error);
      setError('Erreur lors de la prévisualisation de la pièce jointe');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de téléchargement supprimée - gérée par UnifiedFileViewer



  // Composant VideoPlayer avec gestion d'erreurs améliorée
  const VideoPlayer: React.FC<{
    src: string;
    contentType: string;
    filename: string;
    size: number;
  }> = ({ src, contentType, filename, size }) => {
    const [videoError, setVideoError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      console.error('❌ Erreur vidéo:', e);
      const extension = filename.split('.').pop()?.toLowerCase();
      
      // Messages d'erreur spécifiques selon le format
      if (contentType === 'video/avi' || contentType === 'video/x-msvideo' || extension === 'avi') {
        setVideoError('Format AVI non supporté par ce navigateur. Le fichier utilise un codec non compatible avec la lecture web.');
      } else {
        setVideoError('Erreur lors du chargement de la vidéo. Le fichier peut être corrompu ou utiliser un encodage non supporté.');
      }
      setIsLoading(false);
    };

    const handleVideoLoad = () => {
      setIsLoading(false);
      setVideoError(null);
    };

    const handleVideoLoadStart = () => {
      setIsLoading(true);
      setVideoError(null);
    };

    if (videoError) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎬</div>
          <p className="text-slate-400 mb-4">
            {videoError}
          </p>
          <p className="text-slate-500 text-sm mb-4">
            Format: {contentType}
            <br />
            Taille: {formatFileSize(size)}
            <br />
            Fichier: {filename}
          </p>
          <p className="text-slate-400 text-sm">
            💡 Conseil: Essayez de télécharger le fichier pour le lire avec un lecteur vidéo local.
          </p>
        </div>
      );
    }

    return (
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-75 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-slate-400 text-sm">Chargement de la vidéo...</p>
            </div>
          </div>
        )}
        <video 
          ref={videoRef}
          src={src}
          controls
          preload="metadata"
          className="max-w-full max-h-full"
          title={filename}
          onError={handleVideoError}
          onLoadedData={handleVideoLoad}
          onLoadStart={handleVideoLoadStart}
        >
          <source src={src} type={contentType} />
          <p className="text-slate-400 p-4">
            Votre navigateur ne supporte pas la lecture de cette vidéo.
          </p>
        </video>
      </div>
    );
  };

  return (
    <div className="h-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getEmailAttachmentEmoji(attachment.content_type, attachment.filename)}</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-200">
                {attachment.filename}
              </h2>
              <p className="text-sm text-slate-400">
                {attachment.content_type} • {formatFileSize(attachment.size)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Retour à l'email"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Retour</span>
          </button>
          {/* Bouton de téléchargement supprimé - géré par UnifiedFileViewer */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Chargement de la pièce jointe...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <p className="text-red-400 mb-2 font-medium">Erreur de chargement</p>
              <p className="text-slate-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {previewData && !loading && !error && (
          <div className="h-full">
            {/* Images */}
            {previewType === 'image' && (
              <div className="flex items-center justify-center">
                <img 
                  src={previewData} 
                  alt={attachment.filename}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            {/* Vidéos */}
            {previewType === 'video' && (
              <div className="flex items-center justify-center">
                {isVideoFormatSupported(attachment.content_type, attachment.filename) ? (
                  <VideoPlayer 
                    src={previewData}
                    contentType={attachment.content_type}
                    filename={attachment.filename}
                    size={attachment.size}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎬</div>
                    <p className="text-slate-400 mb-4">
                      {getVideoErrorMessage(attachment.content_type, attachment.filename)}
                    </p>
                    <p className="text-slate-500 text-sm mb-4">
                      Format: {attachment.content_type}
                      <br />
                      Taille: {formatFileSize(attachment.size)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Audio */}
            {previewType === 'audio' && (
              <div className="flex items-center justify-center">
                <audio 
                  src={previewData}
                  controls
                  className="w-full max-w-md"
                  title={attachment.filename}
                >
                  Votre navigateur ne supporte pas la lecture audio.
                </audio>
              </div>
            )}

            {/* PDFs */}
            {previewType === 'pdf' && (
              <iframe
                src={previewData}
                className="w-full h-full border-0"
                title={attachment.filename}
              />
            )}

            {/* Documents texte et code */}
            {previewType === 'text' && (
              <div className="bg-slate-800 rounded-lg p-4">
                <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm overflow-auto max-h-full">
                  {previewData}
                </pre>
              </div>
            )}

            {/* Types non supportés */}
            {previewType === 'unsupported' && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📄</div>
                <p className="text-slate-400 mb-4">
                  Ce type de fichier ne peut pas être prévisualisé directement.
                </p>
                <p className="text-slate-500 text-sm mb-4">
                  Type: {attachment.content_type}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailAttachmentViewer; 