import React, { useState, useEffect, useMemo } from 'react';
import { Play, Code, Maximize2, Minimize2, RefreshCw, AlertCircle } from 'lucide-react';
import { DashboardArtifact } from '../types';
import * as Recharts from 'recharts';

interface DashboardRendererProps {
  artifact: DashboardArtifact;
  onUpdate?: (updatedArtifact: DashboardArtifact) => void;
}

export const DashboardRenderer: React.FC<DashboardRendererProps> = ({ 
  artifact, 
  onUpdate 
}) => {
  const [showCode, setShowCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Create a safe component from the code string
  const DashboardComponent = useMemo(() => {
    try {
      setError(null);
      
      // Create a function that returns the React component
      const componentFunction = new Function(
        'React',
        'Recharts',
        `
        ${artifact.code}
        return Dashboard;
        `
      );

      return componentFunction(
        React,
        Recharts
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render dashboard');
      return null;
    }
  }, [artifact.code]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (error) {
    return (
      <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">Dashboard Error</span>
        </div>
        <p className="text-sm text-red-700 dark:text-red-300 mb-3">{error}</p>
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
        {showCode && (
          <pre className="mt-3 p-3 bg-red-100 dark:bg-red-900/40 rounded text-xs overflow-x-auto">
            <code>{artifact.code}</code>
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 dark:border-awe-midnight rounded-lg overflow-hidden ${
      isFullscreen ? 'fixed inset-4 z-50 bg-white dark:bg-awe-midnight-light' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-awe-midnight border-b border-gray-200 dark:border-awe-midnight">
        <div className="flex items-center space-x-2">
          <Play className="w-4 h-4 text-awe-teal" />
          <span className="movar-body text-sm font-medium text-awe-midnight dark:text-white">
            {artifact.title}
          </span>
          <span className="movar-body text-xs text-gray-500 dark:text-gray-400 bg-awe-teal/10 dark:bg-awe-teal/20 text-awe-teal px-2 py-1 rounded">
            {artifact.type}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className={`p-1 text-gray-500 hover:text-awe-teal transition-colors ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCode(!showCode)}
            className="p-1 text-gray-500 hover:text-awe-teal transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1 text-gray-500 hover:text-awe-teal transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Code View */}
      {showCode && (
        <div className="border-b border-gray-200 dark:border-awe-midnight">
          <pre className="p-4 bg-gray-100 dark:bg-awe-midnight text-sm overflow-x-auto max-h-64">
            <code className="text-gray-800 dark:text-gray-200">{artifact.code}</code>
          </pre>
        </div>
      )}

      {/* Dashboard Content */}
      <div className={`p-4 bg-white dark:bg-awe-midnight-light ${
        isFullscreen ? 'h-full overflow-auto' : 'min-h-[300px]'
      }`}>
        {DashboardComponent && (
          <div className={isRefreshing ? 'opacity-50 transition-opacity' : ''}>
            <DashboardComponent data={artifact.data} />
          </div>
        )}
      </div>
    </div>
  );
};