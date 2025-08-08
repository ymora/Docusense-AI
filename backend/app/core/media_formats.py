"""
Configuration centralisée des formats média supportés
====================================================

Ce fichier contient toutes les définitions des formats audio, vidéo et image
supportés par l'application, basées sur les capacités des bibliothèques installées.

Bibliothèques utilisées :
- Pillow : Images (JPEG, PNG, GIF, WebP, TIFF, BMP, ICO, HEIC, etc.)
- OpenCV : Images et vidéos (AVI, MP4, MOV, etc.)
- MoviePy : Vidéos (MP4, AVI, MOV, MKV, etc.)
- Pydub : Audio (MP3, WAV, FLAC, AAC, OGG, etc.)
- Librosa : Audio (WAV, FLAC, MP3, OGG, etc.)
- SoundFile : Audio (WAV, FLAC, AIFF, etc.)
- FFmpeg : Conversion et streaming (tous formats)
- AV : Décodage vidéo/audio (tous formats)
"""

import mimetypes
from typing import Dict, List, Set, Tuple

# ==========================
# EXTENSIONS PAR CATÉGORIE
# ==========================

# Formats audio supportés (37 formats)
AUDIO_EXTENSIONS: Set[str] = {
    # Formats courants
    '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.m4b', '.m4p', '.m4r',
    
    # Formats haute qualité
    '.opus', '.aiff', '.aif', '.alac', '.amr', '.awb',
    
    # Formats anciens/legacy
    '.au', '.snd', '.ra', '.ram', '.wv', '.ape', '.ac3', '.dts',
    
    # Formats conteneurs
    '.mka', '.tta', '.mid', '.midi', '.caf',
    
    # Formats mobiles
    '.3ga', '.3gp', '.3gpp', '.3g2',
    
    # Formats Windows
    '.wax', '.wvx',
    
    # Formats playlist
    '.pls', '.sd2'
}

# Formats vidéo supportés (23 formats)
VIDEO_EXTENSIONS: Set[str] = {
    # Formats courants
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v',
    
    # Formats mobiles
    '.3gp', '.3g2', '.ogv',
    
    # Formats transport stream
    '.ts', '.mts', '.m2ts',
    
    # Formats conteneurs
    '.asf', '.rm', '.rmvb', '.nut', '.f4v', '.f4p', '.f4a', '.f4b',
    
    # Formats codec
    '.divx', '.xvid', '.h264', '.h265', '.vp8', '.vp9',
    
    # Formats MPEG
    '.mpeg', '.mpg', '.mpe', '.m1v', '.m2v', '.mpv', '.mp2', '.m2p', '.ps',
    
    # Formats autres
    '.evo', '.ogm', '.ogx', '.mxf',
    
    # Formats streaming
    '.hls', '.m3u8'
}

# Formats image supportés (43 formats)
IMAGE_EXTENSIONS: Set[str] = {
    # Formats courants
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif', '.ico',
    
    # Formats modernes
    '.heic', '.heif', '.avif', '.jxl',
    
    # Formats RAW (appareils photo)
    '.raw', '.cr2', '.cr3', '.nef', '.arw', '.raf', '.orf', '.pef', '.srw', '.rw2',
    '.dcr', '.kdc', '.k25', '.mrw', '.x3f', '.3fr', '.fff', '.iiq', '.mos',
    
    # Formats professionnels
    '.psd', '.dng',
    
    # Formats bitmap
    '.pbm', '.pgm', '.ppm', '.pnm', '.xbm', '.xpm', '.ras', '.rgb'
}

# Formats document supportés (15 formats)
DOCUMENT_EXTENSIONS: Set[str] = {
    # Formats Microsoft Office
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.rtf',
    
    # Formats PDF et texte
    '.pdf', '.txt', '.md', '.csv',
    
    # Formats email
    '.eml', '.msg',
    
    # Formats autres
    '.odt', '.ods', '.odp'
}

# ==========================
# TYPES MIME PAR CATÉGORIE
# ==========================

# Types MIME audio
AUDIO_MIME_TYPES: List[str] = [
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/flac',
    'audio/opus', 'audio/aiff', 'audio/basic', 'audio/x-ms-wma', 'audio/3gpp',
    'audio/3gpp2', 'audio/amr', 'audio/x-amr-wb', 'audio/x-pn-realaudio',
    'audio/x-wavpack', 'audio/x-ape', 'audio/ac3', 'audio/vnd.dts', 'audio/x-matroska',
    'audio/x-tta', 'audio/midi', 'audio/x-midi', 'audio/x-alac', 'audio/x-caf',
    'audio/x-m4a', 'audio/x-m4b', 'audio/x-m4p', 'audio/x-m4r', 'audio/x-3ga',
    'audio/x-ms-wax', 'audio/x-ms-wvx', 'audio/x-pn-aiff', 'audio/x-pn-wav',
    'audio/x-pn-windows-acm', 'audio/x-realaudio', 'audio/x-scpls', 'audio/x-sd2'
]

