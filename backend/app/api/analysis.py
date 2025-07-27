"""
Analysis endpoints for DocuSense AI
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging

from ..core.database import get_db
from ..services.analysis_service import AnalysisService
from ..services.prompt_service import PromptService, PromptDomain, PromptType
from ..models.analysis import AnalysisStatus, AnalysisType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analysis", tags=["analysis"])

# Initialize prompt service
prompt_service = PromptService()


@router.get("/prompts")
async def get_prompts(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    prompt_type: Optional[str] = Query(None, description="Filter by prompt type"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get available prompts with optional filtering
    """
    try:
        if domain:
            # Filter by domain
            domain_enum = PromptDomain(domain)
            prompts = prompt_service.get_prompts_by_domain(domain_enum)
        elif prompt_type:
            # Filter by type
            type_enum = PromptType(prompt_type)
            prompts = prompt_service.get_prompts_by_type(type_enum)
        else:
            # Get all prompts
            prompts = prompt_service.get_all_prompts()

        # Format response
        formatted_prompts = []
        for prompt_id, prompt in prompts.items():
            formatted_prompts.append({
                "id": prompt_id,
                "name": prompt["name"],
                "description": prompt["description"],
                "domain": prompt["domain"].value,
                "type": prompt["type"].value,
                "output_format": prompt["output_format"]
            })

        return {
            "prompts": formatted_prompts,
            "total": len(formatted_prompts)
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid filter value: {
                str(e)}")
    except Exception as e:
        logger.error(f"Error getting prompts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prompts/summary")
async def get_prompts_summary(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get a summary of all prompts organized by domain
    """
    try:
        return prompt_service.get_prompts_summary()
    except Exception as e:
        logger.error(f"Error getting prompts summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prompts/{prompt_id}")
async def get_prompt(
    prompt_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get a specific prompt by ID
    """
    try:
        prompt = prompt_service.get_prompt(prompt_id)
        if not prompt:
            raise HTTPException(status_code=404,
                                detail=f"Prompt '{prompt_id}' not found")

        return {
            "id": prompt_id,
            "name": prompt["name"],
            "description": prompt["description"],
            "domain": prompt["domain"].value,
            "type": prompt["type"].value,
            "output_format": prompt["output_format"],
            "prompt_template": prompt["prompt"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting prompt {prompt_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_document(
    request: Request,
    prompt_id: str = Query(..., description="Prompt ID to use for analysis"),
    provider: Optional[str] = Query(None, description="AI provider to use"),
    model: Optional[str] = Query(None, description="AI model to use"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze a document using a specific prompt
    """
    try:
        # Get request body
        body = await request.json()
        text = body.get("text", "")
        file_id = body.get("file_id")

        if not text:
            raise HTTPException(
                status_code=400,
                detail="Text content is required")

        # Get the prompt
        prompt = prompt_service.get_prompt(prompt_id)
        if not prompt:
            raise HTTPException(status_code=404,
                                detail=f"Prompt '{prompt_id}' not found")

        # Format the prompt with the text
        formatted_prompt = prompt_service.format_prompt(prompt_id, text)
        if not formatted_prompt:
            raise HTTPException(
                status_code=500,
                detail="Error formatting prompt")

        # Create analysis service
        analysis_service = AnalysisService(db)

        # Create analysis record if file_id provided
        analysis_id = None
        if file_id:
            analysis = analysis_service.create_analysis_with_prompt(
                file_id=file_id,
                analysis_type=AnalysisType.CUSTOM,
                prompt_id=prompt_id,
                custom_prompt=formatted_prompt,
                status=AnalysisStatus.PENDING
            )
            analysis_id = analysis.id

        # Start analysis
        result = await analysis_service.analyze_text(
            text=text,
            analysis_type=AnalysisType.CUSTOM,
            provider=provider,
            model=model,
            custom_prompt=formatted_prompt
        )

        # Update analysis with result if created
        if analysis_id:
            analysis_service.update_analysis_result(
                analysis_id=analysis_id,
                result=result,
                status=AnalysisStatus.COMPLETED
            )

        return {
            "analysis_id": analysis_id,
            "prompt_id": prompt_id,
            "prompt_name": prompt["name"],
            "result": result,
            "status": "completed"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_analysis(
    file_id: int,
    analysis_type: AnalysisType,
    provider: str,
    model: str,
    custom_prompt: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create a new analysis
    """
    try:
        analysis_service = AnalysisService(db)
        analysis = analysis_service.create_analysis(
            file_id=file_id,
            analysis_type=analysis_type,
            provider=provider,
            model=model,
            custom_prompt=custom_prompt
        )

        return {
            "message": "Analysis created successfully",
            "analysis_id": analysis.id,
            "file_id": analysis.file_id,
            "analysis_type": analysis.analysis_type.value,
            "provider": analysis.provider,
            "model": analysis.model,
            "status": analysis.status.value
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk")
async def create_bulk_analyses(
    request: Request,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create multiple analyses for multiple files
    """
    try:
        # Get request body
        body = await request.json()
        file_ids_or_paths = body.get("file_ids", [])
        analysis_type_str = body.get("analysis_type", "general")
        provider = body.get("provider", "openai")
        model = body.get("model", "gpt-4")
        custom_prompt = body.get("custom_prompt")

        if not file_ids_or_paths:
            raise HTTPException(status_code=400, detail="file_ids is required")

        # Convert string to AnalysisType enum
        try:
            analysis_type = AnalysisType(analysis_type_str)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid analysis_type: {analysis_type_str}. Valid types: {
                    [
                        t.value for t in AnalysisType]}")

        # Convert file paths to IDs if needed
        actual_file_ids = []
        for file_id_or_path in file_ids_or_paths:
            if isinstance(file_id_or_path, int):
                # It's already an ID
                actual_file_ids.append(file_id_or_path)
            elif isinstance(file_id_or_path, str):
                # It's a path, we need to find or create the file
                from ..models.file import File
                file = db.query(File).filter(
                    File.path == file_id_or_path).first()
                if not file:
                    # Create the file if it doesn't exist
                    file = File(
                        path=file_id_or_path,
                        name=file_id_or_path.split('\\')[-1] if '\\' in file_id_or_path else file_id_or_path.split('/')[-1],
                        size=0,
                        mime_type="unknown",
                        status="pending"
                    )
                    db.add(file)
                    db.commit()
                    db.refresh(file)
                actual_file_ids.append(file.id)
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file_id type: {
                        type(file_id_or_path)}")

        analysis_service = AnalysisService(db)
        analyses = analysis_service.create_bulk_analyses(
            file_ids=actual_file_ids,
            analysis_type=analysis_type,
            provider=provider,
            model=model,
            custom_prompt=custom_prompt
        )

        return {
            "message": f"Created {len(analyses)} analyses",
            "analyses_created": len(analyses),
            "file_ids": actual_file_ids,
            "analysis_type": analysis_type.value,
            "provider": provider,
            "model": model
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating bulk analyses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def get_analyses(
    file_id: Optional[int] = Query(None, description="Filter by file ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    analysis_type: Optional[AnalysisType] = Query(None, description="Filter by analysis type"),
    provider: Optional[str] = Query(None, description="Filter by provider"),
    limit: int = Query(100, ge=1, le=1000, description="Number of analyses to return"),
    offset: int = Query(0, ge=0, description="Number of analyses to skip"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get analyses with filtering
    """
    try:
        analysis_service = AnalysisService(db)
        analyses = analysis_service.get_analyses(
            file_id=file_id,
            status=status,
            analysis_type=analysis_type,
            provider=provider,
            limit=limit,
            offset=offset
        )

        return [
            {
                "id": analysis.id,
                "file_id": analysis.file_id,
                "analysis_type": analysis.analysis_type.value,
                "status": analysis.status.value,
                "provider": analysis.provider,
                "model": analysis.model,
                "result": analysis.result,
                "error_message": analysis.error_message,
                "retry_count": analysis.retry_count,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
                "started_at": analysis.started_at.isoformat() if analysis.started_at else None,
                "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None
            }
            for analysis in analyses
        ]
    except Exception as e:
        logger.error(f"Error getting analyses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{analysis_id}")
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get a specific analysis by ID
    """
    try:
        analysis_service = AnalysisService(db)
        analysis = analysis_service.get_analysis(analysis_id)

        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        return {
            "id": analysis.id,
            "file_id": analysis.file_id,
            "analysis_type": analysis.analysis_type.value,
            "status": analysis.status.value,
            "provider": analysis.provider,
            "model": analysis.model,
            "prompt": analysis.prompt,
            "result": analysis.result,
            "metadata": analysis.metadata,
            "error_message": analysis.error_message,
            "retry_count": analysis.retry_count,
            "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
            "started_at": analysis.started_at.isoformat() if analysis.started_at else None,
            "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete an analysis
    """
    try:
        analysis_service = AnalysisService(db)
        success = analysis_service.delete_analysis(analysis_id)

        if not success:
            raise HTTPException(status_code=404, detail="Analysis not found")

        return {
            "message": f"Deleted analysis {analysis_id}",
            "analysis_id": analysis_id
        }
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
        analysis = analysis_service.retry_failed_analysis(analysis_id)

        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        return {
            "message": f"Retried analysis {analysis_id}",
            "analysis_id": analysis_id,
            "status": analysis.status.value,
            "retry_count": analysis.retry_count
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrying analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{analysis_id}/cancel")
async def cancel_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Cancel an analysis
    """
    try:
        analysis_service = AnalysisService(db)
        analysis = analysis_service.cancel_analysis(analysis_id)

        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        return {
            "message": f"Cancelled analysis {analysis_id}",
            "analysis_id": analysis_id,
            "status": analysis.status.value
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/overview")
async def get_analysis_stats(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get analysis statistics
    """
    try:
        analysis_service = AnalysisService(db)
        stats = analysis_service.get_analysis_stats()

        return stats
    except Exception as e:
        logger.error(f"Error getting analysis stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
