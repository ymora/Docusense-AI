"""
Simple logging middleware that avoids infinite loops
"""

from fastapi import Request, Response
from fastapi.responses import JSONResponse
import time
import json
from datetime import datetime
from typing import Dict, Any
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleLoggingMiddleware:
    def __init__(self, app):
        self.app = app
        # Cache pour éviter les logs répétitifs
        self.log_cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 60  # 60 secondes de cache
        
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        start_time = time.time()
        
        # Créer une clé unique pour cette requête
        request_key = f"{request.method}:{request.url.path}"
        
        # Vérifier si on a déjà loggé cette requête récemment
        current_time = time.time()
        if request_key in self.log_cache:
            last_log = self.log_cache[request_key]
            if current_time - last_log["timestamp"] < self.cache_ttl:
                # Ne pas logger si c'est trop récent
                await self.app(scope, receive, send)
                return
        
        # Extraire les informations de base
        user_agent = request.headers.get("user-agent", "Unknown")
        client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "Unknown")
        
        # Filtrer les requêtes de santé et les requêtes fréquentes
        if self._should_skip_logging(request):
            await self.app(scope, receive, send)
            return
        
        # Log de début (seulement pour les requêtes importantes)
        if self._is_important_request(request):
            logger.info(f"🚀 {request.method} {request.url.path} - IP: {client_ip}")
        
        # Traiter la requête
        try:
            await self.app(scope, receive, send)
            end_time = time.time()
            response_time = end_time - start_time
            
            # Mettre en cache cette requête
            self.log_cache[request_key] = {
                "timestamp": current_time,
                "count": self.log_cache.get(request_key, {}).get("count", 0) + 1
            }
            
            # Log de fin seulement pour les requêtes importantes ou les erreurs
            if self._is_important_request(request) or response_time > 1.0:
                logger.info(f"✅ {request.method} {request.url.path} - {response_time:.3f}s")
                
        except Exception as e:
            end_time = time.time()
            response_time = end_time - start_time
            logger.error(f"❌ {request.method} {request.url.path} - Erreur: {str(e)} - {response_time:.3f}s")
            raise
    
    def _should_skip_logging(self, request: Request) -> bool:
        """Détermine si on doit ignorer le logging pour cette requête"""
        # Ignorer les requêtes de santé
        if request.url.path == "/api/health/":
            return True
        
        # Ignorer les requêtes de fichiers fréquentes
        if request.url.path.startswith("/api/files/") and request.method == "GET":
            return True
            
        # Ignorer les requêtes de cache
        if request.url.path.startswith("/api/cache/"):
            return True
            
        return False
    
    def _is_important_request(self, request: Request) -> bool:
        """Détermine si c'est une requête importante à logger"""
        # Les requêtes d'authentification
        if request.url.path.startswith("/api/auth/"):
            return True
            
        # Les requêtes d'analyse
        if request.url.path.startswith("/api/analyses/"):
            return True
            
        # Les requêtes de configuration
        if request.url.path.startswith("/api/config/"):
            return True
            
        # Les requêtes POST/PUT/DELETE
        if request.method in ["POST", "PUT", "DELETE"]:
            return True
            
        return False
