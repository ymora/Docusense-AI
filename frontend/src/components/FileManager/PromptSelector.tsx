import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { promptService, Prompt, PromptCategory } from '../../services/promptService';
import { analysisService, CreateAnalysisRequest } from '../../services/analysisService';

interface PromptSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptSelect: (promptId: string, prompt: Prompt) => void;
  fileIds: number[];
  mode: 'single' | 'comparison' | 'batch' | 'multiple_ai';
  fileType?: string;
}

const PromptSelector: React.FC<PromptSelectorProps> = ({
  isOpen,
  onClose,
  onPromptSelect,
  fileIds,
  mode,
  fileType
}) => {
  const { colors } = useColors();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
    }
  }, [isOpen]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const prompts = await promptService.getPrompts();
      setPrompts(prompts);
    } catch (error) {
      console.error('Erreur lors du chargement des prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (domain: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(domain)) {
      newExpanded.delete(domain);
    } else {
      newExpanded.add(domain);
    }
    setExpandedCategories(newExpanded);
  };

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
  };

  const handleConfirm = async () => {
    if (selectedPrompt && fileIds.length > 0) {
      try {
        setLoading(true);
        
        // Créer les analyses en attente pour chaque fichier
        const requests: CreateAnalysisRequest[] = fileIds.map(fileId => ({
          file_id: fileId,
          prompt_id: selectedPrompt.id,
          analysis_type: selectedPrompt.type || 'general',
          custom_prompt: selectedPrompt.prompt
        }));

        let results;
        if (requests.length === 1) {
          results = [await analysisService.createPendingAnalysis(requests[0])];
        } else {
          results = await analysisService.createPendingAnalyses(requests);
        }

        // Notifier le parent du succès
        onPromptSelect(selectedPrompt.id, selectedPrompt);
        onClose();
        
        // Afficher un message de succès

        
      } catch (error) {
        console.error('Erreur lors de la création des analyses:', error);
        // Ici on pourrait afficher une notification d'erreur
      } finally {
        setLoading(false);
      }
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'comparison':
        return `Comparaison de ${fileIds.length} fichiers`;
      case 'batch':
        return `Analyse en lot de ${fileIds.length} fichiers`;
      case 'multiple_ai':
        return `Analyse multiple par IA de ${fileIds.length} fichier(s)`;
      default:
        return 'Analyse d\'un fichier';
    }
  };

  const getPromptIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return '🔍';
      case 'summary':
        return '📝';
      case 'verification':
        return '✅';
      case 'extraction':
        return '📊';
      case 'comparison':
        return '🔄';
      default:
        return '📄';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b flex-shrink-0"
        style={{ borderColor: colors.border }}
      >
        <div>
          <h2 
            className="text-lg font-semibold"
            style={{ color: colors.text }}
          >
            Sélectionner un prompt
          </h2>
          <p 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            {getModeDescription()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-700 transition-colors"
          style={{ color: colors.textSecondary }}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span 
              className="ml-3"
              style={{ color: colors.textSecondary }}
            >
              Chargement des prompts...
            </span>
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤖</div>
            <p 
              className="text-lg font-medium mb-2"
              style={{ color: colors.text }}
            >
              Aucun prompt disponible
            </p>
            <p 
              className="text-sm"
              style={{ color: colors.textSecondary }}
            >
              Aucun prompt ne correspond aux critères sélectionnés.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryPrompts = prompts.filter(p => p.domain === category.domain);
              if (categoryPrompts.length === 0) return null;
              
              const isExpanded = expandedCategories.has(category.domain);
              
              return (
                <div key={category.domain} className="border rounded-lg" style={{ borderColor: colors.border }}>
                  <button
                    onClick={() => toggleCategory(category.domain)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-700 transition-colors"
                    style={{ color: colors.text }}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {category.domain === 'juridical' ? '⚖️' :
                         category.domain === 'technical' ? '🔧' :
                         category.domain === 'administrative' ? '📋' : '📄'}
                      </span>
                      <span className="font-medium">{category.name}</span>
                      <span 
                        className="ml-2 text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: colors.hover.surface, color: colors.textSecondary }}
                      >
                        {categoryPrompts.length}
                      </span>
                    </div>
                    <ChevronDownIcon 
                      className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: colors.border }}>
                      {categoryPrompts.map((prompt) => (
                        <button
                          key={prompt.id}
                          onClick={() => handlePromptSelect(prompt)}
                          className={`w-full flex items-start p-3 text-left hover:bg-slate-700 transition-colors ${
                            selectedPrompt?.id === prompt.id ? 'bg-slate-600' : ''
                          }`}
                          style={{ color: colors.text }}
                        >
                          <div className="flex items-center mr-3">
                            {selectedPrompt?.id === prompt.id && (
                              <CheckIcon className="h-4 w-4 text-blue-400 mr-2" />
                            )}
                            <span className="text-lg">
                              {getPromptIcon(prompt.type)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{prompt.name}</h4>
                            <p 
                              className="text-sm"
                              style={{ color: colors.textSecondary }}
                            >
                              {prompt.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer avec bouton de confirmation */}
      {selectedPrompt && (
        <div 
          className="p-4 border-t flex-shrink-0"
          style={{ borderColor: colors.border }}
        >
          <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: colors.hover.surface }}>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              <strong>Mode création en attente :</strong> Les analyses seront créées avec le statut "en attente" 
              et pourront être lancées manuellement depuis la liste des analyses.
            </p>
          </div>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`w-full font-medium py-2 px-4 rounded-lg transition-colors ${
              loading 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Création en cours...' : `Créer ${fileIds.length} analyse(s) en attente`}
          </button>
        </div>
      )}
    </div>
  );
};

export default PromptSelector; 