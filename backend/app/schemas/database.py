"""
Schémas Pydantic pour l'API de gestion de base de données
"""

from pydantic import BaseModel
from typing import Dict, List, Optional, Any


class ConsistencyReport(BaseModel):
    valid_files: int
    invalid_statuses: int
    orphaned_files: int
    missing_mime_types: int
    issues: List[Dict[str, Any]] = []


class DatabaseStatusResponse(BaseModel):
    total_files: int
    files_by_status: Dict[str, int]
    total_analyses: int
    total_queue_items: int
    queue_by_status: Dict[str, int]
    consistency_report: ConsistencyReport


class CleanupResponse(BaseModel):
    success: bool
    message: str
    details: Optional[Dict[str, int]] = None


class BackupResponse(BaseModel):
    success: bool
    backup_name: str
    message: str


class BackupInfo(BaseModel):
    name: str
    size: int
    created_at: str


class BackupListResponse(BaseModel):
    backups: List[BackupInfo]


class FileInfo(BaseModel):
    id: int
    name: str
    path: str
    status: str
    mime_type: str
    size: int
    created_at: str
    updated_at: str


class FileListResponse(BaseModel):
    files: List[FileInfo]
    total: int
    limit: int
    offset: int


class AnalysisInfo(BaseModel):
    id: int
    file_id: int
    status: str
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None


class AnalysisListResponse(BaseModel):
    analyses: List[AnalysisInfo]
    total: int
    limit: int
    offset: int


class QueueItemInfo(BaseModel):
    id: int
    analysis_id: int
    status: str
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None


class QueueListResponse(BaseModel):
    queue_items: List[QueueItemInfo]
    total: int
    limit: int
    offset: int
