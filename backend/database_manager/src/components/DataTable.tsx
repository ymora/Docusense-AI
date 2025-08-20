import React, { useState, useEffect } from 'react';
import { FileInfo, AnalysisInfo, QueueItemInfo } from '../types';
import { DatabaseAPI } from '../api';
import { FileText, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface DataTableProps {
  type: 'files' | 'analyses' | 'queue';
}

const statusIcons = {
  pending: <Clock size={16} className="text-yellow-500" />,
  processing: <Clock size={16} className="text-blue-500" />,
  completed: <CheckCircle size={16} className="text-green-500" />,
  failed: <XCircle size={16} className="text-red-500" />,
  unsupported: <AlertTriangle size={16} className="text-gray-500" />
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  unsupported: 'bg-gray-100 text-gray-800'
};

export const DataTable: React.FC<DataTableProps> = ({ type }) => {
  const [data, setData] = useState<FileInfo[] | AnalysisInfo[] | QueueItemInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [type, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      switch (type) {
        case 'files':
          result = await DatabaseAPI.getFiles(statusFilter || undefined);
          break;
        case 'analyses':
          result = await DatabaseAPI.getAnalyses(statusFilter || undefined);
          break;
        case 'queue':
          result = await DatabaseAPI.getQueueItems(statusFilter || undefined);
          break;
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFileRow = (file: FileInfo) => (
    <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        {file.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {file.mime_type}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formatFileSize(file.size)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[file.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
          {statusIcons[file.status as keyof typeof statusIcons] || <AlertTriangle size={16} />}
          <span className="ml-1">{file.status}</span>
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formatDate(file.updated_at)}
      </td>
    </tr>
  );

  const renderAnalysisRow = (analysis: AnalysisInfo) => (
    <tr key={analysis.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        {analysis.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {analysis.file_id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[analysis.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
          {statusIcons[analysis.status as keyof typeof statusIcons] || <AlertTriangle size={16} />}
          <span className="ml-1">{analysis.status}</span>
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formatDate(analysis.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {analysis.completed_at ? formatDate(analysis.completed_at) : '-'}
      </td>
    </tr>
  );

  const renderQueueRow = (item: QueueItemInfo) => (
    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        {item.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {item.analysis_id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
          {statusIcons[item.status as keyof typeof statusIcons] || <AlertTriangle size={16} />}
          <span className="ml-1">{item.status}</span>
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formatDate(item.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {item.completed_at ? formatDate(item.completed_at) : '-'}
      </td>
    </tr>
  );

  const getHeaders = () => {
    switch (type) {
      case 'files':
        return ['Nom', 'Type MIME', 'Taille', 'Statut', 'Modifié le'];
      case 'analyses':
        return ['ID', 'Fichier ID', 'Statut', 'Créé le', 'Terminé le'];
      case 'queue':
        return ['ID', 'Analyse ID', 'Statut', 'Créé le', 'Terminé le'];
    }
  };

  const getStatusOptions = () => {
    switch (type) {
      case 'files':
        return ['pending', 'processing', 'completed', 'failed', 'unsupported'];
      case 'analyses':
        return ['pending', 'processing', 'completed', 'failed'];
      case 'queue':
        return ['pending', 'processing', 'completed', 'failed'];
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filtrer par statut:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="">Tous les statuts</option>
          {getStatusOptions()?.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button
          onClick={loadData}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
        >
          <RefreshCw size={14} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {getHeaders()?.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={getHeaders()?.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Aucune donnée trouvée
                </td>
              </tr>
            ) : (
              (Array.isArray(data) ? data : []).map((item) => {
                switch (type) {
                  case 'files':
                    return renderFileRow(item as FileInfo);
                  case 'analyses':
                    return renderAnalysisRow(item as AnalysisInfo);
                  case 'queue':
                    return renderQueueRow(item as QueueItemInfo);
                }
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        {data.length} élément(s) affiché(s)
      </div>
    </div>
  );
};
