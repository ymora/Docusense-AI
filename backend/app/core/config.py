"""
Configuration settings for DocuSense AI
"""

import os
import secrets
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    """Application settings"""

    # Application
    app_name: str = "DocuSense AI"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")

    # Server
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    reload: bool = Field(default=False, env="RELOAD")  # OPTIMISATION: Désactivé par défaut pour éviter les boucles

    # Database
    database_url: str = Field(
        default="sqlite:///./docusense.db",
        env="DATABASE_URL"
    )

    # Security - OPTIMISATION: Valeurs par défaut plus sécurisées
    secret_key: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        env="SECRET_KEY"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS - OPTIMISATION: Configuration plus restrictive
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3002",
            "http://localhost:3003",
            "http://127.0.0.1:3003"],
        env="CORS_ORIGINS")
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"]
    cors_allow_headers: List[str] = ["*"]

    # Rate Limiting - NOUVEAU: Protection contre les attaques
    rate_limit_enabled: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(
        default=60, env="RATE_LIMIT_WINDOW")  # seconds

    # AI Providers - NOUVEAU: Chargement depuis la base de données au démarrage
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(
        default=None, env="ANTHROPIC_API_KEY")
    mistral_api_key: Optional[str] = Field(default=None, env="MISTRAL_API_KEY")
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        env="OLLAMA_BASE_URL"
    )

    # Redis (optional)
    redis_url: Optional[str] = Field(default=None, env="REDIS_URL")

    # Logging
    log_level: str = Field(default="WARNING", env="LOG_LEVEL")  # OPTIMISATION: Réduit de INFO à WARNING
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # File Processing
    max_file_size: int = Field(
        default=100 * 1024 * 1024,
        env="MAX_FILE_SIZE")  # 100MB

    # OCR
    ocr_enabled: bool = Field(default=True, env="OCR_ENABLED")
    tesseract_cmd: Optional[str] = Field(default=None, env="TESSERACT_CMD")

    # Queue
    max_concurrent_analyses: int = Field(
        default=3, env="MAX_CONCURRENT_ANALYSES")
    queue_poll_interval: int = Field(default=5, env="QUEUE_POLL_INTERVAL")  # OPTIMISATION: Augmenté de 2s à 5s

    # Cache
    cache_enabled: bool = Field(default=True, env="CACHE_ENABLED")
    cache_ttl: int = Field(default=3600, env="CACHE_TTL")  # 1 hour

    # Performance - NOUVEAU: Optimisations de performance
    compression_enabled: bool = Field(default=True, env="COMPRESSION_ENABLED")
    gzip_min_size: int = Field(default=500, env="GZIP_MIN_SIZE")  # bytes
    static_files_cache_ttl: int = Field(
        default=86400, env="STATIC_FILES_CACHE_TTL")  # 24 hours

    # Monitoring - NOUVEAU: Observabilité
    metrics_enabled: bool = Field(default=False, env="METRICS_ENABLED")  # OPTIMISATION: Désactivé par défaut
    health_check_interval: int = Field(
        default=60, env="HEALTH_CHECK_INTERVAL")  # OPTIMISATION: Augmenté à 60s

    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    @validator('secret_key')
    def validate_secret_key(cls, v):
        """Validate secret key length"""
        if len(v) < 32:
            raise ValueError('Secret key must be at least 32 characters long')
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False


# Create settings instance
settings = Settings()

# Ensure directories exist


def ensure_directories():
    """Ensure required directories exist"""
    # Les analyses sont maintenant stockées en base de données
    # Plus besoin de répertoires physiques
    pass


def load_api_keys_from_database():
    """
    Charge les clés API depuis la base de données au démarrage
    pour assurer la persistance entre les redémarrages
    """
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from ..models.config import Config
        
        # Créer une session temporaire pour charger les clés
        engine = create_engine(settings.database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Charger les clés API depuis la base de données
            api_keys = {
                'openai_api_key': db.query(Config).filter(Config.key == 'openai_api_key').first(),
                'anthropic_api_key': db.query(Config).filter(Config.key == 'anthropic_api_key').first(),
                'mistral_api_key': db.query(Config).filter(Config.key == 'mistral_api_key').first(),
                'gemini_api_key': db.query(Config).filter(Config.key == 'gemini_api_key').first(),
            }
            
            # Mettre à jour les settings avec les clés de la base de données
            for key_name, config in api_keys.items():
                if config and config.value:
                    setattr(settings, key_name, config.value)
                    
        finally:
            db.close()
            
    except Exception as e:
        # En cas d'erreur, continuer avec les valeurs par défaut
        pass


# Initialize directories
ensure_directories()

# Load API keys from database at startup
load_api_keys_from_database()
