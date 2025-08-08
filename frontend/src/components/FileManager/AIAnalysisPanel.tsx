import React, { useState } from 'react';
import {
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useFileStore } from '../../stores/fileStore';
import { getStatusColor, getStatusText } from '../../utils/statusUtils';

interface AIAnalysisPanelProps {
  file: any;
  onClose: () => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ file, onClose }) => {
  const { analyzeFile, retryFailedFiles } = useFileStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStartAnalysis = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    try {
      await analyzeFile(file);
    } catch (error) {
      // Gestion silencieuse de l'erreur
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetryAnalysis = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    try {
      await retryFailedFiles();
    } catch (error) {
      // Gestion silencieuse de l'erreur
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = file.status === 'none' || file.status === 'failed';
  const isProcessing = file.status === 'processing' || file.status === 'pending';
  const hasResults = file.status === 'completed' && file.analysis_result;

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* En-tête */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-600">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-slate-200">
            Analyse IA
          </h3>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(file.status)}`}>
            {getStatusText(file.status)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"
        >
          ✕
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Informations du fichier */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <h4 className="text-slate-200 font-medium mb-2">Fichier analysé</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Nom:</span>
              <span className="text-slate-200">{file.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Type:</span>
              <span className="text-slate-200">{file.mime_type || 'Inconnu'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Taille:</span>
              <span className="text-slate-200">
                {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Inconnue'}
              </span>
            </div>
          </div>
        </div>

        {/* Statut de l'analyse */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <h4 className="text-slate-200 font-medium mb-4">Statut de l'analyse</h4>
          
          {isProcessing && (
            <div className="flex items-center space-x-3 text-blue-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              <span>Analyse en cours...</span>
            </div>
          )}

          {file.status === 'failed' && (
            <div className="flex items-center space-x-3 text-red-400 mb-4">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>L'analyse a échoué</span>
            </div>
          )}

          {file.status === 'completed' && (
            <div className="flex items-center space-x-3 text-green-400 mb-4">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Analyse terminée avec succès</span>
            </div>
          )}

          {file.status === 'none' && (
            <div className="flex items-center space-x-3 text-slate-400 mb-4">
              <ClockIcon className="h-5 w-5" />
              <span>Prêt pour l'analyse</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            {canAnalyze && (
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-4 w-4" />
                <span>{isAnalyzing ? 'Démarrage...' : 'Lancer l\'analyse'}</span>
              </button>
            )}

            {file.status === 'failed' && (
              <button
                onClick={handleRetryAnalysis}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CogIcon className="h-4 w-4" />
                <span>{isAnalyzing ? 'Nouvelle tentative...' : 'Réessayer'}</span>
              </button>
            )}

            {isProcessing && (
              <button
                className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
                onClick={() => {/* Fonctionnalité d'arrêt à implémenter */}}
              >
                Arrêter
              </button>
            )}
          </div>
        </div>

        {/* Résultats de l'analyse */}
        {hasResults && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-slate-200 font-medium mb-4 flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Résultats de l'analyse</span>
            </h4>
            
            <div className="space-y-4">
              {/* Résumé */}
              {file.analysis_result.summary && (
                <div>
                  <h5 className="text-slate-300 font-medium mb-2">Résumé</h5>
                  <div className="bg-slate-700 rounded p-3 text-slate-200 text-sm">
                    {file.analysis_result.summary}
                  </div>
                </div>
              )}

              {/* Mots-clés */}
              {file.analysis_result.keywords && file.analysis_result.keywords.length > 0 && (
                <div>
                  <h5 className="text-slate-300 font-medium mb-2">Mots-clés</h5>
                  <div className="flex flex-wrap gap-2">
                    {file.analysis_result.keywords.map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Métadonnées extraites */}
              {file.analysis_result.metadata && (
                <div>
                  <h5 className="text-slate-300 font-medium mb-2">Métadonnées extraites</h5>
                  <div className="bg-slate-700 rounded p-3">
                    <pre className="text-slate-200 text-xs overflow-x-auto">
                      {JSON.stringify(file.analysis_result.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Statistiques */}
              {file.analysis_result.stats && (
                <div>
                  <h5 className="text-slate-300 font-medium mb-2 flex items-center space-x-2">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>Statistiques</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(file.analysis_result.stats).map(([key, value]) => (
                      <div key={key} className="bg-slate-700 rounded p-3">
                        <div className="text-slate-400 text-xs uppercase tracking-wider">{key}</div>
                        <div className="text-slate-200 font-medium">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contenu complet */}
              {file.analysis_result.content && (
                <div>
                  <h5 className="text-slate-300 font-medium mb-2">Contenu extrait</h5>
                  <div className="bg-slate-700 rounded p-3 max-h-64 overflow-y-auto">
                    <pre className="text-slate-200 text-xs whitespace-pre-wrap">
                      {file.analysis_result.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message si pas de résultats */}
        {!hasResults && !isProcessing && file.status !== 'none' && (
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-center text-slate-400">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun résultat d'analyse disponible</p>
              <p className="text-sm mt-1">
                {file.status === 'failed' 
                  ? 'L\'analyse a échoué. Essayez de la relancer.'
                  : 'L\'analyse n\'a pas encore été effectuée.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPanel; 