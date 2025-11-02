import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, FolderOpen, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { pineconeIndexer, IndexProgress } from '../services/pineconeIndexer';

export const DocumentManager: React.FC = () => {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Knowledge Library');
  const [progress, setProgress] = useState<IndexProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const categories = pineconeIndexer.getCategories();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadComplete(false);
      setProgress(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadComplete(false);
      setProgress(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadComplete(false);

    try {
      await pineconeIndexer.indexFile(selectedFile, selectedCategory, (prog) => {
        setProgress(prog);
      });

      setUploadComplete(true);
      setTimeout(() => {
        setSelectedFile(null);
        setProgress(null);
        setUploadComplete(false);
      }, 3000);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setProgress(null);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getProgressColor = () => {
    if (progress?.status === 'error') return 'bg-red-500';
    if (progress?.status === 'complete') return 'bg-green-500';
    return 'bg-awe-teal';
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-awe-midnight dark:via-awe-midnight-light dark:to-awe-midnight overflow-y-auto">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-awe-teal to-blue-600 rounded-2xl mb-3 md:mb-4 shadow-lg">
            <Upload className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Expand Knowledge Base
          </h2>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 px-4">
            Upload documents to add them to AWE's searchable knowledge base
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            selectedFile
              ? 'border-awe-teal bg-awe-teal/5'
              : 'border-gray-300 dark:border-awe-midnight hover:border-awe-teal hover:bg-awe-teal/5'
          }`}
        >
          {!selectedFile ? (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Drop your file here
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-awe-teal text-white rounded-lg hover:bg-awe-teal/90 transition-colors font-medium shadow-lg"
              >
                Select File
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                Supported: PDF, DOCX, PPTX, TXT, MD, CSV
              </p>
            </>
          ) : (
            <div>
              <FileText className="w-12 h-12 text-awe-teal mx-auto mb-4" />
              <div className="flex items-center justify-center space-x-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedFile.name}
                </h3>
                {!isUploading && (
                  <button
                    onClick={clearSelection}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>

        {/* Category Selection */}
        {selectedFile && !isUploading && !uploadComplete && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Select Category
            </label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-awe-midnight-light border border-gray-300 dark:border-awe-midnight rounded-lg focus:ring-2 focus:ring-awe-teal focus:border-transparent text-gray-900 dark:text-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {progress && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {progress.message}
              </span>
              <span className="text-sm font-medium text-awe-teal">
                {progress.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-awe-midnight rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadComplete && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                Document indexed successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your document is now searchable in the knowledge base. You can enable "Knowledge Search" mode in the chat to query it.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {progress?.status === 'error' && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Upload failed
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {progress.message}
              </p>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && !isUploading && !uploadComplete && (
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={!selectedCategory}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-awe-teal to-blue-600 text-white rounded-xl hover:from-awe-teal/90 hover:to-blue-600/90 transition-all font-semibold text-base md:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 md:space-x-3 touch-manipulation active:scale-95"
            >
              <Upload className="w-5 h-5" />
              <span>Index Document to Knowledge Base</span>
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            How it works:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Documents are parsed and broken into searchable chunks</li>
            <li>• AI embeddings are generated for semantic search</li>
            <li>• Content is indexed to Pinecone vector database</li>
            <li>• Use "Knowledge Search" in chat to query your documents</li>
          </ul>
        </div>
      </div>
    </div>
  );
};