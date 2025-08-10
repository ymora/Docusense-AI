"""
File schemas for DocuSense AI
Contains all Pydantic schemas for file-related API requests and responses
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from ..models.file import FileStatus


class FileBase(BaseModel):
    name: str
    path: str
    size: int
    mime_type: str
    status: FileStatus = FileStatus.PENDING
    parent_directory: Optional[str] = None
    file_created_at: Optional[datetime] = None
    file_modified_at: Optional[datetime] = None
    file_accessed_at: Optional[datetime] = None


class FileCreate(FileBase):
    pass


class FileUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[FileStatus] = None
    extracted_text: Optional[str] = None
    analysis_result: Optional[str] = None
    analysis_metadata: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    is_selected: Optional[bool] = None


class FileResponse(FileBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    extracted_text: Optional[str] = None
    analysis_result: Optional[str] = None
    analysis_metadata: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    is_selected: bool = False
    file_created_at: Optional[datetime] = None
    file_modified_at: Optional[datetime] = None
    file_accessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    files: List[FileResponse]
    total: int
    limit: int
    offset: int


class FileStatusUpdate(BaseModel):
    status: FileStatus
    error_message: Optional[str] = None


class DirectoryTreeResponse(BaseModel):
    name: str
    path: str
    is_directory: bool
    file_count: int  # nombre de fichiers directs
    folder_count: int  # nombre de sous-dossiers directs
    children: List['DirectoryTreeResponse'] = []
    files: List[FileResponse] = []

    class Config:
        from_attributes = True
