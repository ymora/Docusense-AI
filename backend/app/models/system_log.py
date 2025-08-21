"""
System logs model for security monitoring and audit trail
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

from app.core.database import Base


class LogLevel(str, Enum):
    """Log levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SECURITY = "security"


class SystemLog(Base):
    """System logs database model for security monitoring"""
    __tablename__ = "system_logs"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    level = Column(SQLEnum(LogLevel), nullable=False, index=True)
    source = Column(String(100), nullable=False, index=True)  # Component name
    
    # User context
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True, index=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    
    # Action details
    action = Column(String(200), nullable=False, index=True)
    details = Column(JSON, nullable=True)  # Flexible details storage
    
    # Security flags
    is_security_event = Column(Boolean, default=False, index=True)
    is_suspicious = Column(Boolean, default=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="system_logs")

    def __repr__(self):
        return f"<SystemLog(id={self.id}, level='{self.level}', action='{self.action}', user_id={self.user_id})>"


# Pydantic schemas

class SystemLogBase(BaseModel):
    level: LogLevel
    source: str
    action: str
    details: Optional[Dict[str, Any]] = None
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_security_event: Optional[bool] = False
    is_suspicious: Optional[bool] = False


class SystemLogCreate(SystemLogBase):
    pass


class SystemLogResponse(SystemLogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class SystemLogListResponse(BaseModel):
    logs: list[SystemLogResponse]
    total: int
    limit: int
    offset: int


class SecurityEventSummary(BaseModel):
    """Summary of security events for monitoring"""
    failed_logins: int
    unauthorized_access: int
    suspicious_activity: int
    total_events: int
    time_period: str
