import React, { useState, useEffect } from 'react';
import FileList from './FileList';
import FileActions from './FileActions';
import { useFileStore, File } from '../../stores/fileStore';
import { useColors } from '../../hooks/useColors';

const FileManager: React.FC = () => {
  const { colors, colorMode } = useColors();
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

  return (
    <div className="h-full flex flex-col">
      {/* Header simplifié */}
      <div 
        className="border-b p-4"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-xl font-semibold"
            style={{ color: colors.text }}
          >
            Gestionnaire de Fichiers
          </h2>
          <div 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            {files.length} fichier{files.length > 1 ? 's' : ''} chargé{files.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Instructions */}
        <div 
          className="border rounded-lg p-3 mb-4"
          style={{
            backgroundColor: colorMode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            borderColor: colors.config
          }}
        >
          <div className="flex items-center text-sm" style={{ color: colors.config }}>
            <div 
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: colors.config }}
            ></div>
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
              <div 
                className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                style={{ borderColor: colors.config }}
              ></div>
              <p style={{ color: colors.textSecondary }}>Chargement des fichiers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-2xl mb-4" style={{ color: colors.error }}>⚠️</div>
              <p className="mb-2" style={{ color: colors.error }}>Erreur lors du chargement</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{error}</p>
              <button
                onClick={() => loadFiles()}
                className="mt-4 px-4 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: colors.config }}
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Aucun fichier chargé
              </h3>
              <p 
                className="mb-4"
                style={{ color: colors.textSecondary }}
              >
                Cliquez sur l'icône 📁 dans le panneau de gauche pour sélectionner un répertoire
              </p>
              <div 
                className="rounded-lg p-4 max-w-md mx-auto"
                style={{ backgroundColor: colors.surface }}
              >
                <div className="flex items-center text-sm mb-2" style={{ color: colors.text }}>
                  <div 
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: colors.config }}
                  ></div>
                  <span>Comment procéder :</span>
                </div>
                <ol className="text-sm space-y-1 ml-4" style={{ color: colors.textSecondary }}>
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
              <div 
                className="border-b p-3"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }}
              >
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
              <div 
                className="border-b p-3"
                style={{
                  backgroundColor: colorMode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                  borderColor: colors.error
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm" style={{ color: colors.error }}>
                    <div 
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: colors.error }}
                    ></div>
                    <span>Des fichiers sont en échec d'analyse</span>
                  </div>
                  <button
                    onClick={handleRetryFailed}
                    disabled={isProcessing}
                    className="px-3 py-1 text-white text-sm rounded transition-colors"
                    style={{ 
                      backgroundColor: isProcessing ? colorMode === 'dark' ? '#991b1b' : '#fecaca' : colors.error 
                    }}
                  >
                    {isProcessing ? 'Retry en cours...' : 'Retry échecs'}
                  </button>
                </div>
              </div>
            )}

            {/* Aperçu des analyses terminées */}
            {completedAnalyses.length > 0 && (
              <div 
                className="border-b p-3"
                style={{
                  backgroundColor: colorMode === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                  borderColor: colors.analyses
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm" style={{ color: colors.analyses }}>
                    <div 
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: colors.analyses }}
                    ></div>
                    <span>Analyses terminées ({completedAnalyses.length})</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {completedAnalyses.slice(0, 6).map((file) => (
                    <div 
                      key={file.id} 
                      className="rounded p-2 text-xs"
                      style={{
                        backgroundColor: colorMode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.5)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span 
                          className="truncate"
                          style={{ color: colors.text }}
                        >
                          {file.name}
                        </span>
                        <button
                          onClick={() => {}} // Placeholder - la visualisation se fait dans MainPanel
                          className="transition-colors"
                          style={{ color: colors.analyses }}
                          title="Voir les résultats"
                        >
                          👁️
                        </button>
                      </div>
                      {file.analysis_result && (
                        <div 
                          className="truncate"
                          style={{ color: colors.textSecondary }}
                        >
                          {file.analysis_result.substring(0, 60)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {completedAnalyses.length > 6 && (
                  <div 
                    className="text-center text-xs mt-2"
                    style={{ color: colors.textSecondary }}
                  >
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
                onViewResults={() => {}} // Placeholder - la visualisation se fait dans MainPanel
                onViewFile={() => {}} // Placeholder - la visualisation se fait dans MainPanel
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer avec statistiques */}
      <div 
        className="border-t p-3"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        <div className="flex items-center justify-between text-sm" style={{ color: colors.textSecondary }}>
          <div className="flex items-center space-x-4">
            <span>Fichiers chargés: {files.length}</span>
            <span>Sélectionnés: {selectedFiles.length}</span>
            <span>Analyses en cours: {files.filter(f => f.status === 'processing').length}</span>
            <span>Analyses terminées: {files.filter(f => f.status === 'completed').length}</span>
            <span>Échecs: {files.filter(f => f.status === 'failed').length}</span>
          </div>
          <div>
            {isProcessing && (
              <span style={{ color: colors.config }}>
                <span className="animate-pulse">●</span> Traitement en cours
              </span>
            )}
          </div>
        </div>
      </div>

      {/* File Result Viewer Modal */}
      {/* This block is removed as viewingFile and showResultViewer are removed */}
    </div>
  );
};

export default FileManager;