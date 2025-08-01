"""
Unit tests for analysis API
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.analysis import router
from app.models.analysis import Analysis, AnalysisStatus, AnalysisType
from app.models.file import File, FileStatus


class TestAnalysisAPI:
    """Test cases for analysis API endpoints"""
    
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
    def mock_analysis(self):
        """Mock analysis object"""
        analysis = Mock(spec=Analysis)
        analysis.id = 1
        analysis.file_id = 1
        analysis.analysis_type = AnalysisType.SUMMARY
        analysis.status = AnalysisStatus.COMPLETED
        analysis.provider = "openai"
        analysis.model = "gpt-4"
        analysis.result = "Test analysis result"
        analysis.created_at = "2024-01-01T00:00:00"
        analysis.updated_at = "2024-01-01T00:00:00"
        return analysis
    
    @pytest.fixture
    def mock_file(self):
        """Mock file object"""
        file = Mock(spec=File)
        file.id = 1
        file.name = "test.pdf"
        file.status = FileStatus.PROCESSED
        return file
    
    @patch('app.api.analysis.get_db')
    def test_get_analyses_success(self, mock_get_db, client, mock_db, mock_analysis):
        """Test successful analysis listing"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = [mock_analysis]
        mock_db.query.return_value.filter.return_value.count.return_value = 1
        
        response = client.get("/analyses/")
        
        assert response.status_code == 200
        data = response.json()
        assert "analyses" in data
        assert "total" in data
        assert len(data["analyses"]) == 1
    
    @patch('app.api.analysis.get_db')
    def test_get_analyses_with_filters(self, mock_get_db, client, mock_db, mock_analysis):
        """Test analysis listing with filters"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.offset.return_value.limit.return_value.all.return_value = [mock_analysis]
        mock_db.query.return_value.filter.return_value.count.return_value = 1
        
        response = client.get("/analyses/?status=completed&analysis_type=summary")
        
        assert response.status_code == 200
    
    @patch('app.api.analysis.get_db')
    def test_get_analysis_by_id_success(self, mock_get_db, client, mock_db, mock_analysis):
        """Test successful analysis retrieval by ID"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = mock_analysis
        
        response = client.get("/analyses/1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["analysis_type"] == "SUMMARY"
    
    @patch('app.api.analysis.get_db')
    def test_get_analysis_by_id_not_found(self, mock_get_db, client, mock_db):
        """Test analysis retrieval with non-existent ID"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.get("/analyses/999")
        
        assert response.status_code == 404
    
    @patch('app.api.analysis.get_db')
    def test_create_analysis_success(self, mock_get_db, client, mock_db, mock_file, mock_analysis):
        """Test successful analysis creation"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file
        
        analysis_data = {
            "file_id": 1,
            "analysis_type": "SUMMARY",
            "provider": "openai",
            "model": "gpt-4"
        }
        
        response = client.post("/analyses/", json=analysis_data)
        
        assert response.status_code == 201
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @patch('app.api.analysis.get_db')
    def test_create_analysis_file_not_found(self, mock_get_db, client, mock_db):
        """Test analysis creation with non-existent file"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        analysis_data = {
            "file_id": 999,
            "analysis_type": "SUMMARY",
            "provider": "openai",
            "model": "gpt-4"
        }
        
        response = client.post("/analyses/", json=analysis_data)
        
        assert response.status_code == 404
    
    @patch('app.api.analysis.get_db')
    def test_create_analysis_invalid_data(self, mock_get_db, client, mock_db):
        """Test analysis creation with invalid data"""
        mock_get_db.return_value = mock_db
        
        analysis_data = {
            "file_id": 1,
            # Missing required fields
        }
        
        response = client.post("/analyses/", json=analysis_data)
        
        assert response.status_code == 422
    
    @patch('app.api.analysis.get_db')
    def test_delete_analysis_success(self, mock_get_db, client, mock_db, mock_analysis):
        """Test successful analysis deletion"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = mock_analysis
        
        response = client.delete("/analyses/1")
        
        assert response.status_code == 200
        mock_db.delete.assert_called_once_with(mock_analysis)
        mock_db.commit.assert_called_once()
    
    @patch('app.api.analysis.get_db')
    def test_delete_analysis_not_found(self, mock_get_db, client, mock_db):
        """Test analysis deletion with non-existent analysis"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.delete("/analyses/999")
        
        assert response.status_code == 404
    
    @patch('app.api.analysis.get_db')
    def test_get_analysis_statistics_success(self, mock_get_db, client, mock_db):
        """Test successful analysis statistics retrieval"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.count.return_value = 10
        mock_db.query.return_value.filter.return_value.count.side_effect = [5, 3, 2]
        
        response = client.get("/analyses/statistics")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_analyses" in data
        assert "by_status" in data
        assert "by_type" in data
    
    @patch('app.api.analysis.get_db')
    def test_retry_analysis_success(self, mock_get_db, client, mock_db, mock_analysis):
        """Test successful analysis retry"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = mock_analysis
        
        response = client.post("/analyses/1/retry")
        
        assert response.status_code == 200
        assert mock_analysis.status == AnalysisStatus.PENDING
        mock_db.commit.assert_called_once()
    
    @patch('app.api.analysis.get_db')
    def test_retry_analysis_not_found(self, mock_get_db, client, mock_db):
        """Test analysis retry with non-existent analysis"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        response = client.post("/analyses/999/retry")
        
        assert response.status_code == 404
    
    @patch('app.api.analysis.get_db')
    def test_get_analysis_providers_success(self, mock_get_db, client, mock_db):
        """Test successful analysis providers retrieval"""
        mock_get_db.return_value = mock_db
        
        response = client.get("/analyses/providers")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @patch('app.api.analysis.get_db')
    def test_get_analysis_models_success(self, mock_get_db, client, mock_db):
        """Test successful analysis models retrieval"""
        mock_get_db.return_value = mock_db
        
        response = client.get("/analyses/models?provider=openai")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @patch('app.api.analysis.get_db')
    def test_bulk_create_analyses_success(self, mock_get_db, client, mock_db, mock_file):
        """Test successful bulk analysis creation"""
        mock_get_db.return_value = mock_db
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file
        
        bulk_data = {
            "file_ids": [1, 2, 3],
            "analysis_type": "SUMMARY",
            "provider": "openai",
            "model": "gpt-4"
        }
        
        response = client.post("/analyses/bulk", json=bulk_data)
        
        assert response.status_code == 201
        data = response.json()
        assert "created_count" in data
        assert "failed_count" in data
    
    @patch('app.api.analysis.get_db')
    def test_bulk_create_analyses_invalid_data(self, mock_get_db, client, mock_db):
        """Test bulk analysis creation with invalid data"""
        mock_get_db.return_value = mock_db
        
        bulk_data = {
            "file_ids": [],
            # Missing required fields
        }
        
        response = client.post("/analyses/bulk", json=bulk_data)
        
        assert response.status_code == 422 