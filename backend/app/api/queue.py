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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/queue", tags=["queue"])


@router.get("/")
async def get_queue_items(
    status: Optional[QueueStatus] = Query(None, description="Filter by status"),
    priority: Optional[QueuePriority] = Query(None, description="Filter by priority"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get queue items with filtering
    """
    try:
        queue_service = QueueService(db)
        items = queue_service.get_queue_items(
            status=status,
            priority=priority,
            limit=limit,
            offset=offset
        )

        return [
            {
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
                # Ajout des informations sur l'analyse
                "analysis_type": item.analysis.analysis_type.value if item.analysis else None,
                "analysis_provider": item.analysis.provider if item.analysis else None,
                "analysis_model": item.analysis.model if item.analysis else None,
                "file_info": {
                    "id": item.analysis.file.id if item.analysis and item.analysis.file else None,
                    "name": item.analysis.file.name if item.analysis and item.analysis.file else None,
                    "size": item.analysis.file.size if item.analysis and item.analysis.file else None,
                    "mime_type": item.analysis.file.mime_type if item.analysis and item.analysis.file else None,
                } if item.analysis and item.analysis.file else None
            }
            for item in items
        ]
    except Exception as e:
        logger.error(f"Error getting queue items: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_queue_status(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get queue status and statistics
    """
    try:
        queue_service = QueueService(db)
        return queue_service.get_queue_status()
    except Exception as e:
        logger.error(f"Error getting queue status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/control")
async def control_queue(
    request: QueueControlRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Control queue operations (pause, resume, clear, retry)
    """
    try:
        queue_service = QueueService(db)

        if request.action == "clear":
            count = queue_service.clear_queue()
            return {
                "message": f"Cleared {count} queue items",
                "action": "clear"}

        elif request.action == "retry":
            count = queue_service.retry_failed_items(request.item_ids)
            return {
                "message": f"Retried {count} failed items",
                "action": "retry"}

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid action: {
                    request.action}")

    except Exception as e:
        logger.error(f"Error controlling queue: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def start_queue_processing(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Start queue processing
    """
    try:
        queue_service = QueueService(db)
        await queue_service.start_processing()
        return {"message": "Queue processing started", "status": "started"}
    except Exception as e:
        logger.error(f"Error starting queue processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_queue_processing(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Stop queue processing
    """
    try:
        queue_service = QueueService(db)
        queue_service.stop_processing()
        return {"message": "Queue processing stopped", "status": "stopped"}
    except Exception as e:
        logger.error(f"Error stopping queue processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
