"""
File model and schemas for DocuSense AI
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Enum as SQLEnum, func, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum

from app.core.database import Base


class FileStatus(str, Enum):
    """File processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    UNSUPPORTED = "unsupported"
    NONE = "none"


class File(Base):
    """File database model"""
    __tablename__ = "files"
    __table_args__ = {'extend_existing': True}

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
    # Dates du fichier lui-même (pas de la base de données)
    file_created_at = Column(DateTime(timezone=True), nullable=True)
    file_modified_at = Column(DateTime(timezone=True), nullable=True)
    file_accessed_at = Column(DateTime(timezone=True), nullable=True)

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
    __table_args__ = {'extend_existing': True}

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

# Les schémas Pydantic ont été déplacés vers schemas/file.py
