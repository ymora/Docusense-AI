"""
Utilitaires centralisés pour la gestion des fichiers et formats
"""

import mimetypes
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


# FileFormatManager a été supprimé car redondant avec FileValidator dans core/file_validation.py
# Utilisez FileValidator depuis core/file_validation.py pour la gestion des formats


class FileInfoExtractor:
    """
    Extracteur d'informations de fichiers centralisé
    """

    @staticmethod
    def extract_file_info(file_path: Path) -> Optional[Dict[str, Any]]:
        """
        Extrait les informations d'un fichier

        Args:
            file_path: Chemin du fichier

        Returns:
            Dict: Informations du fichier ou None si erreur
        """
        try:
            # Vérifier que le fichier existe
            if not file_path.exists():
                logger.warning(f"Fichier inexistant: {file_path}")
                return None

            # Extraire l'extension
            extension = file_path.suffix.lower().lstrip('.')

            # Vérifier si le format est supporté
            # Utiliser FileValidator pour vérifier si le format est supporté
            from .file_validation import FileValidator
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if mime_type and not FileValidator.is_format_supported(mime_type):
                return None

            # Obtenir les statistiques du fichier
            stat = file_path.stat()

            # Déterminer le type MIME
            mime_type = FileInfoExtractor._get_mime_type(file_path, extension)

            # Obtenir la catégorie du format
            # Utiliser FileValidator pour obtenir la catégorie
            if mime_type:
                file_type = FileValidator.get_file_type(mime_type)
                format_category = file_type
            else:
                format_category = None

            file_info = {
                "name": file_path.name,
                "path": str(file_path),
                "size": stat.st_size,
                "mime_type": mime_type,
                "extension": extension,
                "format_category": format_category,
                "parent_directory": str(file_path.parent),
                "is_supported": True,
                # Ajout des dates de création et modification du fichier
                "file_created_at": datetime.fromtimestamp(stat.st_ctime).isoformat() if hasattr(stat, 'st_ctime') else None,
                "file_modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat() if hasattr(stat, 'st_mtime') else None,
                "file_accessed_at": datetime.fromtimestamp(stat.st_atime).isoformat() if hasattr(stat, 'st_atime') else None
            }

            return file_info

        except Exception as e:
            logger.error(
                f"Erreur lors de l'extraction d'informations pour {file_path}: {
                    str(e)}")
            return None

    @staticmethod
    def extract_unsupported_file_info(file_path: Path) -> Dict[str, Any]:
        """
        Extrait les informations d'un fichier non supporté

        Args:
            file_path: Chemin du fichier

        Returns:
            Dict: Informations du fichier non supporté
        """
        try:
            extension = file_path.suffix.lower().lstrip('.')
            stat = file_path.stat() if file_path.exists() else None

            return {
                "name": file_path.name,
                "path": str(file_path),
                "size": stat.st_size if stat else 0,
                "mime_type": "unknown",
                "extension": extension,
                "format_category": None,
                "parent_directory": str(file_path.parent),
                "is_supported": False
            }

        except Exception as e:
            logger.error(
                f"Erreur lors de l'extraction d'informations pour fichier non supporté {file_path}: {
                    str(e)}")
            return {
                "name": file_path.name,
                "path": str(file_path),
                "size": 0,
                "mime_type": "unknown",
                "extension": file_path.suffix.lower().lstrip('.'),
                "format_category": None,
                "parent_directory": str(file_path.parent),
                "is_supported": False
            }

    @staticmethod
    def _get_mime_type(file_path: Path, extension: str) -> str:
        """
        Détermine le type MIME d'un fichier avec priorité sur les formats natifs

        Args:
            file_path: Chemin du fichier
            extension: Extension du fichier

        Returns:
            str: Type MIME optimisé pour le navigateur
        """
        # Mapping optimisé par priorité de support navigateur
        mime_mapping = {
            # Formats Office - Documents et tableurs
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', # Word 2007+
            'doc': 'application/msword',  # Word 97-2003
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', # Excel 2007+
            'xls': 'application/vnd.ms-excel', # Excel 97-2003
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', # PowerPoint 2007+
            'ppt': 'application/vnd.ms-powerpoint', # PowerPoint 97-2003
            'csv': 'text/csv',            # CSV
            'txt': 'text/plain',          # Texte
            'pdf': 'application/pdf',     # PDF
            'html': 'text/html',          # HTML
            'rtf': 'application/rtf',     # RTF
            'odt': 'application/vnd.oasis.opendocument.text', # OpenDocument Text
            'ods': 'application/vnd.oasis.opendocument.spreadsheet', # OpenDocument Spreadsheet
            'odp': 'application/vnd.oasis.opendocument.presentation', # OpenDocument Presentation
            'pages': 'application/x-iwork-pages-sffpages', # Pages (Mac)
            'numbers': 'application/x-iwork-numbers-sffnumbers', # Numbers (Mac)
            'key': 'application/x-iwork-keynote-sffkey', # Keynote (Mac)
            
            # Emails
            'eml': 'message/rfc822',      # Email
            'msg': 'application/vnd.ms-outlook', # Outlook
            'pst': 'application/vnd.ms-outlook-pst', # Outlook PST
            'ost': 'application/vnd.ms-outlook-ost', # Outlook OST
            
            # Images
            'jpg': 'image/jpeg',          # JPEG
            'jpeg': 'image/jpeg',         # JPEG
            'png': 'image/png',           # PNG
            'gif': 'image/gif',           # GIF
            'bmp': 'image/bmp',           # BMP
            'tiff': 'image/tiff',         # TIFF
            'svg': 'image/svg+xml',       # SVG
            'webp': 'image/webp',         # WebP
            'ico': 'image/x-icon',        # ICO
            'raw': 'image/x-raw',         # RAW
            'heic': 'image/heic',         # HEIC
            'heif': 'image/heif',         # HEIF
            
            # Formats natifs - Support excellent (95%+ des navigateurs)
            'mp4': 'video/mp4',           # H.264 - Support universel
            'webm': 'video/webm',         # VP8/VP9 - Chrome, Firefox, Edge
            'ogg': 'video/ogg',           # Theora - Firefox, Chrome
            'mp3': 'audio/mpeg',          # MP3 - Support universel
            'wav': 'audio/wav',           # WAV - Support universel
            'aac': 'audio/aac',           # AAC - Support universel
            'm4a': 'audio/mp4',           # AAC dans conteneur MP4
            
            # Formats étendus - Support bon (70-90% des navigateurs)
            'mov': 'video/quicktime',     # MOV - Safari, Chrome
            'avi': 'video/x-msvideo',     # AVI - Windows Media
            'wmv': 'video/x-ms-wmv',      # WMV - Windows Media
            'flv': 'video/x-flv',         # FLV - Flash (déprécié mais supporté)
            '3gp': 'video/3gpp',          # 3GP - Mobile
            'ts': 'video/mp2t',           # TS - Transport Stream
            'm3u8': 'application/x-mpegURL', # HLS - Safari, Chrome
            'hls': 'application/x-mpegURL', # HLS alternatif
            'flac': 'audio/flac',         # FLAC - Chrome, Firefox
            'opus': 'audio/opus',         # Opus - Chrome, Firefox
            'aiff': 'audio/aiff',         # AIFF - Safari
            'au': 'audio/basic',          # AU - Unix
            'wma': 'audio/x-ms-wma',      # WMA - Windows Media
            'amr': 'audio/amr',           # AMR - Mobile
            
            # Formats avancés - Support limité (30-60% des navigateurs)
            'mkv': 'video/x-matroska',    # MKV - Chrome avec codecs
            'asf': 'video/x-ms-asf',      # ASF - Windows Media
            'rm': 'video/x-pn-realvideo', # RM - RealMedia
            'rmvb': 'video/x-pn-realvideo', # RMVB - RealMedia
            'mpeg': 'video/mpeg',         # MPEG - Support limité
            'mpg': 'video/mpeg',          # MPEG alternatif
            'mpe': 'video/mpeg',          # MPEG alternatif
            'divx': 'video/x-msvideo',    # DivX - Windows
            'xvid': 'video/x-msvideo',    # XviD - Windows
            'evo': 'video/x-msvideo',     # EVO - HD DVD
            'ogm': 'video/ogg',           # OGM - Ogg Media
            'ogx': 'video/ogg',           # OGX - Ogg Media
            'mxf': 'application/mxf',     # MXF - Professionnel
            'nut': 'video/x-nut',         # NUT - FFmpeg
            'mts': 'video/mp2t',          # MTS - Transport Stream
            'm2ts': 'video/mp2t',         # M2TS - Transport Stream
            'vob': 'video/mp2t',          # VOB - DVD
            'ra': 'audio/x-pn-realaudio', # RA - RealMedia
            'wv': 'audio/x-wavpack',      # WV - WavPack
            'ape': 'audio/x-ape',         # APE - Monkey's Audio
            'ac3': 'audio/ac3',           # AC3 - Dolby
            'dts': 'audio/vnd.dts',       # DTS - Digital Theater
            'mka': 'audio/x-matroska',    # MKA - Matroska Audio
            'tta': 'audio/x-tta',         # TTA - True Audio
            '3ga': 'audio/3gpp',          # 3GA - 3GPP Audio
            
            # Archives
            'zip': 'application/zip',     # ZIP
            'rar': 'application/vnd.rar', # RAR
            '7z': 'application/x-7z-compressed', # 7-Zip
            'tar': 'application/x-tar',   # TAR
            'gz': 'application/gzip',     # GZIP
            'bz2': 'application/x-bzip2', # BZIP2
            
            # Code source
            'py': 'text/x-python',        # Python
            'js': 'application/javascript', # JavaScript
            'ts': 'application/typescript', # TypeScript
            'java': 'text/x-java-source', # Java
            'cpp': 'text/x-c++src',       # C++
            'c': 'text/x-csrc',           # C
            'cs': 'text/x-csharp',        # C#
            'php': 'application/x-httpd-php', # PHP
            'rb': 'text/x-ruby',          # Ruby
            'go': 'text/x-go',            # Go
            'rs': 'text/x-rust',          # Rust
            'swift': 'text/x-swift',      # Swift
            'kt': 'text/x-kotlin',        # Kotlin
            'css': 'text/css',            # CSS
            'xml': 'application/xml',     # XML
            'json': 'application/json',   # JSON
            'yaml': 'application/x-yaml', # YAML
            'yml': 'application/x-yaml',  # YAML
            'sql': 'application/sql',     # SQL
            'sh': 'application/x-sh',     # Shell
            'bat': 'application/x-msdos-program', # Batch
            'ps1': 'application/x-powershell', # PowerShell
            
            # Autres
            'md': 'text/markdown',        # Markdown
            'tex': 'application/x-tex',   # LaTeX
            'log': 'text/plain',          # Log
            'ini': 'text/plain',          # INI
            'cfg': 'text/plain',          # Config
            'conf': 'text/plain',         # Config
        }

        # Vérifier d'abord notre mapping optimisé
        if extension.lower() in mime_mapping:
            return mime_mapping[extension.lower()]

        # Essayer de deviner le type MIME avec mimetypes
        mime_type, _ = mimetypes.guess_type(str(file_path))

        if mime_type:
            return mime_type

        # Fallback intelligent basé sur l'extension
        extension_lower = extension.lower()
        
        # Détection par extension pour les cas manquants
        if extension_lower in ['cursorrules', 'gitignore']:
            return 'text/plain'
        elif extension_lower in ['py', 'js', 'ts', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt']:
            return 'text/plain'
        elif extension_lower in ['css', 'xml', 'json', 'yaml', 'yml', 'sql', 'sh', 'bat', 'ps1']:
            return 'text/plain'
        elif extension_lower in ['md', 'tex', 'log', 'ini', 'cfg', 'conf']:
            return 'text/plain'
        elif extension_lower in ['docx', 'xlsx', 'pptx']:
            # Formats Office - retourner le type MIME correct
            if extension_lower == 'docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            elif extension_lower == 'xlsx':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            elif extension_lower == 'pptx':
                return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        else:
            # Dernier fallback - type générique
            return 'application/octet-stream'

    @staticmethod
    def get_browser_optimized_mime_type(original_mime: str, extension: str) -> str:
        """
        Optimise le type MIME pour une meilleure compatibilité navigateur

        Args:
            original_mime: Type MIME original
            extension: Extension du fichier

        Returns:
            str: Type MIME optimisé
        """
        # Mapping d'optimisation pour formats problématiques
        optimization_mapping = {
            # Formats vidéo avec codecs explicites
            'video/mp4': 'video/mp4; codecs="avc1.42E01E"',
            'video/webm': 'video/webm; codecs="vp8, vorbis"',
            'video/ogg': 'video/ogg; codecs="theora, vorbis"',
            
            # Formats audio avec codecs explicites
            'audio/mp4': 'audio/mp4; codecs="mp4a.40.2"',
            'audio/aac': 'audio/aac',
            'audio/ogg': 'audio/ogg; codecs="vorbis"',
            
            # Formats HLS/DASH
            'application/x-mpegURL': 'application/x-mpegURL',
            'application/vnd.apple.mpegurl': 'application/vnd.apple.mpegurl',
            'application/dash+xml': 'application/dash+xml',
        }

        # Retourner le type optimisé s'il existe
        return optimization_mapping.get(original_mime, original_mime)


class DirectoryInfoExtractor:
    """
    Extracteur d'informations de répertoires centralisé
    """

    @staticmethod
    def extract_directory_info(dir_path: Path) -> Optional[Dict[str, Any]]:
        """
        Extrait les informations d'un répertoire

        Args:
            dir_path: Chemin du répertoire

        Returns:
            Dict: Informations du répertoire ou None si erreur
        """
        try:

            # Gérer le cas du répertoire racine
            parent_path = None
            if dir_path.parent != dir_path:
                parent_path = str(dir_path.parent)

            dir_info = {
                "name": dir_path.name,
                "path": str(dir_path),
                "parent_path": parent_path,
                "is_directory": True,
                "file_count": 0  # Sera mis à jour plus tard
            }

            return dir_info

        except Exception as e:
            logger.error(
                f"Erreur lors de l'extraction d'informations pour le répertoire {dir_path}: {
                    str(e)}")
            return None


class FilePathUtils:
    """
    Utilitaires pour la manipulation des chemins de fichiers
    """

    @staticmethod
    def normalize_path(path: str) -> Path:
        """
        Normalise un chemin de fichier

        Args:
            path: Chemin à normaliser

        Returns:
            Path: Chemin normalisé
        """
        return Path(path).resolve()

    @staticmethod
    def is_subdirectory(parent: Path, child: Path) -> bool:
        """
        Vérifie si un répertoire est un sous-répertoire d'un autre

        Args:
            parent: Répertoire parent
            child: Répertoire enfant

        Returns:
            bool: True si child est un sous-répertoire de parent
        """
        try:
            parent = parent.resolve()
            child = child.resolve()
            return parent in child.parents
        except Exception:
            return False

    @staticmethod
    def get_relative_path(base: Path, target: Path) -> str:
        """
        Obtient le chemin relatif d'un fichier par rapport à une base

        Args:
            base: Chemin de base
            target: Chemin cible

        Returns:
            str: Chemin relatif
        """
        try:
            return str(target.relative_to(base))
        except ValueError:
            return str(target)
