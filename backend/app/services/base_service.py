"""
Base service class for all services in Docusense AI
Provides common functionality and patterns for all services
"""

from sqlalchemy.orm import Session
import logging
from typing import Dict, Any, Optional, List
from functools import wraps
import asyncio


class BaseService:
    """Base class for all services with common functionality"""
    
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def log_operation(self, operation_name: str):
        """Decorator to log operations with error handling"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                try:
                    self.logger.debug(f"Starting operation: {operation_name}")
                    result = func(*args, **kwargs)
                    self.logger.debug(f"Completed operation: {operation_name}")
                    return result
                except Exception as e:
                    self.logger.error(f"Error in {operation_name}: {str(e)}")
                    raise
            return wrapper
        return decorator
    
    def safe_execute(self, operation_name: str, func, *args, **kwargs):
        """Safely execute a function with error handling"""
        try:
            self.logger.debug(f"Starting operation: {operation_name}")
            result = func(*args, **kwargs)
            self.logger.debug(f"Completed operation: {operation_name}")
            return result
        except Exception as e:
            self.logger.error(f"Error in {operation_name}: {str(e)}")
            raise
    
    async def safe_execute_async(self, operation_name: str, func, *args, **kwargs):
        """Safely execute an async function with error handling"""
        try:
            self.logger.debug(f"Starting async operation: {operation_name}")
            result = await func(*args, **kwargs)
            self.logger.debug(f"Completed async operation: {operation_name}")
            return result
        except Exception as e:
            self.logger.error(f"Error in async {operation_name}: {str(e)}")
            raise
    
    def get_service_info(self) -> Dict[str, Any]:
        """Get basic service information"""
        return {
            "service_name": self.__class__.__name__,
            "has_db": self.db is not None
        }


class ServiceErrorHandler:
    """Centralized error handler for services"""
    
    def __init__(self, service_name: str):
        self.logger = logging.getLogger(service_name)
    
    def handle_operation(self, operation_name: str):
        """Decorator to handle errors in service operations"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    self.logger.error(f"Error in {operation_name}: {str(e)}")
                    raise
            return wrapper
        return decorator


def get_service_logger(service_name: str = None):
    """Get a logger for a service"""
    return logging.getLogger(service_name or __name__)


def log_service_operation(operation_name: str):
    """Decorator to log service operations"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = get_service_logger(func.__module__)
            try:
                logger.debug(f"Starting operation: {operation_name}")
                result = func(*args, **kwargs)
                logger.debug(f"Completed operation: {operation_name}")
                return result
            except Exception as e:
                logger.error(f"Error in {operation_name}: {str(e)}")
                raise
        return wrapper
    return decorator