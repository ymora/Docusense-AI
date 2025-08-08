"""
Core module for DocuSense AI
Contains configuration, security, and core utilities
"""

from .config import settings
from .database import get_db, create_tables
from .security import SecurityManager
from .logging import setup_logging

__all__ = [
    "settings",
    "get_db",
    "create_tables",
    "SecurityManager",
    "setup_logging"
]
