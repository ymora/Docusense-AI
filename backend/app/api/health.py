"""
Health check endpoints for DocuSense AI
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import psutil
import os

from ..core.database import get_db
from ..core.config import settings
from ..services.config_service import ConfigService

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Basic health check endpoint
    """
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment
    }


@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """
    Detailed health check with system information
    """
    try:
        # Test database connection
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"

    # Get system information
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    # Get process information
    process = psutil.Process(os.getpid())

    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": datetime.now(
            timezone.utc).isoformat(),
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available": memory.available,
            "memory_total": memory.total,
            "disk_percent": disk.percent,
            "disk_free": disk.free,
            "disk_total": disk.total},
        "process": {
            "pid": process.pid,
                "memory_info": process.memory_info()._asdict(),
                "cpu_percent": process.cpu_percent(),
                "create_time": datetime.fromtimestamp(
                    process.create_time(),
                    tz=timezone.utc).isoformat()},
        "database": {
            "status": db_status,
            "url": settings.database_url.split("://")[0] +
            "://***"},
        "features": {
            "ocr_enabled": settings.ocr_enabled,
            "cache_enabled": settings.cache_enabled,
            "compression_enabled": settings.compression_enabled,
            "rate_limit_enabled": settings.rate_limit_enabled}}


@router.get("/health/config")
async def config_health_check(db: Session = Depends(get_db)):
    """
    Health check with configuration information
    """
    config_service = ConfigService(db)

    try:
        # Get configuration counts
        total_configs = len(config_service.get_all_configs())
        ai_providers = len(config_service.get_ai_providers())

        return {
            "status": "healthy",
            "app_name": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
            "timestamp": datetime.now(
                timezone.utc).isoformat(),
            "configuration": {
                "total_configs": total_configs,
                "ai_providers": ai_providers,
                "database_url": settings.database_url.split("://")[0] +
                "://***",
                "max_file_size": settings.max_file_size,
                "max_concurrent_analyses": settings.max_concurrent_analyses}}
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
