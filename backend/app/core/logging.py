"""
Logging configuration for DocuSense AI
"""

import logging
import sys
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from .config import settings

# Variables globales pour éviter les logs répétitifs
_logging_initialized = False
_frontend_loggers: List[callable] = []

class FrontendLogHandler(logging.Handler):
    """Handler pour envoyer les logs au frontend via SSE"""
    
    def __init__(self):
        super().__init__()
        self.log_buffer: List[Dict[str, Any]] = []
        self.max_buffer_size = 1000
    
    def emit(self, record):
        try:
            # Formater le log pour le frontend
            log_entry = {
                "id": f"backend_{datetime.now().timestamp()}_{id(record)}",
                "timestamp": datetime.now().isoformat(),
                "level": record.levelname.lower(),
                "source": record.name,
                "message": record.getMessage(),
                "details": {
                    "module": record.module,
                    "function": record.funcName,
                    "line": record.lineno,
                    "path": record.pathname
                }
            }
            
            # Ajouter les données d'exception si présentes
            if record.exc_info:
                log_entry["details"]["exception"] = {
                    "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                    "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                    "traceback": self.formatException(record.exc_info)
                }
            
            # Ajouter les données extra si présentes
            if hasattr(record, 'extra_data'):
                log_entry["details"]["extra"] = record.extra_data
            
            # Ajouter au buffer
            self.log_buffer.append(log_entry)
            
            # Limiter la taille du buffer
            if len(self.log_buffer) > self.max_buffer_size:
                self.log_buffer = self.log_buffer[-self.max_buffer_size:]
            
            # Notifier les listeners frontend
            self._notify_frontend(log_entry)
            
        except Exception as e:
            # Éviter les boucles infinies de logging
            sys.stderr.write(f"Erreur dans FrontendLogHandler: {e}\n")
    
    def _notify_frontend(self, log_entry: Dict[str, Any]):
        """Notifier les listeners frontend"""
        for callback in _frontend_loggers:
            try:
                callback(log_entry)
            except Exception as e:
                sys.stderr.write(f"Erreur callback frontend: {e}\n")
    
    def get_recent_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Récupérer les logs récents"""
        return self.log_buffer[-limit:]

def register_frontend_logger(callback: callable):
    """Enregistrer un callback pour recevoir les logs frontend"""
    _frontend_loggers.append(callback)

def unregister_frontend_logger(callback: callable):
    """Désenregistrer un callback"""
    if callback in _frontend_loggers:
        _frontend_loggers.remove(callback)

def setup_logging():
    """Setup logging configuration optimisée avec catégorisation"""
    global _logging_initialized
    
    # Éviter la réinitialisation multiple
    if _logging_initialized:
        return

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Handler pour le frontend
    frontend_handler = FrontendLogHandler()
    frontend_handler.setLevel(logging.DEBUG)

    # Configure logging avec niveau réduit pour les modules externes
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format=settings.log_format,
        handlers=[
            # Console handler
            logging.StreamHandler(sys.stdout),
            # File handler
            logging.FileHandler(log_dir / "docusense.log"),
            # Error file handler
            logging.FileHandler(log_dir / "docusense_error.log"),
            # Frontend handler
            frontend_handler
        ]
    )

    # Réduire le niveau de log pour les modules externes
    external_loggers = [
        "uvicorn",
        "uvicorn.error",
        "fastapi",
        "sqlalchemy",
        "httpx",
        "openai",
        "anthropic",
        "mistralai"
    ]

    for logger_name in external_loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.ERROR)

    # Set our app logger
    app_logger = logging.getLogger("docusense")
    app_logger.setLevel(getattr(logging, settings.log_level.upper()))

    _logging_initialized = True
    logger.info("Logging optimisé configuré avec catégorisation")

def get_logger(name: str) -> logging.Logger:
    """Obtenir un logger avec le nom spécifié"""
    return logging.getLogger(f"docusense.{name}")

def log_with_context(logger: logging.Logger, level: str, message: str, context: Dict[str, Any] = None, exception: Exception = None):
    """Logger avec contexte structuré"""
    extra_data = {
        "context": context or {},
        "timestamp": datetime.now().isoformat()
    }
    
    if exception:
        extra_data["exception"] = {
            "type": type(exception).__name__,
            "message": str(exception),
            "traceback": str(exception.__traceback__)
        }
    
    # Ajouter les données extra au record
    record = logger.makeRecord(
        logger.name, 
        getattr(logging, level.upper()), 
        "", 
        0, 
        message, 
        (), 
        None
    )
    record.extra_data = extra_data
    
    logger.handle(record)

# Logger principal
logger = get_logger("core")
