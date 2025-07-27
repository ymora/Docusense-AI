import React, { useState } from 'react';
import {
  EyeIcon,
  XMarkIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useFileStore } from '../../stores/fileStore';
import { useQueueStore } from '../../stores/queueStore';
import FileDetailsPanel from '../FileManager/FileDetailsPanel';
import { ConfigContent } from '../Config/ConfigWindow';
import { QueueContent } from '../Queue/QueuePanel';
import FileResultViewer from '../FileManager/FileResultViewer';
import FileViewer from '../FileManager/FileViewer';

interface MainPanelProps {
  children: React.ReactNode;
  activePanel: 'main' | 'config' | 'queue' | 'analyses';
  setActivePanel: (panel: 'main' | 'config' | 'queue' | 'analyses') => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ children, activePanel, setActivePanel }) => {
  const { selectedFile, files, markFileAsViewed, getAnalysisStats } = useFileStore();
  const { queueStatus } = useQueueStore();
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showResultViewer, setShowResultViewer] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewingFile, setViewingFile] = useState<any>(null);

  // Afficher automatiquement le panneau de détails quand un fichier est sélectionné
  React.useEffect(() => {
    if (selectedFile) {
      setShowDetailsPanel(true);
    }
  }, [selectedFile]);

  // Obtenir les analyses terminées avec les nouvelles statistiques
  const analysisStats = getAnalysisStats();
  const completedAnalyses = files.filter(file =>
    file.status === 'completed' && file.analysis_result,
  );

  // Fermeture du viewer de résultats
  const handleCloseResultViewer = () => {
    setShowResultViewer(false);
    setViewingFile(null);
  };

  // Fermeture du viewer de fichiers
  const handleCloseFileViewer = () => {
    setShowFileViewer(false);
    setViewingFile(null);
  };

  // Gestion de l'affichage des résultats
  const handleViewResults = (file: any) => {
    setViewingFile(file);
    setShowResultViewer(true);
    // Marquer le fichier comme consulté
    markFileAsViewed(file.id);
  };

  // Gestion de l'affichage des fichiers originaux
  const handleViewFile = (file: any) => {
    setViewingFile(file);
    setShowFileViewer(true);
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
              {!selectedFile ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                  <span className="text-6xl mb-6">📄</span>
                  <p className="text-lg max-w-md leading-relaxed">
                    Sélectionnez un fichier dans l'arborescence pour voir ses détails ou résultats d'analyse.
                  </p>
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
                              <span className="text-slate-400">Statut :</span>
                              <span className="text-yellow-400 font-medium">En attente d'analyse</span>
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
              ) : (
                <FileDetailsPanel onViewFile={handleViewFile} />
              )}
            </>
          )}
          {activePanel === 'config' && (
            <div className="h-full p-4 overflow-y-auto">
              <div className="bg-slate-800 rounded-lg border border-slate-700 h-full overflow-hidden">
                {/* Header */}
                <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-200 flex items-center space-x-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--config-color)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span style={{ color: 'var(--config-color)' }}>Configuration IA</span>
                    </h3>
                    <button
                      onClick={closePanel}
                      className="p-2 hover:bg-slate-600 rounded transition-colors"
                      title="Fermer"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {/* Contenu */}
                <div className="p-4 overflow-y-auto max-h-full">
                  <ConfigContent
                    onClose={closePanel}
                    onMinimize={closePanel}
                    isStandalone={true}
                  />
                </div>
              </div>
            </div>
          )}
          {activePanel === 'queue' && (
            <div className="h-full p-4 overflow-y-auto">
              <div className="bg-slate-800 rounded-lg border border-slate-700 h-full overflow-hidden">
                {/* Header */}
                <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-200 flex items-center space-x-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--queue-color)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span style={{ color: 'var(--queue-color)' }}>Queue d'Analyse</span>
                    </h3>
                    <button
                      onClick={closePanel}
                      className="p-2 hover:bg-slate-600 rounded transition-colors"
                      title="Fermer"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {/* Contenu */}
                <div className="p-4 overflow-y-auto max-h-full">
                  <QueueContent
                    onClose={closePanel}
                    onMinimize={closePanel}
                    isStandalone={true}
                  />
                </div>
              </div>
            </div>
          )}
          {activePanel === 'analyses' && (
            <div className="h-full p-4 overflow-y-auto">
              <div className="bg-slate-800 rounded-lg border border-slate-700 h-full overflow-hidden">
                {/* Header */}
                <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-200 flex items-center space-x-2">
                      <ChartBarIcon className="h-5 w-5" style={{ color: 'var(--analyses-color)' }} />
                      <span style={{ color: 'var(--analyses-color)' }}>Analyses Terminées</span>
                      <span className="text-sm text-slate-400">({analysisStats.completed})</span>
                      {analysisStats.unviewed > 0 && (
                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                          {analysisStats.unviewed} non consultées
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={closePanel}
                      className="p-2 hover:bg-slate-600 rounded transition-colors"
                      title="Fermer"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4 overflow-y-auto max-h-full">
                  {completedAnalyses.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Aucune analyse terminée</p>
                      <p className="text-sm">Lancez des analyses pour voir les résultats ici</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedAnalyses.map((file) => (
                        <div key={file.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${file.has_been_viewed ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
                              <h4 className="font-medium text-slate-200">{file.name}</h4>
                              {!file.has_been_viewed && (
                                <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                                  Nouveau
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleViewResults(file)}
                              className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              title="Voir les résultats"
                            >
                              <EyeIcon className="h-4 w-4" />
                              <span className="text-sm">Voir Résultats</span>
                            </button>
                          </div>

                          {file.analysis_result && (
                            <div className="text-sm text-slate-400">
                              <div className="line-clamp-3">
                                {file.analysis_result.substring(0, 200)}...
                              </div>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                            <span>Taille: {(file.size / 1024).toFixed(1)} KB</span>
                            <span>Terminé le {new Date(file.updated_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal pour afficher les résultats */}
      {showResultViewer && viewingFile && (
        <FileResultViewer
          selectedFile={viewingFile}
          onClose={handleCloseResultViewer}
        />
      )}

      {/* Modal pour afficher les fichiers originaux */}
      {showFileViewer && viewingFile && (
        <FileViewer
          file={viewingFile}
          onClose={handleCloseFileViewer}
        />
      )}

    </div>
  );
};

export default MainPanel;