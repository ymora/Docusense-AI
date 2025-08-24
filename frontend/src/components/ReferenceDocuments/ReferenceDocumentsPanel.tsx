import React, { useState, useEffect } from 'react';
import { useColors } from '../../hooks/useColors';
import useAuthStore from '../../stores/authStore';
import { 
  referenceDocumentService, 
  ReferenceDocument, 
  DocumentsSummary, 
  DocumentCategory,
  CategoryDocuments,
  SearchResult 
} from '../../services/referenceDocumentService';
import {
  DocumentTextIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ReferenceDocumentsPanelProps {
  onDocumentSelect?: (document: ReferenceDocument) => void;
  showContent?: boolean;
  isAdminMode?: boolean; // Nouveau prop pour différencier les modes
}

export const ReferenceDocumentsPanel: React.FC<ReferenceDocumentsPanelProps> = ({
  onDocumentSelect,
  showContent = false,
  isAdminMode = false
}) => {
  const { colors } = useColors();
  const { isAdmin } = useAuthStore();
  
  // États
  const [summary, setSummary] = useState<DocumentsSummary | null>(null);
  const [categories, setCategories] = useState<Record<string, DocumentCategory>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ReferenceDocument | null>(null);
  const [showDocumentContent, setShowDocumentContent] = useState<boolean>(false);
  const [documentContent, setDocumentContent] = useState<string>('');

  // Charger les données initiales
  useEffect(() => {
    loadData();
  }, []);

  // Charger les documents quand la catégorie change
  useEffect(() => {
    if (selectedCategory) {
      loadDocumentsByCategory();
    }
  }, [selectedCategory, selectedSubcategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [summaryData, categoriesData] = await Promise.all([
        referenceDocumentService.getSummary(),
        referenceDocumentService.getCategories()
      ]);
      
      setSummary(summaryData);
      setCategories(categoriesData);
      
      // Sélectionner la première catégorie par défaut
      if (Object.keys(categoriesData).length > 0) {
        setSelectedCategory(Object.keys(categoriesData)[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentsByCategory = async () => {
    try {
      setLoading(true);
      const result = await referenceDocumentService.getDocumentsByCategory(selectedCategory, selectedSubcategory);
      setDocuments(result.documents);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setLoading(true);
      const results = await referenceDocumentService.searchDocuments(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = async (document: ReferenceDocument) => {
    setSelectedDocument(document);
    
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }

    if (showContent || isAdminMode) {
      setShowDocumentContent(true);
      try {
        const content = await referenceDocumentService.getDocumentContent(document.id);
        setDocumentContent(content.content);
      } catch (error) {
        console.error('Erreur lors du chargement du contenu:', error);
        setDocumentContent('Erreur lors du chargement du contenu');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'construction':
        return <FolderIcon className="h-4 w-4" />;
      case 'juridique':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'administratif':
        return <ChartBarIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  // Vérification des droits d'administration pour le mode admin
  if (isAdminMode && !isAdmin()) {
    return (
      <div className="h-full flex items-center justify-center p-6" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.warning }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            Accès refusé
          </h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Vous devez être administrateur pour accéder à ce panneau.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !summary) {
    return (
      <div className="h-full flex items-center justify-center p-6" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Chargement de la documentation...
          </p>
        </div>
      </div>
    );
  }

  // Mode admin - Interface complète
  if (isAdminMode) {
    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: colors.background }}>
        {/* En-tête avec statistiques */}
        <div className="flex-shrink-0 p-6 border-b" style={{ borderColor: colors.border }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-opacity-10 p-4 rounded-lg" style={{ backgroundColor: colors.primary + '20' }}>
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 mr-2" style={{ color: colors.primary }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Total Documents
                  </p>
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>
                    {summary?.total_documents || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-opacity-10 p-4 rounded-lg" style={{ backgroundColor: colors.success + '20' }}>
              <div className="flex items-center">
                <FolderIcon className="h-6 w-6 mr-2" style={{ color: colors.success }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Catégories
                  </p>
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>
                    {Object.keys(categories).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-opacity-10 p-4 rounded-lg" style={{ backgroundColor: colors.warning + '20' }}>
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-2" style={{ color: colors.warning }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Taille Totale
                  </p>
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>
                    {summary ? formatFileSize(Object.values(summary.categories).reduce((acc, cat) => acc + cat.total_size, 0)) : '0 B'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-opacity-10 p-4 rounded-lg" style={{ backgroundColor: colors.primary + '20' }}>
              <div className="flex items-center">
                <EyeIcon className="h-6 w-6 mr-2" style={{ color: colors.primary }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Dernière MAJ
                  </p>
                  <p className="text-sm font-bold" style={{ color: colors.text }}>
                    {summary?.last_updated ? new Date(summary.last_updated).toLocaleDateString('fr-FR') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex overflow-hidden">
          {/* Panneau de gauche - Navigation et recherche */}
          <div className="w-80 flex flex-col border-r" style={{ borderColor: colors.border }}>
            {/* Recherche */}
            <div className="p-4 border-b" style={{ borderColor: colors.border }}>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Rechercher dans les documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-3 py-2 text-sm rounded-l border"
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border
                  }}
                />
                <button
                  onClick={handleSearch}
                  className="px-3 py-2 text-sm rounded-r border-l-0"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.background,
                    borderColor: colors.primary
                  }}
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation par catégories */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
                Catégories
              </h3>
              
              {Object.entries(categories).map(([categoryName, category]) => (
                <div key={categoryName} className="mb-4">
                  <button
                    onClick={() => setSelectedCategory(categoryName)}
                    className={`w-full text-left p-2 rounded text-sm font-medium transition-colors ${
                      selectedCategory === categoryName ? 'shadow-sm' : 'hover:bg-opacity-10'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === categoryName ? colors.primary + '20' : 'transparent',
                      color: selectedCategory === categoryName ? colors.primary : colors.text,
                      border: `1px solid ${selectedCategory === categoryName ? colors.primary : colors.border}`
                    }}
                  >
                    <div className="flex items-center">
                      {getCategoryIcon(categoryName)}
                      <span className="ml-2">{categoryName}</span>
                      <span className="ml-auto text-xs opacity-75">({category.total})</span>
                    </div>
                  </button>
                  
                  {selectedCategory === categoryName && category.subcategories && (
                    <div className="ml-4 mt-2 space-y-1">
                      {Object.entries(category.subcategories).map(([subName, count]) => (
                        <button
                          key={subName}
                          onClick={() => setSelectedSubcategory(subName)}
                          className={`w-full text-left p-1 rounded text-xs transition-colors ${
                            selectedSubcategory === subName ? 'bg-opacity-10' : 'hover:bg-opacity-5'
                          }`}
                          style={{
                            backgroundColor: selectedSubcategory === subName ? colors.primary + '20' : 'transparent',
                            color: selectedSubcategory === subName ? colors.primary : colors.textSecondary
                          }}
                        >
                          {subName} ({count})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Panneau de droite - Liste des documents */}
          <div className="flex-1 flex flex-col">
            {/* En-tête de la liste */}
            <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                    Documents
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {selectedCategory && categories[selectedCategory]?.total} document(s) dans {selectedCategory}
                    {selectedSubcategory && ` > ${selectedSubcategory}`}
                  </p>
                </div>
                <button
                  className="px-3 py-2 text-sm font-medium rounded transition-colors"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.background
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-1 inline" />
                  Nouveau
                </button>
              </div>
            </div>

            {/* Liste des documents */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: colors.primary }}></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-4" style={{ color: colors.textSecondary }} />
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Aucun document trouvé
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-5"
                      style={{
                        backgroundColor: selectedDocument?.id === doc.id ? colors.primary + '10' : 'transparent',
                        borderColor: colors.border,
                        color: colors.text
                      }}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <DocumentTextIcon className="h-4 w-4 mr-2" style={{ color: colors.primary }} />
                            <h4 className="font-medium text-sm" style={{ color: colors.text }}>
                              {doc.title}
                            </h4>
                          </div>
                          <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                            {doc.description}
                          </p>
                          <div className="flex items-center text-xs" style={{ color: colors.textSecondary }}>
                            <span className="mr-4">{doc.category} / {doc.subcategory}</span>
                            <span className="mr-4">{formatFileSize(doc.file_size)}</span>
                            <span>{new Date(doc.added_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                          <button
                            className="p-1 rounded hover:bg-opacity-10 transition-colors"
                            style={{ color: colors.primary }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Éditer le document
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-opacity-10 transition-colors"
                            style={{ color: colors.error }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Supprimer le document
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panneau de droite - Contenu du document */}
          {showDocumentContent && selectedDocument && (
            <div className="w-96 flex flex-col border-l" style={{ borderColor: colors.border }}>
              <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold" style={{ color: colors.text }}>
                    Contenu
                  </h3>
                  <button
                    onClick={() => setShowDocumentContent(false)}
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="prose prose-sm max-w-none" style={{ color: colors.text }}>
                  <pre className="whitespace-pre-wrap text-xs" style={{ color: colors.text }}>
                    {documentContent}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mode utilisateur - Interface simplifiée (comportement original)
  return (
    <div className="space-y-6">
      {/* En-tête avec résumé */}
      {summary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Documents de Référence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.total_documents}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Object.keys(summary.categories).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Catégories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {summary.last_updated ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Indexé</div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Rechercher dans les documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation par catégories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(categories).map(([categoryName, category]) => (
          <div key={categoryName} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {categoryName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {category.total} document(s)
            </p>
            <button
              onClick={() => setSelectedCategory(categoryName)}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voir les documents
            </button>
          </div>
        ))}
      </div>

      {/* Liste des documents */}
      {selectedCategory && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Documents - {selectedCategory}
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : documents.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              Aucun document trouvé
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleDocumentClick(doc)}
                >
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {doc.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {doc.description}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span className="mr-4">{doc.category} / {doc.subcategory}</span>
                    <span className="mr-4">{formatFileSize(doc.file_size)}</span>
                    <span>{new Date(doc.added_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenu du document sélectionné */}
      {showDocumentContent && selectedDocument && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedDocument.title}
            </h3>
            <button
              onClick={() => setShowDocumentContent(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Fermer
            </button>
          </div>
          <div className="prose prose-sm max-w-none text-gray-900 dark:text-gray-100">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
              {documentContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
