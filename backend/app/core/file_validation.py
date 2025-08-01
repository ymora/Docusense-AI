"""
Validation des fichiers pour DocuSense AI
Support de tous les formats courants sans limite de taille
"""

import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import mimetypes

logger = logging.getLogger(__name__)

class FileValidator:
    """
    Service de validation des fichiers - Support de tous les formats courants
    """
    
    # Formats supportés (tous les formats courants)
    SUPPORTED_FORMATS = {
        # Images (formats courants)
        'image': [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'image/bmp',
            'image/tiff',
            'image/x-icon',
            'image/vnd.microsoft.icon',
            'image/heic',
            'image/heif',
            'image/avif',
            'image/jxl',
        ],
        
        # Vidéo (formats courants)
        'video': [
            'video/mp4',           # H.264/AVC - Support universel
            'video/webm',          # VP8/VP9 - Chrome, Firefox, Edge
            'video/ogg',           # Theora - Firefox, Chrome
            'video/quicktime',     # MOV - Safari, Chrome
            'video/x-msvideo',     # AVI - Windows Media
            'video/avi',           # AVI - Format alternatif
            'video/x-ms-wmv',      # WMV - Windows Media
            'video/x-flv',         # FLV - Flash
            'video/x-matroska',    # MKV - Conteneur
            'video/3gpp',          # 3GP - Mobile
            'video/mp2t',          # TS - Transport Stream
            'video/mpeg',          # MPEG
            'video/x-ms-asf',      # ASF - Windows Media
            'video/x-pn-realvideo', # RM - RealMedia
            'video/x-nut',         # NUT - FFmpeg
            'application/x-mpegURL', # HLS - Safari, Chrome
            'application/vnd.apple.mpegurl', # HLS alternatif
            'video/dash',          # DASH
            'application/dash+xml', # DASH XML
        ],
        
        # Audio (formats courants)
        'audio': [
            'audio/mpeg',          # MP3 - Support universel
            'audio/wav',           # WAV - Support universel
            'audio/mp4',           # AAC - Support universel
            'audio/ogg',           # OGG - Firefox, Chrome
            'audio/webm',          # WebM audio
            'audio/flac',          # FLAC - Chrome, Firefox
            'audio/opus',          # Opus - Chrome, Firefox
            'audio/aiff',          # AIFF - Safari
            'audio/basic',         # AU - Unix
            'audio/x-ms-wma',      # WMA - Windows Media
            'audio/3gpp',          # 3GP audio
            'audio/amr',           # AMR - Mobile
            'audio/x-pn-realaudio', # RA - RealMedia
            'audio/x-wavpack',     # WV - WavPack
            'audio/x-ape',         # APE - Monkey's Audio
            'audio/ac3',           # AC3 - Dolby
            'audio/vnd.dts',       # DTS - Digital Theater
            'audio/x-matroska',    # MKA - Matroska Audio
            'audio/x-tta',         # TTA - True Audio
            'audio/midi',          # MIDI
            'audio/x-midi',        # MIDI alternatif
        ],
        
        # Documents (formats courants)
        'document': [
            'application/pdf',
            'text/plain',
            'text/html',
            'text/css',
            'text/javascript',
            'application/json',
            'application/xml',
            'text/xml',
            'text/markdown',
            'text/csv',
            'application/rtf',
            # Office formats
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # DOCX
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        # XLSX
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', # PPTX
            'application/msword',  # DOC
            'application/vnd.ms-excel',  # XLS
            'application/vnd.ms-powerpoint',  # PPT
            'application/vnd.oasis.opendocument.text',  # ODT
            'application/vnd.oasis.opendocument.spreadsheet',  # ODS
            'application/vnd.oasis.opendocument.presentation',  # ODP
            'application/vnd.apple.pages',  # Pages
            'application/vnd.apple.numbers',  # Numbers
            'application/vnd.apple.keynote',  # Keynote
            # Autres formats
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'application/x-tar',
            'application/gzip',
            'application/x-bzip2',
            'application/x-lzma',
            'application/x-lz4',
            'application/x-zstd',
        ]
    }
    
    @classmethod
    def get_file_type(cls, mime_type: str) -> str:
        """
        Détermine le type de fichier à partir du MIME type
        """
        if mime_type.startswith('image/'):
            return 'image'
        elif mime_type.startswith('video/'):
            return 'video'
        elif mime_type.startswith('audio/'):
            return 'audio'
        elif mime_type.startswith('text/') or mime_type in cls.SUPPORTED_FORMATS['document']:
            return 'document'
        else:
            return 'default'
    
    @classmethod
    def is_format_supported(cls, mime_type: str) -> bool:
        """
        Vérifie si un format est supporté
        """
        file_type = cls.get_file_type(mime_type)
        if file_type == 'default':
            return False
        
        return mime_type in cls.SUPPORTED_FORMATS[file_type]
    
    @classmethod
    def validate_file(cls, file_path: Path) -> Tuple[bool, str, Optional[str]]:
        """
        Valide un fichier (format uniquement, pas de limite de taille)
        
        Returns:
            Tuple[bool, str, Optional[str]]: (is_valid, error_message, mime_type)
        """
        try:
            # Vérifier que le fichier existe
            if not file_path.exists():
                return False, "Fichier non trouvé", None
            
            if not file_path.is_file():
                return False, "Le chemin ne correspond pas à un fichier", None
            
            # Déterminer le type MIME
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if not mime_type:
                # Fallback pour les extensions courantes
                extension = file_path.suffix.lower()
                mime_type = cls._get_mime_type_from_extension(extension)
                if not mime_type:
                    # Si aucun type MIME n'est trouvé, utiliser text/plain pour les fichiers texte
                    # ou application/octet-stream pour les fichiers binaires
                    try:
                        # Essayer de lire le début du fichier pour déterminer s'il s'agit de texte
                        with open(file_path, 'rb') as f:
                            chunk = f.read(1024)
                            # Vérifier si le contenu est du texte
                            try:
                                chunk.decode('utf-8')
                                mime_type = 'text/plain'
                            except UnicodeDecodeError:
                                mime_type = 'application/octet-stream'
                    except Exception:
                        mime_type = 'application/octet-stream'
            
            # Pour le streaming, accepter tous les types de fichiers
            # La validation stricte est réservée pour l'analyse
            return True, "Fichier valide", mime_type
            
        except Exception as e:
            logger.error(f"Erreur lors de la validation du fichier {file_path}: {e}")
            return False, f"Erreur de validation: {str(e)}", None
    
    @classmethod
    def _get_mime_type_from_extension(cls, extension: str) -> Optional[str]:
        """
        Fallback pour déterminer le type MIME à partir de l'extension
        """
        extension_mime_map = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.tiff': 'image/tiff',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.wmv': 'video/x-ms-wmv',
            '.flv': 'video/x-flv',
            '.webm': 'video/webm',
            '.mkv': 'video/x-matroska',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.flac': 'audio/flac',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.htm': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.md': 'text/markdown',
            '.csv': 'text/csv',
            '.rtf': 'application/rtf',
            '.ini': 'text/plain',
            '.cfg': 'text/plain',
            '.conf': 'text/plain',
            '.config': 'text/plain',
            '.log': 'text/plain',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.doc': 'application/msword',
            '.xls': 'application/vnd.ms-excel',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.odt': 'application/vnd.oasis.opendocument.text',
            '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
            '.odp': 'application/vnd.oasis.opendocument.presentation',
        }
        
        return extension_mime_map.get(extension)
    
    @classmethod
    def get_supported_formats_for_type(cls, file_type: str) -> List[str]:
        """
        Retourne la liste des formats supportés pour un type
        """
        return cls.SUPPORTED_FORMATS.get(file_type, [])
    
    @classmethod
    def get_all_supported_formats(cls) -> Dict[str, List[str]]:
        """
        Retourne tous les formats supportés
        """
        return cls.SUPPORTED_FORMATS.copy() 