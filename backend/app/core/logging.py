"""
Logging configuration for DocuSense AI
"""

import logging
import sys
from pathlib import Path
from .config import settings


# Variables globales pour éviter les logs répétitifs
_logging_initialized = False

def setup_logging():
    """Setup logging configuration optimisée"""
    global _logging_initialized
    
    # Éviter la réinitialisation multiple
    if _logging_initialized:
        return

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

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
            logging.FileHandler(log_dir / "docusense_error.log")
        ]
    )

    # Réduire le niveau de log pour les modules externes (ERROR au lieu de WARNING)
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
        logger.setLevel(logging.ERROR)  # Changé de WARNING à ERROR

    # Set our app logger
    app_logger = logging.getLogger("docusense")
    app_logger.setLevel(getattr(logging, settings.log_level.upper()))

    _logging_initialized = True
    logger.info("Logging optimisé configuré")
