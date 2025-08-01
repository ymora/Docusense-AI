"""
Unit tests for files API
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.files import router
from app.models.file import File, FileStatus
from app.models.analysis import Analysis, AnalysisStatus


class TestFilesAPI:
    """Test cases for files API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Test client"""
        from fastapi import FastAPI
        app = FastAPI()
        app.include_router(router)
        return TestClient(app)
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
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
        file.extracted_text = "Test content"
        file.metadata = {"pages": 1}
        file.created_at = "2024-01-01T00:00:00"
        file.updated_at = "2024-01-01T00:00:00"
        return file
    
    @pytest.fixture
    def mock_analysis(self):
        """Mock analysis object"""
        analysis = Mock(spec=Analysis)
        analysis.id = 1
        analysis.file_id = 1
        analysis.analysis_type = "SUMMARY"
        analysis.status = AnalysisStatus.COMPLETED
        analysis.result = "Test analysis result"
        return analysis
    
    @patch('app.api.files.get_db')
    def test_get_files_success(self, mock_get_db, client, mock_db, mock_file):
        """Test successful file listing"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = [mock_file]
        mock_db.query.return_value.filter.return_value.count.return_value = 1
        
        response = client.get("/files/")
        
        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        assert "total" in data
        assert len(data["files"]) == 1
    
    @patch('app.api.files.get_db')
    def test_get_files_with_filters(self, mock_get_db, client, mock_db, mock_file):
        """Test file listing with filters"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = [mock_file]
        mock_db.query.return_value.filter.return_value.count.return_value = 1
        
        response = client.get("/files/?mime_type=application/pdf&status=completed")
        
        assert response.status_code == 200
    
    @patch('app.api.files.get_db')
    def test_get_file_by_id_success(self, mock_get_db, client, mock_db, mock_file):
        """Test successful file retrieval by ID"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file
        
        response = client.get("/files/1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["name"] == "test.pdf"
    
    @patch('app.api.files.get_db')
    def test_get_file_by_id_not_found(self, mock_get_db, client, mock_db):
        """Test file retrieval with non-existent ID"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.get("/files/999")
        
        assert response.status_code == 404
    
    @patch('app.api.files.get_db')
    def test_get_file_content_success(self, mock_get_db, client, mock_db, mock_file):
        """Test successful file content retrieval"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file
        
        response = client.get("/files/1/content")
        
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        assert "metadata" in data
    
    @patch('app.api.files.get_db')
    def test_get_file_content_not_found(self, mock_get_db, client, mock_db):
        """Test file content retrieval with non-existent file"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.get("/files/999/content")
        
        assert response.status_code == 404
    
    @patch('app.api.files.get_db')
    def test_get_file_analyses_success(self, mock_get_db, client, mock_db, mock_file, mock_analysis):
        """Test successful file analyses retrieval"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_analysis]
        
        response = client.get("/files/1/analyses")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == 1
    
    @patch('app.api.files.get_db')
    def test_get_file_analyses_file_not_found(self, mock_get_db, client, mock_db):
        """Test file analyses retrieval with non-existent file"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.get("/files/999/analyses")
        
        assert response.status_code == 404
    
    @patch('app.api.files.get_db')
    def test_delete_file_success(self, mock_get_db, client, mock_db, mock_file):
        """Test successful file deletion"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file
        
        response = client.delete("/files/1")
        
        assert response.status_code == 200
        mock_db.delete.assert_called_once_with(mock_file)
        mock_db.commit.assert_called_once()
    
    @patch('app.api.files.get_db')
    def test_delete_file_not_found(self, mock_get_db, client, mock_db):
        """Test file deletion with non-existent file"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.delete("/files/999")
        
        assert response.status_code == 404
    
    @patch('app.api.files.get_db')
    def test_get_file_statistics_success(self, mock_get_db, client, mock_db):
        """Test successful file statistics retrieval"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.count.return_value = 10
        mock_db.query.return_value.filter.return_value.count.side_effect = [5, 3, 2]
        
        response = client.get("/files/statistics")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_files" in data
        assert "by_type" in data
        assert "by_status" in data
    
    @patch('app.api.files.get_db')
    def test_search_files_success(self, mock_get_db, client, mock_db, mock_file):
        """Test successful file search"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = [mock_file]
        mock_db.query.return_value.filter.return_value.count.return_value = 1
        
        response = client.get("/files/search?query=test")
        
        assert response.status_code == 200
        data = response.json()
        assert "files" in data
        assert "total" in data
    
    @patch('app.api.files.get_db')
    def test_get_file_metadata_success(self, mock_get_db, client, mock_db, mock_file):
        """Test successful file metadata retrieval"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file
        
        response = client.get("/files/1/metadata")
        
        assert response.status_code == 200
        data = response.json()
        assert "metadata" in data
        assert "system_metadata" in data
    
    @patch('app.api.files.get_db')
    def test_get_file_metadata_not_found(self, mock_get_db, client, mock_db):
        """Test file metadata retrieval with non-existent file"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.get("/files/999/metadata")
        
        assert response.status_code == 404 