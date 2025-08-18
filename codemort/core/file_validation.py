# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/file_validation.py
# Fonctions extraites: 2
# Lignes totales extraites: 71
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: validate_directory_path
# Lignes originales: 219-284
# =============================================================================

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


# =============================================================================
# FONCTION: get_supported_formats_for_type
# Lignes originales: 296-300
# =============================================================================

    def get_supported_formats_for_type(cls, file_type: str) -> List[str]:
        """
        Retourne les formats supportés pour un type de fichier
        """
        return cls.SUPPORTED_FORMATS.get(file_type, [])

