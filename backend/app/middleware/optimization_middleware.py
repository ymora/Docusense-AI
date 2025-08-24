"""
Middleware d'optimisation pour DocuSense AI
Intègre les optimisations de performance dans l'application
"""

import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import StreamingResponse

from app.core.optimization import performance_optimizer, cache_optimizer

logger = logging.getLogger(__name__)


class OptimizationMiddleware(BaseHTTPMiddleware):
    """Middleware d'optimisation pour améliorer les performances"""
    
    def __init__(self, app, enable_cache: bool = True, enable_metrics: bool = True):
        super().__init__(app)
        self.enable_cache = enable_cache
        self.enable_metrics = enable_metrics
        self.cache_hits = 0
        self.cache_misses = 0
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Traite la requête avec optimisations"""
        start_time = time.time()
        
        # Générer une clé de cache pour les requêtes GET
        cache_key = None
        if self.enable_cache and request.method == "GET":
            cache_key = self._generate_cache_key(request)
            cached_response = cache_optimizer.get(cache_key)
            if cached_response:
                self.cache_hits += 1
                return cached_response
        
        if cache_key:
            self.cache_misses += 1
        
        # Traiter la requête
        try:
            response = await call_next(request)
            
            # Mettre en cache les réponses GET réussies
            if (self.enable_cache and 
                request.method == "GET" and 
                response.status_code == 200 and 
                cache_key):
                
                # Vérifier si la réponse peut être mise en cache
                if self._is_cacheable_response(response):
                    cache_optimizer.set(cache_key, response)
            
            # Mettre à jour les métriques
            if self.enable_metrics:
                response_time = time.time() - start_time
                performance_optimizer.update_metrics(response_time)
                
                # Ajouter les métriques dans les headers
                response.headers["X-Response-Time"] = f"{response_time:.3f}s"
                response.headers["X-Cache-Hit"] = str(self.cache_hits)
                response.headers["X-Cache-Miss"] = str(self.cache_misses)
            
            # Optimisation mémoire si nécessaire
            if performance_optimizer.should_optimize_memory():
                performance_optimizer.cleanup_memory()
            
            return response
            
        except Exception as e:
            # Gestion d'erreur avec métriques
            if self.enable_metrics:
                response_time = time.time() - start_time
                performance_optimizer.update_metrics(response_time)
            
            logger.error(f"Erreur dans le middleware d'optimisation: {e}")
            raise
    
    def _generate_cache_key(self, request: Request) -> str:
        """Génère une clé de cache unique pour la requête"""
        # Inclure l'URL, les paramètres de requête et les headers importants
        key_parts = [
            request.url.path,
            str(sorted(request.query_params.items())),
            request.headers.get("authorization", ""),
            request.headers.get("accept", "")
        ]
        return f"cache:{hash('|'.join(key_parts))}"
    
    def _is_cacheable_response(self, response: Response) -> bool:
        """Détermine si une réponse peut être mise en cache"""
        # Ne pas mettre en cache les réponses avec certains headers
        non_cacheable_headers = {
            "cache-control", "pragma", "expires", "set-cookie"
        }
        
        for header in non_cacheable_headers:
            if header in response.headers:
                return False
        
        # Ne pas mettre en cache les réponses de streaming
        if isinstance(response, StreamingResponse):
            return False
        
        return True
    
    def get_cache_stats(self) -> dict:
        """Récupère les statistiques du cache"""
        total_requests = self.cache_hits + self.cache_misses
        hit_rate = (self.cache_hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "hit_rate_percent": hit_rate,
            "total_requests": total_requests
        }


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware de monitoring des performances"""
    
    def __init__(self, app, alert_threshold_ms: int = 5000):
        super().__init__(app)
        self.alert_threshold_ms = alert_threshold_ms
        self.slow_requests = 0
        self.total_requests = 0
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Traite la requête avec monitoring"""
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # Calculer le temps de réponse
            response_time = time.time() - start_time
            response_time_ms = response_time * 1000
            
            # Mettre à jour les statistiques
            self.total_requests += 1
            
            # Détecter les requêtes lentes
            if response_time_ms > self.alert_threshold_ms:
                self.slow_requests += 1
                logger.warning(
                    f"Requête lente détectée: {request.method} {request.url.path} "
                    f"({response_time_ms:.2f}ms)"
                )
            
            # Ajouter les métriques dans les headers
            response.headers["X-Response-Time-MS"] = f"{response_time_ms:.2f}"
            response.headers["X-Slow-Requests"] = str(self.slow_requests)
            response.headers["X-Total-Requests"] = str(self.total_requests)
            
            return response
            
        except Exception as e:
            response_time = time.time() - start_time
            logger.error(
                f"Erreur dans la requête {request.method} {request.url.path}: "
                f"{e} (après {response_time:.3f}s)"
            )
            raise
    
    def get_performance_stats(self) -> dict:
        """Récupère les statistiques de performance"""
        slow_rate = (self.slow_requests / self.total_requests * 100) if self.total_requests > 0 else 0
        
        return {
            "total_requests": self.total_requests,
            "slow_requests": self.slow_requests,
            "slow_request_rate_percent": slow_rate,
            "alert_threshold_ms": self.alert_threshold_ms
        }


class ResourceOptimizationMiddleware(BaseHTTPMiddleware):
    """Middleware d'optimisation des ressources"""
    
    def __init__(self, app, max_request_size_mb: int = 100):
        super().__init__(app)
        self.max_request_size_mb = max_request_size_mb
        self.max_request_size_bytes = max_request_size_mb * 1024 * 1024
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Traite la requête avec optimisation des ressources"""
        
        # Vérifier la taille de la requête
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                if size > self.max_request_size_bytes:
                    logger.warning(
                        f"Requête trop volumineuse rejetée: {size / 1024 / 1024:.2f}MB "
                        f"(limite: {self.max_request_size_mb}MB)"
                    )
                    from fastapi import HTTPException
                    raise HTTPException(
                        status_code=413,
                        detail=f"Fichier trop volumineux. Taille maximale: {self.max_request_size_mb}MB"
                    )
            except ValueError:
                pass
        
        # Vérifier l'utilisation mémoire
        if performance_optimizer.should_optimize_memory():
            logger.info("Optimisation mémoire automatique déclenchée")
            performance_optimizer.cleanup_memory()
        
        # Traiter la requête
        response = await call_next(request)
        
        # Ajouter les headers d'optimisation
        response.headers["X-Max-Request-Size-MB"] = str(self.max_request_size_mb)
        
        return response


# Instances globales
optimization_middleware = OptimizationMiddleware
performance_monitoring_middleware = PerformanceMonitoringMiddleware
resource_optimization_middleware = ResourceOptimizationMiddleware
