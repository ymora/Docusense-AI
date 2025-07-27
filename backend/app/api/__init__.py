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

__all__ = [
    "files_router",
    "analysis_router",
    "queue_router",
    "config_router",
    "health_router",
    "prompts_router"
]
