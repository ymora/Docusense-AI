# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/media_formats.py
# Fonctions extraites: 3
# Lignes totales extraites: 30
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: is_supported_format
# Lignes originales: 360-365
# =============================================================================

def is_supported_format(filename: str) -> bool:
    """Vérifie si le format du fichier est supporté"""
    # Utiliser FileValidator pour la cohérence
    from .file_validation import FileValidator
    file_type = FileValidator.get_file_type_by_extension(filename)
    return file_type in ['image', 'audio', 'video', 'document']


# =============================================================================
# FONCTION: get_extensions_by_type
# Lignes originales: 367-378
# =============================================================================

def get_extensions_by_type(file_type: str) -> Set[str]:
    """Retourne les extensions pour un type de fichier donné"""
    if file_type == 'image':
        return IMAGE_EXTENSIONS
    elif file_type == 'audio':
        return AUDIO_EXTENSIONS
    elif file_type == 'video':
        return VIDEO_EXTENSIONS
    elif file_type == 'document':
        return DOCUMENT_EXTENSIONS
    else:
        return set()


# =============================================================================
# FONCTION: get_mime_types_by_type
# Lignes originales: 380-391
# =============================================================================

def get_mime_types_by_type(file_type: str) -> List[str]:
    """Retourne les types MIME pour un type de fichier donné"""
    if file_type == 'image':
        return IMAGE_MIME_TYPES
    elif file_type == 'audio':
        return AUDIO_MIME_TYPES
    elif file_type == 'video':
        return VIDEO_MIME_TYPES
    elif file_type == 'document':
        return DOCUMENT_MIME_TYPES
    else:
        return []

