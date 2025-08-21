"""
Système de permissions et limitations d'usage pour DocuSense AI
"""

from functools import wraps
from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import Optional, Callable, Any
import logging

from ..core.database import get_db
from ..models.user import User
from ..api.auth import get_current_user

logger = logging.getLogger(__name__)

def require_permission(permission: str, feature: Optional[str] = None):
    """
    Décorateur pour vérifier les permissions et limitations d'usage
    
    Args:
        permission: Permission requise
        feature: Nom de la fonctionnalité pour le tracking (optionnel)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Récupérer l'utilisateur et la DB depuis les dépendances
            db = None
            current_user = None
            
            # Chercher les dépendances dans les arguments
            for arg in args:
                if isinstance(arg, Session):
                    db = arg
                elif isinstance(arg, User):
                    current_user = arg
            
            # Chercher dans kwargs
            if not db and 'db' in kwargs:
                db = kwargs['db']
            if not current_user and 'current_user' in kwargs:
                current_user = kwargs['current_user']
            
            # Si pas trouvé, utiliser les dépendances FastAPI
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentification requise"
                )
            
            # Vérifier la permission
            if not current_user.has_permission(permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' requise"
                )
            
            # Vérifier la limitation d'usage pour les invités
            if feature and not current_user.can_use_feature(feature):
                usage = current_user.get_feature_usage(feature)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Limite d'usage atteinte pour '{feature}'. Utilisé: {usage['used']}/{usage['limit']} (renouvellement dans 24h)"
                )
            
            # Exécuter la fonction
            result = await func(*args, **kwargs)
            
            # Tracker l'usage si c'est un invité
            if feature and current_user.is_guest:
                current_user.track_feature_usage(feature)
                if db:
                    db.commit()
            
            return result
        
        return wrapper
    return decorator

def check_permission(permission: str, user: User) -> bool:
    """Vérifier une permission pour un utilisateur"""
    return user.has_permission(permission)

def check_feature_limit(feature: str, user: User) -> bool:
    """Vérifier la limite d'usage d'une fonctionnalité"""
    return user.can_use_feature(feature)

def track_usage(feature: str, user: User, db: Session):
    """Tracker l'usage d'une fonctionnalité"""
    if user.is_guest:
        user.track_feature_usage(feature)
        db.commit()

# Constantes pour les permissions
class Permissions:
    # Permissions de base
    READ_ANALYSES = "read_analyses"
    VIEW_PDFS = "view_pdfs"
    BROWSE_FILES = "browse_files"
    VIEW_MULTIMEDIA = "view_multimedia"
    
    # Permissions utilisateur
    CREATE_ANALYSES = "create_analyses"
    DELETE_OWN_ANALYSES = "delete_own_analyses"
    DOWNLOAD_FILES = "download_files"
    MANAGE_OWN_CONFIG = "manage_own_config"
    
    # Permissions admin
    MANAGE_USERS = "manage_users"
    MANAGE_SYSTEM = "manage_system"
    VIEW_LOGS = "view_logs"
    MANAGE_CONFIG = "manage_config"

# Constantes pour les fonctionnalités
class Features:
    # Fonctionnalités de base
    FILE_BROWSING = "file_browsing"
    FILE_VIEWING = "file_viewing"
    ANALYSIS_VIEWING = "analysis_viewing"
    MULTIMEDIA_VIEWING = "multimedia_viewing"
    
    # Fonctionnalités utilisateur
    ANALYSIS_CREATION = "analysis_creation"
    FILE_DOWNLOAD = "file_download"
    CONFIG_MANAGEMENT = "config_management"
    
    # Fonctionnalités avancées
    VIDEO_CONVERSION = "video_conversion"
    EMAIL_PROCESSING = "email_processing"
    SECURE_STREAMING = "secure_streaming"
