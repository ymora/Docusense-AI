"""
API endpoints pour l'administration
Gestion des utilisateurs et métriques système
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import psutil
import os
from datetime import datetime

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User, UserRole
from ..services.auth_service import AuthService
from ..utils.response_formatter import ResponseFormatter
from ..utils.api_utils import APIUtils
from ..api.streams import broadcast_system_metrics_update

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
@APIUtils.monitor_api_performance
async def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Récupérer la liste des utilisateurs (admin uniquement)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé - droits d'administration requis"
        )
    
    auth_service = AuthService(db)
    users = auth_service.get_all_users()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
        for user in users
    ]

@router.post("/users")
@APIUtils.monitor_api_performance
async def create_user(
    user_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Créer un nouvel utilisateur (admin uniquement)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé - droits d'administration requis"
        )
    
    auth_service = AuthService(db)
    
    try:
        user = auth_service.create_user(
            username=user_data["username"],
            email=user_data["email"],
            password=user_data["password"],
            role=UserRole(user_data.get("role", "user"))
        )
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/users/{user_id}")
@APIUtils.monitor_api_performance
async def update_user(
    user_id: int,
    user_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Mettre à jour un utilisateur (admin uniquement)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé - droits d'administration requis"
        )
    
    auth_service = AuthService(db)
    
    # Préparer les données de mise à jour
    update_data = {}
    if "username" in user_data:
        update_data["username"] = user_data["username"]
    if "email" in user_data:
        update_data["email"] = user_data["email"]
    if "password" in user_data and user_data["password"]:
        update_data["password"] = user_data["password"]
    if "role" in user_data:
        update_data["role"] = UserRole(user_data["role"])
    if "is_active" in user_data:
        update_data["is_active"] = user_data["is_active"]
    
    user = auth_service.update_user(user_id, **update_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None
    }

@router.delete("/users/{user_id}")
@APIUtils.monitor_api_performance
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Supprimer un utilisateur (admin uniquement)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé - droits d'administration requis"
        )
    
    # Empêcher la suppression de son propre compte
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de supprimer votre propre compte"
        )
    
    auth_service = AuthService(db)
    success = auth_service.delete_user(user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    return {"message": "Utilisateur supprimé avec succès"}

@router.get("/system/health")
@APIUtils.monitor_api_performance
async def get_system_health(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Récupérer les métriques de santé du système (admin uniquement)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé - droits d'administration requis"
        )
    
    try:
        # Métriques système
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        health_data = {
            "status": "healthy",
            "app_name": "DocuSense AI",
            "version": "1.0.0",
            "environment": "production",
            "database_status": "connected",
            "backend_status": "running",
            "compression_enabled": True,
            "rate_limit_enabled": True,
            "timestamp": datetime.now().isoformat()
        }
        
        # Diffuser les métriques via le stream admin
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(broadcast_system_metrics_update({
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "disk_usage_percent": (disk.used / disk.total) * 100,
                    "uptime": psutil.boot_time(),
                    "process_count": len(psutil.pids())
                }))
            else:
                asyncio.run(broadcast_system_metrics_update({
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "disk_usage_percent": (disk.used / disk.total) * 100,
                    "uptime": psutil.boot_time(),
                    "process_count": len(psutil.pids())
                }))
        except Exception as e:
            print(f"Impossible de diffuser les métriques système: {e}")
        
        return health_data
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/system/performance")
@APIUtils.monitor_api_performance
async def get_system_performance(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Récupérer les métriques de performance du système (admin uniquement)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé - droits d'administration requis"
        )
    
    try:
        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage_percent": (psutil.disk_usage('/').used / psutil.disk_usage('/').total) * 100,
            "uptime": psutil.boot_time(),
            "process_count": len(psutil.pids()),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.get("/system/info")
@APIUtils.monitor_api_performance
async def get_system_info(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Récupérer les informations système (admin uniquement)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé - droits d'administration requis"
        )
    
    return {
        "app_name": "DocuSense AI",
        "version": "1.0.0",
        "environment": "production",
        "database_status": "connected",
        "backend_status": "running",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/system/logs")
@APIUtils.monitor_api_performance
async def get_system_logs(
    current_user: User = Depends(get_current_user)
) -> List[str]:
    """
    Récupérer les logs système (admin uniquement)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé - droits d'administration requis"
        )
    
    # Pour l'instant, retourner une liste vide
    # Les logs sont gérés par le service de logs
    return []
