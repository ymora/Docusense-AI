"""
Unit tests for file utils module
"""

import pytest
from unittest.mock import Mock, patch, mock_open
import os
from pathlib import Path

from app.core.file_utils import FileInfoExtractor, DirectoryInfoExtractor, FilePathUtils
from app.core.file_validation import FileValidator


class TestFileValidator:
    """Test cases for FileValidator (replacing FileFormatManager)"""
    
    def test_is_format_supported(self):
        """Test format support checking"""
        assert FileValidator.is_format_supported("application/pdf") is True
        assert FileValidator.is_format_supported("image/jpeg") is True
        assert FileValidator.is_format_supported("video/mp4") is True
        assert FileValidator.is_format_supported("audio/mpeg") is True
        assert FileValidator.is_format_supported("application/unknown") is False
    
    def test_get_file_type(self):
        """Test getting file type"""
        assert FileValidator.get_file_type("application/pdf") == "document"
        assert FileValidator.get_file_type("image/jpeg") == "image"
        assert FileValidator.get_file_type("video/mp4") == "video"
        assert FileValidator.get_file_type("audio/mpeg") == "audio"
        assert FileValidator.get_file_type("application/unknown") == "default"
    
    def test_get_supported_formats_for_type(self):
        """Test getting supported formats for type"""
        document_formats = FileValidator.get_supported_formats_for_type("document")
        assert isinstance(document_formats, list)
        assert "application/pdf" in document_formats
        
        image_formats = FileValidator.get_supported_formats_for_type("image")
        assert "image/jpeg" in image_formats
        assert "image/png" in image_formats
    
    def test_get_all_supported_formats(self):
        """Test getting all supported formats"""
        formats = FileValidator.get_all_supported_formats()
        assert isinstance(formats, dict)
        assert "document" in formats
        assert "image" in formats
        assert "video" in formats
        assert "audio" in formats


class TestFileInfoExtractor:
    """Test cases for FileInfoExtractor"""
    
    @pytest.fixture
    def mock_file_path(self):
        """Mock file path"""
        return Path("/test/path/document.pdf")
    
    def test_extract_file_info_supported_format(self, mock_file_path):
        """Test extracting file info for supported format"""
        with patch('pathlib.Path.exists') as mock_exists, \
             patch('pathlib.Path.stat') as mock_stat, \
             patch('mimetypes.guess_type') as mock_guess_type:
            
            mock_exists.return_value = True
            mock_stat.return_value = Mock(st_size=1024, st_ctime=1640995200.0, st_mtime=1640995200.0)
            mock_guess_type.return_value = ("application/pdf", None)
            
            info = FileInfoExtractor.extract_file_info(mock_file_path)
            
            assert info is not None
            assert info["name"] == "document.pdf"
            assert info["extension"] == "pdf"
            assert info["size"] == 1024
            assert info["mime_type"] == "application/pdf"
            assert info["format_category"] == "document"
    
    def test_extract_file_info_unsupported_format(self, mock_file_path):
        """Test extracting file info for unsupported format"""
        unsupported_path = Path("/test/path/document.xyz")
        
        with patch('pathlib.Path.exists') as mock_exists, \
             patch('pathlib.Path.stat') as mock_stat, \
             patch('mimetypes.guess_type') as mock_guess_type:
            
            mock_exists.return_value = True
            mock_stat.return_value = Mock(st_size=1024, st_ctime=1640995200.0, st_mtime=1640995200.0)
            mock_guess_type.return_value = ("application/octet-stream", None)
            
            info = FileInfoExtractor.extract_file_info(unsupported_path)
            
            assert info is not None
            assert info["name"] == "document.xyz"
            assert info["extension"] == "xyz"
            assert info["size"] == 1024
            assert info["mime_type"] == "application/octet-stream"
            assert info["format_category"] is None
    
    def test_extract_file_info_file_not_found(self, mock_file_path):
        """Test extracting file info for non-existent file"""
        with patch('pathlib.Path.exists') as mock_exists:
            mock_exists.return_value = False
            
            info = FileInfoExtractor.extract_file_info(mock_file_path)
            
            assert info is None
    
    def test_extract_unsupported_file_info(self, mock_file_path):
        """Test extracting unsupported file info"""
        with patch('pathlib.Path.exists') as mock_exists, \
             patch('pathlib.Path.stat') as mock_stat:
            
            mock_exists.return_value = True
            mock_stat.return_value = Mock(st_size=1024)
            
            info = FileInfoExtractor.extract_unsupported_file_info(mock_file_path)
            
            assert info is not None
            assert info["name"] == "document.pdf"
            assert info["extension"] == "pdf"
            assert info["size"] == 1024
            assert info["mime_type"] == "unknown"
            assert info["format_category"] is None
            assert info["is_supported"] is False
    
    def test_get_browser_optimized_mime_type(self):
        """Test getting browser optimized MIME type"""
        # Test image optimization
        optimized = FileInfoExtractor.get_browser_optimized_mime_type("image/jpeg", "jpg")
        assert optimized == "image/jpeg"
        
        # Test video optimization
        optimized = FileInfoExtractor.get_browser_optimized_mime_type("video/mp4", "mp4")
        assert optimized == "video/mp4"
        
        # Test unknown type
        optimized = FileInfoExtractor.get_browser_optimized_mime_type("application/unknown", "xyz")
        assert optimized == "application/octet-stream"


