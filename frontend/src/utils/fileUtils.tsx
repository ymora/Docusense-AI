/**
 * Utilitaires centralisés pour la gestion des fichiers
 */

import {
  DocumentTextIcon,
  PhotoIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  DocumentIcon,
  EnvelopeIcon,
  TableCellsIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  mime_type?: string;
  status?: string;
  id?: number;
}

export interface FileStatus {
  status: string;
  color: string;
  text: string;
}

/**
 * Obtient l'icône appropriée selon l'extension du fichier
 */
export const getFileIcon = (fileName: string): JSX.Element => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '')) {
    return <PhotoIcon className="w-4 h-4 text-green-400" />;
  }

  // Audio
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension || '')) {
    return <MusicalNoteIcon className="w-4 h-4 text-purple-400" />;
  }

  // Vidéo
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension || '')) {
    return <VideoCameraIcon className="w-4 h-4 text-red-400" />;
  }

  // Documents
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '')) {
    return <DocumentIcon className="w-4 h-4 text-blue-400" />;
  }

  // Emails
  if (['eml', 'msg'].includes(extension || '')) {
    return <EnvelopeIcon className="w-4 h-4 text-yellow-400" />;
  }

  // Tableaux
  if (['csv', 'tsv'].includes(extension || '')) {
    return <TableCellsIcon className="w-4 h-4 text-green-400" />;
  }

  // Code
  if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'h'].includes(extension || '')) {
    return <CodeBracketIcon className="w-4 h-4 text-gray-400" />;
  }

  // Par défaut
  return <DocumentTextIcon className="w-4 h-4 text-slate-400" />;
};

/**
 * Obtient les informations de statut d'un fichier
 */
export const getFileStatusInfo = (status: string): FileStatus => {
  switch (status) {
    case 'completed':
      return {
        status: 'completed',
        color: 'bg-green-500',
        text: 'Terminé',
      };
    case 'failed':
      return {
        status: 'failed',
        color: 'bg-red-500',
        text: 'Échec',
      };
    case 'processing':
      return {
        status: 'processing',
        color: 'bg-blue-500',
        text: 'En cours',
      };
    case 'pending':
      return {
        status: 'pending',
        color: 'bg-yellow-500',
        text: 'En attente',
      };
    case 'unsupported':
      return {
        status: 'unsupported',
        color: 'bg-gray-500',
        text: 'Non supporté',
      };
    default:
      return {
        status: 'none',
        color: 'bg-gray-400',
        text: 'Inconnu',
      };
  }
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

/**
 * Vérifie si un fichier est supporté
 */
export const isFileSupported = (fileName: string): boolean => {
  const supportedExtensions = [
    'pdf', 'docx', 'doc', 'txt', 'eml', 'msg',
    'xlsx', 'xls', 'csv', 'jpg', 'jpeg', 'png', 'html',
  ];
  const extension = fileName.split('.').pop()?.toLowerCase();
  return supportedExtensions.includes(extension || '');
};

/**
 * Obtient le type MIME d'un fichier
 */
export const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain',
    'eml': 'message/rfc822',
    'msg': 'application/vnd.ms-outlook',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'csv': 'text/csv',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'html': 'text/html',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
};