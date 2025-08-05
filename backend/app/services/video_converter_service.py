import os
import subprocess
import tempfile
import threading
import time
import signal
from typing import Optional, Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class MediaConverterService:
    """Service de conversion média universel avec FFmpeg"""
    
    def __init__(self):
        self.conversion_cache: Dict[str, Dict[str, Any]] = {}
        self.cache_lock = threading.Lock()
        
    def get_media_type(self, file_path: str) -> str:
        """Détermine le type de média (video/audio)"""
        audio_extensions = {'.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff', '.au', '.ra', '.rm', '.wv', '.ape', '.alac', '.ac3', '.dts', '.amr', '.3ga', '.mka', '.tta', '.mid', '.midi'}
        video_extensions = {'.mp4', '.webm', '.ogg', '.mov', '.m4v', '.3gp', '.ogv', '.ts', '.mts', '.m2ts', '.mkv', '.avi', '.wmv', '.flv', '.asf', '.rm', '.rmvb', '.divx', '.xvid', '.h264', '.h265', '.vp8', '.vp9', '.mpeg', '.mpg', '.mpe', '.m1v', '.m2v', '.mpv', '.mp2', '.m2p', '.ps', '.evo', '.ogm', '.ogx', '.mxf', '.nut', '.hls', '.m3u8'}
        
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext in audio_extensions:
            return 'audio'
        elif file_ext in video_extensions:
            return 'video'
        else:
            return 'unknown'
    
    def is_format_web_optimized(self, file_path: str) -> bool:
        """Vérifie si le format est déjà optimisé pour le web"""
        web_optimized_extensions = {'.mp4', '.webm', '.ogg', '.m4a', '.opus'}
        problematic_extensions = {'.avi', '.wmv', '.flv', '.mkv', '.mov', '.m4v', '.3gp', '.ogv', '.ts', '.mts', '.m2ts', '.asf', '.rm', '.rmvb', '.divx', '.xvid', '.h264', '.h265', '.vp8', '.vp9', '.mpeg', '.mpg', '.mpe', '.m1v', '.m2v', '.mpv', '.mp2', '.m2p', '.ps', '.evo', '.ogm', '.ogx', '.mxf', '.nut', '.hls', '.m3u8'}
        
        file_ext = Path(file_path).suffix.lower()
        
        # Formats web natifs
        if file_ext in web_optimized_extensions:
            return True
            
        # Formats problématiques qui nécessitent une conversion
        if file_ext in problematic_extensions:
            return False
            
        # Formats audio qui peuvent être lus directement
        audio_extensions = {'.mp3', '.wav', '.flac', '.aac', '.wma', '.aiff', '.au', '.ra', '.rm', '.wv', '.ape', '.alac', '.ac3', '.dts', '.amr', '.3ga', '.mka', '.tta', '.mid', '.midi'}
        if file_ext in audio_extensions:
            return True
            
        # Par défaut, considérer comme non optimisé
        return False
    
    def get_conversion_status(self, file_path: str) -> Dict[str, Any]:
        """Récupère le statut de conversion d'un fichier"""
        with self.cache_lock:
            return self.conversion_cache.get(file_path, {
                'status': 'not_started',
                'progress': 0,
                'output_path': None,
                'error': None,
                'media_type': self.get_media_type(file_path)
            })
    
    def start_conversion(self, input_path: str, force_convert: bool = False) -> str:
        """Démarre la conversion d'un fichier média"""
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Fichier introuvable: {input_path}")
        
        # Vérifier si la conversion est déjà en cours
        with self.cache_lock:
            if input_path in self.conversion_cache:
                status = self.conversion_cache[input_path]['status']
                if status in ['converting', 'completed']:
                    return input_path
        
        # Déterminer le type de média
        media_type = self.get_media_type(input_path)
        if media_type == 'unknown':
            raise ValueError(f"Type de média non reconnu: {input_path}")
        
        # Décider si on doit convertir
        should_convert = force_convert or not self.is_format_web_optimized(input_path)
        
        if not should_convert:
            # Format déjà optimisé, pas besoin de conversion
            with self.cache_lock:
                self.conversion_cache[input_path] = {
                    'status': 'optimized',
                    'progress': 100,
                    'output_path': input_path,
                    'error': None,
                    'media_type': media_type,
                    'start_time': time.time()
                }
            return input_path
        
        # Créer un fichier temporaire pour la sortie
        temp_dir = tempfile.gettempdir()
        input_name = Path(input_path).stem
        
        # Choisir le format de sortie selon le type
        if media_type == 'video':
            output_format = 'mp4'
        else:  # audio
            output_format = 'm4a'
        
        output_path = os.path.join(temp_dir, f"{input_name}_converted.{output_format}")
        
        # Initialiser le statut de conversion
        with self.cache_lock:
            self.conversion_cache[input_path] = {
                'status': 'converting',
                'progress': 0,
                'output_path': output_path,
                'error': None,
                'media_type': media_type,
                'start_time': time.time()
            }
        
        # Démarrer la conversion en arrière-plan
        thread = threading.Thread(
            target=self._convert_media,
            args=(input_path, output_path, media_type)
        )
        thread.daemon = True
        thread.start()
        
        return input_path
    
    def _convert_media(self, input_path: str, output_path: str, media_type: str):
        """Convertit le média en arrière-plan"""
        try:
            logger.info(f"Debut de conversion {media_type}: {input_path} -> {output_path}")
            
            if media_type == 'video':
                cmd = self._get_video_conversion_cmd(input_path, output_path)
            else:  # audio
                cmd = self._get_audio_conversion_cmd(input_path, output_path)
            
            # Lancer la conversion avec timeout et gestion améliorée
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True,
                creationflags=subprocess.CREATE_NO_WINDOW,  # Masquer la fenêtre sur Windows
                preexec_fn=None if os.name == 'nt' else os.setsid  # Groupe de processus pour Unix
            )
            
            # Surveiller la progression avec timeout optimisé
            start_time = time.time()
            timeout_seconds = 120  # 2 minutes max (suffisant pour la plupart des fichiers)
            
            # Récupérer la durée du fichier pour une progression précise
            duration = self._get_media_duration(input_path)
            
            while process.poll() is None:
                # Vérifier le timeout
                if time.time() - start_time > timeout_seconds:
                    process.terminate()
                    process.wait()
                    raise TimeoutError(f"Conversion timeout apres {timeout_seconds} secondes")
                
                # Calculer la progression basée sur le temps écoulé
                elapsed = time.time() - start_time
                
                # Pour les fichiers audio, estimation plus réaliste
                if media_type == 'audio':
                    # Conversion audio rapide : ~30 secondes pour un fichier de 5 minutes
                    estimated_total = 30
                    progress = min(90, int((elapsed / estimated_total) * 90))
                else:
                    # Pour la vidéo, estimation basée sur la durée et la complexité
                    if duration:
                        # Conversion vidéo : ~1/5 de la durée originale pour les formats complexes
                        if Path(input_path).suffix.lower() in {'.avi', '.mkv', '.wmv', '.flv'}:
                            estimated_total = duration / 5  # Formats complexes
                        else:
                            estimated_total = duration / 10  # Formats plus simples
                        progress = min(90, int((elapsed / estimated_total) * 90))
                    else:
                        # Fallback basé sur le temps écoulé
                        progress = min(90, int((elapsed / timeout_seconds) * 90))
                
                with self.cache_lock:
                    if input_path in self.conversion_cache:
                        self.conversion_cache[input_path]['progress'] = progress
                
                time.sleep(1)  # Vérifier toutes les secondes pour plus de réactivité
            
            # Attendre la fin de la conversion avec un timeout plus court
            try:
                stdout, stderr = process.communicate(timeout=15)
            except subprocess.TimeoutExpired:
                # Si le processus ne répond pas, le forcer à se terminer
                logger.warning(f"Timeout de communication, arrêt forcé du processus pour {input_path}")
                process.kill()
                try:
                    stdout, stderr = process.communicate(timeout=5)
                except subprocess.TimeoutExpired:
                    # Si même le kill ne fonctionne pas, forcer l'arrêt
                    if os.name == 'nt':
                        subprocess.run(['taskkill', '/F', '/PID', str(process.pid)], 
                                     capture_output=True, timeout=5)
                    else:
                        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                    stdout, stderr = "", "Processus arrêté de force"
            
            # Vérifier si la conversion a réussi
            if process.returncode == 0 and os.path.exists(output_path):
                logger.info(f"Conversion {media_type} terminee: {output_path}")
                with self.cache_lock:
                    if input_path in self.conversion_cache:
                        self.conversion_cache[input_path].update({
                            'status': 'completed',
                            'progress': 100,
                            'error': None
                        })
            else:
                error_msg = stderr if stderr else "Erreur de conversion inconnue"
                logger.error(f"Erreur de conversion {media_type}: {error_msg}")
                with self.cache_lock:
                    if input_path in self.conversion_cache:
                        self.conversion_cache[input_path].update({
                            'status': 'error',
                            'error': error_msg
                        })
                        
        except Exception as e:
            logger.error(f"Exception lors de la conversion {media_type}: {str(e)}")
            with self.cache_lock:
                if input_path in self.conversion_cache:
                    self.conversion_cache[input_path].update({
                        'status': 'error',
                        'error': str(e)
                    })
    
    def _get_video_conversion_cmd(self, input_path: str, output_path: str) -> list:
        """Génère la commande FFmpeg pour la conversion vidéo optimisée"""
        return [
            'ffmpeg', '-i', input_path,
            '-c:v', 'libx264',  # Codec vidéo H.264
            '-c:a', 'aac',      # Codec audio AAC
            '-preset', 'fast',   # Preset rapide pour la conversion en temps réel
            '-crf', '23',       # Qualité constante (23 = bonne qualité)
            '-movflags', '+faststart',  # Optimisation pour le streaming web
            '-threads', '0',    # Utiliser tous les threads CPU
            '-maxrate', '2M',   # Limiter le bitrate pour le streaming
            '-bufsize', '4M',   # Buffer pour la qualité constante
            '-y',               # Écraser le fichier de sortie
            output_path
        ]
    
    def _get_audio_conversion_cmd(self, input_path: str, output_path: str) -> list:
        """Génère la commande FFmpeg pour la conversion audio optimisée"""
        return [
            'ffmpeg', '-i', input_path,
            '-c:a', 'aac',      # Codec audio AAC
            '-b:a', '128k',     # Bitrate audio de qualité
            '-ar', '44100',     # Sample rate standard
            '-ac', '2',         # 2 canaux (stéréo)
            '-f', 'mp4',        # Format de sortie explicite
            '-threads', '0',    # Utiliser tous les threads CPU
            '-y',               # Écraser le fichier de sortie
            output_path
        ]
    
    def _get_media_duration(self, file_path: str) -> Optional[float]:
        """Récupère la durée d'un média avec FFprobe"""
        try:
            cmd = [
                'ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
                '-of', 'csv=p=0', file_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                return float(result.stdout.strip())
        except Exception as e:
            logger.warning(f"Impossible de récupérer la durée: {e}")
        return None
    
    def get_converted_file_path(self, original_path: str) -> Optional[str]:
        """Récupère le chemin du fichier converti s'il existe"""
        with self.cache_lock:
            if original_path in self.conversion_cache:
                status = self.conversion_cache[original_path]['status']
                if status in ['completed', 'optimized']:
                    output_path = self.conversion_cache[original_path]['output_path']
                    if output_path and os.path.exists(output_path):
                        return output_path
        return None
    
    def cleanup_old_conversions(self, max_age_hours: int = 24):
        """Nettoie les anciennes conversions"""
        current_time = time.time()
        with self.cache_lock:
            to_remove = []
            for file_path, info in self.conversion_cache.items():
                if 'start_time' in info:
                    age_hours = (current_time - info['start_time']) / 3600
                    if age_hours > max_age_hours:
                        to_remove.append(file_path)
            
            for file_path in to_remove:
                info = self.conversion_cache[file_path]
                if info.get('output_path') and os.path.exists(info['output_path']) and info['output_path'] != file_path:
                    try:
                        os.remove(info['output_path'])
                        logger.info(f"🗑️ Fichier converti supprimé: {info['output_path']}")
                    except Exception as e:
                        logger.warning(f"Impossible de supprimer: {e}")
                del self.conversion_cache[file_path]

    def convert_to_hls(self, input_path: str) -> Optional[str]:
        """
        Convertit une vidéo en format HLS (.m3u8 + segments .ts)
        
        Args:
            input_path: Chemin du fichier vidéo d'entrée
            
        Returns:
            str: Chemin du fichier .m3u8 ou None si échec
        """
        try:
            if not os.path.exists(input_path):
                logger.error(f"Fichier d'entrée introuvable: {input_path}")
                return None
            
            # Vérifier que FFmpeg est disponible
            if not self._check_ffmpeg():
                logger.error("FFmpeg n'est pas disponible pour la conversion HLS")
                return None
            
            # Créer le dossier de sortie HLS
            input_name = Path(input_path).stem
            temp_dir = Path(tempfile.gettempdir()) / "docusense_hls"
            temp_dir.mkdir(exist_ok=True)
            
            output_dir = temp_dir / input_name
            output_dir.mkdir(exist_ok=True)
            
            # Chemin du fichier .m3u8
            m3u8_path = output_dir / f"{input_name}.m3u8"
            
            # Si le fichier HLS existe déjà, le retourner
            if m3u8_path.exists():
                logger.info(f"Fichier HLS existant trouvé: {m3u8_path}")
                return str(m3u8_path)
            
            # Commande FFmpeg pour la conversion HLS
            cmd = [
                'ffmpeg', '-i', input_path,
                '-c:v', 'libx264',  # Codec vidéo H.264
                '-c:a', 'aac',      # Codec audio AAC
                '-preset', 'fast',   # Preset rapide
                '-crf', '23',       # Qualité constante
                '-sc_threshold', '0',  # Désactiver la détection de scène
                '-g', '48',         # GOP size
                '-keyint_min', '48', # Keyframe interval minimum
                '-hls_time', '4',   # Durée des segments (4 secondes)
                '-hls_list_size', '0',  # Garder tous les segments
                '-hls_segment_filename', str(output_dir / 'segment_%03d.ts'),
                '-f', 'hls',        # Format de sortie HLS
                '-y',               # Écraser le fichier de sortie
                str(m3u8_path)
            ]
            
            logger.info(f"Conversion HLS démarrée: {' '.join(cmd)}")
            
            # Exécuter la conversion
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes max
            )
            
            if process.returncode == 0 and m3u8_path.exists():
                logger.info(f"Conversion HLS terminée: {m3u8_path}")
                return str(m3u8_path)
            else:
                logger.error(f"Erreur conversion HLS: {process.stderr}")
                return None
                
        except Exception as e:
            logger.error(f"Exception lors de la conversion HLS: {str(e)}")
            return None

    def _check_ffmpeg(self) -> bool:
        """Vérifie si FFmpeg est installé et accessible depuis le chemin"""
        try:
            # Tester la version de FFmpeg
            cmd = ['ffmpeg', '-version']
            subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            return True
        except FileNotFoundError:
            logger.error("FFmpeg n'est pas installé ou n'est pas dans le PATH.")
            return False
        except subprocess.TimeoutExpired:
            logger.error("Impossible de communiquer avec FFmpeg pour vérifier la version.")
            return False
        except Exception as e:
            logger.error(f"Erreur lors de la vérification de FFmpeg: {e}")
            return False

# Instance globale du service
media_converter = MediaConverterService() 