import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  DocumentTextIcon,
  TableCellsIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';

interface FileViewerProps {
  file: any;
  onClose: () => void;
  currentIndex?: number;
  totalFiles?: number;
  onMediaControls?: (controls: {
    type: 'audio' | 'video';
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSeek: (time: number) => void;
    onVolumeChange: (volume: number) => void;
    onMuteToggle: () => void;
  }) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose, currentIndex, totalFiles, onMediaControls }) => {
  const { colors } = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  // États pour les contrôles multimédia
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Déterminer le type de fichier
  const getFileType = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType) {
      if (mimeType.startsWith('text/')) return 'text';
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('audio/')) return 'audio';
      if (mimeType.startsWith('application/pdf') || mimeType.startsWith('application/vnd.openxmlformats') || 
          mimeType.startsWith('application/msword') || mimeType.startsWith('application/vnd.ms-powerpoint')) return 'document';
      if (mimeType.startsWith('application/vnd.ms-excel') || mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) return 'spreadsheet';
      if (mimeType.startsWith('message/')) return 'email';
    }
    
    if (extension) {
      // Images
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'raw', 'heic', 'heif', 'cr2', 'nef', 'arw'].includes(extension)) return 'image';
      
      // Audio
      if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'aiff', 'alac'].includes(extension)) return 'audio';
      
      // Vidéo
      if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv', 'ts', 'mts', 'm2ts'].includes(extension)) return 'video';
      
      // Documents
      if (['pdf', 'docx', 'doc', 'rtf', 'odt', 'pages', 'ppt', 'pptx', 'odp', 'key'].includes(extension)) return 'document';
      
      // Tableurs
      if (['xlsx', 'xls', 'csv', 'ods', 'numbers'].includes(extension)) return 'spreadsheet';
      
      // Emails
      if (['eml', 'msg', 'pst', 'ost'].includes(extension)) return 'email';
      
      // Texte
      if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'tex', 'log', 'ini', 'cfg', 'conf', 'yaml', 'yml', 'sql', 'sh', 'bat', 'ps1'].includes(extension)) return 'text';
    }
    
    return 'unknown';
  };

  const fileType = getFileType(file.name, file.mime_type);

  // Fonctions de contrôle multimédia
  const handlePlay = async () => {
    console.log('🎵 FileViewer: handlePlay appelé, type:', fileType);
    try {
      if (fileType === 'audio' && audioRef.current) {
        console.log('🎵 FileViewer: Lecture audio...');
        await audioRef.current.play();
        setIsPlaying(true);
        console.log('✅ FileViewer: Audio en lecture');
      } else if (fileType === 'video' && videoRef.current) {
        console.log('🎵 FileViewer: Lecture vidéo...');
        await videoRef.current.play();
        setIsPlaying(true);
        console.log('✅ FileViewer: Vidéo en lecture');
      }
    } catch (error) {
      console.error('❌ FileViewer: Erreur lors de la lecture:', error);
      setIsPlaying(false);
    }
  };

  const handlePause = () => {
    if (fileType === 'audio' && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (fileType === 'video' && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (fileType === 'audio' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    } else if (fileType === 'video' && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (time: number) => {
    const clampedTime = Math.max(0, Math.min(duration, time));
    
    if (fileType === 'audio' && audioRef.current) {
      try {
        audioRef.current.currentTime = clampedTime;
        setCurrentTime(clampedTime);
      } catch (error) {
        console.error('Erreur lors du seek audio:', error);
      }
    } else if (fileType === 'video' && videoRef.current) {
      try {
        videoRef.current.currentTime = clampedTime;
        setCurrentTime(clampedTime);
      } catch (error) {
        console.error('Erreur lors du seek vidéo:', error);
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    
    if (fileType === 'audio' && audioRef.current) {
      audioRef.current.volume = clampedVolume;
      setVolume(clampedVolume);
      // Désactiver le mute si le volume est > 0
      if (clampedVolume > 0 && isMuted) {
        setIsMuted(false);
      }
    } else if (fileType === 'video' && videoRef.current) {
      videoRef.current.volume = clampedVolume;
      setVolume(clampedVolume);
      // Désactiver le mute si le volume est > 0
      if (clampedVolume > 0 && isMuted) {
        setIsMuted(false);
      }
    }
  };

  const handleMuteToggle = () => {
    if (fileType === 'audio' && audioRef.current) {
      if (isMuted) {
        // Restaurer le volume précédent ou utiliser 0.5 par défaut
        const previousVolume = volume > 0 ? volume : 0.5;
        audioRef.current.volume = previousVolume;
        setVolume(previousVolume);
        setIsMuted(false);
      } else {
        // Sauvegarder le volume actuel et mettre en mute
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    } else if (fileType === 'video' && videoRef.current) {
      if (isMuted) {
        // Restaurer le volume précédent ou utiliser 0.5 par défaut
        const previousVolume = volume > 0 ? volume : 0.5;
        videoRef.current.volume = previousVolume;
        setVolume(previousVolume);
        setIsMuted(false);
      } else {
        // Sauvegarder le volume actuel et mettre en mute
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Transmettre les contrôles multimédia au parent
  useEffect(() => {
    if (onMediaControls && (fileType === 'audio' || fileType === 'video')) {
      console.log('🎵 FileViewer: Transmission des contrôles multimédia:', {
        type: fileType,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted
      });
      onMediaControls({
        type: fileType as 'audio' | 'video',
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        onPlay: handlePlay,
        onPause: handlePause,
        onStop: handleStop,
        onSeek: handleSeek,
        onVolumeChange: handleVolumeChange,
        onMuteToggle: handleMuteToggle,
      });
    }
  }, [onMediaControls, fileType, isPlaying, currentTime, duration, volume, isMuted]);

  // Gestionnaires d'événements multimédia
  const handleAudioLoad = () => {
    console.log('🎵 FileViewer: handleAudioLoad appelé');
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      console.log('🎵 FileViewer: Durée audio:', duration);
      if (isFinite(duration) && duration > 0) {
        setDuration(duration);
        console.log('✅ FileViewer: Durée audio définie:', duration);
      } else {
        console.warn('⚠️ FileViewer: Durée audio invalide:', duration);
        setDuration(0);
      }
    }
  };

  const handleVideoLoad = () => {
    console.log('🎵 FileViewer: handleVideoLoad appelé');
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      console.log('🎵 FileViewer: Durée vidéo:', duration);
      if (isFinite(duration) && duration > 0) {
        setDuration(duration);
        console.log('✅ FileViewer: Durée vidéo définie:', duration);
      } else {
        console.warn('⚠️ FileViewer: Durée vidéo invalide:', duration);
        setDuration(0);
      }
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      if (isFinite(currentTime) && currentTime >= 0) {
        setCurrentTime(currentTime);
      }
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      if (isFinite(currentTime) && currentTime >= 0) {
        setCurrentTime(currentTime);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioError = (error: any) => {
    console.error('Erreur audio:', error);
    setIsPlaying(false);
    setError('Erreur lors de la lecture audio');
  };

  const handleVideoError = (error: any) => {
    console.error('Erreur vidéo:', error);
    setIsPlaying(false);
    setError('Erreur lors de la lecture vidéo');
  };

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
        } else if (fileType === 'image' || fileType === 'video' || fileType === 'audio' || (fileType === 'document' && file.name.toLowerCase().endsWith('.pdf'))) {
          // Pour les images, vidéos, audios et PDF, utiliser le streaming direct depuis le disque
          console.log('🖼️ FileViewer: Chargement via streaming depuis le disque...');
          
          // Utiliser l'endpoint de streaming pour une lecture optimisée
          let response = await fetch(`/api/files/${file.id}/stream`);
          
          if (!response.ok) {
            console.warn('❌ FileViewer: Échec avec ID, tentative avec le chemin:', response.status);
            // Si ça échoue, essayer avec le chemin du fichier
            if (file.path) {
              const encodedPath = encodeURIComponent(file.path);
              response = await fetch(`/api/files/stream-by-path/${encodedPath}`);
            }
          }
          
          console.log('📡 FileViewer: Réponse du serveur:', response.status, response.statusText);
          
          if (response.ok) {
            const blob = await response.blob();
            console.log('📦 FileViewer: Blob créé, taille:', blob.size, 'type:', blob.type);
            const url = URL.createObjectURL(blob);
            setFileUrl(url);
            console.log('✅ FileViewer: URL créée pour lecture directe depuis disque:', url);
          } else {
            console.error('❌ FileViewer: Erreur lors du streaming:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('❌ FileViewer: Détails de l\'erreur:', errorText);
            setError('Impossible de charger le fichier depuis le disque');
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
      console.warn('Tentative de téléchargement sans fichier valide:', file);
      return;
    }

    console.log('🎵 FileViewer: Tentative de téléchargement pour le fichier:', {
      id: file.id,
      name: file.name,
      path: file.path
    });

    try {
      // Utiliser une URL relative pour que le proxy fonctionne
      let response = await fetch(`/api/files/${file.id}/download`);
      
      if (!response.ok) {
        console.warn('❌ FileViewer: Échec avec ID, tentative avec le chemin:', response.status);
        // Si ça échoue, essayer avec le chemin du fichier
        if (file.path) {
          const encodedPath = encodeURIComponent(file.path);
          response = await fetch(`/api/files/download-by-path/${encodedPath}`);
        }
      }

      if (response.ok) {
        console.log('✅ FileViewer: Téléchargement réussi');
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
        console.error('❌ FileViewer: Erreur lors du téléchargement:', response.status, response.statusText);
        // Afficher un message d'erreur à l'utilisateur
        alert(`Erreur lors du téléchargement: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ FileViewer: Erreur de téléchargement:', err);
      alert('Erreur lors du téléchargement. Vérifiez la console pour plus de détails.');
    }
  };

  // Obtenir l'icône du fichier
  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <PhotoIcon className="h-8 w-8" style={{ color: colors.textSecondary }} />;
      case 'video':
        return <VideoCameraIcon className="h-8 w-8" style={{ color: colors.textSecondary }} />;
      case 'audio':
        return <SpeakerWaveIcon className="h-8 w-8" style={{ color: colors.textSecondary }} />;
      case 'document':
        return <DocumentTextIcon className="h-8 w-8" style={{ color: colors.textSecondary }} />;
      case 'spreadsheet':
        return <TableCellsIcon className="h-8 w-8" style={{ color: colors.textSecondary }} />;
      case 'email':
        return <EnvelopeIcon className="h-8 w-8" style={{ color: colors.textSecondary }} />;
      case 'text':
        return <DocumentIcon className="h-8 w-8" style={{ color: colors.textSecondary }} />;
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
              <>
                {/* Élément vidéo pour les contrôles */}
                <video
                  ref={videoRef}
                  src={fileUrl}
                  onLoadedMetadata={handleVideoLoad}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                  onError={handleVideoError}
                  className="w-full max-h-96 object-contain rounded-lg"
                  controls={false}
                />
                
                <div 
                  className="rounded-lg border p-4 flex-1 mt-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }}
                >
                  <div className="text-center">
                    <h4 
                      className="text-lg font-medium mb-2"
                      style={{ color: colors.text }}
                    >
                      {file.name}
                    </h4>
                    <p 
                      className="mb-4"
                      style={{ color: colors.textSecondary }}
                    >
                      Fichier vidéo - Utilisez les contrôles en bas du panneau
                    </p>
                  </div>
                </div>
              </>
            )}

            {fileType === 'audio' && fileUrl && (
              <>
                {/* Élément audio pour les contrôles */}
                <audio
                  ref={audioRef}
                  src={fileUrl}
                  onLoadedMetadata={handleAudioLoad}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onEnded={handleAudioEnded}
                  onError={handleAudioError}
                  className="w-full"
                  controls={false}
                />
                
                <div 
                  className="rounded-lg border p-4 flex-1 mt-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }}
                >
                  <div className="text-center">
                    <div className="mb-4">
                      <SpeakerWaveIcon 
                        className="h-16 w-16 mx-auto"
                        style={{ color: colors.textSecondary }}
                      />
                    </div>
                    <h4 
                      className="text-lg font-medium mb-2"
                      style={{ color: colors.text }}
                    >
                      {file.name}
                    </h4>
                    <p 
                      className="mb-4"
                      style={{ color: colors.textSecondary }}
                    >
                      Fichier audio - Utilisez les contrôles en bas du panneau
                    </p>
                  </div>
                </div>
              </>
            )}

            {fileType === 'document' && (
              <div 
                className="rounded-lg border flex-1"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                {file.name.toLowerCase().endsWith('.pdf') && fileUrl ? (
                  // Prévisualisation PDF intégrée
                  <div className="w-full h-full">
                    <iframe
                      src={fileUrl}
                      className="w-full h-full min-h-96"
                      title={file.name}
                      style={{ border: 'none' }}
                    />
                  </div>
                ) : (
                  // Autres documents - affichage avec bouton de téléchargement
                  <div className="p-8 text-center">
                    <DocumentTextIcon 
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
                )}
              </div>
            )}

            {fileType === 'spreadsheet' && (
              <div 
                className="rounded-lg border p-8 flex-1"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <div className="text-center">
                  <TableCellsIcon 
                    className="h-16 w-16 mx-auto mb-4"
                    style={{ color: colors.textSecondary }}
                  />
                  <h4 
                    className="text-lg font-medium mb-2"
                    style={{ color: colors.text }}
                  >
                    Tableur non prévisualisable
                  </h4>
                  <p 
                    className="mb-4"
                    style={{ color: colors.textSecondary }}
                  >
                    Ce type de tableur ne peut pas être prévisualisé directement.
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

            {fileType === 'email' && (
              <div 
                className="rounded-lg border p-8 flex-1"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
                <div className="text-center">
                  <EnvelopeIcon 
                    className="h-16 w-16 mx-auto mb-4"
                    style={{ color: colors.textSecondary }}
                  />
                  <h4 
                    className="text-lg font-medium mb-2"
                    style={{ color: colors.text }}
                  >
                    Email non prévisualisable
                  </h4>
                  <p 
                    className="mb-4"
                    style={{ color: colors.textSecondary }}
                  >
                    Ce type d'email ne peut pas être prévisualisé directement.
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