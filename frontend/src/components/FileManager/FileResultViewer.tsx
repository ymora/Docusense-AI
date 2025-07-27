import React, { useState } from 'react';
import { File } from '../../stores/fileStore';

interface AnalysisData {
  id: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  provider: string;
  model: string;
  analysis_type: string;
  status: string;
  result?: string;
  error_message?: string;
  analysis_metadata?: any;
}

interface FileResultViewerProps {
  selectedFile: File | null;
  onClose: () => void;
}

const FileResultViewer: React.FC<FileResultViewerProps> = ({ selectedFile, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'analysis' | 'metadata'>('summary');

  if (!selectedFile) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: File['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'paused': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'unsupported': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: File['status']) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'processing': return 'En cours';
      case 'paused': return 'En pause';
      case 'completed': return 'Terminé';
      case 'failed': return 'Échec';
      case 'unsupported': return 'Non supporté';
      default: return 'Inconnu';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">
              {selectedFile.mime_type.includes('pdf') ? '📄' :
                selectedFile.mime_type.includes('word') ? '📝' :
                  selectedFile.mime_type.includes('excel') ? '📊' :
                    selectedFile.mime_type.includes('image') ? '🖼️' :
                      selectedFile.mime_type.includes('email') ? '📧' :
                        '📄'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{selectedFile.name}</h2>
              <p className="text-sm text-slate-400">{selectedFile.path}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-slate-700 border-b border-slate-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedFile.status)}`} />
              <span className="text-sm font-medium text-white">{getStatusText(selectedFile.status)}</span>
            </div>
            <div className="text-sm text-slate-300">
              <span className="font-medium">{formatFileSize(selectedFile.size)}</span>
              <span className="mx-2">•</span>
              <span>{selectedFile.mime_type}</span>
              <span className="mx-2">•</span>
              <span>Créé le {formatDate(selectedFile.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 Résumé
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔍 Analyse Complète
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'metadata'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 Informations
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Résumé Exécutif</h3>
                {selectedFile.analysis_result ? (
                  <div className="prose prose-invert max-w-none">
                    <div className="text-slate-300 leading-relaxed">
                      {selectedFile.analysis_result.split('\n').slice(0, 5).join('\n')}
                      {selectedFile.analysis_result.split('\n').length > 5 && (
                        <div className="mt-2 text-blue-400 text-sm">
                          ... (voir analyse complète pour plus de détails)
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic">
                    Aucun résumé disponible. Lancez une analyse pour générer un résumé.
                  </div>
                )}
              </div>

              {selectedFile.extracted_text && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Texte Extrait</h3>
                  <div className="text-slate-300 text-sm max-h-40 overflow-y-auto">
                    {selectedFile.extracted_text.length > 500
                      ? `${selectedFile.extracted_text.substring(0, 500)}...`
                      : selectedFile.extracted_text
                    }
                  </div>
                </div>
              )}

              {selectedFile.error_message && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-400 mb-3">Erreur d'Analyse</h3>
                  <div className="text-red-300 text-sm">
                    {selectedFile.error_message}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {selectedFile.analysis_result ? (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Analyse Complète</h3>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedFile.analysis_result}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-lg font-medium mb-2">Aucune analyse disponible</p>
                  <p className="text-sm">
                    Lancez une analyse pour voir les résultats détaillés
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Informations Fichier</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Nom :</span>
                    <span className="text-white ml-2">{selectedFile.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Taille :</span>
                    <span className="text-white ml-2">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Type MIME :</span>
                    <span className="text-white ml-2">{selectedFile.mime_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Statut d'analyse IA :</span>
                    <span className="text-white ml-2">{getStatusText(selectedFile.status)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Créé le :</span>
                    <span className="text-white ml-2">{formatDate(selectedFile.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Modifié le :</span>
                    <span className="text-white ml-2">
                      {selectedFile.updated_at ? formatDate(selectedFile.updated_at) : 'Non modifié'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Chemin Complet</h3>
                <div className="text-slate-300 text-sm break-all">
                  {selectedFile.path}
                </div>
              </div>

              {selectedFile.parent_directory && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Répertoire Parent</h3>
                  <div className="text-slate-300 text-sm break-all">
                    {selectedFile.parent_directory}
                  </div>
                </div>
              )}

              {selectedFile.extracted_text && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Statistiques Texte</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Caractères :</span>
                      <span className="text-white ml-2">{selectedFile.extracted_text.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Mots :</span>
                      <span className="text-white ml-2">
                        {selectedFile.extracted_text.split(/\s+/).filter(word => word.length > 0).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Lignes :</span>
                      <span className="text-white ml-2">
                        {selectedFile.extracted_text.split('\n').length}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedFile.analysis_metadata && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Métadonnées d'Analyse</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedFile.analysis_metadata.provider && (
                      <div>
                        <span className="text-slate-400">Provider IA :</span>
                        <span className="text-white ml-2 capitalize">{selectedFile.analysis_metadata.provider}</span>
                      </div>
                    )}
                    {selectedFile.analysis_metadata.model && (
                      <div>
                        <span className="text-slate-400">Modèle :</span>
                        <span className="text-white ml-2">{selectedFile.analysis_metadata.model}</span>
                      </div>
                    )}
                    {selectedFile.analysis_metadata.processing_time && (
                      <div>
                        <span className="text-slate-400">Temps de traitement :</span>
                        <span className="text-white ml-2">{selectedFile.analysis_metadata.processing_time.toFixed(2)}s</span>
                      </div>
                    )}
                    {selectedFile.analysis_metadata.tokens_used && (
                      <div>
                        <span className="text-slate-400">Tokens utilisés :</span>
                        <span className="text-white ml-2">{selectedFile.analysis_metadata.tokens_used.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedFile.analysis_metadata.estimated_cost && (
                      <div>
                        <span className="text-slate-400">Coût estimé :</span>
                        <span className="text-white ml-2">${selectedFile.analysis_metadata.estimated_cost.toFixed(4)}</span>
                      </div>
                    )}
                    {selectedFile.analysis_metadata.timestamp && (
                      <div>
                        <span className="text-slate-400">Analysé le :</span>
                        <span className="text-white ml-2">{formatDate(new Date(selectedFile.analysis_metadata.timestamp * 1000).toISOString())}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nouvelle section pour les dates d'analyse */}
              {selectedFile.analysis_result && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Dates d'Analyse IA</h3>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Analyse demandée :</span>
                      <span className="text-white ml-2">{formatDate(selectedFile.created_at)}</span>
                    </div>
                    {selectedFile.analysis_metadata?.started_at && (
                      <div>
                        <span className="text-slate-400">Analyse débutée :</span>
                        <span className="text-white ml-2">{formatDate(selectedFile.analysis_metadata.started_at)}</span>
                      </div>
                    )}
                    {selectedFile.analysis_metadata?.completed_at && (
                      <div>
                        <span className="text-slate-400">Analyse terminée :</span>
                        <span className="text-white ml-2">{formatDate(selectedFile.analysis_metadata.completed_at)}</span>
                      </div>
                    )}
                    {selectedFile.analysis_metadata?.processing_time && (
                      <div>
                        <span className="text-slate-400">Durée totale :</span>
                        <span className="text-white ml-2">{selectedFile.analysis_metadata.processing_time.toFixed(2)} secondes</span>
                      </div>
                    )}
                    {selectedFile.analysis_metadata?.timestamp && (
                      <div>
                        <span className="text-slate-400">Timestamp d'analyse :</span>
                        <span className="text-white ml-2">{formatDate(new Date(selectedFile.analysis_metadata.timestamp * 1000).toISOString())}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <div className="text-sm text-slate-400">
            ID: {selectedFile.id}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileResultViewer;