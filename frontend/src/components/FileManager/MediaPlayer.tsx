import React, { useState, useEffect, useCallback } from 'react';
import { useColors } from '../../hooks/useColors';
import { XMarkIcon, ArrowDownTrayIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import ReactPlayer from 'react-player';

interface MediaPlayerProps {
  file: any;
  onClose?: () => void;
  onError?: (error: string) => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ file, onClose, onError }) => {
  const { colors } = useColors();
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Détection du type de média avec fallback sur l'extension
  const isVideo = file.mime_type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|ogg|mov|m4v|3gp|ogv|ts|mts|m2ts|mkv|avi|wmv|flv|asf|rm|rmvb|divx|xvid|h264|h265|vp8|vp9|mpeg|mpg|mpe|m1v|m2v|mpv|mp2|m2p|ps|evo|ogm|ogx|mxf|nut|hls|m3u8)$/i);
  const isAudio = file.mime_type?.startsWith('audio/') || file.name?.match(/\.(mp3|wav|flac|aac|ogg|wma|m4a|opus|aiff|au|ra|rm|wv|ape|alac|ac3|dts|amr|3ga|mka|tta|mid|midi)$/i);
  
  // Forcer la détection audio si le MIME type est incorrect mais l'extension est audio
  const forceAudio = file.mime_type === 'application/octet-stream' && file.name?.match(/\.(mp3|wav|flac|aac|ogg|wma|m4a|opus|aiff|au|ra|rm|wv|ape|alac|ac3|dts|amr|3ga|mka|tta|mid|midi)$/i);
  
  const finalIsAudio = isAudio || forceAudio;

  // URL pour le streaming natif (utilise le système existant qui fonctionne)
  const getMediaUrl = (): string => {
    // Utiliser le chemin absolu pour éviter les problèmes de chemin relatif
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/api/files/stream-by-path/${encodeURIComponent(file.path)}?native=true`;
    console.log('🎵 MediaPlayer - URL générée:', url);
    console.log('🎵 MediaPlayer - File path:', file.path);
    console.log('🎵 MediaPlayer - File name:', file.name);
    console.log('🎵 MediaPlayer - File mime_type:', file.mime_type);
    console.log('🎵 MediaPlayer - Is video:', isVideo);
    console.log('🎵 MediaPlayer - Is audio:', finalIsAudio);
    return url;
  };

  // URL pour le téléchargement
  const getDownloadUrl = (): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/files/stream-by-path/${encodeURIComponent(file.path)}?direct=true`;
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
      console.error('❌ Erreur lors du téléchargement:', error);
      if (onError) {
        onError('Erreur lors du téléchargement du fichier');
      }
    }
  };

  const handleReady = () => {
    console.log('✅ React Player prêt pour:', file.name);
    setIsReady(true);
    setHasError(false);
    setIsLoading(false);
  };

  const handleError = (error: any) => {
    console.error('❌ Erreur React Player:', error);
    console.error('❌ Erreur détails:', {
      error,
      file: file.name,
      path: file.path,
      mime_type: file.mime_type,
      url: getMediaUrl()
    });
    setHasError(true);
    setIsReady(false);
    setIsLoading(false);
    if (onError) {
      onError(`Erreur de lecture: ${error?.message || 'Format non supporté'}`);
    }
  };

  const handleStart = () => {
    console.log('▶️ Lecture démarrée pour:', file.name);
    setIsLoading(false);
  };

  const handleBuffer = () => {
    console.log('⏳ Buffering pour:', file.name);
  };

  // Gestion du Picture-in-Picture manuel
  const handlePictureInPicture = () => {
    try {
      const videoElement = document.querySelector('video');
      if (videoElement && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
        } else {
          videoElement.requestPictureInPicture().catch(error => {
            console.warn('⚠️ Erreur PiP:', error);
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ PiP non supporté:', error);
    }
  };

  // Retry automatique en cas d'erreur
  const handleRetry = () => {
    setHasError(false);
    setIsReady(false);
    setIsLoading(true);
    setPlayerKey(prev => prev + 1);
  };

  // Test de l'URL avant de l'utiliser
  useEffect(() => {
    const testUrl = async () => {
      try {
        const url = getMediaUrl();
        console.log('🧪 Test de l\'URL:', url);
        const response = await fetch(url, { method: 'HEAD' });
        console.log('🧪 Réponse du test:', response.status, response.statusText);
        if (!response.ok) {
          console.error('🧪 URL invalide:', response.status, response.statusText);
        } else {
          console.log('🧪 URL valide, Content-Type:', response.headers.get('content-type'));
        }
      } catch (error) {
        console.error('🧪 Erreur lors du test de l\'URL:', error);
      }
    };
    
    testUrl();
  }, [file.path]);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.surface }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{isVideo ? '🎬' : '🎵'}</span>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
              {file.name}
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {isVideo ? 'Fichier vidéo' : finalIsAudio ? 'Fichier audio' : 'Fichier média'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Bouton PiP seulement pour les vidéos */}
          {isVideo && document.pictureInPictureEnabled && (
            <button
              onClick={handlePictureInPicture}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              style={{ color: colors.textSecondary }}
              title="Picture-in-Picture"
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
          )}
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
        {(isVideo || finalIsAudio) ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {/* Message d'information pour les formats optimisés */}
            <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded-lg max-w-md">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <div className="text-sm text-green-200">
                  <p className="font-semibold">Streaming natif activé</p>
                  <p>Lecture optimisée avec support des range requests.</p>
                  <p className="text-xs mt-1">Compatibilité maximale garantie.</p>
                </div>
              </div>
            </div>

            {/* Indicateur de chargement */}
            {isLoading && !hasError && (
              <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span className="text-sm text-slate-300">Chargement du lecteur...</span>
                </div>
              </div>
            )}

            {/* Message d'erreur avec retry */}
            {hasError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg max-w-md">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">❌</span>
                  <div className="text-sm text-red-200">
                    <p className="font-semibold">Erreur de lecture</p>
                    <p>Le format n'est pas supporté ou le fichier est corrompu.</p>
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
            
            <div className="w-full h-full flex items-center justify-center">
              <ReactPlayer
                key={playerKey}
                url={getMediaUrl()}
                width="100%"
                height="100%"
                controls={true}
                onReady={handleReady}
                onError={handleError}
                onStart={handleStart}
                onBuffer={handleBuffer}
                config={{
                  file: {
                    attributes: {
                      crossOrigin: "anonymous",
                      preload: "metadata"
                    },
                    forceVideo: isVideo,
                    forceAudio: finalIsAudio
                  }
                }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                playing={false}
                muted={false}
                volume={1}
                playbackRate={1}
                pip={false}
                stopOnUnmount={true}
                light={false}
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