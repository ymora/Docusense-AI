"""
Unit tests for logging module
"""

import pytest
from unittest.mock import Mock, patch
import logging
from pathlib import Path

from app.core.logging import setup_logging


class TestLogging:
    """Test cases for logging functions"""
    
    def test_setup_logging(self):
        """Test logging setup"""
        with patch('pathlib.Path.mkdir') as mock_mkdir, \
             patch('logging.basicConfig') as mock_basic_config, \
             patch('logging.getLogger') as mock_get_logger, \
             patch('logging.StreamHandler') as mock_stream_handler, \
             patch('logging.FileHandler') as mock_file_handler:
            
            mock_logger = Mock()
            mock_get_logger.return_value = mock_logger
            
            setup_logging()
            
            mock_mkdir.assert_called_once_with(exist_ok=True)
            mock_basic_config.assert_called_once()
            mock_get_logger.assert_called()
    
    def test_setup_logging_creates_log_dir(self):
        """Test that setup_logging creates logs directory"""
        with patch('pathlib.Path.mkdir') as mock_mkdir, \
             patch('logging.basicConfig'), \
             patch('logging.getLogger'), \
             patch('logging.StreamHandler'), \
             patch('logging.FileHandler'):
            
            setup_logging()
            
            mock_mkdir.assert_called_once_with(exist_ok=True)
    
    def test_setup_logging_configures_handlers(self):
        """Test that setup_logging configures handlers"""
        with patch('pathlib.Path.mkdir'), \
             patch('logging.basicConfig') as mock_basic_config, \
             patch('logging.getLogger'), \
             patch('logging.StreamHandler') as mock_stream_handler, \
             patch('logging.FileHandler') as mock_file_handler:
            
            setup_logging()
            
            # Should configure basic logging with handlers
            mock_basic_config.assert_called_once()
            mock_stream_handler.assert_called_once()
            mock_file_handler.assert_called()
    
    def test_setup_logging_sets_logger_levels(self):
        """Test that setup_logging sets logger levels"""
        with patch('pathlib.Path.mkdir'), \
             patch('logging.basicConfig'), \
             patch('logging.getLogger') as mock_get_logger, \
             patch('logging.StreamHandler'), \
             patch('logging.FileHandler'):
            
            mock_logger = Mock()
            mock_get_logger.return_value = mock_logger
            
            setup_logging()
            
            # Should set logger levels
            assert mock_logger.setLevel.called
    
    def test_setup_logging_app_logger(self):
        """Test that setup_logging configures app logger"""
        with patch('pathlib.Path.mkdir'), \
             patch('logging.basicConfig'), \
             patch('logging.getLogger') as mock_get_logger, \
             patch('logging.StreamHandler'), \
             patch('logging.FileHandler'):
            
            mock_logger = Mock()
            mock_get_logger.return_value = mock_logger
            
            setup_logging()
            
            # Should configure docusense logger
            mock_get_logger.assert_any_call("docusense")
    
    def test_setup_logging_external_loggers(self):
        """Test that setup_logging configures external loggers"""
        with patch('pathlib.Path.mkdir'), \
             patch('logging.basicConfig'), \
             patch('logging.getLogger') as mock_get_logger, \
             patch('logging.StreamHandler'), \
             patch('logging.FileHandler'):
            
            mock_logger = Mock()
            mock_get_logger.return_value = mock_logger
            
            setup_logging()
            
            # Should configure external loggers
            external_loggers = ["uvicorn", "fastapi", "sqlalchemy", "httpx", "openai", "anthropic", "mistralai"]
            for logger_name in external_loggers:
                mock_get_logger.assert_any_call(logger_name) 