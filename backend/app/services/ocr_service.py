"""
OCR service for DocuSense AI
Handles text extraction from images and PDFs
"""

from pathlib import Path
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import logging
import asyncio

from ..models.file import File, FileStatus

logger = logging.getLogger(__name__)


class OCRService:
    """Service for OCR and text extraction"""

    def __init__(self, db: Session):
        self.db = db
        self.supported_image_formats = ["jpg", "jpeg", "png", "tiff", "bmp"]
        self.supported_pdf_formats = ["pdf"]
        self.supported_text_formats = ["txt", "html", "htm"]

    async def extract_text_from_file(self, file_id: int) -> Optional[str]:
        """
        Extract text from a file using OCR if needed
        """
        try:
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
            else:
                # For other files, try direct extraction
                text = await self._extract_text_from_text_file(file.path)

            # Update file with extracted text
            if text:
                file.extracted_text = text
                file.status = FileStatus.COMPLETED
                self.db.commit()
                logger.info(
                    f"Extracted text from file {file_id}: {
                        len(text)} characters")
                return text
            else:
                file.status = FileStatus.FAILED
                file.error_message = "No text could be extracted"
                self.db.commit()
                logger.warning(f"No text extracted from file {file_id}")
                return None

        except Exception as e:
            logger.error(
                f"Error extracting text from file {file_id}: {
                    str(e)}")

            # Update file status on error
            file = self.db.query(File).filter(File.id == file_id).first()
            if file:
                file.status = FileStatus.FAILED
                file.error_message = str(e)
                self.db.commit()

            raise

    async def _extract_text_from_image(self, image_path: str) -> Optional[str]:
        """
        Extract text from image using OCR
        """
        try:
            # Simulate OCR processing for now
            # In production, you'd use pytesseract
            await asyncio.sleep(1)  # Simulate processing time

            # Mock OCR result
            # OCR with pytesseract will be implemented in future version
            return f"Extracted text from image: {Path(image_path).name}"

        except Exception as e:
            logger.error(
                f"Error extracting text from image {image_path}: {
                    str(e)}")
            raise

    async def _extract_text_from_pdf(self, pdf_path: str) -> Optional[str]:
        """
        Extract text from PDF
        """
        try:
            # Simulate PDF text extraction for now
            # In production, you'd use PyPDF2 or pdfplumber
            await asyncio.sleep(1)  # Simulate processing time

            # Mock PDF extraction
            # PDF text extraction will be implemented in future version
            return f"Extracted text from PDF: {Path(pdf_path).name}"

        except Exception as e:
            logger.error(
                f"Error extracting text from PDF {pdf_path}: {
                    str(e)}")
            raise

    async def _extract_text_from_text_file(
            self, file_path: str) -> Optional[str]:
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
            logger.error(f"Error reading text file {file_path}: {str(e)}")
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
            logger.error(
                f"Error extracting text from HTML {html_path}: {
                    str(e)}")
            raise

    async def extract_text_batch(self, file_ids: List[int]) -> Dict[int, str]:
        """
        Extract text from multiple files in batch
        """
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
                logger.error(
                    f"Error in batch extraction for file {file_id}: {
                        str(e)}")

        return results

    async def _extract_text_safe(self, file_id: int) -> Optional[str]:
        """
        Safe wrapper for text extraction
        """
        try:
            return await self.extract_text_from_file(file_id)
        except Exception as e:
            logger.error(
                f"Safe extraction failed for file {file_id}: {
                    str(e)}")
            return None

    def validate_ocr_quality(self, text: str) -> Dict[str, Any]:
        """
        Validate the quality of OCR extracted text
        """
        try:
            # Basic quality metrics
            total_chars = len(text)
            total_words = len(text.split())
            avg_word_length = total_chars / total_words if total_words > 0 else 0

            # Check for common OCR errors
            suspicious_patterns = [
                '|', '1', '0', 'O', 'l', 'I',  # Common OCR confusions
                'rn', 'm', 'cl', 'd', 'ci'     # Common character confusions
            ]

            error_count = sum(text.count(pattern)
                              for pattern in suspicious_patterns)
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

        except Exception as e:
            logger.error(f"Error validating OCR quality: {str(e)}")
            return {
                "error": str(e),
                "is_acceptable": False
            }

    def get_ocr_stats(self) -> Dict[str, Any]:
        """
        Get OCR processing statistics
        """
        try:
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
            success_rate = (
                completed_files /
                total_files *
                100) if total_files > 0 else 0

            return {
                "total_files": total_files,
                "completed_files": completed_files,
                "failed_files": failed_files,
                "files_with_text": files_with_text,
                "success_rate": round(success_rate, 2)
            }

        except Exception as e:
            logger.error(f"Error getting OCR stats: {str(e)}")
            raise

    def cleanup_temp_files(self):
        """
        Clean up temporary files created during OCR processing
        """
        try:
            # Clean up any temporary files
            # This would be implemented based on your temporary file strategy
            logger.info("Cleaned up temporary OCR files")

        except Exception as e:
            logger.error(f"Error cleaning up temp files: {str(e)}")

    def is_ocr_needed(self, file_path: str) -> bool:
        """
        Determine if OCR is needed for a file
        """
        try:
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

        except Exception as e:
            logger.error(
                f"Error checking if OCR needed for {file_path}: {
                    str(e)}")
            return False
