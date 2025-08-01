import React, { useState, useRef, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import multimediaService, { OptimizationSettings, OptimizationInfo } from '../../services/multimediaService';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  SpeakerWaveIcon,
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

// Configuration d'optimisation
interface OptimizationSettings {
  // Contrôle de bande passante
  bandwidthControl: 'auto' | 'low' | 'medium' | 'high';
  adaptiveQuality: boolean;
  
  // Amélioration audio
  noiseReduction: boolean;
  voiceEnhancement: boolean;
  audioCompression: boolean;
  
  // Optimisation vidéo
  videoCompression: boolean;
  frameRateControl: 'auto' | '24' | '30' | '60';
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Détection du type de média avec formats supportés nativement
  const isVideo = file.mime_type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|ogg|mov|m4v|3gp|ogv|ts|mts|m2ts|mkv|avi|wmv|flv|asf|rm|rmvb|divx|xvid|h264|h265|vp8|vp9|mpeg|mpg|mpe|m1v|m2v|mpv|mp2|m2p|ps|evo|ogm|ogx|mxf|nut|hls|m3u8)$/i);
  const isAudio = file.mime_type?.startsWith('audio/') || file.name?.match(/\.(mp3|wav|flac|aac|ogg|wma|m4a|opus|aiff|au|ra|rm|wv|ape|alac|ac3|dts|amr|3ga|mka|tta|mid|midi)$/i);

  // URL directe vers le fichier (streaming natif)
  const mediaUrl = `/api/files/stream-by-path/${encodeURIComponent(file.path)}`;
  console.log('🎬 MediaPlayer: URL média:', mediaUrl);
  console.log('🎬 MediaPlayer: Type de fichier:', { isVideo, isAudio, mimeType: file.mime_type, name: file.name });

  // Vérifier si le format est supporté nativement
  const isSupportedFormat = () => {
    const supportedVideoFormats = ['mp4', 'webm', 'ogg', 'mov', 'm4v', '3gp', 'ogv', 'avi', 'mkv', 'wmv', 'flv'];
    const supportedAudioFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus', 'wma'];
    
    const extension = file.name?.split('.').pop()?.toLowerCase();
    
    if (isVideo) {
      return supportedVideoFormats.includes(extension);
    }
    if (isAudio) {
      return supportedAudioFormats.includes(extension);
    }
    
    return false;
  };

  // Vérifier si le format est supporté nativement par le navigateur
  const isNativelySupported = () => {
    const nativelySupportedVideo = ['mp4', 'webm', 'ogg', 'mov'];
    const nativelySupportedAudio = ['mp3', 'wav', 'ogg', 'aac'];
    
    const extension = file.name?.split('.').pop()?.toLowerCase();
    
    if (isVideo) {
      return nativelySupportedVideo.includes(extension);
    }
    if (isAudio) {
      return nativelySupportedAudio.includes(extension);
    }
    
    return false;
  };

  // Vérifier si le format peut être lu par le navigateur - Logique simplifiée
  const canPlayFormat = () => {
    if (!isVideo && !isAudio) return false;
    
    const extension = file.name?.split('.').pop()?.toLowerCase();
    const mimeType = file.mime_type?.toLowerCase();
    
    // Vérifier par MIME type en premier (plus fiable)
    if (mimeType) {
      if (isVideo && mimeType.startsWith('video/')) {
        return true;
      }
      if (isAudio && mimeType.startsWith('audio/')) {
        return true;
      }
    }
    
    // Vérifier par extension si MIME type n'est pas disponible
    if (extension && isSupportedFormat()) {
      return true;
    }
    
    // Si on a détecté que c'est une vidéo/audio, on essaie quand même
    // Le navigateur peut gérer plus de formats qu'on ne pense
    if (isVideo || isAudio) {
      return true;
    }
    
    return false;
  };

  // Gestion des événements média
  const handleReady = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement, Event>) => {
    console.error('❌ Erreur média:', e);
    
    let errorMessage = 'Erreur lors du chargement du fichier média';
    
    try {
      const target = e.target as HTMLVideoElement | HTMLAudioElement;
      
      // Vérifier si c'est un événement d'erreur média avec un code d'erreur
      if (target && target.error && target.error.code) {
        const error = target.error;
        switch (error.code) {
          case 1: // MEDIA_ERR_ABORTED
            errorMessage = 'Lecture interrompue par l\'utilisateur';
            break;
          case 2: // MEDIA_ERR_NETWORK
            errorMessage = 'Erreur réseau - impossible de charger le fichier';
            break;
          case 3: // MEDIA_ERR_DECODE
            errorMessage = 'Format non supporté ou fichier corrompu';
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            errorMessage = 'Format de fichier non supporté par le navigateur';
            break;
          default:
            errorMessage = `Erreur de lecture: ${error.message || 'Erreur inconnue'}`;
        }
      } else {
        // Erreur générique - message simplifié
        const extension = file.name?.split('.').pop()?.toLowerCase();
        errorMessage = `Impossible de lire le fichier ${extension || 'média'}. Le navigateur ne supporte pas ce format.`;
      }
    } catch (err) {
      console.error('Erreur dans handleError:', err);
      errorMessage = 'Erreur inattendue lors de la lecture du fichier';
    }
    
    setError(errorMessage);
    setIsLoading(false);
    
    if (onError) {
      onError(errorMessage);
    }
  };

  const handleProgress = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    } else if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
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
    console.log('✅ MediaPlayer: Métadonnées chargées pour:', file.name);
    setIsLoading(false);
    setError(null);
    handleDuration();
    
    // Connecter l'audio à l'API Web Audio après chargement des métadonnées
    if (isAudio || isVideo) {
      setTimeout(() => {
        connectAudioElement();
      }, 100);
    }
  };

  // Appliquer les optimisations audio
  const applyAudioOptimizations = () => {
    if (!audioContextRef.current || !audioSourceRef.current) return;

    try {
      multimediaService.applyRealTimeOptimizations(
        audioContextRef.current,
        audioSourceRef.current,
        optimizationSettings
      );
    } catch (error) {
      console.warn('Erreur lors de l\'application des optimisations audio:', error);
    }
  };

  // Appliquer les optimisations vidéo
  const applyVideoOptimizations = () => {
    if (!videoRef.current) return;

    try {
      multimediaService.applyVideoOptimizations(videoRef.current, optimizationSettings);
    } catch (error) {
      console.warn('Erreur lors de l\'application des optimisations vidéo:', error);
    }
  };

  // Gestionnaire pour les changements d'optimisation
  const handleOptimizationChange = (setting: keyof OptimizationSettings, value: any) => {
    setOptimizationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Initialiser l'API Web Audio
  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  // Connecter l'élément audio/vidéo à l'API Web Audio
  const connectAudioElement = () => {
    if (!audioContextRef.current) return;

    try {
      const mediaElement = isVideo ? videoRef.current : audioRef.current;
      if (!mediaElement) return;

      // Créer la source audio
      audioSourceRef.current = audioContextRef.current.createMediaElementSource(mediaElement);
      
      // Connecter à la destination par défaut
      audioSourceRef.current.connect(audioContextRef.current.destination);
      
      console.log('✅ Audio connecté à l\'API Web Audio');
    } catch (error) {
      console.warn('Erreur lors de la connexion audio:', error);
    }
  };

  // Panel d'optimisation
  const renderOptimizationPanel = () => {
    if (!showOptimizationPanel) return null;

    return (
      <div className="absolute top-16 right-4 z-20 bg-slate-800 border border-slate-600 rounded-lg p-4 w-80 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Optimisations</h3>
          <button
            onClick={() => setShowOptimizationPanel(false)}
            className="text-slate-400 hover:text-slate-200"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Statut FFmpeg */}
        {!ffmpegAvailable && (
          <div className="mb-4 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-yellow-300">FFmpeg non disponible</span>
            </div>
            <p className="text-xs text-yellow-400 mt-1">
              Les optimisations avancées nécessitent FFmpeg
            </p>
          </div>
        )}

        {/* Informations du fichier */}
        {optimizationInfo && (
          <div className="mb-4 p-2 bg-slate-700/50 rounded">
            <div className="text-xs text-slate-300 mb-1">
              {optimizationInfo.file_name}
            </div>
            <div className="text-xs text-slate-400">
              {optimizationInfo.file_type} • {optimizationInfo.file_size_mb} MB
            </div>
          </div>
        )}

        {/* Contrôle de bande passante */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <SignalIcon className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-slate-300">Bande passante</span>
          </div>
          <select
            value={optimizationSettings.bandwidthControl}
            onChange={(e) => handleOptimizationChange('bandwidthControl', e.target.value)}
            className="w-full text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200"
          >
            <option value="auto">Auto</option>
            <option value="low">Basse (économique)</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute (qualité)</option>
          </select>
        </div>

        {/* Amélioration audio */}
        {(isAudio || isVideo) && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <MicrophoneIcon className="h-4 w-4 text-green-400" />
              <span className="text-xs font-medium text-slate-300">Audio</span>
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.noiseReduction}
                  onChange={(e) => handleOptimizationChange('noiseReduction', e.target.checked)}
                  disabled={!ffmpegAvailable}
                  className={`${ffmpegAvailable ? 'text-green-500' : 'text-slate-500'}`}
                />
                <span className={`text-xs ${ffmpegAvailable ? 'text-slate-400' : 'text-slate-500'}`}>
                  Réduction de bruit
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.voiceEnhancement}
                  onChange={(e) => handleOptimizationChange('voiceEnhancement', e.target.checked)}
                  disabled={!ffmpegAvailable}
                  className={`${ffmpegAvailable ? 'text-green-500' : 'text-slate-500'}`}
                />
                <span className={`text-xs ${ffmpegAvailable ? 'text-slate-400' : 'text-slate-500'}`}>
                  Accentuation voix
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.audioCompression}
                  onChange={(e) => handleOptimizationChange('audioCompression', e.target.checked)}
                  disabled={!ffmpegAvailable}
                  className={`${ffmpegAvailable ? 'text-green-500' : 'text-slate-500'}`}
                />
                <span className={`text-xs ${ffmpegAvailable ? 'text-slate-400' : 'text-slate-500'}`}>
                  Compression audio
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Optimisation vidéo */}
        {isVideo && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <VideoCameraIcon className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-300">Vidéo</span>
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={optimizationSettings.videoCompression}
                  onChange={(e) => handleOptimizationChange('videoCompression', e.target.checked)}
                  disabled={!ffmpegAvailable}
                  className={`${ffmpegAvailable ? 'text-purple-500' : 'text-slate-500'}`}
                />
                <span className={`text-xs ${ffmpegAvailable ? 'text-slate-400' : 'text-slate-500'}`}>
                  Compression vidéo
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="space-y-2">
          <button
            onClick={() => {
              if (isAudio) applyAudioOptimizations();
              if (isVideo) applyVideoOptimizations();
              setShowOptimizationPanel(false);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded transition-colors"
          >
            Optimisations temps réel
          </button>
          
          {ffmpegAvailable && (
            <button
              onClick={async () => {
                setIsOptimizing(true);
                try {
                  const optimizedBlob = await multimediaService.optimizeFile(file.id, optimizationSettings);
                  const url = URL.createObjectURL(optimizedBlob);
                  
                  // Remplacer la source du média
                  if (isVideo && videoRef.current) {
                    videoRef.current.src = url;
                  } else if (isAudio && audioRef.current) {
                    audioRef.current.src = url;
                  }
                  
                  setShowOptimizationPanel(false);
                } catch (error) {
                  console.error('Erreur lors de l\'optimisation:', error);
                } finally {
                  setIsOptimizing(false);
                }
              }}
              disabled={isOptimizing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-xs py-2 rounded transition-colors"
            >
              {isOptimizing ? 'Optimisation...' : 'Optimiser fichier (FFmpeg)'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Gestionnaires d'événements de lecture
  const handlePlay = () => {
    setIsPlaying(true);
    setError(null);
    
    // Appliquer les optimisations quand la lecture commence
    if (isAudio) {
      applyAudioOptimizations();
    }
    if (isVideo) {
      applyVideoOptimizations();
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Contrôles de lecture
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
      link.href = mediaUrl;
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

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculer la taille optimale de la vidéo
  const getVideoSize = () => {
    if (isFullscreen) {
      return {
        maxHeight: '100vh',
        maxWidth: '100vw',
        width: 'auto',
        height: 'auto'
      };
    }
    
    // En mode normal, calculer en fonction de l'espace disponible
    const containerHeight = windowSize.height - 300; // Hauteur disponible
    const containerWidth = windowSize.width - 400;   // Largeur disponible
    
    return {
      maxHeight: `${Math.max(containerHeight, 200)}px`, // Minimum 200px
      maxWidth: `${Math.max(containerWidth, 300)}px`,   // Minimum 300px
      width: 'auto',
      height: 'auto'
    };
  };

  // Vérification préalable du format - Logique simplifiée
  useEffect(() => {
    // On ne bloque plus l'affichage préalablement
    // On laisse le navigateur essayer de lire le fichier
    // et on gère les erreurs via onError du media element
    
    // Initialiser l'API Web Audio pour les optimisations
    if (isAudio || isVideo) {
      initializeAudioContext();
    }

    // Vérifier le support d'optimisation
    if (file.id) {
      checkOptimizationSupport();
    }
  }, [file, isVideo, isAudio]);

  // Vérifier le support d'optimisation
  const checkOptimizationSupport = async () => {
    try {
      const support = await multimediaService.checkOptimizationSupport(file.id);
      setFfmpegAvailable(support.ffmpegAvailable);
      setOptimizationInfo(support.optimizationInfo || null);
    } catch (error) {
      console.warn('Impossible de vérifier le support d\'optimisation:', error);
    }
  };

  // Écouter les changements de taille de fenêtre
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

  // Gestion des erreurs de chargement
  useEffect(() => {
    if (error) {
      setIsLoading(false);
      if (onError) {
        onError(error);
      }
    }
  }, [error, onError]);

  // Affichage de l'erreur
  if (error) {
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

        {/* Message d'erreur */}
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
                  // Recharger le composant en forçant un re-render
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
      {/* Header - masqué en mode plein écran */}
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

      {/* Boutons de contrôle - visible en mode normal */}
      {!isFullscreen && (
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          {/* Bouton d'optimisation pour vidéo et audio */}
          {(isVideo || isAudio) && (
            <button
              onClick={() => setShowOptimizationPanel(!showOptimizationPanel)}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Optimisations audio/vidéo"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          )}
          
          {/* Bouton plein écran pour vidéo */}
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

      {/* Bouton quitter plein écran - visible en mode plein écran */}
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

      {/* Panel d'optimisation */}
      {renderOptimizationPanel()}

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-slate-900/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Chargement du média...</p>
          </div>
        </div>
      )}

      {/* Affichage d'erreur */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-slate-900/80">
          <div className="text-center max-w-md mx-auto p-6 bg-slate-800 rounded-lg border border-red-500">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">Erreur de lecture</h3>
            <p className="text-slate-300 text-sm mb-4">{error}</p>
            <div className="text-xs text-slate-400 mb-4">
              <p>Fichier: {file.name}</p>
              <p>Type: {file.mime_type}</p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  // Recharger le composant en forçant un re-render
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                  if (audioRef.current) {
                    audioRef.current.load();
                  }
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
              >
                Télécharger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lecteur média universel */}
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
              src={mediaUrl}
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
                src={mediaUrl}
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

      {/* Contrôles de lecture - masqués en mode plein écran */}
      {(isVideo || isAudio) && !isFullscreen && (
        <div className="bg-slate-800 border-t border-slate-700 p-4">
          <div className="flex items-center space-x-4">
            {/* Boutons de contrôle */}
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

            {/* Barre de progression */}
            <div className="flex-1 flex items-center space-x-2">
              <span className="text-xs text-slate-400 w-12">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #475569 ${(currentTime / (duration || 1)) * 100}%, #475569 100%)`
                }}
              />
              <span className="text-xs text-slate-400 w-12">
                {formatTime(duration)}
              </span>
            </div>

            {/* Contrôles de volume */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <SpeakerWaveIcon className="h-5 w-5" />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>


          </div>
        </div>
      )}

      {/* Panel d'optimisation */}
      {renderOptimizationPanel()}
    </div>
  );
};

export default MediaPlayer; 