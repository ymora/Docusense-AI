"""
API endpoints pour le streaming sécurisé de fichiers
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Optional, Dict, Any
import logging

from ..core.database import get_db
from ..middleware.auth_middleware import AuthMiddleware
from ..services.secure_streaming_service import SecureStreamingService
from ..utils.api_utils import APIUtils
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/secure-streaming", tags=["Secure Streaming"])

# Instance du service
secure_streaming_service = SecureStreamingService()

@router.get("/file-info/{file_path:path}")
@APIUtils.handle_errors
async def get_secure_file_info(
    file_path: str,
    current_user: User = Depends(AuthMiddleware.get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """
    Récupère les informations sécurisées d'un fichier
    
    Args:
        file_path: Chemin vers le fichier (encodé en URL)
        current_user: Utilisateur connecté
        
    Returns:
        Dict: Informations du fichier
    """
    try:
        from urllib.parse import unquote
        
        # Décoder le chemin du fichier
        decoded_path = unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info(f"Demande d'informations sécurisées pour: {file_path_obj}")
        
        # Récupérer les informations sécurisées
        file_info = secure_streaming_service.get_file_info_secure(file_path_obj, current_user.username)
        
        return {
            "success": True,
            "data": file_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des informations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/view/{file_path:path}")
@APIUtils.handle_errors
async def stream_file_for_viewing(
    file_path: str,
    current_user: User = Depends(AuthMiddleware.get_current_user_jwt),
    chunk_size: Optional[int] = Query(8192, description="Taille des chunks en bytes"),
    db: Session = Depends(get_db)
):
    """
    Stream un fichier pour la visualisation
    
    Args:
        file_path: Chemin vers le fichier (encodé en URL)
        current_user: Utilisateur connecté
        chunk_size: Taille des chunks (optionnel)
        
    Returns:
        StreamingResponse: Fichier streamé pour visualisation
    """
    try:
        from urllib.parse import unquote
        
        # Décoder le chemin du fichier
        decoded_path = unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info(f"Demande de streaming pour visualisation: {file_path_obj}")
        
        # Streamer le fichier pour la visualisation
        return secure_streaming_service.stream_file_secure(
            file_path_obj, 
            current_user.username, 
            mode='view', 
            chunk_size=chunk_size
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du streaming pour visualisation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{file_path:path}")
@APIUtils.handle_errors
async def download_file_secure(
    file_path: str,
    current_user: User = Depends(AuthMiddleware.get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """
    Télécharge un fichier de manière sécurisée
    
    Args:
        file_path: Chemin vers le fichier (encodé en URL)
        current_user: Utilisateur connecté
        
    Returns:
        FileResponse: Fichier à télécharger
    """
    try:
        from urllib.parse import unquote
        
        # Décoder le chemin du fichier
        decoded_path = unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info(f"Demande de téléchargement sécurisé: {file_path_obj}")
        
        # Télécharger le fichier de manière sécurisée
        return secure_streaming_service.stream_file_secure(
            file_path_obj, 
            current_user.username, 
            mode='download'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement sécurisé: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-temp-token")
@APIUtils.handle_errors
async def create_temporary_access_token(
    request: Request,
    current_user: User = Depends(AuthMiddleware.get_current_user_jwt),
    expires_in: int = Query(300, description="Durée de validité en secondes"),
    db: Session = Depends(get_db)
):
    """
    Crée un token temporaire pour l'accès à un fichier
    
    Args:
        request: Requête contenant le chemin du fichier
        current_user: Utilisateur connecté
        expires_in: Durée de validité en secondes
        
    Returns:
        Dict: Token temporaire
    """
    try:
        # Récupérer le chemin du fichier depuis le body
        body = await request.json()
        file_path_str = body.get('file_path')
        
        if not file_path_str:
            raise HTTPException(status_code=400, detail="Chemin du fichier requis")
        
        from urllib.parse import unquote
        decoded_path = unquote(file_path_str)
        file_path_obj = Path(decoded_path)
        
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info(f"Demande de token temporaire pour: {file_path_obj}")
        
        # Créer le token temporaire
        temp_token = secure_streaming_service.create_temp_access_token(
            file_path_obj, 
            current_user.username, 
            expires_in
        )
        
        return {
            "success": True,
            "data": {
                "temp_token": temp_token,
                "expires_in": expires_in,
                "file_path": str(file_path_obj)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la création du token temporaire: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/temp-access/{temp_token}")
@APIUtils.handle_errors
async def access_file_with_temp_token(
    temp_token: str,
    mode: str = Query('view', description="Mode d'accès: 'view' ou 'download'"),
    chunk_size: Optional[int] = Query(8192, description="Taille des chunks en bytes"),
    db: Session = Depends(get_db)
):
    """
    Accède à un fichier avec un token temporaire
    
    Args:
        temp_token: Token temporaire
        mode: Mode d'accès ('view' ou 'download')
        chunk_size: Taille des chunks (optionnel)
        
    Returns:
        StreamingResponse ou FileResponse
    """
    try:
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info(f"Demande d'accès avec token temporaire: {temp_token[:8]}...")
        
        # Valider le token temporaire
        file_path = secure_streaming_service.validate_temp_token(temp_token)
        
        if not file_path:
            raise HTTPException(status_code=401, detail="Token temporaire invalide ou expiré")
        
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info(f"Token temporaire valide pour: {file_path}")
        
        # Accéder au fichier
        return secure_streaming_service.stream_file_secure(
            file_path, 
            None,  # Pas de session_token pour les tokens temporaires
            mode=mode, 
            chunk_size=chunk_size
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'accès avec token temporaire: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
@APIUtils.handle_errors
async def get_secure_streaming_stats(
    current_user: User = Depends(AuthMiddleware.get_current_user_jwt),
    db: Session = Depends(get_db)
):
    """
    Récupère les statistiques du service de streaming sécurisé
    
    Args:
        current_user: Utilisateur connecté
        
    Returns:
        Dict: Statistiques du service
    """
    try:
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info("Demande de statistiques du service de streaming sécurisé")
        
        stats = secure_streaming_service.get_service_stats()
        
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statistiques: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
