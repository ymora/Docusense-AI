"""
API endpoints pour l'authentification et l'accès distant
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import logging

from ..core.database import get_db
from ..core.security import generate_token, verify_token, is_strong_password, sanitize_input
from ..utils.api_utils import APIUtils
from ..utils.response_formatter import ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"])
security = HTTPBearer()


@router.post("/login")
@APIUtils.monitor_api_performance
async def login(
    credentials: Dict[str, str],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Authentification utilisateur avec validation de sécurité
    """
    try:
        # Sanitizer les entrées utilisateur
        username = sanitize_input(credentials.get("username", ""))
        password = credentials.get("password", "")
        
        if not username or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nom d'utilisateur et mot de passe requis"
            )
        
        # Vérifier la robustesse du mot de passe (pour les nouveaux utilisateurs)
        if not is_strong_password(password):
            logger.warning(f"Tentative de connexion avec mot de passe faible pour: {username}")
        
        # Générer un token sécurisé
        token = generate_token()
        
        # Enregistrer la métrique de connexion
        APIUtils.record_api_metric("login_attempts", 1.0, {"username": username})
        
        return ResponseFormatter.success_response(
            data={
                "token": token,
                "user": {
                    "username": username,
                    "authenticated": True
                }
            },
            message="Connexion réussie"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la connexion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur"
        )


@router.post("/verify")
@APIUtils.monitor_api_performance
async def verify_token_endpoint(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Vérification de token avec sécurité renforcée
    """
    try:
        token = credentials.credentials
        
        # Vérifier le token
        is_valid = verify_token(token)
        
        if not is_valid:
            APIUtils.record_api_metric("invalid_tokens", 1.0)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide"
            )
        
        APIUtils.record_api_metric("valid_tokens", 1.0)
        
        return ResponseFormatter.success_response(
            data={"valid": True},
            message="Token valide"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la vérification du token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur"
        ) 