"""
Unit tests for status manager module
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta

from app.core.status_manager import (
    StatusManager,
    get_status_color,
    get_status_icon,
    format_status_message,
    is_status_transition_valid
)


class TestStatusManager:
    """Test cases for StatusManager"""
    
    @pytest.fixture
    def status_manager(self):
        """StatusManager instance for testing"""
        return StatusManager()
    
    def test_init(self, status_manager):
        """Test StatusManager initialization"""
        assert status_manager is not None
        assert hasattr(status_manager, 'status_history')
    
    def test_update_status(self, status_manager):
        """Test status update"""
        status_manager.update_status("test_id", "pending", "Processing started")
        
        assert "test_id" in status_manager.status_history
        assert len(status_manager.status_history["test_id"]) == 1
        assert status_manager.status_history["test_id"][0]["status"] == "pending"
        assert status_manager.status_history["test_id"][0]["message"] == "Processing started"
    
    def test_get_current_status(self, status_manager):
        """Test getting current status"""
        status_manager.update_status("test_id", "pending", "Processing started")
        status_manager.update_status("test_id", "completed", "Processing finished")
        
        current = status_manager.get_current_status("test_id")
        assert current["status"] == "completed"
        assert current["message"] == "Processing finished"
    
    def test_get_current_status_not_found(self, status_manager):
        """Test getting current status for non-existent ID"""
        current = status_manager.get_current_status("nonexistent_id")
        assert current is None
    
    def test_get_status_history(self, status_manager):
        """Test getting status history"""
        status_manager.update_status("test_id", "pending", "Step 1")
        status_manager.update_status("test_id", "processing", "Step 2")
        status_manager.update_status("test_id", "completed", "Step 3")
        
        history = status_manager.get_status_history("test_id")
        assert len(history) == 3
        assert history[0]["status"] == "pending"
        assert history[1]["status"] == "processing"
        assert history[2]["status"] == "completed"
    
    def test_get_status_history_not_found(self, status_manager):
        """Test getting status history for non-existent ID"""
        history = status_manager.get_status_history("nonexistent_id")
        assert history == []
    
    def test_clear_history(self, status_manager):
        """Test clearing status history"""
        status_manager.update_status("test_id", "pending", "Test")
        status_manager.clear_history("test_id")
        
        assert "test_id" not in status_manager.status_history
    
    def test_clear_all_history(self, status_manager):
        """Test clearing all status history"""
        status_manager.update_status("id1", "pending", "Test 1")
        status_manager.update_status("id2", "completed", "Test 2")
        status_manager.clear_all_history()
        
        assert len(status_manager.status_history) == 0


class TestStatusUtilities:
    """Test cases for status utility functions"""
    
    def test_get_status_color(self):
        """Test getting status color"""
        assert get_status_color("pending") == "yellow"
        assert get_status_color("processing") == "blue"
        assert get_status_color("completed") == "green"
        assert get_status_color("failed") == "red"
        assert get_status_color("cancelled") == "gray"
        assert get_status_color("unknown") == "black"
    
    def test_get_status_icon(self):
        """Test getting status icon"""
        assert get_status_icon("pending") == "⏳"
        assert get_status_icon("processing") == "🔄"
        assert get_status_icon("completed") == "✅"
        assert get_status_icon("failed") == "❌"
        assert get_status_icon("cancelled") == "⏹️"
        assert get_status_icon("unknown") == "❓"
    
    def test_format_status_message(self):
        """Test formatting status message"""
        message = format_status_message("Test message", {"key": "value"})
        assert "Test message" in message
        assert "key" in message
        assert "value" in message
    
    def test_format_status_message_no_details(self):
        """Test formatting status message without details"""
        message = format_status_message("Test message")
        assert message == "Test message"
    
    def test_is_status_transition_valid(self):
        """Test status transition validation"""
        # Valid transitions
        assert is_status_transition_valid("pending", "processing") is True
        assert is_status_transition_valid("processing", "completed") is True
        assert is_status_transition_valid("processing", "failed") is True
        assert is_status_transition_valid("pending", "cancelled") is True
        
        # Invalid transitions
        assert is_status_transition_valid("completed", "processing") is False
        assert is_status_transition_valid("failed", "processing") is False
        assert is_status_transition_valid("cancelled", "processing") is False
        assert is_status_transition_valid("completed", "pending") is False
    
    def test_is_status_transition_valid_same_status(self):
        """Test status transition validation with same status"""
        assert is_status_transition_valid("pending", "pending") is True
        assert is_status_transition_valid("processing", "processing") is True
        assert is_status_transition_valid("completed", "completed") is True
    
    def test_is_status_transition_valid_unknown_status(self):
        """Test status transition validation with unknown status"""
        assert is_status_transition_valid("unknown", "pending") is False
        assert is_status_transition_valid("pending", "unknown") is False
        assert is_status_transition_valid("unknown", "unknown") is False 