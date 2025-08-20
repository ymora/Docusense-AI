"""
Common types for Docusense AI
Centralized type definitions to reduce duplication
"""

from typing import Dict, Any, Optional, List, Union, Tuple, Callable
from enum import Enum


# Basic type aliases
ServiceResponse = Dict[str, Any]
FileData = Dict[str, Any]
ConfigData = Dict[str, Any]
QueueItem = Dict[str, Any]
QueueData = Dict[str, Any]
PromptData = Dict[str, Any]
AnalysisData = Dict[str, Any]
AnalysisResult = Dict[str, Any]
ProviderConfig = Dict[str, Any]
AIProviderConfig = Dict[str, Any]
AIAnalysisResult = Dict[str, Any]
EmailData = Dict[str, Any]
AttachmentData = Dict[str, Any]
TextExtractionResult = Dict[str, Any]


# Enums for common values
# FileStatus moved to models/file.py to avoid conflicts


class AnalysisType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    DOCUMENT = "document"
    EMAIL = "email"


class ProviderType(str, Enum):
    OPENAI = "openai"
    CLAUDE = "claude"
    MISTRAL = "mistral"
    OLLAMA = "ollama"


# Complex type definitions
from ..models.file import FileStatus

class FileInfo:
    """File information structure"""
    def __init__(self, 
                 id: int,
                 name: str,
                 path: str,
                 size: int,
                 mime_type: str,
                 status: FileStatus = FileStatus.PENDING):
        self.id = id
        self.name = name
        self.path = path
        self.size = size
        self.mime_type = mime_type
        self.status = status


class ServiceConfig:
    """Service configuration structure"""
    def __init__(self,
                 name: str,
                 enabled: bool = True,
                 config: Dict[str, Any] = None):
        self.name = name
        self.enabled = enabled
        self.config = config or {}


# Type hints for function signatures
ServiceOperation = Callable[..., Any]
ErrorHandler = Callable[[Exception], None]
LogHandler = Callable[[str, str], None]


# Generic response types
class APIResponse:
    """Standard API response structure"""
    def __init__(self,
                 success: bool,
                 data: Any = None,
                 message: str = "",
                 error: str = None):
        self.success = success
        self.data = data
        self.message = message
        self.error = error
    


# Database model types
class DatabaseModel:
    """Base class for database models"""


# Validation types
ValidationResult = Tuple[bool, Optional[str]]  # (is_valid, error_message)
ValidationRule = Callable[[Any], ValidationResult]


# Cache types
CacheKey = Union[str, int]
CacheValue = Any
CacheEntry = Tuple[CacheValue, float]  # (value, timestamp)


# Queue types
QueueStatus = str
QueueItemStatus = str


# File processing types
ProcessingResult = Dict[str, Any]
ProcessingOptions = Dict[str, Any]
ProcessingCallback = Callable[[ProcessingResult], None]


# Configuration types
ConfigSection = Dict[str, Any]
ConfigValidator = Callable[[ConfigSection], ValidationResult]


# Logging types
LogLevel = str
LogContext = Dict[str, Any]
LogFormatter = Callable[[str, LogContext], str] 