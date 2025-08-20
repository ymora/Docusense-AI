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

from ..core.database_migration import DatabaseMigrationManager, check_database_consistency
from ..schemas.database import (
    DatabaseStatusResponse,
    CleanupResponse,
    BackupResponse,
    BackupListResponse,
    FileListResponse,
    AnalysisListResponse
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
        
        # Compter les analyses par statut
        analyses_by_status = {}
        for status in ['pending', 'processing', 'completed', 'failed']:
            count = db.query(Analysis).filter(Analysis.status == status).count()
            if count > 0:
                analyses_by_status[status] = count
        
        # Vérifier la cohérence
        consistency_report = check_database_consistency(db)
        
        return DatabaseStatusResponse(
            total_files=total_files,
            files_by_status=files_by_status,
            total_analyses=total_analyses,
            analyses_by_status=analyses_by_status,
            consistency_report=consistency_report
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du statut: {str(e)}")


@router.post("/cleanup/orphaned-files", response_model=CleanupResponse)
async def cleanup_orphaned_files(db: Session = Depends(get_db)):
    """⚠️ ATTENTION : Nettoie les entrées de fichiers orphelins dans la base de données"""
    try:
        files = db.query(File).all()
        orphaned_count = 0
        
        for file in files:
            # Vérifier si le fichier existe physiquement
            if not Path(file.path).exists():
                # ⚠️ ATTENTION : Cette action supprime l'entrée de la base de données
                # mais NE TOUCHE PAS au fichier original s'il existe ailleurs
                # Seulement les références "orphelines" sont supprimées
                db.delete(file)
                orphaned_count += 1
        
        if orphaned_count > 0:
            db.commit()
        
        return CleanupResponse(
            success=True,
            message=f"⚠️ {orphaned_count} entrées de fichiers orphelins supprimées de la base de données (fichiers originaux préservés)",
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
    """Effectue un nettoyage complet (SAFE - ne touche pas aux fichiers originaux)"""
    try:
        # Exécuter toutes les opérations de nettoyage SÛRES
        # ⚠️ EXCLU : cleanup_orphaned_files (risque pour les fichiers originaux)
        failed_result = cleanup_failed_analyses(db)
        temp_result = cleanup_temp_files(db)
        status_result = fix_invalid_statuses(db)
        
        total_deleted = (
            failed_result.details.get("analyses_deleted", 0) +
            temp_result.details.get("temp_files_cleaned", 0) +
            status_result.details.get("invalid_statuses_fixed", 0)
        )
        
        return CleanupResponse(
            success=True,
            message=f"Nettoyage complet terminé: {total_deleted} éléments traités (fichiers originaux préservés)",
            details={
                "files_deleted": 0,  # Toujours 0 pour la sécurité
                            "analyses_deleted": failed_result.details.get("analyses_deleted", 0),
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
    file_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Récupère la liste des analyses"""
    try:
        query = db.query(Analysis)
        
        if status:
            query = query.filter(Analysis.status == status)
        
        if file_id:
            query = query.filter(Analysis.file_id == file_id)
        
        analyses = query.limit(limit).all()
        
        # Récupérer les informations des fichiers associés
        file_ids = [analysis.file_id for analysis in analyses if analysis.file_id]
        files_dict = {}
        if file_ids:
            files = db.query(File).filter(File.id.in_(file_ids)).all()
            files_dict = {file.id: file for file in files}
        
        return AnalysisListResponse(analyses=[
            {
                "id": analysis.id,
                "file_id": analysis.file_id or 0,  # Gérer les valeurs None
                "file_name": files_dict.get(analysis.file_id, {}).name if analysis.file_id and analysis.file_id in files_dict else "Fichier introuvable",
                "file_path": files_dict.get(analysis.file_id, {}).path if analysis.file_id and analysis.file_id in files_dict else "",
                "status": analysis.status,
                "analysis_type": analysis.analysis_type,
                "provider": analysis.provider,
                "model": analysis.model,
                "progress": analysis.progress or 0.0,
                "current_step": analysis.current_step,
                "total_steps": analysis.total_steps or 1,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else "",
                "started_at": analysis.started_at.isoformat() if analysis.started_at else None,
                "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
                "error_message": analysis.error_message
            }
            for analysis in analyses
        ], total=len(analyses), limit=limit, offset=0)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des analyses: {str(e)}")


@router.get("/files/{file_id}/analyses", response_model=AnalysisListResponse)
async def get_file_analyses(
    file_id: int,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Récupère les analyses d'un fichier spécifique"""
    try:
        # Vérifier que le fichier existe
        file = db.query(File).filter(File.id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="Fichier introuvable")
        
        query = db.query(Analysis).filter(Analysis.file_id == file_id)
        
        if status:
            query = query.filter(Analysis.status == status)
        
        analyses = query.limit(limit).all()
        
        return AnalysisListResponse(analyses=[
            {
                "id": analysis.id,
                "file_id": analysis.file_id or 0,
                "file_name": file.name,
                "file_path": file.path,
                "status": analysis.status,
                "analysis_type": analysis.analysis_type,
                "provider": analysis.provider,
                "model": analysis.model,
                "progress": analysis.progress or 0.0,
                "current_step": analysis.current_step,
                "total_steps": analysis.total_steps or 1,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else "",
                "started_at": analysis.started_at.isoformat() if analysis.started_at else None,
                "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
                "error_message": analysis.error_message
            }
            for analysis in analyses
        ], total=len(analyses), limit=limit, offset=0)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des analyses: {str(e)}")


@router.post("/analyses/{analysis_id}/retry")
async def retry_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Relance une analyse échouée"""
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analyse introuvable")
        
        if analysis.status != 'failed':
            raise HTTPException(status_code=400, detail="Seules les analyses échouées peuvent être relancées")
        
        # Réinitialiser l'analyse pour la relancer
        analysis.status = 'pending'
        analysis.progress = 0.0
        analysis.current_step = None
        analysis.error_message = None
        analysis.started_at = None
        analysis.completed_at = None
        
        db.commit()
        
        return {"success": True, "message": f"Analyse {analysis_id} relancée avec succès"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors du relancement: {str(e)}")


@router.delete("/analyses/{analysis_id}")
async def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Supprime une analyse"""
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analyse introuvable")
        
        db.delete(analysis)
        db.commit()
        
        return {"success": True, "message": f"Analyse {analysis_id} supprimée avec succès"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")


from pydantic import BaseModel

class BulkDeleteRequest(BaseModel):
    analysis_ids: List[int]

@router.post("/analyses/bulk-delete")
async def delete_multiple_analyses(request: BulkDeleteRequest, db: Session = Depends(get_db)):
    """Supprime plusieurs analyses en lot"""
    try:
        analyses = db.query(Analysis).filter(Analysis.id.in_(request.analysis_ids)).all()
        if not analyses:
            raise HTTPException(status_code=404, detail="Aucune analyse trouvée")
        
        for analysis in analyses:
            db.delete(analysis)
        
        db.commit()
        
        return {"success": True, "message": f"{len(analyses)} analyses supprimées avec succès"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression en lot: {str(e)}")