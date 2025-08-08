"""
Models module for DocuSense AI
Contains all database models and Pydantic schemas
"""

from app.core.database import Base, engine, get_db
from .file import File, FileStatus, FileCreate, FileUpdate, FileResponse, FileListResponse, FileStatusUpdate, DirectoryStructure, DirectoryTreeResponse
from .queue import QueueItem, QueueStatus, QueuePriority, QueueItemCreate, QueueItemUpdate, QueueItemResponse, QueueControlRequest
from .config import Config, ConfigCreate, ConfigUpdate, ConfigResponse
from .analysis import Analysis, AnalysisStatus, AnalysisType, AnalysisCreate, AnalysisUpdate, AnalysisResponse, BulkAnalysisRequest, AnalysisComparisonRequest

__all__ = [
    "Base",
    "engine",
    "get_db",
    "File",
    "FileStatus",
    "FileCreate",
    "FileUpdate",
    "FileResponse",
    "FileListResponse",
    "FileStatusUpdate",
    "DirectoryStructure",
    "DirectoryTreeResponse",
    "Analysis",
    "AnalysisStatus",
    "AnalysisType",
    "AnalysisCreate",
    "AnalysisUpdate",
    "AnalysisResponse",
    "BulkAnalysisRequest",
    "AnalysisComparisonRequest",
    "QueueItem",
    "QueueStatus",
    "QueuePriority",
    "QueueItemCreate",
    "QueueItemUpdate",
    "QueueItemResponse",
    "QueueControlRequest",
    "Config",
    "ConfigCreate",
    "ConfigUpdate",
    "ConfigResponse"
]
