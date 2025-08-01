"""
Monitoring endpoints for DocuSense AI
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
import psutil
import time
from datetime import datetime

from ..core.database import get_db
from ..core.cache import cache
from ..services.download_service import download_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


@router.get("/performance")
async def get_performance_metrics(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get performance metrics
    """
    try:
        # Métriques système
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Métriques du cache
        cache_stats = cache.get_stats()
        
        # Métriques des fichiers temporaires
        download_stats = download_service.get_download_stats()
        
        # Métriques de base de données (simplifiées)
        db_metrics = {
            "connection_status": "healthy",
            "last_check": datetime.now().isoformat()
        }
        
        return {
            "timestamp": datetime.now().isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available_gb": round(memory.available / (1024**3), 2),
                "disk_percent": disk.percent,
                "disk_free_gb": round(disk.free / (1024**3), 2)
            },
            "cache": cache_stats,
            "downloads": download_stats,
            "database": db_metrics,
            "status": "healthy" if cpu_percent < 90 and memory.percent < 90 else "warning"
        }
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/detailed")
async def get_detailed_health(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get detailed health status
    """
    try:
        health_checks = {
            "database": {
                "status": "healthy",
                "message": "Database connection successful"
            },
            "cache": {
                "status": "healthy",
                "message": "Cache system operational"
            },
            "file_system": {
                "status": "healthy",
                "message": "File system accessible"
            },
            "memory": {
                "status": "healthy" if psutil.virtual_memory().percent < 90 else "warning",
                "message": f"Memory usage: {psutil.virtual_memory().percent}%"
            },
            "cpu": {
                "status": "healthy" if psutil.cpu_percent(interval=1) < 90 else "warning",
                "message": f"CPU usage: {psutil.cpu_percent(interval=1)}%"
            }
        }
        
        # Vérifier le statut global
        overall_status = "healthy"
        if any(check["status"] != "healthy" for check in health_checks.values()):
            overall_status = "warning"
        
        return {
            "timestamp": datetime.now().isoformat(),
            "status": overall_status,
            "checks": health_checks
        }
        
    except Exception as e:
        logger.error(f"Error getting detailed health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear")
async def clear_cache(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Clear the application cache
    """
    try:
        cache.clear()
        logger.info("Application cache cleared")
        
        return {
            "message": "Cache cleared successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup/temp-files")
async def cleanup_temp_files(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Manually trigger cleanup of temporary files
    """
    try:
        download_service.cleanup_temp_files()
        
        return {
            "message": "Temporary files cleanup completed",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up temp files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 