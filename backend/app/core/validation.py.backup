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
            logger.info(f"Validation réussie {context}")

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
