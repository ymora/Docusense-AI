"""
Main application entry point for DocuSense AI
"""

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from contextlib import asynccontextmanager
import logging
import sys
import os
import time
from typing import Callable
import secrets

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import settings, load_api_keys_from_database
from app.core.database import engine, Base
from app.core.logging import setup_logging
from app.middleware.log_requests import LoggingMiddleware as OldLoggingMiddleware
from app.middleware.simple_logging_middleware import SimpleLoggingMiddleware
from app.api import (
    analysis_router, auth_router, config_router, download_router, emails_router, files_router, health_router, 
    monitoring_router, multimedia_router, prompts_router, video_converter_router, secure_streaming_router, pdf_files_router, logs_router, admin_router
)
from app.api.system_logs import router as system_logs_router
from app.api.database import router as database_router
from app.api.cache_monitoring import router as cache_monitoring_router

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# NOUVEAU: Charger les clés API depuis la base de données au démarrage
load_api_keys_from_database()

# Middleware de sécurité pour les en-têtes HTTP
class SecurityHeadersMiddleware:
    def __init__(self, app: FastAPI):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Ajouter des en-têtes de sécurité
            async def send_with_headers(message):
                if message["type"] == "http.response.start":
                    headers = list(message.get("headers", []))
                    # Ajouter les en-têtes de sécurité
                    security_headers = [
                        (b"X-Content-Type-Options", b"nosniff"),
                        (b"X-Frame-Options", b"DENY"),
                        (b"X-XSS-Protection", b"1; mode=block"),
                        (b"Referrer-Policy", b"strict-origin-when-cross-origin"),
                        (b"Content-Security-Policy", b"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"),
                        (b"Strict-Transport-Security", b"max-age=31536000; includeSubDomains"),
                        (b"Permissions-Policy", b"geolocation=(), microphone=(), camera=()"),
                    ]
                    headers.extend(security_headers)
                    message["headers"] = headers
                await send(message)
            
            await self.app(scope, receive, send_with_headers)
        else:
            await self.app(scope, receive, send)

# Middleware de rate limiting global
class RateLimitMiddleware:
    def __init__(self, app: FastAPI):
        self.app = app
        self.requests = {}
        self.max_requests = 100  # Requêtes par minute
        self.window = 60  # Secondes

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            client_ip = scope.get("client", ("unknown",))[0]
            current_time = time.time()
            
            # Nettoyer les anciennes entrées
            self.requests = {
                ip: (count, timestamp) 
                for ip, (count, timestamp) in self.requests.items()
                if current_time - timestamp < self.window
            }
            
            # Vérifier le rate limit
            if client_ip in self.requests:
                count, timestamp = self.requests[client_ip]
                if count >= self.max_requests:
                    # Rate limit dépassé - envoyer erreur 429
                    await send({
                        "type": "http.response.start",
                        "status": 429,
                        "headers": [(b"content-type", b"application/json")]
                    })
                    await send({
                        "type": "http.response.body",
                        "body": b'{"detail": "Rate limit exceeded"}'
                    })
                    return
            
            # Incrémenter le compteur
            if client_ip in self.requests:
                count, _ = self.requests[client_ip]
                self.requests[client_ip] = (count + 1, current_time)
            else:
                self.requests[client_ip] = (1, current_time)
        
        await self.app(scope, receive, send)

