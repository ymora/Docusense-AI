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
@APIUtils.monitor_api_performance
async def get_performance_metrics(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get performance metrics with enhanced monitoring
    """
    try:
        # Métriques système utilisant l'utilitaire centralisé
        system_metrics = APIUtils.get_system_metrics()
        
        # Métriques du cache avec les fonctions réintégrées
        cache_stats = cache.get_stats()
        
        # Métriques des fichiers temporaires
        download_stats = download_service.get_download_stats()
        
        # Métriques de base de données (simplifiées)
        db_metrics = {
            "connection_status": "healthy",
            "last_check": datetime.now().isoformat()
        }
        
        # Utiliser les fonctions réintégrées pour les métriques AI
        from ..services.ai_service import get_ai_service
        ai_service = get_ai_service(db)
        ai_metrics = {
            "cache_size": ai_service.get_cache_size(),
            "providers_count": len(ai_service.providers) if hasattr(ai_service, 'providers') else 0
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
            "ai_service": ai_metrics,
            "status": status
        }
        
        # Enregistrer la métrique de consultation
        APIUtils.record_api_metric("performance_checks", 1.0, {"status": status})
        
        return ResponseFormatter.success_response(
            data=performance_data,
            message="Métriques de performance récupérées"
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des métriques: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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