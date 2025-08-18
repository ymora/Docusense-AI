# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/config.py
# Fonctions extraites: 2
# Lignes totales extraites: 8
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: parse_cors_origins
# Lignes originales: 109-112
# =============================================================================

    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v


# =============================================================================
# FONCTION: validate_secret_key
# Lignes originales: 115-118
# =============================================================================

    def validate_secret_key(cls, v):
        if len(v) < 32:
            raise ValueError('Secret key must be at least 32 characters long')
        return v

