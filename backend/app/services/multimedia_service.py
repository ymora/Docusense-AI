"""
Service de gestion des fichiers multimédia
"""

import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
import mimetypes
from PIL import Image, ImageOps
import cv2
import numpy as np
from moviepy.editor import VideoFileClip, AudioFileClip
import librosa
import librosa.display
import json
import base64
from io import BytesIO
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)


class MultimediaService:
    """
    Service pour l'analyse et le traitement des fichiers multimédia
    """

    # Formats supportés par catégorie
    SUPPORTED_IMAGE_FORMATS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.ico'}
    SUPPORTED_VIDEO_FORMATS = {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'}
    SUPPORTED_AUDIO_FORMATS = {'.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'}

    @staticmethod
    def get_file_type(file_path: Path) -> str:
        """
        Détermine le type de fichier multimédia
        
        Args:
            file_path: Chemin vers le fichier
            
        Returns:
            str: Type de fichier ('image', 'video', 'audio', 'unknown')
        """
        extension = file_path.suffix.lower()
        
        if extension in MultimediaService.SUPPORTED_IMAGE_FORMATS:
            return 'image'
        elif extension in MultimediaService.SUPPORTED_VIDEO_FORMATS:
            return 'video'
        elif extension in MultimediaService.SUPPORTED_AUDIO_FORMATS:
            return 'audio'
        else:
            return 'unknown'

    @staticmethod
    def analyze_image(file_path: Path) -> Dict[str, Any]:
        """
        Analyse une image et extrait ses métadonnées
        
        Args:
            file_path: Chemin vers l'image
            
        Returns:
            Dict: Métadonnées de l'image
        """
        try:
            with Image.open(file_path) as img:
                # Informations de base
                width, height = img.size
                mode = img.mode
                format_name = img.format
                
                # Métadonnées EXIF si disponibles
                exif_data = {}
                if hasattr(img, '_getexif') and img._getexif():
                    exif_data = img._getexif()
                
                # Analyse des couleurs dominantes
                colors = MultimediaService._extract_dominant_colors(img)
                
                # Calcul de la taille en MB
                file_size = file_path.stat().st_size / (1024 * 1024)
                
                return {
                    'type': 'image',
                    'format': format_name,
                    'dimensions': {'width': width, 'height': height},
                    'mode': mode,
                    'file_size_mb': round(file_size, 2),
                    'dominant_colors': colors,
                    'exif_data': exif_data,
                    'aspect_ratio': round(width / height, 2) if height > 0 else 0
                }
                
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse de l'image {file_path}: {e}")
            return {'type': 'image', 'error': str(e)}

    @staticmethod
    def analyze_video(file_path: Path) -> Dict[str, Any]:
        """
        Analyse une vidéo et extrait ses métadonnées
        
        Args:
            file_path: Chemin vers la vidéo
            
        Returns:
            Dict: Métadonnées de la vidéo
        """
        try:
            # Utiliser OpenCV pour les métadonnées de base
            cap = cv2.VideoCapture(str(file_path))
            
            if not cap.isOpened():
                return {'type': 'video', 'error': 'Impossible d\'ouvrir la vidéo'}
            
            # Informations de base
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            
            cap.release()
            
            # Utiliser MoviePy pour plus d'informations
            try:
                with VideoFileClip(str(file_path)) as video:
                    # Codec et bitrate
                    codec = video.codec if hasattr(video, 'codec') else 'unknown'
                    
                    # Audio info si disponible
                    audio_info = {}
                    if video.audio is not None:
                        audio_info = {
                            'has_audio': True,
                            'audio_fps': video.audio.fps,
                            'audio_duration': video.audio.duration
                        }
                    else:
                        audio_info = {'has_audio': False}
                        
            except Exception as e:
                logger.warning(f"MoviePy analysis failed for {file_path}: {e}")
                codec = 'unknown'
                audio_info = {'has_audio': False}
            
            # Taille du fichier
            file_size = file_path.stat().st_size / (1024 * 1024)
            
            return {
                'type': 'video',
                'dimensions': {'width': width, 'height': height},
                'duration_seconds': round(duration, 2),
                'fps': round(fps, 2),
                'frame_count': frame_count,
                'codec': codec,
                'file_size_mb': round(file_size, 2),
                'audio_info': audio_info,
                'aspect_ratio': round(width / height, 2) if height > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse de la vidéo {file_path}: {e}")
            return {'type': 'video', 'error': str(e)}

    @staticmethod
    def analyze_audio(file_path: Path) -> Dict[str, Any]:
        """
        Analyse un fichier audio et extrait ses métadonnées
        
        Args:
            file_path: Chemin vers le fichier audio
            
        Returns:
            Dict: Métadonnées du fichier audio
        """
        try:
            # Utiliser librosa pour l'analyse audio
            y, sr = librosa.load(str(file_path), sr=None)
            
            # Informations de base
            duration = librosa.get_duration(y=y, sr=sr)
            sample_rate = sr
            
            # Analyse spectrale
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            
            # Tempo
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            
            # Taille du fichier
            file_size = file_path.stat().st_size / (1024 * 1024)
            
            return {
                'type': 'audio',
                'duration_seconds': round(duration, 2),
                'sample_rate': sample_rate,
                'tempo_bpm': round(tempo, 2),
                'file_size_mb': round(file_size, 2),
                'spectral_analysis': {
                    'centroid_mean': float(np.mean(spectral_centroids)),
                    'rolloff_mean': float(np.mean(spectral_rolloff))
                }
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse audio {file_path}: {e}")
            return {'type': 'audio', 'error': str(e)}

    @staticmethod
    def generate_thumbnail(file_path: Path, max_size: Tuple[int, int] = (200, 200)) -> Optional[str]:
        """
        Génère une miniature pour un fichier multimédia
        
        Args:
            file_path: Chemin vers le fichier
            max_size: Taille maximale de la miniature (width, height)
            
        Returns:
            str: Base64 de la miniature ou None
        """
        try:
            file_type = MultimediaService.get_file_type(file_path)
            
            if file_type == 'image':
                return MultimediaService._create_image_thumbnail(file_path, max_size)
            elif file_type == 'video':
                return MultimediaService._create_video_thumbnail(file_path, max_size)
            elif file_type == 'audio':
                return MultimediaService._create_audio_thumbnail(file_path, max_size)
            else:
                return None
                
        except Exception as e:
            logger.error(f"Erreur lors de la génération de miniature {file_path}: {e}")
            return None

    @staticmethod
    def _extract_dominant_colors(img: Image.Image, num_colors: int = 5) -> List[Tuple[int, int, int]]:
        """
        Extrait les couleurs dominantes d'une image
        
        Args:
            img: Image PIL
            num_colors: Nombre de couleurs à extraire
            
        Returns:
            List: Liste des couleurs RGB dominantes
        """
        try:
            # Redimensionner pour l'analyse
            img_small = img.resize((150, 150))
            img_array = np.array(img_small)
            
            # Reshape pour l'analyse
            pixels = img_array.reshape(-1, 3)
            
            # Utiliser k-means pour trouver les couleurs dominantes
            from sklearn.cluster import KMeans
            kmeans = KMeans(n_clusters=num_colors, random_state=42)
            kmeans.fit(pixels)
            
            # Récupérer les centres des clusters (couleurs dominantes)
            colors = kmeans.cluster_centers_.astype(int)
            
            return [tuple(color) for color in colors]
            
        except Exception as e:
            logger.warning(f"Impossible d'extraire les couleurs dominantes: {e}")
            return []

    @staticmethod
    def _create_image_thumbnail(file_path: Path, max_size: Tuple[int, int]) -> str:
        """Crée une miniature d'image"""
        with Image.open(file_path) as img:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            return base64.b64encode(buffer.getvalue()).decode()

    @staticmethod
    def _create_video_thumbnail(file_path: Path, max_size: Tuple[int, int]) -> str:
        """Crée une miniature de vidéo"""
        cap = cv2.VideoCapture(str(file_path))
        ret, frame = cap.read()
        cap.release()
        
        if ret:
            # Convertir BGR vers RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(frame_rgb)
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            return base64.b64encode(buffer.getvalue()).decode()
        
        return ""

    @staticmethod
    def _create_audio_thumbnail(file_path: Path, max_size: Tuple[int, int]) -> str:
        """Crée une miniature pour audio (spectrogramme)"""
        try:
            y, sr = librosa.load(str(file_path), duration=10)  # 10 secondes max
            
            # Créer un spectrogramme
            D = librosa.amplitude_to_db(np.abs(librosa.stft(y)), ref=np.max)
            
            # Créer une image du spectrogramme
            plt.figure(figsize=(max_size[0]/100, max_size[1]/100), dpi=100)
            librosa.display.specshow(D, sr=sr, x_axis='time', y_axis='log')
            plt.colorbar(format='%+2.0f dB')
            plt.title('Spectrogramme')
            
            # Sauvegarder en base64
            buffer = BytesIO()
            plt.savefig(buffer, format='PNG', bbox_inches='tight', dpi=100)
            plt.close()
            
            return base64.b64encode(buffer.getvalue()).decode()
            
        except Exception as e:
            logger.warning(f"Impossible de créer le spectrogramme: {e}")
            return ""

    @staticmethod
    def get_media_info(file_path: Path) -> Dict[str, Any]:
        """
        Obtient les informations complètes d'un fichier multimédia
        
        Args:
            file_path: Chemin vers le fichier
            
        Returns:
            Dict: Informations complètes du fichier
        """
        file_type = MultimediaService.get_file_type(file_path)
        
        if file_type == 'image':
            return MultimediaService.analyze_image(file_path)
        elif file_type == 'video':
            return MultimediaService.analyze_video(file_path)
        elif file_type == 'audio':
            return MultimediaService.analyze_audio(file_path)
        else:
            return {'type': 'unknown', 'error': 'Format non supporté'} 