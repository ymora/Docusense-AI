import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactPlayer from 'react-player';
import { useColors } from '../../hooks/useColors';
import { XMarkIcon, ArrowDownTrayIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { getFileTypeByExtension, getAudioExtensionRegex, getVideoExtensionRegex } from '../../utils/mediaFormats';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});

  // Détection du type de média avec fallback sur l'extension
  // Utiliser la configuration centralisée pour une détection plus fiable
  const fileType = getFileTypeByExtension(file.name || '');
  const isVideo = fileType === 'video' || file.mime_type?.startsWith('video/');
  const isAudio = fileType === 'audio' || file.mime_type?.startsWith('audio/');
  
  // Forcer la détection audio si le MIME type est incorrect mais l'extension est audio
  const forceAudio = file.mime_type === 'application/octet-stream' && getAudioExtensionRegex().test(file.name || '');
  
  // Forcer la détection vidéo si le MIME type est incorrect mais l'extension est vidéo
  const forceVideo = file.mime_type === 'application/octet-stream' && getVideoExtensionRegex().test(file.name || '');
  
  const finalIsAudio = isAudio || forceAudio;
  const finalIsVideo = isVideo || forceVideo;
  
  // DEBUG: Afficher la détection
  console.log('🔍 DÉTECTION VIDÉO:', {
    fileName: file.name,
    mimeType: file.mime_type,
    fileType: fileType,
    isVideo: isVideo,
    forceVideo: forceVideo,
    finalIsVideo: finalIsVideo,
    needsHls: finalIsVideo
  });
  
  // Détecter les formats (maintenant tous convertis en HLS)
  const isUnsupportedVideo = file.name?.match(/\.(avi|mkv|wmv|flv|asf|rm|rmvb|divx|xvid|h264|h265|vp8|vp9|mpeg|mpg|mpe|m1v|m2v|mpv|mp2|m2p|ps|evo|ogm|ogx|mxf|nut)$/i);
  const isSupportedVideo = file.name?.match(/\.(mp4|webm|ogg|mov|m4v|3gp|ogv|ts|mts|m2ts|hls|m3u8)$/i);
  
  // Debug de la détection (seulement au changement de fichier)
  useEffect(() => {
    const debugData = {
      fileName: file.name,
      mimeType: file.mime_type,
      filePath: file.path,
      isVideo: !!isVideo,
      isAudio: !!isAudio,
      forceVideo: !!forceVideo,
      forceAudio: !!forceAudio,
      finalIsVideo: !!finalIsVideo,
      finalIsAudio: !!finalIsAudio,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 DEBUG DÉTECTION TYPE:', debugData);
    setDebugInfo(debugData);
  }, [file.name, file.mime_type, file.path, isVideo, isAudio, forceVideo, forceAudio, finalIsVideo, finalIsAudio]);

  // URL pour le streaming intelligent (HLS seulement pour les vidéos non supportées)
  const mediaUrl = useMemo(() => {
    // Utiliser l'URL complète du backend pour éviter les problèmes CORS
    const baseUrl = 'http://localhost:8000';
    
    // HLS seulement pour les vidéos non supportées nativement
    const needsHls = finalIsVideo && isUnsupportedVideo; // HLS seulement pour vidéos non supportées
    const url = `${baseUrl}/api/files/stream-by-path/${encodeURIComponent(file.path)}?native=true${needsHls ? '&hls=true' : ''}&t=${Date.now()}`;
    
    console.log('🎵 MediaPlayer - URL générée:', url);
    console.log('🎵 MediaPlayer - URL intelligente:', {
      name: file.name,
      mime_type: file.mime_type,
      isVideo: finalIsVideo,
      isAudio: finalIsAudio,
      needsHls: needsHls,
      isUnsupportedVideo: !!isUnsupportedVideo,
      url: url
    });
    return url;
  }, [file.path, file.name, file.mime_type, finalIsVideo, finalIsAudio, isUnsupportedVideo]);

  // URL pour le téléchargement
  const getDownloadUrl = (): string => {
    // Utiliser l'endpoint de téléchargement standard pour être cohérent avec le menu contextuel
    const baseUrl = 'http://localhost:8000';
    return `${baseUrl}/api/files/download-by-path/${encodeURIComponent(file.path)}`;
  };

  // Test de connectivité ultra-détaillé
  const testConnectivity = async () => {
    const results: any = {};
    
    try {
      console.log('🧪 DÉBUT DES TESTS DE CONNECTIVITÉ...');
      
      // Test 1: Backend accessible
      console.log('🧪 Test 1: Backend accessible...');
      const backendTest = await fetch('http://localhost:8000/api/health', { 
        method: 'GET',
        mode: 'cors'
      });
      results.backendHealth = {
        status: backendTest.status,
        ok: backendTest.ok,
        statusText: backendTest.statusText
      };
      console.log('✅ Backend health:', results.backendHealth);
      
      // Test 2: Test de l'URL de streaming
      console.log('🧪 Test 2: URL de streaming...');
      const streamTest = await fetch(mediaUrl, { 
        method: 'HEAD',
        mode: 'cors'
      });
      results.streamUrl = {
        status: streamTest.status,
        ok: streamTest.ok,
        statusText: streamTest.statusText,
        contentType: streamTest.headers.get('content-type'),
        contentLength: streamTest.headers.get('content-length'),
        acceptRanges: streamTest.headers.get('accept-ranges'),
        url: mediaUrl
      };
      console.log('✅ Stream URL test:', results.streamUrl);
      
      // Test 3: Test avec GET (pas HEAD)
      console.log('🧪 Test 3: Test GET...');
      const getTest = await fetch(mediaUrl, { 
        method: 'GET',
        mode: 'cors'
      });
      results.getTest = {
        status: getTest.status,
        ok: getTest.ok,
        statusText: getTest.statusText,
        contentType: getTest.headers.get('content-type'),
        contentLength: getTest.headers.get('content-length')
      };
      console.log('✅ GET test:', results.getTest);
      
      // Test 4: Test sans HLS
      console.log('🧪 Test 4: Test sans HLS...');
      const noHlsUrl = `http://localhost:8000/api/files/stream-by-path/${encodeURIComponent(file.path)}?native=true&t=${Date.now()}`;
      const noHlsTest = await fetch(noHlsUrl, { 
        method: 'HEAD',
        mode: 'cors'
      });
      results.noHlsTest = {
        status: noHlsTest.status,
        ok: noHlsTest.ok,
        statusText: noHlsTest.statusText,
        contentType: noHlsTest.headers.get('content-type'),
        url: noHlsUrl
      };
      console.log('✅ No HLS test:', results.noHlsTest);
      
      // Test 5: Test direct du contenu HLS
      if (results.streamUrl.ok && results.streamUrl.contentType === 'application/vnd.apple.mpegurl') {
        console.log('🧪 Test 5: Contenu HLS...');
        try {
          const hlsContent = await fetch(mediaUrl, { 
            method: 'GET',
            mode: 'cors'
          });
          const hlsText = await hlsContent.text();
          console.log('📄 Contenu HLS (premiers 500 chars):', hlsText.substring(0, 500));
          results.hlsContent = {
            length: hlsText.length,
            preview: hlsText.substring(0, 200),
            hasSegments: hlsText.includes('.ts') || hlsText.includes('.m3u8')
          };
        } catch (error) {
          console.error('❌ Erreur lecture contenu HLS:', error);
          results.hlsContent = { error: error.message };
        }
      }
      
    } catch (error: any) {
      console.error('❌ Erreur lors des tests:', error);
      results.error = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
    }
    
    setTestResults(results);
    console.log('📊 RÉSULTATS COMPLETS DES TESTS:', results);
    return results;
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
    setIsPlaying(false);
    setPlayerKey(prev => prev + 1);
    testConnectivity(); // Relancer les tests
  };

  // Reset du lecteur quand le fichier change
  useEffect(() => {
    console.log('🎬 MediaPlayer - Nouveau fichier détecté:', file.name);
    
    // Reset de tous les états
    setIsReady(false);
    setHasError(false);
    setIsLoading(true);
    setIsPlaying(false);
    
    // Forcer le changement de playerKey pour recharger le lecteur
    setPlayerKey(prev => prev + 1);
    
    console.log('🎬 MediaPlayer - État reset:', {
      isVideo: finalIsVideo,
      isAudio: finalIsAudio,
      playerKey: playerKey + 1
    });
    
    // Lancer les tests de connectivité
    testConnectivity();
  }, [file.path, file.name]);

  // Synchronisation automatique avec ReactPlayer
  // Les événements onPlay/onPause sont déjà gérés dans les éléments <video> et <audio>

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.surface }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{finalIsVideo ? '🎬' : '🎵'}</span>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
              {file.name}
            </h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {finalIsVideo ? 'Fichier vidéo' : finalIsAudio ? 'Fichier audio' : 'Fichier média'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Bouton PiP seulement pour les vidéos */}
          {finalIsVideo && document.pictureInPictureEnabled && (
            <button
              onClick={handlePictureInPicture}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              style={{ color: colors.textSecondary }}
              title="Picture-in-Picture"
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
          )}
          {/* Bouton test sans HLS */}
          {finalIsVideo && (
            <button
              onClick={() => {
                const noHlsUrl = `http://localhost:8000/api/files/stream-by-path/${encodeURIComponent(file.path)}?native=true&t=${Date.now()}`;
                console.log('🧪 Test sans HLS:', noHlsUrl);
                setPlayerKey(prev => prev + 1);
                // Temporairement changer l'URL pour tester
                const testUrl = noHlsUrl;
                console.log('🧪 Test URL sans HLS:', testUrl);
              }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              style={{ color: colors.textSecondary }}
              title="Test sans HLS"
            >
              🧪
            </button>
          )}
          {/* Bouton ouvrir URL HLS dans nouvel onglet */}
          {finalIsVideo && (
            <button
              onClick={() => {
                window.open(mediaUrl, '_blank');
                console.log('🔗 URL HLS ouverte dans nouvel onglet:', mediaUrl);
              }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              style={{ color: colors.textSecondary }}
              title="Ouvrir URL HLS"
            >
              🔗
            </button>
          )}
          {/* Bouton debug contenu HLS */}
          {finalIsVideo && (
            <button
              onClick={async () => {
                try {
                  console.log('🔍 DEBUG: Test du contenu HLS...');
                  const response = await fetch(mediaUrl, { mode: 'cors' });
                  const content = await response.text();
                  console.log('📄 CONTENU HLS COMPLET:', content);
                  console.log('📊 LONGUEUR:', content.length);
                  console.log('🔍 CONTIENT .ts:', content.includes('.ts'));
                  console.log('🔍 CONTIENT .m3u8:', content.includes('.m3u8'));
                  console.log('🔍 CONTIENT #EXTM3U:', content.includes('#EXTM3U'));
                } catch (error) {
                  console.error('❌ Erreur lecture HLS:', error);
                }
              }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              style={{ color: colors.textSecondary }}
              title="Debug HLS"
            >
              🔍
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

      {/* Debug Panel */}
      <div className="p-4 border-b" style={{ borderColor: colors.border, backgroundColor: colors.surfaceSecondary }}>
        <div className="text-sm">
          <h3 className="font-semibold mb-2" style={{ color: colors.text }}>🔍 DEBUG INFO</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p><strong>File:</strong> {debugInfo.fileName}</p>
              <p><strong>MIME:</strong> {debugInfo.mimeType}</p>
              <p><strong>Is Video:</strong> {debugInfo.finalIsVideo ? '✅' : '❌'}</p>
              <p><strong>Is Audio:</strong> {debugInfo.finalIsAudio ? '✅' : '❌'}</p>
            </div>
            <div>
              <p><strong>Ready:</strong> {isReady ? '✅' : '❌'}</p>
              <p><strong>Loading:</strong> {isLoading ? '✅' : '❌'}</p>
              <p><strong>Error:</strong> {hasError ? '✅' : '❌'}</p>
              <p><strong>Playing:</strong> {isPlaying ? '✅' : '❌'}</p>
            </div>
          </div>
          
          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="mt-3">
              <h4 className="font-semibold mb-1" style={{ color: colors.text }}>🧪 TESTS DE CONNECTIVITÉ</h4>
              <div className="text-xs space-y-1">
                {testResults.backendHealth && (
                  <p><strong>Backend:</strong> {testResults.backendHealth.ok ? '✅' : '❌'} {testResults.backendHealth.status}</p>
                )}
                {testResults.streamUrl && (
                  <p><strong>Stream URL:</strong> {testResults.streamUrl.ok ? '✅' : '❌'} {testResults.streamUrl.status} - {testResults.streamUrl.contentType}</p>
                )}
                {testResults.getTest && (
                  <p><strong>GET Test:</strong> {testResults.getTest.ok ? '✅' : '❌'} {testResults.getTest.status}</p>
                )}
                {testResults.error && (
                  <p className="text-red-400"><strong>Error:</strong> {testResults.error.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center p-4">
        {(finalIsVideo || finalIsAudio) ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {/* Indicateur de chargement */}
            {isLoading && !hasError && (
              <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span className="text-sm text-slate-300">Chargement du lecteur ReactPlayer...</span>
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
                    <p>Le format n'est pas supporté par le navigateur.</p>
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
              {finalIsVideo || finalIsAudio ? (
                // Utiliser ReactPlayer pour une meilleure compatibilité HLS
                <ReactPlayer
                  key={playerKey}
                  url={mediaUrl}
                  controls={true}
                  width="100%"
                  height={finalIsVideo ? "100%" : "100px"}
                  style={{
                    backgroundColor: finalIsVideo ? '#000' : 'transparent'
                  }}
                  config={{
                    file: {
                      attributes: {
                        crossOrigin: "anonymous"
                      },
                      forceHLS: finalIsVideo && isUnsupportedVideo, // HLS seulement pour vidéos non supportées
                      hlsOptions: {
                        enableWorker: true,
                        debug: true,
                        xhrSetup: function(xhr: any, url: string) {
                          console.log('🔗 HLS XHR Request:', url);
                        }
                      }
                    }
                  }}
                  onLoadStart={() => {
                    console.log('🎬 ReactPlayer - Chargement démarré');
                    setIsLoading(true);
                  }}
                  onLoad={() => {
                    console.log('✅ ReactPlayer - Prêt pour lecture');
                    setIsReady(true);
                    setHasError(false);
                    setIsLoading(false);
                  }}
                  onPlay={() => {
                    console.log('▶️ ReactPlayer - Lecture démarrée');
                    setIsPlaying(true);
                  }}
                  onPause={() => {
                    console.log('⏸️ ReactPlayer - Lecture en pause');
                    setIsPlaying(false);
                  }}
                  onError={(error) => {
                    console.error('❌ Erreur ReactPlayer:', error);
                    console.error('❌ Détails erreur:', {
                      fileName: file.name,
                      mimeType: file.mime_type,
                      url: mediaUrl,
                      error: error
                    });
                    setHasError(true);
                    setIsReady(false);
                    setIsLoading(false);
                    if (onError) {
                      onError(`Erreur de lecture: ${file.name}`);
                    }
                  }}
                />
              ) : (
                <div className="text-center text-red-400">
                  Format non supporté
                </div>
              )}
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