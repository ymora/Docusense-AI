/**
 * Configuration centralisée des formats média supportés - Frontend
 * ==============================================================
 * 
 * Ce fichier contient toutes les définitions des formats audio, vidéo et image
 * supportés par l'application frontend, synchronisées avec le backend.
 * 
 * Bibliothèques utilisées côté backend :
 * - Pillow : Images (JPEG, PNG, GIF, WebP, TIFF, BMP, ICO, HEIC, etc.)
 * - OpenCV : Images et vidéos (AVI, MP4, MOV, etc.)
 * - MoviePy : Vidéos (MP4, AVI, MOV, MKV, etc.)
 * - Pydub : Audio (MP3, WAV, FLAC, AAC, OGG, etc.)
 * - Librosa : Audio (WAV, FLAC, MP3, OGG, etc.)
 * - SoundFile : Audio (WAV, FLAC, AIFF, etc.)
 * - FFmpeg : Conversion et streaming (tous formats)
 * - AV : Décodage vidéo/audio (tous formats)
 */

// ==========================
// EXTENSIONS PAR CATÉGORIE
// ==========================

// Formats audio supportés (37 formats)
export const AUDIO_EXTENSIONS: Set<string> = new Set([
  // Formats courants
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'm4b', 'm4p', 'm4r',
  
  // Formats haute qualité
  'opus', 'aiff', 'aif', 'alac', 'amr', 'awb',
  
  // Formats anciens/legacy
  'au', 'snd', 'ra', 'ram', 'wv', 'ape', 'ac3', 'dts',
  
  // Formats conteneurs
  'mka', 'tta', 'mid', 'midi', 'caf',
  
  // Formats mobiles
  '3ga', '3gp', '3gpp', '3g2',
  
  // Formats Windows
  'wax', 'wvx',
  
  // Formats playlist
  'pls', 'sd2'
]);

// Formats vidéo supportés (23 formats)
export const VIDEO_EXTENSIONS: Set<string> = new Set([
  // Formats courants
  'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v',
  
  // Formats mobiles
  '3gp', '3g2', 'ogv',
  
  // Formats transport stream
  'ts', 'mts', 'm2ts',
  
  // Formats conteneurs
  'asf', 'rm', 'rmvb', 'nut', 'f4v', 'f4p', 'f4a', 'f4b',
  
  // Formats codec
  'divx', 'xvid', 'h264', 'h265', 'vp8', 'vp9',
  
  // Formats MPEG
  'mpeg', 'mpg', 'mpe', 'm1v', 'm2v', 'mpv', 'mp2', 'm2p', 'ps',
  
  // Formats autres
  'evo', 'ogm', 'ogx', 'mxf',
  
  // Formats streaming
  'hls', 'm3u8'
]);

// Formats image supportés (43 formats)
export const IMAGE_EXTENSIONS: Set<string> = new Set([
  // Formats courants
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'tif', 'ico',
  
  // Formats modernes
  'heic', 'heif', 'avif', 'jxl',
  
  // Formats RAW (appareils photo)
  'raw', 'cr2', 'cr3', 'nef', 'arw', 'raf', 'orf', 'pef', 'srw', 'rw2',
  'dcr', 'kdc', 'k25', 'mrw', 'x3f', '3fr', 'fff', 'iiq', 'mos',
  
  // Formats professionnels
  'psd', 'dng',
  
  // Formats bitmap
  'pbm', 'pgm', 'ppm', 'pnm', 'xbm', 'xpm', 'ras', 'rgb'
]);

// ==========================
// TYPES MIME PAR CATÉGORIE
// ==========================

// Types MIME audio
export const AUDIO_MIME_TYPES: string[] = [
  'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/flac',
  'audio/opus', 'audio/aiff', 'audio/basic', 'audio/x-ms-wma', 'audio/3gpp',
  'audio/3gpp2', 'audio/amr', 'audio/x-amr-wb', 'audio/x-pn-realaudio',
  'audio/x-wavpack', 'audio/x-ape', 'audio/ac3', 'audio/vnd.dts', 'audio/x-matroska',
  'audio/x-tta', 'audio/midi', 'audio/x-midi', 'audio/x-alac', 'audio/x-caf',
  'audio/x-m4a', 'audio/x-m4b', 'audio/x-m4p', 'audio/x-m4r', 'audio/x-3ga',
  'audio/x-ms-wax', 'audio/x-ms-wvx', 'audio/x-pn-aiff', 'audio/x-pn-wav',
  'audio/x-pn-windows-acm', 'audio/x-realaudio', 'audio/x-scpls', 'audio/x-sd2'
];

