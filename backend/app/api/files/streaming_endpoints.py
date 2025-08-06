"""
Endpoints de streaming en temps réel avec FFmpeg
"""

from fastapi import APIRouter, Depends, HTTPException, Response, Query, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import logging
from pathlib import Path
from urllib.parse import unquote

from ...core.database import get_db
from ...services.streaming_service import streaming_service
from ...core.file_validation import FileValidator
from ...utils.api_utils import APIUtils

logger = logging.getLogger(__name__)

router = APIRouter(tags=["real-time-streaming"])


@router.get("/stream-realtime/{file_path:path}")
@APIUtils.handle_errors
async def stream_realtime(
    file_path: str,
    quality: Optional[str] = Query("medium", description="Qualité de transcodage (low, medium, high)"),
    start_time: Optional[float] = Query(None, description="Temps de début en secondes"),
    duration: Optional[float] = Query(None, description="Durée en secondes"),
    chunk_size: Optional[int] = Query(8192, description="Taille des chunks")
) -> StreamingResponse:
    """
    Stream un fichier audio/vidéo en temps réel avec transcodage FFmpeg
    
    Supporte tous les formats audio/vidéo et les transcode en temps réel
    vers des formats compatibles navigateur (MP4/WebM pour vidéo, MP3/OGG pour audio)
    
    Args:
        file_path: Chemin vers le fichier (URL encodé)
        quality: Qualité de transcodage
        start_time: Temps de début pour le streaming
        duration: Durée du streaming
        chunk_size: Taille des chunks de données
    
    Returns:
        StreamingResponse: Flux de données audio/vidéo transcodées
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        logger.info(f"🎬 STREAM-REALTIME - Demande: {decoded_path}")
        logger.info(f"🎬 STREAM-REALTIME - Paramètres: quality={quality}, start_time={start_time}, duration={duration}")
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            logger.error(f"🎬 STREAM-REALTIME - Fichier non trouvé: {decoded_path}")
            raise HTTPException(status_code=404, detail=f"Fichier non trouvé: {file_path_obj.name}")
        
        if not file_path_obj.is_file():
            logger.error(f"🎬 STREAM-REALTIME - Chemin invalide: {decoded_path}")
            raise HTTPException(status_code=400, detail="Le chemin ne correspond pas à un fichier")
        
        # Valider le fichier
        is_valid, error_message, mime_type = FileValidator.validate_file(file_path_obj)
        if not is_valid:
            logger.error(f"🎬 STREAM-REALTIME - Validation échouée: {error_message}")
            raise HTTPException(status_code=400, detail=error_message)
        
        # Déterminer le type de média
        media_type = streaming_service.get_media_type(str(file_path_obj))
        if media_type == 'unknown':
            logger.error(f"🎬 STREAM-REALTIME - Type de média non reconnu: {decoded_path}")
            raise HTTPException(status_code=400, detail="Type de média non supporté")
        
        # Vérifier si le format est supporté pour le streaming
        if not streaming_service.is_streamable_format(str(file_path_obj)):
            logger.error(f"🎬 STREAM-REALTIME - Format non supporté: {decoded_path}")
            raise HTTPException(status_code=400, detail="Format non supporté pour le streaming")
        
        # Vérifier que FFmpeg est disponible
        if not streaming_service.ffmpeg_path:
            logger.error("🎬 STREAM-REALTIME - FFmpeg non disponible")
            raise HTTPException(status_code=503, detail="FFmpeg non disponible pour le streaming en temps réel")
        
        logger.info(f"🎬 STREAM-REALTIME - Démarrage streaming: {media_type} - {decoded_path}")
        
        # Obtenir la configuration de sortie
        output_config = streaming_service.get_output_format(media_type, quality)
        
        # Générer les headers HTTP
        headers = streaming_service.get_http_headers(media_type, output_config['format'])
        
        # Créer le générateur de streaming
        async def generate_stream():
            try:
                async for chunk in streaming_service.stream_media(
                    file_path=str(file_path_obj),
                    media_type=media_type,
                    quality=quality,
                    start_time=start_time,
                    duration=duration,
                    chunk_size=chunk_size
                ):
                    yield chunk
            except Exception as e:
                logger.error(f"🎬 STREAM-REALTIME - Erreur de streaming: {str(e)}")
                # Ne pas lever d'exception ici, juste logger l'erreur
                return
        
        logger.info(f"🎬 STREAM-REALTIME - Streaming démarré: {media_type} - {output_config['format']}")
        
        return StreamingResponse(
            generate_stream(),
            media_type=headers['Content-Type'],
            headers=headers
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🎬 STREAM-REALTIME - Erreur inattendue: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur serveur interne")


@router.get("/stream-info/{file_path:path}")
@APIUtils.handle_errors
async def get_stream_info(file_path: str) -> dict:
    """
    Obtenir les informations de streaming pour un fichier
    
    Args:
        file_path: Chemin vers le fichier (URL encodé)
    
    Returns:
        dict: Informations sur le fichier et ses capacités de streaming
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        logger.info(f"ℹ️ STREAM-INFO - Demande: {decoded_path}")
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        if not file_path_obj.is_file():
            raise HTTPException(status_code=400, detail="Le chemin ne correspond pas à un fichier")
        
        # Obtenir les informations du fichier
        file_size = file_path_obj.stat().st_size
        media_type = streaming_service.get_media_type(str(file_path_obj))
        is_streamable = streaming_service.is_streamable_format(str(file_path_obj))
        ffmpeg_available = streaming_service.ffmpeg_path is not None
        
        # Informations de base
        info = {
            "file_path": str(file_path_obj),
            "file_name": file_path_obj.name,
            "file_size": file_size,
            "file_size_mb": round(file_size / (1024 * 1024), 2),
            "media_type": media_type,
            "is_streamable": is_streamable,
            "ffmpeg_available": ffmpeg_available,
            "can_stream_realtime": is_streamable and ffmpeg_available
        }
        
        # Si c'est un média streamable, ajouter les options de qualité
        if is_streamable and media_type in ['video', 'audio']:
            output_config = streaming_service.get_output_format(media_type, 'medium')
            info.update({
                "output_format": output_config['format'],
                "content_type": streaming_service.get_content_type(media_type, output_config['format']),
                "quality_options": ["low", "medium", "high"],
                "supports_seeking": True,
                "supports_duration": True
            })
        
        logger.info(f"ℹ️ STREAM-INFO - Informations: {info}")
        
        return info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ℹ️ STREAM-INFO - Erreur: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur serveur interne")


