import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  XMarkIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { useFileStore } from '../../stores/fileStore';
import { useQueueStore } from '../../stores/queueStore';
import { useColors } from '../../hooks/useColors';
import FileDetailsPanel from '../FileManager/FileDetailsPanel';
import FileViewer from '../FileManager/FileViewer';
import FileResultViewer from '../FileManager/FileResultViewer';
import { ConfigContent } from '../Config/ConfigWindow';
import { QueueContent } from '../Queue/QueuePanel';

interface MainPanelProps {
  children: React.ReactNode;
  activePanel: 'main' | 'config' | 'queue' | 'analyses';
  setActivePanel: (panel: 'main' | 'config' | 'queue' | 'analyses') => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ activePanel, setActivePanel }) => {
  const { selectedFile, files, markFileAsViewed, getAnalysisStats, selectFile } = useFileStore();
  const { colors } = useColors();
  const [viewMode, setViewMode] = useState<'details' | 'file' | 'results'>('details');
  
  // États pour les contrôles multimédia (audio et vidéo)
  const [mediaControls, setMediaControls] = useState<{
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
  } | null>(null);

  // Fonction pour gérer les contrôles multimédia depuis FileViewer
  const handleMediaControls = (controls: any) => {
    console.log('🎵 MainPanel: Réception des contrôles multimédia:', controls);
    setMediaControls(controls);
  };

  // Réinitialiser les contrôles multimédia quand on change de fichier
  useEffect(() => {
    setMediaControls(null);
  }, [selectedFile?.id]);

  // Afficher automatiquement le panneau de détails quand un fichier est sélectionné
  React.useEffect(() => {
    if (selectedFile) {
      setViewMode('details'); // Changed from setShowDetailsPanel to setViewMode
    }
  }, [selectedFile]);

  // Obtenir les analyses terminées avec les nouvelles statistiques
  const analysisStats = getAnalysisStats();
  const completedAnalyses = files.filter(file =>
    file.status === 'completed' && file.analysis_result,
  );

  // Écouter les événements de visualisation depuis le FileTree
  useEffect(() => {
    const handleViewFileEvent = (event: CustomEvent) => {
      const { file } = event.detail;
      if (file) {
        selectFile(file);
        setViewMode('file'); // Changement direct vers le mode visualisation
      }
    };

    window.addEventListener('viewFileInMainPanel', handleViewFileEvent as EventListener);

    return () => {
      window.removeEventListener('viewFileInMainPanel', handleViewFileEvent as EventListener);
    };
  }, [selectFile]);

  // Navigation entre fichiers
  const navigateToFile = (direction: 'prev' | 'next') => {
    if (!selectedFile || !files.length) return;
    
    const currentIndex = files.findIndex(file => file.id === selectedFile.id);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
    } else {
      newIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
    }
    
    selectFile(files[newIndex]);
  };

  // Navigation par flèches dans le viewer
  const navigateInViewer = (direction: 'prev' | 'next') => {
    if (!selectedFile || !files.length) return;
    
    const currentIndex = files.findIndex(file => file.id === selectedFile.id);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
    } else {
      newIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
    }
    
    const newFile = files[newIndex];
    selectFile(newFile);
  };

  // Gestion des touches clavier
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'file') { // Changed from showFileViewer to viewMode
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateInViewer('prev');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigateInViewer('next');
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setViewMode('details'); // Changed from handleCloseFileViewer to setViewMode
        }
      } else if (activePanel === 'main' && selectedFile) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateToFile('prev');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigateToFile('next');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, activePanel, selectedFile, files]); // Changed from showFileViewer to viewMode

  // Fermeture du viewer de résultats
  const handleCloseResultViewer = () => {
    setViewMode('details');
  };

  // Fermeture du viewer de fichier
  const handleCloseFileViewer = () => {
    setViewMode('details');
  };

  // Gestion de l'affichage des résultats d'analyse
  const handleViewResults = (file: any) => {
    if (!file || !file.id) {
      console.warn('Tentative de visualisation des résultats sans fichier sélectionné');
      return;
    }
    selectFile(file);
    setViewMode('results');
    // Marquer le fichier comme consulté
    markFileAsViewed(file.id);
  };

  // Gestion de l'affichage des fichiers originaux
  const handleViewFile = (file: any) => {
    if (!file || !file.id) {
      console.warn('Tentative de visualisation de fichier sans fichier sélectionné');
      return;
    }
    selectFile(file);
    setViewMode('file');
  };

  // Fermer le panneau actuel
  const closePanel = () => {
    setActivePanel('main');
  };

  return (
    <div
      className="flex-1 overflow-hidden main-panel flex flex-col"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      <div className="flex-1 flex overflow-hidden">
        {/* Contenu principal */}
        <div className="w-full overflow-hidden relative">
          {activePanel === 'main' && (
            <>
              {/* Titre du panneau principal */}
              <div className="bg-slate-800 border-b border-slate-600 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold text-slate-200">
                      {selectedFile ? `Fichier : ${selectedFile.name}` : 'Aperçu des fichiers'}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (selectedFile && selectedFile.id) {
                            setViewMode('details');
                          }
                        }}
                        disabled={!selectedFile || !selectedFile.id}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          !selectedFile || !selectedFile.id
                            ? 'bg-slate-600 text-slate-500 cursor-not-allowed'
                            : viewMode === 'details'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                        title={!selectedFile || !selectedFile.id ? 'Sélectionnez un fichier d\'abord' : 'Voir les détails'}
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => {
                          if (selectedFile && selectedFile.id) {
                            handleViewFile(selectedFile);
                          }
                        }}
                        disabled={!selectedFile || !selectedFile.id}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          !selectedFile || !selectedFile.id
                            ? 'bg-slate-600 text-slate-500 cursor-not-allowed'
                            : viewMode === 'file'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                        title={!selectedFile || !selectedFile.id ? 'Sélectionnez un fichier d\'abord' : 'Visualiser le fichier'}
                      >
                        Visualiser
                      </button>
                      <button
                        onClick={() => {
                          if (selectedFile && selectedFile.id && selectedFile.analysis_result) {
                            handleViewResults(selectedFile);
                          }
                        }}
                        disabled={!selectedFile || !selectedFile.id || !selectedFile.analysis_result}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          !selectedFile || !selectedFile.id || !selectedFile.analysis_result
                            ? 'bg-slate-600 text-slate-500 cursor-not-allowed'
                            : viewMode === 'results'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                        title={
                          !selectedFile || !selectedFile.id 
                            ? 'Sélectionnez un fichier d\'abord' 
                            : !selectedFile.analysis_result 
                            ? 'Aucun résultat d\'analyse disponible' 
                            : 'Voir l\'analyse IA'
                        }
                      >
                        Analyse IA
                      </button>
                    </div>
                  </div>
                  {selectedFile && selectedFile.id && files.length > 1 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-400">
                        {files.findIndex(f => f.id === selectedFile.id) + 1} / {files.length}
                      </span>
                      <button
                        onClick={() => navigateToFile('prev')}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Fichier précédent (←)"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => navigateToFile('next')}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Fichier suivant (→)"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!selectedFile ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                  <span className="text-6xl mb-6">📄</span>
                  <p className="text-lg max-w-md leading-relaxed mb-4">
                    Sélectionnez un fichier dans l'arborescence pour voir ses détails ou résultats d'analyse.
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    <span>Les boutons d'action seront activés une fois un fichier sélectionné</span>
                  </div>
                </div>
              ) : !selectedFile.id ? (
                // Message informatif pour les fichiers sans ID
                <div className="h-full bg-slate-900 p-6 overflow-y-auto">
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-4">
                          <span className="text-yellow-400 text-xl">⏳</span>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-slate-200">Fichier non analysé</h2>
                          <p className="text-slate-400">Ce fichier n'a pas encore été traité par le système</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-750 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-slate-300 mb-2">Informations du fichier</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Nom :</span>
                              <span className="text-slate-200 font-medium">{selectedFile.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Type :</span>
                              <span className="text-slate-200">{selectedFile.mime_type || 'Inconnu'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Taille :</span>
                              <span className="text-slate-200">
                                {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Inconnue'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Statut d'analyse IA :</span>
                              <span className="text-yellow-400 font-medium">Non analysé par l'IA</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-750 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-slate-300 mb-2">Chemin complet</h3>
                          <div className="text-sm text-slate-400 break-all">
                            {selectedFile.path}
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="text-blue-400 mr-3 mt-0.5">💡</div>
                          <div>
                            <h4 className="text-sm font-medium text-blue-300 mb-1">Pour analyser ce fichier :</h4>
                            <ul className="text-sm text-slate-300 space-y-1">
                              <li>• Utilisez le menu contextuel (clic droit) sur le fichier</li>
                              <li>• Sélectionnez "Analyser avec IA" → le type d'analyse souhaité</li>
                              <li>• Le fichier sera ajouté à la file d'attente d'analyse</li>
                              <li>• Une fois terminé, vous pourrez voir les résultats ici</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : viewMode === 'file' ? (
                // Mode visualisation du fichier
                <div className="h-full bg-slate-900 overflow-hidden">
                  <FileViewer
                    file={selectedFile}
                    onClose={handleCloseFileViewer}
                    currentIndex={files.findIndex(f => f.id === selectedFile.id)}
                    totalFiles={files.length}
                    onMediaControls={handleMediaControls}
                  />
                </div>
              ) : viewMode === 'results' ? (
                // Mode résultats d'analyse
                <div className="h-full bg-slate-900 overflow-hidden">
                  <FileResultViewer
                    selectedFile={selectedFile}
                    onClose={handleCloseResultViewer}
                  />
                </div>
              ) : (
                // Mode détails par défaut
                <FileDetailsPanel 
                  selectedFile={selectedFile} 
                  onClose={() => {}} 
                  onViewFile={handleViewFile} 
                />
              )}

              
            </>
          )}

          {activePanel === 'config' && (
            <ConfigContent onClose={closePanel} />
          )}

          {activePanel === 'queue' && (
            <QueueContent onClose={closePanel} />
          )}

          {activePanel === 'analyses' && (
            <div className="h-full bg-slate-900 p-6 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-200 mb-2">Analyses IA</h2>
                    <p className="text-slate-400">
                      {completedAnalyses.length} analyse{completedAnalyses.length !== 1 ? 's' : ''} effectuée{completedAnalyses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={closePanel}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                        <ChartBarIcon className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Analyses réussies</p>
                        <p className="text-xl font-semibold text-slate-200">{analysisStats.completed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center mr-3">
                        <ChartBarIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Analyses échouées</p>
                        <p className="text-xl font-semibold text-slate-200">{analysisStats.total - analysisStats.completed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                        <ChartBarIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Temps moyen</p>
                        <p className="text-xl font-semibold text-slate-200">-</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                        <ChartBarIcon className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Taux de réussite</p>
                        <p className="text-xl font-semibold text-slate-200">{analysisStats.total > 0 ? Math.round((analysisStats.completed / analysisStats.total) * 100) : 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des analyses */}
                <div className="space-y-4">
                  {completedAnalyses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-slate-500 text-6xl mb-4">📊</div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">Aucune analyse effectuée</h3>
                      <p className="text-slate-400">
                        Les analyses IA apparaîtront ici une fois qu'elles seront complétées.
                      </p>
                    </div>
                  ) : (
                    completedAnalyses.map((file) => (
                      <div
                        key={file.id}
                        className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:bg-slate-750 transition-colors cursor-pointer"
                        onClick={() => handleViewResults(file)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-green-400 text-xl">✅</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-slate-200">{file.name}</h3>
                              <p className="text-sm text-slate-400">
                                Analysé le {new Date(file.updated_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-green-400 bg-green-500/10 px-2 py-1 rounded">
                              Analysé par IA
                            </span>
                            <EyeIcon className="h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contrôles multimédia en bas du panneau - pour les fichiers audio et vidéo */}
      {mediaControls && selectedFile && (() => {
        const fileType = selectedFile.name?.split('.').pop()?.toLowerCase();
        const isAudioFile = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'aiff', 'alac'].includes(fileType || '');
        const isVideoFile = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv', 'ts', 'mts', 'm2ts'].includes(fileType || '');
        return isAudioFile || isVideoFile;
      })() && (
        <div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50"
          style={{
            backgroundColor: colors.surface + 'F0',
            borderColor: colors.border,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex items-center space-x-3 p-3 rounded-xl border shadow-lg">
            {/* Nom du fichier */}
            <div className="min-w-0">
              <h4 
                className="text-xs font-medium truncate max-w-32"
                style={{ color: colors.text }}
                title={selectedFile?.name}
              >
                {selectedFile?.name}
              </h4>
            </div>

            {/* Contrôles de lecture */}
            <div className="flex items-center space-x-1">
              <button
                onClick={mediaControls.onPlay}
                disabled={mediaControls.isPlaying}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: mediaControls.isPlaying ? colors.border : colors.config + '20',
                  color: mediaControls.isPlaying ? colors.textSecondary : colors.config
                }}
                title="Lecture"
              >
                <PlayIcon className="h-4 w-4" />
              </button>

              <button
                onClick={mediaControls.onPause}
                disabled={!mediaControls.isPlaying}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: !mediaControls.isPlaying ? colors.border : colors.config + '20',
                  color: !mediaControls.isPlaying ? colors.textSecondary : colors.config
                }}
                title="Pause"
              >
                <PauseIcon className="h-4 w-4" />
              </button>

              <button
                onClick={mediaControls.onStop}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.config + '20',
                  color: colors.config
                }}
                title="Stop"
              >
                <StopIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Temps */}
            <div className="text-xs" style={{ color: colors.textSecondary }}>
              {Math.floor(mediaControls.currentTime / 60)}:{(mediaControls.currentTime % 60).toFixed(0).padStart(2, '0')} / {Math.floor(mediaControls.duration / 60)}:{(mediaControls.duration % 60).toFixed(0).padStart(2, '0')}
            </div>

            {/* Barre de progression */}
            <div className="w-24">
              <input
                type="range"
                min="0"
                max={mediaControls.duration || 100}
                value={mediaControls.currentTime}
                onChange={(e) => mediaControls.onSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.config} 0%, ${colors.config} ${(mediaControls.currentTime / (mediaControls.duration || 1)) * 100}%, ${colors.border} ${(mediaControls.currentTime / (mediaControls.duration || 1)) * 100}%, ${colors.border} 100%)`
                }}
              />
            </div>

            {/* Contrôle du volume */}
            <div className="flex items-center space-x-1">
              <button
                onClick={mediaControls.onMuteToggle}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.config + '20',
                  color: colors.config
                }}
                title={mediaControls.isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {mediaControls.isMuted ? (
                  <SpeakerXMarkIcon className="h-4 w-4" />
                ) : (
                  <SpeakerWaveIcon className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={mediaControls.volume}
                onChange={(e) => mediaControls.onVolumeChange(parseFloat(e.target.value))}
                className="w-12 h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.config} 0%, ${colors.config} ${mediaControls.volume * 100}%, ${colors.border} ${mediaControls.volume * 100}%, ${colors.border} 100%)`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPanel;