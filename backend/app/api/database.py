"""
API endpoints pour la gestion de la base de données
Interface web pour visualiser et nettoyer la base de données
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import shutil
import os
from pathlib import Path

from ..core.database import get_db
from ..models.file import File, FileStatus
from ..models.analysis import Analysis
from ..models.queue import QueueItem, QueueStatus
from ..core.database_migration import DatabaseMigrationManager, check_database_consistency
from ..schemas.database import (
    DatabaseStatusResponse,
    CleanupResponse,
    BackupResponse,
    BackupListResponse,
    FileListResponse,
    AnalysisListResponse,
    QueueListResponse
)

router = APIRouter(prefix="/api/database", tags=["database"])


@router.get("/status", response_model=DatabaseStatusResponse)
async def get_database_status(db: Session = Depends(get_db)):
    """Récupère le statut complet de la base de données"""
    try:
        # Compter les fichiers par statut
        total_files = db.query(File).count()
        files_by_status = {}
        for status in FileStatus:
            count = db.query(File).filter(File.status == status).count()
            if count > 0:
                files_by_status[status.value] = count
        
        # Compter les analyses
        total_analyses = db.query(Analysis).count()
        
        # Compter les tâches de queue par statut
        total_queue_items = db.query(QueueItem).count()
        queue_by_status = {}
        for status in QueueStatus:
            count = db.query(QueueItem).filter(QueueItem.status == status).count()
            if count > 0:
                queue_by_status[status.value] = count
        
        # Vérifier la cohérence
        consistency_report = check_database_consistency(db)
        
        return DatabaseStatusResponse(
            total_files=total_files,
            files_by_status=files_by_status,
            total_analyses=total_analyses,
            total_queue_items=total_queue_items,
            queue_by_status=queue_by_status,
            consistency_report=consistency_report
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du statut: {str(e)}")


@router.post("/cleanup/orphaned-files", response_model=CleanupResponse)
async def cleanup_orphaned_files(db: Session = Depends(get_db)):
    """Nettoie les fichiers orphelins"""
    try:
        files = db.query(File).all()
        orphaned_count = 0
        
        for file in files:
            if not Path(file.path).exists():
                db.delete(file)
                orphaned_count += 1
        
        if orphaned_count > 0:
            db.commit()
        
        return CleanupResponse(
            success=True,
            message=f"{orphaned_count} fichiers orphelins supprimés",
            details={"files_deleted": orphaned_count}
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors du nettoyage: {str(e)}")


@router.post("/cleanup/failed-analyses", response_model=CleanupResponse)
async def cleanup_failed_analyses(db: Session = Depends(get_db)):
    """Nettoie les analyses échouées"""
    try:
        failed_analyses = db.query(Analysis).filter(Analysis.status == "failed").all()
        failed_count = len(failed_analyses)
        
        for analysis in failed_analyses:
            db.delete(analysis)
        
        if failed_count > 0:
            db.commit()
        
        return CleanupResponse(
            success=True,
            message=f"{failed_count} analyses échouées supprimées",
            details={"analyses_deleted": failed_count}
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors du nettoyage: {str(e)}")


@router.post("/cleanup/old-queue-items", response_model=CleanupResponse)
async def cleanup_old_queue_items(hours: int = 24, db: Session = Depends(get_db)):
    """Nettoie les tâches de queue anciennes"""
    try:
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        # Supprimer les tâches terminées anciennes
        old_completed = db.query(QueueItem).filter(
            QueueItem.status == QueueStatus.COMPLETED,
            QueueItem.completed_at < cutoff_time
        ).all()
        
        # Supprimer les tâches échouées anciennes
        old_failed = db.query(QueueItem).filter(
            QueueItem.status == QueueStatus.FAILED,
            QueueItem.updated_at < cutoff_time
        ).all()
        
        deleted_count = len(old_completed) + len(old_failed)
        
        for item in old_completed + old_failed:
            db.delete(item)
        
        if deleted_count > 0:
            db.commit()
        
        return CleanupResponse(
            success=True,
            message=f"{deleted_count} tâches anciennes supprimées",
            details={"queue_items_deleted": deleted_count}
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors du nettoyage: {str(e)}")


@router.post("/cleanup/temp-files", response_model=CleanupResponse)
async def cleanup_temp_files(db: Session = Depends(get_db)):
    """Nettoie les fichiers temporaires"""
    try:
        temp_dir = Path("temp_downloads")
        cleaned_count = 0
        
        if temp_dir.exists():
            for file_path in temp_dir.iterdir():
                if file_path.is_file():
                    try:
                        file_path.unlink()
                        cleaned_count += 1
                    except Exception:
                        pass
        
        return CleanupResponse(
            success=True,
            message=f"{cleaned_count} fichiers temporaires supprimés",
            details={"temp_files_cleaned": cleaned_count}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du nettoyage: {str(e)}")


@router.post("/fix-invalid-statuses", response_model=CleanupResponse)
async def fix_invalid_statuses(db: Session = Depends(get_db)):
    """Corrige les statuts invalides"""
    try:
        migration_manager = DatabaseMigrationManager(db)
        results = migration_manager.run_migrations()
        
        fixed_count = len([m for m in results['migrations_applied'] if m['type'] == 'status_correction'])
        
        return CleanupResponse(
            success=True,
            message=f"{fixed_count} statuts corrigés",
            details={"invalid_statuses_fixed": fixed_count}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la correction: {str(e)}")


@router.post("/full-cleanup", response_model=CleanupResponse)
async def full_cleanup(db: Session = Depends(get_db)):
    """Effectue un nettoyage complet"""
    try:
        # Exécuter toutes les opérations de nettoyage
        orphaned_result = await cleanup_orphaned_files(db)
        failed_result = await cleanup_failed_analyses(db)
        queue_result = await cleanup_old_queue_items(24, db)
        temp_result = await cleanup_temp_files(db)
        status_result = await fix_invalid_statuses(db)
        
        total_deleted = (
            orphaned_result.details.get("files_deleted", 0) +
            failed_result.details.get("analyses_deleted", 0) +
            queue_result.details.get("queue_items_deleted", 0) +
            temp_result.details.get("temp_files_cleaned", 0) +
            status_result.details.get("invalid_statuses_fixed", 0)
        )
        
        return CleanupResponse(
            success=True,
            message=f"Nettoyage complet terminé: {total_deleted} éléments traités",
            details={
                "files_deleted": orphaned_result.details.get("files_deleted", 0),
                "analyses_deleted": failed_result.details.get("analyses_deleted", 0),
                "queue_items_deleted": queue_result.details.get("queue_items_deleted", 0),
                "temp_files_cleaned": temp_result.details.get("temp_files_cleaned", 0),
                "invalid_statuses_fixed": status_result.details.get("invalid_statuses_fixed", 0)
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du nettoyage complet: {str(e)}")


@router.post("/backup/create", response_model=BackupResponse)
async def create_backup(db: Session = Depends(get_db)):
    """Crée une sauvegarde de la base de données"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"docusense_backup_{timestamp}.db"
        backup_path = Path(backup_name)
        
        # Copier la base de données
        shutil.copy2("docusense.db", backup_path)
        
        return BackupResponse(
            success=True,
            backup_name=backup_name,
            message=f"Sauvegarde créée: {backup_name}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de la sauvegarde: {str(e)}")


@router.get("/backup/list", response_model=BackupListResponse)
async def list_backups():
    """Liste les sauvegardes disponibles"""
    try:
        backup_files = []
        for backup_path in Path(".").glob("docusense_backup_*.db"):
            stat = backup_path.stat()
            backup_files.append({
                "name": backup_path.name,
                "size": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat()
            })
        
        # Trier par date de création (plus récent en premier)
        backup_files.sort(key=lambda x: x["created_at"], reverse=True)
        
        return BackupListResponse(backups=backup_files)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des sauvegardes: {str(e)}")


@router.post("/backup/restore", response_model=BackupResponse)
async def restore_backup(backup_name: str, db: Session = Depends(get_db)):
    """Restaure une sauvegarde"""
    try:
        backup_path = Path(backup_name)
        if not backup_path.exists():
            raise HTTPException(status_code=404, detail="Sauvegarde introuvable")
        
        # Créer une sauvegarde de l'état actuel
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        current_backup = f"docusense_current_{timestamp}.db"
        shutil.copy2("docusense.db", current_backup)
        
        # Restaurer la sauvegarde
        shutil.copy2(backup_path, "docusense.db")
        
        return BackupResponse(
            success=True,
            backup_name=backup_name,
            message=f"Base de données restaurée depuis {backup_name}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la restauration: {str(e)}")


@router.get("/files", response_model=FileListResponse)
async def get_files(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Récupère la liste des fichiers"""
    try:
        query = db.query(File)
        
        if status:
            query = query.filter(File.status == status)
        
        files = query.limit(limit).all()
        
        return FileListResponse(files=[
            {
                "id": file.id,
                "name": file.name,
                "path": file.path,
                "status": file.status,
                "mime_type": file.mime_type or "",
                "size": file.size or 0,
                "created_at": file.created_at.isoformat() if file.created_at else "",
                "updated_at": file.updated_at.isoformat() if file.updated_at else ""
            }
            for file in files
        ], total=len(files), limit=limit, offset=0)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des fichiers: {str(e)}")


@router.get("/analyses", response_model=AnalysisListResponse)
async def get_analyses(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Récupère la liste des analyses"""
    try:
        query = db.query(Analysis)
        
        if status:
            query = query.filter(Analysis.status == status)
        
        analyses = query.limit(limit).all()
        
        return AnalysisListResponse(analyses=[
            {
                "id": analysis.id,
                "file_id": analysis.file_id or 0,  # Gérer les valeurs None
                "status": analysis.status,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else "",
                "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
                "error_message": analysis.error_message
            }
            for analysis in analyses
        ], total=len(analyses), limit=limit, offset=0)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des analyses: {str(e)}")


@router.get("/queue-items", response_model=QueueListResponse)
async def get_queue_items(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Récupère la liste des tâches de queue"""
    try:
        query = db.query(QueueItem)
        
        if status:
            query = query.filter(QueueItem.status == status)
        
        items = query.limit(limit).all()
        
        return QueueListResponse(queue_items=[
            {
                "id": item.id,
                "analysis_id": item.analysis_id,
                "status": item.status,
                "created_at": item.created_at.isoformat() if item.created_at else "",
                "started_at": item.started_at.isoformat() if item.started_at else None,
                "completed_at": item.completed_at.isoformat() if item.completed_at else None,
                "error_message": item.error_message
            }
            for item in items
        ], total=len(items), limit=limit, offset=0)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des tâches de queue: {str(e)}")