@router.head("/stream-realtime/{file_path:path}")
@APIUtils.handle_errors
async def head_stream_realtime(
    file_path: str,
    quality: Optional[str] = Query("medium", description="Qualité de transcodage")
) -> Response:
    """
    Headers pour le streaming en temps réel (CORS preflight)
    
    Args:
        file_path: Chemin vers le fichier (URL encodé)
        quality: Qualité de transcodage
    
    Returns:
        Response: Headers HTTP pour le streaming
    """
    try:
        # Décoder le chemin du fichier
        decoded_path = unquote(file_path)
        file_path_obj = Path(decoded_path)
        
        # Vérifier que le fichier existe
        if not file_path_obj.exists():
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        if not file_path_obj.is_file():
            raise HTTPException(status_code=400, detail="Le chemin ne correspond pas à un fichier")
        
        # Déterminer le type de média
        media_type = streaming_service.get_media_type(str(file_path_obj))
        if media_type == 'unknown':
            raise HTTPException(status_code=400, detail="Type de média non supporté")
        
        # Obtenir la configuration de sortie
        output_config = streaming_service.get_output_format(media_type, quality)
        
        # Générer les headers HTTP
        headers = streaming_service.get_http_headers(media_type, output_config['format'])
        
        return Response(
            status_code=200,
            headers=headers
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"HEAD STREAM-REALTIME - Erreur: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur serveur interne") 