#!/usr/bin/env python3
"""
Script to generate PDFs for all existing completed analyses
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from app.core.config import settings
from app.services.pdf_generator_service import PDFGeneratorService
from app.models.analysis import Analysis, AnalysisStatus
from app.core.database import SessionLocal


def generate_pdfs_for_existing_analyses():
    """Generate PDFs for all existing completed analyses"""
    print("🔄 Génération des PDFs pour les analyses terminées existantes...")
    
    try:
        # Create database session
        db = SessionLocal()
        
        # Get all completed analyses without PDF
        completed_analyses = db.query(Analysis).filter(
            Analysis.status == AnalysisStatus.COMPLETED,
            (Analysis.pdf_path.is_(None) | (Analysis.pdf_path == ""))
        ).all()
        
        print(f"📊 {len(completed_analyses)} analyses terminées trouvées sans PDF")
        
        if not completed_analyses:
            print("✅ Toutes les analyses terminées ont déjà un PDF")
            return
        
        # Initialize PDF generator service
        pdf_service = PDFGeneratorService(db)
        
        # Generate PDFs
        generated_count = 0
        failed_count = 0
        
        for analysis in completed_analyses:
            try:
                print(f"📄 Génération du PDF pour l'analyse {analysis.id}...")
                pdf_path = pdf_service.generate_analysis_pdf(analysis.id)
                
                if pdf_path:
                    generated_count += 1
                    print(f"✅ PDF généré: {pdf_path}")
                else:
                    failed_count += 1
                    print(f"❌ Échec de la génération pour l'analyse {analysis.id}")
                    
            except Exception as e:
                failed_count += 1
                print(f"❌ Erreur lors de la génération du PDF pour l'analyse {analysis.id}: {str(e)}")
        
        print(f"\n📊 Résumé:")
        print(f"✅ PDFs générés avec succès: {generated_count}")
        print(f"❌ Échecs: {failed_count}")
        print(f"📄 Total traité: {len(completed_analyses)}")
        
    except Exception as e:
        print(f"❌ Erreur générale: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    generate_pdfs_for_existing_analyses()
