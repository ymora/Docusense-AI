"""
Configuration model and schemas for DocuSense AI
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.core.database import Base


class Config(Base):
    """Configuration database model"""
    __tablename__ = "configs"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), nullable=False, unique=True, index=True)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    is_encrypted = Column(Boolean, default=False)
    # ai, ui, system, etc.
    category = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Config(id={
            self.id}, key='{
            self.key}', category='{
            self.category}')>"

# Pydantic schemas


class ConfigBase(BaseModel):
    """Base config schema"""
    key: str = Field(..., description="Configuration key")
    value: str = Field(..., description="Configuration value")
    description: Optional[str] = Field(
        None, description="Configuration description")
    is_encrypted: bool = Field(
        False, description="Whether the value is encrypted")
    category: str = Field(..., description="Configuration category")


class ConfigCreate(ConfigBase):
    """Schema for creating a config"""


class ConfigUpdate(BaseModel):
    """Schema for updating a config"""
    value: Optional[str] = None
    description: Optional[str] = None
    is_encrypted: Optional[bool] = None


class ConfigResponse(ConfigBase):
    """Schema for config response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConfigListResponse(BaseModel):
    """Schema for config list response"""
    configs: list[ConfigResponse]
    total: int
    categories: list[str]

# AI Provider Configuration


class AIProviderConfig(BaseModel):
    """Schema for AI provider configuration"""
    provider: str = Field(..., description="AI provider name")
    api_key: Optional[str] = Field(None, description="API key (encrypted)")
    base_url: Optional[str] = Field(None, description="Base URL for API")
    model: str = Field(..., description="Default model")
    is_active: bool = Field(True, description="Whether provider is active")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens")
    temperature: Optional[float] = Field(
        0.7, description="Temperature setting")


class AIProvidersConfig(BaseModel):
    """Schema for all AI providers configuration"""
    openai: Optional[AIProviderConfig] = None
    claude: Optional[AIProviderConfig] = None
    mistral: Optional[AIProviderConfig] = None
    ollama: Optional[AIProviderConfig] = None

# UI Configuration


class UIConfig(BaseModel):
    """Schema for UI configuration"""
    theme: str = Field("dark", description="UI theme (dark/light)")
    language: str = Field("fr", description="UI language")
    sidebar_width: int = Field(320, description="Sidebar width in pixels")
    auto_refresh_interval: int = Field(
        10, description="Auto refresh interval in seconds")
    show_queue_panel: bool = Field(
        True, description="Show queue panel by default")

# System Configuration


class SystemConfig(BaseModel):
    """Schema for system configuration"""
    max_file_size: int = Field(
        100 * 1024 * 1024,
        description="Maximum file size in bytes")  # 100MB
    supported_formats: list[str] = Field(
        default=[
            "pdf",
            "docx",
            "doc",
            "txt",
            "eml",
            "msg",
            "xlsx",
            "xls",
            "csv",
            "jpg",
            "png"],
        description="Supported file formats")
    ocr_enabled: bool = Field(True, description="Enable OCR processing")
    cache_enabled: bool = Field(True, description="Enable caching")
    max_concurrent_analyses: int = Field(
        3, description="Maximum concurrent analyses")
    retry_attempts: int = Field(3, description="Number of retry attempts")
