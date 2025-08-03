"""
Module d'analyse - Organisation modulaire
"""

from .analysis_creation import router as analysis_creation_router
from .analysis_management import router as analysis_management_router

# Router principal qui combine tous les modules
from fastapi import APIRouter

router = APIRouter(tags=["analysis"])

# Inclure tous les sous-routers
router.include_router(analysis_creation_router, prefix="")
router.include_router(analysis_management_router, prefix="")

# Endpoint de test simple
@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify API is working"""
    return {"message": "Analysis API is working", "status": "ok"}

# Endpoint pour les prompts (déplacé depuis l'ancien fichier)
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
import json
import os

from ...core.database import get_db

logger = logging.getLogger(__name__)

@router.get("/prompts")
async def get_prompts(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get available prompts for analysis"""
    try:
        # Load prompts from the JSON file
        prompts_file = os.path.join(os.path.dirname(__file__), "..", "..", "data", "prompts.json")
        
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