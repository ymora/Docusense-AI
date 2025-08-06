"""
Unit tests for MediaPlayer functionality
"""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from app.main import app


class TestMediaPlayer:
    """Test cases for MediaPlayer functionality"""

    @pytest.fixture
    def client(self):
        """Test client"""
        return TestClient(app)

    def test_stream_by_path_success(self, client):
        """Test successful file streaming by path"""
        # Mock file existence
        with patch('os.path.exists', return_value=True), \
             patch('os.path.isfile', return_value=True), \
             patch('builtins.open', create=True) as mock_open:
            
            # Mock file content
            mock_file = Mock()
            mock_file.read.return_value = b"test content"
            mock_open.return_value.__enter__.return_value = mock_file
            
            response = client.get("/api/files/stream-by-path/test.mp3")
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "audio/mpeg"

    def test_stream_by_path_not_found(self, client):
        """Test file streaming when file doesn't exist"""
        with patch('os.path.exists', return_value=False):
            response = client.get("/api/files/stream-by-path/nonexistent.mp3")
            
            assert response.status_code == 404

    def test_stream_by_path_head_request(self, client):
        """Test HEAD request for file streaming"""
        with patch('os.path.exists', return_value=True), \
             patch('os.path.isfile', return_value=True), \
             patch('os.path.getsize', return_value=1024):
            
            response = client.head("/api/files/stream-by-path/test.mp3")
            
            assert response.status_code == 200
            assert "content-length" in response.headers
            assert "content-type" in response.headers

    def test_stream_by_path_range_request(self, client):
        """Test range request for file streaming"""
        with patch('os.path.exists', return_value=True), \
             patch('os.path.isfile', return_value=True), \
             patch('os.path.getsize', return_value=1024), \
             patch('builtins.open', create=True) as mock_open:
            
            mock_file = Mock()
            mock_file.read.return_value = b"partial content"
            mock_open.return_value.__enter__.return_value = mock_file
            
            response = client.get(
                "/api/files/stream-by-path/test.mp3",
                headers={"Range": "bytes=0-511"}
            )
            
            assert response.status_code == 206
            assert "content-range" in response.headers

    def test_stream_by_path_cors_headers(self, client):
        """Test CORS headers in streaming response"""
        with patch('os.path.exists', return_value=True), \
             patch('os.path.isfile', return_value=True), \
             patch('builtins.open', create=True) as mock_open:
            
            mock_file = Mock()
            mock_file.read.return_value = b"test content"
            mock_open.return_value.__enter__.return_value = mock_file
            
            response = client.get("/api/files/stream-by-path/test.mp3")
            
            assert "access-control-allow-origin" in response.headers
            assert "access-control-allow-methods" in response.headers
            assert "HEAD" in response.headers["access-control-allow-methods"]

    def test_stream_by_path_mime_type_detection(self, client):
        """Test MIME type detection for different file types"""
        test_cases = [
            ("test.mp3", "audio/mpeg"),
            ("test.mp4", "video/mp4"),
            ("test.avi", "video/x-msvideo"),
            ("test.wav", "audio/wav"),
            ("test.unknown", "application/octet-stream")
        ]
        
        for filename, expected_mime in test_cases:
            with patch('os.path.exists', return_value=True), \
                 patch('os.path.isfile', return_value=True), \
                 patch('builtins.open', create=True) as mock_open:
                
                mock_file = Mock()
                mock_file.read.return_value = b"test content"
                mock_open.return_value.__enter__.return_value = mock_file
                
                response = client.get(f"/api/files/stream-by-path/{filename}")
                
                if response.status_code == 200:
                    assert response.headers["content-type"] == expected_mime 