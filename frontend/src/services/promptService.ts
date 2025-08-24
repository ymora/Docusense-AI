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

export interface Prompt {
  id: string;
  name: string;
  description: string;
  domain: string;
  type: string;
  prompt: string;
  output_format?: string;
}

export const promptService = {
  // Récupérer tous les prompts universels (NOUVEAU SYSTÈME)
  async getAllUniversalPrompts(): Promise<Record<string, UniversalPrompt>> {
    try {
      const response = await unifiedApiService.get('/api/prompts/universal');
      return response.data || {};
    } catch (error) {
      console.warn('Erreur API prompts universels, utilisation des données par défaut:', error);
      return this.getDefaultUniversalPrompts();
    }
  },

  // Récupérer les recommandations de prompts (NOUVEAU SYSTÈME)
  async getPromptRecommendations(
    fileType?: string, 
    context?: string
  ): Promise<PromptRecommendation[]> {
    try {
      const params = new URLSearchParams();
      if (fileType) params.append('file_type', fileType);
      if (context) params.append('context', context);
      
      const response = await unifiedApiService.get(`/api/prompts/recommendations?${params}`);
      return response.data || [];
    } catch (error) {
      console.warn('Erreur API recommandations, utilisation des recommandations par défaut:', error);
      return this.getDefaultRecommendations(fileType, context);
    }
  },

  // Prompts universels par défaut (fallback)
  getDefaultUniversalPrompts(): Record<string, UniversalPrompt> {
    return {
      'problem_analysis': {
        id: 'problem_analysis',
        name: '🔍 Analyse de Problème',
        description: 'Détecte et analyse les problèmes dans vos documents pour vous aider à agir',
        domain: 'universal',
        type: 'analysis',
        prompt: 'Tu es un expert en analyse de problèmes documentaires. Analyse le document suivant pour identifier et analyser tous les problèmes potentiels...',
        output_format: 'structured',
        use_cases: ['construction_litigation', 'contract_disputes', 'quality_issues', 'compliance_problems', 'communication_conflicts']
      },
      'contract_comparison': {
        id: 'contract_comparison',
        name: '⚖️ Comparaison de Contrats',
        description: 'Compare plusieurs documents pour identifier les différences et opportunités',
        domain: 'universal',
        type: 'comparison',
        prompt: 'Tu es un expert en analyse comparative de documents. Compare les documents suivants pour identifier les différences, incohérences et opportunités...',
        output_format: 'structured',
        use_cases: ['insurance_comparison', 'contract_negotiation', 'supplier_selection', 'service_comparison', 'proposal_evaluation']
      },
      'dossier_preparation': {
        id: 'dossier_preparation',
        name: '📋 Préparation de Dossier',
        description: 'Prépare un dossier complet pour procédure, action ou décision',
        domain: 'universal',
        type: 'preparation',
        prompt: 'Tu es un expert en préparation de dossiers. Prépare un dossier complet et structuré basé sur le document suivant...',
        output_format: 'structured',
        use_cases: ['litigation_preparation', 'expert_report', 'insurance_claim', 'administrative_appeal', 'contract_termination']
      },
      'compliance_verification': {
        id: 'compliance_verification',
        name: '🛡️ Vérification de Conformité',
        description: 'Vérifie la conformité aux normes, règles et obligations',
        domain: 'universal',
        type: 'verification',
        prompt: 'Tu es un expert en vérification de conformité. Vérifie la conformité du document suivant aux normes, règles et obligations applicables...',
        output_format: 'structured',
        use_cases: ['technical_compliance', 'legal_compliance', 'contract_compliance', 'regulatory_audit', 'quality_control']
      },
      'communication_analysis': {
        id: 'communication_analysis',
        name: '💬 Analyse de Communication',
        description: 'Analyse les communications et correspondances pour extraire les informations clés',
        domain: 'universal',
        type: 'communication',
        prompt: 'Tu es un expert en analyse de communication. Analyse la communication suivante pour extraire les informations clés, le ton et les implications...',
        output_format: 'structured',
        use_cases: ['email_analysis', 'correspondence_tracking', 'response_monitoring', 'communication_strategy', 'evidence_collection']
      }
    };
  },

  // Recommandations par défaut (fallback)
  getDefaultRecommendations(fileType?: string, context?: string): PromptRecommendation[] {
    const allPrompts = this.getDefaultUniversalPrompts();
    
    // Logique simple de recommandation basée sur le type de fichier
    const recommendations: PromptRecommendation[] = [];
    
    if (fileType === 'pdf' || fileType === 'docx') {
      recommendations.push({
        id: 'problem_analysis',
        name: allPrompts['problem_analysis'].name,
        description: allPrompts['problem_analysis'].description,
        type: 'analysis',
        relevance_score: 0.9
      });
      
      if (context === 'construction' || context === 'contract') {
        recommendations.push({
          id: 'contract_comparison',
          name: allPrompts['contract_comparison'].name,
          description: allPrompts['contract_comparison'].description,
          type: 'comparison',
          relevance_score: 0.8
        });
      }
    }
    
    // Toujours inclure au moins le prompt principal
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'problem_analysis',
        name: allPrompts['problem_analysis'].name,
        description: allPrompts['problem_analysis'].description,
        type: 'analysis',
        relevance_score: 0.7
      });
    }
    
    return recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
  },

  // Méthodes de compatibilité avec l'ancienne API
  async getDefaultPromptsOnly(): Promise<Record<string, string>> {
    const universalPrompts = this.getDefaultUniversalPrompts();
    const defaultPrompts: Record<string, string> = {};
    
    for (const [id, prompt] of Object.entries(universalPrompts)) {
      defaultPrompts[id] = prompt.prompt;
    }
    
    return defaultPrompts;
  },

  async getSpecializedPrompts(): Promise<Record<string, Prompt>> {
    try {
      const response = await unifiedApiService.get('/api/prompts/specialized');
      return response.data || {};
    } catch (error) {
      // Données par défaut en cas d'erreur API - prompts universels
      return this.getDefaultUniversalPrompts();
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