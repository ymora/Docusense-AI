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
    
    const supported = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'message/rfc822',
      'text/html',
      'image/',
      'audio/',
      'video/'
    ];
    return supported.some(type => file.mime_type.startsWith(type));
  }

  const handleDownload = () => {
    console.log('🎯 ContextMenu: Téléchargement demandé pour le fichier:', {
      name: file.name,
      path: file.path,
      id: file.id,
      mime_type: file.mime_type
    });
    onAction('download', file);
    onClose();
  };

  const handleAnalyze = () => {
    onAction('analyze_ia', file);
    onClose();
  };

  // Menu principal simplifié
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

        {/* Analyser avec l'IA */}
        <button
          onClick={handleAnalyze}
          className={`w-full px-3 py-1.5 text-left text-xs flex items-center ${
            isCompatibleType(file) ? 'hover:bg-slate-600' : 'opacity-50 cursor-not-allowed'
          }`}
          title={
            isCompatibleType(file) 
              ? 'Ouvrir le panneau Analyse IA' 
              : !file.id 
                ? 'Fichier non supporté pour l\'analyse' 
                : 'Type de fichier non pris en charge'
          }
          disabled={!isCompatibleType(file)}
        >
          <span className="mr-2">🤖</span>
          Analyser avec l'IA
        </button>
      </div>
    </div>
  );
};

export default ContextMenu; 