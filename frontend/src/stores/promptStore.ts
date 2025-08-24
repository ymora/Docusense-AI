import { create } from 'zustand';
import { promptService, UniversalPrompt, PromptRecommendation } from '../services/promptService';
import { createLoadingActions, createCallGuard, createOptimizedUpdater } from '../utils/storeUtils';
import { logService } from '../services/logService';

interface PromptState {
  universalPrompts: Record<string, UniversalPrompt>;
  recommendations: PromptRecommendation[];
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  loadUniversalPrompts: () => Promise<void>;
  loadDefaultPromptsOnly: () => Promise<void>;
  reloadPrompts: () => Promise<void>;
  getPromptRecommendations: (fileType?: string, context?: string) => Promise<void>;
  clearError: () => void;
  
  // Getters
  getUniversalPrompts: () => Record<string, UniversalPrompt>;
  getPromptById: (id: string) => UniversalPrompt | undefined;
  getPromptsByType: (type: string) => UniversalPrompt[];
  getPromptsByUseCase: (useCase: string) => UniversalPrompt[];
}

export const usePromptStore = create<PromptState>((set, get) => ({
  universalPrompts: {},
  recommendations: [],
  loading: false,
  error: null,
  initialized: false,

  // Chargement automatique au premier accès
  loadUniversalPrompts: (() => {
    const callGuard = createCallGuard();
    return callGuard(async () => {
      const { initialized } = get();
      
      // Éviter les rechargements multiples
      if (initialized) {
        return;
      }

      const loadingActions = createLoadingActions(set, get);
      const updater = createOptimizedUpdater(set, get);
      
      if (!loadingActions.startLoading()) {
        return;
      }
      
      try {
        const universalPrompts = await promptService.getAllUniversalPrompts();
        
        updater.updateMultiple({ 
          universalPrompts,
          initialized: true 
        });
        loadingActions.finishLoading();
        
        logService.debug(`Chargement de ${Object.keys(universalPrompts).length} prompts universels`, 'PromptStore');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des prompts universels';
        loadingActions.finishLoadingWithError(errorMessage);
      }
    });
  })(),

  // Chargement des prompts par défaut uniquement (sans requête API)
  loadDefaultPromptsOnly: (() => {
    const callGuard = createCallGuard();
    return callGuard(async () => {
      const loadingActions = createLoadingActions(set, get);
      const updater = createOptimizedUpdater(set, get);
      
      if (!loadingActions.startLoading()) {
        return;
      }
      
      try {
        // Créer des prompts universels par défaut
        const defaultPrompts: Record<string, UniversalPrompt> = {
          'problem_analysis': {
            id: 'problem_analysis',
            name: '🔍 Analyse de Problème',
            description: 'Détecte et analyse les problèmes dans vos documents pour vous aider à agir',
            domain: 'universal',
            type: 'analysis',
            prompt: 'Tu es un expert en analyse de problèmes documentaires...',
            output_format: 'structured',
            use_cases: ['construction_litigation', 'contract_disputes', 'quality_issues', 'compliance_problems', 'communication_conflicts']
          },
          'contract_comparison': {
            id: 'contract_comparison',
            name: '⚖️ Comparaison de Contrats',
            description: 'Compare plusieurs documents pour identifier les différences et opportunités',
            domain: 'universal',
            type: 'comparison',
            prompt: 'Tu es un expert en analyse comparative de documents...',
            output_format: 'structured',
            use_cases: ['insurance_comparison', 'contract_negotiation', 'supplier_selection', 'service_comparison', 'proposal_evaluation']
          },
          'dossier_preparation': {
            id: 'dossier_preparation',
            name: '📋 Préparation de Dossier',
            description: 'Prépare un dossier complet pour procédure, action ou décision',
            domain: 'universal',
            type: 'preparation',
            prompt: 'Tu es un expert en préparation de dossiers...',
            output_format: 'structured',
            use_cases: ['litigation_preparation', 'expert_report', 'insurance_claim', 'administrative_appeal', 'contract_termination']
          },
          'compliance_verification': {
            id: 'compliance_verification',
            name: '🛡️ Vérification de Conformité',
            description: 'Vérifie la conformité aux normes, règles et obligations',
            domain: 'universal',
            type: 'verification',
            prompt: 'Tu es un expert en vérification de conformité...',
            output_format: 'structured',
            use_cases: ['technical_compliance', 'legal_compliance', 'contract_compliance', 'regulatory_audit', 'quality_control']
          },
          'communication_analysis': {
            id: 'communication_analysis',
            name: '📧 Analyse de Communication',
            description: 'Analyse les échanges et communications pour identifier les problèmes et opportunités',
            domain: 'universal',
            type: 'analysis',
            prompt: 'Tu es un expert en analyse de communication...',
            output_format: 'structured',
            use_cases: ['email_analysis', 'correspondence_tracking', 'response_monitoring', 'communication_strategy', 'evidence_collection']
          }
        };
        
        updater.updateMultiple({ 
          universalPrompts: defaultPrompts,
          initialized: true 
        });
        loadingActions.finishLoading();
        
        logService.debug('Chargement des prompts universels par défaut', 'PromptStore');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des prompts par défaut';
        loadingActions.finishLoadingWithError(errorMessage);
      }
    });
  })(),

  reloadPrompts: (() => {
    const callGuard = createCallGuard();
    return callGuard(async () => {
      const loadingActions = createLoadingActions(set, get);
      const updater = createOptimizedUpdater(set, get);
      
      if (!loadingActions.startLoading()) {
        return;
      }
      
      try {
        const universalPrompts = await promptService.getAllUniversalPrompts();
        
        updater.updateMultiple({ 
          universalPrompts,
          initialized: true 
        });
        loadingActions.finishLoading();
        
        logService.debug('Prompts universels rechargés', 'PromptStore');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du rechargement des prompts';
        loadingActions.finishLoadingWithError(errorMessage);
      }
    });
  })(),

  getPromptRecommendations: (() => {
    const callGuard = createCallGuard();
    return callGuard(async (fileType?: string, context?: string) => {
      const loadingActions = createLoadingActions(set, get);
      const updater = createOptimizedUpdater(set, get);
      
      if (!loadingActions.startLoading()) {
        return;
      }
      
      try {
        const recommendations = await promptService.getPromptRecommendations(fileType, context);
        
        updater.updateMultiple({ 
          recommendations
        });
        loadingActions.finishLoading();
        
        logService.debug(`Recommandations générées pour ${fileType || 'tous types'}`, 'PromptStore');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la génération des recommandations';
        loadingActions.finishLoadingWithError(errorMessage);
      }
    });
  })(),

  clearError: () => {
    set({ error: null });
  },

  // Getters
  getUniversalPrompts: () => {
    const state = get();
    if (!state.initialized && !state.loading) {
      state.loadUniversalPrompts();
    }
    return state.universalPrompts;
  },

  getPromptById: (id: string) => {
    const state = get();
    return state.universalPrompts[id];
  },

  getPromptsByType: (type: string) => {
    const state = get();
    return Object.values(state.universalPrompts).filter(prompt => prompt.type === type);
  },

  getPromptsByUseCase: (useCase: string) => {
    const state = get();
    return Object.values(state.universalPrompts).filter(prompt => 
      prompt.use_cases.includes(useCase)
    );
  }
}));

 