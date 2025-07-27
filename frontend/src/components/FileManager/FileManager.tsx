import React, { useState, useEffect } from 'react';
import FileList from './FileList';
import FileActions from './FileActions';
import FileResultViewer from './FileResultViewer';
import { useFileStore, File } from '../../stores/fileStore';

const FileManager: React.FC = () => {
  const {
    files,
    selectedFiles,
    loading,
    error,
    loadFiles,
    retryFailedFiles,
    clearSelection,
    selectFile,
  } = useFileStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultViewer, setShowResultViewer] = useState(false);
  const [viewingFile, setViewingFile] = useState<File | null>(null);

  // Charger les fichiers au montage
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Vérifier s'il y a des fichiers en échec
  const hasFailedFiles = files.some(file => file.status === 'failed');
  const completedAnalyses = files.filter(file => file.status === 'completed' && file.analysis_result);

  // Gestion du retry des fichiers en échec
  const handleRetryFailed = async () => {
    try {
      setIsProcessing(true);
      await retryFailedFiles();
    } catch (error) {

    } finally {
      setIsProcessing(false);
    }
  };

  // Gestion de l'effacement de sélection
  const handleClearSelection = () => {
    clearSelection();
  };

  // Gestion de la sélection de fichier
  const handleFileSelect = (fileId: number | string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      selectFile(file);
    }
  };

  // Gestion de l'affichage des résultats
  const handleViewResults = (file: File) => {
    setViewingFile(file);
    setShowResultViewer(true);
  };

  // Fermeture du viewer de résultats
  const handleCloseResultViewer = () => {
    setShowResultViewer(false);
    setViewingFile(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header simplifié */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-100">
            Gestionnaire de Fichiers
          </h2>
          <div className="text-sm text-slate-400">
            {files.length} fichier{files.length > 1 ? 's' : ''} chargé{files.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 mb-4">
          <div className="flex items-center text-sm text-blue-300">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span>
              <strong>Astuce :</strong> Utilisez le panneau de gauche pour naviguer et sélectionner des fichiers à analyser
            </span>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Chargement des fichiers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-500 text-2xl mb-4">⚠️</div>
              <p className="text-red-400 mb-2">Erreur lors du chargement</p>
              <p className="text-slate-400 text-sm">{error}</p>
              <button
                onClick={() => loadFiles()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Aucun fichier chargé</h3>
              <p className="text-slate-400 mb-4">
                Cliquez sur l'icône 📁 dans le panneau de gauche pour sélectionner un répertoire
              </p>
              <div className="bg-slate-700 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center text-sm text-slate-300 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Comment procéder :</span>
                </div>
                <ol className="text-sm text-slate-400 space-y-1 ml-4">
                  <li>1. Cliquez sur l'icône 📁 "Aucun fichier chargé" dans le panneau de gauche</li>
                  <li>2. Sélectionnez le répertoire contenant vos documents</li>
                  <li>3. Pendant le scan, l'icône devient ⏳ "Scan en cours..."</li>
                  <li>4. Après le scan, les fichiers apparaissent dans l'arborescence</li>
                  <li>5. Sélectionnez les fichiers à analyser</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Actions pour les fichiers sélectionnés */}
            {selectedFiles.length > 0 && (
              <div className="bg-slate-700 border-b border-slate-600 p-3">
                <FileActions
                  selectedFiles={selectedFiles}
                  onClearSelection={handleClearSelection}
                  isProcessing={isProcessing}
                  files={files}
                />
              </div>
            )}

            {/* Actions pour les fichiers en échec */}
            {hasFailedFiles && (
              <div className="bg-red-900/20 border-b border-red-700/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-red-300">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    <span>Des fichiers sont en échec d'analyse</span>
                  </div>
                  <button
                    onClick={handleRetryFailed}
                    disabled={isProcessing}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white text-sm rounded transition-colors"
                  >
                    {isProcessing ? 'Retry en cours...' : 'Retry échecs'}
                  </button>
                </div>
              </div>
            )}

            {/* Aperçu des analyses terminées */}
            {completedAnalyses.length > 0 && (
              <div className="bg-green-900/20 border-b border-green-700/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Analyses terminées ({completedAnalyses.length})</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {completedAnalyses.slice(0, 6).map((file) => (
                    <div key={file.id} className="bg-slate-700/50 rounded p-2 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-200 truncate">{file.name}</span>
                        <button
                          onClick={() => handleViewResults(file)}
                          className="text-green-400 hover:text-green-300 transition-colors"
                          title="Voir les résultats"
                        >
                          👁️
                        </button>
                      </div>
                      {file.analysis_result && (
                        <div className="text-slate-400 truncate">
                          {file.analysis_result.substring(0, 60)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {completedAnalyses.length > 6 && (
                  <div className="text-center text-xs text-slate-400 mt-2">
                    +{completedAnalyses.length - 6} autres analyses terminées
                  </div>
                )}
              </div>
            )}

            {/* Liste des fichiers avec résultats */}
            <div className="flex-1 overflow-hidden">
              <FileList
                files={files}
                selectedFiles={selectedFiles}
                onFileSelect={handleFileSelect}
                onViewResults={handleViewResults}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer avec statistiques */}
      <div className="bg-slate-800 border-t border-slate-700 p-3">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center space-x-4">
            <span>Fichiers chargés: {files.length}</span>
            <span>Sélectionnés: {selectedFiles.length}</span>
            <span>Analyses en cours: {files.filter(f => f.status === 'processing').length}</span>
            <span>Analyses terminées: {files.filter(f => f.status === 'completed').length}</span>
            <span>Échecs: {files.filter(f => f.status === 'failed').length}</span>
          </div>
          <div>
            {isProcessing && (
              <span className="text-blue-400">
                <span className="animate-pulse">●</span> Traitement en cours
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour afficher les résultats */}
      {showResultViewer && viewingFile && (
        <FileResultViewer
          selectedFile={viewingFile}
          onClose={handleCloseResultViewer}
        />
      )}
    </div>
  );
};

export default FileManager;