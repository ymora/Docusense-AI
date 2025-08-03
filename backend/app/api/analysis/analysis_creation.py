"""
Création d'analyses - Endpoints de création et gestion des analyses
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from ...core.database import get_db
from ...services.analysis_service import AnalysisService
from ...services.ai_service import get_ai_service
from ...models.analysis import AnalysisType
from ...utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analysis-creation"])


@router.post("/compare")
@APIUtils.handle_errors
async def compare_documents(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Compare multiple documents using AI analysis"""
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
    
    return ResponseFormatter.success_response(
        data={
            "analysis_id": analysis.id,
            "file_ids": file_ids,
            "status": "queued"
        },
        message=f"Comparison analysis started for {len(file_ids)} documents"
    )


@router.post("/batch")
@APIUtils.handle_errors
async def analyze_batch(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Analyze multiple documents in batch"""
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
    
    return ResponseFormatter.success_response(
        data={
            "created_analyses": len(created_analyses),
            "analysis_ids": created_analyses,
            "file_ids": file_ids,
            "status": "queued"
        },
        message=f"Batch analysis started for {len(file_ids)} documents"
    )


@router.post("/multiple-ai")
@APIUtils.handle_errors
async def analyze_with_multiple_ai(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Analyze documents with multiple AI providers simultaneously"""
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
    
    return ResponseFormatter.success_response(
        data={
            "analysis_ids": [a.id for a in created_analyses],
            "file_ids": file_ids,
            "providers": [p["name"] for p in active_providers],
            "status": "queued"
        },
        message=f"Multiple AI analysis started for {len(file_ids)} documents with {len(active_providers)} providers"
    )


@router.post("/create-pending")
@APIUtils.handle_errors
async def create_pending_analysis(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a pending analysis (not started yet)"""
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
        from ...services.prompt_service import PromptService
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
    
    return ResponseFormatter.success_response(
        data={
            "analysis_id": analysis.id,
            "file_id": file_id,
            "prompt_id": prompt_id,
            "provider": provider,
            "model": model,
            "status": "pending"
        },
        message=f"Pending analysis created for file {file_id}"
    )


@router.post("/analyze")
@APIUtils.handle_errors
async def analyze_file(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Analyze a single file with specific prompt"""
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
    from ...services.prompt_service import PromptService
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
    
    return ResponseFormatter.success_response(
        data={
            "analysis_id": analysis.id,
            "file_id": file_id,
            "prompt_id": prompt_id,
            "provider": provider,
            "model": model,
            "status": "queued"
        },
        message=f"Analysis started for file {file_id}"
    ) 