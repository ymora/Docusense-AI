# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/services/base_service.py
# Fonctions extraites: 4
# Lignes totales extraites: 44
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: log_operation
# Lignes originales: 20-34
# =============================================================================

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


# =============================================================================
# FONCTION: get_service_info
# Lignes originales: 58-63
# =============================================================================

    def get_service_info(self) -> Dict[str, Any]:
        """Get basic service information"""
        return {
            "service_name": self.__class__.__name__,
            "has_db": self.db is not None
        }


# =============================================================================
# FONCTION: decorator
# Lignes originales: 93-105
# =============================================================================

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


# =============================================================================
# FONCTION: wrapper
# Lignes originales: 95-104
# =============================================================================

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

