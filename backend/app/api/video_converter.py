from fastapi import APIRouter, HTTPException, Response, Query
from fastapi.responses import StreamingResponse
import os
from pathlib import Path
from typing import Optional
import logging
from ..services.video_converter_service import media_converter

logger = logging.getLogger(__name__)
router = APIRouter(tags=["media"])

@router.get("/convert-status/{file_path:path}")
async def get_conversion_status(file_path: str):
    """Récupère le statut de conversion d'un fichier média"""
    try:
        # Décoder le chemin du fichier
        decoded_path = file_path.replace('%3A', ':').replace('%2F', '/').replace('%5C', '\\')
        
        if not os.path.exists(decoded_path):
            raise HTTPException(status_code=404, detail="Fichier introuvable")
        
        status = media_converter.get_conversion_status(decoded_path)
        return {
            "file_path": decoded_path,
            "status": status['status'],
            "progress": status['progress'],
            "error": status['error'],
            "media_type": status['media_type'],
            "is_optimized": media_converter.is_format_web_optimized(decoded_path)
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du statut: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start-conversion/{file_path:path}")
async def start_media_conversion(file_path: str, force_convert: bool = Query(False, description="Forcer la conversion même si optimisé")):
    """Démarre la conversion d'un fichier média"""
    try:
        # Décoder le chemin du fichier
        decoded_path = file_path.replace('%3A', ':').replace('%2F', '/').replace('%5C', '\\')
        
        if not os.path.exists(decoded_path):
            raise HTTPException(status_code=404, detail="Fichier introuvable")
        
        # Démarrer la conversion
        media_converter.start_conversion(decoded_path, force_convert)
        
        return {
            "message": "Conversion démarrée",
            "status": "converting",
            "file_path": decoded_path,
            "media_type": media_converter.get_media_type(decoded_path)
        }
    except Exception as e:
        logger.error(f"Erreur lors du démarrage de la conversion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stream-converted/{file_path:path}")
async def stream_converted_media(file_path: str):
    """Stream un fichier média converti"""
    try:
        # Décoder le chemin du fichier
        decoded_path = file_path.replace('%3A', ':').replace('%2F', '/').replace('%5C', '\\')
        
        if not os.path.exists(decoded_path):
            raise HTTPException(status_code=404, detail="Fichier original introuvable")
        
        # Vérifier si une version convertie existe
        converted_path = media_converter.get_converted_file_path(decoded_path)
        
        if not converted_path or not os.path.exists(converted_path):
            # Si pas de version convertie, démarrer la conversion
            if not media_converter.is_format_web_optimized(decoded_path):
                media_converter.start_conversion(decoded_path)
                raise HTTPException(
                    status_code=202, 
                    detail="Conversion en cours, réessayez dans quelques secondes"
                )
            else:
                # Format optimisé, utiliser le fichier original
                converted_path = decoded_path
        
        # Stream le fichier converti
        def generate():
            with open(converted_path, 'rb') as f:
                while chunk := f.read(8192):
                    yield chunk
        
        # Déterminer le type MIME selon le type de média
        media_type = media_converter.get_media_type(decoded_path)
        file_ext = Path(converted_path).suffix.lower()
        
        if media_type == 'video':
            mime_type = {
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogg': 'video/ogg',
                '.mov': 'video/quicktime'
            }.get(file_ext, 'video/mp4')
        else:  # audio
            mime_type = {
                '.m4a': 'audio/mp4',
                '.mp3': 'audio/mpeg',
                '.ogg': 'audio/ogg',
                '.wav': 'audio/wav',
                '.aac': 'audio/aac'
            }.get(file_ext, 'audio/mp4')
        
        return StreamingResponse(
            generate(),
            media_type=mime_type,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Disposition": f"inline; filename={Path(decoded_path).name}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du streaming: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cleanup")
async def cleanup_old_conversions():
    """Nettoie les anciennes conversions"""
    try:
        media_converter.cleanup_old_conversions()
        return {"message": "Nettoyage terminé"}
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/performance")
async def get_conversion_performance():
    """Récupère les statistiques de performance de conversion"""
    try:
        # Analyser les performances FFmpeg
        import subprocess
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        ffmpeg_version = result.stdout.split('\n')[0] if result.returncode == 0 else "FFmpeg non disponible"
        
        # Statistiques du cache
        cache_stats = {
            "total_conversions": len(media_converter.conversion_cache),
            "completed": sum(1 for info in media_converter.conversion_cache.values() if info.get('status') == 'completed'),
            "converting": sum(1 for info in media_converter.conversion_cache.values() if info.get('status') == 'converting'),
            "errors": sum(1 for info in media_converter.conversion_cache.values() if info.get('status') == 'error'),
            "optimized": sum(1 for info in media_converter.conversion_cache.values() if info.get('status') == 'optimized')
        }
        
        return {
            "ffmpeg_version": ffmpeg_version,
            "cache_stats": cache_stats,
            "supported_formats": {
                "web_optimized": ['.mp4', '.webm', '.ogg', '.m4a', '.opus'],
                "requires_conversion": ['.avi', '.wmv', '.flv', '.mkv', '.mov', '.m4v', '.3gp', '.ogv', '.ts', '.mts', '.m2ts', '.asf', '.rm', '.rmvb', '.divx', '.xvid', '.h264', '.h265', '.vp8', '.vp9', '.mpeg', '.mpg', '.mpe', '.m1v', '.m2v', '.mpv', '.mp2', '.m2p', '.ps', '.evo', '.ogm', '.ogx', '.mxf', '.nut', '.hls', '.m3u8'],
                "audio_native": ['.mp3', '.wav', '.flac', '.aac', '.wma', '.aiff', '.au', '.ra', '.rm', '.wv', '.ape', '.alac', '.ac3', '.dts', '.amr', '.3ga', '.mka', '.tta', '.mid', '.midi']
            }
        }
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse des performances: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 