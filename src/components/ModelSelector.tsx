import React, { useState } from 'react';
import { ChevronDown, Bot, Check } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { AzureOpenAIModel } from '../types';

export const ModelSelector: React.FC = () => {
  const { selectedModel, availableModels, setSelectedModel } = useChat();
  const [isOpen, setIsOpen] = useState(false);

  const handleModelSelect = (model: AzureOpenAIModel) => {
    setSelectedModel(model);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white/80 dark:bg-awe-midnight-light/80 backdrop-blur-sm border border-gray-200/50 dark:border-awe-midnight/50 rounded-lg hover:bg-gray-100 dark:hover:bg-awe-midnight-light transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-awe-teal" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
            {selectedModel.name}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-awe-teal transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown menu */}
          <div className="absolute top-full left-0 mt-2 w-full bg-white/95 dark:bg-awe-midnight-light/95 backdrop-blur-xl border border-gray-200/50 dark:border-awe-midnight/50 rounded-lg shadow-xl z-50">
            <div className="p-3">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-awe-teal/10 dark:hover:bg-awe-teal/20 transition-all duration-200 text-left"
                >
                  <div className="flex-shrink-0">
                    {selectedModel.id === model.id ? (
                      <Check className="w-4 h-4 text-awe-teal" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {model.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};