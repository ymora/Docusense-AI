"""
Logging configuration for DocuSense AI
"""

import logging
import sys
from pathlib import Path
from .config import settings


def setup_logging():
    """Setup logging configuration"""

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Configure logging
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

    # Set specific loggers
    loggers = [
        "uvicorn",
        "uvicorn.error",
        "fastapi",
        "sqlalchemy",
        "httpx",
        "openai",
        "anthropic",
        "mistralai"
    ]

    for logger_name in loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.WARNING)

    # Set our app logger
    app_logger = logging.getLogger("docusense")
    app_logger.setLevel(getattr(logging, settings.log_level.upper()))

    logger.info("Logging configured successfully")
