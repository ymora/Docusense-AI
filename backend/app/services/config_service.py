"""
Configuration service for DocuSense AI
Handles application configuration management
"""

import json
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import asyncio
from fastapi import HTTPException

from ..models.config import Config
from ..core.config import settings
from .ai_service import get_ai_service
from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, ConfigData


# Variables globales pour éviter les logs répétitifs
_config_cache_loaded = False
_ai_providers_loaded = False
_config_initialized = False

class ConfigService(BaseService):
    """Service for configuration management"""

    def __init__(self, db: Session):
        super().__init__(db)
        self._cache = {}
        self._load_cache()

    @log_service_operation("load_cache")
    def _load_cache(self):
        """Load all configurations into cache"""
        self.safe_execute("load_cache", self._load_cache_logic)

    def _load_cache_logic(self):
        """Logic for loading cache"""
        try:
            # Load all configs from database
            configs = self.db.query(Config).all()
            for config in configs:
                self._cache[config.key] = config.value
            self.logger.info(f"Loaded {len(configs)} configurations into cache")
        except Exception as e:
            self.logger.error(f"Error loading cache: {e}")
    
    @log_service_operation("load_default_configs")
    def _load_default_configs(self):
        """Load default configurations from settings"""
        self.safe_execute("load_default_configs", self._load_default_configs_logic)

    def _load_default_configs_logic(self):
        """Logic for loading default configs"""
        try:
            # Load default configurations from settings
            self.logger.info("Loading default configurations")
        except Exception as e:
            self.logger.error(f"Error loading default configs: {e}")


    @log_service_operation("get_config")
    def get_config(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Get configuration value by key
        """
        return self.safe_execute("get_config", self._get_config_logic, key, default)

    def _get_config_logic(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Logic for getting config"""
        # Check cache first
        if key in self._cache:
            return self._cache[key]

        # Query database
        config = self.db.query(Config).filter(Config.key == key).first()
        if config:
            self._cache[key] = config.value
            return config.value

        return default

    @log_service_operation("set_config")
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
        return self.safe_execute("set_config", self._set_config_logic, key, value, description, category, is_encrypted)

    def _set_config_logic(self, key: str, value: str, description: Optional[str] = None, category: str = "system", is_encrypted: bool = False) -> Config:
        """Logic for setting config"""
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

        self.logger.info(f"Set config {key}")
        return config

    @log_service_operation("delete_config")
    def delete_config(self, key: str) -> bool:
        """
        Delete configuration
        """
        return self.safe_execute("delete_config", self._delete_config_logic, key)

    def _delete_config_logic(self, key: str) -> bool:
        """Logic for deleting config"""
        config = self.db.query(Config).filter(Config.key == key).first()
        if not config:
            return False

        self.db.delete(config)
        self.db.commit()

        # Remove from cache
        if key in self._cache:
            del self._cache[key]

        self.logger.info(f"Deleted config {key}")
        return True

    @log_service_operation("get_configs_by_category")
    def get_configs_by_category(self, category: str) -> List[Config]:
        """
        Get all configurations for a category
        """
        return self.safe_execute("get_configs_by_category", self._get_configs_by_category_logic, category)

    def _get_configs_by_category_logic(self, category: str) -> List[Config]:
        """Logic for getting configs by category"""
        return self.db.query(Config).filter(Config.category == category).all()

    @log_service_operation("get_all_configs")
    def get_all_configs(self) -> List[Config]:
        """
        Get all configurations
        """
        return self.safe_execute("get_all_configs", self._get_all_configs_logic)

    def _get_all_configs_logic(self) -> List[Config]:
        """Logic for getting all configs"""
        return self.db.query(Config).order_by(Config.category, Config.key).all()

    @log_service_operation("get_categories")
    def get_categories(self) -> List[str]:
        """
        Get all configuration categories
        """
        return self.safe_execute("get_categories", self._get_categories_logic)

    def _get_categories_logic(self) -> List[str]:
        """Logic for getting categories"""
        categories = self.db.query(Config.category).distinct().all()
        return [cat[0] for cat in categories]

    # AI Provider Configuration Methods
    @log_service_operation("get_ai_provider_config")
    def get_ai_provider_config(
            self, provider: str) -> Optional[Dict[str, Any]]:
        """
        Get AI provider configuration
        """
        return self.safe_execute("get_ai_provider_config", self._get_ai_provider_config_logic, provider)

    def _get_ai_provider_config_logic(self, provider: str) -> Optional[Dict[str, Any]]:
        """Logic for getting AI provider config"""
        try:
            config_key = f"provider_{provider}"
            config_value = self.get_config(config_key)

            if config_value:
                return json.loads(config_value)
            return None

        except Exception as e:
            self.logger.error(
                f"Error getting AI provider config for {provider}: {
                    str(e)}")
            return None

    @log_service_operation("set_ai_provider_config")
    def set_ai_provider_config(
            self, provider: str, config: Dict[str, Any]) -> bool:
        """
        Set AI provider configuration
        """
        return self.safe_execute("set_ai_provider_config", self._set_ai_provider_config_logic, provider, config)

    def _set_ai_provider_config_logic(self, provider: str, config: Dict[str, Any]) -> bool:
        """Logic for setting AI provider config"""
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
            self.logger.error(
                f"Error setting AI provider config for {provider}: {
                    str(e)}")
            return False

    @log_service_operation("delete_ai_provider_config")
    def delete_ai_provider_config(self, provider: str) -> bool:
        """
        Delete AI provider configuration
        """
        return self.safe_execute("delete_ai_provider_config", self._delete_ai_provider_config_logic, provider)

    def _delete_ai_provider_config_logic(self, provider: str) -> bool:
        """Logic for deleting AI provider config"""
        try:
            config_key = f"provider_{provider}"
            return self.delete_config(config_key)
        except Exception as e:
            self.logger.error(
                f"Error deleting AI provider config for {provider}: {
                    str(e)}")
            return False

    # UI Configuration Methods
    @log_service_operation("get_ui_config")
    def get_ui_config(self) -> Dict[str, Any]:
        """
        Get UI configuration
        """
        return self.safe_execute("get_ui_config", self._get_ui_config_logic)

    def _get_ui_config_logic(self) -> Dict[str, Any]:
        """Logic for getting UI config"""
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
            self.logger.error(f"Error getting UI config: {str(e)}")
            return {}

    @log_service_operation("set_ui_config")
    def set_ui_config(self, config: Dict[str, Any]) -> bool:
        """
        Set UI configuration
        """
        return self.safe_execute("set_ui_config", self._set_ui_config_logic, config)

    def _set_ui_config_logic(self, config: Dict[str, Any]) -> bool:
        """Logic for setting UI config"""
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
            self.logger.error(f"Error setting UI config: {str(e)}")
            return False

    # System Configuration Methods
    @log_service_operation("get_system_config")
    def get_system_config(self) -> Dict[str, Any]:
        """
        Get system configuration
        """
        return self.safe_execute("get_system_config", self._get_system_config_logic)

    def _get_system_config_logic(self) -> Dict[str, Any]:
        """Logic for getting system config"""
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
            self.logger.error(f"Error getting system config: {str(e)}")
            return {}

    @log_service_operation("set_system_config")
    def set_system_config(self, config: Dict[str, Any]) -> bool:
        """
        Set system configuration
        """
        return self.safe_execute("set_system_config", self._set_system_config_logic, config)

    def _set_system_config_logic(self, config: Dict[str, Any]) -> bool:
        """Logic for setting system config"""
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
            self.logger.error(f"Error setting system config: {str(e)}")
            return False

    # Initialize default configurations
    @log_service_operation("initialize_default_configs")
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
            self.logger.info("Configurations par défaut initialisées")

        except Exception as e:
            self.logger.error(f"Error initializing default configs: {str(e)}")

    @log_service_operation("initialize_ai_provider_configs")
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

            # Gemini configuration
            gemini_config = {
                "api_key": "",
                "base_url": "https://generativelanguage.googleapis.com",
                "models": [
                    {"name": "gemini-pro", "display_name": "Gemini Pro", "max_tokens": 32768},
                    {"name": "gemini-pro-vision", "display_name": "Gemini Pro Vision", "max_tokens": 32768}
                ],
                "default_model": "gemini-pro",
                "is_active": True
            }

            # Set provider configurations if they don't exist
            providers = {
                "openai": openai_config,
                "claude": claude_config,
                "mistral": mistral_config,
                "ollama": ollama_config,
                "gemini": gemini_config
            }

            for provider, config in providers.items():
                if not self.get_ai_provider_config(provider):
                    self.set_ai_provider_config(provider, config)

            self.logger.info("Configurations des fournisseurs AI initialisées")

        except Exception as e:
            self.logger.error(f"Error initializing AI provider configs: {str(e)}")

    @log_service_operation("export_configs")
    def export_configs(self) -> Dict[str, Any]:
        """
        Export all configurations
        """
        return self.safe_execute("export_configs", self._export_configs_logic)

    def _export_configs_logic(self) -> Dict[str, Any]:
        """Logic for exporting configs"""
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
            self.logger.error(f"Error exporting configs: {str(e)}")
            return {}

    @log_service_operation("import_configs")
    def import_configs(self, config_data: Dict[str, Any]) -> bool:
        """
        Import configurations
        """
        return self.safe_execute("import_configs", self._import_configs_logic, config_data)

    def _import_configs_logic(self, config_data: Dict[str, Any]) -> bool:
        """Logic for importing configs"""
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

            self.logger.info("Imported configurations successfully")
            return True

        except Exception as e:
            self.logger.error(f"Error importing configs: {str(e)}")
            return False

    # === AI Provider Priority Management ===

    @log_service_operation("get_ai_provider_priority")
    def get_ai_provider_priority(self, provider: str) -> int:
        """
        Get priority for an AI provider (1 = highest, max = lowest)
        """
        return self.safe_execute("get_ai_provider_priority", self._get_ai_provider_priority_logic, provider)

    def _get_ai_provider_priority_logic(self, provider: str) -> int:
        """Logic for getting AI provider priority"""
        try:
            priority_key = f"ai_provider_priority_{provider}"
            priority = self.get_config(priority_key, "4")
            return int(priority)
        except (ValueError, TypeError):
            return 4  # Default to lowest priority

    @log_service_operation("get_all_provider_priorities")
    def get_all_provider_priorities(self) -> Dict[str, int]:
        """
        Get all provider priorities with validation
        Returns a dictionary with provider names as keys and priorities as values
        """
        return self.safe_execute("get_all_provider_priorities", self._get_all_provider_priorities_logic)

    def _get_all_provider_priorities_logic(self) -> Dict[str, int]:
        """Logic for getting all provider priorities"""
        try:
            active_providers = self._get_active_providers()
            priorities = {}
            
            for provider in active_providers:
                priorities[provider] = self.get_ai_provider_priority(provider)
            
            # Validate that priorities are sequential and unique
            priority_values = list(priorities.values())
            expected_priorities = list(range(1, len(active_providers) + 1))
            
            if sorted(priority_values) != expected_priorities:
                self.logger.warning(f"Provider priorities are not sequential: {priorities}")
                # Auto-fix if needed
                self.validate_and_fix_priorities()
                # Re-fetch after fix
                priorities = {}
                for provider in active_providers:
                    priorities[provider] = self.get_ai_provider_priority(provider)
            
            return priorities
            
        except Exception as e:
            self.logger.error(f"Error getting all provider priorities: {str(e)}")
            return {}

    def get_ai_provider_cost(self, provider: str, model: str) -> float:
        """Get AI provider cost for a specific model (placeholder - returns 0.0)"""
        return 0.0

    @log_service_operation("set_ai_provider_priority")
    def set_ai_provider_priority(self, provider: str, priority: int) -> bool:
        """
        Set priority for an AI provider with automatic reordering
        If provider B is set to priority 1, provider A (previously priority 1) becomes priority 2
        """
        return self.safe_execute("set_ai_provider_priority", self._set_ai_provider_priority_logic, provider, priority)

    def _set_ai_provider_priority_logic(self, provider: str, priority: int) -> bool:
        """Logic for setting AI provider priority with automatic reordering"""
        try:
            # Get all configured providers (those with API keys or functional local services)
            configured_providers = self._get_configured_providers()
            
            if not configured_providers:
                # Si aucun provider configuré, permettre la priorité 1
                if priority == 1:
                    self._set_provider_priority_internal(provider, priority)
                    self.logger.info(f"Set priority for {provider}: {priority}")
                    return True
                else:
                    raise ValueError("No configured providers. Priority must be 1.")

            max_priority = len(configured_providers)

            if not 1 <= priority <= max_priority:
                raise ValueError(
                    f"Priority must be between 1 and {max_priority} (number of configured providers)")

            # Get current priorities for all configured providers
            current_priorities = {}
            for p in configured_providers:
                current_priorities[p] = self.get_ai_provider_priority(p)

            # Get the current priority of the provider being changed
            old_priority = current_priorities.get(provider, max_priority)

            # If the priority is the same, no need to reorder
            if old_priority == priority:
                return True

            # Find which provider currently has the target priority
            provider_with_target_priority = None
            for p, p_priority in current_priorities.items():
                if p_priority == priority:
                    provider_with_target_priority = p
                    break

            # Reorder priorities
            if old_priority < priority:
                # Moving to a lower priority (e.g., 1 -> 3)
                # Shift providers between old_priority and new_priority up by 1
                for p, p_priority in current_priorities.items():
                    if old_priority < p_priority <= priority:
                        new_priority = p_priority - 1
                        self._set_provider_priority_internal(p, new_priority)
            else:
                # Moving to a higher priority (e.g., 3 -> 1)
                # Shift providers between new_priority and old_priority down by 1
                for p, p_priority in current_priorities.items():
                    if priority <= p_priority < old_priority:
                        new_priority = p_priority + 1
                        self._set_provider_priority_internal(p, new_priority)

            # Set the target provider to the new priority
            self._set_provider_priority_internal(provider, priority)

            self.logger.info(f"Reordered priorities: {provider} {old_priority} -> {priority}")
            return True

        except Exception as e:
            self.logger.error(f"Error setting AI provider priority: {str(e)}")
            return False

    def _set_provider_priority_internal(self, provider: str, priority: int) -> None:
        """Internal method to set provider priority without reordering logic"""
        priority_key = f"ai_provider_priority_{provider}"
        configured_providers = self._get_configured_providers()
        max_priority = len(configured_providers) if configured_providers else 1
        
        self.set_config(
            key=priority_key,
            value=str(priority),
            description=f"Priority for {provider} AI provider (1=highest, {max_priority}=lowest)",
            category="ai")

    def _get_configured_providers(self) -> List[str]:
        """
        Get list of configured providers (those with API keys or functional local services)
        """
        try:
            configured_providers = []
            all_providers = ["openai", "claude", "mistral", "ollama", "gemini"]

            for provider in all_providers:
                if provider.lower() == "ollama":
                    # Pour Ollama, vérifier s'il est fonctionnel
                    is_functional = self.get_provider_functionality_status(provider)
                    if is_functional:
                        configured_providers.append(provider)
                else:
                    # Pour les autres providers, vérifier s'ils ont une clé API
                    api_key = self.get_ai_provider_key(provider)
                    if api_key and api_key.strip():
                        configured_providers.append(provider)

            # Initialiser automatiquement les priorités si nécessaire
            self._initialize_priorities_if_needed(configured_providers)

            return configured_providers
        except Exception as e:
            self.logger.error(f"Error getting configured providers: {str(e)}")
            return []

    def _initialize_priorities_if_needed(self, configured_providers: List[str]) -> None:
        """
        Initialize priorities for configured providers if they don't exist
        """
        try:
            # Vérifier si des priorités existent déjà
            existing_priorities = []
            for provider in configured_providers:
                priority = self.get_ai_provider_priority(provider)
                if priority > 0:
                    existing_priorities.append((provider, priority))

            # Si aucune priorité n'existe, les initialiser
            if not existing_priorities:
                self.logger.info("Initializing provider priorities...")
                
                # Ollama en priorité 1 s'il est configuré
                ollama_priority = 1
                if "ollama" in configured_providers:
                    self._set_provider_priority_internal("ollama", ollama_priority)
                    self.logger.info(f"Set Ollama priority to {ollama_priority}")
                    current_priority = 2
                else:
                    current_priority = 1

                # Les autres providers dans l'ordre
                for provider in configured_providers:
                    if provider.lower() != "ollama":
                        self._set_provider_priority_internal(provider, current_priority)
                        self.logger.info(f"Set {provider} priority to {current_priority}")
                        current_priority += 1

            # Si des priorités existent mais ne sont pas séquentielles, les corriger
            elif len(existing_priorities) != len(configured_providers):
                self.logger.info("Correcting provider priorities...")
                self._correct_priorities(configured_providers)

        except Exception as e:
            self.logger.error(f"Error initializing priorities: {str(e)}")

    def _correct_priorities(self, configured_providers: List[str]) -> None:
        """
        Correct priorities to be sequential (1, 2, 3, ...)
        """
        try:
            # Ollama en priorité 1 s'il est configuré
            current_priority = 1
            if "ollama" in configured_providers:
                self._set_provider_priority_internal("ollama", current_priority)
                self.logger.info(f"Corrected Ollama priority to {current_priority}")
                current_priority += 1

            # Les autres providers dans l'ordre
            for provider in configured_providers:
                if provider.lower() != "ollama":
                    self._set_provider_priority_internal(provider, current_priority)
                    self.logger.info(f"Corrected {provider} priority to {current_priority}")
                    current_priority += 1

        except Exception as e:
            self.logger.error(f"Error correcting priorities: {str(e)}")

    def _get_active_providers(self) -> List[str]:
        """
        Get list of active providers (only those explicitly configured AND validated by user)
        """
        try:
            active_providers = []
            all_providers = ["openai", "claude", "mistral", "ollama", "gemini"]

            for provider in all_providers:
                # Un provider n'est actif que s'il a été explicitement configuré ET validé
                status = self.get_provider_status(provider)
                is_functional = self.get_provider_functionality_status(provider)
                
                # NOUVELLE LOGIQUE: Provider actif seulement si:
                # 1. Statut explicitement défini comme 'valid' (utilisateur a cliqué sur "Activer")
                # 2. ET le provider est fonctionnel (test réussi)
                if status == 'valid' and is_functional:
                    active_providers.append(provider)
                # Note: Plus de fallback sur les tests récents - l'utilisateur doit explicitement activer

            return active_providers
        except Exception as e:
            self.logger.error(f"Error getting active providers: {str(e)}")
            # Fallback: aucun provider actif par défaut
            return []



    @log_service_operation("get_ai_provider_strategy")
    def get_ai_provider_strategy(self) -> str:
        """
        Get the current AI provider selection strategy
        """
        return self.get_config("ai_provider_strategy", "priority")

    @log_service_operation("set_ai_provider_strategy")
    def set_ai_provider_strategy(self, strategy: str) -> bool:
        """
        Set AI provider strategy
        """
        return self.safe_execute("set_ai_provider_strategy", self._set_ai_provider_strategy_logic, strategy)

    def _set_ai_provider_strategy_logic(self, strategy: str) -> bool:
        """Logic for setting AI provider strategy (only priority supported)"""
        try:
            # Only priority strategy is supported (manual selection)
            if strategy != 'priority':
                self.logger.warning(f"Strategy '{strategy}' not supported. Using 'priority' (manual selection).")
                strategy = 'priority'
            
            self.set_config(
                key='ai_provider_strategy',
                value=strategy,
                description='AI provider selection strategy (manual priority only)',
                category='ai'
            )
            self.logger.info(f"Set AI provider strategy to {strategy} (manual priority)")
            return True
        except Exception as e:
            self.logger.error(f"Error setting AI provider strategy: {str(e)}")
            return False

    @log_service_operation("validate_and_fix_priorities")
    def validate_and_fix_priorities(self) -> Dict[str, Any]:
        """
        Validate and fix AI provider priorities based on active and connected providers
        """
        return self.safe_execute("validate_and_fix_priorities", self._validate_and_fix_priorities_logic)

    def _validate_and_fix_priorities_logic(self) -> Dict[str, Any]:
        """Logic for validating and fixing priorities"""
        try:
            # Get all providers and their current priorities
            all_providers = ["openai", "claude", "mistral", "ollama", "gemini"]
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
                self.logger.info(f"Found duplicate priorities: {duplicates}")
                
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
                        self.logger.info(f"Fixed priority for {provider}: {old_priority} -> {i}")
            
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
            self.logger.error(f"Error validating priorities: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to validate priorities"
            }

    @log_service_operation("reset_all_priorities")
    def reset_all_priorities(self) -> bool:
        """
        Reset all AI provider priorities to avoid conflicts during strategy changes
        Resets priorities for ALL providers (not just active ones)
        """
        return self.safe_execute("reset_all_priorities", self._reset_all_priorities_logic)

    def _reset_all_priorities_logic(self) -> bool:
        """Logic for resetting all priorities"""
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

            self.logger.info(
                f"Reset priorities for all {
                    len(all_providers)} providers")
            return True
        except Exception as e:
            self.logger.error(f"Error resetting priorities: {str(e)}")
            return False

    @log_service_operation("get_available_ai_providers_with_priority")
    def get_available_ai_providers_with_priority(self) -> List[Dict[str, Any]]:
        """
        Get all available AI providers with their priorities and costs
        Only returns providers that are active, have valid API keys, and are functional
        """
        return self.safe_execute("get_available_ai_providers_with_priority", self._get_available_ai_providers_with_priority_logic)

    def _get_available_ai_providers_with_priority_logic(self) -> List[Dict[str, Any]]:
        """Logic for getting available AI providers with priority"""
        try:
            providers = []
            
            for provider in ["openai", "claude", "mistral", "ollama", "gemini"]:
                # Check if provider has API key
                api_key = self.get_ai_provider_key(provider)
                if not api_key:
                    continue
                
                # Check functionality status from config (cached)
                is_functional = self.get_config(f"{provider}_is_functional", "false").lower() == "true"
                
                # Only include providers that were previously tested as functional
                if not is_functional:
                    self.logger.warning(f"Provider {provider} is not functional (cached status) - skipping")
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
                elif provider == "gemini":
                    models = [
                        {"name": "gemini-pro", "cost": self.get_ai_provider_cost(provider, "gemini-pro")},
                        {"name": "gemini-pro-vision", "cost": self.get_ai_provider_cost(provider, "gemini-pro-vision")}
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
            self.logger.error(f"Error getting AI providers with priority: {str(e)}")
            return []

    @log_service_operation("get_available_ai_providers_with_priority_async")
    async def get_available_ai_providers_with_priority_async(self) -> List[Dict[str, Any]]:
        """
        Async version of get_available_ai_providers_with_priority
        """
        return await asyncio.create_task(self._get_available_ai_providers_with_priority_async())

    async def _get_available_ai_providers_with_priority_async(self) -> List[Dict[str, Any]]:
        """
        Get all available AI providers with their priorities and costs
        Only returns providers that are active, have valid API keys, and are functional
        NO automatic testing - only uses saved status
        """
        try:
            from .ai_service import get_ai_service
            
            providers = []
            ai_service = get_ai_service(self.db)
            
            for provider in ["openai", "claude", "mistral", "ollama", "gemini"]:
                # Check if provider has API key (except Ollama which doesn't need one)
                if provider.lower() != "ollama":
                    api_key = self.get_ai_provider_key(provider)
                    if not api_key:
                        continue
                
                # Get saved functionality status from database (NO automatic testing)
                is_functional = self.get_provider_functionality_status(provider)
                last_tested = self.get_provider_last_tested(provider)
                status = self.get_provider_status(provider)
                
                # Only include providers that are BOTH functional AND active (user has activated them)
                if not is_functional or status != "valid":
                    self.logger.debug(f"[PROVIDERS] {provider.upper()}: Skipped (functional={is_functional}, status={status})")
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
                elif provider == "gemini":
                    models = [
                        {"name": "gemini-pro", "cost": self.get_ai_provider_cost(provider, "gemini-pro")},
                        {"name": "gemini-pro-vision", "cost": self.get_ai_provider_cost(provider, "gemini-pro-vision")}
                    ]

                providers.append({
                    "name": provider,
                    "priority": priority,
                    "strategy": strategy,
                    "models": models,
                    "api_key_configured": bool(api_key),
                    "is_available": True,
                    "is_functional": is_functional,
                    "last_tested": last_tested
                })

            # Sort by priority (ascending) - only functional providers
            providers.sort(key=lambda x: x["priority"])
            return providers

        except Exception as e:
            self.logger.error(f"Error getting AI providers with priority: {str(e)}")
            return []

    @log_service_operation("validate_provider_key")
    async def validate_provider_key(self, provider: str, api_key: str) -> Dict[str, Any]:
        """
        Validate an API key by testing the connection to the provider
        Returns validation result with details
        """
        return await self._validate_provider_key_logic(provider, api_key)

    async def _validate_provider_key_logic(self, provider: str, api_key: str) -> Dict[str, Any]:
        """Logic for validating API key - ONLY tests the specified provider"""
        try:
            from .ai_service import get_ai_service
            
            self.logger.info(f"[VALIDATION] Starting API key validation for: {provider.upper()}")
            
            ai_service = get_ai_service(self.db)
            
            # Test ONLY the specified provider with the provided API key
            is_valid = await ai_service.test_provider_with_key(provider, api_key)
            
            result = {
                "provider": provider,
                "is_valid": is_valid,
                "tested_at": datetime.now().isoformat(),
                "error_message": None
            }
            
            if is_valid:
                self.logger.info(f"[VALIDATION] {provider.upper()}: API key validation SUCCESSFUL")
                # Save the API key immediately after successful validation
                self.logger.info(f"[VALIDATION] {provider.upper()}: Saving API key to database")
                self.set_ai_provider_key(provider, api_key)
                self.logger.info(f"[VALIDATION] {provider.upper()}: Updating functionality status to TRUE")
                self.update_provider_functionality_status(provider, True)
            else:
                result["error_message"] = f"Failed to connect to {provider} with provided API key"
                self.logger.warning(f"[VALIDATION] {provider.upper()}: API key validation FAILED")
                # Update status to false for failed validation
                self.logger.info(f"[VALIDATION] {provider.upper()}: Updating functionality status to FALSE")
                self.update_provider_functionality_status(provider, False)
            
            return result
            
        except Exception as e:
            self.logger.error(f"[VALIDATION] {provider.upper()}: Unexpected error during validation: {str(e)}")
            # Update status to false for any error
            self.logger.info(f"[VALIDATION] {provider.upper()}: Updating functionality status to FALSE due to error")
            self.update_provider_functionality_status(provider, False)
            return {
                "provider": provider,
                "is_valid": False,
                "tested_at": datetime.now().isoformat(),
                "error_message": str(e)
            }

    @log_service_operation("get_functional_providers_count")
    def get_functional_providers_count(self) -> int:
        """
        Get the count of functional providers
        """
        return self.safe_execute("get_functional_providers_count", self._get_functional_providers_count_logic)

    def _get_functional_providers_count_logic(self) -> int:
        """Logic for getting functional providers count"""
        try:
            providers = self.get_available_ai_providers_with_priority()
            return len([p for p in providers if p.get("is_functional", False)])
        except Exception as e:
            self.logger.error(f"Error getting functional providers count: {str(e)}")
            return 0

    @log_service_operation("update_provider_functionality_status")
    def update_provider_functionality_status(self, provider: str, is_functional: bool) -> bool:
        """
        Update the functionality status of a provider
        """
        return self.safe_execute("update_provider_functionality_status", self._update_provider_functionality_status_logic, provider, is_functional)

    def _update_provider_functionality_status_logic(self, provider: str, is_functional: bool) -> bool:
        """Logic for updating functionality status"""
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
            
            self.logger.info(f"Updated functionality status for {provider}: {is_functional}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error updating functionality status for {provider}: {str(e)}")
            return False

    @log_service_operation("get_provider_functionality_status")
    def get_provider_functionality_status(self, provider: str) -> bool:
        """
        Get the saved functionality status of a provider from database
        """
        return self.safe_execute("get_provider_functionality_status", self._get_provider_functionality_status_logic, provider)

    def _get_provider_functionality_status_logic(self, provider: str) -> bool:
        """Logic for getting functionality status"""
        try:
            status_key = f"{provider}_is_functional"
            status_value = self.get_config(status_key)
            
            if status_value is None:
                return False  # Si pas de statut sauvegardé, considérer comme non fonctionnel
                
            return status_value.lower() == "true"
            
        except Exception as e:
            self.logger.error(f"Error getting functionality status for {provider}: {str(e)}")
            return False

    @log_service_operation("get_provider_last_tested")
    def get_provider_last_tested(self, provider: str) -> Optional[str]:
        """
        Get the last test time of a provider from database
        """
        return self.safe_execute("get_provider_last_tested", self._get_provider_last_tested_logic, provider)

    def _get_provider_last_tested_logic(self, provider: str) -> Optional[str]:
        """Logic for getting last test time"""
        try:
            last_tested_key = f"{provider}_last_tested"
            return self.get_config(last_tested_key)
            
        except Exception as e:
            self.logger.error(f"Error getting last test time for {provider}: {str(e)}")
            return None

    @log_service_operation("set_provider_status")
    def set_provider_status(self, provider: str, status: str) -> bool:
        """
        Set the status of a provider (valid, inactive, etc.)
        """
        return self.safe_execute("set_provider_status", self._set_provider_status_logic, provider, status)

    def _set_provider_status_logic(self, provider: str, status: str) -> bool:
        """Logic for setting provider status"""
        try:
            status_key = f"{provider}_status"
            self.set_config(
                key=status_key,
                value=status,
                description=f"Status for {provider} (valid/inactive)",
                category="ai"
            )
            
            self.logger.info(f"Updated status for {provider}: {status}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error updating status for {provider}: {str(e)}")
            return False

    @log_service_operation("get_provider_status")
    def get_provider_status(self, provider: str) -> Optional[str]:
        """
        Get the status of a provider from database
        """
        return self.safe_execute("get_provider_status", self._get_provider_status_logic, provider)

    def _get_provider_status_logic(self, provider: str) -> Optional[str]:
        """Logic for getting provider status"""
        try:
            status_key = f"{provider}_status"
            return self.get_config(status_key)
            
        except Exception as e:
            self.logger.error(f"Error getting status for {provider}: {str(e)}")
            return None

    @log_service_operation("set_ai_provider_key")
    def set_ai_provider_key(self, provider: str, api_key: str) -> bool:
        """
        Set API key for an AI provider
        """
        return self.safe_execute("set_ai_provider_key", self._set_ai_provider_key_logic, provider, api_key)

    def _set_ai_provider_key_logic(self, provider: str, api_key: str) -> bool:
        """Logic for setting API key"""
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
            
            self.logger.info(f"Set API key for {provider}")
            return True
        except Exception as e:
            self.logger.error(f"Error setting API key for {provider}: {str(e)}")
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
                'mistral': 'mistral_api_key',
                'gemini': 'gemini_api_key'
            }
            
            if provider in provider_mapping:
                attr_name = provider_mapping[provider]
                setattr(settings, attr_name, api_key)
                self.logger.info(f"API key saved to settings for {provider}")
            else:
                self.logger.error(f"Provider {provider} not found in mapping")
                
        except Exception as e:
            self.logger.error(f"Error saving API key to settings for {provider}: {str(e)}")

    @log_service_operation("load_api_keys_from_database")
    def load_api_keys_from_database(self):
        """
        Charge toutes les clés API depuis la base de données
        et les met à jour dans les settings
        """
        return self.safe_execute("load_api_keys_from_database", self._load_api_keys_from_database_logic)

    def _load_api_keys_from_database_logic(self):
        """Logic for loading API keys from database"""
        try:
            from ..core.config import settings
            
            providers = ['openai', 'claude', 'mistral', 'gemini']
            provider_mapping = {
                'openai': 'openai_api_key',
                'claude': 'anthropic_api_key', 
                'mistral': 'mistral_api_key',
                'gemini': 'gemini_api_key'
            }
            
            for provider in providers:
                api_key = self.get_ai_provider_key(provider)
                if api_key:
                    attr_name = provider_mapping.get(provider)
                    if attr_name:
                        setattr(settings, attr_name, api_key)
                        self.logger.info(f"Loaded API key for {provider} from database")
                        
        except Exception as e:
            self.logger.error(f"Error loading API keys from database: {str(e)}")

    @log_service_operation("get_ai_provider_key")
    def get_ai_provider_key(self, provider: str) -> Optional[str]:
        """
        Get API key for an AI provider
        """
        return self.safe_execute("get_ai_provider_key", self._get_ai_provider_key_logic, provider)

    def _get_ai_provider_key_logic(self, provider: str) -> Optional[str]:
        """Logic for getting API key"""
        try:
            key_name = f"{provider}_api_key"
            result = self.get_config(key_name)
            return result
        except Exception as e:
            self.logger.error(f"Error getting API key for {provider}: {str(e)}")
            return None

    @log_service_operation("delete_ai_provider_key")
    def delete_ai_provider_key(self, provider: str) -> bool:
        """
        Delete AI provider API key
        """
        return self.safe_execute("delete_ai_provider_key", self._delete_ai_provider_key_logic, provider)

    def _delete_ai_provider_key_logic(self, provider: str) -> bool:
        """Logic for deleting API key"""
        try:
            key_name = f"{provider}_api_key"
            
            # Supprimer de la base de données
            success = self.delete_config(key_name)
            
            # Supprimer aussi des settings
            self._delete_api_key_from_settings(provider)
            
            self.logger.info(f"Deleted API key for {provider}")
            return success
        except Exception as e:
            self.logger.error(f"Error deleting API key for {provider}: {str(e)}")
            return False

    def _delete_api_key_from_settings(self, provider: str):
        """
        Supprime la clé API des settings pour la persistance
        """
        try:
            from ..core.config import settings
            
            # Mapper les noms de providers vers les attributs settings
            provider_mapping = {
                'openai': 'openai_api_key',
                'claude': 'anthropic_api_key', 
                'anthropic': 'anthropic_api_key',
                'mistral': 'mistral_api_key',
                'openapi': 'openai_api_key'  # Ajout du mapping pour OpenAPI
            }
            
            if provider in provider_mapping:
                attr_name = provider_mapping[provider]
                setattr(settings, attr_name, None)
                print(f"[BACKEND] Clé supprimée des settings pour {provider}")
                
        except Exception as e:
            print(f"[BACKEND] Erreur suppression settings pour {provider}: {str(e)}")

    @log_service_operation("set_ai_provider_model")
    def set_ai_provider_model(self, provider: str, model: str) -> bool:
        """
        Set default model for an AI provider
        """
        return self.safe_execute("set_ai_provider_model", self._set_ai_provider_model_logic, provider, model)

    def _set_ai_provider_model_logic(self, provider: str, model: str) -> bool:
        """Logic for setting default model"""
        try:
            model_key = f"{provider}_default_model"
            self.set_config(
                key=model_key,
                value=model,
                description=f"Default model for {provider}",
                category="ai"
            )
            self.logger.info(f"Set default model {model} for {provider}")
            return True
        except Exception as e:
            self.logger.error(
                f"Error setting default model for {provider}: {
                    str(e)}")
            return False

    @log_service_operation("get_ai_provider_model")
    def get_ai_provider_model(self, provider: str) -> Optional[str]:
        """
        Get default model for an AI provider
        """
        return self.safe_execute("get_ai_provider_model", self._get_ai_provider_model_logic, provider)

    def _get_ai_provider_model_logic(self, provider: str) -> Optional[str]:
        """Logic for getting default model"""
        try:
            model_key = f"{provider}_default_model"
            return self.get_config(model_key)
        except Exception as e:
            self.logger.error(
                f"Error getting default model for {provider}: {
                    str(e)}")
            return None

    @log_service_operation("get_ai_metrics")
    def get_ai_metrics(self) -> Dict[str, Any]:
        """
        Get AI provider metrics
        """
        return self.safe_execute("get_ai_metrics", self._get_ai_metrics_logic)

    def _get_ai_metrics_logic(self) -> Dict[str, Any]:
        """Logic for getting AI metrics"""
        try:
            metrics = {}
            for provider in ["openai", "claude", "mistral", "ollama", "gemini"]:
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
            self.logger.error(f"Error getting AI metrics: {str(e)}")
            return {}

    @log_service_operation("get_ai_providers_config")
    async def get_ai_providers_config(self) -> Dict[str, Any]:
        """
        Get AI providers configuration with detailed status information
        """
        return await self.safe_execute_async("get_ai_providers_config", self._get_ai_providers_config_logic)

    async def _get_ai_providers_config_logic(self) -> Dict[str, Any]:
        """Logic for getting AI providers config"""
        try:
            # Obtenir tous les providers avec leurs configurations de base
            all_providers = ["openai", "claude", "mistral", "ollama", "gemini"]
            providers = []
            
            for provider_name in all_providers:
                # Obtenir la configuration de base du provider
                config = self.get_ai_provider_config(provider_name)
                if not config:
                    # Créer une configuration par défaut si elle n'existe pas
                    config = self._get_default_provider_config(provider_name)
                
                # Obtenir la clé API (si elle existe)
                api_key = self.get_ai_provider_key(provider_name)
                has_api_key = bool(api_key and api_key.strip())
                
                # Obtenir le statut fonctionnel conservé en base de données
                is_functional = self.get_provider_functionality_status(provider_name)
                last_tested = self.get_provider_last_tested(provider_name)
                
                # Obtenir la priorité
                priority = self.get_ai_provider_priority(provider_name)
                
                # Obtenir le statut manuel (valid/inactive)
                manual_status = self.get_provider_status(provider_name)
                
                # Déterminer si le provider est actif
                # Un provider est actif s'il a une clé API valide ET est fonctionnel ET n'est pas explicitement désactivé
                is_active = has_api_key and is_functional and manual_status != 'inactive'
                
                # Pour Ollama, considérer comme actif si fonctionnel et pas explicitement désactivé
                if provider_name == "ollama" and is_functional and manual_status != 'inactive':
                    is_active = True
                
                provider_data = {
                    "name": provider_name,
                    "priority": priority,
                    "models": config.get("models", []) if config else [],
                    "default_model": config.get("default_model") if config else None,
                    "base_url": config.get("base_url") if config else None,
                    "is_active": is_active,
                    "has_api_key": has_api_key,
                    "is_connected": is_functional,  # Compatibilité
                    "is_functional": is_functional,
                    "status": manual_status,  # Statut manuel (valid/inactive)
                    "api_key": None,  # Ne pas exposer les clés API
                    "last_tested": last_tested
                }
                
                providers.append(provider_data)
            
            # Maintenir l'ordre fixe des providers : OpenAI, Claude, Mistral, Ollama, Gemini
            # Ne pas trier par statut ou priorité pour éviter les changements de position
            sorted_providers = providers
            
            # Séparer les providers actifs et inactifs pour les statistiques uniquement
            active_providers = [p for p in providers if p["is_active"]]
            inactive_providers = [p for p in providers if not p["is_active"]]

            return {
                "providers": sorted_providers,
                "strategy": self.get_ai_provider_strategy(),
                "available_providers": [p["name"] for p in active_providers],
                "active_count": len(active_providers),
                "total_count": len(providers),
                "functional_count": len([p for p in providers if p["is_functional"]]),
                "configured_count": len([p for p in providers if p["has_api_key"]])
            }
        except Exception as e:
            self.logger.error(f"Error getting AI providers config: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def _get_default_provider_config(self, provider_name: str) -> Dict[str, Any]:
        """Get default configuration for a provider"""
        default_configs = {
            "openai": {
                "api_key": "",
                "base_url": "https://api.openai.com/v1",
                "models": [
                    {"name": "gpt-4", "display_name": "GPT-4", "max_tokens": 8192},
                    {"name": "gpt-4-turbo", "display_name": "GPT-4 Turbo", "max_tokens": 128000},
                    {"name": "gpt-3.5-turbo", "display_name": "GPT-3.5 Turbo", "max_tokens": 4096}
                ],
                "default_model": "gpt-4",
                "is_active": True
            },
            "claude": {
                "api_key": "",
                "base_url": "https://api.anthropic.com",
                "models": [
                    {"name": "claude-3-opus-20240229", "display_name": "Claude 3 Opus", "max_tokens": 200000},
                    {"name": "claude-3-sonnet-20240229", "display_name": "Claude 3 Sonnet", "max_tokens": 200000},
                    {"name": "claude-3-haiku-20240307", "display_name": "Claude 3 Haiku", "max_tokens": 200000}
                ],
                "default_model": "claude-3-sonnet-20240229",
                "is_active": True
            },
            "mistral": {
                "api_key": "",
                "base_url": "https://api.mistral.ai/v1",
                "models": [
                    {"name": "mistral-large-latest", "display_name": "Mistral Large", "max_tokens": 32768},
                    {"name": "mistral-medium-latest", "display_name": "Mistral Medium", "max_tokens": 32768},
                    {"name": "mistral-small-latest", "display_name": "Mistral Small", "max_tokens": 32768}
                ],
                "default_model": "mistral-large-latest",
                "is_active": True
            },
            "ollama": {
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
        }
        
        return default_configs.get(provider_name, {})

    @log_service_operation("test_provider_if_needed")
    async def test_provider_if_needed(self, provider: str, api_key: str = None) -> Dict[str, Any]:
        """
        Test a provider only if needed (not recently tested or forced)
        Returns test result with details
        """
        return await self.safe_execute_async("test_provider_if_needed", self._test_provider_if_needed_logic, provider, api_key)

    async def _test_provider_if_needed_logic(self, provider: str, api_key: str = None) -> Dict[str, Any]:
        """Logic for testing provider if needed"""
        try:
            from datetime import datetime, timedelta
            
            # Vérifier si le provider a été testé récemment (dans les 5 minutes)
            last_tested = self.get_provider_last_tested(provider)
            if last_tested:
                try:
                    last_test_time = datetime.fromisoformat(last_tested.replace('Z', '+00:00'))
                    time_since_test = datetime.now(last_test_time.tzinfo) - last_test_time
                    
                    # Si testé il y a moins de 5 minutes, retourner le statut actuel
                    if time_since_test < timedelta(minutes=5):
                        current_status = self.get_provider_functionality_status(provider)
                        return {
                            "success": current_status,
                            "message": f"Provider {provider} testé récemment ({time_since_test.seconds//60} min ago)",
                            "cached": True,
                            "last_tested": last_tested
                        }
                except Exception as e:
                    self.logger.warning(f"Error parsing last test time for {provider}: {str(e)}")
            
            # Si pas de clé API fournie, utiliser celle en base
            if not api_key:
                api_key = self.get_ai_provider_key(provider)
                if not api_key:
                    return {
                        "success": False,
                        "message": f"Aucune clé API configurée pour {provider}",
                        "cached": False
                    }
            
            # Tester le provider
            from .ai_service import get_ai_service
            ai_service = get_ai_service(self.db)
            
            is_functional = await ai_service.test_provider_with_key(provider, api_key)
            
            # Le statut est déjà sauvegardé par test_provider_with_key
            message = f"Test de {provider} {'réussi' if is_functional else 'échoué'}"
            
            return {
                "success": is_functional,
                "message": message,
                "cached": False,
                "last_tested": self.get_provider_last_tested(provider)
            }
            
        except Exception as e:
            self.logger.error(f"Error testing provider {provider}: {str(e)}")
            return {
                "success": False,
                "message": f"Erreur lors du test: {str(e)}",
                "cached": False
            }
