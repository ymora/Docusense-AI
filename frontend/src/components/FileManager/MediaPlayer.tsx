import React, { useState, useRef, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import multimediaService, { OptimizationSettings, OptimizationInfo } from '../../services/multimediaService';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
  SignalIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface MediaPlayerProps {
  file: any;
  onClose?: () => void;
  onError?: (error: string) => void;
}

// Types de lecteurs disponibles
type PlayerType = 'react' | 'native' | 'direct';

// État du fallback
interface FallbackState {
  currentPlayer: PlayerType;
  fallbackAttempts: PlayerType[];
  isFallbacking: boolean;
  fallbackError?: string;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ file, onClose, onError }) => {
  const { colors } = useColors();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  // Configuration d'optimisation
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>({
    bandwidthControl: 'auto',
    noiseReduction: false,
    voiceEnhancement: false,
    audioCompression: false,
    videoCompression: false
  });

  // État d'optimisation
  const [optimizationInfo, setOptimizationInfo] = useState<OptimizationInfo | null>(null);
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  
  // Indicateurs de streaming distant
  const [streamingQuality, setStreamingQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [bufferHealth, setBufferHealth] = useState<number>(100);
  const [networkLatency, setNetworkLatency] = useState<number>(0);

  // État du fallback
  const [fallbackState, setFallbackState] = useState<FallbackState>({
    currentPlayer: 'react',
    fallbackAttempts: [],
    isFallbacking: false
  });

  // Ajout d'un compteur pour éviter les boucles infinies
  const [fallbackCount, setFallbackCount] = useState(0);
  const maxFallbackAttempts = 2; // Limite le nombre de tentatives

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Détection du type de média
  const isVideo = file.mime_type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|ogg|mov|m4v|3gp|ogv|ts|mts|m2ts|mkv|avi|wmv|flv|asf|rm|rmvb|divx|xvid|h264|h265|vp8|vp9|mpeg|mpg|mpe|m1v|m2v|mpv|mp2|m2p|ps|evo|ogm|ogx|mxf|nut|hls|m3u8)$/i);
  const isAudio = file.mime_type?.startsWith('audio/') || file.name?.match(/\.(mp3|wav|flac|aac|ogg|wma|m4a|opus|aiff|au|ra|rm|wv|ape|alac|ac3|dts|amr|3ga|mka|tta|mid|midi)$/i);

  // URLs pour différents modes de lecture
  const getMediaUrl = (playerType: PlayerType): string => {
    switch (playerType) {
      case 'react':
        return `/api/files/stream-by-path/${encodeURIComponent(file.path)}`;
      case 'native':
        return `/api/files/stream-by-path/${encodeURIComponent(file.path)}?native=true`;
      case 'direct':
        return `/api/files/download/${file.id}`;
      default:
        return `/api/files/stream-by-path/${encodeURIComponent(file.path)}`;
    }
  };

  // Gestionnaire de fallback automatique
  const handleFallback = async (failedPlayer: PlayerType, error: string) => {
    console.warn(`❌ Échec du lecteur ${failedPlayer}:`, error);
    
    // Vérifier si on a dépassé le nombre maximum de tentatives
    if (fallbackCount >= maxFallbackAttempts) {
      const errorMessage = `Impossible de lire le fichier après ${maxFallbackAttempts + 1} tentatives. Erreur finale: ${error}`;
      setError(errorMessage);
      setFallbackState(prev => ({
        ...prev,
        isFallbacking: false,
        fallbackError: errorMessage
      }));
      
      if (onError) {
        onError(errorMessage);
      }
      return;
    }
    
    const fallbackOrder: PlayerType[] = ['react', 'native', 'direct'];
    const currentIndex = fallbackOrder.indexOf(failedPlayer);
    const nextPlayer = fallbackOrder[currentIndex + 1];
    
    if (nextPlayer && !fallbackState.fallbackAttempts.includes(nextPlayer)) {
      console.log(`🔄 Tentative de fallback vers ${nextPlayer}... (${fallbackCount + 1}/${maxFallbackAttempts})`);
      
      setFallbackCount(prev => prev + 1);
      setFallbackState(prev => ({
        currentPlayer: nextPlayer,
        fallbackAttempts: [...prev.fallbackAttempts, failedPlayer],
        isFallbacking: true,
        fallbackError: error
      }));
      
      setError(null);
      setIsLoading(true);
      
      // Attendre plus longtemps entre les tentatives pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (videoRef.current) {
        videoRef.current.src = getMediaUrl(nextPlayer);
        videoRef.current.load();
      }
      if (audioRef.current) {
        audioRef.current.src = getMediaUrl(nextPlayer);
        audioRef.current.load();
      }
      
      setFallbackState(prev => ({
        ...prev,
        isFallbacking: false
      }));
    } else {
      const allAttempts = [...fallbackState.fallbackAttempts, failedPlayer];
      const errorMessage = `Impossible de lire le fichier. Tentatives: ${allAttempts.join(', ')}. Erreur finale: ${error}`;
      
      setError(errorMessage);
      setFallbackState(prev => ({
        ...prev,
        isFallbacking: false,
        fallbackError: errorMessage
      }));
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement, Event>) => {
    console.error('❌ Erreur média:', e);
    
    // Éviter les erreurs multiples en cours de fallback
    if (fallbackState.isFallbacking) {
      console.log('⏳ Fallback en cours, ignoré cette erreur');
      return;
    }
    
    let errorMessage = 'Erreur lors du chargement du fichier média';
    
    try {
      const target = e.target as HTMLVideoElement | HTMLAudioElement;
      
      if (target && target.error && target.error.code) {
        const error = target.error;
        switch (error.code) {
          case 1:
            errorMessage = 'Lecture interrompue par l\'utilisateur';
            // Ne pas faire de fallback pour cette erreur
            setError(errorMessage);
            return;
          case 2:
            errorMessage = 'Erreur réseau - impossible de charger le fichier';
            break;
          case 3:
            errorMessage = 'Format non supporté ou fichier corrompu';
            break;
          case 4:
            errorMessage = 'Format de fichier non supporté par le navigateur';
            break;
          default:
            errorMessage = `Erreur de lecture: ${error.message || 'Erreur inconnue'}`;
        }
      } else {
        const extension = file.name?.split('.').pop()?.toLowerCase();
        errorMessage = `Impossible de lire le fichier ${extension || 'média'}. Le navigateur ne supporte pas ce format.`;
      }
    } catch (err) {
      console.error('Erreur dans handleError:', err);
      errorMessage = 'Erreur inattendue lors de la lecture du fichier';
    }
    
    // Attendre un peu avant de déclencher le fallback pour éviter les erreurs temporaires
    setTimeout(() => {
      handleFallback(fallbackState.currentPlayer, errorMessage);
    }, 500);
  };

  const handleProgress = () => {
    const media = videoRef.current || audioRef.current;
    if (media) {
      setCurrentTime(media.currentTime);
      
      if (media.buffered.length > 0) {
        const bufferedEnd = media.buffered.end(media.buffered.length - 1);
        const currentTime = media.currentTime;
        const bufferAhead = bufferedEnd - currentTime;
        const bufferHealthPercent = Math.min(100, (bufferAhead / 10) * 100);
        setBufferHealth(bufferHealthPercent);
        
        if (bufferHealthPercent > 80) {
          setStreamingQuality('excellent');
        } else if (bufferHealthPercent > 50) {
          setStreamingQuality('good');
        } else if (bufferHealthPercent > 20) {
          setStreamingQuality('fair');
        } else {
          setStreamingQuality('poor');
        }
      }
    }
  };

  const handleDuration = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    } else if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    console.log(`✅ Média chargé avec succès via le lecteur ${fallbackState.currentPlayer}`);
    
    setIsLoading(false);
    setError(null);
    handleDuration();
    
    if (isAudio || isVideo) {
      setTimeout(() => {
        connectAudioElement();
      }, 100);
    }
  };

  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const connectAudioElement = () => {
    if (!audioContextRef.current) return;

    try {
      const mediaElement = isVideo ? videoRef.current : audioRef.current;
      if (!mediaElement) return;

      audioSourceRef.current = audioContextRef.current.createMediaElementSource(mediaElement);
      audioSourceRef.current.connect(audioContextRef.current.destination);
    } catch (error) {
      console.warn('Erreur lors de la connexion audio:', error);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setError(null);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = async () => {
    try {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          await videoRef.current.play();
        }
      } else if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la lecture:', error);
      setError('Erreur lors de la lecture du fichier média');
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    } else if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    } else if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = getMediaUrl('direct');
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.href += `?t=${Date.now()}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      setError('Erreur lors du téléchargement du fichier');
    }
  };

  const forcePlayerChange = async (newPlayer: PlayerType) => {
    console.log(`🔄 Changement manuel vers le lecteur ${newPlayer}`);
    
    setFallbackState(prev => ({
      currentPlayer: newPlayer,
      fallbackAttempts: [...prev.fallbackAttempts, prev.currentPlayer],
      isFallbacking: true
    }));
    
    setError(null);
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (videoRef.current) {
      videoRef.current.src = getMediaUrl(newPlayer);
      videoRef.current.load();
    }
    if (audioRef.current) {
      audioRef.current.src = getMediaUrl(newPlayer);
      audioRef.current.load();
    }
    
    setFallbackState(prev => ({
      ...prev,
      isFallbacking: false
    }));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVideoSize = () => {
    if (isFullscreen) {
      return {
        maxHeight: '100vh',
        maxWidth: '100vw',
        width: 'auto',
        height: 'auto'
      };
    }
    
    const containerHeight = windowSize.height - 300;
    const containerWidth = windowSize.width - 400;
    
    return {
      maxHeight: `${Math.max(containerHeight, 200)}px`,
      maxWidth: `${Math.max(containerWidth, 300)}px`,
      width: 'auto',
      height: 'auto'
    };
  };

  const checkOptimizationSupport = async () => {
    // Éviter les appels multiples
    if (optimizationInfo !== null) return;
    
    try {
      const support = await multimediaService.checkOptimizationSupport(file.id);
      setFfmpegAvailable(support.ffmpegAvailable);
      setOptimizationInfo(support.optimizationInfo || null);
    } catch (error) {
      console.warn('Impossible de vérifier le support d\'optimisation:', error);
      // Ne pas bloquer la lecture si l'optimisation échoue
      setOptimizationInfo(null);
    }
  };

  // Initialisation
  useEffect(() => {
    if (file && (isVideo || isAudio)) {
      setIsLoading(true);
      setError(null);
      
      // Réinitialiser les compteurs
      setFallbackCount(0);
      setFallbackState({
        currentPlayer: 'react',
        fallbackAttempts: [],
        isFallbacking: false
      });
      
      if (isAudio || isVideo) {
        initializeAudioContext();
      }

      // Vérifier l'optimisation seulement si on a un ID de fichier
      if (file.id) {
        // Délayer la vérification pour éviter la surcharge au démarrage
        setTimeout(() => {
          checkOptimizationSupport();
        }, 1000);
      }
      
      console.log(`🎬 Démarrage de la lecture avec le lecteur ${fallbackState.currentPlayer}`);
    }
  }, [file, isVideo, isAudio]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      if (onError) {
        onError(error);
      }
    }
  }, [error, onError]);

  if (error) {
    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: colors.surface }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{isVideo ? '🎬' : '🎵'}</span>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                {file.name}
              </h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Erreur de lecture
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

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
              Erreur de lecture
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {error}
            </p>
            <div className="text-xs mb-4" style={{ color: colors.textSecondary }}>
              <p>Fichier: {file.name}</p>
              <p>Type: {file.mime_type}</p>
              <p>Taille: {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Inconnue'}</p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                  if (audioRef.current) {
                    audioRef.current.load();
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Télécharger
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-black' 
          : 'h-full'
      }`} 
      style={{ backgroundColor: isFullscreen ? 'black' : colors.surface }}
    >
      {!isFullscreen && (
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{isVideo ? '🎬' : '🎵'}</span>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                {file.name}
              </h2>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {isVideo ? 'Vidéo' : 'Audio'}
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
      )}

      {!isFullscreen && (
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          {(isVideo || isAudio) && (
            <button
              onClick={() => setShowOptimizationPanel(!showOptimizationPanel)}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Optimisations audio/vidéo"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          )}
          
          {isVideo && (
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Plein écran"
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {isFullscreen && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-slate-700 text-white hover:text-slate-300 transition-colors"
            title="Sortir du plein écran"
          >
            <ArrowsPointingInIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-slate-900/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">
              {fallbackState.isFallbacking 
                ? `Tentative de lecture avec le lecteur ${fallbackState.currentPlayer}...`
                : 'Chargement du média...'
              }
            </p>
            {fallbackState.fallbackAttempts.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                Tentatives précédentes: {fallbackState.fallbackAttempts.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={`flex items-center justify-center relative ${
        isFullscreen ? 'h-full' : 'flex-1 p-4'
      }`} style={{ 
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {isVideo ? (
          <div className={`flex items-center justify-center ${
            isFullscreen ? 'w-full h-full' : 'w-full h-full'
          }`} style={{
            maxWidth: '100%',
            maxHeight: '100%',
            overflow: 'hidden'
          }}>
            <video
              ref={videoRef}
              src={getMediaUrl(fallbackState.currentPlayer)}
              controls={false}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleProgress}
              onError={handleError}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onLoadStart={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
              className="max-w-full max-h-full object-contain"
              style={getVideoSize()}
              preload="metadata"
              crossOrigin="anonymous"
              muted={false}
              playsInline
            />
          </div>
        ) : isAudio ? (
          <div className="w-full max-w-2xl mx-auto text-center">
            <div className="bg-slate-800 rounded-lg p-8 mb-4">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">{file.name}</h3>
              <p className="text-slate-400 text-sm mb-6">Fichier audio</p>
              
              <audio
                ref={audioRef}
                src={getMediaUrl(fallbackState.currentPlayer)}
                controls={false}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleProgress}
                onError={handleError}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onLoadStart={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                preload="metadata"
                crossOrigin="anonymous"
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

      {(isVideo || isAudio) && !isFullscreen && (
        <div className="bg-slate-800 border-t border-slate-700 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6" />
                )}
              </button>
              
              <button
                onClick={stop}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <StopIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 flex items-center space-x-3">
              <span className="text-sm text-slate-300 w-14 font-mono">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-3 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #475569 ${(currentTime / (duration || 1)) * 100}%, #475569 100%)`
                  }}
                  title={`Position: ${formatTime(currentTime)} / ${formatTime(duration)}`}
                />
                <div 
                  className="absolute top-0 left-0 h-3 bg-blue-500 rounded-lg pointer-events-none transition-all duration-100"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>
              <span className="text-sm text-slate-300 w-14 font-mono text-right">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title={volume === 0 ? "Activer le son" : "Couper le son"}
              >
                {volume === 0 ? (
                  <SpeakerXMarkIcon className="h-5 w-5" />
                ) : volume < 0.5 ? (
                  <SpeakerWaveIcon className="h-5 w-5" />
                ) : (
                  <SpeakerWaveIcon className="h-5 w-5" />
                )}
              </button>
              <div className="flex items-center space-x-2 min-w-0">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                  title={`Volume: ${Math.round(volume * 100)}%`}
                />
                <span className="text-xs text-slate-400 w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <div className="flex items-center space-x-1">
                <SignalIcon className="h-4 w-4" style={{ 
                  color: streamingQuality === 'excellent' ? '#10b981' : 
                         streamingQuality === 'good' ? '#3b82f6' : 
                         streamingQuality === 'fair' ? '#f59e0b' : '#ef4444' 
                }} />
                <span className="text-xs text-slate-400">
                  {streamingQuality === 'excellent' ? 'Excellent' :
                   streamingQuality === 'good' ? 'Bon' :
                   streamingQuality === 'fair' ? 'Moyen' : 'Faible'}
                </span>
              </div>
              <div className="w-16 h-1 bg-slate-600 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${bufferHealth}%`,
                    backgroundColor: bufferHealth > 80 ? '#10b981' : 
                                   bufferHealth > 50 ? '#3b82f6' : 
                                   bufferHealth > 20 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <div className="flex items-center space-x-1">
                {fallbackState.currentPlayer === 'react' && (
                  <VideoCameraIcon className="h-4 w-4 text-blue-500" />
                )}
                {fallbackState.currentPlayer === 'native' && (
                  <MicrophoneIcon className="h-4 w-4 text-green-500" />
                )}
                {fallbackState.currentPlayer === 'direct' && (
                  <ArrowDownTrayIcon className="h-4 w-4 text-orange-500" />
                )}
                <span className="text-xs text-slate-400">
                  {fallbackState.currentPlayer === 'react' ? 'React' :
                   fallbackState.currentPlayer === 'native' ? 'Natif' : 'Direct'}
                </span>
              </div>
              
              <div className="relative">
                <select
                  value={fallbackState.currentPlayer}
                  onChange={(e) => forcePlayerChange(e.target.value as PlayerType)}
                  className="text-xs bg-slate-700 text-slate-300 border border-slate-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  disabled={fallbackState.isFallbacking}
                >
                  <option value="react">React</option>
                  <option value="native">Natif</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPlayer; 