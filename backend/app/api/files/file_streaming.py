"""
Streaming et téléchargement de fichiers
"""

from fastapi import APIRouter, Depends, HTTPException, Response, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import logging
import os
from datetime import datetime

from ...core.database import get_db
from ...services.file_service import FileService
from ...services.download_service import download_service
from ...core.file_validation import FileValidator
from ...utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["file-streaming"])


class DownloadSelectedRequest(BaseModel):
    file_ids: List[int]


@router.get("/{file_id}/content")
@APIUtils.handle_errors
async def get_file_content(
    file_id: int,
    db: Session = Depends(get_db)
) -> Response:
    """Get the content of a text file for preview"""
    file_service = FileService(db)
    file_info = file_service.get_file_by_id(file_id)

    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")

    # Vérifier que le fichier existe sur le disque
    if not os.path.exists(file_info.path):
        raise HTTPException(
            status_code=404,
            detail="File not found on disk")

    # Vérifier que c'est un fichier texte
    mime_type = file_info.mime_type or ""
    if not mime_type.startswith('text/'):
        raise HTTPException(
            status_code=400,
            detail="File is not a text file")

    # Lire le contenu du fichier
    try:
        with open(file_info.path, 'r', encoding='utf-8') as f:
            content = f.read()

        return Response(content=content, media_type="text/plain")
    except UnicodeDecodeError:
        # Essayer avec un autre encodage
        try:
            with open(file_info.path, 'r', encoding='latin-1') as f:
                content = f.read()
            return Response(content=content, media_type="text/plain")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error reading file: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading file: {str(e)}")


@router.get("/{file_id}/download")
@APIUtils.handle_errors
async def download_file(
    file_id: int,
    db: Session = Depends(get_db)
) -> FileResponse:
    """Download a file"""
    file_service = FileService(db)
    file_info = file_service.get_file_by_id(file_id)

    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")

    # Vérifier que le fichier existe sur le disque
    if not os.path.exists(file_info.path):
        raise HTTPException(
            status_code=404,
            detail="File not found on disk")

    # Retourner le fichier
    return FileResponse(
        path=file_info.path,
        filename=file_info.name,
        media_type=file_info.mime_type
    )


@router.get("/download-by-path/{file_path:path}")
@APIUtils.handle_errors
async def download_file_by_path(
    file_path: str
) -> FileResponse:
    """Download a file by its path"""
    from pathlib import Path
    
    file_path_obj = Path(file_path)
    
    # Valider le fichier (format et taille)
    is_valid, error_message, mime_type = FileValidator.validate_file(file_path_obj)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)
    
    return download_service.download_file(file_path_obj)


@router.post("/download-selected")
@APIUtils.handle_errors
async def download_selected_files(
    request: DownloadSelectedRequest,
    db: Session = Depends(get_db)
) -> FileResponse:
    """Download selected files as a ZIP archive"""
    # Récupérer les fichiers par leurs IDs
    file_service = FileService(db)
    selected_files = []
    
    for file_id in request.file_ids:
        file = file_service.get_file_by_id(file_id)
        if file:
            selected_files.append(file)
    
    if not selected_files:
        raise HTTPException(status_code=400, detail="Aucun fichier sélectionné")
    
    # Convertir en chemins de fichiers
    from pathlib import Path
    file_paths = [Path(file.path) for file in selected_files]
    
    # Générer un nom de ZIP par défaut
    zip_name = f"selected_files_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    
    logger.info(f"Téléchargement de {len(file_paths)} fichiers sélectionnés")
    
    return download_service.download_multiple_files(file_paths, zip_name)


@router.get("/{file_id}/stream")
@APIUtils.handle_errors
async def stream_file(
    file_id: int,
    range: Optional[str] = Header(None, alias="Range"),
    db: Session = Depends(get_db)
) -> FileResponse:
    """Stream a file directly from disk for audio/video playback"""
    file_service = FileService(db)
    file_info = file_service.get_file_by_id(file_id)

    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")

    # Vérifier que le fichier existe sur le disque
    if not os.path.exists(file_info.path):
        raise HTTPException(
            status_code=404,
            detail="File not found on disk")

    # Utiliser FileResponse qui gère automatiquement les range requests
    return FileResponse(
        path=file_info.path,
        filename=file_info.name,
        media_type=file_info.mime_type,
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",  # Cache pour 1 heure
        }
    )


@router.get("/stream-by-path/{file_path:path}")
@APIUtils.handle_errors
async def stream_file_by_path(
    file_path: str,
    range: Optional[str] = Header(None, alias="Range")
) -> FileResponse:
    """Stream a file by its path directly from disk for visualization"""
    from urllib.parse import unquote
    from pathlib import Path
    
    # Log de début avec l'URL encodée
    logger.info(f"STREAM-BY-PATH REQUEST - Encoded URL: {file_path}")
    
    # Décoder l'URL pour gérer les caractères spéciaux
    decoded_path = unquote(file_path)
    logger.info(f"STREAM-BY-PATH REQUEST - Decoded path: {decoded_path}")
    
    file_path_obj = Path(decoded_path)
    logger.info(f"STREAM-BY-PATH REQUEST - Path object: {file_path_obj}")
    
    # Vérifier que le fichier existe
    if not file_path_obj.exists():
        error_msg = f"File not found: {decoded_path}"
        logger.error(f"STREAM-BY-PATH ERROR - {error_msg}")
        raise HTTPException(status_code=404, detail=f"Fichier non trouvé: {file_path_obj.name}")
    
    if not file_path_obj.is_file():
        error_msg = f"Path is not a file: {decoded_path}"
        logger.error(f"STREAM-BY-PATH ERROR - {error_msg}")
        raise HTTPException(status_code=400, detail="Le chemin ne correspond pas à un fichier")
    
    logger.info(f"STREAM-BY-PATH - File exists and is valid: {file_path_obj}")
    
    # Valider le fichier (format uniquement)
    is_valid, error_message, mime_type = FileValidator.validate_file(file_path_obj)
    
    logger.info(f"STREAM-BY-PATH - Validation result: valid={is_valid}, mime_type={mime_type}")
    
    if not is_valid:
        logger.error(f"STREAM-BY-PATH ERROR - File validation failed: {error_message}")
        raise HTTPException(status_code=400, detail=error_message)
    
    logger.info(f"STREAM-BY-PATH - File validated successfully, streaming: {file_path_obj}")
    
    # Utiliser FileResponse qui gère automatiquement les range requests et le streaming
    return FileResponse(
        path=str(file_path_obj),
        media_type=mime_type,
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",  # Cache pour 1 heure
            "Content-Disposition": "inline",  # Force l'affichage dans le navigateur
            "X-Content-Type-Options": "nosniff",  # Empêche le navigateur de deviner le type
            "Content-Type": mime_type,  # Force le type MIME
        }
    ) 