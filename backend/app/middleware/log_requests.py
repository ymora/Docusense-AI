"""
Middleware de logging pour capturer toutes les requêtes et erreurs
"""

import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # OPTIMISATION: Log seulement les erreurs et les requêtes importantes
            process_time = time.time() - start_time
            
            # OPTIMISATION: Seuil réduit pour détecter les requêtes lentes plus tôt
            # Log seulement si c'est une erreur ou une requête lente (> 0.5s au lieu de 1s)
            if response.status_code >= 400 or process_time > 0.5:
                # OPTIMISATION: Log plus détaillé pour les requêtes lentes
                if process_time > 0.5:
                    logger.warning(f"SLOW REQUEST - {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
                else:
                    logger.error(f"ERROR REQUEST - {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
            
            return response
            
        except Exception as e:
            # Log des exceptions non gérées
            process_time = time.time() - start_time
            logger.error(f"REQUEST EXCEPTION - {request.method} {request.url.path} - Error: {str(e)} - Time: {process_time:.3f}s")
            raise 