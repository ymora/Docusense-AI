"""
Queue model and schemas for DocuSense AI
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Enum, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from enum import Enum as PyEnum
from datetime import datetime

from app.core.database import Base


class QueueStatus(str, PyEnum):
    """Queue status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


# Suppression de QueuePriority - on utilise l'ordre chronologique
    URGENT = "urgent"


class QueueItem(Base):
    """Queue item database model"""
    __tablename__ = "queue_items"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    status = Column(
        Enum(QueueStatus),
        default=QueueStatus.PENDING,
        nullable=False)
    # Suppression de la colonne priority - ordre chronologique uniquement

    # Progress tracking
    progress = Column(Float, default=0.0)  # 0.0 to 1.0
    current_step = Column(String(100), nullable=True)
    total_steps = Column(Integer, default=1)

    # Timing
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    estimated_completion = Column(DateTime(timezone=True), nullable=True)

    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)

    # Queue metadata
    # Additional queue-specific data
    queue_metadata = Column(JSON, nullable=True)

    # Relationship
    analysis = relationship("Analysis", back_populates="queue_items")

    def __repr__(self):
        return f"<QueueItem(id={
            self.id}, analysis_id={
            self.analysis_id}, status='{
            self.status}', progress={
                self.progress})>"

# Pydantic schemas


class QueueItemBase(BaseModel):
    """Base queue item schema"""
    analysis_id: int = Field(..., description="Analysis ID")


class QueueItemCreate(QueueItemBase):
    """Schema for creating a queue item"""


class QueueItemUpdate(BaseModel):
    """Schema for updating a queue item"""
    status: Optional[QueueStatus] = None
    progress: Optional[float] = None
    current_step: Optional[str] = None
    total_steps: Optional[int] = None
    error_message: Optional[str] = None
    retry_count: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None
    queue_metadata: Optional[Dict[str, Any]] = None


class QueueItemResponse(QueueItemBase):
    """Schema for queue item response"""
    id: int
    status: QueueStatus
    progress: float
    current_step: Optional[str] = None
    total_steps: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int
    max_retries: int
    queue_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class QueueListResponse(BaseModel):
    """Schema for queue list response"""
    items: list[QueueItemResponse]
    total: int
    status_counts: dict[str, int]
    processing_count: int
    pending_count: int


class QueueStatusResponse(BaseModel):
    """Schema for queue status response"""
    total_items: int
    processing_items: int
    pending_items: int
    completed_items: int
    failed_items: int
    average_wait_time: Optional[float] = None  # in seconds
    estimated_completion_time: Optional[datetime] = None


class QueueControlRequest(BaseModel):
    """Schema for queue control requests"""
    action: str = Field(..., description="Action: clear, retry")
    item_ids: Optional[list[int]] = Field(
        None, description="Specific item IDs (optional)")
    all_items: bool = Field(False, description="Apply to all items")
