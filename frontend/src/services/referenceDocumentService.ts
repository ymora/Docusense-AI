import { apiRequest } from '../utils/apiUtils';

export interface ReferenceDocument {
  id: string;
  title: string;
  description: string;
  file_path: string;
  category: string;
  subcategory: string;
  source_url?: string;
  file_hash: string;
  file_size: number;
  added_date: string;
  last_accessed?: string;
}

export interface DocumentCategory {
  total: number;
  subcategories: Record<string, number>;
}

export interface DocumentsSummary {
  total_documents: number;
  categories: Record<string, DocumentCategory>;
  last_updated?: string;
}

export interface SearchResult {
  query: string;
  results: ReferenceDocument[];
  count: number;
}

export interface CategoryDocuments {
  category: string;
  subcategory?: string;
  documents: ReferenceDocument[];
  count: number;
}

export interface DocumentContent {
  doc_id: string;
  content: string;
}

export interface RelevantDocuments {
  analysis_type: string;
  keywords?: string[];
  documents: ReferenceDocument[];
  count: number;
}

export const referenceDocumentService = {
  // Récupérer le résumé des documents
  async getSummary(): Promise<DocumentsSummary> {
    try {
      const response = await apiRequest('/api/reference-documents/', {}, 10000);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé:', error);
      return {
        total_documents: 0,
        categories: {}
      };
    }
  },

  // Récupérer toutes les catégories
  async getCategories(): Promise<Record<string, DocumentCategory>> {
    try {
      const response = await apiRequest('/api/reference-documents/categories', {}, 10000);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return {};
    }
  },

  // Récupérer les documents par catégorie
  async getDocumentsByCategory(category: string, subcategory?: string): Promise<CategoryDocuments> {
    try {
      const params = subcategory ? { subcategory } : {};
      const response = await apiRequest(`/api/reference-documents/category/${category}`, params, 15000);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des documents par catégorie:', error);
      return {
        category,
        subcategory,
        documents: [],
        count: 0
      };
    }
  },

  // Rechercher dans les documents
  async searchDocuments(query: string): Promise<SearchResult> {
    try {
      const response = await apiRequest('/api/reference-documents/search', { query }, 15000);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return {
        query,
        results: [],
        count: 0
      };
    }
  },

  // Récupérer un document spécifique
  async getDocument(docId: string): Promise<ReferenceDocument> {
    try {
      const response = await apiRequest(`/api/reference-documents/document/${docId}`, {}, 10000);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du document:', error);
      throw new Error('Document non trouvé');
    }
  },

  // Récupérer le contenu d'un document
  async getDocumentContent(docId: string): Promise<DocumentContent> {
    try {
      const response = await apiRequest(`/api/reference-documents/document/${docId}/content`, {}, 15000);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du contenu:', error);
      throw new Error('Contenu non trouvé');
    }
  },

  // Récupérer les documents pertinents pour un type d'analyse
  async getRelevantDocuments(analysisType: string, keywords?: string[]): Promise<RelevantDocuments> {
    try {
      const params = keywords ? { keywords: keywords.join(',') } : {};
      const response = await apiRequest(`/api/reference-documents/relevant/${analysisType}`, params, 15000);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des documents pertinents:', error);
      return {
        analysis_type: analysisType,
        keywords,
        documents: [],
        count: 0
      };
    }
  },

  // Ajouter un nouveau document (admin seulement)
  async addDocument(
    filePath: string,
    category: string,
    subcategory: string,
    title: string,
    description: string,
    sourceUrl?: string
  ): Promise<{ file_path: string; title: string }> {
    try {
      const response = await apiRequest('/api/reference-documents/add', {
        file_path: filePath,
        category,
        subcategory,
        title,
        description,
        source_url: sourceUrl
      }, 20000, 'POST');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du document:', error);
      throw new Error('Impossible d\'ajouter le document');
    }
  },

  // Utilitaires pour l'interface
  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      construction: '🏗️',
      juridique: '⚖️',
      administratif: '📄'
    };
    return icons[category] || '📁';
  },

  getSubcategoryIcon(subcategory: string): string {
    const icons: Record<string, string> = {
      dtu: '📋',
      normes: '📏',
      reglementations: '📜',
      code_civil: '📚',
      code_construction: '🏠',
      jurisprudence: '⚖️',
      urbanisme: '🏙️',
      permis: '📋'
    };
    return icons[subcategory] || '📄';
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};
