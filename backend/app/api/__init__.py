"""
API module for DocuSense AI
Contains all API routes and endpoints
"""

from .files import router as files_router
from .analysis import router as analysis_router
from .queue import router as queue_router
from .config import router as config_router
from .health import router as health_router
from .prompts import router as prompts_router
from .multimedia import router as multimedia_router
from .auth import router as auth_router
from .download import router as download_router
from .monitoring import router as monitoring_router
from .emails import router as emails_router
from .video_converter import router as video_converter_router

__all__ = [
    "files_router",
    "analysis_router",
    "queue_router",
    "config_router",
    "health_router",
    "prompts_router",
    "multimedia_router",
    "auth_router",
    "download_router",
    "monitoring_router",
    "emails_router",
    "video_converter_router"
]
