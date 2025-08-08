"""
Service de gestion des fichiers multimédia
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
import mimetypes
from PIL import Image, ImageOps
import cv2
import numpy as np
from moviepy import VideoFileClip, AudioFileClip
import librosa
import librosa.display
import json
import base64
from io import BytesIO
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
import subprocess
import tempfile
import shutil

from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, FileData


class MultimediaService(BaseService):
    """
    Service pour l'analyse et le traitement des fichiers multimédia
    """

    # Formats supportés par catégorie
    SUPPORTED_IMAGE_FORMATS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.ico', '.svg', '.heic', '.heif'}
    SUPPORTED_VIDEO_FORMATS = {
        '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv', 
        '.ts', '.mts', '.m2ts', '.vob', '.asf', '.rm', '.rmvb', '.divx', '.xvid', '.h264', 
        '.h265', '.vp8', '.vp9', '.mpeg', '.mpg', '.mpe', '.m1v', '.m2v', '.mpv', '.mp2', 
        '.m2p', '.ps', '.vob', '.evo', '.ogm', '.ogx', '.mxf', '.nut', '.hls', '.m3u8'
    }
    SUPPORTED_AUDIO_FORMATS = {
        '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff', '.au', 
        '.ra', '.rm', '.wv', '.ape', '.alac', '.ac3', '.dts', '.amr', '.3ga', '.mka', '.tta'
    }

    @staticmethod
    @log_service_operation("get_file_type")
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
    @log_service_operation("analyze_image")
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
            return {'type': 'image', 'error': str(e)}

    @staticmethod
    def analyze_video(file_path: Path) -> Dict[str, Any]:
        """
        Analyse une vidéo et extrait ses métadonnées avec support étendu des formats
        
        Args:
            file_path: Chemin vers la vidéo
            
        Returns:
            Dict: Métadonnées de la vidéo
        """
        try:
            # Essayer d'abord avec FFmpeg pour un support étendu
            try:
                import ffmpeg
                
                # Obtenir les informations avec FFmpeg
                probe = ffmpeg.probe(str(file_path))
                video_info = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
                audio_info = next((stream for stream in probe['streams'] if stream['codec_type'] == 'audio'), None)
                
                if video_info:
                    # Informations vidéo
                    width = int(video_info.get('width', 0))
                    height = int(video_info.get('height', 0))
                    fps_str = video_info.get('r_frame_rate', '0/1')
                    fps = eval(fps_str) if '/' in fps_str else float(fps_str)
                    codec = video_info.get('codec_name', 'unknown')
                    bitrate = int(video_info.get('bit_rate', 0)) / 1000  # kbps
                    duration = float(probe.get('format', {}).get('duration', 0))
                    
                    # Informations audio
                    audio_data = {}
                    if audio_info:
                        audio_data = {
                            'has_audio': True,
                            'audio_codec': audio_info.get('codec_name', 'unknown'),
                            'audio_channels': int(audio_info.get('channels', 0)),
                            'audio_sample_rate': int(audio_info.get('sample_rate', 0)),
                            'audio_bitrate': int(audio_info.get('bit_rate', 0)) / 1000 if audio_info.get('bit_rate') else 0
                        }
                    else:
                        audio_data = {'has_audio': False}
                    
                    # Taille du fichier
                    file_size = file_path.stat().st_size / (1024 * 1024)
                    
                    return {
                        'type': 'video',
                        'dimensions': {'width': width, 'height': height},
                        'duration_seconds': round(duration, 2),
                        'fps': round(fps, 2),
                        'codec': codec,
                        'bitrate_kbps': round(bitrate, 2),
                        'file_size_mb': round(file_size, 2),
                        'audio_info': audio_data,
                        'aspect_ratio': round(width / height, 2) if height > 0 else 0,
                        'format': probe.get('format', {}).get('format_name', 'unknown')
                    }
                    
            except ImportError:
                logger.warning("FFmpeg Python not available, falling back to OpenCV")
            except Exception as e:
                logger.warning(f"FFmpeg analysis failed for {file_path}: {e}")
            
            # Fallback vers OpenCV et MoviePy
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
    def optimize_video(
        input_path: Path,
        output_path: Path,
        bandwidth_control: str = 'auto',
        noise_reduction: bool = False,
        voice_enhancement: bool = False,
        video_compression: bool = False,
        frame_rate: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Optimise une vidéo avec FFmpeg
        
        Args:
            input_path: Chemin du fichier d'entrée
            output_path: Chemin du fichier de sortie
            bandwidth_control: Contrôle de bande passante ('low', 'medium', 'high', 'auto')
            noise_reduction: Activer la réduction de bruit audio
            voice_enhancement: Activer l'amélioration de la voix
            video_compression: Activer la compression vidéo
            frame_rate: Framerate cible (None pour auto)
            
        Returns:
            Dict: Informations sur l'optimisation
        """
        try:
            # Vérifier que FFmpeg est disponible
            if not MultimediaService._check_ffmpeg():
                raise Exception("FFmpeg n'est pas installé ou n'est pas accessible")

            # Construire la commande FFmpeg
            cmd = ['ffmpeg', '-i', str(input_path), '-y']  # -y pour écraser le fichier de sortie
            
            # Contrôle de bande passante
            if bandwidth_control == 'low':
                cmd.extend(['-b:v', '500k', '-b:a', '64k'])  # Basse qualité
            elif bandwidth_control == 'medium':
                cmd.extend(['-b:v', '1500k', '-b:a', '128k'])  # Qualité moyenne
            elif bandwidth_control == 'high':
                cmd.extend(['-b:v', '3000k', '-b:a', '192k'])  # Haute qualité
            
            # Codec vidéo optimisé
            cmd.extend(['-c:v', 'libx264', '-preset', 'medium'])
            
            # Contrôle du framerate
            if frame_rate:
                cmd.extend(['-r', str(frame_rate)])
            
            # Optimisations audio
            audio_filters = []
            if noise_reduction:
                # Filtre de réduction de bruit
                audio_filters.append('anlmdn=s=7:p=0.002:r=0.01')
            
            if voice_enhancement:
                # Filtre d'amélioration de la voix (fréquences 300Hz-3kHz)
                audio_filters.append('equalizer=f=1500:width_type=o:width=2:g=6')
                audio_filters.append('highpass=f=300,lowpass=f=3000')
            
            if audio_filters:
                cmd.extend(['-af', ','.join(audio_filters)])
            
            # Codec audio
            cmd.extend(['-c:a', 'aac', '-b:a', '128k'])
            
            # Compression vidéo si demandée
            if video_compression:
                cmd.extend(['-crf', '23'])  # Qualité constante
            
            # Fichier de sortie
            cmd.append(str(output_path))
            
            logger.info(f"Commande FFmpeg: {' '.join(cmd)}")
            
            # Exécuter la commande
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes max
            )
            
            if result.returncode != 0:
                logger.error(f"Erreur FFmpeg: {result.stderr}")
                raise Exception(f"Erreur lors de l'optimisation: {result.stderr}")
            
            # Calculer les statistiques
            original_size = input_path.stat().st_size
            optimized_size = output_path.stat().st_size
            compression_ratio = (1 - optimized_size / original_size) * 100
            
            return {
                'success': True,
                'original_size_mb': round(original_size / (1024 * 1024), 2),
                'optimized_size_mb': round(optimized_size / (1024 * 1024), 2),
                'compression_ratio': round(compression_ratio, 1),
                'bandwidth_control': bandwidth_control,
                'noise_reduction': noise_reduction,
                'voice_enhancement': voice_enhancement,
                'video_compression': video_compression,
                'frame_rate': frame_rate
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'optimisation vidéo: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def optimize_audio(
        input_path: Path,
        output_path: Path,
        noise_reduction: bool = False,
        voice_enhancement: bool = False,
        audio_compression: bool = False
    ) -> Dict[str, Any]:
        """
        Optimise un fichier audio avec FFmpeg
        
        Args:
            input_path: Chemin du fichier d'entrée
            output_path: Chemin du fichier de sortie
            noise_reduction: Activer la réduction de bruit
            voice_enhancement: Activer l'amélioration de la voix
            audio_compression: Activer la compression audio
            
        Returns:
            Dict: Informations sur l'optimisation
        """
        try:
            # Vérifier que FFmpeg est disponible
            if not MultimediaService._check_ffmpeg():
                raise Exception("FFmpeg n'est pas installé ou n'est pas accessible")

            # Construire la commande FFmpeg
            cmd = ['ffmpeg', '-i', str(input_path), '-y']
            
            # Filtres audio
            audio_filters = []
            
            if noise_reduction:
                # Réduction de bruit avec anlmdn
                audio_filters.append('anlmdn=s=7:p=0.002:r=0.01')
            
            if voice_enhancement:
                # Amélioration des fréquences vocales
                audio_filters.append('equalizer=f=1500:width_type=o:width=2:g=6')
                audio_filters.append('highpass=f=300,lowpass=f=3000')
            
            if audio_compression:
                # Compression dynamique
                audio_filters.append('compand=0.3|0.3:1|1:-90/-60/-40/-30/-20/-10/-3/0:6:0:-90:0.2')
            
            if audio_filters:
                cmd.extend(['-af', ','.join(audio_filters)])
            
            # Codec audio optimisé
            cmd.extend(['-c:a', 'aac', '-b:a', '192k'])
            
            # Fichier de sortie
            cmd.append(str(output_path))
            
            logger.info(f"Commande FFmpeg audio: {' '.join(cmd)}")
            
            # Exécuter la commande
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=180  # 3 minutes max
            )
            
            if result.returncode != 0:
                logger.error(f"Erreur FFmpeg audio: {result.stderr}")
                raise Exception(f"Erreur lors de l'optimisation audio: {result.stderr}")
            
            # Calculer les statistiques
            original_size = input_path.stat().st_size
            optimized_size = output_path.stat().st_size
            compression_ratio = (1 - optimized_size / original_size) * 100
            
            return {
                'success': True,
                'original_size_mb': round(original_size / (1024 * 1024), 2),
                'optimized_size_mb': round(optimized_size / (1024 * 1024), 2),
                'compression_ratio': round(compression_ratio, 1),
                'noise_reduction': noise_reduction,
                'voice_enhancement': voice_enhancement,
                'audio_compression': audio_compression
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'optimisation audio: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    def _check_ffmpeg() -> bool:
        """
        Vérifie si FFmpeg est disponible
        
        Returns:
            bool: True si FFmpeg est disponible
        """
        try:
            result = subprocess.run(
                ['ffmpeg', '-version'],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0
        except Exception:
            return False

    @staticmethod
    def create_optimized_stream(
        file_path: Path,
        optimization_settings: Dict[str, Any]
    ) -> Optional[Path]:
        """
        Crée un flux optimisé temporaire pour le streaming
        
        Args:
            file_path: Chemin du fichier original
            optimization_settings: Paramètres d'optimisation
            
        Returns:
            Path: Chemin du fichier optimisé temporaire
        """
        try:
            file_type = MultimediaService.get_file_type(file_path)
            
            # Créer un fichier temporaire
            temp_dir = Path(tempfile.gettempdir()) / "docusense_optimized"
            temp_dir.mkdir(exist_ok=True)
            
            temp_file = temp_dir / f"optimized_{file_path.name}"
            
            if file_type == 'video':
                result = MultimediaService.optimize_video(
                    input_path=file_path,
                    output_path=temp_file,
                    bandwidth_control=optimization_settings.get('bandwidth_control', 'auto'),
                    noise_reduction=optimization_settings.get('noise_reduction', False),
                    voice_enhancement=optimization_settings.get('voice_enhancement', False),
                    video_compression=optimization_settings.get('video_compression', False),
                    frame_rate=optimization_settings.get('frame_rate')
                )
            elif file_type == 'audio':
                result = MultimediaService.optimize_audio(
                    input_path=file_path,
                    output_path=temp_file,
                    noise_reduction=optimization_settings.get('noise_reduction', False),
                    voice_enhancement=optimization_settings.get('voice_enhancement', False),
                    audio_compression=optimization_settings.get('audio_compression', False)
                )
            else:
                return None
            
            if result.get('success'):
                logger.info(f"Fichier optimisé créé: {temp_file}")
                return temp_file
            else:
                logger.error(f"Échec de l'optimisation: {result.get('error')}")
                return None
                
        except Exception as e:
            logger.error(f"Erreur lors de la création du flux optimisé: {e}")
            return None

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