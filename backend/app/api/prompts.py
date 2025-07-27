"""
Prompts API endpoints for DocuSense AI
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

from ..services.prompt_service import PromptService, PromptDomain, PromptType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("/")
async def get_all_prompts() -> Dict[str, Any]:
    """
    Get all available prompts
    """
    try:
        prompt_service = PromptService()
        return {
            "default_prompts": prompt_service.get_all_default_prompts(),
            "specialized_prompts": prompt_service.get_all_prompts()
        }
    except Exception as e:
        logger.error(f"Error getting all prompts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_prompts_summary() -> Dict[str, Any]:
    """
    Get a summary of all prompts organized by domain
    """
    try:
        prompt_service = PromptService()
        return prompt_service.get_prompts_summary()
    except Exception as e:
        logger.error(f"Error getting prompts summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/default")
async def get_default_prompts() -> Dict[str, str]:
    """
    Get all default prompts
    """
    try:
        prompt_service = PromptService()
        return prompt_service.get_all_default_prompts()
    except Exception as e:
        logger.error(f"Error getting default prompts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/default/{analysis_type}")
async def get_default_prompt(analysis_type: str) -> Dict[str, str]:
    """
    Get default prompt for a specific analysis type
    """
    try:
        prompt_service = PromptService()
        prompt = prompt_service.get_default_prompt(analysis_type.upper())
        if not prompt:
            raise HTTPException(
                status_code=404,
                detail=f"Default prompt not found for {analysis_type}")
        return {"analysis_type": analysis_type, "prompt": prompt}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error getting default prompt for {analysis_type}: {
                str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/specialized")
async def get_specialized_prompts() -> Dict[str, Dict[str, Any]]:
    """
    Get all specialized prompts
    """
    try:
        prompt_service = PromptService()
        return prompt_service.get_all_prompts()
    except Exception as e:
        logger.error(f"Error getting specialized prompts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/specialized/{prompt_id}")
async def get_specialized_prompt(prompt_id: str) -> Dict[str, Any]:
    """
    Get a specific specialized prompt by ID
    """
    try:
        prompt_service = PromptService()
        prompt = prompt_service.get_prompt(prompt_id)
        if not prompt:
            raise HTTPException(
                status_code=404,
                detail=f"Prompt {prompt_id} not found")
        return {"id": prompt_id, **prompt}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting specialized prompt {prompt_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/domain/{domain}")
async def get_prompts_by_domain(domain: str) -> Dict[str, Dict[str, Any]]:
    """
    Get all prompts for a specific domain
    """
    try:
        prompt_service = PromptService()
        domain_enum = PromptDomain(domain.lower())
        prompts = prompt_service.get_prompts_by_domain(domain_enum)
        return {"domain": domain, "prompts": prompts}
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain: {domain}")
    except Exception as e:
        logger.error(f"Error getting prompts for domain {domain}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/type/{prompt_type}")
async def get_prompts_by_type(prompt_type: str) -> Dict[str, Dict[str, Any]]:
    """
    Get all prompts of a specific type
    """
    try:
        prompt_service = PromptService()
        type_enum = PromptType(prompt_type.lower())
        prompts = prompt_service.get_prompts_by_type(type_enum)
        return {"type": prompt_type, "prompts": prompts}
    except ValueError:
        raise HTTPException(status_code=400,
                            detail=f"Invalid prompt type: {prompt_type}")
    except Exception as e:
        logger.error(f"Error getting prompts for type {prompt_type}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reload")
async def reload_prompts() -> Dict[str, str]:
    """
    Reload prompts from JSON file
    """
    try:
        prompt_service = PromptService()
        success = prompt_service.reload_prompts()
        if success:
            return {"message": "Prompts reloaded successfully"}
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to reload prompts")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reloading prompts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
