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
from ..utils.api_utils import APIUtils, ResponseFormatter

router = APIRouter(tags=["health"])


@router.get("/")
@APIUtils.handle_errors
async def health_check():
    """
    Basic health check endpoint
    """
    try:
        health_data = {
            "status": "healthy",
            "app_name": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment
        }
        return ResponseFormatter.success_response(
            data=health_data,
            message="Vérification de santé de base"
        )
    except Exception as e:
        # Fallback simple en cas d'erreur
        return {
            "status": "healthy",
            "app_name": "DocuSense AI",
            "version": "1.0.0",
            "environment": "development",
            "error": str(e)
        }


@router.get("/health")
@APIUtils.handle_errors
async def health_check_alt():
    """
    Alternative health check endpoint (for frontend compatibility)
    """
    health_data = {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment
    }
    return ResponseFormatter.success_response(
        data=health_data,
        message="Vérification de santé de base"
    )


@router.get("/detailed")
@APIUtils.handle_errors
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

    # Get system information using centralized utility
    system_metrics = APIUtils.get_system_metrics()

    # Get process information
    process = psutil.Process(os.getpid())

    detailed_health_data = {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "system": system_metrics,
        "process": {
            "pid": process.pid,
            "memory_info": process.memory_info()._asdict(),
            "cpu_percent": process.cpu_percent(),
            "create_time": datetime.fromtimestamp(
                process.create_time(),
                tz=timezone.utc).isoformat()
        },
        "database": {
            "status": db_status,
            "url": settings.database_url.split("://")[0] + "://***"
        },
        "features": {
            "ocr_enabled": settings.ocr_enabled,
            "cache_enabled": settings.cache_enabled,
            "compression_enabled": settings.compression_enabled,
            "rate_limit_enabled": settings.rate_limit_enabled
        }
    }
    
    return ResponseFormatter.success_response(
        data=detailed_health_data,
        message="Vérification de santé détaillée"
    )


@router.get("/config")
@APIUtils.handle_errors
async def config_health_check(db: Session = Depends(get_db)):
    """
    Health check with configuration information
    """
    config_service = ConfigService(db)

    # Get configuration counts
    total_configs = len(config_service.get_all_configs())
    ai_providers = len(config_service.get_ai_providers())

    config_health_data = {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "configuration": {
            "total_configs": total_configs,
            "ai_providers": ai_providers,
            "database_url": settings.database_url.split("://")[0] + "://***",
            "max_file_size": settings.max_file_size,
            "max_concurrent_analyses": settings.max_concurrent_analyses
        }
    }
    
    return ResponseFormatter.success_response(
        data=config_health_data,
        message="Vérification de santé de la configuration"
    )
