"""
Unit tests for format optimizer service module
"""

import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.services.format_optimizer_service import FormatOptimizerService
from app.models.file import File


class TestFormatOptimizerService:
    """Test cases for FormatOptimizerService"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def format_optimizer(self, mock_db):
        """FormatOptimizerService instance with mocked dependencies"""
        return FormatOptimizerService(mock_db)
    
    def test_init(self, format_optimizer, mock_db):
        """Test FormatOptimizerService initialization"""
        assert format_optimizer.db == mock_db
    
    def test_optimize_file_format_success(self, format_optimizer, mock_db):
        """Test optimizing file format successfully"""
        mock_file = Mock(spec=File)
        mock_file.id = 1
        mock_file.mime_type = "application/pdf"
        mock_file.path = "/test/file.pdf"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file
        
        with patch.object(format_optimizer, '_optimize_pdf') as mock_optimize:
            mock_optimize.return_value = True
            result = format_optimizer.optimize_file_format(1)
            
            assert result is True
            mock_optimize.assert_called_once_with(mock_file)
    
    def test_optimize_file_format_file_not_found(self, format_optimizer, mock_db):
        """Test optimizing file format when file doesn't exist"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = format_optimizer.optimize_file_format(999)
        
        assert result is False
    
    def test_optimize_file_format_unsupported_type(self, format_optimizer, mock_db):
        """Test optimizing file format with unsupported type"""
        mock_file = Mock(spec=File)
        mock_file.id = 1
        mock_file.mime_type = "application/unknown"
        mock_file.path = "/test/file.xyz"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file
        
        result = format_optimizer.optimize_file_format(1)
        
        assert result is False
    
    def test_optimize_pdf_success(self, format_optimizer):
        """Test PDF optimization successfully"""
        mock_file = Mock(spec=File)
        mock_file.path = "/test/file.pdf"
        
        with patch('os.path.exists') as mock_exists, \
             patch('builtins.open', mock_open()), \
             patch('PyPDF2.PdfReader') as mock_pdf_reader, \
             patch('PyPDF2.PdfWriter') as mock_pdf_writer:
            
            mock_exists.return_value = True
            mock_pdf_reader.return_value.pages = [Mock(), Mock()]
            
            result = format_optimizer._optimize_pdf(mock_file)
            
            assert result is True
    
    def test_optimize_pdf_file_not_found(self, format_optimizer):
        """Test PDF optimization when file doesn't exist"""
        mock_file = Mock(spec=File)
        mock_file.path = "/test/file.pdf"
        
        with patch('os.path.exists') as mock_exists:
            mock_exists.return_value = False
            
            result = format_optimizer._optimize_pdf(mock_file)
            
            assert result is False
    
    def test_optimize_image_success(self, format_optimizer):
        """Test image optimization successfully"""
        mock_file = Mock(spec=File)
        mock_file.path = "/test/image.jpg"
        
        with patch('os.path.exists') as mock_exists, \
             patch('PIL.Image.open') as mock_pil_open:
            
            mock_exists.return_value = True
            mock_image = Mock()
            mock_pil_open.return_value = mock_image
            
            result = format_optimizer._optimize_image(mock_file)
            
            assert result is True
            mock_image.save.assert_called_once()
    
    def test_optimize_image_file_not_found(self, format_optimizer):
        """Test image optimization when file doesn't exist"""
        mock_file = Mock(spec=File)
        mock_file.path = "/test/image.jpg"
        
        with patch('os.path.exists') as mock_exists:
            mock_exists.return_value = False
            
            result = format_optimizer._optimize_image(mock_file)
            
            assert result is False
    
    def test_optimize_video_success(self, format_optimizer):
        """Test video optimization successfully"""
        mock_file = Mock(spec=File)
        mock_file.path = "/test/video.mp4"
        
        with patch('os.path.exists') as mock_exists, \
             patch('subprocess.run') as mock_subprocess:
            
            mock_exists.return_value = True
            mock_subprocess.return_value.returncode = 0
            
            result = format_optimizer._optimize_video(mock_file)
            
            assert result is True
            mock_subprocess.assert_called_once()
    
    def test_optimize_video_file_not_found(self, format_optimizer):
        """Test video optimization when file doesn't exist"""
        mock_file = Mock(spec=File)
        mock_file.path = "/test/video.mp4"
        
        with patch('os.path.exists') as mock_exists:
            mock_exists.return_value = False
            
            result = format_optimizer._optimize_video(mock_file)
            
            assert result is False
    
    def test_optimize_audio_success(self, format_optimizer):
        """Test audio optimization successfully"""
        mock_file = Mock(spec=File)
        mock_file.path = "/test/audio.mp3"
        
        with patch('os.path.exists') as mock_exists, \
             patch('subprocess.run') as mock_subprocess:
            
            mock_exists.return_value = True
            mock_subprocess.return_value.returncode = 0
            
            result = format_optimizer._optimize_audio(mock_file)
            
            assert result is True
            mock_subprocess.assert_called_once()
    
    def test_optimize_audio_file_not_found(self, format_optimizer):
        """Test audio optimization when file doesn't exist"""
        mock_file = Mock(spec=File)
        mock_file.path = "/test/audio.mp3"
        
        with patch('os.path.exists') as mock_exists:
            mock_exists.return_value = False
            
            result = format_optimizer._optimize_audio(mock_file)
            
            assert result is False
    
    def test_get_optimization_stats(self, format_optimizer):
        """Test getting optimization statistics"""
        stats = format_optimizer.get_optimization_stats()
        
        assert isinstance(stats, dict)
        assert "total_optimized" in stats
        assert "by_format" in stats
        assert "success_rate" in stats
    
    def test_clear_optimization_cache(self, format_optimizer):
        """Test clearing optimization cache"""
        format_optimizer.optimization_cache = {"test": "value"}
        format_optimizer.clear_optimization_cache()
        
        assert len(format_optimizer.optimization_cache) == 0 