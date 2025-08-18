# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/services/ai_service.py
# Fonctions extraites: 9
# Lignes totales extraites: 87
# Date d'extraction: 2025-08-11 01:32:24

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: _load_providers_logic
# Lignes originales: 63-70
# =============================================================================

    def _load_providers_logic(self) -> None:
        """Logic for loading AI providers"""
        from .config_service import ConfigService
        config_service = ConfigService(self.db)
        providers = ["openai", "claude", "mistral", "ollama"]
        
        self._load_provider_configs(config_service, providers)
        self._log_provider_loading()


# =============================================================================
# FONCTION: _load_default_providers
# Lignes originales: 85-93
# =============================================================================

    def _load_default_providers(self) -> None:
        """Load default AI providers from settings"""
        try:
            from ..core.config import settings
            default_providers = self._get_default_provider_configs(settings)
            self.providers.update(default_providers)
            
        except Exception as e:
            self.logger.error(f"Error loading default providers: {str(e)}")


# =============================================================================
# FONCTION: _handle_specific_provider_request
# Lignes originales: 383-392
# =============================================================================

    def _handle_specific_provider_request(self, requested_provider: str, 
                                        requested_model: Optional[str], 
                                        available_providers: list[dict[str, any]]) -> tuple[str, str]:
        """Handle request for specific provider and model"""
        for provider in available_providers:
            if provider["name"] == requested_provider:
                model = self._select_model_for_provider(provider, requested_model)
                return requested_provider, model
        
        raise ValueError(f"Requested provider {requested_provider} not available")


# =============================================================================
# FONCTION: save_provider_config
# Lignes originales: 855-875
# =============================================================================

    def save_provider_config(self, provider: str, config: dict[str, any]) -> bool:
        """Save provider configuration"""
        try:
            if not self.validate_provider_config(provider, config):
                return False
            
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            
            success = config_service.save_ai_provider_config(provider, config)
            
            if success:
                # Reload providers
                self.providers[provider] = config
                self.logger.info(f"Saved configuration for provider {provider}")
            
            return success
            
        except Exception as e:
            self.logger.error(f"Error saving provider config: {str(e)}")
            return False


# =============================================================================
# FONCTION: get_provider_config
# Lignes originales: 877-879
# =============================================================================

    def get_provider_config(self, provider: str) -> Optional[dict[str, any]]:
        """Get provider configuration"""
        return self.providers.get(provider)


# =============================================================================
# FONCTION: delete_provider_config
# Lignes originales: 881-897
# =============================================================================

    def delete_provider_config(self, provider: str) -> bool:
        """Delete provider configuration"""
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            
            success = config_service.delete_ai_provider_config(provider)
            
            if success:
                self.providers.pop(provider, None)
                self.logger.info(f"Deleted configuration for provider {provider}")
            
            return success
            
        except Exception as e:
            self.logger.error(f"Error deleting provider config: {str(e)}")
            return False


# =============================================================================
# FONCTION: clear_cache
# Lignes originales: 929-934
# =============================================================================

    def clear_cache(cls):
        """Clear the singleton cache"""
        global _global_ai_service, _global_lock
        with _global_lock:
            _global_ai_service = None
            _global_ai_service.logger.info("AIService cache cleared")


# =============================================================================
# FONCTION: get_cache_size
# Lignes originales: 937-939
# =============================================================================

    def get_cache_size(cls) -> int:
        """Get the number of cached instances"""
        return 1 if _global_ai_service else 0


# =============================================================================
# FONCTION: sync_request
# Lignes originales: 783-792
# =============================================================================

        def sync_request():
            return requests.post(
                f"{config['base_url']}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60
            )

