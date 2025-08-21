"""
Gestion des analyses - Endpoints de gestion et contrôle des analyses
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
from sqlalchemy import desc, asc

from ...core.database import get_db
from ...core.permissions import require_permission, Permissions, Features
from ...services.analysis_service import AnalysisService
from ...models.analysis import Analysis, AnalysisStatus
from ...models.file import File
from ...models.user import User
from ...api.auth import get_current_user
from ...utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analysis-management"])


@router.get("/list")
@APIUtils.handle_errors
@require_permission(Permissions.READ_ANALYSES, Features.ANALYSIS_VIEWING)
async def get_analyses_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    sort_by: str = Query("created_at", description="Sort by field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    status_filter: str = Query(None, description="Filter by status"),
    prompt_filter: str = Query(None, description="Filter by prompt type"),
    limit: int = Query(50, description="Number of items to return"),
    offset: int = Query(0, description="Offset for pagination")
) -> Dict[str, Any]:
    """Get analyses list with sorting and filtering"""
    # Build query
    query = db.query(Analysis)
    
    # Apply filters
    if status_filter:
        query = query.filter(Analysis.status == status_filter)
    
    if prompt_filter:
        # Filter by prompt type in metadata
        query = query.filter(Analysis.analysis_metadata.contains({"prompt_id": prompt_filter}))
    
    # Apply sorting
    if sort_by == "created_at":
        query = query.order_by(desc(Analysis.created_at) if sort_order == "desc" else asc(Analysis.created_at))
    elif sort_by == "status":
        query = query.order_by(desc(Analysis.status) if sort_order == "desc" else asc(Analysis.status))
    elif sort_by == "provider":
        query = query.order_by(desc(Analysis.provider) if sort_order == "desc" else asc(Analysis.provider))
    else:
        query = query.order_by(desc(Analysis.created_at))
    
    # Apply pagination
    total = query.count()
    analyses = query.offset(offset).limit(limit).all()
    
    # Convert to response format
    analyses_list = []
    for analysis in analyses:
        # Get file info
        file_info = None
        if analysis.file_id:
            file = db.query(File).filter(File.id == analysis.file_id).first()
            if file:
                file_info = {
                    "id": file.id,
                    "name": file.name,
                    "path": file.path,
                    "size": file.size,
                    "mime_type": file.mime_type
                }
        
        analyses_list.append({
            "id": analysis.id,
            "file_info": file_info,
            "analysis_type": analysis.analysis_type.value,
            "status": analysis.status.value,
            "provider": analysis.provider,
            "model": analysis.model,
            "prompt": analysis.prompt,
            "result": analysis.result,
            "analysis_metadata": analysis.analysis_metadata,
            "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
            "started_at": analysis.started_at.isoformat() if analysis.started_at else None,
            "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
            "error_message": analysis.error_message,
            "retry_count": analysis.retry_count
        })
    
    return ResponseFormatter.paginated_response(
        items=analyses_list,
        total=total,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order
    )


@router.get("/{analysis_id}")
@APIUtils.handle_errors
@require_permission(Permissions.READ_ANALYSES, Features.ANALYSIS_VIEWING)
async def get_analysis_by_id(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get a specific analysis by ID"""
    # Get the analysis
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Get file info
    file_info = None
    if analysis.file_id:
        file = db.query(File).filter(File.id == analysis.file_id).first()
        if file:
            file_info = {
                "id": file.id,
                "name": file.name,
                "path": file.path,
                "size": file.size,
                "mime_type": file.mime_type
            }
    
    # Convert to response format
    analysis_data = {
        "id": analysis.id,
        "file_info": file_info,
        "analysis_type": analysis.analysis_type.value,
        "status": analysis.status.value,
        "provider": analysis.provider,
        "model": analysis.model,
        "prompt": analysis.prompt,
        "result": analysis.result,
        "analysis_metadata": analysis.analysis_metadata,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "started_at": analysis.started_at.isoformat() if analysis.started_at else None,
        "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
        "error_message": analysis.error_message,
        "retry_count": analysis.retry_count
    }
    
    return ResponseFormatter.success_response(
        data=analysis_data,
        message="Analysis retrieved successfully"
    )


