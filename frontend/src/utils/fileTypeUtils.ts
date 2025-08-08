/**
 * Utilitaires centralisés pour la détection des types de fichiers
 */

export type FileType = 'image' | 'audio' | 'video' | 'document' | 'spreadsheet' | 'email' | 'text' | 'other' | 'unknown';

import { getFileTypeByExtension } from './mediaFormats';

/**
 * Détecte le type de fichier basé sur l'extension et le type MIME
 * Version améliorée utilisant la configuration centralisée
 */
export const getFileType = (fileName: string, mimeType?: string): FileType => {
  // Utiliser la configuration centralisée pour les types média
  const mediaType = getFileTypeByExtension(fileName);
  if (mediaType !== 'unknown') {
    return mediaType as FileType;
  }

  const extension = fileName.split('.').pop()?.toLowerCase();

  // Documents - Support étendu incluant formats OpenDocument
  if (['pdf', 'docx', 'doc', 'rtf', 'odt', 'pages', 'ppt', 'pptx', 'odp', 'key'].includes(extension || '') ||
      mimeType?.startsWith('application/pdf') || mimeType?.startsWith('application/vnd.openxmlformats') ||
      mimeType?.startsWith('application/msword') || mimeType?.startsWith('application/vnd.ms-powerpoint')) {
    return 'document';
  }

  // Tableurs - Catégorie séparée pour une meilleure organisation
  if (['xlsx', 'xls', 'csv', 'ods', 'numbers'].includes(extension || '') ||
      mimeType?.startsWith('application/vnd.ms-excel') || mimeType?.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) {
    return 'spreadsheet';
  }

  // Emails - Support étendu incluant formats Outlook
  if (['eml', 'msg', 'pst', 'ost'].includes(extension || '') ||
      mimeType?.startsWith('message/') || 
      mimeType === 'message/rfc822' ||
      mimeType === 'application/vnd.ms-outlook') {
    return 'email';
  }

  // Texte - Support étendu incluant langages de programmation
  if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'tex', 'log', 'ini', 'cfg', 'conf', 'yaml', 'yml', 'sql', 'sh', 'bat', 'ps1'].includes(extension || '') ||
      mimeType?.startsWith('text/')) {
    return 'text';
  }

  return 'other';
};

/**
 * Détermine le type de fichier basé sur le type MIME
 * Version centralisée pour éviter la duplication
 */
export const getFileTypeFromMime = (mimeType: string): string => {
  const mime = mimeType.toLowerCase();
  if (mime.startsWith('audio/') || mime.startsWith('video/')) {
    return 'media';
  } else if (mime.startsWith('image/')) {
    return 'image';
  } else {
    return 'document';
  }
};