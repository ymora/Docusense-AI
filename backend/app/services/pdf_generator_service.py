"""
PDF Generator Service for DocuSense AI
Generates PDF reports for completed analyses
"""

import os
from pathlib import Path
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import tempfile
import shutil

from .base_service import BaseService, log_service_operation
from ..models.analysis import Analysis, AnalysisStatus
from ..models.file import File
from ..core.types import ServiceResponse


class PDFGeneratorService(BaseService):
    """Service for generating PDF reports from analysis results"""

    def __init__(self, db: Session):
        super().__init__(db)
        self.analyses_dir = Path("analyses")
        self.analyses_dir.mkdir(exist_ok=True)

    @log_service_operation("generate_analysis_pdf")
    def generate_analysis_pdf(self, analysis_id: int) -> Optional[str]:
        """
        Generate a PDF report for a completed analysis
        Returns the path to the generated PDF file
        """
        return self.safe_execute("generate_analysis_pdf", self._generate_analysis_pdf_logic, analysis_id)

    def _generate_analysis_pdf_logic(self, analysis_id: int) -> Optional[str]:
        """Logic for generating analysis PDF"""
        # Get analysis and file
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise ValueError(f"Analysis {analysis_id} not found")

        file = self.db.query(File).filter(File.id == analysis.file_id).first()
        if not file:
            raise ValueError(f"File {analysis.file_id} not found")

        # Check if analysis is completed
        if analysis.status != AnalysisStatus.COMPLETED:
            raise ValueError(f"Analysis {analysis_id} is not completed (status: {analysis.status})")

        # Check if PDF already exists
        if analysis.pdf_path and os.path.exists(analysis.pdf_path):
            self.logger.info(f"PDF already exists for analysis {analysis_id}: {analysis.pdf_path}")
            return analysis.pdf_path

        # Generate PDF filename
        pdf_filename = f"analysis_{analysis_id}_{file.name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        pdf_path = self.analyses_dir / pdf_filename

        try:
            # Generate PDF content
            pdf_content = self._create_pdf_content(analysis, file)
            
            # Write PDF file
            self._write_pdf_file(pdf_path, pdf_content)
            
            # Update analysis with PDF path
            analysis.pdf_path = str(pdf_path)
            self.db.commit()
            
            self.logger.info(f"Generated PDF for analysis {analysis_id}: {pdf_path}")
            return str(pdf_path)
            
        except Exception as e:
            self.logger.error(f"Error generating PDF for analysis {analysis_id}: {str(e)}")
            raise

    def _create_pdf_content(self, analysis: Analysis, file: File) -> str:
        """Create HTML content for PDF generation"""
        # Get analysis metadata
        metadata = analysis.analysis_metadata or {}
        
        # Create HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Analyse - {file.name}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 40px;
                    line-height: 1.6;
                    color: #333;
                }}
                .header {{
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }}
                .title {{
                    color: #007bff;
                    font-size: 24px;
                    margin: 0;
                }}
                .subtitle {{
                    color: #666;
                    font-size: 16px;
                    margin: 10px 0;
                }}
                .section {{
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f8f9fa;
                    border-radius: 5px;
                }}
                .section-title {{
                    font-weight: bold;
                    color: #495057;
                    margin-bottom: 10px;
                }}
                .metadata {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin: 15px 0;
                }}
                .metadata-item {{
                    padding: 8px;
                    background-color: white;
                    border-radius: 3px;
                }}
                .metadata-label {{
                    font-weight: bold;
                    color: #6c757d;
                }}
                .result {{
                    background-color: white;
                    padding: 20px;
                    border-radius: 5px;
                    border-left: 4px solid #28a745;
                    white-space: pre-wrap;
                }}
                .footer {{
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    text-align: center;
                    color: #6c757d;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="title">Rapport d'Analyse IA</h1>
                <p class="subtitle">DocuSense AI - {datetime.now().strftime('%d/%m/%Y à %H:%M')}</p>
            </div>

            <div class="section">
                <div class="section-title">Informations sur le fichier</div>
                <div class="metadata">
                    <div class="metadata-item">
                        <div class="metadata-label">Nom du fichier:</div>
                        <div>{file.name}</div>
                    </div>
                    <div class="metadata-item">
                        <div class="metadata-label">Type de fichier:</div>
                        <div>{Path(file.path).suffix.upper()}</div>
                    </div>
                    <div class="metadata-item">
                        <div class="metadata-label">Taille:</div>
                        <div>{self._format_file_size(file.size)}</div>
                    </div>
                    <div class="metadata-item">
                        <div class="metadata-label">Date de création:</div>
                        <div>{file.created_at.strftime('%d/%m/%Y %H:%M') if file.created_at else 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Paramètres d'analyse</div>
                <div class="metadata">
                    <div class="metadata-item">
                        <div class="metadata-label">Type d'analyse:</div>
                        <div>{analysis.analysis_type.value.title()}</div>
                    </div>
                    <div class="metadata-item">
                        <div class="metadata-label">Fournisseur IA:</div>
                        <div>{analysis.provider.title()}</div>
                    </div>
                    <div class="metadata-item">
                        <div class="metadata-label">Modèle:</div>
                        <div>{analysis.model}</div>
                    </div>
                    <div class="metadata-item">
                        <div class="metadata-label">Date d'analyse:</div>
                        <div>{analysis.completed_at.strftime('%d/%m/%Y %H:%M') if analysis.completed_at else 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Prompt utilisé</div>
                <div class="result">{analysis.prompt}</div>
            </div>

            <div class="section">
                <div class="section-title">Résultat de l'analyse</div>
                <div class="result">{analysis.result or 'Aucun résultat disponible'}</div>
            </div>
        """

        # Add metadata section if available
        if metadata:
            html_content += """
            <div class="section">
                <div class="section-title">Métadonnées de traitement</div>
                <div class="metadata">
            """
            
            for key, value in metadata.items():
                if key not in ['prompt_id', 'prompt_data', 'provider_priority']:
                    html_content += f"""
                    <div class="metadata-item">
                        <div class="metadata-label">{key.replace('_', ' ').title()}:</div>
                        <div>{value}</div>
                    </div>
                    """
            
            html_content += """
                </div>
            </div>
            """

        html_content += f"""
            <div class="footer">
                <p>Généré automatiquement par DocuSense AI</p>
                <p>ID d'analyse: {analysis.id} | ID de fichier: {file.id}</p>
            </div>
        </body>
        </html>
        """
        
        return html_content

    def _write_pdf_file(self, pdf_path: Path, html_content: str) -> None:
        """Write HTML content to PDF file using weasyprint"""
        try:
            from weasyprint import HTML, CSS
            from weasyprint.text.fonts import FontConfiguration
            
            # Configure fonts
            font_config = FontConfiguration()
            
            # Create PDF from HTML
            html_doc = HTML(string=html_content)
            css = CSS(string='', font_config=font_config)
            
            # Write PDF
            html_doc.write_pdf(pdf_path, stylesheets=[css], font_config=font_config)
            
        except ImportError:
            # Fallback to simple text file if weasyprint is not available
            self.logger.warning("weasyprint not available, creating text file instead")
            text_content = f"""
RAPPORT D'ANALYSE IA
===================

Date: {datetime.now().strftime('%d/%m/%Y à %H:%M')}

RÉSULTAT DE L'ANALYSE:
{html_content}
            """
            
            with open(pdf_path.with_suffix('.txt'), 'w', encoding='utf-8') as f:
                f.write(text_content)
            
            # Create a simple PDF using reportlab as fallback
            try:
                from reportlab.lib.pagesizes import letter
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
                from reportlab.lib.styles import getSampleStyleSheet
                
                doc = SimpleDocTemplate(str(pdf_path), pagesize=letter)
                styles = getSampleStyleSheet()
                story = []
                
                # Add content to PDF
                story.append(Paragraph("RAPPORT D'ANALYSE IA", styles['Title']))
                story.append(Spacer(1, 12))
                story.append(Paragraph(f"Date: {datetime.now().strftime('%d/%m/%Y à %H:%M')}", styles['Normal']))
                story.append(Spacer(1, 12))
                story.append(Paragraph("RÉSULTAT DE L'ANALYSE:", styles['Heading2']))
                story.append(Spacer(1, 12))
                
                # Extract text content from HTML
                import re
                text_content = re.sub(r'<[^>]+>', '', html_content)
                text_content = re.sub(r'\s+', ' ', text_content).strip()
                
                story.append(Paragraph(text_content, styles['Normal']))
                
                doc.build(story)
                
            except ImportError:
                self.logger.error("Neither weasyprint nor reportlab available for PDF generation")
                raise

    def _format_file_size(self, size_bytes: Optional[int]) -> str:
        """Format file size in human readable format"""
        if size_bytes is None:
            return "N/A"
        
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"

    @log_service_operation("generate_pdfs_for_completed_analyses")
    def generate_pdfs_for_completed_analyses(self) -> int:
        """
        Generate PDFs for all completed analyses that don't have one
        Returns the number of PDFs generated
        """
        return self.safe_execute("generate_pdfs_for_completed_analyses", self._generate_pdfs_for_completed_analyses_logic)

    def _generate_pdfs_for_completed_analyses_logic(self) -> int:
        """Logic for generating PDFs for all completed analyses"""
        # Get all completed analyses without PDF
        completed_analyses = self.db.query(Analysis).filter(
            Analysis.status == AnalysisStatus.COMPLETED,
            (Analysis.pdf_path.is_(None) | (Analysis.pdf_path == ""))
        ).all()
        
        generated_count = 0
        
        for analysis in completed_analyses:
            try:
                pdf_path = self.generate_analysis_pdf(analysis.id)
                if pdf_path:
                    generated_count += 1
                    self.logger.info(f"Generated PDF for analysis {analysis.id}")
            except Exception as e:
                self.logger.error(f"Failed to generate PDF for analysis {analysis.id}: {str(e)}")
        
        self.logger.info(f"Generated {generated_count} PDFs for completed analyses")
        return generated_count
