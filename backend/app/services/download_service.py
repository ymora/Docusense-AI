"""
Service de téléchargement de fichiers et dossiers
"""

import os
import zipfile
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
import logging
from datetime import datetime
import mimetypes
from fastapi import HTTPException
from fastapi.responses import FileResponse, StreamingResponse
import io

logger = logging.getLogger(__name__)


class DownloadService:
    """
    Service pour le téléchargement de fichiers et dossiers
    """
    
    def __init__(self):
        self.temp_dir = Path("temp_downloads")
        self.temp_dir.mkdir(exist_ok=True)
        self.max_file_size = 1024 * 1024 * 1024  # 1 GB
        self.max_zip_size = 1024 * 1024 * 1024 * 5  # 5 GB
    
    def get_file_info(self, file_path: Path) -> Dict[str, Any]:
        """
        Récupère les informations d'un fichier
        
        Args:
            file_path: Chemin vers le fichier
            
        Returns:
            Dict: Informations du fichier
        """
        try:
            if not file_path.exists():
                raise HTTPException(status_code=404, detail="Fichier non trouvé")
            
            stat = file_path.stat()
            mime_type, _ = mimetypes.guess_type(str(file_path))
            
            return {
                'name': file_path.name,
                'path': str(file_path),
                'size': stat.st_size,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'mime_type': mime_type or 'application/octet-stream',
                'is_file': file_path.is_file(),
                'is_directory': file_path.is_dir()
            }
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des infos du fichier {file_path}: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
    
    def download_file(self, file_path: Path) -> FileResponse:
        """
        Télécharge un fichier individuel
        
        Args:
            file_path: Chemin vers le fichier
            
        Returns:
            FileResponse: Réponse de téléchargement
        """
        try:
            if not file_path.exists():
                raise HTTPException(status_code=404, detail="Fichier non trouvé")
            
            if not file_path.is_file():
                raise HTTPException(status_code=400, detail="Le chemin ne correspond pas à un fichier")
            
            # Vérifier la taille du fichier
            file_size = file_path.stat().st_size
            if file_size > self.max_file_size:
                raise HTTPException(
                    status_code=413, 
                    detail=f"Fichier trop volumineux ({file_size / (1024*1024*1024):.1f} GB). Maximum: {self.max_file_size / (1024*1024*1024)} GB"
                )
            
            # Déterminer le type MIME
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if not mime_type:
                mime_type = 'application/octet-stream'
            
            logger.info(f"Téléchargement du fichier: {file_path}")
            
            return FileResponse(
                path=str(file_path),
                filename=file_path.name,
                media_type=mime_type
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors du téléchargement du fichier {file_path}: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
    
    def create_zip_from_directory(self, directory_path: Path, zip_name: Optional[str] = None) -> Path:
        """
        Crée un fichier ZIP à partir d'un répertoire
        
        Args:
            directory_path: Chemin vers le répertoire
            zip_name: Nom du fichier ZIP (optionnel)
            
        Returns:
            Path: Chemin vers le fichier ZIP créé
        """
        try:
            if not directory_path.exists():
                raise HTTPException(status_code=404, detail="Répertoire non trouvé")
            
            if not directory_path.is_dir():
                raise HTTPException(status_code=400, detail="Le chemin ne correspond pas à un répertoire")
            
            # Nom du fichier ZIP
            if not zip_name:
                zip_name = f"{directory_path.name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
            
            # Chemin du fichier ZIP temporaire
            zip_path = self.temp_dir / zip_name
            
            # Créer le fichier ZIP
            total_size = 0
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(directory_path):
                    for file in files:
                        file_path = Path(root) / file
                        try:
                            # Vérifier la taille du fichier
                            file_size = file_path.stat().st_size
                            total_size += file_size
                            
                            if total_size > self.max_zip_size:
                                raise HTTPException(
                                    status_code=413,
                                    detail=f"Taille totale trop importante ({total_size / (1024*1024*1024):.1f} GB). Maximum: {self.max_zip_size / (1024*1024*1024)} GB"
                                )
                            
                            # Chemin relatif dans le ZIP
                            relative_path = file_path.relative_to(directory_path)
                            zipf.write(file_path, relative_path)
                            
                        except Exception as e:
                            logger.warning(f"Impossible d'ajouter le fichier {file_path} au ZIP: {e}")
                            continue
            
            logger.info(f"ZIP créé: {zip_path} ({zip_path.stat().st_size / (1024*1024):.1f} MB)")
            return zip_path
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors de la création du ZIP pour {directory_path}: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
    
    def create_zip_from_files(self, file_paths: List[Path], zip_name: Optional[str] = None) -> Path:
        """
        Crée un fichier ZIP à partir d'une liste de fichiers
        
        Args:
            file_paths: Liste des chemins de fichiers
            zip_name: Nom du fichier ZIP (optionnel)
            
        Returns:
            Path: Chemin vers le fichier ZIP créé
        """
        try:
            if not file_paths:
                raise HTTPException(status_code=400, detail="Aucun fichier spécifié")
            
            # Nom du fichier ZIP
            if not zip_name:
                zip_name = f"files_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
            
            # Chemin du fichier ZIP temporaire
            zip_path = self.temp_dir / zip_name
            
            # Créer le fichier ZIP
            total_size = 0
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in file_paths:
                    try:
                        if not file_path.exists():
                            logger.warning(f"Fichier non trouvé: {file_path}")
                            continue
                        
                        if not file_path.is_file():
                            logger.warning(f"Le chemin ne correspond pas à un fichier: {file_path}")
                            continue
                        
                        # Vérifier la taille du fichier
                        file_size = file_path.stat().st_size
                        total_size += file_size
                        
                        if total_size > self.max_zip_size:
                            raise HTTPException(
                                status_code=413,
                                detail=f"Taille totale trop importante ({total_size / (1024*1024*1024):.1f} GB). Maximum: {self.max_zip_size / (1024*1024*1024)} GB"
                            )
                        
                        # Ajouter le fichier au ZIP
                        zipf.write(file_path, file_path.name)
                        
                    except Exception as e:
                        logger.warning(f"Impossible d'ajouter le fichier {file_path} au ZIP: {e}")
                        continue
            
            logger.info(f"ZIP créé: {zip_path} ({zip_path.stat().st_size / (1024*1024):.1f} MB)")
            return zip_path
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors de la création du ZIP: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
    
    def download_directory(self, directory_path: Path, zip_name: Optional[str] = None) -> FileResponse:
        """
        Télécharge un répertoire sous forme de ZIP
        
        Args:
            directory_path: Chemin vers le répertoire
            zip_name: Nom du fichier ZIP (optionnel)
            
        Returns:
            FileResponse: Réponse de téléchargement
        """
        try:
            zip_path = self.create_zip_from_directory(directory_path, zip_name)
            
            return FileResponse(
                path=str(zip_path),
                filename=zip_path.name,
                media_type='application/zip'
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors du téléchargement du répertoire {directory_path}: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
    
    def download_multiple_files(self, file_paths: List[Path], zip_name: Optional[str] = None) -> FileResponse:
        """
        Télécharge plusieurs fichiers sous forme de ZIP
        
        Args:
            file_paths: Liste des chemins de fichiers
            zip_name: Nom du fichier ZIP (optionnel)
            
        Returns:
            FileResponse: Réponse de téléchargement
        """
        try:
            zip_path = self.create_zip_from_files(file_paths, zip_name)
            
            return FileResponse(
                path=str(zip_path),
                filename=zip_path.name,
                media_type='application/zip'
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors du téléchargement multiple: {e}")
            raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")
    
    def cleanup_temp_files(self, max_age_hours: int = 24):
        """
        Nettoie les fichiers temporaires anciens
        
        Args:
            max_age_hours: Âge maximum en heures
        """
        try:
            now = datetime.now()
            max_age = now.timestamp() - (max_age_hours * 3600)
            
            cleaned_count = 0
            for file_path in self.temp_dir.iterdir():
                if file_path.is_file():
                    if file_path.stat().st_mtime < max_age:
                        file_path.unlink()
                        cleaned_count += 1
            
            if cleaned_count > 0:
                logger.info(f"Fichiers temporaires nettoyés: {cleaned_count}")
                
        except Exception as e:
            logger.error(f"Erreur lors du nettoyage des fichiers temporaires: {e}")
    
    def get_download_stats(self) -> Dict[str, Any]:
        """
        Récupère les statistiques de téléchargement
        
        Returns:
            Dict: Statistiques
        """
        try:
            total_files = 0
            total_size = 0
            
            for file_path in self.temp_dir.iterdir():
                if file_path.is_file():
                    total_files += 1
                    total_size += file_path.stat().st_size
            
            return {
                'temp_files_count': total_files,
                'temp_files_size_mb': round(total_size / (1024 * 1024), 2),
                'max_file_size_gb': self.max_file_size / (1024 * 1024 * 1024),
                'max_zip_size_gb': self.max_zip_size / (1024 * 1024 * 1024)
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques: {e}")
            return {}


# Instance globale
download_service = DownloadService() 