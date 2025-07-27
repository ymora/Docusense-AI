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

from ..models.analysis import AnalysisType
from ..models.config import Config

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI provider interactions"""

    def __init__(self, db: Session):
        self.db = db
        self.providers = {}
        self._load_providers()

    def _load_providers(self):
        """Load configured AI providers"""
        try:
            # Use config service to load provider configurations
            from .config_service import ConfigService
            config_service = ConfigService(self.db)

            # Load all AI provider configurations
            providers = ["openai", "claude", "mistral", "ollama"]

            for provider in providers:
                config = config_service.get_ai_provider_config(provider)
                if config:
                    self.providers[provider] = config

            logger.info(f"Loaded {len(self.providers)} AI providers")

        except Exception as e:
            logger.error(f"Error loading AI providers: {str(e)}")
            # En cas d'échec, charger les providers par défaut
            self._load_default_providers()
    
    def _load_default_providers(self):
        """Load default AI providers from settings"""
        try:
            from ..core.config import settings
            
            # Providers par défaut avec les valeurs du fichier config
            default_providers = {
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
            
            self.providers = default_providers
            logger.info(f"Loaded {len(self.providers)} default AI providers")
            
        except Exception as e:
            logger.error(f"Error loading default providers: {str(e)}")

    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get list of available AI providers with priority"""
        available = []

        for name, config in self.providers.items():
            # For now, consider providers as available if they have a config
            # The actual testing will be done when needed
            if config and config.get("is_active", True):
                # Get priority from config service
                from .config_service import ConfigService
                config_service = ConfigService(self.db)
                priority = config_service.get_ai_provider_priority(name)

                available.append({
                    "name": name,
                    "priority": priority,
                    "models": config.get("models", []),
                    "default_model": config.get("default_model"),
                    "base_url": config.get("base_url"),
                    "is_active": config.get("is_active", True),
                    "has_api_key": bool(config.get("api_key"))
                })

        # Sort by priority (ascending - lowest number = highest priority)
        available.sort(key=lambda x: x["priority"])
        return available

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

    async def get_available_providers_async(self) -> List[Dict[str, Any]]:
        """Get list of available AI providers with async testing"""
        available = []

        for name, config in self.providers.items():
            if config and config.get("is_active", True):
                # Test provider asynchronously
                is_working = await self.test_provider_async(name)

                if is_working:
                    # Get priority from config service
                    from .config_service import ConfigService
                    config_service = ConfigService(self.db)
                    priority = config_service.get_ai_provider_priority(name)

                    available.append({
                        "name": name,
                        "priority": priority,
                        "models": config.get("models", []),
                        "default_model": config.get("default_model"),
                        "base_url": config.get("base_url"),
                        "is_active": config.get("is_active", True),
                        "has_api_key": bool(config.get("api_key"))
                    })

        # Sort by priority (ascending - lowest number = highest priority)
        available.sort(key=lambda x: x["priority"])
        return available

    def select_best_provider(self,
                             requested_provider: Optional[str] = None,
                             requested_model: Optional[str] = None) -> tuple[str,
                                                                             str]:
        """
        Select the best available provider based on strategy and priority
        """
        try:
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            strategy = config_service.get_ai_provider_strategy()

            available_providers = self.get_available_providers()
            if not available_providers:
                raise ValueError("No AI providers available")

            # If specific provider requested and available, use it
            if requested_provider:
                for provider in available_providers:
                    if provider["name"] == requested_provider:
                        # Check if requested model is available
                        if requested_model:
                            if requested_model in [
                                m.get(
                                    "name",
                                    m) for m in provider["models"]]:
                                return requested_provider, requested_model
                            else:
                                # Use default model if requested not available
                                return requested_provider, provider.get(
                                    "default_model", provider["models"][0] if provider["models"] else "gpt-4")
                        else:
                            # Use default model
                            return requested_provider, provider.get(
                                "default_model", provider["models"][0] if provider["models"] else "gpt-4")

            # Select provider based on strategy
            if strategy == "priority":
                # Use highest priority provider
                best_provider = available_providers[0]
                return best_provider["name"], best_provider.get(
                    "default_model", best_provider["models"][0] if best_provider["models"] else "gpt-4")

            elif strategy == "cost":
                # Use cheapest provider with cost analysis
                cheapest_provider = self._select_cheapest_provider(
                    available_providers, config_service)
                return cheapest_provider["name"], cheapest_provider.get(
                    "default_model", cheapest_provider["models"][0] if cheapest_provider["models"] else "gpt-4")

            elif strategy == "performance":
                # Use provider with best performance metrics (response time,
                # success rate)
                best_provider = self._select_best_performance_provider(
                    available_providers, config_service)
                return best_provider["name"], best_provider.get(
                    "default_model", best_provider["models"][0] if best_provider["models"] else "gpt-4")

            elif strategy == "quality":
                # Use provider with best quality metrics (model capabilities,
                # accuracy)
                best_provider = self._select_best_quality_provider(
                    available_providers, config_service)
                return best_provider["name"], best_provider.get(
                    "default_model", best_provider["models"][0] if best_provider["models"] else "gpt-4")

            elif strategy == "speed":
                # Use provider with fastest response time
                best_provider = self._select_fastest_provider(
                    available_providers, config_service)
                return best_provider["name"], best_provider.get(
                    "default_model", best_provider["models"][0] if best_provider["models"] else "gpt-4")

            elif strategy == "fallback":
                # Try providers in priority order until one works
                for provider in available_providers:
                    try:
                        # For fallback strategy, we'll assume the provider is working if it has a config
                        # The actual testing will be done during the analysis
                        if provider.get("has_api_key", False):
                            return provider["name"], provider.get(
                                "default_model", provider["models"][0] if provider["models"] else "gpt-4")
                    except Exception:
                        continue

                # If all fail, raise error
                raise ValueError("No working AI providers available")

            else:
                # Default to priority
                best_provider = available_providers[0]
                return best_provider["name"], best_provider.get(
                    "default_model", best_provider["models"][0] if best_provider["models"] else "gpt-4")

        except Exception as e:
            logger.error(f"Error selecting best provider: {str(e)}")
            raise

    def _select_best_performance_provider(
            self, available_providers: List[Dict[str, Any]], config_service) -> Dict[str, Any]:
        """
        Select provider with best performance metrics (response time, success rate)
        """
        try:
            best_provider = None
            best_score = -1

            for provider in available_providers:
                # Calculate performance score based on multiple factors
                score = self._calculate_performance_score(
                    provider, config_service)

                if score > best_score:
                    best_score = score
                    best_provider = provider

            return best_provider or available_providers[0]

        except Exception as e:
            logger.error(
                f"Error selecting best performance provider: {
                    str(e)}")
            return available_providers[0]

    def _select_best_quality_provider(
            self, available_providers: List[Dict[str, Any]], config_service) -> Dict[str, Any]:
        """
        Select provider with best quality metrics (model capabilities, accuracy)
        """
        try:
            # Quality-based provider selection
            quality_ranking = {
                "claude": 100,      # Claude-3-Opus is considered highest quality
                "openai": 90,       # GPT-4 is high quality
                "mistral": 80,      # Mistral-Large is good quality
                "ollama": 60        # Local models are basic quality
            }

            best_provider = None
            best_quality = -1

            for provider in available_providers:
                quality_score = quality_ranking.get(provider["name"], 50)

                if quality_score > best_quality:
                    best_quality = quality_score
                    best_provider = provider

            return best_provider or available_providers[0]

        except Exception as e:
            logger.error(f"Error selecting best quality provider: {str(e)}")
            return available_providers[0]

    def _select_fastest_provider(
            self, available_providers: List[Dict[str, Any]], config_service) -> Dict[str, Any]:
        """
        Select provider with fastest response time
        """
        try:
            # Speed-based provider selection (estimated response times in
            # seconds)
            speed_ranking = {
                "ollama": 1.0,      # Local models are fastest
                "openai": 2.0,      # OpenAI is generally fast
                "mistral": 2.5,     # Mistral is moderately fast
                "claude": 3.0       # Claude can be slower but higher quality
            }

            fastest_provider = None
            fastest_time = float('inf')

            for provider in available_providers:
                estimated_time = speed_ranking.get(provider["name"], 5.0)

                if estimated_time < fastest_time:
                    fastest_time = estimated_time
                    fastest_provider = provider

            return fastest_provider or available_providers[0]

        except Exception as e:
            logger.error(f"Error selecting fastest provider: {str(e)}")
            return available_providers[0]

    def _calculate_performance_score(
            self, provider: Dict[str, Any], config_service) -> float:
        """
        Calculate performance score for a provider based on multiple metrics
        """
        try:
            base_score = 50.0

            # Factor 1: Priority (higher priority = better performance
            # assumption)
            priority = config_service.get_ai_provider_priority(
                provider["name"])
            # Priority 1 = 40 points, Priority 4 = 10 points
            priority_score = (5 - priority) * 10

            # Factor 2: Provider type (local vs cloud)
            if provider["name"] == "ollama":
                provider_score = 30  # Local is reliable but basic
            else:
                provider_score = 40  # Cloud providers are more capable

            # Factor 3: API key availability
            api_key_score = 20 if provider.get("has_api_key", False) else 0

            # Factor 4: Model capabilities (simplified)
            model_score = 10 if provider.get("models") else 0

            total_score = base_score + priority_score + \
                provider_score + api_key_score + model_score

            # Performance score calculated
            return total_score

        except Exception as e:
            logger.error(f"Error calculating performance score: {str(e)}")
            return 50.0  # Default score

    def _select_cheapest_provider(
            self, available_providers: List[Dict[str, Any]], config_service) -> Dict[str, Any]:
        """
        Select provider with lowest cost per token
        """
        try:
            cheapest_provider = None
            min_cost = float('inf')

            for provider in available_providers:
                # Get the cheapest model for this provider
                provider_min_cost = float('inf')

                for model in provider.get("models", []):
                    model_name = model.get("name", model)
                    cost = config_service.get_ai_provider_cost(
                        provider["name"], model_name)

                    if cost < provider_min_cost:
                        provider_min_cost = cost

                # If no cost data available, use default cost estimates
                if provider_min_cost == float('inf'):
                    default_costs = {
                        "ollama": 0.0,      # Local is free
                        "mistral": 0.005,   # Mistral is cheap
                        "openai": 0.03,     # GPT-3.5 is moderate
                        "claude": 0.015     # Claude is moderate
                    }
                    provider_min_cost = default_costs.get(
                        provider["name"], 0.01)

                if provider_min_cost < min_cost:
                    min_cost = provider_min_cost
                    cheapest_provider = provider

            # Selected cheapest provider
            return cheapest_provider or available_providers[0]

        except Exception as e:
            logger.error(f"Error selecting cheapest provider: {str(e)}")
            return available_providers[0]

    async def _test_provider(self, name: str, config: Dict[str, Any]) -> bool:
        """Test if a provider is available"""
        try:
            if name == "openai":
                return await self._test_openai(config)
            elif name == "claude":
                return await self._test_claude(config)
            elif name == "mistral":
                return await self._test_mistral(config)
            elif name == "ollama":
                return await self._test_ollama(config)
            else:
                return False
        except Exception as e:
            logger.error(f"Error testing provider {name}: {str(e)}")
            return False

    async def _test_openai(self, config: Dict[str, Any]) -> bool:
        """Test OpenAI provider"""
        try:
            api_key = config.get("api_key")
            if not api_key:
                logger.warning("OpenAI API key not found")
                return False

            # Test with a simple API call to list models
            import httpx

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers=headers
                )
                return response.status_code == 200

        except Exception as e:
            logger.error(f"Error testing OpenAI: {str(e)}")
            return False

    async def _test_claude(self, config: Dict[str, Any]) -> bool:
        """Test Claude provider"""
        try:
            api_key = config.get("api_key")
            if not api_key:
                logger.warning("Claude API key not found")
                return False

            # Test with a simple API call to list models
            import httpx

            headers = {
                "x-api-key": api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.anthropic.com/v1/models",
                    headers=headers
                )
                return response.status_code == 200

        except Exception as e:
            logger.error(f"Error testing Claude: {str(e)}")
            return False

    async def _test_mistral(self, config: Dict[str, Any]) -> bool:
        """Test Mistral provider"""
        try:
            api_key = config.get("api_key")
            if not api_key:
                logger.warning("Mistral API key not found")
                return False

            # Test with a simple API call to list models
            import httpx

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.mistral.ai/v1/models",
                    headers=headers
                )
                return response.status_code == 200

        except Exception as e:
            logger.error(f"Error testing Mistral: {str(e)}")
            return False

    async def _test_ollama(self, config: Dict[str, Any]) -> bool:
        """Test Ollama provider"""
        try:
            base_url = config.get("base_url", "http://localhost:11434")

            # Test with a simple API call to list models
            import httpx

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{base_url}/api/tags")
                return response.status_code == 200

        except Exception as e:
            logger.error(f"Error testing Ollama: {str(e)}")
            return False

    async def analyze_text(
        self,
        text: str,
        analysis_type: AnalysisType,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze text using best available AI provider or specified provider
        """
        try:
            start_time = time.time()

            # Select best provider if not specified
            if not provider:
                provider, model = self.select_best_provider()
                logger.info(
                    f"Auto-selected provider: {provider} with model: {model}")
            else:
                # Validate requested provider
                if provider not in self.providers:
                    raise ValueError(f"Provider {provider} not configured")

                # Select best model for this provider if not specified
                if not model:
                    provider_config = self.providers[provider]
                    model = provider_config.get("default_model", "gpt-4")

            provider_config = self.providers[provider]

            # Generate prompt based on analysis type
            prompt = self._generate_prompt(text, analysis_type, custom_prompt)

            # Call appropriate provider
            if provider == "openai":
                result = await self._call_openai(prompt, model, provider_config)
            elif provider == "claude":
                result = await self._call_claude(prompt, model, provider_config)
            elif provider == "mistral":
                result = await self._call_mistral(prompt, model, provider_config)
            elif provider == "ollama":
                result = await self._call_ollama(prompt, model, provider_config)
            else:
                raise ValueError(f"Unsupported provider: {provider}")

            processing_time = time.time() - start_time

            # Calculate estimated cost
            from .config_service import ConfigService
            config_service = ConfigService(self.db)
            estimated_tokens = len(text.split()) * 1.3  # Rough estimate
            cost_per_1k = config_service.get_ai_provider_cost(provider, model)
            estimated_cost = (estimated_tokens / 1000) * cost_per_1k

            return {
                "result": result,
                "provider": provider,
                "model": model,
                "analysis_type": analysis_type,
                "processing_time": processing_time,
                "tokens_used": estimated_tokens,
                "estimated_cost": estimated_cost,
                "prompt_used": prompt,
                "timestamp": time.time()
            }

        except Exception as e:
            logger.error(f"Error in AI analysis: {str(e)}")
            return {
                "result": None,
                "provider": provider or "unknown",
                "model": model or "unknown",
                "analysis_type": analysis_type,
                "error": str(e),
                "success": False
            }

    def _generate_prompt(
            self,
            text: str,
            analysis_type: AnalysisType,
            custom_prompt: Optional[str] = None) -> str:
        """Generate analysis prompt based on type"""
        if custom_prompt:
            return f"{custom_prompt}\n\nDocument:\n{text}"

        base_prompts = {
            AnalysisType.JURIDICAL: """
            Analysez ce document juridique de manière approfondie. Identifiez :
            1. Les parties impliquées
            2. Les clauses importantes
            3. Les obligations et droits
            4. Les échéances et délais
            5. Les risques potentiels
            6. La conformité avec la législation française
            7. Les recommandations d'actions

            Document :
            {text}
            """,

            AnalysisType.TECHNICAL: """
            Analysez ce document technique en détail. Identifiez :
            1. Les spécifications techniques
            2. Les normes applicables (DTU, NF, EN, ISO)
            3. Les exigences réglementaires
            4. Les points de conformité
            5. Les anomalies ou incohérences
            6. Les recommandations techniques

            Document :
            {text}
            """,

            AnalysisType.ADMINISTRATIVE: """
            Analysez ce document administratif. Identifiez :
            1. La nature du document
            2. Les procédures administratives
            3. Les délais et échéances
            4. Les pièces justificatives requises
            5. Les points d'attention
            6. Les actions à entreprendre

            Document :
            {text}
            """,

            AnalysisType.GENERAL: """
            Analysez ce document de manière générale. Fournissez :
            1. Un résumé exécutif
            2. Les points clés
            3. Les informations importantes
            4. Les actions recommandées
            5. Les questions à clarifier

            Document :
            {text}
            """,

            AnalysisType.OCR: """
            Ce texte a été extrait par OCR. Analysez-le pour :
            1. Identifier les erreurs de reconnaissance
            2. Corriger les fautes évidentes
            3. Structurer le contenu
            4. Extraire les informations clés

            Texte extrait :
            {text}
            """
        }

        prompt_template = base_prompts.get(
            analysis_type, base_prompts[AnalysisType.GENERAL])
        return prompt_template.format(text=text)

    async def _call_openai(self, prompt: str, model: str,
                           config: Dict[str, Any]) -> str:
        """Call OpenAI API"""
        try:
            # Simulate API call for now
            # In production, you'd use the actual OpenAI client
            await asyncio.sleep(1)  # Simulate API delay

            # Mock response
            return f"Analyse OpenAI ({model}): {prompt[:100]}..."

        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise

    async def _call_claude(self, prompt: str, model: str,
                           config: Dict[str, Any]) -> str:
        """Call Claude API"""
        try:
            # Simulate API call for now
            await asyncio.sleep(1)

            return f"Analyse Claude ({model}): {prompt[:100]}..."

        except Exception as e:
            logger.error(f"Claude API error: {str(e)}")
            raise

    async def _call_mistral(self, prompt: str, model: str,
                            config: Dict[str, Any]) -> str:
        """Call Mistral API"""
        try:
            # Simulate API call for now
            await asyncio.sleep(1)

            return f"Analyse Mistral ({model}): {prompt[:100]}..."

        except Exception as e:
            logger.error(f"Mistral API error: {str(e)}")
            raise

    async def _call_ollama(self, prompt: str, model: str,
                           config: Dict[str, Any]) -> str:
        """Call Ollama API"""
        try:
            # Simulate API call for now
            await asyncio.sleep(1)

            return f"Analyse Ollama ({model}): {prompt[:100]}..."

        except Exception as e:
            logger.error(f"Ollama API error: {str(e)}")
            raise

    def validate_provider_config(
            self, provider: str, config: Dict[str, Any]) -> bool:
        """Validate provider configuration"""
        try:
            if provider == "openai":
                return "api_key" in config and config["api_key"]
            elif provider == "claude":
                return "api_key" in config and config["api_key"]
            elif provider == "mistral":
                return "api_key" in config and config["api_key"]
            elif provider == "ollama":
                return "base_url" in config
            else:
                return False
        except Exception:
            return False

    def save_provider_config(
            self, provider: str, config: Dict[str, Any]) -> bool:
        """Save provider configuration to database"""
        try:
            config_key = f"provider_{provider}"
            config_value = json.dumps(config)

            # Check if config exists
            existing = self.db.query(Config).filter(
                Config.key == config_key).first()

            if existing:
                existing.value = config_value
            else:
                new_config = Config(
                    key=config_key,
                    value=config_value,
                    category="ai",
                    description=f"Configuration for {provider} AI provider"
                )
                self.db.add(new_config)

            self.db.commit()

            # Update in-memory providers
            self.providers[provider] = config

            logger.info(f"Saved configuration for provider {provider}")
            return True

        except Exception as e:
            logger.error(f"Error saving provider config: {str(e)}")
            self.db.rollback()
            return False

    def get_provider_config(self, provider: str) -> Optional[Dict[str, Any]]:
        """Get provider configuration"""
        return self.providers.get(provider)

    def delete_provider_config(self, provider: str) -> bool:
        """Delete provider configuration"""
        try:
            config_key = f"provider_{provider}"

            # Remove from database
            config = self.db.query(Config).filter(
                Config.key == config_key).first()
            if config:
                self.db.delete(config)
                self.db.commit()

            # Remove from in-memory providers
            if provider in self.providers:
                del self.providers[provider]

            logger.info(f"Deleted configuration for provider {provider}")
            return True

        except Exception as e:
            logger.error(f"Error deleting provider config: {str(e)}")
            self.db.rollback()
            return False
