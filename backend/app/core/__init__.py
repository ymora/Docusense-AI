"""
Core module for DocuSense AI
Contains configuration, security, and core utilities
"""

from .config import settings
from .database import get_db
# Suppression de l'import SecurityManager - consolidation vers le système JWT
from .logging import setup_logging

__all__ = [
    "settings",
    "get_db",
    # "SecurityManager",  # Supprimé - consolidation vers le système JWT
    "setup_logging"
]
