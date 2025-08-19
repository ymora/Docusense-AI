"""
Queue management endpoints for DocuSense AI
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging

from ..core.database import get_db
from ..services.queue_service import QueueService
from ..models.queue import QueueStatus, QueuePriority, QueueControlRequest
from ..utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["queue"])


@router.get("/items")
def get_queue_items(
    status: Optional[QueueStatus] = Query(None, description="Filter by status"),
    priority: Optional[QueuePriority] = Query(None, description="Filter by priority"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get queue items with filtering
    """
    # Valider les paramètres de pagination
    limit, offset = APIUtils.validate_pagination_params(limit, offset, max_limit=1000)
    
    queue_service = QueueService(db)
    items = queue_service.get_queue_items(
        status=status,
        priority=priority,
        limit=limit,
        offset=offset
    )
    
    logger.info(f"Queue service returned {len(items)} items")
    
    # Sérialiser les données de la queue
    queue_items_data = []
    for item in items:
        try:
            item_data = {
                "id": item.id,
                "analysis_id": item.analysis_id,
                "status": item.status.value,
                "priority": item.priority.value,
                "progress": item.progress,
                "current_step": item.current_step,
                "total_steps": item.total_steps,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "started_at": item.started_at.isoformat() if item.started_at else None,
                "completed_at": item.completed_at.isoformat() if item.completed_at else None,
                "estimated_completion": item.estimated_completion.isoformat() if item.estimated_completion else None,
                "error_message": item.error_message,
                "retry_count": item.retry_count,
                "max_retries": item.max_retries,
                "queue_metadata": item.queue_metadata,
                # Informations sur l'analyse
                "analysis_type": item.analysis.analysis_type.value if item.analysis else None,
                "analysis_provider": item.analysis.provider if item.analysis else None,
                "analysis_model": item.analysis.model if item.analysis else None,
                "analysis_prompt": item.analysis.prompt if item.analysis else None,
                "file_info": {
                    "id": None,
                    "name": "N/A",
                    "size": None,
                    "mime_type": None,
                }
            }
            queue_items_data.append(item_data)
        except Exception as e:
            logger.error(f"Error serializing item {item.id}: {e}")
            continue
    
    logger.info(f"Serialized {len(queue_items_data)} items")
    
    return {
        "success": True,
        "message": "Éléments de la queue récupérés",
        "data": queue_items_data,
        "timestamp": "2025-08-19T08:08:00.000000"
    }


@router.get("/status")
@APIUtils.handle_errors
async def get_queue_status(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get queue status and statistics
    """
    queue_service = QueueService(db)
    status_data = queue_service.get_queue_status()
    return ResponseFormatter.success_response(
        data=status_data,
        message="Statut de la queue récupéré"
    )


@router.post("/control")
@APIUtils.handle_errors
async def control_queue(
    request: QueueControlRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Control queue operations (pause, resume, clear, retry)
    """
    queue_service = QueueService(db)

    if request.action == "clear":
        count = queue_service.clear_queue()
        return ResponseFormatter.success_response(
            data={"count": count, "action": "clear"},
            message=f"{count} éléments de la queue supprimés"
        )

    elif request.action == "retry":
        count = queue_service.retry_failed_items(request.item_ids)
        return ResponseFormatter.success_response(
            data={"count": count, "action": "retry"},
            message=f"{count} éléments échoués relancés"
        )

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Action invalide: {request.action}")


@router.post("/start")
@APIUtils.handle_errors
async def start_queue_processing(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Start queue processing
    """
    queue_service = QueueService(db)
    await queue_service.start_processing()
    return ResponseFormatter.success_response(
        data={"status": "started"},
        message="Traitement de la queue démarré"
    )


@router.post("/stop")
@APIUtils.handle_errors
async def stop_queue_processing(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Stop queue processing
    """
    queue_service = QueueService(db)
    queue_service.stop_processing()
    return ResponseFormatter.success_response(
        data={"status": "stopped"},
        message="Traitement de la queue arrêté"
    )


@router.put("/items/{item_id}/update")
@APIUtils.handle_errors
async def update_queue_item(
    item_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Update provider and/or prompt for a queue item
    """
    provider = request.get("provider")
    prompt = request.get("prompt")
    
    # Au moins un des deux paramètres doit être fourni
    if not provider and not prompt:
        raise HTTPException(
            status_code=400,
            detail="Au moins un paramètre (provider ou prompt) est requis"
        )
    
    queue_service = QueueService(db)
    updated = queue_service.update_analysis_provider_and_prompt(item_id, provider, prompt)
    
    if updated:
        update_message = []
        if provider:
            update_message.append(f"fournisseur: {provider}")
        if prompt:
            update_message.append(f"prompt: {prompt}")
        
        return ResponseFormatter.success_response(
            data={"item_id": item_id, "provider": provider, "prompt": prompt},
            message=f"Mis à jour: {', '.join(update_message)}"
        )
    else:
                 raise HTTPException(
             status_code=404,
             detail="Élément de queue non trouvé ou non modifiable"
         )


@router.post("/items/{item_id}/duplicate")
@APIUtils.handle_errors
async def duplicate_queue_item(
    item_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Duplicate a queue item with optional new provider and prompt
    """
    new_provider = request.get("provider")
    new_prompt = request.get("prompt")
    
    queue_service = QueueService(db)
    duplicated_item = queue_service.duplicate_analysis(item_id, new_provider, new_prompt)
    
    if duplicated_item:
        return ResponseFormatter.success_response(
            data={
                "original_item_id": item_id,
                "new_item_id": duplicated_item.id,
                "new_analysis_id": duplicated_item.analysis_id,
                "provider": new_provider,
                "prompt": new_prompt
            },
            message="Analyse dupliquée avec succès"
        )
    else:
        raise HTTPException(
            status_code=404,
            detail="Élément de queue non trouvé ou impossible à dupliquer"
        )
