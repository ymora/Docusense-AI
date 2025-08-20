import React, { useState, useEffect } from 'react';
import { Database, Settings, FileText, Clock, RefreshCw } from 'lucide-react';
import { DatabaseAPI } from './api';
import { DatabaseStatus } from './types';
import { StatusOverview } from './components/StatusCard';
import { CleanupPanel } from './components/CleanupPanel';
import { DataTable } from './components/DataTable';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DatabaseAPI.getStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleFileClick = (fileId: number, fileName: string) => {
    setSelectedFileId(fileId);
    setSelectedFileName(fileName);
    setActiveTab('analyses');
  };

  const handleBackToFiles = () => {
    setSelectedFileId(null);
    setSelectedFileName('');
    setActiveTab('files');
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <Database size={20} /> },
    { id: 'files', label: 'Fichiers', icon: <FileText size={20} /> },
    { id: 'analyses', label: 'Analyses', icon: <FileText size={20} /> },
    { id: 'cleanup', label: 'Nettoyage', icon: <Settings size={20} /> }
  ];

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de la base de données...</p>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={loadStatus}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Gestionnaire de Base de Données
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  DocuSense AI
                </p>
              </div>
            </div>
            <button
              onClick={loadStatus}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
            >
              <RefreshCw size={16} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && status && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vue d'ensemble de la base de données
            </h2>
            <StatusOverview status={status} />
            
            {/* Détails de cohérence */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Rapport de cohérence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{status.consistency_report.valid_files}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Fichiers valides</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{status.consistency_report.invalid_statuses}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Statuts invalides</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{status.consistency_report.orphaned_files}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Fichiers orphelins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{status.consistency_report.missing_mime_types}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Types MIME manquants</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Fichiers en base de données
            </h2>
            <DataTable 
              type="files" 
              onFileClick={(fileId, fileName) => {
                handleFileClick(fileId, fileName);
              }}
            />
          </div>
        )}

        {activeTab === 'analyses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedFileId ? `Analyses du fichier: ${selectedFileName}` : 'Toutes les analyses'}
              </h2>
              {selectedFileId && (
                <button
                  onClick={handleBackToFiles}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm"
                >
                  ← Retour aux fichiers
                </button>
              )}
            </div>
            <DataTable 
              type="analyses" 
              title={selectedFileId ? `Analyses du fichier #${selectedFileId}` : 'Toutes les analyses'}
              selectedFileId={selectedFileId}
            />
          </div>
        )}



        {activeTab === 'cleanup' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nettoyage et maintenance
            </h2>
            <CleanupPanel onStatusUpdate={loadStatus} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
