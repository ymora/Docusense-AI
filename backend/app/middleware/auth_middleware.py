"""
Middleware d'authentification centralisé
"""

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

from ..core.security import security_manager

logger = logging.getLogger(__name__)

# Instance globale du bearer
bearer = HTTPBearer()


class AuthMiddleware:
    """Middleware d'authentification centralisé"""
    
    @staticmethod
    def get_current_session(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
        """Vérifie et retourne le token de session (obligatoire)"""
        session_token = credentials.credentials
        
        if not security_manager.verify_session(session_token):
            raise HTTPException(
                status_code=401,
                detail="Session invalide ou expirée",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return session_token
    
    @staticmethod
    def get_current_session_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[str]:
        """Vérifie et retourne le token de session (optionnel)"""
        if not credentials:
            return None
        
        session_token = credentials.credentials
        
        if not security_manager.verify_session(session_token):
            return None  # Retourne None si la session est invalide ou expirée
        
        return session_token
    
    @staticmethod
    def require_admin(session_token: str = Depends(get_current_session)) -> str:
        """Vérifie que l'utilisateur a les droits administrateur"""
        # Pour l'instant, tous les utilisateurs authentifiés sont admin
        # À étendre selon les besoins
        return session_token


# Exports pour facilité d'utilisation
get_current_session = AuthMiddleware.get_current_session
get_current_session_optional = AuthMiddleware.get_current_session_optional
require_admin = AuthMiddleware.require_admin 