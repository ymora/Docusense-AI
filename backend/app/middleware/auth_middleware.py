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
        """Récupère la session actuelle"""
        try:
            token = credentials.credentials
            if security_manager.verify_session(token):
                return token
            else:
                raise HTTPException(status_code=401, detail="Session invalide")
        except Exception as e:
            logger.error(f"Erreur lors de la vérification de session: {e}")
            raise HTTPException(status_code=401, detail="Session invalide")
    
    @staticmethod
    def get_current_session_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[str]:
        """Récupère la session actuelle (optionnelle)"""
        try:
            if credentials:
                token = credentials.credentials
                if security_manager.verify_session(token):
                    return token
            return None
        except Exception:
            return None
    
    @staticmethod
    def require_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
        """Vérifie que l'utilisateur est administrateur"""
        token = AuthMiddleware.get_current_session(credentials)
        # Pour l'instant, tous les utilisateurs authentifiés sont considérés comme admin
        return token


# Exports pour facilité d'utilisation
get_current_session = AuthMiddleware.get_current_session
get_current_session_optional = AuthMiddleware.get_current_session_optional
require_admin = AuthMiddleware.require_admin 