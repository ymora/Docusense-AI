"""
Models module for DocuSense AI
Contains all database models (SQLAlchemy)
"""

from app.core.database import Base, engine, get_db
from .file import File, FileStatus, DirectoryStructure

from .config import Config
from .analysis import Analysis, AnalysisStatus, AnalysisType
from .user import User, UserRole

__all__ = [
    "Base",
    "engine",
    "get_db",
    "File",
    "FileStatus",
    "DirectoryStructure",
    "Analysis",
    "AnalysisStatus",
    "AnalysisType",
    "User",
    "UserRole",
    # "QueuePriority",  # Supprimé - ordre chronologique uniquement
    "Config"
]
