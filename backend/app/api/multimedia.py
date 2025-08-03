"""
API endpoints pour l'analyse et l'optimisation des fichiers multimédia
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Optional, Dict, Any
import logging

from ..core.database import get_db
from ..services.multimedia_service import MultimediaService
from ..models.file import File
from ..core.file_validation import FileValidator
from ..utils.api_utils import APIUtils, ResponseFormatter, FilePathValidator

logger = logging.getLogger(__name__)

router = APIRouter(tags=["multimedia"])


@router.get("/analyze/{file_path:path}")
@APIUtils.handle_errors
async def analyze_multimedia_file(file_path: str) -> Dict[str, Any]:
    """
    Analyse un fichier multimédia et retourne ses métadonnées
    
    Args:
        file_path: Chemin vers le fichier (encodé en URL)
        
    Returns:
        Dict: Métadonnées du fichier multimédia
    """
    # Décoder et valider le chemin du fichier
    decoded_path = file_path.replace("%20", " ").replace("%2F", "/")
    file_path_obj = FilePathValidator.validate_multimedia_file(decoded_path)
    
    # Analyser le fichier
    media_info = MultimediaService.get_media_info(file_path_obj)
    
    return ResponseFormatter.success_response(
        data={
            "file_path": str(file_path_obj),
            "file_name": file_path_obj.name,
            "media_info": media_info
        },
        message="Analyse multimédia terminée"
    )


@router.get("/thumbnail/{file_path:path}")
@APIUtils.handle_errors
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
    # Décoder et valider le chemin du fichier
    decoded_path = file_path.replace("%20", " ").replace("%2F", "/")
    file_path_obj = FilePathValidator.validate_multimedia_file(decoded_path)
    
    # Générer la miniature
    thumbnail = MultimediaService.generate_thumbnail(file_path_obj, (width, height))
    
    if not thumbnail:
        raise HTTPException(status_code=500, detail="Impossible de générer la miniature")
    
    return ResponseFormatter.success_response(
        data={
            "file_path": str(file_path_obj),
            "thumbnail": thumbnail,
            "dimensions": {"width": width, "height": height}
        },
        message="Miniature générée avec succès"
    )


@router.get("/supported-formats")
@APIUtils.handle_errors
async def get_supported_multimedia_formats() -> Dict[str, Any]:
    """
    Retourne la liste des formats multimédia supportés
    
    Returns:
        Dict: Formats supportés par catégorie
    """
    formats_data = {
        "images": list(MultimediaService.SUPPORTED_IMAGE_FORMATS),
        "videos": list(MultimediaService.SUPPORTED_VIDEO_FORMATS),
        "audio": list(MultimediaService.SUPPORTED_AUDIO_FORMATS)
    }
    
    total_formats = len(MultimediaService.SUPPORTED_IMAGE_FORMATS) + \
                   len(MultimediaService.SUPPORTED_VIDEO_FORMATS) + \
                   len(MultimediaService.SUPPORTED_AUDIO_FORMATS)
    
    return ResponseFormatter.success_response(
        data={
            "formats": formats_data,
            "total_formats": total_formats
        },
        message="Formats multimédia supportés récupérés"
    )


@router.get("/file-type/{file_path:path}")
@APIUtils.handle_errors
async def get_multimedia_file_type(file_path: str) -> Dict[str, Any]:
    """
    Détermine le type de fichier multimédia
    
    Args:
        file_path: Chemin vers le fichier (encodé en URL)
        
    Returns:
        Dict: Type de fichier multimédia
    """
    # Décoder et valider le chemin du fichier
    decoded_path = file_path.replace("%20", " ").replace("%2F", "/")
    file_path_obj = FilePathValidator.validate_multimedia_file(decoded_path)
    
    # Déterminer le type
    file_type = MultimediaService.get_file_type(file_path_obj)
    
    return ResponseFormatter.success_response(
        data={
            "file_path": str(file_path_obj),
            "file_name": file_path_obj.name,
            "file_type": file_type,
            "extension": file_path_obj.suffix.lower()
        },
        message="Type de fichier multimédia déterminé"
    )


@router.post("/optimize/{file_id}")
@APIUtils.handle_errors
async def optimize_multimedia(
    file_id: int,
    bandwidth_control: str = Query("auto", description="Contrôle de bande passante: auto, low, medium, high"),
    noise_reduction: bool = Query(False, description="Activer la réduction de bruit"),
    voice_enhancement: bool = Query(False, description="Activer l'amélioration de la voix"),
    audio_compression: bool = Query(False, description="Activer la compression audio"),
    video_compression: bool = Query(False, description="Activer la compression vidéo"),
    frame_rate: Optional[int] = Query(None, description="Framerate cible (24, 30, 60)"),
    db: Session = Depends(get_db)
):
    """
    Optimise un fichier multimédia avec les paramètres spécifiés
    """
    # Récupérer le fichier
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    file_path = Path(file.path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier physique non trouvé")
    
    # Vérifier le type de fichier
    file_type = MultimediaService.get_file_type(file_path)
    if file_type not in ['video', 'audio']:
        raise HTTPException(status_code=400, detail="Seuls les fichiers vidéo et audio peuvent être optimisés")
    
    # Paramètres d'optimisation
    optimization_settings = {
        'bandwidth_control': bandwidth_control,
        'noise_reduction': noise_reduction,
        'voice_enhancement': voice_enhancement,
        'audio_compression': audio_compression,
        'video_compression': video_compression,
        'frame_rate': frame_rate
    }
    
    # Créer le fichier optimisé
    optimized_file = MultimediaService.create_optimized_stream(file_path, optimization_settings)
    
    if not optimized_file:
        raise HTTPException(status_code=500, detail="Échec de l'optimisation")
    
    # Retourner le fichier optimisé
    return FileResponse(
        path=str(optimized_file),
        filename=f"optimized_{file.name}",
        media_type=file.mime_type
    )


@router.get("/stream-optimized/{file_id}")
@APIUtils.handle_errors
async def stream_optimized_multimedia(
    file_id: int,
    bandwidth_control: str = Query("auto", description="Contrôle de bande passante"),
    noise_reduction: bool = Query(False, description="Réduction de bruit"),
    voice_enhancement: bool = Query(False, description="Amélioration voix"),
    audio_compression: bool = Query(False, description="Compression audio"),
    video_compression: bool = Query(False, description="Compression vidéo"),
    frame_rate: Optional[int] = Query(None, description="Framerate"),
    db: Session = Depends(get_db)
):
    """
    Stream un fichier multimédia optimisé
    """
    # Récupérer le fichier
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    file_path = Path(file.path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier physique non trouvé")
    
    # Vérifier le type de fichier
    file_type = MultimediaService.get_file_type(file_path)
    if file_type not in ['video', 'audio']:
        raise HTTPException(status_code=400, detail="Seuls les fichiers vidéo et audio peuvent être optimisés")
    
    # Paramètres d'optimisation
    optimization_settings = {
        'bandwidth_control': bandwidth_control,
        'noise_reduction': noise_reduction,
        'voice_enhancement': voice_enhancement,
        'audio_compression': audio_compression,
        'video_compression': video_compression,
        'frame_rate': frame_rate
    }
    
    # Créer le fichier optimisé
    optimized_file = MultimediaService.create_optimized_stream(file_path, optimization_settings)
    
    if not optimized_file:
        raise HTTPException(status_code=500, detail="Échec de l'optimisation")
    
    # Stream le fichier optimisé
    def generate():
        with open(optimized_file, 'rb') as f:
            while chunk := f.read(8192):
                yield chunk
    
    return StreamingResponse(
        generate(),
        media_type=file.mime_type,
        headers={
            "Content-Disposition": f"inline; filename=optimized_{file.name}",
            "X-Optimized": "true",
            "X-Bandwidth-Control": bandwidth_control,
            "X-Noise-Reduction": str(noise_reduction).lower(),
            "X-Voice-Enhancement": str(voice_enhancement).lower()
        }
    )


@router.get("/optimization-info/{file_id}")
@APIUtils.handle_errors
async def get_optimization_info(
    file_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtient les informations d'optimisation disponibles pour un fichier
    """
    # Récupérer le fichier
    file = db.query(File).filter(File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    file_path = Path(file.path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier physique non trouvé")
    
    # Vérifier le type de fichier
    file_type = MultimediaService.get_file_type(file_path)
    if file_type not in ['video', 'audio']:
        raise HTTPException(status_code=400, detail="Seuls les fichiers vidéo et audio peuvent être optimisés")
    
    # Vérifier si FFmpeg est disponible
    ffmpeg_available = MultimediaService._check_ffmpeg()
    
    # Informations d'optimisation
    optimization_info = {
        'file_id': file_id,
        'file_name': file.name,
        'file_type': file_type,
        'file_size_mb': round(file_path.stat().st_size / (1024 * 1024), 2),
        'ffmpeg_available': ffmpeg_available,
        'optimization_options': {
            'bandwidth_control': {
                'available': True,
                'options': ['auto', 'low', 'medium', 'high'],
                'description': 'Contrôle de la bande passante pour le streaming'
            },
            'noise_reduction': {
                'available': ffmpeg_available,
                'description': 'Réduction du bruit de fond audio'
            },
            'voice_enhancement': {
                'available': ffmpeg_available,
                'description': 'Amélioration des fréquences vocales (300Hz-3kHz)'
            },
            'audio_compression': {
                'available': ffmpeg_available,
                'description': 'Compression dynamique audio'
            }
        }
    }
    
    # Options spécifiques aux vidéos
    if file_type == 'video':
        optimization_info['optimization_options']['video_compression'] = {
            'available': ffmpeg_available,
            'description': 'Compression vidéo avec contrôle de qualité'
        }
        optimization_info['optimization_options']['frame_rate'] = {
            'available': ffmpeg_available,
            'options': [24, 30, 60],
            'description': 'Contrôle du framerate'
        }
    
    return ResponseFormatter.success_response(
        data=optimization_info,
        message="Informations d'optimisation récupérées"
    )


@router.get("/ffmpeg-status")
@APIUtils.handle_errors
async def get_ffmpeg_status():
    """
    Vérifie le statut de FFmpeg
    """
    ffmpeg_available = MultimediaService._check_ffmpeg()
    
    status_data = {
        'ffmpeg_available': ffmpeg_available,
        'message': 'FFmpeg est disponible pour l\'optimisation' if ffmpeg_available else 'FFmpeg n\'est pas installé'
    }
    
    return ResponseFormatter.success_response(
        data=status_data,
        message="Statut FFmpeg vérifié"
    ) 