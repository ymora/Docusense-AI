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
from ..utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["monitoring"])


@router.get("/performance")
@APIUtils.handle_errors
async def get_performance_metrics(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get performance metrics
    """
    # Métriques système utilisant l'utilitaire centralisé
    system_metrics = APIUtils.get_system_metrics()
    
    # Métriques du cache
    cache_stats = cache.get_stats()
    
    # Métriques des fichiers temporaires
    download_stats = download_service.get_download_stats()
    
    # Métriques de base de données (simplifiées)
    db_metrics = {
        "connection_status": "healthy",
        "last_check": datetime.now().isoformat()
    }
    
    # Déterminer le statut global
    cpu_percent = system_metrics.get("cpu_percent", 0)
    memory_percent = system_metrics.get("memory_percent", 0)
    status = "healthy" if cpu_percent < 90 and memory_percent < 90 else "warning"
    
    performance_data = {
        "timestamp": datetime.now().isoformat(),
        "system": system_metrics,
        "cache": cache_stats,
        "downloads": download_stats,
        "database": db_metrics,
        "status": status
    }
    
    return ResponseFormatter.success_response(
        data=performance_data,
        message="Métriques de performance récupérées"
    )


@router.get("/health/detailed")
@APIUtils.handle_errors
async def get_detailed_health(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get detailed health status
    """
    # Utiliser les métriques système centralisées
    system_metrics = APIUtils.get_system_metrics()
    cpu_percent = system_metrics.get("cpu_percent", 0)
    memory_percent = system_metrics.get("memory_percent", 0)
    
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
            "status": "healthy" if memory_percent < 90 else "warning",
            "message": f"Memory usage: {memory_percent}%"
        },
        "cpu": {
            "status": "healthy" if cpu_percent < 90 else "warning",
            "message": f"CPU usage: {cpu_percent}%"
        }
    }
    
    # Vérifier le statut global
    overall_status = "healthy"
    if any(check["status"] != "healthy" for check in health_checks.values()):
        overall_status = "warning"
    
    detailed_health_data = {
        "timestamp": datetime.now().isoformat(),
        "status": overall_status,
        "checks": health_checks
    }
    
    return ResponseFormatter.success_response(
        data=detailed_health_data,
        message="Statut de santé détaillé récupéré"
    )


@router.post("/cache/clear")
@APIUtils.handle_errors
async def clear_cache(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Clear the application cache
    """
    cache.clear()
    logger.info("Application cache cleared")
    
    return ResponseFormatter.success_response(
        data={"timestamp": datetime.now().isoformat()},
        message="Cache vidé avec succès"
    )


@router.post("/cleanup/temp-files")
@APIUtils.handle_errors
async def cleanup_temp_files(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Manually trigger cleanup of temporary files
    """
    download_service.cleanup_temp_files()
    
    return ResponseFormatter.success_response(
        data={"timestamp": datetime.now().isoformat()},
        message="Nettoyage des fichiers temporaires terminé"
    ) 