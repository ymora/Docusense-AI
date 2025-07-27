"""
API endpoints pour l'analyse des fichiers multimédia
"""

from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
from typing import Dict, Any, Optional
import logging

from ..services.multimedia_service import MultimediaService
from ..core.file_utils import FileFormatManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/multimedia", tags=["multimedia"])


@router.get("/analyze/{file_path:path}")
async def analyze_multimedia_file(file_path: str) -> Dict[str, Any]:
    """
    Analyse un fichier multimédia et retourne ses métadonnées
    
    Args:
        file_path: Chemin vers le fichier (encodé en URL)
        
    Returns:
        Dict: Métadonnées du fichier multimédia
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = file_path.replace("%20", " ").replace("%2F", "/")
        file_path_obj = Path(decoded_path)
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        # Vérifier que c'est un fichier multimédia supporté
        extension = file_path_obj.suffix.lower()
        if not FileFormatManager.is_format_supported(extension):
            raise HTTPException(status_code=400, detail="Format de fichier non supporté")
        
        # Analyser le fichier
        media_info = MultimediaService.get_media_info(file_path_obj)
        
        return {
            "success": True,
            "file_path": str(file_path_obj),
            "file_name": file_path_obj.name,
            "media_info": media_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse multimédia: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.get("/thumbnail/{file_path:path}")
async def get_multimedia_thumbnail(
    file_path: str,
    width: int = Query(200, description="Largeur de la miniature"),
    height: int = Query(200, description="Hauteur de la miniature")
) -> Dict[str, Any]:
    """
    Génère une miniature pour un fichier multimédia
    
    Args:
        file_path: Chemin vers le fichier (encodé en URL)
        width: Largeur de la miniature
        height: Hauteur de la miniature
        
    Returns:
        Dict: Miniature en base64
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = file_path.replace("%20", " ").replace("%2F", "/")
        file_path_obj = Path(decoded_path)
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        # Vérifier que c'est un fichier multimédia supporté
        extension = file_path_obj.suffix.lower()
        if not FileFormatManager.is_format_supported(extension):
            raise HTTPException(status_code=400, detail="Format de fichier non supporté")
        
        # Générer la miniature
        thumbnail = MultimediaService.generate_thumbnail(file_path_obj, (width, height))
        
        if thumbnail:
            return {
                "success": True,
                "file_path": str(file_path_obj),
                "thumbnail": thumbnail,
                "dimensions": {"width": width, "height": height}
            }
        else:
            raise HTTPException(status_code=500, detail="Impossible de générer la miniature")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la génération de miniature: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.get("/supported-formats")
async def get_supported_multimedia_formats() -> Dict[str, Any]:
    """
    Retourne la liste des formats multimédia supportés
    
    Returns:
        Dict: Formats supportés par catégorie
    """
    try:
        return {
            "success": True,
            "formats": {
                "images": list(MultimediaService.SUPPORTED_IMAGE_FORMATS),
                "videos": list(MultimediaService.SUPPORTED_VIDEO_FORMATS),
                "audio": list(MultimediaService.SUPPORTED_AUDIO_FORMATS)
            },
            "total_formats": len(MultimediaService.SUPPORTED_IMAGE_FORMATS) + 
                           len(MultimediaService.SUPPORTED_VIDEO_FORMATS) + 
                           len(MultimediaService.SUPPORTED_AUDIO_FORMATS)
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des formats: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")


@router.get("/file-type/{file_path:path}")
async def get_multimedia_file_type(file_path: str) -> Dict[str, Any]:
    """
    Détermine le type de fichier multimédia
    
    Args:
        file_path: Chemin vers le fichier (encodé en URL)
        
    Returns:
        Dict: Type de fichier multimédia
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = file_path.replace("%20", " ").replace("%2F", "/")
        file_path_obj = Path(decoded_path)
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        # Déterminer le type
        file_type = MultimediaService.get_file_type(file_path_obj)
        
        return {
            "success": True,
            "file_path": str(file_path_obj),
            "file_name": file_path_obj.name,
            "file_type": file_type,
            "extension": file_path_obj.suffix.lower()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la détermination du type: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}") 