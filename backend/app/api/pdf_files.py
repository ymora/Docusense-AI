"""
PDF Files API endpoints for DocuSense AI
Handles PDF generation and management for analysis results
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from pathlib import Path

from ..core.database import get_db
from ..services.pdf_generator_service import PDFGeneratorService
from ..models.analysis import Analysis, AnalysisStatus
from ..middleware.auth_middleware import AuthMiddleware
from ..utils.api_utils import APIUtils
from ..utils.api_utils import ResponseFormatter

router = APIRouter()


@router.post("/generate/{analysis_id}")
async def generate_analysis_pdf(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_session: dict = Depends(AuthMiddleware.get_current_session)
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
    current_session: dict = Depends(AuthMiddleware.get_current_session)
):
    """
    Generate PDFs for all completed analyses that don't have one
    """
    return APIUtils.handle_errors(
        "generate_pdfs_for_all_completed_analyses",
        _generate_pdfs_for_all_completed_analyses_logic,
        db
    )




@router.get("/download/{analysis_id}")
async def download_analysis_pdf(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_session: dict = Depends(AuthMiddleware.get_current_session)
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
    current_session: dict = Depends(AuthMiddleware.get_current_session)
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




@router.delete("/{analysis_id}")
async def delete_analysis_pdf(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_session: dict = Depends(AuthMiddleware.get_current_session)
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
