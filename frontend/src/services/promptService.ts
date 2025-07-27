export interface Prompt {
  domain: string;
  type: string;
  name: string;
  description: string;
  prompt: string;
  output_format: string;
}

export interface PromptCategory {
  domain: string;
  name: string;
  prompts: Prompt[];
}

export interface PromptsData {
  version: string;
  default_prompts: Record<string, string>;
  specialized_prompts: Record<string, Prompt>;
  metadata: {
    domains: string[];
    types: string[];
    total_prompts: number;
    total_default_prompts: number;
  };
}

export interface PromptContext {
  fileStatus: string;
  selectedFilesCount: number;
  fileType?: string;
  allSelectedFilesTypes?: string[];
}

class PromptService {
  private _cachedPrompts: PromptsData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Méthode publique pour accéder au cache
  get cachedPrompts(): PromptsData | null {
    return this._cachedPrompts;
  }

  async getPrompts(): Promise<PromptsData> {
    if (this._cachedPrompts && Date.now() < this.cacheExpiry) {
      return this._cachedPrompts;
    }
    try {
      const response = await fetch('/api/prompts');
      if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
      this._cachedPrompts = await response.json();
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      return this._cachedPrompts;
    } catch (error) {
      console.error('Erreur lors de la récupération des prompts:', error);
      throw error;
    }
  }

  async getPromptCategories(): Promise<PromptCategory[]> {
    const promptsData = await this.getPrompts();
    const categories: Record<string, PromptCategory> = {};
    Object.entries(promptsData.specialized_prompts).forEach(([key, prompt]) => {
      if (!categories[prompt.domain]) {
        categories[prompt.domain] = {
          domain: prompt.domain,
          name: this.getDomainDisplayName(prompt.domain),
          prompts: [],
        };
      }
      categories[prompt.domain].prompts.push(prompt);
    });
    return Object.values(categories);
  }

  getDomainDisplayName(domain: string): string {
    const domainNames: Record<string, string> = {
      'juridical': 'Juridique',
      'technical': 'Technique',
      'administrative': 'Administratif',
      'general': 'Général',
    };
    return domainNames[domain] || domain;
  }

  getTypeDisplayName(type: string): string {
    const typeNames: Record<string, string> = {
      'analysis': 'Analyse',
      'summary': 'Résumé',
      'verification': 'Vérification',
      'extraction': 'Extraction',
      'comparison': 'Comparaison',
    };
    return typeNames[type] || type;
  }

  // Nouvelle méthode : raison de désactivation d'un prompt
  getPromptDisabledReason(prompt: Prompt, context: PromptContext): string | null {
    // 1. Prompts d'analyse/résumé/extraction : 1 fichier, statut pending/failed
    if (['analysis', 'summary', 'extraction', 'verification'].includes(prompt.type)) {
      if (context.selectedFilesCount !== 1) {
        return 'Sélectionnez un seul fichier pour cette action';
      }
      if (!['pending', 'failed'].includes(context.fileStatus)) {
        return 'Le fichier doit être en attente ou en échec';
      }
      // Extraction : doit être un fichier texte
      if (prompt.type === 'extraction' && context.fileType && !this.isTextFile(context.fileType)) {
        return 'Extraction possible uniquement sur un fichier texte';
      }
    }
    // 2. Prompts de comparaison/similarité : au moins 2 fichiers
    if (['comparison'].includes(prompt.type)) {
      if (!context.allSelectedFilesTypes || context.selectedFilesCount < 2) {
        return 'Sélectionnez au moins 2 fichiers pour comparer';
      }
      // Tous les fichiers doivent être supportés
      if (context.allSelectedFilesTypes.some(t => !this.isSupportedFile(t))) {
        return 'Tous les fichiers sélectionnés doivent être supportés';
      }
    }
    // 3. OCR : uniquement images
    if (prompt.domain === 'ocr') {
      if (!context.fileType || !this.isImageFile(context.fileType)) {
        return 'OCR disponible uniquement pour les images';
      }
    }
    return null; // activable
  }

  // Utilitaire : est-ce un fichier texte ?
  isTextFile(fileType?: string): boolean {
    if (!fileType) {return false;}
    const textTypes = [
      'txt', 'md', 'rtf', 'text/plain', 'html', 'css', 'js', 'ts', 'py', 'java', 
      'cpp', 'c', 'php', 'rb', 'go', 'rs', 'xml', 'json', 'yaml', 'yml', 'sql', 
      'sh', 'bat', 'ps1', 'tex', 'log', 'ini', 'cfg', 'conf'
    ];
    return textTypes.some(ext => fileType.toLowerCase().includes(ext));
  }
  // Utilitaire : est-ce un fichier supporté ?
  isSupportedFile(fileType?: string): boolean {
    if (!fileType) {return false;}
    // Formats supportés pour l'analyse IA (cohérent avec le backend)
    const supported = [
      // Documents
      'pdf', 'docx', 'doc', 'txt', 'html', 'rtf', 'odt', 'pages', 'md', 'tex',
      // Emails
      'eml', 'msg', 'pst', 'ost',
      // Tableurs
      'xlsx', 'xls', 'csv', 'ods', 'numbers',
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg', 'webp', 'ico', 'raw', 'heic', 'heif', 'cr2', 'nef', 'arw',
      // Vidéos
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv', 'ts', 'mts', 'm2ts',
      // Audio
      'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus', 'aiff', 'alac',
      // Présentations
      'ppt', 'pptx', 'odp', 'key'
    ];
    return supported.some(ext => fileType.toLowerCase().includes(ext));
  }
  // Utilitaire : est-ce une image ?
  isImageFile(fileType?: string): boolean {
    if (!fileType) {return false;}
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg', 'webp', 'ico', 'raw', 'heic', 'heif', 'cr2', 'nef', 'arw'];
    return imageExtensions.some(ext => fileType.toLowerCase().includes(ext));
  }

  // Retourne tous les prompts avec leur état (activable/désactivé)
  getPromptsWithState(context: PromptContext): { prompt: Prompt, disabled: boolean, reason: string|null }[] {
    if (!this._cachedPrompts) {return [];}
    return Object.values(this._cachedPrompts.specialized_prompts).map(prompt => {
      const reason = this.getPromptDisabledReason(prompt, context);
      return { prompt, disabled: !!reason, reason };
    });
  }
}

export const promptService = new PromptService();