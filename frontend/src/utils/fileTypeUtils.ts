/**
 * Utilitaires centralisés pour la détection des types de fichiers
 */

export type FileType = 'image' | 'audio' | 'video' | 'document' | 'spreadsheet' | 'email' | 'text' | 'other' | 'unknown';

/**
 * Détecte le type de fichier basé sur l'extension et le type MIME
 * Version améliorée basée sur la meilleure implémentation de FileTree.tsx
 */
export const getFileType = (fileName: string, mimeType?: string): FileType => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  // Images - Support étendu incluant formats RAW et HEIC
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'raw', 'heic', 'heif', 'cr2', 'nef', 'arw'].includes(extension || '') ||
      mimeType?.startsWith('image/')) {
    return 'image';
  }

  // Audio - Support étendu incluant formats haute qualité
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'aiff', 'alac'].includes(extension || '') ||
      mimeType?.startsWith('audio/')) {
    return 'audio';
  }

  // Vidéo - Support étendu incluant formats professionnels
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv', 'ts', 'mts', 'm2ts'].includes(extension || '') ||
      mimeType?.startsWith('video/')) {
    return 'video';
  }

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
      mimeType?.startsWith('message/')) {
    return 'email';
  }

  // Texte - Support étendu incluant langages de programmation
  if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'tex', 'log', 'ini', 'cfg', 'conf', 'yaml', 'yml', 'sql', 'sh', 'bat', 'ps1'].includes(extension || '') ||
      mimeType?.startsWith('text/')) {
    return 'text';
  }

  return 'other';
};