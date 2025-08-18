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
    def extract_file_info(file_path: Path) -> Dict[str, Any]:
        """Extrait les informations d'un fichier"""
        try:
            stat = file_path.stat()
            return {
                "name": file_path.name,
                "path": str(file_path),
                "size": stat.st_size,
                "created_at": stat.st_ctime,
                "modified_at": stat.st_mtime,
                "accessed_at": stat.st_atime,
                "is_file": file_path.is_file(),
                "is_dir": file_path.is_dir(),
                "exists": file_path.exists()
            }
        except Exception as e:
            logger.error(f"Error extracting file info for {file_path}: {e}")
            return {"error": str(e)}

    @staticmethod
    def _get_mime_type(file_path: Path, extension: str) -> str:
        """Détermine le type MIME d'un fichier"""
        import mimetypes
        mime_type, _ = mimetypes.guess_type(str(file_path))
        return mime_type or 'application/octet-stream'


class DirectoryInfoExtractor:
    """
    Extracteur d'informations de répertoires centralisé
    """

    @staticmethod
    def extract_directory_info(directory_path: Path) -> Dict[str, Any]:
        """Extrait les informations d'un répertoire"""
        try:
            stat = directory_path.stat()
            return {
                "name": directory_path.name,
                "path": str(directory_path),
                "created_at": stat.st_ctime,
                "modified_at": stat.st_mtime,
                "accessed_at": stat.st_atime,
                "is_dir": directory_path.is_dir(),
                "exists": directory_path.exists()
            }
        except Exception as e:
            logger.error(f"Error extracting directory info for {directory_path}: {e}")
            return {"error": str(e)}


class FilePathUtils:
    """
    Utilitaires pour la manipulation des chemins de fichiers
    """

    @staticmethod
    def normalize_path(path: str) -> str:
        """Normalise un chemin de fichier"""
        return str(Path(path).resolve())

    @staticmethod
    def is_subdirectory(parent: str, child: str) -> bool:
        """Vérifie si un chemin est un sous-répertoire d'un autre"""
        try:
            parent_path = Path(parent).resolve()
            child_path = Path(child).resolve()
            return child_path.is_relative_to(parent_path)
        except (ValueError, RuntimeError):
            return False

    @staticmethod
    def get_relative_path(base_path: str, target_path: str) -> str:
        """Obtient le chemin relatif d'un fichier par rapport à un répertoire de base"""
        try:
            base = Path(base_path).resolve()
            target = Path(target_path).resolve()
            return str(target.relative_to(base))
        except (ValueError, RuntimeError):
            return str(target)
