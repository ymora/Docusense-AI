"""
Logging middleware for automatic request/response logging and security monitoring
"""

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from typing import Callable, Optional
import time
import json
from datetime import datetime

from app.models.system_log import LogLevel
from app.services.system_log_service import SystemLogService
from app.core.database import get_db
from app.core.logging import get_logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests and detect security events"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.logger = get_logger(__name__)
        # Paths to exclude from logging (health checks, static files)
        self.excluded_paths = {
            "/api/health/", "/health", "/favicon.ico", "/robots.txt"
        }
        # Paths that are security-sensitive
        self.security_paths = {
            "/api/auth/", "/api/admin/", "/api/config/", "/api/logs/"
        }
        
        # NOUVEAU: Configuration de logging adaptatif selon le type d'utilisateur
        self.user_logging_config = {
            "guest": {
                "level": "CRITICAL",  # AUCUN LOG
                "log_requests": False,
                "log_errors": False,
                "max_logs_per_second": 0,  # AUCUN LOG
                "allowed_modules": set(),
                "allowed_levels": set()
            },
            "user": {
                "level": "ERROR",     # Seulement erreurs critiques
                "log_requests": False,
                "log_errors": True,
                "max_logs_per_second": 50,  # Limité
                "allowed_modules": {"auth", "security", "admin"},
                "allowed_levels": {"ERROR", "CRITICAL"}
            },
            "admin": {
                "level": "DEBUG",     # Logs complets
                "log_requests": True,
                "log_errors": True,
                "max_logs_per_second": 500,  # Élevé
                "allowed_modules": set(),  # Tous les modules
                "allowed_levels": {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
            }
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log relevant information"""
        start_time = time.time()
        
        # NOUVEAU: Détecter le type d'utilisateur automatiquement
        user_type = self._detect_user_type(request)
        
        # NOUVEAU: Configurer les filtres selon le type d'utilisateur
        self._configure_logging_filters(user_type)
        
        # Skip logging for excluded paths
        if request.url.path in self.excluded_paths:
            return await call_next(request)
        
        # Get database session
        db = next(get_db())
        log_service = SystemLogService(db)
        
        # Extract request information
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")
        method = request.method
        path = request.url.path
        
        # Try to get current user
        current_user = None
        user_id = None
        try:
            # Import différé pour éviter l'importation circulaire
            from app.middleware.auth_middleware import get_current_user_from_request
            current_user = await get_current_user_from_request(request, db)
            user_id = current_user.id if current_user else None
        except:
            # User not authenticated or error getting user
            pass
        
        # Prepare request details
        request_details = {
            'method': method,
            'path': path,
            'query_params': str(request.query_params),
            'user_agent': user_agent,
            'content_type': request.headers.get("Content-Type", ""),
            'referer': request.headers.get("Referer", "")
        }
        
        # Process the request
        response = None
        error_occurred = False
        
        try:
            response = await call_next(request)
        except Exception as e:
            error_occurred = True
            self.logger.error(f"Request error: {str(e)}")
            
            # Log the error (sans await pour éviter les blocages)
            try:
                self._log_event_sync(
                    log_service=log_service,
                    level=LogLevel.ERROR,
                    action="request_error",
                    details={
                        **request_details,
                        'error': str(e),
                        'error_type': type(e).__name__
                    },
                    user_id=user_id,
                    ip_address=client_ip,
                    user_agent=user_agent
                )
            except Exception as log_error:
                self.logger.error(f"Failed to log error: {str(log_error)}")
            
            # Return error response
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )
        
        # Calculate response time
        process_time = time.time() - start_time
        response_details = {
            **request_details,
            'status_code': response.status_code,
            'response_time': round(process_time, 3)
        }
        
        # Determine log level and action based on response
        log_level, action = self._determine_log_level_and_action(
            method, path, response.status_code, current_user
        )
        
        # Log the request if it's significant
        if self._should_log_request(method, path, response.status_code, user_type):
            await self._log_event(
                log_service=log_service,
                level=log_level,
                action=action,
                details=response_details,
                user_id=user_id,
                ip_address=client_ip,
                user_agent=user_agent,
                request=request
            )
        
        # Close database session
        db.close()
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, handling proxies"""
        # Check for forwarded headers first
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to client host
        return request.client.host if request.client else "unknown"
    
    def _determine_log_level_and_action(
        self, 
        method: str, 
        path: str, 
        status_code: int,
        user: Optional[object] = None
    ) -> tuple[LogLevel, str]:
        """Determine appropriate log level and action based on request"""
        
        # Error responses
        if status_code >= 500:
            return LogLevel.ERROR, f"{method.lower()}_server_error"
        elif status_code >= 400:
            if status_code in [401, 403]:
                return LogLevel.SECURITY, f"{method.lower()}_unauthorized"
            else:
                return LogLevel.WARNING, f"{method.lower()}_client_error"
        
        # Security-sensitive paths
        if any(sec_path in path for sec_path in self.security_paths):
            return LogLevel.SECURITY, f"{method.lower()}_security_endpoint"
        
        # Authentication-related
        if "/auth/" in path:
            if status_code == 200:
                return LogLevel.INFO, f"{method.lower()}_auth_success"
            else:
                return LogLevel.SECURITY, f"{method.lower()}_auth_failure"
        
        # Admin actions
        if "/admin/" in path and user and hasattr(user, 'is_admin') and user.is_admin:
            return LogLevel.INFO, f"{method.lower()}_admin_action"
        
        # Regular successful requests
        if status_code < 400:
            return LogLevel.INFO, f"{method.lower()}_request"
        
        return LogLevel.INFO, f"{method.lower()}_request"
    
    def _detect_user_type(self, request: Request) -> str:
        """
        Détecter automatiquement le type d'utilisateur
        """
        try:
            # Vérifier les headers d'authentification
            auth_header = request.headers.get("authorization", "")
            
            if not auth_header:
                return "guest"  # Pas d'authentification = invité
            
            # Vérifier si c'est un token admin (à implémenter selon votre logique)
            # Pour l'instant, on considère tous les utilisateurs authentifiés comme "user"
            # Les admins seront détectés via leur rôle dans la base de données
            
            return "user"  # Utilisateur authentifié
            
        except Exception:
            return "guest"  # En cas d'erreur, considérer comme invité

    def _configure_logging_filters(self, user_type: str):
        """
        Configurer les filtres de logging selon le type d'utilisateur
        """
        from app.core.logging import setup_adaptive_logging
        from app.core.config import settings
        
        # Obtenir la configuration pour ce type d'utilisateur
        config = self.user_logging_config.get(user_type, self.user_logging_config["guest"])
        
        # Configurer les filtres avec les paramètres appropriés
        max_logs_per_second = getattr(settings, f"{user_type}_max_logs_per_second", config["max_logs_per_second"])
        
        # Appliquer la configuration
        setup_adaptive_logging(
            user_type=user_type,
            max_logs_per_second=max_logs_per_second
        )

    def _should_log_request(self, method: str, path: str, status_code: int, user_type: str = "user") -> bool:
        """Determine if request should be logged based on user type"""
        
        # Configuration selon le type d'utilisateur
        config = self.user_logging_config.get(user_type, self.user_logging_config["guest"])
        
        # Si l'utilisateur n'a pas de logging activé
        if not config["log_requests"]:
            return False
        
        # Always log errors (4xx and 5xx)
        if status_code >= 400:
            return True
        
        # Always log security-sensitive paths
        if any(sec_path in path for sec_path in self.security_paths):
            return True
        
        # Log critical data modifications (DELETE, PATCH)
        if method in ["DELETE", "PATCH"]:
            return True
        
        # By default, skip logging for other requests (GET, POST, PUT) to reduce noise
        return False
    
    def _log_event_sync(
        self,
        log_service: SystemLogService,
        level: LogLevel,
        action: str,
        details: dict,
        user_id: Optional[int],
        ip_address: str,
        user_agent: str
    ):
        """Log an event synchronously to avoid blocking"""
        try:
            log_service.log_event(
                level=level,
                source="http_middleware",
                action=action,
                details=details,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                request=None  # Éviter les problèmes de sérialisation
            )
        except Exception as e:
            # Don't let logging errors break the request
            self.logger.error(f"Failed to log event: {str(e)}")

    async def _log_event(
        self,
        log_service: SystemLogService,
        level: LogLevel,
        action: str,
        details: dict,
        user_id: Optional[int],
        ip_address: str,
        user_agent: str,
        request: Request
    ):
        """Log an event asynchronously"""
        try:
            log_service.log_event(
                level=level,
                source="http_middleware",
                action=action,
                details=details,
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                request=request
            )
        except Exception as e:
            # Don't let logging errors break the request
            self.logger.error(f"Failed to log event: {str(e)}")


class SecurityEventDetector:
    """Helper class for detecting security events in requests"""
    
    @staticmethod
    def detect_sql_injection(query_string: str) -> bool:
        """Detect potential SQL injection attempts"""
        sql_patterns = [
            r"union\s+select", r"drop\s+table", r"delete\s+from",
            r"insert\s+into", r"update\s+set", r"exec\s*\(",
            r"xp_cmdshell", r"sp_executesql"
        ]
        
        query_lower = query_string.lower()
        return any(pattern in query_lower for pattern in sql_patterns)
    
    @staticmethod
    def detect_xss_attempt(input_string: str) -> bool:
        """Detect potential XSS attempts"""
        xss_patterns = [
            r"<script", r"javascript:", r"onload=", r"onerror=",
            r"eval\s*\(", r"document\.cookie", r"alert\s*\("
        ]
        
        input_lower = input_string.lower()
        return any(pattern in input_lower for pattern in xss_patterns)
    
    @staticmethod
    def detect_path_traversal(path: str) -> bool:
        """Detect path traversal attempts"""
        traversal_patterns = [
            r"\.\.\/", r"\.\.\\", r"%2e%2e%2f", r"%2e%2e%5c"
        ]
        
        return any(pattern in path.lower() for pattern in traversal_patterns)
