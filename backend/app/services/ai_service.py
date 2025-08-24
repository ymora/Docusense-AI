"""
AI service for DocuSense AI
Handles interactions with different AI providers
"""

import json
import asyncio
from sqlalchemy.orm import Session
import time
from threading import Lock
from datetime import datetime
from typing import Optional, List, Dict, Any

from ..models.analysis import AnalysisType
from ..models.config import Config
from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, AIProviderConfig, AIAnalysisResult

# Cache global persistant pour éviter les rechargements
_global_ai_service = None
_global_lock = Lock()
_initialized = False
_singleton_logged = False


def get_ai_service(db: Session = None) -> 'AIService':
    """Factory function pour obtenir l'instance singleton"""
    global _global_ai_service, _global_lock, _initialized, _singleton_logged
    
    if _global_ai_service is None:
        with _global_lock:
            if _global_ai_service is None:
                _global_ai_service = AIService(db)
                _initialized = True
                if not _singleton_logged:
                    # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                    _singleton_logged = True
    
    return _global_ai_service


class AIService(BaseService):
    """Service for AI provider interactions"""

    def __init__(self, db: Session = None):
        super().__init__(db)
        global _initialized
        
        # Si déjà initialisé, ne pas recharger les providers
        if _initialized and hasattr(self, 'providers') and self.providers:
            return
            
        self.providers = {}
        self._config_cache_loaded = False
        self._ai_providers_loaded = False
        self._load_providers()

    @log_service_operation("load_providers")
    def _load_providers(self) -> None:
        """Load configured AI providers from config service"""
        self.safe_execute("load_providers", self._load_providers_logic)

    def _load_providers_logic(self) -> None:
        """Logic for loading AI providers"""
        from .config_service import ConfigService
        config_service = ConfigService(self.db)
        providers = ["openai", "claude", "mistral", "ollama", "gemini"]
        
        self._load_provider_configs(config_service, providers)
        self._log_provider_loading()

    
    def _load_provider_configs(self, config_service, providers: list[str]) -> None:
        """Load provider configurations from config service"""
        for provider in providers:
            config = config_service.get_ai_provider_config(provider)
            if config:
                self.providers[provider] = config
    
    def _log_provider_loading(self) -> None:
        """Log provider loading status"""
        if not self._ai_providers_loaded:
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            self._ai_providers_loaded = True

    def _load_default_providers(self) -> None:
        """Load default AI providers from settings"""
        try:
            from ..core.config import settings
            default_providers = self._get_default_provider_configs(settings)
            self.providers.update(default_providers)
            
        except Exception as e:
            self.logger.error(f"Error loading default providers: {str(e)}")
    
    
    def _get_default_provider_configs(self, settings) -> dict[str, dict[str, any]]:
        """Get default provider configurations"""
        # Charger les clés API depuis la base de données si disponible
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            config_service.load_api_keys_from_database()
        except Exception as e:
            self.logger.warning(f"Could not load API keys from database: {str(e)}")
        
        return {
            "openai": {
                "name": "openai",
                "api_key": settings.openai_api_key or "",
                "base_url": "https://api.openai.com/v1",
                "default_model": "gpt-4",
                "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
                "is_active": bool(settings.openai_api_key),
                "priority": 1,
                "supports_streaming": True,
                "max_tokens": 8192
            },
            "claude": {
                "name": "claude", 
                "api_key": settings.anthropic_api_key or "",
                "base_url": "https://api.anthropic.com",
                "default_model": "claude-3-sonnet-20240229",
                "models": ["claude-3-sonnet-20240229", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
                "is_active": bool(settings.anthropic_api_key),
                "priority": 2,
                "supports_streaming": True,
                "max_tokens": 4096
            },
            "mistral": {
                "name": "mistral",
                "api_key": "",
                "base_url": "https://api.mistral.ai",
                "default_model": "mistral-large-latest",
                "models": ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
                "is_active": False,
                "priority": 3,
                "supports_streaming": True,
                "max_tokens": 4096
            },
            "ollama": {
                "name": "ollama",
                "api_key": "",
                "base_url": getattr(settings, 'ollama_base_url', 'http://localhost:11434'),
                "default_model": "llama2",
                "models": ["llama2", "codellama", "mistral", "llama2:13b", "llama2:7b"],
                "is_active": True,
                "priority": 4,
                "supports_streaming": True,
                "max_tokens": 4096,
                "is_local": True
            }
        }

    # Méthode get_available_providers supprimée - utiliser get_available_providers_async à la place

    def _sort_providers_by_priority(self, providers: list[dict[str, any]]) -> list[dict[str, any]]:
        """Sort providers by priority (ascending - lowest number = highest priority)"""
        providers.sort(key=lambda x: x["priority"])
        return providers

    async def test_provider_async(self, name: str) -> bool:
        """Test provider asynchronously"""
        try:
            config = self.providers.get(name)
            if not config:
                return False

            return await self._test_provider(name, config)
        except Exception as e:
            self.logger.error(f"Error testing provider {name}: {str(e)}")
            return False

    async def test_provider_with_key(self, provider: str, api_key: str) -> bool:
        """Test AI provider connection with a specific API key (NO automatic status update)"""
        try:
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            self.logger.warning(f"[TEST] {provider.upper()}: API key provided: {'YES' if api_key else 'NO'}")
            if api_key:
                self.logger.warning(f"[TEST] {provider.upper()}: API key length: {len(api_key)}")
                self.logger.warning(f"[TEST] {provider.upper()}: API key preview: {api_key[:8]}...{api_key[-4:]}")
            
            # Cas spéciaux pour les providers locaux qui n'ont pas besoin de clé API
            if provider.lower() in ["ollama"]:
                self.logger.warning(f"[TEST] {provider.upper()}: Local provider - no API key required")
                temp_config = self._create_temp_provider_config(provider, "")
            else:
                self.logger.warning(f"[TEST] {provider.upper()}: Cloud provider - testing with provided API key")
                temp_config = self._create_temp_provider_config(provider, api_key)
                self.logger.warning(f"[TEST] {provider.upper()}: Temp config created with API key: {'YES' if temp_config.get('api_key') else 'NO'}")
            
            is_functional = await self._test_provider(provider, temp_config)
            
            if is_functional:
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                pass
            else:
                self.logger.warning(f"[TEST] {provider.upper()}: Connection test FAILED")
            
            return is_functional
            
        except Exception as e:
            self.logger.error(f"[TEST] {provider.upper()}: Unexpected error during test: {str(e)}")
            return False
    
    def _create_temp_provider_config(self, provider: str, api_key: str) -> dict[str, any]:
        """Create temporary provider configuration for testing"""
        return {
            "name": provider,
            "api_key": api_key,
            "base_url": self._get_default_base_url(provider),
            "default_model": self._get_default_model(provider),
            "models": self._get_default_models(provider),
            "is_active": True,
            "priority": 1
        }

    def _get_default_base_url(self, provider: str) -> str:
        """Get default base URL for provider"""
        urls = {
            "openai": "https://api.openai.com/v1",
            "claude": "https://api.anthropic.com",
            "mistral": "https://api.mistral.ai",
            "ollama": "http://localhost:11434"
        }
        return urls.get(provider, "")

    def _get_default_model(self, provider: str) -> str:
        """Get default model for provider"""
        models = {
            "openai": "gpt-4",
            "claude": "claude-3-sonnet-20240229",
            "mistral": "mistral-large-latest",
            "ollama": "llama2"
        }
        return models.get(provider, "gpt-4")

    def _get_default_models(self, provider: str) -> list[str]:
        """Get default models list for provider"""
        models = {
            "openai": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
            "claude": ["claude-3-sonnet-20240229", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
            "mistral": ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
            "ollama": ["llama2", "codellama", "mistral", "llama2:13b", "llama2:7b"]
        }
        return models.get(provider, ["gpt-4"])

    async def get_available_providers_async(self) -> list[dict[str, any]]:
        """Get available providers asynchronously using saved functionality status"""
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            
            available = []
            for name, config in self.providers.items():
                if config.get("is_active", True):
                    # Check if provider has API key (except local providers which don't need one)
                    if name.lower() not in ["ollama"]:
                        api_key = config_service.get_ai_provider_key(name)
                        if not api_key:
                            continue
                    
                    # Get saved functionality status from database
                    is_functional = config_service.get_provider_functionality_status(name)
                    last_tested = config_service.get_provider_last_tested(name)
                    
                    priority = config_service.get_ai_provider_priority(name)
                    
                    available.append({
                        "name": name,
                        "priority": priority,
                        "models": config.get("models", []),
                        "default_model": config.get("default_model"),
                        "base_url": config.get("base_url"),
                        "is_active": config.get("is_active", True),
                        "has_api_key": bool(api_key),
                        "is_functional": is_functional,
                        "last_tested": last_tested
                    })

            return self._sort_providers_by_priority(available)
            
        except Exception as e:
            self.logger.error(f"Error getting available providers async: {str(e)}")
            return []

    async def select_best_provider(self,
                             requested_provider: Optional[str] = None,
                             requested_model: Optional[str] = None) -> tuple[str, str]:
        """Select the best available provider based on strategy and priority"""
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            strategy = config_service.get_ai_provider_strategy()
            
            # Get only functional providers with valid API keys
            available_providers = await self.get_available_providers_async()
            functional_providers = []
            
            # Filter only functional providers that have been tested and validated
            for provider in available_providers:
                # Vérifier que le provider a une clé API (sauf les providers locaux)
                if provider["name"].lower() not in ["ollama"]:
                    if not provider.get("has_api_key", False):
                        # OPTIMISATION: Suppression des logs DEBUG pour éviter la surcharge
                        continue
                
                # Vérifier que le provider a été testé et est fonctionnel
                if not provider.get("is_functional", False):
                    # OPTIMISATION: Suppression des logs DEBUG pour éviter la surcharge
                    continue
                
                # Vérifier que le provider a une priorité valide (1-4)
                priority = provider.get("priority", 999)
                if priority < 1 or priority > 4:
                    # OPTIMISATION: Suppression des logs DEBUG pour éviter la surcharge
                    continue
                
                functional_providers.append(provider)
            
            if not functional_providers:
                raise ValueError("No functional AI providers available. Please test and validate at least one provider.")
            
            # If specific provider requested, check if it's functional
            if requested_provider:
                requested_provider_data = next(
                    (p for p in functional_providers if p["name"] == requested_provider), 
                    None
                )
                if requested_provider_data:
                    model = self._select_model_for_provider(requested_provider_data, requested_model)
                    return requested_provider, model
                else:
                    self.logger.warning(f"Requested provider {requested_provider} is not functional, falling back to best available")
            
            # Select provider based on strategy (only functional providers)
            return self._select_provider_by_strategy(strategy, functional_providers, config_service)
            
        except Exception as e:
            self.logger.error(f"Error selecting best provider: {str(e)}")
            raise
    
    
    def _select_model_for_provider(self, provider: dict[str, any], 
                                 requested_model: Optional[str]) -> str:
        """Select appropriate model for provider"""
        if requested_model:
            available_models = [m.get("name", m) for m in provider["models"]]
            if requested_model in available_models:
                return requested_model
        
        return provider.get("default_model", 
                           provider["models"][0] if provider["models"] else "gpt-4")
    
    def _select_provider_by_strategy(self, strategy: str, 
                                   available_providers: list[dict[str, any]], 
                                   config_service) -> tuple[str, str]:
        """Select provider based on priority strategy (manual selection)"""
        try:
            if not available_providers:
                raise ValueError("No functional providers available")
            
            # Trier les providers par priorité (ordre déterministe)
            sorted_providers = sorted(available_providers, key=lambda x: x["priority"])
            
            # Utiliser le provider avec la priorité la plus haute (numéro le plus petit)
            best_provider = sorted_providers[0]
            model = self._select_model_for_provider(best_provider, None)
            return best_provider["name"], model
                
        except Exception as e:
            self.logger.error(f"Error selecting provider by strategy: {str(e)}")
            # En cas d'erreur, utiliser le premier provider fonctionnel disponible
            if available_providers:
                # Trier par priorité pour un ordre déterministe
                sorted_providers = sorted(available_providers, key=lambda x: x["priority"])
                provider = sorted_providers[0]
                model = self._select_model_for_provider(provider, None)
                return provider["name"], model
            else:
                raise ValueError("No functional providers available")

    async def select_best_provider_from_priority(self, provider_priority: str) -> tuple[str, str]:
        """
        Select provider based on priority string (e.g., "openai;claude;ollama")
        Falls back to next provider if current one fails
        """
        try:
            if not provider_priority:
                # Si pas de priorité spécifiée, utiliser la méthode standard
                return await self.select_best_provider()
            
            # Parser la chaîne de priorité (séparée par ;)
            priority_list = [p.strip().lower() for p in provider_priority.split(';') if p.strip()]
            
            if not priority_list:
                self.logger.warning("Empty provider priority string, using standard selection")
                return await self.select_best_provider()
            
            # Obtenir tous les providers fonctionnels
            available_providers = await self.get_available_providers_async()
            functional_providers = {p["name"].lower(): p for p in available_providers if p.get("is_functional", False)}
            
            # Essayer chaque provider dans l'ordre de priorité
            for provider_name in priority_list:
                if provider_name in functional_providers:
                    provider_config = functional_providers[provider_name]
                    model = self._select_model_for_provider(provider_config, None)
                    
                    # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                    return provider_name, model
            
            # Si aucun provider de la liste n'est fonctionnel, utiliser le meilleur disponible
            self.logger.warning(f"None of the specified providers {priority_list} are functional, falling back to best available")
            return await self.select_best_provider()
            
        except Exception as e:
            self.logger.error(f"Error selecting provider from priority: {str(e)}")
            # Fallback vers la sélection standard
            return await self.select_best_provider()



    async def _test_provider(self, name: str, config: dict[str, any]) -> bool:
        """Test provider connection using unified approach"""
        try:
            # Vérifier que la configuration est valide
            if not config:
                self.logger.error(f"[TEST] {name.upper()}: No configuration provided")
                return False
            
            # Vérifier la clé API pour les providers cloud
            if name.lower() not in ["ollama"]:
                if not config.get("api_key"):
                    self.logger.error(f"[TEST] {name.upper()}: No API key provided")
                    return False
            
            # Utiliser la méthode unifiée de test
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            return await self._test_provider_unified(name, config)
                
        except Exception as e:
            self.logger.error(f"[TEST] {name.upper()}: Error in test provider: {str(e)}")
            return False

    async def _test_provider_unified(self, name: str, config: dict[str, any]) -> bool:
        """Unified provider testing method"""
        try:
            provider_name = name.lower()
                    # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
        # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            if provider_name == "openai":
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                return await self._test_openai_sdk(config)
            elif provider_name == "claude":
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                return await self._test_claude_sdk(config)
            elif provider_name == "mistral":
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                return await self._test_mistral_api(config)
            elif provider_name == "ollama":
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                return await self._test_ollama_api(config)
            elif provider_name == "gemini":
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                return await self._test_gemini_api(config)
            else:
                self.logger.warning(f"[UNIFIED] Unknown provider {name}")
                return False
                
        except Exception as e:
            self.logger.error(f"[UNIFIED] Error in unified test for {name}: {str(e)}")
            return False

    async def _test_openai_sdk(self, config: dict[str, any]) -> bool:
        """Test OpenAI using official SDK"""
        try:
            import openai
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            if config.get('api_key'):
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                pass
            
            client = openai.AsyncOpenAI(
                api_key=config["api_key"],
                base_url=config.get("base_url", "https://api.openai.com/v1")
            )
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            response = await client.chat.completions.create(
                model=config.get("default_model", "gpt-4"),
                messages=[{"role": "user", "content": "Test"}],
                max_tokens=5
            )
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            return bool(response.choices)
            
        except ImportError as e:
            self.logger.error(f"[OPENAI] Missing dependency: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"[OPENAI] SDK test failed: {str(e)}")
            return False

    async def _test_claude_sdk(self, config: dict[str, any]) -> bool:
        """Test Claude using official SDK"""
        try:
            import anthropic
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            if config.get('api_key'):
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                pass
            
            client = anthropic.AsyncAnthropic(api_key=config["api_key"])
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            response = await client.messages.create(
                model=config.get("default_model", "claude-3-sonnet-20240229"),
                max_tokens=5,
                messages=[{"role": "user", "content": "Test"}]
            )
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            return bool(response.content and len(response.content) > 0)
            
        except ImportError as e:
            self.logger.error(f"[CLAUDE] Missing dependency: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"[CLAUDE] SDK test failed: {str(e)}")
            return False

    async def _test_mistral_api(self, config: dict[str, any]) -> bool:
        """Test Mistral using official SDK"""
        try:
            import mistralai
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            self.logger.warning(f"[MISTRAL] API key in config: {'YES' if config.get('api_key') else 'NO'}")
            if config.get('api_key'):
                self.logger.warning(f"[MISTRAL] API key length: {len(config['api_key'])}")
                self.logger.warning(f"[MISTRAL] API key preview: {config['api_key'][:8]}...{config['api_key'][-4:]}")
            
            client = mistralai.Mistral(
                api_key=config["api_key"]
            )
            
            # OPTIMISATION: Suppression des logs WARNING pour éviter la surcharge
            
            response = await client.chat.complete_async(
                model=config.get("default_model", "mistral-large-latest"),
                messages=[{"role": "user", "content": "Test"}],
                max_tokens=5
            )
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            return bool(response.choices)
            
        except ImportError as e:
            self.logger.error(f"[MISTRAL] Missing dependency: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"[MISTRAL] SDK test failed: {str(e)}")
            return False

    async def _test_ollama_api(self, config: dict[str, any]) -> bool:
        """Test Ollama using REST API"""
        try:
            import requests
            import asyncio
            
            base_url = config.get('base_url', 'http://localhost:11434')
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            def sync_request():
                try:
                    # OPTIMISATION: Suppression des logs DEBUG pour éviter la surcharge
                    response = requests.get(f"{base_url}/api/tags", timeout=5)
                    return response
                except Exception as e:
                    self.logger.error(f"[OLLAMA] Request failed: {str(e)}")
                    return None
            
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, sync_request)
            
            if response is None:
                self.logger.error(f"[OLLAMA] No response received from local API")
                return False
            
            if response.status_code == 200:
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                return True
            else:
                self.logger.error(f"[OLLAMA] Local REST API test failed - status: {response.status_code} - response: {response.text}")
                return False
            
        except Exception as e:
            self.logger.error(f"[OLLAMA] Unexpected error during test: {str(e)}")
            return False

    async def _test_gemini_api(self, config: dict[str, any]) -> bool:
        """Test Gemini using Google AI SDK"""
        try:
            import google.generativeai as genai
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            if config.get('api_key'):
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
                pass
            
            # Configure the API key
            genai.configure(api_key=config["api_key"])
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            # Get the model
            model = genai.GenerativeModel(config.get("default_model", "gemini-pro"))
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            # Test with a simple prompt
            response = await model.generate_content_async("Test")
            
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            return bool(response.text)
            
        except ImportError as e:
            self.logger.error(f"[GEMINI] Missing dependency: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"[GEMINI] SDK test failed: {str(e)}")
            return False

    async def analyze_text(
        self,
        text: str,
        analysis_type: AnalysisType,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> dict[str, any]:
        """Analyze text using AI provider"""
        start_time = time.time()
        
        try:
            # Select provider and model
            selected_provider, selected_model = await self.select_best_provider(provider, model)
            config = self.providers.get(selected_provider)
            
            if not config:
                raise ValueError(f"Provider {selected_provider} not configured")
            
            # Generate prompt
            prompt = self._generate_prompt(text, analysis_type, custom_prompt)
            
            # Call AI provider
            result = await self._call_ai_provider(selected_provider, prompt, selected_model, config)
            
            # Calculate metrics
            processing_time = time.time() - start_time
            
            return {
                "result": result,
                "provider": selected_provider,
                "model": selected_model,
                "processing_time": processing_time,
                "tokens_used": self._estimate_tokens(prompt, result),
                "estimated_cost": self._estimate_cost(selected_provider, selected_model, prompt, result),
                "timestamp": int(time.time())
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing text: {str(e)}")
            raise
    
    async def _call_ai_provider(self, provider: str, prompt: str, model: str, 
                              config: dict[str, any]) -> str:
        """Call specific AI provider"""
        if provider == "openai":
            return await self._call_openai(prompt, model, config)
        elif provider == "claude":
            return await self._call_claude(prompt, model, config)
        elif provider == "mistral":
            return await self._call_mistral(prompt, model, config)
        elif provider == "ollama":
            return await self._call_ollama(prompt, model, config)
        elif provider == "gemini":
            return await self._call_gemini(prompt, model, config)
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def _generate_prompt(
        self,
        text: str,
        analysis_type: AnalysisType,
        custom_prompt: Optional[str] = None
    ) -> str:
        """Generate analysis prompt based on type"""
        if custom_prompt:
            return f"{custom_prompt}\n\nDocument:\n{text}"
        
        base_prompts = {
            AnalysisType.GENERAL: "Please provide a comprehensive analysis of the following document:",
            AnalysisType.SUMMARY: "Please provide a comprehensive summary of the following document:",
            AnalysisType.EXTRACTION: "Please extract key information from the following document:",
            AnalysisType.COMPARISON: "Please compare the following documents:",
            AnalysisType.CLASSIFICATION: "Please classify the following document:",
            AnalysisType.OCR: "Please analyze the following document (OCR content):",
            AnalysisType.JURIDICAL: "Please provide a legal analysis of the following document:",
            AnalysisType.TECHNICAL: "Please provide a technical analysis of the following document:",
            AnalysisType.ADMINISTRATIVE: "Please provide an administrative analysis of the following document:"
        }
        
        base_prompt = base_prompts.get(analysis_type, "Please analyze the following document:")
        return f"{base_prompt}\n\nDocument:\n{text}"

    async def _call_openai(self, prompt: str, model: str, config: dict[str, any]) -> str:
        """Call OpenAI API"""
        import openai
        
        client = openai.AsyncOpenAI(
            api_key=config["api_key"],
            base_url=config.get("base_url", "https://api.openai.com/v1")
        )
        
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000
        )
        
        return response.choices[0].message.content

    async def _call_claude(self, prompt: str, model: str, config: dict[str, any]) -> str:
        """Call Claude API"""
        import anthropic
        
        client = anthropic.AsyncAnthropic(api_key=config["api_key"])
        
        response = await client.messages.create(
            model=model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Claude API returns content as a list of content blocks
        if response.content and len(response.content) > 0:
            return response.content[0].text
        else:
            raise Exception("No content received from Claude API")

    async def _call_mistral(self, prompt: str, model: str, config: dict[str, any]) -> str:
        """Call Mistral API using official SDK"""
        try:
            import mistralai
            
            client = mistralai.Mistral(
                api_key=config["api_key"]
            )
            
            response = await client.chat.complete_async(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            self.logger.error(f"Mistral API call failed: {str(e)}")
            raise Exception(f"Mistral API error: {str(e)}")

    async def _call_ollama(self, prompt: str, model: str, config: dict[str, any]) -> str:
        """Call Ollama API"""
        import requests
        import asyncio
        
        base_url = config.get('base_url', 'http://localhost:11434')
        
        def sync_request():
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False
            }
            try:
                response = requests.post(f"{base_url}/api/generate", 
                                       json=payload, timeout=60)
                return response
            except Exception as e:
                self.logger.error(f"Ollama API request failed: {str(e)}")
                return None
        
        # Exécuter de manière asynchrone
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, sync_request)
        
        if response is None:
            raise Exception("Failed to connect to Ollama API")
        
        if response.status_code != 200:
            raise Exception(f"Ollama API error: {response.text}")
        
        return response.json()["response"]

    async def _call_gemini(self, prompt: str, model: str, config: dict[str, any]) -> str:
        """Call Gemini API using Google AI SDK"""
        try:
            import google.generativeai as genai
            
            # Configure the API key
            genai.configure(api_key=config["api_key"])
            
            # Get the model
            model_instance = genai.GenerativeModel(model)
            
            # Generate content
            response = await model_instance.generate_content_async(prompt)
            
            if not response.text:
                raise Exception("No response text from Gemini API")
            
            return response.text
            
        except ImportError as e:
            raise Exception(f"Missing Google AI SDK dependency: {str(e)}")
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

    def _estimate_tokens(self, prompt: str, result: str) -> int:
        """Estimate token usage"""
        # Rough estimation: 1 token ≈ 4 characters
        return len(prompt + result) // 4

    def _estimate_cost(self, provider: str, model: str, prompt: str, result: str) -> float:
        """Estimate API cost"""
        tokens = self._estimate_tokens(prompt, result)
        
        # Rough cost estimates per 1K tokens
        costs = {
            "openai": {"gpt-4": 0.03, "gpt-3.5-turbo": 0.002},
            "claude": {"claude-3-sonnet-20240229": 0.015, "claude-3-haiku-20240307": 0.00025},
            "mistral": {"mistral-large-latest": 0.007, "mistral-medium-latest": 0.0024},
            "ollama": {"llama2": 0.0, "codellama": 0.0, "mistral": 0.0},
            "gemini": {"gemini-pro": 0.0005, "gemini-pro-vision": 0.0005}
        }
        
        provider_costs = costs.get(provider, {})
        cost_per_1k = provider_costs.get(model, 0.01)
        
        return (tokens / 1000) * cost_per_1k

    def validate_provider_config(self, provider: str, config: dict[str, any]) -> bool:
        """Validate provider configuration"""
        required_fields = ["name", "api_key", "base_url", "default_model"]
        
        for field in required_fields:
            if field not in config or not config[field]:
                self.logger.error(f"Missing required field '{field}' for provider {provider}")
                return False
        
        return True






    def get_available_ai_providers_with_priority(self) -> List[Dict[str, Any]]:
        """
        Get available AI providers with priority and functionality status
        """
        return self.safe_execute("get_available_ai_providers_with_priority", self._get_available_ai_providers_with_priority_logic)
    
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
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            return success
            
        except Exception as e:
            self.logger.error(f"Error saving provider config: {str(e)}")
            return False
    
    def get_provider_config(self, provider: str) -> Optional[dict[str, any]]:
        """Get provider configuration"""
        return self.providers.get(provider)
    
    def delete_provider_config(self, provider: str) -> bool:
        """Delete provider configuration"""
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            
            success = config_service.delete_ai_provider_config(provider)
            
            if success:
                self.providers.pop(provider, None)
                # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
            
            return success
            
        except Exception as e:
            self.logger.error(f"Error deleting provider config: {str(e)}")
            return False
    
    @classmethod
    def clear_cache(cls):
        """Clear the singleton cache"""
        global _global_ai_service, _global_lock
        with _global_lock:
            _global_ai_service = None
            # OPTIMISATION: Suppression des logs INFO pour éviter la surcharge
    
    @classmethod
    def get_cache_size(cls) -> int:
        """Get the number of cached instances"""
        return 1 if _global_ai_service else 0
