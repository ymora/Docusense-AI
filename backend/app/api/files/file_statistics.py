"""
Statistiques et métadonnées de fichiers
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
import os
from datetime import datetime

from ...core.database import get_db
from ...services.file_service import FileService
from ...models.file import FileStatus
from ...utils.api_utils import APIUtils, ResponseFormatter

logger = logging.getLogger(__name__)

router = APIRouter(tags=["file-statistics"])


@router.get("/{file_id}/details")
@APIUtils.handle_errors
async def get_file_details(
    file_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get detailed file information including analysis results and metadata"""
    from ...models.file import File
    file = db.query(File).filter(File.id == file_id).first()

    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    # Récupérer les résultats d'analyse si disponibles
    analysis_results = None
    if file.status == FileStatus.COMPLETED and file.analysis_result:
        try:
            import json
            analysis_results = json.loads(
                file.analysis_result) if isinstance(
                file.analysis_result,
                str) else file.analysis_result
        except Exception as e:
            logger.warning(
                f"Could not parse analysis results for file {file_id}: {
                    str(e)}")

    # Récupérer les métadonnées du fichier
    metadata = {}
    try:
        if os.path.exists(file.path):
            stat_info = os.stat(file.path)
            metadata = {
                "permissions": oct(stat_info.st_mode)[-3:],
                "owner": stat_info.st_uid,
                "group": stat_info.st_gid,
                "last_accessed": datetime.fromtimestamp(stat_info.st_atime).isoformat(),
                "last_modified": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                "created": datetime.fromtimestamp(stat_info.st_ctime).isoformat(),
                "is_readable": os.access(file.path, os.R_OK),
                "is_writable": os.access(file.path, os.W_OK),
                "is_executable": os.access(file.path, os.X_OK)
            }
    except Exception as e:
        logger.warning(
            f"Could not load metadata for file {file_id}: {
                str(e)}")

    return {
        "id": file.id,
        "name": file.name,
        "path": file.path,
        "size": file.size,
        "mime_type": file.mime_type,
        "status": file.status.value,
        "created_at": file.created_at.isoformat() if file.created_at else None,
        "updated_at": file.updated_at.isoformat() if file.updated_at else None,
        "error_message": file.error_message,
        "analysis_results": analysis_results,
        "metadata": metadata
    }


@router.get("/{file_id}/analysis")
@APIUtils.handle_errors
async def get_file_analysis(
    file_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get analysis results for a specific file"""
    file_service = FileService(db)
    analysis_result = file_service.get_file_analysis_result(file_id)
    if not analysis_result:
        raise HTTPException(
            status_code=404,
            detail="Analysis result not found")
    return analysis_result


@router.get("/stats/workflow")
@APIUtils.handle_errors
async def get_workflow_stats(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get workflow statistics"""
    file_service = FileService(db)
    return file_service.get_workflow_stats() 