import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import {
  DocumentTextIcon,
  DocumentMagnifyingGlassIcon,
  ArrowPathIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/fileUtils';
import { getStatusIcon, getStatusText } from '../../utils/statusUtils.tsx';
import { useAnalysisService } from '../../hooks/useAnalysisService';

interface AnalysisResult {
  id: number;
  file_id: number;
  analysis_type: string;
  status: string;
  result?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

interface FileResultViewerProps {
  fileId: number;
  onClose: () => void;
}

const FileResultViewer: React.FC<FileResultViewerProps> = ({ fileId, onClose }) => {
  const { colors, colorMode } = useColors();
  const analysisService = useAnalysisService();
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    loadAnalysisResults();
  }, [fileId]);

  const loadAnalysisResults = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await analysisService.getAnalysisFile(fileId);
      if (result.success && result.data) {
        setAnalysisResults(result.data.analyses || []);
      } else {
        setError('Impossible de charger les résultats d\'analyse');
      }
    } catch (err) {
      setError('Erreur lors du chargement des résultats');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryAnalysis = async (analysisId: number): Promise<void> => {
    try {
      const result = await analysisService.retryAnalysis(analysisId);

      if (result.success) {
        await loadAnalysisResults();
      }
    } catch (err) {
      // Gestion silencieuse des erreurs
    }
  };

  // Utilisation de la fonction centralisée formatDate

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-64"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-64"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p
            className="text-lg font-medium"
            style={{ color: colors.text }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (analysisResults.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-500" />
          <p
            className="text-lg font-medium"
            style={{ color: colors.text }}
          >
            Aucun résultat d'analyse disponible
          </p>
          <p
            className="text-sm mt-2"
            style={{ color: colors.textSecondary }}
          >
            Les analyses seront affichées ici une fois terminées
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Header */}
      <div
        className="p-4 border-b flex items-center justify-between"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center gap-3">
          <DocumentMagnifyingGlassIcon className="h-6 w-6" style={{ color: colors.textSecondary }} />
          <div>
            <h3
              className="font-semibold text-lg"
              style={{ color: colors.text }}
            >
            Résultats d'analyse
            </h3>
            <p
              className="text-sm"
              style={{ color: colors.textSecondary }}
            >
              {analysisResults.length} analyse(s) trouvée(s)
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          style={{ color: colors.textSecondary }}
        >
          <XCircleIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {analysisResults.map((analysis) => (
            <div
              key={analysis.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedAnalysis?.id === analysis.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedAnalysis(analysis)}
              style={{
                backgroundColor: selectedAnalysis?.id === analysis.id
                  ? (colorMode === 'dark' ? '#475569' : '#e2e8f0')
                  : colors.surface,
                borderColor: selectedAnalysis?.id === analysis.id
                  ? colors.primary
                  : colors.border,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(analysis.status as any)}
                  <div>
                    <h4
                      className="font-medium"
                      style={{ color: colors.text }}
                    >
                      {analysis.analysis_type}
                    </h4>
                    <p
                      className="text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      {getStatusText(analysis.status as any)}
                    </p>
                  </div>
                </div>

                {analysis.status === 'failed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetryAnalysis(analysis.id);
                    }}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    style={{ color: colors.textSecondary }}
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Créé :</span>
                  <span style={{ color: colors.text }}>
                    {formatDate(analysis.created_at)}
                  </span>
                </div>

                {analysis.started_at && (
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>Démarré :</span>
                    <span style={{ color: colors.text }}>
                      {formatDate(analysis.started_at)}
                    </span>
                  </div>
                )}

                {analysis.completed_at && (
                  <div className="flex justify-between">
                    <span style={{ color: colors.textSecondary }}>Terminé :</span>
                    <span style={{ color: colors.text }}>
                      {formatDate(analysis.completed_at)}
                    </span>
                  </div>
                )}
              </div>

              {analysis.error_message && (
                <div className="mt-3 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {analysis.error_message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedAnalysis && (
        <div
          className="border-t p-4"
          style={{ borderColor: colors.border }}
        >
          <div className="space-y-4">
            <h4
              className="font-medium text-lg"
              style={{ color: colors.text }}
            >
              Détails de l'analyse
            </h4>

            {selectedAnalysis.result && (
              <div>
                <h5
                  className="font-medium mb-2"
                  style={{ color: colors.text }}
                >
                  Résultat
                </h5>
                <div
                  className="p-3 rounded-md text-sm max-h-40 overflow-y-auto"
                  style={{
                    backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
                    color: colors.textSecondary,
                  }}
                >
                  {selectedAnalysis.result}
                </div>
              </div>
            )}

            {selectedAnalysis.metadata && Object.keys(selectedAnalysis.metadata).length > 0 && (
              <div>
                <h5
                  className="font-medium mb-2"
                  style={{ color: colors.text }}
                >
            Métadonnées
                </h5>
                <div
                  className="p-3 rounded-md text-sm max-h-40 overflow-y-auto"
                  style={{
                    backgroundColor: colorMode === 'dark' ? '#475569' : '#e2e8f0',
                    color: colors.textSecondary,
                  }}
                >
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(selectedAnalysis.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileResultViewer;