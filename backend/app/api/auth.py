"""
API endpoints pour l'authentification et l'accès distant
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging

from ..core.security import security_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Modèles Pydantic
class LoginRequest(BaseModel):
    password: str

class LoginResponse(BaseModel):
    success: bool
    session_token: Optional[str] = None
    message: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class SessionInfo(BaseModel):
    created_at: str
    last_activity: str
    expires_at: str

# Dépendance pour vérifier l'authentification
def get_current_session(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> str:
    """Vérifie et retourne le token de session"""
    session_token = credentials.credentials
    
    if not security_manager.verify_session(session_token):
        raise HTTPException(
            status_code=401,
            detail="Session invalide ou expirée",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return session_token


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authentification utilisateur
    
    Args:
        request: Requête contenant le mot de passe
        
    Returns:
        LoginResponse: Token de session si authentification réussie
    """
    try:
        session_token = security_manager.login(request.password)
        
        if session_token:
            return LoginResponse(
                success=True,
                session_token=session_token,
                message="Authentification réussie"
            )
        else:
            return LoginResponse(
                success=False,
                message="Mot de passe incorrect"
            )
            
    except Exception as e:
        logger.error(f"Erreur lors de l'authentification: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne")


@router.post("/logout")
async def logout(session_token: str = Depends(get_current_session)):
    """
    Déconnexion utilisateur
    
    Args:
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Confirmation de déconnexion
    """
    try:
        security_manager.logout(session_token)
        return {"success": True, "message": "Déconnexion réussie"}
        
    except Exception as e:
        logger.error(f"Erreur lors de la déconnexion: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne")


@router.get("/session-info", response_model=SessionInfo)
async def get_session_info(session_token: str = Depends(get_current_session)):
    """
    Récupère les informations de la session actuelle
    
    Args:
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        SessionInfo: Informations de la session
    """
    try:
        session_info = security_manager.get_session_info(session_token)
        
        if session_info:
            return SessionInfo(**session_info)
        else:
            raise HTTPException(status_code=404, detail="Session non trouvée")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des infos de session: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne")


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    session_token: str = Depends(get_current_session)
):
    """
    Change le mot de passe administrateur
    
    Args:
        request: Ancien et nouveau mot de passe
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Confirmation du changement
    """
    try:
        success = security_manager.change_password(
            request.old_password,
            request.new_password
        )
        
        if success:
            return {"success": True, "message": "Mot de passe changé avec succès"}
        else:
            return {"success": False, "message": "Ancien mot de passe incorrect"}
            
    except Exception as e:
        logger.error(f"Erreur lors du changement de mot de passe: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne")


@router.get("/status")
async def get_auth_status():
    """
    Récupère le statut de l'authentification
    
    Returns:
        Dict: Statut de l'authentification
    """
    try:
        return {
            "authentication_enabled": True,
            "session_timeout_seconds": security_manager.session_timeout,
            "max_login_attempts": security_manager.max_login_attempts,
            "lockout_duration_seconds": security_manager.lockout_duration,
            "active_sessions_count": len(security_manager.sessions)
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du statut: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne")


@router.post("/cleanup-sessions")
async def cleanup_sessions(session_token: str = Depends(get_current_session)):
    """
    Nettoie les sessions expirées
    
    Args:
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Confirmation du nettoyage
    """
    try:
        security_manager.cleanup_expired_sessions()
        return {"success": True, "message": "Sessions expirées nettoyées"}
        
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des sessions: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne") 