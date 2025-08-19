"""
Prompt service for DocuSense AI
Handles specialized prompts for different domains
"""

import json
import logging
import os
from typing import Dict, Any, Optional
from enum import Enum

from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, PromptData


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


class PromptService(BaseService):
    """Service for managing specialized prompts"""

    def __init__(self, db=None):
        # Ne pas appeler super().__init__(db) car ce service n'a pas besoin de base de données
        self.logger = logging.getLogger(__name__)
        self.prompts_file = os.path.join(
            os.path.dirname(__file__), '..', 'data', 'prompts.json')
        self.prompts_data = self._load_prompts_from_json()

    def _load_prompts_from_json(self) -> Dict[str, Any]:
        """Load prompts from JSON file"""
        try:
            return self._load_prompts_logic()
        except Exception as e:
            self.logger.error(f"Error loading prompts: {str(e)}")
            return {"default_prompts": {}, "specialized_prompts": {}}

    def _load_prompts_logic(self) -> Dict[str, Any]:
        """Logic for loading prompts from JSON file"""
        if not os.path.exists(self.prompts_file):
            self.logger.error(f"Prompts file not found: {self.prompts_file}")
            return {"default_prompts": {}, "specialized_prompts": {}}

        with open(self.prompts_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.logger.info(f"Loaded {len(data.get('specialized_prompts', {}))} specialized prompts and {len(data.get('default_prompts', {}))} default prompts")
            return data

    def get_default_prompt(self, analysis_type: str) -> Optional[str]:
        """Get default prompt for analysis type"""
        try:
            return self._get_default_prompt_logic(analysis_type)
        except Exception as e:
            self.logger.error(f"Error getting default prompt: {str(e)}")
            return None

    def _get_default_prompt_logic(self, analysis_type: str) -> Optional[str]:
        """Logic for getting default prompt"""
        return self.prompts_data.get("default_prompts", {}).get(analysis_type)

    def get_prompts_by_domain(self, domain: PromptDomain) -> Dict[str, Dict[str, Any]]:
        """Get all prompts for a specific domain"""
        try:
            return self._get_prompts_by_domain_logic(domain)
        except Exception as e:
            self.logger.error(f"Error getting prompts by domain: {str(e)}")
            return {}

    def _get_prompts_by_domain_logic(self, domain: PromptDomain) -> Dict[str, Dict[str, Any]]:
        """Logic for getting prompts by domain"""
        specialized_prompts = self.prompts_data.get("specialized_prompts", {})
        return {
            key: prompt for key, prompt in specialized_prompts.items()
            if prompt.get("domain") == domain.value
        }

    def get_prompts_by_type(self, prompt_type: PromptType) -> Dict[str, Dict[str, Any]]:
        """Get all prompts of a specific type"""
        try:
            return self._get_prompts_by_type_logic(prompt_type)
        except Exception as e:
            self.logger.error(f"Error getting prompts by type: {str(e)}")
            return {}

    def _get_prompts_by_type_logic(self, prompt_type: PromptType) -> Dict[str, Dict[str, Any]]:
        """Logic for getting prompts by type"""
        specialized_prompts = self.prompts_data.get("specialized_prompts", {})
        return {
            key: prompt for key, prompt in specialized_prompts.items()
            if prompt.get("type") == prompt_type.value
        }

    def get_prompt(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific prompt by ID"""
        try:
            return self._get_prompt_logic(prompt_id)
        except Exception as e:
            self.logger.error(f"Error getting prompt: {str(e)}")
            return None

    def _get_prompt_logic(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Logic for getting specific prompt"""
        return self.prompts_data.get("specialized_prompts", {}).get(prompt_id)

    def format_prompt(self, prompt_id: str, text: str) -> Optional[str]:
        """Format a prompt with the given text"""
        try:
            return self._format_prompt_logic(prompt_id, text)
        except Exception as e:
            self.logger.error(f"Error formatting prompt: {str(e)}")
            return None

    def _format_prompt_logic(self, prompt_id: str, text: str) -> Optional[str]:
        """Logic for formatting prompt"""
        prompt = self.get_prompt(prompt_id)
        if not prompt:
            return None
        return prompt["prompt"].format(text=text)

    def get_all_prompts(self) -> Dict[str, Dict[str, Any]]:
        """Get all available prompts"""
        try:
            return self._get_all_prompts_logic()
        except Exception as e:
            self.logger.error(f"Error getting all prompts: {str(e)}")
            return {}

    def _get_all_prompts_logic(self) -> Dict[str, Dict[str, Any]]:
        """Logic for getting all prompts"""
        return self.prompts_data.get("specialized_prompts", {})

    def get_all_default_prompts(self) -> Dict[str, str]:
        """Get all default prompts"""
        try:
            return self._get_all_default_prompts_logic()
        except Exception as e:
            self.logger.error(f"Error getting default prompts: {str(e)}")
            return {}

    def _get_all_default_prompts_logic(self) -> Dict[str, str]:
        """Logic for getting all default prompts"""
        return self.prompts_data.get("default_prompts", {})

    def get_prompts_summary(self) -> Dict[str, Any]:
        """Get a summary of all prompts organized by domain"""
        try:
            return self._get_prompts_summary_logic()
        except Exception as e:
            self.logger.error(f"Error getting prompts summary: {str(e)}")
            return {}

    def _get_prompts_summary_logic(self) -> Dict[str, Any]:
        """Logic for getting prompts summary"""
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
            return self._reload_prompts_logic()
        except Exception as e:
            self.logger.error(f"Error reloading prompts: {str(e)}")
            return False

    def _reload_prompts_logic(self) -> bool:
        """Logic for reloading prompts"""
        try:
            self.prompts_data = self._load_prompts_from_json()
            self.logger.info("Prompts reloaded successfully")
            return True
        except Exception as e:
            self.logger.error(f"Error reloading prompts: {str(e)}")
            return False