@router.get("/stats")
@APIUtils.handle_errors
async def get_analysis_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get analysis statistics"""
    from sqlalchemy import func
    
    # Get total analyses
    total_analyses = db.query(func.count(Analysis.id)).scalar()
    
    # Get completed analyses
    completed_analyses = db.query(func.count(Analysis.id)).filter(
        Analysis.status == AnalysisStatus.COMPLETED
    ).scalar()
    
    # Get failed analyses
    failed_analyses = db.query(func.count(Analysis.id)).filter(
        Analysis.status == AnalysisStatus.FAILED
    ).scalar()
    
    # Get pending analyses
    pending_analyses = db.query(func.count(Analysis.id)).filter(
        Analysis.status == AnalysisStatus.PENDING
    ).scalar()
    
    # Get processing analyses
    processing_analyses = db.query(func.count(Analysis.id)).filter(
        Analysis.status == AnalysisStatus.PROCESSING
    ).scalar()
    
    return ResponseFormatter.success_response(
        data={
            "total": total_analyses,
            "completed": completed_analyses,
            "failed": failed_analyses,
            "pending": pending_analyses,
            "processing": processing_analyses,
            "success_rate": (completed_analyses / total_analyses * 100) if total_analyses > 0 else 0
        },
        message="Analysis statistics retrieved"
    )


@router.delete("/{analysis_id}")
@APIUtils.handle_errors
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Delete an analysis by ID"""
    analysis_service = AnalysisService(db)
    
    # Check if analysis exists
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Delete the analysis
    success = analysis_service.delete_analysis(analysis_id)
    
    if success:
        logger.info(f"Successfully deleted analysis {analysis_id}")
        return ResponseFormatter.success_response(
            data={"analysis_id": analysis_id},
            message="Analysis deleted successfully"
        )
    else:
        raise HTTPException(status_code=500, detail="Failed to delete analysis")


@router.post("/{analysis_id}/retry")
@APIUtils.handle_errors
async def retry_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retry a failed analysis"""
    analysis_service = AnalysisService(db)
    
    # Check if analysis exists
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Retry the analysis
    retried_analysis = analysis_service.retry_failed_analysis(analysis_id)
    
    if retried_analysis:
        logger.info(f"Successfully retried analysis {analysis_id}")
        return ResponseFormatter.success_response(
            data={"analysis_id": analysis_id},
            message="Analysis retried successfully"
        )
    else:
        raise HTTPException(status_code=500, detail="Failed to retry analysis")


@router.put("/{analysis_id}/update-prompt")
@APIUtils.handle_errors
async def update_analysis_prompt(
    analysis_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update the prompt for a pending analysis"""
    prompt_id = request.get("prompt_id")
    
    if not prompt_id:
        raise HTTPException(status_code=400, detail="prompt_id is required")
    
    # Get the analysis
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Only allow updating pending analyses
    if analysis.status != AnalysisStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only update pending analyses")
    
    # Update the prompt in metadata
    if not analysis.analysis_metadata:
        analysis.analysis_metadata = {}
    
    analysis.analysis_metadata["prompt_id"] = prompt_id
    
    # Get the prompt text if prompt_id is provided
    if prompt_id and prompt_id != "default":
        from ...services.prompt_service import PromptService
        prompt_service = PromptService()
        prompt_data = prompt_service.get_prompt(prompt_id)
        if prompt_data:
            analysis.prompt = prompt_data.get("prompt", analysis.prompt)
    
    db.commit()
    
    logger.info(f"Updated prompt for analysis {analysis_id} to {prompt_id}")
    
    return ResponseFormatter.success_response(
        data={
            "analysis_id": analysis_id,
            "prompt_id": prompt_id,
            "status": "updated"
        },
        message=f"Prompt updated for analysis {analysis_id}"
    )


@router.post("/{analysis_id}/start")
@APIUtils.handle_errors
async def start_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Start a pending analysis"""
    analysis_service = AnalysisService(db)
    
    # Check if analysis exists
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Check if analysis is in pending status
    if analysis.status != AnalysisStatus.PENDING:
        raise HTTPException(status_code=400, detail="Analysis is not in pending status")
    
    # Start the analysis processing
    success = analysis_service.start_analysis(analysis_id)
    
    if success:
        logger.info(f"Successfully started analysis {analysis_id}")
        return ResponseFormatter.success_response(
            data={"analysis_id": analysis_id},
            message="Analysis started successfully"
        )
    else:
        raise HTTPException(status_code=500, detail="Failed to start analysis") 