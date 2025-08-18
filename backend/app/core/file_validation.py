"""
Validation des fichiers pour DocuSense AI
Support de tous les formats courants sans limite de taille
"""

import logging
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union, Any
import mimetypes
from dataclasses import dataclass

# Importer la configuration centralisée des formats
from .media_formats import (
    initialize_mime_types,
    get_supported_formats,
    is_supported_format,
    get_format_statistics
)

logger = logging.getLogger(__name__)

# Initialiser les types MIME avec la configuration centralisée
initialize_mime_types()


# Import des classes de validation centralisées
from .validation import ValidationError, ValidationResult


class FileValidator:
    """
    Service de validation des fichiers - Support de tous les formats courants
    Source unique de vérité pour la validation des fichiers
    """
    
    # Tailles maximales par type de fichier (en bytes)
    MAX_FILE_SIZES = {
        "pdf": 50 * 1024 * 1024,      # 50MB
        "docx": 20 * 1024 * 1024,     # 20MB
        "doc": 20 * 1024 * 1024,      # 20MB
        "txt": 10 * 1024 * 1024,      # 10MB
        "eml": 5 * 1024 * 1024,       # 5MB
        "msg": 5 * 1024 * 1024,       # 5MB
        "xlsx": 20 * 1024 * 1024,     # 20MB
        "xls": 20 * 1024 * 1024,      # 20MB
        "csv": 10 * 1024 * 1024,      # 10MB
        "jpg": 10 * 1024 * 1024,      # 10MB
        "jpeg": 10 * 1024 * 1024,     # 10MB
        "png": 10 * 1024 * 1024,      # 10MB
        "html": 5 * 1024 * 1024,      # 5MB
        "default": 50 * 1024 * 1024   # 50MB par défaut
    }
    
    # Formats supportés (utilise la configuration centralisée)
    SUPPORTED_FORMATS = get_supported_formats()
    
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
        elif mime_type.startswith('text/') or mime_type in cls.SUPPORTED_FORMATS.get('document', []):
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
        
        return mime_type in cls.SUPPORTED_FORMATS.get(file_type, [])
    
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
    def validate_file_path(cls, file_path: Union[str, Path]) -> ValidationResult:
        """
        Valide un chemin de fichier avec vérification de taille
        
        Args:
            file_path: Chemin du fichier
            
        Returns:
            ValidationResult: Résultat de la validation
        """
        errors = []
        warnings = []

        try:
            path = Path(file_path)

            # Vérifier que le chemin existe
            if not path.exists():
                errors.append(ValidationError(
                    field="path",
                    message="Le fichier n'existe pas",
                    code="FILE_NOT_FOUND",
                    value=str(file_path)
                ))
                return ValidationResult(
                    is_valid=False, errors=errors, warnings=warnings)

            # Vérifier que c'est bien un fichier
            if not path.is_file():
                errors.append(ValidationError(
                    field="path",
                    message="Le chemin ne correspond pas à un fichier",
                    code="NOT_A_FILE",
                    value=str(file_path)
                ))
                return ValidationResult(
                    is_valid=False, errors=errors, warnings=warnings)

            # Vérifier les permissions de lecture (compatible Windows/Linux)
            try:
                with open(path, 'rb') as f:
                    f.read(1)  # Essayer de lire 1 byte
            except (PermissionError, OSError):
                errors.append(ValidationError(
                    field="path",
                    message="Le fichier n'est pas accessible en lecture",
                    code="NOT_READABLE",
                    value=str(file_path)
                ))
                return ValidationResult(
                    is_valid=False, errors=errors, warnings=warnings)

            # Vérifier la taille du fichier
            file_size = path.stat().st_size
            extension = path.suffix.lower().lstrip('.')
            max_size = cls.MAX_FILE_SIZES.get(
                extension, cls.MAX_FILE_SIZES["default"])

            if file_size > max_size:
                errors.append(
                    ValidationError(
                        field="size",
                        message=f"Le fichier est trop volumineux ({file_size} bytes > {max_size} bytes)",
                        code="FILE_TOO_LARGE",
                        value=file_size))

            # Avertissement si le fichier est vide
            if file_size == 0:
                warnings.append("Le fichier est vide")

            return ValidationResult(
                is_valid=len(errors) == 0,
                errors=errors,
                warnings=warnings)

        except Exception as e:
            logger.error(f"Erreur lors de la validation du chemin {file_path}: {e}")
            errors.append(ValidationError(
                field="path",
                message=f"Erreur de validation: {str(e)}",
                code="VALIDATION_ERROR",
                value=str(file_path)
            ))
            return ValidationResult(
                is_valid=False, errors=errors, warnings=warnings)
    
    @classmethod
    def _get_mime_type_from_extension(cls, extension: str) -> Optional[str]:
        """
        Fallback pour déterminer le type MIME à partir de l'extension
        Utilise la configuration centralisée
        """
        from .media_formats import EXTENSION_TO_MIME
        return EXTENSION_TO_MIME.get(extension.lower(), None)
    
    @classmethod
    def get_all_supported_formats(cls) -> Dict[str, List[str]]:
        """
        Retourne tous les formats supportés
        """
        return cls.SUPPORTED_FORMATS.copy()
    
    @classmethod
    def get_format_statistics(cls) -> Dict[str, int]:
        """
        Retourne les statistiques des formats supportés
        """
        return get_format_statistics()
    
    @classmethod
    def validate_file_for_streaming(cls, file_path: Path) -> Tuple[bool, str]:
        """
        Valide un fichier pour le streaming (validation légère)
        
        Args:
            file_path: Chemin du fichier
            
        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """
        try:
            # Vérifier que le fichier existe
            if not file_path.exists():
                return False, "Fichier non trouvé"
            
            if not file_path.is_file():
                return False, "Le chemin ne correspond pas à un fichier"
            
            # Vérifier les permissions de lecture (compatible Windows/Linux)
            try:
                with open(file_path, 'rb') as f:
                    f.read(1)  # Essayer de lire 1 byte
            except (PermissionError, OSError):
                return False, "Le fichier n'est pas accessible en lecture"
            
            # Pour le streaming, accepter tous les fichiers accessibles
            return True, "Fichier valide pour le streaming"
            
        except Exception as e:
            logger.error(f"Erreur lors de la validation pour streaming du fichier {file_path}: {e}")
            return False, f"Erreur de validation: {str(e)}"
    
    @classmethod
    def get_mime_type(cls, file_path: Path) -> Tuple[str, str]:
        """
        Détermine le type MIME d'un fichier
        Utilise la méthode existante de FileInfoExtractor
        
        Args:
            file_path: Chemin du fichier
            
        Returns:
            Tuple[str, str]: (mime_type, encoding)
        """
        from .file_utils import FileInfoExtractor
        extension = file_path.suffix.lower().lstrip('.')
        mime_type = FileInfoExtractor._get_mime_type(file_path, extension)
        return mime_type, None
    
    @classmethod
    def validate_directory_path(cls, dir_path: Union[str, Path]) -> ValidationResult:
        """
        Valide un chemin de répertoire
        
        Args:
            dir_path: Chemin du répertoire
            
        Returns:
            ValidationResult: Résultat de la validation
        """
        errors = []
        warnings = []

        try:
            path = Path(dir_path)

            # Vérifier que le chemin existe
            if not path.exists():
                errors.append(ValidationError(
                    field="path",
                    message="Le répertoire n'existe pas",
                    code="DIRECTORY_NOT_FOUND",
                    value=str(dir_path)
                ))
                return ValidationResult(
                    is_valid=False, errors=errors, warnings=warnings)

            # Vérifier que c'est bien un répertoire
            if not path.is_dir():
                errors.append(ValidationError(
                    field="path",
                    message="Le chemin ne correspond pas à un répertoire",
                    code="NOT_A_DIRECTORY",
                    value=str(dir_path)
                ))
                return ValidationResult(
                    is_valid=False, errors=errors, warnings=warnings)

            # Vérifier les permissions de lecture (compatible Windows/Linux)
            try:
                import os
                os.listdir(path)  # Essayer de lister le contenu
            except (PermissionError, OSError):
                errors.append(ValidationError(
                    field="path",
                    message="Le répertoire n'est pas accessible en lecture",
                    code="NOT_READABLE",
                    value=str(dir_path)
                ))
                return ValidationResult(
                    is_valid=False, errors=errors, warnings=warnings)

            return ValidationResult(
                is_valid=len(errors) == 0,
                errors=errors,
                warnings=warnings)

        except Exception as e:
            logger.error(f"Erreur lors de la validation du répertoire {dir_path}: {e}")
            errors.append(ValidationError(
                field="path",
                message=f"Erreur de validation: {str(e)}",
                code="VALIDATION_ERROR",
                value=str(dir_path)
            ))
            return ValidationResult(
                is_valid=False, errors=errors, warnings=warnings)
    
    @classmethod
    def get_supported_formats_for_type(cls, file_type: str) -> List[str]:
        """
        Retourne les formats supportés pour un type de fichier
        """
        return cls.SUPPORTED_FORMATS.get(file_type, []) 