"""
Unit tests for Queue service
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
from sqlalchemy.orm import Session

from app.services.queue_service import QueueService
from app.models.queue import QueueItem, QueueStatus, QueuePriority
from app.models.analysis import Analysis, AnalysisStatus
from app.models.file import File, FileStatus


class TestQueueService:
    """Test cases for QueueService"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def queue_service(self, mock_db):
        """QueueService instance with mocked dependencies"""
        with patch('app.services.queue_service.AIService'), \
             patch('app.services.queue_service.FileService'):
            service = QueueService(mock_db)
            return service
    
    @pytest.fixture
    def mock_analysis(self):
        """Mock analysis object"""
        analysis = Mock(spec=Analysis)
        analysis.id = 1
        analysis.file_id = 1
        analysis.analysis_type = "SUMMARY"
        analysis.provider = "openai"
        analysis.model = "gpt-4"
        analysis.status = AnalysisStatus.PENDING
        return analysis
    
    @pytest.fixture
    def mock_file(self):
        """Mock file object"""
        file = Mock(spec=File)
        file.id = 1
        file.name = "test.pdf"
        file.extracted_text = None
        file.status = FileStatus.PENDING
        return file
    
    @pytest.fixture
    def mock_queue_item(self):
        """Mock queue item"""
        item = Mock(spec=QueueItem)
        item.id = 1
        item.analysis_id = 1
        item.priority = QueuePriority.NORMAL
        item.status = QueueStatus.PENDING
        item.progress = 0.0
        item.current_step = "Pending"
        return item
    
    def test_init(self, mock_db):
        """Test QueueService initialization"""
        with patch('app.services.queue_service.AIService'), \
             patch('app.services.queue_service.FileService'):
            service = QueueService(mock_db)
            assert service.db == mock_db
            assert service.max_concurrent == 3
            assert service.is_processing is False
            assert isinstance(service.current_tasks, list)
    
    def test_validate_analysis_exists_success(self, queue_service, mock_analysis):
        """Test successful analysis validation"""
        queue_service.db.query.return_value.filter.return_value.first.return_value = mock_analysis
        
        # Should not raise exception
        queue_service._validate_analysis_exists(1)
    
    def test_validate_analysis_exists_failure(self, queue_service):
        """Test failed analysis validation"""
        queue_service.db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Analysis 1 not found"):
            queue_service._validate_analysis_exists(1)
    
    def test_check_duplicate_queue_item_success(self, queue_service):
        """Test successful duplicate check"""
        queue_service.db.query.return_value.filter.return_value.first.return_value = None
        
        # Should not raise exception
        queue_service._check_duplicate_queue_item(1)
    
    def test_check_duplicate_queue_item_failure(self, queue_service, mock_queue_item):
        """Test failed duplicate check"""
        queue_service.db.query.return_value.filter.return_value.first.return_value = mock_queue_item
        
        with pytest.raises(ValueError, match="Analysis 1 already in queue"):
            queue_service._check_duplicate_queue_item(1)
    
    def test_create_queue_item(self, queue_service):
        """Test queue item creation"""
        item = queue_service._create_queue_item(1, QueuePriority.HIGH)
        
        assert item.analysis_id == 1
        assert item.priority == QueuePriority.HIGH
        assert item.status == QueueStatus.PENDING
        assert item.total_steps == 3
    
    def test_save_queue_item(self, queue_service, mock_queue_item):
        """Test queue item saving"""
        queue_service._save_queue_item(mock_queue_item)
        
        queue_service.db.add.assert_called_once_with(mock_queue_item)
        queue_service.db.commit.assert_called_once()
        queue_service.db.refresh.assert_called_once_with(mock_queue_item)
    
    def test_add_to_queue_success(self, queue_service, mock_analysis, mock_queue_item):
        """Test successful queue addition"""
        queue_service.db.query.return_value.filter.return_value.first.side_effect = [
            mock_analysis,  # Analysis exists
            None  # No duplicate queue item
        ]
        
        result = queue_service.add_to_queue(1, QueuePriority.HIGH)
        
        assert result is not None
        queue_service.db.commit.assert_called()
    
    def test_add_to_queue_analysis_not_found(self, queue_service):
        """Test queue addition with non-existent analysis"""
        queue_service.db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Analysis 1 not found"):
            queue_service.add_to_queue(1)
    
    def test_get_queue_items(self, queue_service, mock_queue_item):
        """Test getting queue items"""
        queue_service.db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_queue_item]
        
        items = queue_service.get_queue_items(status=QueueStatus.PENDING)
        
        assert len(items) == 1
        assert items[0] == mock_queue_item
    
    def test_apply_queue_filters(self, queue_service):
        """Test queue filter application"""
        mock_query = Mock()
        
        # Test with status filter
        result = queue_service._apply_queue_filters(mock_query, QueueStatus.PENDING, None)
        mock_query.filter.assert_called_once()
        
        # Test with priority filter
        mock_query.reset_mock()
        result = queue_service._apply_queue_filters(mock_query, None, QueuePriority.HIGH)
        mock_query.filter.assert_called_once()
    
    def test_get_queue_status(self, queue_service):
        """Test queue status retrieval"""
        queue_service.db.query.return_value.count.return_value = 5
        queue_service.db.query.return_value.filter.return_value.count.side_effect = [2, 1, 1, 1]
        
        status = queue_service.get_queue_status()
        
        assert status["total_items"] == 5
        assert status["processing_items"] == 2
        assert status["pending_items"] == 1
        assert status["completed_items"] == 1
        assert status["failed_items"] == 1
        assert status["is_processing"] is False
        assert status["is_paused"] is True
    
    def test_pause_queue(self, queue_service):
        """Test queue pausing"""
        queue_service.is_processing = True
        
        result = queue_service.pause_queue()
        
        assert result is True
        assert queue_service.is_processing is False
    
    def test_resume_queue(self, queue_service):
        """Test queue resuming"""
        queue_service.is_processing = False
        
        with patch('asyncio.create_task') as mock_create_task:
            result = queue_service.resume_queue()
            
            assert result is True
            assert queue_service.is_processing is True
            mock_create_task.assert_called_once()
    
    def test_calculate_available_slots(self, queue_service):
        """Test available slots calculation"""
        queue_service.current_tasks = [Mock(), Mock()]  # 2 tasks
        queue_service.max_concurrent = 3
        
        available = queue_service._calculate_available_slots()
        
        assert available == 1
    
    def test_cleanup_completed_tasks(self, queue_service):
        """Test completed tasks cleanup"""
        completed_task = Mock()
        completed_task.done.return_value = True
        
        running_task = Mock()
        running_task.done.return_value = False
        
        queue_service.current_tasks = [completed_task, running_task]
        
        queue_service._cleanup_completed_tasks()
        
        assert len(queue_service.current_tasks) == 1
        assert queue_service.current_tasks[0] == running_task
    
    def test_get_analysis_and_file_success(self, queue_service, mock_analysis, mock_file):
        """Test successful analysis and file retrieval"""
        queue_service.db.query.return_value.filter.return_value.first.side_effect = [
            mock_analysis, mock_file
        ]
        
        analysis, file = queue_service._get_analysis_and_file(1)
        
        assert analysis == mock_analysis
        assert file == mock_file
    
    def test_get_analysis_and_file_analysis_not_found(self, queue_service):
        """Test analysis retrieval with non-existent analysis"""
        queue_service.db.query.return_value.filter.return_value.first.return_value = None
        
        with pytest.raises(ValueError, match="Analysis 1 not found"):
            queue_service._get_analysis_and_file(1)
    
    def test_get_analysis_and_file_file_not_found(self, queue_service, mock_analysis):
        """Test file retrieval with non-existent file"""
        queue_service.db.query.return_value.filter.return_value.first.side_effect = [
            mock_analysis, None
        ]
        
        with pytest.raises(ValueError, match="File 1 not found"):
            queue_service._get_analysis_and_file(1)
    
    def test_mark_analysis_started(self, queue_service, mock_analysis):
        """Test marking analysis as started"""
        queue_service._mark_analysis_started(mock_analysis)
        
        assert mock_analysis.started_at is not None
        queue_service.db.commit.assert_called_once()
    
    def test_update_progress(self, queue_service, mock_queue_item):
        """Test progress update"""
        queue_service._update_progress(mock_queue_item, 0.5, "Processing")
        
        assert mock_queue_item.progress == 0.5
        assert mock_queue_item.current_step == "Processing"
        queue_service.db.commit.assert_called_once()
    
    def test_update_analysis_result(self, queue_service, mock_analysis):
        """Test analysis result update"""
        result = {
            "result": "Analysis result",
            "provider": "openai",
            "model": "gpt-4",
            "processing_time": 1.5,
            "tokens_used": 100,
            "estimated_cost": 0.01,
            "timestamp": 1234567890
        }
        
        queue_service._update_analysis_result(mock_analysis, result)
        
        assert mock_analysis.result == "Analysis result"
        assert mock_analysis.status == AnalysisStatus.COMPLETED
        assert mock_analysis.analysis_metadata["provider"] == "openai"
        queue_service.db.commit.assert_called_once()
    
    def test_mark_item_completed(self, queue_service, mock_queue_item, mock_analysis):
        """Test marking item as completed"""
        queue_service._mark_item_completed(mock_queue_item, mock_analysis)
        
        assert mock_queue_item.status == QueueStatus.COMPLETED
        assert mock_queue_item.progress == 1.0
        assert mock_queue_item.current_step == "Completed"
        assert mock_queue_item.completed_at is not None
        queue_service.db.commit.assert_called_once()
    
    def test_clear_queue(self, queue_service):
        """Test queue clearing"""
        queue_service.db.query.return_value.filter.return_value.delete.return_value = 3
        
        deleted_count = queue_service.clear_queue(QueueStatus.FAILED)
        
        assert deleted_count == 3
        queue_service.db.commit.assert_called_once()
    
    def test_retry_failed_items(self, queue_service, mock_queue_item):
        """Test retrying failed items"""
        queue_service.db.query.return_value.filter.return_value.all.return_value = [mock_queue_item]
        
        retried_count = queue_service.retry_failed_items()
        
        assert retried_count == 1
        assert mock_queue_item.status == QueueStatus.PENDING
        assert mock_queue_item.progress == 0.0
        assert mock_queue_item.current_step == "Pending retry"
        assert mock_queue_item.error_message is None
        queue_service.db.commit.assert_called_once() 