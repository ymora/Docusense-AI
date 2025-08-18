# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/api/pdf_files.py
# Fonctions extraites: 2
# Lignes totales extraites: 50
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: _generate_pdfs_for_all_completed_analyses_logic
# Lignes originales: 84-94
# =============================================================================

def _generate_pdfs_for_all_completed_analyses_logic(db: Session):
    """Logic for generating PDFs for all completed analyses"""
    pdf_service = PDFGeneratorService(db)
    generated_count = pdf_service.generate_pdfs_for_completed_analyses()
    
    return ResponseFormatter.success_response(
        data={
            "generated_count": generated_count
        },
        message=f"{generated_count} PDF(s) généré(s) avec succès"
    )


# =============================================================================
# FONCTION: _list_analysis_pdfs_logic
# Lignes originales: 155-193
# =============================================================================

def _list_analysis_pdfs_logic(file_id: Optional[int], limit: int, offset: int, db: Session):
    """Logic for listing analysis PDFs"""
    query = db.query(Analysis).filter(
        Analysis.status == AnalysisStatus.COMPLETED,
        Analysis.pdf_path.isnot(None),
        Analysis.pdf_path != ""
    )
    
    if file_id:
        query = query.filter(Analysis.file_id == file_id)
    
    total = query.count()
    analyses = query.offset(offset).limit(limit).all()
    
    pdf_list = []
    for analysis in analyses:
        pdf_info = {
            "analysis_id": analysis.id,
            "file_id": analysis.file_id,
            "file_name": analysis.file.name if analysis.file else "N/A",
            "analysis_type": analysis.analysis_type.value,
            "provider": analysis.provider,
            "model": analysis.model,
            "pdf_path": analysis.pdf_path,
            "pdf_filename": Path(analysis.pdf_path).name if analysis.pdf_path else None,
            "pdf_exists": os.path.exists(analysis.pdf_path) if analysis.pdf_path else False,
            "completed_at": analysis.completed_at
        }
        pdf_list.append(pdf_info)
    
    return ResponseFormatter.success_response(
        data={
            "pdfs": pdf_list,
            "total": total,
            "limit": limit,
            "offset": offset
        },
        message=f"{len(pdf_list)} PDF(s) trouvé(s)"
    )

