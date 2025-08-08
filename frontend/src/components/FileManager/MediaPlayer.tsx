import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useColors } from '../../hooks/useColors';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface MediaPlayerProps {
  file: any;
  onClose?: () => void;
  onError?: (error: string) => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ file, onClose, onError }) => {
  const { colors } = useColors();
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  // Détection SIMPLE basée sur l'extension
  const isAudio = /\.(mp3|wav|flac|aac|ogg|wma|m4a|opus|aiff|amr|au|ra|ram|wv|ape|ac3|dts|mka|tta|mid|midi|caf|3ga|3gpp|wax|wvx|pls|sd2)$/i.test(file.name);
  const isVideo = /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|3g2|ogv|ts|mts|m2ts|asf|rm|rmvb|nut|f4v|f4p|f4a|f4b|divx|xvid|h264|h265|vp8|vp9|mpeg|mpg|mpe|m1v|m2v|mpv|mp2|m2p|ps|evo|ogm|ogx|mxf|hls|m3u8)$/i.test(file.name);
  
  // HLS seulement pour les vidéos non supportées nativement
  const needsHls = isVideo && /\.(avi|mkv|wmv|flv|asf|rm|rmvb|divx|xvid|h264|h265|vp8|vp9|mpeg|mpg|mpe|m1v|m2v|mpv|mp2|m2p|ps|evo|ogm|ogx|mxf|nut)$/i.test(file.name);

  // URL de streaming avec fallback intelligent
  const getStreamingUrl = () => {
    // Si on utilise le fallback ou si ce n'est pas audio/vidéo, utiliser l'ancien système
    if (useFallback || (!isVideo && !isAudio)) {
      return `/api/files/stream-by-path/${encodeURIComponent(file.path)}?native=true${needsHls ? '&hls=true' : ''}&t=${Date.now()}`;
    }
    // Essayer le streaming en temps réel pour audio/vidéo
    return `http://localhost:8000/api/files/stream-realtime/${encodeURIComponent(file.path)}?quality=medium&t=${Date.now()}`;
  };

  const mediaUrl = getStreamingUrl();

  // Reset quand le fichier change
  useEffect(() => {
    setIsReady(false);
    setHasError(false);
    setIsLoading(true);
    setUseFallback(false); // Réinitialiser le fallback pour chaque nouveau fichier
  }, [file.path]);

  // URL de téléchargement
  const getDownloadUrl = () => {
    return `http://localhost:8000/api/files/download-by-path/${encodeURIComponent(file.path)}`;
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = getDownloadUrl();
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.href += `&t=${Date.now()}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      if (onError) {
        onError('Erreur lors du téléchargement');
      }
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsReady(false);
    setIsLoading(true);
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.surface }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{isVideo ? '🎬' : isAudio ? '🎵' : '📄'}</span>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
              {file.name}
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {isAudio ? 'Fichier audio' : isVideo ? 'Fichier vidéo' : 'Fichier média'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            style={{ color: colors.textSecondary }}
            title="Télécharger"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              style={{ color: colors.textSecondary }}
              title="Fermer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center p-4">
        {(isVideo || isAudio) ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {/* Indicateur de chargement */}
            {isLoading && !hasError && (
              <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span className="text-sm text-slate-300">Chargement...</span>
                </div>
              </div>
            )}

            {/* Message d'erreur */}
            {hasError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg max-w-md">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">❌</span>
                  <div className="text-sm text-red-200">
                    <p className="font-semibold">Erreur de lecture</p>
                    <p>Le format n'est pas supporté.</p>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={handleRetry}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        Réessayer
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center space-x-1"
                      >
                        <ArrowDownTrayIcon className="h-3 w-3" />
                        <span>Télécharger</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* ReactPlayer */}
            <div className="w-full h-full flex items-center justify-center">
              <ReactPlayer
                url={mediaUrl}
                controls={true}
                width="100%"
                height={isVideo ? "100%" : "200px"}
                style={{
                  backgroundColor: isVideo ? '#000' : 'transparent'
                }}
                config={{
                  file: {
                    attributes: {
                      crossOrigin: "anonymous"
                    },
                    forceHLS: needsHls,
                    forceAudio: isAudio,
                    hlsOptions: {
                      enableWorker: true,
                      debug: false
                    }
                  }
                }}
                onLoadStart={() => {

                  setIsLoading(true);
                }}
                onLoad={() => {

                  setIsReady(true);
                  setHasError(false);
                  setIsLoading(false);
                }}
                onPlay={() => {

                }}
                onPause={() => {

                }}
                onError={(error) => {
                  console.error('❌ Erreur ReactPlayer:', error);
                  
                  // Si c'est un fichier audio/vidéo et qu'on n'utilise pas encore le fallback, essayer le fallback
                  if ((isVideo || isAudio) && !useFallback) {

                    setUseFallback(true);
                    setHasError(false);
                    setIsLoading(true);
                    return;
                  }
                  
                  // Sinon, afficher l'erreur
                  setHasError(true);
                  setIsReady(false);
                  setIsLoading(false);
                  if (onError) {
                    onError(`Erreur de lecture: ${file.name}`);
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-slate-400">Format non supporté: {file.mime_type}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPlayer; 