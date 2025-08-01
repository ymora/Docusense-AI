"""
Unit tests for core config module
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import os
from typing import List

from app.core.config import Settings


class TestSettings:
    """Test cases for Settings class"""
    
    def test_default_values(self):
        """Test default configuration values"""
        settings = Settings()
        
        assert settings.app_name == "DocuSense AI"
        assert settings.debug is False
        assert settings.api_v1_prefix == "/api/v1"
        assert settings.max_file_size == 100 * 1024 * 1024  # 100MB
        assert settings.upload_dir == "uploads"
        assert settings.database_url.startswith("sqlite:///")
        assert settings.secret_key is not None
        assert len(settings.secret_key) >= 32
    
    def test_environment_override(self):
        """Test environment variable overrides"""
        with patch.dict(os.environ, {
            "APP_NAME": "Test App",
            "DEBUG": "true",
            "MAX_FILE_SIZE": "52428800",  # 50MB
            "SECRET_KEY": "test_secret_key_32_chars_long"
        }):
            settings = Settings()
            
            assert settings.app_name == "Test App"
            assert settings.debug is True
            assert settings.max_file_size == 52428800
            assert settings.secret_key == "test_secret_key_32_chars_long"
    
    def test_cors_origins_parsing(self):
        """Test CORS origins parsing"""
        with patch.dict(os.environ, {
            "CORS_ORIGINS": "http://localhost:3000,https://example.com"
        }):
            settings = Settings()
            
            assert isinstance(settings.cors_origins, List)
            assert "http://localhost:3000" in settings.cors_origins
            assert "https://example.com" in settings.cors_origins
    
    def test_cors_origins_single_value(self):
        """Test CORS origins with single value"""
        with patch.dict(os.environ, {
            "CORS_ORIGINS": "http://localhost:3000"
        }):
            settings = Settings()
            
            assert isinstance(settings.cors_origins, List)
            assert len(settings.cors_origins) == 1
            assert settings.cors_origins[0] == "http://localhost:3000"
    
    def test_cors_origins_empty(self):
        """Test CORS origins with empty value"""
        with patch.dict(os.environ, {
            "CORS_ORIGINS": ""
        }):
            settings = Settings()
            
            assert isinstance(settings.cors_origins, List)
            assert len(settings.cors_origins) == 0
    
    def test_secret_key_validation(self):
        """Test secret key validation"""
        # Test with short key
        with patch.dict(os.environ, {
            "SECRET_KEY": "short"
        }):
            with pytest.raises(ValueError, match="SECRET_KEY must be at least 32 characters"):
                Settings()
        
        # Test with valid key
        with patch.dict(os.environ, {
            "SECRET_KEY": "valid_secret_key_that_is_long_enough_32_chars"
        }):
            settings = Settings()
            assert settings.secret_key == "valid_secret_key_that_is_long_enough_32_chars"
    
    def test_database_url_construction(self):
        """Test database URL construction"""
        with patch.dict(os.environ, {
            "DATABASE_URL": "sqlite:///test.db"
        }):
            settings = Settings()
            assert settings.database_url == "sqlite:///test.db"
    
    def test_redis_url_construction(self):
        """Test Redis URL construction"""
        with patch.dict(os.environ, {
            "REDIS_URL": "redis://localhost:6379"
        }):
            settings = Settings()
            assert settings.redis_url == "redis://localhost:6379"
    
    def test_openai_config(self):
        """Test OpenAI configuration"""
        with patch.dict(os.environ, {
            "OPENAI_API_KEY": "test_openai_key",
            "OPENAI_BASE_URL": "https://api.openai.com/v1",
            "OPENAI_DEFAULT_MODEL": "gpt-4"
        }):
            settings = Settings()
            assert settings.openai_api_key == "test_openai_key"
            assert settings.openai_base_url == "https://api.openai.com/v1"
            assert settings.openai_default_model == "gpt-4"
    
    def test_anthropic_config(self):
        """Test Anthropic configuration"""
        with patch.dict(os.environ, {
            "ANTHROPIC_API_KEY": "test_anthropic_key",
            "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
            "ANTHROPIC_DEFAULT_MODEL": "claude-3-sonnet"
        }):
            settings = Settings()
            assert settings.anthropic_api_key == "test_anthropic_key"
            assert settings.anthropic_base_url == "https://api.anthropic.com"
            assert settings.anthropic_default_model == "claude-3-sonnet"
    
    def test_mistral_config(self):
        """Test Mistral configuration"""
        with patch.dict(os.environ, {
            "MISTRAL_API_KEY": "test_mistral_key",
            "MISTRAL_BASE_URL": "https://api.mistral.ai",
            "MISTRAL_DEFAULT_MODEL": "mistral-large"
        }):
            settings = Settings()
            assert settings.mistral_api_key == "test_mistral_key"
            assert settings.mistral_base_url == "https://api.mistral.ai"
            assert settings.mistral_default_model == "mistral-large"
    
    def test_ollama_config(self):
        """Test Ollama configuration"""
        with patch.dict(os.environ, {
            "OLLAMA_BASE_URL": "http://localhost:11434",
            "OLLAMA_DEFAULT_MODEL": "llama2"
        }):
            settings = Settings()
            assert settings.ollama_base_url == "http://localhost:11434"
            assert settings.ollama_default_model == "llama2"
    
    def test_logging_config(self):
        """Test logging configuration"""
        with patch.dict(os.environ, {
            "LOG_LEVEL": "DEBUG",
            "LOG_FILE": "test.log"
        }):
            settings = Settings()
            assert settings.log_level == "DEBUG"
            assert settings.log_file == "test.log"
    
    def test_security_config(self):
        """Test security configuration"""
        with patch.dict(os.environ, {
            "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
            "ALGORITHM": "HS256"
        }):
            settings = Settings()
            assert settings.access_token_expire_minutes == 30
            assert settings.algorithm == "HS256"
    
    def test_file_processing_config(self):
        """Test file processing configuration"""
        with patch.dict(os.environ, {
            "MAX_CONCURRENT_UPLOADS": "5",
            "CHUNK_SIZE": "8192",
            "ENABLE_OCR": "true"
        }):
            settings = Settings()
            assert settings.max_concurrent_uploads == 5
            assert settings.chunk_size == 8192
            assert settings.enable_ocr is True
    
    def test_cache_config(self):
        """Test cache configuration"""
        with patch.dict(os.environ, {
            "CACHE_TTL": "300",
            "CACHE_MAX_SIZE": "1000"
        }):
            settings = Settings()
            assert settings.cache_ttl == 300
            assert settings.cache_max_size == 1000
    
    def test_queue_config(self):
        """Test queue configuration"""
        with patch.dict(os.environ, {
            "MAX_CONCURRENT_ANALYSES": "3",
            "QUEUE_TIMEOUT": "300"
        }):
            settings = Settings()
            assert settings.max_concurrent_analyses == 3
            assert settings.queue_timeout == 300
    
    def test_validation_config(self):
        """Test validation configuration"""
        with patch.dict(os.environ, {
            "ALLOWED_FILE_TYPES": "pdf,docx,jpg,png",
            "MAX_FILE_COUNT": "100"
        }):
            settings = Settings()
            assert isinstance(settings.allowed_file_types, List)
            assert "pdf" in settings.allowed_file_types
            assert "docx" in settings.allowed_file_types
            assert settings.max_file_count == 100
    
    def test_development_config(self):
        """Test development-specific configuration"""
        with patch.dict(os.environ, {
            "ENVIRONMENT": "development",
            "RELOAD": "true"
        }):
            settings = Settings()
            assert settings.environment == "development"
            assert settings.reload is True
    
    def test_production_config(self):
        """Test production-specific configuration"""
        with patch.dict(os.environ, {
            "ENVIRONMENT": "production",
            "RELOAD": "false"
        }):
            settings = Settings()
            assert settings.environment == "production"
            assert settings.reload is False


class TestSettingsSingleton:
    """Test cases for Settings singleton behavior"""
    
    def test_settings_initialization(self):
        """Test Settings initialization"""
        settings = Settings()
        
        assert isinstance(settings, Settings)
        assert settings.app_name == "DocuSense AI"
    
    def test_settings_with_env_override(self):
        """Test Settings with environment override"""
        with patch.dict(os.environ, {
            "APP_NAME": "Test App Override"
        }):
            settings = Settings()
            assert settings.app_name == "Test App Override" 