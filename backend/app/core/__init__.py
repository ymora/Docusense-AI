"""
Core module for DocuSense AI
Contains configuration, security, and core utilities
"""

from .config import settings
from .database import get_db, create_tables
from .security import get_current_user, create_access_token, verify_password
from .logging import setup_logging

__all__ = [
    "settings",
    "get_db",
    "create_tables",
    "get_current_user",
    "create_access_token",
    "verify_password",
    "setup_logging"
]
