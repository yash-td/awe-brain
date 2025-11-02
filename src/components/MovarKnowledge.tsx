import React, { useState } from 'react';
import { Search, Filter, FileText, Folder, X, Loader2, AlertCircle } from 'lucide-react';
import { pineconeService, SearchResult } from '../services/pineconeService';

export const MovarKnowledge: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categories] = useState([
    'All Categories',
    'Candidate CVs',
    'CASA Training',
    'Growth',
    'Health, Safety and Well-being',
    'Innovation',
    'Job Descriptions',
    'Knowledge Library',
    'Lessons Learned',
    'Movar CVs',
    'Movar Manuals and Handbooks',
    'Movar Templates',
    'Organisation Chart',
    'Proposals and Bids',
    'Training'
  ]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await pineconeService.search(
        query,
        10,
        selectedCategory && selectedCategory !== 'All Categories' ? selectedCategory : undefined
      );
      setResults(searchResults);

      if (searchResults.length === 0) {
        setError('No results found. Try different keywords or adjust filters.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case '.pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case '.docx':
      case '.doc':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case '.txt':
        return <FileText className="w-5 h-5 text-gray-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 0.6) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 0.4) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getRelevanceLabel = (score: number) => {
    if (score >= 0.8) return 'Highly Relevant';
    if (score >= 0.6) return 'Relevant';
    if (score >= 0.4) return 'Somewhat Relevant';
    return 'Low Relevance';
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-awe-midnight dark:via-awe-midnight-light dark:to-awe-midnight overflow-hidden">
      {/* Header */}
      <div className="bg-white/95 dark:bg-awe-midnight/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-awe-midnight-light/50 p-6 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-awe-teal to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Movar Knowledge Base
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Search across all company documents, templates, and resources
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for documents, people, projects, or topics..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-awe-midnight-light border border-gray-300 dark:border-awe-midnight rounded-xl focus:ring-2 focus:ring-awe-teal focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 transition-all shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-5 py-3.5 rounded-xl border transition-all font-medium flex items-center space-x-2 shadow-sm ${
                  showFilters || selectedCategory
                    ? 'bg-awe-teal text-white border-awe-teal'
                    : 'bg-white dark:bg-awe-midnight-light border-gray-300 dark:border-awe-midnight text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-awe-midnight'
                }`}
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-gradient-to-r from-awe-teal to-blue-600 text-white rounded-xl hover:from-awe-teal/90 hover:to-blue-600/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-awe-teal/25 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white dark:bg-awe-midnight-light rounded-xl border border-gray-200 dark:border-awe-midnight p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Filter by Category
                  </h3>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-sm text-awe-teal hover:text-awe-teal/80 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category === 'All Categories' ? null : category)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all text-left ${
                        (category === 'All Categories' && !selectedCategory) || selectedCategory === category
                          ? 'bg-awe-teal text-white border-awe-teal shadow-sm'
                          : 'bg-gray-50 dark:bg-awe-midnight border-gray-200 dark:border-awe-midnight text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-awe-midnight/70'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          )}

          {!loading && !error && results.length === 0 && query && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-awe-midnight-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No results found for "{query}"
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Try different keywords or check your spelling
              </p>
            </div>
          )}

          {!loading && !error && results.length === 0 && !query && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-awe-teal/10 to-blue-600/10 dark:from-awe-teal/20 dark:to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-awe-teal" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Search the Movar Knowledge Base
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Find documents, CVs, templates, training materials, and more from across the organization
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white dark:bg-awe-midnight-light rounded-lg p-4 border border-gray-200 dark:border-awe-midnight">
                  <FileText className="w-8 h-8 text-awe-teal mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Documents</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Company docs & templates
                  </p>
                </div>
                <div className="bg-white dark:bg-awe-midnight-light rounded-lg p-4 border border-gray-200 dark:border-awe-midnight">
                  <Folder className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Projects</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Case studies & proposals
                  </p>
                </div>
                <div className="bg-white dark:bg-awe-midnight-light rounded-lg p-4 border border-gray-200 dark:border-awe-midnight">
                  <FileText className="w-8 h-8 text-green-600 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Resources</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Training & guidelines
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found <span className="font-semibold text-gray-900 dark:text-white">{results.length}</span> results
                  {selectedCategory && (
                    <span> in <span className="font-semibold text-awe-teal">{selectedCategory}</span></span>
                  )}
                </p>
              </div>

              {results.map((result, index) => (
                <div
                  key={result.id}
                  className="bg-white dark:bg-awe-midnight-light rounded-xl border border-gray-200 dark:border-awe-midnight p-5 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getFileIcon(result.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-awe-teal transition-colors truncate">
                          {result.fileName}
                        </h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="inline-flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
                            <Folder className="w-3 h-3" />
                            <span>{result.category}</span>
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {result.fileType.toUpperCase().slice(1)}
                          </span>
                          {result.totalChunks > 1 && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Part {result.chunkIndex + 1} of {result.totalChunks}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRelevanceColor(result.score)}`}>
                      {getRelevanceLabel(result.score)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                    {result.textPreview}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-awe-midnight">
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-mono truncate">
                      {result.filePath}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
