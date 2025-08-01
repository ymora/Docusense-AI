"""
Unit tests for file utils module
"""

import pytest
from unittest.mock import Mock, patch, mock_open
import os
from pathlib import Path

from app.core.file_utils import FileFormatManager, FileInfoExtractor, DirectoryInfoExtractor, FilePathUtils


class TestFileFormatManager:
    """Test cases for FileFormatManager"""
    
    def test_is_format_supported(self):
        """Test format support checking"""
        assert FileFormatManager.is_format_supported("pdf") is True
        assert FileFormatManager.is_format_supported(".pdf") is True
        assert FileFormatManager.is_format_supported("PDF") is True
        assert FileFormatManager.is_format_supported("xyz") is False
        assert FileFormatManager.is_format_supported("") is False
    
    def test_get_format_category(self):
        """Test getting format category"""
        assert FileFormatManager.get_format_category("pdf") == "documents"
        assert FileFormatManager.get_format_category("jpg") == "images"
        assert FileFormatManager.get_format_category("mp4") == "videos"
        assert FileFormatManager.get_format_category("mp3") == "audio"
        assert FileFormatManager.get_format_category("xyz") is None
    
    def test_get_supported_formats(self):
        """Test getting supported formats"""
        formats = FileFormatManager.get_supported_formats()
        assert isinstance(formats, list)
        assert len(formats) > 0
        assert "pdf" in formats
        assert "jpg" in formats
        assert "mp4" in formats
    
    def test_get_formats_by_category(self):
        """Test getting formats by category"""
        document_formats = FileFormatManager.get_formats_by_category("documents")
        assert isinstance(document_formats, list)
        assert "pdf" in document_formats
        assert "docx" in document_formats
        
        image_formats = FileFormatManager.get_formats_by_category("images")
        assert "jpg" in image_formats
        assert "png" in image_formats
    
    def test_get_formats_by_category_invalid(self):
        """Test getting formats by invalid category"""
        formats = FileFormatManager.get_formats_by_category("invalid_category")
        assert formats == []


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
            assert info["category"] == "documents"
    
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
            assert info["category"] is None
    
    def test_extract_file_info_file_not_found(self, mock_file_path):
        """Test extracting file info for non-existent file"""
        with patch('pathlib.Path.exists') as mock_exists:
            mock_exists.return_value = False
            
            info = FileInfoExtractor.extract_file_info(mock_file_path)
            assert info is None
    
    def test_extract_unsupported_file_info(self, mock_file_path):
        """Test extracting unsupported file info"""
        unsupported_path = Path("/test/path/document.xyz")
        
        with patch('pathlib.Path.exists') as mock_exists, \
             patch('pathlib.Path.stat') as mock_stat, \
             patch('mimetypes.guess_type') as mock_guess_type:
            
            mock_exists.return_value = True
            mock_stat.return_value = Mock(st_size=1024, st_ctime=1640995200.0, st_mtime=1640995200.0)
            mock_guess_type.return_value = ("application/octet-stream", None)
            
            info = FileInfoExtractor.extract_unsupported_file_info(unsupported_path)
            
            assert info is not None
            assert info["name"] == "document.xyz"
            assert info["extension"] == "xyz"
            assert info["mime_type"] == "application/octet-stream"
    
    def test_get_browser_optimized_mime_type(self):
        """Test getting browser optimized MIME type"""
        # Test PDF optimization
        optimized = FileInfoExtractor.get_browser_optimized_mime_type("application/pdf", "pdf")
        assert optimized == "application/pdf"
        
        # Test image optimization
        optimized = FileInfoExtractor.get_browser_optimized_mime_type("image/jpeg", "jpg")
        assert optimized == "image/jpeg"
        
        # Test video optimization
        optimized = FileInfoExtractor.get_browser_optimized_mime_type("video/mp4", "mp4")
        assert optimized == "video/mp4"


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
            
            # Mock directory contents
            mock_files = [
                Mock(name="file1.pdf", is_file=lambda: True, is_dir=lambda: False),
                Mock(name="file2.jpg", is_file=lambda: True, is_dir=lambda: False),
                Mock(name="subdir", is_file=lambda: False, is_dir=lambda: True)
            ]
            mock_iterdir.return_value = mock_files
            
            info = DirectoryInfoExtractor.extract_directory_info(mock_dir_path)
            
            assert info is not None
            assert info["name"] == "directory"
            assert info["type"] == "directory"
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
        normalized = FilePathUtils.normalize_path("/test/path")
        assert isinstance(normalized, Path)
        assert str(normalized) == "/test/path"
        
        normalized = FilePathUtils.normalize_path("test\\path")
        assert isinstance(normalized, Path)
    
    def test_is_subdirectory(self):
        """Test subdirectory checking"""
        parent = Path("/parent")
        child = Path("/parent/child")
        not_child = Path("/other/child")
        
        assert FilePathUtils.is_subdirectory(parent, child) is True
        assert FilePathUtils.is_subdirectory(parent, not_child) is False
        assert FilePathUtils.is_subdirectory(parent, parent) is False
    
    def test_get_relative_path(self):
        """Test getting relative path"""
        base = Path("/base/path")
        target = Path("/base/path/subfolder/file.txt")
        
        relative = FilePathUtils.get_relative_path(base, target)
        assert relative == "subfolder/file.txt"
        
        # Same directory
        target = Path("/base/path/file.txt")
        relative = FilePathUtils.get_relative_path(base, target)
        assert relative == "file.txt" 