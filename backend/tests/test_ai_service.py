"""
Unit tests for AI service
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy.orm import Session

from app.services.ai_service import AIService
from app.models.analysis import AnalysisType


class TestAIService:
    """Test cases for AIService"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def ai_service(self, mock_db):
        """AIService instance with mocked dependencies"""
        with patch('app.services.config_service.ConfigService'), \
             patch('app.core.config.settings'):
            service = AIService(mock_db)
            service.providers = {
                "openai": {
                    "name": "openai",
                    "api_key": "test_key",
                    "base_url": "https://api.openai.com/v1",
                    "default_model": "gpt-4",
                    "models": ["gpt-4", "gpt-3.5-turbo"],
                    "is_active": True,
                    "priority": 1
                }
            }
            return service
    
    def test_init(self, mock_db):
        """Test AIService initialization"""
        with patch('app.services.config_service.ConfigService'), \
             patch('app.core.config.settings'):
            service = AIService(mock_db)
            assert service.db == mock_db
            assert isinstance(service.providers, dict)
    
    def test_get_available_providers(self, ai_service):
        """Test getting available providers"""
        providers = ai_service.get_available_providers()
        assert len(providers) == 1
        assert providers[0]["name"] == "openai"
        assert providers[0]["is_active"] is True
    
    def test_sort_providers_by_priority(self, ai_service):
        """Test provider sorting by priority"""
        providers = [
            {"name": "provider2", "priority": 2},
            {"name": "provider1", "priority": 1},
            {"name": "provider3", "priority": 3}
        ]
        
        sorted_providers = ai_service._sort_providers_by_priority(providers)
        assert sorted_providers[0]["priority"] == 1
        assert sorted_providers[1]["priority"] == 2
        assert sorted_providers[2]["priority"] == 3
    
    def test_select_model_for_provider_with_requested_model(self, ai_service):
        """Test model selection with requested model"""
        provider = {
            "name": "openai",
            "models": [{"name": "gpt-4"}, {"name": "gpt-3.5-turbo"}],
            "default_model": "gpt-4"
        }
        
        model = ai_service._select_model_for_provider(provider, "gpt-3.5-turbo")
        assert model == "gpt-3.5-turbo"
    
    def test_select_model_for_provider_without_requested_model(self, ai_service):
        """Test model selection without requested model"""
        provider = {
            "name": "openai",
            "models": [{"name": "gpt-4"}, {"name": "gpt-3.5-turbo"}],
            "default_model": "gpt-4"
        }
        
        model = ai_service._select_model_for_provider(provider, None)
        assert model == "gpt-4"
    
    def test_calculate_performance_score(self, ai_service):
        """Test performance score calculation"""
        provider = {
            "priority": 2,
            "has_api_key": True,
            "models": ["model1", "model2"]
        }
        
        score = ai_service._calculate_performance_score(provider, Mock())
        assert score > 0
    
    def test_estimate_tokens(self, ai_service):
        """Test token estimation"""
        prompt = "Hello world"
        result = "This is a response"
        
        tokens = ai_service._estimate_tokens(prompt, result)
        assert tokens > 0
    
    def test_estimate_cost(self, ai_service):
        """Test cost estimation"""
        prompt = "Hello world"
        result = "This is a response"
        
        cost = ai_service._estimate_cost("openai", "gpt-4", prompt, result)
        assert cost >= 0
    
    def test_validate_provider_config_valid(self, ai_service):
        """Test valid provider configuration"""
        config = {
            "name": "openai",
            "api_key": "test_key",
            "base_url": "https://api.openai.com/v1",
            "default_model": "gpt-4"
        }
        
        is_valid = ai_service.validate_provider_config("openai", config)
        assert is_valid is True
    
    def test_validate_provider_config_invalid(self, ai_service):
        """Test invalid provider configuration"""
        config = {
            "name": "openai",
            # Missing required fields
        }
        
        is_valid = ai_service.validate_provider_config("openai", config)
        assert is_valid is False
    
    @pytest.mark.asyncio
    async def test_test_provider_async_success(self, ai_service):
        """Test successful provider testing"""
        with patch.object(ai_service, '_test_provider', new_callable=AsyncMock) as mock_test:
            mock_test.return_value = True
            
            result = await ai_service.test_provider_async("openai")
            assert result is True
    
    @pytest.mark.asyncio
    async def test_test_provider_async_failure(self, ai_service):
        """Test failed provider testing"""
        with patch.object(ai_service, '_test_provider', new_callable=AsyncMock) as mock_test:
            mock_test.side_effect = Exception("Test error")
            
            result = await ai_service.test_provider_async("openai")
            assert result is False
    
    def test_get_default_base_url(self, ai_service):
        """Test getting default base URL"""
        urls = {
            "openai": "https://api.openai.com/v1",
            "claude": "https://api.anthropic.com",
            "mistral": "https://api.mistral.ai",
            "ollama": "http://localhost:11434"
        }
        
        for provider, expected_url in urls.items():
            url = ai_service._get_default_base_url(provider)
            assert url == expected_url
    
    def test_get_default_model(self, ai_service):
        """Test getting default model"""
        models = {
            "openai": "gpt-4",
            "claude": "claude-3-sonnet-20240229",
            "mistral": "mistral-large-latest",
            "ollama": "llama2"
        }
        
        for provider, expected_model in models.items():
            model = ai_service._get_default_model(provider)
            assert model == expected_model
    
    def test_get_default_models(self, ai_service):
        """Test getting default models list"""
        models = ai_service._get_default_models("openai")
        assert isinstance(models, list)
        assert len(models) > 0
        assert "gpt-4" in models 