"""
Utilitaires centralisés pour la gestion des fichiers et formats
"""

import mimetypes
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class FileFormatManager:
    """
    Gestionnaire centralisé des formats de fichiers supportés
    """

    # Formats supportés centralisés - source unique de vérité
    SUPPORTED_FORMATS = [
        "pdf", "docx", "doc", "txt", "eml", "msg",
        "xlsx", "xls", "csv", "jpg", "jpeg", "png", "html"
    ]

    # Catégories de formats pour organisation
    FORMAT_CATEGORIES = {
        "documents": ["pdf", "docx", "doc", "txt", "html"],
        "emails": ["eml", "msg"],
        "spreadsheets": ["xlsx", "xls", "csv"],
        "images": ["jpg", "jpeg", "png"]
    }

    @classmethod
    def is_format_supported(cls, extension: str) -> bool:
        """
        Vérifie si un format de fichier est supporté

        Args:
            extension: Extension du fichier (avec ou sans point)

        Returns:
            bool: True si le format est supporté
        """
        # Normaliser l'extension
        extension = extension.lower().strip().lstrip('.')

        is_supported = extension in cls.SUPPORTED_FORMATS

        return is_supported

    @classmethod
    def get_format_category(cls, extension: str) -> Optional[str]:
        """
        Retourne la catégorie d'un format

        Args:
            extension: Extension du fichier

        Returns:
            str: Catégorie du format ou None
        """
        extension = extension.lower().strip().lstrip('.')

        for category, formats in cls.FORMAT_CATEGORIES.items():
            if extension in formats:
                return category

        return None

    @classmethod
    def get_supported_formats(cls) -> List[str]:
        """
        Retourne la liste des formats supportés

        Returns:
            List[str]: Liste des formats supportés
        """
        return cls.SUPPORTED_FORMATS.copy()

    @classmethod
    def get_formats_by_category(cls, category: str) -> List[str]:
        """
        Retourne les formats d'une catégorie

        Args:
            category: Catégorie de formats

        Returns:
            List[str]: Formats de la catégorie
        """
        return cls.FORMAT_CATEGORIES.get(category, [])


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
            if not FileFormatManager.is_format_supported(extension):

                return None

            # Obtenir les statistiques du fichier
            stat = file_path.stat()

            # Déterminer le type MIME
            mime_type = FileInfoExtractor._get_mime_type(file_path, extension)

            # Obtenir la catégorie du format
            format_category = FileFormatManager.get_format_category(extension)

            file_info = {
                "name": file_path.name,
                "path": str(file_path),
                "size": stat.st_size,
                "mime_type": mime_type,
                "extension": extension,
                "format_category": format_category,
                "parent_directory": str(file_path.parent),
                "is_supported": True
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
        Détermine le type MIME d'un fichier

        Args:
            file_path: Chemin du fichier
            extension: Extension du fichier

        Returns:
            str: Type MIME
        """
        # Essayer de deviner le type MIME
        mime_type, _ = mimetypes.guess_type(str(file_path))

        if not mime_type:
            # Fallback basé sur l'extension
            mime_type = f"application/{extension}"

        return mime_type


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