# Types MIME vidéo
VIDEO_MIME_TYPES: List[str] = [
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
    'video/avi', 'video/x-ms-wmv', 'video/x-flv', 'video/x-matroska', 'video/3gpp',
    'video/3gpp2', 'video/mp2t', 'video/mpeg', 'video/x-ms-asf', 'video/x-pn-realvideo',
    'video/x-nut', 'video/x-m4v', 'video/x-f4v', 'video/x-f4p', 'video/x-f4a',
    'video/x-f4b', 'application/x-mpegURL', 'application/vnd.apple.mpegurl',
    'video/dash', 'application/dash+xml'
]

# Types MIME image
IMAGE_MIME_TYPES: List[str] = [
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
]

# Types MIME document
DOCUMENT_MIME_TYPES: List[str] = [
    # Microsoft Office
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf',
    
    # PDF et texte
    'application/pdf', 'text/plain', 'text/markdown', 'text/csv',
    
    # Email
    'message/rfc822', 'application/vnd.ms-outlook',
    
    # OpenDocument
    'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation'
]

# ==========================
# MAPPING EXTENSION -> MIME
# ==========================

# Mapping complet extension -> type MIME
EXTENSION_TO_MIME: Dict[str, str] = {
    # Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.aac': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.wma': 'audio/x-ms-wma',
    '.m4a': 'audio/mp4',
    '.m4b': 'audio/mp4',
    '.m4p': 'audio/mp4',
    '.m4r': 'audio/mp4',
    '.opus': 'audio/opus',
    '.aiff': 'audio/aiff',
    '.aif': 'audio/aiff',
    '.alac': 'audio/x-alac',
    '.amr': 'audio/amr',
    '.awb': 'audio/x-amr-wb',
    '.au': 'audio/basic',
    '.snd': 'audio/basic',
    '.ra': 'audio/x-pn-realaudio',
    '.ram': 'audio/x-pn-realaudio',
    '.wv': 'audio/x-wavpack',
    '.ape': 'audio/x-ape',
    '.ac3': 'audio/ac3',
    '.dts': 'audio/vnd.dts',
    '.mka': 'audio/x-matroska',
    '.tta': 'audio/x-tta',
    '.mid': 'audio/midi',
    '.midi': 'audio/midi',
    '.caf': 'audio/x-caf',
    '.3ga': 'audio/3gpp',
    '.3gpp': 'audio/3gpp',
    '.3g2': 'audio/3gpp2',
    '.wax': 'audio/x-ms-wax',
    '.wvx': 'audio/x-ms-wvx',
    '.pls': 'audio/x-scpls',
    '.sd2': 'audio/x-sd2',
    
    # Vidéo
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.m4v': 'video/x-m4v',
    '.3gp': 'video/3gpp',
    '.3g2': 'video/3gpp2',
    '.ogv': 'video/ogg',
    '.ts': 'video/mp2t',
    '.mts': 'video/mp2t',
    '.m2ts': 'video/mp2t',
    '.asf': 'video/x-ms-asf',
    '.rm': 'video/x-pn-realvideo',
    '.rmvb': 'video/x-pn-realvideo',
    '.nut': 'video/x-nut',
    '.f4v': 'video/x-f4v',
    '.f4p': 'video/x-f4p',
    '.f4a': 'video/x-f4a',
    '.f4b': 'video/x-f4b',
    '.hls': 'application/x-mpegURL',
    '.m3u8': 'application/vnd.apple.mpegurl',
    
    # Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.ico': 'image/x-icon',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.avif': 'image/avif',
    '.jxl': 'image/jxl',
    '.raw': 'image/x-raw',
    '.cr2': 'image/x-canon-cr2',
    '.cr3': 'image/x-canon-cr3',
    '.nef': 'image/x-nikon-nef',
    '.arw': 'image/x-sony-arw',
    '.raf': 'image/x-fuji-raf',
    '.orf': 'image/x-olympus-orf',
    '.pef': 'image/x-pentax-pef',
    '.srw': 'image/x-samsung-srw',
    '.rw2': 'image/x-panasonic-rw2',
    '.dcr': 'image/x-kodak-dcr',
    '.kdc': 'image/x-kodak-kdc',
    '.k25': 'image/x-kodak-k25',
    '.mrw': 'image/x-minolta-mrw',
    '.x3f': 'image/x-sigma-x3f',
    '.3fr': 'image/x-hasselblad-3fr',
    '.fff': 'image/x-hasselblad-fff',
    '.iiq': 'image/x-phaseone-iiq',
    '.mos': 'image/x-leaf-mos',
    '.psd': 'image/x-photoshop',
    '.dng': 'image/x-adobe-dng',
    '.pbm': 'image/x-portable-bitmap',
    '.pgm': 'image/x-portable-graymap',
    '.ppm': 'image/x-portable-pixmap',
    '.pnm': 'image/x-portable-anymap',
    '.xbm': 'image/x-xbitmap',
    '.xpm': 'image/x-xpixmap',
    '.ras': 'image/x-cmu-raster',
    '.rgb': 'image/x-rgb',
    
    # Documents
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.rtf': 'application/rtf',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.csv': 'text/csv',
    '.eml': 'message/rfc822',
    '.msg': 'application/vnd.ms-outlook',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.odp': 'application/vnd.oasis.opendocument.presentation'
}

