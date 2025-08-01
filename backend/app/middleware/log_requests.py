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
            return response
            
        except Exception as e:
            # Log des exceptions non gérées
            process_time = time.time() - start_time
            logger.error(f"REQUEST EXCEPTION - {request.method} {request.url.path} - Error: {str(e)} - Time: {process_time:.3f}s")
            raise 