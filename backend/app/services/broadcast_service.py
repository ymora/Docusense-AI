"""
Service de diffusion des événements SSE
Évite les imports circulaires entre auth_service et streams
"""

import asyncio
import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Référence vers les fonctions de broadcast (sera définie après l'import)
_broadcast_functions = {}

def set_broadcast_functions(functions: Dict[str, callable]):
    """Définir les fonctions de broadcast depuis streams.py"""
    global _broadcast_functions
    _broadcast_functions = functions

async def broadcast_user_management_event(event_type: str, user_data: Dict[str, Any]):
    """Diffuser un événement de gestion d'utilisateur"""
    try:
        if 'broadcast_user_management_event' in _broadcast_functions:
            await _broadcast_functions['broadcast_user_management_event'](event_type, user_data)
        else:
            logger.warning("Fonction broadcast_user_management_event non disponible")
    except Exception as e:
        logger.warning(f"Impossible de diffuser l'événement de gestion d'utilisateur: {e}")

async def broadcast_system_metrics_update(metrics_data: Dict[str, Any]):
    """Diffuser une mise à jour des métriques système"""
    try:
        if 'broadcast_system_metrics_update' in _broadcast_functions:
            await _broadcast_functions['broadcast_system_metrics_update'](metrics_data)
        else:
            logger.warning("Fonction broadcast_system_metrics_update non disponible")
    except Exception as e:
        logger.warning(f"Impossible de diffuser les métriques système: {e}")
