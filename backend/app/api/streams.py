"""
API endpoints for Server-Sent Events (SSE) streams
Gère tous les flux de données en temps réel
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import asyncio
import time
import logging

from ..core.database import get_db
from ..core.logging import log_cleanup_manager
from ..utils.response_formatter import ResponseFormatter
from ..utils.api_utils import APIUtils
from ..services.analysis_service import AnalysisService
from ..services.config_service import ConfigService
from ..services.auth_service import AuthService


router = APIRouter(tags=["streams"])

# Stockage des connexions SSE actives
active_connections: Dict[str, List[asyncio.Queue]] = {
    'analyses': [],
    'config': [],
    'users': [],
    'files': [],
    'logs': [],
    'admin': []
}

def add_connection(stream_type: str, queue: asyncio.Queue):
    """Ajouter une nouvelle connexion SSE"""
    if stream_type not in active_connections:
        active_connections[stream_type] = []
    active_connections[stream_type].append(queue)

def remove_connection(stream_type: str, queue: asyncio.Queue):
    """Supprimer une connexion SSE"""
    if stream_type in active_connections and queue in active_connections[stream_type]:
        active_connections[stream_type].remove(queue)

async def broadcast_to_stream(stream_type: str, data: Dict[str, Any]):
    """Diffuser des données à tous les clients connectés à un stream"""
    if stream_type not in active_connections:
        return
    
    message = f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
    
    # Diffuser à tous les clients connectés
    for queue in active_connections[stream_type][:]:  # Copie pour éviter les modifications pendant l'itération
        try:
            await queue.put(message)
        except Exception as e:
            logging.error(f"Erreur lors de la diffusion SSE {stream_type}: {e}")
            remove_connection(stream_type, queue)

@router.get("/analyses")
@APIUtils.monitor_api_performance
async def stream_analyses(db: Session = Depends(get_db)):
    """
    Stream des analyses en temps réel
    """
    async def analysis_stream():
        queue = asyncio.Queue()
        add_connection('analyses', queue)
        
        try:
            # Envoyer les analyses existantes d'abord
            try:
                analysis_service = AnalysisService(db)
                recent_analyses = analysis_service.get_analyses(limit=50)
                
                # Convertir les objets Analysis en dictionnaires
                analyses_data = []
                for analysis in recent_analyses:
                    try:
                        analyses_data.append({
                            "id": analysis.id,
                            "title": analysis.title,
                            "status": analysis.status.value if analysis.status else None,
                            "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
                            "updated_at": analysis.updated_at.isoformat() if analysis.updated_at else None,
                            "file_path": analysis.file_path,
                            "user_id": analysis.user_id
                        })
                    except Exception as analysis_error:
                        logging.warning(f"Erreur lors de la conversion d'une analyse: {analysis_error}")
                        continue
                
                initial_data = {
                    "type": "analyses_initial",
                    "timestamp": datetime.now().isoformat(),
                    "analyses": analyses_data
                }
                yield f"data: {json.dumps(initial_data, ensure_ascii=False)}\n\n"
            except Exception as init_error:
                logging.error(f"Erreur lors de l'initialisation du stream analyses: {init_error}")
                # Envoyer un message d'erreur initial
                error_data = {
                    "type": "analyses_initial",
                    "timestamp": datetime.now().isoformat(),
                    "analyses": [],
                    "error": str(init_error)
                }
                yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
            
            # Stream des nouvelles analyses
            while True:
                try:
                    # Attendre un message ou un timeout
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield message
                except asyncio.TimeoutError:
                    # Keep-alive
                    keepalive_data = {
                        "type": "keepalive",
                        "timestamp": datetime.now().isoformat(),
                        "stream": "analyses"
                    }
                    yield f"data: {json.dumps(keepalive_data, ensure_ascii=False)}\n\n"
                    
        except Exception as e:
            logging.error(f"Erreur dans le stream analyses: {str(e)}")
            error_data = {
                "type": "error",
                "message": f"Erreur dans le stream analyses: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            try:
                yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
            except:
                pass
        finally:
            remove_connection('analyses', queue)
    
    return StreamingResponse(
        analysis_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.get("/config")
@APIUtils.monitor_api_performance
async def stream_config(db: Session = Depends(get_db)):
    """
    Stream des configurations IA en temps réel
    """
    async def config_stream():
        queue = asyncio.Queue()
        add_connection('config', queue)
        
        try:
            # Envoyer la configuration actuelle d'abord
            config_service = ConfigService(db)
            current_config = await config_service.get_ai_providers_config()
            
            initial_data = {
                "type": "config_initial",
                "timestamp": datetime.now().isoformat(),
                "providers": current_config
            }
            yield f"data: {json.dumps(initial_data, ensure_ascii=False)}\n\n"
            
            # Stream des changements de configuration
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield message
                except asyncio.TimeoutError:
                    # Keep-alive
                    keepalive_data = {
                        "type": "keepalive",
                        "timestamp": datetime.now().isoformat(),
                        "stream": "config"
                    }
                    yield f"data: {json.dumps(keepalive_data, ensure_ascii=False)}\n\n"
                    
        except Exception as e:
            logging.error(f"Erreur dans le stream config: {str(e)}")
            error_data = {
                "type": "error",
                "message": f"Erreur dans le stream config: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            try:
                yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
            except:
                pass
        finally:
            remove_connection('config', queue)
    
    return StreamingResponse(
        config_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.get("/users")
@APIUtils.monitor_api_performance
async def stream_users(db: Session = Depends(get_db)):
    """
    Stream des événements utilisateurs en temps réel
    """
    async def user_stream():
        queue = asyncio.Queue()
        add_connection('users', queue)
        
        try:
            # Envoyer les utilisateurs actifs d'abord
            auth_service = AuthService(db)
            active_users = auth_service.get_active_users()
            
            # Convertir les objets User en dictionnaires
            users_data = []
            for user in active_users:
                users_data.append({
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role.value if user.role else None,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "last_login": user.last_login.isoformat() if user.last_login else None
                })
            
            initial_data = {
                "type": "users_initial",
                "timestamp": datetime.now().isoformat(),
                "active_users": users_data
            }
            yield f"data: {json.dumps(initial_data, ensure_ascii=False)}\n\n"
            
            # Stream des événements utilisateurs
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield message
                except asyncio.TimeoutError:
                    # Keep-alive
                    keepalive_data = {
                        "type": "keepalive",
                        "timestamp": datetime.now().isoformat(),
                        "stream": "users"
                    }
                    yield f"data: {json.dumps(keepalive_data, ensure_ascii=False)}\n\n"
                    
        except Exception as e:
            error_data = {
                "type": "error",
                "message": f"Erreur dans le stream users: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
        finally:
            remove_connection('users', queue)
    
    return StreamingResponse(
        user_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.get("/files")
@APIUtils.monitor_api_performance
async def stream_files(db: Session = Depends(get_db)):
    """
    Stream des événements fichiers en temps réel
    """
    async def file_stream():
        queue = asyncio.Queue()
        add_connection('files', queue)
        
        try:
            # Stream des événements fichiers
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield message
                except asyncio.TimeoutError:
                    # Keep-alive
                    keepalive_data = {
                        "type": "keepalive",
                        "timestamp": datetime.now().isoformat(),
                        "stream": "files"
                    }
                    yield f"data: {json.dumps(keepalive_data, ensure_ascii=False)}\n\n"
                    
        except Exception as e:
            error_data = {
                "type": "error",
                "message": f"Erreur dans le stream files: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
        finally:
            remove_connection('files', queue)
    
    return StreamingResponse(
        file_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.get("/admin")
@APIUtils.monitor_api_performance
async def stream_admin(db: Session = Depends(get_db)):
    """
    Stream des événements d'administration en temps réel
    """
    async def admin_stream():
        queue = asyncio.Queue()
        add_connection('admin', queue)
        
        try:
            # Envoyer les données initiales d'administration
            auth_service = AuthService(db)
            
            # Données initiales
            initial_data = {
                "type": "admin_initial",
                "timestamp": datetime.now().isoformat(),
                "data": {
                    "users_count": len(auth_service.get_all_users()),
                    "system_info": {},
                    "active_connections": len(active_connections.get('admin', []))
                }
            }
            yield f"data: {json.dumps(initial_data, ensure_ascii=False)}\n\n"
            
            # Stream des événements d'administration
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield message
                except asyncio.TimeoutError:
                    # Keep-alive
                    keepalive_data = {
                        "type": "keepalive",
                        "timestamp": datetime.now().isoformat(),
                        "stream": "admin"
                    }
                    yield f"data: {json.dumps(keepalive_data, ensure_ascii=False)}\n\n"
                    
        except Exception as e:
            error_data = {
                "type": "error",
                "message": f"Erreur dans le stream admin: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_data, ensure_ascii=False)}\n\n"
        finally:
            remove_connection('admin', queue)
    
    return StreamingResponse(
        admin_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

# Fonctions utilitaires pour diffuser des événements
async def broadcast_analysis_update(analysis_data: Dict[str, Any]):
    """Diffuser une mise à jour d'analyse"""
    await broadcast_to_stream('analyses', {
        "type": "analysis_update",
        "timestamp": datetime.now().isoformat(),
        "analysis": analysis_data
    })

