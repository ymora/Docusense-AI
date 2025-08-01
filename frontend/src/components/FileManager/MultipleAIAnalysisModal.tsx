import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useColors } from '../../hooks/useColors';
import { queueService } from '../../services/queueService';
import { configService } from '../../services/configService';
import { promptService } from '../../services/promptService';

interface MultipleAIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileIds: number[];
  onAnalysisStarted: () => void;
}

interface AIProvider {
  name: string;
  priority: number;
  models: string[];
  default_model: string;
  is_active: boolean;
  has_api_key: boolean;
  is_functional: boolean;
  last_tested: string;
}

interface Prompt {
  id: string;
  name: string;
  description: string;
  category: string;
}

export const MultipleAIAnalysisModal: React.FC<MultipleAIAnalysisModalProps> = ({
  isOpen,
  onClose,
  fileIds,
  onAnalysisStarted
}) => {
  const { colors } = useColors();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Charger les providers et prompts disponibles
  useEffect(() => {
    if (isOpen) {
      loadProviders();
      loadPrompts();
    }
  }, [isOpen]);

  const loadProviders = async () => {
    try {
      const response = await configService.getAIProviders();
      const availableProviders = response.providers || [];
      setProviders(availableProviders);
      
      // Sélectionner automatiquement les providers fonctionnels
      const functionalProviders = availableProviders
        .filter(p => p.is_functional && p.has_api_key)
        .map(p => p.name);
      setSelectedProviders(functionalProviders);
    } catch (error) {
      console.error('Erreur lors du chargement des providers:', error);
      setError('Impossible de charger les providers IA');
    }
  };

  const loadPrompts = async () => {
    try {
      const response = await promptService.getPrompts();
      const availablePrompts = response.prompts || [];
      setPrompts(availablePrompts);
      
      // Sélectionner le premier prompt par défaut
      if (availablePrompts.length > 0) {
        setSelectedPrompt(availablePrompts[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prompts:', error);
      setError('Impossible de charger les prompts');
    }
  };

  const handleProviderToggle = (providerName: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerName)
        ? prev.filter(p => p !== providerName)
        : [...prev, providerName]
    );
  };

  const handleStartAnalysis = async () => {
    if (selectedProviders.length === 0) {
      setError('Veuillez sélectionner au moins un provider IA');
      return;
    }

    if (!selectedPrompt) {
      setError('Veuillez sélectionner un prompt');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await queueService.analyzeWithMultipleAI(
        fileIds,
        selectedPrompt,
        selectedProviders
      );
      
      onAnalysisStarted();
      onClose();
    } catch (error) {
      setError(`Erreur lors du lancement de l'analyse: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl mx-4 rounded-lg shadow-xl"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
              Analyse Multiple par IA
            </h2>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Analysez {fileIds.length} fichier(s) avec {selectedProviders.length} provider(s) IA
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            style={{ color: colors.textSecondary }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ 
              backgroundColor: colors.error + '10',
              borderColor: colors.error,
              border: '1px solid'
            }}>
              <ExclamationTriangleIcon className="h-5 w-5" style={{ color: colors.error }} />
              <span className="text-sm" style={{ color: colors.error }}>{error}</span>
            </div>
          )}

          {/* Providers Selection */}
          <div>
            <h3 className="text-lg font-medium mb-3" style={{ color: colors.text }}>
              Sélectionner les Providers IA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {providers.map((provider) => (
                <div
                  key={provider.name}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedProviders.includes(provider.name)
                      ? 'ring-2 ring-blue-500'
                      : ''
                  }`}
                  style={{
                    backgroundColor: selectedProviders.includes(provider.name) 
                      ? colors.primary + '10' 
                      : colors.surface,
                    borderColor: selectedProviders.includes(provider.name) 
                      ? colors.primary 
                      : colors.border
                  }}
                  onClick={() => handleProviderToggle(provider.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        provider.is_functional ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <h4 className="font-medium capitalize" style={{ color: colors.text }}>
                          {provider.name}
                        </h4>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {provider.default_model}
                        </p>
                      </div>
                    </div>
                    {selectedProviders.includes(provider.name) && (
                      <CheckIcon className="h-5 w-5" style={{ color: colors.primary }} />
                    )}
                  </div>
                  {!provider.is_functional && (
                    <div className="flex items-center space-x-1 mt-2">
                      <InformationCircleIcon className="h-4 w-4" style={{ color: colors.warning }} />
                      <span className="text-xs" style={{ color: colors.warning }}>
                        Non fonctionnel
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Selection */}
          <div>
            <h3 className="text-lg font-medium mb-3" style={{ color: colors.text }}>
              Sélectionner un Prompt
            </h3>
            <select
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value)}
              className="w-full p-3 rounded-lg border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }}
            >
              {prompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name} - {prompt.description}
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface + '50' }}>
            <h4 className="font-medium mb-2" style={{ color: colors.text }}>
              Résumé de l'analyse
            </h4>
            <div className="space-y-1 text-sm" style={{ color: colors.textSecondary }}>
              <p>• {fileIds.length} fichier(s) à analyser</p>
              <p>• {selectedProviders.length} provider(s) IA sélectionné(s)</p>
              <p>• {selectedProviders.length * fileIds.length} analyse(s) totale(s)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t" style={{ borderColor: colors.border }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border,
              border: '1px solid',
              color: colors.textSecondary
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleStartAnalysis}
            disabled={isLoading || selectedProviders.length === 0 || !selectedPrompt}
            className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: colors.primary,
              color: 'white'
            }}
          >
            {isLoading ? 'Lancement...' : 'Lancer l\'analyse'}
          </button>
        </div>
      </div>
    </div>
  );
}; 