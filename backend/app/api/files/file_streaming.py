"""
Streaming et téléchargement de fichiers
"""

from fastapi import APIRouter, Depends, HTTPException, Response, Header, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import logging
import os
from pathlib import Path
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
    range: Optional[str] = Header(None, alias="Range"),
    native: Optional[bool] = Query(False, description="Force native browser player"),
    direct: Optional[bool] = Query(False, description="Force direct download"),
    hls: Optional[bool] = Query(False, description="Convert to HLS for better compatibility")
) -> FileResponse:
    """Stream a file by its path directly from disk for visualization"""
    logger.info(f"🎬 GET-STREAM-BY-PATH - FONCTION APPELÉE avec file_path={file_path}, hls={hls}, native={native}, direct={direct}")
    from urllib.parse import unquote
    from pathlib import Path
    
    # Log de début avec l'URL encodée
    logger.info(f"GET-STREAM-BY-PATH REQUEST - Encoded URL: {file_path}")
    
    # Décoder l'URL pour gérer les caractères spéciaux
    decoded_path = unquote(file_path)
    logger.info(f"GET-STREAM-BY-PATH REQUEST - Decoded path: {decoded_path}")
    
    file_path_obj = Path(decoded_path)
    logger.info(f"GET-STREAM-BY-PATH REQUEST - Path object: {file_path_obj}")
    
    # Vérifier que le fichier existe
    if not file_path_obj.exists():
        error_msg = f"File not found: {decoded_path}"
        logger.error(f"GET-STREAM-BY-PATH ERROR - {error_msg}")
        raise HTTPException(status_code=404, detail=f"Fichier non trouvé: {file_path_obj.name}")
    
    if not file_path_obj.is_file():
        error_msg = f"Path is not a file: {decoded_path}"
        logger.error(f"GET-STREAM-BY-PATH ERROR - {error_msg}")
        raise HTTPException(status_code=400, detail="Le chemin ne correspond pas à un fichier")
    
    logger.info(f"GET-STREAM-BY-PATH - File exists and is valid: {file_path_obj}")
    
    # Valider le fichier (format uniquement)
    is_valid, error_message, mime_type = FileValidator.validate_file(file_path_obj)
    
    logger.info(f"GET-STREAM-BY-PATH - Validation result: valid={is_valid}, mime_type={mime_type}")
    
    if not is_valid:
        logger.error(f"GET-STREAM-BY-PATH ERROR - File validation failed: {error_message}")
        raise HTTPException(status_code=400, detail=error_message)
    
    logger.info(f"GET-STREAM-BY-PATH - File validated successfully, streaming: {file_path_obj}")
    
    # Log des paramètres reçus
    logger.info(f"GET-STREAM-BY-PATH - Paramètres: direct={direct}, native={native}, hls={hls}, mime_type={mime_type}")
    logger.info(f"GET-STREAM-BY-PATH - Condition HLS: hls={hls}, mime_type.startswith('video/')={mime_type.startswith('video/')}")
    logger.info(f"GET-STREAM-BY-PATH - Condition HLS satisfaite: {hls and mime_type.startswith('video/')}")
    
    # Déterminer le type de réponse selon les paramètres
    if direct:
        # Mode téléchargement direct
        headers = {
            "Content-Disposition": f"attachment; filename=\"{file_path_obj.name}\"",
            "Content-Type": mime_type,
            "Cache-Control": "no-cache",
        }
    elif hls and mime_type.startswith('video/'):
        # Mode HLS pour vidéos seulement - conversion automatique si nécessaire
        try:
            from ...services.video_converter_service import media_converter
            
            # Vérifier si le fichier est déjà en format HLS
            if file_path_obj.suffix.lower() in ['.m3u8', '.ts']:
                # Déjà en HLS, streamer directement
                headers = {
                    "Accept-Ranges": "bytes",
                    "Cache-Control": "public, max-age=3600",
                    "Content-Disposition": "inline",
                    "X-Content-Type-Options": "nosniff",
                    "Content-Type": "application/vnd.apple.mpegurl" if file_path_obj.suffix.lower() == '.m3u8' else "video/mp2t",
                    "X-Player-Mode": "hls",
                }
            else:
                # Convertir en HLS si FFmpeg est disponible
                if media_converter._check_ffmpeg():
                    logger.info(f"HLS - FFmpeg disponible, conversion démarrée pour: {file_path_obj}")
                    # Démarrer la conversion HLS
                    hls_path = media_converter.convert_to_hls(str(file_path_obj))
                    logger.info(f"HLS - Résultat conversion: {hls_path}")
                    if hls_path and Path(hls_path).exists():
                        # Modifier le contenu du fichier .m3u8 pour utiliser des URLs absolues
                        hls_content = Path(hls_path).read_text()
                        hls_dir = Path(hls_path).parent
                        
                        # Remplacer les chemins relatifs par des URLs absolues
                        modified_content = ""
                        for line in hls_content.split('\n'):
                            if line.strip() and not line.startswith('#') and line.endswith('.ts'):
                                # C'est un segment .ts, créer une URL absolue
                                segment_name = line.strip()
                                # Encoder le chemin du dossier pour éviter les problèmes avec les espaces
                                encoded_dir = unquote(str(hls_dir)).replace('\\', '/')
                                # Encoder les caractères spéciaux dans le chemin
                                from urllib.parse import quote
                                encoded_dir = quote(encoded_dir, safe='')
                                segment_url = f"/api/files/hls-segment/{encoded_dir}/{segment_name}"
                                modified_content += segment_url + '\n'
                            else:
                                modified_content += line + '\n'
                        
                        # Retourner le contenu modifié
                        headers = {
                            "Accept-Ranges": "bytes",
                            "Cache-Control": "public, max-age=3600",
                            "Content-Disposition": "inline",
                            "X-Content-Type-Options": "nosniff",
                            "Content-Type": "application/vnd.apple.mpegurl",
                            "X-Player-Mode": "hls",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                            "Access-Control-Allow-Headers": "*",
                        }
                        
                        return Response(
                            content=modified_content,
                            media_type="application/vnd.apple.mpegurl",
                            headers=headers
                        )
                    else:
                        logger.warning(f"HLS - Échec de la conversion, fallback vers streaming natif")
                        # Fallback vers streaming natif
                        headers = {
                            "Accept-Ranges": "bytes",
                            "Cache-Control": "public, max-age=3600",
                            "Content-Disposition": "inline",
                            "X-Content-Type-Options": "nosniff",
                            "Content-Type": mime_type,
                            "X-Player-Mode": "native",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                            "Access-Control-Allow-Headers": "*",
                        }
                else:
                    logger.warning(f"HLS - FFmpeg non disponible, fallback vers streaming natif")
                    # Fallback vers streaming natif
                    headers = {
                        "Accept-Ranges": "bytes",
                        "Cache-Control": "public, max-age=3600",
                        "Content-Disposition": "inline",
                        "X-Content-Type-Options": "nosniff",
                        "Content-Type": mime_type,
                        "X-Player-Mode": "native",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                        "Access-Control-Allow-Headers": "*",
                    }
        except Exception as e:
            logger.error(f"HLS - Erreur lors de la conversion: {str(e)}")
            # Fallback vers streaming natif en cas d'erreur
            headers = {
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": "inline",
                "X-Content-Type-Options": "nosniff",
                "Content-Type": mime_type,
                "X-Player-Mode": "native",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
    else:
        # Mode streaming natif (par défaut)
        headers = {
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": "inline",
            "X-Content-Type-Options": "nosniff",
            "Content-Type": mime_type,
            "X-Player-Mode": "native",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    
    # Utiliser FileResponse qui gère automatiquement les range requests et le streaming
    return FileResponse(
        path=str(file_path_obj),
        media_type=mime_type,
        headers=headers
    )


@router.get("/hls-segment/{hls_dir:path}/{segment_name}")
@APIUtils.handle_errors
async def serve_hls_segment(
    hls_dir: str,
    segment_name: str
) -> FileResponse:
    """Serve HLS segments (.ts files) with proper CORS headers"""
    from urllib.parse import unquote
    from pathlib import Path
    
    try:
        # Décoder les paramètres
        decoded_dir = unquote(hls_dir)
        decoded_segment = unquote(segment_name)
        
        # Construire le chemin complet
        segment_path = Path(decoded_dir) / decoded_segment
        
        logger.info(f"HLS-SEGMENT - Demande: {segment_name} depuis {decoded_dir}")
        logger.info(f"HLS-SEGMENT - Chemin complet: {segment_path}")
        
        # Vérifier que le fichier existe
        if not segment_path.exists():
            logger.error(f"HLS-SEGMENT - Segment non trouvé: {segment_path}")
            raise HTTPException(status_code=404, detail=f"Segment HLS non trouvé: {segment_name}")
        
        if not segment_path.is_file():
            logger.error(f"HLS-SEGMENT - Chemin invalide: {segment_path}")
            raise HTTPException(status_code=400, detail="Chemin invalide")
        
        # Vérifier que c'est bien un fichier .ts
        if not segment_path.suffix.lower() == '.ts':
            logger.error(f"HLS-SEGMENT - Type de fichier invalide: {segment_path}")
            raise HTTPException(status_code=400, detail="Type de fichier invalide")
        
        # Headers pour les segments HLS
        headers = {
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
            "Content-Type": "video/mp2t",
            "X-Content-Type-Options": "nosniff",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
        
        logger.info(f"HLS-SEGMENT - Servir: {segment_path}")
        
        return FileResponse(
            path=str(segment_path),
            media_type="video/mp2t",
            headers=headers
        )
        
    except Exception as e:
        logger.error(f"HLS-SEGMENT - Erreur: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")


@router.head("/stream-by-path/{file_path:path}")
@APIUtils.handle_errors
async def head_file_by_path(
    file_path: str,
    hls: Optional[bool] = Query(False, description="Convert to HLS for better compatibility")
) -> Response:
    """Get file headers by path for CORS preflight and validation"""
    from urllib.parse import unquote
    from pathlib import Path
    
    # Log de début avec l'URL encodée
    logger.info(f"HEAD-STREAM-BY-PATH REQUEST - Encoded URL: {file_path}")
    
    # Décoder l'URL pour gérer les caractères spéciaux
    decoded_path = unquote(file_path)
    logger.info(f"HEAD-STREAM-BY-PATH REQUEST - Decoded path: {decoded_path}")
    
    file_path_obj = Path(decoded_path)
    logger.info(f"HEAD-STREAM-BY-PATH REQUEST - Path object: {file_path_obj}")
    
    # Vérifier que le fichier existe
    if not file_path_obj.exists():
        error_msg = f"File not found: {decoded_path}"
        logger.error(f"HEAD-STREAM-BY-PATH ERROR - {error_msg}")
        raise HTTPException(status_code=404, detail=f"Fichier non trouvé: {file_path_obj.name}")
    
    if not file_path_obj.is_file():
        error_msg = f"Path is not a file: {decoded_path}"
        logger.error(f"HEAD-STREAM-BY-PATH ERROR - {error_msg}")
        raise HTTPException(status_code=400, detail="Le chemin ne correspond pas à un fichier")
    
    logger.info(f"HEAD-STREAM-BY-PATH - File exists and is valid: {file_path_obj}")
    
    # Valider le fichier (format uniquement)
    is_valid, error_message, mime_type = FileValidator.validate_file(file_path_obj)
    
    logger.info(f"HEAD-STREAM-BY-PATH - Validation result: valid={is_valid}, mime_type={mime_type}")
    
    if not is_valid:
        logger.error(f"HEAD-STREAM-BY-PATH ERROR - File validation failed: {error_message}")
        raise HTTPException(status_code=400, detail=error_message)
    
    logger.info(f"HEAD-STREAM-BY-PATH - File validated successfully, returning headers: {file_path_obj}")
    
    # Retourner seulement les headers sans le contenu
    # Pour les vidéos avec HLS, retourner le bon Content-Type
    content_type = mime_type
    if hls and mime_type.startswith('video/'):
        content_type = "application/vnd.apple.mpegurl"
    
    return Response(
        status_code=200,
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",  # Cache pour 1 heure
            "Content-Disposition": "inline",  # Force l'affichage dans le navigateur
            "X-Content-Type-Options": "nosniff",  # Empêche le navigateur de deviner le type
            "Content-Type": content_type,  # Force le type MIME
            "Content-Length": str(file_path_obj.stat().st_size),  # Taille du fichier
        }
    ) 