"""
Configuration service for DocuSense AI
Handles application configuration management
"""

import json
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
import logging
from datetime import datetime
import asyncio
from fastapi import HTTPException

from ..models.config import Config
from ..core.config import settings
from .ai_service import get_ai_service

logger = logging.getLogger(__name__)


# Variables globales pour éviter les logs répétitifs
_config_cache_loaded = False
_ai_providers_loaded = False
_config_initialized = False

class ConfigService:
    """Service for configuration management"""

    def __init__(self, db: Session):
        self.db = db
        self._cache = {}
        self._load_cache()

    def _load_cache(self):
        """Load all configurations into cache"""
        try:
            configs = self.db.query(Config).all()
            for config in configs:
                self._cache[config.key] = config.value
            # Log seulement au premier chargement global
            global _config_cache_loaded
            if not _config_cache_loaded:
                logger.info(f"{len(configs)} configurations chargées en cache")
                _config_cache_loaded = True
        except Exception as e:
            logger.error(f"Error loading config cache: {str(e)}")
            # En cas d'échec, utiliser les valeurs par défaut du fichier config
            self._load_default_configs()
    
    def _load_default_configs(self):
        """Load default configurations from settings"""
        try:
            # NOUVEAU: Charger les clés API depuis la base de données d'abord
            self.load_api_keys_from_database()
            
            # Configurations AI par défaut depuis les variables d'environnement
            # (seulement si pas déjà chargées depuis la base de données)
            from ..core.config import settings
            
            self._cache.update({
                'provider_openai': settings.openai_api_key or '',
                'provider_anthropic': settings.anthropic_api_key or '',
                'provider_mistral': settings.mistral_api_key or '',
                'provider_ollama': settings.ollama_base_url or 'http://localhost:11434',
                'system_max_file_size': str(settings.max_file_size),
                'system_ocr_enabled': str(settings.ocr_enabled),
                'system_max_concurrent_analyses': str(settings.max_concurrent_analyses),
                'ui_theme': 'dark',
                'ui_language': 'fr',
                'ui_sidebar_width': '320',
                'ui_auto_refresh_interval': '10',
                'ui_show_queue_panel': 'true'
            })
            logger.info("Configurations par défaut chargées avec clés API persistantes")
        except Exception as e:
            logger.error(f"Error loading default configs: {str(e)}")
            # En cas d'échec, initialiser les configurations par défaut complètes
            self.initialize_default_configs()

    def get_config(
            self,
            key: str,
            default: Optional[str] = None) -> Optional[str]:
        """
        Get configuration value by key
        """
        try:
            # Check cache first
            if key in self._cache:
                return self._cache[key]

            # Query database
            config = self.db.query(Config).filter(Config.key == key).first()
            if config:
                self._cache[key] = config.value
                return config.value

            return default

        except Exception as e:
            logger.error(f"Error getting config {key}: {str(e)}")
            # En cas d'échec de la base, retourner la valeur par défaut ou depuis le cache
            return self._cache.get(key, default)

    def set_config(
        self,
        key: str,
        value: str,
        description: Optional[str] = None,
        category: str = "system",
        is_encrypted: bool = False
    ) -> Config:
        """
        Set configuration value
        """
        try:
            # Check if config exists
            config = self.db.query(Config).filter(Config.key == key).first()

            if config:
                # Update existing config
                config.value = value
                if description:
                    config.description = description
                if is_encrypted is not None:
                    config.is_encrypted = is_encrypted
            else:
                # Create new config
                config = Config(
                    key=key,
                    value=value,
                    description=description,
                    category=category,
                    is_encrypted=is_encrypted
                )
                self.db.add(config)

            self.db.commit()
            self.db.refresh(config)

            # Update cache
            self._cache[key] = value

            logger.info(f"Set config {key}")
            return config

        except Exception as e:
            logger.error(f"Error setting config {key}: {str(e)}")
            self.db.rollback()
            raise

    def delete_config(self, key: str) -> bool:
        """
        Delete configuration
        """
        try:
            config = self.db.query(Config).filter(Config.key == key).first()
            if not config:
                return False

            self.db.delete(config)
            self.db.commit()

            # Remove from cache
            if key in self._cache:
                del self._cache[key]

            logger.info(f"Deleted config {key}")
            return True

        except Exception as e:
            logger.error(f"Error deleting config {key}: {str(e)}")
            self.db.rollback()
            raise

    def get_configs_by_category(self, category: str) -> List[Config]:
        """
        Get all configurations for a category
        """
        try:
            return self.db.query(Config).filter(
                Config.category == category).all()
        except Exception as e:
            logger.error(
                f"Error getting configs for category {category}: {
                    str(e)}")
            return []

    def get_all_configs(self) -> List[Config]:
        """
        Get all configurations
        """
        try:
            return self.db.query(Config).order_by(
                Config.category, Config.key).all()
        except Exception as e:
            logger.error(f"Error getting all configs: {str(e)}")
            return []

    def get_categories(self) -> List[str]:
        """
        Get all configuration categories
        """
        try:
            categories = self.db.query(Config.category).distinct().all()
            return [cat[0] for cat in categories]
        except Exception as e:
            logger.error(f"Error getting config categories: {str(e)}")
            return []

    # AI Provider Configuration Methods
    def get_ai_provider_config(
            self, provider: str) -> Optional[Dict[str, Any]]:
        """
        Get AI provider configuration
        """
        try:
            config_key = f"provider_{provider}"
            config_value = self.get_config(config_key)

            if config_value:
                return json.loads(config_value)
            return None

        except Exception as e:
            logger.error(
                f"Error getting AI provider config for {provider}: {
                    str(e)}")
            return None

    def set_ai_provider_config(
            self, provider: str, config: Dict[str, Any]) -> bool:
        """
        Set AI provider configuration
        """
        try:
            config_key = f"provider_{provider}"
            config_value = json.dumps(config)

            self.set_config(
                key=config_key,
                value=config_value,
                description=f"Configuration for {provider} AI provider",
                category="ai",
                is_encrypted=True  # API keys should be encrypted
            )

            return True

        except Exception as e:
            logger.error(
                f"Error setting AI provider config for {provider}: {
                    str(e)}")
            return False

    def delete_ai_provider_config(self, provider: str) -> bool:
        """
        Delete AI provider configuration
        """
        try:
            config_key = f"provider_{provider}"
            return self.delete_config(config_key)
        except Exception as e:
            logger.error(
                f"Error deleting AI provider config for {provider}: {
                    str(e)}")
            return False

    # UI Configuration Methods
    def get_ui_config(self) -> Dict[str, Any]:
        """
        Get UI configuration
        """
        try:
            return {
                "theme": self.get_config(
                    "ui_theme", "dark"), "language": self.get_config(
                    "ui_language", "fr"), "sidebar_width": int(
                    self.get_config(
                        "ui_sidebar_width", "320")), "auto_refresh_interval": int(
                        self.get_config(
                            "ui_auto_refresh_interval", "10")), "show_queue_panel": self.get_config(
                                "ui_show_queue_panel", "true").lower() == "true"}
        except Exception as e:
            logger.error(f"Error getting UI config: {str(e)}")
            return {}

    def set_ui_config(self, config: Dict[str, Any]) -> bool:
        """
        Set UI configuration
        """
        try:
            for key, value in config.items():
                config_key = f"ui_{key}"
                self.set_config(
                    key=config_key,
                    value=str(value),
                    description=f"UI configuration: {key}",
                    category="ui"
                )
            return True
        except Exception as e:
            logger.error(f"Error setting UI config: {str(e)}")
            return False

    # System Configuration Methods
    def get_system_config(self) -> Dict[str, Any]:
        """
        Get system configuration
        """
        try:
            return {
                # 100MB
                "max_file_size": int(self.get_config("system_max_file_size", str(100 * 1024 * 1024))),
                "supported_formats": json.loads(self.get_config("system_supported_formats", '["pdf", "docx", "doc", "txt", "eml", "msg", "xlsx", "xls", "csv", "jpg", "png"]')),
                "ocr_enabled": self.get_config("system_ocr_enabled", "true").lower() == "true",
                "cache_enabled": self.get_config("system_cache_enabled", "true").lower() == "true",
                "max_concurrent_analyses": int(self.get_config("system_max_concurrent_analyses", "3")),
                "retry_attempts": int(self.get_config("system_retry_attempts", "3"))
            }
        except Exception as e:
            logger.error(f"Error getting system config: {str(e)}")
            return {}

    def set_system_config(self, config: Dict[str, Any]) -> bool:
        """
        Set system configuration
        """
        try:
            for key, value in config.items():
                config_key = f"system_{key}"
                if isinstance(value, (list, dict)):
                    value = json.dumps(value)
                else:
                    value = str(value)

                self.set_config(
                    key=config_key,
                    value=value,
                    description=f"System configuration: {key}",
                    category="system"
                )
            return True
        except Exception as e:
            logger.error(f"Error setting system config: {str(e)}")
            return False

    # Initialize default configurations
    def initialize_default_configs(self):
        """
        Initialize default configurations if they don't exist
        """
        global _config_initialized
        
        # Éviter l'initialisation multiple
        if _config_initialized:
            return
            
        try:
            defaults = {
                # UI defaults
                "ui_theme": "dark",
                "ui_language": "fr",
                "ui_sidebar_width": "320",
                "ui_auto_refresh_interval": "10",
                "ui_show_queue_panel": "true",

                # System defaults
                "system_max_file_size": str(100 * 1024 * 1024),  # 100MB
                "system_supported_formats": '["pdf", "docx", "doc", "txt", "eml", "msg", "xlsx", "xls", "csv", "jpg", "png"]',
                "system_ocr_enabled": "true",
                "system_cache_enabled": "true",
                "system_max_concurrent_analyses": "3",
                "system_retry_attempts": "3",

                # AI Provider Priority defaults (1 = highest priority, 10 =
                # lowest)
                "ai_provider_priority_openai": "1",
                "ai_provider_priority_claude": "2",
                "ai_provider_priority_mistral": "3",
                "ai_provider_priority_ollama": "4",

                # AI Provider Cost defaults (cost per 1K tokens)
                "ai_provider_cost_openai_gpt4": "0.03",
                "ai_provider_cost_openai_gpt35": "0.002",
                "ai_provider_cost_claude_opus": "0.015",
                "ai_provider_cost_claude_sonnet": "0.003",
                "ai_provider_cost_mistral_large": "0.007",
                "ai_provider_cost_mistral_medium": "0.0024",
                "ai_provider_cost_ollama": "0.0",

                # AI Provider Strategy
                "ai_provider_strategy": "priority",  # priority, cost, performance, fallback
                "ai_provider_fallback_enabled": "true",
                "ai_provider_max_retries": "3",

                # Application defaults
                "app_name": "DocuSense AI",
                "app_version": "1.0.0",
                "app_debug": "false"
            }

            for key, value in defaults.items():
                if not self.get_config(key):
                    self.set_config(
                        key=key,
                        value=value,
                        description=f"Default configuration: {key}",
                        category=key.split('_')[0]
                    )

            # Initialize AI provider configurations
            self._initialize_ai_provider_configs()

            _config_initialized = True
            logger.info("Configurations par défaut initialisées")

        except Exception as e:
            logger.error(f"Error initializing default configs: {str(e)}")

    def _initialize_ai_provider_configs(self):
        """
        Initialize default AI provider configurations
        """
        try:
            # OpenAI configuration
            openai_config = {
                "api_key": "",
                "base_url": "https://api.openai.com/v1",
                "models": [
                    {"name": "gpt-4", "display_name": "GPT-4", "max_tokens": 8192},
                    {"name": "gpt-4-turbo", "display_name": "GPT-4 Turbo", "max_tokens": 128000},
                    {"name": "gpt-3.5-turbo", "display_name": "GPT-3.5 Turbo", "max_tokens": 4096}
                ],
                "default_model": "gpt-4",
                "is_active": True
            }

            # Claude configuration
            claude_config = {"api_key": "",
                             "base_url": "https://api.anthropic.com",
                             "models": [{"name": "claude-3-opus-20240229",
                                         "display_name": "Claude 3 Opus",
                                         "max_tokens": 200000},
                                        {"name": "claude-3-sonnet-20240229",
                                         "display_name": "Claude 3 Sonnet",
                                         "max_tokens": 200000},
                                        {"name": "claude-3-haiku-20240307",
                                         "display_name": "Claude 3 Haiku",
                                         "max_tokens": 200000}],
                             "default_model": "claude-3-sonnet-20240229",
                             "is_active": True}

            # Mistral configuration
            mistral_config = {
                "api_key": "",
                "base_url": "https://api.mistral.ai/v1",
                "models": [
                    {"name": "mistral-large-latest", "display_name": "Mistral Large", "max_tokens": 32768},
                    {"name": "mistral-medium-latest", "display_name": "Mistral Medium", "max_tokens": 32768},
                    {"name": "mistral-small-latest", "display_name": "Mistral Small", "max_tokens": 32768}
                ],
                "default_model": "mistral-large-latest",
                "is_active": True
            }

            # Ollama configuration
            ollama_config = {
                "api_key": "",
                "base_url": "http://localhost:11434",
                "models": [
                    {"name": "llama2", "display_name": "Llama 2", "max_tokens": 4096},
                    {"name": "codellama", "display_name": "Code Llama", "max_tokens": 4096},
                    {"name": "mistral", "display_name": "Mistral", "max_tokens": 4096}
                ],
                "default_model": "llama2",
                "is_active": True
            }

            # Set provider configurations if they don't exist
            providers = {
                "openai": openai_config,
                "claude": claude_config,
                "mistral": mistral_config,
                "ollama": ollama_config
            }

            for provider, config in providers.items():
                if not self.get_ai_provider_config(provider):
                    self.set_ai_provider_config(provider, config)

            logger.info("Configurations des fournisseurs AI initialisées")

        except Exception as e:
            logger.error(f"Error initializing AI provider configs: {str(e)}")

    def export_configs(self) -> Dict[str, Any]:
        """
        Export all configurations
        """
        try:
            configs = self.get_all_configs()
            export_data = {}

            for config in configs:
                if config.category not in export_data:
                    export_data[config.category] = {}

                export_data[config.category][config.key] = {
                    "value": config.value,
                    "description": config.description,
                    "is_encrypted": config.is_encrypted,
                    "created_at": config.created_at.isoformat() if config.created_at else None,
                    "updated_at": config.updated_at.isoformat() if config.updated_at else None
                }

            return export_data

        except Exception as e:
            logger.error(f"Error exporting configs: {str(e)}")
            return {}

    def import_configs(self, config_data: Dict[str, Any]) -> bool:
        """
        Import configurations
        """
        try:
            for category, configs in config_data.items():
                for key, config_info in configs.items():
                    self.set_config(
                        key=key,
                        value=config_info["value"],
                        description=config_info.get("description"),
                        category=category,
                        is_encrypted=config_info.get("is_encrypted", False)
                    )

            logger.info("Imported configurations successfully")
            return True

        except Exception as e:
            logger.error(f"Error importing configs: {str(e)}")
            return False

    # === AI Provider Priority Management ===

    def get_ai_provider_priority(self, provider: str) -> int:
        """
        Get priority for an AI provider (1 = highest, 4 = lowest)
        """
        try:
            priority_key = f"ai_provider_priority_{provider}"
            priority = self.get_config(priority_key, "4")
            return int(priority)
        except (ValueError, TypeError):
            return 4  # Default to lowest priority

    def set_ai_provider_priority(self, provider: str, priority: int) -> bool:
        """
        Set priority for an AI provider (1 = highest, max = lowest)
        Each provider must have a unique priority
        Priority cannot exceed the number of active providers
        """
        try:
            # Get active providers (those with API keys or local setup)
            active_providers = self._get_active_providers()
            max_priority = len(active_providers)

            if not 1 <= priority <= max_priority:
                raise ValueError(
                    f"Priority must be between 1 and {max_priority} (number of active providers)")

            # Check if this priority is already used by another provider
            for other_provider in active_providers:
                if other_provider != provider:
                    other_priority = self.get_ai_provider_priority(
                        other_provider)
                    if other_priority == priority:
                        raise ValueError(
                            f"Priority {priority} is already used by {other_provider}")

            priority_key = f"ai_provider_priority_{provider}"
            self.set_config(
                key=priority_key,
                value=str(priority),
                description=f"Priority for {provider} AI provider (1=highest, {max_priority}=lowest)",
                category="ai")
            return True
        except Exception as e:
            logger.error(f"Error setting AI provider priority: {str(e)}")
            return False

    def _get_active_providers(self) -> List[str]:
        """
        Get list of active providers (those with API keys or local setup)
        """
        try:
            active_providers = []
            all_providers = ["openai", "claude", "mistral", "ollama"]

            for provider in all_providers:
                # Check if provider has API key or is local (ollama)
                if provider == "ollama":
                    # Ollama is considered active if it's configured
                    if self.get_ai_provider_priority(provider) > 0:
                        active_providers.append(provider)
                else:
                    # Other providers need API key to be active
                    api_key = self.get_ai_provider_key(provider)
                    if api_key and api_key.strip():
                        active_providers.append(provider)

            return active_providers
        except Exception as e:
            logger.error(f"Error getting active providers: {str(e)}")
            # Fallback to all providers
            return ["openai", "claude", "mistral", "ollama"]

    def get_ai_provider_cost(self, provider: str, model: str) -> float:
        """
        Get cost per 1K tokens for an AI provider/model combination
        """
        try:
            cost_key = f"ai_provider_cost_{provider}_{model}"
            cost = self.get_config(cost_key, "0.01")  # Default cost
            return float(cost)
        except (ValueError, TypeError):
            return 0.01  # Default cost

    def set_ai_provider_cost(
            self,
            provider: str,
            model: str,
            cost: float) -> bool:
        """
        Set cost per 1K tokens for an AI provider/model combination
        """
        try:
            if cost < 0:
                raise ValueError("Cost cannot be negative")

            cost_key = f"ai_provider_cost_{provider}_{model}"
            self.set_config(
                key=cost_key,
                value=str(cost),
                description=f"Cost per 1K tokens for {provider}/{model}",
                category="ai"
            )
            return True
        except Exception as e:
            logger.error(f"Error setting AI provider cost: {str(e)}")
            return False

    def get_ai_provider_strategy(self) -> str:
        """
        Get the current AI provider selection strategy
        """
        return self.get_config("ai_provider_strategy", "priority")

    def set_ai_provider_strategy(self, strategy: str) -> bool:
        """
        Set AI provider strategy
        """
        try:
            # Validate strategy
            valid_strategies = ['priority', 'fallback', 'cost', 'speed']
            if strategy not in valid_strategies:
                logger.warning(f"Invalid strategy '{strategy}'. Using 'priority' as default.")
                strategy = 'priority'
            
            self.set_config(
                key='ai_provider_strategy',
                value=strategy,
                description='AI provider selection strategy',
                category='ai'
            )
            logger.info(f"Set AI provider strategy to {strategy}")
            return True
        except Exception as e:
            logger.error(f"Error setting AI provider strategy: {str(e)}")
            return False

    def validate_and_fix_priorities(self) -> Dict[str, Any]:
        """
        Validate and fix AI provider priorities based on active and connected providers
        """
        try:
            # Get all providers and their current priorities
            all_providers = ["openai", "claude", "mistral", "ollama"]
            current_priorities = {}
            active_providers = []
            
            for provider in all_providers:
                priority = self.get_ai_provider_priority(provider)
                current_priorities[provider] = priority
                
                # Check if provider is active and has valid API key
                api_key = self.get_ai_provider_key(provider)
                if api_key:
                    # For now, consider providers with API keys as potentially active
                    # The actual connection test will be done by the AI service
                    active_providers.append(provider)
            
            # Validate priorities for active providers only
            active_priorities = {p: current_priorities[p] for p in active_providers}
            
            # Check for duplicate priorities among active providers
            priority_values = list(active_priorities.values())
            duplicates = [p for p in set(priority_values) if priority_values.count(p) > 1]
            
            fixes_applied = []
            
            if duplicates:
                # Fix duplicate priorities by reassigning them
                logger.info(f"Found duplicate priorities: {duplicates}")
                
                # Sort active providers by name for consistent ordering
                sorted_active_providers = sorted(active_providers)
                
                # Reassign priorities starting from 1
                for i, provider in enumerate(sorted_active_providers, 1):
                    old_priority = current_priorities[provider]
                    if old_priority != i:
                        self.set_ai_provider_priority(provider, i)
                        fixes_applied.append({
                            "provider": provider,
                            "old_priority": old_priority,
                            "new_priority": i
                        })
                        logger.info(f"Fixed priority for {provider}: {old_priority} -> {i}")
            
            # Ensure priorities are sequential for active providers
            active_providers_after_fix = []
            for provider in all_providers:
                api_key = self.get_ai_provider_key(provider)
                if api_key:
                    active_providers_after_fix.append(provider)
            
            # Final validation: ensure active providers have sequential priorities
            final_priorities = {}
            for i, provider in enumerate(sorted(active_providers_after_fix), 1):
                current_priority = self.get_ai_provider_priority(provider)
                if current_priority != i:
                    self.set_ai_provider_priority(provider, i)
                    fixes_applied.append({
                        "provider": provider,
                        "old_priority": current_priority,
                        "new_priority": i,
                        "reason": "Sequential ordering"
                    })
                final_priorities[provider] = i
            
            return {
                "success": True,
                "active_providers": active_providers_after_fix,
                "final_priorities": final_priorities,
                "fixes_applied": fixes_applied,
                "message": f"Validated priorities for {len(active_providers_after_fix)} active providers"
            }
            
        except Exception as e:
            logger.error(f"Error validating priorities: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to validate priorities"
            }

    def reset_all_priorities(self) -> bool:
        """
        Reset all AI provider priorities to avoid conflicts during strategy changes
        Resets priorities for ALL providers (not just active ones)
        """
        try:
            all_providers = ["openai", "claude", "mistral", "ollama"]

            # Reset all priorities to 0 (inactive)
            for provider in all_providers:
                priority_key = f"ai_provider_priority_{provider}"
                self.set_config(
                    key=priority_key,
                    value="0",  # Reset to 0 (inactive)
                    description=f"Priority for {provider} AI provider (0=inactive, 1+=active)",
                    category="ai"
                )

            logger.info(
                f"Reset priorities for all {
                    len(all_providers)} providers")
            return True
        except Exception as e:
            logger.error(f"Error resetting priorities: {str(e)}")
            return False

    def get_available_ai_providers_with_priority(self) -> List[Dict[str, Any]]:
        """
        Get all available AI providers with their priorities and costs
        Only returns providers that are active, have valid API keys, and are functional
        """
        try:
            providers = []
            
            for provider in ["openai", "claude", "mistral", "ollama"]:
                # Check if provider has API key
                api_key = self.get_ai_provider_key(provider)
                if not api_key:
                    continue
                
                # Check functionality status from config (cached)
                is_functional = self.get_config(f"{provider}_is_functional", "false").lower() == "true"
                
                # Only include providers that were previously tested as functional
                if not is_functional:
                    logger.warning(f"Provider {provider} is not functional (cached status) - skipping")
                    continue
                
                priority = self.get_ai_provider_priority(provider)
                strategy = self.get_ai_provider_strategy()

                # Get available models and their costs
                models = []
                if provider == "openai":
                    models = [
                        {"name": "gpt-4", "cost": self.get_ai_provider_cost(provider, "gpt4")},
                        {"name": "gpt-3.5-turbo", "cost": self.get_ai_provider_cost(provider, "gpt35")}
                    ]
                elif provider == "claude":
                    models = [
                        {"name": "claude-3-opus", "cost": self.get_ai_provider_cost(provider, "opus")},
                        {"name": "claude-3-sonnet", "cost": self.get_ai_provider_cost(provider, "sonnet")}
                    ]
                elif provider == "mistral":
                    models = [
                        {"name": "mistral-large", "cost": self.get_ai_provider_cost(provider, "large")},
                        {"name": "mistral-medium", "cost": self.get_ai_provider_cost(provider, "medium")}
                    ]
                elif provider == "ollama":
                    models = [
                        {"name": "llama2", "cost": self.get_ai_provider_cost(provider, "llama2")},
                        {"name": "mistral", "cost": self.get_ai_provider_cost(provider, "mistral")}
                    ]

                providers.append({
                    "name": provider,
                    "priority": priority,
                    "strategy": strategy,
                    "models": models,
                    "api_key_configured": bool(api_key),
                    "is_available": True,
                    "is_functional": is_functional,
                    "last_tested": self.get_config(f"{provider}_last_tested", "")
                })

            # Sort by priority (ascending) - only functional providers
            providers.sort(key=lambda x: x["priority"])
            return providers

        except Exception as e:
            logger.error(f"Error getting AI providers with priority: {str(e)}")
            return []

    async def get_available_ai_providers_with_priority_async(self) -> List[Dict[str, Any]]:
        """
        Async version of get_available_ai_providers_with_priority
        """
        return await asyncio.create_task(self._get_available_ai_providers_with_priority_async())

    async def _get_available_ai_providers_with_priority_async(self) -> List[Dict[str, Any]]:
        """
        Get all available AI providers with their priorities and costs
        Only returns providers that are active, have valid API keys, and are functional
        """
        try:
            from .ai_service import get_ai_service
            
            providers = []
            ai_service = get_ai_service(self.db)
            
            for provider in ["openai", "claude", "mistral", "ollama"]:
                # Check if provider has API key
                api_key = self.get_ai_provider_key(provider)
                if not api_key:
                    continue
                
                # Test provider connectivity
                is_functional = False
                try:
                    # Test the provider with its current configuration
                    is_functional = await ai_service.test_provider_async(provider)
                except Exception as e:
                    logger.warning(f"Provider {provider} test failed: {str(e)}")
                    is_functional = False
                
                # Only include functional providers
                if not is_functional:
                    logger.warning(f"Provider {provider} is not functional - skipping")
                    continue
                
                priority = self.get_ai_provider_priority(provider)
                strategy = self.get_ai_provider_strategy()

                # Get available models and their costs
                models = []
                if provider == "openai":
                    models = [
                        {"name": "gpt-4", "cost": self.get_ai_provider_cost(provider, "gpt4")},
                        {"name": "gpt-3.5-turbo", "cost": self.get_ai_provider_cost(provider, "gpt35")}
                    ]
                elif provider == "claude":
                    models = [
                        {"name": "claude-3-opus", "cost": self.get_ai_provider_cost(provider, "opus")},
                        {"name": "claude-3-sonnet", "cost": self.get_ai_provider_cost(provider, "sonnet")}
                    ]
                elif provider == "mistral":
                    models = [
                        {"name": "mistral-large", "cost": self.get_ai_provider_cost(provider, "large")},
                        {"name": "mistral-medium", "cost": self.get_ai_provider_cost(provider, "medium")}
                    ]
                elif provider == "ollama":
                    models = [
                        {"name": "llama2", "cost": self.get_ai_provider_cost(provider, "llama2")},
                        {"name": "mistral", "cost": self.get_ai_provider_cost(provider, "mistral")}
                    ]

                providers.append({
                    "name": provider,
                    "priority": priority,
                    "strategy": strategy,
                    "models": models,
                    "api_key_configured": bool(api_key),
                    "is_available": True,
                    "is_functional": is_functional,
                    "last_tested": datetime.now().isoformat()
                })

            # Sort by priority (ascending) - only functional providers
            providers.sort(key=lambda x: x["priority"])
            return providers

        except Exception as e:
            logger.error(f"Error getting AI providers with priority: {str(e)}")
            return []

    async def validate_provider_key(self, provider: str, api_key: str) -> Dict[str, Any]:
        """
        Validate an API key by testing the connection to the provider
        Returns validation result with details
        """
        try:
            from .ai_service import get_ai_service
            
            ai_service = get_ai_service(self.db)
            
            # Test the provider with the provided API key
            is_valid = await ai_service.test_provider_with_key(provider, api_key)
            
            result = {
                "provider": provider,
                "is_valid": is_valid,
                "tested_at": datetime.now().isoformat(),
                "error_message": None
            }
            
            if is_valid:
                logger.info(f"API key validation successful for {provider}")
            else:
                result["error_message"] = f"Failed to connect to {provider} with provided API key"
                logger.warning(f"API key validation failed for {provider}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error validating API key for {provider}: {str(e)}")
            return {
                "provider": provider,
                "is_valid": False,
                "tested_at": datetime.now().isoformat(),
                "error_message": str(e)
            }

    def get_functional_providers_count(self) -> int:
        """
        Get the count of functional providers
        """
        try:
            providers = self.get_available_ai_providers_with_priority()
            return len([p for p in providers if p.get("is_functional", False)])
        except Exception as e:
            logger.error(f"Error getting functional providers count: {str(e)}")
            return 0

    def update_provider_functionality_status(self, provider: str, is_functional: bool) -> bool:
        """
        Update the functionality status of a provider
        """
        try:
            status_key = f"{provider}_is_functional"
            self.set_config(
                key=status_key,
                value=str(is_functional).lower(),
                description=f"Functionality status for {provider}",
                category="ai"
            )
            
            last_tested_key = f"{provider}_last_tested"
            self.set_config(
                key=last_tested_key,
                value=datetime.now().isoformat(),
                description=f"Last test time for {provider}",
                category="ai"
            )
            
            logger.info(f"Updated functionality status for {provider}: {is_functional}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating functionality status for {provider}: {str(e)}")
            return False

    def set_ai_provider_key(self, provider: str, api_key: str) -> bool:
        """
        Set API key for an AI provider
        """
        try:
            key_name = f"{provider}_api_key"
            self.set_config(
                key=key_name,
                value=api_key,
                description=f"API key for {provider}",
                category="ai",
                is_encrypted=True
            )
            
            # NOUVEAU: Sauvegarder aussi dans les settings pour la persistance
            self._save_api_key_to_settings(provider, api_key)
            
            logger.info(f"Set API key for {provider}")
            return True
        except Exception as e:
            logger.error(f"Error setting API key for {provider}: {str(e)}")
            return False

    def _save_api_key_to_settings(self, provider: str, api_key: str):
        """
        Sauvegarde la clé API dans les settings pour la persistance
        """
        try:
            from ..core.config import settings
            
            # Mapper les noms de providers vers les attributs settings
            provider_mapping = {
                'openai': 'openai_api_key',
                'claude': 'anthropic_api_key', 
                'anthropic': 'anthropic_api_key',
                'mistral': 'mistral_api_key'
            }
            
            if provider in provider_mapping:
                attr_name = provider_mapping[provider]
                setattr(settings, attr_name, api_key)
                logger.info(f"API key saved to settings for {provider}")
                
        except Exception as e:
            logger.error(f"Error saving API key to settings for {provider}: {str(e)}")

    def load_api_keys_from_database(self):
        """
        Charge toutes les clés API depuis la base de données
        et les met à jour dans les settings
        """
        try:
            from ..core.config import settings
            
            providers = ['openai', 'claude', 'anthropic', 'mistral']
            provider_mapping = {
                'openai': 'openai_api_key',
                'claude': 'anthropic_api_key',
                'anthropic': 'anthropic_api_key', 
                'mistral': 'mistral_api_key'
            }
            
            for provider in providers:
                api_key = self.get_ai_provider_key(provider)
                if api_key:
                    attr_name = provider_mapping.get(provider)
                    if attr_name:
                        setattr(settings, attr_name, api_key)
                        logger.info(f"Loaded API key for {provider} from database")
                        
        except Exception as e:
            logger.error(f"Error loading API keys from database: {str(e)}")

    def get_ai_provider_key(self, provider: str) -> Optional[str]:
        """
        Get API key for an AI provider
        """
        try:
            key_name = f"{provider}_api_key"
            return self.get_config(key_name)
        except Exception as e:
            logger.error(f"Error getting API key for {provider}: {str(e)}")
            return None

    def set_ai_provider_model(self, provider: str, model: str) -> bool:
        """
        Set default model for an AI provider
        """
        try:
            model_key = f"{provider}_default_model"
            self.set_config(
                key=model_key,
                value=model,
                description=f"Default model for {provider}",
                category="ai"
            )
            logger.info(f"Set default model {model} for {provider}")
            return True
        except Exception as e:
            logger.error(
                f"Error setting default model for {provider}: {
                    str(e)}")
            return False

    def get_ai_provider_model(self, provider: str) -> Optional[str]:
        """
        Get default model for an AI provider
        """
        try:
            model_key = f"{provider}_default_model"
            return self.get_config(model_key)
        except Exception as e:
            logger.error(
                f"Error getting default model for {provider}: {
                    str(e)}")
            return None

    def get_ai_metrics(self) -> Dict[str, Any]:
        """
        Get AI provider metrics
        """
        try:
            metrics = {}
            for provider in ["openai", "claude", "mistral", "ollama"]:
                provider_metrics = {
                    "total_requests": int(
                        self.get_config(
                            f"ai.metrics.{provider}.total_requests", "0")), "successful_requests": int(
                        self.get_config(
                            f"ai.metrics.{provider}.successful_requests", "0")), "failed_requests": int(
                        self.get_config(
                            f"ai.metrics.{provider}.failed_requests", "0")), "avg_response_time": float(
                                self.get_config(
                                    f"ai.metrics.{provider}.avg_response_time", "0")), "last_used": self.get_config(
                                        f"ai.metrics.{provider}.last_used"), "is_connected": self.get_config(
                                            f"ai.metrics.{provider}.is_connected", "false").lower() == "true"}
                metrics[provider] = provider_metrics

            return metrics
        except Exception as e:
            logger.error(f"Error getting AI metrics: {str(e)}")
            return {}

    async def get_ai_providers_config(self) -> Dict[str, Any]:
        """
        Get AI providers configuration with detailed status information
        """
        try:
            config_service = ConfigService(self.db)
            ai_service = get_ai_service(self.db)

            # Get all provider configurations with defaults
            providers = []
            for provider in ["openai", "claude", "mistral", "ollama"]:
                config = config_service.get_ai_provider_config(provider)
                api_key = config_service.get_ai_provider_key(provider)

                # Default models for each provider
                default_models = {
                    "openai": [
                        "gpt-4",
                        "gpt-3.5-turbo",
                        "gpt-4o"],
                    "claude": [
                        "claude-3-opus",
                        "claude-3-sonnet",
                        "claude-3-haiku"],
                    "mistral": [
                        "mistral-large",
                        "mistral-medium",
                        "mistral-small"],
                    "ollama": [
                        "llama2",
                        "mistral",
                        "codellama",
                        "phi"]}

                # Default model for each provider
                default_model_map = {
                    "openai": "gpt-3.5-turbo",
                    "claude": "claude-3-sonnet",
                    "mistral": "mistral-medium",
                    "ollama": "llama2"
                }

                # Check if provider has API key and test connection
                has_api_key = bool(api_key)
                is_connected = False
                is_functional = False
                
                if has_api_key:
                    try:
                        # Test connection asynchronously with timeout
                        is_connected = await ai_service.test_provider_async(provider)
                        is_functional = is_connected
                        
                        # Update functionality status in database
                        self.update_provider_functionality_status(provider, is_functional)
                    except Exception as e:
                        logger.warning(f"Connection test failed for {provider}: {str(e)}")
                        is_connected = False
                        is_functional = False
                        self.update_provider_functionality_status(provider, False)

                provider_data = {
                    "name": provider,
                    "priority": config_service.get_ai_provider_priority(provider),
                    "models": config.get("models", default_models.get(provider, [])) if config else default_models.get(provider, []),
                    "default_model": config.get("default_model", default_model_map.get(provider)) if config else default_model_map.get(provider),
                    "base_url": config.get("base_url") if config else None,
                    "is_active": config.get("is_active", True) if config else True,
                    "has_api_key": has_api_key,
                    "is_connected": is_connected,
                    "is_functional": is_functional,
                    "api_key": api_key if api_key else None,  # Include API key for frontend validation
                    "last_tested": datetime.now().isoformat() if has_api_key else None
                }

                providers.append(provider_data)

            # Sort providers by priority, but only include active and connected ones
            active_providers = [p for p in providers if p["has_api_key"] and p["is_functional"]]
            inactive_providers = [p for p in providers if not (p["has_api_key"] and p["is_functional"])]
            
            # Sort active providers by priority (ascending)
            active_providers.sort(key=lambda x: x["priority"])
            
            # Combine active (sorted) and inactive providers
            sorted_providers = active_providers + inactive_providers

            return {
                "providers": sorted_providers,
                "strategy": config_service.get_ai_provider_strategy(),
                "available_providers": [p["name"] for p in active_providers],
                "active_count": len(active_providers),
                "total_count": len(providers),
                "functional_count": len([p for p in providers if p["is_functional"]]),
                "configured_count": len([p for p in providers if p["has_api_key"]])
            }
        except Exception as e:
            logger.error(f"Error getting AI providers config: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
