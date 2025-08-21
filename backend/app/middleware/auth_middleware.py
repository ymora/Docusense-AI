"""
Middleware d'authentification centralisé - Système JWT
"""

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

from ..api.auth import get_current_user
from ..models.user import User

logger = logging.getLogger(__name__)

# Instance globale du bearer
bearer = HTTPBearer()


class AuthMiddleware:
    """Middleware d'authentification centralisé - Système JWT"""
    
    @staticmethod
    def get_current_user_jwt(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> User:
        """Récupère l'utilisateur actuel via JWT"""
        try:
            # Utiliser le système JWT existant
            from ..api.auth import get_current_user
            from ..core.database import get_db
            from sqlalchemy.orm import Session
            
            # Créer une session temporaire pour get_current_user
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            
            engine = create_engine('sqlite:///./docusense.db')
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            db = SessionLocal()
            
            try:
                # Simuler la dépendance get_db
                def get_db_override():
                    return db
                
                # Appeler get_current_user avec les credentials
                user = get_current_user(credentials, db)
                return user
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Erreur lors de la vérification JWT: {e}")
            raise HTTPException(status_code=401, detail="Token JWT invalide")
    
    @staticmethod
    def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[User]:
        """Récupère l'utilisateur actuel via JWT (optionnel)"""
        try:
            if credentials:
                return AuthMiddleware.get_current_user_jwt(credentials)
            return None
        except Exception:
            return None
    
    @staticmethod
    def require_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> User:
        """Vérifie que l'utilisateur est administrateur via JWT"""
        user = AuthMiddleware.get_current_user_jwt(credentials)
        if user.role.value != 'admin':
            raise HTTPException(status_code=403, detail="Accès administrateur requis")
        return user


# Exports pour facilité d'utilisation - Compatibilité avec l'ancien système
get_current_session = AuthMiddleware.get_current_user_jwt
get_current_session_optional = AuthMiddleware.get_current_user_optional
require_admin = AuthMiddleware.require_admin 