# ==========================
# FONCTIONS UTILITAIRES
# ==========================

def initialize_mime_types():
    """Initialise tous les types MIME dans le module mimetypes"""
    mimetypes.init()
    
    # Ajouter tous les mappings extension -> MIME
    for extension, mime_type in EXTENSION_TO_MIME.items():
        mimetypes.add_type(mime_type, extension)

def get_supported_formats() -> Dict[str, List[str]]:
    """Retourne le dictionnaire des formats supportés par catégorie"""
    return {
        'image': IMAGE_MIME_TYPES,
        'video': VIDEO_MIME_TYPES,
        'audio': AUDIO_MIME_TYPES,
        'document': DOCUMENT_MIME_TYPES,
    }

def get_file_type_by_extension(filename: str) -> str:
    """Détermine le type de fichier basé sur l'extension"""
    if not filename:
        return 'unknown'
    
    # Extraire l'extension
    if '.' not in filename:
        return 'unknown'
    
    extension = '.' + filename.split('.')[-1].lower()
    
    if extension in IMAGE_EXTENSIONS:
        return 'image'
    elif extension in AUDIO_EXTENSIONS:
        return 'audio'
    elif extension in VIDEO_EXTENSIONS:
        return 'video'
    elif extension in DOCUMENT_EXTENSIONS:
        return 'document'
    else:
        return 'unknown'

def get_mime_type_by_extension(filename: str) -> str:
    """Retourne le type MIME basé sur l'extension du fichier"""
    if not filename:
        return 'application/octet-stream'
    
    # Extraire l'extension
    if '.' not in filename:
        return 'application/octet-stream'
    
    extension = '.' + filename.split('.')[-1].lower()
    return EXTENSION_TO_MIME.get(extension, 'application/octet-stream')

def is_supported_format(filename: str) -> bool:
    """Vérifie si le format du fichier est supporté"""
    file_type = get_file_type_by_extension(filename)
    return file_type in ['image', 'audio', 'video', 'document']

def get_extensions_by_type(file_type: str) -> Set[str]:
    """Retourne les extensions pour un type de fichier donné"""
    if file_type == 'image':
        return IMAGE_EXTENSIONS
    elif file_type == 'audio':
        return AUDIO_EXTENSIONS
    elif file_type == 'video':
        return VIDEO_EXTENSIONS
    elif file_type == 'document':
        return DOCUMENT_EXTENSIONS
    else:
        return set()

def get_mime_types_by_type(file_type: str) -> List[str]:
    """Retourne les types MIME pour un type de fichier donné"""
    if file_type == 'image':
        return IMAGE_MIME_TYPES
    elif file_type == 'audio':
        return AUDIO_MIME_TYPES
    elif file_type == 'video':
        return VIDEO_MIME_TYPES
    elif file_type == 'document':
        return DOCUMENT_MIME_TYPES
    else:
        return []

# ==========================
# STATISTIQUES
# ==========================

def get_format_statistics() -> Dict[str, int]:
    """Retourne les statistiques des formats supportés"""
    return {
        'audio_formats': len(AUDIO_EXTENSIONS),
        'video_formats': len(VIDEO_EXTENSIONS),
        'image_formats': len(IMAGE_EXTENSIONS),
        'document_formats': len(DOCUMENT_EXTENSIONS),
        'total_formats': len(AUDIO_EXTENSIONS) + len(VIDEO_EXTENSIONS) + len(IMAGE_EXTENSIONS) + len(DOCUMENT_EXTENSIONS),
        'audio_mime_types': len(AUDIO_MIME_TYPES),
        'video_mime_types': len(VIDEO_MIME_TYPES),
        'image_mime_types': len(IMAGE_MIME_TYPES),
        'document_mime_types': len(DOCUMENT_MIME_TYPES),
        'total_mime_types': len(AUDIO_MIME_TYPES) + len(VIDEO_MIME_TYPES) + len(IMAGE_MIME_TYPES) + len(DOCUMENT_MIME_TYPES)
    }

# ==========================
# INITIALISATION AUTOMATIQUE
# ==========================

# Initialiser les types MIME au chargement du module
initialize_mime_types() 