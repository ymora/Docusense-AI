import React, { useState, useEffect } from 'react';
import { FileInfo, AnalysisInfo } from '../types';
import { DatabaseAPI } from '../api';
import { FileText, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw, Trash2, RotateCcw, Search, Filter, SortAsc, SortDesc } from 'lucide-react';

interface DataTableProps {
  type: 'files' | 'analyses';
  title?: string;
  onFileClick?: (fileId: number, fileName: string) => void;
  selectedFileId?: number | null;
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

export const DataTable: React.FC<DataTableProps> = ({ type, title, onFileClick, selectedFileId }) => {
  const [data, setData] = useState<FileInfo[] | AnalysisInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [type, statusFilter, selectedFileId]);

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
          if (selectedFileId) {
            result = await DatabaseAPI.getFileAnalyses(selectedFileId, statusFilter || undefined);
          } else {
            result = await DatabaseAPI.getAnalyses(statusFilter || undefined);
          }
          break;
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, itemId: number) => {
    setActionLoading(itemId);
    try {
      switch (action) {
        case 'retry':
          await DatabaseAPI.retryAnalysis(itemId);
          break;
        case 'delete':
          await DatabaseAPI.deleteAnalysis(itemId);
          break;
      }
      await loadData(); // Recharger les données
    } catch (err) {
      console.error('Erreur lors de l\'action:', err);
      alert(`Erreur lors de l'action ${action}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setActionLoading(null);
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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === data.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const filteredAndSortedData = data
    .filter(item => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (type === 'files') {
          const file = item as FileInfo;
          return file.name.toLowerCase().includes(searchLower) || 
                 file.mime_type.toLowerCase().includes(searchLower);
        } else {
          const analysis = item as AnalysisInfo;
          return analysis.file_name.toLowerCase().includes(searchLower) ||
                 analysis.analysis_type.toLowerCase().includes(searchLower) ||
                 analysis.provider.toLowerCase().includes(searchLower);
        }
      }
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof typeof a];
      let bValue = b[sortBy as keyof typeof b];
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const renderFileRow = (file: FileInfo) => (
    <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selectedItems.has(file.id)}
          onChange={() => handleSelectItem(file.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        <div className="flex items-center space-x-2">
          <span>{file.name}</span>
          {onFileClick && (
            <button
              onClick={() => onFileClick(file.id, file.name)}
              className="text-blue-500 hover:text-blue-700 text-xs bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
              title="Voir les analyses de ce fichier"
            >
              📊
            </button>
          )}
        </div>
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
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selectedItems.has(analysis.id)}
          onChange={() => handleSelectItem(analysis.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        {analysis.id}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="space-y-1">
          <div className="font-medium text-gray-900 dark:text-white">
            {analysis.file_name}
          </div>
          <div className="text-xs text-gray-400">
            ID: {analysis.file_id}
          </div>
          <div className="text-xs text-gray-400 truncate max-w-xs" title={analysis.file_path}>
            📁 {analysis.file_path}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <div className="space-y-1">
          <div className="font-medium">
            {analysis.analysis_type}
          </div>
          <div className="text-xs text-gray-400">
            {analysis.provider} / {analysis.model}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[analysis.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
          {statusIcons[analysis.status as keyof typeof statusIcons] || <AlertTriangle size={16} />}
          <span className="ml-1">{analysis.status}</span>
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${analysis.progress * 100}%` }}
              ></div>
            </div>
            <span className="text-xs">{Math.round(analysis.progress * 100)}%</span>
          </div>
          {analysis.current_step && (
            <div className="text-xs text-gray-400 truncate max-w-32" title={analysis.current_step}>
              {analysis.current_step}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formatDate(analysis.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {analysis.completed_at ? formatDate(analysis.completed_at) : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          {analysis.status === 'failed' && (
            <button
              onClick={() => handleAction('retry', analysis.id)}
              disabled={actionLoading === analysis.id}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="Relancer l'analyse"
            >
              {actionLoading === analysis.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <RotateCcw size={16} />
              )}
            </button>
          )}
          <button
            onClick={() => handleAction('delete', analysis.id)}
            disabled={actionLoading === analysis.id}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Supprimer l'analyse"
          >
            {actionLoading === analysis.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );

  const getHeaders = () => {
    switch (type) {
      case 'files':
        return ['', 'Nom', 'Type MIME', 'Taille', 'Statut', 'Modifié le'];
      case 'analyses':
        return ['', 'ID', 'Fichier', 'Type/Provider', 'Statut', 'Progression', 'Créé le', 'Terminé le', 'Actions'];
    }
  };

  const getStatusOptions = () => {
    switch (type) {
      case 'files':
        return ['pending', 'processing', 'completed', 'failed', 'unsupported'];
      case 'analyses':
        return ['pending', 'processing', 'completed', 'failed'];
    }
  };

  const getSortableColumns = () => {
    switch (type) {
      case 'files':
        return ['name', 'mime_type', 'size', 'status', 'updated_at'];
      case 'analyses':
        return ['id', 'file_name', 'analysis_type', 'status', 'progress', 'created_at', 'completed_at'];
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
      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Recherche */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Rechercher dans les ${type === 'files' ? 'fichiers' : 'analyses'}...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtre par statut */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Statut:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les statuts</option>
              {getStatusOptions()?.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Bouton filtres avancés */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Filter size={16} />
            <span>Filtres avancés</span>
          </button>

          {/* Actualiser */}
          <button
            onClick={loadData}
            className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            <RefreshCw size={16} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trier par:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {type === 'files' && (
                    <>
                      <option value="name">Nom</option>
                      <option value="mime_type">Type MIME</option>
                      <option value="size">Taille</option>
                      <option value="status">Statut</option>
                      <option value="updated_at">Date de modification</option>
                    </>
                  )}
                  {type === 'analyses' && (
                    <>
                      <option value="id">ID</option>
                      <option value="file_name">Nom du fichier</option>
                      <option value="analysis_type">Type d'analyse</option>
                      <option value="status">Statut</option>
                      <option value="progress">Progression</option>
                      <option value="created_at">Date de création</option>
                      <option value="completed_at">Date de fin</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ordre:
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`px-3 py-2 text-sm rounded-md flex items-center space-x-1 ${
                      sortOrder === 'asc' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <SortAsc size={16} />
                    <span>Ascendant</span>
                  </button>
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`px-3 py-2 text-sm rounded-md flex items-center space-x-1 ${
                      sortOrder === 'desc' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <SortDesc size={16} />
                    <span>Descendant</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Actions en lot:
                </label>
                                 <div className="flex space-x-2">
                   <button
                     onClick={async () => {
                       if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedItems.size} analyse(s) ?`)) {
                         try {
                           await DatabaseAPI.deleteMultipleAnalyses(Array.from(selectedItems));
                           setSelectedItems(new Set());
                           await loadData();
                         } catch (err) {
                           console.error('Erreur lors de la suppression en lot:', err);
                           alert(`Erreur lors de la suppression en lot: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
                         }
                       }
                     }}
                     disabled={selectedItems.size === 0}
                     className="px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Supprimer ({selectedItems.size})
                   </button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {/* Checkbox pour sélection multiple */}
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                {getHeaders()?.slice(1).map((header, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      const columns = getSortableColumns();
                      if (columns && columns[index]) {
                        handleSort(columns[index]);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{header}</span>
                      {getSortableColumns() && getSortableColumns()[index] && (
                        <div className="flex flex-col">
                          <SortAsc 
                            size={12} 
                            className={`${sortBy === getSortableColumns()![index] && sortOrder === 'asc' ? 'text-blue-500' : 'text-gray-300'}`} 
                          />
                          <SortDesc 
                            size={12} 
                            className={`${sortBy === getSortableColumns()![index] && sortOrder === 'desc' ? 'text-blue-500' : 'text-gray-300'}`} 
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan={getHeaders()?.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune donnée trouvée
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((item) => {
                  switch (type) {
                    case 'files':
                      return renderFileRow(item as FileInfo);
                    case 'analyses':
                      return renderAnalysisRow(item as AnalysisInfo);
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer avec statistiques */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            {filteredAndSortedData.length} élément(s) affiché(s) sur {data.length} total
            {selectedItems.size > 0 && ` (${selectedItems.size} sélectionné(s))`}
          </span>
          <span>
            {type === 'analyses' && (
              <>
                {data.filter((a: any) => a.status === 'pending').length} en attente, 
                {data.filter((a: any) => a.status === 'processing').length} en cours, 
                {data.filter((a: any) => a.status === 'completed').length} terminées
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
