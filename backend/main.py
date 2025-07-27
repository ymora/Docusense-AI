"""
Main entry point for DocuSense AI
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import create_tables, check_database_connection
from app.core.logging import setup_logging
from app.services.config_service import ConfigService
from app.services.queue_service import QueueService
from app.api import (
    health_router,
    files_router,
    analysis_router,
    queue_router,
    config_router,
    prompts_router,
    auth_router,
    download_router
)

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Global queue service instance
queue_service = None

# Rate limiter - OPTIMISATION: Protection contre les attaques
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    """
    # Startup
    logger.info("Starting DocuSense AI...")
    
    try:
        # Create database tables
        create_tables()
        logger.info("Database tables created")
        
        # Check database connection
        if not check_database_connection():
            raise Exception("Database connection failed")
        logger.info("Database connection verified")
        
        # Initialize default configurations
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            config_service = ConfigService(db)
            config_service.initialize_default_configs()
            logger.info("Default configurations initialized")
        finally:
            db.close()
        
        # Start queue processing
        global queue_service
        db = SessionLocal()
        try:
            queue_service = QueueService(db)
            # Start queue processing in background
            asyncio.create_task(queue_service.start_processing())
            logger.info("Queue processing started")
        finally:
            db.close()
        
        logger.info("DocuSense AI started successfully")
        
    except Exception as e:
        logger.error(f"Failed to start DocuSense AI: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down DocuSense AI...")
    
    try:
        # Stop queue processing
        if queue_service:
            queue_service.stop_processing()
            logger.info("Queue processing stopped")
        
        logger.info("DocuSense AI shutdown complete")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Intelligent Document Analysis Platform",
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan
)

# OPTIMISATION: Middlewares de sécurité et performance
# Trusted Host middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["*"] if settings.debug else ["localhost", "127.0.0.1", "0.0.0.0"]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Compression middleware - OPTIMISATION: Réduction de la bande passante
if settings.compression_enabled:
    app.add_middleware(
        GZipMiddleware, 
        minimum_size=settings.gzip_min_size
    )

# Rate limiting - OPTIMISATION: Protection contre les attaques
if settings.rate_limit_enabled:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# OPTIMISATION: Middleware de monitoring des performances
@app.middleware("http")
async def performance_middleware(request: Request, call_next):
    start_time = time.time()
    
    # Add request ID for tracing
    request_id = f"req_{int(start_time * 1000)}"
    request.state.request_id = request_id
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Add performance headers
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Request-ID"] = request_id
    
    # Log slow requests
    if process_time > 1.0:  # Log requests taking more than 1 second
        logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")
    
    return response

# Add exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.error(f"Unhandled exception in request {request_id}: {str(exc)}")
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": request_id
        }
    )

# Include routers with API prefix
app.include_router(health_router, prefix="/api")
app.include_router(files_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(queue_router, prefix="/api")
app.include_router(config_router, prefix="/api")
app.include_router(prompts_router, prefix="/api")
# app.include_router(multimedia_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(download_router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "environment": settings.environment,
        "docs": "/docs",
        "health": "/api/health",
        "remote_access": "/remote"
    }

# Remote access endpoint
@app.get("/remote")
async def remote_access():
    """
    Interface d'accès distant
    """
    from fastapi.responses import FileResponse
    from pathlib import Path
    # Utiliser un chemin absolu depuis le répertoire backend
    html_path = Path(__file__).parent / "remote_access.html"
    return FileResponse(str(html_path))

# API info endpoint
@app.get("/api/info")
async def api_info():
    """
    API information endpoint
    """
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "debug": settings.debug,
        "database_url": settings.database_url.split("://")[0] + "://***",  # Hide sensitive info
        "cors_origins": settings.cors_origins,
        "max_file_size": settings.max_file_size,
        "ocr_enabled": settings.ocr_enabled,
        "cache_enabled": settings.cache_enabled,
        "compression_enabled": settings.compression_enabled,
        "rate_limit_enabled": settings.rate_limit_enabled,
        "max_concurrent_analyses": settings.max_concurrent_analyses
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower()
        # Configuration simplifiée pour éviter les erreurs
    ) 