# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/validation.py
# Fonctions extraites: 5
# Lignes totales extraites: 154
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: validate_required_fields
# Lignes originales: 48-71
# =============================================================================

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


# =============================================================================
# FONCTION: validate_string_length
# Lignes originales: 74-118
# =============================================================================

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


# =============================================================================
# FONCTION: validate_integer_range
# Lignes originales: 121-165
# =============================================================================

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


# =============================================================================
# FONCTION: log_validation_result
# Lignes originales: 198-216
# =============================================================================

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


# =============================================================================
# FONCTION: handle_exception
# Lignes originales: 219-239
# =============================================================================

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

