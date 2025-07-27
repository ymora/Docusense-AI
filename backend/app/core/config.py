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
    reload: bool = Field(default=True, env="RELOAD")

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
            "http://localhost:3002",
            "http://localhost:3003",
            "http://127.0.0.1:3003"],
        env="CORS_ORIGINS")
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_allow_headers: List[str] = ["*"]

    # Rate Limiting - NOUVEAU: Protection contre les attaques
    rate_limit_enabled: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(
        default=60, env="RATE_LIMIT_WINDOW")  # seconds

    # AI Providers
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(
        default=None, env="ANTHROPIC_API_KEY")
    mistral_api_key: Optional[str] = Field(default=None, env="MISTRAL_API_KEY")
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        env="OLLAMA_BASE_URL"
    )

    # Redis (optional)
    redis_url: Optional[str] = Field(default=None, env="REDIS_URL")

    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # File Processing
    max_file_size: int = Field(
        default=100 * 1024 * 1024,
        env="MAX_FILE_SIZE")  # 100MB
    analyses_dir: str = Field(default="./Analyses", env="ANALYSES_DIR")

    # OCR
    ocr_enabled: bool = Field(default=True, env="OCR_ENABLED")
    tesseract_cmd: Optional[str] = Field(default=None, env="TESSERACT_CMD")

    # Queue
    max_concurrent_analyses: int = Field(
        default=3, env="MAX_CONCURRENT_ANALYSES")
    queue_poll_interval: int = Field(default=2, env="QUEUE_POLL_INTERVAL")

    # Cache
    cache_enabled: bool = Field(default=True, env="CACHE_ENABLED")
    cache_ttl: int = Field(default=3600, env="CACHE_TTL")  # 1 hour

    # Performance - NOUVEAU: Optimisations de performance
    compression_enabled: bool = Field(default=True, env="COMPRESSION_ENABLED")
    gzip_min_size: int = Field(default=500, env="GZIP_MIN_SIZE")  # bytes
    static_files_cache_ttl: int = Field(
        default=86400, env="STATIC_FILES_CACHE_TTL")  # 24 hours

    # Monitoring - NOUVEAU: Observabilité
    metrics_enabled: bool = Field(default=True, env="METRICS_ENABLED")
    health_check_interval: int = Field(
        default=30, env="HEALTH_CHECK_INTERVAL")  # seconds

    @validator('cors_origins', pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

    @validator('secret_key')
    def validate_secret_key(cls, v):
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
    os.makedirs(settings.analyses_dir, exist_ok=True)
    os.makedirs(f"{settings.analyses_dir}/En_attente", exist_ok=True)
    os.makedirs(f"{settings.analyses_dir}/Terminé", exist_ok=True)
    os.makedirs(f"{settings.analyses_dir}/Échec", exist_ok=True)


# Initialize directories
ensure_directories()
