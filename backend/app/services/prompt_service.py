"""
Prompt service for DocuSense AI
Handles specialized prompts for different domains
"""

import json
import os
from typing import Dict, Any, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class PromptDomain(Enum):
    """Prompt domains"""
    JURIDICAL = "juridical"
    TECHNICAL = "technical"
    ADMINISTRATIVE = "administrative"
    GENERAL = "general"


class PromptType(Enum):
    """Prompt types"""
    ANALYSIS = "analysis"
    SUMMARY = "summary"
    VERIFICATION = "verification"
    EXTRACTION = "extraction"
    COMPARISON = "comparison"


class PromptService:
    """Service for managing specialized prompts"""

    def __init__(self):
        self.prompts_file = os.path.join(
            os.path.dirname(__file__), '..', 'data', 'prompts.json')
        self.prompts_data = self._load_prompts_from_json()

    def _load_prompts_from_json(self) -> Dict[str, Any]:
        """Load prompts from JSON file"""
        try:
            if not os.path.exists(self.prompts_file):
                logger.error(f"Prompts file not found: {self.prompts_file}")
                return {"default_prompts": {}, "specialized_prompts": {}}

            with open(self.prompts_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logger.info(f"Loaded {len(data.get('specialized_prompts',
                                                   {}))} specialized prompts and {len(data.get('default_prompts',
                                                                                               {}))} default prompts")
                return data

        except Exception as e:
            logger.error(f"Error loading prompts from JSON: {str(e)}")
            return {"default_prompts": {}, "specialized_prompts": {}}

    def get_default_prompt(self, analysis_type: str) -> Optional[str]:
        """Get default prompt for analysis type"""
        return self.prompts_data.get("default_prompts", {}).get(analysis_type)

    def get_prompts_by_domain(
            self, domain: PromptDomain) -> Dict[str, Dict[str, Any]]:
        """Get all prompts for a specific domain"""
        specialized_prompts = self.prompts_data.get("specialized_prompts", {})
        return {
            key: prompt for key, prompt in specialized_prompts.items()
            if prompt.get("domain") == domain.value
        }

    def get_prompts_by_type(
            self, prompt_type: PromptType) -> Dict[str, Dict[str, Any]]:
        """Get all prompts of a specific type"""
        specialized_prompts = self.prompts_data.get("specialized_prompts", {})
        return {
            key: prompt for key, prompt in specialized_prompts.items()
            if prompt.get("type") == prompt_type.value
        }

    def get_prompt(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific prompt by ID"""
        return self.prompts_data.get("specialized_prompts", {}).get(prompt_id)

    def format_prompt(self, prompt_id: str, text: str) -> Optional[str]:
        """Format a prompt with the given text"""
        prompt = self.get_prompt(prompt_id)
        if not prompt:
            return None

        return prompt["prompt"].format(text=text)

    def get_all_prompts(self) -> Dict[str, Dict[str, Any]]:
        """Get all available prompts"""
        return self.prompts_data.get("specialized_prompts", {})

    def get_all_default_prompts(self) -> Dict[str, str]:
        """Get all default prompts"""
        return self.prompts_data.get("default_prompts", {})

    def get_prompts_summary(self) -> Dict[str, Any]:
        """Get a summary of all prompts organized by domain"""
        summary = {}
        specialized_prompts = self.prompts_data.get("specialized_prompts", {})

        for domain in PromptDomain:
            domain_prompts = {
                key: prompt for key, prompt in specialized_prompts.items()
                if prompt.get("domain") == domain.value
            }
            summary[domain.value] = {
                "name": domain.value.title(),
                "prompts": [
                    {
                        "id": key,
                        "name": prompt["name"],
                        "description": prompt["description"],
                        "type": prompt["type"]
                    }
                    for key, prompt in domain_prompts.items()
                ]
            }

        return summary

    def reload_prompts(self) -> bool:
        """Reload prompts from JSON file"""
        try:
            self.prompts_data = self._load_prompts_from_json()
            logger.info("Prompts reloaded successfully")
            return True
        except Exception as e:
            logger.error(f"Error reloading prompts: {str(e)}")
            return False
