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
from typing import Optional

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
                    _global_ai_service.logger.info("Service AI singleton créé")
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
        providers = ["openai", "claude", "mistral", "ollama"]
        
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
            self.logger.info(f"{len(self.providers)} fournisseurs AI chargés")
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
        # NOUVEAU: Charger les clés API depuis la base de données si disponible
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
                "models": ["gpt-4", "gpt-3.5-turbo"],
                "is_active": bool(settings.openai_api_key),
                "priority": 1
            },
            "claude": {
                "name": "claude", 
                "api_key": settings.anthropic_api_key or "",
                "base_url": "https://api.anthropic.com",
                "default_model": "claude-3-sonnet-20240229",
                "models": ["claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
                "is_active": bool(settings.anthropic_api_key),
                "priority": 2
            },
            "mistral": {
                "name": "mistral",
                "api_key": "",
                "base_url": "http://localhost:11434",
                "default_model": "mistral:latest",
                "models": ["mistral:latest", "llama2", "codellama"],
                "is_active": True,
                "priority": 3
            },
            "ollama": {
                "name": "ollama",
                "api_key": "",
                "base_url": settings.ollama_base_url,
                "default_model": "mistral:latest",
                "models": ["mistral:latest", "llama2", "codellama"],
                "is_active": True,
                "priority": 4
            }
        }

    def get_available_providers(self) -> list[dict[str, any]]:
        """Get available providers with functionality status"""
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            
            available = []
            for name, config in self.providers.items():
                if config.get("is_active", True):
                    # Check if provider has API key (except local providers which don't need one)
                    api_key = None
                    if name.lower() not in ["ollama", "mistral"]:
                        api_key = config_service.get_ai_provider_key(name)
                        if not api_key:
                            continue
                    
                    # Check functionality status from config
                    is_functional = config_service.get_config(f"{name}_is_functional", "false").lower() == "true"
                    
                    # Get priority from config
                    priority = config_service.get_ai_provider_priority(name)
                    
                    # Vérifier que la priorité est valide (1-4)
                    if priority < 1 or priority > 4:
                        self.logger.debug(f"Provider {name} has invalid priority {priority}, skipping")
                        continue
                    
                    available.append({
                        "name": name,
                        "priority": priority,
                        "models": config.get("models", []),
                        "default_model": config.get("default_model"),
                        "base_url": config.get("base_url"),
                        "is_active": config.get("is_active", True),
                        "has_api_key": bool(api_key),
                        "is_functional": is_functional,
                        "last_tested": config_service.get_config(f"{name}_last_tested", "")
                    })

            return self._sort_providers_by_priority(available)
            
        except Exception as e:
            self.logger.error(f"Error getting available providers: {str(e)}")
            return []

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
        """Test AI provider connection with a specific API key and update status in database"""
        try:
            self.logger.info(f"Testing provider {provider} with provided API key")
            
            # Cas spéciaux pour les providers locaux qui n'ont pas besoin de clé API
            if provider.lower() in ["ollama", "mistral"]:
                temp_config = self._create_temp_provider_config(provider, "")
            else:
                temp_config = self._create_temp_provider_config(provider, api_key)
            
            is_functional = await self._test_provider(provider, temp_config)
            
            # Mettre à jour le statut en base de données
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            
            # Sauvegarder le statut fonctionnel
            config_service.update_provider_functionality_status(provider, is_functional)
            
            if is_functional:
                self.logger.info(f"Provider {provider} test successful - status saved to database")
            else:
                self.logger.warning(f"Provider {provider} test failed - status saved to database")
            
            return is_functional
            
        except Exception as e:
            self.logger.error(f"Error testing provider {provider} with key: {str(e)}")
            
            # En cas d'erreur, marquer comme non fonctionnel
            try:
                from .config_service import ConfigService
                config_service = ConfigService(self.db)
                config_service.update_provider_functionality_status(provider, False)
            except Exception as save_error:
                self.logger.error(f"Error saving test status for {provider}: {str(save_error)}")
            
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
            "mistral": "http://localhost:11434",
            "ollama": "http://localhost:11434"
        }
        return urls.get(provider, "")

    def _get_default_model(self, provider: str) -> str:
        """Get default model for provider"""
        models = {
            "openai": "gpt-4",
            "claude": "claude-3-sonnet-20240229",
            "mistral": "mistral:latest",  # Modèle local Mistral
            "ollama": "mistral:latest"  # Utiliser mistral:latest pour Ollama
        }
        return models.get(provider, "gpt-4")

    def _get_default_models(self, provider: str) -> list[str]:
        """Get default models list for provider"""
        models = {
            "openai": ["gpt-4", "gpt-3.5-turbo"],
            "claude": ["claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
            "mistral": ["mistral:latest", "llama2", "codellama"],
            "ollama": ["mistral:latest", "llama2", "codellama"]
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
                    if name.lower() not in ["ollama", "mistral"]:
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

    def select_best_provider(self,
                             requested_provider: Optional[str] = None,
                             requested_model: Optional[str] = None) -> tuple[str, str]:
        """Select the best available provider based on strategy and priority"""
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            strategy = config_service.get_ai_provider_strategy()
            
            # Get only functional providers with valid API keys
            available_providers = self.get_available_providers()
            functional_providers = []
            
            # Filter only functional providers that have been tested and validated
            for provider in available_providers:
                # Vérifier que le provider a une clé API (sauf les providers locaux)
                if provider["name"].lower() not in ["ollama", "mistral"]:
                    if not provider.get("has_api_key", False):
                        self.logger.debug(f"Provider {provider['name']} skipped: no API key")
                        continue
                
                # Vérifier que le provider a été testé et est fonctionnel
                if not provider.get("is_functional", False):
                    self.logger.debug(f"Provider {provider['name']} skipped: not functional")
                    continue
                
                # Vérifier que le provider a une priorité valide (1-4)
                priority = provider.get("priority", 999)
                if priority < 1 or priority > 4:
                    self.logger.debug(f"Provider {provider['name']} skipped: invalid priority {priority}")
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
    
    def _handle_specific_provider_request(self, requested_provider: str, 
                                        requested_model: Optional[str], 
                                        available_providers: list[dict[str, any]]) -> tuple[str, str]:
        """Handle request for specific provider and model"""
        for provider in available_providers:
            if provider["name"] == requested_provider:
                model = self._select_model_for_provider(provider, requested_model)
                return requested_provider, model
        
        raise ValueError(f"Requested provider {requested_provider} not available")
    
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



    async def _test_provider(self, name: str, config: dict[str, any]) -> bool:
        """Test provider connection with simple prompt"""
        try:
            test_prompt = "Hello, this is a test message. Please respond with 'OK' if you receive this."
            
            if name == "openai":
                return await self._test_openai(config)
            elif name == "claude":
                return await self._test_claude(config)
            elif name == "mistral":
                return await self._test_mistral(config)
            elif name == "ollama":
                return await self._test_ollama(config)
            else:
                self.logger.warning(f"Unknown provider {name}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error testing provider {name}: {str(e)}")
            return False

    async def _test_openai(self, config: dict[str, any]) -> bool:
        """Test OpenAI provider connection"""
        try:
            # Vérifier que la clé API est présente
            if not config.get("api_key"):
                self.logger.error("OpenAI test failed: No API key provided")
                return False
                
            import openai
            
            client = openai.AsyncOpenAI(
                api_key=config["api_key"],
                base_url=config["base_url"]
            )
            
            response = await client.chat.completions.create(
                model=config["default_model"],
                messages=[{"role": "user", "content": "Test message"}],
                max_tokens=10
            )
            
            return bool(response.choices)
            
        except ImportError as e:
            self.logger.error(f"OpenAI test failed: Missing dependency - {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"OpenAI test failed: {str(e)}")
            return False

    async def _test_claude(self, config: dict[str, any]) -> bool:
        """Test Claude provider connection"""
        try:
            # Vérifier que la clé API est présente
            if not config.get("api_key"):
                self.logger.error("Claude test failed: No API key provided")
                return False
                
            import anthropic
            
            client = anthropic.AsyncAnthropic(api_key=config["api_key"])
            
            response = await client.messages.create(
                model=config["default_model"],
                max_tokens=10,
                messages=[{"role": "user", "content": "Test message"}]
            )
            
            return bool(response.content)
            
        except ImportError as e:
            self.logger.error(f"Claude test failed: Missing dependency - {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Claude test failed: {str(e)}")
            return False

    async def _test_mistral(self, config: dict[str, any]) -> bool:
        """Test Mistral provider connection (local service)"""
        try:
            import requests
            import asyncio
            
            # Vérifier que l'URL de base est définie
            base_url = config.get('base_url', 'http://localhost:11434')
            if not base_url:
                self.logger.error("Mistral test failed: No base URL configured")
                return False
            
            self.logger.info(f"Testing Mistral local service at: {base_url}")
            
            def sync_request():
                try:
                    # D'abord, vérifier si le service Mistral est accessible
                    health_response = requests.get(f"{base_url}/api/tags", timeout=5)
                    if health_response.status_code != 200:
                        return None
                    
                    # Ensuite, tester la génération avec le modèle disponible
                    available_models = health_response.json().get("models", [])
                    model_to_use = "mistral:latest"  # Modèle par défaut
                    
                    if available_models:
                        # Utiliser le premier modèle disponible
                        model_to_use = available_models[0].get("name", "mistral:latest")
                    
                    self.logger.info(f"Testing Mistral with model: {model_to_use}")
                    
                    return requests.post(
                        f"{base_url}/api/generate",
                        json={
                            "model": model_to_use,
                            "prompt": "Test message",
                            "stream": False
                        },
                        timeout=10
                    )
                except requests.exceptions.ConnectionError:
                    return None
                except requests.exceptions.Timeout:
                    return None
                except Exception as e:
                    self.logger.error(f"Mistral request failed: {str(e)}")
                    return None
            
            # Exécuter de manière asynchrone
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, sync_request)
            
            if response is None:
                self.logger.error("Mistral test failed: Could not connect to Mistral service")
                return False
            
            if response.status_code == 200:
                self.logger.info("Mistral test successful")
                return True
            else:
                self.logger.error(f"Mistral test failed with status code: {response.status_code}")
                return False
            
        except ImportError as e:
            self.logger.error(f"Mistral test failed: Missing dependency - {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Mistral test failed: {str(e)}")
            return False

    async def _test_ollama(self, config: dict[str, any]) -> bool:
        """Test Ollama provider connection"""
        try:
            import requests
            import asyncio
            
            # Vérifier que l'URL de base est définie
            base_url = config.get('base_url', 'http://localhost:11434')
            if not base_url:
                self.logger.error("Ollama test failed: No base URL configured")
                return False
            
            self.logger.info(f"Testing Ollama connection to {base_url}")
            
            def sync_request():
                try:
                    # D'abord, vérifier si Ollama est accessible
                    self.logger.info("Checking Ollama availability...")
                    health_response = requests.get(f"{base_url}/api/tags", timeout=10)
                    self.logger.info(f"Health check status: {health_response.status_code}")
                    
                    if health_response.status_code != 200:
                        self.logger.error(f"Health check failed: {health_response.text}")
                        return None
                    
                    # Ensuite, tester la génération avec le modèle disponible
                    available_models = health_response.json().get("models", [])
                    model_to_use = "mistral:latest"  # Modèle par défaut disponible
                    
                    if available_models:
                        # Utiliser le premier modèle disponible
                        model_to_use = available_models[0].get("name", "mistral:latest")
                        self.logger.info(f"Using model: {model_to_use}")
                    else:
                        self.logger.warning("No models available, using default")
                    
                    # Test de génération simple
                    self.logger.info("Testing generation...")
                    generate_response = requests.post(
                        f"{base_url}/api/generate",
                        json={
                            "model": model_to_use,
                            "prompt": "Test message - réponds juste 'OK'",
                            "stream": False
                        },
                        timeout=15
                    )
                    
                    self.logger.info(f"Generation test status: {generate_response.status_code}")
                    return generate_response
                    
                except requests.exceptions.ConnectionError as e:
                    self.logger.error(f"Connection error: {str(e)}")
                    return None
                except requests.exceptions.Timeout as e:
                    self.logger.error(f"Timeout error: {str(e)}")
                    return None
                except Exception as e:
                    self.logger.error(f"Ollama request failed: {str(e)}")
                    return None
            
            # Exécuter de manière asynchrone
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, sync_request)
            
            if response is None:
                self.logger.error("Ollama test failed: Could not connect to Ollama server")
                return False
            
            if response.status_code == 200:
                self.logger.info("Ollama test successful")
                return True
            else:
                self.logger.error(f"Ollama test failed with status {response.status_code}: {response.text}")
                return False
            
        except ImportError as e:
            self.logger.error(f"Ollama test failed: Missing dependency - {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Ollama test failed: {str(e)}")
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
            selected_provider, selected_model = self.select_best_provider(provider, model)
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
            base_url=config["base_url"]
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
        
        return response.content[0].text

    async def _call_mistral(self, prompt: str, model: str, config: dict[str, any]) -> str:
        """Call Mistral local service"""
        import requests
        import asyncio
        
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
        
        # Exécuter de manière asynchrone
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, sync_request)
        
        if response.status_code != 200:
            raise Exception(f"Mistral API error: {response.text}")
        
        return response.json()["response"]

    async def _call_ollama(self, prompt: str, model: str, config: dict[str, any]) -> str:
        """Call Ollama API"""
        import requests
        
        response = requests.post(
            f"{config['base_url']}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code != 200:
            raise Exception(f"Ollama API error: {response.text}")
        
        return response.json()["response"]

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
            "ollama": {"llama2": 0.0, "codellama": 0.0, "mistral": 0.0}
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
                self.logger.info(f"Deleted configuration for provider {provider}")
            
            return success
            
        except Exception as e:
            self.logger.error(f"Error deleting provider config: {str(e)}")
            return False

    def select_best_provider_from_priority(self, provider_priority: list[str]) -> tuple[str, str]:
        """
        Select the best available provider from a priority list
        """
        try:
            # Get available providers
            available_providers = self.get_available_providers()
            
            # Filter providers that are in the priority list and available
            priority_providers = []
            for provider_name in provider_priority:
                for provider in available_providers:
                    if provider["name"] == provider_name and provider["is_active"]: # Changed is_available to is_active
                        priority_providers.append(provider)
                        break
            
            if priority_providers:
                # Use the first available provider from priority list
                selected_provider = priority_providers[0]
                return selected_provider["name"], selected_provider["default_model"]
            
            # Fallback to default selection if no priority providers available
            self.logger.warning("No priority providers available, falling back to default selection")
            return self.select_best_provider()
            
        except Exception as e:
            self.logger.error(f"Error selecting provider from priority: {str(e)}")
            return self.select_best_provider()

    @classmethod
    def clear_cache(cls):
        """Clear the singleton cache"""
        global _global_ai_service, _global_lock
        with _global_lock:
            _global_ai_service = None
            _global_ai_service.logger.info("AIService cache cleared")

    @classmethod
    def get_cache_size(cls) -> int:
        """Get the number of cached instances"""
        return 1 if _global_ai_service else 0
