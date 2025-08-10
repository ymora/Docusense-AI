import React, { useState, useEffect, useRef } from 'react';
import { FileInfo } from '../../utils/fileUtils';
import { secureStreamingService, SecureFileInfo } from '../../services/secureStreamingService';
import { useColors } from '../../hooks/useColors';

interface SecureFileViewerProps {
  file: FileInfo;
  onError?: (error: string) => void;
}

const SecureFileViewer: React.FC<SecureFileViewerProps> = ({ file, onError }) => {
  const { colors } = useColors();
  const [fileInfo, setFileInfo] = useState<SecureFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'info' | 'preview' | 'download'>('info');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadFileInfo();
  }, [file]);

  const loadFileInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const info = await secureStreamingService.getFileInfo(file);
      setFileInfo(info);
      
      // Créer un token temporaire pour l'accès
      const tokenResponse = await secureStreamingService.createTempToken(file);
      setTempToken(tokenResponse.temp_token);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await secureStreamingService.downloadFile(file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du téléchargement';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const renderFileInfo = () => {
    if (!fileInfo) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium" style={{ color: colors.textSecondary }}>Nom:</span>
            <div style={{ color: colors.text }}>{fileInfo.name}</div>
          </div>
          <div>
            <span className="font-medium" style={{ color: colors.textSecondary }}>Taille:</span>
            <div style={{ color: colors.text }}>{fileInfo.size_mb} MB</div>
          </div>
          <div>
            <span className="font-medium" style={{ color: colors.textSecondary }}>Type:</span>
            <div style={{ color: colors.text }}>{fileInfo.mime_type}</div>
          </div>
          <div>
            <span className="font-medium" style={{ color: colors.textSecondary }}>Modifié:</span>
            <div style={{ color: colors.text }}>
              {new Date(fileInfo.modified).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="font-medium" style={{ color: colors.textSecondary }}>Extension:</span>
            <div style={{ color: colors.text }}>{fileInfo.extension}</div>
          </div>
          <div>
            <span className="font-medium" style={{ color: colors.textSecondary }}>Hash:</span>
            <div style={{ color: colors.text }} className="font-mono text-xs">
              {fileInfo.hash.substring(0, 16)}...
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {fileInfo.is_streamable && (
            <button
              onClick={() => setViewMode('preview')}
              className="px-3 py-2 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: colors.primary,
                color: 'white'
              }}
            >
              Prévisualiser
            </button>
          )}
          {fileInfo.is_downloadable && (
            <button
              onClick={handleDownload}
              className="px-3 py-2 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`
              }}
            >
              Télécharger
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderFilePreview = () => {
    if (!fileInfo || !tempToken) return null;

    const mimeType = fileInfo.mime_type.toLowerCase();
    const extension = fileInfo.extension.toLowerCase();

    // Images
    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img
            src={secureStreamingService.getTempAccessUrl(tempToken, 'view')}
            alt={fileInfo.name}
            className="max-w-full max-h-96 object-contain rounded"
            style={{ border: `1px solid ${colors.border}` }}
          />
        </div>
      );
    }

    // PDFs
    if (mimeType === 'application/pdf') {
      return (
        <div className="w-full h-96">
          <iframe
            ref={iframeRef}
            src={secureStreamingService.getTempAccessUrl(tempToken, 'view')}
            className="w-full h-full rounded"
            style={{ border: `1px solid ${colors.border}` }}
            title={fileInfo.name}
          />
        </div>
      );
    }

    // Vidéos
    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex justify-center">
          <video
            ref={videoRef}
            controls
            className="max-w-full max-h-96 rounded"
            style={{ border: `1px solid ${colors.border}` }}
          >
            <source src={secureStreamingService.getTempAccessUrl(tempToken, 'view')} type={mimeType} />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      );
    }

    // Audio
    if (mimeType.startsWith('audio/')) {
      return (
        <div className="flex justify-center">
          <audio
            ref={audioRef}
            controls
            className="w-full max-w-md"
          >
            <source src={secureStreamingService.getTempAccessUrl(tempToken, 'view')} type={mimeType} />
            Votre navigateur ne supporte pas la lecture audio.
          </audio>
        </div>
      );
    }

    // Fichiers texte
    if (mimeType.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'csv', 'py', 'js', 'ts', 'html', 'css'].includes(extension)) {
      return (
        <div className="w-full h-96">
          <iframe
            ref={iframeRef}
            src={secureStreamingService.getTempAccessUrl(tempToken, 'view')}
            className="w-full h-full rounded font-mono text-sm"
            style={{ border: `1px solid ${colors.border}` }}
            title={fileInfo.name}
          />
        </div>
      );
    }

    // Autres types - afficher un message
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
          Aperçu non disponible
        </h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Ce type de fichier ne peut pas être prévisualisé directement.
        </p>
        <button
          onClick={handleDownload}
          className="mt-4 px-4 py-2 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: colors.primary,
            color: 'white'
          }}
        >
          Télécharger le fichier
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }}></div>
        <span className="ml-3" style={{ color: colors.text }}>Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
          Erreur de chargement
        </h3>
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          {error}
        </p>
        <button
          onClick={loadFileInfo}
          className="px-4 py-2 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: colors.primary,
            color: 'white'
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
            {file.name}
          </h2>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('info')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'info' ? 'text-blue-500' : ''
            }`}
            style={{
              color: viewMode === 'info' ? colors.primary : colors.textSecondary
            }}
          >
            Informations
          </button>
          {fileInfo?.is_streamable && (
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'preview' ? 'text-blue-500' : ''
              }`}
              style={{
                color: viewMode === 'preview' ? colors.primary : colors.textSecondary
              }}
            >
              Aperçu
            </button>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'info' && renderFileInfo()}
        {viewMode === 'preview' && renderFilePreview()}
      </div>
    </div>
  );
};

export default SecureFileViewer;
