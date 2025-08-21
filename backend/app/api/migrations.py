"""
API pour les migrations de base de données
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..core.database import get_db
from ..core.database_migration import run_automatic_migrations, check_database_consistency
from ..utils.api_utils import APIUtils
from ..core.logging import setup_logging
import logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/migrations", tags=["migrations"])


@router.post("/run")
@APIUtils.handle_errors
async def run_migrations(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Exécute les migrations automatiques de la base de données
    """
    try:
        logger.info("[MIGRATION] Déclenchement manuel des migrations")
        results = run_automatic_migrations(db)
        
        return {
            "success": True,
            "message": f"Migrations exécutées: {len(results.get('migrations_applied', []))} appliquées",
            "results": results
        }
    except Exception as e:
        logger.error(f"Erreur lors des migrations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors des migrations: {str(e)}")


@router.get("/check-consistency")
@APIUtils.handle_errors
async def check_consistency(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Vérifie la cohérence de la base de données
    """
    try:
        logger.info("Vérification de la cohérence de la base de données")
        report = check_database_consistency(db)
        
        return {
            "success": True,
            "message": "Cohérence vérifiée",
            "report": report
        }
    except Exception as e:
        logger.error(f"Erreur lors de la vérification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la vérification: {str(e)}")


@router.get("/status")
@APIUtils.handle_errors
async def get_migration_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Obtient le statut des migrations
    """
    try:
        # Vérifier la cohérence
        report = check_database_consistency(db)
        
        # Déterminer le statut global
        total_issues = (
            report.get('invalid_statuses', 0) +
            report.get('missing_mime_types', 0) +
            report.get('orphaned_files', 0)
        )
        
        status = "healthy" if total_issues == 0 else "needs_migration"
        
        return {
            "success": True,
            "status": status,
            "total_files": report.get('total_files', 0),
            "valid_files": report.get('valid_files', 0),
            "total_issues": total_issues,
            "issues": report.get('issues', [])
        }
    except Exception as e:
        logger.error(f"Erreur lors du statut: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du statut: {str(e)}")

