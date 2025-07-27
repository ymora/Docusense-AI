import React, { useState } from 'react';

interface PromptActionsProps {
  selectedFiles: number[];
  onAnalyze: () => void;
  isProcessing: boolean;
}

const PromptActions: React.FC<PromptActionsProps> = ({ selectedFiles, onAnalyze, isProcessing }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('general_summary');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showCustomPrompt, setShowCustomPrompt] = useState<boolean>(false);

  const prompts = [
    { id: 'general_summary', name: '📋 Résumé Général', description: 'Résumé exécutif du document' },
    { id: 'juridical_contract_analysis', name: '⚖️ Analyse Juridique', description: 'Analyse complète de contrat' },
    { id: 'juridical_litigation_analysis', name: '🏛️ Analyse de Litige', description: 'Analyse juridique de litige' },
    { id: 'technical_norm_verification', name: '🔧 Vérification Normative', description: 'Vérification technique des normes' },
    { id: 'technical_dtu_analysis', name: '📐 Analyse DTU', description: 'Analyse des Documents Techniques Unifiés' },
    { id: 'administrative_document_analysis', name: '📝 Analyse Administrative', description: 'Analyse de documents administratifs' },
    { id: 'general_extraction', name: '📊 Extraction de Données', description: 'Extraction structurée de données' },
    { id: 'custom', name: '✏️ Prompt Personnalisé', description: 'Utiliser votre propre prompt' },
  ];

  const handleAnalyzeWithPrompt = async () => {
    if (selectedFiles.length === 0) {return;}

    try {
      // Analyse avec prompt personnalisé
      onAnalyze();
    } catch (error) {

    }
  };

  if (selectedFiles.length === 0) {
    return (
      <div className="bg-slate-700 rounded-lg p-4">
        <div className="text-center text-slate-400">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-sm">Sélectionnez des fichiers pour voir les actions disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          🎯 Actions d'Analyse IA
        </h3>
        <div className="text-sm text-slate-400">
          {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Sélection du prompt */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          Choisissez un type d'analyse :
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => {
                setSelectedPrompt(prompt.id);
                if (prompt.id === 'custom') {
                  setShowCustomPrompt(true);
                } else {
                  setShowCustomPrompt(false);
                }
              }}
              className={`
                p-3 rounded-lg border text-left transition-all duration-200
                ${selectedPrompt === prompt.id
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
              : 'bg-slate-600 border-slate-500 text-slate-300 hover:bg-slate-500 hover:border-slate-400'
            }
              `}
            >
              <div className="font-medium text-sm">{prompt.name}</div>
              <div className="text-xs opacity-80 mt-1">{prompt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt personnalisé */}
      {showCustomPrompt && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            Votre prompt personnalisé :
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Entrez votre prompt personnalisé ici..."
            className="w-full h-32 p-3 bg-slate-600 border border-slate-500 rounded-lg text-slate-300 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="text-xs text-slate-400">
            Utilisez {'{text}'} pour référencer le contenu du document
          </div>
        </div>
      )}

      {/* Bouton d'analyse */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-600">
        <div className="text-sm text-slate-400">
          {selectedPrompt === 'custom' && customPrompt
            ? 'Prompt personnalisé configuré'
            : `Prompt sélectionné : ${prompts.find(p => p.id === selectedPrompt)?.name}`
          }
        </div>

        <button
          onClick={handleAnalyzeWithPrompt}
          disabled={isProcessing || (selectedPrompt === 'custom' && !customPrompt.trim())}
          className={`
            px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
            ${isProcessing || (selectedPrompt === 'custom' && !customPrompt.trim())
      ? 'bg-slate-500 text-slate-400 cursor-not-allowed'
      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
    }
          `}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Analyse en cours...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Lancer l'Analyse</span>
            </>
          )}
        </button>
      </div>

      {/* Informations supplémentaires */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
        <div className="flex items-start space-x-2 text-sm text-blue-300">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
          <div>
            <p className="font-medium mb-1">💡 Conseils d'utilisation :</p>
            <ul className="text-xs space-y-1 text-blue-200">
              <li>• Double-cliquez sur un fichier pour voir ses résultats d'analyse</li>
              <li>• Les prompts spécialisés donnent de meilleurs résultats</li>
              <li>• Utilisez le prompt personnalisé pour des besoins spécifiques</li>
              <li>• Les analyses sont sauvegardées automatiquement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptActions;