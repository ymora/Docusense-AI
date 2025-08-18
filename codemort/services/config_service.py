# -*- coding: utf-8 -*-

# CODE MORT EXTRAIT DE: backend/app/services/config_service.py
# Fonctions extraites: 2
# Lignes totales extraites: 34
# Date d'extraction: 2025-08-11 01:32:25

# =============================================================================
# FONCTIONS MORTES EXTRAITES
# =============================================================================


# =============================================================================
# FONCTION: _load_cache_logic
# Lignes originales: 38-47
# =============================================================================

    def _load_cache_logic(self):
        """Logic for loading cache"""
        configs = self.db.query(Config).all()
        for config in configs:
            self._cache[config.key] = config.value
        # Log seulement au premier chargement global
        global _config_cache_loaded
        if not _config_cache_loaded:
            self.logger.info(f"{len(configs)} configurations chargées en cache")
            _config_cache_loaded = True


# =============================================================================
# FONCTION: _load_default_configs_logic
# Lignes originales: 54-77
# =============================================================================

    def _load_default_configs_logic(self):
        """Logic for loading default configs"""
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
        self.logger.info("Configurations par défaut chargées avec clés API persistantes")

