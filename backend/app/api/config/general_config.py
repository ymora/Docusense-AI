"""
Configuration générale - CRUD et gestion des configurations de base
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from ...core.database import get_db
from ...services.config_service import ConfigService
from ...models.config import ConfigCreate, ConfigUpdate
from ...utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["general-config"])


@router.get("/")
@APIUtils.handle_errors
async def get_configs(
    category: str = Query(None, description="Filter by category"),
    limit: int = Query(100, ge=1, le=1000, description="Number of configs to return"),
    offset: int = Query(0, ge=0, description="Number of configs to skip"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get configurations with filtering"""
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


@router.get("/{key}")
@APIUtils.handle_errors
async def get_config(
    key: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get configuration by key"""
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


@router.post("/")
@APIUtils.handle_errors
async def create_config(
    config: ConfigCreate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new configuration"""
    config_service = ConfigService(db)
    new_config = config_service.set_config(
        key=config.key,
        value=config.value,
        description=config.description,
        category=config.category,
        is_encrypted=config.is_encrypted
    )

    return ResponseFormatter.success_response(
        data={
            "id": new_config.id,
            "key": new_config.key,
            "value": new_config.value,
            "category": new_config.category
        },
        message=f"Created config '{config.key}'"
    )


@router.put("/{key}")
@APIUtils.handle_errors
async def update_config(
    key: str,
    config_update: ConfigUpdate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update a configuration"""
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

    return ResponseFormatter.success_response(
        data={"key": key},
        message=f"Updated config '{key}'"
    )


@router.delete("/{key}")
@APIUtils.handle_errors
async def delete_config(
    key: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Delete a configuration"""
    config_service = ConfigService(db)
    success = config_service.delete_config(key)

    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Config '{key}' not found")

    return ResponseFormatter.success_response(
        data={"key": key},
        message=f"Deleted config '{key}'"
    ) 