"""
AI service for DocuSense AI
Handles interactions with different AI providers
"""

import json
import asyncio
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
import logging
import time
from threading import Lock
from datetime import datetime

from ..models.analysis import AnalysisType
from ..models.config import Config

logger = logging.getLogger(__name__)

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
                    logger.info("Service AI singleton créé")
                    _singleton_logged = True
    
    return _global_ai_service


class AIService:
    """Service for AI provider interactions"""

    def __init__(self, db: Session = None):
        global _initialized
        
        # Si déjà initialisé, ne pas recharger les providers
        if _initialized and hasattr(self, 'providers') and self.providers:
            return
            
        self.db = db
        self.providers = {}
        self._config_cache_loaded = False
        self._ai_providers_loaded = False
        self._load_providers()

    def _load_providers(self) -> None:
        """Load configured AI providers from config service"""
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            providers = ["openai", "claude", "mistral", "ollama"]
            
            self._load_provider_configs(config_service, providers)
            self._log_provider_loading()
            
        except Exception as e:
            logger.error(f"Error loading AI providers: {str(e)}")
            self._load_default_providers()
    
    def _load_provider_configs(self, config_service, providers: List[str]) -> None:
        """Load provider configurations from config service"""
        for provider in providers:
            config = config_service.get_ai_provider_config(provider)
            if config:
                self.providers[provider] = config
    
    def _log_provider_loading(self) -> None:
        """Log provider loading status"""
        if not self._ai_providers_loaded:
            logger.info(f"{len(self.providers)} fournisseurs AI chargés")
            self._ai_providers_loaded = True
    
    def _load_default_providers(self) -> None:
        """Load default AI providers from settings"""
        try:
            from ..core.config import settings
            default_providers = self._get_default_provider_configs(settings)
            self.providers.update(default_providers)
            
        except Exception as e:
            logger.error(f"Error loading default providers: {str(e)}")
    
    def _get_default_provider_configs(self, settings) -> Dict[str, Dict[str, Any]]:
        """Get default provider configurations"""
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
                "api_key": settings.mistral_api_key or "",
                "base_url": "https://api.mistral.ai",
                "default_model": "mistral-large-latest",
                "models": ["mistral-large-latest", "mistral-medium-latest"],
                "is_active": bool(settings.mistral_api_key),
                "priority": 3
            },
            "ollama": {
                "name": "ollama",
                "api_key": "",
                "base_url": settings.ollama_base_url,
                "default_model": "llama2",
                "models": ["llama2", "codellama", "mistral"],
                "is_active": True,
                "priority": 4
            }
        }

    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get available providers with functionality status"""
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            
            available = []
            for name, config in self.providers.items():
                if config.get("is_active", True):
                    # Check if provider has API key
                    api_key = config_service.get_ai_provider_key(name)
                    if not api_key:
                        continue
                    
                    # Check functionality status from config
                    is_functional = config_service.get_config(f"{name}_is_functional", "false").lower() == "true"
                    
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
                        "last_tested": config_service.get_config(f"{name}_last_tested", "")
                    })

            return self._sort_providers_by_priority(available)
            
        except Exception as e:
            logger.error(f"Error getting available providers: {str(e)}")
            return []

    def _sort_providers_by_priority(self, providers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
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
            logger.error(f"Error testing provider {name}: {str(e)}")
            return False

    async def test_provider_with_key(self, provider: str, api_key: str) -> bool:
        """Test AI provider connection with a specific API key"""
        try:
            logger.info(f"Testing provider {provider} with provided API key")
            
            temp_config = self._create_temp_provider_config(provider, api_key)
            return await self._test_provider(provider, temp_config)
            
        except Exception as e:
            logger.error(f"Error testing provider {provider} with key: {str(e)}")
            return False
    
    def _create_temp_provider_config(self, provider: str, api_key: str) -> Dict[str, Any]:
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

    def _get_default_models(self, provider: str) -> List[str]:
        """Get default models list for provider"""
        models = {
            "openai": ["gpt-4", "gpt-3.5-turbo"],
            "claude": ["claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
            "mistral": ["mistral-large-latest", "mistral-medium-latest"],
            "ollama": ["llama2", "codellama", "mistral"]
        }
        return models.get(provider, ["gpt-4"])

    async def get_available_providers_async(self) -> List[Dict[str, Any]]:
        """Get available providers asynchronously with real-time functionality testing"""
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            
            available = []
            for name, config in self.providers.items():
                if config.get("is_active", True):
                    # Check if provider has API key
                    api_key = config_service.get_ai_provider_key(name)
                    if not api_key:
                        continue
                    
                    # Test provider functionality in real-time
                    is_functional = await self.test_provider_async(name)
                    
                    # Update functionality status in config
                    config_service.update_provider_functionality_status(name, is_functional)
                    
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
                        "last_tested": datetime.now().isoformat()
                    })

            return self._sort_providers_by_priority(available)
            
        except Exception as e:
            logger.error(f"Error getting available providers async: {str(e)}")
            return []

    def select_best_provider(self,
                             requested_provider: Optional[str] = None,
                             requested_model: Optional[str] = None) -> tuple[str, str]:
        """Select the best available provider based on strategy and priority"""
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            strategy = config_service.get_ai_provider_strategy()
            
            # Get only functional providers
            available_providers = self.get_available_providers()
            functional_providers = []
            
            # Filter only functional providers
            for provider in available_providers:
                if provider.get("is_functional", False):
                    functional_providers.append(provider)
            
            if not functional_providers:
                raise ValueError("No functional AI providers available")
            
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
                    logger.warning(f"Requested provider {requested_provider} is not functional, falling back to best available")
            
            # Select provider based on strategy
            return self._select_provider_by_strategy(strategy, functional_providers, config_service)
            
        except Exception as e:
            logger.error(f"Error selecting best provider: {str(e)}")
            raise
    
    def _handle_specific_provider_request(self, requested_provider: str, 
                                        requested_model: Optional[str], 
                                        available_providers: List[Dict[str, Any]]) -> tuple[str, str]:
        """Handle request for specific provider and model"""
        for provider in available_providers:
            if provider["name"] == requested_provider:
                model = self._select_model_for_provider(provider, requested_model)
                return requested_provider, model
        
        raise ValueError(f"Requested provider {requested_provider} not available")
    
    def _select_model_for_provider(self, provider: Dict[str, Any], 
                                 requested_model: Optional[str]) -> str:
        """Select appropriate model for provider"""
        if requested_model:
            available_models = [m.get("name", m) for m in provider["models"]]
            if requested_model in available_models:
                return requested_model
        
        return provider.get("default_model", 
                           provider["models"][0] if provider["models"] else "gpt-4")
    
    def _select_provider_by_strategy(self, strategy: str, 
                                   available_providers: List[Dict[str, Any]], 
                                   config_service) -> tuple[str, str]:
        """Select provider based on strategy, using only functional providers"""
        try:
            if not available_providers:
                raise ValueError("No functional providers available")
            
            if strategy == "priority":
                # Use priority-based selection with functional providers only
                best_provider = min(available_providers, key=lambda x: x["priority"])
                model = self._select_model_for_provider(best_provider, None)
                return best_provider["name"], model
                
            elif strategy == "fallback":
                # Use primary provider with automatic fallback
                # First try the highest priority provider
                best_provider = min(available_providers, key=lambda x: x["priority"])
                model = self._select_model_for_provider(best_provider, None)
                return best_provider["name"], model
                
            elif strategy == "cost":
                # Select cheapest provider
                best_provider = self._select_cheapest_provider(available_providers, config_service)
                model = self._select_model_for_provider(best_provider, None)
                return best_provider["name"], model
                
            elif strategy == "speed":
                # Select fastest provider
                best_provider = self._select_fastest_provider(available_providers, config_service)
                model = self._select_model_for_provider(best_provider, None)
                return best_provider["name"], model
                
            else:
                # Default to priority strategy
                best_provider = min(available_providers, key=lambda x: x["priority"])
                model = self._select_model_for_provider(best_provider, None)
                return best_provider["name"], model
                
        except Exception as e:
            logger.error(f"Error selecting provider by strategy: {str(e)}")
            # Fallback to first available functional provider
            if available_providers:
                provider = available_providers[0]
                model = self._select_model_for_provider(provider, None)
                return provider["name"], model
            else:
                raise ValueError("No functional providers available")

    def _select_fastest_provider(self, available_providers: List[Dict[str, Any]], 
                               config_service) -> Dict[str, Any]:
        """Select fastest provider from functional providers only"""
        try:
            fastest_provider = None
            best_speed = float('inf')
            
            for provider in available_providers:
                if not provider.get("is_functional", False):
                    continue
                    
                # Get average response time for this provider
                avg_response_time = config_service.get_provider_avg_response_time(provider["name"])
                if avg_response_time is None:
                    avg_response_time = 5.0  # Default 5 seconds
                
                if avg_response_time < best_speed:
                    best_speed = avg_response_time
                    fastest_provider = provider
            
            if not fastest_provider:
                raise ValueError("No functional providers available for speed selection")
                
            return fastest_provider
            
        except Exception as e:
            logger.error(f"Error selecting fastest provider: {str(e)}")
            raise

    def _select_cheapest_provider(self, available_providers: List[Dict[str, Any]], 
                               config_service) -> Dict[str, Any]:
        """Select cheapest provider from functional providers only"""
        try:
            cheapest_provider = None
            lowest_cost = float('inf')
            
            for provider in available_providers:
                if not provider.get("is_functional", False):
                    continue
                    
                # Get cost for default model of this provider
                default_model = provider.get("default_model", "gpt-3.5-turbo")
                cost = config_service.get_ai_provider_cost(provider["name"], default_model)
                if cost is None:
                    cost = 0.002  # Default cost per 1K tokens
                
                if cost < lowest_cost:
                    lowest_cost = cost
                    cheapest_provider = provider
            
            if not cheapest_provider:
                raise ValueError("No functional providers available for cost selection")
                
            return cheapest_provider
            
        except Exception as e:
            logger.error(f"Error selecting cheapest provider: {str(e)}")
            raise

    async def _test_provider(self, name: str, config: Dict[str, Any]) -> bool:
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
                logger.warning(f"Unknown provider {name}")
                return False
                
        except Exception as e:
            logger.error(f"Error testing provider {name}: {str(e)}")
            return False

    async def _test_openai(self, config: Dict[str, Any]) -> bool:
        """Test OpenAI provider connection"""
        try:
            # Vérifier que la clé API est présente
            if not config.get("api_key"):
                logger.error("OpenAI test failed: No API key provided")
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
            logger.error(f"OpenAI test failed: Missing dependency - {str(e)}")
            return False
        except Exception as e:
            logger.error(f"OpenAI test failed: {str(e)}")
            return False

    async def _test_claude(self, config: Dict[str, Any]) -> bool:
        """Test Claude provider connection"""
        try:
            # Vérifier que la clé API est présente
            if not config.get("api_key"):
                logger.error("Claude test failed: No API key provided")
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
            logger.error(f"Claude test failed: Missing dependency - {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Claude test failed: {str(e)}")
            return False

    async def _test_mistral(self, config: Dict[str, Any]) -> bool:
        """Test Mistral provider connection"""
        try:
            # Vérifier que la clé API est présente
            if not config.get("api_key"):
                logger.error("Mistral test failed: No API key provided")
                return False
                
            from mistralai.client import MistralClient
            from mistralai.models.chat_completion import ChatMessage
            
            logger.info(f"Testing Mistral with API key: {config['api_key'][:10]}...")
            logger.info(f"Mistral base URL: {config.get('base_url', 'https://api.mistral.ai')}")
            logger.info(f"Mistral model: {config.get('default_model', 'mistral-large-latest')}")
            
            # Utiliser l'URL correcte pour Mistral
            base_url = config.get("base_url", "https://api.mistral.ai")
            if not base_url.startswith("https://"):
                base_url = "https://api.mistral.ai"
            
            client = MistralClient(
                api_key=config["api_key"],
                endpoint=base_url
            )
            
            # Utiliser une méthode asynchrone ou wrapper synchrone
            import asyncio
            
            def sync_chat():
                try:
                    return client.chat(
                        model=config["default_model"],
                        messages=[ChatMessage(role="user", content="Test message")]
                    )
                except Exception as e:
                    logger.error(f"Mistral sync_chat error: {str(e)}")
                    raise
            
            # Exécuter de manière asynchrone
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, sync_chat)
            
            logger.info(f"Mistral test successful: {bool(response.choices)}")
            return bool(response.choices)
            
        except ImportError as e:
            logger.error(f"Mistral test failed: Missing dependency - {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Mistral test failed: {str(e)}")
            return False

    async def _test_ollama(self, config: Dict[str, Any]) -> bool:
        """Test Ollama provider connection"""
        try:
            import requests
            import asyncio
            
            def sync_request():
                return requests.post(
                    f"{config['base_url']}/api/generate",
                    json={
                        "model": config["default_model"],
                        "prompt": "Test message",
                        "stream": False
                    },
                    timeout=10
                )
            
            # Exécuter de manière asynchrone
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, sync_request)
            
            return response.status_code == 200
            
        except ImportError as e:
            logger.error(f"Ollama test failed: Missing dependency - {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Ollama test failed: {str(e)}")
            return False

    async def analyze_text(
        self,
        text: str,
        analysis_type: AnalysisType,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
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
            logger.error(f"Error analyzing text: {str(e)}")
            raise
    
    async def _call_ai_provider(self, provider: str, prompt: str, model: str, 
                              config: Dict[str, Any]) -> str:
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

    async def _call_openai(self, prompt: str, model: str, config: Dict[str, Any]) -> str:
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

    async def _call_claude(self, prompt: str, model: str, config: Dict[str, Any]) -> str:
        """Call Claude API"""
        import anthropic
        
        client = anthropic.AsyncAnthropic(api_key=config["api_key"])
        
        response = await client.messages.create(
            model=model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.content[0].text

    async def _call_mistral(self, prompt: str, model: str, config: Dict[str, Any]) -> str:
        """Call Mistral API"""
        from mistralai.client import MistralClient
        from mistralai.models.chat_completion import ChatMessage
        
        client = MistralClient(api_key=config["api_key"])
        
        response = client.chat(
            model=model,
            messages=[ChatMessage(role="user", content=prompt)]
        )
        
        return response.choices[0].message.content

    async def _call_ollama(self, prompt: str, model: str, config: Dict[str, Any]) -> str:
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

    def validate_provider_config(self, provider: str, config: Dict[str, Any]) -> bool:
        """Validate provider configuration"""
        required_fields = ["name", "api_key", "base_url", "default_model"]
        
        for field in required_fields:
            if field not in config or not config[field]:
                logger.error(f"Missing required field '{field}' for provider {provider}")
                return False
        
        return True

    def save_provider_config(self, provider: str, config: Dict[str, Any]) -> bool:
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
                logger.info(f"Saved configuration for provider {provider}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error saving provider config: {str(e)}")
            return False

    def get_provider_config(self, provider: str) -> Optional[Dict[str, Any]]:
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
                logger.info(f"Deleted configuration for provider {provider}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error deleting provider config: {str(e)}")
            return False

    def select_best_provider_from_priority(self, provider_priority: List[str]) -> tuple[str, str]:
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
            logger.warning("No priority providers available, falling back to default selection")
            return self.select_best_provider()
            
        except Exception as e:
            logger.error(f"Error selecting provider from priority: {str(e)}")
            return self.select_best_provider()

    @classmethod
    def clear_cache(cls):
        """Clear the singleton cache"""
        global _global_ai_service, _global_lock
        with _global_lock:
            _global_ai_service = None
            logger.info("AIService cache cleared")

    @classmethod
    def get_cache_size(cls) -> int:
        """Get the number of cached instances"""
        return 1 if _global_ai_service else 0
