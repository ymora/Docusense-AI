"""
Utilitaires centralisés pour la validation et la gestion des erreurs
"""

import logging
from typing import Any, Dict, List, Optional, Union
from pathlib import Path
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ValidationError:
    """
    Erreur de validation
    """
    field: str
    message: str
    code: str
    value: Any = None


@dataclass
class ValidationResult:
    """
    Résultat de validation
    """
    is_valid: bool
    errors: List[ValidationError]
    warnings: List[str] = None

    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []


class FileValidator:
    """
    Validateur de fichiers centralisé
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

    @classmethod
    def validate_file_path(
            cls, file_path: Union[str, Path]) -> ValidationResult:
        """
        Valide un chemin de fichier

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

            # Vérifier les permissions de lecture
            if not path.is_readable():
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
            errors.append(ValidationError(
                field="path",
                message=f"Erreur lors de la validation du chemin: {str(e)}",
                code="VALIDATION_ERROR",
                value=str(file_path)
            ))
            return ValidationResult(
                is_valid=False,
                errors=errors,
                warnings=warnings)

    @classmethod
    def validate_directory_path(
            cls, dir_path: Union[str, Path]) -> ValidationResult:
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

            # Vérifier les permissions de lecture
            if not path.is_readable():
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
            errors.append(ValidationError(
                field="path",
                message=f"Erreur lors de la validation du chemin: {str(e)}",
                code="VALIDATION_ERROR",
                value=str(dir_path)
            ))
            return ValidationResult(
                is_valid=False,
                errors=errors,
                warnings=warnings)


class DataValidator:
    """
    Validateur de données centralisé
    """

    @staticmethod
    def validate_required_fields(
            data: Dict[str, Any], required_fields: List[str]) -> ValidationResult:
        """
        Valide que tous les champs requis sont présents

        Args:
            data: Données à valider
            required_fields: Liste des champs requis

        Returns:
            ValidationResult: Résultat de la validation
        """
        errors = []

        for field in required_fields:
            if field not in data or data[field] is None:
                errors.append(ValidationError(
                    field=field,
                    message=f"Le champ '{field}' est requis",
                    code="MISSING_REQUIRED_FIELD",
                    value=None
                ))

        return ValidationResult(is_valid=len(errors) == 0, errors=errors)

    @staticmethod
    def validate_string_length(
            value: str,
            field_name: str,
            min_length: int = 0,
            max_length: Optional[int] = None) -> ValidationResult:
        """
        Valide la longueur d'une chaîne

        Args:
            value: Valeur à valider
            field_name: Nom du champ
            min_length: Longueur minimale
            max_length: Longueur maximale

        Returns:
            ValidationResult: Résultat de la validation
        """
        errors = []

        if not isinstance(value, str):
            errors.append(
                ValidationError(
                    field=field_name,
                    message=f"Le champ '{field_name}' doit être une chaîne de caractères",
                    code="INVALID_TYPE",
                    value=value))
            return ValidationResult(is_valid=False, errors=errors)

        if len(value) < min_length:
            errors.append(
                ValidationError(
                    field=field_name,
                    message=f"Le champ '{field_name}' doit contenir au moins {min_length} caractères",
                    code="TOO_SHORT",
                    value=value))

        if max_length and len(value) > max_length:
            errors.append(
                ValidationError(
                    field=field_name,
                    message=f"Le champ '{field_name}' ne peut pas dépasser {max_length} caractères",
                    code="TOO_LONG",
                    value=value))

        return ValidationResult(is_valid=len(errors) == 0, errors=errors)

    @staticmethod
    def validate_integer_range(
            value: int,
            field_name: str,
            min_value: Optional[int] = None,
            max_value: Optional[int] = None) -> ValidationResult:
        """
        Valide qu'un entier est dans une plage donnée

        Args:
            value: Valeur à valider
            field_name: Nom du champ
            min_value: Valeur minimale
            max_value: Valeur maximale

        Returns:
            ValidationResult: Résultat de la validation
        """
        errors = []

        if not isinstance(value, int):
            errors.append(ValidationError(
                field=field_name,
                message=f"Le champ '{field_name}' doit être un entier",
                code="INVALID_TYPE",
                value=value
            ))
            return ValidationResult(is_valid=False, errors=errors)

        if min_value is not None and value < min_value:
            errors.append(
                ValidationError(
                    field=field_name,
                    message=f"Le champ '{field_name}' doit être supérieur ou égal à {min_value}",
                    code="TOO_SMALL",
                    value=value))

        if max_value is not None and value > max_value:
            errors.append(
                ValidationError(
                    field=field_name,
                    message=f"Le champ '{field_name}' doit être inférieur ou égal à {max_value}",
                    code="TOO_LARGE",
                    value=value))

        return ValidationResult(is_valid=len(errors) == 0, errors=errors)


class ErrorHandler:
    """
    Gestionnaire d'erreurs centralisé
    """

    @staticmethod
    def format_validation_errors(errors: List[ValidationError]) -> str:
        """
        Formate les erreurs de validation en message lisible

        Args:
            errors: Liste des erreurs

        Returns:
            str: Message formaté
        """
        if not errors:
            return "Aucune erreur"

        error_messages = []
        for error in errors:
            if error.value is not None:
                error_messages.append(
                    f"{error.field}: {error.message} (valeur: {error.value})")
            else:
                error_messages.append(f"{error.field}: {error.message}")

        return "; ".join(error_messages)

    @staticmethod
    def log_validation_result(result: ValidationResult, context: str = ""):
        """
        Enregistre le résultat de validation dans les logs

        Args:
            result: Résultat de validation
            context: Contexte de la validation
        """
        if not result.is_valid:
            error_message = ErrorHandler.format_validation_errors(
                result.errors)
            logger.error(f"Validation échouée {context}: {error_message}")

        if result.warnings:
            for warning in result.warnings:
                logger.warning(f"Avertissement {context}: {warning}")

        if result.is_valid and not result.warnings:

    @staticmethod
    def handle_exception(e: Exception, context: str = "") -> Dict[str, Any]:
        """
        Gère une exception et retourne un dictionnaire d'erreur standardisé

        Args:
            e: Exception à gérer
            context: Contexte de l'erreur

        Returns:
            Dict: Dictionnaire d'erreur standardisé
        """
        error_info = {
            "error": True,
            "message": str(e),
            "type": type(e).__name__,
            "context": context
        }

        logger.error(f"Exception dans {context}: {str(e)}", exc_info=True)

        return error_info
