import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface FileDetails {
  id: number;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  analysis_started_at?: string;
  analysis_completed_at?: string;
  error_message?: string;
  analysis_results?: any;
  metadata?: any;
  // Dates du fichier lui-même
  file_created_at?: string;
  file_modified_at?: string;
  file_accessed_at?: string;
}

interface FileDetailsPanelProps {
  selectedFile: FileDetails | null;
  onClose: () => void;
  onViewFile?: (file: FileDetails) => void;
}

const FileDetailsPanel: React.FC<FileDetailsPanelProps> = ({ selectedFile, onClose, onViewFile }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      loadFileDetails(selectedFile.id);
    }
  }, [selectedFile]);

  const loadFileDetails = async (fileId: number) => {
    try {
      setLoading(true);

      // Vérifier que l'ID est valide
      if (!fileId || fileId === undefined) {

        return;
      }

      const response = await fetch(`/api/files/${fileId}/details`);
      if (response.ok) {
        await response.json();
        // Les détails sont déjà dans selectedFile
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'failed': return <XCircleIcon className="w-5 h-5 text-red-400" />;
      case 'processing': return <ClockIcon className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'pending': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'failed': return 'Échec';
      case 'processing': return 'En cours';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  };

  if (!selectedFile) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="p-6 border-b border-slate-200/10 bg-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-blue-400 flex items-center">
            <DocumentTextIcon className="w-6 h-6 mr-2 text-blue-400" />
            Détails du fichier
          </h3>
          {onViewFile && (
            <button
              onClick={() => onViewFile(selectedFile)}
              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Visualiser le fichier original"
            >
              <DocumentMagnifyingGlassIcon className="w-4 h-4 mr-2" />
              Visualiser
            </button>
          )}
        </div>
        <div className="text-base text-slate-200 truncate font-semibold" title={selectedFile.path}>
          {selectedFile.name}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Informations de base */}
            <div className="bg-slate-800 rounded-lg p-6 shadow border border-slate-700">
              <h4 className="text-base font-semibold text-slate-200 mb-3 flex items-center">
                <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-400" />
                Informations de base
              </h4>
              <div className="space-y-2 text-base">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nom:</span>
                  <span className="text-slate-200 font-medium">{selectedFile.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taille:</span>
                  <span className="text-slate-200">{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-slate-200">{selectedFile.mime_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statut d'analyse IA:</span>
                  <div className="flex items-center">
                    {getStatusIcon(selectedFile.status)}
                    <span className="ml-2 text-slate-200">{getStatusText(selectedFile.status)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-slate-800 rounded-lg p-6 shadow border border-slate-700">
              <h4 className="text-base font-semibold text-slate-200 mb-3 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-blue-400" />
                Dates
              </h4>
              <div className="space-y-2 text-base">
                {/* Dates du fichier lui-même */}
                {selectedFile.file_created_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fichier créé:</span>
                    <span className="text-slate-200">{formatDate(selectedFile.file_created_at)}</span>
                  </div>
                )}
                {selectedFile.file_modified_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fichier modifié:</span>
                    <span className="text-slate-200">{formatDate(selectedFile.file_modified_at)}</span>
                  </div>
                )}
                {selectedFile.file_accessed_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dernier accès:</span>
                    <span className="text-slate-200">{formatDate(selectedFile.file_accessed_at)}</span>
                  </div>
                )}
                
                {/* Séparateur si les deux types de dates sont présents */}
                {(selectedFile.file_created_at || selectedFile.file_modified_at || selectedFile.file_accessed_at) && 
                 (selectedFile.created_at || selectedFile.updated_at) && (
                  <div className="border-t border-slate-600 my-3"></div>
                )}
                
                {/* Dates de la base de données */}
                <div className="flex justify-between">
                  <span className="text-slate-400">Ajouté en base:</span>
                  <span className="text-slate-200">{formatDate(selectedFile.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Modifié en base:</span>
                  <span className="text-slate-200">{formatDate(selectedFile.updated_at)}</span>
                </div>
                {selectedFile.analysis_started_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Analyse débutée:</span>
                    <span className="text-slate-200">{formatDate(selectedFile.analysis_started_at)}</span>
                  </div>
                )}
                {selectedFile.analysis_completed_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Analyse terminée:</span>
                    <span className="text-slate-200">{formatDate(selectedFile.analysis_completed_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Erreur si échec */}
            {selectedFile.status === 'failed' && selectedFile.error_message && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
                <h4 className="text-base font-semibold text-red-200 mb-2 flex items-center">
                  <XCircleIcon className="w-5 h-5 mr-2 text-red-400" />
                  Erreur d'analyse
                </h4>
                <p className="text-base text-red-300">{selectedFile.error_message}</p>
              </div>
            )}

            {/* Résultats d'analyse */}
            {selectedFile.status === 'completed' && selectedFile.analysis_results && (
              <div className="bg-slate-800 rounded-lg p-6 shadow border border-green-700">
                <h4 className="text-base font-semibold text-green-300 mb-3 flex items-center">
                  <DocumentMagnifyingGlassIcon className="w-5 h-5 mr-2 text-green-400" />
                  Résultats d'analyse
                </h4>
                <div className="space-y-3">
                  {selectedFile.analysis_results.summary && (
                    <div>
                      <h5 className="text-xs font-medium text-slate-400 mb-1">Résumé</h5>
                      <p className="text-base text-slate-200">{selectedFile.analysis_results.summary}</p>
                    </div>
                  )}
                  {selectedFile.analysis_results.key_points && (
                    <div>
                      <h5 className="text-xs font-medium text-slate-400 mb-1">Points clés</h5>
                      <ul className="text-base text-slate-200 space-y-1">
                        {selectedFile.analysis_results.key_points.map((point: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedFile.analysis_results.confidence && (
                    <div>
                      <h5 className="text-xs font-medium text-slate-400 mb-1">Confiance</h5>
                      <div className="flex items-center">
                        <div className="flex-1 bg-slate-700 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${selectedFile.analysis_results.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-base text-slate-200">{selectedFile.analysis_results.confidence}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Métadonnées */}
            {selectedFile.metadata && Object.keys(selectedFile.metadata).length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6 shadow border border-slate-700">
                <h4 className="text-base font-semibold text-slate-200 mb-3 flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2 text-blue-400" />
                  Métadonnées
                </h4>
                <div className="space-y-2 text-base">
                  {Object.entries(selectedFile.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-400 capitalize">{key}:</span>
                      <span className="text-slate-200">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-slate-800 rounded-lg p-6 shadow border border-slate-700">
              <h4 className="text-base font-semibold text-slate-200 mb-3">Actions</h4>
              <div className="space-y-2">
                {selectedFile.status === 'completed' && (
                  <button className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-base">
                    <DocumentMagnifyingGlassIcon className="w-5 h-5 mr-2" />
                    Voir les résultats
                  </button>
                )}
                {selectedFile.status === 'failed' && (
                  <button className="w-full flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-base">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Réessayer l'analyse
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDetailsPanel;