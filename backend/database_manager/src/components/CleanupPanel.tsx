import React, { useState } from 'react';
import { Trash2, RefreshCw, Save, RotateCcw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DatabaseAPI } from '../api';

interface CleanupPanelProps {
  onStatusUpdate: () => void;
}

export const CleanupPanel: React.FC<CleanupPanelProps> = ({ onStatusUpdate }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAction = async (action: string, apiCall: () => Promise<any>) => {
    setLoading(action);
    setMessage(null);
    
    try {
      const result = await apiCall();
      setMessage({ type: 'success', text: result.message || 'Action réussie' });
      onStatusUpdate();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur inconnue' });
    } finally {
      setLoading(null);
    }
  };

  const cleanupActions = [
    {
      id: 'orphaned-files',
      title: 'Nettoyer Fichiers Orphelins',
      description: 'Supprime les fichiers introuvables sur le disque',
      icon: <Trash2 size={20} />,
      color: 'bg-red-500 hover:bg-red-600',
      action: () => DatabaseAPI.cleanupOrphanedFiles()
    },
    {
      id: 'failed-analyses',
      title: 'Nettoyer Analyses Échouées',
      description: 'Supprime les analyses en statut "failed"',
      icon: <XCircle size={20} />,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => DatabaseAPI.cleanupFailedAnalyses()
    },
    {
      id: 'old-queue',
      title: 'Nettoyer Tâches Anciennes',
      description: 'Supprime les tâches terminées de plus de 24h',
      icon: <Clock size={20} />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: () => DatabaseAPI.cleanupOldQueueItems()
    },
    {
      id: 'temp-files',
      title: 'Nettoyer Fichiers Temporaires',
      description: 'Supprime les fichiers temporaires',
      icon: <Trash2 size={20} />,
      color: 'bg-gray-500 hover:bg-gray-600',
      action: () => DatabaseAPI.cleanupTempFiles()
    },
    {
      id: 'fix-statuses',
      title: 'Corriger Statuts Invalides',
      description: 'Corrige automatiquement les statuts incorrects',
      icon: <RefreshCw size={20} />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => DatabaseAPI.fixInvalidStatuses()
    },
    {
      id: 'full-cleanup',
      title: 'Nettoyage Complet',
      description: 'Exécute toutes les opérations de nettoyage',
      icon: <AlertTriangle size={20} />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => DatabaseAPI.fullCleanup()
    }
  ];

  const backupActions = [
    {
      id: 'create-backup',
      title: 'Créer Sauvegarde',
      description: 'Crée une sauvegarde de la base de données',
      icon: <Save size={20} />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => DatabaseAPI.createBackup()
    },
    {
      id: 'restore-backup',
      title: 'Restaurer Sauvegarde',
      description: 'Restaure depuis une sauvegarde existante',
      icon: <RotateCcw size={20} />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: async () => {
        const backups = await DatabaseAPI.getBackups();
        if (backups.length === 0) {
          throw new Error('Aucune sauvegarde disponible');
        }
        // Pour simplifier, on restaure la plus récente
        const latestBackup = backups[0];
        return DatabaseAPI.restoreBackup(latestBackup.name);
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Message de statut */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Actions de nettoyage */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Actions de Nettoyage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cleanupActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id, action.action)}
              disabled={loading !== null}
              className={`${action.color} text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center space-x-3">
                {action.icon}
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </div>
              </div>
              {loading === action.id && (
                <div className="mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Actions de sauvegarde */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sauvegarde et Restauration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {backupActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id, action.action)}
              disabled={loading !== null}
              className={`${action.color} text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center space-x-3">
                {action.icon}
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </div>
              </div>
              {loading === action.id && (
                <div className="mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
