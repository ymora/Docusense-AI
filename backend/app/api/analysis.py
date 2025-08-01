"""
Analysis API endpoints for DocuSense AI
"""

import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from ..core.database import get_db
from ..services.analysis_service import AnalysisService
from ..services.ai_service import get_ai_service
from ..models.analysis import Analysis, AnalysisType, AnalysisStatus
from ..models.file import File, FileStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["analysis"])

@router.get("/test")
async def test_endpoint():
    """
    Test endpoint to verify API is working
    """
    return {"message": "Analysis API is working", "status": "ok"}

@router.post("/compare")
async def compare_documents(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Compare multiple documents using AI analysis
    """
    try:
        file_ids = request.get("file_ids", [])
        prompt_id = request.get("prompt_id", "general_comparison")
        analysis_type = request.get("analysis_type", "comparison")
        
        if len(file_ids) < 2:
            raise HTTPException(status_code=400, detail="At least 2 files are required for comparison")
        
        analysis_service = AnalysisService(db)
        ai_service = get_ai_service(db)
        
        # Get the best available provider
        provider, model = ai_service.select_best_provider()
        
        # Create comparison analysis
        analysis = analysis_service.create_analysis(
            file_id=file_ids[0],  # Use first file as primary
            analysis_type=AnalysisType.COMPARISON,
            provider=provider,
            model=model,
            custom_prompt=f"Prompt ID: {prompt_id} - Comparison of {len(file_ids)} documents",
            add_to_queue=True
        )
        
        # Store file IDs for comparison in metadata
        analysis.analysis_metadata = {
            "comparison_file_ids": file_ids,
            "prompt_id": prompt_id,
            "analysis_type": analysis_type
        }
        db.commit()
        
        logger.info(f"Created comparison analysis {analysis.id} for {len(file_ids)} files")
        
        return {
            "message": f"Comparison analysis started for {len(file_ids)} documents",
            "analysis_id": analysis.id,
            "file_ids": file_ids,
            "status": "queued"
        }
        
    except Exception as e:
        logger.error(f"Error creating comparison analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch")
async def analyze_batch(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze multiple documents in batch
    """
    try:
        file_ids = request.get("file_ids", [])
        prompt_id = request.get("prompt_id", "general_summary")
        analysis_type = request.get("analysis_type", "batch")
        
        if not file_ids:
            raise HTTPException(status_code=400, detail="No files provided for batch analysis")
        
        analysis_service = AnalysisService(db)
        ai_service = get_ai_service(db)
        
        # Get the best available provider
        provider, model = ai_service.select_best_provider()
        
        created_analyses = []
        
        for file_id in file_ids:
            try:
                # Create analysis for each file
                analysis = analysis_service.create_analysis(
                    file_id=file_id,
                    analysis_type=AnalysisType.GENERAL,
                    provider=provider,
                    model=model,
                    custom_prompt=f"Prompt ID: {prompt_id} - Batch analysis",
                    add_to_queue=True
                )
                
                # Store batch information in metadata
                analysis.analysis_metadata = {
                    "batch_analysis": True,
                    "prompt_id": prompt_id,
                    "analysis_type": analysis_type,
                    "batch_size": len(file_ids)
                }
                
                created_analyses.append(analysis.id)
                
            except Exception as e:
                logger.error(f"Error creating analysis for file {file_id}: {str(e)}")
                continue
        
        db.commit()
        
        logger.info(f"Created {len(created_analyses)} batch analyses for {len(file_ids)} files")
        
        return {
            "message": f"Batch analysis started for {len(file_ids)} documents",
            "created_analyses": len(created_analyses),
            "analysis_ids": created_analyses,
            "file_ids": file_ids,
            "status": "queued"
        }
        
    except Exception as e:
        logger.error(f"Error creating batch analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/multiple-ai")
async def analyze_with_multiple_ai(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze documents with multiple AI providers simultaneously
    """
    try:
        file_ids = request.get("file_ids", [])
        prompt_id = request.get("prompt_id", "general_summary")
        analysis_type = request.get("analysis_type", "multiple_ai")
        selected_providers = request.get("providers", [])  # List of provider names to use
        
        if not file_ids:
            raise HTTPException(status_code=400, detail="No files provided for multiple AI analysis")
        
        if not selected_providers:
            raise HTTPException(status_code=400, detail="No AI providers selected")
        
        analysis_service = AnalysisService(db)
        ai_service = get_ai_service(db)
        
        # Get available providers
        available_providers = ai_service.get_available_providers()
        active_providers = [p for p in available_providers if p["name"] in selected_providers and p["is_functional"]]
        
        if not active_providers:
            raise HTTPException(status_code=400, detail="No functional AI providers selected")
        
        created_analyses = []
        
        for file_id in file_ids:
            for provider_info in active_providers:
                try:
                    # Create analysis for each file with each provider
                    analysis = analysis_service.create_analysis(
                        file_id=file_id,
                        analysis_type=AnalysisType.MULTIPLE_AI,
                        provider=provider_info["name"],
                        model=provider_info["default_model"],
                        custom_prompt=f"Prompt ID: {prompt_id} - Multiple AI Analysis",
                        add_to_queue=True
                    )
                    
                    # Store metadata for multiple AI analysis
                    analysis.analysis_metadata = {
                        "multiple_ai_file_ids": file_ids,
                        "prompt_id": prompt_id,
                        "analysis_type": analysis_type,
                        "provider": provider_info["name"],
                        "model": provider_info["default_model"],
                        "is_multiple_ai": True
                    }
                    
                    created_analyses.append(analysis)
                    
                except Exception as e:
                    logger.error(f"Error creating analysis for file {file_id} with provider {provider_info['name']}: {str(e)}")
                    continue
        
        db.commit()
        
        logger.info(f"Created multiple AI analysis for {len(file_ids)} files with {len(active_providers)} providers")
        
        return {
            "message": f"Multiple AI analysis started for {len(file_ids)} documents with {len(active_providers)} providers",
            "analysis_ids": [a.id for a in created_analyses],
            "file_ids": file_ids,
            "providers": [p["name"] for p in active_providers],
            "status": "queued"
        }
        
    except Exception as e:
        logger.error(f"Error creating multiple AI analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-pending")
async def create_pending_analysis(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create a pending analysis (not started yet)
    """
    try:
        file_id = request.get("file_id")
        prompt_id = request.get("prompt_id", "default")
        analysis_type = request.get("analysis_type", "general")
        custom_prompt = request.get("custom_prompt")
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        analysis_service = AnalysisService(db)
        ai_service = get_ai_service(db)
        
        # Try to get the best available provider, but don't fail if none are available
        try:
            provider, model = ai_service.select_best_provider()
        except Exception as e:
            logger.warning(f"No functional AI providers available: {str(e)}")
            # Use fallback values for pending analysis
            provider = "unknown"
            model = "unknown"
        
        # Get the prompt text if prompt_id is provided
        if prompt_id and prompt_id != "default":
            from ..services.prompt_service import PromptService
            prompt_service = PromptService()
            prompt_data = prompt_service.get_prompt(prompt_id)
            if prompt_data:
                custom_prompt = prompt_data.get("prompt", custom_prompt)
        
        # Create analysis with PENDING status (not added to queue yet)
        analysis = analysis_service.create_analysis(
            file_id=file_id,
            analysis_type=AnalysisType.GENERAL,
            provider=provider,
            model=model,
            custom_prompt=custom_prompt or "Analyse générale du document",
            add_to_queue=False  # Don't add to queue yet, just create pending
        )
        
        # Store prompt information in metadata
        if provider == "unknown":
            analysis.analysis_metadata = {
                "prompt_id": prompt_id,
                "analysis_type": analysis_type,
                "provider_status": "no_functional_providers",
                "warning": "Aucun provider IA fonctionnel disponible. Configurez un provider dans les paramètres."
            }
        else:
            analysis.analysis_metadata = {
                "prompt_id": prompt_id,
                "analysis_type": analysis_type
            }
        db.commit()
        
        logger.info(f"Created pending analysis {analysis.id} for file {file_id}")
        
        return {
            "message": f"Pending analysis created for file {file_id}",
            "analysis_id": analysis.id,
            "file_id": file_id,
            "prompt_id": prompt_id,
            "provider": provider,
            "model": model,
            "status": "pending"
        }
        
    except Exception as e:
        logger.error(f"Error creating pending analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_file(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze a single file with specific prompt
    """
    try:
        file_id = request.get("file_id")
        prompt_id = request.get("prompt_id", "general_summary")
        provider_priority = request.get("provider_priority", [])
        
        if not file_id:
            raise HTTPException(status_code=400, detail="file_id is required")
        
        analysis_service = AnalysisService(db)
        ai_service = get_ai_service(db)
        
        # Get the best available provider based on priority
        if provider_priority:
            provider, model = ai_service.select_best_provider_from_priority(provider_priority)
        else:
            provider, model = ai_service.select_best_provider()
        
        # Get the prompt text
        from ..services.prompt_service import PromptService
        prompt_service = PromptService()
        prompt_data = prompt_service.get_prompt(prompt_id)
        
        if not prompt_data:
            # Fallback to default prompt
            custom_prompt = f"Analyse générale du document avec le prompt: {prompt_id}"
        else:
            custom_prompt = prompt_data.get("prompt", f"Analyse avec le prompt: {prompt_id}")
        
        # Create analysis
        analysis = analysis_service.create_analysis(
            file_id=file_id,
            analysis_type=AnalysisType.GENERAL,
            provider=provider,
            model=model,
            custom_prompt=custom_prompt,
            add_to_queue=True  # This will add to queue and start processing
        )
        
        # Store prompt information in metadata
        analysis.analysis_metadata = {
            "prompt_id": prompt_id,
            "prompt_data": prompt_data,
            "provider_priority": provider_priority
        }
        db.commit()
        
        logger.info(f"Created analysis {analysis.id} for file {file_id} with prompt {prompt_id}")
        
        return {
            "message": f"Analysis started for file {file_id}",
            "analysis_id": analysis.id,
            "file_id": file_id,
            "prompt_id": prompt_id,
            "provider": provider,
            "model": model,
            "status": "queued"
        }
        
    except Exception as e:
        logger.error(f"Error creating analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prompts")
async def get_prompts(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get available prompts for analysis
    """
    try:
        # Load prompts from the JSON file
        import json
        import os
        
        prompts_file = os.path.join(os.path.dirname(__file__), "..", "data", "prompts.json")
        
        if not os.path.exists(prompts_file):
            raise HTTPException(status_code=404, detail="Prompts file not found")
        
        with open(prompts_file, 'r', encoding='utf-8') as f:
            prompts_data = json.load(f)
        
        # Convert to flat list for frontend
        prompts_list = []
        
        # Add default prompts
        for domain, prompt_text in prompts_data.get("default_prompts", {}).items():
            prompts_list.append({
                "id": f"default_{domain.lower()}",
                "name": f"Analyse {domain.capitalize()}",
                "description": f"Analyse {domain.lower()} par défaut",
                "domain": domain.lower(),
                "type": "analysis",
                "prompt": prompt_text,
                "output_format": "structured"
            })
        
        # Add specialized prompts
        for prompt_id, prompt_data in prompts_data.get("specialized_prompts", {}).items():
            prompts_list.append({
                "id": prompt_id,
                "name": prompt_data.get("name", "Prompt spécialisé"),
                "description": prompt_data.get("description", ""),
                "domain": prompt_data.get("domain", "general"),
                "type": prompt_data.get("type", "analysis"),
                "prompt": prompt_data.get("prompt", ""),
                "output_format": prompt_data.get("output_format", "structured")
            })
        
        return {
            "prompts": prompts_list,
            "total": len(prompts_list),
            "domains": prompts_data.get("metadata", {}).get("domains", []),
            "types": prompts_data.get("metadata", {}).get("types", [])
        }
        
    except Exception as e:
        logger.error(f"Error loading prompts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def get_analyses_list(
    db: Session = Depends(get_db),
    sort_by: str = Query("created_at", description="Sort by field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    prompt_filter: Optional[str] = Query(None, description="Filter by prompt type"),
    limit: int = Query(50, description="Number of items to return"),
    offset: int = Query(0, description="Offset for pagination")
) -> Dict[str, Any]:
    """
    Get analyses list with sorting and filtering
    """
    try:
        from sqlalchemy import desc, asc
        
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
        
        return {
            "analyses": analyses_list,
            "total": total,
            "limit": limit,
            "offset": offset,
            "sort_by": sort_by,
            "sort_order": sort_order
        }
        
    except Exception as e:
        logger.error(f"Error getting analyses list: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_analysis_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get analysis statistics
    """
    try:
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
        
        return {
            "total": total_analyses,
            "completed": completed_analyses,
            "failed": failed_analyses,
            "pending": pending_analyses,
            "processing": processing_analyses,
            "success_rate": (completed_analyses / total_analyses * 100) if total_analyses > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"Error getting analysis stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete an analysis by ID
    """
    try:
        analysis_service = AnalysisService(db)
        
        # Check if analysis exists
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Delete the analysis
        success = analysis_service.delete_analysis(analysis_id)
        
        if success:
            logger.info(f"Successfully deleted analysis {analysis_id}")
            return {
                "message": "Analysis deleted successfully",
                "analysis_id": analysis_id,
                "status": "deleted"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete analysis")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{analysis_id}/retry")
async def retry_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Retry a failed analysis
    """
    try:
        analysis_service = AnalysisService(db)
        
        # Check if analysis exists
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Retry the analysis
        retried_analysis = analysis_service.retry_failed_analysis(analysis_id)
        
        if retried_analysis:
            logger.info(f"Successfully retried analysis {analysis_id}")
            return {
                "message": "Analysis retried successfully",
                "analysis_id": analysis_id,
                "status": "retried"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to retry analysis")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrying analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{analysis_id}/start")
async def start_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Start a pending analysis
    """
    try:
        analysis_service = AnalysisService(db)
        
        # Check if analysis exists
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Check if analysis is in pending status
        if analysis.status != AnalysisStatus.PENDING:
            raise HTTPException(status_code=400, detail="Analysis is not in pending status")
        
        # Add to queue to start processing
        analysis_service.queue_service.add_to_queue(analysis_id)
        
        logger.info(f"Successfully started analysis {analysis_id}")
        return {
            "message": "Analysis started successfully",
            "analysis_id": analysis_id,
            "status": "started"
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
