import React, { useState, useEffect } from 'react';
import { 
  referenceDocumentService, 
  ReferenceDocument, 
  DocumentsSummary, 
  DocumentCategory,
  CategoryDocuments,
  SearchResult 
} from '../../services/referenceDocumentService';

interface ReferenceDocumentsPanelProps {
  onDocumentSelect?: (document: ReferenceDocument) => void;
  showContent?: boolean;
}

export const ReferenceDocumentsPanel: React.FC<ReferenceDocumentsPanelProps> = ({
  onDocumentSelect,
  showContent = false
}) => {
  const [summary, setSummary] = useState<DocumentsSummary | null>(null);
  const [categories, setCategories] = useState<Record<string, DocumentCategory>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDocument, setSelectedDocument] = useState<ReferenceDocument | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadDocumentsByCategory();
    }
  }, [selectedCategory, selectedSubcategory]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const summaryData = await referenceDocumentService.getSummary();
      const categoriesData = await referenceDocumentService.getCategories();
      
      setSummary(summaryData);
      setCategories(categoriesData);
      
      // Sélectionner la première catégorie par défaut
      if (Object.keys(categoriesData).length > 0) {
        setSelectedCategory(Object.keys(categoriesData)[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du résumé:', error);
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

    if (showContent) {
      try {
        const content = await referenceDocumentService.getDocumentContent(document.id);
        setDocumentContent(content.content);
      } catch (error) {
        console.error('Erreur lors du chargement du contenu:', error);
        setDocumentContent('Erreur lors du chargement du contenu');
      }
    }
  };

  const renderDocumentList = (docList: ReferenceDocument[]) => {
    if (docList.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Aucun document trouvé
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {docList.map((doc) => (
          <div
            key={doc.id}
            onClick={() => handleDocumentClick(doc)}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedDocument?.id === doc.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {doc.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {doc.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    {referenceDocumentService.getCategoryIcon(doc.category)}
                    {doc.category}
                  </span>
                  <span className="flex items-center gap-1">
                    {referenceDocumentService.getSubcategoryIcon(doc.subcategory)}
                    {doc.subcategory}
                  </span>
                  <span>{referenceDocumentService.formatFileSize(doc.file_size)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (!showContent || !selectedDocument) {
      return null;
    }

    return (
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Contenu du document
        </h3>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-4 rounded border overflow-auto max-h-96">
            {documentContent}
          </pre>
        </div>
      </div>
    );
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Rechercher
        </button>
      </div>

      {/* Navigation par catégories */}
      {!searchResults && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Catégories
          </h3>
          <div className="space-y-2">
            {Object.entries(categories).map(([category, categoryInfo]) => (
              <div key={category}>
                <button
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedSubcategory('');
                  }}
                  className={`w-full text-left p-2 rounded flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{referenceDocumentService.getCategoryIcon(category)}</span>
                  <span className="capitalize">{category}</span>
                  <span className="ml-auto text-sm text-gray-500">
                    ({categoryInfo.total})
                  </span>
                </button>
                
                {selectedCategory === category && (
                  <div className="ml-6 mt-2 space-y-1">
                    {Object.entries(categoryInfo.subcategories).map(([subcategory, count]) => (
                      <button
                        key={subcategory}
                        onClick={() => setSelectedSubcategory(subcategory)}
                        className={`w-full text-left p-2 rounded flex items-center gap-2 text-sm ${
                          selectedSubcategory === subcategory
                            ? 'bg-blue-50 dark:bg-blue-800 text-blue-600 dark:text-blue-200'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span>{referenceDocumentService.getSubcategoryIcon(subcategory)}</span>
                        <span className="capitalize">{subcategory.replace('_', ' ')}</span>
                        <span className="ml-auto text-xs text-gray-500">({count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des documents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {searchResults 
            ? `Résultats de recherche pour "${searchQuery}" (${searchResults.count})`
            : `Documents ${selectedCategory}${selectedSubcategory ? ` - ${selectedSubcategory}` : ''} (${documents.length})`
          }
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          renderDocumentList(searchResults ? searchResults.results : documents)
        )}
      </div>

      {/* Contenu du document sélectionné */}
      {renderContent()}
    </div>
  );
};
