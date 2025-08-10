"""
Logging configuration for DocuSense AI
"""

import logging
import logging.handlers
import os
from pathlib import Path
from typing import Optional


# SUPPRIMÉ: setup_logging() - Fonction morte, remplacée par core/logging.py
# SUPPRIMÉ: trace_function() - Fonction morte, non utilisée

def get_logger(name: str) -> logging.Logger:
    """Get logger instance with given name"""
    return logging.getLogger(name)


def debug(obj, label: str = '') -> None:
    """Debug function with formatted output"""
    logger = get_logger('debug')
    output = f"🧪 DEBUG {label}:\n{obj}"
    logger.debug(output) 