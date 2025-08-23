"""
API endpoints pour l'administration des utilisateurs
Accessible uniquement aux administrateurs
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.analysis import Analysis
from app.models.system_log import SystemLog
from app.api.auth import get_current_user
from app.schemas.auth import UserInfo
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Vérifier que l'utilisateur actuel est un administrateur"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé. Seuls les administrateurs peuvent accéder à cette fonctionnalité."
        )
    return current_user


@router.get("/users", response_model=List[dict])
async def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Récupérer la liste de tous les utilisateurs avec leurs statistiques
    """
    try:
        users = db.query(User).all()
        user_list = []
        
        for user in users:
            # Compter les analyses
            analyses_count = db.query(Analysis).filter(Analysis.user_id == user.id).count()
            
            # Compter les logs système
            logs_count = db.query(SystemLog).filter(SystemLog.user_id == user.id).count()
            
            user_data = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role.value,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "analyses_count": analyses_count,
                "system_logs_count": logs_count
            }
            user_list.append(user_data)
        
        logger.info(f"Administrateur {current_user.username} a récupéré la liste des utilisateurs")
        return user_list
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des utilisateurs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur"
        )


@router.get("/users/{user_id}", response_model=dict)
async def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Récupérer les détails d'un utilisateur spécifique
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Compter les analyses
        analyses_count = db.query(Analysis).filter(Analysis.user_id == user.id).count()
        
        # Compter les logs système
        logs_count = db.query(SystemLog).filter(SystemLog.user_id == user.id).count()
        
        # Récupérer les dernières analyses
        recent_analyses = db.query(Analysis).filter(
            Analysis.user_id == user.id
        ).order_by(Analysis.created_at.desc()).limit(5).all()
        
        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "analyses_count": analyses_count,
            "system_logs_count": logs_count,
            "recent_analyses": [
                {
                    "id": analysis.id,
                    "analysis_type": analysis.analysis_type.value,
                    "status": analysis.status.value,
                    "created_at": analysis.created_at.isoformat() if analysis.created_at else None
                }
                for analysis in recent_analyses
            ]
        }
        
        logger.info(f"Administrateur {current_user.username} a consulté les détails de l'utilisateur {user.username}")
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des détails de l'utilisateur {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur"
        )


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Mettre à jour un utilisateur (statut actif/inactif, rôle, etc.)
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Empêcher la modification de l'administrateur principal
        if user.id == 1 and user.username == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de modifier l'administrateur principal"
            )
        
        # Mettre à jour les champs autorisés
        if "is_active" in user_data:
            user.is_active = user_data["is_active"]
        
        if "role" in user_data:
            try:
                user.role = UserRole(user_data["role"])
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Rôle invalide"
                )
        
        if "email" in user_data:
            user.email = user_data["email"]
        
        db.commit()
        
        logger.info(f"Administrateur {current_user.username} a mis à jour l'utilisateur {user.username}")
        return {"message": "Utilisateur mis à jour avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la mise à jour de l'utilisateur {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur"
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Supprimer un utilisateur et toutes ses données associées
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        # Empêcher la suppression de l'administrateur principal
        if user.id == 1 and user.username == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de supprimer l'administrateur principal"
            )
        
        # Empêcher la suppression de soi-même
        if user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de supprimer votre propre compte"
            )
        
        username = user.username
        
        # Supprimer les analyses associées
        analyses = db.query(Analysis).filter(Analysis.user_id == user.id).all()
        for analysis in analyses:
            db.delete(analysis)
        
        # Supprimer les logs système associés
        system_logs = db.query(SystemLog).filter(SystemLog.user_id == user.id).all()
        for log in system_logs:
            db.delete(log)
        
        # Supprimer l'utilisateur
        db.delete(user)
        db.commit()
        
        logger.info(f"Administrateur {current_user.username} a supprimé l'utilisateur {username}")
        return {"message": f"Utilisateur {username} supprimé avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur lors de la suppression de l'utilisateur {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur"
        )


@router.get("/users/{user_id}/analyses")
async def get_user_analyses(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Récupérer les analyses d'un utilisateur spécifique
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        analyses = db.query(Analysis).filter(
            Analysis.user_id == user.id
        ).order_by(Analysis.created_at.desc()).offset(offset).limit(limit).all()
        
        total_count = db.query(Analysis).filter(Analysis.user_id == user.id).count()
        
        analyses_data = [
            {
                "id": analysis.id,
                "analysis_type": analysis.analysis_type.value,
                "status": analysis.status.value,
                "provider": analysis.provider,
                "model": analysis.model,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
                "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
                "file_id": analysis.file_id
            }
            for analysis in analyses
        ]
        
        return {
            "analyses": analyses_data,
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des analyses de l'utilisateur {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur"
        )


@router.get("/users/{user_id}/logs")
async def get_user_logs(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Récupérer les logs système d'un utilisateur spécifique
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
        
        logs = db.query(SystemLog).filter(
            SystemLog.user_id == user.id
        ).order_by(SystemLog.created_at.desc()).offset(offset).limit(limit).all()
        
        total_count = db.query(SystemLog).filter(SystemLog.user_id == user.id).count()
        
        logs_data = [
            {
                "id": log.id,
                "log_type": log.log_type,
                "message": log.message,
                "level": log.level,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ]
        
        return {
            "logs": logs_data,
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des logs de l'utilisateur {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur"
        )
