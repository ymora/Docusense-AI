"""
Prompts API endpoints for DocuSense AI
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

from ..services.prompt_service import PromptService, PromptDomain, PromptType
from ..utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["prompts"])


@router.get("/")
@APIUtils.handle_errors
async def get_all_prompts() -> Dict[str, Any]:
    """
    Get all available prompts
    """
    prompt_service = PromptService()
    prompts_data = {
        "default_prompts": prompt_service.get_all_default_prompts(),
        "specialized_prompts": prompt_service.get_all_prompts()
    }
    return ResponseFormatter.success_response(
        data=prompts_data,
        message="Tous les prompts récupérés"
    )


@router.get("/summary")
@APIUtils.handle_errors
async def get_prompts_summary() -> Dict[str, Any]:
    """
    Get a summary of all prompts organized by domain
    """
    prompt_service = PromptService()
    summary_data = prompt_service.get_prompts_summary()
    return ResponseFormatter.success_response(
        data=summary_data,
        message="Résumé des prompts récupéré"
    )


@router.get("/default")
@APIUtils.handle_errors
async def get_default_prompts() -> Dict[str, str]:
    """
    Get all default prompts
    """
    prompt_service = PromptService()
    default_prompts = prompt_service.get_all_default_prompts()
    return ResponseFormatter.success_response(
        data=default_prompts,
        message="Prompts par défaut récupérés"
    )


@router.get("/default/{analysis_type}")
@APIUtils.handle_errors
async def get_default_prompt(analysis_type: str) -> Dict[str, str]:
    """
    Get default prompt for a specific analysis type
    """
    prompt_service = PromptService()
    prompt = prompt_service.get_default_prompt(analysis_type.upper())
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail=f"Default prompt not found for {analysis_type}")
    
    return ResponseFormatter.success_response(
        data={"analysis_type": analysis_type, "prompt": prompt},
        message=f"Prompt par défaut pour {analysis_type} récupéré"
    )


@router.get("/specialized")
@APIUtils.handle_errors
async def get_specialized_prompts() -> Dict[str, Dict[str, Any]]:
    """
    Get all specialized prompts
    """
    prompt_service = PromptService()
    specialized_prompts = prompt_service.get_all_prompts()
    return ResponseFormatter.success_response(
        data=specialized_prompts,
        message="Prompts spécialisés récupérés"
    )


@router.get("/specialized/{prompt_id}")
@APIUtils.handle_errors
async def get_specialized_prompt(prompt_id: str) -> Dict[str, Any]:
    """
    Get a specific specialized prompt by ID
    """
    prompt_service = PromptService()
    prompt = prompt_service.get_prompt(prompt_id)
    if not prompt:
        raise HTTPException(
            status_code=404,
            detail=f"Prompt {prompt_id} not found")
    
    return ResponseFormatter.success_response(
        data={"id": prompt_id, **prompt},
        message=f"Prompt spécialisé {prompt_id} récupéré"
    )


@router.get("/domain/{domain}")
@APIUtils.handle_errors
async def get_prompts_by_domain(domain: str) -> Dict[str, Dict[str, Any]]:
    """
    Get all prompts for a specific domain
    """
    try:
        prompt_service = PromptService()
        domain_enum = PromptDomain(domain.lower())
        prompts = prompt_service.get_prompts_by_domain(domain_enum)
        return ResponseFormatter.success_response(
            data={"domain": domain, "prompts": prompts},
            message=f"Prompts pour le domaine {domain} récupérés"
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain: {domain}")


@router.get("/type/{prompt_type}")
@APIUtils.handle_errors
async def get_prompts_by_type(prompt_type: str) -> Dict[str, Dict[str, Any]]:
    """
    Get all prompts of a specific type
    """
    try:
        prompt_service = PromptService()
        type_enum = PromptType(prompt_type.lower())
        prompts = prompt_service.get_prompts_by_type(type_enum)
        return ResponseFormatter.success_response(
            data={"type": prompt_type, "prompts": prompts},
            message=f"Prompts de type {prompt_type} récupérés"
        )
    except ValueError:
        raise HTTPException(status_code=400,
                            detail=f"Invalid prompt type: {prompt_type}")


@router.post("/reload")
@APIUtils.handle_errors
async def reload_prompts() -> Dict[str, str]:
    """
    Reload prompts from JSON file
    """
    prompt_service = PromptService()
    success = prompt_service.reload_prompts()
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to reload prompts")
    
    return ResponseFormatter.success_response(message="Prompts rechargés avec succès")
