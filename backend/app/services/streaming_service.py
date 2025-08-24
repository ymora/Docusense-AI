"""
Service de streaming en temps réel avec FFmpeg
"""

import os
import subprocess
import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any, Generator
from fastapi import HTTPException
import mimetypes

logger = logging.getLogger(__name__)

class StreamingService:
    """Service de streaming en temps réel avec transcodage FFmpeg"""
    
    def __init__(self):
        self.ffmpeg_path = self._find_ffmpeg()
        self.supported_video_formats = {
            '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', 
            '.3gp', '.3g2', '.ogv', '.ts', '.mts', '.m2ts', '.asf', '.rm', 
            '.rmvb', '.nut', '.f4v', '.f4p', '.f4a', '.f4b', '.divx', '.xvid', 
            '.h264', '.h265', '.vp8', '.vp9', '.mpeg', '.mpg', '.mpe', '.m1v', 
            '.m2v', '.mpv', '.mp2', '.m2p', '.ps', '.evo', '.ogm', '.ogx', '.mxf'
        }
        self.supported_audio_formats = {
            '.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', 
            '.aiff', '.amr', '.au', '.ra', '.ram', '.wv', '.ape', '.ac3', 
            '.dts', '.mka', '.tta', '.mid', '.midi', '.caf', '.3ga', '.3gpp', 
            '.wax', '.wvx', '.pls', '.sd2'
        }
    
    def _find_ffmpeg(self) -> Optional[str]:
        """Trouve le chemin vers FFmpeg"""
        # Vérifier les chemins courants
        possible_paths = [
            'ffmpeg',
            'ffmpeg.exe',
            r'C:\ffmpeg\bin\ffmpeg.exe',
            r'C:\Program Files\ffmpeg\bin\ffmpeg.exe',
            r'C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe',
            '/usr/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/opt/homebrew/bin/ffmpeg'
        ]
        
        for path in possible_paths:
            try:
                result = subprocess.run([path, '-version'], 
                                      capture_output=True, 
                                      text=True, 
                                      timeout=5)
                if result.returncode == 0:
                    # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info(f"FFmpeg trouvé: {path}")
                    return path
            except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
                continue
        
        logger.warning("FFmpeg non trouvé - le streaming en temps réel ne sera pas disponible")
        return None
    
    def is_streamable_format(self, file_path: str) -> bool:
        """Vérifie si le format peut être streamé directement"""
        ext = Path(file_path).suffix.lower()
        return ext in self.supported_video_formats or ext in self.supported_audio_formats
    
    def get_media_type(self, file_path: str) -> str:
        """Détermine le type de média (video/audio)"""
        ext = Path(file_path).suffix.lower()
        if ext in self.supported_video_formats:
            return 'video'
        elif ext in self.supported_audio_formats:
            return 'audio'
        return 'unknown'
    
    def get_output_format(self, media_type: str, quality: str = 'medium') -> Dict[str, str]:
        """Détermine le format de sortie optimal selon le type de média"""
        if media_type == 'video':
            return {
                'format': 'mp4',
                'video_codec': 'libx264',
                'audio_codec': 'aac',
                'container': 'mp4'
            }
        elif media_type == 'audio':
            return {
                'format': 'mp3',
                'audio_codec': 'libmp3lame',
                'container': 'mp3'
            }
        return {}
    
    def get_ffmpeg_command(self, input_path: str, media_type: str, 
                          quality: str = 'medium', 
                          start_time: Optional[float] = None,
                          duration: Optional[float] = None) -> list:
        """Génère la commande FFmpeg pour le streaming en temps réel"""
        if not self.ffmpeg_path:
            raise HTTPException(status_code=503, detail="FFmpeg non disponible")
        
        output_config = self.get_output_format(media_type, quality)
        
        # Commande de base
        cmd = [self.ffmpeg_path, '-i', str(input_path)]
        
        # Options de découpage temporel
        if start_time is not None:
            cmd.extend(['-ss', str(start_time)])
        if duration is not None:
            cmd.extend(['-t', str(duration)])
        
        # Options de qualité
        if media_type == 'video':
            quality_presets = {
                'low': {'crf': '28', 'preset': 'fast'},
                'medium': {'crf': '23', 'preset': 'medium'},
                'high': {'crf': '18', 'preset': 'slow'}
            }
            preset = quality_presets.get(quality, quality_presets['medium'])
            
            cmd.extend([
                '-c:v', output_config['video_codec'],
                '-crf', preset['crf'],
                '-preset', preset['preset'],
                '-c:a', output_config['audio_codec'],
                '-b:a', '128k',
                '-movflags', 'frag_keyframe+empty_moov',  # Streaming optimisé
                '-f', output_config['container']
            ])
        else:  # audio
            quality_presets = {
                'low': {'bitrate': '64k'},
                'medium': {'bitrate': '128k'},
                'high': {'bitrate': '320k'}
            }
            preset = quality_presets.get(quality, quality_presets['medium'])
            
            cmd.extend([
                '-c:a', output_config['audio_codec'],
                '-b:a', preset['bitrate'],
                '-f', output_config['container']
            ])
        
        # Sortie vers stdout
        cmd.append('pipe:1')
        
        return cmd
    
    async def stream_media(self, file_path: str, 
                          media_type: str,
                          quality: str = 'medium',
                          start_time: Optional[float] = None,
                          duration: Optional[float] = None,
                          chunk_size: int = 8192):
        """
        Stream un fichier média en temps réel avec transcodage FFmpeg
        
        Args:
            file_path: Chemin vers le fichier source
            media_type: Type de média ('video' ou 'audio')
            quality: Qualité de transcodage ('low', 'medium', 'high')
            start_time: Temps de début en secondes
            duration: Durée en secondes
            chunk_size: Taille des chunks à streamer
        
        Yields:
            bytes: Chunks de données streamées
        """
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Fichier non trouvé")
        
        if not self.is_streamable_format(file_path):
            raise HTTPException(status_code=400, detail="Format non supporté pour le streaming")
        
        if not self.ffmpeg_path:
            raise HTTPException(status_code=503, detail="FFmpeg non disponible")
        
        try:
            # Générer la commande FFmpeg
            cmd = self.get_ffmpeg_command(file_path, media_type, quality, start_time, duration)
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # logger.info(f"Streaming FFmpeg: {' '.join(cmd)}")
            
            # Démarrer le processus FFmpeg
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                # Streamer les données par chunks
                while True:
                    chunk = await process.stdout.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk
                    
            except Exception as e:
                logger.error(f"Erreur lors du streaming: {str(e)}")
                if process.returncode is None:
                    process.terminate()
                raise
            finally:
                # Nettoyer le processus
                if process.returncode is None:
                    process.terminate()
                    await process.wait()
                    
        except subprocess.CalledProcessError as e:
            logger.error(f"Erreur FFmpeg: {e.stderr.decode() if e.stderr else str(e)}")
            raise HTTPException(status_code=500, detail="Erreur de transcodage")
        except Exception as e:
            logger.error(f"Erreur de streaming: {str(e)}")
            raise HTTPException(status_code=500, detail="Erreur de streaming")
    
    def get_content_type(self, media_type: str, output_format: str) -> str:
        """Détermine le Content-Type HTTP approprié"""
        if media_type == 'video':
            if output_format == 'mp4':
                return 'video/mp4'
            elif output_format == 'webm':
                return 'video/webm'
            else:
                return 'video/mp4'
        elif media_type == 'audio':
            if output_format == 'mp3':
                return 'audio/mpeg'
            elif output_format == 'ogg':
                return 'audio/ogg'
            else:
                return 'audio/mpeg'
        return 'application/octet-stream'
    
    def get_http_headers(self, media_type: str, output_format: str) -> Dict[str, str]:
        """Génère les headers HTTP appropriés pour le streaming"""
        content_type = self.get_content_type(media_type, output_format)
        
        headers = {
            'Content-Type': content_type,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': '*',
        }
        
        return headers

# Instance globale du service
streaming_service = StreamingService() 