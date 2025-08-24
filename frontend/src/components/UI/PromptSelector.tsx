import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import { promptService } from '../../services/promptService';

interface PromptSelectorProps {
  visible: boolean;
  x: number;
  y: number;
  file: any;
  onClose: () => void;
  onPromptSelect: (promptId: string, prompt: any) => void;
}

export const PromptSelector: React.FC<PromptSelectorProps> = ({
  visible,
  x,
  y,
  file,
  onClose,
  onPromptSelect
}) => {
  const { colors } = useColors();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');

  useEffect(() => {
    if (visible) {
      loadPrompts();
    }
  }, [visible]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const allPrompts = await promptService.getAllPrompts();
      setPrompts(allPrompts.specialized_prompts ? Object.values(allPrompts.specialized_prompts) : []);
      
      // Sélectionner le prompt par défaut pour le type de fichier
      const defaultPrompt = getDefaultPromptForFile(file, allPrompts.specialized_prompts ? Object.values(allPrompts.specialized_prompts) : []);
      setSelectedPrompt(defaultPrompt?.id || 'general_summary');
    } catch (error) {
      // OPTIMISATION: Suppression des console.error pour éviter la surcharge // console.error('Erreur lors du chargement des prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPromptForFile = (file: any, allPrompts: any[]) => {
    if (!file || !file.mime_type) {
      return allPrompts.find(p => p.id === 'general_summary');
    }

    // Logique de sélection de prompt par type de fichier
    const mimeType = file.mime_type.toLowerCase();
    
    // Emails
    if (mimeType.includes('message/rfc822') || mimeType.includes('ms-outlook')) {
      return allPrompts.find(p => p.id === 'email_analysis') || 
             allPrompts.find(p => p.id === 'general_summary');
    }
    
    // Documents juridiques (PDF, Word)
    if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('document')) {
      return allPrompts.find(p => p.id === 'construction_litigation_analysis') ||
             allPrompts.find(p => p.id === 'juridical_contract_analysis') ||
             allPrompts.find(p => p.id === 'general_summary');
    }
    
    // Images
    if (mimeType.includes('image/')) {
      return allPrompts.find(p => p.id === 'construction_photo_analysis') ||
             allPrompts.find(p => p.id === 'general_summary');
    }
    
    // Par défaut
    return allPrompts.find(p => p.id === 'general_summary');
  };

  const handlePromptSelect = (promptId: string) => {
    setSelectedPrompt(promptId);
  };

  const handleConfirm = () => {
    const prompt = prompts.find(p => p.id === selectedPrompt);
    if (prompt) {
      onPromptSelect(selectedPrompt, prompt);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!visible || !file) return null;

  return (
    <div
      className="fixed z-50 bg-slate-700 border border-slate-600 rounded shadow-lg p-4 min-w-80 max-w-96"
      style={{
        left: x,
        top: y,
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-slate-200 mb-1">
          Sélectionner un prompt pour l'analyse
        </h3>
        <p className="text-xs text-slate-400 truncate">
          {file.name}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <span className="ml-2 text-xs text-slate-400">Chargement des prompts...</span>
        </div>
      )}

      {/* Prompts List */}
      {!loading && (
        <div className="max-h-64 overflow-y-auto mb-4">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`p-2 rounded cursor-pointer transition-colors ${
                selectedPrompt === prompt.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-600 text-slate-300'
              }`}
              onClick={() => handlePromptSelect(prompt.id)}
            >
              <div className="flex items-start">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {prompt.name}
                  </div>
                  <div className="text-xs opacity-75 truncate mt-1">
                    {prompt.description}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs px-1 py-0.5 rounded bg-slate-600">
                      {prompt.domain}
                    </span>
                    <span className="text-xs px-1 py-0.5 rounded bg-slate-600">
                      {prompt.type}
                    </span>
                  </div>
                </div>
                {selectedPrompt === prompt.id && (
                  <div className="ml-2 text-blue-400">
                    ✓
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2">
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 rounded transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedPrompt}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            selectedPrompt
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          }`}
        >
          Analyser
        </button>
      </div>
    </div>
  );
};

export default PromptSelector;
