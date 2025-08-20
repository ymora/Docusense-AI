"""
API endpoints for logs management
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
import asyncio
import logging
from datetime import datetime

from ..core.database import get_db
from ..core.logging import get_logger, log_with_context, FrontendLogHandler

router = APIRouter(tags=["logs"])

logger = get_logger("api.logs")

@router.get("/backend")
async def get_backend_logs(limit: int = 100):
    """
    Récupérer les logs backend récents
    """
    try:
        # Récupérer les logs depuis le handler frontend
        frontend_handler = None
        root_logger = logging.getLogger()
        for handler in root_logger.handlers:
            if isinstance(handler, FrontendLogHandler):
                frontend_handler = handler
                break
        
        if frontend_handler:
            logs = frontend_handler.get_recent_logs(limit)
            log_with_context(logger, "info", "Logs backend récupérés", {
                "limit": limit,
                "count": len(logs)
            })
            return {"success": True, "data": logs}
        else:
            log_with_context(logger, "warning", "Handler frontend non trouvé")
            return {"success": True, "data": []}
            
    except Exception as e:
        log_with_context(logger, "error", "Erreur lors de la récupération des logs backend", 
                        exception=e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/backend/stream")
async def stream_backend_logs():
    """
    Streamer les logs backend en temps réel via SSE
    """
    async def event_stream():
        try:
            log_with_context(logger, "info", "Début du streaming des logs backend")
            
            # Queue pour les logs à envoyer
            log_queue = asyncio.Queue()
            
            # Callback pour envoyer les logs au frontend
            def send_log_to_frontend(log_entry: Dict[str, Any]):
                try:
                    # Ajouter à la queue de manière asynchrone
                    asyncio.create_task(log_queue.put(log_entry))
                except Exception as e:
                    logger.error(f"Erreur ajout log à queue: {e}")
            
            # Enregistrer le callback
            from ..core.logging import register_frontend_logger
            register_frontend_logger(send_log_to_frontend)
            
            # Envoyer un heartbeat toutes les 30 secondes
            heartbeat_count = 0
            while True:
                try:
                    # Attendre soit un log soit un timeout pour heartbeat
                    try:
                        log_entry = await asyncio.wait_for(log_queue.get(), timeout=30.0)
                        
                        # Formater pour SSE
                        data = {
                            "type": "backend_log",
                            "timestamp": datetime.now().isoformat(),
                            "log": log_entry
                        }
                        yield f"data: {json.dumps(data)}\n\n"
                        
                    except asyncio.TimeoutError:
                        # Envoyer heartbeat
                        heartbeat_count += 1
                        heartbeat_data = {
                            "type": "heartbeat",
                            "timestamp": datetime.now().isoformat(),
                            "count": heartbeat_count
                        }
                        yield f"data: {json.dumps(heartbeat_data)}\n\n"
                        
                except Exception as e:
                    logger.error(f"Erreur dans la boucle SSE: {e}")
                    await asyncio.sleep(1)
                
        except asyncio.CancelledError:
            # Connexion fermée par le client
            log_with_context(logger, "info", "Streaming des logs backend arrêté")
            from ..core.logging import unregister_frontend_logger
            unregister_frontend_logger(send_log_to_frontend)
        except Exception as e:
            log_with_context(logger, "error", "Erreur dans le streaming des logs", 
                           exception=e)
            error_data = {
                "type": "error",
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@router.delete("/backend")
async def clear_backend_logs():
    """
    Vider le buffer des logs backend
    """
    try:
        # Vider le buffer du handler frontend
        frontend_handler = None
        for handler in logger.handlers:
            if isinstance(handler, FrontendLogHandler):
                frontend_handler = handler
                break
        
        if frontend_handler:
            frontend_handler.log_buffer.clear()
            log_with_context(logger, "info", "Buffer des logs backend vidé")
            return {"success": True, "message": "Logs backend supprimés"}
        else:
            log_with_context(logger, "warning", "Handler frontend non trouvé pour suppression")
            return {"success": False, "message": "Handler non trouvé"}
            
    except Exception as e:
        log_with_context(logger, "error", "Erreur lors de la suppression des logs backend", 
                        exception=e)
        raise HTTPException(status_code=500, detail=str(e))
