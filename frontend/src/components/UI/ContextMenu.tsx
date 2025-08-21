import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  file: any;
  onClose: () => void;
  onAction: (action: string, file: any) => void;
  selectedFiles: (number | string)[];
  onPositionChange: (x: number, y: number) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  x,
  y,
  file,
  onClose,
  onAction,
  selectedFiles,
  onPositionChange
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  if (!visible || !file) return null;

  function isCompatibleType(file: any) {
    if (!file || !file.mime_type) return false;
    
    // Vérifier d'abord si le fichier a un ID (est supporté dans la base de données)
    if (!file.id) return false;
    
    // Vérifier si le statut permet l'analyse
    // 'none' = fichier non analysé mais analysable
    // 'pending' = en attente d'analyse
    // 'failed' = échec, peut être relancé
    // 'completed' = déjà analysé, peut être relancé
    const analyzableStatuses = ['none', 'pending', 'failed', 'completed'];
    if (!analyzableStatuses.includes(file.status)) {
      // File status not analyzable: ${file.status} for file: ${file.name}
      return false;
    }
    
    const supported = [
      // Documents PDF et texte
      'application/pdf',
      'text/plain',
      'text/html',
      'text/markdown',
      'text/x-python',
      'text/css',
      'application/json',
      'application/javascript',
      'application/sql',
      
      // Documents Word
      'application/msword',  // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
      'application/rtf',  // .rtf
      'application/vnd.oasis.opendocument.text',  // .odt
      
      // Tableurs Excel
      'application/vnd.ms-excel',  // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // .xlsx
      'application/vnd.oasis.opendocument.spreadsheet',  // .ods
      'text/csv',  // .csv
      
      // Présentations PowerPoint
      'application/vnd.ms-powerpoint',  // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',  // .pptx
      'application/vnd.oasis.opendocument.presentation',  // .odp
      
      // Emails
      'message/rfc822',  // .eml
      'application/vnd.ms-outlook',  // .msg
      
      // Images (pour OCR)
      'image/',
      
      // Audio et vidéo (pour plus tard)
      'audio/',
      'video/'
    ];
    
    // Vérification spéciale pour les emails
    if (file.mime_type === 'message/rfc822' || file.mime_type === 'application/vnd.ms-outlook') {
      return true;
    }
    
    // Vérification pour les formats Office
    const isOfficeFormat = supported.some(type => file.mime_type.startsWith(type));
    if (isOfficeFormat) {
      return true;
    }
    
    // Log pour déboguer les types non reconnus
    // File type not supported: ${file.mime_type} for file: ${file.name}
    return false;
  }

  // ==========================
  // ACTIONS SUR DISQUE (lecture seule)
  // ==========================
  
  // Téléchargement de fichiers individuels
  const handleDownloadFile = () => {
    onAction('download_file', file);
    onClose();
  };

  // ==========================
  // ACTIONS D'ANALYSE
  // ==========================
  
  // Ajouter à la queue d'analyse
  const handleAnalyze = () => {
    onAction('add_to_queue', file);
    onClose();
  };

  // Voir les analyses terminées
  const handleViewAnalyses = () => {
    onAction('view_analyses', file);
    onClose();
  };

  // Relancer une analyse échouée
  const handleRetryAnalysis = () => {
    onAction('retry_analysis', file);
    onClose();
  };

  // Comparer les analyses d'un fichier
  const handleCompareAnalyses = () => {
    onAction('compare_analyses', file);
    onClose();
  };

  // ==========================
  // ACTIONS SPÉCIFIQUES AUX DOSSIERS
  // ==========================
  
  // Télécharger un dossier en ZIP
  const handleDownloadDirectory = () => {
    onAction('download_directory', file);
    onClose();
  };

  // Explorer le contenu d'un dossier
  const handleExploreDirectory = () => {
    onAction('explore_directory', file);
    onClose();
  };

  // Visualiser les fichiers du dossier en miniatures
  const handleViewDirectoryThumbnails = () => {
    onAction('view_directory_thumbnails', file);
    onClose();
  };

  // Analyser tous les fichiers d'un dossier
  const handleAnalyzeDirectory = () => {
    onAction('analyze_directory', file);
    onClose();
  };

  // Analyser tous les fichiers supportés d'un dossier
  const handleAnalyzeDirectorySupported = () => {
    onAction('analyze_directory_supported', file);
    onClose();
  };

  // Voir les analyses d'un dossier
  const handleViewDirectoryAnalyses = () => {
    onAction('view_directory_analyses', file);
    onClose();
  };

  // ==========================
  // ACTIONS POUR SÉLECTION MULTIPLE
  // ==========================
  
  // Télécharger plusieurs fichiers en ZIP
  const handleDownloadMultiple = () => {
    onAction('download_multiple', file);
    onClose();
  };

  // Analyser plusieurs fichiers
  const handleAnalyzeMultiple = () => {
    onAction('analyze_multiple', file);
    onClose();
  };

  // Comparer plusieurs analyses
  const handleCompareMultiple = () => {
    onAction('compare_multiple', file);
    onClose();
  };

  const isDirectory = file.type === 'directory' || file.is_directory;
  const isMultipleSelection = selectedFiles.length > 1;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-slate-700 border border-slate-600 rounded shadow-lg py-1 min-w-56"
      style={{
        left: x,
        top: y,
      }}
    >
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-slate-600 bg-slate-800">
        <div className="text-sm font-medium text-slate-200 truncate">{file.name}</div>
        <div className="text-xs text-slate-400 truncate">{file.path}</div>
      </div>

      {/* Actions sur disque (lecture seule) */}
      <div className="py-1">
        <div className="px-3 py-1 text-xs text-slate-400 bg-slate-800 font-medium">
          📁 Actions sur disque
        </div>
        
        {/* Télécharger le fichier */}
        {!isDirectory && (
          <button
            onClick={handleDownloadFile}
            className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
            title="Télécharger le fichier"
          >
            <span className="mr-2">💾</span>
            Télécharger le fichier
          </button>
        )}

        {/* Actions spécifiques aux dossiers */}
        {isDirectory && (
          <>
            <button
              onClick={handleDownloadDirectory}
              className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
              title="Télécharger le dossier en ZIP"
            >
              <span className="mr-2">📦</span>
              Télécharger le dossier
            </button>

            <button
              onClick={handleExploreDirectory}
              className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
              title="Explorer le contenu du dossier"
            >
              <span className="mr-2">🔍</span>
              Explorer le contenu
            </button>

            <button
              onClick={handleViewDirectoryThumbnails}
              className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
              title="Visualiser tous les fichiers du dossier en miniatures"
            >
              <span className="mr-2">🖼️</span>
              Voir en miniatures
            </button>
          </>
        )}
      </div>

      {/* Actions d'analyse */}
      <div className="py-1 border-t border-slate-600">
        <div className="px-3 py-1 text-xs text-slate-400 bg-slate-800 font-medium">
          🤖 Actions d'analyse
        </div>

        {/* Voir les analyses terminées */}
        <button
          onClick={handleViewAnalyses}
          className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
          title="Voir les analyses terminées pour ce fichier"
        >
          <span className="mr-2">📊</span>
          Voir les analyses
          {file.analysis_count > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {file.analysis_count}
            </span>
          )}
        </button>

        {/* Analyser IA */}
        <button
          onClick={handleAnalyze}
          className={`w-full px-3 py-1.5 text-left text-xs flex items-center ${
            isCompatibleType(file) ? 'hover:bg-slate-600' : 'opacity-50 cursor-not-allowed'
          }`}
          title={
            isCompatibleType(file) 
              ? 'Analyser le fichier' 
              : !file.id 
                ? 'Fichier non supporté pour l\'analyse' 
                : 'Type de fichier non pris en charge'
          }
          disabled={!isCompatibleType(file)}
        >
          <span className="mr-2">🤖</span>
          Analyser IA
        </button>

        {/* Relancer l'analyse (si déjà analysé) */}
        {file.status === 'completed' && (
          <button
            onClick={handleRetryAnalysis}
            className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
            title="Relancer l'analyse avec un nouveau prompt"
          >
            <span className="mr-2">🔄</span>
            Relancer l'analyse
          </button>
        )}

        {/* Comparer les analyses */}
        {file.analysis_count > 1 && (
          <button
            onClick={handleCompareAnalyses}
            className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
            title="Comparer les différentes analyses"
          >
            <span className="mr-2">⚖️</span>
            Comparer les analyses
          </button>
        )}

        {/* Actions spécifiques aux dossiers pour l'analyse */}
        {isDirectory && (
          <>
            <button
              onClick={handleAnalyzeDirectory}
              className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
              title="Analyser tous les fichiers du dossier"
            >
              <span className="mr-2">📁🤖</span>
              Analyser le dossier
            </button>

            <button
              onClick={handleAnalyzeDirectorySupported}
              className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
              title="Analyser uniquement les fichiers supportés par l'IA"
            >
              <span className="mr-2">📁✅</span>
              Analyser fichiers supportés
            </button>

            <button
              onClick={handleViewDirectoryAnalyses}
              className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
              title="Voir les analyses du dossier"
            >
              <span className="mr-2">📁📊</span>
              Voir les analyses du dossier
            </button>
          </>
        )}
      </div>

      {/* Actions pour sélection multiple */}
      {isMultipleSelection && (
        <div className="py-1 border-t border-slate-600">
          <div className="px-3 py-1 text-xs text-slate-400 bg-slate-800 font-medium">
            📋 Actions multiples ({selectedFiles.length} sélectionnés)
          </div>
          
          {/* Télécharger plusieurs fichiers en ZIP */}
          <button
            onClick={handleDownloadMultiple}
            className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
            title="Télécharger tous les fichiers sélectionnés en ZIP"
          >
            <span className="mr-2">📦</span>
            Télécharger les fichiers en ZIP
          </button>

          {/* Analyser multiple */}
          <button
            onClick={handleAnalyzeMultiple}
            className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
            title="Analyser tous les fichiers sélectionnés"
          >
            <span className="mr-2">🤖📋</span>
            Analyser les fichiers
          </button>

          {/* Comparer multiple */}
          <button
            onClick={handleCompareMultiple}
            className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
            title="Comparer les analyses des fichiers sélectionnés"
          >
            <span className="mr-2">⚖️📋</span>
            Comparer les analyses
          </button>
        </div>
      )}
    </div>
  );
};

export default ContextMenu; 