"""
API endpoints pour le service de nettoyage unifié
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..core.database import get_db
from ..services.unified_cleanup_service import UnifiedCleanupService
from ..api.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/cleanup", tags=["cleanup"])


@router.get("/stats")
async def get_cleanup_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Récupère les statistiques de nettoyage
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    cleanup_service = UnifiedCleanupService(db)
    return cleanup_service.get_cleanup_stats()


@router.post("/orphaned-files")
async def cleanup_orphaned_files(
    directory_path: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Nettoie les fichiers orphelins
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    cleanup_service = UnifiedCleanupService(db)
    count = cleanup_service.cleanup_orphaned_files(directory_path)
    
    return {
        "success": True,
        "orphaned_files_marked": count,
        "message": f"{count} fichiers orphelins marqués"
    }


@router.post("/failed-analyses")
async def cleanup_failed_analyses(
    max_age_hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Nettoie les analyses échouées
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    cleanup_service = UnifiedCleanupService(db)
    count = cleanup_service.cleanup_failed_analyses(max_age_hours)
    
    return {
        "success": True,
        "analyses_deleted": count,
        "message": f"{count} analyses échouées supprimées"
    }


@router.post("/old-analyses")
async def cleanup_old_analyses(
    max_age_hours: int = 168,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Nettoie les analyses anciennes
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    cleanup_service = UnifiedCleanupService(db)
    count = cleanup_service.cleanup_old_analyses(max_age_hours)
    
    return {
        "success": True,
        "analyses_deleted": count,
        "message": f"{count} analyses anciennes supprimées"
    }


@router.post("/temp-files")
async def cleanup_temp_files(
    max_age_hours: int = 1,
    max_total_size_gb: int = 2,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Nettoie les fichiers temporaires
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    cleanup_service = UnifiedCleanupService(db)
    result = cleanup_service.cleanup_temp_files(max_age_hours, max_total_size_gb)
    
    return {
        "success": True,
        "files_deleted": result["files_deleted"],
        "remaining_size_gb": result["remaining_size_gb"],
        "message": f"{result['files_deleted']} fichiers temporaires supprimés"
    }


@router.post("/logs")
async def cleanup_logs(
    max_age_days: int = 7,
    max_size_mb: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Nettoie les fichiers de logs
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    cleanup_service = UnifiedCleanupService(db)
    result = cleanup_service.cleanup_logs(max_age_days, max_size_mb)
    
    return {
        "success": True,
        "files_deleted": result["files_deleted"],
        "remaining_size_mb": result["remaining_size_mb"],
        "message": f"{result['files_deleted']} fichiers de logs supprimés"
    }


@router.post("/cache")
async def cleanup_cache(
    max_age_hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Nettoie le cache
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    cleanup_service = UnifiedCleanupService(db)
    result = cleanup_service.cleanup_cache(max_age_hours)
    
    return {
        "success": True,
        "items_deleted": result["items_deleted"],
        "message": f"{result['items_deleted']} éléments de cache supprimés"
    }


@router.post("/conversions")
async def cleanup_conversions(
    max_age_hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Nettoie les anciennes conversions
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    cleanup_service = UnifiedCleanupService(db)
    result = cleanup_service.cleanup_old_conversions(max_age_hours)
    
    return {
        "success": True,
        "items_deleted": result["items_deleted"],
        "message": f"{result['items_deleted']} conversions supprimées"
    }


@router.post("/invalid-statuses")
async def fix_invalid_statuses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Corrige les statuts invalides
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    cleanup_service = UnifiedCleanupService(db)
    result = cleanup_service.fix_invalid_statuses()
    
    return {
        "success": True,
        "items_fixed": result["items_fixed"],
        "message": f"{result['items_fixed']} statuts corrigés"
    }


@router.post("/full")
async def full_cleanup(
    max_analysis_age_hours: int = 168,
    max_temp_age_hours: int = 1,
    max_log_age_days: int = 7,
    max_cache_age_hours: int = 24,
    max_conversion_age_hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Effectue un nettoyage complet
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    cleanup_service = UnifiedCleanupService(db)
    result = cleanup_service.full_cleanup(
        max_analysis_age_hours=max_analysis_age_hours,
        max_temp_age_hours=max_temp_age_hours,
        max_log_age_days=max_log_age_days,
        max_cache_age_hours=max_cache_age_hours,
        max_conversion_age_hours=max_conversion_age_hours
    )
    
    return {
        "success": True,
        "results": result,
        "message": "Nettoyage complet effectué avec succès"
    }
