"""
Prompt service for DocuSense AI
Handles universal prompts that adapt intelligently to context
"""

import json
import logging
import os
from typing import Dict, Any, Optional, List
from enum import Enum

from .base_service import BaseService, log_service_operation
from ..core.types import ServiceResponse, PromptData


class PromptType(Enum):
    """Universal prompt types"""
    PROBLEM_ANALYSIS = "problem_analysis"
    CONTRACT_COMPARISON = "contract_comparison"
    DOSSIER_PREPARATION = "dossier_preparation"
    COMPLIANCE_VERIFICATION = "compliance_verification"
    COMMUNICATION_ANALYSIS = "communication_analysis"


class PromptService(BaseService):
    """Service for managing universal prompts"""

    def __init__(self, db=None):
        # Ne pas appeler super().__init__(db) car ce service n'a pas besoin de base de données
        self.logger = logging.getLogger(__name__)
        self.prompts_file = os.path.join(
            os.path.dirname(__file__), '..', 'data', 'prompts.json')
        self.prompts_data = self._load_prompts_from_json()
        self._cache = {}
        self._cache_timestamp = None

    def _load_prompts_from_json(self) -> Dict[str, Any]:
        """Load prompts from JSON file"""
        try:
            return self._load_prompts_logic()
        except Exception as e:
            self.logger.error(f"Error loading prompts: {str(e)}")
            return {"universal_prompts": {}}

    def _load_prompts_logic(self) -> Dict[str, Any]:
        """Logic for loading prompts from JSON file"""
        if not os.path.exists(self.prompts_file):
            self.logger.error(f"Prompts file not found: {self.prompts_file}")
            return {"universal_prompts": {}}

        with open(self.prompts_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.logger.info(f"Loaded {len(data.get('universal_prompts', {}))} universal prompts")
            return data

    def get_universal_prompt(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific universal prompt by ID"""
        try:
            return self._get_universal_prompt_logic(prompt_id)
        except Exception as e:
            self.logger.error(f"Error getting universal prompt: {str(e)}")
            return None

    def _get_universal_prompt_logic(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Logic for getting specific universal prompt"""
        return self.prompts_data.get("universal_prompts", {}).get(prompt_id)

    def get_all_universal_prompts(self) -> Dict[str, Dict[str, Any]]:
        """Get all available universal prompts"""
        try:
            return self._get_all_universal_prompts_logic()
        except Exception as e:
            self.logger.error(f"Error getting all universal prompts: {str(e)}")
            return {}

    def _get_all_universal_prompts_logic(self) -> Dict[str, Dict[str, Any]]:
        """Logic for getting all universal prompts"""
        # Utiliser le cache pour améliorer les performances
        cache_key = "all_universal_prompts"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        result = self.prompts_data.get("universal_prompts", {})
        self._cache[cache_key] = result
        return result

    def format_prompt(self, prompt_id: str, text: str) -> Optional[str]:
        """Format a universal prompt with the given text"""
        try:
            return self._format_prompt_logic(prompt_id, text)
        except Exception as e:
            self.logger.error(f"Error formatting prompt: {str(e)}")
            return None

    def _format_prompt_logic(self, prompt_id: str, text: str) -> Optional[str]:
        """Logic for formatting prompt"""
        prompt = self.get_universal_prompt(prompt_id)
        if not prompt:
            return None
        return prompt["prompt"].format(text=text)

    def get_prompts_by_use_case(self, use_case: str) -> List[Dict[str, Any]]:
        """Get prompts that are relevant for a specific use case"""
        try:
            return self._get_prompts_by_use_case_logic(use_case)
        except Exception as e:
            self.logger.error(f"Error getting prompts by use case: {str(e)}")
            return []

    def _get_prompts_by_use_case_logic(self, use_case: str) -> List[Dict[str, Any]]:
        """Logic for getting prompts by use case"""
        universal_prompts = self.prompts_data.get("universal_prompts", {})
        relevant_prompts = []
        
        for prompt_id, prompt in universal_prompts.items():
            if use_case in prompt.get("use_cases", []):
                relevant_prompts.append({
                    "id": prompt_id,
                    **prompt
                })
        
        return relevant_prompts

    def get_prompts_summary(self) -> Dict[str, Any]:
        """Get a summary of all universal prompts"""
        try:
            return self._get_prompts_summary_logic()
        except Exception as e:
            self.logger.error(f"Error getting prompts summary: {str(e)}")
            return {}

    def _get_prompts_summary_logic(self) -> Dict[str, Any]:
        """Logic for getting prompts summary"""
        summary = {
            "universal": {
                "name": "Prompts Universels",
                "description": "5 prompts intelligents qui s'adaptent au contexte",
                "prompts": []
            }
        }
        
        universal_prompts = self.prompts_data.get("universal_prompts", {})
        
        for prompt_id, prompt in universal_prompts.items():
            summary["universal"]["prompts"].append({
                "id": prompt_id,
                "name": prompt["name"],
                "description": prompt["description"],
                "type": prompt["type"],
                "use_cases": prompt.get("use_cases", [])
            })

        return summary

    def get_prompt_recommendations(self, file_type: str = None, context: str = None) -> List[Dict[str, Any]]:
        """Get prompt recommendations based on file type and context"""
        try:
            return self._get_prompt_recommendations_logic(file_type, context)
        except Exception as e:
            self.logger.error(f"Error getting prompt recommendations: {str(e)}")
            return []

    def _get_prompt_recommendations_logic(self, file_type: str = None, context: str = None) -> List[Dict[str, Any]]:
        """Logic for getting prompt recommendations"""
        universal_prompts = self.prompts_data.get("universal_prompts", {})
        recommendations = []
        
        # Mapping des types de fichiers vers les cas d'usage
        file_type_mapping = {
            "pdf": ["contract_disputes", "litigation_preparation", "compliance_problems"],
            "docx": ["contract_negotiation", "communication_conflicts", "quality_issues"],
            "jpg": ["construction_litigation", "quality_issues", "evidence_collection"],
            "png": ["construction_litigation", "quality_issues", "evidence_collection"],
            "email": ["communication_analysis", "email_analysis", "correspondence_tracking"]
        }
        
        # Mapping du contexte vers les cas d'usage
        context_mapping = {
            "construction": ["construction_litigation", "technical_compliance", "quality_issues"],
            "contract": ["contract_disputes", "contract_negotiation", "contract_compliance"],
            "insurance": ["insurance_comparison", "insurance_claim", "contract_comparison"],
            "legal": ["litigation_preparation", "legal_compliance", "evidence_collection"],
            "communication": ["communication_analysis", "email_analysis", "correspondence_tracking"]
        }
        
        relevant_use_cases = set()
        
        # Ajouter les cas d'usage basés sur le type de fichier
        if file_type and file_type in file_type_mapping:
            relevant_use_cases.update(file_type_mapping[file_type])
        
        # Ajouter les cas d'usage basés sur le contexte
        if context and context in context_mapping:
            relevant_use_cases.update(context_mapping[context])
        
        # Si aucun cas d'usage spécifique, recommander tous les prompts
        if not relevant_use_cases:
            relevant_use_cases = set()
            for prompt in universal_prompts.values():
                relevant_use_cases.update(prompt.get("use_cases", []))
        
        # Trouver les prompts pertinents
        for prompt_id, prompt in universal_prompts.items():
            prompt_use_cases = set(prompt.get("use_cases", []))
            if relevant_use_cases & prompt_use_cases:  # Intersection
                recommendations.append({
                    "id": prompt_id,
                    "name": prompt["name"],
                    "description": prompt["description"],
                    "type": prompt["type"],
                    "relevance_score": len(relevant_use_cases & prompt_use_cases) / len(prompt_use_cases)
                })
        
        # Trier par score de pertinence
        recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return recommendations

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
            self._cache.clear()  # Vider le cache
            self.logger.info("Universal prompts reloaded successfully")
            return True
        except Exception as e:
            self.logger.error(f"Error reloading prompts: {str(e)}")
            return False

    # Méthodes de compatibilité pour l'ancienne API
    def get_default_prompt(self, analysis_type: str) -> Optional[str]:
        """Get default prompt for analysis type (compatibility method)"""
        # Mapper les anciens types vers les nouveaux prompts universels
        mapping = {
            "JURIDICAL": "problem_analysis",
            "TECHNICAL": "compliance_verification", 
            "ADMINISTRATIVE": "dossier_preparation",
            "GENERAL": "problem_analysis",
            "OCR": "problem_analysis"
        }
        
        prompt_id = mapping.get(analysis_type, "problem_analysis")
        prompt = self.get_universal_prompt(prompt_id)
        return prompt["prompt"] if prompt else None

    def get_prompt(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific prompt by ID (compatibility method)"""
        return self.get_universal_prompt(prompt_id)

    def get_all_prompts(self) -> Dict[str, Dict[str, Any]]:
        """Get all available prompts (compatibility method)"""
        return self.get_all_universal_prompts()
