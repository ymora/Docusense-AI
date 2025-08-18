"""
Système de migration automatique de la base de données
Maintient la cohérence entre le code et la base de données
"""

import logging
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from ..models.file import File, FileStatus
from ..core.file_validation import FileValidator
from ..core.status_manager import StatusManager

logger = logging.getLogger(__name__)


class DatabaseMigrationManager:
    """
    Gestionnaire de migrations automatiques de la base de données
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.migrations_applied = set()
    
    def run_migrations(self) -> Dict[str, Any]:
        """
        Exécute toutes les migrations nécessaires
        
        Returns:
            Dict avec le statut des migrations
        """
        logger.info("🔄 Début des migrations automatiques de la base de données")
        
        results = {
            'migrations_applied': [],
            'errors': [],
            'warnings': [],
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            # Migration 1: Mise à jour des statuts de fichiers
            self._migrate_file_statuses(results)
            
            # Migration 2: Validation des types MIME
            self._migrate_mime_types(results)
            
            # Migration 3: Nettoyage des fichiers orphelins
            self._cleanup_orphaned_files(results)
            
            # Migration 4: Mise à jour des métadonnées
            self._update_file_metadata(results)
            
            logger.info(f"✅ Migrations terminées: {len(results['migrations_applied'])} appliquées")
            
        except Exception as e:
            error_msg = f"Erreur lors des migrations: {str(e)}"
            logger.error(error_msg)
            results['errors'].append(error_msg)
        
        return results
    
    def _migrate_file_statuses(self, results: Dict[str, Any]):
        """Migration des statuts de fichiers"""
        try:
            # Vérifier les statuts invalides
            invalid_statuses = self.db.query(File).filter(
                ~File.status.in_(['pending', 'processing', 'completed', 'failed', 'unsupported'])
            ).all()
            
            if invalid_statuses:
                logger.warning(f"[MIGRATION] Correction de {len(invalid_statuses)} statuts invalides")
                
                for file in invalid_statuses:
                    old_status = file.status
                    file.status = FileStatus.PENDING
                    file.updated_at = datetime.now()
                    
                    results['migrations_applied'].append({
                        'type': 'status_correction',
                        'file_id': file.id,
                        'file_name': file.name,
                        'old_status': old_status,
                        'new_status': 'pending'
                    })
                
                self.db.commit()
                results['warnings'].append(f"Corrigé {len(invalid_statuses)} statuts invalides")
        
        except Exception as e:
            error_msg = f"Erreur migration statuts: {str(e)}"
            logger.error(error_msg)
            results['errors'].append(error_msg)
    
    def _migrate_mime_types(self, results: Dict[str, Any]):
        """Migration des types MIME"""
        try:
            # Récupérer tous les fichiers
            files = self.db.query(File).all()
            
            updated_count = 0
            for file in files:
                # Vérifier si le type MIME est valide
                if not file.mime_type:
                    # Essayer de détecter le type MIME
                    from pathlib import Path
                    file_path = Path(file.path)
                    if file_path.exists():
                        import mimetypes
                        detected_type, _ = mimetypes.guess_type(str(file_path))
                        if detected_type:
                            file.mime_type = detected_type
                            file.updated_at = datetime.now()
                            updated_count += 1
                            
                            results['migrations_applied'].append({
                                'type': 'mime_type_detection',
                                'file_id': file.id,
                                'file_name': file.name,
                                'new_mime_type': detected_type
                            })
            
            if updated_count > 0:
                self.db.commit()
                logger.info(f"📝 Mis à jour {updated_count} types MIME")
                results['warnings'].append(f"Mis à jour {updated_count} types MIME")
        
        except Exception as e:
            error_msg = f"Erreur migration types MIME: {str(e)}"
            logger.error(error_msg)
            results['errors'].append(error_msg)
    
    def _cleanup_orphaned_files(self, results: Dict[str, Any]):
        """Nettoyage des fichiers orphelins"""
        try:
            from pathlib import Path
            
            # Récupérer tous les fichiers
            files = self.db.query(File).all()
            
            orphaned_count = 0
            for file in files:
                file_path = Path(file.path)
                if not file_path.exists():
                    # Marquer comme orphelin
                    file.status = FileStatus.UNSUPPORTED
                    file.error_message = "Fichier introuvable sur le disque"
                    file.updated_at = datetime.now()
                    orphaned_count += 1
                    
                    results['migrations_applied'].append({
                        'type': 'orphaned_file',
                        'file_id': file.id,
                        'file_name': file.name,
                        'path': file.path
                    })
            
            if orphaned_count > 0:
                self.db.commit()
                logger.warning(f"🗑️  Marqué {orphaned_count} fichiers comme orphelins")
                results['warnings'].append(f"Marqué {orphaned_count} fichiers comme orphelins")
        
        except Exception as e:
            error_msg = f"Erreur nettoyage fichiers orphelins: {str(e)}"
            logger.error(error_msg)
            results['errors'].append(error_msg)
    
    def _update_file_metadata(self, results: Dict[str, Any]):
        """Mise à jour des métadonnées des fichiers"""
        try:
            from pathlib import Path
            import os
            
            # Récupérer les fichiers sans métadonnées complètes
            files = self.db.query(File).filter(
                (File.size.is_(None)) | (File.file_created_at.is_(None))
            ).all()
            
            updated_count = 0
            for file in files:
                file_path = Path(file.path)
                if file_path.exists():
                    try:
                        stat = file_path.stat()
                        
                        # Mettre à jour la taille
                        if not file.size:
                            file.size = stat.st_size
                        
                        # Mettre à jour les dates
                        if not file.file_created_at:
                            file.file_created_at = datetime.fromtimestamp(stat.st_ctime)
                        
                        if not file.file_modified_at:
                            file.file_modified_at = datetime.fromtimestamp(stat.st_mtime)
                        
                        file.updated_at = datetime.now()
                        updated_count += 1
                        
                        results['migrations_applied'].append({
                            'type': 'metadata_update',
                            'file_id': file.id,
                            'file_name': file.name
                        })
                    
                    except Exception as e:
                        logger.warning(f"Impossible de mettre à jour les métadonnées pour {file.name}: {str(e)}")
            
            if updated_count > 0:
                self.db.commit()
                logger.info(f"📝 Mis à jour {updated_count} métadonnées")
                results['warnings'].append(f"Mis à jour {updated_count} métadonnées")
        
        except Exception as e:
            error_msg = f"Erreur mise à jour métadonnées: {str(e)}"
            logger.error(error_msg)
            results['errors'].append(error_msg)


def run_automatic_migrations(db: Session) -> Dict[str, Any]:
    """
    Fonction utilitaire pour exécuter les migrations automatiques
    
    Args:
        db: Session de base de données
        
    Returns:
        Résultats des migrations
    """
    migration_manager = DatabaseMigrationManager(db)
    return migration_manager.run_migrations()


def check_database_consistency(db: Session) -> Dict[str, Any]:
    """
    Vérifie la cohérence de la base de données
    
    Args:
        db: Session de base de données
        
    Returns:
        Rapport de cohérence
    """
    report = {
        'total_files': 0,
        'valid_files': 0,
        'invalid_statuses': 0,
        'missing_mime_types': 0,
        'orphaned_files': 0,
        'issues': []
    }
    
    try:
        files = db.query(File).all()
        report['total_files'] = len(files)
        
        for file in files:
            issues = []
            
            # Vérifier le statut
            if file.status not in ['pending', 'processing', 'completed', 'failed', 'unsupported']:
                report['invalid_statuses'] += 1
                issues.append(f"Statut invalide: {file.status}")
            
            # Vérifier le type MIME
            if not file.mime_type:
                report['missing_mime_types'] += 1
                issues.append("Type MIME manquant")
            
            # Vérifier l'existence du fichier
            from pathlib import Path
            if not Path(file.path).exists():
                report['orphaned_files'] += 1
                issues.append("Fichier introuvable")
            
            if not issues:
                report['valid_files'] += 1
            else:
                report['issues'].append({
                    'file_id': file.id,
                    'file_name': file.name,
                    'issues': issues
                })
    
    except Exception as e:
        report['errors'] = [str(e)]
    
    return report

