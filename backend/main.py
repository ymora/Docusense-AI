"""
Main application entry point for DocuSense AI
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import settings, load_api_keys_from_database
from app.core.database import engine, Base
from app.core.logging import setup_logging
from app.middleware.log_requests import LoggingMiddleware as OldLoggingMiddleware
from app.middleware.logging_middleware import LoggingMiddleware
from app.api import (
    analysis_router, auth_router, config_router, download_router, emails_router, files_router, health_router, 
    monitoring_router, multimedia_router, prompts_router, video_converter_router, secure_streaming_router, pdf_files_router, logs_router, streams_router, admin_router
)
from app.api.reference_documents import router as reference_documents_router
from app.api.system_logs import router as system_logs_router
from app.api.database import router as database_router
from app.api.audit import router as audit_router

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# NOUVEAU: Charger les clés API depuis la base de données au démarrage
load_api_keys_from_database()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
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
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
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
                    # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            # Si la clé existe en base mais pas dans les settings, la restaurer
            elif db_value and not setting_value:
                config_service._save_api_key_to_settings(provider, db_value)
                migrated_count += 1
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            # Si les deux existent mais sont différentes, priorité à la base
            elif setting_value and db_value and setting_value != db_value:
                config_service._save_api_key_to_settings(provider, db_value)
                migrated_count += 1
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        
        # Charger toutes les clés depuis la base de données
        config_service.load_api_keys_from_database()
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        
    except Exception as e:
        logger.warning(f"[WARNING] Could not migrate API keys: {str(e)}")
    
    # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
    
    yield
    
    # Shutdown
    # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge


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

app.add_middleware(LoggingMiddleware)

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
app.include_router(streams_router, prefix="/api/streams", tags=["Streams"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(reference_documents_router, tags=["Reference Documents"])
app.include_router(system_logs_router, tags=["System Logs"])
app.include_router(database_router)
app.include_router(audit_router)


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