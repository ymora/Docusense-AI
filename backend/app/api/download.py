"""
API endpoints pour le téléchargement de fichiers et dossiers
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging
import urllib.parse

from ..core.security import security_manager
from ..services.download_service import download_service
from ..middleware.auth_middleware import AuthMiddleware
from ..utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["download"])

# Modèles Pydantic
class DownloadRequest(BaseModel):
    file_paths: List[str]
    zip_name: Optional[str] = None

class FileInfo(BaseModel):
    name: str
    path: str
    size: int
    size_mb: float
    modified: str
    mime_type: str
    is_file: bool
    is_directory: bool

# Utilisation du middleware d'authentification centralisé


@router.get("/file/{file_path:path}")
@APIUtils.handle_errors
async def download_file(
    file_path: str,
    session_token: str = Depends(AuthMiddleware.get_current_session)
):
    """
    Télécharge un fichier individuel
    
    Args:
        file_path: Chemin vers le fichier (encodé en URL)
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        FileResponse: Fichier à télécharger
    """
    # Décoder le chemin du fichier
    decoded_path = urllib.parse.unquote(file_path)
    file_path_obj = Path(decoded_path)
    
    logger.info(f"Tentative de téléchargement: {file_path_obj}")
    
    return download_service.download_file(file_path_obj)





@router.get("/directory/{directory_path:path}")
@APIUtils.handle_errors
async def download_directory(
    directory_path: str,
    zip_name: Optional[str] = Query(None, description="Nom du fichier ZIP"),
    session_token: str = Depends(AuthMiddleware.get_current_session)
):
    """
    Télécharge un répertoire sous forme de ZIP
    
    Args:
        directory_path: Chemin vers le répertoire (encodé en URL)
        zip_name: Nom du fichier ZIP (optionnel)
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        FileResponse: Fichier ZIP à télécharger
    """
    # Décoder le chemin du répertoire
    decoded_path = urllib.parse.unquote(directory_path)
    directory_path_obj = Path(decoded_path)
    
    logger.info(f"Tentative de téléchargement du répertoire: {directory_path_obj}")
    
    return download_service.download_directory(directory_path_obj, zip_name)


@router.post("/multiple")
@APIUtils.handle_errors
async def download_multiple_files(
    request: DownloadRequest,
    session_token: str = Depends(AuthMiddleware.get_current_session)
):
    """
    Télécharge plusieurs fichiers sous forme de ZIP
    
    Args:
        request: Liste des chemins de fichiers et nom du ZIP
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        FileResponse: Fichier ZIP à télécharger
    """
    # Convertir les chemins en objets Path
    file_paths = [Path(urllib.parse.unquote(path)) for path in request.file_paths]
    
    logger.info(f"Tentative de téléchargement multiple: {len(file_paths)} fichiers")
    
    return download_service.download_multiple_files(file_paths, request.zip_name)


@router.get("/info/{file_path:path}", response_model=FileInfo)
@APIUtils.handle_errors
async def get_file_info(
    file_path: str,
    session_token: str = Depends(AuthMiddleware.get_current_session)
):
    """
    Récupère les informations d'un fichier ou répertoire
    
    Args:
        file_path: Chemin vers le fichier/répertoire (encodé en URL)
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        FileInfo: Informations du fichier/répertoire
    """
    # Décoder le chemin
    decoded_path = urllib.parse.unquote(file_path)
    file_path_obj = Path(decoded_path)
    
    file_info = download_service.get_file_info(file_path_obj)
    return FileInfo(**file_info)


@router.get("/stats")
@APIUtils.handle_errors
async def get_download_stats(session_token: str = Depends(AuthMiddleware.get_current_session)):
    """
    Récupère les statistiques de téléchargement
    
    Args:
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Statistiques de téléchargement
    """
    stats_data = download_service.get_download_stats()
    return ResponseFormatter.success_response(
        data=stats_data,
        message="Statistiques de téléchargement récupérées"
    )


@router.post("/cleanup")
@APIUtils.handle_errors
async def cleanup_temp_files(session_token: str = Depends(AuthMiddleware.get_current_session)):
    """
    Nettoie les fichiers temporaires anciens
    
    Args:
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Confirmation du nettoyage
    """
    download_service.cleanup_temp_files()
    return ResponseFormatter.success_response(message="Fichiers temporaires nettoyés")


@router.get("/browse/{directory_path:path}")
@APIUtils.handle_errors
async def browse_directory(
    directory_path: str,
    session_token: str = Depends(AuthMiddleware.get_current_session)
):
    """
    Parcourt un répertoire et retourne son contenu
    
    Args:
        directory_path: Chemin vers le répertoire (encodé en URL)
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Contenu du répertoire
    """
    # Décoder le chemin
    decoded_path = urllib.parse.unquote(directory_path)
    directory_path_obj = Path(decoded_path)
    
    if not directory_path_obj.exists():
        raise HTTPException(status_code=404, detail="Répertoire non trouvé")
    
    if not directory_path_obj.is_dir():
        raise HTTPException(status_code=400, detail="Le chemin ne correspond pas à un répertoire")
    
    # Lister le contenu
    items = []
    for item in directory_path_obj.iterdir():
        try:
            item_info = download_service.get_file_info(item)
            items.append(item_info)
        except Exception as e:
            logger.warning(f"Impossible de récupérer les infos pour {item}: {e}")
            continue
    
    # Trier : dossiers d'abord, puis fichiers
    directories = [item for item in items if item['is_directory']]
    files = [item for item in items if item['is_file']]
    
    directories.sort(key=lambda x: x['name'].lower())
    files.sort(key=lambda x: x['name'].lower())
    
    browse_data = {
        "directory": str(directory_path_obj),
        "parent": str(directory_path_obj.parent) if directory_path_obj.parent != directory_path_obj else None,
        "items": directories + files,
        "total_items": len(items),
        "directories_count": len(directories),
        "files_count": len(files)
    }
    
    return ResponseFormatter.success_response(
        data=browse_data,
        message="Contenu du répertoire récupéré"
    ) 