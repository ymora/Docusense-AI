"""
Configuration service for DocuSense AI
Handles application configuration management
"""

import json
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
import logging

from ..models.config import Config
from ..core.config import settings

logger = logging.getLogger(__name__)


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
            logger.info(f"Loaded {len(configs)} configurations into cache")
        except Exception as e:
            logger.error(f"Error loading config cache: {str(e)}")
            # En cas d'échec, utiliser les valeurs par défaut du fichier config
            self._load_default_configs()
    
    def _load_default_configs(self):
        """Load default configurations from settings"""
        try:
            # Configurations AI par défaut depuis les variables d'environnement
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
            logger.info("Loaded default configurations from settings")
        except Exception as e:
            logger.error(f"Error loading default configs: {str(e)}")

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

            logger.info("Initialized default configurations")

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

            logger.info("Initialized AI provider configurations")

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
        Set the AI provider selection strategy
        """
        try:
            valid_strategies = [
                "priority",
                "cost",
                "performance",
                "fallback",
                "quality",
                "speed"]
            if strategy not in valid_strategies:
                raise ValueError(
                    f"Strategy must be one of: {valid_strategies}")

            self.set_config(
                key="ai_provider_strategy",
                value=strategy,
                description="AI provider selection strategy",
                category="ai"
            )
            return True
        except Exception as e:
            logger.error(f"Error setting AI provider strategy: {str(e)}")
            return False

    def validate_and_fix_priorities(self) -> Dict[str, Any]:
        """
        Validate and fix AI provider priorities to ensure uniqueness
        Only considers active providers (those with API keys or local setup)
        Returns information about any changes made
        """
        try:
            active_providers = self._get_active_providers()
            max_priority = len(active_providers)

            current_priorities = {}
            used_priorities = set()
            conflicts = []
            fixes = []

            # Collect current priorities for active providers only
            for provider in active_providers:
                priority = self.get_ai_provider_priority(provider)
                current_priorities[provider] = priority

                if priority in used_priorities:
                    conflicts.append({
                        "provider": provider,
                        "priority": priority,
                        "issue": f"Priority {priority} is already used"
                    })
                elif priority > max_priority:
                    conflicts.append({
                        "provider": provider,
                        "priority": priority,
                        "issue": f"Priority {priority} exceeds maximum ({max_priority})"
                    })
                else:
                    used_priorities.add(priority)

            # Fix conflicts by reassigning priorities
            if conflicts:
                available_priorities = set(
                    range(1, max_priority + 1)) - used_priorities

                for conflict in conflicts:
                    if available_priorities:
                        new_priority = min(available_priorities)
                        self.set_ai_provider_priority(
                            conflict["provider"], new_priority)
                        fixes.append({
                            "provider": conflict["provider"],
                            "old_priority": conflict["priority"],
                            "new_priority": new_priority
                        })
                        available_priorities.remove(new_priority)

            return {
                "has_conflicts": len(conflicts) > 0,
                "conflicts": conflicts,
                "fixes_applied": fixes,
                "current_priorities": current_priorities,
                "active_providers": active_providers,
                "max_priority": max_priority
            }

        except Exception as e:
            logger.error(f"Error validating priorities: {str(e)}")
            return {"error": str(e)}

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
        """
        try:
            providers = []
            for provider in ["openai", "claude", "mistral", "ollama"]:
                # Check if provider has API key
                api_key = self.get_config(f"{provider}_api_key")
                if api_key:
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
                        "api_key_configured": bool(api_key)
                    })

            # Sort by priority (ascending)
            providers.sort(key=lambda x: x["priority"])
            return providers

        except Exception as e:
            logger.error(f"Error getting AI providers with priority: {str(e)}")
            return []

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
            logger.info(f"Set API key for {provider}")
            return True
        except Exception as e:
            logger.error(f"Error setting API key for {provider}: {str(e)}")
            return False

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
