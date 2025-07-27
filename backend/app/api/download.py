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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/download", tags=["download"])

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


@router.get("/file/{file_path:path}")
async def download_file(
    file_path: str,
    session_token: str = Depends(get_current_session)
):
    """
    Télécharge un fichier individuel
    
    Args:
        file_path: Chemin vers le fichier (encodé en URL)
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        FileResponse: Fichier à télécharger
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = urllib.parse.unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        logger.info(f"Tentative de téléchargement: {file_path_obj}")
        
        return download_service.download_file(file_path_obj)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement du fichier {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.get("/directory/{directory_path:path}")
async def download_directory(
    directory_path: str,
    zip_name: Optional[str] = Query(None, description="Nom du fichier ZIP"),
    session_token: str = Depends(get_current_session)
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
    try:
        # Décoder le chemin du répertoire
        decoded_path = urllib.parse.unquote(directory_path)
        directory_path_obj = Path(decoded_path)
        
        logger.info(f"Tentative de téléchargement du répertoire: {directory_path_obj}")
        
        return download_service.download_directory(directory_path_obj, zip_name)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement du répertoire {directory_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.post("/multiple")
async def download_multiple_files(
    request: DownloadRequest,
    session_token: str = Depends(get_current_session)
):
    """
    Télécharge plusieurs fichiers sous forme de ZIP
    
    Args:
        request: Liste des chemins de fichiers et nom du ZIP
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        FileResponse: Fichier ZIP à télécharger
    """
    try:
        # Convertir les chemins en objets Path
        file_paths = [Path(urllib.parse.unquote(path)) for path in request.file_paths]
        
        logger.info(f"Tentative de téléchargement multiple: {len(file_paths)} fichiers")
        
        return download_service.download_multiple_files(file_paths, request.zip_name)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement multiple: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.get("/info/{file_path:path}", response_model=FileInfo)
async def get_file_info(
    file_path: str,
    session_token: str = Depends(get_current_session)
):
    """
    Récupère les informations d'un fichier ou répertoire
    
    Args:
        file_path: Chemin vers le fichier/répertoire (encodé en URL)
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        FileInfo: Informations du fichier/répertoire
    """
    try:
        # Décoder le chemin
        decoded_path = urllib.parse.unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        file_info = download_service.get_file_info(file_path_obj)
        return FileInfo(**file_info)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des infos du fichier {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.get("/stats")
async def get_download_stats(session_token: str = Depends(get_current_session)):
    """
    Récupère les statistiques de téléchargement
    
    Args:
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Statistiques de téléchargement
    """
    try:
        return download_service.get_download_stats()
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statistiques: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.post("/cleanup")
async def cleanup_temp_files(session_token: str = Depends(get_current_session)):
    """
    Nettoie les fichiers temporaires anciens
    
    Args:
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Confirmation du nettoyage
    """
    try:
        download_service.cleanup_temp_files()
        return {"success": True, "message": "Fichiers temporaires nettoyés"}
        
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des fichiers temporaires: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.get("/browse/{directory_path:path}")
async def browse_directory(
    directory_path: str,
    session_token: str = Depends(get_current_session)
):
    """
    Parcourt un répertoire et retourne son contenu
    
    Args:
        directory_path: Chemin vers le répertoire (encodé en URL)
        session_token: Token de session (injecté automatiquement)
        
    Returns:
        Dict: Contenu du répertoire
    """
    try:
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
        
        return {
            "directory": str(directory_path_obj),
            "parent": str(directory_path_obj.parent) if directory_path_obj.parent != directory_path_obj else None,
            "items": directories + files,
            "total_items": len(items),
            "directories_count": len(directories),
            "files_count": len(files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du parcours du répertoire {directory_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


# Import manquant
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials 