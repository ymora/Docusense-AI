"""
Unit tests for configuration module
"""

import pytest
import os
from unittest.mock import patch, Mock
from pydantic import ValidationError

from app.core.config import Settings, ensure_directories, load_api_keys_from_database


class TestSettings:
    """Test cases for Settings class"""

    def test_default_values(self):
        """Test default configuration values"""
        settings = Settings()
        
        assert settings.app_name == "DocuSense AI"
        assert settings.app_version == "1.0.0"
        assert settings.host == "0.0.0.0"
        assert settings.port == 8000
        assert settings.database_url == "sqlite:///./docusense.db"
        assert settings.algorithm == "HS256"
        assert settings.access_token_expire_minutes == 30
        assert settings.cors_allow_credentials is True
        assert "GET" in settings.cors_allow_methods
        assert "HEAD" in settings.cors_allow_methods
        assert settings.rate_limit_enabled is True
        assert settings.rate_limit_requests == 100
        assert settings.rate_limit_window == 60
        assert settings.ollama_base_url == "http://localhost:11434"
        assert settings.log_level == "INFO"
        assert settings.max_file_size == 100 * 1024 * 1024
        assert settings.ocr_enabled is True
        assert settings.max_concurrent_analyses == 3
        assert settings.queue_poll_interval == 2
        assert settings.cache_enabled is True
        assert settings.cache_ttl == 3600
        assert settings.compression_enabled is True
        assert settings.gzip_min_size == 500
        assert settings.metrics_enabled is True
        assert settings.health_check_interval == 30

    def test_environment_override(self):
        """Test environment variable override"""
        with patch.dict(os.environ, {
            'APP_NAME': 'Test App',
            'PORT': '9000',
            'DEBUG': 'true',
            'LOG_LEVEL': 'DEBUG'
        }):
            settings = Settings()
            
            assert settings.app_name == "Test App"
            assert settings.port == 9000
            assert settings.debug is True
            assert settings.log_level == "DEBUG"

    def test_cors_origins_parsing(self):
        """Test CORS origins parsing"""
        with patch.dict(os.environ, {
            'CORS_ORIGINS': 'http://localhost:3000,http://example.com'
        }):
            settings = Settings()
            
            assert "http://localhost:3000" in settings.cors_origins
            assert "http://example.com" in settings.cors_origins

    def test_cors_origins_single_value(self):
        """Test CORS origins with single value"""
        with patch.dict(os.environ, {
            'CORS_ORIGINS': 'http://localhost:3000'
        }):
            settings = Settings()
            
            assert settings.cors_origins == ["http://localhost:3000"]

    def test_cors_origins_empty(self):
        """Test CORS origins with empty value"""
        with patch.dict(os.environ, {
            'CORS_ORIGINS': ''
        }):
            settings = Settings()
            
            assert settings.cors_origins == []

    def test_secret_key_validation(self):
        """Test secret key validation"""
        # Test with valid secret key
        with patch.dict(os.environ, {
            'SECRET_KEY': 'test-secret-key-32-chars-long-valid'
        }):
            settings = Settings()
            assert len(settings.secret_key) >= 32

        # Test with invalid secret key (too short)
        with patch.dict(os.environ, {
            'SECRET_KEY': 'short'
        }):
            with pytest.raises(ValidationError):
                Settings()

    def test_ai_provider_config(self):
        """Test AI provider configuration"""
        with patch.dict(os.environ, {
            'OPENAI_API_KEY': 'test-openai-key',
            'ANTHROPIC_API_KEY': 'test-anthropic-key',
            'MISTRAL_API_KEY': 'test-mistral-key',
            'OLLAMA_BASE_URL': 'http://localhost:11435'
        }):
            settings = Settings()
            
            assert settings.openai_api_key == 'test-openai-key'
            assert settings.anthropic_api_key == 'test-anthropic-key'
            assert settings.mistral_api_key == 'test-mistral-key'
            assert settings.ollama_base_url == 'http://localhost:11435'

    def test_file_processing_config(self):
        """Test file processing configuration"""
        with patch.dict(os.environ, {
            'MAX_FILE_SIZE': '52428800',  # 50MB
            'OCR_ENABLED': 'false',
            'TESSERACT_CMD': '/usr/bin/tesseract'
        }):
            settings = Settings()
            
            assert settings.max_file_size == 52428800
            assert settings.ocr_enabled is False
            assert settings.tesseract_cmd == '/usr/bin/tesseract'

    def test_queue_config(self):
        """Test queue configuration"""
        with patch.dict(os.environ, {
            'MAX_CONCURRENT_ANALYSES': '5',
            'QUEUE_POLL_INTERVAL': '5'
        }):
            settings = Settings()
            
            assert settings.max_concurrent_analyses == 5
            assert settings.queue_poll_interval == 5

    def test_cache_config(self):
        """Test cache configuration"""
        with patch.dict(os.environ, {
            'CACHE_ENABLED': 'false',
            'CACHE_TTL': '7200'
        }):
            settings = Settings()
            
            assert settings.cache_enabled is False
            assert settings.cache_ttl == 7200

    def test_performance_config(self):
        """Test performance configuration"""
        with patch.dict(os.environ, {
            'COMPRESSION_ENABLED': 'false',
            'GZIP_MIN_SIZE': '1000'
        }):
            settings = Settings()
            
            assert settings.compression_enabled is False
            assert settings.gzip_min_size == 1000

    def test_monitoring_config(self):
        """Test monitoring configuration"""
        with patch.dict(os.environ, {
            'METRICS_ENABLED': 'false',
            'HEALTH_CHECK_INTERVAL': '60'
        }):
            settings = Settings()
            
            assert settings.metrics_enabled is False
            assert settings.health_check_interval == 60


class TestConfigFunctions:
    """Test cases for configuration functions"""

    @patch('os.makedirs')
    def test_ensure_directories(self, mock_makedirs):
        """Test ensure_directories function"""
        ensure_directories()
        
        # Should create logs directory
        mock_makedirs.assert_called_with('logs', exist_ok=True)

    @patch('app.core.config.get_db')
    def test_load_api_keys_from_database(self, mock_get_db):
        """Test load_api_keys_from_database function"""
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        
        # Mock database query
        mock_config = Mock()
        mock_config.key = "openai_api_key"
        mock_config.value = "test-key"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_config
        
        load_api_keys_from_database()
        
        # Should query database for API keys
        mock_db.query.assert_called() 