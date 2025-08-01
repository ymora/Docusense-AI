"""
Unit tests for prompt service module
"""

import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.services.prompt_service import PromptService
from app.models.config import Config


class TestPromptService:
    """Test cases for PromptService"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def prompt_service(self, mock_db):
        """PromptService instance with mocked dependencies"""
        return PromptService(mock_db)
    
    def test_init(self, prompt_service, mock_db):
        """Test PromptService initialization"""
        assert prompt_service.db == mock_db
        assert hasattr(prompt_service, 'cache')
    
    def test_get_prompt_success(self, prompt_service, mock_db):
        """Test getting prompt successfully"""
        mock_config = Mock(spec=Config)
        mock_config.key = "test_prompt"
        mock_config.value = "This is a test prompt"
        mock_config.category = "prompts"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_config
        
        result = prompt_service.get_prompt("test_prompt")
        
        assert result == "This is a test prompt"
        mock_db.query.assert_called_once()
    
    def test_get_prompt_not_found(self, prompt_service, mock_db):
        """Test getting prompt that doesn't exist"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = prompt_service.get_prompt("nonexistent_prompt")
        
        assert result is None
    
    def test_get_prompt_with_default(self, prompt_service, mock_db):
        """Test getting prompt with default value"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = prompt_service.get_prompt("nonexistent_prompt", default="Default prompt")
        
        assert result == "Default prompt"
    
    def test_set_prompt_success(self, prompt_service, mock_db):
        """Test setting prompt successfully"""
        mock_config = Mock(spec=Config)
        mock_config.key = "test_prompt"
        mock_config.value = "Old prompt"
        
        mock_db.query.return_value.filter.return_value.first.return_value = mock_config
        
        result = prompt_service.set_prompt("test_prompt", "New prompt")
        
        assert result is True
        assert mock_config.value == "New prompt"
        mock_db.commit.assert_called_once()
    
    def test_set_prompt_create_new(self, prompt_service, mock_db):
        """Test setting prompt that doesn't exist (creates new)"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with patch.object(prompt_service, '_create_prompt_config') as mock_create:
            mock_create.return_value = True
            result = prompt_service.set_prompt("new_prompt", "New prompt")
            
            assert result is True
            mock_create.assert_called_once_with("new_prompt", "New prompt")
    
    def test_get_prompts_by_category(self, prompt_service, mock_db):
        """Test getting prompts by category"""
        mock_configs = [
            Mock(spec=Config, key="prompt1", value="Value 1", category="prompts"),
            Mock(spec=Config, key="prompt2", value="Value 2", category="prompts"),
            Mock(spec=Config, key="other", value="Other", category="other")
        ]
        
        mock_db.query.return_value.filter.return_value.all.return_value = mock_configs
        
        result = prompt_service.get_prompts_by_category("prompts")
        
        assert len(result) == 2
        assert result["prompt1"] == "Value 1"
        assert result["prompt2"] == "Value 2"
    
    def test_get_all_prompts(self, prompt_service, mock_db):
        """Test getting all prompts"""
        mock_configs = [
            Mock(spec=Config, key="prompt1", value="Value 1", category="prompts"),
            Mock(spec=Config, key="prompt2", value="Value 2", category="prompts")
        ]
        
        mock_db.query.return_value.filter.return_value.all.return_value = mock_configs
        
        result = prompt_service.get_all_prompts()
        
        assert len(result) == 2
        assert result["prompt1"] == "Value 1"
        assert result["prompt2"] == "Value 2"
    
    def test_delete_prompt_success(self, prompt_service, mock_db):
        """Test deleting prompt successfully"""
        mock_config = Mock(spec=Config)
        mock_db.query.return_value.filter.return_value.first.return_value = mock_config
        
        result = prompt_service.delete_prompt("test_prompt")
        
        assert result is True
        mock_db.delete.assert_called_once_with(mock_config)
        mock_db.commit.assert_called_once()
    
    def test_delete_prompt_not_found(self, prompt_service, mock_db):
        """Test deleting prompt that doesn't exist"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        result = prompt_service.delete_prompt("nonexistent_prompt")
        
        assert result is False
        mock_db.delete.assert_not_called()
    
    def test_clear_cache(self, prompt_service):
        """Test clearing cache"""
        prompt_service.cache = {"test": "value"}
        prompt_service.clear_cache()
        
        assert len(prompt_service.cache) == 0
    
    def test_get_prompt_statistics(self, prompt_service, mock_db):
        """Test getting prompt statistics"""
        mock_configs = [
            Mock(spec=Config, key="prompt1", category="prompts"),
            Mock(spec=Config, key="prompt2", category="prompts"),
            Mock(spec=Config, key="other", category="other")
        ]
        
        mock_db.query.return_value.filter.return_value.all.return_value = mock_configs
        
        stats = prompt_service.get_prompt_statistics()
        
        assert "total_prompts" in stats
        assert "by_category" in stats
        assert stats["total_prompts"] == 3
        assert stats["by_category"]["prompts"] == 2
        assert stats["by_category"]["other"] == 1 