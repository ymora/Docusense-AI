"""
Configuration endpoints for DocuSense AI
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging

from ..core.database import get_db
from ..services.config_service import ConfigService
from ..services.ai_service import AIService
from ..models.config import ConfigCreate, ConfigUpdate, AIProvidersConfig, UIConfig, SystemConfig

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/")
async def get_configs(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(100, ge=1, le=1000, description="Number of configs to return"),
    offset: int = Query(0, ge=0, description="Number of configs to skip"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get configurations with filtering
    """
    try:
        config_service = ConfigService(db)

        if category:
            configs = config_service.get_configs_by_category(category)
        else:
            configs = config_service.get_all_configs()

        return [
            {
                "id": config.id,
                "key": config.key,
                "value": config.value,
                "description": config.description,
                "is_encrypted": config.is_encrypted,
                "category": config.category,
                "created_at": config.created_at.isoformat() if config.created_at else None,
                "updated_at": config.updated_at.isoformat() if config.updated_at else None
            }
            for config in configs[offset:offset + limit]
        ]
    except Exception as e:
        logger.error(f"Error getting configs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{key}")
async def get_config(
    key: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get configuration by key
    """
    try:
        config_service = ConfigService(db)
        value = config_service.get_config(key)

        if value is None:
            raise HTTPException(
                status_code=404,
                detail=f"Config '{key}' not found")

        return {
            "key": key,
            "value": value
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting config {key}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_config(
    config: ConfigCreate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create a new configuration
    """
    try:
        config_service = ConfigService(db)
        new_config = config_service.set_config(
            key=config.key,
            value=config.value,
            description=config.description,
            category=config.category,
            is_encrypted=config.is_encrypted
        )

        return {
            "message": f"Created config '{config.key}'",
            "config": {
                "id": new_config.id,
                "key": new_config.key,
                "value": new_config.value,
                "category": new_config.category
            }
        }
    except Exception as e:
        logger.error(f"Error creating config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{key}")
async def update_config(
    key: str,
    config_update: ConfigUpdate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Update a configuration
    """
    try:
        config_service = ConfigService(db)

        # Check if config exists
        existing = config_service.get_config(key)
        if existing is None:
            raise HTTPException(
                status_code=404,
                detail=f"Config '{key}' not found")

        # Update config
        config_service.set_config(
            key=key,
            value=config_update.value or existing,
            description=config_update.description,
            is_encrypted=config_update.is_encrypted
        )

        return {
            "message": f"Updated config '{key}'",
            "key": key
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating config {key}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{key}")
async def delete_config(
    key: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete a configuration
    """
    try:
        config_service = ConfigService(db)
        success = config_service.delete_config(key)

        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Config '{key}' not found")

        return {
            "message": f"Deleted config '{key}'",
            "key": key
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting config {key}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Configuration Endpoints


@router.get("/ai/providers")
async def get_ai_providers_config(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get AI providers configuration with priority and cost information
    """
    try:
        config_service = ConfigService(db)

        # Get all provider configurations with defaults
        providers = []
        for provider in ["openai", "claude", "mistral", "ollama"]:
            config = config_service.get_ai_provider_config(provider)
            api_key = config_service.get_ai_provider_key(provider)

            # Default models for each provider
            default_models = {
                "openai": [
                    "gpt-4",
                    "gpt-3.5-turbo",
                    "gpt-4o"],
                "claude": [
                    "claude-3-opus",
                    "claude-3-sonnet",
                    "claude-3-haiku"],
                "mistral": [
                    "mistral-large",
                    "mistral-medium",
                    "mistral-small"],
                "ollama": [
                    "llama2",
                    "mistral",
                    "codellama",
                    "phi"]}

            # Default model for each provider
            default_model_map = {
                "openai": "gpt-3.5-turbo",
                "claude": "claude-3-sonnet",
                "mistral": "mistral-medium",
                "ollama": "llama2"
            }

            provider_data = {
                "name": provider,
                "priority": config_service.get_ai_provider_priority(provider),
                "models": config.get("models", default_models.get(provider, [])) if config else default_models.get(provider, []),
                "default_model": config.get("default_model", default_model_map.get(provider)) if config else default_model_map.get(provider),
                "base_url": config.get("base_url") if config else None,
                "is_active": config.get("is_active", True) if config else True,
                "has_api_key": bool(api_key),
                "is_connected": False  # Will be updated by test results
            }

            providers.append(provider_data)

        return {
            "providers": providers,
            "strategy": config_service.get_ai_provider_strategy(),
            "available_providers": ["openai", "claude", "mistral", "ollama"]
        }
    except Exception as e:
        logger.error(f"Error getting AI providers config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/providers")
async def set_ai_providers_config(
    config: AIProvidersConfig,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Set AI providers configuration
    """
    try:
        config_service = ConfigService(db)

        updated_providers = []
        for provider_name, provider_config in config.dict().items():
            if provider_config:
                success = config_service.set_ai_provider_config(
                    provider_name, provider_config.dict())
                if success:
                    updated_providers.append(provider_name)

        return {
            "message": f"Updated {len(updated_providers)} providers",
            "updated_providers": updated_providers
        }
    except Exception as e:
        logger.error(f"Error setting AI providers config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/test")
async def test_ai_provider(
    provider: str = Query(..., description="Provider to test"),
    api_key: Optional[str] = Body(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Test AI provider connection"""
    try:
        ConfigService(db)
        ai_service = AIService(db)

        # Test with provided key or existing config
        if api_key:
            # Test with provided key
            success = await ai_service.test_provider_with_key(provider, api_key)
        else:
            # Test with existing configuration
            success = await ai_service.test_provider_async(provider)

        return {
            "success": success,
            "message": "Provider test completed" if success else "Provider test failed"}
    except Exception as e:
        logger.error(f"Error testing provider {provider}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/key")
async def save_ai_provider_key(
    provider: str = Query(..., description="Provider name"),
    api_key: str = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Save AI provider API key"""
    try:
        config_service = ConfigService(db)
        success = config_service.set_ai_provider_key(provider, api_key)

        return {
            "success": success,
            "message": f"API key saved for {provider}"
        }
    except Exception as e:
        logger.error(f"Error saving API key for {provider}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/key/{provider}")
async def get_ai_provider_key(
    provider: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get AI provider API key"""
    try:
        config_service = ConfigService(db)
        api_key = config_service.get_ai_provider_key(provider)

        if api_key:
            return {
                "success": True,
                "key": api_key,
                "provider": provider
            }
        else:
            return {
                "success": False,
                "key": None,
                "provider": provider,
                "message": "No API key found for this provider"
            }
    except Exception as e:
        logger.error(f"Error getting API key for {provider}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/priority")
async def get_ai_priorities(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get AI provider priorities"""
    try:
        config_service = ConfigService(db)
        priorities = {}
        for provider in ["openai", "claude", "mistral", "ollama"]:
            priorities[provider] = config_service.get_ai_provider_priority(
                provider)

        return {
            "priority": priorities,
            "note": "Priorities range from 1 (highest) to 4 (lowest), each provider must have a unique priority"
        }
    except Exception as e:
        logger.error(f"Error getting AI priorities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/priority/validate")
async def validate_ai_priorities(
        db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Validate and fix AI provider priorities"""
    try:
        config_service = ConfigService(db)
        result = config_service.validate_and_fix_priorities()

        return {
            "message": "Priority validation completed",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error validating AI priorities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/priority/reset")
async def reset_ai_priorities(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Reset all AI provider priorities"""
    try:
        config_service = ConfigService(db)
        success = config_service.reset_all_priorities()
        if success:
            return {
                "success": True,
                "message": "All priorities reset successfully"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to reset priorities")
    except Exception as e:
        logger.error(f"Error resetting priorities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/priority")
async def set_ai_priority(
    provider: str = Query(..., description="Provider name"),
    priority: int = Query(..., ge=1, description="Priority (unique per provider)"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set AI provider priority (unique per provider)"""
    try:
        config_service = ConfigService(db)
        success = config_service.set_ai_provider_priority(provider, priority)

        if success:
            return {
                "success": True,
                "message": f"Priority {priority} set for {provider}",
                "provider": provider,
                "priority": priority
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Failed to set priority")
    except ValueError as e:
        # Handle validation errors (duplicate priority, invalid range)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error setting priority for {provider}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/strategy")
async def get_ai_strategy(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get AI provider strategy"""
    try:
        config_service = ConfigService(db)
        strategy = config_service.get_ai_provider_strategy()

        return {"strategy": strategy}
    except Exception as e:
        logger.error(f"Error getting AI strategy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/strategy")
async def set_ai_strategy(
    strategy: str = Query(..., description="Strategy: priority, cost, quality, speed"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set AI provider strategy"""
    try:
        config_service = ConfigService(db)
        success = config_service.set_ai_provider_strategy(strategy)

        return {
            "success": success,
            "message": f"Strategy set to {strategy}"
        }
    except Exception as e:
        logger.error(f"Error setting AI strategy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/model")
async def set_ai_model(
    provider: str = Query(..., description="Provider name"),
    model: str = Query(..., description="Model name"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set AI provider default model"""
    try:
        config_service = ConfigService(db)
        success = config_service.set_ai_provider_model(provider, model)

        return {
            "success": success,
            "message": f"Model set for {provider}"
        }
    except Exception as e:
        logger.error(f"Error setting model for {provider}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai/metrics")
async def get_ai_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get AI provider metrics"""
    try:
        config_service = ConfigService(db)
        metrics = config_service.get_ai_metrics()

        return {
            "metrics": metrics
        }
    except Exception as e:
        logger.error(f"Error getting AI metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# UI Configuration Endpoints


@router.get("/ui")
async def get_ui_config(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get UI configuration
    """
    try:
        config_service = ConfigService(db)
        return config_service.get_ui_config()
    except Exception as e:
        logger.error(f"Error getting UI config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ui")
async def set_ui_config(
    config: UIConfig,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Set UI configuration
    """
    try:
        config_service = ConfigService(db)
        success = config_service.set_ui_config(config.dict())

        return {
            "success": success,
            "message": "UI configuration updated"
        }
    except Exception as e:
        logger.error(f"Error setting UI config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# System Configuration Endpoints


@router.get("/system")
async def get_system_config(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get system configuration
    """
    try:
        config_service = ConfigService(db)
        return config_service.get_system_config()
    except Exception as e:
        logger.error(f"Error getting system config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/system")
async def set_system_config(
    config: SystemConfig,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Set system configuration
    """
    try:
        config_service = ConfigService(db)
        success = config_service.set_system_config(config.dict())

        return {
            "success": success,
            "message": "System configuration updated"
        }
    except Exception as e:
        logger.error(f"Error setting system config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
