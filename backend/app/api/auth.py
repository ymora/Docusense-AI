"""
API endpoints pour l'authentification et l'accès distant
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Response
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging

from ..core.security import security_manager
from ..middleware.auth_middleware import get_current_session
from ..utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["authentication"])

# Modèles Pydantic
class LoginRequest(BaseModel):
    username: str
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

# Utilisation du middleware d'authentification centralisé


@router.post("/login", response_model=LoginResponse)
@APIUtils.handle_errors
async def login(request: LoginRequest):
    """
    Authentification utilisateur
    
    Args:
        request: Requête contenant le nom d'utilisateur et le mot de passe
        
    Returns:
        LoginResponse: Token de session si authentification réussie
    """
    # Vérifier les identifiants
    if request.username != "avocat" or request.password != "2025*":
        return LoginResponse(
            success=False,
            message="Nom d'utilisateur ou mot de passe incorrect"
        )
    
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
            message="Erreur lors de la création de la session"
        )


@router.post("/logout")
@APIUtils.handle_errors
async def logout(session_token: str = Depends(get_current_session)):
    """
    Déconnexion utilisateur
    
    Args:
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Confirmation de déconnexion
    """
    security_manager.logout(session_token)
    return ResponseFormatter.success_response(message="Déconnexion réussie")


@router.get("/session-info", response_model=SessionInfo)
@APIUtils.handle_errors
async def get_session_info(session_token: str = Depends(get_current_session)):
    """
    Récupère les informations de la session actuelle
    
    Args:
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        SessionInfo: Informations de la session
    """
    session_info = security_manager.get_session_info(session_token)
    
    if session_info:
        return SessionInfo(**session_info)
    else:
        raise HTTPException(status_code=404, detail="Session non trouvée")


@router.post("/change-password")
@APIUtils.handle_errors
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
    success = security_manager.change_password(
        request.old_password,
        request.new_password
    )
    
    if success:
        return ResponseFormatter.success_response(message="Mot de passe changé avec succès")
    else:
        return ResponseFormatter.error_response("Ancien mot de passe incorrect")


@router.get("/status")
@APIUtils.handle_errors
async def get_auth_status():
    """
    Récupère le statut de l'authentification
    
    Returns:
        Dict: Statut de l'authentification
    """
    status_data = {
        "authentication_enabled": True,
        "session_timeout_seconds": security_manager.session_timeout,
        "max_login_attempts": security_manager.max_login_attempts,
        "lockout_duration_seconds": security_manager.lockout_duration,
        "active_sessions_count": len(security_manager.sessions)
    }
    
    return ResponseFormatter.success_response(data=status_data, message="Statut d'authentification récupéré")


@router.post("/cleanup-sessions")
@APIUtils.handle_errors
async def cleanup_sessions(session_token: str = Depends(get_current_session)):
    """
    Nettoie les sessions expirées
    
    Args:
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Confirmation du nettoyage
    """
    security_manager.cleanup_expired_sessions()
    return ResponseFormatter.success_response(message="Sessions expirées nettoyées") 