"""
PDF Files API endpoints for DocuSense AI
Handles PDF generation and management for analysis results
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import os
from pathlib import Path
import logging

from ..core.database import get_db
from ..models.analysis import Analysis, AnalysisStatus
from ..models.file import File as FileModel
from ..services.pdf_generator_service import PDFGeneratorService
from ..utils.api_utils import APIUtils, ResponseFormatter
from ..api.auth import get_current_user
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["pdf-files"])


@router.post("/generate/{analysis_id}")
async def generate_analysis_pdf(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate PDF for a specific analysis
    """
    return APIUtils.handle_errors(
        "generate_analysis_pdf",
        _generate_analysis_pdf_logic,
        analysis_id,
        db
    )


def _generate_analysis_pdf_logic(analysis_id: int, db: Session):
    """Logic for generating analysis PDF"""
    # Check if analysis exists and is completed
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analyse non trouvée")
    
    if analysis.status != AnalysisStatus.COMPLETED:
        raise HTTPException(
            status_code=400, 
            detail=f"L'analyse doit être terminée pour générer un PDF (statut actuel: {analysis.status})"
        )
    
    # Generate PDF
    pdf_service = PDFGeneratorService(db)
    pdf_path = pdf_service.generate_analysis_pdf(analysis_id)
    
    if not pdf_path:
        raise HTTPException(status_code=500, detail="Erreur lors de la génération du PDF")
    
    return ResponseFormatter.success_response(
        data={
            "analysis_id": analysis_id,
            "pdf_path": pdf_path,
            "pdf_filename": Path(pdf_path).name
        },
        message="PDF généré avec succès"
    )


@router.post("/generate-all-completed")
async def generate_pdfs_for_all_completed_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate PDFs for all completed analyses that don't have one
    """
    return APIUtils.handle_errors(
        "generate_pdfs_for_all_completed_analyses",
        _generate_pdfs_for_all_completed_analyses_logic,
        db
    )


def _generate_pdfs_for_all_completed_analyses_logic(db: Session):
    """Logic for generating PDFs for all completed analyses"""
    # Get all completed analyses without PDFs
    analyses = db.query(Analysis).filter(
        Analysis.status == AnalysisStatus.COMPLETED,
        (Analysis.pdf_path.is_(None) | (Analysis.pdf_path == ""))
    ).all()
    
    if not analyses:
        return ResponseFormatter.success_response(
            data={"generated_count": 0},
            message="Aucune analyse terminée sans PDF trouvée"
        )
    
    # Generate PDFs
    pdf_service = PDFGeneratorService(db)
    generated_count = 0
    
    for analysis in analyses:
        try:
            pdf_path = pdf_service.generate_analysis_pdf(analysis.id)
            if pdf_path:
                generated_count += 1
        except Exception as e:
            # Log error but continue with other analyses
            print(f"Erreur lors de la génération du PDF pour l'analyse {analysis.id}: {str(e)}")
    
    return ResponseFormatter.success_response(
        data={"generated_count": generated_count},
        message=f"{generated_count} PDF(s) généré(s) avec succès"
    )




@router.get("/download/{analysis_id}")
async def download_analysis_pdf(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download PDF for a specific analysis
    """
    return APIUtils.handle_errors(
        "download_analysis_pdf",
        _download_analysis_pdf_logic,
        analysis_id,
        db
    )


def _download_analysis_pdf_logic(analysis_id: int, db: Session):
    """Logic for downloading analysis PDF"""
    # Get analysis
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analyse non trouvée")
    
    # Check if PDF exists
    if not analysis.pdf_path or not os.path.exists(analysis.pdf_path):
        raise HTTPException(status_code=404, detail="PDF non trouvé")
    
    # Return file response
    from fastapi.responses import FileResponse
    return FileResponse(
        path=analysis.pdf_path,
        filename=f"analyse_{analysis_id}_{Path(analysis.pdf_path).name}",
        media_type="application/pdf"
    )


@router.get("/list")
async def list_analysis_pdfs(
    file_id: Optional[int] = Query(None, description="Filter by file ID"),
    limit: int = Query(100, description="Number of results to return"),
    offset: int = Query(0, description="Number of results to skip"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List analyses with PDFs
    """
    return APIUtils.handle_errors(
        "list_analysis_pdfs",
        _list_analysis_pdfs_logic,
        file_id,
        limit,
        offset,
        db
    )


def _list_analysis_pdfs_logic(file_id: Optional[int], limit: int, offset: int, db: Session):
    """Logic for listing analysis PDFs"""
    # Build query
    query = db.query(Analysis).filter(Analysis.status == AnalysisStatus.COMPLETED)
    
    # Filter by file_id if provided
    if file_id is not None:
        query = query.filter(Analysis.file_id == file_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    analyses = query.offset(offset).limit(limit).all()
    
    # Build response data
    pdfs = []
    for analysis in analyses:
        # Check if PDF file exists
        pdf_exists = analysis.pdf_path and os.path.exists(analysis.pdf_path)
        
        pdfs.append({
            "analysis_id": analysis.id,
            "file_id": analysis.file_id,
            "file_name": analysis.file.name if analysis.file else "Fichier inconnu",
            "analysis_type": analysis.analysis_type,
            "provider": analysis.provider,
            "model": analysis.model,
            "pdf_path": analysis.pdf_path or "",
            "pdf_filename": Path(analysis.pdf_path).name if analysis.pdf_path else "",
            "pdf_exists": pdf_exists,
            "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else ""
        })
    
    return ResponseFormatter.success_response(
        data={
            "pdfs": pdfs,
            "total": total,
            "limit": limit,
            "offset": offset
        },
        message=f"Liste des PDFs récupérée ({len(pdfs)} résultats)"
    )




@router.delete("/{analysis_id}")
async def delete_analysis_pdf(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete PDF for a specific analysis
    """
    return APIUtils.handle_errors(
        "delete_analysis_pdf",
        _delete_analysis_pdf_logic,
        analysis_id,
        db
    )


def _delete_analysis_pdf_logic(analysis_id: int, db: Session):
    """Logic for deleting analysis PDF"""
    # Get analysis
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analyse non trouvée")
    
    # Check if PDF exists
    if not analysis.pdf_path:
        raise HTTPException(status_code=404, detail="Aucun PDF associé à cette analyse")
    
    # Delete PDF file
    try:
        if os.path.exists(analysis.pdf_path):
            os.remove(analysis.pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression du fichier: {str(e)}")
    
    # Update database
    analysis.pdf_path = None
    db.commit()
    
    return ResponseFormatter.success_response(
        data={"analysis_id": analysis_id},
        message="PDF supprimé avec succès"
    )
