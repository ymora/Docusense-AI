// Service pour la gestion des prompts universels
import { handleApiError, DEFAULT_TIMEOUT } from '../utils/apiUtils';
import unifiedApiService from './unifiedApiService';

export interface UniversalPrompt {
  id: string;
  name: string;
  description: string;
  domain: string;
  type: string;
  prompt: string;
  output_format: string;
  use_cases: string[];
}

export interface PromptRecommendation {
  id: string;
  name: string;
  description: string;
  type: string;
  relevance_score: number;
}

export interface PromptSummary {
  domain: string;
  name: string;
  description: string;
  prompts: {
    id: string;
    name: string;
    description: string;
    type: string;
    use_cases: string[];
  }[];
}

// Interface de compatibilité pour l'ancienne API
export interface Prompt {
  id: string;
  name: string;
  description: string;
  domain: string;
  type: string;
  content?: string;
  prompt?: string;
}

export const promptService = {
  // Récupérer tous les prompts universels
  async getAllUniversalPrompts(): Promise<Record<string, UniversalPrompt>> {
    try {
      const response = await unifiedApiService.get('/api/prompts/universal');
      return response.data || {};
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des prompts universels: ${handleApiError(error)}`);
    }
  },

  // Récupérer le résumé des prompts universels
  async getPromptsSummary(): Promise<Record<string, PromptSummary>> {
    try {
      const response = await unifiedApiService.get('/api/prompts/summary');
      return response.data || {};
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du résumé: ${handleApiError(error)}`);
    }
  },

  // Récupérer un prompt universel spécifique
  async getUniversalPrompt(promptId: string): Promise<UniversalPrompt> {
    try {
      const response = await unifiedApiService.get(`/api/prompts/universal/${promptId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du prompt universel: ${handleApiError(error)}`);
    }
  },

  // Récupérer les recommandations de prompts basées sur le type de fichier et le contexte
  async getPromptRecommendations(fileType?: string, context?: string): Promise<PromptRecommendation[]> {
    try {
      const params = new URLSearchParams();
      if (fileType) params.append('file_type', fileType);
      if (context) params.append('context', context);
      
      const response = await unifiedApiService.get(`/api/prompts/recommendations?${params.toString()}`);
      return response.data?.recommendations || [];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des recommandations: ${handleApiError(error)}`);
    }
  },

  // Récupérer les prompts par cas d'usage
  async getPromptsByUseCase(useCase: string): Promise<UniversalPrompt[]> {
    try {
      const response = await unifiedApiService.get(`/api/prompts/use-case/${useCase}`);
      return response.data?.prompts || [];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des prompts par cas d'usage: ${handleApiError(error)}`);
    }
  },

  // Formater un prompt avec du texte
  async formatPrompt(promptId: string, text: string): Promise<string> {
    try {
      const params = new URLSearchParams({ text });
      const response = await unifiedApiService.get(`/api/prompts/format/${promptId}?${params.toString()}`);
      return response.data?.formatted_prompt || '';
    } catch (error) {
      throw new Error(`Erreur lors du formatage du prompt: ${handleApiError(error)}`);
    }
  },

  // Recharger les prompts
  async reloadPrompts(): Promise<boolean> {
    try {
      const response = await unifiedApiService.post('/api/prompts/reload');
      return response.data?.reloaded || false;
    } catch (error) {
      throw new Error(`Erreur lors du rechargement des prompts: ${handleApiError(error)}`);
    }
  },

  // Méthodes de compatibilité pour l'ancienne API
  async getAllPrompts(): Promise<{ default_prompts: Record<string, string>; specialized_prompts: Record<string, Prompt> }> {
    try {
      const response = await unifiedApiService.get('/api/prompts');
      return response.data || { default_prompts: {}, specialized_prompts: {} };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des prompts: ${handleApiError(error)}`);
    }
  },

  async getDefaultPrompts(): Promise<Record<string, string>> {
    try {
      const response = await unifiedApiService.get('/api/prompts/default');
      return response.data || {};
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des prompts par défaut: ${handleApiError(error)}`);
    }
  },

  async getDefaultPrompt(analysisType: string): Promise<{ analysis_type: string; prompt: string }> {
    try {
      const response = await unifiedApiService.get(`/api/prompts/default/${analysisType}`);
      return response.data || { analysis_type: analysisType, prompt: '' };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du prompt par défaut: ${handleApiError(error)}`);
    }
  },

  async getDefaultPromptsOnly(): Promise<Record<string, string>> {
    // Données par défaut sans requête API pour les prompts universels
    const defaultPrompts: Record<string, string> = {
      'GENERAL': 'Analysez le contenu de ce document de manière générale.',
      'TECHNICAL': 'Vérifiez la conformité technique de ce document.',
      'ADMINISTRATIVE': 'Préparez un dossier administratif basé sur ce document.',
      'JURIDICAL': 'Analysez les aspects juridiques de ce document.',
      'COMPARISON': 'Comparez ce document avec d\'autres documents similaires.'
    };
    
    return defaultPrompts;
  },

  async getSpecializedPrompts(): Promise<Record<string, Prompt>> {
    try {
      const response = await unifiedApiService.get('/api/prompts/specialized');
      return response.data || {};
    } catch (error) {
      // Données par défaut en cas d'erreur API - prompts universels
      const defaultPrompts: Record<string, Prompt> = {
        'problem_analysis': {
          id: 'problem_analysis',
          name: '🔍 Analyse de Problème',
          description: 'Détecte et analyse les problèmes dans vos documents pour vous aider à agir',
          domain: 'universal',
          type: 'analysis',
          prompt: 'Tu es un expert en analyse de problèmes documentaires...'
        },
        'contract_comparison': {
          id: 'contract_comparison',
          name: '⚖️ Comparaison de Contrats',
          description: 'Compare plusieurs documents pour identifier les différences et opportunités',
          domain: 'universal',
          type: 'comparison',
          prompt: 'Tu es un expert en analyse comparative de documents...'
        },
        'dossier_preparation': {
          id: 'dossier_preparation',
          name: '📋 Préparation de Dossier',
          description: 'Prépare un dossier complet pour procédure, action ou décision',
          domain: 'universal',
          type: 'preparation',
          prompt: 'Tu es un expert en préparation de dossiers...'
        },
        'compliance_verification': {
          id: 'compliance_verification',
          name: '🛡️ Vérification de Conformité',
          description: 'Vérifie la conformité aux normes, règles et obligations',
          domain: 'universal',
          type: 'verification',
          prompt: 'Tu es un expert en vérification de conformité...'
        },
        'communication_analysis': {
          id: 'communication_analysis',
          name: '📧 Analyse de Communication',
          description: 'Analyse les échanges et communications pour identifier les problèmes et opportunités',
          domain: 'universal',
          type: 'analysis',
          prompt: 'Tu es un expert en analyse de communication...'
        }
      };
      
      return defaultPrompts;
    }
  },

  // Utilitaires pour l'interface utilisateur
  getPromptIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'analysis': '🔍',
      'comparison': '⚖️',
      'preparation': '📋',
      'verification': '🛡️',
      'communication': '📧'
    };
    return iconMap[type] || '📄';
  },

  getPromptColor(type: string): string {
    const colorMap: Record<string, string> = {
      'analysis': 'text-blue-500',
      'comparison': 'text-green-500',
      'preparation': 'text-purple-500',
      'verification': 'text-orange-500',
      'communication': 'text-pink-500'
    };
    return colorMap[type] || 'text-gray-500';
  },

  getUseCaseDescription(useCase: string): string {
    const descriptions: Record<string, string> = {
      'construction_litigation': 'Litiges de construction',
      'contract_disputes': 'Conflits contractuels',
      'quality_issues': 'Problèmes de qualité',
      'compliance_problems': 'Problèmes de conformité',
      'communication_conflicts': 'Conflits de communication',
      'insurance_comparison': 'Comparaison d\'assurances',
      'contract_negotiation': 'Négociation de contrats',
      'supplier_selection': 'Sélection de fournisseurs',
      'service_comparison': 'Comparaison de services',
      'proposal_evaluation': 'Évaluation de propositions',
      'litigation_preparation': 'Préparation de litige',
      'expert_report': 'Rapport d\'expert',
      'insurance_claim': 'Réclamation d\'assurance',
      'administrative_appeal': 'Recours administratif',
      'contract_termination': 'Résiliation de contrat',
      'technical_compliance': 'Conformité technique',
      'legal_compliance': 'Conformité juridique',
      'contract_compliance': 'Conformité contractuelle',
      'regulatory_audit': 'Audit réglementaire',
      'quality_control': 'Contrôle qualité',
      'email_analysis': 'Analyse d\'emails',
      'correspondence_tracking': 'Suivi de correspondance',
      'response_monitoring': 'Surveillance des réponses',
      'communication_strategy': 'Stratégie de communication',
      'evidence_collection': 'Collecte de preuves'
    };
    return descriptions[useCase] || useCase;
  }
};