"""
Unit tests for prompt service module
"""

import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.services.prompt_service import PromptService, PromptDomain, PromptType


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
        assert hasattr(prompt_service, 'prompts_data')
    
    def test_get_prompt_success(self, prompt_service):
        """Test getting prompt successfully"""
        # Mock the prompts data
        prompt_service.prompts_data = {
            "specialized_prompts": {
                "test_prompt": {
                    "name": "Test Prompt",
                    "description": "A test prompt",
                    "domain": "general",
                    "type": "analysis"
                }
            }
        }
        
        result = prompt_service.get_prompt("test_prompt")
        
        assert result is not None
        assert result["name"] == "Test Prompt"
    
    def test_get_prompt_not_found(self, prompt_service):
        """Test getting prompt that doesn't exist"""
        prompt_service.prompts_data = {"specialized_prompts": {}}
        
        result = prompt_service.get_prompt("nonexistent_prompt")
        
        assert result is None
    
    def test_get_prompts_by_domain(self, prompt_service):
        """Test getting prompts by domain"""
        prompt_service.prompts_data = {
            "specialized_prompts": {
                "prompt1": {"domain": "general", "name": "Prompt 1"},
                "prompt2": {"domain": "general", "name": "Prompt 2"},
                "prompt3": {"domain": "technical", "name": "Prompt 3"}
            }
        }
        
        result = prompt_service.get_prompts_by_domain(PromptDomain.GENERAL)
        
        assert len(result) == 2
        assert "prompt1" in result
        assert "prompt2" in result
    
    def test_get_prompts_by_type(self, prompt_service):
        """Test getting prompts by type"""
        prompt_service.prompts_data = {
            "specialized_prompts": {
                "prompt1": {"type": "analysis", "name": "Prompt 1"},
                "prompt2": {"type": "analysis", "name": "Prompt 2"},
                "prompt3": {"type": "summary", "name": "Prompt 3"}
            }
        }
        
        result = prompt_service.get_prompts_by_type(PromptType.ANALYSIS)
        
        assert len(result) == 2
        assert "prompt1" in result
        assert "prompt2" in result
    
    def test_get_all_prompts(self, prompt_service):
        """Test getting all prompts"""
        prompt_service.prompts_data = {
            "specialized_prompts": {
                "prompt1": {"name": "Prompt 1"},
                "prompt2": {"name": "Prompt 2"}
            }
        }
        
        result = prompt_service.get_all_prompts()
        
        assert len(result) == 2
        assert "prompt1" in result
        assert "prompt2" in result
    
    def test_get_all_default_prompts(self, prompt_service):
        """Test getting all default prompts"""
        prompt_service.prompts_data = {
            "default_prompts": {
                "analysis": "Default analysis prompt",
                "summary": "Default summary prompt"
            }
        }
        
        result = prompt_service.get_all_default_prompts()
        
        assert len(result) == 2
        assert result["analysis"] == "Default analysis prompt"
    
    def test_format_prompt(self, prompt_service):
        """Test formatting a prompt with text"""
        prompt_service.prompts_data = {
            "specialized_prompts": {
                "test_prompt": {
                    "prompt": "Analyze this text: {text}",
                    "name": "Test Prompt"
                }
            }
        }
        
        result = prompt_service.format_prompt("test_prompt", "Hello World")
        
        assert result == "Analyze this text: Hello World"
    
    def test_reload_prompts(self, prompt_service):
        """Test reloading prompts"""
        with patch.object(prompt_service, '_load_prompts_from_json') as mock_load:
            mock_load.return_value = {"new": "data"}
            
            result = prompt_service.reload_prompts()
            
            assert result is True
            assert prompt_service.prompts_data == {"new": "data"} 