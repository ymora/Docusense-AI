"""
Unit tests for config service
"""

import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.services.config_service import ConfigService
from app.models.config import Config


class TestConfigService:
    """Test cases for ConfigService"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def config_service(self, mock_db):
        """ConfigService instance with mocked dependencies"""
        with patch('app.core.config.settings') as mock_settings:
            mock_settings.openai_api_key = "test_key"
            mock_settings.anthropic_api_key = ""
            mock_settings.mistral_api_key = ""
            mock_settings.ollama_base_url = "http://localhost:11434"
            mock_settings.max_file_size = 10485760
            mock_settings.ocr_enabled = True
            mock_settings.max_concurrent_analyses = 5
            
            service = ConfigService(mock_db)
            return service
    
    @pytest.fixture
    def mock_config(self):
        """Mock config object"""
        config = Mock(spec=Config)
        config.key = "test_key"
        config.value = "test_value"
        config.description = "Test config"
        config.category = "test_category"
        config.is_encrypted = False
        return config
    
    def test_init(self, mock_db):
        """Test ConfigService initialization"""
        with patch('app.core.config.settings') as mock_settings:
            mock_settings.openai_api_key = "test_key"
            mock_settings.anthropic_api_key = ""
            mock_settings.mistral_api_key = ""
            mock_settings.ollama_base_url = "http://localhost:11434"
            mock_settings.max_file_size = 10485760
            mock_settings.ocr_enabled = True
            mock_settings.max_concurrent_analyses = 5
            
            service = ConfigService(mock_db)
            assert service.db == mock_db
            assert hasattr(service, '_cache')
    
    def test_get_config_success(self, config_service, mock_config):
        """Test successful config retrieval"""
        config_service.db.query.return_value.filter.return_value.first.return_value = mock_config
        
        result = config_service.get_config("test_key")
        
        assert result == "test_value"
        config_service.db.query.assert_called_once()
    
    def test_get_config_not_found(self, config_service):
        """Test config retrieval with non-existent key"""
        config_service.db.query.return_value.filter.return_value.first.return_value = None
        
        result = config_service.get_config("nonexistent_key")
        
        assert result is None
    
    def test_get_config_with_default(self, config_service):
        """Test config retrieval with default value"""
        config_service.db.query.return_value.filter.return_value.first.return_value = None
        
        result = config_service.get_config("nonexistent_key", default="default_value")
        
        assert result == "default_value"
    
    def test_get_config_from_cache(self, config_service, mock_config):
        """Test config retrieval from cache"""
        # First call to populate cache
        config_service.db.query.return_value.filter.return_value.first.return_value = mock_config
        config_service.get_config("test_key")
        
        # Second call should use cache
        config_service.db.query.reset_mock()
        result = config_service.get_config("test_key")
        
        assert result == "test_value"
        config_service.db.query.assert_not_called()
    
    def test_set_config_success(self, config_service, mock_config):
        """Test successful config setting"""
        config_service.db.query.return_value.filter.return_value.first.return_value = mock_config
        
        result = config_service.set_config("test_key", "new_value")
        
        assert result is True
        assert mock_config.value == "new_value"
        config_service.db.commit.assert_called_once()
    
    def test_set_config_create_new(self, config_service):
        """Test config setting for new key"""
        config_service.db.query.return_value.filter.return_value.first.return_value = None
        
        result = config_service.set_config("new_key", "new_value")
        
        assert result is True
        config_service.db.add.assert_called_once()
        config_service.db.commit.assert_called_once()
    
    def test_get_configs_by_category(self, config_service, mock_config):
        """Test config retrieval by category"""
        config_service.db.query.return_value.filter.return_value.all.return_value = [mock_config]
        
        result = config_service.get_configs_by_category("test_category")
        
        assert len(result) == 1
        assert result[0] == mock_config
        config_service.db.query.assert_called_once()
    
    def test_get_all_configs(self, config_service, mock_config):
        """Test retrieval of all configs"""
        config_service.db.query.return_value.all.return_value = [mock_config]
        
        result = config_service.get_all_configs()
        
        assert len(result) == 1
        assert result[0] == mock_config
        config_service.db.query.assert_called_once()
    
    def test_delete_config_success(self, config_service, mock_config):
        """Test successful config deletion"""
        config_service.db.query.return_value.filter.return_value.first.return_value = mock_config
        
        result = config_service.delete_config("test_key")
        
        assert result is True
        config_service.db.delete.assert_called_once_with(mock_config)
        config_service.db.commit.assert_called_once()
        # Should clear cache
        assert "test_key" not in config_service._cache
    
    def test_delete_config_not_found(self, config_service):
        """Test config deletion with non-existent key"""
        config_service.db.query.return_value.filter.return_value.first.return_value = None
        
        result = config_service.delete_config("nonexistent_key")
        
        assert result is False
    
    def test_get_categories(self, config_service):
        """Test getting config categories"""
        mock_config1 = Mock(spec=Config)
        mock_config1.category = "system"
        mock_config2 = Mock(spec=Config)
        mock_config2.category = "ui"
        
        config_service.db.query.return_value.distinct.return_value.all.return_value = [mock_config1, mock_config2]
        
        result = config_service.get_categories()
        
        assert len(result) == 2
        assert "system" in result
        assert "ui" in result
    
    def test_get_ai_provider_config(self, config_service):
        """Test getting AI provider configuration"""
        result = config_service.get_ai_provider_config("openai")
        
        assert isinstance(result, dict)
        assert "api_key" in result
    
    def test_set_ai_provider_config(self, config_service):
        """Test setting AI provider configuration"""
        config = {
            "api_key": "new_key",
            "base_url": "https://api.openai.com/v1",
            "default_model": "gpt-4"
        }
        
        result = config_service.set_ai_provider_config("openai", config)
        
        assert result is True
    
    def test_get_ui_config(self, config_service):
        """Test getting UI configuration"""
        result = config_service.get_ui_config()
        
        assert isinstance(result, dict)
        assert "theme" in result
        assert "language" in result
    
    def test_set_ui_config(self, config_service):
        """Test setting UI configuration"""
        config = {
            "theme": "light",
            "language": "en",
            "sidebar_width": "300"
        }
        
        result = config_service.set_ui_config(config)
        
        assert result is True
    
    def test_get_system_config(self, config_service):
        """Test getting system configuration"""
        result = config_service.get_system_config()
        
        assert isinstance(result, dict)
        assert "max_file_size" in result
        assert "ocr_enabled" in result
    
    def test_set_system_config(self, config_service):
        """Test setting system configuration"""
        config = {
            "max_file_size": "20971520",
            "ocr_enabled": "false",
            "max_concurrent_analyses": "10"
        }
        
        result = config_service.set_system_config(config)
        
        assert result is True
    
    def test_export_configs(self, config_service, mock_config):
        """Test config export functionality"""
        config_service.db.query.return_value.all.return_value = [mock_config]
        
        result = config_service.export_configs()
        
        assert isinstance(result, dict)
        assert "test_key" in result
        assert result["test_key"] == "test_value"
    
    def test_import_configs(self, config_service):
        """Test config import functionality"""
        config_data = {
            "test_key": "test_value",
            "another_key": "another_value"
        }
        
        result = config_service.import_configs(config_data)
        
        assert result is True
    
    def test_get_ai_provider_priority(self, config_service):
        """Test getting AI provider priority"""
        result = config_service.get_ai_provider_priority("openai")
        
        assert isinstance(result, int)
        assert result >= 0
    
    def test_set_ai_provider_priority(self, config_service):
        """Test setting AI provider priority"""
        result = config_service.set_ai_provider_priority("openai", 1)
        
        assert result is True
    
    def test_get_ai_provider_cost(self, config_service):
        """Test getting AI provider cost"""
        result = config_service.get_ai_provider_cost("openai", "gpt-4")
        
        assert isinstance(result, float)
        assert result >= 0
    
    def test_set_ai_provider_cost(self, config_service):
        """Test setting AI provider cost"""
        result = config_service.set_ai_provider_cost("openai", "gpt-4", 0.03)
        
        assert result is True
    
    def test_get_ai_provider_strategy(self, config_service):
        """Test getting AI provider strategy"""
        result = config_service.get_ai_provider_strategy()
        
        assert isinstance(result, str)
    
    def test_set_ai_provider_strategy(self, config_service):
        """Test setting AI provider strategy"""
        result = config_service.set_ai_provider_strategy("round_robin")
        
        assert result is True
    
    def test_get_ai_provider_key(self, config_service):
        """Test getting AI provider key"""
        result = config_service.get_ai_provider_key("openai")
        
        assert isinstance(result, str) or result is None
    
    def test_set_ai_provider_key(self, config_service):
        """Test setting AI provider key"""
        result = config_service.set_ai_provider_key("openai", "new_api_key")
        
        assert result is True
    
    def test_get_ai_provider_model(self, config_service):
        """Test getting AI provider model"""
        result = config_service.get_ai_provider_model("openai")
        
        assert isinstance(result, str) or result is None
    
    def test_set_ai_provider_model(self, config_service):
        """Test setting AI provider model"""
        result = config_service.set_ai_provider_model("openai", "gpt-4")
        
        assert result is True
    
    def test_get_ai_metrics(self, config_service):
        """Test getting AI metrics"""
        result = config_service.get_ai_metrics()
        
        assert isinstance(result, dict) 