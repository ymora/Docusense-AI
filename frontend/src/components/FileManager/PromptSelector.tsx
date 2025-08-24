import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { usePromptStore } from '../../stores/promptStore';
import { UniversalPrompt } from '../../services/promptService';
import { analysisService, CreateAnalysisRequest } from '../../services/analysisService';

interface PromptSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptSelect: (promptId: string, prompt: UniversalPrompt) => void;
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
  const { 
    universalPrompts, 
    loading,
    getPromptRecommendations,
    recommendations
  } = usePromptStore();
  const [selectedPrompt, setSelectedPrompt] = useState<UniversalPrompt | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Charger les recommandations basées sur le type de fichier
  useEffect(() => {
    if (fileType && Object.keys(universalPrompts).length > 0) {
      getPromptRecommendations(fileType);
      setShowRecommendations(true);
    }
  }, [fileType, universalPrompts, getPromptRecommendations]);

  const handlePromptSelect = (prompt: UniversalPrompt) => {
    setSelectedPrompt(prompt);
  };

  const handleConfirm = async () => {
    if (selectedPrompt && fileIds.length > 0) {
      try {
        setIsProcessing(true);
        
        // Créer les analyses en attente pour chaque fichier
        const requests: CreateAnalysisRequest[] = fileIds.map(fileId => ({
          file_id: fileId,
          prompt_id: selectedPrompt.id,
          analysis_type: selectedPrompt.type || 'analysis',
          custom_prompt: selectedPrompt.prompt
        }));

        let results;
        if (requests.length === 1) {
          results = [await analysisService.createAnalysis(requests[0])];
        } else {
          // Pour l'instant, traiter séquentiellement
          results = [];
          for (const request of requests) {
            results.push(await analysisService.createAnalysis(request));
          }
        }

        // Notifier le parent du succès
        onPromptSelect(selectedPrompt.id, selectedPrompt);
        onClose();
        
      } catch (error) {
        // Gestion d'erreur silencieuse
      } finally {
        setIsProcessing(false);
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
    const iconMap: Record<string, string> = {
      'analysis': '🔍',
      'comparison': '⚖️',
      'preparation': '📋',
      'verification': '🛡️',
      'communication': '📧'
    };
    return iconMap[type] || '📄';
  };

  const getPromptColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'analysis': 'text-blue-500',
      'comparison': 'text-green-500',
      'preparation': 'text-purple-500',
      'verification': 'text-orange-500',
      'communication': 'text-pink-500'
    };
    return colorMap[type] || 'text-gray-500';
  };

  if (!isOpen) return null;

  const promptsArray = Object.values(universalPrompts);

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
            Sélectionner un prompt universel
          </h2>
          <p 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            {getModeDescription()}
          </p>
          <p 
            className="text-xs mt-1"
            style={{ color: colors.textSecondary }}
          >
            🎯 {promptsArray.length} prompts universels intelligents
            {!loading && (
              <span className="ml-2 text-green-400">✓</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            disabled={loading}
            className="p-1 rounded hover:bg-slate-700 transition-colors disabled:opacity-50"
            style={{ color: colors.textSecondary }}
            title={showRecommendations ? "Voir tous les prompts" : "Voir les recommandations"}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-700 transition-colors"
            style={{ color: colors.textSecondary }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
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
        ) : promptsArray.length === 0 ? (
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
              Les prompts universels n'ont pas pu être chargés.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Section Recommandations */}
            {showRecommendations && recommendations.length > 0 && (
              <div className="border rounded-lg" style={{ borderColor: colors.border }}>
                <div className="p-3 border-b" style={{ borderColor: colors.border }}>
                  <h3 
                    className="font-medium flex items-center"
                    style={{ color: colors.text }}
                  >
                    <span className="text-yellow-500 mr-2">⭐</span>
                    Recommandations pour {fileType}
                  </h3>
                  <p 
                    className="text-xs mt-1"
                    style={{ color: colors.textSecondary }}
                  >
                    Prompts les plus adaptés à votre type de fichier
                  </p>
                </div>
                <div>
                  {recommendations.slice(0, 3).map((recommendation) => {
                    const prompt = universalPrompts[recommendation.id];
                    if (!prompt) return null;
                    
                    return (
                      <button
                        key={recommendation.id}
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
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{prompt.name}</h4>
                            <span 
                              className="text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: colors.hover.surface, color: colors.textSecondary }}
                            >
                              {Math.round(recommendation.relevance_score * 100)}% pertinent
                            </span>
                          </div>
                          <p 
                            className="text-sm mt-1"
                            style={{ color: colors.textSecondary }}
                          >
                            {prompt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section Tous les Prompts */}
            <div className="border rounded-lg" style={{ borderColor: colors.border }}>
              <div className="p-3 border-b" style={{ borderColor: colors.border }}>
                <h3 
                  className="font-medium flex items-center"
                  style={{ color: colors.text }}
                >
                  <span className="text-blue-500 mr-2">🎯</span>
                  Tous les prompts universels
                </h3>
                <p 
                  className="text-xs mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  5 prompts intelligents qui s'adaptent à votre contexte
                </p>
              </div>
              <div>
                {promptsArray.map((prompt) => (
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
                      <h4 className="font-medium">{prompt.name}</h4>
                      <p 
                        className="text-sm mt-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {prompt.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prompt.use_cases.slice(0, 3).map((useCase) => (
                          <span 
                            key={useCase}
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: colors.hover.surface, color: colors.textSecondary }}
                          >
                            {useCase.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {prompt.use_cases.length > 3 && (
                          <span 
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: colors.hover.surface, color: colors.textSecondary }}
                          >
                            +{prompt.use_cases.length - 3} autres
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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
            disabled={loading || isProcessing}
            className={`w-full font-medium py-2 px-4 rounded-lg transition-colors ${
              loading || isProcessing
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isProcessing ? 'Création en cours...' : `Créer ${fileIds.length} analyse(s) en attente`}
          </button>
        </div>
      )}
    </div>
  );
};

export default PromptSelector; 