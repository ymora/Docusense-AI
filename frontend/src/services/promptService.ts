// Service pour la gestion des prompts
import { apiRequest, handleApiError, DEFAULT_TIMEOUT } from '../utils/apiUtils';

export interface Prompt {
  id: string;
  name: string;
  description: string;
  domain: string;
  type: string;
  content?: string;
  prompt?: string;
}

export interface PromptSummary {
  domain: string;
  name: string;
  prompts: {
    id: string;
    name: string;
    description: string;
    type: string;
  }[];
}

export const promptService = {
  // Récupérer tous les prompts
  async getAllPrompts(): Promise<{ default_prompts: Record<string, string>; specialized_prompts: Record<string, Prompt> }> {
    try {
      const response = await apiRequest('/api/prompts', {}, DEFAULT_TIMEOUT);
      return response.data || { default_prompts: {}, specialized_prompts: {} };
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw new Error(`Erreur lors de la récupération des prompts: ${handleApiError(error)}`);
    }
  },

  // Récupérer le résumé des prompts organisés par domaine
  async getPromptsSummary(): Promise<Record<string, PromptSummary>> {
    try {
      const response = await apiRequest('/api/prompts/summary', {}, DEFAULT_TIMEOUT);
      return response.data || {};
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw new Error(`Erreur lors de la récupération du résumé: ${handleApiError(error)}`);
    }
  },

  // Récupérer les prompts par défaut
  async getDefaultPrompts(): Promise<Record<string, string>> {
    try {
      const response = await apiRequest('/api/prompts/default', {}, DEFAULT_TIMEOUT);
      return response.data || {};
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw new Error(`Erreur lors de la récupération des prompts par défaut: ${handleApiError(error)}`);
    }
  },

  // Récupérer un prompt par défaut spécifique
  async getDefaultPrompt(analysisType: string): Promise<{ analysis_type: string; prompt: string }> {
    try {
      const response = await apiRequest(`/api/prompts/default/${analysisType}`, {}, DEFAULT_TIMEOUT);
      return response.data || { analysis_type: analysisType, prompt: '' };
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw new Error(`Erreur lors de la récupération du prompt par défaut: ${handleApiError(error)}`);
    }
  },

  // Récupérer les prompts par défaut uniquement (sans requête API)
  async getDefaultPromptsOnly(): Promise<Record<string, string>> {
    // Données par défaut sans requête API
    const defaultPrompts: Record<string, string> = {
      'GENERAL': 'Analysez le contenu de ce document de manière générale.',
      'LEGAL': 'Analysez ce document sous l\'angle juridique et légal.',
      'FINANCIAL': 'Analysez ce document sous l\'angle financier et économique.',
      'TECHNICAL': 'Analysez ce document sous l\'angle technique et technologique.',
      'MEDICAL': 'Analysez ce document sous l\'angle médical et sanitaire.',
      'ACADEMIC': 'Analysez ce document sous l\'angle académique et scientifique.',
      'CONTRACT': 'Analysez ce document contractuel en détail.',
      'REPORT': 'Analysez ce rapport de manière structurée.',
      'EMAIL': 'Analysez cet email et son contenu.',
      'MANUAL': 'Analysez ce manuel ou guide d\'utilisation.'
    };
    
    return defaultPrompts;
  },

  // Récupérer tous les prompts spécialisés
  async getSpecializedPrompts(): Promise<Record<string, Prompt>> {
    try {
      // Augmenter le timeout pour cette requête volumineuse
      const response = await apiRequest('/api/prompts/specialized', {}, 30000); // 30 secondes
      return response.data || {};
    } catch (error) {
      // OPTIMISATION: Suppression des console.warn pour éviter la surcharge
      
      // Données par défaut en cas d'erreur API
      const defaultPrompts: Record<string, Prompt> = {
        'default_analysis': {
          id: 'default_analysis',
          name: 'Analyse Générale',
          description: 'Analyse générale du contenu du document',
          domain: 'général',
        type: 'analysis',
          content: 'Analysez le contenu de ce document de manière générale.'
        },
        'legal_analysis': {
          id: 'legal_analysis',
          name: 'Analyse Juridique',
          description: 'Analyse spécialisée pour les documents juridiques',
          domain: 'juridique',
          type: 'analysis',
          content: 'Analysez ce document sous l\'angle juridique et légal.'
        },
        'financial_analysis': {
          id: 'financial_analysis',
          name: 'Analyse Financière',
          description: 'Analyse spécialisée pour les documents financiers',
          domain: 'financier',
          type: 'analysis',
          content: 'Analysez ce document sous l\'angle financier et économique.'
        },
        'technical_analysis': {
          id: 'technical_analysis',
          name: 'Analyse Technique',
          description: 'Analyse spécialisée pour les documents techniques',
          domain: 'technique',
          type: 'analysis',
          content: 'Analysez ce document sous l\'angle technique et technologique.'
        }
      };
      
      // Retourner les données par défaut sans lancer d'erreur
      return defaultPrompts;
    }
  },

  // Récupérer un prompt spécialisé spécifique
  async getSpecializedPrompt(promptId: string): Promise<Prompt> {
    try {
      const response = await apiRequest(`/api/prompts/specialized/${promptId}`, {}, DEFAULT_TIMEOUT);
      return response.data || {};
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw new Error(`Erreur lors de la récupération du prompt spécialisé: ${handleApiError(error)}`);
    }
  },

  // Récupérer les prompts par domaine
  async getPromptsByDomain(domain: string): Promise<{ domain: string; prompts: Record<string, Prompt> }> {
    try {
      const response = await apiRequest(`/api/prompts/domain/${domain}`, {}, DEFAULT_TIMEOUT);
      return response.data || { domain, prompts: {} };
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw new Error(`Erreur lors de la récupération des prompts par domaine: ${handleApiError(error)}`);
    }
  },

  // Récupérer les prompts par type
  async getPromptsByType(promptType: string): Promise<{ type: string; prompts: Record<string, Prompt> }> {
    try {
      const response = await apiRequest(`/api/prompts/type/${promptType}`, {}, DEFAULT_TIMEOUT);
      return response.data || { type: promptType, prompts: {} };
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw new Error(`Erreur lors de la récupération des prompts par type: ${handleApiError(error)}`);
    }
  },

  // Formater un prompt avec du texte
  async formatPrompt(promptId: string, text: string): Promise<string> {
    try {
      const response = await apiRequest(`/api/prompts/${promptId}/format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      }, DEFAULT_TIMEOUT);
      return response.data?.formatted_prompt || '';
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge
      throw new Error(`Erreur lors du formatage du prompt: ${handleApiError(error)}`);
    }
  }
};