class TestDirectoryInfoExtractor:
    """Test cases for DirectoryInfoExtractor"""
    
    @pytest.fixture
    def mock_dir_path(self):
        """Mock directory path"""
        return Path("/test/directory")
    
    def test_extract_directory_info(self, mock_dir_path):
        """Test extracting directory info"""
        with patch('pathlib.Path.exists') as mock_exists, \
             patch('pathlib.Path.is_dir') as mock_is_dir, \
             patch('pathlib.Path.iterdir') as mock_iterdir:
            
            mock_exists.return_value = True
            mock_is_dir.return_value = True
            mock_iterdir.return_value = [
                Mock(is_file=lambda: True, name="file1.txt"),
                Mock(is_file=lambda: True, name="file2.pdf"),
                Mock(is_file=lambda: False, name="subdir")
            ]
            
            info = DirectoryInfoExtractor.extract_directory_info(mock_dir_path)
            
            assert info is not None
            assert info["name"] == "directory"
            assert info["path"] == "/test/directory"
            assert info["file_count"] == 2
            assert info["subdirectory_count"] == 1
    
    def test_extract_directory_info_not_found(self, mock_dir_path):
        """Test extracting directory info for non-existent directory"""
        with patch('pathlib.Path.exists') as mock_exists:
            mock_exists.return_value = False
            
            info = DirectoryInfoExtractor.extract_directory_info(mock_dir_path)
            
            assert info is None
    
    def test_extract_directory_info_not_directory(self, mock_dir_path):
        """Test extracting directory info for file"""
        with patch('pathlib.Path.exists') as mock_exists, \
             patch('pathlib.Path.is_dir') as mock_is_dir:
            
            mock_exists.return_value = True
            mock_is_dir.return_value = False
            
            info = DirectoryInfoExtractor.extract_directory_info(mock_dir_path)
            
            assert info is None


class TestFilePathUtils:
    """Test cases for FilePathUtils"""
    
    def test_normalize_path(self):
        """Test path normalization"""
        normalized = FilePathUtils.normalize_path("/test/path/../file.txt")
        assert str(normalized) == str(Path("/test/file.txt").resolve())
    
    def test_is_subdirectory(self):
        """Test subdirectory checking"""
        parent = Path("/test/parent")
        child = Path("/test/parent/child/file.txt")
        
        assert FilePathUtils.is_subdirectory(parent, child) is True
        
        sibling = Path("/test/sibling/file.txt")
        assert FilePathUtils.is_subdirectory(parent, sibling) is False
    
    def test_get_relative_path(self):
        """Test relative path generation"""
        base = Path("/test/base")
        target = Path("/test/base/subdir/file.txt")
        
        relative = FilePathUtils.get_relative_path(base, target)
        assert relative == "subdir/file.txt" 