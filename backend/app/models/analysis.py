"""
Analysis model and schemas for DocuSense AI
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from app.core.database import Base


class AnalysisType(str, Enum):
    """Analysis types"""
    GENERAL = "general"
    SUMMARY = "summary"
    EXTRACTION = "extraction"
    COMPARISON = "comparison"
    CLASSIFICATION = "classification"
    OCR = "ocr"
    JURIDICAL = "juridical"
    TECHNICAL = "technical"
    ADMINISTRATIVE = "administrative"


class AnalysisStatus(str, Enum):
    """Analysis status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Analysis(Base):
    """Analysis database model"""
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    analysis_type = Column(SQLEnum(AnalysisType), nullable=False)
    status = Column(
        SQLEnum(AnalysisStatus),
        default=AnalysisStatus.PENDING,
        nullable=False)

    # AI Provider info
    # openai, claude, mistral, ollama
    provider = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)    # gpt-4, claude-3, etc.

    # Analysis data
    prompt = Column(Text, nullable=False)
    result = Column(Text, nullable=True)
    # Additional data like tokens used, etc.
    analysis_metadata = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

    # Relationships - CORRECTION: Ajout des relations manquantes
    file = relationship("File", back_populates="analyses", lazy="joined")
    queue_items = relationship(
        "QueueItem",
        back_populates="analysis",
        lazy="dynamic",
        cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Analysis(id={
            self.id}, file_id={
            self.file_id}, type='{
            self.analysis_type}', status='{
                self.status}')>"

# Pydantic schemas


class AnalysisBase(BaseModel):
    file_id: int
    analysis_type: AnalysisType
    provider: str
    model: str
    prompt: str


class AnalysisCreate(AnalysisBase):
    pass


class AnalysisUpdate(BaseModel):
    status: Optional[AnalysisStatus] = None
    result: Optional[str] = None
    analysis_metadata: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    retry_count: Optional[int] = None


class AnalysisResponse(AnalysisBase):
    id: int
    status: AnalysisStatus
    result: Optional[str] = None
    analysis_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0

    class Config:
        from_attributes = True


class AnalysisListResponse(BaseModel):
    analyses: List[AnalysisResponse]
    total: int
    limit: int
    offset: int


class BulkAnalysisRequest(BaseModel):
    file_ids: List[int]
    analysis_type: AnalysisType = AnalysisType.GENERAL
    provider: str = "openai"
    model: str = "gpt-4"
    custom_prompt: Optional[str] = None


class AnalysisComparisonRequest(BaseModel):
    file_ids: List[int]
    comparison_type: str = "similarity"
    provider: str = "openai"
    model: str = "gpt-4"