// Types MIME vidéo
export const VIDEO_MIME_TYPES: string[] = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
  'video/avi', 'video/x-ms-wmv', 'video/x-flv', 'video/x-matroska', 'video/3gpp',
  'video/3gpp2', 'video/mp2t', 'video/mpeg', 'video/x-ms-asf', 'video/x-pn-realvideo',
  'video/x-nut', 'video/x-m4v', 'video/x-f4v', 'video/x-f4p', 'video/x-f4a',
  'video/x-f4b', 'application/x-mpegURL', 'application/vnd.apple.mpegurl',
  'video/dash', 'application/dash+xml'
];

// Types MIME image
export const IMAGE_MIME_TYPES: string[] = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
  'image/tiff', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/heic',
  'image/heif', 'image/avif', 'image/jxl', 'image/x-portable-bitmap',
  'image/x-portable-graymap', 'image/x-portable-pixmap', 'image/x-portable-anymap',
  'image/x-xbitmap', 'image/x-xpixmap', 'image/x-cmu-raster', 'image/x-rgb',
  'image/x-bmp', 'image/x-ms-bmp', 'image/x-photoshop', 'image/x-adobe-dng',
  'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-nikon-nef', 'image/x-sony-arw',
  'image/x-fuji-raf', 'image/x-olympus-orf', 'image/x-pentax-pef', 'image/x-samsung-srw',
  'image/x-panasonic-rw2', 'image/x-kodak-dcr', 'image/x-kodak-kdc', 'image/x-kodak-k25',
  'image/x-minolta-mrw', 'image/x-sigma-x3f', 'image/x-hasselblad-3fr',
  'image/x-hasselblad-fff', 'image/x-phaseone-iiq', 'image/x-leaf-mos',
  'image/x-raw', 'image/x-dcraw'
];

// ==========================
// MAPPING EXTENSION -> MIME
// ==========================

// Mapping complet extension -> type MIME
export const EXTENSION_TO_MIME: Record<string, string> = {
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'flac': 'audio/flac',
  'aac': 'audio/mp4',
  'ogg': 'audio/ogg',
  'wma': 'audio/x-ms-wma',
  'm4a': 'audio/mp4',
  'm4b': 'audio/mp4',
  'm4p': 'audio/mp4',
  'm4r': 'audio/mp4',
  'opus': 'audio/opus',
  'aiff': 'audio/aiff',
  'aif': 'audio/aiff',
  'alac': 'audio/x-alac',
  'amr': 'audio/amr',
  'awb': 'audio/x-amr-wb',
  'au': 'audio/basic',
  'snd': 'audio/basic',
  'ra': 'audio/x-pn-realaudio',
  'ram': 'audio/x-pn-realaudio',
  'wv': 'audio/x-wavpack',
  'ape': 'audio/x-ape',
  'ac3': 'audio/ac3',
  'dts': 'audio/vnd.dts',
  'mka': 'audio/x-matroska',
  'tta': 'audio/x-tta',
  'mid': 'audio/midi',
  'midi': 'audio/midi',
  'caf': 'audio/x-caf',
  '3ga': 'audio/3gpp',
  '3gpp': 'audio/3gpp',
  'wax': 'audio/x-ms-wax',
  'wvx': 'audio/x-ms-wvx',
  'pls': 'audio/x-scpls',
  'sd2': 'audio/x-sd2',
  
  // Vidéo
  'mp4': 'video/mp4',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'wmv': 'video/x-ms-wmv',
  'flv': 'video/x-flv',
  'webm': 'video/webm',
  'mkv': 'video/x-matroska',
  'm4v': 'video/x-m4v',
  '3gp': 'video/3gpp',
  '3g2': 'video/3gpp2',
  'ogv': 'video/ogg',
  'ts': 'video/mp2t',
  'mts': 'video/mp2t',
  'm2ts': 'video/mp2t',
  'asf': 'video/x-ms-asf',
  'rm': 'video/x-pn-realvideo',
  'rmvb': 'video/x-pn-realvideo',
  'nut': 'video/x-nut',
  'f4v': 'video/x-f4v',
  'f4p': 'video/x-f4p',
  'f4a': 'video/x-f4a',
  'f4b': 'video/x-f4b',
  'hls': 'application/x-mpegURL',
  'm3u8': 'application/vnd.apple.mpegurl',
  
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  'ico': 'image/x-icon',
  'heic': 'image/heic',
  'heif': 'image/heif',
  'avif': 'image/avif',
  'jxl': 'image/jxl',
  'raw': 'image/x-raw',
  'cr2': 'image/x-canon-cr2',
  'cr3': 'image/x-canon-cr3',
  'nef': 'image/x-nikon-nef',
  'arw': 'image/x-sony-arw',
  'raf': 'image/x-fuji-raf',
  'orf': 'image/x-olympus-orf',
  'pef': 'image/x-pentax-pef',
  'srw': 'image/x-samsung-srw',
  'rw2': 'image/x-panasonic-rw2',
  'dcr': 'image/x-kodak-dcr',
  'kdc': 'image/x-kodak-kdc',
  'k25': 'image/x-kodak-k25',
  'mrw': 'image/x-minolta-mrw',
  'x3f': 'image/x-sigma-x3f',
  '3fr': 'image/x-hasselblad-3fr',
  'fff': 'image/x-hasselblad-fff',
  'iiq': 'image/x-phaseone-iiq',
  'mos': 'image/x-leaf-mos',
  'psd': 'image/x-photoshop',
  'dng': 'image/x-adobe-dng',
  'pbm': 'image/x-portable-bitmap',
  'pgm': 'image/x-portable-graymap',
  'ppm': 'image/x-portable-pixmap',
  'pnm': 'image/x-portable-anymap',
  'xbm': 'image/x-xbitmap',
  'xpm': 'image/x-xpixmap',
  'ras': 'image/x-cmu-raster',
  'rgb': 'image/x-rgb'
};

