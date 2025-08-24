"""
OCR service for DocuSense AI
Handles text extraction from images, PDFs, and Office documents
"""

from pathlib import Path
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import asyncio

from ..models.file import File, FileStatus
from .document_extractor_service import DocumentExtractorService
from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, FileData


class OCRService(BaseService):
    """Service for OCR and text extraction"""

    def __init__(self, db: Session):
        super().__init__(db)
        self.supported_image_formats = ["jpg", "jpeg", "png", "tiff", "bmp"]
        self.supported_pdf_formats = ["pdf"]
        self.supported_text_formats = ["txt", "html", "htm"]
        # Service d'extraction de documents Office
        self.document_extractor = DocumentExtractorService(db)

    @log_service_operation("extract_text_from_file")
    async def extract_text_from_file(self, file_id: int) -> Optional[str]:
        """
        Extract text from a file using OCR if needed
        """
        return await self.safe_execute("extract_text_from_file", self._extract_text_from_file_logic, file_id)

    async def _extract_text_from_file_logic(self, file_id: int) -> Optional[str]:
        """Logic for extracting text from file"""
        file = self.db.query(File).filter(File.id == file_id).first()
        if not file:
            raise ValueError(f"File {file_id} not found")

        # Check if already has extracted text
        if file.extracted_text:
            return file.extracted_text

        # Get file extension
        extension = Path(file.path).suffix.lower().lstrip('.')

        # Extract text based on file type
        if extension in self.supported_image_formats:
            text = await self._extract_text_from_image(file.path)
        elif extension in self.supported_pdf_formats:
            text = await self._extract_text_from_pdf(file.path)
        elif extension in self.supported_text_formats:
            text = await self._extract_text_from_text_file(file.path)
        elif self.document_extractor.is_format_supported(extension):
            # Utiliser le service d'extraction de documents Office
            text = await self.document_extractor.extract_text(file.path)
        else:
            # For other files, try direct extraction
            text = await self._extract_text_from_text_file(file.path)

        # Update file with extracted text
        if text:
            file.extracted_text = text
            file.status = FileStatus.COMPLETED
            self.db.commit()
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info(f"Extracted text from file {file_id}: {len(text)} characters")
            return text
        else:
            file.status = FileStatus.FAILED
            file.error_message = "No text could be extracted"
            self.db.commit()
            self.logger.warning(f"No text extracted from file {file_id}")
            return None

    async def _extract_text_from_image(self, image_path: str) -> Optional[str]:
        """
        Extract text from image using OCR
        """
        try:
            import pytesseract
            from PIL import Image
            
            # Open the image
            image = Image.open(image_path)
            
            # Extract text using OCR
            text = pytesseract.image_to_string(image, lang='fra+eng')
            
            # Clean up the extracted text
            if text:
                # Remove extra whitespace and normalize
                text = ' '.join(text.split())
                return text if text.strip() else None
            
            return None

        except ImportError:
            self.logger.warning("pytesseract not available, falling back to mock OCR")
            # Fallback to mock OCR if pytesseract is not available
            await asyncio.sleep(1)
            return f"Extracted text from image: {Path(image_path).name}"
        except Exception as e:
            self.logger.error(f"Error extracting text from image {image_path}: {str(e)}")
            raise

    async def _extract_text_from_pdf(self, pdf_path: str) -> Optional[str]:
        """
        Extract text from PDF
        """
        try:
            import PyPDF2
            import pdfplumber
            
            text_content = []
            
            # Try pdfplumber first (better for complex PDFs)
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_content.append(page_text.strip())
                
                if text_content:
                    return '\n\n'.join(text_content)
                    
            except Exception as e:
                self.logger.warning(f"pdfplumber failed, trying PyPDF2: {e}")
            
            # Fallback to PyPDF2
            try:
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_content.append(page_text.strip())
                
                if text_content:
                    return '\n\n'.join(text_content)
                    
            except Exception as e:
                self.logger.warning(f"PyPDF2 failed: {e}")
            
            # If both methods fail, return None
            self.logger.warning(f"Could not extract text from PDF: {pdf_path}")
            return None

        except ImportError:
            self.logger.warning("PDF libraries not available, falling back to mock extraction")
            # Fallback to mock extraction if libraries are not available
            await asyncio.sleep(1)
            return f"Extracted text from PDF: {Path(pdf_path).name}"
        except Exception as e:
            self.logger.error(f"Error extracting text from PDF {pdf_path}: {str(e)}")
            raise

    async def _extract_text_from_text_file(self, file_path: str) -> Optional[str]:
        """
        Extract text from text-based files
        """
        try:
            extension = Path(file_path).suffix.lower().lstrip('.')

            # For HTML files, extract text content
            if extension in ["html", "htm"]:
                return await self._extract_text_from_html(file_path)

            # For other text files, read directly
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()

            return text if text.strip() else None

        except Exception as e:
            self.logger.error(f"Error reading text file {file_path}: {str(e)}")
            raise

    async def _extract_text_from_html(self, html_path: str) -> Optional[str]:
        """
        Extract text content from HTML file
        """
        try:
            import re

            with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
                html_content = f.read()

            # Remove HTML tags
            text = re.sub(r'<[^>]+>', ' ', html_content)

            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text)

            # Remove common HTML entities
            text = text.replace('&nbsp;', ' ')
            text = text.replace('&amp;', '&')
            text = text.replace('&lt;', '<')
            text = text.replace('&gt;', '>')
            text = text.replace('&quot;', '"')
            text = text.replace('&#39;', "'")

            # Clean up the text
            text = text.strip()

            return text if text else None

        except Exception as e:
            self.logger.error(f"Error extracting text from HTML {html_path}: {str(e)}")
            raise

    @log_service_operation("extract_text_batch")
    async def extract_text_batch(self, file_ids: List[int]) -> Dict[int, str]:
        """
        Extract text from multiple files in batch
        """
        return await self.safe_execute("extract_text_batch", self._extract_text_batch_logic, file_ids)

    async def _extract_text_batch_logic(self, file_ids: List[int]) -> Dict[int, str]:
        """Logic for batch text extraction"""
        results = {}

        # Process files concurrently
        tasks = []
        for file_id in file_ids:
            task = asyncio.create_task(self._extract_text_safe(file_id))
            tasks.append((file_id, task))

        # Wait for all tasks to complete
        for file_id, task in tasks:
            try:
                text = await task
                if text:
                    results[file_id] = text
            except Exception as e:
                self.logger.error(f"Error in batch extraction for file {file_id}: {str(e)}")

        return results

    async def _extract_text_safe(self, file_id: int) -> Optional[str]:
        """
        Safe wrapper for text extraction
        """
        try:
            return await self.extract_text_from_file(file_id)
        except Exception as e:
            self.logger.error(f"Safe extraction failed for file {file_id}: {str(e)}")
            return None

    @log_service_operation("validate_ocr_quality")
    def validate_ocr_quality(self, text: str) -> Dict[str, Any]:
        """
        Validate the quality of OCR extracted text
        """
        return self.safe_execute("validate_ocr_quality", self._validate_ocr_quality_logic, text)

    def _validate_ocr_quality_logic(self, text: str) -> Dict[str, Any]:
        """Logic for validating OCR quality"""
        # Basic quality metrics
        total_chars = len(text)
        total_words = len(text.split())
        avg_word_length = total_chars / total_words if total_words > 0 else 0

        # Check for common OCR errors
        suspicious_patterns = [
            '|', '1', '0', 'O', 'l', 'I',  # Common OCR confusions
            'rn', 'm', 'cl', 'd', 'ci'     # Common character confusions
        ]

        error_count = sum(text.count(pattern) for pattern in suspicious_patterns)
        error_rate = error_count / total_chars if total_chars > 0 else 0

        # Quality score (0-100)
        quality_score = max(0, 100 - (error_rate * 1000))

        return {
            "total_characters": total_chars,
            "total_words": total_words,
            "average_word_length": round(avg_word_length, 2),
            "error_count": error_count,
            "error_rate": round(error_rate, 4),
            "quality_score": round(quality_score, 2),
            "is_acceptable": quality_score >= 70
        }

    @log_service_operation("get_ocr_stats")
    def get_ocr_stats(self) -> Dict[str, Any]:
        """
        Get OCR processing statistics
        """
        return self.safe_execute("get_ocr_stats", self._get_ocr_stats_logic)

    def _get_ocr_stats_logic(self) -> Dict[str, Any]:
        """Logic for getting OCR stats"""
        # Count files by status
        total_files = self.db.query(File).count()
        completed_files = self.db.query(File).filter(
            File.status == FileStatus.COMPLETED
        ).count()
        failed_files = self.db.query(File).filter(
            File.status == FileStatus.FAILED
        ).count()

        # Count files with extracted text
        files_with_text = self.db.query(File).filter(
            File.extracted_text.isnot(None)
        ).count()

        # Calculate success rate
        success_rate = (completed_files / total_files * 100) if total_files > 0 else 0

        return {
            "total_files": total_files,
            "completed_files": completed_files,
            "failed_files": failed_files,
            "files_with_text": files_with_text,
            "success_rate": round(success_rate, 2)
        }

    @log_service_operation("cleanup_temp_files")
    def cleanup_temp_files(self):
        """
        Clean up temporary files created during OCR processing
        """
        self.safe_execute("cleanup_temp_files", self._cleanup_temp_files_logic)

    def _cleanup_temp_files_logic(self):
        """Logic for cleaning up temp files"""
        # Clean up any temporary files
        # This would be implemented based on your temporary file strategy
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge # self.logger.info("Cleaned up temporary OCR files")

    @log_service_operation("is_ocr_needed")
    def is_ocr_needed(self, file_path: str) -> bool:
        """
        Determine if OCR is needed for a file
        """
        return self.safe_execute("is_ocr_needed", self._is_ocr_needed_logic, file_path)

    def _is_ocr_needed_logic(self, file_path: str) -> bool:
        """Logic for determining if OCR is needed"""
        extension = Path(file_path).suffix.lower().lstrip('.')

        # Images always need OCR
        if extension in self.supported_image_formats:
            return True

        # PDFs might need OCR if they're scanned
        if extension in self.supported_pdf_formats:
            # PDF content analysis will be implemented in future version
            # For now, assume all PDFs need OCR
            return True

        # Text files (including HTML) don't need OCR
        if extension in self.supported_text_formats:
            return False

        # Other files don't need OCR
        return False
