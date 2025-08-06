// Service pour la gestion des prompts
import { getFileTypeFromMime } from '../utils/fileTypeUtils';

export interface Prompt {
  id: string;
  name: string;
  description: string;
  domain: 'juridical' | 'technical' | 'administrative' | 'general';
  type: 'analysis' | 'summary' | 'verification' | 'extraction' | 'comparison';
  prompt: string;
  output_format: 'structured' | 'free';
}

export interface PromptCategory {
  domain: string;
  name: string;
  prompts: Prompt[];
}

class PromptService {
  private prompts: Prompt[] = [];
  private categories: PromptCategory[] = [];

  async getPrompts(): Promise<Prompt[]> {
    try {
      const response = await fetch('/api/prompts/');
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }
      const data = await response.json();
      
      // Traiter la structure de réponse du backend
      const specializedPrompts = data.specialized_prompts || {};
      const defaultPrompts = data.default_prompts || {};
      
      // Convertir les prompts spécialisés au format attendu
      const formattedPrompts: Prompt[] = Object.entries(specializedPrompts).map(([id, prompt]: [string, any]) => ({
        id: id,
        name: prompt.name || id,
        description: prompt.description || '',
        domain: prompt.domain || 'general',
        type: prompt.type || 'analysis',
        prompt: prompt.prompt || prompt.text || '',
        output_format: prompt.output_format || 'free'
      }));
      
      // Ajouter les prompts par défaut
      Object.entries(defaultPrompts).forEach(([type, promptText]: [string, string]) => {
        formattedPrompts.push({
          id: `default_${type}`,
          name: `Prompt par défaut - ${type}`,
          description: `Prompt par défaut pour l'analyse de type ${type}`,
          domain: 'general',
          type: 'analysis',
          prompt: promptText,
          output_format: 'free'
        });
      });
      
      this.prompts = formattedPrompts;
      this.categories = this.organizePromptsByCategory();
      return this.prompts;
    } catch (error) {
      console.error('Error fetching prompts:', error);
      return this.getDefaultPrompts();
    }
  }

  getPromptCategories(): PromptCategory[] {
    return this.categories;
  }

  // Ces méthodes sont maintenant gérées par le store
  // Elles sont conservées pour la compatibilité avec le backend
  getPromptsByDomain(domain: string): Prompt[] {
    return this.prompts.filter(prompt => prompt.domain === domain);
  }

  getPromptsByType(type: string): Prompt[] {
    return this.prompts.filter(prompt => prompt.type === type);
  }

  getPromptById(id: string): Prompt | undefined {
    return this.prompts.find(prompt => prompt.id === id);
  }

  getComparisonPrompts(): Prompt[] {
    return this.prompts.filter(prompt => prompt.type === 'comparison');
  }

  getAnalysisPrompts(): Prompt[] {
    return this.prompts.filter(prompt => prompt.type === 'analysis');
  }

  getDefaultPrompts(): Prompt[] {
    return [
      // Prompts Généraux
      {
        id: 'general_summary',
        name: 'Résumé Général',
        description: 'Résumé général du document avec les points essentiels',
        domain: 'general',
        type: 'summary',
        prompt: 'Analyse le document suivant et fournis un résumé exécutif avec les points essentiels.',
        output_format: 'structured'
      },
      {
        id: 'general_extraction',
        name: 'Extraction de Données',
        description: 'Extraction structurée de données importantes',
        domain: 'general',
        type: 'extraction',
        prompt: 'Extrais les données importantes du document (dates, montants, noms, adresses, références).',
        output_format: 'structured'
      },
      {
        id: 'general_comparison',
        name: 'Comparaison de Documents',
        description: 'Comparaison détaillée de plusieurs documents',
        domain: 'general',
        type: 'comparison',
        prompt: 'Compare les documents suivants en identifiant les points communs, différences, incohérences et recommandations.',
        output_format: 'structured'
      },
      {
        id: 'general_analysis',
        name: 'Analyse Complète',
        description: 'Analyse complète du contenu et de la structure',
        domain: 'general',
        type: 'analysis',
        prompt: 'Analyse complète du document en identifiant le type, la structure, les informations clés et les recommandations.',
        output_format: 'structured'
      },

      // Prompts Juridiques
      {
        id: 'juridical_contract_analysis',
        name: 'Analyse de Contrat',
        description: 'Analyse juridique complète d\'un contrat',
        domain: 'juridical',
        type: 'analysis',
        prompt: 'Analyse juridique complète du contrat en identifiant les parties, obligations, clauses importantes et risques.',
        output_format: 'structured'
      },
      {
        id: 'juridical_compliance_check',
        name: 'Vérification de Conformité',
        description: 'Vérification de conformité aux réglementations',
        domain: 'juridical',
        type: 'verification',
        prompt: 'Vérifie la conformité aux réglementations en vigueur et identifie les risques juridiques.',
        output_format: 'structured'
      },
      {
        id: 'juridical_legal_summary',
        name: 'Résumé Juridique',
        description: 'Résumé des aspects juridiques du document',
        domain: 'juridical',
        type: 'summary',
        prompt: 'Résume les aspects juridiques du document en identifiant les obligations, droits et risques.',
        output_format: 'structured'
      },
      {
        id: 'juridical_clause_extraction',
        name: 'Extraction de Clauses',
        description: 'Extraction et analyse des clauses importantes',
        domain: 'juridical',
        type: 'extraction',
        prompt: 'Extrais et analyse les clauses importantes du document juridique.',
        output_format: 'structured'
      },

      // Prompts Techniques
      {
        id: 'technical_norm_verification',
        name: 'Vérification Normative',
        description: 'Vérification de conformité aux normes techniques',
        domain: 'technical',
        type: 'verification',
        prompt: 'Vérifie la conformité aux normes techniques (NF, EN, ISO, DTU) et identifie les écarts.',
        output_format: 'structured'
      },
      {
        id: 'technical_specification_analysis',
        name: 'Analyse de Spécifications',
        description: 'Analyse technique des spécifications',
        domain: 'technical',
        type: 'analysis',
        prompt: 'Analyse technique des spécifications en identifiant les exigences, contraintes et recommandations.',
        output_format: 'structured'
      },
      {
        id: 'technical_technical_summary',
        name: 'Résumé Technique',
        description: 'Résumé des aspects techniques du document',
        domain: 'technical',
        type: 'summary',
        prompt: 'Résume les aspects techniques du document en identifiant les points clés et les recommandations.',
        output_format: 'structured'
      },
      {
        id: 'technical_data_extraction',
        name: 'Extraction de Données Techniques',
        description: 'Extraction des données techniques importantes',
        domain: 'technical',
        type: 'extraction',
        prompt: 'Extrais les données techniques importantes (dimensions, matériaux, performances, etc.).',
        output_format: 'structured'
      },

      // Prompts Administratifs
      {
        id: 'administrative_document_analysis',
        name: 'Analyse Administrative',
        description: 'Analyse de documents administratifs',
        domain: 'administrative',
        type: 'analysis',
        prompt: 'Analyse administrative du document en identifiant la procédure, délais, formalités et actions à entreprendre.',
        output_format: 'structured'
      },
      {
        id: 'administrative_procedure_check',
        name: 'Vérification de Procédure',
        description: 'Vérification de la conformité procédurale',
        domain: 'administrative',
        type: 'verification',
        prompt: 'Vérifie la conformité aux procédures administratives et identifie les étapes manquantes.',
        output_format: 'structured'
      },
      {
        id: 'administrative_deadline_extraction',
        name: 'Extraction de Délais',
        description: 'Extraction et analyse des délais administratifs',
        domain: 'administrative',
        type: 'extraction',
        prompt: 'Extrais et analyse les délais administratifs, échéances et dates importantes.',
        output_format: 'structured'
      },
      {
        id: 'administrative_form_summary',
        name: 'Résumé de Formulaire',
        description: 'Résumé des informations de formulaire administratif',
        domain: 'administrative',
        type: 'summary',
        prompt: 'Résume les informations du formulaire administratif en identifiant les champs requis et les actions à effectuer.',
        output_format: 'structured'
      }
    ];
  }

  private organizePromptsByCategory(): PromptCategory[] {
    const categories: { [key: string]: PromptCategory } = {};

    this.prompts.forEach(prompt => {
      if (!categories[prompt.domain]) {
        categories[prompt.domain] = {
          domain: prompt.domain,
          name: this.getDomainDisplayName(prompt.domain),
          prompts: []
        };
      }
      categories[prompt.domain].prompts.push(prompt);
    });

    return Object.values(categories);
  }

  private getDomainDisplayName(domain: string): string {
    const names: { [key: string]: string } = {
      'juridical': 'Juridique',
      'technical': 'Technique',
      'administrative': 'Administratif',
      'general': 'Général'
    };
    return names[domain] || domain;
  }

  // Méthodes pour la comparaison de documents
  async compareDocuments(fileIds: number[], promptId?: string): Promise<any> {
    try {
      const response = await fetch('/api/analysis/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_ids: fileIds, prompt_id: promptId }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Méthodes avec stratégie de priorité
  async analyzeFileWithPriority(fileId: number, promptId: string, providerPriority: string[]): Promise<any> {
    try {
      const response = await fetch('/api/analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file_id: fileId, 
          prompt_id: promptId,
          provider_priority: providerPriority 
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async compareDocumentsWithPriority(fileIds: number[], promptId: string, providerPriority: string[]): Promise<any> {
    try {
      const response = await fetch('/api/analysis/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file_ids: fileIds, 
          prompt_id: promptId,
          provider_priority: providerPriority 
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async analyzeBatchWithPriority(fileIds: number[], promptId: string, providerPriority: string[]): Promise<any> {
    try {
      const response = await fetch('/api/analysis/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file_ids: fileIds, 
          prompt_id: promptId,
          provider_priority: providerPriority 
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async analyzeWithMultipleAI(fileIds: number[], promptId: string, providers: string[]): Promise<any> {
    try {
      const response = await fetch('/api/analysis/multiple-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file_ids: fileIds, 
          prompt_id: promptId,
          providers: providers 
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Méthodes originales pour la compatibilité
  async analyzeFile(fileId: number, promptId?: string): Promise<any> {
    return this.analyzeFileWithPriority(fileId, promptId || 'general_summary', []);
  }

  async analyzeBatch(fileIds: number[], promptId?: string): Promise<any> {
    return this.analyzeBatchWithPriority(fileIds, promptId || 'general_summary', []);
  }

  // Méthodes pour obtenir les prompts adaptés au type de fichier
  getPromptsForFileType(mimeType: string): Prompt[] {
    const fileType = getFileTypeFromMime(mimeType);
    
    switch (fileType) {
      case 'document':
        return this.prompts.filter(p => p.domain !== 'technical' || p.type === 'analysis');
      case 'image':
        return this.prompts.filter(p => p.type === 'analysis' || p.type === 'extraction');
      case 'media':
        return this.prompts.filter(p => p.type === 'analysis' || p.type === 'extraction');
      default:
        return this.prompts;
    }
  }
}

export const promptService = new PromptService();