async def broadcast_config_update(config_data: Dict[str, Any]):
    """Diffuser une mise à jour de configuration"""
    await broadcast_to_stream('config', {
        "type": "config_update",
        "timestamp": datetime.now().isoformat(),
        "config": config_data
    })

async def broadcast_user_event(event_data: Dict[str, Any]):
    """Diffuser un événement utilisateur"""
    await broadcast_to_stream('users', {
        "type": "user_event",
        "timestamp": datetime.now().isoformat(),
        "event": event_data
    })

async def broadcast_file_event(event_data: Dict[str, Any]):
    """Diffuser un événement fichier"""
    await broadcast_to_stream('files', {
        "type": "file_event",
        "timestamp": datetime.now().isoformat(),
        "event": event_data
    })

async def broadcast_admin_event(event_data: Dict[str, Any]):
    """Diffuser un événement d'administration"""
    await broadcast_to_stream('admin', {
        "type": "admin_event",
        "timestamp": datetime.now().isoformat(),
        "event": event_data
    })

async def broadcast_user_management_event(event_type: str, user_data: Dict[str, Any]):
    """Diffuser un événement de gestion d'utilisateur"""
    await broadcast_to_stream('admin', {
        "type": "user_management",
        "event_type": event_type,
        "timestamp": datetime.now().isoformat(),
        "user": user_data
    })

async def broadcast_system_metrics_update(metrics_data: Dict[str, Any]):
    """Diffuser une mise à jour des métriques système"""
    await broadcast_to_stream('admin', {
        "type": "system_metrics_update",
        "timestamp": datetime.now().isoformat(),
        "metrics": metrics_data
    })

# TODO: Réintégrer l'initialisation des broadcasts après résolution des imports circulaires
