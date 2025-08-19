"""
Configuration IA - Gestion des providers et modèles IA
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
from datetime import datetime
from pydantic import BaseModel

from ...core.database import get_db
from ...services.config_service import ConfigService
from ...services.ai_service import get_ai_service
from ...models.config import AIProvidersConfig
from ...utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ai-config"])


class TestAPIKeyRequest(BaseModel):
    api_key: str = ""


@router.get("/providers")
@APIUtils.handle_errors
async def get_ai_providers_config(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get AI providers configuration with priority and cost information"""
    config_service = ConfigService(db)
    
    # Use the new async method for better status handling
    return await config_service.get_ai_providers_config()


@router.post("/providers")
@APIUtils.handle_errors
async def set_ai_providers_config(
    config: AIProvidersConfig,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set AI providers configuration"""
    config_service = ConfigService(db)

    updated_providers = []
    for provider_name, provider_config in config.dict().items():
        if provider_config:
            success = config_service.set_ai_provider_config(
                provider_name, provider_config.dict())
            if success:
                updated_providers.append(provider_name)

    return ResponseFormatter.success_response(
        data={
            "updated_providers": updated_providers
        },
        message=f"Updated {len(updated_providers)} providers"
    )


@router.post("/providers/status")
@APIUtils.handle_errors
async def set_ai_provider_status(
    provider: str = Query(..., description="Provider name"),
    status: str = Query(..., description="Provider status: valid, inactive"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set AI provider status (valid or inactive)"""
    config_service = ConfigService(db)
    success = config_service.set_provider_status(provider, status)

    if success:
        return ResponseFormatter.success_response(
            data={
                "provider": provider,
                "status": status
            },
            message=f"Status set to {status} for {provider}"
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Failed to set provider status"
        )


@router.post("/test")
@APIUtils.handle_errors
async def test_ai_provider(
    provider: str = Query(..., description="Provider to test"),
    request: TestAPIKeyRequest = None,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Test AI provider connection with detailed validation"""
    config_service = ConfigService(db)
    ai_service = get_ai_service(db)

    try:
        # Cas spécial pour Ollama qui n'a pas besoin de clé API
        if provider.lower() == "ollama":
            # Test Ollama sans clé API
            is_valid = await ai_service.test_provider_with_key(provider, "")
            
            if is_valid:
                config_service.update_provider_functionality_status(provider, True)
                return ResponseFormatter.success_response(
                    data={
                        "provider": provider,
                        "is_valid": True,
                        "tested_at": datetime.now().isoformat(),
                        "status_saved": True
                    },
                    message=f"Ollama connection test successful"
                )
            else:
                config_service.update_provider_functionality_status(provider, False)
                return ResponseFormatter.error_response(
                    message="Could not connect to Ollama server. Please ensure Ollama is running on http://localhost:11434",
                    error_code="ollama_connection_failed"
                )
        
        # Pour les autres providers, test avec la clé API fournie
        if request and request.api_key:
            # Test with provided key using new validation method
            validation_result = await config_service.validate_provider_key(provider, request.api_key)
            
            if validation_result["is_valid"]:
                # If test successful, save the key and update status
                config_service.set_ai_provider_key(provider, request.api_key)
                config_service.update_provider_functionality_status(provider, True)
                
                return ResponseFormatter.success_response(
                    data={
                        "provider": provider,
                        "is_valid": True,
                        "tested_at": validation_result["tested_at"],
                        "status_saved": True,
                        "key_saved": True
                    },
                    message=f"API key validated successfully for {provider} and saved"
                )
            else:
                # If test failed, update status to false
                config_service.update_provider_functionality_status(provider, False)
                
                return ResponseFormatter.error_response(
                    message=validation_result.get("error_message", "Validation failed"),
                    error_code="validation_failed"
                )
        else:
            # Test with existing configuration
            success = await ai_service.test_provider_async(provider)
            
            # Update functionality status in database
            config_service.update_provider_functionality_status(provider, success)
            
            if success:
                return ResponseFormatter.success_response(
                    data={
                        "provider": provider,
                        "is_valid": True,
                        "tested_at": datetime.now().isoformat(),
                        "status_saved": True
                    },
                    message=f"Provider {provider} tested successfully and status saved"
                )
            else:
                return ResponseFormatter.error_response(
                    message=f"Provider {provider} test failed",
                    error_code="provider_test_failed"
                )
    except Exception as e:
        logger.error(f"Error testing provider {provider}: {str(e)}")
        return ResponseFormatter.error_response(
            message=f"Internal server error while testing {provider}: {str(e)}",
            error_code="internal_error"
        )



@router.get("/providers/functional")
@APIUtils.handle_errors
async def get_functional_ai_providers(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get only functional AI providers with their priorities and status"""
    config_service = ConfigService(db)
    
    # Get functional providers with real-time testing
    providers = await config_service.get_available_ai_providers_with_priority_async()
    
    # Count functional providers
    functional_count = len(providers)
    total_providers = 5  # openai, claude, mistral, ollama, gemini
    
    return ResponseFormatter.success_response(
        data={
            "functional_providers": providers,
            "functional_count": functional_count,
            "total_providers": total_providers,
            "availability_percentage": (functional_count / total_providers) * 100 if total_providers > 0 else 0,
            "note": "Only providers with valid API keys and successful connectivity tests are included"
        },
        message="Functional AI providers retrieved"
    )


@router.post("/key/validate")
@APIUtils.handle_errors
async def validate_ai_provider_key(
    provider: str = Query(..., description="Provider name"),
    api_key: str = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Validate an AI provider API key without saving it"""
    config_service = ConfigService(db)
    
    # Validate the API key
    validation_result = await config_service.validate_provider_key(provider, api_key)
    
    return ResponseFormatter.success_response(
        data={
            "provider": provider,
            "validation_result": validation_result
        },
        message="Validation completed"
    )


@router.post("/key")
@APIUtils.handle_errors
async def save_ai_provider_key(
    provider: str = Query(..., description="Provider name"),
    api_key: str = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Save AI provider API key"""
    config_service = ConfigService(db)
    
    # Save the key directly
    success = config_service.set_ai_provider_key(provider, api_key)
    
    if success:
        return ResponseFormatter.success_response(
            data={"provider": provider},
            message=f"API key saved for {provider}"
        )
    else:
        return ResponseFormatter.error_response(
            message=f"Failed to save API key for {provider}",
            error_code="save_failed"
        )


@router.get("/key/{provider}")
@APIUtils.handle_errors
async def get_ai_provider_key(
    provider: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get AI provider API key"""
    config_service = ConfigService(db)
    api_key = config_service.get_ai_provider_key(provider)

    if api_key:
        return ResponseFormatter.success_response(
            data={
                "key": api_key,
                "provider": provider
            },
            message="API key retrieved"
        )
    else:
        return ResponseFormatter.error_response(
            message="No API key found for this provider",
            error_code="key_not_found"
        )


@router.get("/priority")
@APIUtils.handle_errors
async def get_ai_priorities(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get AI provider priorities with validation"""
    config_service = ConfigService(db)
    
    # Get all priorities with validation
    priorities = config_service.get_all_provider_priorities()
    
    # Get active providers count
    active_providers = config_service._get_active_providers()
    
    return ResponseFormatter.success_response(
        data={
            "priorities": priorities,
            "active_providers_count": len(active_providers),
            "active_providers": active_providers,
            "is_sequential": sorted(priorities.values()) == list(range(1, len(priorities) + 1)),
            "note": f"Priorities range from 1 (highest) to {len(active_providers)} (lowest), automatic reordering enabled"
        },
        message=f"AI priorities retrieved for {len(priorities)} active providers"
    )


@router.post("/priority/validate")
@APIUtils.handle_errors
async def validate_ai_priorities(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Validate and fix AI provider priorities based on active and connected providers"""
    config_service = ConfigService(db)
    result = config_service.validate_and_fix_priorities()
    
    if result["success"]:
        return ResponseFormatter.success_response(
            data={
                "active_providers": result["active_providers"],
                "final_priorities": result["final_priorities"],
                "fixes_applied": result["fixes_applied"],
                "note": "Priorities have been automatically adjusted based on active providers"
            },
            message=result["message"]
        )
    else:
        return ResponseFormatter.error_response(
            message=result["message"],
            error_code=result.get("error", "unknown_error")
        )


@router.post("/priority/reset")
@APIUtils.handle_errors
async def reset_ai_priorities(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Reset all AI provider priorities"""
    config_service = ConfigService(db)
    success = config_service.reset_all_priorities()
    if success:
        return ResponseFormatter.success_response(
            message="All priorities reset successfully"
        )
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to reset priorities")


@router.post("/priority")
@APIUtils.handle_errors
async def set_ai_priority(
    provider: str = Query(..., description="Provider name"),
    priority: int = Query(..., ge=1, description="Priority (1=highest, max=lowest)"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set AI provider priority with automatic reordering"""
    config_service = ConfigService(db)
    
    # Get current priorities before change
    old_priorities = config_service.get_all_provider_priorities()
    old_priority = old_priorities.get(provider, 999)
    
    # If provider not in active providers, return error
    active_providers = config_service._get_active_providers()
    if provider not in active_providers:
        raise HTTPException(
            status_code=400,
            detail=f"Provider {provider} is not active. Active providers: {active_providers}"
        )
    
    # Set new priority (this will trigger automatic reordering)
    success = config_service.set_ai_provider_priority(provider, priority)
    
    if success:
        # Get updated priorities after change
        new_priorities = config_service.get_all_provider_priorities()
        
        # Find which providers were affected by the reordering
        affected_providers = []
        for p, new_p_priority in new_priorities.items():
            old_p_priority = old_priorities.get(p, 999)
            if old_p_priority != new_p_priority:
                affected_providers.append({
                    "provider": p,
                    "old_priority": old_p_priority,
                    "new_priority": new_p_priority
                })
        
        return ResponseFormatter.success_response(
            data={
                "provider": provider,
                "old_priority": old_priority,
                "new_priority": priority,
                "all_priorities": new_priorities,
                "affected_providers": affected_providers
            },
            message=f"Priority changed from {old_priority} to {priority} for {provider}. {len(affected_providers)} providers reordered."
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Failed to set provider priority"
        )


@router.get("/strategy")
@APIUtils.handle_errors
async def get_ai_strategy(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get AI provider strategy"""
    config_service = ConfigService(db)
    strategy = config_service.get_ai_provider_strategy()

    return ResponseFormatter.success_response(
        data={"strategy": strategy},
        message="AI strategy retrieved"
    )


@router.post("/strategy")
@APIUtils.handle_errors
async def set_ai_strategy(
    strategy: str = Query(..., description="Strategy: priority, cost, quality, speed"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set AI provider strategy"""
    config_service = ConfigService(db)
    success = config_service.set_ai_provider_strategy(strategy)

    return ResponseFormatter.success_response(
        data={"strategy": strategy},
        message=f"Strategy set to {strategy}"
    )


@router.post("/model")
@APIUtils.handle_errors
async def set_ai_model(
    provider: str = Query(..., description="Provider name"),
    model: str = Query(..., description="Model name"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set AI provider default model"""
    config_service = ConfigService(db)
    success = config_service.set_ai_provider_model(provider, model)

    return ResponseFormatter.success_response(
        data={"provider": provider, "model": model},
        message=f"Model set for {provider}"
    )


@router.get("/metrics")
@APIUtils.handle_errors
async def get_ai_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get AI provider metrics"""
    config_service = ConfigService(db)
    metrics = config_service.get_ai_metrics()

    return ResponseFormatter.success_response(
        data={"metrics": metrics},
        message="AI metrics retrieved"
    ) 