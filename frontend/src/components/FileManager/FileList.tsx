import React from 'react';
import { File } from '../../stores/fileStore';
import {
  DocumentIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PhotoIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

interface FileListProps {
  files: File[];
  selectedFiles: (number | string)[];
  onFileSelect: (fileId: number | string) => void;
  onViewResults?: (file: File) => void;
  onViewFile?: (file: File) => void;
}

const FileList: React.FC<FileListProps> = ({ files, selectedFiles, onFileSelect, onViewResults, onViewFile }) => {
  const getStatusColor = (status: File['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'unsupported': return 'unsupported-cross';
    }
  };

  const getStatusText = (status: File['status']) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'processing': return 'En cours';
      case 'paused': return 'En pause';
      case 'completed': return 'Terminé';
      case 'failed': return 'Échec';
      case 'unsupported': return 'Format non supporté';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleKeyDown = (e: React.KeyboardEvent, fileId: number | string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFileSelect(fileId);
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-6xl mb-4">📁</div>
        <p className="text-lg font-medium mb-2">Aucun fichier trouvé</p>
        <p className="text-sm">
          Sélectionnez un répertoire pour commencer
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className={`
              flex items-center p-4 rounded-lg border transition-all duration-200 cursor-pointer
              ${selectedFiles.includes(file.id)
            ? 'bg-blue-200 border-blue-400 text-blue-900 shadow-lg transform scale-[1.02]'
            : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500 hover:shadow-md'
          }
            `}
            onClick={() => onFileSelect(file.id)}
            onDoubleClick={() => onViewFile && onViewFile(file)}
            onKeyDown={(e) => handleKeyDown(e, file.id)}
            tabIndex={0}
            role="button"
            aria-label={`Sélectionner ${file.name}`}
          >
            {/* Selection checkbox */}
            <div className="mr-4">
              <input
                type="checkbox"
                checked={selectedFiles.includes(file.id)}
                onChange={() => onFileSelect(file.id)}
                className="h-5 w-5 rounded border-2 border-slate-400 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-700"
              />
            </div>

            {/* Status indicator */}
            <div className="mr-4 flex flex-col items-center">
              {file.status === 'unsupported' ? (
                <svg className="w-3 h-3 text-red-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className={`w-3 h-3 rounded-full ${getStatusColor(file.status)} mb-1 ${
                  file.status === 'processing' || file.status === 'paused' ? 'animate-pulse' : ''
                }`} />
              )}
              <span className="text-xs text-slate-400">{getStatusText(file.status)}</span>
            </div>

            {/* File icon */}
            <div className="mr-4">
              {file.mime_type?.includes('pdf') ? (
                <DocumentIcon className="w-7 h-7 file-icon" />
              ) : file.mime_type?.includes('word') ? (
                <DocumentTextIcon className="w-7 h-7 file-icon" />
              ) : file.mime_type?.includes('excel') ? (
                <ChartBarIcon className="w-7 h-7 file-icon" />
              ) : file.mime_type?.includes('image') ? (
                <PhotoIcon className="w-7 h-7 file-icon" />
              ) : file.mime_type?.includes('email') ? (
                <EnvelopeIcon className="w-7 h-7 file-icon" />
              ) : (
                <DocumentIcon className="w-7 h-7 file-icon" />
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate mb-1">{file.name}</p>
                  <p className="text-xs text-slate-400 truncate">{file.path}</p>
                  {file.analysis_result && (
                    <p className="text-xs text-green-400 mt-1 truncate">
                      ✓ Analyse disponible
                    </p>
                  )}
                  {file.error_message && (
                    <p className="text-xs text-red-400 mt-1 truncate flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      {file.error_message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1 text-xs text-slate-400">
                  <span className="font-medium">{formatFileSize(file.size)}</span>
                  <span>{file.mime_type}</span>
                  <span>{new Date(file.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="ml-4 flex items-center space-x-2">
              {/* View file button - only visible when not selected */}
              {!selectedFiles.includes(file.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewFile && onViewFile(file);
                  }}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  title="Voir le fichier"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              )}

              {/* View results button for completed analyses */}
              {file.status === 'completed' && file.analysis_result && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewResults && onViewResults(file);
                  }}
                  className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  title="Voir les résultats d'analyse"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}

              {/* Selection indicator */}
              {selectedFiles.includes(file.id) && (
                <div className="text-blue-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;