# Middleware de logging de sécurité
class SecurityLoggingMiddleware:
    def __init__(self, app: FastAPI):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            client_ip = scope.get("client", ("unknown",))[0]
            method = scope.get("method", "UNKNOWN")
            path = scope.get("path", "/")
            user_agent = dict(scope.get("headers", [])).get(b"user-agent", b"").decode("utf-8", errors="ignore")
            
            # Log des requêtes suspectes
            if any(suspicious in path.lower() for suspicious in ["/admin", "/config", "/system", "/debug"]):
                logger.warning(f"Requête suspecte: {method} {path} depuis {client_ip} - User-Agent: {user_agent}")
            
            # Log des erreurs 4xx/5xx
            async def send_with_logging(message):
                if message["type"] == "http.response.start":
                    status = message.get("status", 200)
                    if status >= 400:
                        logger.warning(f"Erreur HTTP {status}: {method} {path} depuis {client_ip}")
                await send(message)
            
            await self.app(scope, receive, send_with_logging)
        else:
            await self.app(scope, receive, send)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("[STARTUP] Starting DocuSense AI...")
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("[SUCCESS] Database tables created/verified")
    except Exception as e:
        logger.error(f"[ERROR] Database initialization failed: {str(e)}")
        raise
    
    # NOUVEAU: Migration automatique des clés API au démarrage
    try:
        from app.services.config_service import ConfigService
        from app.core.database import get_db
        
        # Créer une session temporaire pour la migration
        db = next(get_db())
        config_service = ConfigService(db)
        
        # Migration automatique des clés API
        logger.info("[MIGRATION] Migrating API keys to persistence system...")
        migrated_count = 0
        
        # Mapping des providers
        provider_mapping = {
            'openai': 'openai_api_key',
            'claude': 'anthropic_api_key',
            'anthropic': 'anthropic_api_key',
            'mistral': 'mistral_api_key'
        }
        
        # Vérifier et migrer chaque provider
        for provider, setting_attr in provider_mapping.items():
            # Vérifier si la clé existe dans les settings
            setting_value = getattr(settings, setting_attr, None)
            
            # Vérifier si la clé existe dans la base de données
            db_value = config_service.get_ai_provider_key(provider)
            
            # Si la clé existe dans les settings mais pas en base, la migrer
            if setting_value and not db_value:
                success = config_service.set_ai_provider_key(provider, setting_value)
                if success:
                    migrated_count += 1
                    logger.info(f"[SUCCESS] Migrated API key for {provider}")
            
            # Si la clé existe en base mais pas dans les settings, la restaurer
            elif db_value and not setting_value:
                config_service._save_api_key_to_settings(provider, db_value)
                migrated_count += 1
                logger.info(f"[SUCCESS] Restored API key for {provider}")
            
            # Si les deux existent mais sont différentes, priorité à la base
            elif setting_value and db_value and setting_value != db_value:
                config_service._save_api_key_to_settings(provider, db_value)
                migrated_count += 1
                logger.info(f"[SUCCESS] Synchronized API key for {provider}")
        
        if migrated_count > 0:
            logger.info(f"[SUCCESS] {migrated_count} API key(s) migrated/synchronized")
        else:
            logger.info("[SUCCESS] All API keys already synchronized")
        
        # Charger toutes les clés depuis la base de données
        config_service.load_api_keys_from_database()
        logger.info("[SUCCESS] API keys loaded from database")
        
    except Exception as e:
        logger.warning(f"[WARNING] Could not migrate API keys: {str(e)}")
    
    logger.info("[SUCCESS] DocuSense AI started successfully")
    
    yield
    
    # Shutdown
    logger.info("[SHUTDOWN] Shutting down DocuSense AI...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered document analysis and processing system",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

if settings.compression_enabled:
    app.add_middleware(GZipMiddleware, minimum_size=settings.gzip_min_size)

app.add_middleware(SimpleLoggingMiddleware)  # Middleware simplifié sans boucle
# Middlewares de sécurité temporairement désactivés pour debug
# app.add_middleware(SecurityHeadersMiddleware(app))
# app.add_middleware(RateLimitMiddleware(app))
# app.add_middleware(SecurityLoggingMiddleware(app))

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(files_router, prefix="/api/files", tags=["Files"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(config_router, prefix="/api/config", tags=["Configuration"])

app.include_router(health_router, prefix="/api/health", tags=["Health"])
app.include_router(monitoring_router, prefix="/api/monitoring", tags=["Monitoring"])
app.include_router(download_router, prefix="/api/download", tags=["Download"])
app.include_router(emails_router, prefix="/api/emails", tags=["Emails"])
app.include_router(multimedia_router, prefix="/api/multimedia", tags=["Multimedia"])
app.include_router(video_converter_router, prefix="/api/media", tags=["Media Converter"])
app.include_router(prompts_router, prefix="/api/prompts", tags=["Prompts"])
app.include_router(secure_streaming_router, prefix="/api/secure-streaming", tags=["Secure Streaming"])
app.include_router(pdf_files_router, prefix="/api/pdf-files", tags=["PDF Files"])
app.include_router(logs_router, prefix="/api/logs", tags=["Logs"])
app.include_router(system_logs_router, tags=["System Logs"])
app.include_router(database_router)
app.include_router(cache_monitoring_router)
app.include_router(admin_router, tags=["Admin"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name} v{settings.app_version}",
        "docs": "/docs",
        "health": "/api/health"
    }


# Endpoint de santé supprimé - utilisez /api/health/ à la place


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower()
    ) 