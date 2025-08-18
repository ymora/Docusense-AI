# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/core/types.py
# Fonctions extraites: 1
# Lignes totales extraites: 7
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: to_dict
# Lignes originales: 97-103
# =============================================================================

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "data": self.data,
            "message": self.message,
            "error": self.error
        }

