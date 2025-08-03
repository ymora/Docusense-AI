"""
Module de gestion des fichiers - Organisation modulaire
"""

from .file_management import router as file_management_router
from .file_streaming import router as file_streaming_router
from .file_statistics import router as file_statistics_router

# Router principal qui combine tous les modules
from fastapi import APIRouter

router = APIRouter(tags=["files"])

# Inclure tous les sous-routers
router.include_router(file_management_router, prefix="")
router.include_router(file_streaming_router, prefix="")
router.include_router(file_statistics_router, prefix="") 