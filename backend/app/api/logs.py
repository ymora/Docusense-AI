"""
API endpoints for log management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import asyncio
import time

from ..core.database import get_db
from ..core.logging import log_cleanup_manager
from ..utils.response_formatter import ResponseFormatter
from ..utils.api_utils import APIUtils

router = APIRouter(tags=["logs"])

@router.get("/backend/stream")
@APIUtils.monitor_api_performance
async def stream_backend_logs():
    """
    Endpoint de streaming des logs backend en temps réel
    """
    async def log_stream():
        try:
            from ..core.logging import FrontendLogHandler
            import logging
            
            # Trouver le handler frontend
            frontend_handler = None
            root_logger = logging.getLogger()
            for handler in root_logger.handlers:
                if isinstance(handler, FrontendLogHandler):
                    frontend_handler = handler
                    break
            
            if not frontend_handler:
                # Créer un handler temporaire si nécessaire
                frontend_handler = FrontendLogHandler()
                root_logger.addHandler(frontend_handler)
            
            # Envoyer les logs existants d'abord
            recent_logs = frontend_handler.get_recent_logs(50)
            for log in recent_logs:
                yield f"data: {json.dumps(log, ensure_ascii=False)}\n\n"
            
            # Stream des nouveaux logs
            last_log_count = len(recent_logs)
            heartbeat_counter = 0
            while True:
                await asyncio.sleep(5)  # Vérifier toutes les 5 secondes au lieu de 1
                heartbeat_counter += 1
                
                current_logs = frontend_handler.get_recent_logs(100)
                if len(current_logs) > last_log_count:
                    # Envoyer seulement les nouveaux logs
                    new_logs = current_logs[last_log_count:]
                    for log in new_logs:
                        yield f"data: {json.dumps(log, ensure_ascii=False)}\n\n"
                    last_log_count = len(current_logs)
                
                # Keep-alive seulement toutes les 30 secondes (6 * 5 secondes)
                if heartbeat_counter >= 6:
                    yield f"data: {json.dumps({'type': 'keepalive', 'timestamp': datetime.now().isoformat()})}\n\n"
                    heartbeat_counter = 0
                
        except Exception as e:
            error_data = {
                "type": "error",
                "message": f"Erreur dans le streaming: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        log_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.get("/list")
@APIUtils.monitor_api_performance
async def get_logs(
    level: Optional[str] = Query(None, description="Niveau de log (debug, info, warning, error)"),
    source: Optional[str] = Query(None, description="Source du log"),
    limit: int = Query(100, ge=1, le=1000, description="Nombre maximum de logs"),
    offset: int = Query(0, ge=0, description="Offset pour la pagination"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Récupère les logs avec filtrage et pagination
    """
    try:
        # Récupérer les logs récents depuis le buffer frontend
        from ..core.logging import FrontendLogHandler
        import logging
        
        # Trouver le handler frontend
        frontend_handler = None
        root_logger = logging.getLogger()
        for handler in root_logger.handlers:
            if isinstance(handler, FrontendLogHandler):
                frontend_handler = handler
                break
        
        if frontend_handler:
            recent_logs = frontend_handler.get_recent_logs(limit + offset)
        else:
            recent_logs = []
        
        # Appliquer les filtres
        filtered_logs = []
        for log in recent_logs:
            # Filtre par niveau
            if level and log.get("level") != level.lower():
                continue
            # Filtre par source
            if source and source.lower() not in log.get("source", "").lower():
                continue
            filtered_logs.append(log)
        
        # Appliquer la pagination
        paginated_logs = filtered_logs[offset:offset + limit]
        
        return ResponseFormatter.success_response(
            data={
                "logs": paginated_logs,
                "total": len(filtered_logs),
                "limit": limit,
                "offset": offset,
                "filters": {
                    "level": level,
                    "source": source
                }
            },
            message=f"Logs récupérés ({len(paginated_logs)} résultats)"
        )
        
    except Exception as e:
        return ResponseFormatter.error_response(
            message="Erreur lors de la récupération des logs",
            error=str(e)
        )

@router.post("/cleanup")
@APIUtils.monitor_api_performance
async def cleanup_logs(
    force: bool = Query(False, description="Forcer le nettoyage même si pas nécessaire"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Déclenche le nettoyage manuel des logs
    """
    try:
        # Déclencher le nettoyage
        log_cleanup_manager.cleanup_logs(force=force)
        
        return ResponseFormatter.success_response(
            data={
                "timestamp": datetime.now().isoformat(),
                "force": force
            },
            message="Nettoyage des logs déclenché avec succès"
        )
        
    except Exception as e:
        return ResponseFormatter.error_response(
            message="Erreur lors du nettoyage des logs",
            error=str(e)
        )

@router.get("/stats")
@APIUtils.monitor_api_performance
async def get_log_stats(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Récupère les statistiques des logs
    """
    try:
        from pathlib import Path
        
        log_dir = Path("logs")
        stats = {
            "total_files": 0,
            "total_size_mb": 0,
            "files": []
        }
        
        if log_dir.exists():
            for log_file in log_dir.glob("*.log"):
                try:
                    stat = log_file.stat()
                    file_size_mb = stat.st_size / (1024 * 1024)
                    file_age_hours = (datetime.now() - datetime.fromtimestamp(stat.st_mtime)).total_seconds() / 3600
                    
                    stats["total_files"] += 1
                    stats["total_size_mb"] += file_size_mb
                    stats["files"].append({
                        "name": log_file.name,
                        "size_mb": round(file_size_mb, 2),
                        "age_hours": round(file_age_hours, 2),
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })
                except Exception as e:
                    continue
        
        return ResponseFormatter.success_response(
            data=stats,
            message=f"Statistiques des logs récupérées ({stats['total_files']} fichiers, {stats['total_size_mb']:.1f} MB)"
        )
        
    except Exception as e:
        return ResponseFormatter.error_response(
            message="Erreur lors de la récupération des statistiques",
            error=str(e)
        )
