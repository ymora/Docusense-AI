"""
Service de nettoyage unifié pour DocuSense AI
Consolide toutes les fonctions de nettoyage dispersées dans les différents services
"""

import os
import shutil
import time
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.file import File, FileStatus
from ..models.analysis import Analysis, AnalysisStatus
from ..core.database import get_db
from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse


class UnifiedCleanupService(BaseService):
    """
    Service de nettoyage unifié qui consolide toutes les fonctions de nettoyage
    dispersées dans les différents services de l'application
    """
    
    def __init__(self, db: Session):
        super().__init__(db)
        self.temp_dir = Path("temp_downloads")
        self.logs_dir = Path("logs")
        self.cache_dir = Path("cache")
        
        # Statistiques de nettoyage
        self.cleanup_stats = {
            'files_deleted': 0,
            'analyses_deleted': 0,
            'orphaned_files_marked': 0,
            'invalid_statuses_fixed': 0,
            'temp_files_cleaned': 0,
            'logs_cleaned': 0,
            'cache_cleaned': 0,
            'conversions_cleaned': 0
        }

    @log_service_operation("cleanup_orphaned_files")
    def cleanup_orphaned_files(self, directory_path: str = None) -> int:
        """
        Nettoie les fichiers orphelins (fichiers en base mais introuvables sur le disque)
        
        Args:
            directory_path: Répertoire à vérifier (optionnel)
            
        Returns:
            int: Nombre de fichiers orphelins marqués
        """
        return self.safe_execute("cleanup_orphaned_files", self._cleanup_orphaned_files_logic, directory_path)

    def _cleanup_orphaned_files_logic(self, directory_path: str = None) -> int:
        """Logique de nettoyage des fichiers orphelins"""
        orphaned_count = 0
        
        # Récupérer tous les fichiers de la base de données
        files = self.db.query(File).all()
        
        for file in files:
            file_path = Path(file.path) if file.path else None
            
            if file_path and not file_path.exists():
                # Marquer le fichier comme orphelin
                file.status = FileStatus.ORPHANED
                file.updated_at = datetime.now()
                orphaned_count += 1
                
        if orphaned_count > 0:
            self.db.commit()
            self.cleanup_stats['orphaned_files_marked'] += orphaned_count
            
        return orphaned_count

    @log_service_operation("cleanup_failed_analyses")
    def cleanup_failed_analyses(self, max_age_hours: int = 24) -> int:
        """
        Nettoie les analyses échouées anciennes
        
        Args:
            max_age_hours: Âge maximum en heures
            
        Returns:
            int: Nombre d'analyses supprimées
        """
        return self.safe_execute("cleanup_failed_analyses", self._cleanup_failed_analyses_logic, max_age_hours)

    def _cleanup_failed_analyses_logic(self, max_age_hours: int = 24) -> int:
        """Logique de nettoyage des analyses échouées"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        # Supprimer les analyses échouées anciennes
        failed_analyses = self.db.query(Analysis).filter(
            and_(
                Analysis.status == AnalysisStatus.FAILED,
                Analysis.created_at < cutoff_time
            )
        ).all()
        
        deleted_count = len(failed_analyses)
        
        for analysis in failed_analyses:
            self.db.delete(analysis)
            
        if deleted_count > 0:
            self.db.commit()
            self.cleanup_stats['analyses_deleted'] += deleted_count
            
        return deleted_count

    @log_service_operation("cleanup_old_analyses")
    def cleanup_old_analyses(self, max_age_hours: int = 168) -> int:  # 7 jours par défaut
        """
        Nettoie les analyses anciennes (tous statuts)
        
        Args:
            max_age_hours: Âge maximum en heures
            
        Returns:
            int: Nombre d'analyses supprimées
        """
        return self.safe_execute("cleanup_old_analyses", self._cleanup_old_analyses_logic, max_age_hours)

    def _cleanup_old_analyses_logic(self, max_age_hours: int = 168) -> int:
        """Logique de nettoyage des analyses anciennes"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        # Supprimer les analyses anciennes
        old_analyses = self.db.query(Analysis).filter(
            Analysis.created_at < cutoff_time
        ).all()
        
        deleted_count = len(old_analyses)
        
        for analysis in old_analyses:
            self.db.delete(analysis)
            
        if deleted_count > 0:
            self.db.commit()
            self.cleanup_stats['analyses_deleted'] += deleted_count
            
        return deleted_count

    @log_service_operation("cleanup_temp_files")
    def cleanup_temp_files(self, max_age_hours: int = 1, max_total_size_gb: int = 2) -> Dict[str, int]:
        """
        Nettoie les fichiers temporaires (consolidé depuis download_service)
        
        Args:
            max_age_hours: Âge maximum en heures
            max_total_size_gb: Taille maximale totale en GB
            
        Returns:
            Dict: Statistiques de nettoyage
        """
        return self.safe_execute("cleanup_temp_files", self._cleanup_temp_files_logic, max_age_hours, max_total_size_gb)

    def _cleanup_temp_files_logic(self, max_age_hours: int = 1, max_total_size_gb: int = 2) -> Dict[str, int]:
        """Logique de nettoyage des fichiers temporaires"""
        now = datetime.now()
        max_age = now.timestamp() - (max_age_hours * 3600)
        max_total_size = max_total_size_gb * 1024 * 1024 * 1024  # Convertir en bytes
        
        cleaned_count = 0
        total_size = 0
        files_info = []
        
        # Collecter les informations sur tous les fichiers temporaires
        if self.temp_dir.exists():
            for file_path in self.temp_dir.iterdir():
                if file_path.is_file():
                    stat = file_path.stat()
                    files_info.append({
                        'path': file_path,
                        'size': stat.st_size,
                        'mtime': stat.st_mtime
                    })
                    total_size += stat.st_size
        
        # Nettoyer par âge d'abord
        for file_info in files_info:
            if file_info['mtime'] < max_age:
                try:
                    file_info['path'].unlink()
                    cleaned_count += 1
                    total_size -= file_info['size']
                except Exception as e:
                    self.logger.warning(f"Impossible de supprimer {file_info['path']}: {e}")
        
        # Si la taille totale dépasse encore la limite, supprimer les plus anciens
        if total_size > max_total_size:
            remaining_files = [f for f in files_info if f['path'].exists()]
            remaining_files.sort(key=lambda x: x['mtime'])
            
            for file_info in remaining_files:
                if total_size <= max_total_size:
                    break
                
                try:
                    file_info['path'].unlink()
                    cleaned_count += 1
                    total_size -= file_info['size']
                except Exception as e:
                    self.logger.warning(f"Impossible de supprimer {file_info['path']}: {e}")
        
        self.cleanup_stats['temp_files_cleaned'] += cleaned_count
        
        return {
            'files_deleted': cleaned_count,
            'remaining_size_gb': round(total_size / (1024 * 1024 * 1024), 2)
        }

    @log_service_operation("cleanup_logs")
    def cleanup_logs(self, max_age_days: int = 7, max_size_mb: int = 100) -> Dict[str, int]:
        """
        Nettoie les fichiers de logs anciens et volumineux
        
        Args:
            max_age_days: Âge maximum en jours
            max_size_mb: Taille maximale en MB
            
        Returns:
            Dict: Statistiques de nettoyage
        """
        return self.safe_execute("cleanup_logs", self._cleanup_logs_logic, max_age_days, max_size_mb)

    def _cleanup_logs_logic(self, max_age_days: int = 7, max_size_mb: int = 100) -> Dict[str, int]:
        """Logique de nettoyage des logs"""
        cutoff_time = datetime.now() - timedelta(days=max_age_days)
        max_size_bytes = max_size_mb * 1024 * 1024
        
        cleaned_count = 0
        total_size = 0
        
        # Nettoyer les logs dans différents répertoires
        log_dirs = [self.logs_dir, Path("backend/logs"), Path("frontend/logs")]
        
        for log_dir in log_dirs:
            if log_dir.exists():
                for log_file in log_dir.glob("*.log"):
                    try:
                        stat = log_file.stat()
                        file_age = datetime.fromtimestamp(stat.st_mtime)
                        
                        # Supprimer si trop ancien ou trop volumineux
                        if file_age < cutoff_time or stat.st_size > max_size_bytes:
                            log_file.unlink()
                            cleaned_count += 1
                        else:
                            total_size += stat.st_size
                            
                    except Exception as e:
                        self.logger.warning(f"Impossible de traiter {log_file}: {e}")
        
        self.cleanup_stats['logs_cleaned'] += cleaned_count
        
        return {
            'files_deleted': cleaned_count,
            'remaining_size_mb': round(total_size / (1024 * 1024), 2)
        }

    @log_service_operation("cleanup_cache")
    def cleanup_cache(self, max_age_hours: int = 24) -> Dict[str, int]:
        """
        Nettoie le cache de l'application
        
        Args:
            max_age_hours: Âge maximum en heures
            
        Returns:
            Dict: Statistiques de nettoyage
        """
        return self.safe_execute("cleanup_cache", self._cleanup_cache_logic, max_age_hours)

    def _cleanup_cache_logic(self, max_age_hours: int = 24) -> Dict[str, int]:
        """Logique de nettoyage du cache"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        cleaned_count = 0
        
        # Nettoyer le cache principal
        if self.cache_dir.exists():
            for cache_file in self.cache_dir.rglob("*"):
                if cache_file.is_file():
                    try:
                        stat = cache_file.stat()
                        file_age = datetime.fromtimestamp(stat.st_mtime)
                        
                        if file_age < cutoff_time:
                            cache_file.unlink()
                            cleaned_count += 1
                            
                    except Exception as e:
                        self.logger.warning(f"Impossible de supprimer {cache_file}: {e}")
        
        # Nettoyer le cache Python
        cache_patterns = ["__pycache__", "*.pyc", "*.pyo"]
        for pattern in cache_patterns:
            for cache_item in Path(".").rglob(pattern):
                try:
                    if cache_item.is_dir():
                        shutil.rmtree(cache_item)
                    else:
                        cache_item.unlink()
                    cleaned_count += 1
                except Exception as e:
                    self.logger.warning(f"Impossible de supprimer {cache_item}: {e}")
        
        self.cleanup_stats['cache_cleaned'] += cleaned_count
        
        return {
            'items_deleted': cleaned_count
        }

    @log_service_operation("cleanup_old_conversions")
    def cleanup_old_conversions(self, max_age_hours: int = 24) -> Dict[str, int]:
        """
        Nettoie les anciennes conversions vidéo/audio
        
        Args:
            max_age_hours: Âge maximum en heures
            
        Returns:
            Dict: Statistiques de nettoyage
        """
        return self.safe_execute("cleanup_old_conversions", self._cleanup_old_conversions_logic, max_age_hours)

    def _cleanup_old_conversions_logic(self, max_age_hours: int = 24) -> Dict[str, int]:
        """Logique de nettoyage des anciennes conversions"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        cleaned_count = 0
        
        # Nettoyer les conversions dans le répertoire temporaire
        conversion_dirs = [
            Path(tempfile.gettempdir()) / "docusense_hls",
            Path(tempfile.gettempdir()) / "docusense_conversions"
        ]
        
        for conv_dir in conversion_dirs:
            if conv_dir.exists():
                for item in conv_dir.iterdir():
                    try:
                        stat = item.stat()
                        item_age = datetime.fromtimestamp(stat.st_mtime)
                        
                        if item_age < cutoff_time:
                            if item.is_dir():
                                shutil.rmtree(item)
                            else:
                                item.unlink()
                            cleaned_count += 1
                            
                    except Exception as e:
                        self.logger.warning(f"Impossible de supprimer {item}: {e}")
        
        self.cleanup_stats['conversions_cleaned'] += cleaned_count
        
        return {
            'items_deleted': cleaned_count
        }

    @log_service_operation("fix_invalid_statuses")
    def fix_invalid_statuses(self) -> Dict[str, int]:
        """
        Corrige les statuts invalides dans la base de données
        
        Returns:
            Dict: Statistiques de correction
        """
        return self.safe_execute("fix_invalid_statuses", self._fix_invalid_statuses_logic)

    def _fix_invalid_statuses_logic(self) -> Dict[str, int]:
        """Logique de correction des statuts invalides"""
        fixed_count = 0
        
        # Corriger les fichiers avec des statuts invalides
        invalid_files = self.db.query(File).filter(
            File.status.notin_([status.value for status in FileStatus])
        ).all()
        
        for file in invalid_files:
            file.status = FileStatus.PENDING
            file.updated_at = datetime.now()
            fixed_count += 1
        
        # Corriger les analyses avec des statuts invalides
        invalid_analyses = self.db.query(Analysis).filter(
            Analysis.status.notin_([status.value for status in AnalysisStatus])
        ).all()
        
        for analysis in invalid_analyses:
            analysis.status = AnalysisStatus.PENDING
            analysis.updated_at = datetime.now()
            fixed_count += 1
        
        if fixed_count > 0:
            self.db.commit()
            self.cleanup_stats['invalid_statuses_fixed'] += fixed_count
        
        return {
            'items_fixed': fixed_count
        }

    @log_service_operation("full_cleanup")
    def full_cleanup(self, 
                    max_analysis_age_hours: int = 168,
                    max_temp_age_hours: int = 1,
                    max_log_age_days: int = 7,
                    max_cache_age_hours: int = 24,
                    max_conversion_age_hours: int = 24) -> Dict[str, Any]:
        """
        Effectue un nettoyage complet de l'application
        
        Args:
            max_analysis_age_hours: Âge maximum des analyses
            max_temp_age_hours: Âge maximum des fichiers temporaires
            max_log_age_days: Âge maximum des logs
            max_cache_age_hours: Âge maximum du cache
            max_conversion_age_hours: Âge maximum des conversions
            
        Returns:
            Dict: Statistiques complètes de nettoyage
        """
        return self.safe_execute("full_cleanup", self._full_cleanup_logic, 
                               max_analysis_age_hours, max_temp_age_hours, 
                               max_log_age_days, max_cache_age_hours, 
                               max_conversion_age_hours)

    def _full_cleanup_logic(self, 
                           max_analysis_age_hours: int = 168,
                           max_temp_age_hours: int = 1,
                           max_log_age_days: int = 7,
                           max_cache_age_hours: int = 24,
                           max_conversion_age_hours: int = 24) -> Dict[str, Any]:
        """Logique de nettoyage complet"""
        
        # Réinitialiser les statistiques
        self.cleanup_stats = {
            'files_deleted': 0,
            'analyses_deleted': 0,
            'orphaned_files_marked': 0,
            'invalid_statuses_fixed': 0,
            'temp_files_cleaned': 0,
            'logs_cleaned': 0,
            'cache_cleaned': 0,
            'conversions_cleaned': 0
        }
        
        # Exécuter tous les nettoyages
        results = {
            'orphaned_files': self.cleanup_orphaned_files(),
            'failed_analyses': self.cleanup_failed_analyses(24),
            'old_analyses': self.cleanup_old_analyses(max_analysis_age_hours),
            'temp_files': self.cleanup_temp_files(max_temp_age_hours, 2),
            'logs': self.cleanup_logs(max_log_age_days, 100),
            'cache': self.cleanup_cache(max_cache_age_hours),
            'conversions': self.cleanup_old_conversions(max_conversion_age_hours),
            'invalid_statuses': self.fix_invalid_statuses()
        }
        
        # Ajouter les statistiques globales
        results['total_stats'] = self.cleanup_stats
        results['cleanup_timestamp'] = datetime.now().isoformat()
        
        return results

    @log_service_operation("get_cleanup_stats")
    def get_cleanup_stats(self) -> Dict[str, Any]:
        """
        Récupère les statistiques de nettoyage
        
        Returns:
            Dict: Statistiques de nettoyage
        """
        return self.safe_execute("get_cleanup_stats", self._get_cleanup_stats_logic)

    def _get_cleanup_stats_logic(self) -> Dict[str, Any]:
        """Logique de récupération des statistiques"""
        # Compter les éléments dans la base de données
        total_files = self.db.query(File).count()
        total_analyses = self.db.query(Analysis).count()
        
        # Compter par statut
        files_by_status = {}
        for status in FileStatus:
            count = self.db.query(File).filter(File.status == status).count()
            if count > 0:
                files_by_status[status.value] = count
        
        analyses_by_status = {}
        for status in AnalysisStatus:
            count = self.db.query(Analysis).filter(Analysis.status == status).count()
            if count > 0:
                analyses_by_status[status.value] = count
        
        # Calculer la taille des fichiers temporaires
        temp_size = 0
        temp_count = 0
        if self.temp_dir.exists():
            for file_path in self.temp_dir.iterdir():
                if file_path.is_file():
                    temp_count += 1
                    temp_size += file_path.stat().st_size
        
        return {
            'database': {
                'total_files': total_files,
                'total_analyses': total_analyses,
                'files_by_status': files_by_status,
                'analyses_by_status': analyses_by_status
            },
            'temp_files': {
                'count': temp_count,
                'size_mb': round(temp_size / (1024 * 1024), 2)
            },
            'cleanup_history': self.cleanup_stats
        }
