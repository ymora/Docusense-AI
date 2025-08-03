"""
Module de configuration - Organisation modulaire
"""

from .general_config import router as general_config_router
from .ai_config import router as ai_config_router

# Router principal qui combine tous les modules
from fastapi import APIRouter

router = APIRouter(tags=["config"])

# Inclure tous les sous-routers
router.include_router(general_config_router, prefix="")
router.include_router(ai_config_router, prefix="/ai")

# Endpoints pour UI et System config (déplacés depuis l'ancien fichier)
from fastapi import Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from ...core.database import get_db
from ...services.config_service import ConfigService
from ...models.config import UIConfig, SystemConfig
from ...utils.api_utils import APIUtils, ResponseFormatter

@router.get("/ui")
@APIUtils.handle_errors
async def get_ui_config(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get UI configuration"""
    config_service = ConfigService(db)
    return config_service.get_ui_config()


@router.post("/ui")
@APIUtils.handle_errors
async def set_ui_config(
    config: UIConfig,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set UI configuration"""
    config_service = ConfigService(db)
    success = config_service.set_ui_config(config.dict())

    return ResponseFormatter.success_response(
        data={"success": success},
        message="UI configuration updated"
    )


@router.get("/system")
@APIUtils.handle_errors
async def get_system_config(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get system configuration"""
    config_service = ConfigService(db)
    return config_service.get_system_config()


@router.post("/system")
@APIUtils.handle_errors
async def set_system_config(
    config: SystemConfig,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Set system configuration"""
    config_service = ConfigService(db)
    success = config_service.set_system_config(config.dict())

    return ResponseFormatter.success_response(
        data={"success": success},
        message="System configuration updated"
    ) 