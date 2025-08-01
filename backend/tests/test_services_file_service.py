"""
Unit tests for file service
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from sqlalchemy.orm import Session
from pathlib import Path
import tempfile
import os

from app.services.file_service import FileService
from app.models.file import File, FileStatus
from app.core.file_validation import FileValidator


class TestFileService:
    """Test cases for FileService"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def file_service(self, mock_db):
        """FileService instance with mocked dependencies"""
        with patch('app.services.file_service.FileValidator'), \
             patch('app.services.file_service.OCRService'), \
             patch('app.services.file_service.MultimediaService'):
            service = FileService(mock_db)
            return service
    
    @pytest.fixture
    def mock_file(self):
        """Mock file object"""
        file = Mock(spec=File)
        file.id = 1
        file.name = "test.pdf"
        file.path = "/path/to/test.pdf"
        file.mime_type = "application/pdf"
        file.status = FileStatus.COMPLETED
        file.size = 1024
        file.extracted_text = None
        file.metadata = {}
        return file
    
    def test_init(self, mock_db):
        """Test FileService initialization"""
        with patch('app.services.file_service.FileValidator'), \
             patch('app.services.file_service.OCRService'), \
             patch('app.services.file_service.MultimediaService'):
            service = FileService(mock_db)
            assert service.db == mock_db
            assert service.upload_dir == "uploads"
            assert service.max_file_size == 100 * 1024 * 1024  # 100MB
    
    def test_validate_file_path_valid(self, file_service):
        """Test valid file path validation"""
        with tempfile.NamedTemporaryFile() as temp_file:
            result = file_service._validate_file_path(temp_file.name)
            assert result is True
    
    def test_validate_file_path_invalid(self, file_service):
        """Test invalid file path validation"""
        result = file_service._validate_file_path("/nonexistent/path/file.txt")
        assert result is False
    
    def test_get_mime_type_by_extension(self, file_service):
        """Test MIME type detection by extension"""
        test_cases = [
            ("test.pdf", "application/pdf"),
            ("test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            ("test.jpg", "image/jpeg"),
            ("test.mp4", "video/mp4"),
            ("test.mp3", "audio/mpeg"),
            ("test.zip", "application/zip"),
            ("test.py", "text/x-python"),
            ("test.unknown", "application/octet-stream")
        ]
        
        for filename, expected_mime in test_cases:
            result = file_service._get_mime_type_by_extension(filename)
            assert result == expected_mime
    
    def test_extract_text_from_document_success(self, file_service):
        """Test successful text extraction from document"""
        with patch.object(file_service, '_extract_text_pdf') as mock_pdf:
            mock_pdf.return_value = "Extracted text"
            
            result = file_service._extract_text_from_document("test.pdf", "/path/to/test.pdf")
            assert result == "Extracted text"
            mock_pdf.assert_called_once_with("/path/to/test.pdf")
    
    def test_extract_text_from_document_unsupported(self, file_service):
        """Test text extraction from unsupported document type"""
        result = file_service._extract_text_from_document("test.unknown", "/path/to/test.unknown")
        assert result == ""
    
    def test_extract_text_from_image_success(self, file_service):
        """Test successful text extraction from image"""
        with patch.object(file_service.ocr_service, 'extract_text') as mock_ocr:
            mock_ocr.return_value = "Extracted text from image"
            
            result = file_service._extract_text_from_image("/path/to/test.jpg")
            assert result == "Extracted text from image"
            mock_ocr.assert_called_once_with("/path/to/test.jpg")
    
    def test_extract_text_from_image_failure(self, file_service):
        """Test failed text extraction from image"""
        with patch.object(file_service.ocr_service, 'extract_text') as mock_ocr:
            mock_ocr.side_effect = Exception("OCR failed")
            
            result = file_service._extract_text_from_image("/path/to/test.jpg")
            assert result == ""
    
    def test_process_file_metadata_success(self, file_service, mock_file):
        """Test successful file metadata processing"""
        with patch.object(file_service, '_extract_basic_metadata') as mock_basic, \
             patch.object(file_service, '_extract_specific_metadata') as mock_specific:
            mock_basic.return_value = {"size": 1024, "created": "2024-01-01"}
            mock_specific.return_value = {"pages": 1}
            
            result = file_service._process_file_metadata(mock_file)
            
            assert result["size"] == 1024
            assert result["pages"] == 1
            mock_basic.assert_called_once_with(mock_file)
            mock_specific.assert_called_once_with(mock_file)
    
    def test_extract_basic_metadata(self, file_service, mock_file):
        """Test basic metadata extraction"""
        with patch('os.path.getsize') as mock_size, \
             patch('os.path.getctime') as mock_ctime, \
             patch('os.path.getmtime') as mock_mtime:
            mock_size.return_value = 1024
            mock_ctime.return_value = 1704067200  # 2024-01-01
            mock_mtime.return_value = 1704067200
            
            result = file_service._extract_basic_metadata(mock_file)
            
            assert result["size"] == 1024
            assert "created" in result
            assert "modified" in result
    
    def test_extract_specific_metadata_document(self, file_service, mock_file):
        """Test specific metadata extraction for document"""
        mock_file.mime_type = "application/pdf"
        
        with patch.object(file_service, '_extract_document_metadata') as mock_doc:
            mock_doc.return_value = {"pages": 1, "title": "Test"}
            
            result = file_service._extract_specific_metadata(mock_file)
            
            assert result["pages"] == 1
            assert result["title"] == "Test"
            mock_doc.assert_called_once_with(mock_file)
    
    def test_extract_specific_metadata_image(self, file_service, mock_file):
        """Test specific metadata extraction for image"""
        mock_file.mime_type = "image/jpeg"
        
        with patch.object(file_service, '_extract_image_metadata') as mock_img:
            mock_img.return_value = {"width": 1920, "height": 1080}
            
            result = file_service._extract_specific_metadata(mock_file)
            
            assert result["width"] == 1920
            assert result["height"] == 1080
            mock_img.assert_called_once_with(mock_file)
    
    def test_extract_specific_metadata_video(self, file_service, mock_file):
        """Test specific metadata extraction for video"""
        mock_file.mime_type = "video/mp4"
        
        with patch.object(file_service, '_extract_video_metadata') as mock_video:
            mock_video.return_value = {"duration": 120, "fps": 30}
            
            result = file_service._extract_specific_metadata(mock_file)
            
            assert result["duration"] == 120
            assert result["fps"] == 30
            mock_video.assert_called_once_with(mock_file)
    
    def test_extract_specific_metadata_audio(self, file_service, mock_file):
        """Test specific metadata extraction for audio"""
        mock_file.mime_type = "audio/mpeg"
        
        with patch.object(file_service, '_extract_audio_metadata') as mock_audio:
            mock_audio.return_value = {"duration": 180, "sample_rate": 44100}
            
            result = file_service._extract_specific_metadata(mock_file)
            
            assert result["duration"] == 180
            assert result["sample_rate"] == 44100
            mock_audio.assert_called_once_with(mock_file)
    
    def test_get_file_by_id_success(self, file_service, mock_file):
        """Test successful file retrieval by ID"""
        file_service.db.query.return_value.filter.return_value.first.return_value = mock_file
        
        result = file_service.get_file_by_id(1)
        
        assert result == mock_file
        file_service.db.query.assert_called_once()
    
    def test_get_file_by_id_not_found(self, file_service):
        """Test file retrieval with non-existent ID"""
        file_service.db.query.return_value.filter.return_value.first.return_value = None
        
        result = file_service.get_file_by_id(999)
        
        assert result is None
    
    def test_get_files_with_filters(self, file_service, mock_file):
        """Test file retrieval with filters"""
        file_service.db.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = [mock_file]
        file_service.db.query.return_value.filter.return_value.count.return_value = 1
        
        files, total = file_service.get_files(
            mime_type="application/pdf",
            status=FileStatus.COMPLETED,
            skip=0,
            limit=10
        )
        
        assert len(files) == 1
        assert total == 1
        assert files[0] == mock_file
    
    def test_create_file_success(self, file_service):
        """Test successful file creation"""
        file_data = {
            "name": "test.pdf",
            "path": "/path/to/test.pdf",
            "mime_type": "application/pdf",
            "size": 1024
        }
        
        with patch.object(file_service, '_process_file_metadata') as mock_metadata:
            mock_metadata.return_value = {"pages": 1}
            
            result = file_service.create_file(**file_data)
            
            assert result.name == "test.pdf"
            assert result.mime_type == "application/pdf"
            assert result.status == FileStatus.COMPLETED
            file_service.db.add.assert_called_once_with(result)
            file_service.db.commit.assert_called_once()
    
    def test_update_file_success(self, file_service, mock_file):
        """Test successful file update"""
        file_service.db.query.return_value.filter.return_value.first.return_value = mock_file
        
        update_data = {"status": FileStatus.COMPLETED, "extracted_text": "New text"}
        
        result = file_service.update_file(1, **update_data)
        
        assert result == mock_file
        assert mock_file.status == FileStatus.COMPLETED
        assert mock_file.extracted_text == "New text"
        file_service.db.commit.assert_called_once()
    
    def test_update_file_not_found(self, file_service):
        """Test file update with non-existent file"""
        file_service.db.query.return_value.filter.return_value.first.return_value = None
        
        result = file_service.update_file(999, status=FileStatus.PROCESSED)
        
        assert result is None
    
    def test_delete_file_success(self, file_service, mock_file):
        """Test successful file deletion"""
        file_service.db.query.return_value.filter.return_value.first.return_value = mock_file
        
        with patch('os.remove') as mock_remove:
            result = file_service.delete_file(1)
            
            assert result is True
            mock_remove.assert_called_once_with(mock_file.path)
            file_service.db.delete.assert_called_once_with(mock_file)
            file_service.db.commit.assert_called_once()
    
    def test_delete_file_not_found(self, file_service):
        """Test file deletion with non-existent file"""
        file_service.db.query.return_value.filter.return_value.first.return_value = None
        
        result = file_service.delete_file(999)
        
        assert result is False
    
    def test_get_file_statistics(self, file_service):
        """Test file statistics retrieval"""
        file_service.db.query.return_value.count.return_value = 10
        file_service.db.query.return_value.filter.return_value.count.side_effect = [5, 3, 2]
        
        stats = file_service.get_file_statistics()
        
        assert stats["total_files"] == 10
        assert stats["by_type"]["document"] == 5
        assert stats["by_status"]["completed"] == 3
        assert stats["by_status"]["pending"] == 2
    
    def test_search_files(self, file_service, mock_file):
        """Test file search functionality"""
        file_service.db.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = [mock_file]
        file_service.db.query.return_value.filter.return_value.count.return_value = 1
        
        files, total = file_service.search_files("test", skip=0, limit=10)
        
        assert len(files) == 1
        assert total == 1
        assert files[0] == mock_file 