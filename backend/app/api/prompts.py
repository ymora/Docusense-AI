"""
Prompts API endpoints for DocuSense AI
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import logging

from ..services.prompt_service import PromptService, PromptType
from ..utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["prompts"])


@router.get("/")
@APIUtils.handle_errors
async def get_all_prompts() -> Dict[str, Any]:
    """
    Get all available universal prompts
    """
    prompt_service = PromptService()
    prompts_data = prompt_service.get_all_universal_prompts()
    return ResponseFormatter.success_response(
        data=prompts_data,
        message="Tous les prompts universels récupérés"
    )


@router.get("/summary")
@APIUtils.handle_errors
async def get_prompts_summary() -> Dict[str, Any]:
    """
    Get a summary of all universal prompts
    """
    prompt_service = PromptService()
    summary_data = prompt_service.get_prompts_summary()
    return ResponseFormatter.success_response(
        data=summary_data,
        message="Résumé des prompts universels récupéré"
    )


@router.get("/universal")
@APIUtils.handle_errors
async def get_universal_prompts() -> Dict[str, Any]:
    """
    Get all universal prompts (NOUVEAU SYSTÈME)
    """
    prompt_service = PromptService()
    universal_prompts = prompt_service.get_all_universal_prompts()
    return ResponseFormatter.success_response(
        data=universal_prompts,
        message="Prompts universels récupérés (nouveau système)"
    )

@router.get("/recommendations")
@APIUtils.handle_errors
async def get_prompt_recommendations(
    file_type: str = None,
    context: str = None
) -> Dict[str, Any]:
    """
    Get intelligent prompt recommendations based on file type and context
    """
    prompt_service = PromptService()
    recommendations = prompt_service.get_prompt_recommendations(file_type, context)
    
    return ResponseFormatter.success_response(
        data=recommendations,
        message=f"Recommandations de prompts pour {file_type} + {context or 'aucun contexte'}"
    )


@router.get("/universal/{prompt_id}")
@APIUtils.handle_errors
async def get_universal_prompt(prompt_id: str) -> Dict[str, Any]:
    """
    Get a specific universal prompt by ID
    """
    prompt_service = PromptService()
    prompt = prompt_service.get_universal_prompt(prompt_id)
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail=f"Universal prompt not found: {prompt_id}")
    
    return ResponseFormatter.success_response(
        data=prompt,
        message=f"Prompt universel {prompt_id} récupéré"
    )


@router.get("/recommendations")
@APIUtils.handle_errors
async def get_prompt_recommendations(
    file_type: Optional[str] = Query(None, description="Type de fichier (pdf, docx, jpg, etc.)"),
    context: Optional[str] = Query(None, description="Contexte (construction, contract, insurance, etc.)")
) -> Dict[str, Any]:
    """
    Get prompt recommendations based on file type and context
    """
    prompt_service = PromptService()
    recommendations = prompt_service.get_prompt_recommendations(file_type, context)
    return ResponseFormatter.success_response(
        data={
            "recommendations": recommendations,
            "file_type": file_type,
            "context": context
        },
        message="Recommandations de prompts générées"
    )


@router.get("/use-case/{use_case}")
@APIUtils.handle_errors
async def get_prompts_by_use_case(use_case: str) -> Dict[str, Any]:
    """
    Get prompts that are relevant for a specific use case
    """
    prompt_service = PromptService()
    prompts = prompt_service.get_prompts_by_use_case(use_case)
    return ResponseFormatter.success_response(
        data={
            "use_case": use_case,
            "prompts": prompts
        },
        message=f"Prompts pour le cas d'usage {use_case} récupérés"
    )


@router.get("/format/{prompt_id}")
@APIUtils.handle_errors
async def format_prompt(
    prompt_id: str,
    text: str = Query(..., description="Texte à insérer dans le prompt")
) -> Dict[str, Any]:
    """
    Format a universal prompt with the given text
    """
    prompt_service = PromptService()
    formatted_prompt = prompt_service.format_prompt(prompt_id, text)
    if not formatted_prompt:
        raise HTTPException(
            status_code=404,
            detail=f"Universal prompt not found: {prompt_id}")
    
    return ResponseFormatter.success_response(
        data={
            "prompt_id": prompt_id,
            "formatted_prompt": formatted_prompt
        },
        message="Prompt formaté avec succès"
    )


@router.post("/reload")
@APIUtils.handle_errors
async def reload_prompts() -> Dict[str, Any]:
    """
    Reload prompts from JSON file
    """
    prompt_service = PromptService()
    success = prompt_service.reload_prompts()
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to reload prompts")
    
    return ResponseFormatter.success_response(
        data={"reloaded": True},
        message="Prompts universels rechargés avec succès"
    )


# Endpoints de compatibilité pour l'ancienne API
@router.get("/default")
@APIUtils.handle_errors
async def get_default_prompts() -> Dict[str, Any]:
    """
    Get all default prompts (compatibility endpoint)
    """
    prompt_service = PromptService()
    # Retourner les prompts universels comme "default"
    universal_prompts = prompt_service.get_all_universal_prompts()
    default_prompts = {}
    
    # Mapper les prompts universels vers les anciens types
    mapping = {
        "problem_analysis": "GENERAL",
        "compliance_verification": "TECHNICAL",
        "dossier_preparation": "ADMINISTRATIVE",
        "contract_comparison": "JURIDICAL",
        "communication_analysis": "GENERAL"
    }
    
    for prompt_id, prompt in universal_prompts.items():
        old_type = mapping.get(prompt_id, "GENERAL")
        default_prompts[old_type] = prompt["prompt"]
    
    return ResponseFormatter.success_response(
        data=default_prompts,
        message="Prompts par défaut récupérés (compatibilité)"
    )


@router.get("/default/{analysis_type}")
@APIUtils.handle_errors
async def get_default_prompt(analysis_type: str) -> Dict[str, Any]:
    """
    Get default prompt for a specific analysis type (compatibility endpoint)
    """
    prompt_service = PromptService()
    prompt = prompt_service.get_default_prompt(analysis_type.upper())
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail=f"Default prompt not found for {analysis_type}")
    
    return ResponseFormatter.success_response(
        data={"analysis_type": analysis_type, "prompt": prompt},
        message=f"Prompt par défaut pour {analysis_type} récupéré (compatibilité)"
    )


@router.get("/specialized")
@APIUtils.handle_errors
async def get_specialized_prompts() -> Dict[str, Any]:
    """
    Get all specialized prompts (compatibility endpoint)
    """
    prompt_service = PromptService()
    # Retourner les prompts universels comme "specialized"
    universal_prompts = prompt_service.get_all_universal_prompts()
    specialized_prompts = {}
    
    # Convertir le format pour la compatibilité
    for prompt_id, prompt in universal_prompts.items():
        specialized_prompts[prompt_id] = {
            "domain": "universal",
            "type": prompt["type"],
            "name": prompt["name"],
            "description": prompt["description"],
            "prompt": prompt["prompt"],
            "output_format": prompt["output_format"]
        }
    
    return ResponseFormatter.success_response(
        data=specialized_prompts,
        message="Prompts spécialisés récupérés (compatibilité)"
    )


@router.get("/specialized/{prompt_id}")
@APIUtils.handle_errors
async def get_specialized_prompt(prompt_id: str) -> Dict[str, Any]:
    """
    Get a specific specialized prompt by ID (compatibility endpoint)
    """
    prompt_service = PromptService()
    prompt = prompt_service.get_universal_prompt(prompt_id)
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail=f"Specialized prompt not found: {prompt_id}")
    
    # Convertir le format pour la compatibilité
    specialized_prompt = {
        "domain": "universal",
        "type": prompt["type"],
        "name": prompt["name"],
        "description": prompt["description"],
        "prompt": prompt["prompt"],
        "output_format": prompt["output_format"]
    }
    
    return ResponseFormatter.success_response(
        data=specialized_prompt,
        message=f"Prompt spécialisé {prompt_id} récupéré (compatibilité)"
    )
