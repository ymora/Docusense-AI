/**
 * Utilitaires centralisés pour la gestion des fichiers
 */
import React from 'react';
import {
  PhotoIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  DocumentIcon,
  EnvelopeIcon,
  TableCellsIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  FilmIcon,
  ArchiveBoxIcon,
  PresentationChartLineIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

// Interface unifiée pour les informations de fichiers
export interface FileInfo {
  name: string;
  path: string;
  size?: number;
  mime_type?: string;
  status?: string;
  id?: number;
}

export interface FileStatus {
  status: string;
  color: string;
  text: string;
}

import { getFileType, FileType } from './fileTypeUtils';

/**
 * Obtient l'icône appropriée selon le type de fichier
 * Version améliorée utilisant getFileType centralisé
 */
export const getFileIcon = (fileName: string, mimeType?: string): JSX.Element => {
  const fileType = getFileType(fileName, mimeType);
  
  switch (fileType) {
    case 'image':
      return <PhotoIcon className="w-4 h-4 text-green-400" />;
    case 'audio':
      return <MusicalNoteIcon className="w-4 h-4 text-purple-400" />;
    case 'video':
      return <VideoCameraIcon className="w-4 h-4 text-red-400" />;
    case 'document':
      return <DocumentIcon className="w-4 h-4 text-blue-400" />;
    case 'spreadsheet':
      return <TableCellsIcon className="w-4 h-4 text-green-400" />;
    case 'email':
      return <EnvelopeIcon className="w-4 h-4 text-yellow-400" />;
    case 'text':
      return <CodeBracketIcon className="w-4 h-4 text-gray-400" />;
    default:
      return <DocumentTextIcon className="w-4 h-4 text-slate-400" />;
  }
};

/**
 * Obtient l'icône pour les pièces jointes d'email (version avec icônes Heroicons)
 */
export const getEmailAttachmentIcon = (contentType: string, filename: string): JSX.Element => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  if (contentType.startsWith('image/')) return <PhotoIcon className="h-5 w-5 text-blue-400" />;
  if (contentType.startsWith('video/')) return <FilmIcon className="h-5 w-5 text-purple-400" />;
  if (contentType.startsWith('audio/')) return <MusicalNoteIcon className="h-5 w-5 text-green-400" />;
  if (contentType === 'application/pdf') return <DocumentIcon className="h-5 w-5 text-red-400" />;
  if (contentType.startsWith('text/')) return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
  if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('7z')) return <ArchiveBoxIcon className="h-5 w-5 text-orange-400" />;
  if (contentType.includes('excel') || contentType.includes('spreadsheet') || extension === 'xlsx' || extension === 'xls') return <TableCellsIcon className="h-5 w-5 text-green-500" />;
  if (contentType.includes('powerpoint') || contentType.includes('presentation') || extension === 'pptx' || extension === 'ppt') return <PresentationChartLineIcon className="h-5 w-5 text-orange-500" />;
  if (contentType.includes('word') || contentType.includes('document') || extension === 'docx' || extension === 'doc') return <DocumentChartBarIcon className="h-5 w-5 text-blue-500" />;
  
  return <DocumentIcon className="h-5 w-5 text-gray-400" />;
};

/**
 * Obtient l'icône pour les pièces jointes d'email (version avec emojis)
 */
export const getEmailAttachmentEmoji = (contentType: string, filename: string): string => {
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType.startsWith('video/')) return '🎬';
  if (contentType.startsWith('audio/')) return '🎵';
  if (contentType === 'application/pdf') return '📄';
  if (contentType.startsWith('text/')) return '📝';
  if (contentType.includes('word') || contentType.includes('document')) return '📄';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
  if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📈';
  return '📎';
};

/**
 * Vérifie si un fichier peut être prévisualisé
 * Version améliorée utilisant la détection centralisée
 */
export const canPreviewFile = (contentType: string, filename: string): boolean => {
  const fileType = getFileType(filename, contentType);
  
  // Types de fichiers qui peuvent être prévisualisés
  const previewableTypes: FileType[] = [
    'image', 'audio', 'video', 'document', 'text', 'spreadsheet'
  ];
  
  return previewableTypes.includes(fileType);
};

/**
 * Vérifie si un format vidéo est supporté par le navigateur
 * Version améliorée utilisant la détection centralisée
 */
export const isVideoFormatSupported = (contentType: string, filename: string): boolean => {
  const fileType = getFileType(filename, contentType);
  return fileType === 'video';
};

/**
 * Obtient un message d'erreur vidéo approprié
 */
export const getVideoErrorMessage = (contentType: string, filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  if (contentType === 'video/avi' || extension === 'avi') {
    return 'Format AVI non supporté par les navigateurs web. Veuillez télécharger le fichier.';
  }
  
  if (contentType === 'video/quicktime' || extension === 'mov') {
    return 'Format QuickTime (.mov) non supporté par les navigateurs web. Veuillez télécharger le fichier.';
  }
  
  if (contentType === 'video/x-msvideo' || extension === 'wmv') {
    return 'Format Windows Media (.wmv) non supporté par les navigateurs web. Veuillez télécharger le fichier.';
  }
  
  return 'Format vidéo non supporté par le navigateur. Formats supportés: MP4, WebM, OGV';
};

/**
 * Formate la taille d'un fichier
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Formate une date
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('fr-FR');
};