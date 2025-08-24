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
from pathlib import Path

from ..core.database import get_db
from ..core.logging import log_cleanup_manager, log_archive_manager
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
    category: Optional[str] = Query(None, description="Catégorie de log (application, security, api, database, system, analysis, frontend, tests)"),
    level: Optional[str] = Query(None, description="Niveau de log (debug, info, warning, error)"),
    source: Optional[str] = Query(None, description="Source du log"),
    limit: int = Query(100, ge=1, le=1000, description="Nombre maximum de logs"),
    offset: int = Query(0, ge=0, description="Offset pour la pagination"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Récupère les logs avec filtrage et pagination selon la nouvelle structure organisée
    """
    try:
        log_dir = Path("logs")
        if not log_dir.exists():
            return ResponseFormatter.format_response(
                success=False,
                message="Répertoire de logs non trouvé",
                data={"logs": [], "total": 0, "categories": []}
            )
        
        # Catégories disponibles
        categories = ["application", "security", "api", "database", "system", "analysis", "frontend", "tests"]
        
        # Si une catégorie spécifique est demandée
        if category and category not in categories:
            raise HTTPException(status_code=400, detail=f"Catégorie invalide. Catégories disponibles: {', '.join(categories)}")
        
        all_logs = []
        
        # Parcourir les catégories demandées
        target_categories = [category] if category else categories
        
        for cat in target_categories:
            category_dir = log_dir / cat
            if not category_dir.exists():
                continue
                
            # Lire tous les fichiers de log de cette catégorie
            for log_file in category_dir.glob("*.log"):
                try:
                    with open(log_file, 'r', encoding='utf-8') as f:
                        for line_num, line in enumerate(f, 1):
                            if line.strip():
                                # Parser la ligne de log (format simplifié)
                                log_entry = {
                                    "category": cat,
                                    "file": log_file.name,
                                    "line": line_num,
                                    "content": line.strip(),
                                    "timestamp": datetime.now().isoformat(),  # Timestamp de lecture
                                    "size": log_file.stat().st_size
                                }
                                
                                # Appliquer les filtres
                                if level and level.lower() not in line.lower():
                                    continue
                                if source and source.lower() not in line.lower():
                                    continue
                                
                                all_logs.append(log_entry)
                                
                except Exception as e:
                    # Ignorer les fichiers corrompus
                    continue
        
        # Trier par timestamp (plus récent en premier)
        all_logs.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Pagination
        total = len(all_logs)
        paginated_logs = all_logs[offset:offset + limit]
        
        # Statistiques par catégorie
        category_stats = {}
        for cat in categories:
            category_dir = log_dir / cat
            if category_dir.exists():
                files = list(category_dir.glob("*.log"))
                total_size = sum(f.stat().st_size for f in files)
                category_stats[cat] = {
                    "files": len(files),
                    "size_mb": round(total_size / (1024 * 1024), 2)
                }
            else:
                category_stats[cat] = {"files": 0, "size_mb": 0}
        
        return ResponseFormatter.format_response(
            success=True,
            message=f"Logs récupérés avec succès",
            data={
                "logs": paginated_logs,
                "total": total,
                "limit": limit,
                "offset": offset,
                "categories": categories,
                "category_stats": category_stats
            }
        )
        
    except Exception as e:
        return ResponseFormatter.format_response(
            success=False,
            message=f"Erreur lors de la récupération des logs: {str(e)}",
            data={"logs": [], "total": 0}
        )

@router.get("/categories")
@APIUtils.monitor_api_performance
async def get_log_categories(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Récupère les statistiques des catégories de logs
    """
    try:
        log_dir = Path("logs")
        if not log_dir.exists():
            return ResponseFormatter.format_response(
                success=False,
                message="Répertoire de logs non trouvé",
                data={"categories": {}}
            )
        
        categories = ["application", "security", "api", "database", "system", "analysis", "frontend", "tests"]
        category_stats = {}
        
        for category in categories:
            category_dir = log_dir / category
            if category_dir.exists():
                files = list(category_dir.glob("*.log"))
                total_size = sum(f.stat().st_size for f in files)
                oldest_file = min(files, key=lambda x: x.stat().st_mtime) if files else None
                newest_file = max(files, key=lambda x: x.stat().st_mtime) if files else None
                
                category_stats[category] = {
                    "files": len(files),
                    "size_mb": round(total_size / (1024 * 1024), 2),
                    "oldest_file": oldest_file.name if oldest_file else None,
                    "newest_file": newest_file.name if newest_file else None,
                    "last_modified": datetime.fromtimestamp(newest_file.stat().st_mtime).isoformat() if newest_file else None
                }
            else:
                category_stats[category] = {
                    "files": 0,
                    "size_mb": 0,
                    "oldest_file": None,
                    "newest_file": None,
                    "last_modified": None
                }
        
        # Statistiques des archives
        archive_dir = log_dir / "archive"
        archive_stats = {
            "exists": archive_dir.exists(),
            "size_mb": 0,
            "month_count": 0
        }
        
        if archive_dir.exists():
            total_archive_size = sum(f.stat().st_size for f in archive_dir.rglob('*') if f.is_file())
            archive_stats["size_mb"] = round(total_archive_size / (1024 * 1024), 2)
            archive_stats["month_count"] = len([d for d in archive_dir.iterdir() if d.is_dir()])
        
        return ResponseFormatter.format_response(
            success=True,
            message="Statistiques des catégories récupérées",
            data={
                "categories": category_stats,
                "archives": archive_stats,
                "total_size_mb": round(sum(cat["size_mb"] for cat in category_stats.values()), 2)
            }
        )
        
    except Exception as e:
        return ResponseFormatter.format_response(
            success=False,
            message=f"Erreur lors de la récupération des statistiques: {str(e)}",
            data={"categories": {}}
        )

@router.post("/cleanup")
@APIUtils.monitor_api_performance
async def cleanup_logs(
    force: bool = False,
    max_age_hours: int = 24,
    max_size_mb: int = 10,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Déclenche le nettoyage des logs
    """
    try:
        # Déclencher le nettoyage
        log_cleanup_manager.cleanup_logs(force=force)
        
        return ResponseFormatter.format_response(
            success=True,
            message="Nettoyage des logs déclenché avec succès",
            data={
                "force": force,
                "max_age_hours": max_age_hours,
                "max_size_mb": max_size_mb,
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except Exception as e:
        return ResponseFormatter.format_response(
            success=False,
            message=f"Erreur lors du nettoyage: {str(e)}",
            data={}
        )

@router.post("/archive")
@APIUtils.monitor_api_performance
async def archive_logs(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Déclenche l'archivage des logs
    """
    try:
        # Déclencher l'archivage
        log_archive_manager.archive_old_logs()
        
        return ResponseFormatter.format_response(
            success=True,
            message="Archivage des logs déclenché avec succès",
            data={
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except Exception as e:
        return ResponseFormatter.format_response(
            success=False,
            message=f"Erreur lors de l'archivage: {str(e)}",
            data={}
        )

@router.get("/download/{category}")
@APIUtils.monitor_api_performance
async def download_logs(
    category: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Télécharge les logs d'une catégorie spécifique
    """
    try:
        log_dir = Path("logs")
        category_dir = log_dir / category
        
        if not category_dir.exists():
            raise HTTPException(status_code=404, detail=f"Catégorie {category} non trouvée")
        
        # Créer un fichier temporaire avec tous les logs de la catégorie
        import tempfile
        import zipfile
        
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp_file:
            with zipfile.ZipFile(tmp_file.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for log_file in category_dir.glob("*.log"):
                    zipf.write(log_file, log_file.name)
        
        # Lire le contenu du fichier ZIP
        with open(tmp_file.name, 'rb') as f:
            zip_content = f.read()
        
        # Supprimer le fichier temporaire
        import os
        os.unlink(tmp_file.name)
        
        return ResponseFormatter.format_response(
            success=True,
            message=f"Logs de la catégorie {category} prêts au téléchargement",
            data={
                "category": category,
                "zip_content": zip_content,
                "size_bytes": len(zip_content),
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except Exception as e:
        return ResponseFormatter.format_response(
            success=False,
            message=f"Erreur lors du téléchargement: {str(e)}",
            data={}
        )
