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


# FileValidator a été déplacé vers core/file_validation.py pour éviter les redondances
# Utilisez FileValidator depuis core/file_validation.py


class DataValidator:
    """
    Validateur de données centralisé
    """

    @staticmethod
    def validate_string(value: Any, min_length: int = 0, max_length: int = None) -> ValidationResult:
        """Valide une chaîne de caractères"""
        errors = []
        warnings = []
        
        if not isinstance(value, str):
            errors.append(ValidationError(
                field="value",
                message="La valeur doit être une chaîne de caractères",
                code="INVALID_TYPE",
                value=value
            ))
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings)
        
        if len(value) < min_length:
            errors.append(ValidationError(
                field="value",
                message=f"La chaîne doit contenir au moins {min_length} caractères",
                code="TOO_SHORT",
                value=value
            ))
        
        if max_length and len(value) > max_length:
            errors.append(ValidationError(
                field="value",
                message=f"La chaîne ne doit pas dépasser {max_length} caractères",
                code="TOO_LONG",
                value=value
            ))
        
        return ValidationResult(is_valid=len(errors) == 0, errors=errors, warnings=warnings)

    @staticmethod
    def validate_integer(value: Any, min_value: int = None, max_value: int = None) -> ValidationResult:
        """Valide un entier"""
        errors = []
        warnings = []
        
        try:
            int_value = int(value)
        except (ValueError, TypeError):
            errors.append(ValidationError(
                field="value",
                message="La valeur doit être un entier",
                code="INVALID_TYPE",
                value=value
            ))
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings)
        
        if min_value is not None and int_value < min_value:
            errors.append(ValidationError(
                field="value",
                message=f"La valeur doit être supérieure ou égale à {min_value}",
                code="TOO_SMALL",
                value=int_value
            ))
        
        if max_value is not None and int_value > max_value:
            errors.append(ValidationError(
                field="value",
                message=f"La valeur doit être inférieure ou égale à {max_value}",
                code="TOO_LARGE",
                value=int_value
            ))
        
        return ValidationResult(is_valid=len(errors) == 0, errors=errors, warnings=warnings)

    @staticmethod
    def validate_path(value: Any, must_exist: bool = False) -> ValidationResult:
        """Valide un chemin de fichier"""
        errors = []
        warnings = []
        
        try:
            path = Path(value)
        except Exception:
            errors.append(ValidationError(
                field="value",
                message="Le chemin n'est pas valide",
                code="INVALID_PATH",
                value=value
            ))
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings)
        
        if must_exist and not path.exists():
            errors.append(ValidationError(
                field="value",
                message="Le chemin n'existe pas",
                code="PATH_NOT_FOUND",
                value=str(path)
            ))
        
        return ValidationResult(is_valid=len(errors) == 0, errors=errors, warnings=warnings)


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
    def log_validation_errors(errors: List[ValidationError], context: str = ""):
        """Log les erreurs de validation"""
        if errors:
            error_messages = [f"{error.field}: {error.message}" for error in errors]
            logger.error(f"Validation errors {context}: {'; '.join(error_messages)}")

    @staticmethod
    def create_validation_error(field: str, message: str, code: str, value: Any = None) -> ValidationError:
        """Crée une erreur de validation"""
        return ValidationError(field=field, message=message, code=code, value=value)
