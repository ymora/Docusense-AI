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
      console.log('File status not analyzable:', file.status, 'for file:', file.name);
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
    console.log('File type not supported:', file.mime_type, 'for file:', file.name);
    return false;
  }

  const handleDownload = () => {
    // Téléchargement demandé pour le fichier
    onAction('download', file);
    onClose();
  };

  const handleAnalyze = () => {
    // Analyse demandée pour le fichier
    onAction('add_to_queue', file);
    onClose();
  };



  // Menu principal simplifié - UN SEUL bouton d'analyse
  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-slate-700 border border-slate-600 rounded shadow-lg py-1 min-w-48"
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

      {/* Actions simplifiées */}
      <div className="py-1">
        {/* Télécharger */}
        <button
          onClick={handleDownload}
          className="w-full px-3 py-1.5 text-left text-xs flex items-center hover:bg-slate-600"
          title="Télécharger le fichier"
        >
          <span className="mr-2">💾</span>
          Télécharger
        </button>

        {/* Analyser IA - UN SEUL BOUTON */}
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
      </div>


    </div>
  );
};

export default ContextMenu; 