// ==========================
// FONCTIONS UTILITAIRES
// ==========================

/**
 * Détermine le type de fichier basé sur l'extension
 */
export function getFileTypeByExtension(filename: string): string {
  if (!filename) {
    return 'unknown';
  }
  
  // Extraire l'extension
  if (!filename.includes('.')) {
    return 'unknown';
  }
  
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  if (IMAGE_EXTENSIONS.has(extension)) {
    return 'image';
  } else if (AUDIO_EXTENSIONS.has(extension)) {
    return 'audio';
  } else if (VIDEO_EXTENSIONS.has(extension)) {
    return 'video';
  } else {
    return 'unknown';
  }
}

/**
 * Retourne le type MIME basé sur l'extension du fichier
 */
export function getMimeTypeByExtension(filename: string): string {
  if (!filename) {
    return 'application/octet-stream';
  }
  
  // Extraire l'extension
  if (!filename.includes('.')) {
    return 'application/octet-stream';
  }
  
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_TO_MIME[extension] || 'application/octet-stream';
}

/**
 * Vérifie si le format du fichier est supporté
 */
export function isSupportedFormat(filename: string): boolean {
  const fileType = getFileTypeByExtension(filename);
  return fileType !== 'unknown';
}

/**
 * Retourne les extensions pour un type de fichier donné
 */
export function getExtensionsByType(fileType: string): Set<string> {
  switch (fileType) {
    case 'image':
      return IMAGE_EXTENSIONS;
    case 'audio':
      return AUDIO_EXTENSIONS;
    case 'video':
      return VIDEO_EXTENSIONS;
    default:
      return new Set();
  }
}

/**
 * Retourne les types MIME pour un type de fichier donné
 */
export function getMimeTypesByType(fileType: string): string[] {
  switch (fileType) {
    case 'image':
      return IMAGE_MIME_TYPES;
    case 'audio':
      return AUDIO_MIME_TYPES;
    case 'video':
      return VIDEO_MIME_TYPES;
    default:
      return [];
  }
}

/**
 * Retourne le dictionnaire des formats supportés par catégorie
 */
export function getSupportedFormats(): Record<string, string[]> {
  return {
    'image': IMAGE_MIME_TYPES,
    'video': VIDEO_MIME_TYPES,
    'audio': AUDIO_MIME_TYPES,
  };
}

/**
 * Retourne les statistiques des formats supportés
 */
export function getFormatStatistics(): Record<string, number> {
  return {
    'audio_formats': AUDIO_EXTENSIONS.size,
    'video_formats': VIDEO_EXTENSIONS.size,
    'image_formats': IMAGE_EXTENSIONS.size,
    'total_formats': AUDIO_EXTENSIONS.size + VIDEO_EXTENSIONS.size + IMAGE_EXTENSIONS.size,
    'audio_mime_types': AUDIO_MIME_TYPES.length,
    'video_mime_types': VIDEO_MIME_TYPES.length,
    'image_mime_types': IMAGE_MIME_TYPES.length,
    'total_mime_types': AUDIO_MIME_TYPES.length + VIDEO_MIME_TYPES.length + IMAGE_MIME_TYPES.length
  };
}

/**
 * Génère une regex pour détecter les extensions d'un type donné
 */
export function getExtensionRegex(fileType: string): RegExp {
  const extensions = getExtensionsByType(fileType);
  const extensionList = Array.from(extensions).join('|');
  return new RegExp(`\\.(${extensionList})$`, 'i');
}

/**
 * Génère une regex pour détecter les extensions audio
 */
export function getAudioExtensionRegex(): RegExp {
  return getExtensionRegex('audio');
}

/**
 * Génère une regex pour détecter les extensions vidéo
 */
export function getVideoExtensionRegex(): RegExp {
  return getExtensionRegex('video');
}

/**
 * Génère une regex pour détecter les extensions image
 */
export function getImageExtensionRegex(): RegExp {
  return getExtensionRegex('image');
} 