"""
File model and schemas for DocuSense AI
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Enum as SQLEnum, func, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from app.core.database import Base


class FileStatus(str, Enum):
    """File processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    UNSUPPORTED = "unsupported"


class File(Base):
    """File database model"""
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    path = Column(String(1000), unique=True, nullable=False, index=True)
    size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    status = Column(
        SQLEnum(FileStatus),
        default=FileStatus.PENDING,
        nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    extracted_text = Column(Text, nullable=True)
    analysis_result = Column(Text, nullable=True)
    # Additional analysis data like provider, model, cost, etc.
    analysis_metadata = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    is_selected = Column(Boolean, default=False)
    parent_directory = Column(String(1000), nullable=True, index=True)

    # Relationships - CORRECTION: Ajout des relations manquantes
    analyses = relationship(
        "Analysis",
        back_populates="file",
        lazy="dynamic",
        cascade="all, delete-orphan")

    def __repr__(self):
        return f"<File(id={
            self.id}, name='{
            self.name}', status='{
            self.status}')>"


class DirectoryStructure(Base):
    """Directory structure database model for virtual mirroring"""
    __tablename__ = "directory_structures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    path = Column(String(1000), unique=True, nullable=False, index=True)
    parent_path = Column(String(1000), nullable=True, index=True)
    is_directory = Column(Boolean, default=True)
    file_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<DirectoryStructure(id={
            self.id}, name='{
            self.name}', path='{
            self.path}')>"

# Pydantic schemas


class FileBase(BaseModel):
    name: str
    path: str
    size: int
    mime_type: str
    status: FileStatus = FileStatus.PENDING
    parent_directory: Optional[str] = None


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


# Forward reference resolution
DirectoryTreeResponse.model_rebuild()
