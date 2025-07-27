import React, { useState } from 'react';
import {
  TrashIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  DocumentMagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { promptService } from '../../services/promptService';

interface FileActionsProps {
  selectedFiles: (number | string)[];
  onClearSelection: () => void;
  isProcessing: boolean;
  files: any[]; // Ajout des fichiers pour les actions de masse
}

const FileActions: React.FC<FileActionsProps> = ({
  selectedFiles,
  onClearSelection,
  isProcessing,
  files,
}) => {
  const [showLegend, setShowLegend] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Conditions pour les actions
  const selectedCount = selectedFiles.length;
  const canClear = selectedCount > 0;
  const canAnalyze = selectedCount > 0 && !isProcessing && !isBulkProcessing;
  const canCompare = selectedCount >= 2 && !isProcessing && !isBulkProcessing;
  const canRetry = selectedCount > 0 && !isProcessing && !isBulkProcessing;

  // Vérifier s'il y a des fichiers en échec parmi les sélectionnés
  const hasFailedFiles = selectedFiles.some(fileId => {
    const file = files.find(f => f.id === fileId || f.path === fileId);
    return file?.status === 'failed';
  });

  // Action d'analyse en masse
  const handleBulkAnalysis = async (analysisType: string = 'general') => {
    if (!canAnalyze) return;

    try {
      setIsBulkProcessing(true);
      
      const fileIds = selectedFiles.filter(id => typeof id === 'number') as number[];
      
      if (fileIds.length === 0) {
        console.warn('Aucun fichier valide sélectionné pour l\'analyse');
        return;
      }

      const response = await fetch('/api/analysis/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file_ids: fileIds, 
          analysis_type: analysisType 
        }),
      });

      if (response.ok) {
        console.log(`✅ Analyse en masse lancée pour ${fileIds.length} fichiers`);
        // Synchroniser après l'action
        setTimeout(async () => {
          // Recharger la queue et les statuts
          window.location.reload(); // Solution simple pour synchroniser
        }, 2000);
      } else {
        console.error('❌ Erreur lors de l\'analyse en masse');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse en masse:', error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Action de retry en masse
  const handleBulkRetry = async () => {
    if (!canRetry || !hasFailedFiles) return;

    try {
      setIsBulkProcessing(true);
      
      const failedFileIds = selectedFiles
        .filter(fileId => {
          const file = files.find(f => f.id === fileId || f.path === fileId);
          return file?.status === 'failed';
        })
        .filter(id => typeof id === 'number') as number[];

      if (failedFileIds.length === 0) {
        console.warn('Aucun fichier en échec sélectionné');
        return;
      }

      const response = await fetch('/api/analysis/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file_ids: failedFileIds, 
          analysis_type: 'general' 
        }),
      });

      if (response.ok) {
        console.log(`✅ Retry en masse lancé pour ${failedFileIds.length} fichiers`);
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error('❌ Erreur lors du retry en masse:', error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Action de téléchargement ZIP
  const handleDownloadZip = async () => {
    if (!canClear) return;

    try {
      setIsBulkProcessing(true);
      
      // Utiliser l'endpoint pour télécharger les fichiers sélectionnés
      const response = await fetch('/api/files/download-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected_files_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log(`✅ Téléchargement ZIP lancé pour ${selectedCount} fichiers`);
      } else {
        console.error('❌ Erreur lors du téléchargement ZIP:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('📋 Détails:', errorText);
      }
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement ZIP:', error);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions principales */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Action d'effacement - condition: fichiers sélectionnés */}
        {canClear && (
          <button
            onClick={onClearSelection}
            disabled={isProcessing || isBulkProcessing}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            title="Désélectionner tous les fichiers actuellement sélectionnés"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Effacer Sélection
            <span className="ml-2 bg-red-700 text-white text-xs px-2 py-1 rounded-full">
              {selectedCount}
            </span>
          </button>
        )}

        {/* Action d'analyse en masse */}
        {canAnalyze && (
          <button
            onClick={() => handleBulkAnalysis('general')}
            disabled={isProcessing || isBulkProcessing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            title={`Analyser ${selectedCount} fichier(s) sélectionné(s)`}
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            Analyser en masse
            <span className="ml-2 bg-blue-700 text-white text-xs px-2 py-1 rounded-full">
              {selectedCount}
            </span>
          </button>
        )}

        {/* Action de comparaison */}
        {canCompare && (
          <button
            onClick={() => handleBulkAnalysis('comparison')}
            disabled={isProcessing || isBulkProcessing}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            title={`Comparer ${selectedCount} fichier(s) sélectionné(s)`}
          >
            <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Comparer
            <span className="ml-2 bg-purple-700 text-white text-xs px-2 py-1 rounded-full">
              {selectedCount}
            </span>
          </button>
        )}

        {/* Action de téléchargement ZIP */}
        {canClear && (
          <button
            onClick={handleDownloadZip}
            disabled={isProcessing || isBulkProcessing}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            title={`Télécharger ${selectedCount} fichier(s) sélectionné(s) en ZIP`}
          >
            <span className="mr-2">📦</span>
            Télécharger ZIP
            <span className="ml-2 bg-green-700 text-white text-xs px-2 py-1 rounded-full">
              {selectedCount}
            </span>
          </button>
        )}

        {/* Action de retry en masse */}
        {canRetry && hasFailedFiles && (
          <button
            onClick={handleBulkRetry}
            disabled={isProcessing || isBulkProcessing}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            title="Relancer l'analyse des fichiers en échec"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry échecs
            <span className="ml-2 bg-orange-700 text-white text-xs px-2 py-1 rounded-full">
              {selectedFiles.filter(fileId => {
                const file = files.find(f => f.id === fileId || f.path === fileId);
                return file?.status === 'failed';
              }).length}
            </span>
          </button>
        )}

        {/* Bouton légende */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors"
          title="Afficher la légende des actions"
        >
          <InformationCircleIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Légende des actions */}
      {showLegend && (
        <div className="bg-slate-700 rounded-lg p-4 text-sm">
          <h4 className="font-medium text-slate-200 mb-3 flex items-center">
            <InformationCircleIcon className="h-4 w-4 mr-2" />
            Informations sur les Actions
          </h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-600 rounded mr-2"></div>
              <span className="text-slate-300">Effacer Sélection</span>
              <span className="text-slate-400 text-xs ml-2">- Désélectionner tous les fichiers</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
              <span className="text-slate-300">Analyser en masse</span>
              <span className="text-slate-400 text-xs ml-2">- Analyser tous les fichiers sélectionnés</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-600 rounded mr-2"></div>
              <span className="text-slate-300">Comparer</span>
              <span className="text-slate-400 text-xs ml-2">- Comparer 2+ fichiers sélectionnés</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-600 rounded mr-2"></div>
              <span className="text-slate-300">Retry échecs</span>
              <span className="text-slate-400 text-xs ml-2">- Relancer les fichiers en échec</span>
            </div>
            <div className="text-slate-400 text-xs mt-3">
              💡 <strong>Astuce :</strong> Utilisez le menu contextuel (clic droit) sur les fichiers pour des analyses spécifiques
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de statut */}
      {(isProcessing || isBulkProcessing) && (
        <div className="flex items-center text-sm text-blue-400 bg-blue-900/20 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
          {isBulkProcessing ? 'Traitement en masse en cours...' : 'Traitement en cours...'} Veuillez patienter
        </div>
      )}

      {/* Messages d'aide contextuels */}
      {selectedCount === 0 && !isProcessing && !isBulkProcessing && (
        <div className="flex items-center text-sm text-slate-400 bg-slate-700/50 px-3 py-2 rounded-lg">
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          Sélectionnez des fichiers dans l'arborescence pour voir les actions disponibles
        </div>
      )}

      {selectedCount === 1 && !isProcessing && !isBulkProcessing && (
        <div className="flex items-center text-sm text-slate-400 bg-slate-700/50 px-3 py-2 rounded-lg">
          <InformationCircleIcon className="h-4 w-4 mr-2" />
          Utilisez le menu contextuel (clic droit) sur le fichier pour des analyses spécifiques
        </div>
      )}

      {selectedCount >= 2 && !isProcessing && !isBulkProcessing && (
        <div className="flex items-center text-sm text-green-400 bg-green-900/20 px-3 py-2 rounded-lg">
          <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-2" />
          {selectedCount} fichiers sélectionnés - Actions de masse et comparaison disponibles
        </div>
      )}

      {/* Indicateur de fichiers en échec */}
      {hasFailedFiles && selectedCount > 0 && !isProcessing && !isBulkProcessing && (
        <div className="flex items-center text-sm text-orange-400 bg-orange-900/20 px-3 py-2 rounded-lg">
          <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
          Certains fichiers sélectionnés sont en échec - Utilisez "Retry échecs" pour les relancer
        </div>
      )}
    </div>
  );
};

export default FileActions;